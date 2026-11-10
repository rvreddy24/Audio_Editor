import React, { useState } from 'react';
import {
  Heart,
  ChevronDown,
  Music,
  Menu,
  X,
  Grid,
  Sparkles,
} from 'lucide-react';
import { PdfToolKey } from './types';

interface ILovePdfNavbarProps {
  activeTool: PdfToolKey | 'audio';
  onSelectTool: (tool: PdfToolKey | 'audio') => void;
  onOpenAudioStudio: () => void;
}

export const ILovePdfNavbar: React.FC<ILovePdfNavbarProps> = ({
  activeTool,
  onSelectTool,
  onOpenAudioStudio,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onSelectTool('home')}
              className="flex items-center gap-1.5 group cursor-pointer focus:outline-none"
            >
              <span className="font-extrabold text-2xl tracking-tighter text-slate-900 group-hover:text-red-600 transition-colors">
                i
              </span>
              <Heart className="w-6 h-6 text-[#e5322d] fill-[#e5322d] group-hover:scale-110 transition-transform duration-200" />
              <span className="font-extrabold text-2xl tracking-tighter text-slate-900 group-hover:text-red-600 transition-colors">
                PDF
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-[13px] font-bold text-slate-700 tracking-wide uppercase">
              <button
                onClick={() => onSelectTool('merge')}
                className={`px-3 py-2 rounded-lg transition-colors hover:text-[#e5322d] ${
                  activeTool === 'merge' ? 'text-[#e5322d] bg-red-50' : ''
                }`}
              >
                Merge PDF
              </button>

              <button
                onClick={() => onSelectTool('split')}
                className={`px-3 py-2 rounded-lg transition-colors hover:text-[#e5322d] ${
                  activeTool === 'split' ? 'text-[#e5322d] bg-red-50' : ''
                }`}
              >
                Split PDF
              </button>

              <button
                onClick={() => onSelectTool('compress')}
                className={`px-3 py-2 rounded-lg transition-colors hover:text-[#e5322d] ${
                  activeTool === 'compress' ? 'text-[#e5322d] bg-red-50' : ''
                }`}
              >
                Compress PDF
              </button>

              {/* Convert PDF Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsConvertOpen(!isConvertOpen);
                    setIsAllToolsOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg flex items-center gap-1 hover:text-[#e5322d] transition-colors"
                >
                  <span>Convert PDF</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isConvertOpen && (
                  <div
                    className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setIsConvertOpen(false)}
                  >
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Convert to / from PDF
                    </div>
                    <button
                      onClick={() => {
                        onSelectTool('pdf-to-jpg');
                        setIsConvertOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#e5322d] flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      PDF to JPG
                    </button>
                    <button
                      onClick={() => {
                        onSelectTool('jpg-to-pdf');
                        setIsConvertOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#e5322d] flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      JPG to PDF
                    </button>
                  </div>
                )}
              </div>

              {/* All PDF Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsAllToolsOpen(!isAllToolsOpen);
                    setIsConvertOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg flex items-center gap-1 hover:text-[#e5322d] transition-colors"
                >
                  <Grid className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
                  <span>All PDF Tools</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isAllToolsOpen && (
                  <div
                    className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 grid grid-cols-1 gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setIsAllToolsOpen(false)}
                  >
                    <button
                      onClick={() => {
                        onSelectTool('organize');
                        setIsAllToolsOpen(false);
                      }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      Organize PDF
                    </button>
                    <button
                      onClick={() => {
                        onSelectTool('rotate');
                        setIsAllToolsOpen(false);
                      }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      Rotate PDF
                    </button>
                    <button
                      onClick={() => {
                        onSelectTool('watermark');
                        setIsAllToolsOpen(false);
                      }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Watermark PDF
                    </button>
                    <button
                      onClick={() => {
                        onSelectTool('page-numbers');
                        setIsAllToolsOpen(false);
                      }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Page numbers
                    </button>
                    <button
                      onClick={() => {
                        onSelectTool('protect');
                        setIsAllToolsOpen(false);
                      }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      Protect PDF
                    </button>
                    <button
                      onClick={() => {
                        onSelectTool('unlock');
                        setIsAllToolsOpen(false);
                      }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-pink-600" />
                      Unlock PDF
                    </button>
                    <button
                      onClick={() => {
                        onSelectTool('sign');
                        setIsAllToolsOpen(false);
                      }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                      Sign PDF
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Audio Studio Switcher */}
            <button
              onClick={onOpenAudioStudio}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTool === 'audio'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 hover:shadow-xs'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-violet-600" />
              <span>Audio Studio</span>
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            </button>

            {/* All Tools home shortcut */}
            {activeTool !== 'home' && (
              <button
                onClick={() => onSelectTool('home')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>All Tools</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2">
            Main PDF Tools
          </div>
          <button
            onClick={() => {
              onSelectTool('merge');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            Merge PDF
          </button>
          <button
            onClick={() => {
              onSelectTool('split');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            Split PDF
          </button>
          <button
            onClick={() => {
              onSelectTool('compress');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            Compress PDF
          </button>
          <button
            onClick={() => {
              onSelectTool('pdf-to-jpg');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            PDF to JPG
          </button>
          <button
            onClick={() => {
              onSelectTool('jpg-to-pdf');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            JPG to PDF
          </button>
          <button
            onClick={() => {
              onSelectTool('organize');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            Organize PDF
          </button>
          <button
            onClick={() => {
              onSelectTool('watermark');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            Watermark
          </button>
          <button
            onClick={() => {
              onSelectTool('page-numbers');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            Page numbers
          </button>
          <button
            onClick={() => {
              onSelectTool('sign');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-[#e5322d]"
          >
            Sign PDF
          </button>
          <button
            onClick={() => {
              onOpenAudioStudio();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Switch to Audio Studio
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </button>
        </div>
      )}
    </header>
  );
};
