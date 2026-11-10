import React from 'react';

export const PdfHero: React.FC = () => {
  return (
    <section className="pt-8 pb-5 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold mb-3 shadow-xs border border-slate-800">
        <img src="/rv-logo.png" alt="logo" className="w-4 h-4 object-contain" />
        <span>rajvarshith<span className="text-orange-400 font-bold">.com</span> Toolkit</span>
      </div>
      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
        Complete PDF Toolkit at Your Fingertips
      </h1>
      <p className="mt-2.5 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Fast, private, and <span className="font-bold text-red-600">100% FREE</span>! Merge,
        split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
      </p>
    </section>
  );
};
