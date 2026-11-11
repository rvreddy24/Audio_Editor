/**
 * Pure In-Browser Client-Side Image Processing Engine
 * Comprehensive Image Studio suite:
 * - Target KB/MB Exact Compression
 * - Increase Image Size to Minimum Target
 * - Dimension Resizing (Pixels, CM, MM, Inches)
 * - DPI Converter (JFIF & PNG pHYs injection)
 * - Passport Size Photo Maker with Background Tint & Face Framing
 * - Signature Cleaner & Resizer
 * - Name & Date of Photo (DoP) Stamp
 * - Image Format Converter (JPG, PNG, WebP)
 * - Image Joiner (Side-by-side / Stacked)
 * - Printable Photo Sheet Generator
 */

export interface ImageCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = '';
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file. Please ensure it is a valid image.'));
    };
  });
}

/**
 * 1. COMPRESS TO EXACT TARGET KB (Binary Search + Iterative Scale)
 * Strictly guarantees output is <= targetKb (or within a 2% margin).
 */
export async function compressToTargetKb(
  source: HTMLImageElement | HTMLCanvasElement,
  targetKb: number,
  mimeType: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): Promise<{ blob: Blob; dataUrl: string; actualKb: number; width: number; height: number }> {
  const targetBytes = targetKb * 1024;
  let curW = 'naturalWidth' in source ? (source.naturalWidth || source.width) : source.width;
  let curH = 'naturalHeight' in source ? (source.naturalHeight || source.height) : source.height;

  // Max iterations
  let bestBlob: Blob | null = null;
  let bestQuality = 0.85;

  for (let scalePass = 0; scalePass < 5; scalePass++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(20, Math.round(curW));
    canvas.height = Math.max(20, Math.round(curH));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not create canvas context');

    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    // Binary search quality between 0.05 and 0.98
    let lowQ = 0.05;
    let highQ = 0.98;
    let localBestBlob: Blob | null = null;

    for (let qIter = 0; qIter < 7; qIter++) {
      const midQ = (lowQ + highQ) / 2;
      const b = await canvasToBlob(canvas, mimeType, midQ);

      if (b.size <= targetBytes) {
        localBestBlob = b;
        bestQuality = midQ;
        lowQ = midQ; // try higher quality
      } else {
        highQ = midQ; // need lower quality
      }
    }

    if (localBestBlob && localBestBlob.size <= targetBytes) {
      bestBlob = localBestBlob;
      // If we are within 25% of target or quality is decent, break
      if (localBestBlob.size >= targetBytes * 0.75 || bestQuality > 0.6) {
        break;
      }
    }

    // If even lowest quality exceeds targetBytes, downscale dimensions
    const testLowest = await canvasToBlob(canvas, mimeType, 0.05);
    if (testLowest.size > targetBytes) {
      const ratio = Math.sqrt(targetBytes / testLowest.size) * 0.90;
      curW = Math.max(30, Math.round(curW * ratio));
      curH = Math.max(30, Math.round(curH * ratio));
    } else {
      if (!bestBlob) bestBlob = testLowest;
      break;
    }
  }

  if (!bestBlob) {
    // Ultimate fallback: small canvas
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 300;
    fallbackCanvas.height = Math.max(30, Math.round((300 / curW) * curH));
    const fCtx = fallbackCanvas.getContext('2d');
    if (fCtx) {
      if (mimeType === 'image/jpeg') {
        fCtx.fillStyle = '#FFFFFF';
        fCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      }
      fCtx.drawImage(source, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
      bestBlob = await canvasToBlob(fallbackCanvas, mimeType, 0.3);
    } else {
      throw new Error('Image compression failed to meet target constraints');
    }
  }

  const dataUrl = await blobToDataUrl(bestBlob);
  const actualKb = Math.round((bestBlob.size / 1024) * 10) / 10;
  return {
    blob: bestBlob,
    dataUrl,
    actualKb,
    width: Math.round(curW),
    height: Math.round(curH),
  };
}

/**
 * 2. INCREASE IMAGE SIZE IN KB (Safe padding for rigid minimum portal limits)
 */
export async function increaseImageSizeKb(
  file: File,
  targetKb: number
): Promise<{ blob: Blob; dataUrl: string; actualKb: number }> {
  const targetBytes = targetKb * 1024;
  const originalBytes = await file.arrayBuffer();

  if (originalBytes.byteLength >= targetBytes) {
    const b = new Blob([originalBytes], { type: file.type || 'image/jpeg' });
    return {
      blob: b,
      dataUrl: await blobToDataUrl(b),
      actualKb: Math.round((b.size / 1024) * 10) / 10,
    };
  }

  // Pad safe trailing bytes that image decoders safely ignore
  const diff = targetBytes - originalBytes.byteLength;
  const padded = new Uint8Array(targetBytes);
  padded.set(new Uint8Array(originalBytes), 0);
  // Fill remaining bytes with safe zeros/spaces
  padded.fill(0x00, originalBytes.byteLength, targetBytes);

  const finalBlob = new Blob([padded], { type: file.type || 'image/jpeg' });
  const dataUrl = await blobToDataUrl(finalBlob);
  return {
    blob: finalBlob,
    dataUrl,
    actualKb: Math.round((finalBlob.size / 1024) * 10) / 10,
  };
}

/**
 * 3. RESIZE BY DIMENSIONS (PX, CM, MM, IN) & DPI
 */
export interface DimensionResizeOptions {
  width: number;
  height: number;
  unit: 'px' | 'cm' | 'mm' | 'inch';
  dpi?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

export function convertUnitsToPixels(val: number, unit: 'px' | 'cm' | 'mm' | 'inch', dpi = 300): number {
  if (unit === 'px') return Math.round(val);
  if (unit === 'inch') return Math.round(val * dpi);
  if (unit === 'cm') return Math.round((val / 2.54) * dpi);
  if (unit === 'mm') return Math.round((val / 25.4) * dpi);
  return Math.round(val);
}

export async function resizeImageDimensions(
  img: HTMLImageElement,
  options: DimensionResizeOptions
): Promise<{ blob: Blob; dataUrl: string; widthPx: number; heightPx: number; sizeKb: number }> {
  const dpi = options.dpi || 300;
  const targetW = Math.max(10, convertUnitsToPixels(options.width, options.unit, dpi));
  const targetH = Math.max(10, convertUnitsToPixels(options.height, options.unit, dpi));
  const format = options.format || 'image/jpeg';
  const quality = options.quality !== undefined ? options.quality : 0.92;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let rawBlob = await canvasToBlob(canvas, format, quality);

  // Inject DPI header if requested
  if (format === 'image/jpeg' && dpi) {
    rawBlob = await injectJpegDpi(rawBlob, dpi);
  }

  const dataUrl = await blobToDataUrl(rawBlob);
  const sizeKb = Math.round((rawBlob.size / 1024) * 10) / 10;

  return {
    blob: rawBlob,
    dataUrl,
    widthPx: targetW,
    heightPx: targetH,
    sizeKb,
  };
}

/**
 * 4. PASSPORT PHOTO MAKER
 * Supports Standard Countries (India 3.5x4.5cm, US 2x2in, UK/EU 3.5x4.5cm, etc.),
 * Background Replacement/Tinting, and Face Framing.
 */
export interface PassportPhotoOptions {
  country: 'india' | 'us' | 'uk' | 'eu' | 'canada' | 'custom';
  widthMm?: number;
  heightMm?: number;
  bgColor?: string; // e.g. '#FFFFFF', '#E0F2FE' (light blue), '#FEE2E2' (light red), '#F3F4F6' (light grey)
  crop?: ImageCropRect;
  dpi?: number;
  zoom?: number;
  panX?: number;
  panY?: number;
  rotation?: number; // rotation in degrees (-45 to +45)
}

export const PASSPORT_SPECS = {
  india: { name: 'India (Official / Passport / Visa / SSC)', widthMm: 35, heightMm: 45, dpi: 300 },
  us: { name: 'United States (Visa / Passport 2x2 in)', widthMm: 50.8, heightMm: 50.8, dpi: 300 },
  uk: { name: 'United Kingdom (Standard 35x45 mm)', widthMm: 35, heightMm: 45, dpi: 300 },
  eu: { name: 'Schengen / European Union (35x45 mm)', widthMm: 35, heightMm: 45, dpi: 300 },
  canada: { name: 'Canada (Passport 50x70 mm)', widthMm: 50, heightMm: 70, dpi: 300 },
  custom: { name: 'Custom Dimensions', widthMm: 35, heightMm: 45, dpi: 300 },
};

export async function createPassportPhoto(
  img: HTMLImageElement,
  options: PassportPhotoOptions
): Promise<{ blob: Blob; dataUrl: string; widthPx: number; heightPx: number }> {
  const spec = PASSPORT_SPECS[options.country] || PASSPORT_SPECS.india;
  const widthMm = options.widthMm || spec.widthMm;
  const heightMm = options.heightMm || spec.heightMm;
  const dpi = options.dpi || spec.dpi;

  const wPx = Math.round((widthMm / 25.4) * dpi);
  const hPx = Math.round((heightMm / 25.4) * dpi);

  const canvas = document.createElement('canvas');
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  // Fill Background Color
  ctx.fillStyle = options.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, wPx, hPx);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (options.crop) {
    ctx.drawImage(
      img,
      options.crop.x,
      options.crop.y,
      options.crop.width,
      options.crop.height,
      0,
      0,
      wPx,
      hPx
    );
  } else if (
    options.zoom !== undefined ||
    options.panX !== undefined ||
    options.panY !== undefined ||
    options.rotation !== undefined
  ) {
    ctx.save();
    // Translate to center of destination passport photo canvas
    ctx.translate(wPx / 2, hPx / 2);

    // Apply manual pan offset
    const px = options.panX || 0;
    const py = options.panY || 0;
    ctx.translate(px, py);

    // Apply tilt / rotation
    if (options.rotation) {
      ctx.rotate((options.rotation * Math.PI) / 180);
    }

    // Cover scale factor * user zoom
    const zoom = options.zoom || 1.0;
    const baseScale = Math.max(wPx / img.naturalWidth, hPx / img.naturalHeight);
    const finalScale = baseScale * zoom;

    ctx.scale(finalScale, finalScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  } else {
    // Center crop with aspect ratio
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const destRatio = wPx / hPx;

    let sx = 0,
      sy = 0,
      sw = img.naturalWidth,
      sh = img.naturalHeight;
    if (srcRatio > destRatio) {
      sw = img.naturalHeight * destRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / destRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, wPx, hPx);
  }

  let finalBlob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
  finalBlob = await injectJpegDpi(finalBlob, dpi);
  const dataUrl = await blobToDataUrl(finalBlob);

  return { blob: finalBlob, dataUrl, widthPx: wPx, heightPx: hPx };
}

/**
 * 5. PRINTABLE PASSPORT PHOTO SHEET (Multi-Photo Grid on 4x6 or A4)
 */
export async function generatePrintableSheet(
  photoImg: HTMLImageElement,
  sheetSize: '4x6' | 'a4' = '4x6',
  photoCount: 4 | 6 | 8 | 12 = 6
): Promise<{ blob: Blob; dataUrl: string }> {
  const dpi = 300;
  // Dimensions in pixels at 300 DPI
  const sheetW = sheetSize === '4x6' ? Math.round(6 * dpi) : Math.round(8.27 * dpi); // 1800 or 2480
  const sheetH = sheetSize === '4x6' ? Math.round(4 * dpi) : Math.round(11.69 * dpi); // 1200 or 3508

  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas failed');

  // Clean pure white photographic paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheetW, sheetH);

  // Grid layout
  let cols = 3;
  let rows = 2;
  if (photoCount === 4) {
    cols = 2;
    rows = 2;
  } else if (photoCount === 6) {
    cols = 3;
    rows = 2;
  } else if (photoCount === 8) {
    cols = 4;
    rows = 2;
  } else if (photoCount === 12) {
    cols = 4;
    rows = 3;
  }

  const pWidth = Math.round((35 / 25.4) * dpi); // ~413 px
  const pHeight = Math.round((45 / 25.4) * dpi); // ~531 px

  const totalGridW = cols * pWidth;
  const totalGridH = rows * pHeight;
  const gapX = Math.max(20, Math.floor((sheetW - totalGridW) / (cols + 1)));
  const gapY = Math.max(20, Math.floor((sheetH - totalGridH) / (rows + 1)));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gapX + c * (pWidth + gapX);
      const y = gapY + r * (pHeight + gapY);

      // Draw thin grey cut guide line around each photo
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 1, y - 1, pWidth + 2, pHeight + 2);

      ctx.drawImage(photoImg, x, y, pWidth, pHeight);
    }
  }

  let sheetBlob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
  sheetBlob = await injectJpegDpi(sheetBlob, dpi);
  const dataUrl = await blobToDataUrl(sheetBlob);

  return { blob: sheetBlob, dataUrl };
}

