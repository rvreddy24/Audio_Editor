import React, { useState, useEffect, useRef } from 'react';
import {
  Scissors,
  RefreshCw,
  Film,
  Sliders,
  Layers,
  Tag,
  FileAudio,
  ArrowLeft,
  Music,
  FileText,
} from 'lucide-react';

// Common Components
import { StudioNavbar } from './components/common/StudioNavbar';
import { StudioFooter } from './components/common/StudioFooter';
import { HomeHub } from './components/home/HomeHub';

// Audio Studio Components
import { Header } from './components/Header';
import { FileDropzone } from './components/FileDropzone';
import { WaveformEditor } from './components/WaveformEditor';
import { TrimmerTab } from './components/TrimmerTab';
import { ConverterTab } from './components/ConverterTab';
import { VideoToAudioTab } from './components/VideoToAudioTab';
import { EffectsTab } from './components/EffectsTab';
import { MergerTab } from './components/MergerTab';
import { TagEditorTab } from './components/TagEditorTab';
import { RecorderModal } from './components/RecorderModal';
import { ResultModal } from './components/ResultModal';

// PDF Components
import { PdfHero } from './components/pdf/PdfHero';
import { PdfGrid } from './components/pdf/PdfGrid';
import { PdfToolKey, PDF_TOOLS } from './components/pdf/types';

// Calculator Studio
import { CalculatorHub } from './components/calculator/CalculatorHub';
import { CalculatorKey, ALL_CALCULATORS } from './components/calculator/types';

// Image Studio
import { ImageStudioHub } from './components/image/ImageStudioHub';
import { ImageToolKey, IMAGE_TOOLS } from './components/image/types';

// Video Studio
import { VideoStudioHub } from './components/video/VideoStudioHub';

// Media Studio (Unified Audio & Video Landing Hub)
import { MediaStudioHub } from './components/media/MediaStudioHub';

// PDF Workspaces
import { MergeWorkspace } from './components/pdf/workspaces/MergeWorkspace';
import { SplitWorkspace } from './components/pdf/workspaces/SplitWorkspace';
import { CompressWorkspace } from './components/pdf/workspaces/CompressWorkspace';
import { OrganizeWorkspace } from './components/pdf/workspaces/OrganizeWorkspace';
import { RotateWorkspace } from './components/pdf/workspaces/RotateWorkspace';
import { PdfToJpgWorkspace } from './components/pdf/workspaces/PdfToJpgWorkspace';
import { JpgToPdfWorkspace } from './components/pdf/workspaces/JpgToPdfWorkspace';
import { WatermarkWorkspace } from './components/pdf/workspaces/WatermarkWorkspace';
import { PageNumbersWorkspace } from './components/pdf/workspaces/PageNumbersWorkspace';
import { ProtectWorkspace } from './components/pdf/workspaces/ProtectWorkspace';
import { UnlockWorkspace } from './components/pdf/workspaces/UnlockWorkspace';
import { SignWorkspace } from './components/pdf/workspaces/SignWorkspace';
import { PdfToWordWorkspace } from './components/pdf/workspaces/PdfToWordWorkspace';
import { WordToPdfWorkspace } from './components/pdf/workspaces/WordToPdfWorkspace';
import { CropPdfWorkspace } from './components/pdf/workspaces/CropPdfWorkspace';
import { RedactPdfWorkspace } from './components/pdf/workspaces/RedactPdfWorkspace';
import { ComparePdfWorkspace } from './components/pdf/workspaces/ComparePdfWorkspace';
import { HtmlToPdfWorkspace } from './components/pdf/workspaces/HtmlToPdfWorkspace';
import { ScanPdfWorkspace } from './components/pdf/workspaces/ScanPdfWorkspace';
import { OcrPdfWorkspace } from './components/pdf/workspaces/OcrPdfWorkspace';
import { PdfToMarkdownWorkspace } from './components/pdf/workspaces/PdfToMarkdownWorkspace';
import { PdfToExcelWorkspace } from './components/pdf/workspaces/PdfToExcelWorkspace';
import { RepairPdfWorkspace } from './components/pdf/workspaces/RepairPdfWorkspace';
import { PdfToPdfaWorkspace } from './components/pdf/workspaces/PdfToPdfaWorkspace';
import { EditPdfWorkspace } from './components/pdf/workspaces/EditPdfWorkspace';
import { ExcelToPdfWorkspace } from './components/pdf/workspaces/ExcelToPdfWorkspace';
import { PdfToExcelXlsxWorkspace } from './components/pdf/workspaces/PdfToExcelXlsxWorkspace';
import { PptxToPdfWorkspace } from './components/pdf/workspaces/PptxToPdfWorkspace';
import { PdfToPptxWorkspace } from './components/pdf/workspaces/PdfToPptxWorkspace';
import { CompressImageWorkspace } from './components/pdf/workspaces/CompressImageWorkspace';
import { ResizeImageWorkspace } from './components/pdf/workspaces/ResizeImageWorkspace';
import { ConvertImageWorkspace } from './components/pdf/workspaces/ConvertImageWorkspace';
import { WatermarkImageWorkspace } from './components/pdf/workspaces/WatermarkImageWorkspace';

