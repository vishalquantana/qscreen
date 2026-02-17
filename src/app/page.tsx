import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const openJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">QScreen</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          AI-Powered Voice Screening Interviews
        </p>
      </div>

      {openJobs.length === 0 ? (
        <p className="text-muted-foreground">
          No open positions at the moment. Check back soon!
        </p>
      ) : (
        <div className="grid gap-4 w-full max-w-3xl sm:grid-cols-2">
          {openJobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {job.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/apply/${job.id}`}>Apply Now</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
