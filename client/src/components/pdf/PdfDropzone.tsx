import React, { useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

interface PdfDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  accept?: string;
  multiple?: boolean;
}

export const PdfDropzone: React.FC<PdfDropzoneProps> = ({
  onFilesSelected,
  title = 'Select PDF files',
  subtitle = 'or drop PDFs here',
  buttonLabel = 'Select PDF files',
  accept = 'application/pdf,.pdf',
  multiple = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-3xl border-2 border-dashed p-12 sm:p-20 text-center transition-all flex flex-col items-center justify-center gap-6 bg-white max-w-3xl mx-auto ${
        isDragging
          ? 'border-[#e5322d] bg-red-50/40 shadow-lg scale-[1.01]'
          : 'border-slate-300 hover:border-red-400 hover:bg-slate-50/50 shadow-xs'
      }`}
    >
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-red-50 text-[#e5322d] flex items-center justify-center border border-red-100 shadow-xs">
        <FileText className="w-10 h-10" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-4 rounded-2xl text-base shadow-md cursor-pointer transition-all hover:scale-102 active:scale-98 flex items-center gap-3 mx-auto">
          <UploadCloud className="w-5 h-5" />
          <span>{buttonLabel}</span>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={handleChange}
          />
        </label>
        <span className="text-xs font-semibold text-slate-400 mt-2">{subtitle}</span>
      </div>
    </div>
  );
};
