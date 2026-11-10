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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="bg-studio-950 border border-emerald-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-neon-volt flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5 text-emerald-400 font-extrabold font-mono text-sm uppercase tracking-wide">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            AUDIO MASTERED & RENDERED!
          </div>
          <button onClick={onClose} className="text-studio-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Output details card */}
        <div className="bg-studio-900/90 p-4 rounded-2xl border border-white/[0.06] flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5 text-sm font-mono font-bold text-white truncate">
            <Music className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{result.downloadName}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs bg-studio-950 p-3 rounded-xl border border-white/[0.04] font-mono">
            <div>
              <span className="text-[10px] text-studio-500 block uppercase">LENGTH</span>
              <span className="text-white font-extrabold">{formatTime(result.probe.duration)}</span>
            </div>
            <div>
              <span className="text-[10px] text-studio-500 block uppercase">BITRATE</span>
              <span className="text-emerald-400 font-extrabold">
                {result.probe.audio?.bitRate ? `${result.probe.audio.bitRate} kbps` : 'Lossless'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-studio-500 block uppercase">FILE SIZE</span>
              <span className="text-cyan-400 font-extrabold">{formatFileSize(result.probe.size)}</span>
            </div>
          </div>

          {/* Player */}
          <div className="pt-1">
            <audio src={result.streamUrl} controls className="w-full h-10 rounded-xl" autoPlay />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              onLoadAsCurrent(result);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-studio-900 hover:bg-studio-850 text-studio-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border border-white/[0.06] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            CONTINUE EDITING RESULT
          </button>

          <a
            href={result.downloadUrl}
            download={result.downloadName}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black rounded-xl text-xs font-mono font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-neon-volt transition-all"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD MASTER AUDIO
          </a>
        </div>
      </div>
    </div>
  );
};
