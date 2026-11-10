import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Volume2, VolumeX, Scissors, Bookmark } from 'lucide-react';
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

  // Draw waveform canvas with Neon Cyber DAW aesthetics
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth * zoomLevel;
    const height = 190;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Deep Obsidian Studio Canvas Background
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal center line
    ctx.strokeStyle = '#161b26';
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
      // Emerald glowing highlight
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(34, 197, 94, 0.18)');
      grad.addColorStop(0.5, 'rgba(34, 197, 94, 0.08)');
      grad.addColorStop(1, 'rgba(34, 197, 94, 0.18)');
      ctx.fillStyle = grad;
      ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);

      // Darkened inactive outer edges
      ctx.fillStyle = 'rgba(5, 7, 10, 0.72)';
      ctx.fillRect(0, 0, startX, height);
      ctx.fillRect(endX, 0, width - endX, height);
    } else {
      // Coral Rose cut-out highlight
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(244, 63, 94, 0.22)');
      grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.10)');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.22)');
      ctx.fillStyle = grad;
      ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);
    }

    // Draw Waveform Bars with neon gradient
    const barWidth = 3;
    const gap = 1.5;
    const step = barWidth + gap;
    const totalBars = Math.floor(width / step);

    for (let i = 0; i < totalBars; i++) {
      const x = i * step;
      const peakIndex = Math.floor((i / totalBars) * peaks.length);
      const amp = peaks[peakIndex] || 0.08;
      const barHeight = Math.max(3, amp * (height * 0.76));
      const y = (height - barHeight) / 2;

      const isInside = x >= startX && x <= endX;
      if (cutMode === 'keep') {
        if (isInside) {
          ctx.fillStyle = '#22c55e'; // Neon Volt
        } else {
          ctx.fillStyle = '#262f40'; // Gunmetal
        }
      } else {
        if (isInside) {
          ctx.fillStyle = '#fb7185'; // Coral
        } else {
          ctx.fillStyle = '#38bdf8'; // Cyan
        }
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    }

    // Timeline Scale Ruler at bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '600 9px "JetBrains Mono", monospace';
    const intervalSec = totalDur > 120 ? 15 : totalDur > 60 ? 10 : totalDur > 20 ? 5 : 1;
    for (let s = 0; s <= totalDur; s += intervalSec) {
      const markX = (s / totalDur) * width;
      ctx.strokeStyle = '#1e2638';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(markX, height - 16);
      ctx.lineTo(markX, height);
      ctx.stroke();
      ctx.fillText(formatTime(s, false), markX + 3, height - 4);
    }

    // Start Marker (Neon Volt #22c55e)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // Start handle flag
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(startX - 8, 0, 16, 22, [0, 0, 4, 4]);
    ctx.fill();
    ctx.fillStyle = '#05070a';
    ctx.font = '900 10px "JetBrains Mono", monospace';
    ctx.fillText('IN', startX - 6, 15);

    // End Marker (Neon Crimson #f43f5e)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // End handle flag
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(endX - 10, 0, 20, 22, [0, 0, 4, 4]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 10px "JetBrains Mono", monospace';
    ctx.fillText('OUT', endX - 9, 15);

    // Playhead Laser Cursor (Electric Cyan #06b6d4)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Playhead indicator top cap
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(playheadX - 5, 0);
    ctx.lineTo(playheadX + 5, 0);
    ctx.lineTo(playheadX, 7);
    ctx.closePath();
    ctx.fill();
  }, [duration, startTime, endTime, currentTime, zoomLevel, peaks, cutMode]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Mouse interaction
  const getTimeFromMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * (duration || 1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const time = getTimeFromMouseEvent(e);
    const totalDur = duration || 1;
    const threshold = totalDur * 0.025;

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
    const time = getTimeFromMouseEvent(e);

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
    <div className="studio-glass rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 border border-white/[0.08]">
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Top Waveform HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        {/* Playback & Position */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={togglePlay}
            disabled={isLoadingAudio}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-neon-amber'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-neon-volt'
            }`}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => seek(startTime)}
            className="p-2 rounded-xl bg-studio-850 hover:bg-studio-800 text-studio-300 border border-white/[0.06] transition-colors"
            title="Jump to Selection In-Point"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Precision Readout */}
          <div className="flex items-center gap-2 bg-studio-950 px-3 py-1.5 rounded-xl border border-white/[0.06] font-mono text-xs">
            <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
            <span className="text-studio-600">|</span>
            <span className="text-studio-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Selected Region Status Pill */}
        <div className="flex items-center gap-2.5 bg-studio-950/80 px-3.5 py-1.5 rounded-xl border border-white/[0.06] text-xs">
          <span className="text-[10px] tracking-widest uppercase font-mono text-studio-400">Region:</span>
          <span className="font-mono text-emerald-400 font-bold">{formatTime(startTime)}</span>
          <span className="text-studio-600">→</span>
          <span className="font-mono text-rose-400 font-bold">{formatTime(endTime)}</span>
          <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
            Δ {(endTime - startTime).toFixed(2)}s
          </span>
        </div>

        {/* Zoom & Audio Monitor Controls */}
        <div className="flex items-center gap-3">
          {/* Volume Monitor */}
          <div className="flex items-center gap-2 bg-studio-950 px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
              }}
              className="text-studio-400 hover:text-white"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
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
              className="w-14 h-1 bg-studio-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Zoom Level Switcher */}
          <div className="flex items-center gap-1 bg-studio-950 p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
              className="p-1 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[11px] text-studio-300 px-2 font-bold">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.5))}
              className="p-1 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Panoramic Waveform Canvas */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto relative rounded-xl border border-white/[0.08] bg-[#080a0f] cursor-crosshair select-none shadow-inner"
      >
        {isLoadingAudio && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="flex items-center gap-3 text-emerald-400 text-xs font-mono font-bold">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ANALYZING AUDIO PEAKS & FREQUENCIES...
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block"
        />
      </div>

      {/* Micro Status Footer */}
      <div className="flex items-center justify-between text-[10px] text-studio-400 font-mono tracking-wider uppercase">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Drag IN / OUT needles to trim • Click anywhere to scrub</span>
        </span>
        <span className="text-studio-500 font-semibold">SPACE: PLAY/STOP</span>
      </div>
    </div>
  );
};
