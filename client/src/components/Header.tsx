import React from 'react';
import { Activity, Mic, Plus, Sparkles, Volume2, Music4 } from 'lucide-react';

interface HeaderProps {
  onOpenRecorder: () => void;
  onNewFile: () => void;
  hasFile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRecorder, onNewFile, hasFile }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Music4 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight leading-none m-0 p-0">
                SoundCraft Studio
              </h1>
              <span className="bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                PRO SUITE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5 m-0 p-0">
              Universal Audio Converter • Precision Trimmer • Video-to-Audio • DSP Mastering
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* FFmpeg status pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            FFmpeg 8.1 Active
          </div>

          {/* Record button */}
          <button
            onClick={onOpenRecorder}
            className="bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Mic className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Record Mic</span>
          </button>

          {/* New file button */}
          {hasFile && (
            <button
              onClick={onNewFile}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New File</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
