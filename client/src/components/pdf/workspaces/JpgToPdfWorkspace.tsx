import React, { useState } from 'react';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  FileImage,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { convertImagesToPdf, downloadBytes } from '../../../utils/pdfOperations';
import { formatFileSize } from '../../../utils/formatters';

interface ImageItem {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  type: string;
  data: ArrayBuffer;
}

interface JpgToPdfWorkspaceProps {
  onBack: () => void;
}

export const JpgToPdfWorkspace: React.FC<JpgToPdfWorkspaceProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [margin, setMargin] = useState<number>(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Clean up object URLs on unmount to prevent browser memory leaks
  React.useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [images]);

  const handleFilesSelected = async (files: File[]) => {
    const items: ImageItem[] = [];
    for (const f of files) {
      let data = await f.arrayBuffer();
      let type = f.type;
      const previewUrl = URL.createObjectURL(f);

      // Transcode WebP, GIF, SVG or other browser formats to PNG ArrayBuffer
      if (!type.includes('jpeg') && !type.includes('jpg') && !type.includes('png') && typeof document !== 'undefined') {
        try {
          const transBlob = await new Promise<Blob | null>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((b) => resolve(b), 'image/png');
              } else resolve(null);
            };
            img.onerror = () => resolve(null);
            img.src = previewUrl;
          });
          if (transBlob) {
            data = await transBlob.arrayBuffer();
            type = 'image/png';
          }
        } catch (tErr) {
          console.warn('Image transcoding warning:', tErr);
        }
      }

      items.push({
        id: `${Date.now()}-${Math.random()}`,
        name: f.name,
        size: f.size,
        previewUrl,
        type,
        data,
      });
    }
    setImages((prev) => [...prev, ...items]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const imgPayloads = images.map((img) => ({
        data: img.data,
        type: img.type,
      }));
      const pdfBytes = await convertImagesToPdf(imgPayloads, {
        orientation,
        pageSize,
        margin,
      });
      downloadBytes(pdfBytes, 'converted_document.pdf');
      setIsDone(true);
    } catch (err: any) {
      alert(err.message || 'Failed to convert images to PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All PDF Tools</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          JPG to PDF
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Convert your JPG/PNG images to PDF. Adjust orientation and margins in seconds.
        </p>
      </div>

      {images.length === 0 ? (
        <PdfDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/*"
          title="Select JPG images"
          buttonLabel="Select JPG images"
          subtitle="or drop images here"
        />
      ) : isDone ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Images converted to PDF!</h2>
            <p className="text-xs text-slate-500 mt-1">Your PDF has been downloaded automatically.</p>
          </div>
          <button
            onClick={handleConvert}
            className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md flex items-center gap-2.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Download again</span>
          </button>
          <button
            onClick={() => {
              setImages([]);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Convert more images
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Images Grid */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {images.length} {images.length === 1 ? 'image' : 'images'} selected
              </span>
              <label className="text-xs font-semibold text-[#e5322d] hover:underline cursor-pointer flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add more images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex flex-col justify-between group hover:border-slate-300 transition-all relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => handleRemove(img.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="h-36 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-1 border border-slate-100">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="h-full object-contain shadow-2xs"
                    />
                  </div>

                  <div className="mt-2 text-[11px] truncate text-slate-700 font-semibold" title={img.name}>
                    {img.name}
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={idx === images.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs sticky top-24 flex flex-col gap-5">
              <h3 className="font-bold text-slate-900 text-sm">PDF Page Options</h3>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orientation === 'portrait'
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orientation === 'landscape'
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Page Size</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setPageSize('a4')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      pageSize === 'a4'
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPageSize('letter')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      pageSize === 'letter'
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    US Letter
                  </button>
                  <button
                    onClick={() => setPageSize('fit')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      pageSize === 'fit'
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Auto Fit
                  </button>
                </div>
              </div>

              {/* Margin */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Margin</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setMargin(0)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      margin === 0
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setMargin(20)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      margin === 20
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setMargin(40)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      margin === 40
                        ? 'bg-red-50 text-[#e5322d] border-red-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Big
                  </button>
                </div>
              </div>

              <button
                disabled={isProcessing}
                onClick={handleConvert}
                className="w-full bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2 mt-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Converting images...</span>
                  </>
                ) : (
                  <span>Convert to PDF →</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
