import React, { useState, useEffect, useRef } from 'react';
import {
  Crop,
  Circle,
  Square,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  loadImage,
  cropImage,
  circleCropImage,
  roundCornersImage,
  downloadImageBlob,
} from '../../utils/imageProcessor';

interface CropShapeWorkspaceProps {
  initialMode?: 'crop' | 'circle' | 'round';
  onBack: () => void;
}

export const CropShapeWorkspace: React.FC<CropShapeWorkspaceProps> = ({
  initialMode = 'crop',
  onBack,
}) => {
  const [mode, setMode] = useState<'crop' | 'circle' | 'round'>(initialMode);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Crop mode state
  const [aspectRatio, setAspectRatio] = useState<string>('free'); // 'free', '1:1', '4:5', '16:9', '4:3', '9:16'
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 300,
    h: 300,
  });

  // Circle mode state
  const [circleBorderWidth, setCircleBorderWidth] = useState<number>(0);
  const [circleBorderColor, setCircleBorderColor] = useState<string>('#FFFFFF');

  // Round corners state
  const [cornerRadius, setCornerRadius] = useState<number>(40);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
    width?: number;
    height?: number;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setCropBox({
        x: Math.round(img.naturalWidth * 0.025),
        y: Math.round(img.naturalHeight * 0.025),
        w: Math.round(img.naturalWidth * 0.95),
        h: Math.round(img.naturalHeight * 0.95),
      });
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      if (mode === 'crop') {
        const res = await cropImage(
          imgElement,
          {
            x: cropBox.x,
            y: cropBox.y,
            width: cropBox.w,
            height: cropBox.h,
          },
          'image/jpeg'
        );
        setResult(res);
      } else if (mode === 'circle') {
        const res = await circleCropImage(imgElement, {
          borderWidth: circleBorderWidth,
          borderColor: circleBorderColor,
          format: 'image/png',
        });
        setResult({ blob: res.blob, dataUrl: res.dataUrl, width: res.size, height: res.size });
      } else if (mode === 'round') {
        const res = await roundCornersImage(imgElement, cornerRadius, 'image/png');
        setResult({
          blob: res.blob,
          dataUrl: res.dataUrl,
          width: imgElement.naturalWidth,
          height: imgElement.naturalHeight,
        });
      }
    } catch (err: any) {
      alert(`Error processing image: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, mode, cropBox, circleBorderWidth, circleBorderColor, cornerRadius]);

  const handleAspectChange = (ratioStr: string) => {
    setAspectRatio(ratioStr);
    if (!imgElement) return;
    const iw = imgElement.naturalWidth;
    const ih = imgElement.naturalHeight;

    if (ratioStr === 'free') {
      setCropBox({
        x: Math.round(iw * 0.025),
        y: Math.round(ih * 0.025),
        w: Math.round(iw * 0.95),
        h: Math.round(ih * 0.95),
      });
      return;
    }

    const [rW, rH] = ratioStr.split(':').map(Number);
    const targetRatio = rW / rH;

    let nw = iw * 0.95;
    let nh = nw / targetRatio;
    if (nh > ih * 0.95) {
      nh = ih * 0.95;
      nw = nh * targetRatio;
    }

    setCropBox({
      x: Math.round((iw - nw) / 2),
      y: Math.round((ih - nh) / 2),
      w: Math.round(nw),
      h: Math.round(nh),
    });
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
          {mode === 'circle' ? (
            <Circle className="w-7 h-7 text-sky-600" />
          ) : mode === 'round' ? (
            <Square className="w-7 h-7 text-amber-600" />
          ) : (
            <Crop className="w-7 h-7 text-indigo-600" />
          )}
          <span>
            {mode === 'circle'
              ? 'Circle Crop / Avatar Maker'
              : mode === 'round'
              ? 'Round Image Corners'
              : 'Crop Image & Aspect Ratio'}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Crop pictures with precision aspect ratios, make circular profile avatars, or smooth corners with custom border radiuses.
        </p>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex flex-wrap justify-center p-1 bg-slate-100 rounded-2xl mt-5 border border-slate-200 max-w-full gap-1">
          <button
            onClick={() => setMode('crop')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'crop'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Crop & Aspect Ratio</span>
          </button>
          <button
            onClick={() => setMode('circle')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'circle'
                ? 'bg-white text-sky-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Circle Crop (Avatar)</span>
          </button>
          <button
            onClick={() => setMode('round')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'round'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Round Corners</span>
          </button>
        </div>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Crop
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
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            {mode === 'crop' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Aspect Ratio Presets
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'free', label: 'Free' },
                    { id: '1:1', label: '1:1' },
                    { id: '4:5', label: '4:5' },
                    { id: '16:9', label: '16:9' },
                    { id: '4:3', label: '4:3' },
                    { id: '9:16', label: '9:16' },
                    { id: '3:2', label: '3:2' },
                    { id: '2:3', label: '2:3' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleAspectChange(r.id)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        aspectRatio === r.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'circle' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Circular Border Width</span>
                    <span>{circleBorderWidth} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={circleBorderWidth}
                    onChange={(e) => setCircleBorderWidth(parseInt(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
                {circleBorderWidth > 0 && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Border Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={circleBorderColor}
                        onChange={(e) => setCircleBorderColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {circleBorderColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'round' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Corner Radius</span>
                    <span>{cornerRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={cornerRadius}
                    onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 30, 60, 100].map((r) => (
                    <button
                      key={r}
                      onClick={() => setCornerRadius(r)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                        cornerRadius === r
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r}px
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result && selectedFile) {
                    const ext = mode === 'crop' ? 'jpg' : 'png';
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_${mode}.${ext}`);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Cropped Image</span>
                  </>
                )}
              </button>

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors">
                Choose another image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Previews Column */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[440px]">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
              <span>Result Preview</span>
              {result && (
                <span className="text-[11px] text-slate-400">
                  {result.width} × {result.height} px
                </span>
              )}
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">Rendering crop...</span>
              </div>
            ) : result ? (
              <div className="w-full flex flex-col items-center">
                <div className="max-h-[380px] max-w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-2">
                  <img
                    src={result.dataUrl}
                    alt="Crop preview"
                    className="max-h-[360px] max-w-full object-contain shadow-xs"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
