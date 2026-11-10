import React, { useState, useRef } from 'react';
import { Film, Music, Play, Pause, UploadCloud } from 'lucide-react';
import { videoToAudio } from '../api';
import { LoadedFile, ProcessingResult } from '../types';
import { formatTime } from '../utils/formatters';

interface VideoToAudioTabProps {
  currentFile: LoadedFile;
  onProcessed: (result: ProcessingResult) => void;
  onUploadNewVideo?: (file: File) => void;
}

export const VideoToAudioTab: React.FC<VideoToAudioTabProps> = ({
  currentFile,
  onProcessed,
  onUploadNewVideo
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [extractMode, setExtractMode] = useState<'full' | 'range'>('full');
  const [startTime, setStartTime] = useState<number>(0);
  const duration = currentFile.probe.duration || 0;
  const [endTime, setEndTime] = useState<number>(duration);

  const [targetFormat, setTargetFormat] = useState<string>('mp3');
  const [bitrate, setBitrate] = useState<string>('320k');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isVideo = currentFile.probe.hasVideo;
  const videoInfo = currentFile.probe.video;
  const audioInfo = currentFile.probe.audio;

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleExtract = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await videoToAudio({
        fileId: currentFile.fileId,
        targetFormat,
        bitrate,
        start: extractMode === 'range' ? startTime : undefined,
        end: extractMode === 'range' ? endTime : undefined
      });
      onProcessed(res);
    } catch (err: any) {
      setError(err.message || 'Video audio extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-600" />
            Video to Audio Extractor
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Extract high-fidelity soundtracks from MP4, MKV, MOV, WebM, and AVI videos.
          </p>
        </div>

        {isVideo && videoInfo && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-medium">
            <div>
              <span className="text-slate-500">Video: </span>
              <span className="font-semibold text-slate-900">{videoInfo.width}x{videoInfo.height}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span className="text-slate-500">Codec: </span>
              <span className="font-semibold text-slate-800 uppercase">{videoInfo.codec}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span className="text-slate-500">Audio: </span>
              <span className="font-semibold text-indigo-600 uppercase">{audioInfo ? audioInfo.codec : 'Detected'}</span>
            </div>
          </div>
        )}
      </div>

      {!isVideo ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
          <Film className="w-10 h-10 text-slate-400" />
          <div className="text-sm font-semibold text-slate-800">Currently Loaded File is Audio</div>
          <p className="text-xs text-slate-500 max-w-md">
            To use the video player and range extractor, drag or drop any video file (MP4, MKV, MOV, WebM) into the editor.
          </p>
          {onUploadNewVideo && (
            <label className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
              <UploadCloud className="w-4 h-4" />
              Upload Video File
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onUploadNewVideo(e.target.files[0]);
                  }
                }}
              />
            </label>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <div className="flex flex-col gap-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-xs flex items-center justify-center group">
              <video
                ref={videoRef}
                src={currentFile.streamUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
              <button
                onClick={toggleVideoPlay}
                className="absolute inset-0 m-auto w-12 h-12 bg-white/90 hover:bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
            </div>

            {/* Video Scrubber */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono">
              <button
                onClick={toggleVideoPlay}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <span className="font-semibold text-slate-900">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.05"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = val;
                  setCurrentTime(val);
                }}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-slate-500">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Extraction Settings */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Extraction Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExtractMode('full')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    extractMode === 'full'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Full Video Audio
                </button>
                <button
                  onClick={() => setExtractMode('range')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    extractMode === 'range'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Crop Time Range
                </button>
              </div>
            </div>

            {extractMode === 'range' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-sans font-medium">Selected Window:</span>
                  <span className="text-indigo-600 font-bold">
                    {formatTime(startTime)} → {formatTime(endTime)} ({(endTime - startTime).toFixed(1)}s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-700 font-sans font-medium">Start (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={endTime}
                      value={startTime}
                      onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-700 font-sans font-medium">End (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={startTime}
                      max={duration}
                      value={endTime}
                      onChange={(e) => setEndTime(parseFloat(e.target.value) || duration)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Target Output Format and Bitrate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Target Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV Lossless</option>
                  <option value="aac">AAC</option>
                  <option value="m4a">M4A Apple</option>
                  <option value="flac">FLAC Hi-Fi</option>
                  <option value="opus">OPUS Next-Gen</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Bitrate</label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  disabled={targetFormat === 'wav' || targetFormat === 'flac'}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium disabled:opacity-40 focus:outline-none focus:border-indigo-500"
                >
                  <option value="320k">320 kbps (High)</option>
                  <option value="256k">256 kbps</option>
                  <option value="192k">192 kbps (Standard)</option>
                  <option value="128k">128 kbps (Compact)</option>
                  <option value="64k">64 kbps (Voice)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Extract Button */}
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={handleExtract}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 text-xs transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Extracting Audio...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              Extract Audio to {targetFormat.toUpperCase()} ({bitrate})
            </>
          )}
        </button>
      </div>
    </div>
  );
};
