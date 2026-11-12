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
 * Fast 3x3 unsharp mask convolution filter for canvas image data
 * Sharpens high-frequency details (eyes, facial hair, fine lines, text) after downscaling.
 */
function applyCanvasSharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number = 0.22) {
  if (width < 3 || height < 3) return;
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;
  const copy = new Uint8ClampedArray(d);
  const w4 = width * 4;

  for (let y = 1; y < height - 1; y++) {
    const row = y * w4;
    const rowAbove = (y - 1) * w4;
    const rowBelow = (y + 1) * w4;

    for (let x = 1; x < width - 1; x++) {
      const i = row + (x << 2);
      const iLeft = row + ((x - 1) << 2);
      const iRight = row + ((x + 1) << 2);
      const iUp = rowAbove + (x << 2);
      const iDown = rowBelow + (x << 2);

      for (let c = 0; c < 3; c++) {
        const orig = copy[i + c];
        const neighbors = copy[iLeft + c] + copy[iRight + c] + copy[iUp + c] + copy[iDown + c];
        d[i + c] = Math.max(0, Math.min(255, Math.round(orig * (1 + 4 * amount) - neighbors * amount)));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * 1. COMPRESS TO EXACT TARGET KB (Smart Dimension Scaling + High-Quality Encoding)
 * Strictly guarantees output <= targetKb while maintaining razor-sharp visual clarity.
 * For low targets (< 50KB), prevents severe JPEG block artifacts by maintaining quality >= 0.60
 * and applying adaptive bicubic scaling + unsharp masking.
 */
export async function compressToTargetKb(
  source: HTMLImageElement | HTMLCanvasElement,
  targetKb: number,
  mimeType: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): Promise<{ blob: Blob; dataUrl: string; actualKb: number; width: number; height: number }> {
  const targetBytes = targetKb * 1024;
  const srcW = 'naturalWidth' in source ? (source.naturalWidth || source.width) : source.width;
  const srcH = 'naturalHeight' in source ? (source.naturalHeight || source.height) : source.height;

  // Minimum quality floor: adapts for ultra-low target sizes (1KB, 2KB, 5KB) while preventing blurry block artifacts
  const minQuality = mimeType === 'image/webp'
    ? (targetKb <= 2 ? 0.45 : targetKb <= 5 ? 0.52 : 0.58)
    : (targetKb <= 2 ? 0.45 : targetKb <= 5 ? 0.52 : targetKb < 60 ? 0.60 : 0.65);
  const maxQuality = 0.92;

  // Clamp massive images to max 4096 px initial working size to prevent browser canvas OOM
  let curW = srcW;
  let curH = srcH;
  if (curW > 4096 || curH > 4096) {
    const scale = 4096 / Math.max(curW, curH);
    curW = Math.max(30, Math.round(curW * scale));
    curH = Math.max(30, Math.round(curH * scale));
  }

  // Estimate ideal initial dimensions to avoid trying full resolution at 5% quality
  if (targetKb < 80) {
    const bytesPerPixel = mimeType === 'image/webp' ? 0.08 : 0.11;
    const estPixels = targetBytes / bytesPerPixel;
    const aspect = srcW / srcH;
    const idealW = Math.round(Math.sqrt(estPixels * aspect));
    const minDim = targetKb <= 2 ? 16 : targetKb <= 5 ? 24 : 40;
    if (idealW < curW) {
      curW = Math.min(curW, Math.max(minDim, Math.round(idealW * 1.15)));
      curH = Math.max(minDim, Math.round((curW / srcW) * srcH));
    }
  }

  let bestBlob: Blob | null = null;
  let bestW = curW;
  let bestH = curH;

  for (let pass = 0; pass < 8; pass++) {
    const minCanvasDim = targetKb <= 2 ? 14 : targetKb <= 5 ? 18 : 20;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(minCanvasDim, Math.round(curW));
    canvas.height = Math.max(minCanvasDim, Math.round(curH));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not create canvas context');

    // High quality bicubic downsampling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    // Apply smart unsharp mask when downscaled to preserve crisp facial features & edges
    if (curW < srcW * 0.90) {
      applyCanvasSharpen(ctx, canvas.width, canvas.height, 0.20);
    }

    // Binary search quality between minQuality and maxQuality
    let lowQ = minQuality;
    let highQ = maxQuality;
    let localBestBlob: Blob | null = null;
    let localBestQ = -1;

    for (let qIter = 0; qIter < 6; qIter++) {
      const midQ = (lowQ + highQ) / 2;
      const b = await canvasToBlob(canvas, mimeType, midQ);

      if (b.size <= targetBytes) {
        localBestBlob = b;
        localBestQ = midQ;
        lowQ = midQ; // try higher quality
      } else {
        highQ = midQ; // need lower quality
      }
    }

    if (localBestBlob && localBestBlob.size <= targetBytes && localBestQ >= minQuality) {
      bestBlob = localBestBlob;
      bestW = curW;
      bestH = curH;
      // If we achieved a good fit (within 25% of target) or quality is solid, stop
      if (localBestBlob.size >= targetBytes * 0.72 || localBestQ >= 0.70) {
        break;
      }
    }

    // Check if even minQuality is still slightly too large
    const testMinBlob = await canvasToBlob(canvas, mimeType, minQuality);
    if (testMinBlob.size > targetBytes) {
      // Need to scale dimensions down proportionally to guarantee targetBytes with high quality
      const scaleRatio = Math.max(0.40, Math.min(0.92, Math.sqrt(targetBytes / testMinBlob.size) * 0.98));
      const minClamp = targetKb <= 2 ? 14 : targetKb <= 5 ? 18 : 24;
      curW = Math.max(minClamp, Math.round(curW * scaleRatio));
      curH = Math.max(minClamp, Math.round((curW / srcW) * srcH));
    } else {
      if (!bestBlob) {
        bestBlob = testMinBlob;
        bestW = curW;
        bestH = curH;
      }
      break;
    }
  }

  // Safety fallback: guaranteed strictly <= targetBytes while preserving sharpness
  if (!bestBlob || bestBlob.size > targetBytes) {
    let fW = Math.min(curW, 300);
    const minFinal = targetKb <= 2 ? 10 : targetKb <= 5 ? 16 : 20;
    for (let fPass = 0; fPass < 8; fPass++) {
      const fCanvas = document.createElement('canvas');
      fCanvas.width = Math.max(minFinal, Math.round(fW));
      fCanvas.height = Math.max(minFinal, Math.round((fW / srcW) * srcH));
      const fCtx = fCanvas.getContext('2d');
      if (!fCtx) break;
      fCtx.imageSmoothingEnabled = true;
      fCtx.imageSmoothingQuality = 'high';
      if (mimeType === 'image/jpeg') {
        fCtx.fillStyle = '#FFFFFF';
        fCtx.fillRect(0, 0, fCanvas.width, fCanvas.height);
      }
      fCtx.drawImage(source, 0, 0, fCanvas.width, fCanvas.height);
      applyCanvasSharpen(fCtx, fCanvas.width, fCanvas.height, 0.25);
      const b = await canvasToBlob(fCanvas, mimeType, minQuality);
      bestBlob = b;
      bestW = fCanvas.width;
      bestH = fCanvas.height;
      if (b.size <= targetBytes) {
        break;
      }
      fW = Math.max(minFinal, Math.round(fW * 0.75));
    }
  }

  if (!bestBlob) {
    throw new Error('Image compression failed to meet target constraints');
  }

  const dataUrl = await blobToDataUrl(bestBlob);
  const actualKb = Math.round((bestBlob.size / 1024) * 100) / 100;
  return {
    blob: bestBlob,
    dataUrl,
    actualKb,
    width: Math.round(bestW),
    height: Math.round(bestH),
  };
}

// PNG CRC32 table & calculator
const pngCrcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function calcPngCrc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ pngCrcTable[(c ^ bytes[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Safely pads JPEG file with standard COM (0xFF 0xFE) segments before EOI (0xFF 0xD9).
 * Fully compliant with Pillow, libjpeg, and strict portal validators.
 */
function padJpegWithComments(originalBytes: ArrayBuffer, targetBytes: number): Uint8Array {
  const orig = new Uint8Array(originalBytes);
  let eoiIdx = orig.length - 2;
  while (eoiIdx > 0 && !(orig[eoiIdx] === 0xff && orig[eoiIdx + 1] === 0xd9)) {
    eoiIdx--;
  }
  if (eoiIdx <= 0) {
    const padded = new Uint8Array(targetBytes);
    padded.set(orig, 0);
    return padded;
  }

  const needed = targetBytes - orig.length;
  if (needed <= 4) return orig;

  const chunks: Uint8Array[] = [];
  let remaining = needed;
  while (remaining > 0) {
    const segLen = Math.min(65535, remaining);
    if (segLen < 4) {
      const com = new Uint8Array([0xff, 0xfe, 0x00, 0x02]);
      chunks.push(com);
      break;
    }
    const com = new Uint8Array(segLen);
    com[0] = 0xff;
    com[1] = 0xfe;
    const paramLen = segLen - 2;
    com[2] = (paramLen >> 8) & 0xff;
    com[3] = paramLen & 0xff;
    com.fill(0x20, 4);
    chunks.push(com);
    remaining -= segLen;
  }

  const totalComLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(orig.length + totalComLen);
  out.set(orig.subarray(0, eoiIdx), 0);
  let offset = eoiIdx;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  out.set(orig.subarray(eoiIdx), offset);
  return out;
}

/**
 * Safely pads PNG file with a standard tEXt chunk before IEND.
 * Fully valid according to W3C PNG specification.
 */
function padPngWithTextChunk(originalBytes: ArrayBuffer, targetBytes: number): Uint8Array {
  const orig = new Uint8Array(originalBytes);
  // Look for IEND chunk (last 12 bytes or search from end)
  let iendPos = orig.length - 12;
  while (
    iendPos > 0 &&
    !(
      orig[iendPos + 4] === 0x49 &&
      orig[iendPos + 5] === 0x45 &&
      orig[iendPos + 6] === 0x4e &&
      orig[iendPos + 7] === 0x44
    )
  ) {
    iendPos--;
  }

  if (iendPos <= 0) {
    const padded = new Uint8Array(targetBytes);
    padded.set(orig, 0);
    return padded;
  }

  const needed = targetBytes - orig.length;
  if (needed <= 12) return orig;

  const dataLen = needed - 12;
  const chunk = new Uint8Array(needed);
  // Length (4 bytes big-endian)
  chunk[0] = (dataLen >> 24) & 0xff;
  chunk[1] = (dataLen >> 16) & 0xff;
  chunk[2] = (dataLen >> 8) & 0xff;
  chunk[3] = dataLen & 0xff;
  // Type: 'tEXt'
  chunk[4] = 0x74;
  chunk[5] = 0x45;
  chunk[6] = 0x58;
  chunk[7] = 0x74;

  // Keyword 'Comment\0'
  const keyword = [0x43, 0x6f, 0x6d, 0x6d, 0x65, 0x6e, 0x74, 0x00];
  const payloadOffset = 8;
  for (let i = 0; i < Math.min(keyword.length, dataLen); i++) {
    chunk[payloadOffset + i] = keyword[i];
  }
  for (let i = keyword.length; i < dataLen; i++) {
    chunk[payloadOffset + i] = 0x20; // space fill
  }

  // Calculate CRC over Type (4 bytes) + Data (dataLen bytes)
  const crcTarget = chunk.subarray(4, 4 + 4 + dataLen);
  const crc = calcPngCrc32(crcTarget);
  const crcOffset = 8 + dataLen;
  chunk[crcOffset] = (crc >> 24) & 0xff;
  chunk[crcOffset + 1] = (crc >> 16) & 0xff;
  chunk[crcOffset + 2] = (crc >> 8) & 0xff;
  chunk[crcOffset + 3] = crc & 0xff;

  const out = new Uint8Array(orig.length + needed);
  out.set(orig.subarray(0, iendPos), 0);
  out.set(chunk, iendPos);
  out.set(orig.subarray(iendPos), iendPos + needed);
  return out;
}

/**
 * 2. INCREASE IMAGE SIZE IN KB (Safe non-destructive metadata padding for rigid minimum portal limits)
 */
export async function increaseImageSizeKb(
  file: File,
  targetKb: number
): Promise<{ blob: Blob; dataUrl: string; actualKb: number }> {
  const targetBytes = targetKb * 1024;
  const originalBytes = await file.arrayBuffer();

  const mime = file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

  if (originalBytes.byteLength >= targetBytes) {
    const b = new Blob([originalBytes], { type: mime });
    return {
      blob: b,
      dataUrl: await blobToDataUrl(b),
      actualKb: Math.round((b.size / 1024) * 10) / 10,
    };
  }

  let finalBuffer: Uint8Array;
  if (mime === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    finalBuffer = padPngWithTextChunk(originalBytes, targetBytes);
  } else {
    finalBuffer = padJpegWithComments(originalBytes, targetBytes);
  }

  const finalBlob = new Blob([finalBuffer as BlobPart], { type: mime });
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
  // Clamp dimensions safely between 10px and 8000px to prevent tab crash on extreme inputs
  const targetW = Math.min(8000, Math.max(10, convertUnitsToPixels(options.width, options.unit, dpi)));
  const targetH = Math.min(8000, Math.max(10, convertUnitsToPixels(options.height, options.unit, dpi)));
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
  } else if (format === 'image/png' && dpi) {
    rawBlob = await injectPngDpi(rawBlob, dpi);
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
  country: 'india' | 'us' | 'uk' | 'eu' | 'australia' | 'canada' | 'custom';
  widthMm?: number;
  heightMm?: number;
  bgColor?: string; // e.g. '#FFFFFF', '#E0F2FE' (light blue), '#FEE2E2' (light red), '#F3F4F6' (light grey)
  crop?: ImageCropRect;
  dpi?: number;
  zoom?: number;
  panX?: number;
  panY?: number;
  rotation?: number; // rotation in degrees (-45 to +45)
  candidateName?: string;
  dateOfPhoto?: string;
}

export const PASSPORT_SPECS = {
  india: { name: 'India (Official / Passport / Visa / SSC)', widthMm: 35, heightMm: 45, dpi: 300 },
  us: { name: 'United States (Visa / Passport 2x2 in)', widthMm: 50.8, heightMm: 50.8, dpi: 300 },
  uk: { name: 'United Kingdom (Standard 35x45 mm)', widthMm: 35, heightMm: 45, dpi: 300 },
  eu: { name: 'Schengen / European Union (35x45 mm)', widthMm: 35, heightMm: 45, dpi: 300 },
  australia: { name: 'Australia (Passport 35x45 mm)', widthMm: 35, heightMm: 45, dpi: 300 },
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

  // Draw Candidate Name & Date of Photo banner if specified
  if (options.candidateName?.trim() || options.dateOfPhoto?.trim()) {
    const bannerH = Math.max(36, Math.round(hPx * 0.16));
    const bannerY = hPx - bannerH;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, bannerY, wPx, bannerH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, bannerY);
    ctx.lineTo(wPx, bannerY);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(11, Math.round(bannerH * 0.32));
    ctx.font = `bold ${fontSize}px sans-serif`;

    const name = options.candidateName?.trim().toUpperCase();
    const dop = options.dateOfPhoto?.trim();

    if (name && dop) {
      ctx.fillText(name, wPx / 2, bannerY + bannerH * 0.35);
      ctx.font = `${Math.max(10, fontSize - 1)}px sans-serif`;
      ctx.fillStyle = '#475569';
      ctx.fillText(`DoP: ${dop}`, wPx / 2, bannerY + bannerH * 0.72);
    } else if (name) {
      ctx.fillText(name, wPx / 2, bannerY + bannerH * 0.5);
    } else if (dop) {
      ctx.fillText(`DoP: ${dop}`, wPx / 2, bannerY + bannerH * 0.5);
    }
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

  const photoAspect = (photoImg.naturalWidth || 35) / (photoImg.naturalHeight || 45);
  // Base height standard ~45mm (531 px at 300 DPI)
  let pHeight = Math.round((45 / 25.4) * dpi);
  let pWidth = Math.round(pHeight * photoAspect);

  // If grid cells would exceed sheet bounds, scale down gracefully to fit paper with margins
  const maxCellW = Math.floor((sheetW - (cols + 1) * 20) / cols);
  const maxCellH = Math.floor((sheetH - (rows + 1) * 20) / rows);
  if (pWidth > maxCellW || pHeight > maxCellH) {
    const scale = Math.min(maxCellW / pWidth, maxCellH / pHeight);
    pWidth = Math.round(pWidth * scale);
    pHeight = Math.round(pHeight * scale);
  }

  const totalGridW = cols * pWidth;
  const totalGridH = rows * pHeight;
  const gapX = Math.max(15, Math.floor((sheetW - totalGridW) / (cols + 1)));
  const gapY = Math.max(15, Math.floor((sheetH - totalGridH) / (rows + 1)));

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
  minKb?: number; // minimum portal limit (typically 10KB for UPSC/SSC)
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

  // If a minKb constraint is specified (e.g. portals requiring min 10KB),
  // safely pad with standard JPEG COM markers up to minKb without exceeding targetKb.
  const minKb = options.minKb !== undefined ? options.minKb : 0;
  if (minKb > 0 && minKb < targetKb && result.blob.size < minKb * 1024) {
    const origBuffer = await result.blob.arrayBuffer();
    const safeTargetBytes = Math.min(targetKb * 1024, Math.round(minKb * 1024 * 1.05));
    const padded = padJpegWithComments(origBuffer, safeTargetBytes);
    const safeBlob = new Blob([padded as BlobPart], { type: 'image/jpeg' });
    return {
      blob: safeBlob,
      dataUrl: await blobToDataUrl(safeBlob),
      actualKb: Math.round((safeBlob.size / 1024) * 10) / 10,
    };
  }

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

  const hasName = Boolean(name.trim());
  const hasDate = Boolean(dateStr.trim());

  if (hasName && hasDate) {
    const line1Y = boxY + boxHeight * 0.35;
    const line2Y = boxY + boxHeight * 0.72;
    ctx.fillText(name.trim().toUpperCase(), w / 2, line1Y);
    ctx.font = `${Math.max(12, baseFontSize - 2)}px sans-serif`;
    ctx.fillText(`DoP: ${dateStr.trim()}`, w / 2, line2Y);
  } else if (hasName) {
    ctx.fillText(name.trim().toUpperCase(), w / 2, boxY + boxHeight * 0.5);
  } else if (hasDate) {
    ctx.fillText(`DoP: ${dateStr.trim()}`, w / 2, boxY + boxHeight * 0.5);
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

    // Scale down proportionally if exceeding canvas limits
    if (totalW > 16384 || totalH > 16384) {
      const s = 16384 / Math.max(totalW, totalH);
      totalW = Math.round(totalW * s);
      totalH = Math.round(totalH * s);
    }

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context for joined images');
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

    // Scale down proportionally if exceeding canvas limits
    if (totalW > 16384 || totalH > 16384) {
      const s = 16384 / Math.max(totalW, totalH);
      totalW = Math.round(totalW * s);
      totalH = Math.round(totalH * s);
    }

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context for joined images');
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

/**
 * 9b. DPI INJECTION FOR PNG (pHYs Chunk)
 * Embeds physical pixel dimensions (DPI converted to pixels per meter).
 */
export async function injectPngDpi(blob: Blob, dpi: number): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Check PNG Signature (89 50 4E 47 0D 0A 1A 0A)
  if (
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return blob;
  }

  // End of IHDR chunk is byte 33 (8 magic + 4 len + 4 type + 13 data + 4 crc)
  const ihdrEnd = 33;
  if (bytes.length < ihdrEnd) return blob;

  // Pixels per meter (1 inch = 0.0254 meters)
  const ppm = Math.round(dpi / 0.0254);

  // Scan for existing pHYs chunk
  let pos = 8; // skip 8-byte signature
  let physPos = -1;
  while (pos + 12 <= bytes.length) {
    const chunkLen = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
    const isPhys =
      bytes[pos + 4] === 0x70 &&
      bytes[pos + 5] === 0x48 &&
      bytes[pos + 6] === 0x59 &&
      bytes[pos + 7] === 0x73;
    if (isPhys && chunkLen === 9) {
      physPos = pos;
      break;
    }
    pos += 12 + chunkLen;
  }

  if (physPos !== -1) {
    // Update existing pHYs chunk in-place
    const out = new Uint8Array(bytes);
    out[physPos + 8] = (ppm >> 24) & 0xff;
    out[physPos + 9] = (ppm >> 16) & 0xff;
    out[physPos + 10] = (ppm >> 8) & 0xff;
    out[physPos + 11] = ppm & 0xff;
    out[physPos + 12] = (ppm >> 24) & 0xff;
    out[physPos + 13] = (ppm >> 16) & 0xff;
    out[physPos + 14] = (ppm >> 8) & 0xff;
    out[physPos + 15] = ppm & 0xff;
    out[physPos + 16] = 1;
    const crc = calcPngCrc32(out.subarray(physPos + 4, physPos + 17));
    out[physPos + 17] = (crc >> 24) & 0xff;
    out[physPos + 18] = (crc >> 16) & 0xff;
    out[physPos + 19] = (crc >> 8) & 0xff;
    out[physPos + 20] = crc & 0xff;
    return new Blob([out], { type: 'image/png' });
  }

  const physChunk = new Uint8Array(21);
  // Length: 9 (4 bytes)
  physChunk[0] = 0;
  physChunk[1] = 0;
  physChunk[2] = 0;
  physChunk[3] = 9;
  // Type: 'pHYs'
  physChunk[4] = 0x70;
  physChunk[5] = 0x48;
  physChunk[6] = 0x59;
  physChunk[7] = 0x73;
  // X pixels per meter (4 bytes)
  physChunk[8] = (ppm >> 24) & 0xff;
  physChunk[9] = (ppm >> 16) & 0xff;
  physChunk[10] = (ppm >> 8) & 0xff;
  physChunk[11] = ppm & 0xff;
  // Y pixels per meter (4 bytes)
  physChunk[12] = (ppm >> 24) & 0xff;
  physChunk[13] = (ppm >> 16) & 0xff;
  physChunk[14] = (ppm >> 8) & 0xff;
  physChunk[15] = ppm & 0xff;
  // Unit: 1 = meter
  physChunk[16] = 1;

  // CRC32 over Type (4 bytes) + Data (9 bytes)
  const crc = calcPngCrc32(physChunk.subarray(4, 17));
  physChunk[17] = (crc >> 24) & 0xff;
  physChunk[18] = (crc >> 16) & 0xff;
  physChunk[19] = (crc >> 8) & 0xff;
  physChunk[20] = crc & 0xff;

  const out = new Uint8Array(bytes.length + physChunk.length);
  out.set(bytes.subarray(0, ihdrEnd), 0);
  out.set(physChunk, ihdrEnd);
  out.set(bytes.subarray(ihdrEnd), ihdrEnd + physChunk.length);

  return new Blob([out], { type: 'image/png' });
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
  setTimeout(() => URL.revokeObjectURL(url), 2000);
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

  // Fill white canvas background to prevent black corner artifacts in JPEG output
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, newW, newH);

  ctx.translate(newW / 2, newH / 2);
  // Apply visual screen-space flip before rotation
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.rotate(rad);
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

  // Always initialize background to white (or border color) to prevent black artifacts on transparent images
  ctx.fillStyle = (borderWidth > 0 || padding > 0) ? (options.border?.color || '#FFFFFF') : '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

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
  text?: string;
  logoImg?: HTMLImageElement;
  logoScale?: number; // e.g. 0.20 (20% of image width)
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

  const opacity = options.opacity !== undefined ? options.opacity : 0.6;
  ctx.globalAlpha = opacity;

  const position = options.position || 'center';

  // 1. Image Logo Watermark
  if (options.logoImg) {
    const logo = options.logoImg;
    const lAspect = (logo.naturalWidth || 1) / (logo.naturalHeight || 1);
    const scale = Math.max(0.05, Math.min(0.8, options.logoScale || 0.22));
    const lw = Math.round(w * scale);
    const lh = Math.round(lw / lAspect);
    const pad = Math.max(15, Math.round(w * 0.04));

    if (position === 'tile') {
      const angle = ((options.rotation || -25) * Math.PI) / 180;
      const stepX = Math.max(lw * 1.5, 120);
      const stepY = Math.max(lh * 1.5, 100);

      for (let y = -h; y < h * 2; y += stepY) {
        for (let x = -w; x < w * 2; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
          ctx.restore();
        }
      }
    } else {
      let tx = w / 2;
      let ty = h / 2;

      if (position === 'top-left') {
        tx = pad + lw / 2;
        ty = pad + lh / 2;
      } else if (position === 'top-right') {
        tx = w - pad - lw / 2;
        ty = pad + lh / 2;
      } else if (position === 'bottom-left') {
        tx = pad + lw / 2;
        ty = h - pad - lh / 2;
      } else if (position === 'bottom-right') {
        tx = w - pad - lw / 2;
        ty = h - pad - lh / 2;
      }

      ctx.save();
      ctx.translate(tx, ty);
      if (options.rotation) {
        ctx.rotate((options.rotation * Math.PI) / 180);
      }
      ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
      ctx.restore();
    }
  }

  // 2. Text Watermark
  const text = (options.text !== undefined ? options.text : '').trim();
  if (text.length > 0) {
    const fontSize = options.fontSize || Math.max(18, Math.round(w / 25));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = options.color || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (position === 'tile') {
      const angle = ((options.rotation || -30) * Math.PI) / 180;
      // Guard stepX and stepY to prevent infinite loop or browser freeze
      const stepX = Math.max(80, fontSize * text.length * 1.2);
      const stepY = Math.max(50, fontSize * 4);

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
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const results: Array<{ col: number; row: number; blob: Blob; dataUrl: string }> = [];

  for (let r = 0; r < rows; r++) {
    const y1 = Math.round((r * nh) / rows);
    const y2 = Math.round(((r + 1) * nh) / rows);
    const pieceH = Math.max(1, y2 - y1);

    for (let c = 0; c < cols; c++) {
      const x1 = Math.round((c * nw) / cols);
      const x2 = Math.round(((c + 1) * nw) / cols);
      const pieceW = Math.max(1, x2 - x1);

      const canvas = document.createElement('canvas');
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(
        img,
        x1,
        y1,
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

  if (options.layout === 'horizontal') {
    const cardW = 680;
    const cardH = 340;
    const canvas = document.createElement('canvas');
    canvas.width = cardW;
    canvas.height = cardH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cardW, cardH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, cardW - 2, cardH - 2);

    // Left: Photo (270 x 320)
    const photoBoxW = 270;
    const photoBoxH = cardH - 20;
    const pw = photoImg.naturalWidth;
    const ph = photoImg.naturalHeight;
    const pAspect = pw / ph;
    const boxAspect = photoBoxW / photoBoxH;
    let cropSx = 0, cropSy = 0, cropSW = pw, cropSH = ph;
    if (pAspect > boxAspect) {
      cropSW = ph * boxAspect;
      cropSx = (pw - cropSW) / 2;
    } else {
      cropSH = pw / boxAspect;
      cropSy = (ph - cropSH) / 2;
    }
    ctx.drawImage(photoImg, cropSx, cropSy, cropSW, cropSH, 10, 10, photoBoxW, photoBoxH);

    // Vertical Divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(290, 10);
    ctx.lineTo(290, cardH - 10);
    ctx.stroke();

    // Right side: Info and Signature
    const rightX = 300;
    const rightW = cardW - rightX - 10;
    let curY = 15;

    if (name || dop) {
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (name) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(name, rightX + rightW / 2, curY + 20);
        curY += 38;
      }
      if (dop) {
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`DoP: ${dop}`, rightX + rightW / 2, curY + (name ? 10 : 20));
        curY += 28;
      }
      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(rightX + 10, curY);
      ctx.lineTo(cardW - 20, curY);
      ctx.stroke();
      curY += 10;
    }

    // Signature on right
    const sigPad = 10;
    const sigBoxW = rightW - sigPad * 2;
    const sigBoxH = cardH - curY - sigPad * 2;
    const sRatio = signImg.naturalWidth / signImg.naturalHeight;
    let sw = sigBoxW;
    let sh = sigBoxH;
    if (sw / sh > sRatio) {
      sw = sh * sRatio;
    } else {
      sh = sw / sRatio;
    }
    const sigX = rightX + (rightW - sw) / 2;
    const sigY = curY + (sigBoxH - sh) / 2;
    ctx.drawImage(signImg, sigX, sigY, sw, sh);

    const targetKb = options.targetKb || 50;
    const comp = await compressToTargetKb(canvas, targetKb, 'image/jpeg');
    return { blob: comp.blob, dataUrl: comp.dataUrl, actualKb: comp.actualKb };
  }

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

  // 1. Draw Photo on top with aspect ratio cover (no squashing/stretching of face)
  const boxX = 10;
  const boxY = 10;
  const boxW = cardW - 20;
  const boxH = photoH - 20;
  const pw = photoImg.naturalWidth;
  const ph = photoImg.naturalHeight;
  const pAspect = pw / ph;
  const boxAspect = boxW / boxH;

  let cropSx = 0, cropSy = 0, cropSW = pw, cropSH = ph;
  if (pAspect > boxAspect) {
    // Wider than frame: crop horizontal edges
    cropSW = ph * boxAspect;
    cropSx = (pw - cropSW) / 2;
  } else {
    // Taller than frame: crop vertical edges slightly
    cropSH = pw / boxAspect;
    cropSy = (ph - cropSH) / 2;
  }
  ctx.drawImage(photoImg, cropSx, cropSy, cropSW, cropSH, boxX, boxY, boxW, boxH);

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
  const sigX = (cardW - sw) / 2;
  const sigY = curY + (totalH - curY - sh) / 2;
  ctx.drawImage(signImg, sigX, sigY, sw, sh);

  const targetKb = options.targetKb || 50;
  const comp = await compressToTargetKb(canvas, targetKb, 'image/jpeg');
  return { blob: comp.blob, dataUrl: comp.dataUrl, actualKb: comp.actualKb };
}

/**
 * 11. ADVANCED BACKGROUND REMOVAL & TRANSPARENT CUTOUT ENGINE
 */
export interface BgRemovalOptions {
  targetColor?: { r: number; g: number; b: number };
  seedPoint?: { x: number; y: number };
  tolerance?: number; // 0 to 100 (percentage)
  feather?: number; // 0 to 10 (pixels)
  contiguous?: boolean; // flood-fill from borders vs global key
  defringe?: boolean; // remove edge color halos
  brushMask?: Uint8Array; // 0 = untouched, 1 = erased, 2 = restored
  backgroundColor?: string; // 'transparent' or hex color e.g. '#FFFFFF'
}

export function processBackgroundRemoval(
  source: HTMLImageElement | HTMLCanvasElement,
  options: BgRemovalOptions = {}
): HTMLCanvasElement {
  const w = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const h = 'naturalHeight' in source ? source.naturalHeight : source.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas context');

  // Draw source image
  ctx.drawImage(source, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Determine target background color (auto-sample corners if not explicitly provided)
  let tr = 255, tg = 255, tb = 255;
  if (options.targetColor) {
    tr = options.targetColor.r;
    tg = options.targetColor.g;
    tb = options.targetColor.b;
  } else {
    // Sample 4 corners and borders to auto-detect background
    const sampleCoords = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
      [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1],
    ];
    let sumR = 0, sumG = 0, sumB = 0, validSamples = 0;
    for (const [sx, sy] of sampleCoords) {
      const idx = (sy * w + sx) * 4;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      validSamples++;
    }
    tr = Math.round(sumR / validSamples);
    tg = Math.round(sumG / validSamples);
    tb = Math.round(sumB / validSamples);
  }

  const tolerance = Math.max(1, Math.min(100, options.tolerance ?? 25));
  const feather = Math.max(0, Math.min(15, options.feather ?? 2));
  const contiguous = options.contiguous !== false;
  const defringe = options.defringe !== false;
  const brushMask = options.brushMask;

  // Compute color distance function (normalized 0 to 100)
  const calcDist = (r: number, g: number, b: number): number => {
    const dr = r - tr;
    const dg = g - tg;
    const db = b - tb;
    return (Math.sqrt(dr * dr + dg * dg + db * db) / 441.67) * 100;
  };

  const isBg = new Uint8Array(w * h); // 0 = fg, 1 = bg

  if (contiguous) {
    // Breadth-first flood fill from all perimeter pixels matching target color
    const queue = new Int32Array(w * h);
    let qHead = 0;
    let qTail = 0;

    const pushBorder = (x: number, y: number) => {
      const pIdx = y * w + x;
      if (isBg[pIdx] === 0) {
        const dIdx = pIdx * 4;
        if (calcDist(data[dIdx], data[dIdx + 1], data[dIdx + 2]) <= tolerance) {
          isBg[pIdx] = 1;
          queue[qTail++] = pIdx;
        }
      }
    };

    if (options.seedPoint) {
      const sx = Math.max(0, Math.min(w - 1, options.seedPoint.x));
      const sy = Math.max(0, Math.min(h - 1, options.seedPoint.y));
      pushBorder(sx, sy);
    }

    // Smart perimeter seeding:
    // Always seed top border (background is almost always at top of image)
    for (let x = 0; x < w; x++) {
      pushBorder(x, 0);
    }
    // Seed sides down to 70% height (avoids torso/clothes touching lower borders)
    const maxSideY = Math.floor(h * 0.7);
    for (let y = 1; y < maxSideY; y++) {
      pushBorder(0, y);
      pushBorder(w - 1, y);
    }
    // Only seed bottom border pixels if they match target color with strict tolerance
    for (let x = 0; x < w; x++) {
      const pIdx = (h - 1) * w + x;
      const dIdx = pIdx * 4;
      if (calcDist(data[dIdx], data[dIdx + 1], data[dIdx + 2]) <= tolerance * 0.75) {
        pushBorder(x, h - 1);
      }
    }

    while (qHead < qTail) {
      const cur = queue[qHead++];
      const cx = cur % w;
      const cy = Math.floor(cur / w);

      // Check 4 neighbors
      const neighbors = [
        cx > 0 ? cur - 1 : -1,
        cx < w - 1 ? cur + 1 : -1,
        cy > 0 ? cur - w : -1,
        cy < h - 1 ? cur + w : -1,
      ];

      const cIdx = cur * 4;
      const maxStep = Math.max(8, tolerance * 0.45);

      for (const n of neighbors) {
        if (n !== -1 && isBg[n] === 0) {
          const dIdx = n * 4;
          const distToTarget = calcDist(data[dIdx], data[dIdx + 1], data[dIdx + 2]);
          const stepDr = data[dIdx] - data[cIdx];
          const stepDg = data[dIdx + 1] - data[cIdx + 1];
          const stepDb = data[dIdx + 2] - data[cIdx + 2];
          const stepDist = (Math.sqrt(stepDr * stepDr + stepDg * stepDg + stepDb * stepDb) / 441.67) * 100;

          if (distToTarget <= tolerance && stepDist <= maxStep) {
            isBg[n] = 1;
            queue[qTail++] = n;
          }
        }
      }
    }
  } else {
    // Global color keying
    for (let i = 0; i < w * h; i++) {
      const dIdx = i * 4;
      if (calcDist(data[dIdx], data[dIdx + 1], data[dIdx + 2]) <= tolerance) {
        isBg[i] = 1;
      }
    }
  }

  // Soft feathering and alpha calculation
  const tolMin = Math.max(0, tolerance - feather);
  const tolMax = tolerance + feather;
  const tolRange = Math.max(1, tolMax - tolMin);

  for (let i = 0; i < w * h; i++) {
    const dIdx = i * 4;

    // Check manual brush mask first (1 = force erased, 2 = force restored)
    if (brushMask && brushMask[i] === 1) {
      data[dIdx + 3] = 0;
      continue;
    }
    if (brushMask && brushMask[i] === 2) {
      // Retain full original opacity
      data[dIdx + 3] = 255;
      continue;
    }

    if (isBg[i] === 1) {
      const dist = calcDist(data[dIdx], data[dIdx + 1], data[dIdx + 2]);
      if (dist <= tolMin) {
        data[dIdx + 3] = 0; // Pure transparent
      } else {
        // Smooth transition zone
        const alphaFraction = (dist - tolMin) / tolRange;
        const newAlpha = Math.round(Math.max(0, Math.min(255, alphaFraction * 255)));
        data[dIdx + 3] = newAlpha;

        // De-fringe halo on edge pixels
        if (defringe && newAlpha > 0 && newAlpha < 255) {
          const aFac = newAlpha / 255;
          data[dIdx] = Math.max(0, Math.min(255, (data[dIdx] - tr * (1 - aFac)) / aFac));
          data[dIdx + 1] = Math.max(0, Math.min(255, (data[dIdx + 1] - tg * (1 - aFac)) / aFac));
          data[dIdx + 2] = Math.max(0, Math.min(255, (data[dIdx + 2] - tb * (1 - aFac)) / aFac));
        }
      }
    }
  }

  // Put modified pixel data back
  ctx.putImageData(imgData, 0, 0);

  // If a solid background color is requested (instead of transparent), render on a colored canvas
  const bg = options.backgroundColor;
  if (bg && bg !== 'transparent') {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');
    if (outCtx) {
      outCtx.fillStyle = bg;
      outCtx.fillRect(0, 0, w, h);
      outCtx.drawImage(canvas, 0, 0);
      return outCanvas;
    }
  }

  return canvas;
}

/**
 * 12. TRANSPARENT PNG MAKER ENGINE
 */
export interface PngMakerOptions {
  mode: 'white' | 'black' | 'custom' | 'signature';
  customColor?: { r: number; g: number; b: number };
  seedPoint?: { x: number; y: number };
  tolerance: number; // 0 to 100
  feather: number; // 0 to 10
  contiguous: boolean;
  defringe: boolean;
}

export function processPngMaker(
  source: HTMLImageElement | HTMLCanvasElement,
  options: PngMakerOptions
): HTMLCanvasElement {
  let targetColor = { r: 255, g: 255, b: 255 };

  if (options.mode === 'white' || options.mode === 'signature') {
    targetColor = { r: 255, g: 255, b: 255 };
  } else if (options.mode === 'black') {
    targetColor = { r: 0, g: 0, b: 0 };
  } else if (options.mode === 'custom' && options.customColor) {
    targetColor = options.customColor;
  }

  // If signature mode, apply paper contrast boosting first before transparency
  if (options.mode === 'signature') {
    const w = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const h = 'naturalHeight' in source ? source.naturalHeight : source.height;
    const tempC = document.createElement('canvas');
    tempC.width = w;
    tempC.height = h;
    const tempCtx = tempC.getContext('2d', { willReadFrequently: true });
    if (tempCtx) {
      tempCtx.drawImage(source, 0, 0);
      const imgData = tempCtx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (lum > 210) {
          // Push near-white paper shadows to pure white for 100% clean cutout
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        } else {
          // Darken ink for crisp signature
          const inkFactor = Math.max(0, lum - 30);
          d[i] = Math.min(d[i], inkFactor);
          d[i + 1] = Math.min(d[i + 1], inkFactor);
          d[i + 2] = Math.min(d[i + 2], inkFactor);
        }
      }
      tempCtx.putImageData(imgData, 0, 0);
      return processBackgroundRemoval(tempC, {
        targetColor: { r: 255, g: 255, b: 255 },
        seedPoint: options.seedPoint,
        tolerance: options.tolerance,
        feather: options.feather,
        contiguous: options.contiguous,
        defringe: options.defringe,
        backgroundColor: 'transparent',
      });
    }
  }

  return processBackgroundRemoval(source, {
    targetColor,
    seedPoint: options.seedPoint,
    tolerance: options.tolerance,
    feather: options.feather,
    contiguous: options.contiguous,
    defringe: options.defringe,
    backgroundColor: 'transparent',
  });
}
