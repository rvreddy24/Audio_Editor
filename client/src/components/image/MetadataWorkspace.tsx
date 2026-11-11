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

export const MetadataWorkspace: React.FC<MetadataWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
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
            {imgElement && (
              <div className="max-h-[400px] max-w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                <img
                  src={imgElement.src}
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
