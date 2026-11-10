import React, { useState } from 'react';
import { Scissors, Sparkles, Sliders, Check, ArrowRight } from 'lucide-react';
import { trimAudio } from '../api';
import { LoadedFile, ProcessingResult } from '../types';
import { formatTime } from '../utils/formatters';

interface TrimmerTabProps {
  currentFile: LoadedFile;
  startTime: number;
  endTime: number;
  currentTime: number;
  onRangeChange: (start: number, end: number) => void;
  cutMode: 'keep' | 'remove';
  onCutModeChange: (mode: 'keep' | 'remove') => void;
  onProcessed: (result: ProcessingResult) => void;
}

export const TrimmerTab: React.FC<TrimmerTabProps> = ({
  currentFile,
  startTime,
  endTime,
  currentTime,
  onRangeChange,
  cutMode,
  onCutModeChange,
  onProcessed
}) => {
  const [fadeIn, setFadeIn] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState<number>(0);
  const [targetFormat, setTargetFormat] = useState<string>('mp3');
  const [bitrate, setBitrate] = useState<string>('320k');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const duration = currentFile.probe.duration || 0;

  const handleStartChange = (val: number) => {
    const clamped = Math.max(0, Math.min(endTime - 0.05, val));
    onRangeChange(clamped, endTime);
  };

  const handleEndChange = (val: number) => {
    const clamped = Math.max(startTime + 0.05, Math.min(duration, val));
    onRangeChange(startTime, clamped);
  };

  const handleExport = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await trimAudio({
        fileId: currentFile.fileId,
        start: startTime,
        end: endTime,
        mode: cutMode,
        fadeIn,
        fadeOut,
        targetFormat,
        bitrate
      });
      onProcessed(res);
    } catch (err: any) {
      setError(err.message || 'Trimming failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="studio-glass rounded-2xl p-6 shadow-2xl flex flex-col gap-6 border border-white/[0.08]">
      {/* Module Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scissors className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight uppercase font-sans">
              Precision Waveform Trimmer & Splice Unit
            </h3>
          </div>
          <p className="text-[11px] text-studio-400 font-mono mt-1">
            Frame-accurate cutting, splice removal, and analog fade curve envelopes.
          </p>
        </div>

        {/* Mode Toggle Switcher */}
        <div className="flex items-center bg-studio-950 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => onCutModeChange('keep')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider transition-all ${
              cutMode === 'keep'
                ? 'bg-emerald-500 text-black shadow-neon-volt'
                : 'text-studio-400 hover:text-white'
            }`}
          >
            KEEP SELECTION
          </button>
          <button
            onClick={() => onCutModeChange('remove')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider transition-all ${
              cutMode === 'remove'
                ? 'bg-rose-500 text-white shadow-neon-rose'
                : 'text-studio-400 hover:text-white'
            }`}
          >
            CUT & SPLICE OUT
          </button>
        </div>
      </div>

      {/* Dual In/Out Precision Marker Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IN Marker */}
        <div className="bg-studio-950/70 p-4 rounded-xl border border-emerald-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                IN-POINT (START)
              </span>
            </div>
            <button
              onClick={() => handleStartChange(currentTime)}
              className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30 transition-colors"
            >
              SNAP TO PLAYHEAD ({formatTime(currentTime)})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-studio-900 border border-studio-800 rounded-xl px-3 py-2 flex items-center justify-between">
              <input
                type="number"
                step="0.01"
                min="0"
                max={endTime - 0.05}
                value={startTime.toFixed(2)}
                onChange={(e) => handleStartChange(parseFloat(e.target.value) || 0)}
                className="bg-transparent font-mono text-xl font-black text-emerald-400 focus:outline-none w-full"
              />
              <span className="text-xs text-studio-500 font-mono font-semibold">SEC</span>
            </div>
          </div>

          {/* Micro Nudge Buttons */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
            <button onClick={() => handleStartChange(startTime - 1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">-1.0s</button>
            <button onClick={() => handleStartChange(startTime - 0.1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">-0.1s</button>
            <button onClick={() => handleStartChange(startTime + 0.1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">+0.1s</button>
            <button onClick={() => handleStartChange(startTime + 1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">+1.0s</button>
          </div>
        </div>

        {/* OUT Marker */}
        <div className="bg-studio-950/70 p-4 rounded-xl border border-rose-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-rose-400 uppercase">
                OUT-POINT (END)
              </span>
            </div>
            <button
              onClick={() => handleEndChange(currentTime)}
              className="text-[10px] font-mono font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-md border border-rose-500/30 transition-colors"
            >
              SNAP TO PLAYHEAD ({formatTime(currentTime)})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-studio-900 border border-studio-800 rounded-xl px-3 py-2 flex items-center justify-between">
              <input
                type="number"
                step="0.01"
                min={startTime + 0.05}
                max={duration}
                value={endTime.toFixed(2)}
                onChange={(e) => handleEndChange(parseFloat(e.target.value) || duration)}
                className="bg-transparent font-mono text-xl font-black text-rose-400 focus:outline-none w-full"
              />
              <span className="text-xs text-studio-500 font-mono font-semibold">SEC</span>
            </div>
          </div>

          {/* Micro Nudge Buttons */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
            <button onClick={() => handleEndChange(endTime - 1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">-1.0s</button>
            <button onClick={() => handleEndChange(endTime - 0.1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">-0.1s</button>
            <button onClick={() => handleEndChange(endTime + 0.1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">+0.1s</button>
            <button onClick={() => handleEndChange(endTime + 1)} className="py-1 bg-studio-900 hover:bg-studio-800 border border-white/[0.04] rounded text-studio-300">+1.0s</button>
          </div>
        </div>
      </div>

      {/* Faders and Audio Container Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-studio-950/60 rounded-xl border border-white/[0.06]">
        {/* Fade In */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-studio-400">
            <span>FADE IN</span>
            <span className="font-bold text-emerald-400 text-xs">{fadeIn}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={fadeIn}
            onChange={(e) => setFadeIn(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
          />
        </div>

        {/* Fade Out */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-studio-400">
            <span>FADE OUT</span>
            <span className="font-bold text-rose-400 text-xs">{fadeOut}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={fadeOut}
            onChange={(e) => setFadeOut(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
          />
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase text-studio-400 tracking-wider">OUTPUT FORMAT</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-studio-900 border border-studio-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="mp3">MP3 Universal</option>
            <option value="wav">WAV Lossless PCM</option>
            <option value="flac">FLAC Hi-Fi Master</option>
            <option value="aac">AAC Low-Latency</option>
            <option value="m4a">M4A Apple Core</option>
            <option value="opus">OPUS Next-Gen</option>
          </select>
        </div>

        {/* Bitrate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase text-studio-400 tracking-wider">TARGET BITRATE</label>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-studio-900 border border-studio-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono disabled:opacity-40 focus:outline-none focus:border-emerald-500"
          >
            <option value="320k">320 kbps (Maximum)</option>
            <option value="256k">256 kbps (High Fidelity)</option>
            <option value="192k">192 kbps (Standard Pro)</option>
            <option value="128k">128 kbps (Balanced)</option>
            <option value="64k">64 kbps (Voice Voice)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-mono">
          ERROR: {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-mono text-studio-400">
          <span>OUTPUT LENGTH:</span>
          <span className="text-white font-extrabold text-sm">
            {cutMode === 'keep'
              ? formatTime(Math.max(0, endTime - startTime))
              : formatTime(Math.max(0, duration - (endTime - startTime)))}
          </span>
        </div>

        <button
          onClick={handleExport}
          disabled={isProcessing}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold px-6 py-2.5 rounded-xl shadow-neon-volt flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              RENDERING AUDIO WITH FFMPEG...
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4" />
              {cutMode === 'keep' ? 'RENDER & EXPORT SELECTION' : 'SPLICE & REMOVE SELECTION'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
