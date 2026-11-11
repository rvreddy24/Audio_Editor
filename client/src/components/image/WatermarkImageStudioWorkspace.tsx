import React, { useState, useEffect } from 'react';
import {
  Type,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  Grid,
} from 'lucide-react';
import {
  loadImage,
  addWatermarkToImage,
  downloadImageBlob,
  WatermarkOptions,
} from '../../utils/imageProcessor';

interface WatermarkImageStudioWorkspaceProps {
  onBack: () => void;
}

export const WatermarkImageStudioWorkspace: React.FC<WatermarkImageStudioWorkspaceProps> = ({
  onBack,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [text, setText] = useState<string>('rajvarshith.com');
  const [position, setPosition] = useState<WatermarkOptions['position']>('tile');
  const [opacity, setOpacity] = useState<number>(0.4);
  const [fontSize, setFontSize] = useState<number>(36);
  const [color, setColor] = useState<string>('#FFFFFF');
  const [rotation, setRotation] = useState<number>(-30);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setFontSize(Math.max(20, Math.round(img.naturalWidth / 25)));
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const res = await addWatermarkToImage(imgElement, {
        text,
        position,
        opacity,
        fontSize,
        color,
        rotation,
      });
      setResult(res);
    } catch (err: any) {
      alert(`Watermark error: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, text, position, opacity, fontSize, color, rotation]);

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
          <Type className="w-7 h-7 text-indigo-600" />
          <span>Add Watermark & Text</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Protect photos and documents with custom text watermarks, copyright notices, or full diagonal tiled patterns.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Watermark
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP • 100% Client-Side In-Browser Processing
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Watermark Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter watermark text..."
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Placement Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tile' as const, label: 'Diagonal Tiled' },
                  { id: 'center' as const, label: 'Center' },
                  { id: 'bottom-right' as const, label: 'Bottom Right' },
                  { id: 'bottom-left' as const, label: 'Bottom Left' },
                  { id: 'top-right' as const, label: 'Top Right' },
                  { id: 'top-left' as const, label: 'Top Left' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      position === pos.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity & Font Size */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Opacity</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Font Size</span>
                  <span>{fontSize} px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {position !== 'tile' && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Rotation</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200"
                />
                <span className="text-xs font-mono font-bold text-slate-600">
                  Color: {color.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_watermarked.jpg`);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying Watermark...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Watermarked Image</span>
                  </>
                )}
              </button>

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors mt-1">
                Choose another image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Previews Column */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[440px]">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
              <span>Watermarked Preview</span>
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">Stamping watermark...</span>
              </div>
            ) : result ? (
              <div className="max-h-[400px] max-w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                <img
                  src={result.dataUrl}
                  alt="Watermarked preview"
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
