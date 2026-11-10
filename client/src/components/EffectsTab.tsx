import React, { useState } from 'react';
import { Sliders, Gauge, Volume2, Sparkles, Mic, Headphones, RotateCcw, Zap } from 'lucide-react';
import { applyEffects } from '../api';
import { LoadedFile, ProcessingResult } from '../types';

interface EffectsTabProps {
  currentFile: LoadedFile;
  onProcessed: (result: ProcessingResult) => void;
}

export const EffectsTab: React.FC<EffectsTabProps> = ({ currentFile, onProcessed }) => {
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0); // semitones -12 to +12
  const [preservePitch, setPreservePitch] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(1.0); // 0.1 to 3.0
  const [normalize, setNormalize] = useState<'none' | 'ebu_r128' | 'peak'>('none');
  const [preset, setPreset] = useState<string>('flat');
  const [bass, setBass] = useState<number>(0);
  const [treble, setTreble] = useState<number>(0);
  const [reverse, setReverse] = useState<boolean>(false);
  const [panning8D, setPanning8D] = useState<boolean>(false);
  const [vocalRemover, setVocalRemover] = useState<boolean>(false);
  const [targetFormat, setTargetFormat] = useState<string>('mp3');
  const [bitrate, setBitrate] = useState<string>('320k');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setSpeed(1.0);
    setPitch(0);
    setPreservePitch(true);
    setVolume(1.0);
    setNormalize('none');
    setPreset('flat');
    setBass(0);
    setTreble(0);
    setReverse(false);
    setPanning8D(false);
    setVocalRemover(false);
  };

  const handleApply = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await applyEffects({
        fileId: currentFile.fileId,
        speed,
        pitch,
        preservePitch,
        volume,
        normalize,
        preset,
        bass,
        treble,
        reverse,
        panning8D,
        vocalRemover,
        targetFormat,
        bitrate
      });
      onProcessed(res);
    } catch (err: any) {
      setError(err.message || 'Effects application failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Effects & Mastering Studio
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tempo and pitch stretching, volume gain boost, 8D audio spatializer, vocal remover, and EQ filtering.
          </p>
        </div>

        <button
          onClick={resetAll}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Effects
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Speed & Pitch */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Speed & Pitch
            </span>
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Tempo / Playback Speed</span>
              <span className="font-mono text-indigo-400 font-semibold">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.5"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.25x</span>
              <span>1.0x (Normal)</span>
              <span>2.5x</span>
            </div>
          </div>

          {/* Pitch Shifter */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Pitch Shift (Semitones)</span>
              <span className="font-mono text-indigo-400 font-semibold">
                {pitch > 0 ? `+${pitch}` : pitch} semitones
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitch}
              onChange={(e) => setPitch(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-1 Octave</span>
              <span>0 (Original)</span>
              <span>+1 Octave</span>
            </div>
          </div>

          {/* Preserve Pitch Toggle */}
          <label className="flex items-center gap-2 mt-1 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={preservePitch}
              onChange={(e) => setPreservePitch(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Preserve Pitch when changing speed (Rubberband)</span>
          </label>
        </div>

        {/* Card 2: Volume & Loudness Normalization */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Volume & Loudness
            </span>
          </div>

          {/* Volume Multiplier */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Gain Multiplier / Boost</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10%</span>
              <span>100% (Normal)</span>
              <span>300% (+10dB)</span>
            </div>
          </div>

          {/* Normalization Standard */}
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-xs text-slate-300">Loudness Normalization</label>
            <select
              value={normalize}
              onChange={(e) => setNormalize(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="none">None (Preserve Dynamics)</option>
              <option value="ebu_r128">Spotify & YouTube Standard (-14 LUFS)</option>
              <option value="peak">Peak Limiting (Maximize Loudness without Clip)</option>
            </select>
          </div>
        </div>

        {/* Card 3: Equalizer & Presets */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Tone & Filter Presets
            </span>
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300">Acoustic Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="flat">Flat / Direct Pass</option>
              <option value="vocal_clarity">Vocal Clarity & Speech Enhancer</option>
              <option value="lo_fi">Lo-Fi Retro Muffle</option>
              <option value="radio">Vintage Radio / Walkie-Talkie</option>
            </select>
          </div>

          {/* Bass slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Bass Boost / Cut</span>
              <span className="font-mono text-amber-400 font-semibold">{bass > 0 ? `+${bass}` : bass} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={bass}
              onChange={(e) => setBass(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Treble slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Treble Brightness</span>
              <span className="font-mono text-amber-400 font-semibold">{treble > 0 ? `+${treble}` : treble} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={treble}
              onChange={(e) => setTreble(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Special Effects Row */}
      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Special FX Toggles
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 8D Audio */}
          <label className={`p-3 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            panning8D ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}>
            <input
              type="checkbox"
              checked={panning8D}
              onChange={(e) => setPanning8D(e.target.checked)}
              className="hidden"
            />
            <Headphones className={`w-5 h-5 ${panning8D ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-semibold">8D Spatial Audio</div>
              <div className="text-[10px] text-slate-400">Binaural 360° rotating sound</div>
            </div>
          </label>

          {/* Vocal Remover */}
          <label className={`p-3 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            vocalRemover ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}>
            <input
              type="checkbox"
              checked={vocalRemover}
              onChange={(e) => setVocalRemover(e.target.checked)}
              className="hidden"
            />
            <Mic className={`w-5 h-5 ${vocalRemover ? 'text-indigo-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-semibold">Vocal Remover / Karaoke</div>
              <div className="text-[10px] text-slate-400">Center-channel cancellation</div>
            </div>
          </label>

          {/* Reverse Audio */}
          <label className={`p-3 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            reverse ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}>
            <input
              type="checkbox"
              checked={reverse}
              onChange={(e) => setReverse(e.target.checked)}
              className="hidden"
            />
            <RotateCcw className={`w-5 h-5 ${reverse ? 'text-indigo-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-semibold">Reverse Audio</div>
              <div className="text-[10px] text-slate-400">Backwards playback effect</div>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Render Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG</option>
            <option value="opus">OPUS</option>
          </select>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-40"
          >
            <option value="320k">320 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="192k">192 kbps</option>
            <option value="128k">128 kbps</option>
          </select>
        </div>

        <button
          onClick={handleApply}
          disabled={isProcessing}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Rendering Effects...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Apply Effects & Export
            </>
          )}
        </button>
      </div>
    </div>
  );
};
