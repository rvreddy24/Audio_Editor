import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Stamp,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  addWatermarkToPdf,
  downloadBytes,
  getBufferFromFile,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface WatermarkWorkspaceProps {
  onBack: () => void;
}

export const WatermarkWorkspace: React.FC<WatermarkWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(36);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<
    'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('center');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
    }
  };

  const handleWatermark = async () => {
    if (!file || !text.trim()) return;
    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      const resultBytes = await addWatermarkToPdf(buf, {
        text,
        opacity,
        fontSize,
        rotation,
        position,
      });
      downloadBytes(resultBytes, `watermarked_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to add watermark to PDF');
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
          Watermark PDF
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Stamp text or confidentiality notices over your PDF in seconds.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been watermarked!</h2>
            <p className="text-xs text-slate-500 mt-1">Your watermarked PDF has been downloaded.</p>
          </div>
          <button
            onClick={handleWatermark}
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
            Watermark another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Preview */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-64 h-88 bg-slate-50 rounded-2xl border border-slate-200 relative flex items-center justify-center overflow-hidden shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}

              {/* Watermark Overlay in preview */}
              <div
                className="absolute font-bold text-red-600 pointer-events-none select-none tracking-wider whitespace-nowrap"
                style={{
                  opacity,
                  fontSize: `${fontSize * 0.6}px`,
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {text || 'PREVIEW'}
              </div>
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Stamp className="w-4 h-4 text-rose-500" />
                Watermark Options
              </h3>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Watermark Text</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Transparency:</span>
                  <span className="font-mono text-slate-900">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>

              {/* Font size */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Font Size:</span>
                  <span className="font-mono text-slate-900">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="60"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-red-600"
                />
              </div>

              {/* Rotation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Rotation Angle</label>
                <div className="grid grid-cols-3 gap-2">
                  {[-45, 0, 45].map((ang) => (
                    <button
                      key={ang}
                      onClick={() => setRotation(ang)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        rotation === ang
                          ? 'bg-red-50 text-[#e5322d] border-red-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {ang}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPosition('center')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      position === 'center'
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => setPosition('bottom-right')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      position === 'bottom-right'
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Bottom Right
                  </button>
                </div>
              </div>
            </div>

            <button
              disabled={isProcessing || !text.trim()}
              onClick={handleWatermark}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding Watermark...</span>
                </>
              ) : (
                <span>Add Watermark →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
