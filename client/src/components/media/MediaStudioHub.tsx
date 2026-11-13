import React from 'react';
import {
  Film,
  Music,
  Scissors,
  RefreshCw,
  Sliders,
  Sparkles,
  Layers,
  Tag,
  Mic,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Maximize2,
  Palette,
  Clock,
  ShieldCheck,
  Video,
  FileAudio,
} from 'lucide-react';

interface MediaStudioHubProps {
  onSelectVideo: () => void;
  onSelectAudio: (tab?: string) => void;
  onBackToHome: () => void;
}

export const MediaStudioHub: React.FC<MediaStudioHubProps> = ({
  onSelectVideo,
  onSelectAudio,
  onBackToHome,
}) => {
  return (
    <div className="min-h-[85vh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Subheader Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back<span className="hidden sm:inline"> to Home Dashboard</span></span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 sm:px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
            Audio & Video<span className="hidden sm:inline"> Media Suite</span>
          </span>
          <span className="hidden md:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            High-Speed Processing Engine
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full flex flex-col justify-between">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-800/80 text-purple-800 dark:text-purple-300 text-xs font-semibold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Unified Media Workstation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Audio & Video Studio
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Choose an editor below to launch its dedicated toolset. High-performance video editing and studio audio tools right in your browser.
          </p>
        </div>

        {/* Dual Master Cards: Video Editor & Audio Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          {/* CARD 1: VIDEO EDITOR & SHORTS */}
          <div
            onClick={onSelectVideo}
            className="group relative bg-white dark:bg-slate-900/90 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-rose-100/50 dark:bg-rose-950/20 blur-3xl group-hover:bg-rose-200/60 dark:group-hover:bg-rose-900/30 transition-colors pointer-events-none" />

            <div>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                    <Film className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-tight">
                      Video Editor & Shorts
                    </h2>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                      Timeline Clipping, 9:16 Shorts & FX
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full shrink-0">
                  HD & 4K Suite
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                All-in-one timeline video editor for clipping, social aspect ratio framing, playback speed adjustment, rotate, audio replacement, and animated GIF creation.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Scissors className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Precision Video Trim & Cut</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Maximize2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>9:16 Shorts / Reels Crop</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Zap className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>0.25x - 4x Speed & Slow-Mo</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Music className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Music Mixer & Mute Audio</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Palette className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Cinematic Filters & Watermark</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <Video className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Animated GIF & MP4 Export</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectVideo();
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn transition-all"
            >
              <span>Launch Video Editor</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* CARD 2: AUDIO EDITOR & TOOLS */}
          <div
            onClick={() => onSelectAudio()}
            className="group relative bg-white dark:bg-slate-900/90 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-indigo-100/50 dark:bg-indigo-950/20 blur-3xl group-hover:bg-indigo-200/60 dark:group-hover:bg-indigo-900/30 transition-colors pointer-events-none" />

            <div>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                    <Music className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                      Audio Editor & Tools
                    </h2>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Waveform Trimmer, 320k Converter & Effects
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-full shrink-0">
                  Studio Sound 320k
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                High-precision audio workstation with interactive visual waveforms, lossless and compressed multi-format conversion, spatial 8D effects, and metadata editing.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudio('trim');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 font-medium text-left transition-all group/item"
                >
                  <Scissors className="w-4 h-4 text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0" />
                  <span>Visual Waveform Trimmer</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudio('convert');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 font-medium text-left transition-all group/item"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0" />
                  <span>MP3 / WAV / FLAC 320k Scaler</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudio('video');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 font-medium text-left transition-all group/item"
                >
                  <Film className="w-4 h-4 text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0" />
                  <span>Video Soundtrack Extractor</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudio('effects');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 font-medium text-left transition-all group/item"
                >
                  <Sliders className="w-4 h-4 text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0" />
                  <span>Pitch, Tempo & 8D Spatial Audio</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudio('merge');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 font-medium text-left transition-all group/item"
                >
                  <Layers className="w-4 h-4 text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0" />
                  <span>Multi-Track Sequence Merger</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudio('tags');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 font-medium text-left transition-all group/item"
                >
                  <Tag className="w-4 h-4 text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0" />
                  <span>ID3 Tag Editor & Voice Recorder</span>
                </button>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectAudio();
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn transition-all"
            >
              <span>Launch Audio Editor</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Feature & Privacy Highlights */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">100% Private & Secure</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Your media files never leave your control</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lightning-Fast Engine</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Fast frame-accurate rendering & encoding</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Free Forever</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">No watermarks, limits or subscriptions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
