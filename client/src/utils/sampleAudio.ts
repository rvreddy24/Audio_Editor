// Generates a high quality demo audio track in-memory using Web Audio API

export async function generateSampleAudioFile(): Promise<File> {
  const sampleRate = 44100;
  const duration = 12; // 12 seconds
  const numChannels = 2;
  const numSamples = sampleRate * duration;

  const ctx = new OfflineAudioContext(numChannels, numSamples, sampleRate);

  // Synth Chords progression (Cm - Ab - Eb - Bb)
  const chords = [
    [261.63, 311.13, 392.00], // C minor
    [207.65, 261.63, 311.13], // Ab major
    [155.56, 196.00, 233.08], // Eb major
    [233.08, 293.66, 349.23], // Bb major
  ];

  const chordDuration = duration / chords.length; // 3 seconds each

  chords.forEach((chord, chordIdx) => {
    const startTime = chordIdx * chordDuration;

    chord.forEach((freq) => {
      // Pad Oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      // Low pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, startTime);
      filter.frequency.exponentialRampToValueAtTime(1400, startTime + chordDuration / 2);
      filter.frequency.exponentialRampToValueAtTime(600, startTime + chordDuration);

      // Volume envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.4);
      gain.gain.setValueAtTime(0.12, startTime + chordDuration - 0.4);
      gain.gain.linearRampToValueAtTime(0.001, startTime + chordDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + chordDuration);
    });

    // Bass note
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(chord[0] / 2, startTime);

    bassGain.gain.setValueAtTime(0.18, startTime);
    bassGain.gain.linearRampToValueAtTime(0.05, startTime + chordDuration);

    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(startTime);
    bassOsc.stop(startTime + chordDuration);
  });

  // Rhythm: Kick & Snare beats
  const bpm = 120;
  const beatInterval = 60 / bpm; // 0.5s
  const totalBeats = Math.floor(duration / beatInterval);

  for (let b = 0; b < totalBeats; b++) {
    const beatTime = b * beatInterval;

    if (b % 2 === 0) {
      // Kick drum
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickOsc.frequency.setValueAtTime(140, beatTime);
      kickOsc.frequency.exponentialRampToValueAtTime(40, beatTime + 0.12);

      kickGain.gain.setValueAtTime(0.6, beatTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.25);

      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);

      kickOsc.start(beatTime);
      kickOsc.stop(beatTime + 0.25);
    } else {
      // Snare drum
      const snareOsc = ctx.createOscillator();
      const snareGain = ctx.createGain();

      snareOsc.type = 'triangle';
      snareOsc.frequency.setValueAtTime(220, beatTime);

      snareGain.gain.setValueAtTime(0.3, beatTime);
      snareGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.15);

      snareOsc.connect(snareGain);
      snareGain.connect(ctx.destination);

      snareOsc.start(beatTime);
      snareOsc.stop(beatTime + 0.15);
    }

    // Hi-hat on every 8th note
    const hatOsc = ctx.createOscillator();
    const hatGain = ctx.createGain();
    hatOsc.type = 'square';
    hatOsc.frequency.setValueAtTime(6000 + (b % 4) * 500, beatTime);
    hatGain.gain.setValueAtTime(0.04, beatTime);
    hatGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.04);
    hatOsc.connect(hatGain);
    hatGain.connect(ctx.destination);
    hatOsc.start(beatTime);
    hatOsc.stop(beatTime + 0.05);
  }

  const renderedBuffer = await ctx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);

  return new File([wavBlob], 'Synthwave_Demo_Track.wav', { type: 'audio/wav' });
}

// Convert AudioBuffer to WAV format Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const bufferLength = 44 + result.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + result.length * bytesPerSample, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, result.length * bytesPerSample, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);

  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}
