import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CvUploadForm } from "@/components/cv-upload-form";

export const dynamic = "force-dynamic";

interface ApplyPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { jobId: jobIdStr } = await params;
  const jobId = parseInt(jobIdStr, 10);

  if (isNaN(jobId)) {
    notFound();
  }

  const jobRows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId));

  if (jobRows.length === 0 || jobRows[0].status !== "open") {
    notFound();
  }

  const job = jobRows[0];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{job.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-xl">
          {job.description}
        </p>
      </div>
      <CvUploadForm jobId={jobId} />
    </main>
  );
}
