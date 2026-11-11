import React from 'react';
import {
  FileText,
  Music,
  LayoutGrid,
  Calculator,
  ChevronRight,
  Sparkles,
  Camera,
  Film,
} from 'lucide-react';

interface StudioNavbarProps {
  currentView: 'home' | 'pdf' | 'audio' | 'calc' | 'image' | 'video' | 'media';
  activePdfToolTitle?: string;
  activeCalcTitle?: string;
  activeImageToolTitle?: string;
  onNavigateHome: () => void;
  onNavigatePdf: () => void;
  onNavigateAudio: () => void;
  onNavigateCalc: () => void;
  onNavigateImage: () => void;
  onNavigateVideo: () => void;
  onNavigateMedia?: () => void;
}

export const StudioNavbar: React.FC<StudioNavbarProps> = ({
  currentView,
  activePdfToolTitle,
  activeCalcTitle,
  activeImageToolTitle,
  onNavigateHome,
  onNavigatePdf,
  onNavigateAudio,
  onNavigateCalc,
  onNavigateImage,
  onNavigateVideo,
  onNavigateMedia,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="w-9 h-9 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/rv-logo.png"
                  alt="rajvarshith.com logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-black text-base tracking-tight text-slate-900 group-hover:text-orange-500 transition-colors">
                  rajvarshith<span className="text-orange-500">.com</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded-md">
                  Studio
                </span>
              </div>
            </button>

            {/* Breadcrumb if inside tool */}
            {currentView !== 'home' && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <button
                  onClick={
                    currentView === 'pdf'
                      ? onNavigatePdf
                      : currentView === 'audio' || currentView === 'video' || currentView === 'media'
                      ? (onNavigateMedia || onNavigateVideo)
                      : currentView === 'calc'
                      ? onNavigateCalc
                      : onNavigateImage
                  }
                  className="font-semibold text-slate-700 hover:text-orange-600 transition-colors"
                >
                  {currentView === 'pdf'
                    ? 'PDF Tools'
                    : currentView === 'audio' || currentView === 'video' || currentView === 'media'
                    ? 'Audio & Video'
                    : currentView === 'calc'
                    ? 'Calculator Studio'
                    : 'Image Studio'}
                </button>
                {(currentView === 'audio' || currentView === 'video') && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-bold text-slate-900">
                      {currentView === 'video' ? 'Video Editor' : 'Audio Editor'}
                    </span>
                  </>
                )}
                {activePdfToolTitle && currentView === 'pdf' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-bold text-slate-900">{activePdfToolTitle}</span>
                  </>
                )}
                {activeCalcTitle && currentView === 'calc' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-bold text-slate-900">{activeCalcTitle}</span>
                  </>
                )}
                {activeImageToolTitle && currentView === 'image' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-bold text-slate-900">{activeImageToolTitle}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation Switchers */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Home button */}
            <button
              onClick={onNavigateHome}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'home'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Tools</span>
            </button>

            {/* PDF Tools button */}
            <button
              onClick={onNavigatePdf}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'pdf'
                  ? 'bg-red-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-red-600 hover:bg-red-50/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>PDF Tools</span>
            </button>

            {/* Image Studio button */}
            <button
              onClick={onNavigateImage}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'image'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-500" />
              <span>Image Studio</span>
            </button>

            {/* Audio & Video Studio button */}
            <button
              onClick={() => {
                if (onNavigateMedia) onNavigateMedia();
                else if (currentView === 'audio') onNavigateAudio();
                else onNavigateVideo();
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'video' || currentView === 'audio' || currentView === 'media'
                  ? 'bg-purple-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-rose-500" />
              <Music className="w-3 h-3 text-indigo-400 -ml-1" />
              <span>Audio & Video</span>
            </button>

            {/* Calculator Studio button */}
            <button
              onClick={onNavigateCalc}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'calc'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-orange-500" />
              <span>Calculators</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
