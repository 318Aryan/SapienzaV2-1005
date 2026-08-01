export const extractPdfText = async (buffer: Buffer): Promise<string> => {
  // pdf-parse's CJS build does require() on pdfjs-dist's ESM-only file,
  // which Node's CJS loader can't do at all. A dynamic import() resolves
  // pdf-parse's "import" export condition instead, which pulls pdfjs-dist
  // in as ESM-to-ESM and avoids the crash entirely.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};
