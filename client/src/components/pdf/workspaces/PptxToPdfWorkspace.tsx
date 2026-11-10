import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Presentation,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { convertPptxToPdf } from '../../../utils/officeOperations';
import { downloadBytes } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface PptxToPdfWorkspaceProps {
  onBack: () => void;
}

export const PptxToPdfWorkspace: React.FC<PptxToPdfWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await convertPptxToPdf(file);
      downloadBytes(pdfBytes, `${file.name.replace(/\.pptx?$/i, '')}.pdf`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to convert PowerPoint to PDF');
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
          <span>All Tools</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          PowerPoint to PDF Converter
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Make PPT and PPTX slideshows easy to view by converting them to clean PDF slide decks.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
          multiple={false}
          title="Select PowerPoint file"
          buttonLabel="Select PPT / PPTX file"
          subtitle="or drop presentation files here"
        />
      ) : isDone ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Presentation converted to PDF!</h2>
            <p className="text-xs text-slate-500 mt-1">Your PDF slideshow has been downloaded.</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Convert another presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-44 h-44 rounded-3xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
              <Presentation className="w-20 h-20" />
            </div>
            <h3 className="mt-6 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">{formatFileSize(file.size)}</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Presentation className="w-4 h-4 text-orange-600" />
                Presentation Settings
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Slides will be converted into high-resolution widescreen 16:9 PDF pages suitable for printing and presenting.
              </p>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleConvert}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting PPTX to PDF...</span>
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
