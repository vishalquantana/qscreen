import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { candidates, interviews, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractTextFromPdf } from "@/lib/pdf";
import { uploadCvToS3 } from "@/lib/s3";
import { uploadCvSchema } from "@/types";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46]; // %PDF

function isPdf(buffer: Uint8Array): boolean {
  if (buffer.length < 4) return false;
  return PDF_MAGIC_BYTES.every((byte, i) => buffer[i] === byte);
}

export async function POST(request: Request) {
  try {
    // Rate limit: 10 uploads per 15 minutes per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`upload:${ip}`, { maxRequests: 10, windowSec: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const cvFile = formData.get("cv") as File | null;
    const jobIdStr = formData.get("jobId") as string;

    if (!jobIdStr) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const jobId = parseInt(jobIdStr, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    // Verify job exists and is open
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (jobRows.length === 0 || jobRows[0].status !== "open") {
      return NextResponse.json(
        { error: "Job not found or no longer accepting applications" },
        { status: 400 }
      );
    }

    if (!cvFile) {
      return NextResponse.json({ error: "CV file is required" }, { status: 400 });
    }

    if (cvFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    const validation = uploadCvSchema.safeParse({ name, email });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const arrayBuffer = await cvFile.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Validate PDF by magic bytes, not MIME type (which is client-controlled)
    if (!isPdf(uint8)) {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    const cvText = await extractTextFromPdf(uint8);

    // Sanitize filename for S3 key
    const safeFileName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

    // Upload PDF to S3
    const cvFileUrl = await uploadCvToS3(Buffer.from(uint8), safeFileName);

    const accessToken = crypto.randomBytes(32).toString("hex");

    const [candidate] = await db
      .insert(candidates)
      .values({
        name: validation.data.name,
        email: validation.data.email,
        cvText,
        cvFileName: safeFileName,
        cvFileUrl,
        accessToken,
        jobId,
      })
      .returning();

    const [interview] = await db
      .insert(interviews)
      .values({
        candidateId: candidate.id,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      candidateId: candidate.id,
      interviewId: interview.id,
      accessToken,
    });
  } catch (error) {
    console.error("Upload CV error:", error);
    return NextResponse.json(
      { error: "Failed to process CV. Please try again." },
      { status: 500 }
    );
  }
}
