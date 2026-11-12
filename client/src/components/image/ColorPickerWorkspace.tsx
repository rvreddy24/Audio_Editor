import React, { useState, useRef, useEffect } from 'react';
import {
  Pipette,
  Upload,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import { loadImage } from '../../utils/imageProcessor';

interface ColorPickerWorkspaceProps {
  onBack: () => void;
}

export const ColorPickerWorkspace: React.FC<ColorPickerWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [pickedColor, setPickedColor] = useState<{
    hex: string;
    rgb: string;
    hsl: string;
  }>({ hex: '#3B82F6', rgb: 'rgb(59, 130, 246)', hsl: 'hsl(217, 91%, 60%)' });

  const [hoverColor, setHoverColor] = useState<string>('#3B82F6');
  const [history, setHistory] = useState<string[]>([]);
  const [palette, setPalette] = useState<string[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
    }
  };

  useEffect(() => {
    if (!imgElement || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(imgElement, 0, 0);

    // Extract dominant palette
    try {
      const thumb = document.createElement('canvas');
      thumb.width = 64;
      thumb.height = 64;
      const tCtx = thumb.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(imgElement, 0, 0, 64, 64);
        const data = tCtx.getImageData(0, 0, 64, 64).data;
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = Math.round(data[i] / 16) * 16;
          const g = Math.round(data[i + 1] / 16) * 16;
          const b = Math.round(data[i + 2] / 16) * 16;
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
        const sorted = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([hex]) => hex)
          .slice(0, 8);
        setPalette(sorted);
      }
    } catch (e) {
      console.warn('Failed to extract palette:', e);
    }
  }, [imgElement]);

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const getColorAtCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = Math.min(
      canvasRef.current.width - 1,
      Math.max(0, Math.floor((clientX - rect.left) * scaleX))
    );
    const y = Math.min(
      canvasRef.current.height - 1,
      Math.max(0, Math.floor((clientY - rect.top) * scaleY))
    );

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const p = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase()}`;
    const rgb = `rgb(${p[0]}, ${p[1]}, ${p[2]})`;
    const hsl = rgbToHsl(p[0], p[1], p[2]);
    return { hex, rgb, hsl };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const col = getColorAtCoords(e.clientX, e.clientY);
    if (col) setHoverColor(col.hex);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const col = getColorAtCoords(e.clientX, e.clientY);
    if (col) {
      setPickedColor(col);
      setHistory((prev) => Array.from(new Set([col.hex, ...prev])).slice(0, 16));
    }
  };

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const col = getColorAtCoords(e.touches[0].clientX, e.touches[0].clientY);
      if (col) {
        setHoverColor(col.hex);
        setPickedColor(col);
        setHistory((prev) => Array.from(new Set([col.hex, ...prev])).slice(0, 16));
      }
    }
  };

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
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
          <Pipette className="w-7 h-7 text-indigo-600" />
          <span>Image Color Picker (Eyedropper)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Hover and click on any pixel to extract exact HEX, RGB, and HSL color values with one-click clipboard copying.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Pick Colors
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP • Extract exact pixel hex codes instantly
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Active Color & Palette */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Selected Color Swatch
              </span>
              <div
                className="w-full h-28 rounded-2xl shadow-inner border border-slate-300 transition-colors flex items-end p-3"
                style={{ backgroundColor: pickedColor.hex }}
              >
                <span className="text-xs font-mono font-black text-white drop-shadow-md bg-black/40 px-2 py-0.5 rounded-md">
                  {pickedColor.hex}
                </span>
              </div>
            </div>

            {/* Code Values */}
            <div className="space-y-2">
              {[
                { label: 'HEX', val: pickedColor.hex },
                { label: 'RGB', val: pickedColor.rgb },
                { label: 'HSL', val: pickedColor.hsl },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      {item.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {item.val}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.val, item.label)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    {copiedFormat === item.label ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Dominant Image Palette */}
            {palette.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Dominant Color Palette
                </span>
                <div className="flex flex-wrap gap-2">
                  {palette.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => {
                        const rgbObj = hexToRgb(hex);
                        const rgbStr = `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`;
                        const hslStr = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
                        setPickedColor({
                          hex,
                          rgb: rgbStr,
                          hsl: hslStr,
                        });
                      }}
                      title={`Select ${hex}`}
                      className="w-8 h-8 rounded-lg border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Palette History */}
            {history.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Picked Color History ({history.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {history.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => {
                        const rgbObj = hexToRgb(hex);
                        const rgbStr = `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`;
                        const hslStr = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
                        setPickedColor({
                          hex,
                          rgb: rgbStr,
                          hsl: hslStr,
                        });
                      }}
                      title={`Select ${hex}`}
                      className="w-8 h-8 rounded-lg border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors pt-2">
              Choose another image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Right Column: Interactive Canvas */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
              <span>Click or touch any pixel to pick color</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Hovering:</span>
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 inline-block"
                  style={{ backgroundColor: hoverColor }}
                />
                <span className="text-xs font-mono font-bold text-slate-700">{hoverColor}</span>
              </div>
            </div>

            <div className="max-h-[500px] max-w-full overflow-auto rounded-2xl border border-slate-300 p-1 bg-slate-100 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onTouchStart={handleTouch}
                onTouchMove={handleTouch}
                style={{ touchAction: 'none' }}
                className="max-h-[480px] max-w-full h-auto w-auto object-contain cursor-crosshair shadow-xs select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
