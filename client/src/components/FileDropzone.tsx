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
      className={`relative rounded-3xl border-2 border-dashed p-10 lg:p-14 text-center transition-all flex flex-col items-center justify-center gap-6 overflow-hidden ${
        isDragging
          ? 'border-emerald-400 bg-emerald-950/20 shadow-neon-volt scale-[1.01]'
          : 'border-white/[0.1] bg-studio-900/60 hover:border-emerald-500/40 hover:bg-studio-900/90 shadow-2xl'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.04] via-transparent to-transparent pointer-events-none" />

      {/* Uploading progress overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl rounded-3xl p-6 gap-3.5">
          <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin shadow-neon-volt" />
          <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            ANALYZING MEDIA WITH FFMPEG...
          </div>
          <div className="w-64 h-2 bg-studio-800 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-200 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs font-mono text-emerald-400 font-bold">{uploadProgress}% UPLOADED</div>
        </div>
      )}

      {/* Glowing Hardware Icon */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-neon-volt">
        <UploadCloud className="w-8 h-8 animate-pulse" />
      </div>

      <div className="max-w-lg flex flex-col gap-2">
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sans">
          IMPORT AUDIO OR VIDEO SESSION
        </h3>
        <p className="text-xs text-studio-400 font-mono leading-relaxed">
          Universal multi-track support for MP3, WAV, FLAC, AAC, OPUS, OGG, M4A, MP4, MKV, MOV, and WebM files.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3.5 z-10">
        <label className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold px-7 py-3 rounded-xl shadow-neon-volt cursor-pointer flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-all hover:scale-105 active:scale-95">
          <Music className="w-4 h-4" />
          BROWSE MEDIA FILE
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
          className="bg-studio-950 hover:bg-studio-850 text-emerald-400 hover:text-white font-mono font-bold px-5 py-3 rounded-xl border border-emerald-500/30 flex items-center gap-2 text-xs transition-all shadow-sm"
        >
          {isGeneratingDemo ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              SYNTHESIZING...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              TRY DEMO SYNTHWAVE TRACK
            </>
          )}
        </button>
      </div>

      {/* Codec Badge Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] text-studio-400 font-mono tracking-wider uppercase z-10">
        <span className="px-2.5 py-1 rounded-lg bg-studio-950 border border-white/[0.06]">MP3 / WAV / FLAC</span>
        <span className="px-2.5 py-1 rounded-lg bg-studio-950 border border-white/[0.06]">AAC / M4A / OPUS</span>
        <span className="px-2.5 py-1 rounded-lg bg-studio-950 border border-white/[0.06]">MP4 / MKV / WEBM VIDEO</span>
        <span className="px-2.5 py-1 rounded-lg bg-studio-950 border border-emerald-500/20 text-emerald-400 font-bold">UP TO 1 GB</span>
      </div>
    </div>
  );
};
