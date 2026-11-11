import React, { useState } from 'react';
import {
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { parsePdfFile, PdfFileInfo } from '../../../utils/pdfOperations';
import { renderPdfPageToDataUrl } from '../../../utils/pdfRenderer';
import { formatFileSize } from '../../../utils/formatters';

interface ComparePdfWorkspaceProps {
  onBack: () => void;
}

export const ComparePdfWorkspace: React.FC<ComparePdfWorkspaceProps> = ({ onBack }) => {
  const [docA, setDocA] = useState<PdfFileInfo | null>(null);
  const [docB, setDocB] = useState<PdfFileInfo | null>(null);
  const [page, setPage] = useState(1);
  const [thumbA, setThumbA] = useState('');
  const [thumbB, setThumbB] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const handleUploadA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const parsed = await parsePdfFile(e.target.files[0]);
      setDocA(parsed);
      loadPageComparison(1, parsed, docB);
    }
  };

  const handleUploadB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const parsed = await parsePdfFile(e.target.files[0]);
      setDocB(parsed);
      loadPageComparison(1, docA, parsed);
    }
  };

  const loadPageComparison = async (
    targetPage: number,
    dA: PdfFileInfo | null,
    dB: PdfFileInfo | null
  ) => {
    setPage(targetPage);
    setIsLoadingPage(true);
    try {
      if (dA && targetPage <= dA.pageCount) {
        const urlA = await renderPdfPageToDataUrl(dA.data, targetPage, 0.9);
        setThumbA(urlA);
      } else {
        setThumbA('');
      }

      if (dB && targetPage <= dB.pageCount) {
        const urlB = await renderPdfPageToDataUrl(dB.data, targetPage, 0.9);
        setThumbB(urlB);
      } else {
        setThumbB('');
      }
    } finally {
      setIsLoadingPage(false);
    }
  };

  const maxPages = Math.max(docA?.pageCount || 0, docB?.pageCount || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
          Compare PDF documents
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Side-by-side synchronized comparison between two PDF documents to detect visual changes and differences.
        </p>
      </div>

      {!docA || !docB ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Slot A */}
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Document A (Original)</h3>
              <p className="text-xs text-slate-400 mt-1">
                {docA ? `${docA.name} (${docA.pageCount} pgs)` : 'Select the baseline PDF'}
              </p>
            </div>
            <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-xs">
              {docA ? 'Change File' : 'Select Document A'}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadA} />
            </label>
          </div>

          {/* Slot B */}
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Document B (Modified)</h3>
              <p className="text-xs text-slate-400 mt-1">
                {docB ? `${docB.name} (${docB.pageCount} pgs)` : 'Select the revised PDF'}
              </p>
            </div>
            <label className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-xs">
              {docB ? 'Change File' : 'Select Document B'}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadB} />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Synchronized Paging Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => loadPageComparison(page - 1, docA, docB)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700">
                Page {page} of {maxPages}
              </span>
              <button
                disabled={page >= maxPages}
                onClick={() => loadPageComparison(page + 1, docA, docB)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span>{docA.name} vs {docB.name}</span>
              <button
                onClick={() => {
                  setDocA(null);
                  setDocB(null);
                }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Side by side viewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document A page */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center">
              <div className="w-full flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold text-indigo-700">Original Document A</span>
                <span className="text-[11px] text-slate-400">{formatFileSize(docA.size)}</span>
              </div>
              <div className="w-full h-[480px] bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden p-2 relative">
                {isLoadingPage ? (
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                ) : thumbA ? (
                  <img src={thumbA} alt="Page A" className="h-full object-contain shadow-xs" />
                ) : (
                  <span className="text-xs text-slate-400">Page does not exist in Document A</span>
                )}
              </div>
            </div>

            {/* Document B page */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center">
              <div className="w-full flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold text-rose-700">Modified Document B</span>
                <span className="text-[11px] text-slate-400">{formatFileSize(docB.size)}</span>
              </div>
              <div className="w-full h-[480px] bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden p-2 relative">
                {isLoadingPage ? (
                  <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                ) : thumbB ? (
                  <img src={thumbB} alt="Page B" className="h-full object-contain shadow-xs" />
                ) : (
                  <span className="text-xs text-slate-400">Page does not exist in Document B</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
