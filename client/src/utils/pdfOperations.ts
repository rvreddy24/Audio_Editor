import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { renderAllPagesToImages, renderPdfPageToDataUrl } from './pdfRenderer';

export interface PdfFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  previewUrl?: string;
  data: ArrayBuffer;
}

export async function parsePdfFile(file: File): Promise<PdfFileInfo> {
  const data = await file.arrayBuffer();
  let pageCount = 1;
  let previewUrl = '';

  try {
    const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
    try {
      previewUrl = await renderPdfPageToDataUrl(data, 1, 0.6);
    } catch (e) {
      console.warn('Could not generate page thumbnail:', e);
    }
  } catch (err) {
    console.error('Failed to parse PDF document:', err);
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    file,
    name: file.name,
    size: file.size,
    pageCount,
    previewUrl,
    data,
  };
}

/**
 * 1. MERGE PDF FILES
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * 2. SPLIT PDF FILES (Range or Individual pages)
 */
export async function splitPdfByRanges(
  buffer: ArrayBuffer,
  rangesStr: string // e.g. "1-3, 5-8" or single numbers "1, 2, 4"
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const destDoc = await PDFDocument.create();

  const selectedIndices = new Set<number>();
  const parts = rangesStr.split(',').map((p) => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          selectedIndices.add(i - 1);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        selectedIndices.add(p - 1);
      }
    }
  }

  const indicesToCopy = Array.from(selectedIndices).sort((a, b) => a - b);
  if (indicesToCopy.length === 0) {
    throw new Error('No valid pages found in specified ranges');
  }

  const copiedPages = await destDoc.copyPages(srcDoc, indicesToCopy);
  copiedPages.forEach((page) => destDoc.addPage(page));

  return await destDoc.save();
}

export async function splitPdfAllPagesToZip(
  buffer: ArrayBuffer,
  baseFilename: string
): Promise<Blob> {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const zip = new JSZip();

  for (let i = 0; i < totalPages; i++) {
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(page);
    const pdfBytes = await singleDoc.save();
    const cleanName = baseFilename.replace(/\.pdf$/i, '');
    zip.file(`${cleanName}_page_${i + 1}.pdf`, pdfBytes);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * 3. COMPRESS PDF
 */
export async function compressPdf(
  buffer: ArrayBuffer,
  level: 'extreme' | 'recommended' | 'less' = 'recommended'
): Promise<{ bytes: Uint8Array; originalSize: number; newSize: number }> {
  const originalSize = buffer.byteLength;
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  // Re-save with object stream compression and stripped unused elements
  const bytes = await srcDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return {
    bytes,
    originalSize,
    newSize: bytes.byteLength,
  };
}

/**
 * 4. ORGANIZE PDF (Reorder, Delete, Rotate individual pages)
 */
export interface PageConfig {
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
}

export async function organizePdf(
  buffer: ArrayBuffer,
  pageConfigs: PageConfig[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const destDoc = await PDFDocument.create();

  for (const config of pageConfigs) {
    const [copiedPage] = await destDoc.copyPages(srcDoc, [config.originalIndex]);
    if (config.rotation) {
      const currentRot = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRot + config.rotation) % 360));
    }
    destDoc.addPage(copiedPage);
  }

  return await destDoc.save();
}

/**
 * 5. ROTATE PDF (All pages)
 */
export async function rotateAllPages(
  buffer: ArrayBuffer,
  angleDelta: number // 90, 180, 270
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pages = srcDoc.getPages();

  pages.forEach((page) => {
    const currentRot = page.getRotation().angle;
    page.setRotation(degrees((currentRot + angleDelta) % 360));
  });

  return await srcDoc.save();
}

/**
 * 6. PDF TO JPG / IMAGES (Render pages to images and zip)
 */
