"use server";

import { db } from "@/db";
import { jobs } from "@/db/schema";
import { createJobSchema } from "@/types";
import { redirect } from "next/navigation";

export async function createJob(formData: FormData) {
  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    criteria: formData.get("criteria") as string,
  };

  const validation = createJobSchema.safeParse(raw);
  if (!validation.success) {
    throw new Error(validation.error.issues.map((i) => i.message).join(", "));
  }

  await db.insert(jobs).values(validation.data);

  redirect("/admin/jobs");
}
