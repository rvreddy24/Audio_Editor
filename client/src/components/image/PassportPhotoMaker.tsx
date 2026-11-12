import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  Printer,
  Move,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  CheckCircle2,
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

  // Name & Date stamp (Mandatory for SSC/UPSC)
  const [stampNameDate, setStampNameDate] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('');
  const [dateOfPhoto, setDateOfPhoto] = useState<string>(new Date().toISOString().split('T')[0]);

  // Adjusters
  const [zoom, setZoom] = useState<number>(1.1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  // Mouse / Touch drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number } | null>(null);

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
      setZoom(1.1);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setSingleResult(null);
      setSheetResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const single = await createPassportPhoto(imgElement, {
        country,
        bgColor,
        zoom,
        panX,
        panY,
        rotation,
        candidateName: stampNameDate ? candidateName : undefined,
        dateOfPhoto: stampNameDate ? dateOfPhoto : undefined,
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
  }, [
    imgElement,
    country,
    bgColor,
    zoom,
    panX,
    panY,
    rotation,
    sheetLayout,
    sheetPaper,
    stampNameDate,
    candidateName,
    dateOfPhoto,
  ]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: panX,
      initialPanY: panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const spec = PASSPORT_SPECS[country];
    const wPx = Math.round((spec.widthMm / 25.4) * (spec.dpi || 300));
    const scaleFactor = wPx / 256;
    setPanX(Math.round(dragStartRef.current.initialPanX + dx * scaleFactor));
    setPanY(Math.round(dragStartRef.current.initialPanY + dy * scaleFactor));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialPanX: panX,
        initialPanY: panY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    const spec = PASSPORT_SPECS[country];
    const wPx = Math.round((spec.widthMm / 25.4) * (spec.dpi || 300));
    const scaleFactor = wPx / 256;
    setPanX(Math.round(dragStartRef.current.initialPanX + dx * scaleFactor));
    setPanY(Math.round(dragStartRef.current.initialPanY + dy * scaleFactor));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleNudge = (dx: number, dy: number) => {
    setPanX((p) => p + dx);
    setPanY((p) => p + dy);
  };

  const handleResetAll = () => {
    setZoom(1.1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  };

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
          Create compliant passport and visa photos with standard dimensions, interactive manual position adjusters, and print-ready multi-photo sheets.
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
              Supports selfies & camera photos • Interactive zoom, drag pan & background tint
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

            {/* Candidate Name & Date of Photo (DoP) Stamp */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Stamp Candidate Name & Date (DoP)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Required for SSC, UPSC, and Indian competitive exams
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={stampNameDate}
                  onChange={(e) => setStampNameDate(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </label>

              {stampNameDate && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                      Candidate Name
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="e.g. RAJESH SHARMA"
                      className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                      Date of Photo
                    </label>
                    <input
                      type="date"
                      value={dateOfPhoto}
                      onChange={(e) => setDateOfPhoto(e.target.value)}
                      className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Manual Adjusters Suite */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Position & Alignment Adjusters</span>
                </span>
                <button
                  onClick={handleResetAll}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  Reset All
                </button>
              </div>

              {/* 1. Vertical Adjuster (Move Up / Down) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Move className="w-3 h-3 text-blue-600 rotate-90" />
                    <span>Vertical Position (Up / Down)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {panY > 0 ? `+${panY}px (Down)` : panY < 0 ? `${panY}px (Up)` : 'Centered'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNudge(0, -20)}
                    title="Move Up"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    step="5"
                    value={panY}
                    onChange={(e) => setPanY(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <button
                    onClick={() => handleNudge(0, 20)}
                    title="Move Down"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. Horizontal Adjuster (Move Left / Right) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Move className="w-3 h-3 text-blue-600" />
                    <span>Horizontal Position (Left / Right)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {panX > 0 ? `+${panX}px (Right)` : panX < 0 ? `${panX}px (Left)` : 'Centered'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNudge(-20, 0)}
                    title="Move Left"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    step="5"
                    value={panX}
                    onChange={(e) => setPanX(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <button
                    onClick={() => handleNudge(20, 0)}
                    title="Move Right"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3. Head Framing & Zoom */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>Head Framing & Zoom</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.7, Math.round((z - 0.1) * 100) / 100))}
                    title="Zoom Out"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.7"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <button
                    onClick={() => setZoom((z) => Math.min(3.0, Math.round((z + 0.1) * 100) / 100))}
                    title="Zoom In"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4. Straighten & Tilt Angle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Straighten & Tilt Angle</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {rotation > 0 ? `+${rotation}°` : `${rotation}°`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotation((r) => Math.max(-15, r - 1))}
                    title="Rotate Counter-Clockwise"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={rotation}
                    onChange={(e) => setRotation(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <button
                    onClick={() => setRotation((r) => Math.min(15, r + 1))}
                    title="Rotate Clockwise"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Directional Nudge Pad & Center */}
              <div className="pt-2 flex items-center justify-between">
                <div className="grid grid-cols-3 gap-1 w-24">
                  <div />
                  <button
                    onClick={() => handleNudge(0, -25)}
                    title="Move Up"
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-400 text-slate-700 flex items-center justify-center font-bold shadow-2xs transition-colors"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    onClick={() => handleNudge(-25, 0)}
                    title="Move Left"
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-400 text-slate-700 flex items-center justify-center font-bold shadow-2xs transition-colors"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => {
                      setPanX(0);
                      setPanY(0);
                    }}
                    title="Center Photo"
                    className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shadow-2xs transition-colors"
                  >
                    ●
                  </button>
                  <button
                    onClick={() => handleNudge(25, 0)}
                    title="Move Right"
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-400 text-slate-700 flex items-center justify-center font-bold shadow-2xs transition-colors"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    onClick={() => handleNudge(0, 25)}
                    title="Move Down"
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-400 text-slate-700 flex items-center justify-center font-bold shadow-2xs transition-colors"
                  >
                    ▼
                  </button>
                  <div />
                </div>

                <div className="text-right space-y-1">
                  <button
                    onClick={() => {
                      setPanX(0);
                      setPanY(0);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline block"
                  >
                    Center Position
                  </button>
                  <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer justify-end">
                    <input
                      type="checkbox"
                      checked={showFaceGuide}
                      onChange={(e) => setShowFaceGuide(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span>Face Guide Oval</span>
                  </label>
                </div>
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
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Single Passport Photo Preview</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {PASSPORT_SPECS[country].widthMm} × {PASSPORT_SPECS[country].heightMm} mm (300 DPI)
                </span>
              </div>

              {/* Interactive Drag Reposition Canvas / Preview */}
              <div
                style={{
                  width: '256px',
                  height: `${Math.min(340, Math.max(256, Math.round(256 / (PASSPORT_SPECS[country].widthMm / PASSPORT_SPECS[country].heightMm))))}px`,
                }}
                className={`relative rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm flex items-center justify-center bg-slate-100 select-none transition-shadow ${
                  isDragging ? 'cursor-grabbing ring-2 ring-blue-500' : 'cursor-grab hover:border-blue-400'
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                title="Click and drag to position face inside the oval"
              >
                {singleResult ? (
                  <img
                    src={singleResult.dataUrl}
                    alt="Passport photo"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                )}

                {/* Face Guide Oval Overlay */}
                {showFaceGuide && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-48 border-2 border-dashed border-blue-500/80 rounded-[50%] flex flex-col items-center justify-between py-4 shadow-sm bg-blue-50/10">
                      <span className="text-[9px] font-bold text-blue-600 bg-white/90 px-1.5 py-0.5 rounded shadow-2xs">
                        Top of Head
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 bg-white/90 px-1.5 py-0.5 rounded shadow-2xs">
                        Chin Line
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Helpful Hint under preview */}
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5 mt-3">
                <Move className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Click & drag photo or use sliders to align head between guidelines</span>
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
