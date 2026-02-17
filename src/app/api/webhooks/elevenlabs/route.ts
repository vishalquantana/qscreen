import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews, jobs } from "@/db/schema";
import { parseWebhookPayload, formatTranscript } from "@/lib/elevenlabs";
import { evaluateCandidate } from "@/lib/gemini";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let parsed;
    try {
      parsed = parseWebhookPayload(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const { conversationId, transcript } = parsed;
    const formattedTranscript = formatTranscript(transcript);

    // Find the interview by conversation ID
    const interviewRows = await db
      .select()
      .from(interviews)
      .where(eq(interviews.elevenlabsConversationId, conversationId));

    if (interviewRows.length === 0) {
      console.warn(
        `No interview found for conversation ID: ${conversationId}`
      );
      return NextResponse.json(
        { error: "Interview not found for this conversation" },
        { status: 404 }
      );
    }

    const interview = interviewRows[0];

    // Step 1: Save transcript synchronously (most important)
    await db
      .update(interviews)
      .set({ transcript: formattedTranscript })
      .where(eq(interviews.id, interview.id));

    // Step 2: Fire-and-forget evaluation
    (async () => {
      try {
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
            const j = jobRows[0];
            jobContext = { title: j.title, description: j.description, criteria: j.criteria };
          }
        }

        const evaluation = await evaluateCandidate(
          formattedTranscript,
          cvText,
          jobContext
        );

        await db
          .update(interviews)
          .set({
            aiSummary: JSON.stringify(evaluation),
            score: evaluation.score,
            status: "completed",
          })
          .where(eq(interviews.id, interview.id));
      } catch (error) {
        console.error("Background evaluation failed:", error);
        await db
          .update(interviews)
          .set({ status: "evaluation_failed" })
          .where(eq(interviews.id, interview.id));
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
