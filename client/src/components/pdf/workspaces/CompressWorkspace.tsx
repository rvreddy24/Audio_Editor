import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  compressPdf,
  downloadBytes,
  getBufferFromFile,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface CompressWorkspaceProps {
  onBack: () => void;
}

export const CompressWorkspace: React.FC<CompressWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [level, setLevel] = useState<'extreme' | 'recommended' | 'less'>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    bytes: Uint8Array;
    originalSize: number;
    newSize: number;
  } | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      const res = await compressPdf(buf, level);
      setResult(res);
      downloadBytes(res.bytes, `compressed_${file.name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to compress PDF');
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
          <span>All PDF Tools</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Compress PDF file
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Reduce file size while optimizing for maximal PDF quality.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Select PDF file"
          buttonLabel="Select PDF file"
        />
      ) : result ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">PDF has been compressed!</h2>
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
            onClick={() => downloadBytes(result.bytes, `compressed_${file.name}`)}
            className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Download compressed PDF</span>
          </button>
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Compress another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center">
            <div className="w-48 h-64 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="PDF preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-16 h-16 text-slate-300" />
              )}
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>{file.pageCount} pages</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{formatFileSize(file.size)}</span>
            </div>
          </div>

          {/* Compression Level Options */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-6 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Minimize2 className="w-4 h-4 text-[#e5322d]" />
                Compression Level
              </h3>

              <div className="space-y-2.5">
                {/* Extreme */}
                <div
                  onClick={() => setLevel('extreme')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    level === 'extreme'
                      ? 'border-[#e5322d] bg-red-50/50 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">Extreme Compression</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Less quality, high compression
                  </div>
                </div>

                {/* Recommended */}
                <div
                  onClick={() => setLevel('recommended')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                    level === 'recommended'
                      ? 'border-[#e5322d] bg-red-50/50 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 fill-current" />
                    Recommended
                  </span>
                  <div className="font-bold text-xs text-slate-900">Recommended Compression</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Good quality, good compression
                  </div>
                </div>

                {/* Less */}
                <div
                  onClick={() => setLevel('less')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    level === 'less'
                      ? 'border-[#e5322d] bg-red-50/50 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">Less Compression</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    High quality, less compression
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleCompress}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compressing PDF...</span>
                </>
              ) : (
                <span>Compress PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
