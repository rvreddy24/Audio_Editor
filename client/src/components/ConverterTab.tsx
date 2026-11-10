import React, { useState } from 'react';
import { RefreshCw, HardDrive, Check, Zap } from 'lucide-react';
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
    { id: 'mp3', label: 'MP3', desc: 'Universal audio standard', tag: 'Most Compatible' },
    { id: 'wav', label: 'WAV', desc: 'Studio uncompressed PCM', tag: 'Lossless' },
    { id: 'flac', label: 'FLAC', desc: 'Hi-Fi lossless audio', tag: 'Audiophile' },
    { id: 'aac', label: 'AAC', desc: 'High efficiency Apple core', tag: 'Fast' },
    { id: 'm4a', label: 'M4A', desc: 'MPEG-4 Audio container', tag: 'iOS Standard' },
    { id: 'ogg', label: 'OGG', desc: 'Open-source Vorbis stream', tag: 'Open Codec' },
    { id: 'opus', label: 'OPUS', desc: 'Next-generation low latency', tag: 'Modern' },
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header & Source Specs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-600" />
            Universal Audio Converter & Bitrate Scaler
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Convert formats, scale kbps bitrates, and customize sample rate frequencies.
          </p>
        </div>

        {/* Source Specs Pill */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-medium">
          <div>
            <span className="text-slate-500">Source: </span>
            <span className="font-semibold text-slate-900 uppercase">{currentFormat}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-500">Bitrate: </span>
            <span className="font-semibold text-indigo-600">{currentKbps > 0 ? `${currentKbps} kbps` : 'Variable'}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-500">Size: </span>
            <span className="font-semibold text-slate-800">{formatFileSize(currentFile.size)}</span>
          </div>
        </div>
      </div>

      {/* Target Format Matrix */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          Select Output Format
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
                    ? 'bg-indigo-50/60 border-indigo-600 ring-1 ring-indigo-600 text-indigo-950'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm tracking-wide">{fmt.label}</span>
                  {isSelected ? (
                    <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">{fmt.tag}</span>
                  )}
                </div>
                <span className="text-xs text-slate-500 mt-1 line-clamp-1">{fmt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bitrate Control */}
      <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Zap className="w-4 h-4 text-amber-500" />
              Bitrate (kbps) Scaler
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Higher kbps ensures studio fidelity; lower kbps creates ultra-compact files for easy sharing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Output Bitrate:</span>
            <span className="font-mono text-base font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {targetFormat === 'wav' || targetFormat === 'flac' || targetFormat === 'aiff' ? 'Lossless' : `${bitrate} kbps`}
            </span>
          </div>
        </div>

        {targetFormat === 'wav' || targetFormat === 'flac' || targetFormat === 'aiff' ? (
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
            <span>ℹ️ {targetFormat.toUpperCase()} preserves 100% full uncompressed master audio quality.</span>
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
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-500 mr-2 font-medium">Presets:</span>
              {bitratePresets.map((b) => (
                <button
                  key={b}
                  onClick={() => setBitrate(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    bitrate === b
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {b}k
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sampling Frequency and Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700">Sample Rate (Hz)</label>
          <select
            value={sampleRate}
            onChange={(e) => setSampleRate(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="original">Keep Source Sample Rate</option>
            <option value="44100">44,100 Hz (Standard CD Audio)</option>
            <option value="48000">48,000 Hz (Professional Studio Video)</option>
            <option value="96000">96,000 Hz (High Resolution 96k)</option>
            <option value="22050">22,050 Hz (Low Bandwidth Speech)</option>
          </select>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700">Audio Channels</label>
          <select
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="original">Keep Source Channels</option>
            <option value="2">Stereo (2 Channels)</option>
            <option value="1">Mono (1 Channel Voice)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HardDrive className="w-4 h-4 text-indigo-600" />
          <span>Estimated Output Size:</span>
          <span className="font-mono font-bold text-slate-900">{formatFileSize(estimatedBytes)}</span>
          <span className="text-slate-400">({formatTime(duration)})</span>
        </div>

        <button
          onClick={handleConvert}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 text-xs transition-colors disabled:opacity-50"
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
