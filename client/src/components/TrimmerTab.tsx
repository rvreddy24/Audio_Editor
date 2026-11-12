import React, { useState } from 'react';
import { Scissors, Sliders, Check } from 'lucide-react';
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
    const clamped = Math.max(0, Math.min(endTime - 0.01, val));
    onRangeChange(parseFloat(clamped.toFixed(3)), endTime);
  };

  const handleEndChange = (val: number) => {
    const clamped = Math.max(startTime + 0.01, Math.min(duration, val));
    onRangeChange(startTime, parseFloat(clamped.toFixed(3)));
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            Trim & Precision Cut
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Crop segments, remove unwanted audio, and apply smooth fade in/out curves.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onCutModeChange('keep')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              cutMode === 'keep'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Keep Selection
          </button>
          <button
            onClick={() => onCutModeChange('remove')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              cutMode === 'remove'
                ? 'bg-white text-rose-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cut & Remove Selection
          </button>
        </div>
      </div>

      {/* Start / End Markers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Point Card */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Start Marker
            </span>
            <button
              onClick={() => handleStartChange(currentTime)}
              className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/60 transition-colors font-medium"
            >
              Set to Current ({formatTime(currentTime)})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.001"
              min="0"
              max={endTime - 0.01}
              value={startTime.toFixed(3)}
              onChange={(e) => handleStartChange(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500 font-medium">sec</span>
          </div>

          {/* Nudge buttons */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <button onClick={() => handleStartChange(startTime - 1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">-1s</button>
            <button onClick={() => handleStartChange(startTime - 0.1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">-0.1s</button>
            <button onClick={() => handleStartChange(startTime - 0.01)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">-10ms</button>
            <button onClick={() => handleStartChange(startTime + 0.01)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">+10ms</button>
            <button onClick={() => handleStartChange(startTime + 0.1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">+0.1s</button>
            <button onClick={() => handleStartChange(startTime + 1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">+1s</button>
          </div>
        </div>

        {/* End Point Card */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
              End Marker
            </span>
            <button
              onClick={() => handleEndChange(currentTime)}
              className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/60 transition-colors font-medium"
            >
              Set to Current ({formatTime(currentTime)})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.001"
              min={startTime + 0.01}
              max={duration}
              value={endTime.toFixed(3)}
              onChange={(e) => handleEndChange(parseFloat(e.target.value) || duration)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500 font-medium">sec</span>
          </div>

          {/* Nudge buttons */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <button onClick={() => handleEndChange(endTime - 1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">-1s</button>
            <button onClick={() => handleEndChange(endTime - 0.1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">-0.1s</button>
            <button onClick={() => handleEndChange(endTime - 0.01)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">-10ms</button>
            <button onClick={() => handleEndChange(endTime + 0.01)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">+10ms</button>
            <button onClick={() => handleEndChange(endTime + 0.1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">+0.1s</button>
            <button onClick={() => handleEndChange(endTime + 1)} className="px-2 py-1 bg-white hover:bg-slate-200/60 border border-slate-200 rounded text-slate-600">+1s</button>
          </div>
        </div>
      </div>

      {/* Fades & Export Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
        {/* Fade In */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Fade In</span>
            <span className="font-mono text-indigo-600 font-semibold">{fadeIn}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={fadeIn}
            onChange={(e) => setFadeIn(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Fade Out */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Fade Out</span>
            <span className="font-mono text-indigo-600 font-semibold">{fadeOut}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={fadeOut}
            onChange={(e) => setFadeOut(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Target Format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700">Output Format</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="mp3">MP3 (Universal)</option>
            <option value="wav">WAV (Lossless PCM)</option>
            <option value="flac">FLAC (Lossless Hi-Fi)</option>
            <option value="aac">AAC (Modern Web/iOS)</option>
            <option value="m4a">M4A (Apple Audio)</option>
            <option value="opus">OPUS (Modern Voice/Streaming)</option>
          </select>
        </div>

        {/* Bitrate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700">Bitrate</label>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium disabled:opacity-40 focus:outline-none focus:border-indigo-500"
          >
            <option value="320k">320 kbps (High Quality)</option>
            <option value="256k">256 kbps</option>
            <option value="192k">192 kbps (Standard)</option>
            <option value="128k">128 kbps (Balanced)</option>
            <option value="64k">64 kbps (Voice)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500 font-medium">
          Estimated Output Duration:{' '}
          <span className="font-mono text-slate-900 font-bold">
            {cutMode === 'keep'
              ? formatTime(Math.max(0, endTime - startTime))
              : formatTime(Math.max(0, duration - (endTime - startTime)))}
          </span>
        </div>

        <button
          onClick={handleExport}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 text-xs transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Audio...
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
