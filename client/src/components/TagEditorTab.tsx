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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
          <Tag className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900 font-sans">
            ID3 Metadata & Track Information
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Embed title, artist attribution, album naming, and metadata tags into the audio stream.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-indigo-600" /> Track Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midnight Horizon"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Artist */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600" /> Artist / Band
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. Solar Wave"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Album */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-indigo-600" /> Album Release
          </label>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="e.g. Odyssey EP"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Release Year
          </label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2026"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-indigo-600" /> Musical Genre
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Synth-pop / Electronic"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Comments & Notes
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Mastered in SoundCraft Studio"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 text-xs transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving Tags...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Write Metadata to File
            </>
          )}
        </button>
      </div>
    </div>
  );
};
