import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { EditorItem, DrawingStroke } from './types';
import { sanitizeForPdfText } from '../../../utils/pdfOperations';

/**
 * Converts hex color string (#rrggbb) to pdf-lib rgb(r, g, b)
 */
function hexToPdfRgb(hex: string = '#000000') {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  }
  const r = parseInt(clean.substring(0, 2) || '00', 16) / 255;
  const g = parseInt(clean.substring(2, 4) || '00', 16) / 255;
  const b = parseInt(clean.substring(4, 6) || '00', 16) / 255;
  return rgb(r, g, b);
}

/**
 * Renders all freehand drawing and highlighter strokes for a given page onto an off-screen canvas
 * and returns the transparent PNG data URL.
 */
async function renderPageStrokesToPng(
  strokes: DrawingStroke[],
  pageWidthPts: number,
  pageHeightPts: number
): Promise<string | null> {
  if (strokes.length === 0) return null;

  const scale = 2.0; // 2x resolution for retina-crisp rendering
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pageWidthPts * scale);
  canvas.height = Math.round(pageHeightPts * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;

    ctx.save();
    ctx.scale(scale, scale);

    if (stroke.isHighlighter) {
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = stroke.color || '#facc15';
      ctx.lineWidth = stroke.lineWidth || 16;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = stroke.color || '#111827';
      ctx.lineWidth = stroke.lineWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const p1 = stroke.points[i - 1];
      const p2 = stroke.points[i];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }

    ctx.lineTo(
      stroke.points[stroke.points.length - 1].x,
      stroke.points[stroke.points.length - 1].y
    );
    ctx.stroke();
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Main burn-in function: loads PDF buffer, burns all items, drawings, and page changes,
 * and saves into a fresh Uint8Array.
 */
export async function burnEditsIntoPdf(
  originalPdfBuffer: ArrayBuffer,
  items: EditorItem[],
  strokes: DrawingStroke[],
  deletedPageIndices: number[] = [],
  pageRotations: Record<number, number> = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBuffer.slice(0), { ignoreEncryption: true });

  // Pre-embed standard fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

  const getFont = (family?: string, isBold?: boolean, isItalic?: boolean) => {
    if (family === 'Times') return fontTimes;
    if (family === 'Courier') return fontCourier;
    if (isBold) return fontHelveticaBold;
    if (isItalic) return fontHelveticaOblique;
    return fontHelvetica;
  };

  const pageCount = pdfDoc.getPageCount();

  // 1. Process annotations per page
  for (let p = 0; p < pageCount; p++) {
    // Skip if page is deleted
    if (deletedPageIndices.includes(p)) continue;

    const page = pdfDoc.getPage(p);
    const { width: pWidth, height: pHeight } = page.getSize();

    // A. Apply any page rotation delta
    if (pageRotations[p]) {
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + pageRotations[p]) % 360));
    }

    // Filter items belonging to page p
    const pageItems = items.filter((item) => item.pageIndex === p);

    // Render items in visual order: Whiteout/Redact first, then Shapes, Images/Signatures, then Text
    const sortPriority: Record<string, number> = {
      whiteout: 1,
      redact: 1,
      shape: 2,
      image: 3,
      signature: 3,
      text: 4,
    };

    pageItems.sort((a, b) => (sortPriority[a.type] || 0) - (sortPriority[b.type] || 0));

    for (const item of pageItems) {
      // Coordinate transform: PDF origin is bottom-left, screen top-left
      const pdfX = item.x;
      const pdfY = pHeight - item.y - item.height;

      // 1. Whiteout
      if (item.type === 'whiteout') {
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: item.width,
          height: item.height,
          color: rgb(1, 1, 1),
          opacity: 1,
        });
      }

      // 2. Redaction (Blackout)
      else if (item.type === 'redact') {
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: item.width,
          height: item.height,
          color: rgb(0, 0, 0),
          opacity: 1,
        });
      }

      // 3. Text
      else if (item.type === 'text' && item.text) {
        const font = getFont(item.fontFamily, item.isBold, item.isItalic);
        const fontSize = item.fontSize || 14;
        const color = hexToPdfRgb(item.color || '#000000');

        // Handle multiline text
        const lines = item.text.split('\n');
        const lineHeight = fontSize * 1.25;

        for (let l = 0; l < lines.length; l++) {
          const lineText = sanitizeForPdfText(lines[l], font);
          if (!lineText) continue;

          // Text baseline in PDF
          const lineY = pHeight - item.y - (fontSize * 0.85) - l * lineHeight;
          page.drawText(lineText, {
            x: pdfX,
            y: lineY,
            size: fontSize,
            font,
            color,
          });
        }
      }

      // 4. Signature & Image
      else if ((item.type === 'signature' || item.type === 'image') && item.imageDataUrl) {
        try {
          const isPng = item.imageDataUrl.startsWith('data:image/png');
          const embeddedImage = isPng
            ? await pdfDoc.embedPng(item.imageDataUrl)
            : await pdfDoc.embedJpg(item.imageDataUrl);

          page.drawImage(embeddedImage, {
            x: pdfX,
            y: pdfY,
            width: item.width,
            height: item.height,
            opacity: item.opacity ?? 1,
          });
        } catch (imgErr) {
          console.warn('Could not embed image/signature onto PDF:', imgErr);
        }
      }

      // 5. Shapes
      else if (item.type === 'shape') {
        const strokeColor = hexToPdfRgb(item.strokeColor || '#000000');
        const fillColor = item.fillColor ? hexToPdfRgb(item.fillColor) : undefined;
        const borderWidth = item.strokeWidth || 2;

        if (item.shapeType === 'rectangle') {
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: item.width,
            height: item.height,
            borderColor: strokeColor,
            borderWidth,
            color: fillColor,
            opacity: item.opacity ?? 1,
          });
        } else if (item.shapeType === 'circle') {
          page.drawEllipse({
            x: pdfX + item.width / 2,
            y: pdfY + item.height / 2,
            xScale: item.width / 2,
            yScale: item.height / 2,
            borderColor: strokeColor,
            borderWidth,
            color: fillColor,
            opacity: item.opacity ?? 1,
          });
        } else if (item.shapeType === 'check') {
          // Draw checkmark lines
          const p1X = pdfX + item.width * 0.15;
          const p1Y = pdfY + item.height * 0.45;
          const p2X = pdfX + item.width * 0.42;
          const p2Y = pdfY + item.height * 0.15;
          const p3X = pdfX + item.width * 0.88;
          const p3Y = pdfY + item.height * 0.85;

          page.drawLine({
            start: { x: p1X, y: p1Y },
            end: { x: p2X, y: p2Y },
            thickness: borderWidth + 1,
            color: strokeColor,
          });
          page.drawLine({
            start: { x: p2X, y: p2Y },
            end: { x: p3X, y: p3Y },
            thickness: borderWidth + 1,
            color: strokeColor,
          });
        } else if (item.shapeType === 'cross') {
          // Draw X cross lines
          page.drawLine({
            start: { x: pdfX + 4, y: pdfY + 4 },
            end: { x: pdfX + item.width - 4, y: pdfY + item.height - 4 },
            thickness: borderWidth + 1,
            color: strokeColor,
          });
          page.drawLine({
            start: { x: pdfX + 4, y: pdfY + item.height - 4 },
            end: { x: pdfX + item.width - 4, y: pdfY + 4 },
            thickness: borderWidth + 1,
            color: strokeColor,
          });
        }
      }
    }

    // B. Freehand Drawings & Highlighters for page p
    const pageStrokes = strokes.filter((s) => s.pageIndex === p);
    if (pageStrokes.length > 0) {
      const strokesPngUrl = await renderPageStrokesToPng(pageStrokes, pWidth, pHeight);
      if (strokesPngUrl) {
        try {
          const embeddedStrokes = await pdfDoc.embedPng(strokesPngUrl);
          page.drawImage(embeddedStrokes, {
            x: 0,
            y: 0,
            width: pWidth,
            height: pHeight,
          });
        } catch (e) {
          console.warn('Could not burn freehand strokes:', e);
        }
      }
    }
  }

  // 2. Remove any deleted pages (in descending order to preserve indices)
  if (deletedPageIndices.length > 0) {
    const sortedDeleted = [...new Set(deletedPageIndices)].sort((a, b) => b - a);
    for (const dIdx of sortedDeleted) {
      if (dIdx >= 0 && dIdx < pdfDoc.getPageCount()) {
        pdfDoc.removePage(dIdx);
      }
    }
  }

  return await pdfDoc.save();
}
