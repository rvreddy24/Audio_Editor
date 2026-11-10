import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Sheet,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { parsePdfFile, PdfFileInfo, downloadBlob } from '../../../utils/pdfOperations';
import { convertPdfToExcelXlsx } from '../../../utils/officeOperations';
import { formatFileSize } from '../../../utils/formatters';

interface PdfToExcelXlsxWorkspaceProps {
  onBack: () => void;
}

export const PdfToExcelXlsxWorkspace: React.FC<PdfToExcelXlsxWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const xlsxBlob = await convertPdfToExcelXlsx(file.data);
      downloadBlob(xlsxBlob, `${file.name.replace(/\.pdf$/i, '')}.xlsx`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to convert PDF to Excel');
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
          PDF to Excel (.xlsx) Converter
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Extract tables and data from your PDF straight into an editable Microsoft Excel (.xlsx) spreadsheet.
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
            <h2 className="text-2xl font-bold text-slate-900">Converted to Excel (.xlsx)!</h2>
            <p className="text-xs text-slate-500 mt-1">Your editable Excel workbook has been downloaded.</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Convert another PDF
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-56 h-76 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sheet className="w-4 h-4 text-emerald-600" />
                Excel (.xlsx) Options
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Extracts columns and tabular rows from all PDF pages into native Excel workbook cells for calculation and formulas.
              </p>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleConvert}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Excel file...</span>
                </>
              ) : (
                <span>Convert to Excel (.xlsx) →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
