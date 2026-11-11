import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  loadImage,
  rotateAndFlipImage,
  downloadImageBlob,
} from '../../utils/imageProcessor';

interface RotateFlipWorkspaceProps {
  onBack: () => void;
}

export const RotateFlipWorkspace: React.FC<RotateFlipWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [angle, setAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
    width: number;
    height: number;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setAngle(0);
      setFlipH(false);
      setFlipV(false);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const res = await rotateAndFlipImage(imgElement, angle, flipH, flipV);
      setResult(res);
    } catch (err: any) {
      alert(`Rotate error: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, angle, flipH, flipV]);

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
          <RotateCw className="w-7 h-7 text-indigo-600" />
          <span>Rotate & Flip Image</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Rotate photos 90°, 180°, flip horizontally or vertically, and fine-tune angles to straighten sideways or tilted photos.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Rotate
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP • Instant In-Browser Transformation
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Quick 90° Rotations
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAngle((a) => (a - 90 + 360) % 360)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex flex-col items-center gap-1 shadow-2xs"
                >
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>90° Left</span>
                </button>
                <button
                  onClick={() => setAngle((a) => (a + 90) % 360)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex flex-col items-center gap-1 shadow-2xs"
                >
                  <RotateCw className="w-4 h-4 text-indigo-600" />
                  <span>90° Right</span>
                </button>
                <button
                  onClick={() => setAngle((a) => (a + 180) % 360)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex flex-col items-center gap-1 shadow-2xs"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  <span>180° Flip</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Mirror & Flip
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFlipH((f) => !f)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    flipH
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  onClick={() => setFlipV((f) => !f)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    flipV
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>

            {/* Straighten Angle */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Straighten Angle</span>
                <span className="font-mono text-indigo-600">{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={angle}
                onChange={(e) => setAngle(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <button
                onClick={() => {
                  setAngle(0);
                  setFlipH(false);
                  setFlipV(false);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:underline block pt-1"
              >
                Reset Orientation
              </button>
            </div>

            {/* Download Button */}
            <div className="pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_rotated.jpg`);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rotating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Rotated Image</span>
                  </>
                )}
              </button>

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors mt-1">
                Choose another image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Result Preview */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[440px]">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
              <span>Oriented Result Preview</span>
              {result && (
                <span className="text-[11px] text-slate-400">
                  {result.width} × {result.height} px
                </span>
              )}
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">Rendering rotation...</span>
              </div>
            ) : result ? (
              <div className="max-h-[400px] max-w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                <img
                  src={result.dataUrl}
                  alt="Rotated preview"
                  className="max-h-[380px] max-w-full object-contain rounded-xl shadow-xs"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
