import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  Printer,
  Grid,
  CheckCircle2,
  Sparkles,
  Palette,
} from 'lucide-react';
import {
  loadImage,
  createPassportPhoto,
  generatePrintableSheet,
  downloadImageBlob,
  PASSPORT_SPECS,
} from '../../utils/imageProcessor';

interface PassportPhotoMakerProps {
  onBack?: () => void;
}

export const PassportPhotoMaker: React.FC<PassportPhotoMakerProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [country, setCountry] = useState<keyof typeof PASSPORT_SPECS>('india');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  // Printable sheet mode
  const [sheetLayout, setSheetLayout] = useState<4 | 6 | 8 | 12>(6);
  const [sheetPaper, setSheetPaper] = useState<'4x6' | 'a4'>('4x6');

  const [isProcessing, setIsProcessing] = useState(false);
  const [singleResult, setSingleResult] = useState<{
    blob: Blob;
    dataUrl: string;
    widthPx: number;
    heightPx: number;
  } | null>(null);
  const [sheetResult, setSheetResult] = useState<{
    blob: Blob;
    dataUrl: string;
  } | null>(null);

  const bgColors = [
    { label: 'Pure White', hex: '#FFFFFF' },
    { label: 'Light Blue', hex: '#E0F2FE' },
    { label: 'Studio Red', hex: '#FEE2E2' },
    { label: 'Light Grey', hex: '#F3F4F6' },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setSingleResult(null);
      setSheetResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      // Calculate crop rect considering zoom and pan
      const srcW = imgElement.naturalWidth;
      const srcH = imgElement.naturalHeight;
      const spec = PASSPORT_SPECS[country];
      const targetRatio = spec.widthMm / spec.heightMm;

      let baseW = srcW;
      let baseH = srcH;
      if (srcW / srcH > targetRatio) {
        baseW = srcH * targetRatio;
      } else {
        baseH = srcW / targetRatio;
      }

      // Apply zoom
      const cropW = baseW / zoom;
      const cropH = baseH / zoom;
      const cropX = Math.max(0, Math.min(srcW - cropW, (srcW - cropW) / 2 + panX));
      const cropY = Math.max(0, Math.min(srcH - cropH, (srcH - cropH) / 2 + panY));

      const single = await createPassportPhoto(imgElement, {
        country,
        bgColor,
        crop: { x: cropX, y: cropY, width: cropW, height: cropH },
      });
      setSingleResult(single);

      // Also generate sheet
      const singleImg = await loadImage(single.dataUrl);
      const sheet = await generatePrintableSheet(singleImg, sheetPaper, sheetLayout);
      setSheetResult(sheet);
    } catch (err: any) {
      alert(`Error creating passport photo: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, country, bgColor, zoom, panX, panY, sheetLayout, sheetPaper]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
          <UserCheck className="w-7 h-7 text-blue-600" />
          <span>Passport Size Photo Maker</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Create compliant passport and visa photos with standard dimensions (India, US, UK, Schengen) and print-ready multi-photo sheets.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop Your Portrait Photo
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports selfies & camera photos • Automatic centering & background adjustment
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            {/* Country Standard */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Passport / Visa Standard
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as any)}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PASSPORT_SPECS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name} ({v.widthMm} × {v.heightMm} mm)
                  </option>
                ))}
              </select>
            </div>

            {/* Background Color Picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Background Tint
              </label>
              <div className="grid grid-cols-4 gap-2">
                {bgColors.map((bg) => (
                  <button
                    key={bg.hex}
                    onClick={() => setBgColor(bg.hex)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      bgColor === bg.hex
                        ? 'border-blue-600 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: bg.hex }}
                    />
                    <span className="text-[10px] text-slate-600">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Framing & Zoom Controls */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Head Framing & Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs text-slate-600 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFaceGuide}
                    onChange={(e) => setShowFaceGuide(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>Show Face Guide Oval</span>
                </label>
                <button
                  onClick={() => {
                    setZoom(1);
                    setPanX(0);
                    setPanY(0);
                  }}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  Reset framing
                </button>
              </div>
            </div>

            {/* Printable Sheet Configuration */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Printable Sheet Grid</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {([4, 6, 8, 12] as const).map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setSheetLayout(cnt)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      sheetLayout === cnt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cnt} Photos
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                disabled={!singleResult || isProcessing}
                onClick={() => {
                  if (singleResult) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(singleResult.blob, `${base}_passport_${country}.jpg`);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Single Passport Photo</span>
              </button>

              <button
                disabled={!sheetResult || isProcessing}
                onClick={() => {
                  if (sheetResult) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(sheetResult.blob, `${base}_printable_sheet_${sheetLayout}photos.jpg`);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-xs shadow-xs transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download {sheetLayout}-Photo Printable Sheet (4×6")</span>
              </button>

              <label className="w-full block text-center py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors">
                Choose another photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Previews Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Single Photo Preview with Face Guide Overlay */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center">
              <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
                <span>Single Passport Photo</span>
                <span className="text-[11px] text-slate-400">
                  {PASSPORT_SPECS[country].widthMm} × {PASSPORT_SPECS[country].heightMm} mm (300 DPI)
                </span>
              </div>

              <div className="relative w-64 h-80 rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm flex items-center justify-center bg-slate-100">
                {singleResult ? (
                  <img
                    src={singleResult.dataUrl}
                    alt="Passport photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                )}

                {/* Face Guide Oval Overlay */}
                {showFaceGuide && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-48 border-2 border-dashed border-blue-500/80 rounded-[50%] flex flex-col items-center justify-between py-4 shadow-sm">
                      <span className="text-[9px] font-bold text-blue-600 bg-white/80 px-1 rounded">
                        Top of Head
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 bg-white/80 px-1 rounded">
                        Chin Line
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Printable Sheet Preview */}
            {sheetResult && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center">
                <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
                  <span>Printable Photographic Sheet (Ready to print on 4×6 photo paper)</span>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    {sheetLayout} Copies
                  </span>
                </div>

                <div className="max-w-md w-full border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <img
                    src={sheetResult.dataUrl}
                    alt="Printable photo sheet"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
