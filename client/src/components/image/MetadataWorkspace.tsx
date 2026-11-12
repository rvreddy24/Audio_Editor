import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Download,
  Upload,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  loadImage,
  canvasToBlob,
  downloadImageBlob,
} from '../../utils/imageProcessor';
import { formatFileSize } from '../../utils/formatters';

interface MetadataWorkspaceProps {
  onBack: () => void;
}

interface ExifDetailItem {
  label: string;
  value: string;
}

function extractExifTags(buffer: ArrayBuffer): ExifDetailItem[] {
  const bytes = new Uint8Array(buffer);
  const items: ExifDetailItem[] = [];

  // Find 0xFF, 0xE1 (APP1 marker)
  let app1Pos = -1;
  for (let i = 0; i < Math.min(bytes.length - 4, 32768); i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
      app1Pos = i;
      break;
    }
  }
  if (app1Pos === -1) return items;

  // Check 'Exif\0\0' header
  if (
    bytes[app1Pos + 4] !== 0x45 || // 'E'
    bytes[app1Pos + 5] !== 0x78 || // 'x'
    bytes[app1Pos + 6] !== 0x69 || // 'i'
    bytes[app1Pos + 7] !== 0x66 || // 'f'
    bytes[app1Pos + 8] !== 0x00 ||
    bytes[app1Pos + 9] !== 0x00
  ) {
    return items;
  }

  const tiff = app1Pos + 10;
  if (tiff + 8 > bytes.length) return items;

  const isLittle = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49; // 'II'
  const isBig = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d; // 'MM'
  if (!isLittle && !isBig) return items;

  const readU16 = (o: number) => {
    if (o + 2 > bytes.length) return 0;
    return isLittle ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1];
  };

  const readU32 = (o: number) => {
    if (o + 4 > bytes.length) return 0;
    return isLittle
      ? (bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0
      : ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  };

  const readAscii = (o: number, count: number) => {
    if (o + count > bytes.length) return '';
    let str = '';
    for (let i = 0; i < count; i++) {
      const code = bytes[o + i];
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str.trim();
  };

  const ifd0Offset = readU32(tiff + 4);
  const ifd0 = tiff + ifd0Offset;
  if (ifd0 + 2 > bytes.length) return items;

  const numEntries = readU16(ifd0);
  let exifSubIfd = 0;
  let gpsSubIfd = 0;

  for (let i = 0; i < numEntries && i < 60; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > bytes.length) break;
    const tag = readU16(entry);
    const type = readU16(entry + 2);
    const count = readU32(entry + 4);
    const valOffset = count <= 4 ? entry + 8 : tiff + readU32(entry + 8);

    if (tag === 0x010f && type === 2) {
      const make = readAscii(valOffset, count);
      if (make) items.push({ label: 'Camera / Brand', value: make });
    } else if (tag === 0x0110 && type === 2) {
      const model = readAscii(valOffset, count);
      if (model) items.push({ label: 'Model', value: model });
    } else if (tag === 0x0131 && type === 2) {
      const software = readAscii(valOffset, count);
      if (software) items.push({ label: 'Software / OS', value: software });
    } else if (tag === 0x0132 && type === 2) {
      const dt = readAscii(valOffset, count);
      if (dt) items.push({ label: 'Date & Time Taken', value: dt });
    } else if (tag === 0x8769) {
      exifSubIfd = readU32(entry + 8);
    } else if (tag === 0x8825) {
      gpsSubIfd = readU32(entry + 8);
    }
  }

  if (gpsSubIfd > 0) {
    items.push({
      label: 'GPS Geolocation',
      value: 'Coordinates Embedded (Privacy Risk)',
    });
  }

  if (exifSubIfd > 0 && tiff + exifSubIfd + 2 <= bytes.length) {
    const subPos = tiff + exifSubIfd;
    const subEntries = readU16(subPos);
    for (let i = 0; i < subEntries && i < 40; i++) {
      const entry = subPos + 2 + i * 12;
      if (entry + 12 > bytes.length) break;
      const tag = readU16(entry);
      const type = readU16(entry + 2);
      const count = readU32(entry + 4);
      const valOffset = count <= 4 ? entry + 8 : tiff + readU32(entry + 8);

      if (tag === 0x9003 && type === 2) {
        const dtOrig = readAscii(valOffset, count);
        if (dtOrig && !items.some((x) => x.label === 'Date & Time Taken')) {
          items.push({ label: 'Date & Time Taken', value: dtOrig });
        }
      } else if (tag === 0xa434 && type === 2) {
        const lens = readAscii(valOffset, count);
        if (lens) items.push({ label: 'Lens Model', value: lens });
      }
    }
  }

  return items;
}

