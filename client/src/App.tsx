import React, { useState, useEffect } from 'react';
import {
  Scissors,
  RefreshCw,
  Film,
  Sliders,
  Layers,
  Tag,
  FileAudio,
  Sparkles,
} from 'lucide-react';

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

import { uploadFile, checkHealth } from './api';
import { LoadedFile, ProcessingResult } from './types';
import { formatTime, formatFileSize } from './utils/formatters';

type TabKey = 'trim' | 'convert' | 'video' | 'effects' | 'merge' | 'tags';

export function App() {
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
      isVideo: false
    });
    setStartTime(0);
    setEndTime(result.probe.duration || 10);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const tabs = [
    { id: 'trim', label: 'Trim & Cut', icon: Scissors, desc: 'Crop segments and fades' },
    { id: 'convert', label: 'Convert & Bitrate', icon: RefreshCw, desc: 'Format and kbps scaler' },
    { id: 'video', label: 'Video to Audio', icon: Film, desc: 'Extract video soundtrack' },
    { id: 'effects', label: 'Effects & Quality', icon: Sliders, desc: 'Pitch, tempo, EQ, 8D audio' },
    { id: 'merge', label: 'Merge Audio', icon: Layers, desc: 'Join multi-track sequence' },
    { id: 'tags', label: 'Tags & Info', icon: Tag, desc: 'Edit song ID3 metadata' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Clean Light Navbar Header */}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {!currentFile ? (
          /* Empty / Upload View */
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pt-4">
            <FileDropzone
              onFileSelected={handleFileSelect}
              isLoading={isUploading}
              uploadProgress={uploadProgress}
            />

            {/* Feature Highlights Grid */}
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
                  Visual millisecond zooming, dual handles, keep range mode, and smooth fade in/out curves.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-slate-300 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Film className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Video to Audio & Effects
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Strip audio from MP4/MKV videos, apply Rubberband pitch shifts, tempo stretching, and 8D audio.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active File Workstation */
          <div className="flex flex-col gap-6">
            {/* File Info Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  {currentFile.isVideo ? <Film className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate max-w-md sm:max-w-xl">
                    {currentFile.originalName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                    <span className="uppercase font-semibold text-indigo-600">
                      {currentFile.probe.audio?.codec || currentFile.probe.formatName}
                    </span>
                    <span>•</span>
                    <span>{formatTime(currentFile.probe.duration)}</span>
                    <span>•</span>
                    <span>{currentFile.probe.audio?.bitRate ? `${currentFile.probe.audio.bitRate} kbps` : 'Variable'}</span>
                    <span>•</span>
                    <span>{formatFileSize(currentFile.size)}</span>
                  </div>
                </div>
              </div>

              {/* Change File Action */}
              <label className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl cursor-pointer transition-colors border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5" />
                Change File
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

            {/* Waveform Canvas View */}
            <WaveformEditor
              audioUrl={currentFile.streamUrl}
              duration={currentFile.probe.duration}
              startTime={startTime}
              endTime={endTime}
              onRangeChange={handleRangeChange}
              onCurrentTimeChange={(t) => setCurrentTime(t)}
              cutMode={cutMode}
              isPlaying={isPlaying}
              onPlayStateChange={(p) => setIsPlaying(p)}
            />

            {/* Clean Segmented Tab Navigation */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabKey)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Panel */}
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

      {/* Microphone Voice Recorder Modal */}
      <RecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onRecordingComplete={handleFileSelect}
      />

      {/* Processed Result Modal with Direct Download */}
      <ResultModal
        result={lastResult}
        onClose={() => setLastResult(null)}
        onLoadAsCurrent={handleLoadResultAsCurrent}
      />

      {/* Clean Light Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500 font-medium">
        SoundCraft Studio • High-Performance Audio Engine Powered by FFmpeg 8.1 & Web Audio API
      </footer>
    </div>
  );
}

export default App;
