import { POST } from "@/app/api/generate-prompt/route";
import { db } from "@/db";
import { generateSystemPrompt } from "@/lib/gemini";

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
  generateSystemPrompt: jest.fn(),
}));

const mockGenerate = generateSystemPrompt as jest.MockedFunction<
  typeof generateSystemPrompt
>;

describe("POST /api/generate-prompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate a system prompt for a valid candidate", async () => {
    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          { id: 1, cvText: "React developer with 5 years exp" },
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

    mockGenerate.mockResolvedValue("You are an AI interviewer...");

    const request = new Request("http://localhost:3000/api/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: 1 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.systemPrompt).toBe("You are an AI interviewer...");
  });

  it("should return 404 for non-existent candidate", async () => {
    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost:3000/api/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: 999 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});