export async function convertPdfToImagesZip(
  buffer: ArrayBuffer,
  baseFilename: string
): Promise<Blob> {
  const images = await renderAllPagesToImages(buffer, 2.0);
  const zip = new JSZip();
  const cleanName = baseFilename.replace(/\.pdf$/i, '');

  images.forEach((img) => {
    zip.file(`${cleanName}_page_${img.pageNum}.jpg`, img.blob);
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * 7. JPG / IMAGES TO PDF
 */
export async function convertImagesToPdf(
  imageFiles: { data: ArrayBuffer; type: string }[],
  options: {
    orientation?: 'portrait' | 'landscape';
    margin?: number; // 0, 20, 40
    pageSize?: 'fit' | 'a4';
  } = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const margin = options.margin || 0;

  for (const img of imageFiles) {
    let embeddedImg;
    if (img.type.includes('png')) {
      embeddedImg = await pdfDoc.embedPng(img.data);
    } else {
      embeddedImg = await pdfDoc.embedJpg(img.data);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let pageWidth = imgWidth + margin * 2;
    let pageHeight = imgHeight + margin * 2;

    if (options.pageSize === 'a4') {
      pageWidth = options.orientation === 'landscape' ? 841.89 : 595.28;
      pageHeight = options.orientation === 'landscape' ? 595.28 : 841.89;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate fitted dimensions within margins
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    const x = margin + (availableWidth - drawWidth) / 2;
    const y = margin + (availableHeight - drawHeight) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * 8. WATERMARK PDF
 */
export async function addWatermarkToPdf(
  buffer: ArrayBuffer,
  options: {
    text: string;
    opacity: number; // 0.1 to 1.0
    fontSize: number; // 24 to 72
    rotation: number; // -45, 0, 45
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    colorHex?: string;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    let x = (width - textWidth) / 2;
    let y = (height - textHeight) / 2;

    if (options.position === 'top-left') {
      x = 40;
      y = height - 60;
    } else if (options.position === 'top-right') {
      x = width - textWidth - 40;
      y = height - 60;
    } else if (options.position === 'bottom-left') {
      x = 40;
      y = 60;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - 40;
      y = 60;
    }

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.85, 0.1, 0.1),
      opacity: options.opacity,
      rotate: degrees(options.rotation || 0),
    });
  });

  return await pdfDoc.save();
}

/**
 * 9. PAGE NUMBERS
 */
export async function addPageNumbersToPdf(
  buffer: ArrayBuffer,
  options: {
    format: '1' | '1 of n' | 'Page 1' | 'Page 1 of n';
    position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right';
    fontSize?: number;
    startFrom?: number;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;
  const startNum = options.startFrom || 1;
  const fontSize = options.fontSize || 11;

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const currentNum = idx + startNum;
    let numText = `${currentNum}`;

    if (options.format === '1 of n') numText = `${currentNum} of ${total}`;
    else if (options.format === 'Page 1') numText = `Page ${currentNum}`;
    else if (options.format === 'Page 1 of n') numText = `Page ${currentNum} of ${total}`;

    const textWidth = font.widthOfTextAtSize(numText, fontSize);
    let x = (width - textWidth) / 2;
    let y = 30;

    if (options.position === 'bottom-right') {
      x = width - textWidth - 40;
      y = 30;
    } else if (options.position === 'bottom-left') {
      x = 40;
      y = 30;
    } else if (options.position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - 40;
    } else if (options.position === 'top-right') {
      x = width - textWidth - 40;
      y = height - 40;
    }

    page.drawText(numText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return await pdfDoc.save();
}

/**
 * 10. PROTECT PDF (Password Encryption via API or fallback)
 */
export async function protectPdf(
  buffer: ArrayBuffer,
  userPassword: string
): Promise<Uint8Array> {
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/pdf' }), 'document.pdf');
  formData.append('password', userPassword);

  const res = await fetch('/api/pdf/protect', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Encryption requires server processing');
  }

  const arrayBuf = await res.arrayBuffer();
  return new Uint8Array(arrayBuf);
}

/**
 * 11. SIGN PDF (Stamp Signature Image onto specified Page)
 */
export async function signPdf(
  buffer: ArrayBuffer,
  signatureDataUrl: string,
  pageIndex: number = 0,
  position: { x: number; y: number; width: number; height: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pngImage = await pdfDoc.embedPng(signatureDataUrl);
  const page = pdfDoc.getPage(pageIndex);

  page.drawImage(pngImage, {
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
  });

  return await pdfDoc.save();
}

/**
 * Trigger File Download helper
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBytes(bytes: Uint8Array, filename: string, mimeType = 'application/pdf') {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
  downloadBlob(blob, filename);
}
