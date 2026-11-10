import React, { useState, useRef } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  PenTool,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  signPdf,
  downloadBytes,
  getBufferFromFile,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface SignWorkspaceProps {
  onBack: () => void;
}

export const SignWorkspace: React.FC<SignWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Drawing canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureDataUrl('');
    }
  };

  const handleSign = async () => {
    if (!file || !signatureDataUrl) return;
    setIsProcessing(true);
    try {
      const buf = await getBufferFromFile(file);
      const resultBytes = await signPdf(buf, signatureDataUrl, 0, {
        x: 100,
        y: 100,
        width: 160,
        height: 60,
      });
      downloadBytes(resultBytes, `signed_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to sign PDF');
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
          Sign PDF
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Draw or upload your signature to stamp directly onto your PDF documents.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been signed!</h2>
            <p className="text-xs text-slate-500 mt-1">Your signed document has been downloaded.</p>
          </div>
          <button
            onClick={handleSign}
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
            Sign another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-56 h-76 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
              {/* Overlay Signature */}
              {signatureDataUrl && (
                <div className="absolute bottom-6 left-8 w-28 h-12 border border-dashed border-red-400 bg-white/80 rounded flex items-center justify-center p-1 pointer-events-none">
                  <img src={signatureDataUrl} alt="Signature stamp" className="h-full object-contain" />
                </div>
              )}
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          {/* Signature Canvas */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-teal-600" />
                  Draw Signature
                </h3>
                <button
                  onClick={clearCanvas}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Drawing Pad */}
              <div className="border border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-36 touch-none"
                />
                {!signatureDataUrl && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 pointer-events-none">
                    Sign with mouse or stylus here
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Draw your signature on the pad above to place it onto page 1.
              </p>
            </div>

            <button
              disabled={isProcessing || !signatureDataUrl}
              onClick={handleSign}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing PDF...</span>
                </>
              ) : (
                <span>Sign PDF Document →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
