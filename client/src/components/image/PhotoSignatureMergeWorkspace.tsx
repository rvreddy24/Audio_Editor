import React, { useState, useEffect } from 'react';
import {
  Contact,
  Download,
  Upload,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  User,
  PenTool,
  Calendar,
} from 'lucide-react';
import {
  loadImage,
  mergePhotoAndSignature,
  downloadImageBlob,
} from '../../utils/imageProcessor';
import { formatFileSize } from '../../utils/formatters';

interface PhotoSignatureMergeWorkspaceProps {
  onBack: () => void;
}

export const PhotoSignatureMergeWorkspace: React.FC<PhotoSignatureMergeWorkspaceProps> = ({
  onBack,
}) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signFile, setSignFile] = useState<File | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [signImg, setSignImg] = useState<HTMLImageElement | null>(null);

  const [candidateName, setCandidateName] = useState<string>('RAJESH SHARMA');
  const [dop, setDop] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetKb, setTargetKb] = useState<number>(50);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    dataUrl: string;
    actualKb: number;
  } | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const img = await loadImage(file);
      setPhotoImg(img);
    }
  };

  const handleSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSignFile(file);
      const img = await loadImage(file);
      setSignImg(img);
    }
  };

  const handleGenerate = async () => {
    if (!photoImg || !signImg) return;
    setIsProcessing(true);
    try {
      const res = await mergePhotoAndSignature(photoImg, signImg, {
        layout,
        candidateName,
        dop,
        targetKb,
      });
      setResult(res);
    } catch (err: any) {
      alert(`Merge error: ${err.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (photoImg && signImg) {
      handleGenerate();
    }
  }, [photoImg, signImg, candidateName, dop, targetKb, layout]);

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
          <Contact className="w-7 h-7 text-indigo-600" />
          <span>Merge Photo and Signature</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          Combine applicant photograph and digital signature into one official candidate card, standard for UPSC, SSC, and recruitment exams.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Uploads & Config */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          {/* Dual Upload Section */}
          <div className="grid grid-cols-2 gap-3">
            {/* Photo Upload */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Passport Photo</span>
              </span>
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center h-28">
                {photoFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[110px] block">
                      {photoFile.name}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-600 block">Select Photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Signature Upload */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5 text-purple-600" />
                <span>Signature</span>
              </span>
              <label className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center h-28">
                {signFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[110px] block">
                      {signFile.name}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-600 block">Select Sign</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleSignUpload} />
              </label>
            </div>
          </div>

          {/* Candidate Name Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Candidate Full Name (Optional)
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. RAJESH SHARMA"
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date of Photo Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date of Photograph (DoP)</span>
            </label>
            <input
              type="date"
              value={dop}
              onChange={(e) => setDop(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Target File Size */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Maximum File Size Limit
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 200].map((kb) => (
                <button
                  key={kb}
                  onClick={() => setTargetKb(kb)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    targetKb === kb
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ≤ {kb} KB
                </button>
              ))}
            </div>
          </div>

          {/* Download Action */}
          <div className="pt-2">
            <button
              disabled={!result || isProcessing}
              onClick={() => {
                if (result) {
                  downloadImageBlob(result.blob, `candidate_card_${targetKb}kb.jpg`);
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Merging & Compressing...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Combined Card ({result?.actualKb || 0} KB)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Card Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center min-h-[440px] justify-center">
          <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between w-full">
            <span>Candidate Photo & Signature Card Preview</span>
            {result && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {result.actualKb} KB (Under {targetKb} KB Limit)
              </span>
            )}
          </div>

          {!photoImg || !signImg ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Contact className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Please select both a Photo and a Signature</p>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-xs font-bold text-slate-600">Generating official card...</span>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center">
              <div className="max-w-xs border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-slate-50 p-1">
                <img
                  src={result.dataUrl}
                  alt="Candidate Card"
                  className="w-full h-auto rounded-xl object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">
                100% compliant with competitive recruitment portals (SSC, UPSC, Banking, Railway)
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
