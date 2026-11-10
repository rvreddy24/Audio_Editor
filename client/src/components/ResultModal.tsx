import React from 'react';
import { Download, CheckCircle2, RotateCcw, ArrowRight, X, Music, HardDrive, Clock } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            Audio Processed Successfully!
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Output details card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white truncate">
            <Music className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">{result.downloadName}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-slate-500 block">Duration</span>
              <span className="font-mono text-white font-semibold">{formatTime(result.probe.duration)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bitrate</span>
              <span className="font-mono text-indigo-400 font-semibold">
                {result.probe.audio?.bitRate ? `${result.probe.audio.bitRate} kbps` : 'Lossless'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">File Size</span>
              <span className="font-mono text-emerald-400 font-semibold">{formatFileSize(result.probe.size)}</span>
            </div>
          </div>

          {/* Integrated audio player */}
          <div className="pt-2">
            <audio src={result.streamUrl} controls className="w-full h-10 rounded-lg" autoPlay />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              onLoadAsCurrent(result);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            Continue Editing This Result
          </button>

          <a
            href={result.downloadUrl}
            download={result.downloadName}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            Download Audio File
          </a>
        </div>
      </div>
    </div>
  );
};
