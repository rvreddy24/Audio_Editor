import React, { useState } from 'react';
import { RefreshCw, ArrowRightLeft, HardDrive, Check, Zap, Cpu } from 'lucide-react';
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
  const [sampleRate, setSampleRate] = useState<string>('original');
  const [channels, setChannels] = useState<string>('original');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const duration = currentFile.probe.duration || 0;
  const currentKbps = currentFile.probe.audio?.bitRate || currentFile.probe.bitRate || 0;
  const currentFormat = currentFile.probe.audio?.codec || currentFile.probe.formatName || '';

  const formats = [
    { id: 'mp3', label: 'MP3', desc: 'Universal audio standard', tag: 'CBR/VBR' },
    { id: 'wav', label: 'WAV', desc: 'Studio uncompressed PCM', tag: '100% Lossless' },
    { id: 'flac', label: 'FLAC', desc: 'Hi-Fi audiophile compression', tag: 'Lossless' },
    { id: 'aac', label: 'AAC', desc: 'High-efficiency stream codec', tag: 'Apple Core' },
    { id: 'm4a', label: 'M4A', desc: 'MPEG-4 Audio container', tag: 'iOS Standard' },
    { id: 'ogg', label: 'OGG', desc: 'Open-source Vorbis stream', tag: 'Open Codec' },
    { id: 'opus', label: 'OPUS', desc: 'Ultra-low latency speech', tag: 'Next-Gen' },
    { id: 'aiff', label: 'AIFF', desc: 'Apple uncompressed PCM', tag: 'Lossless' },
    { id: 'wma', label: 'WMA', desc: 'Windows Media Audio', tag: 'Legacy' },
  ];

  const bitratePresets = [32, 64, 96, 128, 160, 192, 256, 320];

  const isLossless = targetFormat === 'wav' || targetFormat === 'aiff';
  const isFlac = targetFormat === 'flac';
  let estimatedBytes = 0;
  if (isLossless) {
    const sr = sampleRate === 'original' ? (currentFile.probe.audio?.sampleRate || 44100) : parseInt(sampleRate, 10);
    const ch = channels === 'original' ? (currentFile.probe.audio?.channels || 2) : parseInt(channels, 10);
    estimatedBytes = duration * sr * ch * 2;
  } else if (isFlac) {
    const sr = sampleRate === 'original' ? (currentFile.probe.audio?.sampleRate || 44100) : parseInt(sampleRate, 10);
    const ch = channels === 'original' ? (currentFile.probe.audio?.channels || 2) : parseInt(channels, 10);
    estimatedBytes = duration * sr * ch * 2 * 0.6;
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
    <div className="studio-glass rounded-2xl p-6 shadow-2xl flex flex-col gap-6 border border-white/[0.08]">
      {/* Title & Current Audio Hardware Specs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <RefreshCw className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight uppercase font-sans">
              Universal Audio Transcoder & Bitrate Scaler
            </h3>
          </div>
          <p className="text-[11px] text-studio-400 font-mono mt-1">
            Re-encode, compress or uncompress, scale kbps bitrate, and customize sampling clock rates.
          </p>
        </div>

        {/* Source Specs Pill */}
        <div className="flex items-center gap-3 bg-studio-950 px-3.5 py-1.5 rounded-xl border border-white/[0.06] text-xs font-mono">
          <div>
            <span className="text-studio-500 text-[10px] uppercase">SOURCE: </span>
            <span className="font-extrabold text-cyan-400 uppercase">{currentFormat}</span>
          </div>
          <span className="text-studio-700">|</span>
          <div>
            <span className="text-studio-500 text-[10px] uppercase">BITRATE: </span>
            <span className="font-extrabold text-emerald-400">{currentKbps > 0 ? `${currentKbps} kbps` : 'Variable'}</span>
          </div>
          <span className="text-studio-700">|</span>
          <div>
            <span className="text-studio-500 text-[10px] uppercase">SIZE: </span>
            <span className="font-semibold text-studio-200">{formatFileSize(currentFile.size)}</span>
          </div>
        </div>
      </div>

      {/* Target Format Matrix */}
      <div className="flex flex-col gap-2.5">
        <label className="text-[10px] font-mono font-bold tracking-widest uppercase text-studio-400">
          CHOOSE TARGET FORMAT
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {formats.map((fmt) => {
            const isSelected = targetFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setTargetFormat(fmt.id)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-neon-cyan'
                    : 'bg-studio-950/70 border-white/[0.06] hover:border-white/[0.15] text-studio-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-extrabold text-sm tracking-wide">{fmt.label}</span>
                  {isSelected ? (
                    <span className="w-4 h-4 bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-studio-500 uppercase">{fmt.tag}</span>
                  )}
                </div>
                <span className="text-[10px] text-studio-400 mt-1 line-clamp-1">{fmt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bitrate (kbps) Control Rack */}
      <div className="bg-studio-950/70 p-5 rounded-xl border border-white/[0.06] flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Bitrate (kbps) Scaling Unit
            </span>
            <p className="text-[11px] text-studio-400 font-mono mt-0.5">
              Control audio density. Higher kbps gives richer studio fidelity; lower kbps creates ultra-compact files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-studio-400">TARGET:</span>
            <span className="font-mono text-lg font-black text-amber-400 bg-studio-900 px-3 py-1 rounded-xl border border-amber-500/30">
              {targetFormat === 'wav' || targetFormat === 'flac' || targetFormat === 'aiff' ? 'LOSSLESS' : `${bitrate} kbps`}
            </span>
          </div>
        </div>

        {targetFormat === 'wav' || targetFormat === 'flac' || targetFormat === 'aiff' ? (
          <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Format {targetFormat.toUpperCase()} preserves full master sample fidelity at 16/24-bit without lossy compression.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="range"
              min="32"
              max="320"
              step="16"
              value={bitrate}
              onChange={(e) => setBitrate(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-studio-900 rounded-lg cursor-pointer"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-studio-500 mr-2">PRESETS:</span>
              {bitratePresets.map((b) => (
                <button
                  key={b}
                  onClick={() => setBitrate(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    bitrate === b
                      ? 'bg-amber-500 text-black shadow-neon-amber'
                      : 'bg-studio-900 hover:bg-studio-800 text-studio-300 border border-white/[0.04]'
                  }`}
                >
                  {b}k
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Sampling and Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-studio-950/50 p-4 rounded-xl border border-white/[0.06] flex flex-col gap-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-studio-400">
            SAMPLING FREQUENCY
          </label>
          <select
            value={sampleRate}
            onChange={(e) => setSampleRate(e.target.value)}
            className="bg-studio-900 border border-studio-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="original">Source Default (No Resampling)</option>
            <option value="44100">44,100 Hz (Red Book CD Quality)</option>
            <option value="48000">48,000 Hz (Studio / Film Master)</option>
            <option value="96000">96,000 Hz (Hi-Res Audio 96k)</option>
            <option value="22050">22,050 Hz (Low Bandwidth Speech)</option>
          </select>
        </div>

        <div className="bg-studio-950/50 p-4 rounded-xl border border-white/[0.06] flex flex-col gap-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-studio-400">
            CHANNEL CONFIGURATION
          </label>
          <select
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            className="bg-studio-900 border border-studio-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="original">Source Default (Preserve Channels)</option>
            <option value="2">Stereo (2 Channels L/R)</option>
            <option value="1">Mono (1 Channel Downmix)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-mono">
          ERROR: {error}
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-mono text-studio-400">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>ESTIMATED OUTPUT SIZE:</span>
          <span className="font-black text-cyan-400 text-sm">{formatFileSize(estimatedBytes)}</span>
          <span className="text-studio-500">({formatTime(duration)})</span>
        </div>

        <button
          onClick={handleConvert}
          disabled={isProcessing}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold px-6 py-2.5 rounded-xl shadow-neon-cyan flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              TRANSCODING VIA FFMPEG...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              RENDER TO {targetFormat.toUpperCase()} ({bitrate} kbps)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
