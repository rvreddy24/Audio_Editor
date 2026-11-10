import React, { useState } from 'react';
import { Layers, Plus, Trash2, ArrowUp, ArrowDown, Play, Pause } from 'lucide-react';
import { mergeAudio, uploadFile } from '../api';
import { LoadedFile, ProcessingResult } from '../types';
import { formatTime, formatFileSize } from '../utils/formatters';

interface TrackItem {
  id: string;
  file?: File;
  name: string;
  duration?: number;
  size?: number;
  streamUrl?: string;
  fileId?: string;
}

interface MergerTabProps {
  currentFile: LoadedFile;
  onProcessed: (result: ProcessingResult) => void;
}

export const MergerTab: React.FC<MergerTabProps> = ({ currentFile, onProcessed }) => {
  const [tracks, setTracks] = useState<TrackItem[]>([
    {
      id: 'current',
      name: currentFile.originalName,
      duration: currentFile.probe.duration,
      size: currentFile.size,
      streamUrl: currentFile.streamUrl,
      fileId: currentFile.fileId,
    }
  ]);

  const [crossfade, setCrossfade] = useState<number>(1);
  const [targetFormat, setTargetFormat] = useState<string>('mp3');
  const [bitrate, setBitrate] = useState<string>('320k');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const newTracks: TrackItem[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
    }));
    setTracks(prev => [...prev, ...newTracks]);
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tracks.length) return;
    const copy = [...tracks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setTracks(copy);
  };

  const removeTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTrackPlay = (track: TrackItem) => {
    if (playingTrackId === track.id) {
      if (audioEl) audioEl.pause();
      setPlayingTrackId(null);
    } else {
      if (audioEl) audioEl.pause();
      const url = track.streamUrl || (track.file ? URL.createObjectURL(track.file) : null);
      if (!url) return;
      const audio = new Audio(url);
      audio.onended = () => setPlayingTrackId(null);
      audio.play();
      setAudioEl(audio);
      setPlayingTrackId(track.id);
    }
  };

  const handleMerge = async () => {
    if (tracks.length < 2) {
      setError('Please add at least 2 tracks to concatenate.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const fileIds: string[] = [];
      for (const track of tracks) {
        if (track.fileId) {
          fileIds.push(track.fileId);
        } else if (track.file) {
          const uploaded = await uploadFile(track.file);
          track.fileId = uploaded.fileId;
          fileIds.push(uploaded.fileId);
        }
      }

      const res = await mergeAudio({
        fileIds,
        crossfade,
        targetFormat,
        bitrate
      });
      onProcessed(res);
    } catch (err: any) {
      setError(err.message || 'Audio merge failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="studio-glass rounded-2xl p-6 shadow-2xl flex flex-col gap-6 border border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight uppercase font-sans">
              Multi-Track Audio Joiner & Crossfade Sequencer
            </h3>
          </div>
          <p className="text-[11px] text-studio-400 font-mono mt-1">
            Reorder audio clips, assemble DJ mixes, and crossfade adjacent transitions.
          </p>
        </div>

        <label className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-neon-amber transition-all">
          <Plus className="w-3.5 h-3.5" />
          APPEND AUDIO TRACK
          <input
            type="file"
            multiple
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleAddFiles}
          />
        </label>
      </div>

      {/* Playlist Sequence Rack */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-studio-400">
          <span>SEQUENCE QUEUE ({tracks.length} TRACKS)</span>
          <span>REORDER WITH UP / DOWN</span>
        </div>

        <div className="space-y-2">
          {tracks.map((track, idx) => (
            <div
              key={track.id}
              className="bg-studio-950/80 border border-white/[0.06] p-3 rounded-xl flex items-center justify-between gap-3 group hover:border-amber-500/30 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-studio-900 border border-white/[0.06] flex items-center justify-center font-mono text-xs font-extrabold text-amber-400">
                  {idx + 1}
                </span>

                <button
                  onClick={() => toggleTrackPlay(track)}
                  className="w-8 h-8 rounded-lg bg-studio-900 hover:bg-amber-500 text-studio-300 hover:text-black flex items-center justify-center transition-colors"
                  title="Preview"
                >
                  {playingTrackId === track.id ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="text-xs font-mono font-bold text-white truncate max-w-sm sm:max-w-md">
                    {track.name}
                  </div>
                  <div className="text-[10px] text-studio-500 font-mono">
                    {track.duration ? `${formatTime(track.duration)} • ` : ''}
                    {track.size ? formatFileSize(track.size) : ''}
                  </div>
                </div>
              </div>

              {/* Order and Delete Actions */}
              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => moveTrack(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-studio-900 hover:bg-studio-800 text-studio-300 disabled:opacity-20 border border-white/[0.04]"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveTrack(idx, 'down')}
                  disabled={idx === tracks.length - 1}
                  className="p-1.5 rounded-lg bg-studio-900 hover:bg-studio-800 text-studio-300 disabled:opacity-20 border border-white/[0.04]"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeTrack(idx)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 ml-1 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crossfade Transition Slider */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-studio-950/60 rounded-xl border border-white/[0.06]">
        <div className="flex flex-col gap-1.5 font-mono">
          <div className="flex justify-between text-[10px] uppercase text-studio-400">
            <span>DJ CROSSFADE DURATION</span>
            <span className="text-amber-400 font-bold">{crossfade}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={crossfade}
            onChange={(e) => setCrossfade(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-studio-850 rounded-lg cursor-pointer"
          />
          <span className="text-[9px] text-studio-500">0s = Gapless cut, 1-5s = Smooth DJ overlap</span>
        </div>

        <div className="flex flex-col gap-1.5 font-mono">
          <label className="text-[10px] uppercase text-studio-400">OUTPUT CONTAINER</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-studio-900 border border-studio-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
          >
            <option value="mp3">MP3 Universal</option>
            <option value="wav">WAV Lossless PCM</option>
            <option value="flac">FLAC Hi-Fi</option>
            <option value="aac">AAC Direct</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 font-mono">
          <label className="text-[10px] uppercase text-studio-400">BITRATE</label>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-studio-900 border border-studio-800 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-40"
          >
            <option value="320k">320 kbps (Maximum)</option>
            <option value="256k">256 kbps (High)</option>
            <option value="192k">192 kbps (Standard)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-mono">
          ERROR: {error}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-2 border-t border-white/[0.06]">
        <button
          onClick={handleMerge}
          disabled={isProcessing || tracks.length < 2}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold px-6 py-2.5 rounded-xl shadow-neon-amber flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              CONCATENATING TRACKS...
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              JOIN {tracks.length} TRACKS INTO MASTER AUDIO
            </>
          )}
        </button>
      </div>
    </div>
  );
};