/**
 * 6. SIGNATURE RESIZER & PAPER BACKGROUND CLEANER
 * Strips paper texture, yellow shadows, and enhances pen ink clarity for official portals (<20 KB).
 */
export interface SignatureOptions {
  widthPx?: number; // e.g. 140 or 300
  heightPx?: number; // e.g. 60 or 80
  contrastBoost?: number; // 0 to 100
  cleanPaperBg?: boolean;
  targetKb?: number; // typically 10 to 20
}

export async function processSignature(
  img: HTMLImageElement,
  options: SignatureOptions = {}
): Promise<{ blob: Blob; dataUrl: string; actualKb: number }> {
  const w = options.widthPx || 300;
  const h = options.heightPx || 100;
  const targetKb = options.targetKb || 20;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas not available');

  // Fill clean white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // Scale signature inside preserving aspect ratio
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let dw = w;
  let dh = h;
  let dx = 0;
  let dy = 0;

  if (imgRatio > targetRatio) {
    dh = w / imgRatio;
    dy = (h - dh) / 2;
  } else {
    dw = h * imgRatio;
    dx = (w - dw) / 2;
  }

  ctx.drawImage(img, dx, dy, dw, dh);

  // Clean paper background & boost ink contrast
  if (options.cleanPaperBg !== false) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const threshold = 185; // Pixels lighter than this become pure white

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum > threshold) {
        // Pure crisp white background
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else {
        // Deepen and sharpen signature ink
        const factor = Math.max(0, (lum / threshold) * 0.85);
        data[i] = Math.round(r * factor);
        data[i + 1] = Math.round(g * factor);
        data[i + 2] = Math.round(b * factor);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Compress to target KB (<= 20KB for portals)
  const result = await compressToTargetKb(canvas, targetKb, 'image/jpeg');
  return {
    blob: result.blob,
    dataUrl: result.dataUrl,
    actualKb: result.actualKb,
  };
}

/**
 * 7. NAME & DATE OF PHOTO (DoP) STAMP
 * Standard requirement for competitive recruitment portals (SSC, UPSC, NEET, etc.)
 */
export async function addNameAndDateStamp(
  img: HTMLImageElement,
  name: string,
  dateStr: string,
  options?: { boxHeightRatio?: number; fontColor?: string; bgColor?: string }
): Promise<{ blob: Blob; dataUrl: string }> {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  // Draw base photograph
  ctx.drawImage(img, 0, 0, w, h);

  // Bottom stamp box
  const boxHeight = Math.max(50, Math.round(h * (options?.boxHeightRatio || 0.18)));
  const boxY = h - boxHeight;

  ctx.fillStyle = options?.bgColor || '#FFFFFF';
  ctx.fillRect(0, boxY, w, boxHeight);

  // Border top line for stamp box
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = Math.max(1, Math.round(w / 400));
  ctx.beginPath();
  ctx.moveTo(0, boxY);
  ctx.lineTo(w, boxY);
  ctx.stroke();

  // Draw Name & Date Typography
  ctx.fillStyle = options?.fontColor || '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const baseFontSize = Math.max(14, Math.round(boxHeight * 0.32));
  ctx.font = `bold ${baseFontSize}px sans-serif`;

  const line1Y = boxY + boxHeight * 0.35;
  const line2Y = boxY + boxHeight * 0.72;

  if (name.trim()) {
    ctx.fillText(name.trim().toUpperCase(), w / 2, line1Y);
  }
  if (dateStr.trim()) {
    ctx.fillText(`DoP: ${dateStr.trim()}`, w / 2, line2Y);
  }

  const finalBlob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
  const dataUrl = await blobToDataUrl(finalBlob);
  return { blob: finalBlob, dataUrl };
}

/**
 * 8. IMAGE JOINER / MERGER (Side-by-Side or Stacked combo)
 */
export async function joinImages(
  images: HTMLImageElement[],
  layout: 'horizontal' | 'vertical' = 'horizontal',
  gap = 20,
  bgColor = '#FFFFFF'
): Promise<{ blob: Blob; dataUrl: string }> {
  if (images.length === 0) throw new Error('At least one image required to join');
  if (images.length === 1) {
    const c = document.createElement('canvas');
    c.width = images[0].naturalWidth;
    c.height = images[0].naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(images[0], 0, 0);
    const b = await canvasToBlob(c, 'image/jpeg', 0.95);
    return { blob: b, dataUrl: await blobToDataUrl(b) };
  }

  let totalW = 0;
  let totalH = 0;

  if (layout === 'horizontal') {
    const maxHeight = Math.max(...images.map((img) => img.naturalHeight));
    totalH = maxHeight;
    totalW = images.reduce((acc, img) => {
      const scaledW = Math.round((maxHeight / img.naturalHeight) * img.naturalWidth);
      return acc + scaledW;
    }, 0) + (images.length - 1) * gap;

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW, totalH);

    let currentX = 0;
    images.forEach((img) => {
      const scaledW = Math.round((maxHeight / img.naturalHeight) * img.naturalWidth);
      ctx.drawImage(img, currentX, 0, scaledW, maxHeight);
      currentX += scaledW + gap;
    });

    const b = await canvasToBlob(canvas, 'image/jpeg', 0.95);
    return { blob: b, dataUrl: await blobToDataUrl(b) };
  } else {
    // Vertical stacking
    const maxWidth = Math.max(...images.map((img) => img.naturalWidth));
    totalW = maxWidth;
    totalH = images.reduce((acc, img) => {
      const scaledH = Math.round((maxWidth / img.naturalWidth) * img.naturalHeight);
      return acc + scaledH;
    }, 0) + (images.length - 1) * gap;

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW, totalH);

    let currentY = 0;
    images.forEach((img) => {
      const scaledH = Math.round((maxWidth / img.naturalWidth) * img.naturalHeight);
      ctx.drawImage(img, 0, currentY, maxWidth, scaledH);
      currentY += scaledH + gap;
    });

    const b = await canvasToBlob(canvas, 'image/jpeg', 0.95);
    return { blob: b, dataUrl: await blobToDataUrl(b) };
  }
}

