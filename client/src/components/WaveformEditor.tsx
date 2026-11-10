import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface WaveformEditorProps {
  audioUrl: string;
  duration: number;
  startTime: number;
  endTime: number;
  onRangeChange: (start: number, end: number) => void;
  onCurrentTimeChange?: (time: number) => void;
  cutMode?: 'keep' | 'remove';
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  audioUrl,
  duration,
  startTime,
  endTime,
  onRangeChange,
  onCurrentTimeChange,
  cutMode = 'keep'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Dragging states for markers
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
            setAudioBuffer(decoded);
            // Extract peaks for drawing
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
            // Normalize peaks
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
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onCurrentTimeChange]);

  // Draw waveform canvas
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

    // Background grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const totalDur = duration || 1;
    const startX = (startTime / totalDur) * width;
    const endX = (endTime / totalDur) * width;
    const playheadX = (currentTime / totalDur) * width;

    // Draw region overlay
    if (cutMode === 'keep') {
      // Highlight kept selection
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // Emerald
      ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);

      // Dim non-selected areas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, startX, height);
      ctx.fillRect(endX, 0, width - endX, height);
    } else {
      // Highlight removed selection in Red
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Red
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
      const amp = peaks[peakIndex] || 0.1;
      const barHeight = Math.max(4, amp * (height * 0.75));
      const y = (height - barHeight) / 2;

      // Color coding based on selection
      const isInside = x >= startX && x <= endX;
      if (cutMode === 'keep') {
        ctx.fillStyle = isInside ? '#34d399' : '#475569';
      } else {
        ctx.fillStyle = isInside ? '#f87171' : '#38bdf8';
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }

    // Draw Timeline markers (seconds)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    const intervalSec = totalDur > 60 ? 10 : totalDur > 20 ? 5 : 1;
    for (let s = 0; s <= totalDur; s += intervalSec) {
      const markX = (s / totalDur) * width;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(markX, height - 14);
      ctx.lineTo(markX, height);
      ctx.stroke();
      ctx.fillText(formatTime(s, false), markX + 3, height - 4);
    }

    // Draw Start Handle (Green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // Start handle flag
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(startX - 6, 0, 12, 20, [0, 0, 4, 4]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('S', startX - 3, 14);

    // Draw End Handle (Rose)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // End handle flag
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(endX - 6, 0, 12, 20, [0, 0, 4, 4]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('E', endX - 3, 14);

    // Draw Playhead cursor (Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(playheadX, 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }, [duration, startTime, endTime, currentTime, zoomLevel, peaks, cutMode]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Mouse interaction: dragging markers or scrubbing playhead
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
    const threshold = totalDur * 0.02; // 2% hit test

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

  const handleMouseUp = () => {
    setDragTarget(null);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // If outside selected range, jump to start
      if (currentTime < startTime || currentTime >= endTime) {
        audio.currentTime = startTime;
      }
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
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

  const resetToSelectionStart = () => {
    seek(startTime);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVol;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.volume = nextMute ? 0 : volume;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Header controls & timecode */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            disabled={isLoadingAudio}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
            }`}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={resetToSelectionStart}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Jump to Start of Selection"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 font-mono text-sm">
            <span className="text-cyan-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Selection summary pill */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
          <span className="text-slate-400">Selected:</span>
          <span className="font-mono text-emerald-400 font-semibold">{formatTime(startTime)}</span>
          <span className="text-slate-500">→</span>
          <span className="font-mono text-rose-400 font-semibold">{formatTime(endTime)}</span>
          <span className="text-slate-500 font-mono">({(endTime - startTime).toFixed(2)}s)</span>
        </div>

        {/* Zoom and Volume Controls */}
        <div className="flex items-center gap-3">
          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              title="Fit to Screen"
            >
              1x
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.5))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Waveform Canvas Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto relative rounded-xl border border-slate-800 bg-slate-950/80 cursor-crosshair select-none"
      >
        {isLoadingAudio && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-indigo-400 text-sm font-medium">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Decoding high-fidelity waveform...
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

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Click to scrub • Drag Green/Red flags to adjust trim window</span>
        <span>Space: Play/Pause</span>
      </div>
    </div>
  );
};
