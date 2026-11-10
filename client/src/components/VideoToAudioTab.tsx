import React, { useState, useRef } from 'react';
import { Film, Music, Scissors, Download, Play, Pause, RefreshCw, UploadCloud } from 'lucide-react';
import { videoToAudio } from '../api';
import { LoadedFile, ProcessingResult } from '../types';
import { formatTime, formatFileSize } from '../utils/formatters';

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            Video to Audio Extractor & Editor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Strip high-fidelity audio from any MP4, MKV, WebM, MOV, or AVI video with precision range extraction.
          </p>
        </div>

        {/* Video specs badge */}
        {isVideo && (
          <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
            {videoInfo && (
              <div>
                <span className="text-slate-500">Video: </span>
                <span className="font-semibold text-indigo-400">
                  {videoInfo.width}x{videoInfo.height} ({videoInfo.codec})
                </span>
              </div>
            )}
            <div className="h-3 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500">Audio Track: </span>
              <span className="font-semibold text-emerald-400 uppercase">
                {audioInfo ? audioInfo.codec : 'Detected'}
              </span>
            </div>
          </div>
        )}
      </div>

      {!isVideo ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-3">
          <Film className="w-12 h-12 text-slate-600" />
          <div className="text-sm font-medium text-slate-300">Currently loaded file is an audio file</div>
          <p className="text-xs text-slate-500 max-w-md">
            You can still convert this audio here, or drop a video file (MP4, MKV, MOV, WebM) into the app to use the full video preview player and range cutter!
          </p>
          {onUploadNewVideo && (
            <label className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
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
        /* Video Player Preview and Scrubbing */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-md flex items-center justify-center">
              <video
                ref={videoRef}
                src={currentFile.streamUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
              <button
                onClick={toggleVideoPlay}
                className="absolute inset-0 m-auto w-14 h-14 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl transition-all opacity-0 hover:opacity-100 focus:opacity-100"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
            </div>

            {/* Video scrub & play controls */}
            <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={toggleVideoPlay}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <span className="font-mono text-cyan-400 font-semibold">{formatTime(currentTime)}</span>
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
                className="flex-1 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Extraction Settings */}
          <div className="flex flex-col gap-4">
            {/* Mode selection: Full Video vs Trim Range */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Extraction Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExtractMode('full')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    extractMode === 'full'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full Video Audio Track
                </button>
                <button
                  onClick={() => setExtractMode('range')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    extractMode === 'range'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Trim Audio Range
                </button>
              </div>
            </div>

            {extractMode === 'range' && (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Range:</span>
                  <span className="font-mono text-indigo-400 font-semibold">
                    {formatTime(startTime)} → {formatTime(endTime)} ({(endTime - startTime).toFixed(1)}s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-emerald-400 font-medium">Start (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={endTime}
                      value={startTime}
                      onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-rose-400 font-medium">End (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={startTime}
                      max={duration}
                      value={endTime}
                      onChange={(e) => setEndTime(parseFloat(e.target.value) || duration)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Target Output Format */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Target Audio Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="mp3">MP3 (Universal)</option>
                  <option value="wav">WAV (Lossless)</option>
                  <option value="aac">AAC (Crisp)</option>
                  <option value="m4a">M4A (Apple)</option>
                  <option value="flac">FLAC (Lossless)</option>
                  <option value="ogg">OGG (Vorbis)</option>
                  <option value="opus">OPUS (Modern)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300">Bitrate</label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  disabled={targetFormat === 'wav' || targetFormat === 'flac'}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 disabled:opacity-40 focus:outline-none focus:border-indigo-500"
                >
                  <option value="320k">320 kbps (Studio)</option>
                  <option value="256k">256 kbps (High)</option>
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
        <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Extract Button */}
      <div className="flex justify-end pt-2 border-t border-slate-800">
        <button
          onClick={handleExtract}
          disabled={isProcessing}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Extracting Audio from Video...
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