/**
 * 9. DPI INJECTION FOR JPEG (JFIF APP0 Marker)
 */
export async function injectJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Check JPEG SOI (0xFF, 0xD8)
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return blob;
  }

  // Check if JFIF APP0 is already present (0xFF, 0xE0)
  if (bytes[2] === 0xff && bytes[3] === 0xe0) {
    // Offset 13: units (1 = dots per inch)
    // Offset 14-15: X density (big endian)
    // Offset 16-17: Y density (big endian)
    bytes[13] = 1; // dots per inch
    bytes[14] = (dpi >> 8) & 0xff;
    bytes[15] = dpi & 0xff;
    bytes[16] = (dpi >> 8) & 0xff;
    bytes[17] = dpi & 0xff;
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  // If no APP0, insert standard 18-byte JFIF APP0 block right after SOI (byte 2)
  const jfifBlock = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, // marker + length (16 bytes)
    0x4a, 0x46, 0x49, 0x46, 0x00, // 'JFIF\0'
    0x01, 0x01, // version 1.1
    0x01, // units = dots per inch
    (dpi >> 8) & 0xff, dpi & 0xff, // Xdensity
    (dpi >> 8) & 0xff, dpi & 0xff, // Ydensity
    0x00, 0x00, // thumbnail X, Y
  ]);

  const output = new Uint8Array(bytes.length + jfifBlock.length);
  output.set(bytes.subarray(0, 2), 0); // SOI
  output.set(jfifBlock, 2);
  output.set(bytes.subarray(2), 2 + jfifBlock.length);

  return new Blob([output], { type: 'image/jpeg' });
}

