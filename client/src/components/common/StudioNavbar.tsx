import React, { useState } from 'react';
import {
  FileText,
  Music,
  LayoutGrid,
  Calculator,
  ChevronRight,
  Sparkles,
  Camera,
  Film,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getActiveViewLabel = () => {
    switch (currentView) {
      case 'pdf':
        return activePdfToolTitle || 'PDF Tools';
      case 'image':
        return activeImageToolTitle || 'Image Studio';
      case 'audio':
        return 'Audio Editor';
      case 'video':
        return 'Video Editor';
      case 'media':
        return 'Audio & Video';
      case 'calc':
        return activeCalcTitle || 'Calculators';
      default:
        return 'All Tools';
    }
  };

  const getActiveViewBadgeColor = () => {
    switch (currentView) {
      case 'pdf':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'image':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'audio':
      case 'video':
      case 'media':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'calc':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleMobileNav = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateHome();
              }}
              className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer text-left focus:outline-none shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/rv-logo.png"
                  alt="rajvarshith.com logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-orange-500 transition-colors">
                  rajvarshith<span className="text-orange-500">.com</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 sm:ml-2 text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded-md">
                  Studio
                </span>
              </div>
            </button>

            {/* Desktop Breadcrumb if inside tool */}
            {currentView !== 'home' && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 min-w-0 truncate">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
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
                  className="font-semibold text-slate-700 hover:text-orange-600 transition-colors shrink-0"
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
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">
                      {currentView === 'video' ? 'Video Editor' : 'Audio Editor'}
                    </span>
                  </>
                )}
                {activePdfToolTitle && currentView === 'pdf' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">{activePdfToolTitle}</span>
                  </>
                )}
                {activeCalcTitle && currentView === 'calc' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">{activeCalcTitle}</span>
                  </>
                )}
                {activeImageToolTitle && currentView === 'image' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">{activeImageToolTitle}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Switchers (hidden on mobile, visible on md+) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
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

          {/* Mobile Right Controls: Active View Pill + Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {currentView !== 'home' && (
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-lg border truncate max-w-[140px] ${getActiveViewBadgeColor()}`}
              >
                {getActiveViewLabel()}
              </span>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/90 bg-white/98 backdrop-blur-lg shadow-lg px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => handleMobileNav(onNavigateHome)}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
              currentView === 'home'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800/20 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">All Tools Dashboard</div>
                <div className={`text-[10px] ${currentView === 'home' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Overview of all 5 studios
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>

          <button
            onClick={() => handleMobileNav(onNavigatePdf)}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
              currentView === 'pdf'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-red-50/50 hover:bg-red-50 text-slate-800 border border-red-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">PDF & Office Studio</div>
                <div className={`text-[10px] ${currentView === 'pdf' ? 'text-red-100' : 'text-slate-500'}`}>
                  Merge, Split, OCR, Edit & Convert
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600/20 text-red-700">
              25+
            </span>
          </button>

          <button
            onClick={() => handleMobileNav(onNavigateImage)}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
              currentView === 'image'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50/50 hover:bg-emerald-50 text-slate-800 border border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Image Studio</div>
                <div className={`text-[10px] ${currentView === 'image' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  Target KB, Passport, Signatures, Crop & Filter
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-700">
              20
            </span>
          </button>

          <button
            onClick={() =>
              handleMobileNav(() => {
                if (onNavigateMedia) onNavigateMedia();
                else if (currentView === 'audio') onNavigateAudio();
                else onNavigateVideo();
              })
            }
            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
              currentView === 'video' || currentView === 'audio' || currentView === 'media'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-purple-50/50 hover:bg-purple-50 text-slate-800 border border-purple-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Audio & Video Studio</div>
                <div
                  className={`text-[10px] ${
                    currentView === 'video' || currentView === 'audio' || currentView === 'media'
                      ? 'text-purple-100'
                      : 'text-slate-500'
                  }`}
                >
                  Video Trimmer, 9:16 Shorts, Audio Editor
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>

          <button
            onClick={() => handleMobileNav(onNavigateCalc)}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
              currentView === 'calc'
                ? 'bg-orange-600 text-white font-bold'
                : 'bg-orange-50/50 hover:bg-orange-50 text-slate-800 border border-orange-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Calculator Suite</div>
                <div className={`text-[10px] ${currentView === 'calc' ? 'text-orange-100' : 'text-slate-500'}`}>
                  Scientific, Mortgage, BMI, Math & Units
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-700">
              22
            </span>
          </button>
        </div>
      )}
    </header>
  );
};
