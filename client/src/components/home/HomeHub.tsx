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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Professional Web Workstation Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Everything You Need to Edit <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-indigo-600 to-violet-600">
            PDFs & Audio Files
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Choose a workstation below. Fast, secure, and 100% free right in your browser.
        </p>
      </div>

      {/* Primary Category Master Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* CARD 1: PDF TOOLS */}
        <div
          onClick={() => onOpenPdf()}
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-red-500 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-red-100/60 blur-3xl group-hover:bg-red-200/60 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200/80 px-3 py-1 rounded-full">
                32+ Tools Available
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-red-600 transition-colors">
              PDF & Office Studio
            </h2>

            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Complete document & image workstation. Merge, split, compress, Word, Excel, PowerPoint conversions, OCR text extraction, watermark, image editor, protect, and electronically sign files with zero software installation.
            </p>

            {/* Included tools badge list */}
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                'Merge PDF',
                'Split PDF',
                'Compress PDF',
                'Word to PDF',
                'PDF to Word',
                'Excel to PDF',
                'PDF to Excel (.xlsx)',
                'PPT to PDF',
                'PDF to PPTX',
                'Compress Image',
                'Resize Image',
                'Convert Image',
                'Watermark Image',
                'Sign PDF',
                'OCR Scan',
                'Protect & Unlock',
              ].map((toolName) => (
                <span
                  key={toolName}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold group-hover:bg-red-50 group-hover:text-red-700 transition-colors"
                >
                  {toolName}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-red-600 flex items-center gap-2">
              <span>Open PDF Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </span>
            <span className="text-xs text-slate-400 font-medium">100% Free • Private</span>
          </div>
        </div>

        {/* CARD 2: AUDIO STUDIO */}
        <div
          onClick={() => onOpenAudio()}
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-indigo-600 p-8 sm:p-10 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-indigo-100/60 blur-3xl group-hover:bg-indigo-200/60 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Music className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
                FFmpeg 8.1 Engine
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Audio Studio
            </h2>

            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Professional audio workstation. Convert between formats, customize kbps bitrates, extract audio from videos, trim with visual waveform editors, apply DSP audio effects, and edit ID3 tags.
            </p>

            {/* Included tools badge list */}
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                'Waveform Trimmer',
                'Universal Converter',
                '32k - 320k kbps',
                'Video to Audio',
                'Pitch & Speed DSP',
                '8D Audio Effect',
                'Loudness Normalizer',
                '3-Band EQ',
                'Vocal Remover',
                'Multi-Track Merger',
                'ID3 Tag Editor',
                'Mic Voice Recorder',
              ].map((toolName) => (
                <span
                  key={toolName}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors"
                >
                  {toolName}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-600 flex items-center gap-2">
              <span>Launch Audio Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </span>
            <span className="text-xs text-slate-400 font-medium">Native Speed • 1 GB Limit</span>
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