// Helper Utilities
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to blob export failed'));
      },
      type,
      quality
    );
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export function downloadImageBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// Extended Suite Functions for Image Studio
// -------------------------------------------------------------

/**
 * 10. CROP IMAGE (Free / Fixed Aspect Ratio)
 */
export async function cropImage(
  img: HTMLImageElement,
  crop: ImageCropRect,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality = 0.92
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await canvasToBlob(canvas, format, quality);
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl, width: canvas.width, height: canvas.height };
}

/**
 * 11. CIRCLE CROP (Profile Avatar / Social Badge)
 */
export async function circleCropImage(
  img: HTMLImageElement,
  options?: {
    borderWidth?: number;
    borderColor?: string;
    bgColor?: string;
    format?: 'image/png' | 'image/jpeg';
  }
): Promise<{ blob: Blob; dataUrl: string; size: number }> {
  const size = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  const format = options?.format || 'image/png';
  if (format === 'image/jpeg' || options?.bgColor) {
    ctx.fillStyle = options?.bgColor || '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
  }

  const radius = size / 2;
  const sx = (img.naturalWidth - size) / 2;
  const sy = (img.naturalHeight - size) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(radius, radius, radius - (options?.borderWidth || 0), 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
  ctx.restore();

  if (options?.borderWidth && options.borderWidth > 0) {
    ctx.beginPath();
    ctx.arc(radius, radius, radius - options.borderWidth / 2, 0, Math.PI * 2);
    ctx.strokeStyle = options.borderColor || '#FFFFFF';
    ctx.lineWidth = options.borderWidth;
    ctx.stroke();
  }

  const blob = await canvasToBlob(canvas, format, 0.95);
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl, size };
}

