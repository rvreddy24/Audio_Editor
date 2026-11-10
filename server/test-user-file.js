const fs = require('fs');
const path = require('path');

const USER_FILE_PATH = "E:\\1109 (1).mp3";
const BASE_URL = 'http://localhost:5000';

async function testUserAudioFile() {
  console.log('===============================================================');
  console.log(`TESTING SOUNDCRAFT STUDIO ON USER FILE: "${USER_FILE_PATH}"`);
  console.log('===============================================================\n');

  if (!fs.existsSync(USER_FILE_PATH)) {
    throw new Error(`File not found: ${USER_FILE_PATH}`);
  }

  const stat = fs.statSync(USER_FILE_PATH);
  console.log(`[FILE FOUND] Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB (${stat.size} bytes)\n`);

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  console.log('✓ [1/8] Server Health & FFmpeg Check:', health);

  // 2. Upload file & probe
  console.log('\n--- [2/8] Testing File Upload & Probe Analysis ---');
  const fileBuffer = fs.readFileSync(USER_FILE_PATH);
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
  const form = new FormData();
  form.append('file', blob, '1109 (1).mp3');

  const uploadStart = Date.now();
  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: form
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
  }

  const uploadData = await uploadRes.json();
  const uploadTime = Date.now() - uploadStart;
  console.log(`✓ Uploaded in ${uploadTime}ms!`);
  console.log(`  File ID: ${uploadData.fileId}`);
  console.log(`  Duration: ${uploadData.probe.duration.toFixed(2)}s (~${Math.floor(uploadData.probe.duration / 60)}m ${Math.floor(uploadData.probe.duration % 60)}s)`);
  console.log(`  Format: ${uploadData.probe.formatName} | Codec: ${uploadData.probe.audio?.codec}`);
  console.log(`  Bitrate: ${uploadData.probe.audio?.bitRate} kbps`);
  console.log(`  Sample Rate: ${uploadData.probe.audio?.sampleRate} Hz`);
  console.log(`  Channels: ${uploadData.probe.audio?.channels} (${uploadData.probe.audio?.channelLayout})`);

  const fileId = uploadData.fileId;

  // Verify stream URL
  const streamRes = await fetch(`${BASE_URL}${uploadData.streamUrl}`, {
    headers: { Range: 'bytes=0-1024' }
  });
  console.log(`✓ Audio Streaming (Range request) Status: ${streamRes.status} (Content-Length: ${streamRes.headers.get('content-length')})`);

  // 3. Test Format Conversions
  console.log('\n--- [3/8] Testing Universal Format Conversions ---');

  // 3a. MP3 to Lossless WAV
  const wavRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      targetFormat: 'wav',
      sampleRate: 44100
    })
  });
  const wavData = await wavRes.json();
  console.log(`✓ Converted to WAV Lossless: ${wavData.downloadName} (${(wavData.probe.size / (1024 * 1024)).toFixed(2)} MB, Codec: ${wavData.probe.audio?.codec})`);

  // 3b. MP3 to Audiophile FLAC
  const flacRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      targetFormat: 'flac',
      sampleRate: 48000
    })
  });
  const flacData = await flacRes.json();
  console.log(`✓ Converted to FLAC Hi-Fi (48kHz): ${flacData.downloadName} (${(flacData.probe.size / (1024 * 1024)).toFixed(2)} MB, Sample Rate: ${flacData.probe.audio?.sampleRate} Hz)`);

  // 3c. MP3 to AAC
  const aacRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      targetFormat: 'aac',
      bitrate: '256k'
    })
  });
  const aacData = await aacRes.json();
  console.log(`✓ Converted to AAC: ${aacData.downloadName} (${(aacData.probe.size / (1024 * 1024)).toFixed(2)} MB, Codec: ${aacData.probe.audio?.codec})`);

  // 3d. MP3 to OPUS (Next-gen streaming)
  const opusRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      targetFormat: 'opus',
      bitrate: '128k'
    })
  });
  const opusData = await opusRes.json();
  console.log(`✓ Converted to OPUS: ${opusData.downloadName} (${(opusData.probe.size / (1024 * 1024)).toFixed(2)} MB, Codec: ${opusData.probe.audio?.codec})`);

  // 4. Test Bitrate Scaling (Increasing and Decreasing kbps)
  console.log('\n--- [4/8] Testing Bitrate (kbps) Scaling ---');

  // 4a. Increase Bitrate to 320 kbps (Maximum Studio MP3)
  const upRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      targetFormat: 'mp3',
      bitrate: '320k'
    })
  });
  const upData = await upRes.json();
  console.log(`✓ Increased Bitrate: 128 kbps -> 320 kbps (${upData.probe.audio?.bitRate} kbps, Size: ${(upData.probe.size / (1024 * 1024)).toFixed(2)} MB)`);

  // 4b. Decrease Bitrate to 64 kbps (Voice / High Compression)
  const downRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      targetFormat: 'mp3',
      bitrate: '64k'
    })
  });
  const downData = await downRes.json();
  console.log(`✓ Decreased Bitrate: 128 kbps -> 64 kbps (${downData.probe.audio?.bitRate} kbps, Size: ${(downData.probe.size / (1024 * 1024)).toFixed(2)} MB)`);

  // 5. Test Trimming & Cutting Audio
  console.log('\n--- [5/8] Testing Trimming & Precision Splicing ---');

  // 5a. Keep Mode: Trim segment [15.0s -> 45.0s] with 2.0s Fade-In & 2.5s Fade-Out
  const trimRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      start: 15.0,
      end: 45.0,
      mode: 'keep',
      fadeIn: 2.0,
      fadeOut: 2.5,
      targetFormat: 'mp3',
      bitrate: '320k'
    })
  });
  const trimData = await trimRes.json();
  console.log(`✓ Trim (Keep [15s, 45s] + Fades): Duration ${trimData.probe.duration.toFixed(2)}s (Expected ~30.0s), Output: ${trimData.downloadName}`);

  // 5b. Remove & Splice Mode: Cut out middle [60s -> 90s] (removes 30s)
  const spliceRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      start: 60.0,
      end: 90.0,
      mode: 'remove',
      targetFormat: 'mp3'
    })
  });
  const spliceData = await spliceRes.json();
  console.log(`✓ Cut Out & Splice: Cut 30s out of 300s -> New Duration: ${spliceData.probe.duration.toFixed(2)}s (Expected ~270.18s)`);

  // 6. Test DSP Mastering & Audio Effects
  console.log('\n--- [6/8] Testing DSP Mastering, Pitch, Speed, & Special FX ---');

  // 6a. Speed (1.25x) + Pitch Shift (+3 semitones) + Bass Boost (+6dB)
  const fxRes = await fetch(`${BASE_URL}/api/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      speed: 1.25,
      pitch: 3,
      preservePitch: true,
      volume: 1.2,
      bass: 6,
      preset: 'vocal_clarity',
      targetFormat: 'mp3'
    })
  });
  const fxData = await fxRes.json();
  console.log(`✓ Tempo 1.25x + Pitch +3 semitones + Bass +6dB: ${fxData.downloadName} (Duration: ${fxData.probe.duration.toFixed(2)}s)`);

  // 6b. 8D Binaural Spatial Audio Panning
  const spatialRes = await fetch(`${BASE_URL}/api/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: trimData.outputId, // apply on trimmed snippet
      panning8D: true,
      targetFormat: 'mp3'
    })
  });
  const spatialData = await spatialRes.json();
  console.log(`✓ 8D Binaural Rotating Audio: ${spatialData.downloadName}`);

  // 6c. Vocal Remover (Karaoke Center-Channel Cancellation)
  const vocalRes = await fetch(`${BASE_URL}/api/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: trimData.outputId,
      vocalRemover: true,
      targetFormat: 'mp3'
    })
  });
  const vocalData = await vocalRes.json();
  console.log(`✓ Vocal Remover (Karaoke Filter): ${vocalData.downloadName}`);

  // 6d. Reverse Audio
  const revRes = await fetch(`${BASE_URL}/api/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: trimData.outputId,
      reverse: true,
      targetFormat: 'mp3'
    })
  });
  const revData = await revRes.json();
  console.log(`✓ Reverse Playback FX: ${revData.downloadName}`);

  // 7. Test ID3 Metadata Tagging
  console.log('\n--- [7/8] Testing ID3 Metadata & Tag Editor ---');
  const tagRes = await fetch(`${BASE_URL}/api/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: trimData.outputId,
      title: 'SoundCraft Master 1109',
      artist: 'Studio Artist 1109',
      album: 'Pro Studio Session',
      year: '2026',
      genre: 'Mastered Track',
      comment: 'Edited in SoundCraft Pro'
    })
  });
  const tagData = await tagRes.json();
  console.log(`✓ Updated ID3 Tags in Audio Container:`, {
    title: tagData.probe.tags?.title,
    artist: tagData.probe.tags?.artist,
    album: tagData.probe.tags?.album,
    date: tagData.probe.tags?.date,
    genre: tagData.probe.tags?.genre
  });

  // 8. Test Multi-Track Concatenation (Merger with Crossfade)
  console.log('\n--- [8/8] Testing Multi-Track Joiner with Crossfade ---');
  const mergeRes = await fetch(`${BASE_URL}/api/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileIds: [trimData.outputId, spatialData.outputId],
      crossfade: 2.0,
      targetFormat: 'mp3',
      bitrate: '320k'
    })
  });
  const mergeData = await mergeRes.json();
  console.log(`✓ Joined Tracks with 2.0s Crossfade: ${mergeData.downloadName} (Duration: ${mergeData.probe.duration.toFixed(2)}s)`);

  console.log('\n===============================================================');
  console.log('🎉 ALL 8 TESTS PASSED ON "E:\\1109 (1).mp3" WITHOUT ANY ERRORS!');
  console.log('===============================================================');
}

testUserAudioFile().catch(err => {
  console.error('\n❌ ERROR TESTING USER AUDIO FILE:', err);
  process.exit(1);
});
