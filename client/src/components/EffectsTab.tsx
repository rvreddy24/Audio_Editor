import React, { useState } from 'react';
import { Sliders, Gauge, Volume2, Sparkles, Mic, Headphones, RotateCcw } from 'lucide-react';
import { applyEffects } from '../api';
import { LoadedFile, ProcessingResult } from '../types';

interface EffectsTabProps {
  currentFile: LoadedFile;
  onProcessed: (result: ProcessingResult) => void;
}

export const EffectsTab: React.FC<EffectsTabProps> = ({ currentFile, onProcessed }) => {
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [preservePitch, setPreservePitch] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(1.0);
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
    <div className="studio-glass rounded-2xl p-6 shadow-2xl flex flex-col gap-6 border border-white/[0.08]">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight uppercase font-sans">
              DSP Audio FX & Analog Mastering Rack
            </h3>
          </div>
          <p className="text-[11px] text-studio-400 font-mono mt-1">
            Rubberband time-stretching, pitch transposition, LUFS loudness mastering, and spatial 8D processing.
          </p>
        </div>

        <button
          onClick={resetAll}
          className="text-xs font-mono font-bold text-studio-400 hover:text-white bg-studio-950 hover:bg-studio-850 border border-white/[0.06] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET RACK
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Module 1: Tempo & Pitch Transpose */}
        <div className="bg-studio-950/70 p-4 rounded-xl border border-white/[0.06] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> SPEED & PITCH
            </span>
          </div>

          {/* Tempo Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-studio-400 uppercase text-[10px]">TEMPO MULTIPLIER</span>
              <span className="text-emerald-400 font-black">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.5"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-studio-500 font-mono">
              <span>0.25x</span>
              <span>1.0x (NORMAL)</span>
              <span>2.50x</span>
            </div>
          </div>

          {/* Pitch Shifter */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-studio-400 uppercase text-[10px]">PITCH TRANSPOSITION</span>
              <span className="text-cyan-400 font-black">
                {pitch > 0 ? `+${pitch}` : pitch} SEMITONES
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitch}
              onChange={(e) => setPitch(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-studio-500 font-mono">
              <span>-12 (OCTAVE DOWN)</span>
              <span>0</span>
              <span>+12 (OCTAVE UP)</span>
            </div>
          </div>

          {/* Pitch Lock Toggle */}
          <label className="flex items-center gap-2 mt-1 cursor-pointer select-none text-[11px] text-studio-300 font-mono">
            <input
              type="checkbox"
              checked={preservePitch}
              onChange={(e) => setPreservePitch(e.target.checked)}
              className="rounded bg-studio-900 border-studio-700 text-emerald-500 focus:ring-0"
            />
            <span>Preserve Pitch when changing speed</span>
          </label>
        </div>

        {/* Module 2: Gain Booster & Normalization */}
        <div className="bg-studio-950/70 p-4 rounded-xl border border-white/[0.06] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> VOLUME & MASTERING
            </span>
          </div>

          {/* Volume Multiplier */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-studio-400 uppercase text-[10px]">GAIN MULTIPLIER / BOOST</span>
              <span className="text-amber-400 font-black">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-studio-500 font-mono">
              <span>10%</span>
              <span>100% (UNITY)</span>
              <span>300% (+10dB)</span>
            </div>
          </div>

          {/* Normalization Target */}
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-[10px] font-mono uppercase text-studio-400 tracking-wider">
              LOUDNESS NORMALIZATION (LUFS)
            </label>
            <select
              value={normalize}
              onChange={(e) => setNormalize(e.target.value as any)}
              className="bg-studio-900 border border-studio-800 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="none">None (Raw Dynamic Range)</option>
              <option value="ebu_r128">Spotify & YouTube Master (-14 LUFS)</option>
              <option value="peak">Peak Limiting (Maximize Loudness)</option>
            </select>
          </div>
        </div>

        {/* Module 3: EQ & Acoustic Filters */}
        <div className="bg-studio-950/70 p-4 rounded-xl border border-white/[0.06] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> EQUALIZER & PRESETS
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase text-studio-400 tracking-wider">ACOUSTIC PROFILE</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="bg-studio-900 border border-studio-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="flat">Flat Direct Curve</option>
              <option value="vocal_clarity">Vocal Clarity & Speech Boost</option>
              <option value="lo_fi">Lo-Fi Retro Muffle (Warm)</option>
              <option value="radio">Vintage Radio / Walkie-Talkie</option>
            </select>
          </div>

          {/* Bass slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-studio-400 uppercase text-[10px]">BASS SHELF</span>
              <span className="text-cyan-400 font-bold">{bass > 0 ? `+${bass}` : bass} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={bass}
              onChange={(e) => setBass(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
            />
          </div>

          {/* Treble slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-studio-400 uppercase text-[10px]">TREBLE AIR</span>
              <span className="text-cyan-400 font-bold">{treble > 0 ? `+${treble}` : treble} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={treble}
              onChange={(e) => setTreble(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Special Hardware Toggle Pads */}
      <div className="bg-studio-950/70 p-4 rounded-xl border border-white/[0.06] flex flex-col gap-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> SPECIAL DSP PROCESSORS
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 8D Audio */}
          <label className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            panning8D ? 'bg-purple-600/20 border-purple-500 text-white shadow-neon-rose' : 'bg-studio-900 border-white/[0.06] text-studio-300 hover:border-white/[0.15]'
          }`}>
            <input type="checkbox" checked={panning8D} onChange={(e) => setPanning8D(e.target.checked)} className="hidden" />
            <Headphones className={`w-5 h-5 ${panning8D ? 'text-purple-400 animate-pulse' : 'text-studio-500'}`} />
            <div>
              <div className="text-xs font-mono font-bold">8D BINAURAL SPATIALIZER</div>
              <div className="text-[10px] text-studio-400">360° rotating audio orbit</div>
            </div>
          </label>

          {/* Vocal Remover */}
          <label className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            vocalRemover ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-neon-volt' : 'bg-studio-900 border-white/[0.06] text-studio-300 hover:border-white/[0.15]'
          }`}>
            <input type="checkbox" checked={vocalRemover} onChange={(e) => setVocalRemover(e.target.checked)} className="hidden" />
            <Mic className={`w-5 h-5 ${vocalRemover ? 'text-emerald-400' : 'text-studio-500'}`} />
            <div>
              <div className="text-xs font-mono font-bold">VOCAL REMOVER / KARAOKE</div>
              <div className="text-[10px] text-studio-400">Center-channel phase cancellation</div>
            </div>
          </label>

          {/* Reverse Audio */}
          <label className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            reverse ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-neon-cyan' : 'bg-studio-900 border-white/[0.06] text-studio-300 hover:border-white/[0.15]'
          }`}>
            <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} className="hidden" />
            <RotateCcw className={`w-5 h-5 ${reverse ? 'text-cyan-400' : 'text-studio-500'}`} />
            <div>
              <div className="text-xs font-mono font-bold">REVERSE PLAYBACK</div>
              <div className="text-[10px] text-studio-400">Backwards audio flip</div>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-mono">
          ERROR: {error}
        </div>
      )}

      {/* Render Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 font-mono text-xs">
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-studio-950 border border-studio-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
            <option value="aac">AAC</option>
          </select>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-studio-950 border border-studio-800 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-40"
          >
            <option value="320k">320 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="192k">192 kbps</option>
          </select>
        </div>

        <button
          onClick={handleApply}
          disabled={isProcessing}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold px-6 py-2.5 rounded-xl shadow-neon-volt flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              PROCESSING DSP RACK...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              RENDER MASTER EFFECTS
            </>
          )}
        </button>
      </div>
    </div>
  );
};
