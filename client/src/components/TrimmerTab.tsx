import React, { useState } from 'react';
import { Scissors, Download, Sparkles, Sliders, ArrowRight } from 'lucide-react';
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

  const nudgeStart = (delta: number) => {
    handleStartChange(startTime + delta);
  };

  const nudgeEnd = (delta: number) => {
    handleEndChange(endTime + delta);
  };

  const setStartToPlayhead = () => {
    handleStartChange(currentTime);
  };

  const setEndToPlayhead = () => {
    handleEndChange(currentTime);
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-400" />
            Audio Trimmer & Precision Cutter
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Crop segments, remove unwanted silence or mistakes, and apply smooth fade in/out envelopes.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onCutModeChange('keep')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              cutMode === 'keep'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Keep Selection
          </button>
          <button
            onClick={() => onCutModeChange('remove')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              cutMode === 'remove'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Remove Selection (Splice)
          </button>
        </div>
      </div>

      {/* Numerical Time Inputs and Playhead buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Point Card */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Start Marker
            </span>
            <button
              onClick={setStartToPlayhead}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 px-2 py-1 rounded-md border border-indigo-800/40"
            >
              Set to Current Playhead ({formatTime(currentTime)})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max={endTime - 0.05}
              value={startTime.toFixed(2)}
              onChange={(e) => handleStartChange(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-emerald-400 font-semibold focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500 font-mono">seconds</span>
          </div>

          {/* Nudge buttons */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button onClick={() => nudgeStart(-1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">-1s</button>
            <button onClick={() => nudgeStart(-0.1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">-0.1s</button>
            <button onClick={() => nudgeStart(0.1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">+0.1s</button>
            <button onClick={() => nudgeStart(1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">+1s</button>
          </div>
        </div>

        {/* End Point Card */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              End Marker
            </span>
            <button
              onClick={setEndToPlayhead}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 px-2 py-1 rounded-md border border-indigo-800/40"
            >
              Set to Current Playhead ({formatTime(currentTime)})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min={startTime + 0.05}
              max={duration}
              value={endTime.toFixed(2)}
              onChange={(e) => handleEndChange(parseFloat(e.target.value) || duration)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-rose-400 font-semibold focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500 font-mono">seconds</span>
          </div>

          {/* Nudge buttons */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button onClick={() => nudgeEnd(-1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">-1s</button>
            <button onClick={() => nudgeEnd(-0.1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">-0.1s</button>
            <button onClick={() => nudgeEnd(0.1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">+0.1s</button>
            <button onClick={() => nudgeEnd(1)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">+1s</button>
          </div>
        </div>
      </div>

      {/* Fades & Export Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
        {/* Fade In */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Fade In</span>
            <span className="font-mono text-indigo-400">{fadeIn}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={fadeIn}
            onChange={(e) => setFadeIn(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Fade Out */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Fade Out</span>
            <span className="font-mono text-indigo-400">{fadeOut}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={fadeOut}
            onChange={(e) => setFadeOut(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Target Format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-300">Export Format</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="mp3">MP3 (Universal)</option>
            <option value="wav">WAV (Lossless PCM)</option>
            <option value="flac">FLAC (Lossless Hi-Fi)</option>
            <option value="aac">AAC (Modern Web/iOS)</option>
            <option value="m4a">M4A (Apple Audio)</option>
            <option value="ogg">OGG (Vorbis)</option>
            <option value="opus">OPUS (Modern Voice/Streaming)</option>
          </select>
        </div>

        {/* Bitrate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-300">Bitrate (Quality)</label>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-40 focus:outline-none focus:border-indigo-500"
          >
            <option value="320k">320 kbps (Maximum Studio)</option>
            <option value="256k">256 kbps (High Fidelity)</option>
            <option value="192k">192 kbps (Standard High)</option>
            <option value="128k">128 kbps (Balanced)</option>
            <option value="96k">96 kbps (Compact)</option>
            <option value="64k">64 kbps (Voice / Low Size)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Export Action Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400">
          Result Duration:{' '}
          <span className="font-mono text-white font-semibold">
            {cutMode === 'keep'
              ? formatTime(Math.max(0, endTime - startTime))
              : formatTime(Math.max(0, duration - (endTime - startTime)))}
          </span>
        </div>

        <button
          onClick={handleExport}
          disabled={isProcessing}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing with FFmpeg...
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4" />
              {cutMode === 'keep' ? 'Trim & Export Selection' : 'Cut Out & Splice Remainder'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
