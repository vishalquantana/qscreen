import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { evaluateCandidate } from "@/lib/gemini";
import { eq } from "drizzle-orm";

interface ElevenLabsTranscriptEntry {
  role: "agent" | "user";
  message: string;
}

async function fetchConversationFromElevenLabs(conversationId: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

  // ElevenLabs may take a moment to finalize — retry a few times
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      { headers: { "xi-api-key": apiKey } }
    );

    if (!res.ok) {
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw new Error(`ElevenLabs API error: ${res.status}`);
    }

    const data = await res.json();

    if (data.status === "processing" && attempt < 4) {
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }

    return data;
  }

  throw new Error("Failed to fetch conversation after retries");
}

function formatTranscript(transcript: ElevenLabsTranscriptEntry[]): string {
  return transcript
    .map((entry) => {
      const speaker = entry.role === "agent" ? "Interviewer" : "Candidate";
      return `${speaker}: ${entry.message}`;
    })
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    // Get the interview record
    const interviewRows = await db
      .select()
      .from(interviews)
      .where(eq(interviews.candidateId, candidateId));

    if (interviewRows.length === 0) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    const interview = interviewRows[0];

    if (!interview.elevenlabsConversationId) {
      return NextResponse.json(
        { error: "No conversation ID linked to this interview" },
        { status: 400 }
      );
    }

    // Fetch transcript from ElevenLabs
    const convData = await fetchConversationFromElevenLabs(
      interview.elevenlabsConversationId
    );

    const transcript = convData.transcript || [];
    const formattedTranscript = formatTranscript(transcript);

    // Save transcript
    await db
      .update(interviews)
      .set({ transcript: formattedTranscript, status: "in_progress" })
      .where(eq(interviews.id, interview.id));

    // Get candidate CV for evaluation
    const candidateRows = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    const cvText = candidateRows[0]?.cvText || "";

    // Run AI evaluation
    try {
      const evaluation = await evaluateCandidate(formattedTranscript, cvText);

      await db
        .update(interviews)
        .set({
          aiSummary: JSON.stringify(evaluation),
          score: evaluation.score,
          status: "completed",
        })
        .where(eq(interviews.id, interview.id));

      return NextResponse.json({
        success: true,
        transcript: formattedTranscript,
        evaluation,
      });
    } catch (evalError) {
      console.error("Evaluation failed:", evalError);
      // Transcript is saved even if evaluation fails
      await db
        .update(interviews)
        .set({ status: "evaluation_failed" })
        .where(eq(interviews.id, interview.id));

      return NextResponse.json({
        success: true,
        transcript: formattedTranscript,
        evaluation: null,
        warning: "Transcript saved but AI evaluation failed",
      });
    }
  } catch (error) {
    console.error("Complete interview error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to complete interview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
