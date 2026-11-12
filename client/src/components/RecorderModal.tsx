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
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch (e) {}
      }
    };
  }, [previewUrl]);

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

  const handleClose = () => {
    cleanupStream();
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    onClose();
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
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = '#4f46e5';
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
    const file = new File([recordedBlob], `recording_${Date.now()}.webm`, {
      type: 'audio/webm'
    });
    onRecordingComplete(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <Mic className="w-4 h-4 text-rose-600" />
            Voice & Microphone Recorder
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visualizer Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-32 flex items-center justify-center">
          <canvas ref={canvasRef} width={460} height={128} className="w-full h-full block" />
          {!isRecording && !recordedBlob && (
            <div className="absolute text-xs text-slate-400 font-medium">
              Click Start Recording to begin
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="font-mono text-3xl font-bold text-slate-900 tracking-wider">
            {formatTime(recordSeconds, false)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">
            {isRecording ? (isPaused ? 'Recording Paused' : 'Recording...') : recordedBlob ? 'Recording Ready' : 'Ready to record'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording && !recordedBlob && (
            <button
              onClick={startRecording}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xs text-xs transition-colors"
            >
              <Mic className="w-4 h-4" /> Start Recording
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={pauseRecording}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={stopRecording}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-5 py-2 rounded-xl flex items-center gap-2 text-xs shadow-xs transition-colors"
              >
                <Square className="w-4 h-4 fill-current" /> Finish Recording
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
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                title="Record Again"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleUseRecording}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs shadow-xs transition-colors"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Load into Studio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
