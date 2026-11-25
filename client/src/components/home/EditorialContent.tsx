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
  Layers,
  Sparkles,
} from 'lucide-react';

export const EditorialContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guides' | 'privacy' | 'faq' | 'about'>('guides');
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
    <section className="mt-12 sm:mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
      {/* SINGLE COMPACT UNIFIED CARD CONTAINER */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Card Header & Navigation Bar */}
        <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/80 text-orange-700 dark:text-orange-300 text-[11px] font-semibold mb-1.5">
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span>Workstation Information & Help</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Platform Guide & Documentation
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Discover tool workflows, client-side privacy architecture, and answers to common questions.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('guides')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'guides'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tool Suites & Features</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Privacy Guarantee</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About & Contact</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: TOOL SUITES & GUIDES */}
          {activeTab === 'guides' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* PDF Suite */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">PDF & Office Workstation</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Merge multiple PDFs into a single report, extract or split pages, compress file size with lossless algorithms, convert Word/Excel/PowerPoint documents, and extract text via Optical Character Recognition (OCR).
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Merge & Split</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Lossless Compress</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Office to PDF</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">OCR Scanner</span>
                  </div>
                </div>

                {/* Image Studio */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Camera className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Image Studio & Document Prep</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Target KB compression for government exam and visa portals (e.g., 20KB, 50KB), official biometric passport photo cropping, AI background removal, transparent PNG generation, and applicant photo & signature joining.
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Exact Target KB</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Passport Photo</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Background Removal</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Photo+Sign Join</span>
                  </div>
                </div>

                {/* Audio & Video */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Film className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Audio & Video Suite</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Visual waveform scrubbing and millisecond cutting, 320 kbps high-bitrate audio export (MP3, WAV, FLAC, AAC, OGG), audio extraction from video files, video clip trimmer, and vertical 9:16 Shorts/Reels reframing.
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Waveform Cutter</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">320k High Bitrate</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Extract from Video</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">9:16 Shorts</span>
                  </div>
                </div>

                {/* Calculators */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Financial, Health & Math Suite</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Mortgage payment breakdowns with complete year-by-year amortization schedules, compound interest wealth modeling, auto loan EMIs, clinically validated BMI and calorie metrics, and scientific dual-line computing.
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Mortgage & Taxes</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Compound Wealth</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">BMI & Calories</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Scientific LCD</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY & SECURITY GUARANTEE */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">100% Client-Side In-Memory Execution</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Unlike standard web tools that upload your private documents, legal contracts, or biometric images to remote cloud servers, <strong>rajvarshith.com</strong> executes transformations entirely in your web browser memory.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Zero Cloud Uploads</div>
                  <p className="text-slate-500 dark:text-slate-400">PDFs, images, and audio tracks are processed in a local WebAssembly sandbox.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">No Data Retention</div>
                  <p className="text-slate-500 dark:text-slate-400">Files are cleared from memory as soon as you close or refresh the browser tab.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">AdSense & GDPR Safe</div>
                  <p className="text-slate-500 dark:text-slate-400">Full cookie disclosures, opt-out mechanisms, and strict privacy transparency.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FREQUENTLY ASKED QUESTIONS */}
          {activeTab === 'faq' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-orange-500' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: ABOUT & CONTACT */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Ethical Software Developed by Raj Varshith</h4>
              <p>
                <strong>rajvarshith.com</strong> was developed to solve a frustrating reality on the web: predatory subscriptions, paywalled conversions, and the constant security risk of uploading sensitive personal documents to third-party databases.
              </p>
              <p>
                By utilizing client-side WebAssembly, HTML5 Canvas, and Web Audio APIs, this platform provides desktop-class utility completely free and private in the browser.
              </p>

              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Engineering & Support Contact:</span>
                  <span className="text-orange-500 font-mono font-semibold">support@rajvarshith.com</span>
                  <span className="text-slate-400 block mt-0.5">Direct Developer Inquiries: rajvarshithreddy@gmail.com</span>
                </div>
                <a
                  href="mailto:support@rajvarshith.com"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shrink-0 text-center justify-center"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
