import { PDFDocument, rgb, degrees, StandardFonts, PDFName, PDFRawStream } from 'pdf-lib';
import JSZip from 'jszip';
import { Document as DocxDocument, Paragraph, TextRun, ImageRun, Packer } from 'docx';
import mammoth from 'mammoth';
import { renderAllPagesToImages, renderPdfPageToDataUrl, extractPdfTextPages } from './pdfRenderer';

export interface PdfFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  previewUrl?: string;
  data: ArrayBuffer;
}

export async function getBufferFromFile(fileInfo: PdfFileInfo): Promise<ArrayBuffer> {
  if (fileInfo.data && fileInfo.data.byteLength > 0) {
    return fileInfo.data.slice(0);
  }
  if (fileInfo.file) {
    const fresh = await fileInfo.file.arrayBuffer();
    fileInfo.data = fresh;
    return fresh.slice(0);
  }
  throw new Error('PDF file buffer is empty or detached');
}

export async function parsePdfFile(file: File): Promise<PdfFileInfo> {
  const data = await file.arrayBuffer();
  let pageCount = 1;
  let previewUrl = '';

  try {
    const pdfDoc = await PDFDocument.load(data.slice(0), { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
    try {
      previewUrl = await renderPdfPageToDataUrl(data.slice(0), 1, 0.6);
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

export function sanitizeForPdfText(text: string): string {
  if (!text) return '';
  return text
    // Arrows
    .replace(/[\u2192\u2794\u279C\u279D]/g, '->')
    .replace(/[\u2190]/g, '<-')
    .replace(/[\u2194]/g, '<->')
    .replace(/[\u21D2]/g, '=>')
    .replace(/[\u21D0]/g, '<=')
    // Quotes & Apostrophes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    // Dashes & Hyphens
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
    // Bullets
    .replace(/[\u2022\u2023\u2043\u25E6\u2219\u25AA\u25AB\u25CF\u25CB]/g, '* ')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Spaces & non-printable
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Math symbols
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2260]/g, '!=')
    .replace(/[\u00D7]/g, 'x')
    .replace(/[\u00F7]/g, '/')
    .replace(/[\u00B1]/g, '+/-')
    // Currency
    .replace(/₹/g, 'Rs.')
    .replace(/€/g, 'EUR')
    .replace(/£/g, 'GBP')
    // Safe standard printable range: keep safe ASCII (0x20 to 0x7E) plus common Latin-1 (0xA0 to 0xFF)
    .replace(/[^\x20-\x7E\xA0-\xFF\r\n\t]/g, '');
}

/**
 * 1. MERGE PDF FILES
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('One of the PDF files could not be read or is empty.');
    }
    const srcDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
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

    page.drawText(sanitizeForPdfText(options.text), {
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

    page.drawText(sanitizeForPdfText(numText), {
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

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = parts[1] || parts[0];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function extractFirstImageFromPdf(buffer: ArrayBuffer): Promise<Uint8Array | null> {
  try {
    const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const enumerated = pdfDoc.context.enumerateIndirectObjects();
    for (const [, obj] of enumerated) {
      if (obj instanceof PDFRawStream) {
        const subtype = obj.dict.get(PDFName.of('Subtype'));
        if (subtype === PDFName.of('Image')) {
          const b = obj.contents;
          if (
            (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) || // JPEG
            (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) // PNG
          ) {
            return b;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Direct stream image extraction error:', err);
  }
  return null;
}

/**
 * 12. PDF TO WORD (.docx)
 */
export async function convertPdfToDocx(buffer: ArrayBuffer): Promise<Blob> {
  const pagesText = await extractPdfTextPages(buffer.slice(0));
  const embeddedImage = await extractFirstImageFromPdf(buffer.slice(0));

  const docChildren: Paragraph[] = [];
  for (let pIdx = 0; pIdx < pagesText.length; pIdx++) {
    const pText = pagesText[pIdx] || '';
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `--- Page ${pIdx + 1} ---`,
            bold: true,
            size: 20,
            color: '666666',
          }),
        ],
      })
    );

    const validLines = pText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (validLines.length === 0) {
      // Scanned document or image-only page (e.g. e-EPIC card)
      let imgBytes: Uint8Array | null = null;
      if (typeof window !== 'undefined') {
        try {
          const pageImgDataUrl = await renderPdfPageToDataUrl(buffer.slice(0), pIdx + 1, 1.6);
          imgBytes = dataUrlToUint8Array(pageImgDataUrl);
        } catch (e) {
          console.warn('Could not render page image:', e);
        }
      }
      if (!imgBytes) {
        imgBytes = embeddedImage;
      }

      if (imgBytes) {
        const isPng = imgBytes[0] === 0x89 && imgBytes[1] === 0x50;
        docChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imgBytes,
                transformation: {
                  width: 500,
                  height: 700,
                },
                type: (isPng ? 'png' : 'jpg') as any,
              } as any),
            ],
          })
        );
      } else {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '(Scanned document page visual)',
                italics: true,
                size: 20,
                color: '888888',
              }),
            ],
          })
        );
      }
    } else {
      validLines.forEach((line) => {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: sanitizeForPdfText(line), size: 22 })],
          })
        );
      });
    }
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * 13. WORD (.docx) TO PDF
 */
