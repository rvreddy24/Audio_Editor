import React from 'react';
import { Heart } from 'lucide-react';
import { PdfToolKey } from './types';

interface ILovePdfFooterProps {
  onSelectTool: (tool: PdfToolKey | 'audio') => void;
}

export const ILovePdfFooter: React.FC<ILovePdfFooterProps> = ({ onSelectTool }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-14 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Popular PDF Tools */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Popular Tools
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => onSelectTool('merge')}
                  className="hover:text-white transition-colors"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('split')}
                  className="hover:text-white transition-colors"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('compress')}
                  className="hover:text-white transition-colors"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('organize')}
                  className="hover:text-white transition-colors"
                >
                  Organize PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('audio')}
                  className="hover:text-white text-violet-400 font-semibold transition-colors"
                >
                  Audio Studio (New)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Convert */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Convert PDF
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-jpg')}
                  className="hover:text-white transition-colors"
                >
                  PDF to JPG
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('jpg-to-pdf')}
                  className="hover:text-white transition-colors"
                >
                  JPG to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('rotate')}
                  className="hover:text-white transition-colors"
                >
                  Rotate PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('page-numbers')}
                  className="hover:text-white transition-colors"
                >
                  Page Numbers
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Security */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Security & Sign
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => onSelectTool('sign')}
                  className="hover:text-white transition-colors"
                >
                  Sign PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('watermark')}
                  className="hover:text-white transition-colors"
                >
                  Watermark PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('protect')}
                  className="hover:text-white transition-colors"
                >
                  Protect PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('unlock')}
                  className="hover:text-white transition-colors"
                >
                  Unlock PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: About */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="font-extrabold text-lg text-white">i</span>
              <Heart className="w-5 h-5 text-[#e5322d] fill-[#e5322d]" />
              <span className="font-extrabold text-lg text-white">PDF</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              The complete all-in-one web suite for PDFs and media. 100% free, private, and secure in your browser.
            </p>
            <div className="text-[11px] text-slate-500">
              Hosted on rajvarshith.com
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>© {new Date().getFullYear()} rajvarshith.com - All Rights Reserved.</div>
          <div className="flex items-center gap-6 text-slate-400">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
            <span>Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
