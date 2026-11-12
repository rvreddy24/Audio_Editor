import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure the worker src for browser execution (local bundled worker)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

export async function getPdfDocument(data: ArrayBuffer, password?: string) {
  // CRITICAL: Always slice(0) so worker transferable object does not detach caller's ArrayBuffer
  const bufferCopy = data.slice(0);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(bufferCopy),
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
    password: password || undefined,
  });
  return await loadingTask.promise;
}

export async function renderPdfPageToDataUrl(
  data: ArrayBuffer,
  pageNum: number,
  scale: number = 1.2,
  password?: string,
  format: 'jpg' | 'png' = 'jpg'
): Promise<string> {
  const pdf = await getPdfDocument(data, password);
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
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.85;
  return canvas.toDataURL(mimeType, quality);
}

export async function renderAllPagesToImages(
  data: ArrayBuffer,
  scale: number = 2.0,
  format: 'jpg' | 'png' = 'jpg',
  password?: string
): Promise<{ pageNum: number; dataUrl: string; blob: Blob; width: number; height: number }[]> {
  const pdf = await getPdfDocument(data, password);
  const results: { pageNum: number; dataUrl: string; blob: Blob; width: number; height: number }[] = [];
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.92;

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

    const dataUrl = canvas.toDataURL(mimeType, quality);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), mimeType, quality);
    });

    results.push({ pageNum: i, dataUrl, blob, width: viewport.width, height: viewport.height });
  }

  return results;
}

export async function extractPdfTextPages(data: ArrayBuffer, password?: string): Promise<string[]> {
  const pdf = await getPdfDocument(data, password);
  const pagesText: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageLines: string[] = [];
    let currentLine = '';
    let lastY = -1;

    for (const item of content.items as any[]) {
      if ('str' in item) {
        const itemY = item.transform ? Math.round(item.transform[5]) : 0;
        if (lastY !== -1 && Math.abs(itemY - lastY) > 4) {
          if (currentLine.trim()) pageLines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine += (currentLine ? ' ' : '') + item.str;
        }
        lastY = itemY;
      }
    }
    if (currentLine.trim()) pageLines.push(currentLine.trim());

    pagesText.push(pageLines.join('\n'));
  }

  return pagesText;
}

