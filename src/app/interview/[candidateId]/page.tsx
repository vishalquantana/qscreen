import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InterviewClient } from "./interview-client";

interface InterviewPageProps {
  params: Promise<{ candidateId: string }>;
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { candidateId: candidateIdStr } = await params;
  const candidateId = parseInt(candidateIdStr, 10);

  if (isNaN(candidateId)) {
    notFound();
  }

  const candidateRows = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId));

  if (candidateRows.length === 0) {
    notFound();
  }

  const interviewRows = await db
    .select()
    .from(interviews)
    .where(eq(interviews.candidateId, candidateId));

  const candidate = candidateRows[0];
  const interview = interviewRows[0];

  if (!interview) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Welcome, {candidate.name}</h1>
        <p className="text-muted-foreground">
          Your AI voice screening interview
        </p>
      </div>
      <InterviewClient
        candidateId={candidateId}
        systemPrompt={interview.systemPrompt || ""}
      />
    </main>
  );
}
