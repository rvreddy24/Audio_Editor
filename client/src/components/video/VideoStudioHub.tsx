import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Scissors,
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Gauge,
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Type,
  RefreshCw,
  Download,
  Upload,
  Play,
  Pause,
  Maximize,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Repeat,
  Zap,
  Image as ImageIcon,
  FileAudio,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  VideoFileInfo,
  VideoEditOptions,
  ASPECT_RATIOS,
  SPEED_PRESETS,
  FILTER_PRESETS,
  AspectRatioPreset,
  VideoFilterType,
  OutputFormat,
  ResolutionPreset,
  QualityPreset,
  WatermarkPosition,
} from './types';

interface VideoStudioHubProps {
  onBack?: () => void;
}

export const VideoStudioHub: React.FC<VideoStudioHubProps> = ({ onBack }) => {
  const [videoInfo, setVideoInfo] = useState<VideoFileInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoopingRange, setIsLoopingRange] = useState(false);

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<
    'trim' | 'crop' | 'transform' | 'speed' | 'audio' | 'filters' | 'watermark' | 'reverse' | 'export'
  >('trim');

  // Edit Options State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('original');
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [flip, setFlip] = useState<'none' | 'horizontal' | 'vertical' | 'both'>('none');
  const [speed, setSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioMode, setAudioMode] = useState<'original' | 'mute' | 'replace' | 'mix'>('original');
  const [bgAudioFile, setBgAudioFile] = useState<File | null>(null);
  const [bgAudioVolume, setBgAudioVolume] = useState(0.5);

  const [filterType, setFilterType] = useState<VideoFilterType>('none');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);

  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('bottom-right');
  const [reverse, setReverse] = useState(false);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp4');
  const [resolution, setResolution] = useState<ResolutionPreset>('original');
  const [quality, setQuality] = useState<QualityPreset>('medium');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [resultModal, setResultModal] = useState<{
    downloadUrl: string;
    downloadName: string;
    streamUrl?: string;
    size?: number;
    format: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadVideo(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadVideo(e.dataTransfer.files[0]);
    }
  };

  const loadVideo = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      const dur = video.duration || 10;
      setVideoInfo({
        file,
        name: file.name,
        size: file.size,
        duration: dur,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        fps: 30,
        objectUrl,
      });
      setTrimStart(0);
      setTrimEnd(dur);
      setDuration(dur);
      setCurrentTime(0);
      setIsPlaying(false);
      setRotate(0);
      setFlip('none');
      setSpeed(1.0);
      setFilterType('none');
      setBrightness(0);
      setContrast(1);
      setSaturation(1);
      setReverse(false);
      setAspectRatio('original');
      setResultModal(null);
    };
  };

  // Time update listener
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    if (isLoopingRange && trimEnd > trimStart) {
      if (t >= trimEnd || t < trimStart) {
        videoRef.current.currentTime = trimStart;
        if (!isPlaying) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= trimEnd && trimEnd > trimStart) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seek = (time: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(duration, time));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const stepFrame = (deltaSeconds: number) => {
    seek(currentTime + deltaSeconds);
  };

  // Sync speed to video player for live preview
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Sync volume to video player
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted || audioMode === 'mute' || volume === 0;
      videoRef.current.volume = Math.min(1.0, Math.max(0, volume));
    }
  }, [volume, isMuted, audioMode]);

  // Format helpers
  const formatTimeStr = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00.0';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const formatFileSizeStr = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Compute CSS filter for live preview
  const getCssFilter = () => {
    const parts = [];
    if (filterType === 'grayscale') parts.push('grayscale(100%)');
    else if (filterType === 'sepia') parts.push('sepia(85%)');
    else if (filterType === 'vintage') parts.push('sepia(40%) contrast(115%)');
    else if (filterType === 'invert') parts.push('invert(100%)');

    if (brightness !== 0) parts.push(`brightness(${100 + brightness * 100}%)`);
    if (contrast !== 1) parts.push(`contrast(${contrast * 100}%)`);
    if (saturation !== 1) parts.push(`saturate(${saturation * 100}%)`);

    return parts.length > 0 ? parts.join(' ') : 'none';
  };

  // Compute CSS transform for live preview
  const getCssTransform = () => {
    const parts = [];
    if (rotate !== 0) parts.push(`rotate(${rotate}deg)`);
    if (flip === 'horizontal') parts.push('scaleX(-1)');
    else if (flip === 'vertical') parts.push('scaleY(-1)');
    else if (flip === 'both') parts.push('scale(-1, -1)');
    return parts.length > 0 ? parts.join(' ') : 'none';
  };

  // Get preview aspect ratio container styling
  const getContainerAspectRatio = () => {
    if (aspectRatio === '16:9') return '16 / 9';
    if (aspectRatio === '9:16') return '9 / 16';
    if (aspectRatio === '1:1') return '1 / 1';
    if (aspectRatio === '4:5') return '4 / 5';
    if (aspectRatio === '21:9') return '21 / 9';
    return undefined;
  };

  // Execute processing via backend FFmpeg
  const handleProcessVideo = async () => {
    if (!videoInfo) return;
    setIsProcessing(true);
    setProcessProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', videoInfo.file);
      if (bgAudioFile && (audioMode === 'replace' || audioMode === 'mix')) {
        formData.append('audio', bgAudioFile);
      }

      formData.append('trimStart', trimStart.toString());
      formData.append('trimEnd', trimEnd.toString());
      formData.append('aspectRatio', aspectRatio);
      formData.append('rotate', rotate.toString());
      formData.append('flip', flip);
      formData.append('speed', speed.toString());
      formData.append('volume', isMuted ? '0' : volume.toString());
      formData.append('audioMode', isMuted ? 'mute' : audioMode);
      formData.append('bgAudioVolume', bgAudioVolume.toString());
      formData.append('filterType', filterType);
      formData.append('brightness', brightness.toString());
      formData.append('contrast', contrast.toString());
      formData.append('saturation', saturation.toString());
      formData.append('watermarkText', watermarkText);
      formData.append('watermarkPosition', watermarkPosition);
      formData.append('reverse', reverse.toString());
      formData.append('resolution', resolution);
      formData.append('outputFormat', outputFormat);
      formData.append('quality', quality);

      setProcessProgress(40);

      const res = await fetch('/api/video/process', {
        method: 'POST',
        body: formData,
      });

      setProcessProgress(85);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setProcessProgress(100);

      setResultModal({
        downloadUrl: data.downloadUrl,
        downloadName: data.downloadName,
        streamUrl: data.streamUrl,
        size: data.size || (data.probe && data.probe.size),
        format: outputFormat,
      });
    } catch (err: any) {
      alert(`Video processing error: ${err.message || 'Please check your settings and try again.'}`);
    } finally {
      setIsProcessing(false);
      setProcessProgress(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tools</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                <span>Video Studio</span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                  FFmpeg 8.1 Engine
                </span>
              </h1>
            </div>
          </div>
        </div>

        {videoInfo && (
          <label className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 cursor-pointer shadow-2xs transition-all flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-rose-600" />
            <span>Open Another Video</span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* DROPZONE: WHEN NO VIDEO LOADED */}
      {!videoInfo ? (
        <div className="space-y-8">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="max-w-3xl mx-auto border-2 border-dashed border-slate-300 hover:border-rose-500 bg-white hover:bg-rose-50/20 rounded-3xl p-10 sm:p-14 text-center transition-all shadow-xs group cursor-pointer"
          >
            <label className="cursor-pointer block">
              <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 group-hover:scale-110 flex items-center justify-center mx-auto mb-5 transition-transform shadow-xs">
                <Film className="w-10 h-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                Drop your video here or click to browse
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
                Trim, cut, crop aspect ratios, change speed, rotate, adjust sound & music, add text watermarks, or convert to MP4 & GIF.
              </p>
              <span className="inline-flex items-center gap-2 bg-rose-600 group-hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-colors">
                <Upload className="w-4 h-4" />
                <span>Select Video File</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-4">
                Supports MP4, WebM, MOV, MKV, AVI • Up to 1 GB • 100% Free & Private
              </p>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Quick Features Grid */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Scissors,
                title: 'Trim & Cut',
                desc: 'Scrub timeline with millisecond precision and loop segments.',
              },
              {
                icon: Crop,
                title: 'Aspect Ratio Crop',
                desc: '16:9 Landscape, 9:16 Shorts/Reels, 1:1 Instagram Square, 4:5.',
              },
              {
                icon: Gauge,
                title: 'Speed & Slow-Mo',
                desc: '0.25x slow motion to 4x timelapse with pitch preservation.',
              },
              {
                icon: RotateCw,
                title: 'Rotate & Flip',
                desc: 'Fix vertical orientation, 90° rotation, and horizontal mirror selfie.',
              },
              {
                icon: Music,
                title: 'Audio & Music Mixer',
                desc: 'Boost volume to 300%, mute audio, or add background soundtrack.',
              },
              {
                icon: Sparkles,
                title: 'Filters & Colors',
                desc: 'Grayscale, Sepia, Vintage, Brightness, Contrast & Saturation.',
              },
              {
                icon: ImageIcon,
                title: 'Convert to GIF',
                desc: 'Turn any video clip into a crystal-clear animated GIF.',
              },
              {
                icon: FileAudio,
                title: 'Extract Audio',
                desc: 'Export high-bitrate 320kbps MP3 or WAV directly from video.',
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-rose-400 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 mb-1">{feat.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* WORKSTATION VIEW: VIDEO LOADED */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: INTERACTIVE VIDEO CANVAS & TIMELINE */}
          <div className="lg:col-span-7 space-y-4">
            {/* Video Viewport Container with Live Framing */}
            <div className="bg-slate-950 rounded-3xl p-3 sm:p-4 shadow-md border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className="w-full max-h-[460px] flex items-center justify-center relative overflow-hidden rounded-2xl transition-all duration-300"
                style={{
                  aspectRatio: getContainerAspectRatio(),
                }}
              >
                <video
                  ref={videoRef}
                  src={videoInfo.objectUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain rounded-xl select-none transition-all duration-200"
                  style={{
                    filter: getCssFilter(),
                    transform: getCssTransform(),
                  }}
                  playsInline
                />

                {/* Text Watermark Live Preview Overlay */}
                {watermarkText.trim() && (
                  <div
                    className={`absolute pointer-events-none p-3 z-10 ${
                      watermarkPosition === 'top-left'
                        ? 'top-2 left-2'
                        : watermarkPosition === 'top-right'
                        ? 'top-2 right-2'
                        : watermarkPosition === 'bottom-left'
                        ? 'bottom-2 left-2'
                        : watermarkPosition === 'center'
                        ? 'inset-0 flex items-center justify-center'
                        : 'bottom-2 right-2'
                    }`}
                  >
                    <span className="bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-md border border-white/20 shadow-sm">
                      {watermarkText.trim()}
                    </span>
                  </div>
                )}
              </div>

              {/* Viewport Playhead Readout Bar */}
              <div className="w-full mt-3 px-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  {formatTimeStr(currentTime)}
                </span>
                <span className="text-[11px] text-slate-500">
                  Total: {formatTimeStr(duration)}
                </span>
              </div>
            </div>

            {/* Custom Transport Controls & Timeline Scrubber */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              {/* Timeline Slider with Range Highlighting */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-rose-600" />
                    <span>Timeline & Trim Range</span>
                  </span>
                  <span className="text-[11px] font-mono text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                    Trimmed: {formatTimeStr(Math.max(0, trimEnd - trimStart))}
                  </span>
                </div>

                {/* Scrubber Bar */}
                <div className="relative pt-2 pb-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 10}
                    step="0.05"
                    value={currentTime}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />

                  {/* Trim bounds indicators */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>00:00.0</span>
                    <span className="text-rose-600 font-bold">
                      [{formatTimeStr(trimStart)} ─── {formatTimeStr(trimEnd)}]
                    </span>
                    <span>{formatTimeStr(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Primary Transport Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  {/* Frame step buttons */}
                  <button
                    onClick={() => stepFrame(-1.0)}
                    className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Back 1 Second"
                  >
                    -1s
                  </button>
                  <button
                    onClick={() => stepFrame(-0.1)}
                    className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Back 1 Frame"
                  >
                    -0.1s
                  </button>
                  <button
                    onClick={() => stepFrame(0.1)}
                    className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Forward 1 Frame"
                  >
                    +0.1s
                  </button>
                  <button
                    onClick={() => stepFrame(1.0)}
                    className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Forward 1 Second"
                  >
                    +1s
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Loop Trimmed Range Button */}
                  <button
                    onClick={() => setIsLoopingRange(!isLoopingRange)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isLoopingRange
                        ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    title="Repeatedly loop the trimmed selection"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Loop Range</span>
                  </button>

                  {/* Mute Preview Button */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      isMuted
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Trimming Anchors */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setTrimStart(currentTime)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-colors"
                >
                  <span>Set Start: {formatTimeStr(currentTime)}</span>
                </button>
                <button
                  onClick={() => setTrimEnd(currentTime)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-colors"
                >
                  <span>Set End: {formatTimeStr(currentTime)}</span>
                </button>
              </div>
            </div>

            {/* Video File Specs Badge */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <span className="font-bold truncate max-w-[200px]" title={videoInfo.name}>
                {videoInfo.name}
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                <span>{videoInfo.width} × {videoInfo.height} px</span>
                <span>•</span>
                <span>{formatFileSizeStr(videoInfo.size)}</span>
                <span>•</span>
                <span>{formatTimeStr(videoInfo.duration)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: TOOL CONTROL PANEL & TABS */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            {/* Tool Category Selector Bar */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Editing Tools
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { key: 'trim', label: 'Trim', icon: Scissors },
                  { key: 'crop', label: 'Crop', icon: Crop },
                  { key: 'transform', label: 'Rotate', icon: RotateCw },
                  { key: 'speed', label: 'Speed', icon: Gauge },
                  { key: 'audio', label: 'Audio', icon: Music },
                  { key: 'filters', label: 'Filters', icon: Sliders },
                  { key: 'watermark', label: 'Text', icon: Type },
                  { key: 'export', label: 'Export', icon: Download },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        isActive
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENT 1: TRIM */}
            {activeTab === 'trim' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-rose-600" />
                    <span>Cut & Trim Boundaries</span>
                  </h3>
                  <button
                    onClick={() => {
                      setTrimStart(0);
                      setTrimEnd(duration);
                    }}
                    className="text-[11px] text-rose-600 font-bold hover:underline"
                  >
                    Reset Range
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Start Time (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={trimEnd}
                      value={parseFloat(trimStart.toFixed(2))}
                      onChange={(e) => setTrimStart(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">End Time (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={trimStart}
                      max={duration}
                      value={parseFloat(trimEnd.toFixed(2))}
                      onChange={(e) => setTrimEnd(Math.min(duration, parseFloat(e.target.value) || duration))}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Original Duration:</span>
                    <span className="font-mono font-bold">{formatTimeStr(duration)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Exported Duration:</span>
                    <span className="font-mono">{formatTimeStr(Math.max(0, trimEnd - trimStart))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CROP & ASPECT RATIO */}
            {activeTab === 'crop' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Crop className="w-4 h-4 text-rose-600" />
                    <span>Aspect Ratio & Framing</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.key}
                      onClick={() => setAspectRatio(ar.key)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        aspectRatio === ar.key
                          ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{ar.label}</span>
                        {aspectRatio === ar.key && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{ar.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: TRANSFORM (ROTATE & FLIP) */}
            {activeTab === 'transform' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4 text-rose-600" />
                    <span>Orientation & Mirroring</span>
                  </h3>
                </div>

                {/* Rotation options */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-2">Rotation Angle</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { deg: 0, label: '0°' },
                      { deg: 90, label: '90° CW' },
                      { deg: 180, label: '180°' },
                      { deg: 270, label: '90° CCW' },
                    ].map((r) => (
                      <button
                        key={r.deg}
                        onClick={() => setRotate(r.deg as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          rotate === r.deg
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mirror / Flip options */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-2">Mirror / Flip</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'none', label: 'Normal', icon: Check },
                      { key: 'horizontal', label: 'Mirror (H)', icon: FlipHorizontal },
                      { key: 'vertical', label: 'Flip (V)', icon: FlipVertical },
                    ].map((f) => {
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setFlip(f.key as any)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            flip === f.key
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: SPEED */}
            {activeTab === 'speed' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-rose-600" />
                    <span>Playback Speed & Slow-Mo</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                    {speed}x
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {SPEED_PRESETS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        speed === s
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500">
                  Speed affects output duration: <span className="font-mono font-bold text-slate-800">{(duration / speed).toFixed(1)}s</span> (Audio pitch automatically preserved via FFmpeg atempo).
                </p>
              </div>
            )}

            {/* TAB CONTENT 5: AUDIO & MUSIC */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-rose-600" />
                    <span>Audio & Soundtrack Mixer</span>
                  </h3>
                </div>

                {/* Original volume slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Original Video Volume</span>
                    <span className="font-mono text-rose-600">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Mute (0%)</span>
                    <span>Normal (100%)</span>
                    <span>Boost (300%)</span>
                  </div>
                </div>

                {/* Background music track upload */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Add Background Music (MP3 / WAV)
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-rose-500 rounded-2xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-rose-50/30 transition-colors">
                    <Upload className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                      {bgAudioFile ? bgAudioFile.name : 'Choose Audio Track...'}
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setBgAudioFile(e.target.files[0]);
                          if (audioMode === 'original') setAudioMode('mix');
                        }
                      }}
                    />
                  </label>

                  {bgAudioFile && (
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setAudioMode('mix')}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            audioMode === 'mix'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          Mix Both Tracks
                        </button>
                        <button
                          onClick={() => setAudioMode('replace')}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            audioMode === 'replace'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          Replace Audio
                        </button>
                      </div>

                      {audioMode === 'mix' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>Music Track Volume</span>
                            <span className="font-mono">{Math.round(bgAudioVolume * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1.5"
                            step="0.05"
                            value={bgAudioVolume}
                            onChange={(e) => setBgAudioVolume(parseFloat(e.target.value))}
                            className="w-full accent-rose-600 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: FILTERS & ADJUSTMENTS */}
            {activeTab === 'filters' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-rose-600" />
                    <span>Visual Filters & Color Tuning</span>
                  </h3>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  {FILTER_PRESETS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterType(f.key)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                        filterType === f.key
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Fine adjustments */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>Brightness</span>
                      <span className="font-mono text-slate-500">{brightness > 0 ? `+${brightness}` : brightness}</span>
                    </div>
                    <input
                      type="range"
                      min="-0.4"
                      max="0.4"
                      step="0.05"
                      value={brightness}
                      onChange={(e) => setBrightness(parseFloat(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>Contrast</span>
                      <span className="font-mono text-slate-500">{contrast.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={contrast}
                      onChange={(e) => setContrast(parseFloat(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>Saturation</span>
                      <span className="font-mono text-slate-500">{saturation.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.0"
                      step="0.1"
                      value={saturation}
                      onChange={(e) => setSaturation(parseFloat(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 7: WATERMARK / TEXT */}
            {activeTab === 'watermark' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-rose-600" />
                    <span>Overlay Text & Watermark</span>
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Watermark Text</label>
                  <input
                    type="text"
                    placeholder="e.g. @rajvarshith or Video Title"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Position</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'top-left', label: 'Top Left' },
                      { key: 'center', label: 'Center' },
                      { key: 'top-right', label: 'Top Right' },
                      { key: 'bottom-left', label: 'Bottom Left' },
                      { key: 'bottom-right', label: 'Bottom Right' },
                    ].map((pos) => (
                      <button
                        key={pos.key}
                        onClick={() => setWatermarkPosition(pos.key as any)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          watermarkPosition === pos.key
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 8: EXPORT & FORMAT SETTINGS */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-rose-600" />
                    <span>Format & Quality Output</span>
                  </h3>
                </div>

                {/* Output Format */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Output Format</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'mp4', label: 'MP4 Video' },
                      { key: 'webm', label: 'WebM Video' },
                      { key: 'gif', label: 'Animated GIF' },
                      { key: 'mov', label: 'MOV Video' },
                      { key: 'mp3', label: 'Extract MP3' },
                      { key: 'wav', label: 'Extract WAV' },
                    ].map((fmt) => (
                      <button
                        key={fmt.key}
                        onClick={() => setOutputFormat(fmt.key as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          outputFormat === fmt.key
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                {outputFormat !== 'mp3' && outputFormat !== 'wav' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Target Resolution</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { key: 'original', label: 'Original' },
                        { key: '1080p', label: '1080p FHD' },
                        { key: '720p', label: '720p HD' },
                        { key: '480p', label: '480p SD' },
                      ].map((res) => (
                        <button
                          key={res.key}
                          onClick={() => setResolution(res.key as any)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            resolution === res.key
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {res.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality / CRF */}
                {outputFormat !== 'mp3' && outputFormat !== 'wav' && outputFormat !== 'gif' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Quality Profile</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { key: 'high', label: 'High (CRF 18)' },
                        { key: 'medium', label: 'Balanced (CRF 23)' },
                        { key: 'low', label: 'Small Size (CRF 28)' },
                      ].map((q) => (
                        <button
                          key={q.key}
                          onClick={() => setQuality(q.key as any)}
                          className={`py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                            quality === q.key
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACTION BUTTON: RENDER / EXPORT */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                disabled={isProcessing}
                onClick={handleProcessVideo}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing with FFmpeg Engine...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>
                      Export {outputFormat === 'gif' ? 'Animated GIF' : outputFormat === 'mp3' || outputFormat === 'wav' ? 'Audio Track' : 'Edited Video'}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Processed via high-performance FFmpeg 8.1 container • Fast, secure & watermark-free
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL / PREVIEW DIALOG */}
      {resultModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="text-base font-black text-slate-900">Video Export Complete!</h3>
              </div>
              <button
                onClick={() => setResultModal(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Preview player */}
            <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-64 flex items-center justify-center">
              {resultModal.format === 'gif' ? (
                <img
                  src={resultModal.downloadUrl}
                  alt="GIF result"
                  className="w-full h-auto object-contain"
                />
              ) : resultModal.format === 'mp3' || resultModal.format === 'wav' ? (
                <div className="p-8 text-center text-white space-y-3">
                  <FileAudio className="w-12 h-12 text-rose-500 mx-auto" />
                  <span className="text-sm font-bold block">{resultModal.downloadName}</span>
                  <audio controls src={resultModal.streamUrl || resultModal.downloadUrl} className="w-full" />
                </div>
              ) : (
                <video
                  controls
                  src={resultModal.streamUrl || resultModal.downloadUrl}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Metadata summary */}
            <div className="bg-slate-50 rounded-2xl p-3 flex justify-between text-xs text-slate-600">
              <span>File: <strong className="text-slate-900">{resultModal.downloadName}</strong></span>
              {resultModal.size && <span>Size: <strong>{formatFileSizeStr(resultModal.size)}</strong></span>}
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <a
                href={resultModal.downloadUrl}
                download={resultModal.downloadName}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download {resultModal.downloadName}</span>
              </a>

              <button
                onClick={() => setResultModal(null)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