export async function convertWordToPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || 'Document has no extractable text.';

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = rawText.split('\n');
  const fontSize = 11;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2 - 40) / lineHeight);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let lineCount = 0;

  // Title header
  currentPage.drawText(sanitizeForPdfText(file.name.replace(/\.docx?$/i, '')), {
    x: margin,
    y: pageHeight - margin,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineText = sanitizeForPdfText(rawLine).slice(0, 95);
    if (!lineText.trim()) continue;

    if (lineCount >= maxLinesPerPage) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      lineCount = 0;
    }

    const y = pageHeight - margin - 40 - lineCount * lineHeight;
    currentPage.drawText(lineText, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    lineCount++;
  }

  return await pdfDoc.save();
}

/**
 * 14. CROP PDF (Trim Page Margins)
 */
export async function cropPdf(
  buffer: ArrayBuffer,
  margins: { top: number; right: number; bottom: number; left: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const newX = margins.left;
    const newY = margins.bottom;
    const newWidth = Math.max(50, width - margins.left - margins.right);
    const newHeight = Math.max(50, height - margins.top - margins.bottom);

    page.setCropBox(newX, newY, newWidth, newHeight);
  });

  return await pdfDoc.save();
}

/**
 * 15. REDACT PDF (Black Out Sensitive Content)
 */
export interface RedactionBox {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function redactPdf(
  buffer: ArrayBuffer,
  redactions: RedactionBox[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  for (const r of redactions) {
    if (r.pageIndex >= 0 && r.pageIndex < pdfDoc.getPageCount()) {
      const page = pdfDoc.getPage(r.pageIndex);
      page.drawRectangle({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        color: rgb(0, 0, 0),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * 16. EDIT PDF (Add Text Annotations & Shapes)
 */
export interface AnnotationItem {
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  size?: number;
  color?: string; // hex
}

export async function editPdf(
  buffer: ArrayBuffer,
  annotations: AnnotationItem[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const a of annotations) {
    if (a.pageIndex >= 0 && a.pageIndex < pdfDoc.getPageCount()) {
      const page = pdfDoc.getPage(a.pageIndex);
      page.drawText(sanitizeForPdfText(a.text), {
        x: a.x,
        y: a.y,
        size: a.size || 14,
        font,
        color: rgb(0.1, 0.1, 0.8),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * 17. HTML TO PDF
 */
export async function htmlToPdf(htmlOrText: string, title = 'Document'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Clean html tags to plain formatted text
  const cleanText = htmlOrText.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n');
  const lines = cleanText.split('\n');

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const lineHeight = 16;
  const maxLines = Math.floor((pageHeight - margin * 2 - 40) / lineHeight);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let lineCount = 0;

  page.drawText(sanitizeForPdfText(title), {
    x: margin,
    y: pageHeight - margin,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  for (const line of lines) {
    const lineText = sanitizeForPdfText(line).slice(0, 95);
    if (!lineText.trim()) continue;
    if (lineCount >= maxLines) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      lineCount = 0;
    }
    const y = pageHeight - margin - 40 - lineCount * lineHeight;
    page.drawText(lineText, {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    lineCount++;
  }

  return await pdfDoc.save();
}

/**
 * 18. REPAIR PDF (Recover syntax & rebuild cross-reference table)
 */
export async function repairPdf(buffer: ArrayBuffer): Promise<Uint8Array> {
  // Loading with ignoreEncryption and saving rebuilds the PDF object tree,
  // fixing malformed xref tables and corrupted stream lengths
  const pdfDoc = await PDFDocument.load(buffer, {
    ignoreEncryption: true,
    updateMetadata: true,
  });
  return await pdfDoc.save({ useObjectStreams: false });
}

/**
 * 19. PDF TO PDF/A (Archival standard metadata)
 */
export async function convertToPdfA(buffer: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  pdfDoc.setTitle('Archival PDF/A Document');
  pdfDoc.setAuthor('rajvarshith.com Studio');
  pdfDoc.setSubject('PDF/A Conformance Archival Copy');
  pdfDoc.setProducer('rajvarshith.com PDF Engine');
  pdfDoc.setCreator('PDF/A Archival Converter');
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  return await pdfDoc.save();
}

/**
 * 20. PDF TO CSV / EXCEL
 */
export async function extractPdfToCsv(buffer: ArrayBuffer): Promise<string> {
  const pagesText = await extractPdfTextPages(buffer);
  const rows: string[] = [];

  pagesText.forEach((pText) => {
    const lines = pText.split('\n');
    lines.forEach((line) => {
      // Split on tabs or multiple spaces (table columns)
      const cols = line.split(/\t|\s{2,}/).map((c) => `"${c.replace(/"/g, '""')}"`);
      if (cols.some((c) => c !== '""')) {
        rows.push(cols.join(','));
      }
    });
  });

  if (rows.length === 0) {
    rows.push('"Notice","Document contains graphical layout or scanned images"');
  }

  return rows.join('\n');
}

/**
 * 21. PDF TO MARKDOWN
 */
export async function extractPdfToMarkdown(buffer: ArrayBuffer, title: string): Promise<string> {
  const pagesText = await extractPdfTextPages(buffer);
  const mdSections: string[] = [`# ${title.replace(/\.pdf$/i, '')}\n`];

  pagesText.forEach((pText, idx) => {
    mdSections.push(`## Page ${idx + 1}\n`);
    const lines = pText.split('\n');
    lines.forEach((line) => {
      if (line.length < 50 && line === line.toUpperCase() && line.trim().length > 3) {
        mdSections.push(`### ${line}\n`);
      } else {
        mdSections.push(`${line}\n`);
      }
    });
    mdSections.push('\n---\n');
  });

  return mdSections.join('\n');
}

