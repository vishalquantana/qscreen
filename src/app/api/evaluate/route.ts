import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { evaluateCandidate } from "@/lib/gemini";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { interviewId } = await request.json();

    if (!interviewId) {
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

    // Get candidate CV text
    const candidateRows = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, interview.candidateId));

    const cvText = candidateRows[0]?.cvText || "";

    const evaluation = await evaluateCandidate(interview.transcript, cvText);

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
