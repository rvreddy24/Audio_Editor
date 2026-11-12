import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Hash,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  addPageNumbersToPdf,
  downloadBytes,
  getBufferFromFile,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface PageNumbersWorkspaceProps {
  onBack: () => void;
}

export const PageNumbersWorkspace: React.FC<PageNumbersWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [format, setFormat] = useState<'1' | '1 of n' | 'Page 1' | 'Page 1 of n'>('1 of n');
  const [position, setPosition] = useState<
    'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
  >('bottom-center');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
    }
  };

  const handleAddNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      const resultBytes = await addPageNumbersToPdf(buf, {
        format,
        position,
      });
      downloadBytes(resultBytes, `numbered_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to add page numbers');
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
          <span>All PDF Tools</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Page numbers
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Add page numbers into PDFs with ease. Choose positions and typography.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Select PDF file"
          buttonLabel="Select PDF file"
        />
      ) : isDone ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Page numbers added!</h2>
            <p className="text-xs text-slate-500 mt-1">Your numbered PDF has been downloaded.</p>
          </div>
          <button
            onClick={handleAddNumbers}
            className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Download again</span>
          </button>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Number another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-56 h-[304px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
              {/* Overlay preview number */}
              <div className="absolute bottom-3 text-xs font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                {format === '1 of n'
                  ? `1 of ${file.pageCount}`
                  : format === 'Page 1 of n'
                  ? `Page 1 of ${file.pageCount}`
                  : format === 'Page 1'
                  ? 'Page 1'
                  : '1'}
              </div>
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                Numbering Format
              </h3>

              <div className="space-y-2">
                {[
                  { key: '1 of n', label: '1 of n (e.g. 1 of 12)' },
                  { key: 'Page 1 of n', label: 'Page 1 of n' },
                  { key: '1', label: 'Single number (e.g. 1)' },
                  { key: 'Page 1', label: 'Page 1' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFormat(item.key as any)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left border transition-all ${
                      format === item.key
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700">Position (Header / Footer)</label>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { key: 'top-left', label: 'Top Left' },
                    { key: 'top-center', label: 'Top Center' },
                    { key: 'top-right', label: 'Top Right' },
                    { key: 'bottom-left', label: 'Bottom Left' },
                    { key: 'bottom-center', label: 'Bottom Center' },
                    { key: 'bottom-right', label: 'Bottom Right' },
                  ].map((pos) => (
                    <button
                      key={pos.key}
                      onClick={() => setPosition(pos.key as any)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                        position === pos.key
                          ? 'bg-red-50 text-[#e5322d] border-red-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleAddNumbers}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding numbers...</span>
                </>
              ) : (
                <span>Add Page Numbers →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
