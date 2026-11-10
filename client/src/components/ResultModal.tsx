import React from 'react';
import { Download, CheckCircle2, RotateCcw, X, Music } from 'lucide-react';
import { ProcessingResult } from '../types';
import { formatFileSize, formatTime } from '../utils/formatters';

interface ResultModalProps {
  result: ProcessingResult | null;
  onClose: () => void;
  onLoadAsCurrent: (result: ProcessingResult) => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  onClose,
  onLoadAsCurrent
}) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Audio Processed Successfully!
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Output details card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 truncate">
            <Music className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">{result.downloadName}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block font-medium">Duration</span>
              <span className="text-slate-900 font-bold font-mono">{formatTime(result.probe.duration)}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Bitrate</span>
              <span className="text-indigo-600 font-bold font-mono">
                {result.probe.audio?.bitRate ? `${result.probe.audio.bitRate} kbps` : 'Lossless'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">File Size</span>
              <span className="text-slate-900 font-bold font-mono">{formatFileSize(result.probe.size)}</span>
            </div>
          </div>

          <div className="pt-1">
            <audio src={result.streamUrl} controls className="w-full h-10 rounded-lg" autoPlay />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <button
            onClick={() => {
              onLoadAsCurrent(result);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Continue Editing This File
          </button>

          <a
            href={result.downloadUrl}
            download={result.downloadName}
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Audio File
          </a>
        </div>
      </div>
    </div>
  );
};
