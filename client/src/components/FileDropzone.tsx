import React, { useState } from 'react';
import { UploadCloud, Music, Sparkles } from 'lucide-react';
import { generateSampleAudioFile } from '../utils/sampleAudio';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  uploadProgress?: number;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelected,
  isLoading,
  uploadProgress = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const handleLoadDemo = async () => {
    setIsGeneratingDemo(true);
    try {
      const demoFile = await generateSampleAudioFile();
      onFileSelected(demoFile);
    } catch (e) {
      console.error('Failed to generate demo track:', e);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-3xl border-2 border-dashed p-10 lg:p-14 text-center transition-all flex flex-col items-center justify-center gap-6 bg-white ${
        isDragging
          ? 'border-indigo-600 bg-indigo-50/50 shadow-md scale-[1.01]'
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/40 shadow-sm'
      }`}
    >
      {/* Uploading progress overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs rounded-3xl p-6 gap-3.5">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-semibold text-slate-900">
            Analyzing media with FFmpeg...
          </div>
          <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs font-mono text-slate-500 font-semibold">{uploadProgress}% uploaded</div>
        </div>
      )}

      {/* Cloud Icon */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
        <UploadCloud className="w-8 h-8" />
      </div>

      <div className="max-w-md flex flex-col gap-1.5">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Drop Audio or Video to Start Editing
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Support for MP3, WAV, AAC, M4A, FLAC, OGG, OPUS, MP4, MKV, MOV, WebM, and AVI files up to 1 GB.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 z-10">
        <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-2 text-xs transition-all hover:scale-102 active:scale-98">
          <Music className="w-4 h-4" />
          Browse Files
          <input
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <button
          onClick={handleLoadDemo}
          disabled={isGeneratingDemo}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs transition-colors shadow-2xs"
        >
          {isGeneratingDemo ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Try Demo Audio Track
            </>
          )}
        </button>
      </div>

      {/* Format badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500 font-medium">
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/60">MP3 / WAV / FLAC</span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/60">AAC / M4A / OPUS</span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/60">MP4 / MKV / WebM Video</span>
      </div>
    </div>
  );
};
