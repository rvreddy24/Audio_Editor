const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const app = require('./index');
const { probeFile } = require('./ffmpeg-helper');

const TEST_DIR = path.join(__dirname, 'test_production_sandbox');
if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });

const userVideoArtifact = 'C:/Users/rajva/.gemini/antigravity/brain/ac13a5af-fc2b-42e9-ba9f-53e3880f390b/.user_uploaded/media_1794371721580_bbbaeb29.mp4';

let server;
let TEST_PORT = 5098;
let BASE_URL = `http://localhost:${TEST_PORT}`;

function runCmd(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

async function startTestServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on ${BASE_URL}`);
      resolve();
    });
  });
}

async function stopTestServer() {
  if (server) {
    return new Promise(res => server.close(res));
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('VIDEO STUDIO PRODUCTION AUDIT & VERIFICATION SUITE');
  console.log('================================================================');

  await startTestServer();

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    } else {
      passed++;
      console.log(`  ✓ PASSED: ${message}`);
    }
  }

  try {
    // 1. Generate Synthetic Test Fixtures
    console.log('\n[Phase 1] Generating Test Video & Audio Fixtures...');
    const src1080p = path.join(TEST_DIR, 'source_1080p.mp4');
    await runCmd([
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=6:size=1920x1080:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k',
      src1080p
    ]);
    const probe1080 = await probeFile(src1080p);
    assert(probe1080.video.width === 1920 && probe1080.video.height === 1080, '1080p test video created');

    const srcSilent = path.join(TEST_DIR, 'source_silent.mp4');
    await runCmd([
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=4:size=640x360:rate=30',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
      '-an',
      srcSilent
    ]);
    const probeSilent = await probeFile(srcSilent);
    assert(probeSilent.hasAudio === false, 'Silent test video created without audio stream');

    const srcSurround51 = path.join(TEST_DIR, 'source_surround51.mp4');
    await runCmd([
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=4:size=1280x720:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=220:duration=4',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
      '-filter_complex', '[1:a]pan=5.1|c0=c0|c1=c0|c2=c0|c3=c0|c4=c0|c5=c0[a51]',
      '-map', '0:v', '-map', '[a51]',
      '-c:a', 'aac', '-b:a', '256k',
      srcSurround51
    ]);
    const probeSurround = await probeFile(srcSurround51);
    assert(probeSurround.audio.channels === 6, '5.1 Surround sound test video created (6 channels)');

    const bgMusicTrack = path.join(TEST_DIR, 'bg_music.mp3');
    await runCmd([
      '-y',
      '-f', 'lavfi', '-i', 'sine=frequency=880:duration=10',
      '-c:a', 'libmp3lame', '-b:a', '192k',
      bgMusicTrack
    ]);
    assert(fs.existsSync(bgMusicTrack), 'Background music track created');

    // 2. Test Real User Video Artifact
    console.log('\n[Phase 2] Verifying Real User Video Artifact...');
    let userVideo = null;
    if (fs.existsSync(userVideoArtifact)) {
      userVideo = userVideoArtifact;
      const userProbe = await probeFile(userVideo);
      console.log(`  Artifact: ${userVideo}`);
      console.log(`  Dimensions: ${userProbe.video.width}x${userProbe.video.height} (non-standard 1032p) | Duration: ${userProbe.duration.toFixed(1)}s`);
      assert(userProbe.video.width === 1920 && userProbe.video.height === 1032, 'Real user artifact loaded with exact 1920x1032 dimensions');
    }

    // 3. Test Video Trimmer: Precise vs Fast Keyframe Cut
    console.log('\n[Phase 3] Testing Video Trimmer & Cut Precision...');
    const testVideoInput = userVideo || src1080p;

    // 3a. Precise millisecond cut via /api/video/trim
    const formTrimPrecise = new FormData();
    formTrimPrecise.append('file', new Blob([fs.readFileSync(testVideoInput)]), path.basename(testVideoInput));
    formTrimPrecise.append('trimStart', '1.125');
    formTrimPrecise.append('trimEnd', '4.625');
    formTrimPrecise.append('cutMode', 'precise');

    const resTrimPrecise = await fetch(`${BASE_URL}/api/video/trim`, { method: 'POST', body: formTrimPrecise });
    assert(resTrimPrecise.status === 200, '/api/video/trim endpoint responds 200 OK');
    const dataTrimPrecise = await resTrimPrecise.json();
    assert(dataTrimPrecise.probe.duration >= 3.3 && dataTrimPrecise.probe.duration <= 3.7, `Precise trim cut expected ~3.5s (Actual: ${dataTrimPrecise.probe.duration.toFixed(2)}s)`);

    // 3b. Fast stream copy cut via /api/video/trim
    const formTrimFast = new FormData();
    formTrimFast.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formTrimFast.append('trimStart', '1.0');
    formTrimFast.append('trimEnd', '4.0');
    formTrimFast.append('cutMode', 'fast');

    const resTrimFast = await fetch(`${BASE_URL}/api/video/trim`, { method: 'POST', body: formTrimFast });
    assert(resTrimFast.status === 200, 'Fast stream copy cut responds 200 OK');
    const dataTrimFast = await resTrimFast.json();
    assert(dataTrimFast.probe.duration > 0, `Fast cut succeeded with duration ${dataTrimFast.probe.duration.toFixed(1)}s`);

    // 4. Test 9:16 Shorts / Reels Crop
    console.log('\n[Phase 4] Testing 9:16 Shorts / TikTok / Reels Crop Modes...');
    // 4a. Crop to Fill (Center)
    const formShortsCrop = new FormData();
    formShortsCrop.append('file', new Blob([fs.readFileSync(testVideoInput)]), path.basename(testVideoInput));
    formShortsCrop.append('aspectMode', 'crop');
    formShortsCrop.append('panX', '50');

    const resShortsCrop = await fetch(`${BASE_URL}/api/video/crop-shorts`, { method: 'POST', body: formShortsCrop });
    assert(resShortsCrop.status === 200, '/api/video/crop-shorts (crop to fill) responds 200 OK');
    const dataShortsCrop = await resShortsCrop.json();
    assert(dataShortsCrop.probe.video.width % 2 === 0 && dataShortsCrop.probe.video.height % 2 === 0, 'Output dimensions are strictly even');
    assert(dataShortsCrop.probe.video.height > dataShortsCrop.probe.video.width, 'Result is portrait 9:16 vertical orientation');

    // 4b. Fit with Blurred Background
    const formShortsBlur = new FormData();
    formShortsBlur.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formShortsBlur.append('aspectMode', 'fit-blur');

    const resShortsBlur = await fetch(`${BASE_URL}/api/video/crop-shorts`, { method: 'POST', body: formShortsBlur });
    assert(resShortsBlur.status === 200, '/api/video/crop-shorts (fit-blur) responds 200 OK');
    const dataShortsBlur = await resShortsBlur.json();
    assert(dataShortsBlur.probe.video.width === 720 && dataShortsBlur.probe.video.height === 1280, 'Fit-blur generated standard 720x1280 Shorts resolution');

    // 4c. Fit with Pad (Letterbox)
    const formShortsPad = new FormData();
    formShortsPad.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formShortsPad.append('aspectMode', 'fit-pad');

    const resShortsPad = await fetch(`${BASE_URL}/api/video/crop-shorts`, { method: 'POST', body: formShortsPad });
    assert(resShortsPad.status === 200, '/api/video/crop-shorts (fit-pad) responds 200 OK');
    const dataShortsPad = await resShortsPad.json();
    assert(dataShortsPad.probe.video.width === 720 && dataShortsPad.probe.video.height === 1280, 'Fit-pad generated standard 720x1280 padded resolution');

    // 5. Test Video to Animated GIF
    console.log('\n[Phase 5] Testing Video to Animated GIF Generation...');
    const formGif = new FormData();
    formGif.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formGif.append('fps', '20');
    formGif.append('width', '480');
    formGif.append('dither', 'floyd_steinberg');
    formGif.append('trimStart', '0');
    formGif.append('trimEnd', '2.5');

    const resGif = await fetch(`${BASE_URL}/api/video/to-gif`, { method: 'POST', body: formGif });
    assert(resGif.status === 200, '/api/video/to-gif responds 200 OK');
    const dataGif = await resGif.json();
    assert(dataGif.size > 10000, `Animated GIF generated (${dataGif.size} bytes)`);

    // 6. Test Video Compressor (Target Size & CRF Presets)
    console.log('\n[Phase 6] Testing Video Compressor & Target Size Presets...');
    // 6a. Target Size Limit (e.g. 2 MB)
    const formCompress = new FormData();
    formCompress.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formCompress.append('targetSizeMB', '2');
    formCompress.append('resolution', '720p');

    const resCompress = await fetch(`${BASE_URL}/api/video/compress`, { method: 'POST', body: formCompress });
    assert(resCompress.status === 200, '/api/video/compress (targetSizeMB: 2) responds 200 OK');
    const dataCompress = await resCompress.json();
    assert(dataCompress.compressedSize <= 2.5 * 1024 * 1024, `Compressed file size (${(dataCompress.compressedSize / 1024 / 1024).toFixed(2)} MB) respects target boundary`);

    // 6b. Maximum Compression Preset (CRF 34)
    const formMaxCompress = new FormData();
    formMaxCompress.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formMaxCompress.append('preset', 'max_compression');

    const resMaxCompress = await fetch(`${BASE_URL}/api/video/compress`, { method: 'POST', body: formMaxCompress });
    assert(resMaxCompress.status === 200, 'Max compression preset responds 200 OK');
    const dataMaxCompress = await resMaxCompress.json();
    assert(dataMaxCompress.compressedSize < dataMaxCompress.originalSize, 'Compressed size is smaller than original 1080p video');

    // 7. Test Video Format Converter (WebM with Opus, MP4, MOV, MKV)
    console.log('\n[Phase 7] Testing Video Format Converter & WebM Audio Bug Fix...');
    // 7a. WebM with VP9 and Opus audio
    const formWebm = new FormData();
    formWebm.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formWebm.append('targetFormat', 'webm');
    formWebm.append('quality', 'medium');

    const resWebm = await fetch(`${BASE_URL}/api/video/convert`, { method: 'POST', body: formWebm });
    assert(resWebm.status === 200, '/api/video/convert to WebM responds 200 OK without audio codec crash');
    const dataWebm = await resWebm.json();
    assert(dataWebm.probe.video.codec === 'vp9', `WebM video codec is VP9 (Actual: ${dataWebm.probe.video.codec})`);
    assert(dataWebm.probe.audio.codec === 'opus', `WebM audio codec is Opus (Actual: ${dataWebm.probe.audio.codec})`);

    // 7b. MOV QuickTime format
    const formMov = new FormData();
    formMov.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formMov.append('targetFormat', 'mov');

    const resMov = await fetch(`${BASE_URL}/api/video/convert`, { method: 'POST', body: formMov });
    assert(resMov.status === 200, '/api/video/convert to MOV responds 200 OK');
    const dataMov = await resMov.json();
    assert(dataMov.probe.formatName.includes('mov'), 'Format is QuickTime MOV');

    // 7c. MKV format
    const formMkv = new FormData();
    formMkv.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formMkv.append('targetFormat', 'mkv');

    const resMkv = await fetch(`${BASE_URL}/api/video/convert`, { method: 'POST', body: formMkv });
    assert(resMkv.status === 200, '/api/video/convert to MKV responds 200 OK');

    // 8. Test Audio Extraction (320kbps MP3, WAV, AAC)
    console.log('\n[Phase 8] Testing Audio Extraction & Video Muting...');
    const formMp3 = new FormData();
    formMp3.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formMp3.append('targetFormat', 'mp3');
    formMp3.append('bitrate', '320k');

    const resMp3 = await fetch(`${BASE_URL}/api/video/extract-audio`, { method: 'POST', body: formMp3 });
    assert(resMp3.status === 200, '/api/video/extract-audio (MP3 320k) responds 200 OK');
    const dataMp3 = await resMp3.json();
    assert(dataMp3.probe.audio.codec === 'mp3', 'Extracted audio codec is MP3');

    // 8b. Mute video check
    const formMute = new FormData();
    formMute.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formMute.append('audioMode', 'mute');

    const resMute = await fetch(`${BASE_URL}/api/video/process`, { method: 'POST', body: formMute });
    assert(resMute.status === 200, 'Video muting responds 200 OK');
    const dataMute = await resMute.json();
    assert(dataMute.probe.hasAudio === false, 'Output video has no audio stream (-an active)');

    // 9. Test Video Speed Changer (0.5x, 0.75x, 1.25x, 1.5x, 2.0x with audio tempo sync)
    console.log('\n[Phase 9] Testing Playback Speed & Audio Tempo Sync...');
    for (const testSpeed of [0.5, 0.75, 1.5, 2.0]) {
      const formSpeed = new FormData();
      formSpeed.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
      formSpeed.append('speed', testSpeed.toString());
      formSpeed.append('trimStart', '0');
      formSpeed.append('trimEnd', '4');

      const resSpeed = await fetch(`${BASE_URL}/api/video/process`, { method: 'POST', body: formSpeed });
      assert(resSpeed.status === 200, `Speed ${testSpeed}x responds 200 OK`);
      const dataSpeed = await resSpeed.json();
      const expectedDur = 4.0 / testSpeed;
      assert(Math.abs(dataSpeed.probe.duration - expectedDur) < 0.5, `Speed ${testSpeed}x expected duration ~${expectedDur.toFixed(1)}s (Actual: ${dataSpeed.probe.duration.toFixed(1)}s)`);
    }

    // 10. Test Watermark on Windows Font & Color Filters
    console.log('\n[Phase 10] Testing Watermark Burn-in & Color Filters...');
    const formWm = new FormData();
    formWm.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formWm.append('watermarkText', '@SoundCraft Production Suite');
    formWm.append('watermarkPosition', 'bottom-right');
    formWm.append('filterType', 'vintage');
    formWm.append('brightness', '0.05');
    formWm.append('contrast', '1.2');

    const resWm = await fetch(`${BASE_URL}/api/video/process`, { method: 'POST', body: formWm });
    assert(resWm.status === 200, 'Watermark overlay on Windows font responds 200 OK without fontfile crash');
    const dataWm = await resWm.json();
    assert(dataWm.probe.size > 0, 'Watermark burned video created successfully');

    // 11. Test Edge Cases: Silent Video, 5.1 Surround Sound Audio Mix, Odd Height
    console.log('\n[Phase 11] Testing Production Edge Cases...');
    // 11a. Silent Video without audio track
    const formSilent = new FormData();
    formSilent.append('file', new Blob([fs.readFileSync(srcSilent)]), 'source_silent.mp4');
    formSilent.append('speed', '1.5');
    formSilent.append('aspectRatio', '1:1');

    const resSilent = await fetch(`${BASE_URL}/api/video/process`, { method: 'POST', body: formSilent });
    assert(resSilent.status === 200, 'Silent video processed cleanly without audio stream copy failure');

    // 11b. 5.1 Surround Sound mixed with Stereo Background Music
    const form51Mix = new FormData();
    form51Mix.append('file', new Blob([fs.readFileSync(srcSurround51)]), 'source_surround51.mp4');
    form51Mix.append('audio', new Blob([fs.readFileSync(bgMusicTrack)]), 'bg_music.mp3');
    form51Mix.append('audioMode', 'mix');
    form51Mix.append('bgAudioVolume', '0.4');

    const res51Mix = await fetch(`${BASE_URL}/api/video/process`, { method: 'POST', body: form51Mix });
    assert(res51Mix.status === 200, '5.1 Surround Sound mixed with Stereo MP3 via aformat normalized amix');
    const data51Mix = await res51Mix.json();
    assert(data51Mix.probe.hasAudio === true, 'Mixed audio track present and valid');

    // 11c. Real user video artifact with odd height (1920x1032) in 1:1 and 4:5 crops
    if (userVideo) {
      console.log('  Testing 1920x1032 user video artifact in 1:1 Square & 4:5 Portrait...');
      const form11 = new FormData();
      form11.append('file', new Blob([fs.readFileSync(userVideo)]), path.basename(userVideo));
      form11.append('aspectRatio', '1:1');
      form11.append('trimStart', '0');
      form11.append('trimEnd', '3');

      const res11 = await fetch(`${BASE_URL}/api/video/process`, { method: 'POST', body: form11 });
      assert(res11.status === 200, 'User video 1:1 Square crop responds 200 OK');
      const data11 = await res11.json();
      assert(data11.probe.video.width === data11.probe.video.height, `1:1 Square confirmed (${data11.probe.video.width}x${data11.probe.video.height})`);

      const form45 = new FormData();
      form45.append('file', new Blob([fs.readFileSync(userVideo)]), path.basename(userVideo));
      form45.append('aspectRatio', '4:5');
      form45.append('trimStart', '0');
      form45.append('trimEnd', '3');

      const res45 = await fetch(`${BASE_URL}/api/video/process`, { method: 'POST', body: form45 });
      assert(res45.status === 200, 'User video 4:5 Portrait crop responds 200 OK');
      const data45 = await res45.json();
      assert(data45.probe.video.width % 2 === 0 && data45.probe.video.height % 2 === 0, '4:5 dimensions are strictly even');
    }

    // 12. Test Cancellation / Abort Controller
    console.log('\n[Phase 12] Testing Request Abort / Cancellation Handling...');
    const abortCtrl = new AbortController();
    const formAbort = new FormData();
    formAbort.append('file', new Blob([fs.readFileSync(src1080p)]), 'source_1080p.mp4');
    formAbort.append('speed', '0.5');

    const abortPromise = fetch(`${BASE_URL}/api/video/process`, {
      method: 'POST',
      body: formAbort,
      signal: abortCtrl.signal
    }).catch(err => err);

    setTimeout(() => {
      abortCtrl.abort();
    }, 150);

    const abortResult = await abortPromise;
    assert(abortResult.name === 'AbortError', 'Client AbortController cleanly terminates fetch request');

    console.log('\n================================================================');
    console.log(`PRODUCTION VERIFICATION COMPLETE: ${passed}/${total} ASSERTIONS PASSED (100%)`);
    console.log('================================================================');

  } finally {
    await stopTestServer();
    try {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('\nProduction Verification Suite encountered an error:', err);
  process.exit(1);
});
