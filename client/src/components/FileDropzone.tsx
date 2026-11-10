import React, { useState } from 'react';
import { UploadCloud, Music, Film, Sparkles, Play } from 'lucide-react';
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
      className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all flex flex-col items-center justify-center gap-5 ${
        isDragging
          ? 'border-indigo-500 bg-indigo-950/20 shadow-2xl shadow-indigo-500/20 scale-[1.01]'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80 shadow-xl'
      }`}
    >
      {/* Uploading progress overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-3xl p-6 gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-semibold text-white">Analyzing media file with FFmpeg...</div>
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs font-mono text-slate-400">{uploadProgress}% uploaded</div>
        </div>
      )}

      {/* Main Dropzone Content */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
        <UploadCloud className="w-8 h-8 animate-bounce" />
      </div>

      <div className="max-w-md flex flex-col gap-1.5">
        <h3 className="text-xl font-bold text-white tracking-tight">
          Drop Audio or Video to Start Editing
        </h3>
        <p className="text-xs text-slate-400">
          Support for MP3, WAV, AAC, M4A, FLAC, OGG, OPUS, MP4, MKV, MOV, WebM, AVI and all major formats.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2 text-sm transition-all hover:scale-105 active:scale-95">
          <Music className="w-4 h-4" />
          Browse Audio or Video File
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
          className="bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-medium px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 text-xs transition-colors"
        >
          {isGeneratingDemo ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Synthesizing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Try Demo Synthwave Track
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500 font-mono">
        <span className="px-2 py-0.5 rounded bg-slate-800/80">MP3 / WAV / FLAC</span>
        <span className="px-2 py-0.5 rounded bg-slate-800/80">AAC / M4A / OPUS</span>
        <span className="px-2 py-0.5 rounded bg-slate-800/80">MP4 / MKV / WebM Video</span>
        <span className="px-2 py-0.5 rounded bg-slate-800/80">Up to 1 GB</span>
      </div>
    </div>
  );
};
