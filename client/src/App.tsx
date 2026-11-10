import React, { useState, useEffect } from 'react';
import {
  Scissors,
  RefreshCw,
  Film,
  Sliders,
  Layers,
  Tag,
  Music,
  FileAudio,
  FolderOpen,
  Sparkles,
  Zap,
  Mic,
  Activity,
  Layers3
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
import { generateSampleAudioFile } from './utils/sampleAudio';

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

  const handleLoadDemoSynth = async () => {
    setIsUploading(true);
    try {
      const file = await generateSampleAudioFile();
      await handleFileSelect(file);
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
    {
      id: 'trim',
      label: 'TRIM & SPLICE',
      icon: Scissors,
      desc: 'Waveform crop & splice',
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/15 border-emerald-500 shadow-neon-volt',
      ledColor: 'bg-emerald-400',
    },
    {
      id: 'convert',
      label: 'BITRATE & FORMAT',
      icon: RefreshCw,
      desc: 'Transcoder & kbps scaler',
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-500/15 border-cyan-500 shadow-neon-cyan',
      ledColor: 'bg-cyan-400',
    },
    {
      id: 'video',
      label: 'VIDEO TO AUDIO',
      icon: Film,
      desc: 'Cinema extractor & sync',
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/15 border-purple-500 shadow-neon-rose',
      ledColor: 'bg-purple-400',
    },
    {
      id: 'effects',
      label: 'DSP MASTERING',
      icon: Sliders,
      desc: 'Pitch, tempo, EQ, 8D, LUFS',
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/15 border-emerald-500 shadow-neon-volt',
      ledColor: 'bg-emerald-400',
    },
    {
      id: 'merge',
      label: 'MULTI-TRACK JOIN',
      icon: Layers,
      desc: 'Sequence & DJ crossfade',
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/15 border-amber-500 shadow-neon-amber',
      ledColor: 'bg-amber-400',
    },
    {
      id: 'tags',
      label: 'ID3 METADATA',
      icon: Tag,
      desc: 'Song & album tagger',
      color: 'text-teal-400',
      activeBg: 'bg-teal-500/15 border-teal-500 shadow-neon-volt',
      ledColor: 'bg-teal-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Studio Master Transport Rack Header */}
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

      {/* Main Studio Console Stage */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {!currentFile ? (
          /* Empty Session Landing */
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pt-4">
            <FileDropzone
              onFileSelected={handleFileSelect}
              isLoading={isUploading}
              uploadProgress={uploadProgress}
            />

            {/* Hardware Feature Console Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-studio-900/60 border border-white/[0.08] p-5 rounded-2xl flex flex-col gap-2.5 studio-card-glow transition-all">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wide">
                  Universal Transcoder
                </h4>
                <p className="text-xs text-studio-400 font-mono leading-relaxed">
                  Convert between MP3, WAV, FLAC, AAC, OPUS, OGG, and M4A with precise 32k - 320k kbps scaling.
                </p>
              </div>

              <div className="bg-studio-900/60 border border-white/[0.08] p-5 rounded-2xl flex flex-col gap-2.5 studio-card-glow transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wide">
                  Visual Waveform Cutter
                </h4>
                <p className="text-xs text-studio-400 font-mono leading-relaxed">
                  Millisecond zoom, dual IN/OUT markers, keep range mode, and click-free middle splice removal.
                </p>
              </div>

              <div className="bg-studio-900/60 border border-white/[0.08] p-5 rounded-2xl flex flex-col gap-2.5 studio-card-glow transition-all">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Film className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wide">
                  Video Demuxer & DSP FX
                </h4>
                <p className="text-xs text-studio-400 font-mono leading-relaxed">
                  Strip audio from MP4/MKV videos, apply Rubberband pitch shifts, tempo stretching, and 8D audio.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Multi-Track Production Console (2-Column Studio Architecture) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Studio Dock (4 columns on lg) */}
            <div className="lg:col-span-4 flex flex-col gap-4 sticky top-20">
              {/* Hardware Master Inspector Badge */}
              <div className="studio-glass rounded-2xl p-4.5 border border-white/[0.08] shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      {currentFile.isVideo ? <Film className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono tracking-widest uppercase text-studio-500">ACTIVE TRACK</div>
                      <h2 className="text-xs sm:text-sm font-bold font-mono text-white truncate max-w-[210px]">
                        {currentFile.originalName}
                      </h2>
                    </div>
                  </div>

                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-studio-300 hover:text-white bg-studio-900 hover:bg-studio-800 px-2.5 py-1.5 rounded-lg cursor-pointer border border-white/[0.06] transition-colors shrink-0">
                    SWAP
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

                {/* Technical Stream Telemetry */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-studio-950/80 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-studio-500 text-[9px] uppercase block">FORMAT / CODEC</span>
                    <span className="text-emerald-400 font-extrabold uppercase">
                      {currentFile.probe.audio?.codec || currentFile.probe.formatName}
                    </span>
                  </div>
                  <div className="bg-studio-950/80 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-studio-500 text-[9px] uppercase block">SAMPLING CLOCK</span>
                    <span className="text-white font-extrabold">
                      {currentFile.probe.audio?.sampleRate ? `${(currentFile.probe.audio.sampleRate / 1000).toFixed(1)} kHz` : '44.1 kHz'}
                    </span>
                  </div>
                  <div className="bg-studio-950/80 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-studio-500 text-[9px] uppercase block">BITRATE</span>
                    <span className="text-cyan-400 font-extrabold">
                      {currentFile.probe.audio?.bitRate ? `${currentFile.probe.audio.bitRate} kbps` : 'Variable'}
                    </span>
                  </div>
                  <div className="bg-studio-950/80 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-studio-500 text-[9px] uppercase block">FILE FOOTPRINT</span>
                    <span className="text-studio-200 font-bold">
                      {formatFileSize(currentFile.size)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Vertical Module Selector Switcher */}
              <div className="studio-glass rounded-2xl p-2.5 border border-white/[0.08] shadow-xl flex flex-col gap-1.5">
                <div className="px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase text-studio-500">
                  STUDIO RACK MODULES
                </div>

                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabKey)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isActive
                          ? `${tab.activeBg} text-white`
                          : 'bg-studio-950/40 border-transparent hover:border-white/[0.08] hover:bg-studio-950/80 text-studio-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/10 text-white' : 'bg-studio-900 text-studio-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-extrabold tracking-wide uppercase">
                            {tab.label}
                          </div>
                          <div className="text-[10px] text-studio-500 font-mono">
                            {tab.desc}
                          </div>
                        </div>
                      </div>

                      {/* Active indicator LED */}
                      <span className={`w-2 h-2 rounded-full ${isActive ? `${tab.ledColor} animate-pulse shadow-sm` : 'bg-studio-800'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Quick Workbench Synthesizer Action */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleLoadDemoSynth}
                  disabled={isUploading}
                  className="flex-1 p-2.5 bg-studio-950 hover:bg-studio-900 border border-white/[0.06] rounded-xl text-[10px] font-mono font-bold text-studio-300 hover:text-emerald-400 flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  RELOAD DEMO SYNTH
                </button>
              </div>
            </div>

            {/* Right Deck / Main Stage (8 columns on lg) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Top Unit: Panoramic Interactive Waveform Console */}
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

              {/* Bottom Unit: Active Studio Processing Module */}
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

      {/* Cyber Studio Console Footer */}
      <footer className="border-t border-white/[0.06] bg-studio-950/80 py-3 px-6 text-center text-[10px] text-studio-500 font-mono tracking-widest uppercase">
        SOUNDCRAFT PRO WORKSTATION • POWERED BY FFMPEG 8.1.2 NATIVE DSP & WEB AUDIO API ENGINE
      </footer>
    </div>
  );
}

export default App;
