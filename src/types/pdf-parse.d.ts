declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
    text: string;
  }
  function pdf(buffer: Buffer): Promise<PdfData>;
  export default pdf;
}
