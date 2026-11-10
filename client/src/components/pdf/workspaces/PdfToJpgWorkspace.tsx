import React, { useState } from 'react';
import {
  Download,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Archive,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import {
  parsePdfFile,
  convertPdfToImagesZip,
  downloadBlob,
  downloadBytes,
  PdfFileInfo,
} from '../../../utils/pdfOperations';
import { renderAllPagesToImages } from '../../../utils/pdfRenderer';

interface RenderedImage {
  pageNum: number;
  dataUrl: string;
  blob: Blob;
}

interface PdfToJpgWorkspaceProps {
  onBack: () => void;
}

export const PdfToJpgWorkspace: React.FC<PdfToJpgWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [images, setImages] = useState<RenderedImage[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const parsed = await parsePdfFile(files[0]);
    setFile(parsed);
    setIsExtracting(true);

    try {
      const extracted = await renderAllPagesToImages(parsed.data, 2.0);
      setImages(extracted);
    } catch (err: any) {
      alert('Failed to render PDF pages: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!file) return;
    setIsZipping(true);
    try {
      const zipBlob = await convertPdfToImagesZip(file.data, file.name);
      downloadBlob(zipBlob, `${file.name.replace(/\.pdf$/i, '')}_images.zip`);
    } catch (err: any) {
      alert('Failed to generate ZIP: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingle = (img: RenderedImage) => {
    if (!file) return;
    downloadBlob(img.blob, `${file.name.replace(/\.pdf$/i, '')}_page_${img.pageNum}.jpg`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All PDF Tools</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          PDF to JPG
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Convert each PDF page into high-resolution JPG images in seconds.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Select PDF file"
          buttonLabel="Select PDF file"
        />
      ) : isExtracting ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <h3 className="text-sm font-bold text-slate-900">Rendering high-res JPG images...</h3>
          <p className="text-xs text-slate-400">Processing {file.pageCount} pages</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top action bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{file.name}</h3>
              <p className="text-xs text-slate-400">{images.length} pages converted to JPG</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={isZipping}
                onClick={handleDownloadZip}
                className="bg-[#e5322d] hover:bg-[#d02824] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
              >
                {isZipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                <span>Download All as ZIP</span>
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setImages([]);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-2"
              >
                Convert another
              </button>
            </div>
          </div>

          {/* Grid of converted image cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.pageNum}
                className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex flex-col justify-between group hover:border-slate-300 transition-all"
              >
                <div className="h-56 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100">
                  <img
                    src={img.dataUrl}
                    alt={`Page ${img.pageNum}`}
                    className="h-full object-contain shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 mt-1">
                  <span className="text-xs font-bold text-slate-700">Page {img.pageNum}</span>
                  <button
                    onClick={() => handleDownloadSingle(img)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#e5322d] hover:text-white text-slate-600 transition-colors text-xs flex items-center gap-1"
                    title="Download this page"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JPG</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
