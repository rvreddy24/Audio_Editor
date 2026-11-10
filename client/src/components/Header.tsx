import React from 'react';
import { Mic, Plus, Radio, Play, Pause, RotateCcw, Volume2, Cpu } from 'lucide-react';
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
    <header className="border-b border-white/[0.08] bg-studio-950/90 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Engine Badge */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-[1px] shadow-neon-volt">
              <div className="w-full h-full bg-studio-950 rounded-[11px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-led ring-2 ring-studio-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white uppercase m-0 p-0 font-sans">
                SoundCraft <span className="text-emerald-400">Pro</span>
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded font-bold tracking-widest uppercase">
                STUDIO RACK
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-studio-400 font-mono mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Cpu className="w-3 h-3 text-emerald-400" /> FFmpeg 8.1.2 DSP Engine
              </span>
              <span>•</span>
              <span className="text-studio-500">32-Bit Float Internal</span>
            </div>
          </div>
        </div>

        {/* Center Transport & Timecode HUD (Visible when file is loaded) */}
        {hasFile && (
          <div className="flex items-center gap-4 bg-studio-900/90 border border-white/[0.08] px-4 py-1.5 rounded-2xl shadow-inner">
            {/* Play/Pause & Rewind Controls */}
            {onTogglePlay && onRewind && (
              <div className="flex items-center gap-1.5 pr-3 border-r border-studio-800">
                <button
                  onClick={onRewind}
                  className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-300 transition-colors"
                  title="Rewind to Start"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onTogglePlay}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${
                    isPlaying
                      ? 'bg-amber-500 text-black shadow-neon-amber'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-neon-volt'
                  }`}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
              </div>
            )}

            {/* Glowing Timecode Readout */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] tracking-widest uppercase font-mono text-studio-400">Master Timecode</span>
              <div className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                {formatTime(currentTime)}{' '}
                <span className="text-studio-600 font-normal">/</span>{' '}
                <span className="text-studio-300 font-medium">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Simulated Hardware Stereo VU Meters */}
            <div className="hidden sm:flex flex-col gap-1 pl-3 border-l border-studio-800">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-studio-500 w-3">L</span>
                <div className="w-16 h-1.5 bg-studio-950 rounded-full overflow-hidden flex gap-0.5 p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      isPlaying ? 'bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 w-[78%]' : 'bg-studio-800 w-[15%]'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-studio-500 w-3">R</span>
                <div className="w-16 h-1.5 bg-studio-950 rounded-full overflow-hidden flex gap-0.5 p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      isPlaying ? 'bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 w-[72%]' : 'bg-studio-800 w-[12%]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenRecorder}
            className="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all shadow-sm hover:shadow-neon-rose"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>MIC REC</span>
          </button>

          {hasFile && (
            <button
              onClick={onNewFile}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-studio-800 hover:bg-studio-700 text-white border border-studio-700 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>NEW SESSION</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
