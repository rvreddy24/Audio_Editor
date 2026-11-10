import React, { useState, useEffect } from 'react';
import {
  Scaling,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  Lock,
  Unlock,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import {
  loadImage,
  resizeImageDimensions,
  downloadImageBlob,
  convertUnitsToPixels,
} from '../../utils/imageProcessor';
import { formatFileSize } from '../../utils/formatters';

interface DimensionResizerProps {
  onBack?: () => void;
  defaultDpiMode?: boolean;
}

export const DimensionResizer: React.FC<DimensionResizerProps> = ({
  onBack,
  defaultDpiMode = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [width, setWidth] = useState<number>(350);
  const [height, setHeight] = useState<number>(350);
  const [unit, setUnit] = useState<'px' | 'cm' | 'mm' | 'inch'>(
    defaultDpiMode ? 'inch' : 'px'
  );
  const [dpi, setDpi] = useState<number>(defaultDpiMode ? 300 : 200);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
    widthPx: number;
    heightPx: number;
    sizeKb: number;
  } | null>(null);

  const presets = [
    { label: 'UPSC / SSC Photo (3.5 × 4.5 cm)', w: 3.5, h: 4.5, u: 'cm' as const, dpi: 200 },
    { label: 'UPSC / SSC Signature (140 × 60 px)', w: 140, h: 60, u: 'px' as const, dpi: 200 },
    { label: 'US Visa / Passport (2 × 2 in)', w: 2, h: 2, u: 'inch' as const, dpi: 300 },
    { label: 'GATE Photo (480 × 640 px)', w: 480, h: 640, u: 'px' as const, dpi: 200 },
    { label: 'High-Res 300 DPI Print', w: 4, h: 6, u: 'inch' as const, dpi: 300 },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setAspectRatio(img.naturalWidth / img.naturalHeight);
      if (unit === 'px') {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      }
      setResult(null);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && aspectRatio > 0) {
      setHeight(Math.round((val / aspectRatio) * 10) / 10);
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && aspectRatio > 0) {
      setWidth(Math.round(val * aspectRatio * 10) / 10);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const res = await resizeImageDimensions(imgElement, {
        width,
        height,
        unit,
        dpi,
        format: 'image/jpeg',
      });
      setResult(res);
    } catch (err: any) {
      alert(`Resize error: ${err.message || 'Failed to resize'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, width, height, unit, dpi]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Image Tools</span>
        </button>
      )}

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
          <Scaling className="w-7 h-7 text-indigo-600" />
          <span>Resize Image by Dimensions & DPI</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Specify exact pixels, centimeters, or inches with embedded DPI resolution (200, 300, 600 DPI) for official portals.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Resize
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP • 100% Client-Side In-Browser Processing
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            {/* Unit Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Measurement Unit
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['px', 'cm', 'mm', 'inch'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                      unit === u
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Width & Height */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Width ({unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={width}
                  onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Height ({unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={height}
                  onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Aspect Ratio Lock */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                onClick={() => setLockAspect(!lockAspect)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                  lockAspect
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {lockAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{lockAspect ? 'Aspect Ratio Locked' : 'Free Dimensions'}</span>
              </button>
            </div>

            {/* DPI Settings */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center justify-between">
                <span>Resolution / DPI</span>
                <span className="text-[11px] text-indigo-600 lowercase font-semibold">
                  injects JFIF header
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[72, 150, 200, 300].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDpi(d)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      dpi === d
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {d} DPI
                  </button>
                ))}
              </div>
            </div>

            {/* Presets List */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Official Exam Presets
              </span>
              <div className="space-y-1">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUnit(p.u);
                      setDpi(p.dpi);
                      setWidth(p.w);
                      setHeight(p.h);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between border border-slate-100"
                  >
                    <span className="font-medium truncate">{p.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                      {p.w}×{p.h} {p.u}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_${result.widthPx}x${result.heightPx}.jpg`);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resizing image...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Resized Image</span>
                  </>
                )}
              </button>

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors">
                Choose another image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Result Column */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[420px]">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">
                  Resizing and injecting DPI markers...
                </span>
              </div>
            ) : result ? (
              <div className="w-full flex flex-col items-center">
                <div className="relative max-h-[380px] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                  <img
                    src={result.dataUrl}
                    alt="Resized output"
                    className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
                  />
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{result.widthPx} × {result.heightPx} px</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-bold text-slate-800">
                    Dimensions: {result.widthPx} × {result.heightPx} pixels ({dpi} DPI)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Output size: {result.sizeKb} KB • Ready for submission
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs">No preview available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
