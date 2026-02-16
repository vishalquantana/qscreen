import { extractTextFromPdf } from "@/lib/pdf";

jest.mock("pdf-parse", () => {
  const mockFn = jest.fn();
  return mockFn;
});

import pdf from "pdf-parse";
const mockPdf = pdf as jest.MockedFunction<typeof pdf>;

describe("extractTextFromPdf", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should extract text from a valid PDF buffer", async () => {
    const mockText = "John Doe\nSoftware Engineer\n5 years experience with React";
    mockPdf.mockResolvedValue({
      text: mockText,
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: null,
      version: "1.0",
    } as Awaited<ReturnType<typeof pdf>>);

    const buffer = Buffer.from("fake-pdf-content");
    const result = await extractTextFromPdf(buffer);

    expect(result).toBe(mockText);
    expect(mockPdf).toHaveBeenCalledWith(buffer);
  });

  it("should throw an error for invalid PDF", async () => {
    mockPdf.mockRejectedValue(new Error("Invalid PDF"));

    const buffer = Buffer.from("not-a-pdf");
    await expect(extractTextFromPdf(buffer)).rejects.toThrow("Failed to parse PDF");
  });

  it("should throw an error for empty PDF text", async () => {
    mockPdf.mockResolvedValue({
      text: "   ",
      numpages: 0,
      numrender: 0,
      info: {},
      metadata: null,
      version: "1.0",
    } as Awaited<ReturnType<typeof pdf>>);

    const buffer = Buffer.from("empty-pdf");
    await expect(extractTextFromPdf(buffer)).rejects.toThrow(
      "PDF contains no extractable text"
    );
  });
});
