import React, { useState } from 'react';
import { RefreshCw, ArrowRightLeft, HardDrive, Music, Check, Zap } from 'lucide-react';
import { convertAudio } from '../api';
import { LoadedFile, ProcessingResult } from '../types';
import { formatFileSize, formatTime } from '../utils/formatters';

interface ConverterTabProps {
  currentFile: LoadedFile;
  onProcessed: (result: ProcessingResult) => void;
}

export const ConverterTab: React.FC<ConverterTabProps> = ({ currentFile, onProcessed }) => {
  const [targetFormat, setTargetFormat] = useState<string>('mp3');
  const [bitrate, setBitrate] = useState<number>(320);
  const [customBitrate, setCustomBitrate] = useState<boolean>(false);
  const [sampleRate, setSampleRate] = useState<string>('original');
  const [channels, setChannels] = useState<string>('original');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const duration = currentFile.probe.duration || 0;
  const currentKbps = currentFile.probe.audio?.bitRate || currentFile.probe.bitRate || 0;
  const currentFormat = currentFile.probe.audio?.codec || currentFile.probe.formatName || '';

  // Formats definition
  const formats = [
    { id: 'mp3', label: 'MP3', desc: 'Universal audio, compatible with all devices', lossy: true },
    { id: 'wav', label: 'WAV', desc: 'Uncompressed raw audio, 100% studio quality', lossy: false },
    { id: 'flac', label: 'FLAC', desc: 'Lossless audio compression, audiophile favorite', lossy: false },
    { id: 'aac', label: 'AAC', desc: 'High efficiency, Apple & streaming standard', lossy: true },
    { id: 'm4a', label: 'M4A', desc: 'MPEG-4 Audio container for iOS & macOS', lossy: true },
    { id: 'ogg', label: 'OGG', desc: 'Open-source Vorbis audio format', lossy: true },
    { id: 'opus', label: 'OPUS', desc: 'Next-gen low latency & high clarity codec', lossy: true },
    { id: 'aiff', label: 'AIFF', desc: 'Apple studio uncompressed PCM', lossy: false },
    { id: 'wma', label: 'WMA', desc: 'Windows Media Audio format', lossy: true },
  ];

  const bitratePresets = [32, 64, 96, 128, 160, 192, 256, 320];

  // Calculate estimated output size
  const isLossless = targetFormat === 'wav' || targetFormat === 'aiff';
  const isFlac = targetFormat === 'flac';
  let estimatedBytes = 0;
  if (isLossless) {
    const sr = sampleRate === 'original' ? (currentFile.probe.audio?.sampleRate || 44100) : parseInt(sampleRate, 10);
    const ch = channels === 'original' ? (currentFile.probe.audio?.channels || 2) : parseInt(channels, 10);
    estimatedBytes = duration * sr * ch * 2; // 16-bit PCM
  } else if (isFlac) {
    const sr = sampleRate === 'original' ? (currentFile.probe.audio?.sampleRate || 44100) : parseInt(sampleRate, 10);
    const ch = channels === 'original' ? (currentFile.probe.audio?.channels || 2) : parseInt(channels, 10);
    estimatedBytes = duration * sr * ch * 2 * 0.6; // approx 60% compression
  } else {
    estimatedBytes = (duration * (bitrate * 1000)) / 8;
  }

  const handleConvert = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await convertAudio({
        fileId: currentFile.fileId,
        targetFormat,
        bitrate: `${bitrate}k`,
        sampleRate: sampleRate === 'original' ? undefined : sampleRate,
        channels: channels === 'original' ? undefined : channels,
      });
      onProcessed(res);
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Title & Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            Universal Audio Converter & Bitrate Scaler
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Convert to any target audio format, increase or decrease bitrate (kbps), and customize sample rates.
          </p>
        </div>

        {/* Current File Specs Badge */}
        <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500">Current: </span>
            <span className="font-semibold text-indigo-400 uppercase">{currentFormat}</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div>
            <span className="text-slate-500">Bitrate: </span>
            <span className="font-mono text-emerald-400 font-semibold">{currentKbps > 0 ? `${currentKbps} kbps` : 'Variable'}</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div>
            <span className="text-slate-500">Size: </span>
            <span className="font-mono text-slate-300">{formatFileSize(currentFile.size)}</span>
          </div>
        </div>
      </div>

      {/* Target Format Grid */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Select Target Format
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setTargetFormat(fmt.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                targetFormat === fmt.id
                  ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm tracking-wide">{fmt.label}</span>
                {targetFormat === fmt.id && (
                  <span className="w-4 h-4 bg-indigo-500 text-white rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{fmt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bitrate (kbps) Control Section */}
      <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Bitrate (kbps) Scaler
            </h4>
            <p className="text-xs text-slate-400">
              Higher kbps = richer studio sound; lower kbps = significantly smaller file size.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Bitrate:</span>
            <span className="font-mono text-lg font-bold text-indigo-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
              {targetFormat === 'wav' || targetFormat === 'flac' || targetFormat === 'aiff' ? 'Lossless' : `${bitrate} kbps`}
            </span>
          </div>
        </div>

        {targetFormat === 'wav' || targetFormat === 'flac' || targetFormat === 'aiff' ? (
          <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
            <span>ℹ️ {targetFormat.toUpperCase()} is a lossless format; bitrate is preserved at full audio fidelity without lossy compression.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Range Slider */}
            <input
              type="range"
              min="32"
              max="320"
              step="16"
              value={bitrate}
              onChange={(e) => setBitrate(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Presets:</span>
              {bitratePresets.map((b) => (
                <button
                  key={b}
                  onClick={() => setBitrate(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                    bitrate === b
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {b}k
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Audio Options: Sample Rate & Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sample Rate */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-300">Sample Rate (Hz)</label>
          <select
            value={sampleRate}
            onChange={(e) => setSampleRate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="original">Original (Keep Source)</option>
            <option value="44100">44,100 Hz (Standard CD Quality)</option>
            <option value="48000">48,000 Hz (Pro Studio / Video)</option>
            <option value="96000">96,000 Hz (High-Resolution 96k)</option>
            <option value="22050">22,050 Hz (Low Bandwidth)</option>
          </select>
        </div>

        {/* Audio Channels */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-300">Channels</label>
          <select
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="original">Original (Keep Source)</option>
            <option value="2">Stereo (2 Channels)</option>
            <option value="1">Mono (1 Channel - Voice/Speech)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Bottom Summary & Convert Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <HardDrive className="w-4 h-4 text-indigo-400" />
          <span>Estimated Output Size:</span>
          <span className="font-mono text-emerald-400 font-semibold">{formatFileSize(estimatedBytes)}</span>
          <span className="text-slate-600">({formatTime(duration)} audio)</span>
        </div>

        <button
          onClick={handleConvert}
          disabled={isProcessing}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Converting Audio...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Convert to {targetFormat.toUpperCase()} ({bitrate} kbps)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
