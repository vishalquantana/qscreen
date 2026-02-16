import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const candidates = sqliteTable("candidates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cvText: text("cv_text").notNull(),
  cvFileName: text("cv_file_name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const interviews = sqliteTable("interviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => candidates.id),
  elevenlabsConversationId: text("elevenlabs_conversation_id"),
  systemPrompt: text("system_prompt"),
  transcript: text("transcript"),
  aiSummary: text("ai_summary"),
  score: real("score"),
  status: text("status", {
    enum: ["pending", "in_progress", "completed", "evaluation_failed"],
  })
    .notNull()
    .default("pending"),
  audioUrl: text("audio_url"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
