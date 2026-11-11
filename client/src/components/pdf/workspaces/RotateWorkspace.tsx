import React, { useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  ArrowLeft,
  Download,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  rotateAllPages,
  downloadBytes,
  getBufferFromFile,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface RotateWorkspaceProps {
  onBack: () => void;
}

export const RotateWorkspace: React.FC<RotateWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setRotationAngle(0);
    }
  };

  const handleRotate = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      const resultBytes = await rotateAllPages(buf, rotationAngle);
      downloadBytes(resultBytes, `rotated_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to rotate PDF');
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
          Rotate PDF files
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Rotate your PDF pages the way you need them. Rotate multiple pages at once.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been rotated!</h2>
            <p className="text-xs text-slate-500 mt-1">Your rotated file has been downloaded.</p>
          </div>
          <button
            onClick={handleRotate}
            className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Download again</span>
          </button>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Rotate another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual Rotation Preview */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div
              className="w-52 h-72 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm transition-transform duration-300"
              style={{ transform: `rotate(${rotationAngle}deg)` }}
            >
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="PDF preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-16 h-16 text-slate-300" />
              )}
            </div>

            <h3 className="mt-6 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>{file.pageCount} pages</span>
              <span>•</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-6 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Rotation Options</h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRotationAngle((prev) => (prev - 90 + 360) % 360)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>Left 90°</span>
                </button>
                <button
                  onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCw className="w-4 h-4 text-indigo-600" />
                  <span>Right 90°</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span>Current Rotation:</span>
                <span className="font-bold text-slate-900">{rotationAngle}°</span>
              </div>
            </div>

            <button
              disabled={isProcessing || rotationAngle === 0}
              onClick={handleRotate}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rotating PDF...</span>
                </>
              ) : (
                <span>Rotate PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
