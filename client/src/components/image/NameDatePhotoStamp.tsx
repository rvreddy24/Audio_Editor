import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  loadImage,
  addNameAndDateStamp,
  downloadImageBlob,
} from '../../utils/imageProcessor';

interface NameDatePhotoStampProps {
  onBack?: () => void;
}

export const NameDatePhotoStamp: React.FC<NameDatePhotoStampProps> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const [candidateName, setCandidateName] = useState<string>('RAJESH SHARMA');
  const [dateOfPhoto, setDateOfPhoto] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const img = await loadImage(file);
      setImgElement(img);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    try {
      const res = await addNameAndDateStamp(imgElement, candidateName, dateOfPhoto);
      setResult(res);
    } catch (err: any) {
      alert(`Error applying stamp: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imgElement) {
      handleProcess();
    }
  }, [imgElement, candidateName, dateOfPhoto]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
          <Calendar className="w-7 h-7 text-amber-600" />
          <span>Name & Date on Photo (DoP Stamp)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Add the candidate's Name and Date of Photograph (DoP) at the bottom, mandatory for SSC, UPSC, and competitive examinations.
        </p>
      </div>

      {!selectedFile ? (
        <div className="max-w-2xl mx-auto">
          <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Select or Drop Your Passport Photo
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG • Adds compliant white banner with bold name and capture date
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
          {/* Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. RAJESH SHARMA"
                className="w-full text-sm font-bold text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard format is UPPERCASE as per exam instructions.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Date of Photograph (DoP)
              </label>
              <input
                type="date"
                value={dateOfPhoto}
                onChange={(e) => setDateOfPhoto(e.target.value)}
                className="w-full text-sm font-bold text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Photo must typically not be older than 3 months.
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <button
                disabled={!result || isProcessing}
                onClick={() => {
                  if (result) {
                    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
                    downloadImageBlob(result.blob, `${base}_with_name_date.jpg`);
                  }
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering stamp...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Stamped Photo</span>
                  </>
                )}
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

          {/* Preview */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">
                  Formatting text stamp...
                </span>
              </div>
            ) : result ? (
              <div className="w-full flex flex-col items-center">
                <div className="max-w-xs border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                  <img
                    src={result.dataUrl}
                    alt="Stamped preview"
                    className="w-full h-auto object-contain"
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-bold text-slate-800">
                    Compliant with SSC & UPSC Guidelines
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Clear legible text with standard bottom aspect ratio
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs">No preview available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
