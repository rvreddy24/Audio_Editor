import React, { useState } from 'react';
import {
  FileText,
  Music,
  LayoutGrid,
  Calculator,
  ChevronRight,
  Camera,
  Film,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme, isDark, toggleTheme } = useTheme();

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
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800';
      case 'image':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'audio':
      case 'video':
      case 'media':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'calc':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const handleMobileNav = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors duration-200">
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
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 group-hover:scale-105 transition-transform">
                <img
                  src="/rv-logo.png"
                  alt="rajvarshith.com logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">
                  rajvarshith<span className="text-orange-500">.com</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 sm:ml-2 text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/80 px-1.5 py-0.5 rounded-md">
                  Studio
                </span>
              </div>
            </button>

            {/* Desktop Breadcrumb if inside tool */}
            {currentView !== 'home' && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 min-w-0 truncate">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
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
                  className="font-semibold text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 transition-colors shrink-0"
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
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {currentView === 'video' ? 'Video Editor' : 'Audio Editor'}
                    </span>
                  </>
                )}
                {activePdfToolTitle && currentView === 'pdf' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white truncate">{activePdfToolTitle}</span>
                  </>
                )}
                {activeCalcTitle && currentView === 'calc' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white truncate">{activeCalcTitle}</span>
                  </>
                )}
                {activeImageToolTitle && currentView === 'image' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white truncate">{activeImageToolTitle}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Switchers + Theme Toggle */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* Home button */}
            <button
              onClick={onNavigateHome}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'home'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
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
                  : 'text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/40'
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
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40'
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
                  : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/60 dark:hover:bg-purple-950/40'
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
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/60 dark:hover:bg-orange-950/40'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-orange-500" />
              <span>Calculators</span>
            </button>

            {/* Vertical Separator */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700/80 mx-1" />

            {/* Dark Mode Switch Button (Desktop) */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode (☀️)' : 'Switch to dark mode (🌙)'}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
                  <span className="hidden xl:inline text-[11px] font-medium text-slate-200">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-200" />
                  <span className="hidden xl:inline text-[11px] font-medium text-slate-700">Dark</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Right Controls: Active View Pill + Theme Switch + Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {currentView !== 'home' && (
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-lg border truncate max-w-[120px] ${getActiveViewBadgeColor()}`}
              >
                {getActiveViewLabel()}
              </span>
            )}

            {/* Mobile Quick Theme Switch Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/90 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-lg shadow-lg px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => handleMobileNav(onNavigateHome)}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
              currentView === 'home'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800/20 dark:bg-slate-700/60 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">All Tools Dashboard</div>
                <div className={`text-[10px] ${currentView === 'home' ? 'text-slate-300 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
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
                : 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-800 dark:text-slate-200 border border-red-100 dark:border-red-900/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">PDF & Office Studio</div>
                <div className={`text-[10px] ${currentView === 'pdf' ? 'text-red-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Merge, Split, OCR, Edit & Convert
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600/20 text-red-700 dark:text-red-300">
              25+
            </span>
          </button>

          <button
            onClick={() => handleMobileNav(onNavigateImage)}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
              currentView === 'image'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border border-emerald-100 dark:border-emerald-900/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Image Studio</div>
                <div className={`text-[10px] ${currentView === 'image' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Target KB, Passport, Signatures, Crop & Filter
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300">
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
                : 'bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 border border-purple-100 dark:border-purple-900/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Audio & Video Studio</div>
                <div
                  className={`text-[10px] ${
                    currentView === 'video' || currentView === 'audio' || currentView === 'media'
                      ? 'text-purple-100'
                      : 'text-slate-500 dark:text-slate-400'
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
                : 'bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-800 dark:text-slate-200 border border-orange-100 dark:border-orange-900/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Calculator Suite</div>
                <div className={`text-[10px] ${currentView === 'calc' ? 'text-orange-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Scientific, Mortgage, BMI, Math & Units
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-700 dark:text-orange-300">
              22
            </span>
          </button>

          {/* Dedicated Mobile Theme Toggle Row */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl text-left bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Appearance: {isDark ? 'Dark Mode' : 'Light Mode'}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tap to switch to {isDark ? 'light' : 'dark'} mode
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-2xs">
                {isDark ? '☀️ Light' : '🌙 Dark'}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
