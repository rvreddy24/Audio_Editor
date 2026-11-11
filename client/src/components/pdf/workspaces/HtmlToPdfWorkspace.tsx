import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { htmlToPdf, downloadBytes } from '../../../utils/pdfOperations';

interface HtmlToPdfWorkspaceProps {
  onBack: () => void;
}

export const HtmlToPdfWorkspace: React.FC<HtmlToPdfWorkspaceProps> = ({ onBack }) => {
  const [title, setTitle] = useState('My Document');
  const [htmlContent, setHtmlContent] = useState(`<h1>Project Overview</h1>
<p>This document was generated directly from HTML code and styled into a high-quality PDF document.</p>
<h2>Features</h2>
<ul>
  <li>Instant in-browser rendering</li>
  <li>Custom typography and margins</li>
  <li>Clean pagination</li>
</ul>`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleConvert = async () => {
    if (!htmlContent.trim()) return;
    setIsProcessing(true);
    try {
      const bytes = await htmlToPdf(htmlContent, title);
      setResultBytes(bytes);
      downloadBytes(bytes, `${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to convert HTML to PDF');
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
          HTML to PDF Converter
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Convert web HTML content, code snippets, or rich text into a downloadable PDF document.
        </p>
      </div>

      {isDone ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">HTML converted to PDF!</h2>
            <p className="text-xs text-slate-500 mt-1">Your PDF document has been downloaded.</p>
          </div>
          {resultBytes && (
            <button
              onClick={() => downloadBytes(resultBytes, `${title.replace(/\s+/g, '_').toLowerCase()}.pdf`)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF again</span>
            </button>
          )}
          <button
            onClick={() => {
              setIsDone(false);
              setResultBytes(null);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Convert more HTML
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-3xl mx-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">HTML / Rich Text Content</label>
            <textarea
              rows={10}
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <button
            disabled={isProcessing || !htmlContent.trim()}
            onClick={handleConvert}
            className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <span>Convert to PDF →</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
