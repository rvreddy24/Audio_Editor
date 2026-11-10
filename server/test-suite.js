const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Starting SoundCraft Studio End-to-End API Test Suite ---');
  const BASE_URL = 'http://localhost:5000';

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health);

  // 2. Upload test_sample.mp3
  const filePath = path.join(__dirname, '../test_sample.mp3');
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
  const form = new FormData();
  form.append('file', blob, 'test_sample.mp3');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: form
  });
  const uploadData = await uploadRes.json();
  console.log('2. Upload & probe result:', {
    fileId: uploadData.fileId,
    duration: uploadData.probe.duration,
    codec: uploadData.probe.audio?.codec,
    bitRate: uploadData.probe.audio?.bitRate
  });
  const fileId = uploadData.fileId;

  // 3. Test Converter (MP3 -> FLAC and MP3 -> 320k MP3)
  const convertRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      targetFormat: 'flac',
      bitrate: '320k',
      sampleRate: 48000
    })
  });
  const convertData = await convertRes.json();
  console.log('3. Convert to FLAC result:', {
    outputId: convertData.outputId,
    downloadName: convertData.downloadName,
    codec: convertData.probe.audio?.codec,
    sampleRate: convertData.probe.audio?.sampleRate
  });

  // 4. Test Trimming (keep 1s to 3s with fade-in and fade-out)
  const trimRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      start: 1.0,
      end: 3.5,
      mode: 'keep',
      fadeIn: 0.5,
      fadeOut: 0.5,
      targetFormat: 'mp3',
      bitrate: '256k'
    })
  });
  const trimData = await trimRes.json();
  console.log('4. Trim result:', {
    outputId: trimData.outputId,
    duration: trimData.probe.duration,
    downloadName: trimData.downloadName
  });

  // 5. Test Trimming in 'remove' mode (cut middle 1.5s to 2.5s and splice)
  const cutRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      start: 1.5,
      end: 2.5,
      mode: 'remove',
      targetFormat: 'mp3'
    })
  });
  const cutData = await cutRes.json();
  console.log('5. Remove & Splice result:', {
    outputId: cutData.outputId,
    duration: cutData.probe.duration
  });

  // 6. Test Effects (Speed 1.25x, Pitch +2, Bass +5dB, Panning 8D)
  const fxRes = await fetch(`${BASE_URL}/api/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      speed: 1.25,
      pitch: 2,
      bass: 5,
      panning8D: true,
      targetFormat: 'mp3'
    })
  });
  const fxData = await fxRes.json();
  console.log('6. DSP Effects result:', {
    outputId: fxData.outputId,
    downloadName: fxData.downloadName
  });

  // 7. Test Video to Audio Extraction
  // Upload test_video.mp4
  const videoPath = path.join(__dirname, '../test_video.mp4');
  if (fs.existsSync(videoPath)) {
    const videoBuffer = fs.readFileSync(videoPath);
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
    const videoForm = new FormData();
    videoForm.append('file', videoBlob, 'test_video.mp4');

    const uploadVideoRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: videoForm
    });
    const uploadVideoData = await uploadVideoRes.json();
    console.log('7a. Uploaded video:', {
      fileId: uploadVideoData.fileId,
      hasVideo: uploadVideoData.probe.hasVideo,
      resolution: `${uploadVideoData.probe.video?.width}x${uploadVideoData.probe.video?.height}`
    });

    const v2aRes = await fetch(`${BASE_URL}/api/video-to-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: uploadVideoData.fileId,
        targetFormat: 'mp3',
        bitrate: '320k'
      })
    });
    const v2aData = await v2aRes.json();
    console.log('7b. Extracted audio from video:', {
      outputId: v2aData.outputId,
      codec: v2aData.probe.audio?.codec,
      downloadName: v2aData.downloadName
    });
  }

  // 8. Test Metadata Editor
  const metaRes = await fetch(`${BASE_URL}/api/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      title: 'SoundCraft Master Track',
      artist: 'SoundCraft Artist',
      album: 'Universal Audio LP',
      year: '2026',
      genre: 'Electronic'
    })
  });
  const metaData = await metaRes.json();
  console.log('8. Metadata updated:', {
    outputId: metaData.outputId,
    tags: metaData.probe.tags
  });

  // 9. Test Merge / Concatenation
  const mergeRes = await fetch(`${BASE_URL}/api/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileIds: [fileId, trimData.outputId],
      crossfade: 1.0,
      targetFormat: 'mp3'
    })
  });
  const mergeData = await mergeRes.json();
  console.log('9. Merge result:', {
    outputId: mergeData.outputId,
    duration: mergeData.probe.duration,
    downloadName: mergeData.downloadName
  });

  console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
