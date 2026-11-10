import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  loadImage,
  processSignature,
  downloadImageBlob,
} from '../../utils/imageProcessor';

interface SignatureResizerProps {
  onBack?: () => void;
}

export const SignatureResizer: React.FC<SignatureResizerProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [widthPx, setWidthPx] = useState<number>(140);
  const [heightPx, setHeightPx] = useState<number>(60);
  const [targetKb, setTargetKb] = useState<number>(15);
  const [cleanPaperBg, setCleanPaperBg] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
    actualKb: number;
  } | null>(null);

  const signaturePresets = [
    { label: 'UPSC / SSC (140 × 60 px, ≤ 20KB)', w: 140, h: 60, kb: 15 },
    { label: 'IBPS / Bank (140 × 60 px, ≤ 20KB)', w: 140, h: 60, kb: 20 },
    { label: 'GATE / JEE (300 × 80 px, ≤ 30KB)', w: 300, h: 80, kb: 25 },
    { label: 'High-Res Wide (400 × 120 px, ≤ 50KB)', w: 400, h: 120, kb: 50 },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const res = await processSignature(imgElement, {
        widthPx,
        heightPx,
        targetKb,
        cleanPaperBg,
      });
      setResult(res);
    } catch (err: any) {
      alert(`Signature processing error: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, widthPx, heightPx, targetKb, cleanPaperBg]);

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
          <PenTool className="w-7 h-7 text-purple-600" />
          <span>Signature Resizer & Cleaner</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Crop digital signatures, clean grey paper shadows, and compress strictly under 10KB–20KB for recruitment forms.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop Photo of Your Signature
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports photos taken on paper with mobile cameras • Automatic background whitening
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
            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={widthPx}
                  onChange={(e) => setWidthPx(parseInt(e.target.value) || 140)}
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={heightPx}
                  onChange={(e) => setHeightPx(parseInt(e.target.value) || 60)}
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Target KB */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Target Maximum File Size (KB)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((kb) => (
                  <button
                    key={kb}
                    onClick={() => setTargetKb(kb)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      targetKb === kb
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ≤ {kb} KB
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Cleaner Filter Toggle */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanPaperBg}
                  onChange={(e) => setCleanPaperBg(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Clean Paper Background & Boost Ink
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Filters out mobile camera shadow and makes white paper crisp pure white with sharp dark ink.
                  </p>
                </div>
              </label>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Exam Form Presets
              </span>
              <div className="space-y-1">
                {signaturePresets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setWidthPx(p.w);
                      setHeightPx(p.h);
                      setTargetKb(p.kb);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between border border-slate-100"
                  >
                    <span className="font-medium truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Download */}
            <div className="space-y-2 pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_signature_${result.actualKb}kb.jpg`);
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing signature...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download {result?.actualKb} KB Signature</span>
                  </>
                )}
              </button>

              <label className="w-full block text-center py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors">
                Choose another signature
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
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">
                  Whitening background and optimizing KB...
                </span>
              </div>
            ) : result ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-md bg-white border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xs">
                  <img
                    src={result.dataUrl}
                    alt="Processed signature"
                    style={{ width: `${Math.min(320, widthPx * 1.5)}px` }}
                    className="border border-slate-200 rounded shadow-2xs object-contain"
                  />
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ {result.actualKb} KB (Under {targetKb} KB limit)
                    </span>
                    <span className="text-xs text-slate-500">
                      {widthPx} × {heightPx} px
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-bold text-slate-800">
                    Signature ready for online recruitment portals
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Accepted by SSC CGL/CHSL, UPSC CSE, IBPS PO, and State PSC forms
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
