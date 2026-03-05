function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function exportToPdf(htmlContent: string, filename = "notebook.pdf") {
  const html2pdf = (await import("html2pdf.js")).default;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = htmlContent;
  wrapper.style.cssText =
    "font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; padding: 2rem; max-width: 700px;";
  wrapper.querySelectorAll("h1").forEach((el) => {
    (el as HTMLElement).style.fontSize = "1.5rem";
    (el as HTMLElement).style.marginTop = "1.5rem";
  });
  wrapper.querySelectorAll("h2").forEach((el) => {
    (el as HTMLElement).style.fontSize = "1.25rem";
    (el as HTMLElement).style.marginTop = "1.25rem";
  });
  wrapper.querySelectorAll("ul, ol").forEach((el) => {
    (el as HTMLElement).style.paddingLeft = "1.5rem";
  });
  wrapper.querySelectorAll("blockquote").forEach((el) => {
    (el as HTMLElement).style.borderLeft = "4px solid #ddd";
    (el as HTMLElement).style.paddingLeft = "1rem";
    (el as HTMLElement).style.color = "#555";
  });

  const opt = {
    margin: 10,
    filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
  };
  await html2pdf().set(opt).from(wrapper).save();
}

export async function exportToDoc(htmlContent: string, filename = "notebook.docx") {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const text = htmlToPlainText(htmlContent || "");
  const paragraphs = text
    ? text.split(/\n\n+/).map(
        (block) =>
          new Paragraph({
            children: [new TextRun({ text: block.replace(/\n/g, " ") })],
          })
      )
    : [new Paragraph({ children: [new TextRun({ text: "No notes yet", italics: true })] })];

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
