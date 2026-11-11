import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Video,
  VideoOff,
} from 'lucide-react';
import { convertImagesToPdf, downloadBytes } from '../../../utils/pdfOperations';

interface ScannedPage {
  id: string;
  dataUrl: string;
  data: ArrayBuffer;
}

interface ScanPdfWorkspaceProps {
  onBack: () => void;
}

export const ScanPdfWorkspace: React.FC<ScanPdfWorkspaceProps> = ({ onBack }) => {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      alert('Camera access denied or unavailable: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.warn('Camera play warning:', e));
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const snapPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92);
    });

    const data = await blob.arrayBuffer();
    setPages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        dataUrl,
        data,
      },
    ]);
  };

  const handleExport = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      const payloads = pages.map((p) => ({
        data: p.data,
        type: 'image/jpeg',
      }));
      const pdfBytes = await convertImagesToPdf(payloads, {
        orientation: 'portrait',
        pageSize: 'a4',
        margin: 20,
      });
      downloadBytes(pdfBytes, 'scanned_document.pdf');
      setIsDone(true);
      stopCamera();
    } catch (err: any) {
      alert(err.message || 'Failed to export scanned PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All PDF Tools</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Scan to PDF
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Capture paper documents using your webcam or device camera and compile them into a PDF.
        </p>
      </div>

      {isDone ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Scanned PDF ready!</h2>
            <p className="text-xs text-slate-500 mt-1">Your scanned document has been downloaded.</p>
          </div>
          <button
            onClick={() => {
              setPages([]);
              setIsDone(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Scan another document
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Viewfinder area */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 shadow-xs">
            {!isCameraActive ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <button
                  onClick={startCamera}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Camera Viewfinder</span>
                </button>
              </div>
            ) : (
              <div className="w-full max-w-lg flex flex-col items-center gap-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 w-full aspect-video bg-black flex items-center justify-center shadow-inner">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={snapPhoto}
                    className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition-all hover:scale-102"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Page</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Captured Pages */}
          {pages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Captured Pages ({pages.length})
                </h3>
                <button
                  disabled={isProcessing}
                  onClick={handleExport}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Export to PDF ({pages.length} pgs) →</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs relative group"
                  >
                    <span className="absolute top-3 left-3 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => setPages((prev) => prev.filter((item) => item.id !== p.id))}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <img src={p.dataUrl} alt={`Snap ${idx + 1}`} className="w-full rounded-xl aspect-video object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
