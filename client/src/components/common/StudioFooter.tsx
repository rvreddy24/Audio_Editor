import React, { useState } from 'react';
import { PdfToolKey } from '../pdf/types';
import { CalculatorKey } from '../calculator/types';
import { ImageToolKey } from '../image/types';
import { X } from 'lucide-react';

interface StudioFooterProps {
  onSelectPdfTool: (tool: PdfToolKey) => void;
  onOpenAudio: () => void;
  onOpenCalc?: (tool?: CalculatorKey) => void;
  onOpenImage?: (tool?: ImageToolKey) => void;
  onOpenVideo?: () => void;
  onOpenMedia?: () => void;
  onNavigateHome?: () => void;
}

export const StudioFooter: React.FC<StudioFooterProps> = ({
  onSelectPdfTool,
  onOpenAudio,
  onOpenCalc,
  onOpenImage,
  onOpenVideo,
  onOpenMedia,
  onNavigateHome,
}) => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
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
              Image Studio (22 Tools)
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onOpenImage?.('remove-bg')} className="hover:text-white transition-colors">
                  Remove Background (Magic Cutout)
                </button>
              </li>
              <li>
                <button onClick={() => onOpenImage?.('png-maker')} className="hover:text-white transition-colors">
                  Transparent PNG Maker
                </button>
              </li>
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
              Audio & Video Studio
            </h4>

            {/* Video Subheading - Text Only */}
            <div className="text-white font-semibold text-xs mb-2">
              Video Editor & Shorts
            </div>
            <ul className="space-y-2 mb-4">
              <li>
                <button onClick={onOpenVideo} className="hover:text-white transition-colors">
                  Trim & Cut Video
                </button>
              </li>
              <li>
                <button onClick={onOpenVideo} className="hover:text-white transition-colors">
                  9:16 Shorts / Reels Crop
                </button>
              </li>
              <li>
                <button onClick={onOpenVideo} className="hover:text-white transition-colors">
                  Video to Animated GIF
                </button>
              </li>
            </ul>

            {/* Audio Subheading - Text Only */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-white font-semibold text-xs mb-2">
                Audio Editor & Tools
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                    Waveform Trimmer
                  </button>
                </li>
                <li>
                  <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                    Audio Format Converter
                  </button>
                </li>
                <li>
                  <button onClick={onOpenAudio} className="hover:text-white transition-colors">
                    Extract Video Audio
                  </button>
                </li>
              </ul>
            </div>
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
              <button
                type="button"
                onClick={onNavigateHome}
                className="bg-white rounded-xl p-2 inline-block shadow-xs hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
              >
                <img
                  src="/rv-banner.png"
                  alt="rajvarshith.com"
                  className="h-8 w-auto object-contain"
                />
              </button>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              A private, fast, and 100% free web workstation suite for PDF manipulation, client image processing, professional audio editing, and comprehensive calculators.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Running live on cloud container
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-5 h-5 bg-white rounded-md p-0.5 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer focus:outline-none"
            >
              <img src="/rv-logo.png" alt="logo" className="w-full h-full object-contain" />
            </button>
            <span>© {new Date().getFullYear()} rajvarshith.com. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span>Client-side Private Processing</span>
            <span>No Permanent File Storage</span>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Legal Modal (Privacy Policy & Terms of Service for Google AdSense compliance) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
              {activeModal === 'privacy' ? (
                <>
                  <p className="text-slate-400">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <h4 className="text-white font-semibold text-sm">1. Commitment to Privacy</h4>
                  <p>
                    At <strong className="text-white">rajvarshith.com</strong>, we are committed to user privacy. The majority of our PDF, image, audio, video, and calculation tools execute 100% locally in your web browser using modern WebAssembly and client-side JavaScript APIs.
                  </p>

                  <h4 className="text-white font-semibold text-sm">2. Server File Handling</h4>
                  <p>
                    For complex media operations (such as high-definition video conversions or advanced audio processing), files are temporarily processed via an isolated, encrypted server container. Files are never viewed by humans, never sold, and are automatically deleted immediately after completion or within 2 hours maximum.
                  </p>

                  <h4 className="text-white font-semibold text-sm">3. Advertising Partners & Cookies (Google AdSense)</h4>
                  <p>
                    We use third-party advertising companies, including Google AdSense, to serve ads when you visit our website. Google uses cookies (including the DoubleClick cookie) to serve ads based on prior visits to our website or other sites on the Internet.
                  </p>
                  <p>
                    You may opt out of personalized advertising by visiting{' '}
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline"
                    >
                      Google Ads Settings
                    </a>{' '}
                    or via{' '}
                    <a
                      href="https://www.aboutads.info/choices/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline"
                    >
                      aboutads.info
                    </a>.
                  </p>

                  <h4 className="text-white font-semibold text-sm">4. Contact Information</h4>
                  <p>
                    If you have questions regarding this privacy policy or our data practices, contact us at{' '}
                    <span className="text-indigo-400 font-mono">rajvarshithreddy@gmail.com</span>.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-slate-400">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <h4 className="text-white font-semibold text-sm">1. Terms of Use</h4>
                  <p>
                    By accessing and using <strong className="text-white">rajvarshith.com</strong>, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
                  </p>

                  <h4 className="text-white font-semibold text-sm">2. Permitted Use</h4>
                  <p>
                    You may use our platform for personal, professional, and commercial file manipulation and calculations. You agree not to upload malicious software, viruses, or content that violates intellectual property or applicable laws.
                  </p>

                  <h4 className="text-white font-semibold text-sm">3. Disclaimer of Warranties</h4>
                  <p>
                    All services, calculations, and conversions are provided &quot;as is&quot; without warranties of any kind. While we strive for maximum accuracy, always verify critical financial and tax calculations independently.
                  </p>

                  <h4 className="text-white font-semibold text-sm">4. Limitation of Liability</h4>
                  <p>
                    In no event shall <strong className="text-white">rajvarshith.com</strong> or its operators be liable for any damages arising out of the use or inability to use the tools or loss of data.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
