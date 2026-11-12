const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function parseFps(fpsStr) {
  if (!fpsStr || fpsStr === '0/0') return 30;
  if (typeof fpsStr === 'string' && fpsStr.includes('/')) {
    const parts = fpsStr.split('/');
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den > 0) {
      return parseFloat((num / den).toFixed(2));
    }
  }
  const parsed = parseFloat(fpsStr);
  return !isNaN(parsed) && parsed > 0 ? parseFloat(parsed.toFixed(2)) : 30;
}

/**
 * Executes an ffprobe command and returns parsed JSON
 */
function probeFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const timeoutMs = options.timeoutMs || 30000;
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ];

    const proc = spawn('ffprobe', args);
    let stdout = '';
    let stderr = '';
    let isSettled = false;

    const timer = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      try { proc.kill('SIGKILL'); } catch (e) {}
      reject(new Error(`ffprobe timed out after ${timeoutMs}ms on ${path.basename(filePath)}`));
    }, timeoutMs);

    proc.stdout.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);

      if (code !== 0) {
        return reject(new Error(`ffprobe failed with code ${code}: ${stderr.trim() || 'Unrecognized media format'}`));
      }
      try {
        const info = JSON.parse(stdout);
        const format = info.format || {};
        const audioStream = (info.streams || []).find(s => s.codec_type === 'audio');
        const videoStream = (info.streams || []).find(s => s.codec_type === 'video');

        const duration = parseFloat(format.duration || (audioStream && audioStream.duration) || '0');
        const bitRate = parseInt(format.bit_rate || (audioStream && audioStream.bit_rate) || '0', 10);

        resolve({
          duration: isNaN(duration) ? 0 : duration,
          bitRate: bitRate ? Math.round(bitRate / 1000) : 0, // in kbps
          formatName: format.format_name,
          formatLongName: format.format_long_name,
          size: parseInt(format.size || '0', 10),
          tags: format.tags || {},
          hasAudio: !!audioStream,
          hasVideo: !!videoStream,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            codecLong: audioStream.codec_long_name,
            sampleRate: parseInt(audioStream.sample_rate || '44100', 10),
            channels: audioStream.channels || 2,
            channelLayout: audioStream.channel_layout || 'stereo',
            bitRate: audioStream.bit_rate ? Math.round(parseInt(audioStream.bit_rate, 10) / 1000) : 0
          } : null,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: parseFps(videoStream.r_frame_rate || videoStream.avg_frame_rate || '30')
          } : null
        });
      } catch (err) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });

    proc.on('error', err => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Runs ffmpeg with progress tracking and abort/cancellation support
 */
function runFFmpeg(args, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const timeoutMs = options.timeoutMs || 300000; // 5 minute default timeout guard
    let isSettled = false;

    // Add progress pipe to args
    const fullArgs = [...args, '-progress', 'pipe:1'];
    const proc = spawn('ffmpeg', fullArgs);

    const timer = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      try { proc.kill('SIGKILL'); } catch (e) {}
      const summaryArgs = args.slice(0, 10).join(' ');
      reject(new Error(`FFmpeg operation timed out after ${timeoutMs}ms (args: ${summaryArgs})`));
    }, timeoutMs);

    if (options.onSpawn && typeof options.onSpawn === 'function') {
      options.onSpawn(proc);
    }

    if (options.signal) {
      if (options.signal.aborted) {
        isSettled = true;
        clearTimeout(timer);
        try { proc.kill('SIGKILL'); } catch (e) {}
        return reject(new Error('FFmpeg process aborted by caller'));
      }
      options.signal.addEventListener('abort', () => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        try { proc.kill('SIGKILL'); } catch (e) {}
        reject(new Error('FFmpeg process aborted by caller'));
      });
    }

    let stderr = '';

    proc.stdout.on('data', data => {
      if (onProgress) {
        const lines = data.toString().split('\n');
        const progressData = {};
        for (const line of lines) {
          const [key, val] = line.split('=');
          if (key && val) {
            progressData[key.trim()] = val.trim();
          }
        }
        if (progressData.out_time_us || progressData.out_time || progressData.progress) {
          onProgress(progressData);
        }
      }
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);

      if (code === 0) {
        resolve();
      } else {
        const errSnippet = stderr.slice(-1000).trim();
        console.error(`[FFmpeg Error Code ${code}] Args: ${args.join(' ')}\nStderr: ${errSnippet}`);
        reject(new Error(`FFmpeg exited with code ${code}: ${errSnippet}`));
      }
    });

    proc.on('error', err => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      console.error('[FFmpeg Spawn Error]', err);
      reject(err);
    });
  });
}

module.exports = {
  probeFile,
  runFFmpeg
};
