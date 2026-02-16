import { POST } from "@/app/api/webhooks/elevenlabs/route";
import { db } from "@/db";

jest.mock("@/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn(),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn(),
      }),
    }),
  },
}));

jest.mock("@/lib/gemini", () => ({
  evaluateCandidate: jest.fn().mockResolvedValue({
    summary: "Good candidate",
    score: 8,
    strengths: ["Communication"],
    weaknesses: ["Testing"],
  }),
}));

describe("POST /api/webhooks/elevenlabs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process a valid webhook and save transcript", async () => {
    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            id: 1,
            candidateId: 1,
            elevenlabsConversationId: "test-conv-123",
          },
        ]),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const mockUpdate = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as jest.Mock) = mockUpdate;

    // Also mock select for candidate CV lookup (for evaluation)
    mockSelect
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 1,
              candidateId: 1,
              elevenlabsConversationId: "test-conv-123",
            },
          ]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 1, cvText: "React developer" },
          ]),
        }),
      });

    const request = new Request(
      "http://localhost:3000/api/webhooks/elevenlabs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "post_conversation_evaluation",
          conversation_id: "test-conv-123",
          data: {
            conversation_id: "test-conv-123",
            status: "done",
            transcript: [
              { role: "agent", message: "Hello" },
              { role: "user", message: "Hi" },
            ],
            metadata: {},
          },
        }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("should return 400 for invalid webhook payload", async () => {
    const request = new Request(
      "http://localhost:3000/api/webhooks/elevenlabs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "invalid" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
