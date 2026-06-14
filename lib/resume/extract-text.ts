const pdfType = "application/pdf";
const docxType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractResumeText(file: File) {
  return extractResumeTextFromBuffer(file.type, Buffer.from(await file.arrayBuffer()));
}

export async function extractResumeTextFromBuffer(contentType: string, buffer: Buffer) {
  if (contentType === pdfType) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return normalizeText(result.text);
  }

  if (contentType === docxType) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value);
  }

  return "";
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
