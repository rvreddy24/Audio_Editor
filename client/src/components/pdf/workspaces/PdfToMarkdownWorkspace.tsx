import React, { useState } from 'react';
import {
  Download,
  Loader2,
  ArrowLeft,
  FileCode,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { parsePdfFile, PdfFileInfo, extractPdfToMarkdown, downloadBlob, getBufferFromFile } from '../../../utils/pdfOperations';

interface PdfToMarkdownWorkspaceProps {
  onBack: () => void;
}

export const PdfToMarkdownWorkspace: React.FC<PdfToMarkdownWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setIsProcessing(true);
      try {
        const buf = await getBufferFromFile(parsed);
        const md = await extractPdfToMarkdown(buf, parsed.name);
        setMarkdown(md);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${file?.name.replace(/\.pdf$/i, '')}.md`);
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
          PDF to Markdown
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Extract clean structured text, headers, and Markdown syntax from your PDF files.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Select PDF file"
          buttonLabel="Select PDF file"
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{file.name}</h3>
              <p className="text-xs text-slate-400">{file.pageCount} pages parsed into Markdown</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
              </button>
              <button
                onClick={handleDownloadMd}
                className="px-4 py-1.5 rounded-lg bg-[#e5322d] hover:bg-[#d02824] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={14}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />

          <div className="text-center">
            <button
              onClick={() => {
                setFile(null);
                setMarkdown('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Convert another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
