# 🎛️ SoundCraft Studio - Pro Web Audio & Video Workstation

**SoundCraft Studio** is a full-featured, professional web-based audio workstation designed for high-performance audio editing, universal format conversion, bitrate scaling, video-to-audio extraction, visual waveform trimming, and audio mastering.

Built with **React 19 + TypeScript + Vite + Tailwind CSS** on the frontend, and backed by a high-speed **Node.js Express + Native FFmpeg 8.1** processing engine.

---

## ✨ Features

### 1. 🔄 Universal Audio Converter & Bitrate Scaler
- **Format Conversion**: Convert between all major formats:
  - `MP3`, `WAV` (Lossless PCM), `FLAC` (Audiophile Lossless), `AAC`, `M4A` (Apple), `OGG` (Vorbis), `OPUS` (Ultra-low latency), `AIFF`, `WMA`.
- **Bitrate (kbps) Scaler**:
  - Increase or decrease bitrate freely (32 kbps to 320 kbps).
  - Quick presets: `32k`, `64k`, `96k`, `128k`, `160k`, `192k`, `256k`, `320k` or Lossless.
  - Real-time estimated output file size calculator.
- **Audio Sample Rate**: Original, 22,050 Hz, 44,100 Hz (CD Quality), 48,000 Hz (Studio / Video), 96,000 Hz (Hi-Res).
- **Channels**: Stereo (2.0) or Mono (1.0).

### 2. ✂️ Visual Waveform Trimmer & Precision Cutter
- **Interactive Waveform**: Rendered via Web Audio API with zooming (1x to 5x), scrubbing playhead, and timeline markings.
- **Dual Mode Trimming**:
  - **Keep Selection**: Extract only the selected segment between Start and End markers.
  - **Remove Selection (Cut & Splice)**: Cut out unwanted middle sections (mistakes, silence) and seamlessly splice the outer portions without clicks or pops.
- **Precision Millisecond Timecodes**:
  - Direct numeric inputs (`00:01:23.450`).
  - Nudge buttons (`-1s`, `-0.1s`, `+0.1s`, `+1s`).
  - "Set Start to Playhead" and "Set End to Playhead" buttons.
- **Envelope Fades**: Adjustable Fade In (0 to 10s) and Fade Out (0 to 10s) sliders.

### 3. 🎬 Video to Audio Extractor & Editor
- **Multi-Format Video Input**: Drop any video file (`MP4`, `MKV`, `MOV`, `WebM`, `AVI`).
- **Synchronized Video Player**: Embedded video player preview synchronized with timeline scrubber.
- **Range Extraction**: Extract the complete audio track or crop a specific time range directly from the video.
- **High-Fidelity Transcoding**: Export to MP3, WAV, AAC, FLAC, or OPUS at custom bitrates.

### 4. 🎚️ Effects & DSP Mastering Studio
- **Speed & Tempo**: 0.25x to 2.5x with Rubberband DAW pitch-preservation time stretching.
- **Pitch Shifting**: Transpose musical keys or vocal pitch by -12 to +12 semitones.
- **Volume Boost**: Gain multiplier from 10% to 300% (+10 dB clean gain).
- **Loudness Normalizer**:
  - Spotify & YouTube standard (-14 LUFS EBU R128).
  - Peak Limiter (0 dB transparent maximization).
- **EQ & Filters**: Bass Boost (-10dB to +15dB), Treble Brightness (-10dB to +15dB), Vocal Clarity, Lo-Fi Muffle, Vintage Radio.
- **Special FX**:
  - 🔄 **Reverse Audio** (`areverse`).
  - 🎧 **8D Spatial Audio** (360° binaural rotating panning via `apulsator`).
  - 🎤 **Vocal Remover / Karaoke** (Center-channel phase cancellation).

### 5. 🔗 Audio Joiner & Sequencer (Merger)
- Combine multiple audio tracks in sequence.
- Drag or click to reorder tracks.
- In-line audio preview player for each track.
- Adjustable **Crossfade** duration (0s gapless cut up to 5s DJ crossfade blend).

### 6. 🏷️ ID3 Metadata & Tag Editor
- View and edit embedded metadata: Track Title, Artist, Album, Release Year, Genre, and Comments.
- Writes metadata directly into the audio file container.

### 7. 🎙️ Live Voice & Microphone Recorder
- Record directly from your microphone with an animated frequency spectrum oscilloscope.
- Pause, Resume, Stop.
- One-click "Load into Studio" to immediately trim, enhance, or convert your recording.

### 8. 🎹 Built-in Demo Synthwave Generator
- Click "Try Demo Synthwave Track" to synthesize an in-memory 12-second synthwave beat with chords, bassline, and drum groove using Web Audio API—enabling instant testing with zero setup.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [FFmpeg](https://ffmpeg.org/) (already configured on Windows PATH)

### Running the Application

Open PowerShell or your terminal in `D:\Audio Editor`:

```powershell
npm start
```
*Or to run in development mode:*
```powershell
npm run dev
```

Then open your browser at:
👉 **http://localhost:5000** (Full Web Application)
*(Or http://localhost:5173 for Vite dev mode with HMR)*

---

## 🛠️ Project Architecture

```
d:/Audio Editor/
├── client/                      # Frontend SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx       # Studio navigation & status
│   │   │   ├── FileDropzone.tsx # Audio & video uploader
│   │   │   ├── WaveformEditor.tsx # Interactive canvas waveform
│   │   │   ├── TrimmerTab.tsx   # Precision trim & cut controls
│   │   │   ├── ConverterTab.tsx # Format & kbps scaler
│   │   │   ├── VideoToAudioTab.tsx # Video player & audio extractor
│   │   │   ├── EffectsTab.tsx   # Pitch, tempo, EQ, 8D, normalization
│   │   │   ├── MergerTab.tsx    # Audio joiner & crossfade
│   │   │   ├── TagEditorTab.tsx # ID3 metadata editor
│   │   │   ├── RecorderModal.tsx# Mic recorder with live visualizer
│   │   │   └── ResultModal.tsx  # Download & re-edit dialog
│   │   ├── utils/
│   │   │   ├── formatters.ts    # Time & file size formatting
│   │   │   └── sampleAudio.ts   # Demo audio synth generator
│   │   ├── api.ts               # Backend REST API client
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── App.tsx              # Main studio workbench
│   │   └── index.css            # Dark studio Tailwind styling
│   └── dist/                    # Compiled production assets
├── server/                      # Backend REST API
│   ├── uploads/                 # Temporary upload buffer
│   ├── outputs/                 # Processed audio files
│   ├── ffmpeg-helper.js         # Child process ffprobe & ffmpeg runner
│   ├── index.js                 # Express server & DSP endpoints
│   └── test-suite.js            # Automated verification test suite
└── package.json                 # Project orchestrator (concurrently)
```
