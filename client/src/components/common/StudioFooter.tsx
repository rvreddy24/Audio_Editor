import React from 'react';
import { Sparkles } from 'lucide-react';
import { PdfToolKey } from '../pdf/types';

interface StudioFooterProps {
  onSelectPdfTool: (tool: PdfToolKey) => void;
  onOpenAudio: () => void;
}

export const StudioFooter: React.FC<StudioFooterProps> = ({
  onSelectPdfTool,
  onOpenAudio,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: PDF Tools */}
          <div>
            <h4 className="text-white font-bold text-xs mb-4 uppercase tracking-wider">
              PDF Utilities
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSelectPdfTool('merge')}
                  className="hover:text-white transition-colors"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('split')}
                  className="hover:text-white transition-colors"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('compress')}
                  className="hover:text-white transition-colors"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('organize')}
                  className="hover:text-white transition-colors"
                >
                  Organize Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('pdf-to-jpg')}
                  className="hover:text-white transition-colors"
                >
                  PDF to JPG
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('jpg-to-pdf')}
                  className="hover:text-white transition-colors"
                >
                  JPG to PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Security & Editing */}
          <div>
            <h4 className="text-white font-bold text-xs mb-4 uppercase tracking-wider">
              Security & Pages
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSelectPdfTool('rotate')}
                  className="hover:text-white transition-colors"
                >
                  Rotate PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('watermark')}
                  className="hover:text-white transition-colors"
                >
                  Watermark
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('page-numbers')}
                  className="hover:text-white transition-colors"
                >
                  Page Numbers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('sign')}
                  className="hover:text-white transition-colors"
                >
                  Sign PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('protect')}
                  className="hover:text-white transition-colors"
                >
                  Protect PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('unlock')}
                  className="hover:text-white transition-colors"
                >
                  Unlock PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Audio Studio */}
          <div>
            <h4 className="text-white font-bold text-xs mb-4 uppercase tracking-wider">
              Audio Studio
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Waveform Trimmer
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Format Converter (MP3, WAV, FLAC, AAC)
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Bitrate Scaler (32k - 320k kbps)
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Video Soundtrack Extractor
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  DSP Effects & 8D Audio
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Multi-Track Audio Merger
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                rajvarshith.com
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              A private, fast, and 100% free web workstation for audio and PDF processing. Powered by native Web Audio and FFmpeg engines.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Running live on cloud container
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© {new Date().getFullYear()} rajvarshith.com. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span>Client-side Private Processing</span>
            <span>No File Logging</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
