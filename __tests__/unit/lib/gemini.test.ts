import { generateSystemPrompt, evaluateCandidate } from "@/lib/gemini";

const mockGenerateContent = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe("gemini", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-api-key";
  });

  describe("generateSystemPrompt", () => {
    it("should generate a system prompt from CV text", async () => {
      const mockPrompt =
        "You are an AI interviewer. Ask about React experience and system design.";
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockPrompt },
      });

      const result = await generateSystemPrompt(
        "John Doe, 5 years React experience",
        "Software Engineer"
      );

      expect(result).toBe(mockPrompt);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it("should throw on API error", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API error"));

      await expect(
        generateSystemPrompt("cv text", "role")
      ).rejects.toThrow("Failed to generate system prompt");
    });
  });

  describe("evaluateCandidate", () => {
    it("should return evaluation with score and summary", async () => {
      const mockEvaluation = JSON.stringify({
        summary:
          "Strong candidate with solid React experience and good communication.",
        score: 8,
        strengths: ["React expertise", "Clear communication"],
        weaknesses: ["Limited backend experience"],
      });
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockEvaluation },
      });

      const result = await evaluateCandidate(
        "Interview transcript here",
        "CV text here"
      );

      expect(result).toEqual({
        summary:
          "Strong candidate with solid React experience and good communication.",
        score: 8,
        strengths: ["React expertise", "Clear communication"],
        weaknesses: ["Limited backend experience"],
      });
    });

    it("should handle JSON wrapped in markdown code blocks", async () => {
      const mockEvaluation = `\`\`\`json
{
  "summary": "Good candidate.",
  "score": 7,
  "strengths": ["Skill A"],
  "weaknesses": ["Skill B"]
}
\`\`\``;
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockEvaluation },
      });

      const result = await evaluateCandidate("transcript", "cv");

      expect(result.score).toBe(7);
      expect(result.summary).toBe("Good candidate.");
    });

    it("should throw on invalid evaluation response", async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => "not valid json" },
      });

      await expect(
        evaluateCandidate("transcript", "cv")
      ).rejects.toThrow("Failed to evaluate candidate");
    });
  });
});
