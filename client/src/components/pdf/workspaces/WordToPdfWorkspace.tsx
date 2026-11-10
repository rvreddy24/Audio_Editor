import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  FileType,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { convertWordToPdf, downloadBytes } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface WordToPdfWorkspaceProps {
  onBack: () => void;
}

export const WordToPdfWorkspace: React.FC<WordToPdfWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setErrorMessage(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const pdfBytes = await convertWordToPdf(file);
      downloadBytes(pdfBytes, `${file.name.replace(/\.docx?$/i, '')}.pdf`);
      setIsDone(true);
    } catch (err: any) {
      console.error('Word to PDF error:', err);
      const msg = err.message || 'Failed to convert Word to PDF. Please ensure the document is a valid .docx file.';
      setErrorMessage(msg);
      alert(msg);
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
          Word to PDF Converter
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Make DOC and DOCX files easy to read and share by converting them to clean PDF documents.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFilesSelected}
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          multiple={false}
          title="Select Word file"
          buttonLabel="Select Word (.docx) file"
          subtitle="or drop Word files here"
        />
      ) : isDone ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Word converted to PDF!</h2>
            <p className="text-xs text-slate-500 mt-1">Your PDF has been downloaded automatically.</p>
          </div>
          <button
            onClick={handleConvert}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF again</span>
          </button>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Convert another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-44 h-44 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <FileType className="w-20 h-20" />
            </div>
            <h3 className="mt-6 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {formatFileSize(file.size)}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Document Details
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your Word file will be parsed, paginated, and formatted into standard A4 PDF pages with high typography fidelity.
              </p>

              {errorMessage && (
                <div className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 text-center font-medium">
                  {errorMessage}
                </div>
              )}
            </div>

            <button
              disabled={isProcessing}
              onClick={handleConvert}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting Word to PDF...</span>
                </>
              ) : (
                <span>Convert to PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
