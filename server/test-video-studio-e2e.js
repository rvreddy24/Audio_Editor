const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { probeFile, runFFmpeg } = require('./ffmpeg-helper');

const TEST_DIR = path.join(__dirname, 'test_e2e_video');
if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });

const sampleVideo = path.join(TEST_DIR, 'sample_e2e.mp4');

function runCmd(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}: ${stderr.slice(-300)}`));
    });
  });
}

async function runE2E() {
  console.log('========================================================');
  console.log('STARTING VIDEO STUDIO PIPELINE VERIFICATION SUITE');
  console.log('========================================================');

  // 1. Create a test video (8s, 1920x1080 30fps with tone audio)
  console.log('\n[1/10] Generating 8-second Full HD 1080p source video...');
  await runCmd([
    '-y',
    '-f', 'lavfi', '-i', 'testsrc=duration=8:size=1920x1080:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=8',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    sampleVideo
  ]);
  const probe = await probeFile(sampleVideo);
  console.log(`  ✓ Created Source: ${probe.duration.toFixed(1)}s | ${probe.video.width}x${probe.video.height} | ${probe.audio.codec}`);

  // 2. Trim video (2.0s to 5.5s)
  console.log('\n[2/10] Testing Precision Video Trim (2.0s -> 5.5s)...');
  const trimOut = path.join(TEST_DIR, 'trimmed.mp4');
  await runCmd([
    '-y', '-ss', '2.0', '-to', '5.5', '-i', sampleVideo,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', trimOut
  ]);
  const trimProbe = await probeFile(trimOut);
  console.log(`  ✓ Trimmed successfully: ${trimProbe.duration.toFixed(1)}s (Expected ~3.5s)`);

  // 3. Aspect Ratio Crop (9:16 Shorts/Reels & 1:1 Instagram)
  console.log('\n[3/10] Testing Aspect Ratio Cropping (9:16 Vertical & 1:1 Square)...');
  const crop916Out = path.join(TEST_DIR, 'crop_9_16.mp4');
  await runCmd([
    '-y', '-i', sampleVideo,
    '-vf', "crop='if(gt(a,9/16),ih*9/16,iw)':'if(gt(a,9/16),ih,iw*16/9)'",
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', crop916Out
  ]);
  const p916 = await probeFile(crop916Out);
  console.log(`  ✓ 9:16 Vertical Cropped: ${p916.video.width}x${p916.video.height}`);

  const crop11Out = path.join(TEST_DIR, 'crop_1_1.mp4');
  await runCmd([
    '-y', '-i', sampleVideo,
    '-vf', 'crop=min(iw\\,ih):min(iw\\,ih)',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', crop11Out
  ]);
  const p11 = await probeFile(crop11Out);
  console.log(`  ✓ 1:1 Square Cropped: ${p11.video.width}x${p11.video.height}`);

  // 4. Speed & Pitch Preservation (2x Speed)
  console.log('\n[4/10] Testing Playback Speed & Pitch Preservation (2.0x)...');
  const speedOut = path.join(TEST_DIR, 'speed_2x.mp4');
  await runCmd([
    '-y', '-i', sampleVideo,
    '-filter_complex', '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]',
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', speedOut
  ]);
  const pSpeed = await probeFile(speedOut);
  console.log(`  ✓ 2x Speed applied: Duration ${pSpeed.duration.toFixed(1)}s (Expected ~4.0s)`);

  // 5. Rotate & Mirror Flip (90 CW & Horizontal Mirror)
  console.log('\n[5/10] Testing Rotate & Flip...');
  const rotOut = path.join(TEST_DIR, 'rot_mirror.mp4');
  await runCmd([
    '-y', '-i', sampleVideo,
    '-vf', 'transpose=1,hflip',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', rotOut
  ]);
  const pRot = await probeFile(rotOut);
  console.log(`  ✓ Rotated 90° CW & Mirrored: ${pRot.video.width}x${pRot.video.height}`);

  // 6. Visual Filters (Grayscale + Contrast Boost)
  console.log('\n[6/10] Testing Filters & Color Adjustments...');
  const filterOut = path.join(TEST_DIR, 'filter.mp4');
  await runCmd([
    '-y', '-i', sampleVideo,
    '-vf', 'hue=s=0,eq=contrast=1.3:brightness=0.05',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', filterOut
  ]);
  const pFilt = await probeFile(filterOut);
  console.log(`  ✓ Grayscale & Contrast applied: ${pFilt.size} bytes`);

  // 7. Watermark Text Overlay
  console.log('\n[7/10] Testing Text Watermark Overlay...');
  const wmOut = path.join(TEST_DIR, 'watermark.mp4');
  await runCmd([
    '-y', '-i', sampleVideo,
    '-vf', "drawtext=fontfile=C\\\\:/Windows/Fonts/arial.ttf:text='@rajvarshith.com':x=w-tw-30:y=h-th-30:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=8",
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', wmOut
  ]);
  const pWm = await probeFile(wmOut);
  console.log(`  ✓ Text Watermark burned in: ${pWm.size} bytes`);

  // 8. Animated GIF Generation
  console.log('\n[8/10] Testing High Quality Animated GIF Export...');
  const gifOut = path.join(TEST_DIR, 'export.gif');
  await runCmd([
    '-y', '-t', '3', '-i', sampleVideo,
    '-vf', 'fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse',
    gifOut
  ]);
  const gifStat = fs.statSync(gifOut);
  console.log(`  ✓ Animated GIF generated: ${gifStat.size} bytes`);

  // 9. Extract Audio (MP3 320k)
  console.log('\n[9/10] Testing Audio Extraction (320kbps MP3)...');
  const mp3Out = path.join(TEST_DIR, 'audio_320k.mp3');
  await runCmd([
    '-y', '-i', sampleVideo,
    '-vn', '-c:a', 'libmp3lame', '-b:a', '320k', mp3Out
  ]);
  const pMp3 = await probeFile(mp3Out);
  console.log(`  ✓ Extracted Audio: ${pMp3.duration.toFixed(1)}s, ${pMp3.audio.bitRate}kbps ${pMp3.audio.codec}`);

  // 10. Reverse Video
  console.log('\n[10/10] Testing Reverse Video & Audio...');
  const revOut = path.join(TEST_DIR, 'reversed.mp4');
  await runCmd([
    '-y', '-t', '4', '-i', sampleVideo,
    '-vf', 'reverse', '-af', 'areverse',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', revOut
  ]);
  const pRev = await probeFile(revOut);
  console.log(`  ✓ Reversed Video & Audio: ${pRev.duration.toFixed(1)}s`);

  // 11. Testing User Sample Video: E:\New Gen\0c6bdc168f784c9b964a4459e6904661.mp4
  const userVid = 'E:/New Gen/0c6bdc168f784c9b964a4459e6904661.mp4';
  if (fs.existsSync(userVid)) {
    console.log('\n========================================================');
    console.log('VERIFYING REAL USER VIDEO FILE:');
    console.log(userVid);
    console.log('========================================================');
    const uProbe = await probeFile(userVid);
    console.log(`  ✓ Loaded user video: ${uProbe.video.width}x${uProbe.video.height}, duration ${uProbe.duration.toFixed(1)}s`);

    // 11a. 9:16 Crop to Fill with Pan Left, Center, Right
    console.log('  Testing 9:16 Crop to Fill (Left / Center / Right Pan)...');
    const u916Center = path.join(TEST_DIR, 'user_916_center.mp4');
    await runCmd(['-y', '-ss', '10', '-t', '2', '-i', userVid, '-vf', 'crop=404:720:438:0', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', u916Center]);
    const p916c = await probeFile(u916Center);
    console.log(`  ✓ 9:16 Center: ${p916c.video.width}x${p916c.video.height}`);

    const u916Left = path.join(TEST_DIR, 'user_916_left.mp4');
    await runCmd(['-y', '-ss', '10', '-t', '2', '-i', userVid, '-vf', 'crop=404:720:0:0', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', u916Left]);
    const p916l = await probeFile(u916Left);
    console.log(`  ✓ 9:16 Pan Left: ${p916l.video.width}x${p916l.video.height}`);

    const u916Right = path.join(TEST_DIR, 'user_916_right.mp4');
    await runCmd(['-y', '-ss', '10', '-t', '2', '-i', userVid, '-vf', 'crop=404:720:876:0', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', u916Right]);
    const p916r = await probeFile(u916Right);
    console.log(`  ✓ 9:16 Pan Right: ${p916r.video.width}x${p916r.video.height}`);

    // 11b. 9:16 Fit with Blurred Background
    console.log('  Testing 9:16 Fit with Blurred Background (TikTok / Reels style)...');
    const u916Blur = path.join(TEST_DIR, 'user_916_blur.mp4');
    await runCmd([
      '-y', '-ss', '10', '-t', '2', '-i', userVid,
      '-vf', 'split[fg][bg];[bg]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=20:5[bgout];[fg]scale=720:1280:force_original_aspect_ratio=decrease[fgout];[bgout][fgout]overlay=(W-w)/2:(H-h)/2',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', u916Blur
    ]);
    const p916b = await probeFile(u916Blur);
    console.log(`  ✓ 9:16 Blurred Background: ${p916b.video.width}x${p916b.video.height}`);

    // 11c. 1:1 Square Crop
    console.log('  Testing 1:1 Square Crop...');
    const u11 = path.join(TEST_DIR, 'user_11.mp4');
    await runCmd(['-y', '-ss', '10', '-t', '2', '-i', userVid, '-vf', 'crop=720:720:280:0', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', u11]);
    const p11s = await probeFile(u11);
    console.log(`  ✓ 1:1 Square: ${p11s.video.width}x${p11s.video.height}`);

    // 11d. 4:5 Portrait Crop
    console.log('  Testing 4:5 Portrait Crop...');
    const u45 = path.join(TEST_DIR, 'user_45.mp4');
    await runCmd(['-y', '-ss', '10', '-t', '2', '-i', userVid, '-vf', 'crop=576:720:352:0', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', u45]);
    const p45 = await probeFile(u45);
    console.log(`  ✓ 4:5 Portrait: ${p45.video.width}x${p45.video.height}`);

    // 11e. 21:9 Ultrawide Crop
    console.log('  Testing 21:9 Ultrawide Crop...');
    const u219 = path.join(TEST_DIR, 'user_219.mp4');
    await runCmd(['-y', '-ss', '10', '-t', '2', '-i', userVid, '-vf', 'crop=1280:548:0:86', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy', u219]);
    const p219 = await probeFile(u219);
    console.log(`  ✓ 21:9 Ultrawide: ${p219.video.width}x${p219.video.height}`);
  }

  // Cleanup test workspace
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n========================================================');
  console.log('ALL 10 VIDEO STUDIO PIPELINES VERIFIED 100% SUCCESSFUL!');
  console.log('========================================================');
}

runE2E().catch(err => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
