import React from 'react';
import { PdfToolKey } from '../pdf/types';
import { CalculatorKey } from '../calculator/types';
import { ImageToolKey } from '../image/types';

interface StudioFooterProps {
  onSelectPdfTool: (tool: PdfToolKey) => void;
  onOpenAudio: () => void;
  onOpenCalc?: (tool?: CalculatorKey) => void;
  onOpenImage?: (tool?: ImageToolKey) => void;
  onOpenVideo?: () => void;
}

export const StudioFooter: React.FC<StudioFooterProps> = ({
  onSelectPdfTool,
  onOpenAudio,
  onOpenCalc,
  onOpenImage,
  onOpenVideo,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
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
                  onClick={() => onSelectPdfTool('pdf-to-word')}
                  className="hover:text-white transition-colors"
                >
                  PDF to Word (OCR)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPdfTool('word-to-pdf')}
                  className="hover:text-white transition-colors"
                >
                  Word to PDF
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
            </ul>
          </div>

          {/* Column 2: Image Studio */}
          <div>
            <h4 className="text-white font-bold text-xs mb-4 uppercase tracking-wider">
              Image Studio (20 Tools)
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onOpenImage?.('compress-kb')} className="hover:text-white transition-colors">
                  Exact KB Compression
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('passport-photo')} className="hover:text-white transition-colors">
                  Passport Photo & 4x6 Sheets
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('photo-signature-merge')} className="hover:text-white transition-colors">
                  Merge Photo & Signature
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('signature-resizer')} className="hover:text-white transition-colors">
                  Signature Resizer (≤ 20KB)
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('crop-shape')} className="hover:text-white transition-colors">
                  Crop & Circle Avatar Maker
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('blur-censor')} className="hover:text-white transition-colors">
                  Blur & Censor Private Info
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('image-splitter')} className="hover:text-white transition-colors">
                  Instagram Grid Splitter
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('color-picker')} className="hover:text-white transition-colors">
                  Eyedropper Color Picker
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Audio & Video Studio */}
          <div>
            <h4 className="text-white font-bold text-xs mb-4 uppercase tracking-wider">
              Media Studios
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenVideo} className="hover:text-white transition-colors text-rose-400 font-semibold">
                  Video Studio (Editor)
                </button>
              </li>
              <li>
                <button onClick={onOpenVideo} className="hover:text-white transition-colors">
                  Trim & Cut Video
                </button>
              </li>
              <li>
                <button onClick={onOpenVideo} className="hover:text-white transition-colors">
                  Video to Animated GIF
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Audio Waveform Trimmer
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Audio Format Converter
                </button>
              </li>
              <li>
                <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                  Video to Audio Extractor
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Calculator Studio */}
          <div>
            <h4 className="text-white font-bold text-xs mb-4 uppercase tracking-wider">
              Calculator Studio
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onOpenCalc?.('scientific')} className="hover:text-white transition-colors">
                  Scientific Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCalc?.('mortgage')} className="hover:text-white transition-colors">
                  Mortgage Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCalc?.('loan')} className="hover:text-white transition-colors">
                  Loan EMI Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCalc?.('compound-interest')} className="hover:text-white transition-colors">
                  Compound Interest
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCalc?.('bmi')} className="hover:text-white transition-colors">
                  BMI Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCalc?.('unit-converter')} className="hover:text-white transition-colors">
                  Universal Unit Converter
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Platform */}
          <div>
            <div className="mb-3">
              <div className="bg-white rounded-xl p-2 inline-block shadow-xs">
                <img
                  src="/rv-banner.png"
                  alt="rajvarshith.com"
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              A private, fast, and 100% free web workstation suite for PDF manipulation, client image processing, professional audio editing, and comprehensive calculators.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Running live on cloud container
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded-md p-0.5 flex items-center justify-center">
              <img src="/rv-logo.png" alt="logo" className="w-full h-full object-contain" />
            </div>
            <span>© {new Date().getFullYear()} rajvarshith.com. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Client-side Private Processing</span>
            <span>No File Logging</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
