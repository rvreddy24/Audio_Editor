const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { probeFile, runFFmpeg } = require('./ffmpeg-helper');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Directories for temporary uploads and processed outputs
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUTS_DIR = path.join(__dirname, 'outputs');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 GB limit
});

// Map of in-memory file metadata { fileId: { originalName, path, format, ... } }
const fileRegistry = new Map();

// Helper to determine codec arguments based on format and bitrate
function getCodecArgs(targetFormat, bitrate, sampleRate, channels) {
  const format = (targetFormat || 'mp3').toLowerCase();
  const args = [];
  const cleanBitrate = bitrate ? (typeof bitrate === 'number' || !bitrate.toString().endsWith('k') ? `${bitrate}k` : bitrate.toString()) : null;

  switch (format) {
    case 'mp3':
      args.push('-c:a', 'libmp3lame');
      if (cleanBitrate) args.push('-b:a', cleanBitrate);
      break;
    case 'wav':
      args.push('-c:a', 'pcm_s16le');
      break;
    case 'aac':
      args.push('-c:a', 'aac');
      if (cleanBitrate) args.push('-b:a', cleanBitrate);
      break;
    case 'm4a':
      args.push('-c:a', 'aac', '-f', 'ipod');
      if (cleanBitrate) args.push('-b:a', cleanBitrate);
      break;
    case 'flac':
      args.push('-c:a', 'flac');
      break;
    case 'ogg':
      args.push('-c:a', 'libvorbis');
      if (cleanBitrate) args.push('-b:a', cleanBitrate);
      break;
    case 'opus':
      args.push('-c:a', 'libopus');
      if (cleanBitrate) args.push('-b:a', cleanBitrate);
      break;
    case 'wma':
      args.push('-c:a', 'wmav2');
      if (cleanBitrate) args.push('-b:a', cleanBitrate);
      break;
    case 'aiff':
      args.push('-c:a', 'pcm_s16be');
      break;
    default:
      args.push('-c:a', 'libmp3lame', '-b:a', '320k');
  }

  if (sampleRate && !isNaN(parseInt(sampleRate, 10))) {
    args.push('-ar', sampleRate.toString());
  }
  if (channels && !isNaN(parseInt(channels, 10))) {
    args.push('-ac', channels.toString());
  }

  return args;
}

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ffmpeg: true,
    version: '8.1.2',
    timestamp: new Date().toISOString()
  });
});

// 2. Upload file & analyze probe
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.size === 0) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: 'Uploaded file is empty (0 bytes)' });
    }

    const filePath = req.file.path;
    const probe = await probeFile(filePath);

    if (!probe.hasAudio && !probe.hasVideo) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: 'Uploaded file does not contain valid audio or video tracks' });
    }

    const fileId = path.parse(req.file.filename).name;

    fileRegistry.set(fileId, {
      id: fileId,
      originalName: req.file.originalname,
      path: filePath,
      size: req.file.size,
      mimetype: req.file.mimetype,
      probe
    });

    res.json({
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      probe,
      streamUrl: `/api/stream/${fileId}`
    });
  } catch (err) {
    console.error('Upload & probe error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(400).json({ error: `Corrupt or unsupported media file: ${err.message}` });
  }
});

