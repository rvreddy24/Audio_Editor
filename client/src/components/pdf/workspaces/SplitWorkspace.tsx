import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Scissors,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  splitPdfByRanges,
  splitPdfAllPagesToZip,
  splitPdfByPageCountToZip,
  downloadBytes,
  downloadBlob,
  getBufferFromFile,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface SplitWorkspaceProps {
  onBack: () => void;
}

export const SplitWorkspace: React.FC<SplitWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [mode, setMode] = useState<'ranges' | 'all' | 'count'>('ranges');
  const [rangeInput, setRangeInput] = useState<string>('1-2');
  const [pageCountChunk, setPageCountChunk] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [cachedResult, setCachedResult] = useState<{ type: 'bytes' | 'blob'; data: Uint8Array | Blob } | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setRangeInput(`1-${Math.min(2, parsed.pageCount)}`);
      setPageCountChunk(Math.min(2, Math.max(1, Math.floor(parsed.pageCount / 2) || 1)));
      setCachedResult(null);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    if (cachedResult) {
      if (cachedResult.type === 'bytes') {
        downloadBytes(cachedResult.data as Uint8Array, `split_${file.name}`);
      } else {
        downloadBlob(cachedResult.data as Blob, `split_${mode}_${file.name.replace(/\.pdf$/i, '')}.zip`);
      }
      return;
    }

    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      if (mode === 'ranges') {
        const resultBytes = await splitPdfByRanges(buf, rangeInput);
        setCachedResult({ type: 'bytes', data: resultBytes });
        downloadBytes(resultBytes, `split_${file.name}`);
      } else if (mode === 'all') {
        const zipBlob = await splitPdfAllPagesToZip(buf, file.name);
        setCachedResult({ type: 'blob', data: zipBlob });
        downloadBlob(zipBlob, `split_all_${file.name.replace(/\.pdf$/i, '')}.zip`);
      } else {
        const zipBlob = await splitPdfByPageCountToZip(buf, pageCountChunk, file.name);
        setCachedResult({ type: 'blob', data: zipBlob });
        downloadBlob(zipBlob, `split_chunks_${file.name.replace(/\.pdf$/i, '')}.zip`);
      }
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to split PDF');
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
          Split PDF file
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Separate one page or a whole set for easy conversion into independent PDF files.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been split!</h2>
            <p className="text-xs text-slate-500 mt-1">Your split document has been downloaded.</p>
          </div>
          <button
            onClick={handleSplit}
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
            Split another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Preview */}
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
              <span>{formatFileSize(file.size)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-6 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#e5322d]" />
                Split Mode
              </h3>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setMode('ranges')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border text-center ${
                    mode === 'ranges'
                      ? 'bg-red-50 text-[#e5322d] border-red-200 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  By Ranges
                </button>
                <button
                  onClick={() => setMode('count')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border text-center ${
                    mode === 'count'
                      ? 'bg-red-50 text-[#e5322d] border-red-200 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  By Page Count
                </button>
                <button
                  onClick={() => setMode('all')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border text-center ${
                    mode === 'all'
                      ? 'bg-red-50 text-[#e5322d] border-red-200 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All to ZIP
                </button>
              </div>

              {mode === 'ranges' ? (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Pages to extract (1 to {file.pageCount}):
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Example: <span className="font-mono">1-3, 5</span> extracts pages 1 through 3 and page 5.
                  </p>
                </div>
              ) : mode === 'count' ? (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Split every N pages:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={file.pageCount}
                      value={pageCountChunk}
                      onChange={(e) => setPageCountChunk(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-24 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                    <span className="text-xs text-slate-500">pages per file</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Produces separate PDFs of {pageCountChunk} page{pageCountChunk > 1 ? 's' : ''} each bundled in a ZIP.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Every page will be extracted into a separate PDF file and bundled into a ZIP archive.
                </div>
              )}
            </div>

            <button
              disabled={isProcessing || (mode === 'ranges' && !rangeInput.trim())}
              onClick={handleSplit}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Splitting PDF...</span>
                </>
              ) : (
                <span>Split PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
