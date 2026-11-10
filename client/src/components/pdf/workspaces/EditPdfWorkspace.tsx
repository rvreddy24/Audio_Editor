import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  editPdf,
  downloadBytes,
  PdfFileInfo,
  AnnotationItem,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface EditPdfWorkspaceProps {
  onBack: () => void;
}

export const EditPdfWorkspace: React.FC<EditPdfWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [newText, setNewText] = useState('APPROVED');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([
    { pageIndex: 0, text: 'APPROVED', x: 80, y: 700, size: 16 },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
    }
  };

  const handleAddAnnotation = () => {
    if (!newText.trim()) return;
    setAnnotations((prev) => [
      ...prev,
      {
        pageIndex: 0,
        text: newText,
        x: 80,
        y: Math.max(100, 650 - prev.length * 40),
        size: 14,
      },
    ]);
    setNewText('');
  };

  const handleRemove = (index: number) => {
    setAnnotations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!file || annotations.length === 0) return;
    setIsProcessing(true);
    try {
      const resultBytes = await editPdf(file.data, annotations);
      downloadBytes(resultBytes, `edited_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to edit PDF');
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
          Edit PDF
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Add custom text, annotations, notes, and remarks directly onto your PDF documents.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF successfully edited!</h2>
            <p className="text-xs text-slate-500 mt-1">Your document with annotations is downloaded.</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Edit another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview with text annotations */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-64 h-88 bg-slate-50 rounded-2xl border border-slate-200 relative flex items-center justify-center overflow-hidden shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
              {/* Annotation overlays */}
              {annotations.map((a, idx) => (
                <div
                  key={idx}
                  className="absolute bg-indigo-50 border border-indigo-300 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold shadow-2xs pointer-events-none select-none"
                  style={{
                    left: `${Math.min(70, a.x * 0.15)}%`,
                    bottom: `${Math.min(80, a.y * 0.12)}%`,
                  }}
                >
                  {a.text}
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
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-violet-600" />
                Add Text Annotation
              </h3>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text remark"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <button
                    onClick={handleAddAnnotation}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 rounded-xl text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Added annotations list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 pt-2">
                {annotations.map((a, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800 truncate max-w-[160px]">{a.text}</span>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={isProcessing || annotations.length === 0}
              onClick={handleSave}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving edits...</span>
                </>
              ) : (
                <span>Save Edited PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
