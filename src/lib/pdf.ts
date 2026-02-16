import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new Error("PDF contains no extractable text");
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.message === "PDF contains no extractable text") {
      throw error;
    }
    throw new Error("Failed to parse PDF");
  }
}
