import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eraser,
  Wand2,
  Paintbrush,
  Pipette,
  Download,
  Upload,
  ArrowLeft,
  Undo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  CheckCircle2,
  Sparkles,
  Sliders,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  loadImage,
  canvasToBlob,
  downloadImageBlob,
  processBackgroundRemoval,
  BgRemovalOptions,
} from '../../utils/imageProcessor';

interface BackgroundRemoverWorkspaceProps {
  onBack: () => void;
}

type ToolMode = 'auto' | 'eyedropper' | 'eraser' | 'restore';

const PRESET_BACKGROUNDS = [
  { label: 'Transparent', value: 'transparent', previewClass: 'bg-checkerboard border-slate-300' },
  { label: 'White', value: '#FFFFFF', previewClass: 'bg-white border-slate-200' },
  { label: 'Sky Blue (Passport)', value: '#93C5FD', previewClass: 'bg-blue-300 border-blue-400' },
  { label: 'Studio Grey', value: '#E2E8F0', previewClass: 'bg-slate-200 border-slate-300' },
  { label: 'Navy Blue', value: '#1E3A8A', previewClass: 'bg-blue-900 border-blue-950' },
  { label: 'Pure Black', value: '#0F172A', previewClass: 'bg-slate-900 border-slate-800' },
  { label: 'Crimson', value: '#DC2626', previewClass: 'bg-red-600 border-red-700' },
];

