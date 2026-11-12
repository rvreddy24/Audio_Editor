import React, { useState } from 'react';
import { Sliders, Gauge, Volume2, Sparkles, Mic, Headphones, RotateCcw, ShieldCheck, Waves } from 'lucide-react';
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
  const [noiseReduction, setNoiseReduction] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
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
    setNoiseReduction('none');
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
        noiseReduction,
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Audio Effects & Quality Studio
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tempo and pitch stretching, volume gain boost, LUFS loudness mastering, and spatial effects.
          </p>
        </div>

        <button
          onClick={resetAll}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Module 1: Tempo & Pitch */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3.5">
          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Gauge className="w-3.5 h-3.5 text-indigo-600" /> Speed & Pitch
          </span>

          {/* Tempo Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Playback Speed</span>
              <span className="text-indigo-600 font-bold font-mono">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.5"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0.25x</span>
              <span>1.0x (Normal)</span>
              <span>2.50x</span>
            </div>
          </div>

          {/* Pitch Shifter */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Pitch Shift</span>
              <span className="text-indigo-600 font-bold font-mono">
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
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>-1 Octave</span>
              <span>0 (Original)</span>
              <span>+1 Octave</span>
            </div>
          </div>

          <label className="flex items-center gap-2 mt-1 cursor-pointer select-none text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={preservePitch}
              onChange={(e) => setPreservePitch(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Preserve Pitch when changing speed</span>
          </label>
        </div>

        {/* Module 2: Gain Booster & Normalization */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3.5">
          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> Volume & Loudness
          </span>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                Gain Multiplier / Boost
                {volume > 1.0 && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Soft Limiter
                  </span>
                )}
              </span>
              <span className="text-indigo-600 font-bold font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>10%</span>
              <span>100% (Original)</span>
              <span>300% (+10dB Safe)</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-xs font-medium text-slate-700">Loudness Normalization</label>
            <select
              value={normalize}
              onChange={(e) => setNormalize(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="none">None (Preserve Original Dynamics)</option>
              <option value="ebu_r128">Spotify & YouTube Standard (-14 LUFS)</option>
              <option value="peak">Peak Limiting (Maximize Loudness)</option>
            </select>
          </div>
        </div>

        {/* Module 3: EQ & Acoustic Filters */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3.5">
          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Equalizer & Tone
          </span>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">Acoustic Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="flat">Flat Direct Curve</option>
              <option value="vocal_clarity">Vocal Clarity & Speech Boost</option>
              <option value="lo_fi">Lo-Fi Retro Muffle (Warm)</option>
              <option value="radio">Vintage Radio / Telephone</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Bass Shelf</span>
              <span className="text-indigo-600 font-bold font-mono">{bass > 0 ? `+${bass}` : bass} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={bass}
              onChange={(e) => setBass(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Treble Air</span>
              <span className="text-indigo-600 font-bold font-mono">{treble > 0 ? `+${treble}` : treble} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={treble}
              onChange={(e) => setTreble(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Special Effects Toggles */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Special Effects & DSP Tools
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 8D Audio */}
          <label className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            panning8D ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}>
            <input type="checkbox" checked={panning8D} onChange={(e) => setPanning8D(e.target.checked)} className="hidden" />
            <Headphones className={`w-5 h-5 ${panning8D ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div>
              <div className="text-xs font-semibold">8D Spatial Audio</div>
              <div className="text-[11px] text-slate-500">Binaural 360° rotating sound</div>
            </div>
          </label>

          {/* Vocal Remover */}
          <label className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            vocalRemover ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}>
            <input type="checkbox" checked={vocalRemover} onChange={(e) => setVocalRemover(e.target.checked)} className="hidden" />
            <Mic className={`w-5 h-5 ${vocalRemover ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div>
              <div className="text-xs font-semibold">Vocal Remover / Karaoke</div>
              <div className="text-[11px] text-slate-500">Center-channel vocal cancel</div>
            </div>
          </label>

          {/* Reverse Audio */}
          <label className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-center gap-3 transition-all ${
            reverse ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}>
            <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} className="hidden" />
            <RotateCcw className={`w-5 h-5 ${reverse ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div>
              <div className="text-xs font-semibold">Reverse Audio</div>
              <div className="text-[11px] text-slate-500">Backwards playback effect</div>
            </div>
          </label>

          {/* Noise Reduction */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
            noiseReduction !== 'none' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <Waves className={`w-4 h-4 ${noiseReduction !== 'none' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold">Noise Reduction</span>
            </div>
            <select
              value={noiseReduction}
              onChange={(e) => setNoiseReduction(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 w-full"
            >
              <option value="none">Off (Original)</option>
              <option value="light">Light (-10 dB)</option>
              <option value="medium">Medium (-18 dB)</option>
              <option value="heavy">Heavy (-25 dB)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Render Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3 text-xs">
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
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
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium disabled:opacity-40"
          >
            <option value="320k">320 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="192k">192 kbps</option>
          </select>
        </div>

        <button
          onClick={handleApply}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 text-xs transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Effects...
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