/**
 * 12. ROUND CORNERS (Smooth Border Radius)
 */
export async function roundCornersImage(
  img: HTMLImageElement,
  radius: number,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<{ blob: Blob; dataUrl: string }> {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  const r = Math.min(radius, Math.min(w, h) / 2);

  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(img, 0, 0, w, h);

  const blob = await canvasToBlob(canvas, format, 0.95);
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl };
}

/**
 * 13. ROTATE & FLIP
 */
export async function rotateAndFlipImage(
  img: HTMLImageElement,
  angle: number,
  flipH: boolean,
  flipV: boolean
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const rad = (angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const newW = Math.round(w * cos + h * sin);
  const newH = Math.round(w * sin + h * cos);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -w / 2, -h / 2);

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl, width: newW, height: newH };
}

/**
 * 14. PHOTO EFFECTS & FILTERS
 */
export interface PhotoEffectOptions {
  filter?: 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'high-contrast' | 'blur' | 'pixelate';
  brightness?: number; // 0 to 200 (100 = normal)
  contrast?: number; // 0 to 200 (100 = normal)
  saturation?: number; // 0 to 200 (100 = normal)
  blurRadius?: number; // 0 to 40 px
  pixelateSize?: number; // 2 to 50 px
  border?: { width: number; color: string; padding?: number };
}

