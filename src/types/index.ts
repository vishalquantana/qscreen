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

export type InterviewStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "evaluation_failed";
