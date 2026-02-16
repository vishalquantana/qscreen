import pdf from "pdf-parse/lib/pdf-parse.js";

export async function extractTextFromPdf(buffer: Buffer | Uint8Array): Promise<string> {
  try {
    const data = await pdf(Buffer.from(buffer));
    const text = data.text.trim();

    if (!text) {
      throw new Error("PDF contains no extractable text");
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.message === "PDF contains no extractable text") {
      throw error;
    }
    console.error("PDF parse error:", error);
    throw new Error("Failed to parse PDF");
  }
}