export const MetadataWorkspace: React.FC<MetadataWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [exifTags, setExifTags] = useState<ExifDetailItem[]>([]);

  const [metaInfo, setMetaInfo] = useState<{
    name: string;
    size: string;
    dimensions: string;
    ratio: string;
    type: string;
    hasExif: boolean;
  } | null>(null);

  const [isStripping, setIsStripping] = useState(false);
  const [isStrippedDone, setIsStrippedDone] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const pUrl = URL.createObjectURL(file);
      setPreviewUrl(pUrl);

      const img = await loadImage(file);
      setImgElement(img);

      // Check EXIF APP1 marker (0xFF, 0xE1) in byte buffer
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let foundExif = false;
      for (let i = 0; i < Math.min(bytes.length - 4, 2048); i++) {
        if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
          foundExif = true;
          break;
        }
      }

      const parsedTags = extractExifTags(buffer);
      setExifTags(parsedTags);

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(img.naturalWidth, img.naturalHeight);
      const ratioStr = `${img.naturalWidth / g}:${img.naturalHeight / g}`;

      setMetaInfo({
        name: file.name,
        size: formatFileSize(file.size),
        dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`,
        ratio: ratioStr,
        type: file.type || 'image/jpeg',
        hasExif: foundExif,
      });
      setIsStrippedDone(false);
    }
  };

  const handleStripMetadata = async () => {
    if (!imgElement || !selectedFile) return;
    setIsStripping(true);
    try {
      // Re-render onto clean canvas to discard all EXIF/APP1/GPS/Camera metadata tags
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      const isPng =
        selectedFile.type === 'image/png' ||
        selectedFile.name.toLowerCase().endsWith('.png');
      const isWebp =
        selectedFile.type === 'image/webp' ||
        selectedFile.name.toLowerCase().endsWith('.webp');
      const mime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
      const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';

      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(imgElement, 0, 0);

      const cleanBlob = await canvasToBlob(canvas, mime, 0.95);
      const base = selectedFile.name.replace(/\.[^/.]+$/, '');
      downloadImageBlob(cleanBlob, `${base}_no_exif.${ext}`);
      setIsStrippedDone(true);
    } catch (err: any) {
      alert(`Error cleaning metadata: ${err.message || 'Please try again'}`);
    } finally {
      setIsStripping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All Image Tools</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
          <FileSearch className="w-7 h-7 text-indigo-600" />
          <span>EXIF Metadata Viewer & Stripper</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Inspect file metadata, camera tags, and strip all EXIF / GPS / device information in one click before sharing online.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Inspect Metadata
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP, Camera RAW • 100% Private in Browser
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Metadata Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                File & Image Attributes
              </span>
              {metaInfo && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">File Name:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[180px]">
                      {metaInfo.name}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">File Size:</span>
                    <span className="font-bold text-slate-800">{metaInfo.size}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="font-bold text-slate-800">{metaInfo.dimensions}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Aspect Ratio:</span>
                    <span className="font-bold text-slate-800">{metaInfo.ratio}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">MIME Type:</span>
                    <span className="font-bold text-slate-800">{metaInfo.type}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">EXIF Headers:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        metaInfo.hasExif
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {metaInfo.hasExif ? 'Detected (Camera / GPS / Date)' : 'Clean (No EXIF)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Extracted EXIF Tags List if Present */}
              {exifTags.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Embedded Camera & Privacy Tags</span>
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {exifTags.map((tag, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200/60"
                      >
                        <span className="text-slate-600 font-medium">{tag.label}:</span>
                        <span className="font-bold text-slate-800 text-right truncate max-w-[190px]">
                          {tag.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Strip Action */}
            <div className="pt-2 space-y-2">
              <button
                disabled={isStripping}
                onClick={handleStripMetadata}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isStripping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Removing metadata...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Strip All Metadata & Download</span>
                  </>
                )}
              </button>

              {isStrippedDone && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Metadata completely stripped! Clean photo downloaded.</span>
                </div>
              )}

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors mt-1">
                Choose another image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Image Preview */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[440px]">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
              <span>Image Preview</span>
            </div>
            {previewUrl && (
              <div className="max-h-[400px] max-w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[380px] max-w-full object-contain rounded-xl shadow-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
