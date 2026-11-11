import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  Sparkles,
  RefreshCw,
  Sun,
  Eye,
} from 'lucide-react';
import {
  loadImage,
  applyPhotoEffects,
  downloadImageBlob,
  PhotoEffectOptions,
} from '../../utils/imageProcessor';

interface PhotoEffectsWorkspaceProps {
  onBack: () => void;
}

export const PhotoEffectsWorkspace: React.FC<PhotoEffectsWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [filter, setFilter] = useState<PhotoEffectOptions['filter']>('none');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blurRadius, setBlurRadius] = useState<number>(0);
  const [pixelateSize, setPixelateSize] = useState<number>(0);

  // Border frame
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#FFFFFF');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
  } | null>(null);

  const filterPresets: Array<{ id: PhotoEffectOptions['filter']; label: string }> = [
    { id: 'none', label: 'Original' },
    { id: 'grayscale', label: 'Grayscale' },
    { id: 'high-contrast', label: 'Black & White (High Contrast)' },
    { id: 'sepia', label: 'Vintage Sepia' },
    { id: 'vintage', label: 'Retro Warm' },
    { id: 'invert', label: 'Negative / Invert' },
    { id: 'blur', label: 'Gaussian Blur' },
    { id: 'pixelate', label: 'Pixel Art' },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const res = await applyPhotoEffects(imgElement, {
        filter,
        brightness,
        contrast,
        saturation,
        blurRadius: filter === 'blur' ? blurRadius : 0,
        pixelateSize: filter === 'pixelate' ? pixelateSize : 0,
        border: borderWidth > 0 ? { width: borderWidth, color: borderColor } : undefined,
      });
      setResult(res);
    } catch (err: any) {
      alert(`Effect error: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [
    imgElement,
    filter,
    brightness,
    contrast,
    saturation,
    blurRadius,
    pixelateSize,
    borderWidth,
    borderColor,
  ]);

  const handleResetFilters = () => {
    setFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlurRadius(0);
    setPixelateSize(0);
    setBorderWidth(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All Image Tools</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
          <Sliders className="w-7 h-7 text-purple-600" />
          <span>Photo Effects & Filters</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Enhance photos with color grading, vintage sepia, classic black & white, brightness, contrast, blur, and custom borders.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Filter
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP • Real-Time In-Browser Canvas Filters
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Filter Presets
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-purple-600 font-bold hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filterPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setFilter(p.id);
                    if (p.id === 'blur' && blurRadius === 0) setBlurRadius(8);
                    if (p.id === 'pixelate' && pixelateSize === 0) setPixelateSize(12);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-left truncate ${
                    filter === p.id
                      ? 'border-purple-600 bg-purple-50 text-purple-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Dynamic Sliders based on filter */}
            {filter === 'blur' && (
              <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200/60">
                <div className="flex justify-between text-xs font-bold text-purple-900 mb-1">
                  <span>Blur Radius</span>
                  <span>{blurRadius} px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            )}

            {filter === 'pixelate' && (
              <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200/60">
                <div className="flex justify-between text-xs font-bold text-purple-900 mb-1">
                  <span>Pixel Block Size</span>
                  <span>{pixelateSize} px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={pixelateSize}
                  onChange={(e) => setPixelateSize(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            )}

            {/* Adjustment Sliders */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Brightness */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Brightness</span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="180"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Contrast</span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="180"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Saturation</span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>

            {/* Photo Border / Frame */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Photo Border / Frame</span>
                <span>{borderWidth} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={borderWidth}
                onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                className="w-full accent-purple-600"
              />
              {borderWidth > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {borderColor.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_filtered.jpg`);
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Effects...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Filtered Image</span>
                  </>
                )}
              </button>

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors mt-1">
                Choose another image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Result Preview */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[440px]">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
              <span>Live Enhanced Preview</span>
              <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Active Filter: {filterPresets.find((p) => p.id === filter)?.label}
              </span>
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">Applying filters...</span>
              </div>
            ) : result ? (
              <div className="max-h-[400px] max-w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                <img
                  src={result.dataUrl}
                  alt="Effects preview"
                  className="max-h-[380px] max-w-full object-contain rounded-xl shadow-xs"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
