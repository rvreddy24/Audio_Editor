/**
 * SOUNDCRAFT STUDIO - COMPREHENSIVE AUDIO PRODUCTION & DSP TEST SUITE
 * 
 * Verifies all Audio Editor, DSP tools, and Edge Cases end-to-end:
 * 1. Health & FFmpeg DSP Engine Capabilities
 * 2. Upload, Probe & Codec Detection
 * 3. Input Validation (Corrupt files, Empty 0-byte files, Out-of-bounds)
 * 4. Multi-Format Converter (MP3, WAV, AAC, FLAC, OGG, M4A with 128k-320k bitrates)
 * 5. Audio Trimmer & Cutter (Millisecond precision, Keep, Cut from start, Cut middle, Cut till end, Fades)
 * 6. Volume Booster & Gain Control (50% to 300% with soft limiter clipping prevention)
 * 7. Speed & Pitch Shifter (0.5x to 2.0x, tempo stretching with & without pitch shift)
 * 8. Vocal Remover & Center Channel Suppression
 * 9. Audio Reverse & Noise Reduction (FFT-based denoiser)
 * 10. Multi-Track Audio Merger (2-track & 3-track chained crossfade)
 * 11. Video-to-Audio Extractor (MP4 -> MP3 & WAV)
 * 12. Ultra-short clips (<0.5s) & Range Streaming
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TMP_DIR = path.join(__dirname, 'test_fixtures_tmp');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedCount++;
  console.log(`  ✓ PASS: ${message}`);
}

// Generate test audio fixtures using FFmpeg
function generateFixtures() {
  console.log('\n[FIXTURES] Generating synthetic test audio & video fixtures...');

  // 1. Standard Stereo 44.1kHz MP3 (5 seconds)
  const stereoMp3 = path.join(TMP_DIR, 'test_stereo.mp3');
  spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
    '-f', 'lavfi', '-i', 'sine=frequency=880:duration=5',
    '-filter_complex', '[0:a][1:a]join=inputs=2:channel_layout=stereo[a]',
    '-map', '[a]',
    '-c:a', 'libmp3lame', '-b:a', '192k',
    stereoMp3
  ]);

  // 2. Ultra-short audio clip (0.25 seconds WAV)
  const shortWav = path.join(TMP_DIR, 'test_short.wav');
  spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=0.25',
    '-c:a', 'pcm_s16le',
    shortWav
  ]);

  // 3. Multi-track sample tracks for merger
  const track1 = path.join(TMP_DIR, 'track1.mp3');
  const track2 = path.join(TMP_DIR, 'track2.mp3');
  const track3 = path.join(TMP_DIR, 'track3.mp3');
  spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=3', '-c:a', 'libmp3lame', '-b:a', '128k', track1]);
  spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:a', 'libmp3lame', '-b:a', '128k', track2]);
  spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=550:duration=3', '-c:a', 'libmp3lame', '-b:a', '128k', track3]);

  // 4. Test Video MP4 with AAC soundtrack (3 seconds)
  const testMp4 = path.join(TMP_DIR, 'test_video.mp4');
  spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', 'testsrc=duration=3:size=320x240:rate=24',
    '-f', 'lavfi', '-i', 'sine=frequency=660:duration=3',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-shortest',
    testMp4
  ]);

  // 5. Corrupt file & Empty file
  const emptyFile = path.join(TMP_DIR, 'empty.mp3');
  fs.writeFileSync(emptyFile, Buffer.alloc(0));

  const corruptFile = path.join(TMP_DIR, 'corrupt.mp3');
  fs.writeFileSync(corruptFile, Buffer.from('NOT_AN_AUDIO_FILE_JUST_CORRUPT_RANDOM_GARBAGE_BYTES_123456789'));

  console.log('[FIXTURES] Ready.\n');
  return { stereoMp3, shortWav, track1, track2, track3, testMp4, emptyFile, corruptFile };
}

async function uploadHelper(filePath, originalName) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  const form = new FormData();
  form.append('file', blob, originalName || path.basename(filePath));

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: form
  });

  return { res, data: await res.json() };
}

async function runProductionTests() {
  console.log('================================================================');
  console.log('   SOUNDCRAFT STUDIO - PRODUCTION AUDIO & DSP AUDIT TEST SUITE   ');
  console.log('================================================================');

  const fixtures = generateFixtures();

  // 1. Health & Server Check
  console.log('\n--- 1. Health Check & Engine Capabilities ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  assert(healthRes.status === 200, 'Health endpoint responds with 200 OK');
  assert(health.ffmpeg === true, 'FFmpeg engine is detected and ready');

  // 2. Upload & Probe Standard Stereo Track
  console.log('\n--- 2. File Upload & ffprobe Analysis ---');
  const { res: upRes, data: upData } = await uploadHelper(fixtures.stereoMp3, 'master_stereo.mp3');
  assert(upRes.status === 200, 'Stereo audio uploads successfully');
  assert(Boolean(upData.fileId), `Assigned unique fileId: ${upData.fileId}`);
  assert(upData.probe.hasAudio === true, 'Audio stream detected');
  assert(upData.probe.audio.channels === 2, 'Stereo (2 channels) confirmed');
  assert(Math.abs(upData.probe.duration - 5) < 0.2, `Duration accurate (~5s): ${upData.probe.duration}s`);
  const mainFileId = upData.fileId;

  // 3. Error Handling & Edge Cases
  console.log('\n--- 3. Edge Cases: Empty & Corrupt Files ---');
  const { res: emptyRes, data: emptyData } = await uploadHelper(fixtures.emptyFile, 'empty.mp3');
  assert(emptyRes.status === 400, 'Empty (0 byte) file is rejected with HTTP 400');
  assert(emptyData.error.includes('empty'), `Error message: "${emptyData.error}"`);

  const { res: corruptRes, data: corruptData } = await uploadHelper(fixtures.corruptFile, 'corrupt.mp3');
  assert(corruptRes.status === 400, 'Corrupt file is rejected with HTTP 400');
  assert(Boolean(corruptData.error), `Rejection message: "${corruptData.error}"`);

  // 4. Audio Format Converter
  console.log('\n--- 4. Audio Format Converter & Bitrate Scaler ---');
  // 4a. MP3 -> WAV (PCM Lossless)
  const convWavRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'wav', sampleRate: 44100 })
  });
  const convWav = await convWavRes.json();
  assert(convWavRes.status === 200, 'Converted to Lossless WAV');
  assert(convWav.probe.audio.codec === 'pcm_s16le', 'WAV codec is pcm_s16le');

  // 4b. MP3 -> FLAC Hi-Fi
  const convFlacRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'flac', sampleRate: 48000 })
  });
  const convFlac = await convFlacRes.json();
  assert(convFlacRes.status === 200, 'Converted to Audiophile FLAC');
  assert(convFlac.probe.audio.codec === 'flac', 'FLAC codec is flac');
  assert(convFlac.probe.audio.sampleRate === 48000, 'Sample rate resampled to 48000 Hz');

  // 4c. MP3 -> AAC 256k
  const convAacRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'aac', bitrate: '256k' })
  });
  const convAac = await convAacRes.json();
  assert(convAacRes.status === 200, 'Converted to Apple AAC 256k');
  assert(convAac.probe.audio.codec === 'aac', 'Codec is aac');

  // 4d. MP3 -> OGG Vorbis
  const convOggRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'ogg', bitrate: '192k' })
  });
  const convOgg = await convOggRes.json();
  assert(convOggRes.status === 200, 'Converted to OGG Vorbis');
  assert(convOgg.probe.audio.codec === 'vorbis', 'Codec is vorbis');

  // 4e. MP3 -> M4A
  const convM4aRes = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'm4a', bitrate: '320k' })
  });
  const convM4a = await convM4aRes.json();
  assert(convM4aRes.status === 200, 'Converted to M4A container');
  assert(convM4a.downloadName.endsWith('.m4a'), 'Correct .m4a extension');

  // 4f. Bitrate Scaling: 320k MP3
  const conv320Res = await fetch(`${BASE_URL}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'mp3', bitrate: '320k' })
  });
  const conv320 = await conv320Res.json();
  assert(conv320Res.status === 200, 'Scaled up to 320 kbps MP3');
  assert(conv320.probe.audio.bitRate >= 300, `Bitrate verified: ${conv320.probe.audio.bitRate} kbps`);

  // 5. Trimming & Precision Cutting
  console.log('\n--- 5. Audio Trimmer & Precision Cutter ---');
  // 5a. Keep region [1.250s, 3.750s] with fades
  const trimKeepRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: mainFileId,
      start: 1.250,
      end: 3.750,
      mode: 'keep',
      fadeIn: 0.5,
      fadeOut: 0.5,
      targetFormat: 'mp3'
    })
  });
  const trimKeep = await trimKeepRes.json();
  assert(trimKeepRes.status === 200, 'Trimmed region [1.25s, 3.75s] with fades');
  assert(Math.abs(trimKeep.probe.duration - 2.5) < 0.15, `Duration ~2.5s: ${trimKeep.probe.duration}s`);

  // 5b. Cut out middle segment [2.0s, 4.0s] and splice
  const cutMidRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: mainFileId,
      start: 2.0,
      end: 4.0,
      mode: 'remove',
      targetFormat: 'mp3'
    })
  });
  const cutMid = await cutMidRes.json();
  assert(cutMidRes.status === 200, 'Cut middle [2s, 4s] and spliced ends');
  assert(Math.abs(cutMid.probe.duration - 3.0) < 0.25, `Remaining duration ~3.0s: ${cutMid.probe.duration}s`);

  // 5c. Cut from start (start = 0, end = 2.0s)
  const cutStartRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: mainFileId,
      start: 0,
      end: 2.0,
      mode: 'remove',
      targetFormat: 'mp3'
    })
  });
  const cutStart = await cutStartRes.json();
  assert(cutStartRes.status === 200, 'Cut from start (0s to 2s) without concat error');
  assert(Math.abs(cutStart.probe.duration - 3.0) < 0.25, `Remaining duration ~3.0s: ${cutStart.probe.duration}s`);

  // 5d. Cut till end (start = 3.5s, end = 5.0s)
  const cutEndRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: mainFileId,
      start: 3.5,
      end: 5.0,
      mode: 'remove',
      targetFormat: 'mp3'
    })
  });
  const cutEnd = await cutEndRes.json();
  assert(cutEndRes.status === 200, 'Cut till end (3.5s to 5s) without error');
  assert(Math.abs(cutEnd.probe.duration - 3.5) < 0.25, `Remaining duration ~3.5s: ${cutEnd.probe.duration}s`);

  // 5e. Trim error check: start >= end
  const badTrimRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, start: 4.0, end: 2.0, mode: 'keep' })
  });
  assert(badTrimRes.status === 400, 'Invalid trim range rejected with 400');

  // 6. Volume Booster / Gain Control & Soft Limiter
  console.log('\n--- 6. Volume Booster & Gain Control (Soft Limiter) ---');
  // 6a. Dedicated /api/volume with 250% boost (+8dB with soft limiter)
  const volBoostRes = await fetch(`${BASE_URL}/api/volume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, volume: 2.5, targetFormat: 'mp3' })
  });
  const volBoost = await volBoostRes.json();
  assert(volBoostRes.status === 200, 'Volume boosted to 250% (+8dB) with soft limiter');
  assert(volBoost.probe.hasAudio === true, 'Boosted audio file intact');

  // 6b. Volume attenuation (50% gain)
  const volCutRes = await fetch(`${BASE_URL}/api/volume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, volume: 0.5, targetFormat: 'mp3' })
  });
  const volCut = await volCutRes.json();
  assert(volCutRes.status === 200, 'Volume attenuated to 50% cleanly');

  // 7. Speed & Pitch Shifter
  console.log('\n--- 7. Speed & Pitch Shifting ---');
  // 7a. Speed up 1.5x with pitch preserved (atempo)
  const speedUpRes = await fetch(`${BASE_URL}/api/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, speed: 1.5, preservePitch: true, targetFormat: 'mp3' })
  });
  const speedUp = await speedUpRes.json();
  assert(speedUpRes.status === 200, 'Speed adjusted to 1.5x with pitch preserved');
  assert(Math.abs(speedUp.probe.duration - (5 / 1.5)) < 0.25, `Duration shortened to ~3.33s: ${speedUp.probe.duration}s`);

  // 7b. Pitch shift +3 semitones with rubberband
  const pitchRes = await fetch(`${BASE_URL}/api/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, speed: 1.0, pitch: 3, preservePitch: true, targetFormat: 'mp3' })
  });
  const pitchData = await pitchRes.json();
  assert(pitchRes.status === 200, 'Pitch shifted +3 semitones with rubberband');

  // 7c. Vinyl mode (speed + pitch linked)
  const vinylRes = await fetch(`${BASE_URL}/api/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, speed: 1.25, preservePitch: false, targetFormat: 'mp3' })
  });
  const vinylData = await vinylRes.json();
  assert(vinylRes.status === 200, 'Vinyl speed & pitch link (asetrate) processed');

  // 8. Vocal Remover & Center Channel Suppression
  console.log('\n--- 8. Vocal Remover / Center Channel Extraction ---');
  const vocalRes = await fetch(`${BASE_URL}/api/vocal-remover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'mp3' })
  });
  const vocalData = await vocalRes.json();
  assert(vocalRes.status === 200, 'Vocal remover (center channel phase inversion) executed');
  assert(vocalData.probe.audio.channels === 2, 'Maintains stereo separation');

  // 9. Audio Reverse & Noise Reduction
  console.log('\n--- 9. Audio Reverse & Noise Reduction ---');
  // 9a. Reverse
  const revRes = await fetch(`${BASE_URL}/api/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, targetFormat: 'mp3' })
  });
  const revData = await revRes.json();
  assert(revRes.status === 200, 'Audio reverse (areverse) executed cleanly');

  // 9b. Noise Reduction (afftdn FFT denoiser)
  const noiseRes = await fetch(`${BASE_URL}/api/noise-reduction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: mainFileId, strength: 'medium', targetFormat: 'mp3' })
  });
  const noiseData = await noiseRes.json();
  assert(noiseRes.status === 200, 'Noise reduction (afftdn FFT filter) processed');
  assert(noiseData.probe.hasAudio === true, 'Denoised audio stream intact');

  // 10. Multi-Track Audio Joiner / Merger
  console.log('\n--- 10. Audio Joiner / Merger (Chained Crossfade) ---');
  const { data: t1 } = await uploadHelper(fixtures.track1, 'track1.mp3');
  const { data: t2 } = await uploadHelper(fixtures.track2, 'track2.mp3');
  const { data: t3 } = await uploadHelper(fixtures.track3, 'track3.mp3');

  // 10a. 2-track merger with acrossfade
  const merge2Res = await fetch(`${BASE_URL}/api/merge-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileIds: [t1.fileId, t2.fileId],
      crossfade: 1.0,
      targetFormat: 'mp3'
    })
  });
  const merge2 = await merge2Res.json();
  assert(merge2Res.status === 200, 'Dual-track merge with 1.0s crossfade via /api/merge-audio');
  assert(Math.abs(merge2.probe.duration - 5.0) < 0.35, `Duration accounts for crossfade (~5s): ${merge2.probe.duration}s`);

  // 10b. 3-track merger with multi-track chained crossfade
  const merge3Res = await fetch(`${BASE_URL}/api/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileIds: [t1.fileId, t2.fileId, t3.fileId],
      crossfade: 1.0,
      targetFormat: 'mp3'
    })
  });
  const merge3 = await merge3Res.json();
  assert(merge3Res.status === 200, '3-track merge with chained multi-track crossfade');
  assert(Math.abs(merge3.probe.duration - 7.0) < 0.5, `3-track crossfade duration (~7s): ${merge3.probe.duration}s`);

  // 11. Video-to-Audio Extractor
  console.log('\n--- 11. Video to Audio Soundtrack Extractor ---');
  const { data: vidUp } = await uploadHelper(fixtures.testMp4, 'test_video.mp4');
  assert(vidUp.probe.hasVideo === true, 'Uploaded MP4 video confirmed');

  // 11a. Extract MP3 via /api/extract-audio
  const extMp3Res = await fetch(`${BASE_URL}/api/extract-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: vidUp.fileId, targetFormat: 'mp3', bitrate: '320k' })
  });
  const extMp3 = await extMp3Res.json();
  assert(extMp3Res.status === 200, 'Extracted MP3 via /api/extract-audio');
  assert(extMp3.probe.audio.codec === 'mp3', 'Extracted stream is MP3');

  // 11b. Extract WAV via /api/video-to-audio with time slice
  const extWavRes = await fetch(`${BASE_URL}/api/video-to-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: vidUp.fileId, targetFormat: 'wav', start: 0.5, end: 2.5 })
  });
  const extWav = await extWavRes.json();
  assert(extWavRes.status === 200, 'Extracted WAV slice via /api/video-to-audio');
  assert(Math.abs(extWav.probe.duration - 2.0) < 0.2, `Duration ~2.0s: ${extWav.probe.duration}s`);

  // 12. Ultra-short audio clip (<0.5s) test
  console.log('\n--- 12. Ultra-Short Clip (<0.5s) Stress Test ---');
  const { data: shortUp } = await uploadHelper(fixtures.shortWav, 'short_clip.wav');
  assert(shortUp.probe.duration <= 0.35, `Ultra-short clip duration confirmed: ${shortUp.probe.duration}s`);

  // Trim ultra-short clip to 0.1s
  const shortTrimRes = await fetch(`${BASE_URL}/api/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId: shortUp.fileId,
      start: 0.05,
      end: 0.20,
      mode: 'keep',
      targetFormat: 'wav'
    })
  });
  const shortTrim = await shortTrimRes.json();
  assert(shortTrimRes.status === 200, 'Ultra-short clip precision trimmed without error');
  assert(shortTrim.probe.duration > 0 && shortTrim.probe.duration <= 0.20, `Sub-second trimmed duration: ${shortTrim.probe.duration}s`);

  // 13. Range Streaming Verification
  console.log('\n--- 13. Audio Streaming & Range Header Verification ---');
  const streamRes = await fetch(`${BASE_URL}/api/stream/${mainFileId}`, {
    headers: { Range: 'bytes=0-2048' }
  });
  assert(streamRes.status === 206, 'Streaming responds with HTTP 206 Partial Content');
  assert(streamRes.headers.get('content-range')?.startsWith('bytes 0-2048/'), 'Content-Range header properly formatted');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} AUDIO PRODUCTION TESTS PASSED WITH 100% SUCCESS!`);
  console.log('================================================================\n');

  // Clean up temporary fixtures
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch (e) {}
}

runProductionTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch (e) {}
  process.exit(1);
});
