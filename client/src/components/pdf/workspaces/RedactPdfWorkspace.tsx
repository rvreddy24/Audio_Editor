import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  redactPdf,
  downloadBytes,
  PdfFileInfo,
  RedactionBox,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface RedactPdfWorkspaceProps {
  onBack: () => void;
}

export const RedactPdfWorkspace: React.FC<RedactPdfWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [redactions, setRedactions] = useState<RedactionBox[]>([
    { pageIndex: 0, x: 50, y: 500, width: 250, height: 30 },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
    }
  };

  const handleAddBox = () => {
    setRedactions((prev) => [
      ...prev,
      { pageIndex: 0, x: 50, y: Math.max(100, 600 - prev.length * 40), width: 200, height: 25 },
    ]);
  };

  const handleRemoveBox = (index: number) => {
    setRedactions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRedact = async () => {
    if (!file || redactions.length === 0) return;
    setIsProcessing(true);
    try {
      const resultBytes = await redactPdf(file.data, redactions);
      downloadBytes(resultBytes, `redacted_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to redact PDF');
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
          Redact PDF
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Permanently black out and sanitize confidential text, personal data, or numbers.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been redacted!</h2>
            <p className="text-xs text-slate-500 mt-1">Your sanitized PDF is downloaded.</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Redact another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview with Blackout Boxes */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-64 h-88 bg-slate-50 rounded-2xl border border-slate-200 relative flex items-center justify-center overflow-hidden shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
              {/* Overlay Black Boxes */}
              {redactions.map((box, idx) => (
                <div
                  key={idx}
                  className="absolute bg-black/90 text-[10px] text-white flex items-center justify-center font-mono"
                  style={{
                    left: `${Math.min(70, box.x * 0.15)}%`,
                    bottom: `${Math.min(80, box.y * 0.12)}%`,
                    width: `${Math.min(180, box.width * 0.5)}px`,
                    height: `${Math.min(40, box.height * 0.7)}px`,
                  }}
                >
                  REDACTED
                </div>
              ))}
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-zinc-800" />
                  Redaction Areas ({redactions.length})
                </h3>
                <button
                  onClick={handleAddBox}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Box</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {redactions.map((box, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">Box #{idx + 1}</span>
                      <div className="text-[11px] text-slate-400">
                        {box.width}x{box.height}pt @ ({box.x}, {box.y})
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBox(idx)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={isProcessing || redactions.length === 0}
              onClick={handleRedact}
              className="w-full bg-zinc-900 hover:bg-black disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sanitizing document...</span>
                </>
              ) : (
                <span>Permanently Redact PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
