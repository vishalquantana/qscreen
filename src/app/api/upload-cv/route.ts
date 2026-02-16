import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { extractTextFromPdf } from "@/lib/pdf";
import { uploadCvToS3 } from "@/lib/s3";
import { uploadCvSchema } from "@/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const cvFile = formData.get("cv") as File | null;

    if (!cvFile) {
      return NextResponse.json({ error: "CV file is required" }, { status: 400 });
    }

    if (!cvFile.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
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
    const cvText = await extractTextFromPdf(uint8);

    // Upload PDF to S3
    const cvFileUrl = await uploadCvToS3(Buffer.from(uint8), cvFile.name);

    const [candidate] = await db
      .insert(candidates)
      .values({
        name: validation.data.name,
        email: validation.data.email,
        cvText,
        cvFileName: cvFile.name,
        cvFileUrl,
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
    });
  } catch (error) {
    console.error("Upload CV error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload CV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
