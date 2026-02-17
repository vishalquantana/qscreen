import { db } from "@/db";
import { jobs, candidates } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));

  const jobsWithCounts = await Promise.all(
    allJobs.map(async (job) => {
      const [result] = await db
        .select({ count: count() })
        .from(candidates)
        .where(eq(candidates.jobId, job.id));
      return { ...job, candidateCount: result?.count ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Jobs</h2>
        <Button asChild>
          <Link href="/admin/jobs/new">Create Job</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Candidates</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobsWithCounts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No jobs yet. Create your first job to get started.
              </TableCell>
            </TableRow>
          ) : (
            jobsWithCounts.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>
                  <Badge
                    variant={job.status === "open" ? "default" : "secondary"}
                  >
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>{job.candidateCount}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(job.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
