export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });

export async function convertPdfToImages(file: File): Promise<string[]> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  if (!GlobalWorkerOptions.workerSrc) {
    const pdfjsLib = await import("pdfjs-dist");
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    pages.push(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
  }
  return pages;
}

export async function filesToBase64List(files: FileList | File[]): Promise<string[]> {
  const fileArr = Array.from(files);
  const result: string[] = [];
  for (const file of fileArr) {
    if (file.type === "application/pdf") {
      result.push(...(await convertPdfToImages(file)));
    } else if (file.type.startsWith("image/")) {
      result.push(await fileToBase64(file));
    }
  }
  return result;
}
