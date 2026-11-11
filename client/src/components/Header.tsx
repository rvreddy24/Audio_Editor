import React from 'react';
import { Mic, Plus, Radio, Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface HeaderProps {
  onOpenRecorder: () => void;
  onNewFile: () => void;
  hasFile: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onRewind?: () => void;
  currentTime?: number;
  duration?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRecorder,
  onNewFile,
  hasFile,
  isPlaying = false,
  onTogglePlay,
  onRewind,
  currentTime = 0,
  duration = 0,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
            <img src="/rv-logo.png" alt="rajvarshith.com logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 m-0 p-0 font-sans">
                Audio Studio
              </h1>
              <span className="bg-orange-50 text-orange-700 border border-orange-200/60 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
                Studio 320k
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 m-0 p-0 font-normal">
              rajvarshith.com Pro Audio Suite
            </p>
          </div>
        </div>

        {/* Center Transport & Timecode Readout (When active file loaded) */}
        {hasFile && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl shadow-xs">
            {onTogglePlay && onRewind && (
              <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">
                <button
                  onClick={onRewind}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                  title="Rewind to In-point"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onTogglePlay}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="font-semibold text-slate-900">{formatTime(currentTime)}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500 font-medium">{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2.5">
          {/* Record Microphone Button */}
          <button
            onClick={onOpenRecorder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <Mic className="w-3.5 h-3.5 text-rose-600" />
            <span>Record Mic</span>
          </button>

          {/* New Session Button */}
          {hasFile && (
            <button
              onClick={onNewFile}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
