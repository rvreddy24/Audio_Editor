import React, { useState, useRef } from 'react';
import { Film, Music, Play, Pause, UploadCloud, Radio } from 'lucide-react';
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
    <div className="studio-glass rounded-2xl p-6 shadow-2xl flex flex-col gap-6 border border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Film className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight uppercase font-sans">
              Video Soundtrack Extractor & Cinema Cutter
            </h3>
          </div>
          <p className="text-[11px] text-studio-400 font-mono mt-1">
            Demux and transcode high-fidelity soundtracks from MP4, MKV, MOV, WebM, or AVI videos.
          </p>
        </div>

        {isVideo && videoInfo && (
          <div className="flex items-center gap-3 bg-studio-950 px-3.5 py-1.5 rounded-xl border border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-studio-500 text-[10px] uppercase">RESOLUTION: </span>
              <span className="font-bold text-purple-400">{videoInfo.width}x{videoInfo.height}</span>
            </div>
            <span className="text-studio-700">|</span>
            <div>
              <span className="text-studio-500 text-[10px] uppercase">VIDEO CODEC: </span>
              <span className="font-bold text-studio-200 uppercase">{videoInfo.codec}</span>
            </div>
            <span className="text-studio-700">|</span>
            <div>
              <span className="text-studio-500 text-[10px] uppercase">AUDIO STREAM: </span>
              <span className="font-bold text-emerald-400 uppercase">{audioInfo ? audioInfo.codec : 'Detected'}</span>
            </div>
          </div>
        )}
      </div>

      {!isVideo ? (
        <div className="p-8 text-center bg-studio-950/70 rounded-xl border border-dashed border-studio-800 flex flex-col items-center justify-center gap-3">
          <Film className="w-10 h-10 text-studio-600" />
          <div className="text-sm font-mono font-bold text-studio-200">ACTIVE SESSION IS AN AUDIO FILE</div>
          <p className="text-xs text-studio-500 max-w-md">
            Drop or browse a video file (MP4, MKV, MOV, WebM) to unlock the synchronized cinema player and range extraction deck.
          </p>
          {onUploadNewVideo && (
            <label className="mt-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
              <UploadCloud className="w-4 h-4" />
              UPLOAD VIDEO FILE
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
          {/* Cinema Preview Player */}
          <div className="flex flex-col gap-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/[0.08] shadow-2xl flex items-center justify-center group">
              <video
                ref={videoRef}
                src={currentFile.streamUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
              <button
                onClick={toggleVideoPlay}
                className="absolute inset-0 m-auto w-12 h-12 bg-purple-600/80 hover:bg-purple-600 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-neon-rose transition-all opacity-0 group-hover:opacity-100"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
            </div>

            {/* Video Transport Scrubber */}
            <div className="flex items-center gap-3 bg-studio-950 p-2.5 rounded-xl border border-white/[0.06] text-xs font-mono">
              <button
                onClick={toggleVideoPlay}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <span className="text-purple-400 font-bold">{formatTime(currentTime)}</span>
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
                className="flex-1 h-1.5 bg-studio-850 rounded-lg cursor-pointer"
              />
              <span className="text-studio-500">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Extraction Control Desk */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-bold tracking-widest uppercase text-studio-400">
                EXTRACTION RANGE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExtractMode('full')}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    extractMode === 'full'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-neon-rose'
                      : 'bg-studio-950/70 border-white/[0.06] text-studio-400 hover:text-white'
                  }`}
                >
                  FULL VIDEO SOUNDTRACK
                </button>
                <button
                  onClick={() => setExtractMode('range')}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    extractMode === 'range'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-neon-rose'
                      : 'bg-studio-950/70 border-white/[0.06] text-studio-400 hover:text-white'
                  }`}
                >
                  CROP TIME RANGE
                </button>
              </div>
            </div>

            {extractMode === 'range' && (
              <div className="p-4 bg-studio-950/70 rounded-xl border border-white/[0.06] flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-studio-400">WINDOW:</span>
                  <span className="text-purple-400 font-bold">
                    {formatTime(startTime)} → {formatTime(endTime)} ({(endTime - startTime).toFixed(1)}s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-emerald-400 uppercase font-bold">START (SEC)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={endTime}
                      value={startTime}
                      onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                      className="w-full bg-studio-900 border border-studio-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-400 uppercase font-bold">END (SEC)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={startTime}
                      max={duration}
                      value={endTime}
                      onChange={(e) => setEndTime(parseFloat(e.target.value) || duration)}
                      className="w-full bg-studio-900 border border-studio-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Target Output Format and Bitrate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-studio-400 tracking-wider">TARGET FORMAT</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full mt-1 bg-studio-900 border border-studio-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                >
                  <option value="mp3">MP3 Universal</option>
                  <option value="wav">WAV Lossless PCM</option>
                  <option value="aac">AAC Direct</option>
                  <option value="m4a">M4A Apple</option>
                  <option value="flac">FLAC Hi-Fi</option>
                  <option value="opus">OPUS Next-Gen</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-studio-400 tracking-wider">TARGET BITRATE</label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  disabled={targetFormat === 'wav' || targetFormat === 'flac'}
                  className="w-full mt-1 bg-studio-900 border border-studio-800 rounded-xl px-3 py-2 text-xs text-white font-mono disabled:opacity-40 focus:outline-none focus:border-purple-500"
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
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-mono">
          ERROR: {error}
        </div>
      )}

      {/* Extract Button */}
      <div className="flex justify-end pt-2 border-t border-white/[0.06]">
        <button
          onClick={handleExtract}
          disabled={isProcessing}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-neon-rose flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              EXTRACTING SOUNDTRACK...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              EXTRACT AUDIO ({targetFormat.toUpperCase()} {bitrate})
            </>
          )}
        </button>
      </div>
    </div>
  );
};
