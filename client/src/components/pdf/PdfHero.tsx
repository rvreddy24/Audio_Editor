import React from 'react';

export const PdfHero: React.FC = () => {
  return (
    <section className="pt-10 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
        Complete PDF Toolkit at Your Fingertips
      </h1>
      <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Fast, private, and <span className="font-bold text-red-600">100% FREE</span>! Merge,
        split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
      </p>
    </section>
  );
};