// 3. Audio / Video Probe endpoint (by existing fileId or path)
app.get('/api/probe/:fileId', async (req, res) => {
  try {
    const fileInfo = fileRegistry.get(req.params.fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const probe = await probeFile(fileInfo.path);
    res.json({ fileId: req.params.fileId, probe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Audio format & kbps converter
app.post('/api/convert', async (req, res) => {
  try {
    const { fileId, targetFormat = 'mp3', bitrate = '320k', sampleRate, channels } = req.body;
    const fileInfo = fileRegistry.get(fileId);

    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    if (!fileInfo.probe || (!fileInfo.probe.hasAudio && !fileInfo.probe.hasVideo)) {
      return res.status(400).json({ error: 'Source file contains no valid media track to convert' });
    }

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const codecArgs = getCodecArgs(cleanExt, bitrate, sampleRate, channels);
    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-vn', ...codecArgs, outputPath];

    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_converted.${cleanExt}`;

    fileRegistry.set(outputId, {
      id: outputId,
      originalName: downloadName,
      path: outputPath,
      size: probe.size,
      probe
    });

    res.json({
      outputId,
      downloadName,
      downloadUrl: `/api/download/${outputId}`,
      streamUrl: `/api/stream/${outputId}`,
      probe
    });
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Trimming & Cutting Audio
app.post('/api/trim', async (req, res) => {
  try {
    const {
      fileId,
      start = 0,
      end,
      mode = 'keep', // 'keep' or 'remove'
      fadeIn = 0,
      fadeOut = 0,
      targetFormat = 'mp3',
      bitrate = '320k'
    } = req.body;

    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const s = Math.max(0, parseFloat(start) || 0);
    const totalDuration = fileInfo.probe ? fileInfo.probe.duration : 0;
    const e = end !== undefined && end !== null && end !== '' ? Math.min(totalDuration || 999999, parseFloat(end)) : totalDuration;

    if (e <= s && mode === 'keep') {
      return res.status(400).json({ error: 'End time must be greater than start time' });
    }

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    let ffmpegArgs = [];

    if (mode === 'keep') {
      // Keep segment [s, e] with millisecond precision
      const duration = Math.max(0.01, e - s);
      const audioFilters = [];
      const maxFade = duration / 2;
      const effFadeIn = Math.min(Math.max(0, parseFloat(fadeIn) || 0), maxFade);
      const effFadeOut = Math.min(Math.max(0, parseFloat(fadeOut) || 0), maxFade);

      if (effFadeIn > 0) {
        audioFilters.push(`afade=t=in:ss=0:d=${effFadeIn.toFixed(3)}`);
      }
      if (effFadeOut > 0) {
        audioFilters.push(`afade=t=out:st=${(duration - effFadeOut).toFixed(3)}:d=${effFadeOut.toFixed(3)}`);
      }

      ffmpegArgs = ['-y', '-ss', s.toFixed(3), '-t', duration.toFixed(3), '-i', fileInfo.path, '-vn'];
      if (audioFilters.length > 0) {
        ffmpegArgs.push('-af', audioFilters.join(','));
      }
      ffmpegArgs.push(...codecArgs, outputPath);
    } else {
      // Remove middle segment [s, e] and join [0, s] + [e, end]
      if (s <= 0.001 && totalDuration > 0 && e >= totalDuration - 0.001) {
        return res.status(400).json({ error: 'Cannot remove the entire audio duration' });
      }

      if (s <= 0.001) {
        // Cut start only: keep segment from e to end
        ffmpegArgs = [
          '-y',
          '-ss', e.toFixed(3),
          '-i', fileInfo.path,
          '-vn',
          ...codecArgs,
          outputPath
        ];
      } else if (totalDuration > 0 && e >= totalDuration - 0.001) {
        // Cut end only: keep segment from 0 to s
        ffmpegArgs = [
          '-y',
          '-t', s.toFixed(3),
          '-i', fileInfo.path,
          '-vn',
          ...codecArgs,
          outputPath
        ];
      } else {
        // Cut middle: concat [0, s] + [e, end]
        const filterGraph = `[0:a]atrim=0:${s.toFixed(3)},asetpts=PTS-STARTPTS[p1];[0:a]atrim=start=${e.toFixed(3)},asetpts=PTS-STARTPTS[p2];[p1][p2]concat=n=2:v=0:a=1[out]`;
        ffmpegArgs = [
          '-y',
          '-i', fileInfo.path,
          '-vn',
          '-filter_complex', filterGraph,
          '-map', '[out]',
          ...codecArgs,
          outputPath
        ];
      }
    }

    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_${mode === 'keep' ? 'trimmed' : 'cut'}.${cleanExt}`;

    fileRegistry.set(outputId, {
      id: outputId,
      originalName: downloadName,
      path: outputPath,
      size: probe.size,
      probe
    });

    res.json({
      outputId,
      downloadName,
      downloadUrl: `/api/download/${outputId}`,
      streamUrl: `/api/stream/${outputId}`,
      probe
    });
  } catch (err) {
    console.error('Trimming error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Video to Audio Extraction (dual route: /api/video-to-audio and /api/extract-audio)
app.post(['/api/video-to-audio', '/api/extract-audio'], async (req, res) => {
  try {
    const {
      fileId,
      targetFormat = 'mp3',
      bitrate = '320k',
      sampleRate,
      channels,
      start,
      end
    } = req.body;

    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const ffmpegArgs = ['-y'];

    if (start !== undefined && start !== null && !isNaN(parseFloat(start))) {
      ffmpegArgs.push('-ss', start.toString());
    }
    if (end !== undefined && end !== null && !isNaN(parseFloat(end))) {
      ffmpegArgs.push('-to', end.toString());
    }

    ffmpegArgs.push('-i', fileInfo.path, '-vn');

    const codecArgs = getCodecArgs(cleanExt, bitrate, sampleRate, channels);
    ffmpegArgs.push(...codecArgs, outputPath);

    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_audio.${cleanExt}`;

    fileRegistry.set(outputId, {
      id: outputId,
      originalName: downloadName,
      path: outputPath,
      size: probe.size,
      probe
    });

    res.json({
      outputId,
      downloadName,
      downloadUrl: `/api/download/${outputId}`,
      streamUrl: `/api/stream/${outputId}`,
      probe
    });
  } catch (err) {
    console.error('Video to audio error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Effects Studio (Pitch, Tempo/Speed, Volume, Normalization, Filters, 8D, Vocal remover, Reverse, Noise Reduction)
app.post('/api/effects', async (req, res) => {
  try {
    const {
      fileId,
      speed = 1.0,           // 0.25 to 3.0
      pitch = 0,             // semitones -12 to +12
      preservePitch = true,  // if changing speed
      volume = 1.0,          // gain multiplier 0.1 to 3.0
      normalize = 'none',    // 'none', 'ebu_r128', 'peak'
      bass = 0,              // dB boost/cut -10 to +15
      treble = 0,            // dB boost/cut -10 to +15
      preset = 'flat',       // 'vocal_clarity', 'lo_fi', 'bass_boost', 'radio'
      reverse = false,       // areverse
      panning8D = false,     // apulsator
      vocalRemover = false,  // center channel cancel
      noiseReduction = 'none', // 'none', 'light', 'medium', 'heavy'
      targetFormat = 'mp3',
      bitrate = '320k'
    } = req.body;

    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const filters = [];

    // Noise Reduction using FFT denoiser (afftdn)
    if (noiseReduction === 'light') {
      filters.push('afftdn=nr=10:nf=-25:tn=1');
    } else if (noiseReduction === 'medium') {
      filters.push('afftdn=nr=18:nf=-30:tn=1');
    } else if (noiseReduction === 'heavy') {
      filters.push('afftdn=nr=25:nf=-35:tn=1');
    }

    // Reverse
    if (reverse) {
      filters.push('areverse');
    }

    // Vocal remover (ensure stereo channel layout before phase cancellation)
    if (vocalRemover) {
      filters.push('aformat=channel_layouts=stereo,stereotools=mlev=0.015625:slev=1.4');
    }

    // Speed & Pitch
    const parsedSpeed = parseFloat(speed) || 1.0;
    const parsedPitch = parseInt(pitch, 10) || 0;

    if (parsedPitch !== 0 || parsedSpeed !== 1.0) {
      if (parsedPitch !== 0 && preservePitch) {
        // Use rubberband filter for pitch shift without changing tempo
        const pitchScale = Math.pow(2, parsedPitch / 12);
        filters.push(`rubberband=pitch=${pitchScale.toFixed(4)}:tempo=${parsedSpeed.toFixed(4)}`);
      } else if (parsedSpeed !== 1.0 && !preservePitch) {
        // Vinyl speed/pitch change
        const sampleRate = fileInfo.probe && fileInfo.probe.audio ? fileInfo.probe.audio.sampleRate : 44100;
        const newRate = Math.round(sampleRate * parsedSpeed);
        filters.push(`asetrate=${newRate},aresample=${sampleRate}`);
      } else if (parsedSpeed !== 1.0 && preservePitch) {
        // Multiple atempo filters chained if speed is outside [0.5, 2.0]
        let current = parsedSpeed;
        while (current > 2.0) {
          filters.push('atempo=2.0');
          current /= 2.0;
        }
        while (current < 0.5) {
          filters.push('atempo=0.5');
          current /= 0.5;
        }
        filters.push(`atempo=${current.toFixed(4)}`);
      }
    }

    // Presets & EQ
    if (preset === 'vocal_clarity') {
      filters.push('highpass=f=120,equalizer=f=3000:t=q:w=1.2:g=4,equalizer=f=6000:t=q:w=1.0:g=3');
    } else if (preset === 'lo_fi') {
      filters.push('highpass=f=350,lowpass=f=3600,volume=1.2');
    } else if (preset === 'radio') {
      filters.push('highpass=f=600,lowpass=f=2800,equalizer=f=1200:t=q:w=2:g=6');
    }

    // Custom Bass & Treble
    if (bass !== 0) {
      filters.push(`bass=g=${bass}:f=120`);
    }
    if (treble !== 0) {
      filters.push(`treble=g=${treble}:f=3200`);
    }

    // 8D Audio Panning
    if (panning8D) {
      filters.push('apulsator=hz=0.125:mode=sine:width=0.9');
    }

    // Volume adjustment with soft limiter to prevent clipping on boost
    const parsedVol = parseFloat(volume);
    if (!isNaN(parsedVol) && parsedVol !== 1.0) {
      if (parsedVol > 1.0) {
        filters.push(`volume=${parsedVol.toFixed(2)},alimiter=limit=0.98:attack=5:release=50:asc=true`);
      } else if (parsedVol >= 0) {
        filters.push(`volume=${parsedVol.toFixed(2)}`);
      }
    }

    // Normalization
    if (normalize === 'ebu_r128') {
      filters.push('loudnorm=I=-14:LRA=11:TP=-1.5');
    } else if (normalize === 'peak') {
      filters.push('alimiter=limit=0.95:level=true');
    }

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-vn'];
    if (filters.length > 0) {
      ffmpegArgs.push('-af', filters.join(','));
    }
    ffmpegArgs.push(...codecArgs, outputPath);

    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_fx.${cleanExt}`;

    fileRegistry.set(outputId, {
      id: outputId,
      originalName: downloadName,
      path: outputPath,
      size: probe.size,
      probe
    });

    res.json({
      outputId,
      downloadName,
      downloadUrl: `/api/download/${outputId}`,
      streamUrl: `/api/stream/${outputId}`,
      probe
    });
  } catch (err) {
    console.error('Effects processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Audio Merger / Joiner (dual route: /api/merge and /api/merge-audio with multi-track crossfade)
app.post(['/api/merge', '/api/merge-audio'], upload.array('files', 20), async (req, res) => {
  try {
    const { crossfade = 0, targetFormat = 'mp3', bitrate = '320k' } = req.body;
    let existingIds = [];
    if (Array.isArray(req.body.fileIds)) {
      existingIds = req.body.fileIds;
    } else if (typeof req.body.fileIds === 'string') {
      try { existingIds = JSON.parse(req.body.fileIds); } catch (e) {}
    }

    const filesToMerge = [];

    // Existing registered files
    for (const id of existingIds) {
      const info = fileRegistry.get(id);
      if (info && fs.existsSync(info.path)) {
        filesToMerge.push(info.path);
      }
    }

    // Newly uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        filesToMerge.push(file.path);
      }
    }

    if (filesToMerge.length < 2) {
      return res.status(400).json({ error: 'At least 2 audio files are required to merge' });
    }

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    const crossfadeDuration = parseFloat(crossfade) || 0;

    let ffmpegArgs = ['-y'];

    if (crossfadeDuration > 0) {
      // Probe track durations to safely clamp crossfade duration
      const durations = [];
      for (const f of filesToMerge) {
        try {
          const p = await probeFile(f);
          if (p && p.duration > 0) durations.push(p.duration);
        } catch (e) {}
      }
      const minDuration = durations.length > 0 ? Math.min(...durations) : 5;
      const effCrossfade = Math.max(0.1, Math.min(crossfadeDuration, minDuration * 0.45));

      for (const f of filesToMerge) {
        ffmpegArgs.push('-i', f);
      }

      if (filesToMerge.length === 2) {
        ffmpegArgs.push('-filter_complex', `acrossfade=d=${effCrossfade.toFixed(2)}:c1=tri:c2=tri`);
        ffmpegArgs.push(...codecArgs, outputPath);
      } else {
        // Multi-track chained acrossfade
        const cfFilters = [];
        let prevOut = 'cf0';
        cfFilters.push(`[0:a][1:a]acrossfade=d=${effCrossfade.toFixed(2)}:c1=tri:c2=tri[${prevOut}]`);
        for (let i = 2; i < filesToMerge.length; i++) {
          const nextOut = i === filesToMerge.length - 1 ? 'out' : `cf${i - 1}`;
          cfFilters.push(`[${prevOut}][${i}:a]acrossfade=d=${effCrossfade.toFixed(2)}:c1=tri:c2=tri[${nextOut}]`);
          prevOut = nextOut;
        }
        ffmpegArgs.push('-filter_complex', cfFilters.join(';'), '-map', '[out]');
        ffmpegArgs.push(...codecArgs, outputPath);
      }
    } else {
      // Sequential concat with resampled audio to prevent layout/rate mismatch
      for (const f of filesToMerge) {
        ffmpegArgs.push('-i', f);
      }
      const streamFilters = filesToMerge.map((_, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=stereo[a${i}]`).join(';');
      const streamInputs = filesToMerge.map((_, i) => `[a${i}]`).join('');
      ffmpegArgs.push('-filter_complex', `${streamFilters};${streamInputs}concat=n=${filesToMerge.length}:v=0:a=1[out]`, '-map', '[out]');
      ffmpegArgs.push(...codecArgs, outputPath);
    }

    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `merged_soundcraft_${Date.now()}.${cleanExt}`;

    fileRegistry.set(outputId, {
      id: outputId,
      originalName: downloadName,
      path: outputPath,
      size: probe.size,
      probe
    });

    res.json({
      outputId,
      downloadName,
      downloadUrl: `/api/download/${outputId}`,
      streamUrl: `/api/stream/${outputId}`,
      probe
    });
  } catch (err) {
    console.error('Merge error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dedicated DSP Endpoint: /api/volume (0% to 300% gain, soft limiter / clipping prevention)
app.post('/api/volume', async (req, res) => {
  try {
    const { fileId, volume = 1.0, gain, targetFormat = 'mp3', bitrate = '320k' } = req.body;
    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    let rawVol = volume !== undefined ? volume : gain;
    let parsedVol = typeof rawVol === 'string' && rawVol.endsWith('%') ? parseFloat(rawVol) / 100 : parseFloat(rawVol);
    if (isNaN(parsedVol) || parsedVol < 0) parsedVol = 1.0;

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    const filter = parsedVol > 1.0
      ? `volume=${parsedVol.toFixed(2)},alimiter=limit=0.98:attack=5:release=50:asc=true`
      : `volume=${parsedVol.toFixed(2)}`;

    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-vn', '-af', filter, ...codecArgs, outputPath];
    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_vol_${Math.round(parsedVol * 100)}pct.${cleanExt}`;
    fileRegistry.set(outputId, { id: outputId, originalName: downloadName, path: outputPath, size: probe.size, probe });

    res.json({ outputId, downloadName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('Volume adjustment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dedicated DSP Endpoint: /api/speed (0.25x to 3.0x speed, with or without pitch change)
app.post('/api/speed', async (req, res) => {
  try {
    const { fileId, speed = 1.0, pitch = 0, preservePitch = true, targetFormat = 'mp3', bitrate = '320k' } = req.body;
    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const parsedSpeed = Math.max(0.25, Math.min(4.0, parseFloat(speed) || 1.0));
    const parsedPitch = parseInt(pitch, 10) || 0;
    const filters = [];

    if (parsedPitch !== 0 && preservePitch) {
      const pitchScale = Math.pow(2, parsedPitch / 12);
      filters.push(`rubberband=pitch=${pitchScale.toFixed(4)}:tempo=${parsedSpeed.toFixed(4)}`);
    } else if (parsedSpeed !== 1.0 && !preservePitch) {
      const sampleRate = fileInfo.probe?.audio?.sampleRate || 44100;
      const newRate = Math.round(sampleRate * parsedSpeed);
      filters.push(`asetrate=${newRate},aresample=${sampleRate}`);
    } else if (parsedSpeed !== 1.0 && preservePitch) {
      let current = parsedSpeed;
      while (current > 2.0) {
        filters.push('atempo=2.0');
        current /= 2.0;
      }
      while (current < 0.5) {
        filters.push('atempo=0.5');
        current /= 0.5;
      }
      filters.push(`atempo=${current.toFixed(4)}`);
    }

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-vn'];
    if (filters.length > 0) ffmpegArgs.push('-af', filters.join(','));
    ffmpegArgs.push(...codecArgs, outputPath);

    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_speed_${parsedSpeed}x.${cleanExt}`;
    fileRegistry.set(outputId, { id: outputId, originalName: downloadName, path: outputPath, size: probe.size, probe });

    res.json({ outputId, downloadName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('Speed adjustment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dedicated DSP Endpoint: /api/reverse (Audio reverse effect)
app.post('/api/reverse', async (req, res) => {
  try {
    const { fileId, targetFormat = 'mp3', bitrate = '320k' } = req.body;
    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-vn', '-af', 'areverse', ...codecArgs, outputPath];
    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_reversed.${cleanExt}`;
    fileRegistry.set(outputId, { id: outputId, originalName: downloadName, path: outputPath, size: probe.size, probe });

    res.json({ outputId, downloadName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('Reverse audio error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dedicated DSP Endpoint: /api/noise-reduction (FFT-based denoiser)
app.post('/api/noise-reduction', async (req, res) => {
  try {
    const { fileId, strength = 'medium', noiseReductionDb, targetFormat = 'mp3', bitrate = '320k' } = req.body;
    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    let nr = 18;
    let nf = -30;
    if (strength === 'light') {
      nr = 10;
      nf = -25;
    } else if (strength === 'heavy') {
      nr = 25;
      nf = -35;
    }
    if (noiseReductionDb && !isNaN(parseFloat(noiseReductionDb))) {
      nr = Math.max(5, Math.min(30, Math.abs(parseFloat(noiseReductionDb))));
    }

    const filter = `afftdn=nr=${nr}:nf=${nf}:tn=1`;
    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-vn', '-af', filter, ...codecArgs, outputPath];
    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_denoised.${cleanExt}`;
    fileRegistry.set(outputId, { id: outputId, originalName: downloadName, path: outputPath, size: probe.size, probe });

    res.json({ outputId, downloadName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('Noise reduction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dedicated DSP Endpoint: /api/vocal-remover (center channel phase cancellation / karaoke)
app.post('/api/vocal-remover', async (req, res) => {
  try {
    const { fileId, targetFormat = 'mp3', bitrate = '320k' } = req.body;
    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const filter = 'aformat=channel_layouts=stereo,stereotools=mlev=0.015625:slev=1.4';
    const outputId = uuidv4();
    const cleanExt = targetFormat.toLowerCase();
    const outputFileName = `${outputId}.${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);
    const codecArgs = getCodecArgs(cleanExt, bitrate);

    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-vn', '-af', filter, ...codecArgs, outputPath];
    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = `${path.parse(fileInfo.originalName).name}_karaoke.${cleanExt}`;
    fileRegistry.set(outputId, { id: outputId, originalName: downloadName, path: outputPath, size: probe.size, probe });

    res.json({ outputId, downloadName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('Vocal remover error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. ID3 / Media Tags Editor
app.post('/api/metadata', async (req, res) => {
  try {
    const { fileId, title, artist, album, year, genre, comment } = req.body;
    const fileInfo = fileRegistry.get(fileId);

    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const ext = path.extname(fileInfo.path);
    const outputId = uuidv4();
    const outputFileName = `${outputId}${ext}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const metaArgs = [];
    if (title !== undefined) metaArgs.push('-metadata', `title=${title}`);
    if (artist !== undefined) metaArgs.push('-metadata', `artist=${artist}`);
    if (album !== undefined) metaArgs.push('-metadata', `album=${album}`);
    if (year !== undefined) metaArgs.push('-metadata', `date=${year}`);
    if (genre !== undefined) metaArgs.push('-metadata', `genre=${genre}`);
    if (comment !== undefined) metaArgs.push('-metadata', `comment=${comment}`);

    const ffmpegArgs = ['-y', '-i', fileInfo.path, '-c', 'copy', ...metaArgs, outputPath];
    await runFFmpeg(ffmpegArgs);

    const probe = await probeFile(outputPath);
    const downloadName = fileInfo.originalName;

    fileRegistry.set(outputId, {
      id: outputId,
      originalName: downloadName,
      path: outputPath,
      size: probe.size,
      probe
    });

    res.json({
      outputId,
      downloadName,
      downloadUrl: `/api/download/${outputId}`,
      streamUrl: `/api/stream/${outputId}`,
      probe
    });
  } catch (err) {
    console.error('Metadata update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Audio & Video Streaming with Range header support
app.get('/api/stream/:fileId', (req, res) => {
  const fileInfo = fileRegistry.get(req.params.fileId);
  if (!fileInfo || !fs.existsSync(fileInfo.path)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = fileInfo.path;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Determine mime type
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.aac': 'audio/aac',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.opus': 'audio/opus',
    '.wma': 'audio/x-ms-wma',
    '.aiff': 'audio/x-aiff',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// 11. Download endpoint
app.get('/api/download/:fileId', (req, res) => {
  const fileInfo = fileRegistry.get(req.params.fileId);
  if (!fileInfo || !fs.existsSync(fileInfo.path)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(fileInfo.path, fileInfo.originalName);
});

// 12. VIDEO STUDIO PRODUCTION PIPELINE & UTILITIES
async function resolveVideoSource(req) {
  let fileInfo;
  if (req.file) {
    const up = req.file;
    const fid = path.parse(up.filename).name;
    const probe = await probeFile(up.path);
    fileInfo = { id: fid, originalName: up.originalname, path: up.path, size: up.size, probe };
    fileRegistry.set(fid, fileInfo);
  } else if (req.files && req.files.file && req.files.file[0]) {
    const up = req.files.file[0];
    const fid = path.parse(up.filename).name;
    const probe = await probeFile(up.path);
    fileInfo = { id: fid, originalName: up.originalname, path: up.path, size: up.size, probe };
    fileRegistry.set(fid, fileInfo);
  } else if (req.body && req.body.fileId) {
    fileInfo = fileRegistry.get(req.body.fileId);
  }
  if (fileInfo && !fileInfo.probe && fs.existsSync(fileInfo.path)) {
    try {
      fileInfo.probe = await probeFile(fileInfo.path);
    } catch (e) {}
  }
  return fileInfo;
}

function getSystemFontFile() {
  const candidates = [
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const normalized = c.replace(/\\/g, '/');
      return normalized.replace(':', '\\:');
    }
  }
  return null;
}

function getAspectRatioMultiplier(preset) {
  switch (preset) {
    case '16:9': return 16 / 9;
    case '9:16': return 9 / 16;
    case '1:1': return 1.0;
    case '4:5': return 4 / 5;
    case '21:9': return 21 / 9;
    default: return null;
  }
}

// DEDICATED ENDPOINT: Video Trimmer & Precision Cut
app.post('/api/video/trim', upload.single('file'), async (req, res) => {
  let runningProc = null;
  req.on('close', () => {
    if (!res.writableEnded && runningProc) {
      try { runningProc.kill('SIGKILL'); } catch (e) {}
    }
  });

  try {
    const fileInfo = await resolveVideoSource(req);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    const { trimStart = 0, trimEnd, cutMode = 'precise' } = req.body;
    const s = Math.max(0, parseFloat(trimStart) || 0);
    const totalDur = fileInfo.probe?.duration || 0;
    const e = trimEnd ? Math.min(totalDur || 999999, parseFloat(trimEnd)) : totalDur;
    const durationToCut = e > s ? (e - s) : (totalDur > s ? totalDur - s : 5);

    const ext = path.extname(fileInfo.originalName).toLowerCase() || '.mp4';
    const outputId = uuidv4();
    const cleanExt = ext === '.webm' ? '.webm' : (ext === '.mov' ? '.mov' : (ext === '.mkv' ? '.mkv' : '.mp4'));
    const outputFileName = `${outputId}${cleanExt}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const args = ['-y'];
    if (cutMode === 'fast') {
      if (s > 0) args.push('-ss', s.toString());
      if (durationToCut > 0) args.push('-t', durationToCut.toString());
      args.push('-i', fileInfo.path, '-c', 'copy', outputPath);
    } else {
      if (s > 0) args.push('-ss', s.toString());
      if (durationToCut > 0) args.push('-t', durationToCut.toString());
      args.push('-i', fileInfo.path);
      args.push('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2');
      if (cleanExt === '.webm') {
        args.push('-c:v', 'libvpx-vp9', '-crf', '24', '-b:v', '0');
        if (fileInfo.probe?.hasAudio) {
          args.push('-c:a', 'libopus', '-b:a', '128k');
        } else {
          args.push('-an');
        }
      } else {
        args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p');
        if (fileInfo.probe?.hasAudio) {
          args.push('-c:a', 'aac', '-b:a', '192k');
        } else {
          args.push('-an');
        }
      }
      args.push(outputPath);
    }

    await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
    const probe = await probeFile(outputPath);
    const dlName = `${path.parse(fileInfo.originalName).name}_trimmed${cleanExt}`;
    fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: probe.size, probe });
    res.json({ outputId, downloadName: dlName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('[Video Trim Error]:', err);
    res.status(500).json({ error: err.message || 'Video trimming failed' });
  }
});

// DEDICATED ENDPOINT: 9:16 Shorts / Reels Crop
app.post('/api/video/crop-shorts', upload.single('file'), async (req, res) => {
  let runningProc = null;
  req.on('close', () => {
    if (!res.writableEnded && runningProc) {
      try { runningProc.kill('SIGKILL'); } catch (e) {}
    }
  });

  try {
    const fileInfo = await resolveVideoSource(req);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    const { aspectMode = 'crop', panX = 50, panY = 50, quality = 'medium' } = req.body;
    const outputId = uuidv4();
    const outputFileName = `${outputId}.mp4`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const srcW = fileInfo.probe?.video?.width || 1920;
    const srcH = fileInfo.probe?.video?.height || 1080;
    const targetRatio = 9 / 16;
    let th = Math.max(srcH, 1280);
    let tw = Math.round(th * targetRatio);
    if (tw % 2 !== 0) tw -= 1;
    if (th % 2 !== 0) th -= 1;

    const vfParts = [];
    if (aspectMode === 'fit-blur') {
      vfParts.push(`split[fg][bg];[bg]scale=${tw}:${th}:force_original_aspect_ratio=increase,crop=${tw}:${th},boxblur=20:5[bgout];[fg]scale=${tw}:${th}:force_original_aspect_ratio=decrease[fgout];[bgout][fgout]overlay=(W-w)/2:(H-h)/2`);
    } else if (aspectMode === 'fit-pad') {
      vfParts.push(`scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:color=black`);
    } else {
      const curRatio = srcW / srcH;
      const pX = Math.max(0, Math.min(100, parseFloat(panX) || 50));
      const pY = Math.max(0, Math.min(100, parseFloat(panY) || 50));
      let cW, cH, cX, cY;
      if (curRatio > targetRatio) {
        cH = srcH - (srcH % 2);
        cW = Math.round(cH * targetRatio);
        if (cW % 2 !== 0) cW -= 1;
        const maxX = Math.max(0, srcW - cW);
        cX = Math.round(maxX * (pX / 100));
        if (cX % 2 !== 0) cX -= 1;
        cY = 0;
      } else {
        cW = srcW - (srcW % 2);
        cH = Math.round(cW / targetRatio);
        if (cH % 2 !== 0) cH -= 1;
        const maxY = Math.max(0, srcH - cH);
        cX = 0;
        cY = Math.round(maxY * (pY / 100));
        if (cY % 2 !== 0) cY -= 1;
      }
      vfParts.push(`crop=${cW}:${cH}:${cX}:${cY},scale=${tw}:${th}`);
    }
    vfParts.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');

    let crf = '23';
    if (quality === 'high') crf = '18';
    else if (quality === 'low' || quality === 'max_compression') crf = '28';

    const args = ['-y', '-i', fileInfo.path, '-vf', vfParts.join(','), '-c:v', 'libx264', '-crf', crf, '-preset', 'veryfast', '-pix_fmt', 'yuv420p'];
    if (fileInfo.probe?.hasAudio) {
      args.push('-c:a', 'aac', '-b:a', '192k');
    } else {
      args.push('-an');
    }
    args.push(outputPath);

    await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
    const probe = await probeFile(outputPath);
    const dlName = `${path.parse(fileInfo.originalName).name}_shorts_916.mp4`;
    fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: probe.size, probe });
    res.json({ outputId, downloadName: dlName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('[Video Shorts Crop Error]:', err);
    res.status(500).json({ error: err.message || 'Crop to shorts failed' });
  }
});

// DEDICATED ENDPOINT: Video to Animated GIF
app.post('/api/video/to-gif', upload.single('file'), async (req, res) => {
  let runningProc = null;
  req.on('close', () => {
    if (!res.writableEnded && runningProc) {
      try { runningProc.kill('SIGKILL'); } catch (e) {}
    }
  });

  try {
    const fileInfo = await resolveVideoSource(req);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    const { trimStart = 0, trimEnd, fps = 15, width = 480, dither = 'bayer', speed = 1.0 } = req.body;
    const s = Math.max(0, parseFloat(trimStart) || 0);
    const e = parseFloat(trimEnd) || 0;
    const outputId = uuidv4();
    const outputFileName = `${outputId}.gif`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const args = ['-y'];
    if (s > 0) args.push('-ss', s.toString());
    if (e > s) {
      args.push('-t', (e - s).toString());
    } else if (s === 0 && (!e || e > 15)) {
      args.push('-t', '10');
    }
    args.push('-i', fileInfo.path);

    const targetFps = Math.min(24, Math.max(10, parseInt(fps, 10) || 15));
    const targetWidth = Math.min(1080, Math.max(240, parseInt(width, 10) || 480));

    let vf = `fps=${targetFps},scale=${targetWidth}:-2:flags=lanczos`;
    const spd = parseFloat(speed) || 1.0;
    if (spd !== 1.0) {
      vf = `setpts=(1/${spd})*PTS,` + vf;
    }

    let ditherOpt = 'dither=bayer:bayer_scale=4';
    if (dither === 'floyd_steinberg') ditherOpt = 'dither=floyd_steinberg';
    else if (dither === 'sierra2_4a') ditherOpt = 'dither=sierra2_4a';
    else if (dither === 'none') ditherOpt = 'dither=none';

    args.push('-vf', `${vf},split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=${ditherOpt}`, outputPath);

    await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
    const stats = fs.statSync(outputPath);
    const dlName = `${path.parse(fileInfo.originalName).name}_clip.gif`;
    fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: stats.size });
    res.json({ outputId, downloadName: dlName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, size: stats.size });
  } catch (err) {
    console.error('[Video to GIF Error]:', err);
    res.status(500).json({ error: err.message || 'GIF conversion failed' });
  }
});

// DEDICATED ENDPOINT: Video Compressor
app.post('/api/video/compress', upload.single('file'), async (req, res) => {
  let runningProc = null;
  req.on('close', () => {
    if (!res.writableEnded && runningProc) {
      try { runningProc.kill('SIGKILL'); } catch (e) {}
    }
  });

  try {
    const fileInfo = await resolveVideoSource(req);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    const { targetSizeMB, preset = 'medium', resolution = 'original' } = req.body;
    const outputId = uuidv4();
    const outputFileName = `${outputId}.mp4`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const vfParts = [];
    if (resolution === '1080p') vfParts.push('scale=-2:1080');
    else if (resolution === '720p') vfParts.push('scale=-2:720');
    else if (resolution === '480p') vfParts.push('scale=-2:480');
    else if (resolution === '360p') vfParts.push('scale=-2:360');
    vfParts.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');

    const args = ['-y', '-i', fileInfo.path, '-vf', vfParts.join(','), '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p'];

    const targetMB = parseFloat(targetSizeMB);
    const dur = fileInfo.probe?.duration || 10;
    if (!isNaN(targetMB) && targetMB > 0 && dur > 0) {
      const targetBps = Math.max(100, Math.floor(((targetMB * 8192) / dur) - 128));
      args.push('-b:v', `${targetBps}k`, '-maxrate', `${Math.floor(targetBps * 1.3)}k`, '-bufsize', `${Math.floor(targetBps * 2)}k`);
    } else {
      let crf = '24';
      if (preset === 'high') crf = '18';
      else if (preset === 'low') crf = '28';
      else if (preset === 'max_compression') crf = '34';
      args.push('-crf', crf);
    }

    if (fileInfo.probe?.hasAudio) {
      args.push('-c:a', 'aac', '-b:a', '128k');
    } else {
      args.push('-an');
    }
    args.push(outputPath);

    await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
    const probe = await probeFile(outputPath);
    const dlName = `${path.parse(fileInfo.originalName).name}_compressed.mp4`;
    fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: probe.size, probe });
    res.json({ outputId, downloadName: dlName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe, originalSize: fileInfo.size, compressedSize: probe.size });
  } catch (err) {
    console.error('[Video Compress Error]:', err);
    res.status(500).json({ error: err.message || 'Video compression failed' });
  }
});

// DEDICATED ENDPOINT: Video Format Converter
app.post('/api/video/convert', upload.single('file'), async (req, res) => {
  let runningProc = null;
  req.on('close', () => {
    if (!res.writableEnded && runningProc) {
      try { runningProc.kill('SIGKILL'); } catch (e) {}
    }
  });

  try {
    const fileInfo = await resolveVideoSource(req);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    const { targetFormat = 'mp4', quality = 'medium', resolution = 'original' } = req.body;
    const cleanFormat = targetFormat.toLowerCase();
    const outputId = uuidv4();
    const outputFileName = `${outputId}.${cleanFormat}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const vfParts = [];
    if (resolution === '1080p') vfParts.push('scale=-2:1080');
    else if (resolution === '720p') vfParts.push('scale=-2:720');
    else if (resolution === '480p') vfParts.push('scale=-2:480');
    else if (resolution === '360p') vfParts.push('scale=-2:360');
    vfParts.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');

    let crf = '23';
    if (quality === 'high') crf = '18';
    else if (quality === 'low') crf = '28';
    else if (quality === 'max_compression') crf = '34';

    const args = ['-y', '-i', fileInfo.path, '-vf', vfParts.join(',')];

    if (cleanFormat === 'webm') {
      args.push('-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0');
      if (fileInfo.probe?.hasAudio) {
        args.push('-c:a', 'libopus', '-b:a', '128k');
      } else {
        args.push('-an');
      }
    } else {
      args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf, '-pix_fmt', 'yuv420p');
      if (fileInfo.probe?.hasAudio) {
        args.push('-c:a', 'aac', '-b:a', '192k');
      } else {
        args.push('-an');
      }
    }
    args.push(outputPath);

    await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
    const probe = await probeFile(outputPath);
    const dlName = `${path.parse(fileInfo.originalName).name}_converted.${cleanFormat}`;
    fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: probe.size, probe });
    res.json({ outputId, downloadName: dlName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('[Video Convert Error]:', err);
    res.status(500).json({ error: err.message || 'Video conversion failed' });
  }
});

// DEDICATED ENDPOINT: Audio Extraction from Video
app.post('/api/video/extract-audio', upload.single('file'), async (req, res) => {
  let runningProc = null;
  req.on('close', () => {
    if (!res.writableEnded && runningProc) {
      try { runningProc.kill('SIGKILL'); } catch (e) {}
    }
  });

  try {
    const fileInfo = await resolveVideoSource(req);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    if (!fileInfo.probe?.hasAudio) {
      return res.status(400).json({ error: 'This video file does not contain an audio track to extract.' });
    }

    const { targetFormat = 'mp3', bitrate = '320k', trimStart = 0, trimEnd } = req.body;
    const cleanFormat = (targetFormat || 'mp3').toLowerCase();
    const outputId = uuidv4();
    const outputFileName = `${outputId}.${cleanFormat}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    const s = Math.max(0, parseFloat(trimStart) || 0);
    const e = parseFloat(trimEnd) || 0;
    const args = ['-y'];
    if (s > 0) args.push('-ss', s.toString());
    if (e > s) args.push('-t', (e - s).toString());
    args.push('-i', fileInfo.path, '-vn');

    if (cleanFormat === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-b:a', bitrate || '320k');
    } else if (cleanFormat === 'wav') {
      args.push('-c:a', 'pcm_s16le');
    } else if (cleanFormat === 'm4a' || cleanFormat === 'aac') {
      args.push('-c:a', 'aac', '-b:a', bitrate || '256k');
    } else if (cleanFormat === 'opus' || cleanFormat === 'ogg') {
      args.push('-c:a', 'libopus', '-b:a', bitrate || '128k');
    } else {
      args.push('-c:a', 'libmp3lame', '-b:a', '320k');
    }
    args.push(outputPath);

    await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
    const probe = await probeFile(outputPath);
    const dlName = `${path.parse(fileInfo.originalName).name}_audio.${cleanFormat}`;
    fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: probe.size, probe });
    res.json({ outputId, downloadName: dlName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
  } catch (err) {
    console.error('[Video Extract Audio Error]:', err);
    res.status(500).json({ error: err.message || 'Audio extraction failed' });
  }
});

// MASTER UNIFIED VIDEO STUDIO PROCESSOR
app.post('/api/video/process', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
  let runningProc = null;
  req.on('close', () => {
    if (!res.writableEnded && runningProc) {
      try { runningProc.kill('SIGKILL'); } catch (e) {}
    }
  });

  try {
    let fileInfo;
    if (req.files && req.files.file && req.files.file[0]) {
      const up = req.files.file[0];
      const fid = path.parse(up.filename).name;
      const probe = await probeFile(up.path);
      fileInfo = { id: fid, originalName: up.originalname, path: up.path, size: up.size, probe };
      fileRegistry.set(fid, fileInfo);
    } else if (req.body.fileId) {
      fileInfo = fileRegistry.get(req.body.fileId);
    }

    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }
    if (!fileInfo.probe) {
      fileInfo.probe = await probeFile(fileInfo.path);
    }

    let audioFileInfo;
    if (req.files && req.files.audio && req.files.audio[0]) {
      const aup = req.files.audio[0];
      const afid = path.parse(aup.filename).name;
      audioFileInfo = { id: afid, originalName: aup.originalname, path: aup.path };
      fileRegistry.set(afid, audioFileInfo);
    } else if (req.body.audioFileId) {
      audioFileInfo = fileRegistry.get(req.body.audioFileId);
    }

    const {
      trimStart,
      trimEnd,
      cutMode = 'precise',
      aspectRatio,
      aspectMode = 'crop',
      panX = 50,
      panY = 50,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      rotate = 0,
      flip = 'none',
      speed = 1.0,
      volume = 1.0,
      audioMode = 'original',
      bgAudioVolume = 0.5,
      watermarkText,
      watermarkPosition = 'bottom-right',
      filterType = 'none',
      brightness = 0,
      contrast = 1,
      saturation = 1,
      reverse = false,
      resolution = 'original',
      outputFormat = 'mp4',
      quality = 'medium',
      targetSizeMB,
      gifFps = 15,
      gifWidth = 480,
      gifDither = 'bayer'
    } = req.body;

    const outputId = uuidv4();
    const cleanFormat = (outputFormat || 'mp4').toLowerCase();
    const outputFileName = `${outputId}.${cleanFormat}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    // Audio Extraction Mode (MP3, WAV, AAC, M4A)
    if (cleanFormat === 'mp3' || cleanFormat === 'wav' || cleanFormat === 'aac' || cleanFormat === 'm4a') {
      if (!fileInfo.probe?.hasAudio) {
        return res.status(400).json({ error: 'Source video file does not have an audio track to extract.' });
      }
      const s = parseFloat(trimStart) || 0;
      const e = parseFloat(trimEnd) || 0;
      const args = ['-y'];
      if (s > 0) args.push('-ss', s.toString());
      if (e > s) args.push('-t', (e - s).toString());
      args.push('-i', fileInfo.path, '-vn');
      if (cleanFormat === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-b:a', '320k');
      } else if (cleanFormat === 'wav') {
        args.push('-c:a', 'pcm_s16le');
      } else {
        args.push('-c:a', 'aac', '-b:a', '256k');
      }
      args.push(outputPath);
      await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
      const probe = await probeFile(outputPath);
      const dlName = `${path.parse(fileInfo.originalName).name}_audio.${cleanFormat}`;
      fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: probe.size, probe });
      return res.json({
        outputId,
        downloadName: dlName,
        downloadUrl: `/api/download/${outputId}`,
        streamUrl: `/api/stream/${outputId}`,
        probe
      });
    }

    // High quality Animated GIF mode
    if (cleanFormat === 'gif') {
      const s = parseFloat(trimStart) || 0;
      const e = parseFloat(trimEnd) || 0;
      const args = ['-y'];
      if (s > 0) args.push('-ss', s.toString());
      if (e > s) {
        args.push('-t', (e - s).toString());
      } else if (s === 0 && (!e || e > 15)) {
        args.push('-t', '10');
      }
      args.push('-i', fileInfo.path);

      const targetFps = Math.min(24, Math.max(10, parseInt(gifFps, 10) || 15));
      const targetWidth = Math.min(1080, Math.max(240, parseInt(gifWidth, 10) || 480));

      let vf = `fps=${targetFps},scale=${targetWidth}:-2:flags=lanczos`;
      if (speed && parseFloat(speed) !== 1.0) {
        vf = `setpts=(1/${parseFloat(speed)})*PTS,` + vf;
      }
      if (filterType === 'grayscale') vf += ',hue=s=0';
      else if (filterType === 'sepia') vf += ',colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
      else if (filterType === 'invert') vf += ',negate';

      let ditherOpt = 'dither=bayer:bayer_scale=4';
      if (gifDither === 'floyd_steinberg') ditherOpt = 'dither=floyd_steinberg';
      else if (gifDither === 'sierra2_4a') ditherOpt = 'dither=sierra2_4a';
      else if (gifDither === 'none') ditherOpt = 'dither=none';

      args.push('-vf', `${vf},split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=${ditherOpt}`, outputPath);

      await runFFmpeg(args, null, { onSpawn: p => { runningProc = p; } });
      const stats = fs.statSync(outputPath);
      const dlName = `${path.parse(fileInfo.originalName).name}_clip.gif`;
      fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: stats.size });
      return res.json({
        outputId,
        downloadName: dlName,
        downloadUrl: `/api/download/${outputId}`,
        streamUrl: `/api/stream/${outputId}`,
        size: stats.size
      });
    }

    // Standard Video Processing (MP4, WebM, MOV, MKV)
    const vfParts = [];
    const afParts = [];

    // 1. ROTATE & FLIP
    const rot = parseInt(rotate, 10) || 0;
    if (rot === 90) vfParts.push('transpose=1');
    else if (rot === 180) vfParts.push('transpose=1,transpose=1');
    else if (rot === 270) vfParts.push('transpose=2');

    if (flip === 'horizontal') vfParts.push('hflip');
    else if (flip === 'vertical') vfParts.push('vflip');
    else if (flip === 'both') vfParts.push('hflip,vflip');

    const isSwapped = rot === 90 || rot === 270;
    const rawW = fileInfo.probe?.video?.width || 1280;
    const rawH = fileInfo.probe?.video?.height || 720;
    const srcW = isSwapped ? rawH : rawW;
    const srcH = isSwapped ? rawW : rawH;

    // 2. Speed
    const spd = parseFloat(speed) || 1.0;
    if (spd !== 1.0) {
      vfParts.push(`setpts=(1/${spd})*(PTS-STARTPTS)`);
      if (spd >= 0.5 && spd <= 2.0) {
        afParts.push(`atempo=${spd}`);
      } else if (spd > 2.0) {
        afParts.push(`atempo=2.0,atempo=${(spd / 2.0).toFixed(2)}`);
      } else if (spd < 0.5) {
        afParts.push(`atempo=0.5,atempo=${(spd / 0.5).toFixed(2)}`);
      }
    }

    // 3. Aspect Ratio & Framing
    const targetRatio = getAspectRatioMultiplier(aspectRatio);
    let tw, th;
    if (targetRatio) {
      if (targetRatio < 1.0) { // Vertical e.g. 9:16, 4:5
        th = Math.max(srcH, 1280);
        tw = Math.round(th * targetRatio);
      } else if (targetRatio === 1.0) { // 1:1 Square
        th = Math.max(srcW, srcH, 720);
        tw = th;
      } else { // Horizontal e.g. 16:9, 21:9
        tw = Math.max(srcW, 1280);
        th = Math.round(tw / targetRatio);
      }
      if (tw % 2 !== 0) tw -= 1;
      if (th % 2 !== 0) th -= 1;
    }

    if (cropWidth && cropHeight) {
      const cw = parseInt(cropWidth, 10);
      const ch = parseInt(cropHeight, 10);
      const cx = parseInt(cropX, 10) || 0;
      const cy = parseInt(cropY, 10) || 0;
      vfParts.push(`crop=${cw}:${ch}:${cx}:${cy}`);
    } else if (targetRatio) {
      if (aspectMode === 'fit-blur') {
        vfParts.push(`split[fg][bg];[bg]scale=${tw}:${th}:force_original_aspect_ratio=increase,crop=${tw}:${th},boxblur=20:5[bgout];[fg]scale=${tw}:${th}:force_original_aspect_ratio=decrease[fgout];[bgout][fgout]overlay=(W-w)/2:(H-h)/2`);
      } else if (aspectMode === 'fit-pad') {
        vfParts.push(`scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:color=black`);
      } else {
        let cW, cH, cX, cY;
        const curRatio = srcW / srcH;
        const pX = Math.max(0, Math.min(100, parseFloat(panX) || 50));
        const pY = Math.max(0, Math.min(100, parseFloat(panY) || 50));

        if (curRatio > targetRatio) {
          cH = srcH - (srcH % 2);
          cW = Math.round(cH * targetRatio);
          if (cW % 2 !== 0) cW -= 1;
          const maxX = Math.max(0, srcW - cW);
          cX = Math.round(maxX * (pX / 100));
          if (cX % 2 !== 0) cX -= 1;
          cY = 0;
        } else {
          cW = srcW - (srcW % 2);
          cH = Math.round(cW / targetRatio);
          if (cH % 2 !== 0) cH -= 1;
          const maxY = Math.max(0, srcH - cH);
          cX = 0;
          cY = Math.round(maxY * (pY / 100));
          if (cY % 2 !== 0) cY -= 1;
        }
        vfParts.push(`crop=${cW}:${cH}:${cX}:${cY},scale=${tw}:${th}`);
      }
    }

    // 4. Color Adjustments & Filters
    const b = parseFloat(brightness) || 0;
    const c = parseFloat(contrast) || 1;
    const sat = parseFloat(saturation) || 1;
    if (b !== 0 || c !== 1 || sat !== 1) {
      vfParts.push(`eq=brightness=${b}:contrast=${c}:saturation=${sat}`);
    }

    if (filterType === 'grayscale') {
      vfParts.push('hue=s=0');
    } else if (filterType === 'sepia') {
      vfParts.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
    } else if (filterType === 'vintage') {
      vfParts.push('curves=vintage');
    } else if (filterType === 'invert') {
      vfParts.push('negate');
    }

    // 5. Watermark text overlay (Windows font compatible without quotes around colon)
    if (watermarkText && watermarkText.trim()) {
      const font = getSystemFontFile();
      const cleanText = watermarkText.trim()
        .replace(/['"\\]/g, '')
        .replace(/:/g, '\\:')
        .replace(/,/g, '\\,')
        .replace(/%/g, '\\%');
      let pos = 'x=w-tw-25:y=h-th-25';
      if (watermarkPosition === 'bottom-left') pos = 'x=25:y=h-th-25';
      else if (watermarkPosition === 'top-right') pos = 'x=w-tw-25:y=25';
      else if (watermarkPosition === 'top-left') pos = 'x=25:y=25';
      else if (watermarkPosition === 'center') pos = 'x=(w-tw)/2:y=(h-th)/2';

      let drawtext = `drawtext=text='${cleanText}':${pos}:fontsize=28:fontcolor=white@0.9:box=1:boxcolor=black@0.55:boxborderw=6`;
      if (font) {
        drawtext += `:fontfile='${font}'`;
      }
      vfParts.push(drawtext);
    }

    // 6. Resolution Scaling
    const isPortrait = (targetRatio && targetRatio < 1.0) || (!targetRatio && srcH > srcW);
    if (resolution === '1080p') {
      vfParts.push(isPortrait ? 'scale=1080:-2' : 'scale=-2:1080');
    } else if (resolution === '720p') {
      vfParts.push(isPortrait ? 'scale=720:-2' : 'scale=-2:720');
    } else if (resolution === '480p') {
      vfParts.push(isPortrait ? 'scale=480:-2' : 'scale=-2:480');
    } else if (resolution === '360p') {
      vfParts.push(isPortrait ? 'scale=360:-2' : 'scale=-2:360');
    }

    // Even dimensions safeguard
    vfParts.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');

    // 7. Reverse
    if (reverse === true || reverse === 'true') {
      vfParts.push('reverse');
      afParts.push('areverse');
    }

    // 8. Volume
    const vol = parseFloat(volume);
    if (!isNaN(vol) && vol !== 1.0 && vol > 0) {
      afParts.push(`volume=${vol}`);
    }

    const tStart = parseFloat(trimStart) || 0;
    const tEnd = parseFloat(trimEnd) || 0;
    const durToTrim = tEnd > tStart ? (tEnd - tStart) : 0;

    // Check fast cut eligibility
    const isFastEligible = cutMode === 'fast' &&
      vfParts.length === 1 && // only safeguard scale was added
      afParts.length === 0 &&
      (!vol || vol === 1.0) &&
      spd === 1.0 &&
      !reverse &&
      aspectRatio === 'original' &&
      resolution === 'original' &&
      filterType === 'none' &&
      !watermarkText?.trim() &&
      (audioMode === 'original' || audioMode === 'mute') &&
      cleanFormat === 'mp4';

    if (isFastEligible) {
      const fastArgs = ['-y'];
      if (tStart > 0) fastArgs.push('-ss', tStart.toString());
      if (durToTrim > 0) fastArgs.push('-t', durToTrim.toString());
      fastArgs.push('-i', fileInfo.path);
      if (audioMode === 'mute' || vol === 0) {
        fastArgs.push('-an');
      }
      fastArgs.push('-c', 'copy', outputPath);
      console.log('[Video Process - Fast Copy] Executing:', fastArgs.join(' '));
      await runFFmpeg(fastArgs, null, { onSpawn: p => { runningProc = p; } });
      const probe = await probeFile(outputPath);
      const dlName = `${path.parse(fileInfo.originalName).name}_edited.${cleanFormat}`;
      fileRegistry.set(outputId, { id: outputId, originalName: dlName, path: outputPath, size: probe.size, probe });
      return res.json({ outputId, downloadName: dlName, downloadUrl: `/api/download/${outputId}`, streamUrl: `/api/stream/${outputId}`, probe });
    }

    const ffmpegArgs = ['-y'];
    if (tStart > 0) ffmpegArgs.push('-ss', tStart.toString());
    if (durToTrim > 0) ffmpegArgs.push('-t', durToTrim.toString());
    ffmpegArgs.push('-i', fileInfo.path);

    const hasBgAudio = audioFileInfo && (audioMode === 'replace' || audioMode === 'mix');
    const isMuted = audioMode === 'mute' || vol === 0 || (!fileInfo.probe?.hasAudio && !hasBgAudio);
    const hasAudioTrack = fileInfo.probe?.hasAudio || hasBgAudio;

    if (hasBgAudio) {
      ffmpegArgs.push('-i', audioFileInfo.path);
    }

    if (vfParts.length > 0) {
      ffmpegArgs.push('-vf', vfParts.join(','));
    }

    const audioCodec = cleanFormat === 'webm' ? 'libopus' : 'aac';
    const audioBitrate = cleanFormat === 'webm' ? '128k' : '192k';

    if (isMuted || !hasAudioTrack) {
      ffmpegArgs.push('-an');
    } else if (hasBgAudio && audioMode === 'replace') {
      ffmpegArgs.push('-map', '0:v', '-map', '1:a', '-c:a', audioCodec, '-b:a', audioBitrate, '-shortest');
    } else if (hasBgAudio && audioMode === 'mix') {
      if (!fileInfo.probe?.hasAudio) {
        ffmpegArgs.push('-map', '0:v', '-map', '1:a', '-c:a', audioCodec, '-b:a', audioBitrate, '-shortest');
      } else {
        const bgVol = parseFloat(bgAudioVolume) || 0.5;
        const vVol = !isNaN(vol) ? vol : 1.0;
        const atempoFilters = afParts.filter(f => f.startsWith('atempo') || f.startsWith('areverse')).join(',');
        const a0Chain = atempoFilters
          ? `[0:a]${atempoFilters},volume=${vVol},aformat=sample_rates=44100:channel_layouts=stereo[a0]`
          : `[0:a]volume=${vVol},aformat=sample_rates=44100:channel_layouts=stereo[a0]`;
        ffmpegArgs.push(
          '-filter_complex',
          `${a0Chain};[1:a]volume=${bgVol},aformat=sample_rates=44100:channel_layouts=stereo[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
          '-map', '0:v', '-map', '[aout]',
          '-c:a', audioCodec, '-b:a', audioBitrate
        );
      }
    } else if (afParts.length > 0) {
      ffmpegArgs.push('-af', afParts.join(','));
      ffmpegArgs.push('-c:a', audioCodec, '-b:a', audioBitrate);
    } else {
      if (cleanFormat === 'webm') {
        ffmpegArgs.push('-c:a', 'libopus', '-b:a', '128k');
      } else {
        ffmpegArgs.push('-c:a', 'copy');
      }
    }

    let crf = '23';
    if (quality === 'high') crf = '18';
    else if (quality === 'low') crf = '28';
    else if (quality === 'max_compression') crf = '34';

    const targetMB = parseFloat(targetSizeMB);
    const estDuration = (durToTrim > 0 ? durToTrim : (fileInfo.probe?.duration || 10)) / spd;

    if (cleanFormat === 'webm') {
      ffmpegArgs.push('-c:v', 'libvpx-vp9');
      if (!isNaN(targetMB) && targetMB > 0 && estDuration > 0) {
        const targetBps = Math.max(100, Math.floor(((targetMB * 8192) / estDuration) - 128));
        ffmpegArgs.push('-b:v', `${targetBps}k`, '-minrate', `${Math.floor(targetBps * 0.7)}k`, '-maxrate', `${Math.floor(targetBps * 1.3)}k`);
      } else {
        ffmpegArgs.push('-crf', crf, '-b:v', '0');
      }
    } else {
      ffmpegArgs.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p');
      if (!isNaN(targetMB) && targetMB > 0 && estDuration > 0) {
        const targetBps = Math.max(100, Math.floor(((targetMB * 8192) / estDuration) - 192));
        ffmpegArgs.push('-b:v', `${targetBps}k`, '-maxrate', `${Math.floor(targetBps * 1.3)}k`, '-bufsize', `${Math.floor(targetBps * 2)}k`);
      } else {
        ffmpegArgs.push('-crf', crf);
      }
    }

    ffmpegArgs.push(outputPath);

    console.log('[Video Process] Executing FFmpeg with args:', ffmpegArgs.join(' '));
    await runFFmpeg(ffmpegArgs, null, { onSpawn: p => { runningProc = p; } });

    const probe = await probeFile(outputPath);
    const dlName = `${path.parse(fileInfo.originalName).name}_edited.${cleanFormat}`;

    fileRegistry.set(outputId, {
      id: outputId,
      originalName: dlName,
      path: outputPath,
      size: probe.size,
      probe
    });

    res.json({
      outputId,
      downloadName: dlName,
      downloadUrl: `/api/download/${outputId}`,
      streamUrl: `/api/stream/${outputId}`,
      probe
    });
  } catch (err) {
    console.error('[Video Process Error]:', err);
    res.status(500).json({ error: err.message || 'Video processing failed' });
  }
});

// ==========================================
// 13. PRODUCTION-GRADE PDF ENDPOINTS SUITE
// ==========================================
const { PDFDocument, degrees, rgb, StandardFonts } = require('pdf-lib');

function runPdfCrypto(type, inputPath, outputPath, password, callback) {
  const { execFile } = require('child_process');

  if (type === 'encrypt') {
    // 1. Try qpdf first (available in Docker production)
    execFile('qpdf', ['--encrypt', password, password, '256', '--', inputPath, outputPath], (qerr) => {
      if (!qerr && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        return callback(null, outputPath);
      }
      // 2. Fallback to python with pypdf (AES-256)
      const pyScript = `import sys, pypdf
inp, outp, pwd = sys.argv[1], sys.argv[2], sys.argv[3]
reader = pypdf.PdfReader(inp)
writer = pypdf.PdfWriter()
for p in reader.pages:
    writer.add_page(p)
writer.encrypt(user_password=pwd, owner_password=pwd, algorithm="AES-256")
with open(outp, "wb") as f:
    writer.write(f)
`;
      execFile('python', ['-c', pyScript, inputPath, outputPath, password], (pyErr) => {
        if (!pyErr && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return callback(null, outputPath);
        }
        return callback(new Error('PDF encryption failed: ' + ((pyErr && pyErr.message) || (qerr && qerr.message) || 'Unknown error')));
      });
    });
  } else if (type === 'decrypt') {
    // 1. Try qpdf first
    execFile('qpdf', ['--password=' + password, '--decrypt', inputPath, outputPath], (qerr) => {
      if (!qerr && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        return callback(null, outputPath);
      }
      if (qerr && qerr.code === 2) {
        const err = new Error('Incorrect password for protected PDF');
        err.statusCode = 422;
        return callback(err);
      }
      // 2. Fallback to python with pypdf
      const pyScript = `import sys, pypdf
inp, outp, pwd = sys.argv[1], sys.argv[2], sys.argv[3]
reader = pypdf.PdfReader(inp)
if reader.is_encrypted:
    res = reader.decrypt(pwd)
    if res == 0:
        sys.exit(2)
writer = pypdf.PdfWriter()
for p in reader.pages:
    writer.add_page(p)
with open(outp, "wb") as f:
    writer.write(f)
`;
      execFile('python', ['-c', pyScript, inputPath, outputPath, password], (pyErr) => {
        if (!pyErr && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return callback(null, outputPath);
        }
        if (pyErr && pyErr.code === 2) {
          const err = new Error('Incorrect password for protected PDF');
          err.statusCode = 422;
          return callback(err);
        }
        return callback(new Error('PDF decryption failed: ' + ((pyErr && pyErr.message) || (qerr && qerr.message) || 'Unknown error')));
      });
    });
  }
}

// 13.1 PDF Protect
app.post('/api/pdf/protect', upload.single('file'), (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No PDF file uploaded or file is empty' });
  }
  const password = req.body.password;
  if (!password || !password.trim()) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({ error: 'Password is required to protect the PDF.' });
  }

  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUTS_DIR, `protected_${req.file.filename}`);

  runPdfCrypto('encrypt', inputPath, outputPath, password, (err) => {
    if (err) {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
      return res.status(500).json({ error: err.message || 'PDF encryption failed' });
    }

    res.download(outputPath, `protected_${req.file.originalname}`, (dlErr) => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  });
});

// 13.2 PDF Unlock
app.post('/api/pdf/unlock', upload.single('file'), (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No PDF file uploaded or file is empty' });
  }
  const password = req.body.password || '';
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUTS_DIR, `unlocked_${req.file.filename}`);

  runPdfCrypto('decrypt', inputPath, outputPath, password, (err) => {
    if (err) {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Failed to unlock PDF' });
    }

    res.download(outputPath, `unlocked_${req.file.originalname}`, (dlErr) => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  });
});

// 13.3 PDF Merge
app.post('/api/pdf/merge', upload.array('files', 50), async (req, res) => {
  const uploadedFiles = req.files || [];
  if (uploadedFiles.length < 2) {
    uploadedFiles.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
    return res.status(400).json({ error: 'At least 2 PDF files are required to merge.' });
  }

  try {
    const mergedDoc = await PDFDocument.create();
    for (let i = 0; i < uploadedFiles.length; i++) {
      const f = uploadedFiles[i];
      if (f.size === 0) {
        throw new Error(`File #${i + 1} (${f.originalname}) is empty (0 bytes).`);
      }
      const b = fs.readFileSync(f.path);
      const srcDoc = await PDFDocument.load(b, { ignoreEncryption: true, throwOnInvalidObject: false });
      const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach(p => mergedDoc.addPage(p));
    }

    const mergedBytes = await mergedDoc.save({ useObjectStreams: false });
    const outputName = `merged_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUTS_DIR, outputName);
    fs.writeFileSync(outputPath, mergedBytes);

    res.download(outputPath, 'merged_document.pdf', () => {
      uploadedFiles.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  } catch (err) {
    uploadedFiles.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
    console.error('[PDF Merge Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to merge PDF files.' });
  }
});

// 13.4 PDF Split
app.post('/api/pdf/split', upload.single('file'), async (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No PDF file uploaded or file is empty' });
  }

  const inputPath = req.file.path;
  const rangesStr = req.body.ranges || '1';

  try {
    const b = fs.readFileSync(inputPath);
    const srcDoc = await PDFDocument.load(b, { ignoreEncryption: true, throwOnInvalidObject: false });
    const totalPages = srcDoc.getPageCount();
    const destDoc = await PDFDocument.create();

    const selectedIndices = new Set();
    const parts = rangesStr.split(',').map(p => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
            selectedIndices.add(i - 1);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          selectedIndices.add(p - 1);
        }
      }
    }

    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    if (sortedIndices.length === 0) {
      throw new Error(`No valid pages found in range "${rangesStr}". Total pages: ${totalPages}`);
    }

    const copiedPages = await destDoc.copyPages(srcDoc, sortedIndices);
    copiedPages.forEach(p => destDoc.addPage(p));

    const splitBytes = await destDoc.save();
    const outputName = `split_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUTS_DIR, outputName);
    fs.writeFileSync(outputPath, splitBytes);

    res.download(outputPath, `split_${req.file.originalname}`, () => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  } catch (err) {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    console.error('[PDF Split Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to split PDF.' });
  }
});

// 13.5 PDF Compress
app.post('/api/pdf/compress', upload.single('file'), async (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No PDF file uploaded or file is empty' });
  }

  const inputPath = req.file.path;
  const level = req.body.level || 'recommended';
  const originalSize = req.file.size;

  try {
    const b = fs.readFileSync(inputPath);
    const srcDoc = await PDFDocument.load(b, { ignoreEncryption: true, throwOnInvalidObject: false });

    if (level === 'extreme') {
      srcDoc.setTitle('');
      srcDoc.setAuthor('');
      srcDoc.setSubject('');
      srcDoc.setKeywords([]);
      srcDoc.setProducer('');
      srcDoc.setCreator('');
    } else if (level === 'recommended') {
      srcDoc.setSubject('');
      srcDoc.setKeywords([]);
    }

    const compressedBytes = await srcDoc.save({ useObjectStreams: true, addDefaultPage: false });
    const finalBytes = compressedBytes.length < originalSize ? compressedBytes : b;

    const outputName = `compressed_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUTS_DIR, outputName);
    fs.writeFileSync(outputPath, finalBytes);

    res.setHeader('X-Original-Size', originalSize.toString());
    res.setHeader('X-Compressed-Size', finalBytes.length.toString());

    res.download(outputPath, `compressed_${req.file.originalname}`, () => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  } catch (err) {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    console.error('[PDF Compress Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to compress PDF.' });
  }
});

// 13.6 PDF Rotate
app.post('/api/pdf/rotate', upload.single('file'), async (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No PDF file uploaded or file is empty' });
  }

  const inputPath = req.file.path;
  const angle = parseInt(req.body.angle, 10) || 90;

  try {
    const b = fs.readFileSync(inputPath);
    const srcDoc = await PDFDocument.load(b, { ignoreEncryption: true, throwOnInvalidObject: false });
    const pages = srcDoc.getPages();
    pages.forEach(p => {
      const current = p.getRotation().angle;
      p.setRotation(degrees((current + angle) % 360));
    });

    const rotBytes = await srcDoc.save();
    const outputName = `rotated_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUTS_DIR, outputName);
    fs.writeFileSync(outputPath, rotBytes);

    res.download(outputPath, `rotated_${req.file.originalname}`, () => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  } catch (err) {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    console.error('[PDF Rotate Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to rotate PDF.' });
  }
});

// 13.7 PDF Watermark
app.post('/api/pdf/watermark', upload.single('file'), async (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No PDF file uploaded or file is empty' });
  }

  const inputPath = req.file.path;
  const text = req.body.text || 'CONFIDENTIAL';
  const opacity = parseFloat(req.body.opacity) || 0.3;
  const fontSize = parseInt(req.body.fontSize, 10) || 36;
  const rotation = parseInt(req.body.rotation, 10) || -45;

  try {
    const b = fs.readFileSync(inputPath);
    const srcDoc = await PDFDocument.load(b, { ignoreEncryption: true, throwOnInvalidObject: false });
    const font = await srcDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = srcDoc.getPages();
    const rad = (rotation * Math.PI) / 180;

    pages.forEach(page => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      const cx = width / 2;
      const cy = height / 2;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const x = cx - (textWidth / 2) * cos + (textHeight / 2) * sin;
      const y = cy - (textWidth / 2) * sin - (textHeight / 2) * cos;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.85, 0.1, 0.1),
        opacity,
        rotate: degrees(rotation),
      });
    });

    const wmBytes = await srcDoc.save();
    const outputName = `watermarked_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUTS_DIR, outputName);
    fs.writeFileSync(outputPath, wmBytes);

    res.download(outputPath, `watermarked_${req.file.originalname}`, () => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  } catch (err) {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    console.error('[PDF Watermark Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to watermark PDF.' });
  }
});

// Periodic cleanup of temp files older than 2 hours (unref to avoid hanging tests)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000;
  [UPLOADS_DIR, OUTPUTS_DIR].forEach(dir => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      files.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stat) => {
          if (!err && now - stat.mtimeMs > maxAge) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  });
}, 30 * 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();

// Serve static client build if it exists
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
    next();
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SoundCraft Studio API] Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

