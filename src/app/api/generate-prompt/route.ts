import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { generateSystemPrompt } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit: 20 prompts per 15 minutes per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`prompt:${ip}`, { maxRequests: 20, windowSec: 900 });
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

    const candidateRows = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    if (candidateRows.length === 0) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const candidate = candidateRows[0];
    const systemPrompt = await generateSystemPrompt(candidate.cvText);

    // Update the interview with the system prompt
    await db
      .update(interviews)
      .set({ systemPrompt, status: "in_progress" })
      .where(eq(interviews.candidateId, candidateId));

    return NextResponse.json({ systemPrompt });
  } catch (error) {
    console.error("Generate prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