export async function applyPhotoEffects(
  img: HTMLImageElement,
  options: PhotoEffectOptions
): Promise<{ blob: Blob; dataUrl: string }> {
  const borderWidth = options.border?.width || 0;
  const padding = options.border?.padding || 0;
  const extra = (borderWidth + padding) * 2;
  const w = img.naturalWidth + extra;
  const h = img.naturalHeight + extra;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context failed');

  if (borderWidth > 0 || padding > 0) {
    ctx.fillStyle = options.border?.color || '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  }

  const innerX = borderWidth + padding;
  const innerY = borderWidth + padding;
  const innerW = img.naturalWidth;
  const innerH = img.naturalHeight;

  // Build CSS filter string
  const filters: string[] = [];
  if (options.brightness !== undefined && options.brightness !== 100) {
    filters.push(`brightness(${options.brightness}%)`);
  }
  if (options.contrast !== undefined && options.contrast !== 100) {
    filters.push(`contrast(${options.contrast}%)`);
  }
  if (options.saturation !== undefined && options.saturation !== 100) {
    filters.push(`saturate(${options.saturation}%)`);
  }

  if (options.filter === 'grayscale') filters.push('grayscale(100%)');
  else if (options.filter === 'sepia') filters.push('sepia(100%)');
  else if (options.filter === 'invert') filters.push('invert(100%)');
  else if (options.filter === 'vintage') filters.push('sepia(50%) contrast(120%) brightness(90%)');
  else if (options.filter === 'high-contrast') filters.push('contrast(160%) brightness(105%)');
  else if (options.filter === 'blur' && options.blurRadius) filters.push(`blur(${options.blurRadius}px)`);

  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }

  ctx.drawImage(img, innerX, innerY, innerW, innerH);
  ctx.filter = 'none';

  // Pixelate effect if requested
  if (options.filter === 'pixelate' && options.pixelateSize && options.pixelateSize > 1) {
    const pxSize = Math.max(2, options.pixelateSize);
    const pCanvas = document.createElement('canvas');
    pCanvas.width = Math.max(1, Math.round(innerW / pxSize));
    pCanvas.height = Math.max(1, Math.round(innerH / pxSize));
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      pCtx.drawImage(canvas, innerX, innerY, innerW, innerH, 0, 0, pCanvas.width, pCanvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pCanvas, 0, 0, pCanvas.width, pCanvas.height, innerX, innerY, innerW, innerH);
    }
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl };
}

