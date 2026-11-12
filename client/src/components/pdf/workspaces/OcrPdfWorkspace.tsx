import React, { useState } from 'react';
import {
  Download,
  Loader2,
  ArrowLeft,
  ScanText,
  Copy,
  Check,
  FileText,
  Zap,
} from 'lucide-react';
import { PdfDropzone } from '../PdfDropzone';
import { parsePdfFile, PdfFileInfo, downloadBlob } from '../../../utils/pdfOperations';
import { renderPdfPageToDataUrl, extractPdfTextPages } from '../../../utils/pdfRenderer';

interface OcrPdfWorkspaceProps {
  onBack: () => void;
}

export const OcrPdfWorkspace: React.FC<OcrPdfWorkspaceProps> = ({ onBack }) => {
  const [file, setFile] = useState<PdfFileInfo | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [ocrMode, setOcrMode] = useState<'single' | 'all'>('single');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const parsed = await parsePdfFile(files[0]);
      setFile(parsed);
      setSelectedPage(1);
      setRecognizedText('');
    }
  };

  const handleFastExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pages = await extractPdfTextPages(file.data);
      if (ocrMode === 'single') {
        const text = pages[selectedPage - 1] || '';
        setRecognizedText(text || 'No digital text found on this page. Please use Deep OCR below.');
      } else {
        const fullText = pages.map((t, idx) => `--- Page ${idx + 1} ---\n${t}`).join('\n\n');
        setRecognizedText(fullText || 'No digital text found in document. Please use Deep OCR below.');
      }
    } catch (err: any) {
      alert('Text extraction error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      setProgress(25);

      if (ocrMode === 'single') {
        const imageUrl = await renderPdfPageToDataUrl(file.data, selectedPage, 1.8);
        setProgress(50);
        const ret = await worker.recognize(imageUrl);
        setProgress(90);
        setRecognizedText(ret.data.text || 'No text recognized on this page.');
      } else {
        const pagesToScan = Math.min(5, file.pageCount);
        let accumulated = '';
        for (let p = 1; p <= pagesToScan; p++) {
          setProgress(Math.round(25 + (p / pagesToScan) * 65));
          const imageUrl = await renderPdfPageToDataUrl(file.data, p, 1.6);
          const ret = await worker.recognize(imageUrl);
          accumulated += `--- Page ${p} ---\n${ret.data.text || ''}\n\n`;
        }
        setRecognizedText(accumulated);
      }

      await worker.terminate();
      setProgress(100);
    } catch (err: any) {
      alert('OCR error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recognizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([recognizedText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${file?.name.replace(/\.pdf$/i, '')}_ocr.txt`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
          OCR PDF Text Recognition
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Optical Character Recognition to extract text from scanned images and documents.
        </p>
      </div>

      {!file ? (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Select PDF or Image"
          buttonLabel="Select PDF file"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center">
            <div className="w-56 h-76 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt="Preview" className="h-full object-contain" />
              ) : (
                <FileText className="w-20 h-20 text-slate-300" />
              )}
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm truncate max-w-sm">{file.name}</h3>

            <div className="flex flex-col gap-3 mt-4 w-full max-w-xs">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-semibold">Target Pages:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setOcrMode('single')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      ocrMode === 'single'
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Page {selectedPage}
                  </button>
                  <button
                    onClick={() => setOcrMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      ocrMode === 'all'
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({file.pageCount})
                  </button>
                </div>
              </div>

              {ocrMode === 'single' && file.pageCount > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <span>Page number:</span>
                  <input
                    type="number"
                    min={1}
                    max={file.pageCount}
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(Math.max(1, Math.min(file.pageCount, parseInt(e.target.value, 10) || 1)))}
                    className="w-16 px-2 py-1 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  disabled={isProcessing}
                  onClick={handleFastExtract}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instant Text Extract (Searchable PDF)</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={handleRunOcr}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recognizing Text ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <ScanText className="w-3.5 h-3.5" />
                      <span>Deep OCR Recognition (Scanned PDF)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* OCR Result */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Recognized Text</h3>
                {recognizedText && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.txt</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                readOnly
                value={recognizedText}
                placeholder="Click 'Run OCR Recognition' to extract all text from this scanned document..."
                rows={12}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setFile(null);
                setRecognizedText('');
              }}
              className="mt-4 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Scan another document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
