import React from 'react';
import {
  FileText,
  Music,
  LayoutGrid,
  Calculator,
  ChevronRight,
} from 'lucide-react';

interface StudioNavbarProps {
  currentView: 'home' | 'pdf' | 'audio' | 'calc';
  activePdfToolTitle?: string;
  activeCalcTitle?: string;
  onNavigateHome: () => void;
  onNavigatePdf: () => void;
  onNavigateAudio: () => void;
  onNavigateCalc: () => void;
}

export const StudioNavbar: React.FC<StudioNavbarProps> = ({
  currentView,
  activePdfToolTitle,
  activeCalcTitle,
  onNavigateHome,
  onNavigatePdf,
  onNavigateAudio,
  onNavigateCalc,
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
                      : currentView === 'audio'
                      ? onNavigateAudio
                      : onNavigateCalc
                  }
                  className="font-semibold text-slate-700 hover:text-orange-600 transition-colors"
                >
                  {currentView === 'pdf'
                    ? 'PDF Tools'
                    : currentView === 'audio'
                    ? 'Audio Studio'
                    : 'Calculator Studio'}
                </button>
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
              </div>
            )}
          </div>

          {/* Navigation Switchers */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'pdf'
                  ? 'bg-red-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-red-600 hover:bg-red-50/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>PDF Tools</span>
            </button>

            {/* Audio Studio button */}
            <button
              onClick={onNavigateAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'audio'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-indigo-500" />
              <span>Audio Studio</span>
            </button>

            {/* Calculator Studio button */}
            <button
              onClick={onNavigateCalc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
