const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Executes an ffprobe command and returns parsed JSON
 */
function probeFile(filePath) {
  return new Promise((resolve, reject) => {
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

    proc.stdout.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
      }
      try {
        const info = JSON.parse(stdout);
        const format = info.format || {};
        const audioStream = (info.streams || []).find(s => s.codec_type === 'audio');
        const videoStream = (info.streams || []).find(s => s.codec_type === 'video');

        const duration = parseFloat(format.duration || (audioStream && audioStream.duration) || '0');
        const bitRate = parseInt(format.bit_rate || (audioStream && audioStream.bit_rate) || '0', 10);

        resolve({
          duration,
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
            fps: eval(videoStream.r_frame_rate || '0')
          } : null
        });
      } catch (err) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Runs ffmpeg with progress tracking
 */
function runFFmpeg(args, onProgress) {
  return new Promise((resolve, reject) => {
    // Add progress pipe to args
    const fullArgs = [...args, '-progress', 'pipe:1'];
    const proc = spawn('ffmpeg', fullArgs);

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
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', reject);
  });
}

module.exports = {
  probeFile,
  runFFmpeg
};
