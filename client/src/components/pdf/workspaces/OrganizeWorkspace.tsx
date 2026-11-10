import React, { useState } from 'react';
import {
  Trash2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Download,
  CheckCircle2,
  Loader2,
  LayoutGrid,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  organizePdf,
  downloadBytes,
  getBufferFromFile,
  PdfFileInfo,
  PageConfig,
} from '../../../utils/pdfOperations';
import { renderPdfPageToDataUrl } from '../../../utils/pdfRenderer';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnail: string;
}

interface OrganizeWorkspaceProps {
  onBack: () => void;
}

export const OrganizeWorkspace: React.FC<OrganizeWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const parsed = await parsePdfFile(files[0]);
    setFile(parsed);
    setIsRendering(true);

    try {
      const pageItems: PageItem[] = [];
      for (let i = 1; i <= parsed.pageCount; i++) {
        let thumb = '';
        try {
          thumb = await renderPdfPageToDataUrl(parsed.data, i, 0.7);
        } catch (e) {
          console.warn('Page render error:', e);
        }
        pageItems.push({
          id: `page-${i}`,
          originalIndex: i - 1,
          rotation: 0,
          thumbnail: thumb,
        });
      }
      setPages(pageItems);
    } finally {
      setIsRendering(false);
    }
  };

  const handleRotate = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        rotation: (copy[index].rotation + 90) % 360,
      };
      return copy;
    });
  };

  const handleDelete = (index: number) => {
    if (pages.length <= 1) {
      alert('You must keep at least 1 page in the document.');
      return;
    }
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      const configs: PageConfig[] = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));
      const resultBytes = await organizePdf(buf, configs);
      downloadBytes(resultBytes, `organized_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to save organized PDF');
    } finally {
      setIsProcessing(false);
    }
  };

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
          Organize PDF pages
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Sort, rotate, and delete PDF pages. Adjust the page order to your exact liking.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been organized!</h2>
            <p className="text-xs text-slate-500 mt-1">Your new document has been downloaded.</p>
          </div>
          <button
            onClick={handleSave}
            className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Download again</span>
          </button>
          <button
            onClick={() => {
              setFile(null);
              setPages([]);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Organize another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Thumbnails Grid */}
          <div className="lg:col-span-3">
            {isRendering ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-[#e5322d] animate-spin" />
                <span className="text-xs font-semibold text-slate-600">
                  Rendering page previews...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex flex-col items-center justify-between group hover:border-slate-300 transition-all relative"
                  >
                    {/* Page badge */}
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRotate(idx)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Rotate 90 degrees"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-full h-40 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden p-1">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={`Page ${idx + 1}`}
                          className="h-full object-contain shadow-2xs transition-transform duration-200"
                          style={{ transform: `rotate(${p.rotation}deg)` }}
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">Page {idx + 1}</span>
                      )}
                    </div>

                    {/* Move Left / Right buttons */}
                    <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'left')}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-20"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-400">Orig: {p.originalIndex + 1}</span>
                      <button
                        disabled={idx === pages.length - 1}
                        onClick={() => handleMove(idx, 'right')}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-20"
                        title="Move right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs sticky top-24 flex flex-col gap-5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-purple-600" />
                Page Summary
              </h3>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Pages remaining:</span>
                  <span className="font-bold text-slate-900">{pages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Original pages:</span>
                  <span>{file.pageCount}</span>
                </div>
              </div>

              <button
                disabled={isProcessing || pages.length === 0}
                onClick={handleSave}
                className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving PDF...</span>
                  </>
                ) : (
                  <span>Save & Download PDF →</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
