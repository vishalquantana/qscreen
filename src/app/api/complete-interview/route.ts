import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews, jobs } from "@/db/schema";
import { evaluateCandidate } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

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
    // Rate limit: 5 completions per 15 minutes per IP (expensive operation)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`complete:${ip}`, { maxRequests: 5, windowSec: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const { candidateId } = await request.json();

    if (!candidateId || typeof candidateId !== "number") {
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

    // Get candidate CV and job context for evaluation
    const candidateRows = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

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

    // Run AI evaluation
    try {
      const evaluation = await evaluateCandidate(formattedTranscript, cvText, jobContext);

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
    return NextResponse.json(
      { error: "Failed to complete interview. Please try again." },
      { status: 500 }
    );
  }
}