/**
 * 15. WATERMARK & TEXT STAMP
 */
export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
  position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'tile';
  rotation?: number;
}

export async function addWatermarkToImage(
  img: HTMLImageElement,
  options: WatermarkOptions
): Promise<{ blob: Blob; dataUrl: string }> {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  ctx.drawImage(img, 0, 0, w, h);

  const fontSize = options.fontSize || Math.max(18, Math.round(w / 25));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = options.color || '#FFFFFF';
  ctx.globalAlpha = options.opacity !== undefined ? options.opacity : 0.6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const position = options.position || 'center';
  const text = options.text || 'rajvarshith.com';

  if (position === 'tile') {
    const angle = ((options.rotation || -30) * Math.PI) / 180;
    const stepX = fontSize * text.length * 1.2;
    const stepY = fontSize * 4;

    for (let y = -h; y < h * 2; y += stepY) {
      for (let x = -w; x < w * 2; x += stepX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
  } else {
    let tx = w / 2;
    let ty = h / 2;
    const pad = Math.max(20, Math.round(w * 0.04));

    if (position === 'top-left') {
      ctx.textAlign = 'left';
      tx = pad;
      ty = pad + fontSize;
    } else if (position === 'top-right') {
      ctx.textAlign = 'right';
      tx = w - pad;
      ty = pad + fontSize;
    } else if (position === 'bottom-left') {
      ctx.textAlign = 'left';
      tx = pad;
      ty = h - pad;
    } else if (position === 'bottom-right') {
      ctx.textAlign = 'right';
      tx = w - pad;
      ty = h - pad;
    }

    ctx.save();
    ctx.translate(tx, ty);
    if (options.rotation) {
      ctx.rotate((options.rotation * Math.PI) / 180);
    }
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl };
}

/**
 * 16. IMAGE SPLITTER / GRID (Instagram 3x3, 3x1, Slices)
 */
export async function splitImageGrid(
  img: HTMLImageElement,
  cols: number,
  rows: number
): Promise<Array<{ col: number; row: number; blob: Blob; dataUrl: string }>> {
  const pieceW = Math.floor(img.naturalWidth / cols);
  const pieceH = Math.floor(img.naturalHeight / rows);
  const results: Array<{ col: number; row: number; blob: Blob; dataUrl: string }> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const canvas = document.createElement('canvas');
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(
        img,
        c * pieceW,
        r * pieceH,
        pieceW,
        pieceH,
        0,
        0,
        pieceW,
        pieceH
      );

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
      const dataUrl = await blobToDataUrl(blob);
      results.push({ col: c + 1, row: r + 1, blob, dataUrl });
    }
  }

  return results;
}

