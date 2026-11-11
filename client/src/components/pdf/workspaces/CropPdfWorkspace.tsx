import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Crop,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  cropPdf,
  downloadBytes,
  getBufferFromFile,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface CropPdfWorkspaceProps {
  onBack: () => void;
}

export const CropPdfWorkspace: React.FC<CropPdfWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [top, setTop] = useState(30);
  const [bottom, setBottom] = useState(30);
  const [left, setLeft] = useState(30);
  const [right, setRight] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [croppedBytes, setCroppedBytes] = useState<Uint8Array | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setCroppedBytes(null);
    }
  };

  const handleCrop = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      const resultBytes = await cropPdf(buf, { top, right, bottom, left });
      setCroppedBytes(resultBytes);
      downloadBytes(resultBytes, `cropped_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to crop PDF');
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
          Crop PDF pages
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Trim page margins and crop borders to customize page dimensions.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been cropped!</h2>
            <p className="text-xs text-slate-500 mt-1">Your cropped document has been downloaded.</p>
          </div>
          {croppedBytes && (
            <button
              onClick={() => downloadBytes(croppedBytes, `cropped_${file.name}`)}
              className="bg-lime-600 hover:bg-lime-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" />
              <span>Download cropped PDF again</span>
            </button>
          )}
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
              setCroppedBytes(null);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Crop another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual Crop Box Preview */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-60 h-80 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
              {/* Crop Boundary Indicator */}
              <div
                className="absolute border-2 border-dashed border-red-500 bg-red-500/10 transition-all pointer-events-none"
                style={{
                  top: `${Math.min(35, top * 0.4)}%`,
                  bottom: `${Math.min(35, bottom * 0.4)}%`,
                  left: `${Math.min(35, left * 0.4)}%`,
                  right: `${Math.min(35, right * 0.4)}%`,
                }}
              />
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          {/* Margins Sliders */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Crop className="w-4 h-4 text-lime-600" />
                Crop Margins (pt)
              </h3>

              {/* Top */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Top Trim:</span>
                  <span className="font-mono">{top}pt</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={top}
                  onChange={(e) => setTop(parseInt(e.target.value, 10))}
                  className="w-full accent-lime-600"
                />
              </div>

              {/* Bottom */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Bottom Trim:</span>
                  <span className="font-mono">{bottom}pt</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bottom}
                  onChange={(e) => setBottom(parseInt(e.target.value, 10))}
                  className="w-full accent-lime-600"
                />
              </div>

              {/* Left */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Left Trim:</span>
                  <span className="font-mono">{left}pt</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={left}
                  onChange={(e) => setLeft(parseInt(e.target.value, 10))}
                  className="w-full accent-lime-600"
                />
              </div>

              {/* Right */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Right Trim:</span>
                  <span className="font-mono">{right}pt</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={right}
                  onChange={(e) => setRight(parseInt(e.target.value, 10))}
                  className="w-full accent-lime-600"
                />
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleCrop}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cropping PDF...</span>
                </>
              ) : (
                <span>Crop PDF Pages →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
