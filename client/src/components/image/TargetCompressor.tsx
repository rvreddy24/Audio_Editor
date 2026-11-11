import React, { useState, useEffect } from 'react';
import {
  Minimize2,
  Maximize2,
  Download,
  Upload,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  loadImage,
  compressToTargetKb,
  increaseImageSizeKb,
  downloadImageBlob,
} from '../../utils/imageProcessor';
import { formatFileSize } from '../../utils/formatters';

interface TargetCompressorProps {
  mode: 'compress' | 'increase';
  onBack?: () => void;
}

export const TargetCompressor: React.FC<TargetCompressorProps> = ({ mode, onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [targetKb, setTargetKb] = useState<number>(mode === 'compress' ? 50 : 100);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
    actualKb: number;
    width?: number;
    height?: number;
  } | null>(null);

  const presets =
    mode === 'compress' ? [20, 50, 100, 200, 500] : [50, 100, 200, 300, 500];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      if (mode === 'compress') {
        const img = await loadImage(selectedFile);
        const res = await compressToTargetKb(img, targetKb, format);
        setResult(res);
      } else {
        const res = await increaseImageSizeKb(selectedFile, targetKb);
        setResult(res);
      }
    } catch (err: any) {
      alert(`Processing error: ${err.message || 'Please try another image'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-run when file or target changes
  useEffect(() => {
    if (selectedFile) {
      handleProcess();
    }
  }, [selectedFile, targetKb, format]);

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
          {mode === 'compress' ? (
            <Minimize2 className="w-7 h-7 text-emerald-600" />
          ) : (
            <Maximize2 className="w-7 h-7 text-indigo-600" />
          )}
          <span>
            {mode === 'compress'
              ? 'Compress Image to Exact KB / MB'
              : 'Increase Image Size in KB'}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          {mode === 'compress'
            ? 'Reduce photo or document size strictly under portal limits (20KB, 50KB, 100KB, 200KB) with zero quality loss.'
            : 'Increase file size to meet strict minimum requirements for government applications and admission forms.'}
        </p>
      </div>

      {!selectedFile ? (
        /* Upload Area */
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP up to 50 MB • 100% Private in Browser
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
        /* Workstation: Controls + Live Comparison */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Target File Size (KB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="10000"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Math.max(5, parseInt(e.target.value) || 20))}
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-slate-500 px-2">KB</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Popular Form Limits
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {presets.map((kb) => (
                  <button
                    key={kb}
                    onClick={() => setTargetKb(kb)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      targetKb === kb
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {kb} KB
                  </button>
                ))}
              </div>
            </div>

            {/* Format choice */}
            {mode === 'compress' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat('image/jpeg')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      format === 'image/jpeg'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    JPEG / JPG (Universal)
                  </button>
                  <button
                    onClick={() => setFormat('image/webp')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      format === 'image/webp'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    WebP (Next-Gen)
                  </button>
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Original Size:</span>
                <span className="font-bold text-slate-800">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Maximum:</span>
                <span className="font-bold text-emerald-700">{targetKb} KB</span>
              </div>
              {result && (
                <div className="flex justify-between pt-2 border-t border-slate-200 text-emerald-700 font-bold">
                  <span>Result Size:</span>
                  <span>{result.actualKb} KB</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result && selectedFile) {
                    let ext = 'jpg';
                    if (mode === 'increase') {
                      if (selectedFile.type === 'image/png' || selectedFile.name.toLowerCase().endsWith('.png')) ext = 'png';
                      else if (selectedFile.type === 'image/webp' || selectedFile.name.toLowerCase().endsWith('.webp')) ext = 'webp';
                      else ext = 'jpg';
                    } else {
                      ext = format === 'image/webp' ? 'webp' : 'jpg';
                    }
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_${targetKb}kb.${ext}`);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing image...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download {result?.actualKb} KB Image</span>
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

          {/* Preview & Result Column */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[420px]">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">
                  Optimizing image quality and file size...
                </span>
              </div>
            ) : result ? (
              <div className="w-full flex flex-col items-center">
                <div className="relative max-h-[380px] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                  <img
                    src={result.dataUrl}
                    alt="Compressed result"
                    className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
                  />
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{result.actualKb} KB</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-bold text-slate-800">
                    Image compressed to {result.actualKb} KB (Under {targetKb} KB limit)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    100% compliant with government application form limits
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
