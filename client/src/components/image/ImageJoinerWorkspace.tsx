import React, { useState } from 'react';
import {
  Combine,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  loadImage,
  joinImages,
  downloadImageBlob,
} from '../../utils/imageProcessor';

interface ImageJoinerWorkspaceProps {
  onBack?: () => void;
}

export const ImageJoinerWorkspace: React.FC<ImageJoinerWorkspaceProps> = ({ onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('vertical');
  const [gap, setGap] = useState<number>(15);
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
  } | null>(null);

  const handleFilesAdded = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const added = Array.from(newFiles);
    setFiles((prev) => [...prev, ...added]);
    setResult(null);
  };

  const handleRemove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setResult(null);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const imgElements = await Promise.all(files.map(loadImage));
      const res = await joinImages(imgElements, direction, gap, bgColor);
      setResult(res);
    } catch (err: any) {
      alert(`Merge error: ${err.message || 'Failed to join images'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Image Tools</span>
        </button>
      )}

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
          <Combine className="w-7 h-7 text-teal-600" />
          <span>Join & Merge Images</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Combine multiple photos side-by-side or stacked vertically (e.g. Photo and Signature combined into one image).
        </p>
      </div>

      {files.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white hover:bg-teal-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select 2 or More Images to Join
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Select multiple files (Photo + Signature, etc.)
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {files.length} Images Selected
              </span>
              <label className="text-xs font-bold text-teal-600 hover:underline cursor-pointer flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add another</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesAdded(e.target.files)}
                />
              </label>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                >
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                    {idx + 1}. {file.name}
                  </span>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Orientation */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Join Alignment
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setDirection('vertical');
                    setResult(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    direction === 'vertical'
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Vertical (Stacked)
                </button>
                <button
                  onClick={() => {
                    setDirection('horizontal');
                    setResult(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    direction === 'horizontal'
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Horizontal (Side by Side)
                </button>
              </div>
            </div>

            {/* Gap */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Spacing Between Images</span>
                <span>{gap}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={gap}
                onChange={(e) => {
                  setGap(parseInt(e.target.value));
                  setResult(null);
                }}
                className="w-full accent-teal-600"
              />
            </div>

            {/* Canvas Background Color */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Background Fill
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'White', color: '#FFFFFF' },
                  { label: 'Black', color: '#000000' },
                  { label: 'Grey', color: '#F3F4F6' },
                ].map((bg) => (
                  <button
                    key={bg.color}
                    onClick={() => {
                      setBgColor(bg.color);
                      setResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      bgColor === bg.color
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                disabled={isProcessing}
                onClick={handleMerge}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining images...</span>
                  </>
                ) : (
                  <span>Merge Images Now →</span>
                )}
              </button>

              {result && (
                <button
                  onClick={() => downloadImageBlob(result.blob, 'joined_image.jpg')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-xs transition-all hover:scale-101 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Joined Image</span>
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
            {result ? (
              <div className="w-full flex flex-col items-center">
                <div className="max-h-[400px] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                  <img
                    src={result.dataUrl}
                    alt="Merged output"
                    className="max-h-[380px] max-w-full object-contain rounded-lg shadow-xs"
                  />
                </div>
                <div className="mt-4 text-center text-xs font-bold text-slate-800">
                  Joined {files.length} images successfully
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs">
                Click "Merge Images Now" to preview joined image
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
