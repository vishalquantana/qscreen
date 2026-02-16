import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CandidateTable } from "@/components/candidate-table";
import type { Candidate, Interview } from "@/db/schema";

export const dynamic = "force-dynamic";

interface CandidateWithInterview extends Candidate {
  interview: Interview | null;
}

export default async function AdminPage() {
  const allCandidates = await db
    .select()
    .from(candidates)
    .orderBy(desc(candidates.createdAt));

  const candidatesWithInterviews: CandidateWithInterview[] = await Promise.all(
    allCandidates.map(async (candidate) => {
      const interviewRows = await db
        .select()
        .from(interviews)
        .where(eq(interviews.candidateId, candidate.id));

      return {
        ...candidate,
        interview: interviewRows[0] || null,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Candidates</h2>
        <p className="text-muted-foreground">
          {allCandidates.length} total candidates
        </p>
      </div>
      <CandidateTable candidates={candidatesWithInterviews} />
    </div>
  );
}
