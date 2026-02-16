import pdf from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    const text = data.text.trim();

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
