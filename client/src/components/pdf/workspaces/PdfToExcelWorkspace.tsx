import React, { useState } from 'react';
import {
  Download,
  Loader2,
  ArrowLeft,
  Sheet,
  Copy,
  Check,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { parsePdfFile, PdfFileInfo, extractPdfToCsv, downloadBlob, getBufferFromFile } from '../../../utils/pdfOperations';

interface PdfToExcelWorkspaceProps {
  onBack: () => void;
}

export const PdfToExcelWorkspace: React.FC<PdfToExcelWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setIsProcessing(true);
      try {
        const buf = await getBufferFromFile(parsed);
        const csv = await extractPdfToCsv(buf);
        setCsvContent(csv);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${file?.name.replace(/\.pdf$/i, '')}_data.csv`);
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
          PDF to Excel / CSV
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Extract tabular data and spreadsheets from PDF straight into editable CSV format.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Select PDF file"
          buttonLabel="Select PDF file"
        />
      ) : isProcessing ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <h3 className="font-bold text-slate-800 text-base">Extracting tabular data from PDF...</h3>
          <p className="text-xs text-slate-400">Parsing text rows and structuring columns</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{file.name}</h3>
              <p className="text-xs text-slate-400">Extracted table rows in CSV format</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy CSV'}</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .csv</span>
              </button>
            </div>
          </div>

          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            rows={12}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none"
          />

          <div className="text-center">
            <button
              onClick={() => {
                setFile(null);
                setCsvContent('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Convert another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
