import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { convertImageFormat } from '../../../utils/imageOperations';
import { downloadBlob } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface ConvertImageWorkspaceProps {
  onBack: () => void;
}

export const ConvertImageWorkspace: React.FC<ConvertImageWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [targetMime, setTargetMime] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await convertImageFormat(file, targetMime);
      downloadBlob(res.blob, `${file.name.replace(/\.[^/.]+$/, '')}.${res.ext}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to convert image');
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
          Convert Image Format
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Convert images between JPG, PNG, and WebP with zero quality degradation.
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
            <h2 className="text-2xl font-bold text-slate-900">Image Converted!</h2>
            <p className="text-xs text-slate-500 mt-1">Converted file has been downloaded.</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Convert another image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-64 h-64 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-xs">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-h-full object-contain"
              />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">{formatFileSize(file.size)}</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-sky-600" />
                Target Format
              </h3>

              <div className="space-y-2">
                {[
                  { mime: 'image/png', label: 'PNG (Lossless transparency)', ext: 'PNG' },
                  { mime: 'image/jpeg', label: 'JPG (Standard photo format)', ext: 'JPG' },
                  { mime: 'image/webp', label: 'WebP (Next-gen modern web)', ext: 'WebP' },
                ].map((item) => (
                  <button
                    key={item.mime}
                    onClick={() => setTargetMime(item.mime as any)}
                    className={`w-full py-3 px-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      targetMime === item.mime
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{item.label}</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {item.ext}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleConvert}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting Image...</span>
                </>
              ) : (
                <span>Convert Image Format →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
