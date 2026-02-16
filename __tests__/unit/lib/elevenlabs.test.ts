import { parseWebhookPayload, formatTranscript } from "@/lib/elevenlabs";
import webhookFixture from "../../fixtures/webhook-payload.json";

describe("elevenlabs", () => {
  describe("parseWebhookPayload", () => {
    it("should parse a valid webhook payload", () => {
      const result = parseWebhookPayload(webhookFixture);

      expect(result.conversationId).toBe("test-conv-123");
      expect(result.transcript).toHaveLength(4);
      expect(result.transcript[0].role).toBe("agent");
      expect(result.status).toBe("done");
    });

    it("should throw on invalid payload structure", () => {
      expect(() => parseWebhookPayload({})).toThrow();
      expect(() => parseWebhookPayload({ type: "unknown" })).toThrow();
    });
  });

  describe("formatTranscript", () => {
    it("should format transcript entries into readable text", () => {
      const transcript = [
        { role: "agent" as const, message: "Hello" },
        { role: "user" as const, message: "Hi there" },
      ];

      const formatted = formatTranscript(transcript);

      expect(formatted).toContain("Agent: Hello");
      expect(formatted).toContain("Candidate: Hi there");
    });

    it("should handle empty transcript", () => {
      expect(formatTranscript([])).toBe("");
    });
  });
});
