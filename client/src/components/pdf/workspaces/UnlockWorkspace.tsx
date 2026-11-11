import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Unlock,
  FileText,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  downloadBlob,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface UnlockWorkspaceProps {
  onBack: () => void;
}

export const UnlockWorkspace: React.FC<UnlockWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setUnlockedBlob(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('password', password);

      const res = await fetch('/api/pdf/unlock', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Incorrect password or failed to decrypt PDF.');
      }

      const blob = await res.blob();
      setUnlockedBlob(blob);
      downloadBlob(blob, `unlocked_${file.name}`);
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to unlock PDF');
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
          Unlock PDF password
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Remove PDF security password so you are free to use your PDF however you want.
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
            <h2 className="text-2xl font-bold text-slate-900">PDF has been unlocked!</h2>
            <p className="text-xs text-slate-500 mt-1">Your decrypted PDF has been downloaded.</p>
          </div>
          {unlockedBlob && (
            <button
              onClick={() => downloadBlob(unlockedBlob, `unlocked_${file.name}`)}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" />
              <span>Download unlocked PDF again</span>
            </button>
          )}
          <button
            onClick={() => {
              setFile(null);
              setIsDone(false);
              setPassword('');
              setUnlockedBlob(null);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Unlock another file
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
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>
            <div className="text-xs text-slate-400 mt-1">
              {file.pageCount} pages • {formatFileSize(file.size)}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Unlock className="w-4 h-4 text-pink-600" />
                Unlock Security
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Enter PDF Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter file password (if known)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <p className="text-[11px] text-slate-400">
                  Removes read/write protection and security restrictions.
                </p>
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleUnlock}
              className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Unlocking PDF...</span>
                </>
              ) : (
                <span>Unlock PDF →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
