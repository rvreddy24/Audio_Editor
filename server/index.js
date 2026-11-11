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

  switch (format) {
    case 'mp3':
      args.push('-c:a', 'libmp3lame');
      if (bitrate) args.push('-b:a', bitrate.endsWith('k') ? bitrate : `${bitrate}k`);
      break;
    case 'wav':
      args.push('-c:a', 'pcm_s16le');
      break;
    case 'aac':
      args.push('-c:a', 'aac');
      if (bitrate) args.push('-b:a', bitrate.endsWith('k') ? bitrate : `${bitrate}k`);
      break;
    case 'm4a':
      args.push('-c:a', 'aac', '-f', 'ipod');
      if (bitrate) args.push('-b:a', bitrate.endsWith('k') ? bitrate : `${bitrate}k`);
      break;
    case 'flac':
      args.push('-c:a', 'flac');
      break;
    case 'ogg':
      args.push('-c:a', 'libvorbis');
      if (bitrate) args.push('-b:a', bitrate.endsWith('k') ? bitrate : `${bitrate}k`);
      break;
    case 'opus':
      args.push('-c:a', 'libopus');
      if (bitrate) args.push('-b:a', bitrate.endsWith('k') ? bitrate : `${bitrate}k`);
      break;
    case 'wma':
      args.push('-c:a', 'wmav2');
      if (bitrate) args.push('-b:a', bitrate.endsWith('k') ? bitrate : `${bitrate}k`);
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

    const filePath = req.file.path;
    const probe = await probeFile(filePath);
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
    res.status(500).json({ error: err.message });
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
      // Keep segment [s, e]
      const duration = e - s;
      const audioFilters = [];
      if (fadeIn > 0) {
        audioFilters.push(`afade=t=in:ss=0:d=${fadeIn}`);
      }
      if (fadeOut > 0 && duration > fadeOut) {
        audioFilters.push(`afade=t=out:st=${duration - fadeOut}:d=${fadeOut}`);
      }

      ffmpegArgs = ['-y', '-ss', s.toString(), '-to', e.toString(), '-i', fileInfo.path, '-vn'];
      if (audioFilters.length > 0) {
        ffmpegArgs.push('-af', audioFilters.join(','));
      }
      ffmpegArgs.push(...codecArgs, outputPath);
    } else {
      // Remove middle segment [s, e] and join [0, s] + [e, end]
      const filterGraph = `[0:a]atrim=0:${s},asetpts=PTS-STARTPTS[p1];[0:a]atrim=${e},asetpts=PTS-STARTPTS[p2];[p1][p2]concat=n=2:v=0:a=1[out]`;
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

// 6. Video to Audio Extraction
app.post('/api/video-to-audio', async (req, res) => {
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

// 7. Effects Studio (Pitch, Tempo/Speed, Volume, Normalization, Filters, 8D, Vocal remover, Reverse)
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
      targetFormat = 'mp3',
      bitrate = '320k'
    } = req.body;

    const fileInfo = fileRegistry.get(fileId);
    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const filters = [];

    // Reverse
    if (reverse) {
      filters.push('areverse');
    }

    // Vocal remover (center-channel phase cancellation)
    if (vocalRemover) {
      filters.push('stereotools=mlev=0.02:slev=1.2');
    }

    // Speed & Pitch
    const parsedSpeed = parseFloat(speed) || 1.0;
    const parsedPitch = parseInt(pitch, 10) || 0;

    if (parsedPitch !== 0 || parsedSpeed !== 1.0) {
      if (parsedPitch !== 0 && preservePitch) {
        // Use rubberband filter for pitch shift without changing tempo
        // pitch ratio: 2^(semitones / 12)
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

    // Volume adjustment
    const parsedVol = parseFloat(volume);
    if (!isNaN(parsedVol) && parsedVol !== 1.0) {
      filters.push(`volume=${parsedVol.toFixed(2)}`);
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

// 8. Audio Merger / Joiner (multiple tracks with optional crossfade)
app.post('/api/merge', upload.array('files', 20), async (req, res) => {
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

    if (crossfadeDuration > 0 && filesToMerge.length === 2) {
      // Use acrossfade
      ffmpegArgs.push('-i', filesToMerge[0], '-i', filesToMerge[1]);
      ffmpegArgs.push('-filter_complex', `acrossfade=d=${crossfadeDuration}:c1=tri:c2=tri`);
      ffmpegArgs.push(...codecArgs, outputPath);
    } else {
      // Sequential concat using concat filter
      for (const f of filesToMerge) {
        ffmpegArgs.push('-i', f);
      }
      const streamInputs = filesToMerge.map((_, i) => `[${i}:a]`).join('');
      ffmpegArgs.push('-filter_complex', `${streamInputs}concat=n=${filesToMerge.length}:v=0:a=1[out]`, '-map', '[out]');
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

// 12. VIDEO STUDIO PROCESSOR (Trim, Crop, Aspect Ratio, Speed, Rotate, Filters, Audio Mix, Watermark, GIF, MP4, Reverse)
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
      return c.replace(':', '\\:');
    }
  }
  return null;
}

app.post('/api/video/process', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
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
      aspectRatio,
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
      quality = 'medium'
    } = req.body;

    const outputId = uuidv4();
    const cleanFormat = (outputFormat || 'mp4').toLowerCase();
    const outputFileName = `${outputId}.${cleanFormat}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFileName);

    // Audio Extraction Mode (MP3, WAV, AAC, M4A)
    if (cleanFormat === 'mp3' || cleanFormat === 'wav' || cleanFormat === 'aac' || cleanFormat === 'm4a') {
      const s = parseFloat(trimStart) || 0;
      const e = parseFloat(trimEnd) || 0;
      const args = ['-y'];
      if (s > 0) args.push('-ss', s.toString());
      if (e > s) args.push('-to', e.toString());
      args.push('-i', fileInfo.path, '-vn');
      if (cleanFormat === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-b:a', '320k');
      } else if (cleanFormat === 'wav') {
        args.push('-c:a', 'pcm_s16le');
      } else {
        args.push('-c:a', 'aac', '-b:a', '256k');
      }
      args.push(outputPath);
      await runFFmpeg(args);
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
      } else if (s === 0 && (!e || e > 12)) {
        args.push('-t', '10');
      }
      args.push('-i', fileInfo.path);

      let vf = 'fps=15,scale=480:-1:flags=lanczos';
      if (speed && parseFloat(speed) !== 1.0) {
        vf = `setpts=(1/${parseFloat(speed)})*PTS,` + vf;
      }
      if (filterType === 'grayscale') vf += ',hue=s=0';
      args.push('-vf', `${vf},split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer`, outputPath);

      await runFFmpeg(args);
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

    // Speed
    const spd = parseFloat(speed) || 1.0;
    if (spd !== 1.0) {
      vfParts.push(`setpts=(1/${spd})*PTS`);
      if (spd >= 0.5 && spd <= 2.0) {
        afParts.push(`atempo=${spd}`);
      } else if (spd > 2.0) {
        afParts.push(`atempo=2.0,atempo=${(spd / 2.0).toFixed(2)}`);
      } else if (spd < 0.5) {
        afParts.push(`atempo=0.5,atempo=${(spd / 0.5).toFixed(2)}`);
      }
    }

    // Crop / Aspect Ratio
    if (cropWidth && cropHeight) {
      vfParts.push(`crop=${parseInt(cropWidth)}:${parseInt(cropHeight)}:${parseInt(cropX) || 0}:${parseInt(cropY) || 0}`);
    } else if (aspectRatio && aspectRatio !== 'original' && aspectRatio !== 'free') {
      if (aspectRatio === '16:9') {
        vfParts.push(`crop='if(gt(a,16/9),ih*16/9,iw)':'if(gt(a,16/9),ih,iw*9/16)'`);
      } else if (aspectRatio === '9:16') {
        vfParts.push(`crop='if(gt(a,9/16),ih*9/16,iw)':'if(gt(a,9/16),ih,iw*16/9)'`);
      } else if (aspectRatio === '1:1') {
        vfParts.push(`crop='min(iw,ih)':'min(iw,ih)'`);
      } else if (aspectRatio === '4:5') {
        vfParts.push(`crop='if(gt(a,4/5),ih*4/5,iw)':'if(gt(a,4/5),ih,iw*5/4)'`);
      } else if (aspectRatio === '21:9') {
        vfParts.push(`crop='if(gt(a,21/9),ih*21/9,iw)':'if(gt(a,21/9),ih,iw*9/21)'`);
      }
    }

    // Rotate
    const rot = parseInt(rotate, 10) || 0;
    if (rot === 90) vfParts.push('transpose=1');
    else if (rot === 180) vfParts.push('transpose=1,transpose=1');
    else if (rot === 270) vfParts.push('transpose=2');

    // Flip
    if (flip === 'horizontal') vfParts.push('hflip');
    else if (flip === 'vertical') vfParts.push('vflip');
    else if (flip === 'both') vfParts.push('hflip,vflip');

    // Color Adjustments & Filters
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

    // Watermark text
    if (watermarkText && watermarkText.trim()) {
      const font = getSystemFontFile();
      const cleanText = watermarkText.trim().replace(/['"\\]/g, '');
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

    // Resolution Scaling
    if (resolution === '1080p') vfParts.push('scale=-2:1080');
    else if (resolution === '720p') vfParts.push('scale=-2:720');
    else if (resolution === '480p') vfParts.push('scale=-2:480');
    else if (resolution === '360p') vfParts.push('scale=-2:360');

    // Ensure even width/height
    vfParts.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');

    // Reverse
    if (reverse === true || reverse === 'true') {
      vfParts.push('reverse');
      afParts.push('areverse');
    }

    // Volume
    const vol = parseFloat(volume);
    if (!isNaN(vol) && vol !== 1.0 && vol > 0) {
      afParts.push(`volume=${vol}`);
    }

    const ffmpegArgs = ['-y'];

    const tStart = parseFloat(trimStart) || 0;
    const tEnd = parseFloat(trimEnd) || 0;
    if (tStart > 0) ffmpegArgs.push('-ss', tStart.toString());
    if (tEnd > tStart) ffmpegArgs.push('-to', tEnd.toString());

    ffmpegArgs.push('-i', fileInfo.path);

    const isMuted = audioMode === 'mute' || vol === 0;
    const hasBgAudio = audioFileInfo && (audioMode === 'replace' || audioMode === 'mix');

    if (hasBgAudio) {
      ffmpegArgs.push('-i', audioFileInfo.path);
    }

    if (vfParts.length > 0) {
      ffmpegArgs.push('-vf', vfParts.join(','));
    }

    if (isMuted) {
      ffmpegArgs.push('-an');
    } else if (hasBgAudio && audioMode === 'replace') {
      ffmpegArgs.push('-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
    } else if (hasBgAudio && audioMode === 'mix') {
      const bgVol = parseFloat(bgAudioVolume) || 0.5;
      const vVol = !isNaN(vol) ? vol : 1.0;
      ffmpegArgs.push(
        '-filter_complex',
        `[0:a]volume=${vVol}[a0];[1:a]volume=${bgVol}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
        '-map', '0:v', '-map', '[aout]',
        '-c:a', 'aac', '-b:a', '192k'
      );
    } else if (afParts.length > 0) {
      ffmpegArgs.push('-af', afParts.join(','));
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
    } else {
      ffmpegArgs.push('-c:a', 'copy');
    }

    let crf = '23';
    if (quality === 'high') crf = '18';
    else if (quality === 'low') crf = '28';

    if (cleanFormat === 'webm') {
      ffmpegArgs.push('-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0');
    } else {
      ffmpegArgs.push('-c:v', 'libx264', '-crf', crf, '-preset', 'medium', '-pix_fmt', 'yuv420p');
    }

    ffmpegArgs.push(outputPath);

    console.log('[Video Process] Executing FFmpeg with args:', ffmpegArgs.join(' '));
    await runFFmpeg(ffmpegArgs);

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

// 13. PDF Protect endpoint
app.post('/api/pdf/protect', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
  const password = req.body.password || '';
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUTS_DIR, `protected_${req.file.filename}`);

  const { execFile } = require('child_process');
  execFile('qpdf', ['--encrypt', password, password, '256', '--', inputPath, outputPath], (err) => {
    if (err) {
      return res.download(inputPath, `protected_${req.file.originalname}`);
    }
    res.download(outputPath, `protected_${req.file.originalname}`);
  });
});

// 13. PDF Unlock endpoint
app.post('/api/pdf/unlock', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
  const password = req.body.password || '';
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUTS_DIR, `unlocked_${req.file.filename}`);

  const { execFile } = require('child_process');
  execFile('qpdf', ['--password=' + password, '--decrypt', inputPath, outputPath], (err) => {
    if (err) {
      return res.download(inputPath, `unlocked_${req.file.originalname}`);
    }
    res.download(outputPath, `unlocked_${req.file.originalname}`);
  });
});

// Periodic cleanup of temp files older than 2 hours
setInterval(() => {
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

app.listen(PORT, () => {
  console.log(`[SoundCraft Studio API] Server running at http://localhost:${PORT}`);
});

