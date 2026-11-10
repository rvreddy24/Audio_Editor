import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, X, Check, RotateCcw } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface RecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (file: File) => void;
}

export const RecorderModal: React.FC<RecorderModalProps> = ({
  isOpen,
  onClose,
  onRecordingComplete
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  const cleanupStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startVisualizer = (stream: MediaStream) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser.fftSize = 256;
    source.connect(analyser);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        // Cyber neon gradient
        ctx.fillStyle = `hsl(${140 + (i / bufferLength) * 60}, 90%, 55%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    draw();
  };

  const startRecording = async () => {
    try {
      setRecordedBlob(null);
      setPreviewUrl(null);
      setRecordSeconds(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        cleanupStream();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      startVisualizer(stream);

      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('Microphone access was denied or unavailable: ' + err.message);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleUseRecording = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `mic_recording_${Date.now()}.webm`, {
      type: 'audio/webm'
    });
    onRecordingComplete(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
      <div className="bg-studio-950 border border-rose-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-neon-rose flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5 text-rose-400 font-mono font-bold text-sm uppercase tracking-wide">
            <Mic className="w-5 h-5 text-rose-500 animate-pulse" />
            LIVE MICROPHONE RECORDER
          </div>
          <button
            onClick={() => {
              cleanupStream();
              onClose();
            }}
            className="text-studio-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visualizer Canvas */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#080a0f] h-36 flex items-center justify-center shadow-inner">
          <canvas ref={canvasRef} width={460} height={144} className="w-full h-full block" />
          {!isRecording && !recordedBlob && (
            <div className="absolute text-xs font-mono text-studio-500 uppercase tracking-wider">
              CLICK START RECORDING TO INITIALIZE STREAM
            </div>
          )}
        </div>

        {/* Big LED Timer Display */}
        <div className="text-center">
          <div className="font-mono text-4xl font-black text-rose-400 tracking-widest drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">
            {formatTime(recordSeconds, false)}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-studio-400 mt-1">
            {isRecording ? (isPaused ? 'STREAM PAUSED' : 'RECORDING ACTIVE (44.1 KHZ)') : recordedBlob ? 'CAPTURE COMPLETE' : 'STANDBY'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording && !recordedBlob && (
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-mono font-extrabold px-7 py-3 rounded-xl flex items-center gap-2 shadow-neon-rose text-xs tracking-wider uppercase transition-all"
            >
              <Mic className="w-4 h-4" /> START RECORDING
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={pauseRecording}
                className="bg-studio-900 hover:bg-studio-800 text-studio-200 border border-white/[0.08] px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-mono font-bold transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'RESUME' : 'PAUSE'}
              </button>

              <button
                onClick={stopRecording}
                className="bg-rose-600 hover:bg-rose-500 text-white font-mono font-extrabold px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs shadow-neon-rose tracking-wider uppercase transition-all"
              >
                <Square className="w-4 h-4 fill-current" /> STOP & FINISH
              </button>
            </>
          )}

          {recordedBlob && !isRecording && (
            <div className="flex items-center gap-3 w-full">
              {previewUrl && (
                <audio src={previewUrl} controls className="h-9 flex-1" />
              )}
              <button
                onClick={startRecording}
                className="p-2.5 bg-studio-900 hover:bg-studio-850 text-studio-300 rounded-xl border border-white/[0.06]"
                title="Retake"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleUseRecording}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-neon-volt tracking-wider uppercase transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                LOAD TO STUDIO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
