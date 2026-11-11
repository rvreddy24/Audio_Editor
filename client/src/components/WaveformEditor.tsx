import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface WaveformEditorProps {
  audioUrl: string;
  duration: number;
  startTime: number;
  endTime: number;
  onRangeChange: (start: number, end: number) => void;
  onCurrentTimeChange?: (time: number) => void;
  cutMode?: 'keep' | 'remove';
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  audioUrl,
  duration,
  startTime,
  endTime,
  onRangeChange,
  onCurrentTimeChange,
  cutMode = 'keep',
  isPlaying: externalIsPlaying,
  onPlayStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [internalPlaying, setInternalPlaying] = useState(false);
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalPlaying;

  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Dragging states
  const [dragTarget, setDragTarget] = useState<'start' | 'end' | 'playhead' | null>(null);

  // Load and decode audio buffer
  useEffect(() => {
    let isCancelled = false;
    if (!audioUrl) return;

    setIsLoadingAudio(true);
    fetch(audioUrl)
      .then(res => res.arrayBuffer())
      .then(async buffer => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        try {
          const decoded = await audioCtx.decodeAudioData(buffer);
          if (!isCancelled) {
            const rawData = decoded.getChannelData(0);
            const samples = 1200;
            const blockSize = Math.floor(rawData.length / samples);
            const calculatedPeaks: number[] = [];
            for (let i = 0; i < samples; i++) {
              let blockStart = blockSize * i;
              let sum = 0;
              for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[blockStart + j]);
              }
              calculatedPeaks.push(sum / blockSize);
            }
            const max = Math.max(...calculatedPeaks, 0.001);
            setPeaks(calculatedPeaks.map(p => p / max));
          }
        } catch (e) {
          console.error('Audio decode error:', e);
        } finally {
          if (!isCancelled) setIsLoadingAudio(false);
          audioCtx.close();
        }
      })
      .catch(err => {
        console.error('Error fetching audio for waveform:', err);
        if (!isCancelled) setIsLoadingAudio(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [audioUrl]);

  // Audio element sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (onCurrentTimeChange) onCurrentTimeChange(audio.currentTime);
    };

    const handleEnded = () => {
      setInternalPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onCurrentTimeChange, onPlayStateChange]);

  // Handle external isPlaying prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (externalIsPlaying && audio.paused) {
      if (currentTime < startTime || currentTime >= endTime) {
        audio.currentTime = startTime;
      }
      audio.play().catch(console.error);
    } else if (!externalIsPlaying && !audio.paused) {
      audio.pause();
    }
  }, [externalIsPlaying]);

  // Draw clean light waveform canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth * zoomLevel;
    const height = 180;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Clean pearl background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle center axis
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const totalDur = duration || 1;
    const startX = (startTime / totalDur) * width;
    const endX = (endTime / totalDur) * width;
    const playheadX = (currentTime / totalDur) * width;

    // Draw selection zone overlay
    if (cutMode === 'keep') {
      // Soft indigo tint
      ctx.fillStyle = 'rgba(79, 70, 229, 0.08)';
      ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);

      // Light dim on unselected sides
      ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
      ctx.fillRect(0, 0, startX, height);
      ctx.fillRect(endX, 0, width - endX, height);
    } else {
      // Soft rose tint for cut out
      ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
      ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);
    }

    // Draw waveform bars
    const barWidth = 3;
    const gap = 1.5;
    const step = barWidth + gap;
    const totalBars = Math.floor(width / step);

    for (let i = 0; i < totalBars; i++) {
      const x = i * step;
      const peakIndex = Math.floor((i / totalBars) * peaks.length);
      const amp = peaks[peakIndex] || 0.08;
      const barHeight = Math.max(3, amp * (height * 0.75));
      const y = (height - barHeight) / 2;

      const isInside = x >= startX && x <= endX;
      if (cutMode === 'keep') {
        ctx.fillStyle = isInside ? '#4f46e5' : '#cbd5e1'; // Indigo vs Muted Slate
      } else {
        ctx.fillStyle = isInside ? '#f43f5e' : '#3b82f6'; // Rose vs Blue
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    }

    // Timeline Ruler at bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px "Inter", sans-serif';
    const intervalSec = totalDur > 120 ? 15 : totalDur > 60 ? 10 : totalDur > 20 ? 5 : 1;
    for (let s = 0; s <= totalDur; s += intervalSec) {
      const markX = (s / totalDur) * width;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(markX, height - 16);
      ctx.lineTo(markX, height);
      ctx.stroke();
      ctx.fillText(formatTime(s, false), markX + 3, height - 4);
    }

    // Start Marker (Clean Emerald Green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(startX - 18, 0, 36, 18, [0, 0, 6, 6]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START', startX, 12);
    ctx.textAlign = 'left';

    // End Marker (Clean Rose Red)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(endX - 16, 0, 32, 18, [0, 0, 6, 6]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('END', endX, 12);
    ctx.textAlign = 'left';

    // Playhead Needle (Royal Blue)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(playheadX, 6, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [duration, startTime, endTime, currentTime, zoomLevel, peaks, cutMode]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Mouse & Touch interaction
  const getTimeFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent<HTMLCanvasElement>).clientX;
    }
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * (duration || 1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const time = getTimeFromEvent(e);
    const totalDur = duration || 1;
    const threshold = totalDur * 0.03;

    if (Math.abs(time - startTime) < threshold) {
      setDragTarget('start');
    } else if (Math.abs(time - endTime) < threshold) {
      setDragTarget('end');
    } else {
      setDragTarget('playhead');
      seek(time);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const time = getTimeFromEvent(e);
    const totalDur = duration || 1;
    const threshold = totalDur * 0.05;

    if (Math.abs(time - startTime) < threshold) {
      setDragTarget('start');
    } else if (Math.abs(time - endTime) < threshold) {
      setDragTarget('end');
    } else {
      setDragTarget('playhead');
      seek(time);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragTarget) return;
    const time = getTimeFromEvent(e);

    if (dragTarget === 'start') {
      const newStart = Math.min(time, endTime - 0.05);
      onRangeChange(Math.max(0, newStart), endTime);
    } else if (dragTarget === 'end') {
      const newEnd = Math.max(time, startTime + 0.05);
      onRangeChange(startTime, Math.min(duration, newEnd));
    } else if (dragTarget === 'playhead') {
      seek(time);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragTarget) return;
    const time = getTimeFromEvent(e);

    if (dragTarget === 'start') {
      const newStart = Math.min(time, endTime - 0.05);
      onRangeChange(Math.max(0, newStart), endTime);
    } else if (dragTarget === 'end') {
      const newEnd = Math.max(time, startTime + 0.05);
      onRangeChange(startTime, Math.min(duration, newEnd));
    } else if (dragTarget === 'playhead') {
      seek(time);
    }
  };

  const handleMouseUp = () => setDragTarget(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setInternalPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      if (currentTime < startTime || currentTime >= endTime) {
        audio.currentTime = startTime;
      }
      audio.play().then(() => {
        setInternalPlaying(true);
        if (onPlayStateChange) onPlayStateChange(true);
      }).catch(console.error);
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(duration, time));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
    if (onCurrentTimeChange) onCurrentTimeChange(clamped);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Top Waveform Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Playback Controls & Timecode */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={togglePlay}
            disabled={isLoadingAudio}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-medium transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            }`}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => seek(startTime)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Jump to Start of Selection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Timecode Badge */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="font-bold text-slate-900">{formatTime(currentTime)}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Selected Region Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-500 font-medium">Selected:</span>
          <span className="font-mono font-semibold text-emerald-700">{formatTime(startTime)}</span>
          <span className="text-slate-400">→</span>
          <span className="font-mono font-semibold text-rose-700">{formatTime(endTime)}</span>
          <span className="font-mono text-slate-600 font-medium bg-slate-200/60 px-1.5 py-0.5 rounded">
            {(endTime - startTime).toFixed(2)}s
          </span>
        </div>

        {/* Volume & Zoom Controls */}
        <div className="flex items-center gap-3">
          {/* Volume */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
              }}
              className="text-slate-500 hover:text-slate-800"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                setIsMuted(false);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="w-16 h-1 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
              className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 shadow-2xs border border-slate-200/60"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-slate-700 px-2 font-medium">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.5))}
              className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 shadow-2xs border border-slate-200/60"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Waveform Canvas View */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto relative rounded-xl border border-slate-200 bg-white cursor-crosshair select-none shadow-2xs"
      >
        {isLoadingAudio && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 text-indigo-600 text-xs font-medium">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Loading audio waveform...
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="block touch-none"
        />
      </div>

      {/* Helper Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium gap-1">
        <span>Tap / Click to move playhead • Drag Start / End flags to trim</span>
        <span className="hidden sm:inline">Space: Play/Pause</span>
      </div>
    </div>
  );
};
