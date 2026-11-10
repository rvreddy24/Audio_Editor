import React, { useState } from 'react';
import { Tag, Save, Music, User, Disc, Calendar, Hash, MessageSquare } from 'lucide-react';
import { updateMetadata } from '../api';
import { LoadedFile, ProcessingResult } from '../types';

interface TagEditorTabProps {
  currentFile: LoadedFile;
  onProcessed: (result: ProcessingResult) => void;
}

export const TagEditorTab: React.FC<TagEditorTabProps> = ({ currentFile, onProcessed }) => {
  const existingTags = currentFile.probe.tags || {};

  const [title, setTitle] = useState(existingTags.title || existingTags.TITLE || '');
  const [artist, setArtist] = useState(existingTags.artist || existingTags.ARTIST || '');
  const [album, setAlbum] = useState(existingTags.album || existingTags.ALBUM || '');
  const [year, setYear] = useState(existingTags.date || existingTags.DATE || existingTags.year || '');
  const [genre, setGenre] = useState(existingTags.genre || existingTags.GENRE || '');
  const [comment, setComment] = useState(existingTags.comment || existingTags.COMMENT || '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await updateMetadata({
        fileId: currentFile.fileId,
        title,
        artist,
        album,
        year,
        genre,
        comment
      });
      onProcessed(res);
    } catch (err: any) {
      setError(err.message || 'Failed to update metadata tags');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="studio-glass rounded-2xl p-6 shadow-2xl flex flex-col gap-6 border border-white/[0.08]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
        <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <Tag className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight uppercase font-sans">
            ID3 Container Metadata & Track Info
          </h3>
          <p className="text-[11px] text-studio-400 font-mono mt-0.5">
            Embed title, artist attribution, album naming, and metadata tags into the audio stream.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-400 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-teal-400" /> TRACK TITLE
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midnight Horizon"
            className="bg-studio-950 border border-studio-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-studio-600 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Artist */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-teal-400" /> ARTIST / PRODUCER
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. Solar Wave"
            className="bg-studio-950 border border-studio-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-studio-600 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Album */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-400 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-teal-400" /> ALBUM RELEASE
          </label>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="e.g. Neon Odyssey LP"
            className="bg-studio-950 border border-studio-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-studio-600 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-400" /> RELEASE YEAR
          </label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2026"
            className="bg-studio-950 border border-studio-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-studio-600 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-400 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-teal-400" /> MUSICAL GENRE
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Synthwave / Cyberpunk"
            className="bg-studio-950 border border-studio-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-studio-600 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-studio-400 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> MASTERING METADATA
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Mastered in SoundCraft Pro Studio"
            className="bg-studio-950 border border-studio-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-studio-600 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-mono">
          ERROR: {error}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-white/[0.06]">
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-extrabold px-6 py-2.5 rounded-xl shadow-neon-volt flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              WRITING ID3 METADATA...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              WRITE METADATA TO FILE
            </>
          )}
        </button>
      </div>
    </div>
  );
};
