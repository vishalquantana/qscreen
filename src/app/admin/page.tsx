import { db } from "@/db";
import { candidates, interviews, jobs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CandidateTable } from "@/components/candidate-table";
import type { Candidate, Interview } from "@/db/schema";

export const dynamic = "force-dynamic";

interface CandidateWithInterview extends Candidate {
  interview: Interview | null;
  jobTitle?: string;
}

interface AdminPageProps {
  searchParams: Promise<{ jobId?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { jobId: jobIdParam } = await searchParams;
  const filterJobId = jobIdParam ? parseInt(jobIdParam, 10) : undefined;

  // Fetch all jobs for the filter dropdown
  const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));

  let allCandidates;
  if (filterJobId && !isNaN(filterJobId)) {
    allCandidates = await db
      .select()
      .from(candidates)
      .where(eq(candidates.jobId, filterJobId))
      .orderBy(desc(candidates.createdAt));
  } else {
    allCandidates = await db
      .select()
      .from(candidates)
      .orderBy(desc(candidates.createdAt));
  }

  const candidatesWithInterviews: CandidateWithInterview[] = await Promise.all(
    allCandidates.map(async (candidate) => {
      const interviewRows = await db
        .select()
        .from(interviews)
        .where(eq(interviews.candidateId, candidate.id));

      // Get job title
      let jobTitle: string | undefined;
      if (candidate.jobId) {
        const jobRows = await db
          .select({ title: jobs.title })
          .from(jobs)
          .where(eq(jobs.id, candidate.jobId));
        jobTitle = jobRows[0]?.title;
      }

      return {
        ...candidate,
        interview: interviewRows[0] || null,
        jobTitle,
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
      <CandidateTable
        candidates={candidatesWithInterviews}
        jobs={allJobs.map((j) => ({ id: j.id, title: j.title }))}
        activeJobId={filterJobId}
      />
    </div>
  );
}
