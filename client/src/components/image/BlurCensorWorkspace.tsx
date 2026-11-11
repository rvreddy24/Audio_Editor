import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Download,
  Upload,
  ArrowLeft,
  Undo2,
  Trash2,
  Loader2,
  CheckCircle2,
  EyeOff,
} from 'lucide-react';
import {
  loadImage,
  canvasToBlob,
  blobToDataUrl,
  downloadImageBlob,
} from '../../utils/imageProcessor';

interface CensorBox {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'black' | 'blur' | 'pixelate';
}

interface BlurCensorWorkspaceProps {
  onBack: () => void;
}

export const BlurCensorWorkspace: React.FC<BlurCensorWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [censorType, setCensorType] = useState<'black' | 'blur' | 'pixelate'>('black');
  const [boxes, setBoxes] = useState<CensorBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setBoxes([]);
      setCurrentBox(null);
    }
  };

  // Re-draw canvas whenever imgElement, boxes, or currentBox change
  useEffect(() => {
    if (!imgElement || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // 1. Draw base photo
    ctx.drawImage(imgElement, 0, 0);

    // 2. Draw all applied censor boxes
    boxes.forEach((box) => {
      applyBoxEffect(ctx, canvas, box);
    });

    // 3. Draw active drawing box preview
    if (currentBox) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 400));
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
      ctx.setLineDash([]);
    }
  }, [imgElement, boxes, currentBox]);

  const applyBoxEffect = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, box: CensorBox) => {
    if (box.w <= 0 || box.h <= 0) return;

    if (box.type === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(box.x, box.y, box.w, box.h);
    } else if (box.type === 'pixelate') {
      const pxSize = Math.max(6, Math.round(Math.min(box.w, box.h) / 8));
      const tempC = document.createElement('canvas');
      tempC.width = Math.max(1, Math.round(box.w / pxSize));
      tempC.height = Math.max(1, Math.round(box.h / pxSize));
      const tCtx = tempC.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, tempC.width, tempC.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempC, 0, 0, tempC.width, tempC.height, box.x, box.y, box.w, box.h);
        ctx.imageSmoothingEnabled = true;
      }
    } else if (box.type === 'blur') {
      // Gaussian Blur simulation on region
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();
      ctx.filter = 'blur(16px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const coords = getCanvasCoords(e);
    const x = Math.min(drawStart.x, coords.x);
    const y = Math.min(drawStart.y, coords.y);
    const w = Math.abs(coords.x - drawStart.x);
    const h = Math.abs(coords.y - drawStart.y);
    setCurrentBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox && currentBox.w > 5 && currentBox.h > 5) {
      setBoxes((prev) => [...prev, { ...currentBox, type: censorType }]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentBox(null);
  };

  const handleDownload = async () => {
    if (!canvasRef.current || !selectedFile) return;
    // Export without draft line
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;
    const eCtx = exportCanvas.getContext('2d')!;
    if (imgElement) eCtx.drawImage(imgElement, 0, 0);
    boxes.forEach((b) => applyBoxEffect(eCtx, exportCanvas, b));

    const blob = await canvasToBlob(exportCanvas, 'image/jpeg', 0.95);
    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
    downloadImageBlob(blob, `${base}_censored.jpg`);
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
          <ShieldAlert className="w-7 h-7 text-rose-600" />
          <span>Blur & Censor Private Info</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Conceal faces, addresses, phone numbers, ID cards, and sensitive document details with blur, pixelate, or black censor bars.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-rose-500 bg-white hover:bg-rose-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Censor
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports Documents, ID Cards, Photos • 100% Client-Side Privacy
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Censor Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'black' as const, label: 'Black Bar' },
                  { id: 'blur' as const, label: 'Blur' },
                  { id: 'pixelate' as const, label: 'Pixelate' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCensorType(t.id)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                      censorType === t.id
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                disabled={boxes.length === 0}
                onClick={() => setBoxes((prev) => prev.slice(0, -1))}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                disabled={boxes.length === 0}
                onClick={() => setBoxes([])}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                <span>How to censor:</span>
              </p>
              <p>Click and drag your mouse across any sensitive area (face, address, credit card) on the photo to censor it.</p>
              <p className="text-[11px] font-bold text-rose-700 pt-1">
                Active Redactions: {boxes.length} regions
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleDownload}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Censored Image</span>
              </button>

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors mt-1">
                Choose another image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Interactive Canvas Workspace */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
              <span>Interactive Censor Canvas (Drag to redact)</span>
              <span className="text-[11px] text-slate-400">
                {imgElement?.naturalWidth} × {imgElement?.naturalHeight} px
              </span>
            </div>

            <div className="max-h-[500px] max-w-full overflow-auto rounded-2xl border border-slate-300 p-1 bg-slate-100 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="max-h-[480px] max-w-full h-auto w-auto object-contain cursor-crosshair select-none shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
