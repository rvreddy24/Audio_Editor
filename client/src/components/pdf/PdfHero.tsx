import React from 'react';

export const PdfHero: React.FC = () => {
  return (
    <section className="pt-8 pb-5 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold mb-3 shadow-2xs border border-slate-200 dark:border-slate-800">
        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-2xs">
          <img src="/rv-logo.png" alt="logo" className="w-full h-full object-contain" />
        </div>
        <span>rajvarshith<span className="text-orange-500 font-bold">.com</span> Toolkit</span>
      </div>
      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
        Complete PDF Toolkit at Your Fingertips
      </h1>
      <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Fast, private, and <span className="font-bold text-red-600">100% FREE</span>! Merge,
        split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
      </p>
    </section>
  );
};
