import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Download,
  Upload,
  ArrowLeft,
  Pipette,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Eye,
  Sliders,
  ShieldCheck,
  Feather,
} from 'lucide-react';
import {
  loadImage,
  canvasToBlob,
  downloadImageBlob,
  processPngMaker,
  PngMakerOptions,
} from '../../utils/imageProcessor';

interface PngMakerWorkspaceProps {
  onBack: () => void;
}

type PngMode = 'white' | 'black' | 'signature' | 'custom';

const PREVIEW_BACKDROPS = [
  { id: 'checker', label: 'Checkerboard', class: 'bg-checkerboard' },
  { id: 'dark', label: 'Dark Mode', class: 'bg-slate-900' },
  { id: 'light', label: 'Light Mode', class: 'bg-white' },
  { id: 'yellow', label: 'Yellow Contrast', class: 'bg-amber-400' },
  { id: 'green', label: 'Chroma Green', class: 'bg-emerald-500' },
];

export const PngMakerWorkspace: React.FC<PngMakerWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Settings
  const [mode, setMode] = useState<PngMode>('white');
  const [customColor, setCustomColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [seedPoint, setSeedPoint] = useState<{ x: number; y: number } | null>(null);
  const [tolerance, setTolerance] = useState<number>(25);
  const [feather, setFeather] = useState<number>(2);
  const [contiguous, setContiguous] = useState<boolean>(true);
  const [defringe, setDefringe] = useState<boolean>(true);

  // Preview & Viewport
  const [backdrop, setBackdrop] = useState<string>('checker');
  const [zoom, setZoom] = useState<number>(1);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);

  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    try {
      const img = await loadImage(file);
      setImgElement(img);
      setSeedPoint(null);
      setZoom(1);
    } catch (err) {
      console.error(err);
      alert('Failed to load image. Please select a valid photo or graphic.');
    }
  };

  // Re-render PNG
  const renderPng = useCallback(() => {
    if (!imgElement || !displayCanvasRef.current) return;
    setIsProcessing(true);

    try {
      const options: PngMakerOptions = {
        mode,
        customColor,
        seedPoint: seedPoint || undefined,
        tolerance,
        feather,
        contiguous,
        defringe,
      };

      const resultCanvas = processPngMaker(imgElement, options);
      const disp = displayCanvasRef.current;
      disp.width = resultCanvas.width;
      disp.height = resultCanvas.height;
      const ctx = disp.getContext('2d');
      if (ctx) {
        if (showOriginal) {
          ctx.drawImage(imgElement, 0, 0);
        } else {
          ctx.drawImage(resultCanvas, 0, 0);
        }
      }
    } catch (err) {
      console.error('Error generating PNG:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [imgElement, mode, customColor, seedPoint, tolerance, feather, contiguous, defringe, showOriginal]);

  useEffect(() => {
    renderPng();
  }, [renderPng]);

  // Eyedropper click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !imgElement || !displayCanvasRef.current) return;
    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const sampleC = document.createElement('canvas');
      sampleC.width = imgElement.naturalWidth;
      sampleC.height = imgElement.naturalHeight;
      const sCtx = sampleC.getContext('2d', { willReadFrequently: true });
      if (sCtx) {
        sCtx.drawImage(imgElement, 0, 0);
        const p = sCtx.getImageData(x, y, 1, 1).data;
        setCustomColor({ r: p[0], g: p[1], b: p[2] });
        setSeedPoint({ x, y });
        setMode('custom');
        setIsEyedropperActive(false);
      }
    }
  };

  // Export Transparent PNG
  const handleDownload = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const options: PngMakerOptions = {
        mode,
        customColor,
        tolerance,
        feather,
        contiguous,
        defringe,
      };

      const finalCanvas = processPngMaker(imgElement, options);
      const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'image';
      const blob = await canvasToBlob(finalCanvas, 'image/png');
      downloadImageBlob(blob, `${baseName}-transparent.png`);
    } catch (err) {
      console.error(err);
      alert('Failed to export PNG.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to All Image Tools"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Transparent PNG Maker
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                Asset Optimizer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Convert logos, icons, signatures, and graphics to clean transparent PNGs with customizable tolerance and edge feathering.
            </p>
          </div>
        </div>

        {imgElement && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download Transparent PNG</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      {!imgElement ? (
        /* Upload Area */
        <div className="max-w-2xl mx-auto py-12">
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl p-8 sm:p-12 text-center bg-white shadow-xs transition-colors flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Drop image here to create transparent PNG
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Quickly remove solid white, black, or colored backgrounds from logos, badges, products, and signatures.
            </p>

            <label className="cursor-pointer px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all">
              <span>Select Image from Computer</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      ) : (
        /* Editor Layout */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls Panel (Left) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Presets */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Transparency Preset
              </label>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setMode('white');
                    setIsEyedropperActive(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    mode === 'white'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg border border-slate-300 bg-white shrink-0 shadow-2xs" />
                  <div className="min-w-0">
                    <div>Remove White Background</div>
                    <div className="text-[10px] text-slate-400 font-normal">For logos, products & paper docs</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode('black');
                    setIsEyedropperActive(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    mode === 'black'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg border border-slate-800 bg-slate-900 shrink-0 shadow-2xs" />
                  <div className="min-w-0">
                    <div>Remove Black Background</div>
                    <div className="text-[10px] text-slate-400 font-normal">For neon, dark icons & VFX</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode('signature');
                    setIsEyedropperActive(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    mode === 'signature'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-serif font-black text-xs">
                    ✍
                  </span>
                  <div className="min-w-0">
                    <div>Signature Transparency</div>
                    <div className="text-[10px] text-slate-400 font-normal">Cleans paper shadows & darkens ink</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode('custom');
                    setIsEyedropperActive(true);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    mode === 'custom'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-lg border border-slate-300 shrink-0 shadow-2xs"
                    style={{ backgroundColor: `rgb(${customColor.r}, ${customColor.g}, ${customColor.b})` }}
                  />
                  <div className="min-w-0">
                    <div>Custom Color Keying</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {isEyedropperActive ? 'Click on canvas to sample color' : 'Key out specific hex/rgb shade'}
                    </div>
                  </div>
                </button>
              </div>

              {isEyedropperActive && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-800 flex items-center gap-2">
                  <Pipette className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>Click anywhere on the preview canvas to pick the color to make transparent.</span>
                </div>
              )}
            </div>

            {/* Sliders & Precision */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Edge Smoothness & Tolerance
              </label>

              {/* Tolerance */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Tolerance:</span>
                  <span className="font-mono text-indigo-600">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Edge Feather */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Edge Feather (Anti-Aliasing):</span>
                  <span className="font-mono text-indigo-600">{feather}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={feather}
                  onChange={(e) => setFeather(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Eliminates rough pixel edges for smooth blending.
                </span>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={contiguous}
                    onChange={(e) => setContiguous(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Contiguous only (preserve inner logo fills)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={defringe}
                    onChange={(e) => setDefringe(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>De-fringe (remove edge halos)</span>
                </label>
              </div>
            </div>

            {/* Test Backdrop Switcher */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Test On Background
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {PREVIEW_BACKDROPS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBackdrop(b.id)}
                    title={b.label}
                    className={`h-8 rounded-lg border flex items-center justify-center transition-all ${b.class} ${
                      backdrop === b.id ? 'ring-2 ring-indigo-500 ring-offset-2' : 'border-slate-200'
                    }`}
                  >
                    {backdrop === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 drop-shadow-sm" />}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Verify transparency on different dark, light & colored themes.
              </span>
            </div>

            {/* Change Photo Button */}
            <label className="block text-center cursor-pointer py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors">
              <span>Select Different Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </label>
          </div>

          {/* Canvas Viewport (Right 3 cols) */}
          <div className="lg:col-span-3 flex flex-col space-y-3">
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 active:bg-indigo-50 active:border-indigo-300 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hold for Original</span>
                </button>

                <span className="text-slate-300">|</span>

                <span>
                  {imgElement.naturalWidth} × {imgElement.naturalHeight} px
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono text-[11px]">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  title="Fit 100%"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Scroll Container */}
            <div className="relative w-full h-[520px] sm:h-[620px] bg-slate-100/80 rounded-3xl border border-slate-200/90 overflow-auto flex items-center justify-center p-6 shadow-inner select-none">
              {/* Active Backdrop Card */}
              <div
                className={`relative rounded-2xl overflow-hidden shadow-lg border border-slate-300 transition-colors ${
                  backdrop === 'dark'
                    ? 'bg-slate-900'
                    : backdrop === 'light'
                    ? 'bg-white'
                    : backdrop === 'yellow'
                    ? 'bg-amber-400'
                    : backdrop === 'green'
                    ? 'bg-emerald-500'
                    : 'bg-checkerboard'
                }`}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 100ms ease-out',
                }}
              >
                <canvas
                  ref={displayCanvasRef}
                  onClick={handleCanvasClick}
                  className={`block max-w-none ${isEyedropperActive ? 'cursor-crosshair' : 'cursor-default'}`}
                  style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
            linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
            linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
          background-size: 14px 14px;
          background-position: 0 0, 0 7px, 7px -7px, -7px 0px;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};
