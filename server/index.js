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

