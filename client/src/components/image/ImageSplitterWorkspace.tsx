import React, { useState, useEffect } from 'react';
import {
  Grid,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  Package,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  loadImage,
  splitImageGrid,
  downloadImageBlob,
} from '../../utils/imageProcessor';

interface ImageSplitterWorkspaceProps {
  onBack: () => void;
}

export const ImageSplitterWorkspace: React.FC<ImageSplitterWorkspaceProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [cols, setCols] = useState<number>(3);
  const [rows, setRows] = useState<number>(3);

  const [isProcessing, setIsProcessing] = useState(false);
  const [pieces, setPieces] = useState<Array<{ col: number; row: number; blob: Blob; dataUrl: string }>>([]);

  const gridPresets = [
    { label: 'Instagram 3×3 Grid', c: 3, r: 3 },
    { label: 'Instagram 3×2 Grid', c: 3, r: 2 },
    { label: 'Panorama 3×1', c: 3, r: 1 },
    { label: 'Square 2×2', c: 2, r: 2 },
    { label: 'Vertical 1×3 Slices', c: 1, r: 3 },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setPieces([]);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const res = await splitImageGrid(imgElement, cols, rows);
      setPieces(res);
    } catch (err: any) {
      alert(`Split error: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, cols, rows]);

  const handleDownloadAllZip = async () => {
    if (pieces.length === 0 || !selectedFile) return;
    const zip = new JSZip();
    const base = selectedFile.name.replace(/\.[^/.]+$/, '');

    pieces.forEach((p, idx) => {
      zip.file(`${base}_row${p.row}_col${p.col}.jpg`, p.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadImageBlob(zipBlob, `${base}_split_${cols}x${rows}_grid.zip`);
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
          <Grid className="w-7 h-7 text-indigo-600" />
          <span>Image Splitter & Instagram Grid</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Split photos into 3×3 Instagram profile grids, panorama carousels, or multi-panel photo slices with one-click ZIP download.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop an Image to Split
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports High-Res Photos • Download slices as individual files or ZIP
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Popular Grid Layouts
              </label>
              <div className="grid grid-cols-2 gap-2">
                {gridPresets.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => {
                      setCols(g.c);
                      setRows(g.r);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                      cols === g.c && rows === g.r
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Grid Dimensions */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Columns (Vertical)
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rows (Horizontal)
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                disabled={pieces.length === 0 || isProcessing}
                onClick={handleDownloadAllZip}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Splitting image...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    <span>Download All ({pieces.length} Pieces) as ZIP</span>
                  </>
                )}
              </button>

              <label className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors">
                Choose another image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Slices Preview */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center">
            <div className="text-xs font-bold text-slate-700 mb-4 flex items-center justify-between w-full">
              <span>Grid Slices ({cols} × {rows} = {pieces.length} Parts)</span>
              <span className="text-[11px] text-slate-400">Click any part to download individually</span>
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">Generating slices...</span>
              </div>
            ) : pieces.length > 0 ? (
              <div
                className="grid gap-1.5 p-2 bg-slate-100 rounded-2xl max-w-full overflow-auto border border-slate-300"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {pieces.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const base = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'part';
                      downloadImageBlob(p.blob, `${base}_part_${idx + 1}.jpg`);
                    }}
                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-300 hover:ring-2 hover:ring-indigo-500 transition-all aspect-square bg-white flex items-center justify-center"
                    title={`Download Part ${idx + 1}`}
                  >
                    <img
                      src={p.dataUrl}
                      alt={`Part ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold">
                      <Download className="w-4 h-4 mb-1" />
                      <span>Part #{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