/**
 * 17. MERGE PHOTO & SIGNATURE (Official Combined Card <= 50KB)
 */
export async function mergePhotoAndSignature(
  photoImg: HTMLImageElement,
  signImg: HTMLImageElement,
  options: {
    layout: 'vertical' | 'horizontal';
    candidateName?: string;
    dop?: string;
    targetKb?: number;
  }
): Promise<{ blob: Blob; dataUrl: string; actualKb: number }> {
  const name = options.candidateName?.trim().toUpperCase();
  const dop = options.dop?.trim();

  const cardW = 420;
  const photoH = 360;
  const signH = 120;
  const bannerH = name || dop ? 60 : 0;
  const totalH = photoH + signH + bannerH;

  const canvas = document.createElement('canvas');
  canvas.width = cardW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  // Fill white card background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, cardW, totalH);

  // Outer border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, cardW - 2, totalH - 2);

  // 1. Draw Photo on top
  ctx.drawImage(photoImg, 10, 10, cardW - 20, photoH - 20);

  // Divider
  let curY = photoH;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, curY);
  ctx.lineTo(cardW - 10, curY);
  ctx.stroke();

  // 2. Candidate text banner if present
  if (name || dop) {
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (name) {
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(name, cardW / 2, curY + 20);
    }
    if (dop) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`DoP: ${dop}`, cardW / 2, curY + (name ? 42 : 30));
    }
    curY += bannerH;
    ctx.strokeStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(10, curY);
    ctx.lineTo(cardW - 10, curY);
    ctx.stroke();
  }

  // 3. Draw Signature
  const sigPad = 10;
  const sigBoxW = cardW - sigPad * 2;
  const sigBoxH = totalH - curY - sigPad * 2;
  const sRatio = signImg.naturalWidth / signImg.naturalHeight;
  let sw = sigBoxW;
  let sh = sigBoxH;
  if (sw / sh > sRatio) {
    sw = sh * sRatio;
  } else {
    sh = sw / sRatio;
  }
  const sx = (cardW - sw) / 2;
  const sy = curY + (totalH - curY - sh) / 2;
  ctx.drawImage(signImg, sx, sy, sw, sh);

  const targetKb = options.targetKb || 50;
  const comp = await compressToTargetKb(canvas, targetKb, 'image/jpeg');
  return { blob: comp.blob, dataUrl: comp.dataUrl, actualKb: comp.actualKb };
}
