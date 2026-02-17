import { z } from "zod";

export const uploadCvSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
});

export const evaluationResultSchema = z.object({
  summary: z.string(),
  score: z.number().min(0).max(10),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export const linkConversationSchema = z.object({
  candidateId: z.number(),
  conversationId: z.string().min(1),
});

export type UploadCvInput = z.infer<typeof uploadCvSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type LinkConversationInput = z.infer<typeof linkConversationSchema>;

export const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").max(5000, "Description too long"),
  criteria: z.string().min(1, "Criteria is required").max(5000, "Criteria too long"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export type InterviewStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "evaluation_failed";
