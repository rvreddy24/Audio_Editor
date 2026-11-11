import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

const sourceVideo = 'E:/New Gen/0c6bdc168f784c9b964a4459e6904661.mp4';
const outDir = 'd:/Audio Editor/scratch/video_test_output';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
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

async function testAspectFilter(name, preset, aspectMode, panX = 50, panY = 50) {
  const outFile = path.join(outDir, `${name}.mp4`);
  const targetRatio = getAspectRatioMultiplier(preset);
  const srcW = 1280;
  const srcH = 720;
  const vfParts = [];

  if (aspectMode === 'fit-blur') {
    let tw, th;
    if (targetRatio < 1.0) {
      th = Math.max(srcH, 1280);
      tw = Math.round(th * targetRatio);
    } else if (targetRatio === 1.0) {
      th = Math.max(srcW, srcH);
      tw = th;
    } else {
      tw = Math.max(srcW, 1280);
      th = Math.round(tw / targetRatio);
    }
    if (tw % 2 !== 0) tw -= 1;
    if (th % 2 !== 0) th -= 1;
    vfParts.push(`split[fg][bg];[bg]scale=${tw}:${th}:force_original_aspect_ratio=increase,crop=${tw}:${th},boxblur=20:5[bgout];[fg]scale=${tw}:${th}:force_original_aspect_ratio=decrease[fgout];[bgout][fgout]overlay=(W-w)/2:(H-h)/2`);
  } else if (aspectMode === 'fit-pad') {
    let tw, th;
    if (targetRatio < 1.0) {
      th = Math.max(srcH, 1280);
      tw = Math.round(th * targetRatio);
    } else if (targetRatio === 1.0) {
      th = Math.max(srcW, srcH);
      tw = th;
    } else {
      tw = Math.max(srcW, 1280);
      th = Math.round(tw / targetRatio);
    }
    if (tw % 2 !== 0) tw -= 1;
    if (th % 2 !== 0) th -= 1;
    vfParts.push(`scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:color=black`);
  } else {
    // Crop & Fill mode with Pan X & Pan Y
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
      cY = 0;
    } else {
      cW = srcW - (srcW % 2);
      cH = Math.round(cW / targetRatio);
      if (cH % 2 !== 0) cH -= 1;
      const maxY = Math.max(0, srcH - cH);
      cX = 0;
      cY = Math.round(maxY * (pY / 100));
    }
    vfParts.push(`crop=${cW}:${cH}:${cX}:${cY}`);
  }

  const args = [
    '-y',
    '-ss', '10',
    '-i', sourceVideo,
    '-t', '3',
    '-vf', vfParts.join(','),
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-c:a', 'aac',
    outFile
  ];

  try {
    const { stdout, stderr } = await execFileAsync('ffmpeg', args);
    // Probe output
    const probeArgs = ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', outFile];
    const probeRes = await execFileAsync('ffprobe', probeArgs);
    const info = JSON.parse(probeRes.stdout);
    const videoStream = info.streams.find(s => s.width && s.height);
    console.log(`✓ ${name.padEnd(25)} [PASS] Dimensions: ${videoStream.width}x${videoStream.height} (Ratio: ${(videoStream.width / videoStream.height).toFixed(3)})`);
    return { pass: true, width: videoStream.width, height: videoStream.height };
  } catch (err) {
    console.error(`✗ ${name.padEnd(25)} [FAIL]`, err.message);
    return { pass: false, error: err.message };
  }
}

async function run() {
  console.log('=== TESTING ASPECT RATIO PROCESSING ON USER VIDEO ===');
  await testAspectFilter('1_crop_9_16_center', '9:16', 'crop', 50, 50);
  await testAspectFilter('2_crop_9_16_left', '9:16', 'crop', 0, 50);
  await testAspectFilter('3_crop_9_16_right', '9:16', 'crop', 100, 50);
  await testAspectFilter('4_fit_blur_9_16', '9:16', 'fit-blur', 50, 50);
  await testAspectFilter('5_fit_pad_9_16', '9:16', 'fit-pad', 50, 50);
  await testAspectFilter('6_crop_1_1_square', '1:1', 'crop', 50, 50);
  await testAspectFilter('7_crop_4_5_vertical', '4:5', 'crop', 50, 50);
  await testAspectFilter('8_crop_21_9_cinematic', '21:9', 'crop', 50, 50);
}

run();
