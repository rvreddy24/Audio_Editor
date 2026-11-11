import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { extractPdfTextPages, renderAllPagesToImages } from './pdfRenderer';
import { sanitizeForPdfText } from './pdfOperations';

/**
 * 1. EXCEL (.xlsx, .xls, .csv) TO PDF
 */
export async function convertExcelToPdf(file: File): Promise<Uint8Array> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of arrays (rows)
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // Landscape A4
  const pageHeight = 595.28;
  const margin = 40;
  const rowHeight = 22;
  const maxRowsPerPage = Math.floor((pageHeight - margin * 2 - 50) / rowHeight);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let rowCountOnPage = 0;

  // Header Title
  currentPage.drawText(sanitizeForPdfText(`${file.name} - ${sheetName}`), {
    x: margin,
    y: pageHeight - margin,
    size: 15,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  const maxCols = Math.max(1, ...rows.slice(0, 20).map((r) => (r || []).length), 5);
  const colWidth = Math.min(130, Math.max(60, Math.floor((pageWidth - margin * 2) / maxCols)));
  const totalRowsToRender = Math.min(500, rows.length);

  for (let rIdx = 0; rIdx < totalRowsToRender; rIdx++) {
    const row = rows[rIdx] || [];
    if (rowCountOnPage >= maxRowsPerPage) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      rowCountOnPage = 0;
    }

    const y = pageHeight - margin - 40 - rowCountOnPage * rowHeight;
    const isHeader = rIdx === 0;

    // Draw row background for header
    if (isHeader) {
      currentPage.drawRectangle({
        x: margin,
        y: y - 5,
        width: pageWidth - margin * 2,
        height: rowHeight,
        color: rgb(0.93, 0.94, 0.96),
      });
    }

    for (let cIdx = 0; cIdx < row.length; cIdx++) {
      const rawVal = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
      const cellFont = isHeader ? boldFont : font;
      const cellText = sanitizeForPdfText(rawVal, cellFont).slice(0, 22);
      const cellX = margin + cIdx * colWidth;

      if (cellX + colWidth <= pageWidth - margin) {
        try {
          currentPage.drawText(cellText, {
            x: cellX + 4,
            y: y,
            size: isHeader ? 10 : 9,
            font: cellFont,
            color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.25),
          });
        } catch {
          currentPage.drawText(cellText.replace(/[^\x20-\x7E]/g, ' '), {
            x: cellX + 4,
            y: y,
            size: isHeader ? 10 : 9,
            font: cellFont,
            color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.25),
          });
        }
      }
    }

    rowCountOnPage++;
  }

  return await pdfDoc.save();
}

/**
 * 2. PDF TO EXCEL (.xlsx)
 */
export async function convertPdfToExcelXlsx(buffer: ArrayBuffer): Promise<Blob> {
  const pagesText = await extractPdfTextPages(buffer);
  const rows: string[][] = [];

  pagesText.forEach((pText, pIdx) => {
    rows.push([`--- Page ${pIdx + 1} ---`]);
    const lines = pText.split('\n');
    lines.forEach((line) => {
      // Split on tabs or 2+ spaces
      const cells = line.split(/\t|\s{2,}/).map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
  });

  if (rows.length <= 1) {
    rows.push(['(Document contains scanned image content or graphical layout)']);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * 3. PDF TO POWERPOINT (.pptx)
 */
export async function convertPdfToPptx(buffer: ArrayBuffer, filename: string): Promise<Blob> {
  const images = await renderAllPagesToImages(buffer, 1.8);
  const pptx = new (PptxGenJS as any)();
  pptx.layout = 'LAYOUT_16x9';

  images.forEach((img) => {
    const slide = pptx.addSlide();
    const aspect = (img.width && img.height) ? (img.width / img.height) : 0.707;
    let w = 7.0;
    let h = 4.8;
    if (aspect < 1) {
      // Portrait page
      h = 5.0;
      w = Math.min(8.0, h * aspect);
    } else {
      // Landscape page
      w = 8.5;
      h = Math.min(5.0, w / aspect);
    }
    const x = Math.max(0.5, (10.0 - w) / 2);
    const y = Math.max(0.3, (5.625 - h) / 2);

    slide.addImage({
      data: img.dataUrl,
      x,
      y,
      w,
      h,
    });
  });

  const outBlob = await pptx.write({ outputType: 'blob' });
  return outBlob as Blob;
}

/**
 * 4. POWERPOINT (.pptx) TO PDF
 */
export async function convertPptxToPdf(file: File): Promise<Uint8Array> {
  const data = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 16:9 slide dimensions in points (A4 landscape ratio / 16:9 standard: 960 x 540)
  const slideWidth = 960;
  const slideHeight = 540;

  try {
    const zip = await JSZip.loadAsync(data);
    // Find all slide XML files: ppt/slides/slide1.xml, ppt/slides/slide2.xml, etc.
    const slideFiles = Object.keys(zip.files).filter((k) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(k)
    );

    if (slideFiles.length > 0) {
      // Sort numerically
      slideFiles.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      for (let i = 0; i < slideFiles.length; i++) {
        const slideXmlStr = await zip.files[slideFiles[i]].async('text');
        // Extract all text inside <a:t>...</a:t>
        const matches = slideXmlStr.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
        const slideTexts: string[] = [];
        matches.forEach((m) => {
          const t = m.replace(/<[^>]+>/g, '').trim();
          if (t) slideTexts.push(t);
        });

        const page = pdfDoc.addPage([slideWidth, slideHeight]);
        // Slide header badge
        page.drawText(`Slide ${i + 1}`, {
          x: 60,
          y: slideHeight - 45,
          size: 11,
          font: boldFont,
          color: rgb(0.85, 0.2, 0.2),
        });

        let currentY = slideHeight - 90;
        if (slideTexts.length > 0) {
          // First text as Title
          const titleText = sanitizeForPdfText(slideTexts[0], boldFont);
          page.drawText(titleText.slice(0, 70), {
            x: 60,
            y: currentY,
            size: 22,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= 40;

          // Subsequent text lines as bullet points
          for (let tIdx = 1; tIdx < Math.min(15, slideTexts.length); tIdx++) {
            const bodyLine = sanitizeForPdfText(slideTexts[tIdx], font);
            if (!bodyLine) continue;
            page.drawText(`•  ${bodyLine.slice(0, 95)}`, {
              x: 80,
              y: currentY,
              size: 14,
              font,
              color: rgb(0.25, 0.25, 0.25),
            });
            currentY -= 26;
            if (currentY < 60) break;
          }
        } else {
          page.drawText(sanitizeForPdfText(file.name.replace(/\.pptx?$/i, ''), boldFont), {
            x: 60,
            y: currentY,
            size: 20,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
      }

      return await pdfDoc.save();
    }
  } catch (err) {
    console.warn('Could not parse PPTX slide XML, falling back to clean presentation slide:', err);
  }

  // Fallback presentation slide
  const page = pdfDoc.addPage([slideWidth, slideHeight]);
  page.drawText(sanitizeForPdfText(file.name.replace(/\.pptx?$/i, ''), boldFont), {
    x: 100,
    y: 300,
    size: 28,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('Converted from PowerPoint Presentation', {
    x: 100,
    y: 250,
    size: 16,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  return await pdfDoc.save();
}
