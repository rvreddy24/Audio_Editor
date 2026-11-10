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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-indigo-400" />
          ID3 & Audio Metadata Editor
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          View and edit song tags, artist information, album, year, and metadata embedded into the audio file.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-indigo-400" /> Track Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midnight City"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Artist */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Artist / Band
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. M83"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Album */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-indigo-400" /> Album Name
          </label>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="e.g. Hurry Up, We're Dreaming"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Release Year
          </label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2011"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-indigo-400" /> Genre
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Electronic / Synth-pop"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Comment
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Mastered in SoundCraft Studio"
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-800">
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving Tags...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Write Metadata Tags
            </>
          )}
        </button>
      </div>
    </div>
  );
};