export const BackgroundRemoverWorkspace: React.FC<BackgroundRemoverWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Tool Modes & Sliders
  const [toolMode, setToolMode] = useState<ToolMode>('auto');
  const [tolerance, setTolerance] = useState<number>(22);
  const [feather, setFeather] = useState<number>(2);
  const [brushSize, setBrushSize] = useState<number>(24);
  const [contiguous, setContiguous] = useState<boolean>(true);
  const [defringe, setDefringe] = useState<boolean>(true);
  const [targetColor, setTargetColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [seedPoint, setSeedPoint] = useState<{ x: number; y: number } | null>(null);
  const [bgChoice, setBgChoice] = useState<string>('transparent');
  const [customBgColor, setCustomBgColor] = useState<string>('#FFFFFF');

  // Brush Mask state (0 = untouched, 1 = erased, 2 = restored)
  const [brushMask, setBrushMask] = useState<Uint8Array | null>(null);
  const [maskHistory, setMaskHistory] = useState<Uint8Array[]>([]);

  // View & Zoom controls
  const [zoom, setZoom] = useState<number>(1);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Canvases
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPaintingRef = useRef<boolean>(false);

  // Load File
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    try {
      const img = await loadImage(file);
      setImgElement(img);
      setTargetColor(null);
      setSeedPoint(null);
      setBrushMask(new Uint8Array(img.naturalWidth * img.naturalHeight));
      setMaskHistory([]);
      setZoom(1);
    } catch (err) {
      console.error(err);
      alert('Failed to load image. Please select a valid photo.');
    }
  };

  // Re-run background removal whenever settings change
  const renderCutout = useCallback(() => {
    if (!imgElement || !displayCanvasRef.current) return;
    setIsProcessing(true);

    try {
      const options: BgRemovalOptions = {
        targetColor: targetColor || undefined,
        seedPoint: seedPoint || undefined,
        tolerance,
        feather,
        contiguous,
        defringe,
        brushMask: brushMask || undefined,
        backgroundColor: bgChoice === 'custom' ? customBgColor : bgChoice,
      };

      const resultCanvas = processBackgroundRemoval(imgElement, options);
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
      console.error('Error rendering cutout:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [imgElement, targetColor, seedPoint, tolerance, feather, contiguous, defringe, brushMask, bgChoice, customBgColor, showOriginal]);

  useEffect(() => {
    renderCutout();
  }, [renderCutout]);

  // Eyedropper click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode !== 'eyedropper' || !imgElement || !displayCanvasRef.current) return;
    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      // Sample original image pixel
      const sampleC = document.createElement('canvas');
      sampleC.width = imgElement.naturalWidth;
      sampleC.height = imgElement.naturalHeight;
      const sCtx = sampleC.getContext('2d', { willReadFrequently: true });
      if (sCtx) {
        sCtx.drawImage(imgElement, 0, 0);
        const p = sCtx.getImageData(x, y, 1, 1).data;
        setTargetColor({ r: p[0], g: p[1], b: p[2] });
        setSeedPoint({ x, y });
        setToolMode('auto'); // switch back after sampling
      }
    }
  };

  // Brush Painting (Erase / Restore)
  const applyBrushAt = (clientX: number, clientY: number) => {
    if (!imgElement || !displayCanvasRef.current || !brushMask) return;
    if (toolMode !== 'eraser' && toolMode !== 'restore') return;

    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = Math.floor((clientX - rect.left) * scaleX);
    const cy = Math.floor((clientY - rect.top) * scaleY);

    const w = canvas.width;
    const h = canvas.height;
    const radius = Math.max(1, Math.round(brushSize * (scaleX > 1 ? scaleX * 0.5 : 1)));
    const actionVal = toolMode === 'eraser' ? 1 : 2;

    const newMask = new Uint8Array(brushMask);
    const rSq = radius * radius;
    const minX = Math.max(0, cx - radius);
    const maxX = Math.min(w - 1, cx + radius);
    const minY = Math.max(0, cy - radius);
    const maxY = Math.min(h - 1, cy + radius);

    let changed = false;
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy <= rSq) {
          const idx = py * w + px;
          if (newMask[idx] !== actionVal) {
            newMask[idx] = actionVal;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      setBrushMask(newMask);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode === 'eraser' || toolMode === 'restore') {
      if (brushMask) {
        setMaskHistory((prev) => [...prev.slice(-9), new Uint8Array(brushMask)]);
      }
      isPaintingRef.current = true;
      applyBrushAt(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (isPaintingRef.current) {
      applyBrushAt(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isPaintingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (toolMode === 'eyedropper') {
        if (!imgElement || !displayCanvasRef.current) return;
        const canvas = displayCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((touch.clientX - rect.left) * scaleX);
        const y = Math.floor((touch.clientY - rect.top) * scaleY);
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const offscreen = document.createElement('canvas');
          offscreen.width = imgElement.naturalWidth;
          offscreen.height = imgElement.naturalHeight;
          const octx = offscreen.getContext('2d')!;
          octx.drawImage(imgElement, 0, 0);
          const pixel = octx.getImageData(x, y, 1, 1).data;
          setTargetColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
        }
      } else if (toolMode === 'eraser' || toolMode === 'restore') {
        if (brushMask) {
          setMaskHistory((prev) => [...prev.slice(-9), new Uint8Array(brushMask)]);
        }
        isPaintingRef.current = true;
        applyBrushAt(touch.clientX, touch.clientY);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isPaintingRef.current) {
      const touch = e.touches[0];
      applyBrushAt(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    isPaintingRef.current = false;
  };

  const handleUndo = () => {
    if (maskHistory.length > 0) {
      const last = maskHistory[maskHistory.length - 1];
      setBrushMask(last);
      setMaskHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleResetMask = () => {
    if (!imgElement) return;
    setBrushMask(new Uint8Array(imgElement.naturalWidth * imgElement.naturalHeight));
    setMaskHistory([]);
    setTargetColor(null);
  };

  // Export Download
  const handleDownload = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const options: BgRemovalOptions = {
        targetColor: targetColor || undefined,
        tolerance,
        feather,
        contiguous,
        defringe,
        brushMask: brushMask || undefined,
        backgroundColor: bgChoice === 'custom' ? customBgColor : bgChoice,
      };

      const finalCanvas = processBackgroundRemoval(imgElement, options);
      const isTransparent = bgChoice === 'transparent';
      const mime = isTransparent ? 'image/png' : 'image/jpeg';
      const ext = isTransparent ? 'png' : 'jpg';
      const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'photo';

      const blob = await canvasToBlob(finalCanvas, mime, 0.95);
      downloadImageBlob(blob, `${baseName}-cutout.${ext}`);
    } catch (err) {
      console.error(err);
      alert('Failed to export image.');
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
              <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                <Eraser className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Background Remover (Magic Cutout)
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                100% Client-Side
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Remove image backgrounds, key out colors, and paint with precision eraser & restore brushes.
            </p>
          </div>
        </div>

        {imgElement && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download Cutout ({bgChoice === 'transparent' ? 'PNG' : 'JPG'})</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      {!imgElement ? (
        /* Upload Area */
        <div className="max-w-2xl mx-auto py-12">
          <div className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-3xl p-8 sm:p-12 text-center bg-white shadow-xs transition-colors flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Drop photo here to remove background
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Works with portraits, selfies, product photography, signatures, and logos. Processed 100% privately in your browser.
            </p>

            <label className="cursor-pointer px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all">
              <span>Select Photo from Computer</span>
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
            {/* Tool Modes */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Tool Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setToolMode('auto')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                    toolMode === 'auto'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Wand2 className="w-4 h-4 text-orange-600" />
                  <span>Auto Magic</span>
                </button>

                <button
                  onClick={() => setToolMode('eyedropper')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                    toolMode === 'eyedropper'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Pipette className="w-4 h-4 text-blue-600" />
                  <span>Key Color</span>
                </button>

                <button
                  onClick={() => setToolMode('eraser')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                    toolMode === 'eraser'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Eraser className="w-4 h-4 text-rose-600" />
                  <span>Erase Brush</span>
                </button>

                <button
                  onClick={() => setToolMode('restore')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1 transition-all ${
                    toolMode === 'restore'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Paintbrush className="w-4 h-4 text-emerald-600" />
                  <span>Restore Brush</span>
                </button>
              </div>

              {toolMode === 'eyedropper' && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-center gap-2">
                  <Pipette className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Click anywhere on the image background to sample and key out that color.</span>
                </div>
              )}
            </div>

            {/* Sliders */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Sensitivity & Clean Cut
              </label>

              {/* Tolerance */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Color Tolerance:</span>
                  <span className="font-mono text-orange-600">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Higher values remove wider color variations and shadows.
                </span>
              </div>

              {/* Edge Feather */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Edge Feather (Smoothness):</span>
                  <span className="font-mono text-orange-600">{feather}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={feather}
                  onChange={(e) => setFeather(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              {/* Brush Size (if in brush modes) */}
              {(toolMode === 'eraser' || toolMode === 'restore') && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Brush Radius:</span>
                    <span className="font-mono text-orange-600">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={contiguous}
                    onChange={(e) => setContiguous(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span>Contiguous only (protect inside colors)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={defringe}
                    onChange={(e) => setDefringe(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span>De-fringe (remove edge halos)</span>
                </label>
              </div>

              {/* Undo / Reset */}
              {maskHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={handleUndo}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo Brush Stroke</span>
                  </button>
                  <button
                    onClick={handleResetMask}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>

            {/* Replace Background Color */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. New Background
              </label>

              <div className="grid grid-cols-4 gap-2">
                {PRESET_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => setBgChoice(bg.value)}
                    title={bg.label}
                    className={`h-10 rounded-xl border flex items-center justify-center transition-all ${bg.previewClass} ${
                      bgChoice === bg.value ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                    }`}
                  >
                    {bgChoice === bg.value && <CheckCircle2 className="w-4 h-4 text-orange-600 drop-shadow-sm" />}
                  </button>
                ))}

                {/* Custom Color Button */}
                <label
                  className={`h-10 rounded-xl border border-slate-300 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                    bgChoice === 'custom' ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: customBgColor }}
                  title="Pick Custom Color"
                >
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      setBgChoice('custom');
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                  <span className="text-[10px] font-bold text-slate-700 bg-white/80 px-1 py-0.5 rounded">Custom</span>
                </label>
              </div>
            </div>

            {/* Change Photo Button */}
            <label className="block text-center cursor-pointer py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors">
              <span>Upload Different Photo</span>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 active:bg-orange-50 active:border-orange-300 transition-colors"
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
              {/* Checkerboard Backdrop */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-300"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 100ms ease-out',
                }}
              >
                <div
                  className="w-full h-full absolute inset-0 -z-10"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                      linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                      linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#ffffff',
                  }}
                />

                <canvas
                  ref={displayCanvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`block max-w-none cursor-${
                    toolMode === 'eyedropper' ? 'crosshair' : toolMode === 'eraser' || toolMode === 'restore' ? 'cell' : 'default'
                  }`}
                  style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain', touchAction: 'none' }}
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
          background-size: 10px 10px;
          background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};
