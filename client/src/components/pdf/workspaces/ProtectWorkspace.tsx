import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  downloadBlob,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface ProtectWorkspaceProps {
  onBack: () => void;
}

export const ProtectWorkspace: React.FC<ProtectWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [protectedBlob, setProtectedBlob] = useState<Blob | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setProtectedBlob(null);
    }
  };

  const handleProtect = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('password', password);

      const res = await fetch('/api/pdf/protect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to encrypt PDF with password. Please check backend server.');
      }

      const blob = await res.blob();
      setProtectedBlob(blob);
      downloadBlob(blob, `protected_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to protect PDF');
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
          Protect PDF file
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been protected!</h2>
            <p className="text-xs text-slate-500 mt-1">Your password-encrypted PDF is ready.</p>
          </div>
          {protectedBlob && (
            <button
              onClick={() => downloadBlob(protectedBlob, `protected_${file.name}`)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" />
              <span>Download protected PDF again</span>
            </button>
          )}
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
              setPassword('');
              setProtectedBlob(null);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Protect another file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-56 h-[304px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-sm">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
              <div className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                Security Password
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Set Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Users will be required to type this password to open this document.
                </p>
              </div>
            </div>

            <button
              disabled={isProcessing || !password}
              onClick={handleProtect}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Protecting PDF...</span>
                </>
              ) : (
                <span>Protect PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
