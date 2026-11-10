import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Stamp,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { watermarkImage } from '../../../utils/imageOperations';
import { downloadBlob } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface WatermarkImageWorkspaceProps {
  onBack: () => void;
}

export const WatermarkImageWorkspace: React.FC<WatermarkImageWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('COPYRIGHT');
  const [opacity, setOpacity] = useState(0.4);
  const [fontSize, setFontSize] = useState(48);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleWatermark = async () => {
    if (!file || !text.trim()) return;
    setIsProcessing(true);
    try {
      const res = await watermarkImage(file, text, opacity, fontSize);
      downloadBlob(res.blob, `watermarked_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to watermark image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Tools</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Watermark Image
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Stamp text watermarks, copyright notices, or branding over your photos in seconds.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/*"
          multiple={false}
          title="Select Image"
          buttonLabel="Select Image file"
          subtitle="or drop images here"
        />
      ) : isDone ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Image Watermarked!</h2>
            <p className="text-xs text-slate-500 mt-1">Your stamped image has been downloaded.</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Watermark another image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-72 h-72 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center p-2 shadow-xs">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-h-full object-contain"
              />
              <div
                className="absolute inset-0 flex items-center justify-center font-bold text-white tracking-widest pointer-events-none select-none drop-shadow-md text-center p-4"
                style={{
                  opacity,
                  fontSize: `${fontSize * 0.7}px`,
                }}
              >
                {text || 'WATERMARK'}
              </div>
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">{formatFileSize(file.size)}</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Stamp className="w-4 h-4 text-rose-500" />
                Watermark Settings
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Watermark Text</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. COPYRIGHT"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Transparency:</span>
                  <span className="font-mono">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Font Size:</span>
                  <span className="font-mono">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-600"
                />
              </div>
            </div>

            <button
              disabled={isProcessing || !text.trim()}
              onClick={handleWatermark}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Stamping Image...</span>
                </>
              ) : (
                <span>Stamp Watermark →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
