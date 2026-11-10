import React, { useState, useEffect } from 'react';
import {
  Scissors,
  RefreshCw,
  Film,
  Sliders,
  Layers,
  Tag,
  Music,
  CheckCircle2,
  HardDrive,
  Clock,
  Sparkles,
  FileAudio
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

  // UI modal states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isRecorderOpen, setIsRecorderOpen] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  // Initial server health check
  useEffect(() => {
    checkHealth()
      .then(() => setServerOnline(true))
      .catch((err) => {
        console.error('Server check error:', err);
        setServerOnline(false);
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

      // Auto-select tab: if it's a video file, open Video-to-Audio tab, else Trimmer
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
  };

  const tabs = [
    { id: 'trim', label: 'Trim & Cut', icon: Scissors, desc: 'Cut, trim & fades' },
    { id: 'convert', label: 'Convert & Bitrate', icon: RefreshCw, desc: 'Format & kbps scaler' },
    { id: 'video', label: 'Video to Audio', icon: Film, desc: 'Extract soundtrack' },
    { id: 'effects', label: 'Effects Studio', icon: Sliders, desc: 'Speed, pitch, EQ, 8D' },
    { id: 'merge', label: 'Joiner / Merger', icon: Layers, desc: 'Concatenate tracks' },
    { id: 'tags', label: 'ID3 Tags', icon: Tag, desc: 'Metadata editor' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <Header
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onNewFile={() => setCurrentFile(null)}
        hasFile={!!currentFile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {!currentFile ? (
          /* Empty / Upload View */
          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pt-4">
            <FileDropzone
              onFileSelected={handleFileSelect}
              isLoading={isUploading}
              uploadProgress={uploadProgress}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">All Format Converter</h4>
                <p className="text-xs text-slate-400">
                  Switch between MP3, WAV, FLAC, AAC, OPUS, OGG, M4A with precision kbps scaler (32k - 320k).
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">Visual Precision Trimming</h4>
                <p className="text-xs text-slate-400">
                  Millisecond waveform zoom, crop selections or splice out unwanted sections seamlessly.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                  <Film className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">Video to Audio & FX</h4>
                <p className="text-xs text-slate-400">
                  Extract audio from MP4/MKV videos, apply pitch shifting, tempo stretching, and 8D binaural sound.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active File Workstation */
          <div className="flex flex-col gap-6">
            {/* File Info Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                  {currentFile.isVideo ? <Film className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-white truncate max-w-md sm:max-w-xl m-0 p-0">
                    {currentFile.originalName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span className="uppercase text-indigo-400 font-semibold">
                      {currentFile.probe.audio?.codec || currentFile.probe.formatName}
                    </span>
                    <span>•</span>
                    <span>{formatTime(currentFile.probe.duration)}</span>
                    <span>•</span>
                    <span>{currentFile.probe.audio?.bitRate ? `${currentFile.probe.audio.bitRate} kbps` : 'Bitrate Variable'}</span>
                    <span>•</span>
                    <span>{formatFileSize(currentFile.size)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Change File */}
              <label className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl cursor-pointer transition-colors border border-slate-700 flex items-center gap-1.5">
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

            {/* Interactive Waveform Editor (for Audio or Video track) */}
            <WaveformEditor
              audioUrl={currentFile.streamUrl}
              duration={currentFile.probe.duration}
              startTime={startTime}
              endTime={endTime}
              onRangeChange={handleRangeChange}
              onCurrentTimeChange={(t) => setCurrentTime(t)}
              cutMode={cutMode}
            />

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabKey)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Studio Tab View */}
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        SoundCraft Studio • High-Performance Audio Engine Powered by FFmpeg 8.1 & Web Audio API
      </footer>
    </div>
  );
}

export default App;
