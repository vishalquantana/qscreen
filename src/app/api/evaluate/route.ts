import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews, jobs } from "@/db/schema";
import { evaluateCandidate } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit: 10 evaluations per 15 minutes per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`evaluate:${ip}`, { maxRequests: 10, windowSec: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const { interviewId } = await request.json();

    if (!interviewId || typeof interviewId !== "number") {
      return NextResponse.json(
        { error: "interviewId is required" },
        { status: 400 }
      );
    }

    const interviewRows = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId));

    if (interviewRows.length === 0) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    const interview = interviewRows[0];

    if (!interview.transcript) {
      return NextResponse.json(
        { error: "No transcript available for evaluation" },
        { status: 400 }
      );
    }

    // Get candidate CV text and job context
    const candidateRows = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, interview.candidateId));

    const candidate = candidateRows[0];
    const cvText = candidate?.cvText || "";

    // Fetch job context
    let jobContext: { title: string; description: string; criteria: string } | undefined;
    if (candidate?.jobId) {
      const jobRows = await db.select().from(jobs).where(eq(jobs.id, candidate.jobId));
      if (jobRows.length > 0) {
        const job = jobRows[0];
        jobContext = { title: job.title, description: job.description, criteria: job.criteria };
      }
    }

    const evaluation = await evaluateCandidate(interview.transcript, cvText, jobContext);

    await db
      .update(interviews)
      .set({
        aiSummary: JSON.stringify(evaluation),
        score: evaluation.score,
        status: "completed",
      })
      .where(eq(interviews.id, interviewId));

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Evaluate error:", error);

    // If evaluation fails, mark as failed but preserve transcript
    try {
      const { interviewId } = await request.clone().json();
      if (interviewId) {
        await db
          .update(interviews)
          .set({ status: "evaluation_failed" })
          .where(eq(interviews.id, interviewId));
      }
    } catch {
      // Ignore secondary error
    }

    return NextResponse.json(
      { error: "Failed to evaluate candidate" },
      { status: 500 }
    );
  }
}
