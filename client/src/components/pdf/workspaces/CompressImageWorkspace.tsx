import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Minimize2,
  ImageIcon,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { compressImage } from '../../../utils/imageOperations';
import { downloadBlob } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface CompressImageWorkspaceProps {
  onBack: () => void;
}

export const CompressImageWorkspace: React.FC<CompressImageWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [quality, setQuality] = useState(0.7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    originalSize: number;
    newSize: number;
    dataUrl: string;
  } | null>(null);

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

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await compressImage(file, quality);
      setResult(res);
      downloadBlob(res.blob, `compressed_${file.name.replace(/\.[^/.]+$/, '')}.jpg`);
    } catch (err: any) {
      alert(err.message || 'Failed to compress image');
    } finally {
      setIsProcessing(false);
    }
  };

  const savedPercent = result
    ? Math.max(0, Math.round(((result.originalSize - result.newSize) / result.originalSize) * 100))
    : 0;

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
          Compress Image
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Compress JPG, PNG, and WebP images with the best quality-to-size ratio.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/*"
          multiple={false}
          title="Select Image"
          buttonLabel="Select Image file"
          subtitle="or drop JPG, PNG, WebP here"
        />
      ) : result ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Image Compressed!</h2>
            <div className="flex items-center justify-center gap-4 text-xs font-mono font-bold mt-3">
              <span className="text-slate-400 line-through">
                {formatFileSize(result.originalSize)}
              </span>
              <span className="text-emerald-600 text-sm">
                {formatFileSize(result.newSize)}
              </span>
              {savedPercent > 0 && (
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px]">
                  -{savedPercent}%
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Compress another image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-64 h-64 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-xs">
              <img
                src={previewUrl}
                alt="Original"
                className="max-h-full object-contain"
              />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">{formatFileSize(file.size)}</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Minimize2 className="w-4 h-4 text-emerald-600" />
                Compression Quality
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Quality Factor:</span>
                  <span className="font-mono text-emerald-600">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleCompress}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compressing Image...</span>
                </>
              ) : (
                <span>Compress Image →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
