import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { parsePdfFile, mergePdfs, downloadBytes, PdfFileInfo } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface MergeWorkspaceProps {
  onBack: () => void;
}

export const MergeWorkspace: React.FC<MergeWorkspaceProps> = ({ onBack }) => {
  const [files, setFiles] = useState<PdfFileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBytes, setMergedBytes] = useState<Uint8Array | null>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    const parsed = await Promise.all(newFiles.map(parsePdfFile));
    setFiles((prev) => [...prev, ...parsed]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newFiles.length) return;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;
    setFiles(newFiles);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const buffers = files.map((f) => f.data);
      const result = await mergePdfs(buffers);
      setMergedBytes(result);
      downloadBytes(result, 'merged_document.pdf');
    } catch (err) {
      console.error('Merge error:', err);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
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
          Merge PDF files
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Combine PDFs in the order you want with the easiest PDF merger available.
        </p>
      </div>

      {files.length === 0 ? (
        <PdfDropzone
          onFilesSelected={handleFilesSelected}
          title="Select PDF files"
          buttonLabel="Select PDF files"
        />
      ) : mergedBytes ? (
        /* Result Screen */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">PDFs have been merged!</h2>
            <p className="text-xs text-slate-500 mt-1">Your download should begin automatically.</p>
          </div>
          <button
            onClick={() => downloadBytes(mergedBytes, 'merged_document.pdf')}
            className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Download merged PDF</span>
          </button>
          <button
            onClick={() => {
              setMergedBytes(null);
              setFiles([]);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Merge more files
          </button>
        </div>
      ) : (
        /* Workstation: File Ordering & Merge */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* File cards list */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
              </span>
              <label className="text-xs font-semibold text-[#e5322d] hover:underline cursor-pointer flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add more files</span>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between relative group hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => handleRemove(file.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail / Icon */}
                  <div className="my-3 h-32 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                    {file.previewUrl ? (
                      <img
                        src={file.previewUrl}
                        alt="Page preview"
                        className="h-full object-contain shadow-xs"
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-slate-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{file.pageCount} pages</span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>

                  {/* Move Up/Down Controls */}
                  <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-slate-100">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 transition-colors text-slate-600"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === files.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 transition-colors text-slate-600"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs sticky top-24 flex flex-col gap-5">
              <h3 className="font-bold text-slate-900 text-sm">Merge Options</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Files will be joined together in the exact order shown on the left.
              </p>

              <button
                disabled={files.length < 2 || isProcessing}
                onClick={handleMerge}
                className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Merging files...</span>
                  </>
                ) : (
                  <span>Merge PDF →</span>
                )}
              </button>

              {files.length < 2 && (
                <div className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center">
                  Please select at least 2 PDF files to merge.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
