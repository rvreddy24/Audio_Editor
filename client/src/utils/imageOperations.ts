/**
 * High-performance browser Canvas image manipulation operations
 */

export async function loadImageElement(fileOrBlob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * 1. COMPRESS IMAGE
 */
export async function compressImage(
  file: File,
  quality: number = 0.7
): Promise<{ blob: Blob; originalSize: number; newSize: number; dataUrl: string }> {
  const originalSize = file.size;
  const img = await loadImageElement(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');
  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', quality);
  });

  return {
    blob,
    originalSize,
    newSize: blob.size,
    dataUrl,
  };
}

/**
 * 2. RESIZE IMAGE
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  mimeType = 'image/jpeg'
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageElement(file);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const dataUrl = canvas.toDataURL(mimeType, 0.92);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), mimeType, 0.92);
  });

  return { blob, dataUrl };
}

/**
 * 3. CROP IMAGE
 */
export async function cropImage(
  file: File,
  cropArea: { x: number; y: number; width: number; height: number }
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageElement(file);

  const canvas = document.createElement('canvas');
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');
  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92);
  });

  return { blob, dataUrl };
}

/**
 * 4. CONVERT IMAGE FORMAT
 */
export async function convertImageFormat(
  file: File,
  targetMime: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<{ blob: Blob; dataUrl: string; ext: string }> {
  const img = await loadImageElement(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');
  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL(targetMime, 0.92);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), targetMime, 0.92);
  });

  const ext = targetMime === 'image/jpeg' ? 'jpg' : targetMime === 'image/png' ? 'png' : 'webp';
  return { blob, dataUrl, ext };
}

/**
 * 5. ROTATE & FLIP IMAGE
 */
export async function rotateAndFlipImage(
  file: File,
  rotationDeg: number,
  flipH: boolean = false,
  flipV: boolean = false
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageElement(file);
  const rad = (rotationDeg * Math.PI) / 180;

  const is90or270 = Math.abs(rotationDeg % 180) === 90;
  const canvas = document.createElement('canvas');
  canvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
  canvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas error');

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92);
  });

  return { blob, dataUrl };
}

/**
 * 6. WATERMARK IMAGE
 */
export async function watermarkImage(
  file: File,
  text: string,
  opacity = 0.4,
  fontSize = 36
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageElement(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');
  ctx.drawImage(img, 0, 0);

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.8})`;
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92);
  });

  return { blob, dataUrl };
}
