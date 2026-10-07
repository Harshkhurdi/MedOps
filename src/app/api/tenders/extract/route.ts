import { z } from "zod";
import { api, json, AppError } from "@/lib/errors";
import { authorize, csrf, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { retrieve } from "@/lib/storage";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorize("tenders", true);
    const { fileId } = z
      .object({ fileId: z.string() })
      .strict()
      .parse(await json(req));
    const file = await db.storedFile.findUnique({ where: { id: fileId } });
    if (!file || file.module !== "tenders" || file.mime !== "application/pdf")
      throw new AppError(400, "Choose a tender PDF");
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const bytes = await retrieve(file.key);
    const task = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: false,
      disableFontFace: true,
    });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 200)
        throw new AppError(400, "PDF extraction supports up to 200 pages");
      let text = "";
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        text +=
          content.items.map((i) => ("str" in i ? i.str : "")).join(" ") + "\n";
        if (text.length > 300000) break;
      }
      await audit(user.id, "EXTRACT_PDF_TEXT", "tenders", file.recordId);
      return Response.json({
        text,
        message: text.trim()
          ? "Review extracted text and enter tender fields manually. Complex layouts may be incomplete."
          : "No selectable text found. Scanned PDFs require manual entry.",
      });
    } finally {
      await task.destroy();
    }
  });
}
