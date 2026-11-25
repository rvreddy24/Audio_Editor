import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  FileText,
  Camera,
  Film,
  Calculator,
  Cpu,
  Mail,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const EditorialContent: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Are my files and documents uploaded to any server or stored in the cloud?',
      a: 'No. At rajvarshith.com, privacy is our foundational architecture. All PDF merging, image compression, photo editing, and audio processing execute 100% locally inside your web browser using modern WebAssembly (Wasm) and HTML5 client APIs. Your files never leave your device, are never transmitted over external networks, and are never saved to any remote storage.',
    },
    {
      q: 'Is rajvarshith.com completely free to use?',
      a: 'Yes, 100% free with no hidden charges, trial periods, subscription fees, or daily usage caps. You can convert, edit, compress, and calculate as many documents and media files as you need without creating an account or providing credit card details.',
    },
    {
      q: 'How does the Target KB Image Compressor achieve exact file sizes?',
      a: 'Our Target KB tool uses an iterative binary-search compression algorithm directly in your browser canvas. It automatically balances JPEG quality factors and dimensional scaling to match exact file size targets (such as 20KB, 50KB, or 100KB) strictly required by government portals, competitive examination applications, and visa submission systems.',
    },
    {
      q: 'What audio and video formats are supported in the media studio?',
      a: 'The Audio & Video Studio supports a comprehensive variety of modern multimedia containers including MP3, WAV, AAC, M4A, FLAC, OGG, OPUS, MP4, MKV, WebM, MOV, and AVI. You can extract audio from video, trim waveforms with millisecond precision, convert formats, and export at pristine 320 kbps high bitrates.',
    },
    {
      q: 'Can I use rajvarshith.com on mobile phones and tablets?',
      a: 'Yes! The entire workstation suite is engineered with responsive, touch-friendly layouts optimized for iOS, Android, tablets, laptops, and desktop computers. No app installation or third-party plugins are required—everything runs right inside your favorite mobile or desktop browser.',
    },
    {
      q: 'Are the financial and health calculations accurate?',
      a: 'All calculators on rajvarshith.com are developed according to industry-standard mathematical and actuarial formulas. Mortgage and loan tools calculate principal, interest, property taxes, and amortization schedules matching banking specifications. Health calculators utilize validated formulas including the Mifflin-St Jeor equation and standard BMI brackets.',
    },
    {
      q: 'Will my converted PDFs or edited photos have watermarks added?',
      a: 'No. None of our tools will ever add unwanted watermarks, promotional logos, or brand tags to your output files. You retain 100% ownership and clean, professional output on every single document or image you process.',
    },
    {
      q: 'How can I report a bug or request a new tool?',
      a: 'We welcome feedback, tool requests, and bug reports from our global community. You can reach out directly to our engineering team at rajvarshithreddy@gmail.com or through our contact form. We continuously deploy improvements and new utilities based on user suggestions.',
    },
  ];

  return (
    <section className="mt-14 sm:mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 space-y-12 sm:space-y-16">
      {/* 1. WHY PROFESSIONALS CHOOSE RAJVARSHITH.COM (With Same Hover Animation & Corner Glow) */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/80 text-orange-700 dark:text-orange-300 text-xs font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5 text-orange-500" />
            <span>Modern Browser Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Why Professionals Choose rajvarshith.com
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            A privacy-first workstation combining desktop-grade performance with seamless web accessibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Privacy (Emerald) */}
          <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden">
            {/* Corner Radial Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-emerald-100/50 dark:bg-emerald-950/30 blur-2xl group-hover:bg-emerald-200/50 dark:group-hover:bg-emerald-900/40 transition-colors pointer-events-none" />

            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight mb-2">
                100% Client-Side Privacy
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Your sensitive PDFs, contracts, and images never upload to external servers. Computation happens strictly inside your device’s sandbox via WebAssembly and HTML5 client APIs.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Zero Server Storage</span>
            </div>
          </div>

          {/* Card 2: Speed (Orange) */}
          <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden">
            {/* Corner Radial Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-orange-100/50 dark:bg-orange-950/30 blur-2xl group-hover:bg-orange-200/50 dark:group-hover:bg-orange-900/40 transition-colors pointer-events-none" />

            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-tight mb-2">
                Instant Processing Speed
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Bypasses sluggish cloud upload and download queues. Our utilities leverage multi-core local hardware acceleration to compress, slice waveforms, and convert in milliseconds.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-orange-600 dark:text-orange-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Hardware Accelerated</span>
            </div>
          </div>

          {/* Card 3: Free & Open (Indigo) */}
          <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden">
            {/* Corner Radial Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-indigo-100/50 dark:bg-indigo-950/30 blur-2xl group-hover:bg-indigo-200/50 dark:group-hover:bg-indigo-900/40 transition-colors pointer-events-none" />

            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mb-4">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight mb-2">
                Completely Free & Open
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                No sign-ups, no monthly subscriptions, and no paywalls. Every utility—from OCR text extraction to passport photo formatting and amortization tables—is free for everyone.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No Account Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUITE CAPABILITIES GRID (Informational Cards with Mouse Arrow Cursor) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* PDF Suite Card */}
        <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-red-100/50 dark:bg-red-950/30 blur-2xl group-hover:bg-red-200/50 dark:group-hover:bg-red-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                  PDF & Office Capabilities
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-2 py-0.5 rounded-full shrink-0">
                25+ Tools
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Merge reports, split multi-page files, compress PDF size with lossless clarity, convert Word/Excel/PowerPoint documents, and extract text with OCR.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Merge', 'Split', 'Lossless Compress', 'Word⇄PDF', 'OCR Scan', 'AES Protect'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-red-600 dark:text-red-400">
            <span>Client-side PDF Engine</span>
          </div>
        </div>

        {/* Image Studio Card */}
        <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-emerald-100/50 dark:bg-emerald-950/30 blur-2xl group-hover:bg-emerald-200/50 dark:group-hover:bg-emerald-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                  Image & Document Prep
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                22 Tools
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Compress images to exact KB sizes (20KB, 50KB) for exam portals, create biometric passport photos, remove backgrounds, and join photos with signatures.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Exact Target KB', 'Passport Photo', 'Remove BG', 'Photo+Sign Merge', 'PNG Maker', 'Censor'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Client-side Graphic Tools</span>
          </div>
        </div>

        {/* Audio & Video Card */}
        <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-indigo-100/50 dark:bg-indigo-950/30 blur-2xl group-hover:bg-indigo-200/50 dark:group-hover:bg-indigo-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                  Audio & Video Production
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 px-2 py-0.5 rounded-full shrink-0">
                Media Suite
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Scrub audio waveforms with visual precision, export at 320 kbps high bitrates, extract audio from videos, trim clips, and reframe for vertical 9:16 Shorts.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Waveform Cutter', '320k MP3', 'Extract Audio', 'Video Trimmer', '9:16 Shorts', 'EQ Effects'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>High-Bitrate DSP Engine</span>
          </div>
        </div>

        {/* Calculators Card */}
        <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-orange-100/50 dark:bg-orange-950/30 blur-2xl group-hover:bg-orange-200/50 dark:group-hover:bg-orange-900/40 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-tight">
                  Financial & Scientific Calculators
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/80 px-2 py-0.5 rounded-full shrink-0">
                22+ Tools
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Mortgage breakdown with full year-by-year amortization schedules, compound interest wealth simulator, auto loan EMIs, BMI metrics, and dual-line scientific math.
            </p>

            <div className="flex flex-wrap gap-1 mb-4">
              {['Mortgage Breakdown', 'Amortization', 'Compound Wealth', 'BMI & Calorie', 'Auto Loan', 'Scientific LCD'].map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-orange-600 dark:text-orange-400">
            <span>Actuarial Calculation Engines</span>
          </div>
        </div>
      </div>

      {/* 3. FREQUENTLY ASKED QUESTIONS (Compact & Interactive) */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Clear answers to platform features, privacy, and file security.</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-orange-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ABOUT & OFFICIAL CONTACT CARD */}
      <div className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 overflow-hidden shadow-md hover:border-orange-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-orange-500/10 blur-3xl group-hover:bg-orange-500/20 transition-colors pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-orange-400 text-[11px] font-semibold">
              <Info className="w-3 h-3" />
              <span>About rajvarshith.com</span>
            </div>
            <h4 className="text-lg font-bold text-white">Ethical Engineering Dedicated to User Privacy</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Developed by independent engineer <strong>Raj Varshith</strong> to eliminate predatory subscriptions, paywalls, and privacy risks. All tools execute locally in your browser memory via WebAssembly and HTML5 APIs.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <a
              href="mailto:rajvarshithreddy@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Engineering Support</span>
            </a>
            <div className="text-xs text-slate-300">
              <span className="text-slate-400">Official Inquiries: </span>
              <a href="mailto:rajvarshithreddy@gmail.com" className="text-orange-400 hover:underline font-mono font-semibold">
                rajvarshithreddy@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
