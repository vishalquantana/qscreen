import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const openJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"));

  return NextResponse.json(openJobs);
}
