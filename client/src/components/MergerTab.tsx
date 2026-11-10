import React, { useState } from 'react';
import { Layers, Plus, Trash2, ArrowUp, ArrowDown, Play, Pause, Music, Sliders } from 'lucide-react';
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
      if (audioEl) {
        audioEl.pause();
      }
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
      setError('Please add at least 2 tracks to merge together.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // First, ensure any raw files are uploaded to server
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Audio Joiner & Sequence Merger
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Concatenate multiple audio tracks in sequence with smooth crossfading into a single seamless audio file.
          </p>
        </div>

        <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors">
          <Plus className="w-4 h-4" />
          Add More Audio Tracks
          <input
            type="file"
            multiple
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleAddFiles}
          />
        </label>
      </div>

      {/* Track List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Tracks in Sequence ({tracks.length})</span>
          <span>Drag or use arrows to rearrange</span>
        </div>

        <div className="space-y-2">
          {tracks.map((track, idx) => (
            <div
              key={track.id}
              className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs text-slate-400 font-semibold">
                  {idx + 1}
                </span>

                <button
                  onClick={() => toggleTrackPlay(track)}
                  className="w-8 h-8 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center transition-colors"
                  title="Preview Track"
                >
                  {playingTrackId === track.id ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate max-w-sm sm:max-w-md">
                    {track.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {track.duration ? `${formatTime(track.duration)} • ` : ''}
                    {track.size ? formatFileSize(track.size) : ''}
                  </div>
                </div>
              </div>

              {/* Order and Remove Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveTrack(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveTrack(idx, 'down')}
                  disabled={idx === tracks.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeTrack(idx)}
                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 ml-1 transition-colors"
                  title="Remove Track"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crossfade & Export Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800">
        {/* Crossfade */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Crossfade Transition</span>
            <span className="font-mono text-indigo-400 font-semibold">{crossfade}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={crossfade}
            onChange={(e) => setCrossfade(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-500">0s = Gapless cut, 1-5s = Smooth DJ blend</span>
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-300">Output Format</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV (Lossless)</option>
            <option value="flac">FLAC</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG</option>
          </select>
        </div>

        {/* Bitrate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-300">Bitrate</label>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-40"
          >
            <option value="320k">320 kbps (Studio)</option>
            <option value="256k">256 kbps (High)</option>
            <option value="192k">192 kbps (Standard)</option>
            <option value="128k">128 kbps (Compact)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-2 border-t border-slate-800">
        <button
          onClick={handleMerge}
          disabled={isProcessing || tracks.length < 2}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Merging Tracks...
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              Merge {tracks.length} Tracks into Single Audio
            </>
          )}
        </button>
      </div>
    </div>
  );
};
