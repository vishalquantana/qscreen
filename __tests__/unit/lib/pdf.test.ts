import { extractTextFromPdf } from "@/lib/pdf";

const mockGetText = jest.fn();

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockGetText,
  })),
}));

describe("extractTextFromPdf", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should extract text from a valid PDF buffer", async () => {
    const mockText = "John Doe\nSoftware Engineer\n5 years experience with React";
    mockGetText.mockResolvedValue({ text: mockText, pages: [] });

    const buffer = Buffer.from("fake-pdf-content");
    const result = await extractTextFromPdf(buffer);

    expect(result).toBe(mockText);
    expect(mockGetText).toHaveBeenCalled();
  });

  it("should throw an error for invalid PDF", async () => {
    mockGetText.mockRejectedValue(new Error("Invalid PDF structure"));

    const buffer = Buffer.from("not-a-pdf");
    await expect(extractTextFromPdf(buffer)).rejects.toThrow("Failed to parse PDF");
  });

  it("should throw an error for empty PDF text", async () => {
    mockGetText.mockResolvedValue({ text: "   ", pages: [] });

    const buffer = Buffer.from("empty-pdf");
    await expect(extractTextFromPdf(buffer)).rejects.toThrow(
      "PDF contains no extractable text"
    );
  });
});
