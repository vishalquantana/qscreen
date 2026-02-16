import { POST } from "@/app/api/evaluate/route";
import { db } from "@/db";
import { evaluateCandidate } from "@/lib/gemini";

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
  evaluateCandidate: jest.fn(),
}));

const mockEvaluate = evaluateCandidate as jest.MockedFunction<
  typeof evaluateCandidate
>;

describe("POST /api/evaluate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should evaluate an interview with transcript", async () => {
    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            id: 1,
            candidateId: 1,
            transcript: "Agent: Hello\nCandidate: Hi",
          },
        ]),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    // For candidate lookup
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          { id: 1, candidateId: 1, transcript: "Agent: Hello\nCandidate: Hi" },
        ]),
      }),
    }).mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          { id: 1, cvText: "React developer" },
        ]),
      }),
    });

    const mockUpdate = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as jest.Mock) = mockUpdate;

    mockEvaluate.mockResolvedValue({
      summary: "Strong candidate",
      score: 8,
      strengths: ["React"],
      weaknesses: ["Testing"],
    });

    const request = new Request("http://localhost:3000/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId: 1 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBe("Strong candidate");
    expect(data.score).toBe(8);
  });

  it("should return 404 for non-existent interview", async () => {
    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost:3000/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId: 999 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});
