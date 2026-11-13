import React from 'react';
import {
  FileText,
  Music,
  ArrowRight,
  Sparkles,
  Layers,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  Sliders,
  RefreshCw,
  Film,
  Lock,
  PenTool,
  Calculator,
  DollarSign,
  Scale,
  Camera,
  UserCheck,
} from 'lucide-react';
import { PdfToolKey } from '../pdf/types';
import { CalculatorKey } from '../calculator/types';
import { ImageToolKey } from '../image/types';

interface HomeHubProps {
  onOpenPdf: (specificTool?: PdfToolKey) => void;
  onOpenAudio: (tab?: string) => void;
  onOpenCalc: (specificTool?: CalculatorKey) => void;
  onOpenImage?: (specificTool?: ImageToolKey) => void;
  onOpenVideo?: () => void;
  onOpenMedia?: () => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  onOpenPdf,
  onOpenAudio,
  onOpenCalc,
  onOpenImage,
  onOpenVideo,
  onOpenMedia,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Official Brand Banner (Transparent PNG) */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="max-w-md sm:max-w-lg w-full flex items-center justify-center">
          <img
            src="/rv-banner.png"
            alt="rajvarshith.com Official Studio Banner"
            className="w-full h-auto max-h-28 sm:max-h-36 object-contain hover:scale-[1.01] transition-transform duration-300 dark:hidden"
          />
          <img
            src="/rv-banner-dark.png"
            alt="rajvarshith.com Official Studio Banner"
            className="w-full h-auto max-h-28 sm:max-h-36 object-contain hover:scale-[1.01] transition-transform duration-300 hidden dark:block"
          />
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/80 text-orange-800 dark:text-orange-300 text-xs font-semibold mb-3 shadow-2xs">
          <img src="/rv-logo.png" alt="logo" className="w-3.5 h-3.5 object-contain dark:hidden" />
          <img src="/rv-logo-dark.png" alt="logo" className="w-3.5 h-3.5 object-contain hidden dark:block" />
          <span>Professional Web Workstation Suite</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Everything You Need to Edit, Convert & Compute <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-indigo-600 dark:from-red-400 dark:via-rose-300 dark:to-indigo-400">
            PDFs, Video, Images, Audio & Calculators
          </span>
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
          Choose a workstation below. Fast, secure, and 100% free right inside your browser.
        </p>
      </div>

      {/* Primary Category Master Cards (4-Workstation Layout: PDF, Image, Audio & Video, Calculators) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
        {/* CARD 1: PDF & OFFICE TOOLS */}
        <div
          onClick={() => onOpenPdf()}
          className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 p-5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-red-100/50 dark:bg-red-950/30 blur-2xl group-hover:bg-red-200/50 dark:group-hover:bg-red-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                    PDF & Office
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-2 py-0.5 rounded-full shrink-0">
                25+ Tools
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Merge, split, compress, protect, watermark, and convert Word/Excel/HTML to PDF with OCR.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Merge', 'Compress', 'Word⇄PDF', 'OCR', 'Sign'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 group-hover:text-red-700">
            <span>Open PDF Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 2: IMAGE STUDIO */}
        <div
          onClick={() => onOpenImage && onOpenImage()}
          className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-emerald-100/50 dark:bg-emerald-950/30 blur-2xl group-hover:bg-emerald-200/50 dark:group-hover:bg-emerald-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                    Image Studio
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                22 Tools
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Target KB compression, remove background, transparent PNG maker, passport photos, photo & sign merge, crop & censor.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Remove BG', 'PNG Maker', 'Exact KB', 'Passport', 'Merge Sign', 'Crop & Circle', 'Censor'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700">
            <span>Open Image Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 3: AUDIO & VIDEO STUDIO */}
        <div
          onClick={() => (onOpenMedia ? onOpenMedia() : onOpenVideo ? onOpenVideo() : onOpenAudio())}
          className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 p-5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-purple-100/50 dark:bg-purple-950/30 blur-2xl group-hover:bg-purple-200/50 dark:group-hover:bg-purple-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                    Audio & Video
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 px-2 py-0.5 rounded-full shrink-0">
                Media Suite
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              All-in-one multimedia suite: edit video timelines, make 9:16 Shorts, cut audio waveforms, convert formats & apply studio audio effects.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Video Editor', '9:16 Shorts', 'Waveform', '320k MP3', 'GIF'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:text-purple-700">
            <span>Open Audio & Video Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 4: CALCULATOR STUDIO */}
        <div
          onClick={() => onOpenCalc()}
          className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-orange-100/50 dark:bg-orange-950/30 blur-2xl group-hover:bg-orange-200/50 dark:group-hover:bg-orange-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-tight">
                    Calculators
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/80 px-2 py-0.5 rounded-full shrink-0">
                22+ Tools
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Scientific LCD calculator, mortgage & loan EMI, compound interest, BMI, and universal unit converter.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Scientific', 'Mortgage', 'BMI', 'Interest', 'Units'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:text-orange-700">
            <span>Open Calculators</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Launch Row */}
      <div className="border-t border-slate-200/80 dark:border-slate-800 pt-10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6 text-center">
          Quick Launch Tools
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          <button
            onClick={() => onOpenPdf('merge')}
            className="bg-white dark:bg-slate-900 hover:bg-red-50/50 dark:hover:bg-red-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400">Merge PDF</span>
          </button>

          <button
            onClick={() => onOpenImage ? onOpenImage('compress-kb') : undefined}
            className="bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Minimize2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Compress KB</span>
          </button>

          <button
            onClick={() => onOpenImage ? onOpenImage('passport-photo') : undefined}
            className="bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">Passport Photo</span>
          </button>

          <button
            onClick={() => onOpenImage ? onOpenImage('signature-resizer') : undefined}
            className="bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PenTool className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">Sign Resizer</span>
          </button>

          <button
            onClick={() => onOpenMedia ? onOpenMedia() : onOpenVideo ? onOpenVideo() : onOpenAudio()}
            className="bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">Audio & Video</span>
          </button>

          <button
            onClick={() => onOpenCalc('scientific')}
            className="bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-orange-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">Scientific</span>
          </button>

          <button
            onClick={() => onOpenCalc('mortgage')}
            className="bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Mortgage</span>
          </button>

          <button
            onClick={() => onOpenCalc('bmi')}
            className="bg-white dark:bg-slate-900 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 flex flex-col items-center gap-1.5 text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400">BMI Calc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
