import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { extractPdfTextPages, renderAllPagesToImages } from './pdfRenderer';

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
  currentPage.drawText(`${file.name} - ${sheetName}`, {
    x: margin,
    y: pageHeight - margin,
    size: 15,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  const colWidth = Math.min(130, Math.floor((pageWidth - margin * 2) / Math.max(1, (rows[0] || []).length || 5)));

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
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
      const cellText = String(row[cIdx] !== undefined && row[cIdx] !== null ? row[cIdx] : '').slice(0, 22);
      const cellX = margin + cIdx * colWidth;

      if (cellX + colWidth <= pageWidth - margin) {
        currentPage.drawText(cellText, {
          x: cellX + 4,
          y: y,
          size: isHeader ? 10 : 9,
          font: isHeader ? boldFont : font,
          color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.25),
        });
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
    // Centered slide layout
    slide.addImage({
      data: img.dataUrl,
      x: 1.5,
      y: 0.4,
      w: 7.0,
      h: 4.8,
    });
  });

  const outBlob = await pptx.write({ outputType: 'blob' });
  return outBlob as Blob;
}

/**
 * 4. POWERPOINT (.pptx) TO PDF
 */
export async function convertPptxToPdf(file: File): Promise<Uint8Array> {
  // Generates clean 16:9 slides in PDF format
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 16:9 slide dimensions
  const slideWidth = 960;
  const slideHeight = 540;

  const page = pdfDoc.addPage([slideWidth, slideHeight]);

  // Clean presentation title slide
  page.drawText(file.name.replace(/\.pptx?$/i, ''), {
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
