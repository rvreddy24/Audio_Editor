import React from 'react';
import {
  FileText,
  Music,
  ArrowRight,
  Sparkles,
  Layers,
  Scissors,
  Minimize2,
  Image,
  Sliders,
  RefreshCw,
  Film,
  Lock,
  PenTool,
} from 'lucide-react';
import { PdfToolKey } from '../pdf/types';

interface HomeHubProps {
  onOpenPdf: (specificTool?: PdfToolKey) => void;
  onOpenAudio: (tab?: string) => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({ onOpenPdf, onOpenAudio }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Official Brand Banner */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative group overflow-hidden rounded-2xl bg-black border border-slate-800/80 shadow-md hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 max-w-lg w-full">
          <img
            src="/rv-banner.jpg"
            alt="rajvarshith.com Official Studio Banner"
            className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-semibold mb-3 shadow-2xs">
          <img src="/rv-logo.png" alt="logo" className="w-3.5 h-3.5 object-contain" />
          <span>Professional Web Workstation Suite</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Everything You Need to Edit <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-indigo-600">
            PDFs, Office & Audio Files
          </span>
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
          Choose a workstation below. Fast, secure, and 100% free right in your browser.
        </p>
      </div>

      {/* Primary Category Master Cards (Compact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {/* CARD 1: PDF & OFFICE TOOLS */}
        <div
          onClick={() => onOpenPdf()}
          className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-red-500 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-red-100/50 blur-2xl group-hover:bg-red-200/50 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-tight">
                    PDF & Office Studio
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-500">
                    PDF, Word, Excel, PowerPoint & Images
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                32+ Tools
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mb-3">
              Merge, split, compress, convert Word/Excel/PPT, OCR scan, watermark, resize images, protect, and e-sign files.
            </p>

            {/* Compact feature chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Merge & Split',
                'Compress PDF',
                'Word ⇄ PDF',
                'Excel ⇄ PDF',
                'PPT ⇄ PDF',
                'Image Tools',
                'Sign & Protect',
              ].map((toolName) => (
                <span
                  key={toolName}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium group-hover:bg-red-50 group-hover:text-red-700 transition-colors"
                >
                  {toolName}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-bold border border-red-100">
                +25 More
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-red-600 flex items-center gap-1.5">
              <span>Open PDF Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-[11px] text-slate-400 font-medium">100% Free • In-Browser</span>
          </div>
        </div>

        {/* CARD 2: AUDIO STUDIO */}
        <div
          onClick={() => onOpenAudio()}
          className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-600 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-indigo-100/50 blur-2xl group-hover:bg-indigo-200/50 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                    Audio Studio
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Visual Editor & DSP Sound Processing
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                FFmpeg 8.1
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mb-3">
              Visual waveform trimmer, universal format converter, video audio extractor, 8D audio & pitch DSP, and ID3 tag editor.
            </p>

            {/* Compact feature chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Waveform Trimmer',
                'Universal Converter',
                'Video to Audio',
                'Pitch & Speed DSP',
                '8D Audio Effect',
                'ID3 Tag Editor',
              ].map((toolName) => (
                <span
                  key={toolName}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors"
                >
                  {toolName}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-100">
                +More
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-indigo-600 flex items-center gap-1.5">
              <span>Launch Audio Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Native Speed • 1 GB Limit</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Row */}
      <div className="border-t border-slate-200/80 pt-10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 text-center">
          Quick Launch Tools
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            onClick={() => onOpenPdf('merge')}
            className="bg-white hover:bg-red-50/50 p-4 rounded-2xl border border-slate-200 hover:border-red-300 flex flex-col items-center gap-2 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-red-600">Merge PDF</span>
          </button>

          <button
            onClick={() => onOpenPdf('compress')}
            className="bg-white hover:bg-emerald-50/50 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 flex flex-col items-center gap-2 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Minimize2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">Compress PDF</span>
          </button>

          <button
            onClick={() => onOpenPdf('pdf-to-jpg')}
            className="bg-white hover:bg-yellow-50/50 p-4 rounded-2xl border border-slate-200 hover:border-yellow-300 flex flex-col items-center gap-2 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-yellow-600">PDF to JPG</span>
          </button>

          <button
            onClick={() => onOpenAudio('trim')}
            className="bg-white hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 flex flex-col items-center gap-2 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Trim Audio</span>
          </button>

          <button
            onClick={() => onOpenAudio('convert')}
            className="bg-white hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 flex flex-col items-center gap-2 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Audio Converter</span>
          </button>

          <button
            onClick={() => onOpenAudio('video')}
            className="bg-white hover:bg-violet-50/50 p-4 rounded-2xl border border-slate-200 hover:border-violet-300 flex flex-col items-center gap-2 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-violet-600">Video to Audio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
