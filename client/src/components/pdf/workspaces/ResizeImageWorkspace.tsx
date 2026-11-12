import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Scaling,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { resizeImage, loadImageElement } from '../../../utils/imageOperations';
import { downloadBlob } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface ResizeImageWorkspaceProps {
  onBack: () => void;
}

export const ResizeImageWorkspace: React.FC<ResizeImageWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [origDimensions, setOrigDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      const img = await loadImageElement(f);
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      setOrigDimensions({ width: w, height: h });
      setTargetWidth(Math.round(w * 0.75));
      setTargetHeight(Math.round(h * 0.75));
    }
  };

  const handleResize = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await resizeImage(file, targetWidth, targetHeight, file.type || 'image/jpeg');
      downloadBlob(res.blob, `resized_${targetWidth}x${targetHeight}_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to resize image');
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
          Resize Image
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Resize JPG, PNG, and WebP images by defining exact pixel dimensions or percentage scaling.
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
            <h2 className="text-2xl font-bold text-slate-900">Image Resized!</h2>
            <p className="text-xs text-slate-500 mt-1">Resized to {targetWidth} × {targetHeight} pixels.</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Resize another image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-64 h-64 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-xs">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-full object-contain"
              />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              Original: {origDimensions.width} × {origDimensions.height} px • {formatFileSize(file.size)}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Scaling className="w-4 h-4 text-blue-600" />
                Target Dimensions
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Width (px)</label>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(parseInt(e.target.value, 10) || 100)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Height (px)</label>
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => setTargetHeight(parseInt(e.target.value, 10) || 100)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Quick Percentage Presets */}
              <div className="space-y-1 pt-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Quick Scale</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.75, 0.5, 0.25].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => {
                        setTargetWidth(Math.round(origDimensions.width * scale));
                        setTargetHeight(Math.round(origDimensions.height * scale));
                      }}
                      className="py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      {scale * 100}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleResize}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resizing Image...</span>
                </>
              ) : (
                <span>Resize Image →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
