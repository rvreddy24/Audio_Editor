import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Type,
  Upload,
  X,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';
import { SavedSignature } from './types';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (sig: SavedSignature) => void;
}

type Tab = 'draw' | 'type' | 'upload';

const INK_COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'Navy Blue', hex: '#1e40af' },
  { name: 'Classic Red', hex: '#991b1b' },
];

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('draw');
  const [selectedColor, setSelectedColor] = useState<string>('#111827');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Type signature state
  const [typedName, setTypedName] = useState<string>('');
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number>(0);

  // Upload state
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      clearDrawCanvas();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // --- DRAWING HANDLERS ---
  const clearDrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    lastPoint.current = null;
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getCanvasCoordinates(e);
    lastPoint.current = pos;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = selectedColor;
    ctx.fill();
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getCanvasCoordinates(e);

    // Smooth quadratic curve interpolation
    const midPoint = {
      x: (lastPoint.current.x + currentPos.x) / 2,
      y: (lastPoint.current.y + currentPos.y) / 2,
    };

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midPoint.x, midPoint.y);
    ctx.stroke();

    lastPoint.current = currentPos;
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  // --- TYPE CALLIGRAPHY STYLES ---
  const typeStyles = [
    { name: 'Formal Script', font: "italic bold 38px 'Brush Script MT', 'Great Vibes', cursive" },
    { name: 'Elegant Flow', font: "italic 36px 'Segoe Script', 'Dancing Script', cursive" },
    { name: 'Modern Signature', font: "bold 34px 'Snell Roundhand', 'Caveat', cursive" },
    { name: 'Classic Quill', font: "italic 32px 'Lucida Handwriting', 'Pacifico', cursive" },
  ];

  const generateTypedSignaturePng = (text: string, styleFont: string, color: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = styleFont;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Add mild calligraphic flourish underline
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 8);

    // Draw flourish stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const startX = canvas.width / 2 - textWidth / 2 - 10;
    const endX = canvas.width / 2 + textWidth / 2 + 20;
    const y = canvas.height / 2 + 22;
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(startX + 30, y - 6, endX - 30, y + 6, endX, y - 2);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  };

  // --- UPLOAD HANDLER WITH AUTO-TRANSPARENT BACKGROUND ---
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a PNG or JPEG image file.');
      return;
    }
    setUploadError('');

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        // Auto remove white paper background
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If close to white paper background, make transparent
          if (r > 220 && g > 220 && b > 220) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setUploadedDataUrl(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- SAVE & DISPATCH SIGNATURE ---
  const handleSave = () => {
    let dataUrl = '';

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      dataUrl = canvas.toDataURL('image/png');
    } else if (activeTab === 'type') {
      if (!typedName.trim()) return;
      dataUrl = generateTypedSignaturePng(
        typedName.trim(),
        typeStyles[selectedStyleIndex].font,
        selectedColor
      );
    } else if (activeTab === 'upload') {
      if (!uploadedDataUrl) return;
      dataUrl = uploadedDataUrl;
    }

    if (dataUrl) {
      onSaveSignature({
        id: `sig-${Date.now()}`,
        title: activeTab === 'type' ? typedName : `Signature (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        dataUrl,
        createdAt: Date.now(),
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Signature</h3>
              <p className="text-xs text-slate-500">Draw, type, or upload your official signature</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'draw'
                ? 'bg-white text-violet-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'type'
                ? 'bg-white text-violet-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Name</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-violet-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Ink & Style Control Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Ink Color:</span>
            <div className="flex items-center gap-1.5">
              {INK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedColor === c.hex ? 'scale-115 border-violet-600 ring-2 ring-violet-200' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {activeTab === 'draw' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Stroke:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                {[
                  { label: 'Fine', width: 2 },
                  { label: 'Med', width: 3.5 },
                  { label: 'Bold', width: 5 },
                ].map((s) => (
                  <button
                    key={s.width}
                    onClick={() => setStrokeWidth(s.width)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      strokeWidth === s.width ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Content Area */}
        <div className="p-6">
          {/* TAB 1: DRAW CANVAS */}
          {activeTab === 'draw' && (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden cursor-crosshair group hover:border-violet-400 transition-colors">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={180}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  className="w-full h-44 touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none">
                    <PenTool className="w-5 h-5 mb-1 opacity-60 text-slate-400" />
                    <span className="text-xs font-medium">Draw your signature with mouse, stylus, or finger</span>
                  </div>
                )}
                {hasDrawn && (
                  <button
                    onClick={clearDrawCanvas}
                    className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-white text-slate-600 hover:text-red-600 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Sign smoothly inside the box. Your signature will be scaled cleanly.
              </p>
            </div>
          )}

          {/* TAB 2: TYPE NAME */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Full Name or Initials
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Sai Harshith Reddy"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Calligraphy Style
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {typeStyles.map((style, idx) => (
                    <div
                      key={style.name}
                      onClick={() => setSelectedStyleIndex(idx)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-24 ${
                        selectedStyleIndex === idx
                          ? 'border-violet-600 bg-violet-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {style.name}
                      </span>
                      <div
                        className="truncate text-xl my-auto"
                        style={{
                          fontFamily: style.font.split(' ').slice(2).join(' '),
                          color: selectedColor,
                        }}
                      >
                        {typedName.trim() || 'Your Signature'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {!uploadedDataUrl ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-2xl bg-slate-50 p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    Click to browse or drop signature image
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Supports PNG or JPG (paper background auto-removed)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between">
                  <div className="h-16 max-w-[280px] p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img src={uploadedDataUrl} alt="Signature preview" className="max-h-full object-contain" />
                  </div>
                  <button
                    onClick={() => setUploadedDataUrl('')}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              {uploadError && (
                <p className="text-xs font-semibold text-red-600">{uploadError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              (activeTab === 'draw' && !hasDrawn) ||
              (activeTab === 'type' && !typedName.trim()) ||
              (activeTab === 'upload' && !uploadedDataUrl)
            }
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Stamp Signature Onto PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
