import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CandidateDetail } from "@/components/candidate-detail";
import { getPresignedCvUrl } from "@/lib/s3";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AdminCandidatePageProps {
  params: Promise<{ candidateId: string }>;
}

export default async function AdminCandidatePage({
  params,
}: AdminCandidatePageProps) {
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

  // Generate presigned URL for CV if stored in S3
  let cvPresignedUrl: string | null = null;
  if (candidate.cvFileUrl) {
    try {
      cvPresignedUrl = await getPresignedCvUrl(candidate.cvFileUrl);
    } catch {
      // Fall back to no preview if S3 is unavailable
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to Candidates
      </Link>
      <CandidateDetail
        candidate={candidate}
        interview={interview}
        cvPresignedUrl={cvPresignedUrl}
      />
    </div>
  );
}
