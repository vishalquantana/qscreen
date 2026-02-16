import { POST } from "@/app/api/upload-cv/route";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { extractTextFromPdf } from "@/lib/pdf";

jest.mock("@/db", () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn(),
      }),
    }),
  },
}));

jest.mock("@/lib/pdf", () => ({
  extractTextFromPdf: jest.fn(),
}));

const mockExtract = extractTextFromPdf as jest.MockedFunction<
  typeof extractTextFromPdf
>;
const mockDb = db as jest.Mocked<typeof db>;

describe("POST /api/upload-cv", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should upload a CV and create candidate + interview", async () => {
    mockExtract.mockResolvedValue("John Doe\nSoftware Engineer");

    const mockInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockResolvedValueOnce([{ id: 1 }])
          .mockResolvedValueOnce([{ id: 1 }]),
      }),
    });
    (mockDb.insert as jest.Mock) = mockInsert;

    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("email", "john@example.com");
    formData.append(
      "cv",
      new Blob(["fake-pdf"], { type: "application/pdf" }),
      "resume.pdf"
    );

    const request = new Request("http://localhost:3000/api/upload-cv", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("candidateId");
    expect(data).toHaveProperty("interviewId");
    expect(mockExtract).toHaveBeenCalled();
  });

  it("should return 400 for missing fields", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    // Missing email and CV

    const request = new Request("http://localhost:3000/api/upload-cv", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 for non-PDF file", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("email", "john@example.com");
    formData.append(
      "cv",
      new Blob(["not-pdf"], { type: "text/plain" }),
      "file.txt"
    );

    const request = new Request("http://localhost:3000/api/upload-cv", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
