import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker src for browser execution
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
}

export async function getPdfDocument(data: ArrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  return await loadingTask.promise;
}

export async function renderPdfPageToDataUrl(
  data: ArrayBuffer,
  pageNum: number,
  scale: number = 1.2
): Promise<string> {
  const pdf = await getPdfDocument(data);
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create 2D canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext as any).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function renderAllPagesToImages(
  data: ArrayBuffer,
  scale: number = 2.0
): Promise<{ pageNum: number; dataUrl: string; blob: Blob }[]> {
  const pdf = await getPdfDocument(data);
  const results: { pageNum: number; dataUrl: string; blob: Blob }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92);
    });

    results.push({ pageNum: i, dataUrl, blob });
  }

  return results;
}