import { uploadFile, checkHealth } from './api';
import { LoadedFile, ProcessingResult } from './types';
import { formatTime, formatFileSize } from './utils/formatters';
import {
  parseRouteFromLocation,
  syncRouteToUrl,
  RouteState,
  AudioTabKey,
  ViewMode,
} from './utils/router';

type TabKey = 'trim' | 'convert' | 'video' | 'effects' | 'merge' | 'tags';

export function App() {
  // Parse initial route from URL on page load / browser reload
  const initialRoute = useRef<RouteState>(parseRouteFromLocation());

  // Navigation Router state
  const [viewMode, setViewMode] = useState<ViewMode>(initialRoute.current.viewMode);
  const [activePdfTool, setActivePdfTool] = useState<PdfToolKey>(initialRoute.current.pdfTool);
  const [activeCalc, setActiveCalc] = useState<CalculatorKey>(initialRoute.current.calcTool);
  const [activeImageTool, setActiveImageTool] = useState<ImageToolKey | undefined>(initialRoute.current.imageTool);

  // Audio state
  const [currentFile, setCurrentFile] = useState<LoadedFile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(initialRoute.current.audioTab || 'trim');

  // Trimmer states
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [cutMode, setCutMode] = useState<'keep' | 'remove'>('keep');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // UI modal states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isRecorderOpen, setIsRecorderOpen] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);

  // Initial server health check
  useEffect(() => {
    checkHealth().catch((err) => {
      console.error('Server check error:', err);
    });
  }, []);

  // Listen to browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = parseRouteFromLocation();
      setViewMode(nextRoute.viewMode);
      setActivePdfTool(nextRoute.pdfTool);
      setActiveCalc(nextRoute.calcTool);
      setActiveImageTool(nextRoute.imageTool);
      if (nextRoute.audioTab) {
        setActiveTab(nextRoute.audioTab as TabKey);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleOpenHome = () => {
    setViewMode('home');
    setActivePdfTool('home');
    setActiveCalc('home');
    setActiveImageTool(undefined);
    syncRouteToUrl({ viewMode: 'home' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPdf = (specificTool: PdfToolKey = 'home') => {
    setViewMode('pdf');
    setActivePdfTool(specificTool);
    syncRouteToUrl({ viewMode: 'pdf', pdfTool: specificTool });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAudio = (tab?: string) => {
    setViewMode('audio');
    const validTab = tab && ['trim', 'convert', 'video', 'effects', 'merge', 'tags'].includes(tab)
      ? (tab as TabKey)
      : activeTab;
    if (tab && validTab) {
      setActiveTab(validTab);
    }
    syncRouteToUrl({ viewMode: 'audio', audioTab: validTab as AudioTabKey });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCalc = (tool: CalculatorKey = 'home') => {
    setViewMode('calc');
    setActiveCalc(tool);
    syncRouteToUrl({ viewMode: 'calc', calcTool: tool });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenImage = (tool?: ImageToolKey | null) => {
    setViewMode('image');
    const selected = tool || undefined;
    setActiveImageTool(selected);
    syncRouteToUrl({ viewMode: 'image', imageTool: selected });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVideo = () => {
    setViewMode('video');
    syncRouteToUrl({ viewMode: 'video' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMedia = () => {
    setViewMode('media');
    syncRouteToUrl({ viewMode: 'media' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const loaded = await uploadFile(file, (pct) => setUploadProgress(pct));
      setCurrentFile(loaded);
      setStartTime(0);
      setEndTime(loaded.probe.duration || 10);
      setCurrentTime(0);
      setIsPlaying(false);

      if (loaded.isVideo) {
        setActiveTab('video');
      } else {
        setActiveTab('trim');
      }
    } catch (err: any) {
      alert('Failed to upload and analyze file: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRangeChange = (s: number, e: number) => {
    setStartTime(s);
    setEndTime(e);
  };

  const handleProcessedResult = (result: ProcessingResult) => {
    setLastResult(result);
  };

  const handleLoadResultAsCurrent = (result: ProcessingResult) => {
    if (!currentFile) return;
    setCurrentFile({
      fileId: result.outputId,
      originalName: result.downloadName,
      size: result.probe.size,
      probe: result.probe,
      streamUrl: result.streamUrl,
      downloadUrl: result.downloadUrl,
      isVideo: false,
    });
    setStartTime(0);
    setEndTime(result.probe.duration || 10);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const audioTabs = [
    { id: 'trim', label: 'Trim & Cut', icon: Scissors, desc: 'Crop segments and fades' },
    { id: 'convert', label: 'Convert & Bitrate', icon: RefreshCw, desc: 'Format and kbps scaler' },
    { id: 'video', label: 'Video to Audio', icon: Film, desc: 'Extract video soundtrack' },
    { id: 'effects', label: 'Effects & Quality', icon: Sliders, desc: 'Pitch, tempo, EQ, 8D audio' },
    { id: 'merge', label: 'Merge Audio', icon: Layers, desc: 'Join multi-track sequence' },
    { id: 'tags', label: 'Tags & Info', icon: Tag, desc: 'Edit song ID3 metadata' },
  ];

  // Lookup active tool title for breadcrumb
  const currentPdfToolMeta = PDF_TOOLS.find((t) => t.key === activePdfTool);
  const currentCalcMeta = ALL_CALCULATORS.find((c) => c.key === activeCalc);
  const currentImageToolMeta = IMAGE_TOOLS.find((t) => t.key === activeImageTool);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      {/* Universal Studio Navigation */}
      <StudioNavbar
        currentView={viewMode}
        activePdfToolTitle={activePdfTool !== 'home' ? currentPdfToolMeta?.title : undefined}
        activeCalcTitle={activeCalc !== 'home' ? currentCalcMeta?.name : undefined}
        activeImageToolTitle={currentImageToolMeta?.title}
        onNavigateHome={handleOpenHome}
        onNavigatePdf={() => handleOpenPdf('home')}
        onNavigateVideo={() => handleOpenVideo()}
        onNavigateAudio={() => handleOpenAudio()}
        onNavigateMedia={() => handleOpenMedia()}
        onNavigateCalc={() => handleOpenCalc('home')}
        onNavigateImage={() => handleOpenImage()}
      />

      {/* VIEW 1: HOME HUB (Master Cards for PDF, Image, Media & Calculators) */}
      {viewMode === 'home' && (
        <main className="flex-1">
          <HomeHub
            onOpenPdf={(tool) => handleOpenPdf(tool || 'home')}
            onOpenVideo={() => handleOpenVideo()}
            onOpenAudio={(tab) => handleOpenAudio(tab)}
            onOpenMedia={() => handleOpenMedia()}
            onOpenCalc={(tool) => handleOpenCalc(tool || 'home')}
            onOpenImage={(tool) => handleOpenImage(tool)}
          />
        </main>
      )}

      {/* VIEW: MEDIA HUB (Unified Audio & Video Landing with Dedicated Cards) */}
      {viewMode === 'media' && (
        <main className="flex-1">
          <MediaStudioHub
            onSelectVideo={() => handleOpenVideo()}
            onSelectAudio={(tab) => handleOpenAudio(tab as any)}
            onBackToHome={handleOpenHome}
          />
        </main>
      )}

      {/* VIEW 2: PDF WORKSTATION */}
      {viewMode === 'pdf' && (
        <main className="flex-1">
          {/* PDF Section Subheader */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <button
              onClick={handleOpenHome}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 px-3 py-1 rounded-full border border-red-200">
                PDF Toolkit
              </span>
            </div>
          </div>

          {activePdfTool === 'home' && (
            <>
              <PdfHero />
              <PdfGrid
                onSelectTool={(tool) => handleOpenPdf(tool)}
              />
            </>
          )}

          {activePdfTool === 'merge' && (
            <MergeWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'split' && (
            <SplitWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'compress' && (
            <CompressWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'organize' && (
            <OrganizeWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'rotate' && (
            <RotateWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pdf-to-jpg' && (
            <PdfToJpgWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'jpg-to-pdf' && (
            <JpgToPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'watermark' && (
            <WatermarkWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'page-numbers' && (
            <PageNumbersWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'protect' && (
            <ProtectWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'unlock' && (
            <UnlockWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'sign' && (
            <SignWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pdf-to-word' && (
            <PdfToWordWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'word-to-pdf' && (
            <WordToPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'crop' && (
            <CropPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'redact' && (
            <RedactPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'compare' && (
            <ComparePdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'html-to-pdf' && (
            <HtmlToPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'scan-pdf' && (
            <ScanPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'ocr-pdf' && (
            <OcrPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pdf-to-markdown' && (
            <PdfToMarkdownWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pdf-to-excel' && (
            <PdfToExcelWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'repair-pdf' && (
            <RepairPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pdf-to-pdfa' && (
            <PdfToPdfaWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'edit-pdf' && (
            <EditPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'excel-to-pdf' && (
            <ExcelToPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pdf-to-excel-xlsx' && (
            <PdfToExcelXlsxWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pptx-to-pdf' && (
            <PptxToPdfWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'pdf-to-pptx' && (
            <PdfToPptxWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'compress-image' && (
            <CompressImageWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'resize-image' && (
            <ResizeImageWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'convert-image' && (
            <ConvertImageWorkspace onBack={() => handleOpenPdf('home')} />
          )}

          {activePdfTool === 'watermark-image' && (
            <WatermarkImageWorkspace onBack={() => handleOpenPdf('home')} />
          )}
        </main>
      )}

      {/* VIEW 3: AUDIO STUDIO WORKSTATION */}
      {viewMode === 'audio' && (
        <div className="flex-1 flex flex-col">
          {/* Audio Section Subheader */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
            <button
              onClick={handleOpenMedia}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back<span className="hidden sm:inline"> to Media Studio</span></span>
            </button>

            {/* Media Studio Dual Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleOpenVideo()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/60 dark:hover:bg-slate-700 transition-all"
              >
                <Film className="w-3.5 h-3.5 text-rose-500" />
                <span>Video Editor</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              >
                <Music className="w-3.5 h-3.5 text-indigo-500" />
                <span>Audio Editor</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200 hidden sm:inline-block">
                Studio Audio Suite
              </span>
            </div>
          </div>

          <Header
            onOpenRecorder={() => setIsRecorderOpen(true)}
            onNewFile={() => {
              setIsPlaying(false);
              setCurrentFile(null);
            }}
            hasFile={!!currentFile}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onRewind={() => setCurrentTime(startTime)}
            currentTime={currentTime}
            duration={currentFile ? currentFile.probe.duration : 0}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
            {!currentFile ? (
              <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pt-4">
                <FileDropzone
                  onFileSelected={handleFileSelect}
                  isLoading={isUploading}
                  uploadProgress={uploadProgress}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Universal Format Converter
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Convert between MP3, WAV, FLAC, AAC, OPUS, OGG, and M4A with precision 32k - 320k kbps scaling.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Precision Waveform Trimmer
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Interactive visual waveform editor with dual region markers, millisecond zoom, and fade in/out.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                      <Film className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Video Soundtrack Extractor
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Drop MP4, MKV, MOV, or WebM video to isolate and extract pristine audio directly.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/60 dark:border-indigo-800/60">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={currentFile.originalName}>
                          {currentFile.originalName}
                        </h2>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold shrink-0">
                          {currentFile.probe.formatName || 'AUDIO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        <span>{formatFileSize(currentFile.size)}</span>
                        <span>•</span>
                        <span>{formatTime(currentFile.probe.duration)}</span>
                        <span>•</span>
                        <span>{currentFile.probe.bitRate ? `${Math.round(currentFile.probe.bitRate)} kbps` : 'VBR'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors">
                      Replace File
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <WaveformEditor
                  audioUrl={currentFile.streamUrl}
                  duration={currentFile.probe.duration}
                  startTime={startTime}
                  endTime={endTime}
                  onCurrentTimeChange={setCurrentTime}
                  onRangeChange={handleRangeChange}
                  cutMode={cutMode}
                  isPlaying={isPlaying}
                  onPlayStateChange={setIsPlaying}
                />

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 dark:border-slate-800 no-scrollbar scrollbar-none">
                  {audioTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as TabKey);
                          syncRouteToUrl({ viewMode: 'audio', audioTab: tab.id as AudioTabKey }, true);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="transition-all duration-200">
                  {activeTab === 'trim' && (
                    <TrimmerTab
                      currentFile={currentFile}
                      startTime={startTime}
                      endTime={endTime}
                      currentTime={currentTime}
                      onRangeChange={handleRangeChange}
                      cutMode={cutMode}
                      onCutModeChange={setCutMode}
                      onProcessed={handleProcessedResult}
                    />
                  )}

                  {activeTab === 'convert' && (
                    <ConverterTab
                      currentFile={currentFile}
                      onProcessed={handleProcessedResult}
                    />
                  )}

                  {activeTab === 'video' && (
                    <VideoToAudioTab
                      currentFile={currentFile}
                      onProcessed={handleProcessedResult}
                      onUploadNewVideo={handleFileSelect}
                    />
                  )}

                  {activeTab === 'effects' && (
                    <EffectsTab
                      currentFile={currentFile}
                      onProcessed={handleProcessedResult}
                    />
                  )}

                  {activeTab === 'merge' && (
                    <MergerTab
                      currentFile={currentFile}
                      onProcessed={handleProcessedResult}
                    />
                  )}

                  {activeTab === 'tags' && (
                    <TagEditorTab
                      currentFile={currentFile}
                      onProcessed={handleProcessedResult}
                    />
                  )}
                </div>
              </div>
            )}
          </main>

          <RecorderModal
            isOpen={isRecorderOpen}
            onClose={() => setIsRecorderOpen(false)}
            onRecordingComplete={handleFileSelect}
          />

          <ResultModal
            result={lastResult}
            onClose={() => setLastResult(null)}
            onLoadAsCurrent={handleLoadResultAsCurrent}
          />
        </div>
      )}

      {/* VIEW 4: CALCULATOR WORKSTATION */}
      {viewMode === 'calc' && (
        <main className="flex-1">
          {/* Calculator Subheader Bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <button
              onClick={() => {
                if (activeCalc !== 'home') handleOpenCalc('home');
                else handleOpenHome();
              }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{activeCalc !== 'home' ? 'Back to All Calculators' : 'Back to Home Dashboard'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-700 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800 px-3 py-1 rounded-full border border-orange-200">
                Calculator Studio
              </span>
            </div>
          </div>

          <CalculatorHub
            activeCalc={activeCalc}
            onSelectCalc={(key) => handleOpenCalc(key)}
          />
        </main>
      )}

      {/* VIEW 5: IMAGE STUDIO WORKSTATION */}
      {viewMode === 'image' && (
        <main className="flex-1">
          {/* Image Subheader Bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <button
              onClick={() => {
                if (activeImageTool) handleOpenImage(undefined);
                else handleOpenHome();
              }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{activeImageTool ? 'Back to All Image Tools' : 'Back to Home Dashboard'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                Image Studio
              </span>
            </div>
          </div>

          <ImageStudioHub
            initialTool={activeImageTool}
            onSelectTool={(tool) => handleOpenImage(tool)}
            onBackToHome={handleOpenHome}
          />
        </main>
      )}

      {/* VIEW 6: VIDEO STUDIO WORKSTATION */}
      {viewMode === 'video' && (
        <main className="flex-1">
          {/* Video Subheader Bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <button
              onClick={handleOpenMedia}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Media Studio</span>
            </button>

            {/* Media Studio Dual Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
              >
                <Film className="w-3.5 h-3.5 text-rose-500" />
                <span>Video Editor</span>
              </button>
              <button
                onClick={() => handleOpenAudio()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-700 transition-all"
              >
                <Music className="w-3.5 h-3.5 text-indigo-500" />
                <span>Audio Editor</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 px-2.5 py-1 rounded-full border border-rose-200 hidden sm:inline-block">
                Pro Video Suite
              </span>
            </div>
          </div>

          <VideoStudioHub onBack={handleOpenMedia} />
        </main>
      )}

      {/* Universal Studio Footer */}
      <StudioFooter
        onSelectPdfTool={(tool) => handleOpenPdf(tool)}
        onOpenMedia={() => handleOpenMedia()}
        onOpenVideo={() => handleOpenVideo()}
        onOpenAudio={() => handleOpenAudio()}
        onOpenCalc={(tool) => handleOpenCalc(tool)}
        onOpenImage={(tool) => handleOpenImage(tool)}
        onNavigateHome={handleOpenHome}
      />
    </div>
  );
}

export default App;
