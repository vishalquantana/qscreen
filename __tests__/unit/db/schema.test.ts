import { candidates, interviews } from "@/db/schema";
import { getTableColumns } from "drizzle-orm";

describe("Database Schema", () => {
  describe("candidates table", () => {
    it("should have the correct columns", () => {
      const columns = getTableColumns(candidates);
      expect(columns).toHaveProperty("id");
      expect(columns).toHaveProperty("name");
      expect(columns).toHaveProperty("email");
      expect(columns).toHaveProperty("cvText");
      expect(columns).toHaveProperty("cvFileName");
      expect(columns).toHaveProperty("createdAt");
    });
  });

  describe("interviews table", () => {
    it("should have the correct columns", () => {
      const columns = getTableColumns(interviews);
      expect(columns).toHaveProperty("id");
      expect(columns).toHaveProperty("candidateId");
      expect(columns).toHaveProperty("elevenlabsConversationId");
      expect(columns).toHaveProperty("systemPrompt");
      expect(columns).toHaveProperty("transcript");
      expect(columns).toHaveProperty("aiSummary");
      expect(columns).toHaveProperty("score");
      expect(columns).toHaveProperty("status");
      expect(columns).toHaveProperty("audioUrl");
      expect(columns).toHaveProperty("createdAt");
    });

    it("should have status column with correct default", () => {
      const columns = getTableColumns(interviews);
      expect(columns.status).toBeDefined();
    });
  });
});
