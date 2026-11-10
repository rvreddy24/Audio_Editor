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
      setError('Please add at least 2 tracks to merge together.');
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Audio Joiner & Sequence Merger
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Combine multiple audio clips in sequence with smooth crossfade blending.
          </p>
        </div>

        <label className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors">
          <Plus className="w-4 h-4" />
          Add Audio Track
          <input
            type="file"
            multiple
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleAddFiles}
          />
        </label>
      </div>

      {/* Playlist List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <span>Tracks in Sequence ({tracks.length})</span>
          <span>Use arrows to rearrange</span>
        </div>

        <div className="space-y-2">
          {tracks.map((track, idx) => (
            <div
              key={track.id}
              className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                  {idx + 1}
                </span>

                <button
                  onClick={() => toggleTrackPlay(track)}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-600 flex items-center justify-center transition-colors shadow-2xs"
                  title="Preview"
                >
                  {playingTrackId === track.id ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-sm sm:max-w-md">
                    {track.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {track.duration ? `${formatTime(track.duration)} • ` : ''}
                    {track.size ? formatFileSize(track.size) : ''}
                  </div>
                </div>
              </div>

              {/* Order and Delete Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveTrack(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 border border-slate-200 shadow-2xs"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveTrack(idx, 'down')}
                  disabled={idx === tracks.length - 1}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 border border-slate-200 shadow-2xs"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeTrack(idx)}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 ml-1 transition-colors shadow-2xs"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Crossfade Duration</span>
            <span className="font-mono text-indigo-600 font-semibold">{crossfade}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={crossfade}
            onChange={(e) => setCrossfade(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] text-slate-400">0s = Gapless cut, 1-5s = Smooth crossfade blend</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700">Output Format</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="mp3">MP3 Universal</option>
            <option value="wav">WAV Lossless PCM</option>
            <option value="flac">FLAC Hi-Fi</option>
            <option value="aac">AAC Direct</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700">Bitrate</label>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            disabled={targetFormat === 'wav' || targetFormat === 'flac'}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium disabled:opacity-40 focus:outline-none focus:border-indigo-500"
          >
            <option value="320k">320 kbps (High)</option>
            <option value="256k">256 kbps</option>
            <option value="192k">192 kbps (Standard)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={handleMerge}
          disabled={isProcessing || tracks.length < 2}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 text-xs transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Merging Tracks...
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              Join {tracks.length} Tracks into Single File
            </>
          )}
        </button>
      </div>
    </div>
  );
};
