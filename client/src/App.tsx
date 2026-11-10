import React, { useState, useEffect } from 'react';
import {
  Scissors,
  RefreshCw,
  Film,
  Sliders,
  Layers,
  Tag,
  FileAudio,
  ArrowLeft,
} from 'lucide-react';

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
import { ILovePdfNavbar } from './components/pdf/ILovePdfNavbar';
import { ILovePdfHero } from './components/pdf/ILovePdfHero';
import { ILovePdfGrid } from './components/pdf/ILovePdfGrid';
import { ILovePdfFooter } from './components/pdf/ILovePdfFooter';
import { PdfToolKey } from './components/pdf/types';

// Workspaces
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

import { uploadFile, checkHealth } from './api';
import { LoadedFile, ProcessingResult } from './types';
import { formatTime, formatFileSize } from './utils/formatters';

type TabKey = 'trim' | 'convert' | 'video' | 'effects' | 'merge' | 'tags';

export function App() {
  // Main view router: 'pdf' or 'audio'
  const [viewMode, setViewMode] = useState<'pdf' | 'audio'>('pdf');
  const [activePdfTool, setActivePdfTool] = useState<PdfToolKey>('home');

  // Audio state
  const [currentFile, setCurrentFile] = useState<LoadedFile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('trim');

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

  const handleSelectPdfTool = (tool: PdfToolKey | 'audio') => {
    if (tool === 'audio') {
      setViewMode('audio');
    } else {
      setViewMode('pdf');
      setActivePdfTool(tool);
    }
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#e5322d] selection:text-white">
      {/* Universal Top Navigation */}
      <ILovePdfNavbar
        activeTool={viewMode === 'audio' ? 'audio' : activePdfTool}
        onSelectTool={handleSelectPdfTool}
        onOpenAudioStudio={() => setViewMode('audio')}
      />

      {/* Main Content Router */}
      {viewMode === 'pdf' ? (
        <main className="flex-1">
          {activePdfTool === 'home' && (
            <>
              <ILovePdfHero />
              <ILovePdfGrid onSelectTool={handleSelectPdfTool} />
            </>
          )}

          {activePdfTool === 'merge' && (
            <MergeWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'split' && (
            <SplitWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'compress' && (
            <CompressWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'organize' && (
            <OrganizeWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'rotate' && (
            <RotateWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'pdf-to-jpg' && (
            <PdfToJpgWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'jpg-to-pdf' && (
            <JpgToPdfWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'watermark' && (
            <WatermarkWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'page-numbers' && (
            <PageNumbersWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'protect' && (
            <ProtectWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'unlock' && (
            <UnlockWorkspace onBack={() => setActivePdfTool('home')} />
          )}

          {activePdfTool === 'sign' && (
            <SignWorkspace onBack={() => setActivePdfTool('home')} />
          )}
        </main>
      ) : (
        /* Audio Workstation View */
        <div className="flex-1 flex flex-col">
          {/* Audio Navigation Bar */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <button
              onClick={() => {
                setViewMode('pdf');
                setActivePdfTool('home');
              }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#e5322d] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to iLovePDF Tools</span>
            </button>
            <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
              SoundCraft Audio Workstation
            </span>
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
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-slate-300 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Universal Format Converter
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Convert between MP3, WAV, FLAC, AAC, OPUS, OGG, and M4A with precision 32k - 320k kbps scaling.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-slate-300 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Precision Waveform Trimmer
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Interactive visual waveform editor with dual region markers, millisecond zoom, and fade in/out.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-slate-300 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                      <Film className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Video Soundtrack Extractor
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Drop MP4, MKV, MOV, or WebM video to isolate and extract pristine audio directly.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/60">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 truncate" title={currentFile.originalName}>
                          {currentFile.originalName}
                        </h2>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold shrink-0">
                          {currentFile.probe.formatName || 'AUDIO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                        <span>{formatFileSize(currentFile.size)}</span>
                        <span>•</span>
                        <span>{formatTime(currentFile.probe.duration)}</span>
                        <span>•</span>
                        <span>{currentFile.probe.bitRate ? `${Math.round(currentFile.probe.bitRate)} kbps` : 'VBR'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors">
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

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 scrollbar-none">
                  {audioTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabKey)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/90 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
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

      {/* Footer */}
      <ILovePdfFooter onSelectTool={handleSelectPdfTool} />
    </div>
  );
}

export default App;
