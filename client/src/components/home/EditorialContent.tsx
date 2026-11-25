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
  EyeOff,
  Sparkles,
  Mail,
  Info,
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
      a: 'We welcome feedback, tool requests, and bug reports from our global community. You can reach out directly to our engineering team at support@rajvarshith.com or through our contact form. We continuously deploy improvements and new utilities based on user suggestions.',
    },
  ];

  return (
    <section className="mt-16 sm:mt-24 pt-12 border-t border-slate-200 dark:border-slate-800/80 space-y-16 sm:space-y-24">
      {/* 1. ARCHITECTURAL PILLARS (Why rajvarshith.com) */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Modern Browser Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Why Professionals Choose rajvarshith.com
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            A privacy-first workstation combining desktop-grade performance with seamless web accessibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 mb-5 shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                100% Client-Side Privacy
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your sensitive PDFs, confidential legal documents, biometric photographs, and audio recordings never upload to external servers. Computation happens strictly inside your device’s sandbox via WebAssembly and HTML5 APIs.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Zero server logging or storage</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/60 mb-5 shadow-2xs">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Instant Processing Speed
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                By bypassing sluggish upload and download queues to remote cloud servers, rajvarshith.com leverages multi-core local hardware acceleration. Heavy conversions, image resizes, and audio waveform slicing execute in milliseconds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Multi-threaded local processing</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 mb-5 shadow-2xs">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Completely Free & Open
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No sign-ups, no monthly subscriptions, and no paywalls. Every single tool—from OCR document text extraction to passport photo formatting and amortization schedules—is completely unrestricted and accessible to everyone worldwide.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>No account or payment required</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPREHENSIVE SUITE OVERVIEWS */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            An All-in-One Digital Workstation
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Explore 70+ high-precision utilities organized into four specialized production environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Suite 1: PDF */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">PDF & Office Suite</h3>
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">25+ Professional Document Tools</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              A comprehensive toolkit for organizing, securing, and transforming PDF documents. Combine multiple reports into a single file with our intuitive drag-and-drop merger, split extensive multi-page documents, optimize and reduce file size with lossless PDF compression, and convert Word, Excel, and PowerPoint files to PDF with high formatting fidelity.
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-red-500" /> Merge & Split Pages</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-red-500" /> Lossless PDF Compression</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-red-500" /> Word / Excel / PPT to PDF</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-red-500" /> OCR Text Extraction</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-red-500" /> Password Lock & AES Unlock</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-red-500" /> Digital Sign & Watermark</li>
            </ul>
          </div>

          {/* Suite 2: Image */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Image Studio & Document Prep</h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">22+ Graphic & Photo Utilities</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Engineered specifically for government exam applications, job portals, biometric documents, and graphic design tasks. Compress images to exact KB sizes (such as 20KB or 50KB) with zero guesswork, remove backgrounds automatically, create transparent PNGs from logos and signatures, crop to official passport dimensions, and merge applicant photos with signatures.
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Target KB Compressor</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Biometric Passport Photo Maker</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI Background Remover</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Photo & Signature Joiner</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Transparent PNG Maker</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Selective Blur & Censor</li>
            </ul>
          </div>

          {/* Suite 3: Audio & Video */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audio & Video Suite</h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Studio Quality Media Workstation</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              A comprehensive browser-based studio for podcasters, musicians, content creators, and video editors. Inspect audio waveforms with millisecond visual scrubbing, cut ringtones, normalize loudness, convert between lossless FLAC and compressed MP3/AAC, extract high-bitrate audio from video files, and trim video clips for 9:16 vertical social formats.
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Precision Waveform Audio Cutter</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> 320 kbps High-Bitrate Export</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Audio Extractor from Video</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> MP4/MKV/WebM Video Trimmer</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> 9:16 Shorts & Reels Formatter</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Studio Fade, Gain & EQ Effects</li>
            </ul>
          </div>

          {/* Suite 4: Calculators */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Financial, Health & Math Suite</h3>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">22+ Scientific & Actuarial Engines</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Instant, verified calculators for real-world decision making. Plan your home purchase with our full mortgage breakdown and year-by-year amortization schedules, model long-term compound interest with monthly contributions, estimate auto loan EMIs, track body mass index (BMI) and daily caloric targets, and compute complex scientific equations with dual-line display.
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /> Mortgage & Amortization Tables</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /> Compound Interest & Wealth Growth</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /> Loan EMI & Auto Loan Estimator</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /> BMI & Caloric Maintenance (BMR)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /> Scientific Dual-Line LCD Calculator</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /> Age & Date Duration Calculators</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold mb-3 border border-slate-200 dark:border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
            <span>Answers & Support</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Clear information about our platform, privacy guarantees, file handling, and technical architecture.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-orange-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ABOUT & ETHICAL STATEMENT */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-orange-400 text-xs font-semibold">
            <Info className="w-3.5 h-3.5" />
            <span>About rajvarshith.com</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Ethical Engineering Dedicated to User Privacy
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Founded by independent developer and engineer <strong>Raj Varshith</strong>, this platform was created to address a critical flaw in modern productivity software: invasive subscriptions, forced sign-ups, and the chronic security risk of uploading sensitive personal documents to third-party cloud servers.
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            By combining modern web standards including WebAssembly, Web Audio API, and HTML5 Canvas, <strong>rajvarshith.com</strong> proves that advanced document preparation, image editing, multimedia mastering, and financial analysis can occur securely, privately, and completely free on the client side.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs">
            <a
              href="mailto:support@rajvarshith.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Engineering Support</span>
            </a>
            <span className="text-slate-400">Official inquiries: contact@rajvarshith.com</span>
          </div>
        </div>
      </div>
    </section>
  );
};
