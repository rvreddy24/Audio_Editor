export type AspectRatioPreset = 'original' | '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type AspectMode = 'crop' | 'fit-blur' | 'fit-pad';

export type VideoFilterType = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'invert';

export type OutputFormat = 'mp4' | 'webm' | 'gif' | 'mov' | 'mkv' | 'mp3' | 'wav';

export type QualityPreset = 'high' | 'medium' | 'low' | 'max_compression';

export type CutMode = 'precise' | 'fast';

export type GifDither = 'bayer' | 'floyd_steinberg' | 'sierra2_4a' | 'none';

export type ResolutionPreset = 'original' | '1080p' | '720p' | '480p' | '360p';

export type WatermarkPosition = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';

export interface VideoFileInfo {
  file: File;
  fileId?: string;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  objectUrl: string;
}

export interface VideoEditOptions {
  // Trim
  trimStart: number;
  trimEnd: number;
  cutMode?: CutMode;

  // Aspect ratio / Crop
  aspectRatio: AspectRatioPreset;
  aspectMode: AspectMode;
  panX: number; // 0 to 100
  panY: number; // 0 to 100
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;

  // Transform
  rotate: 0 | 90 | 180 | 270;
  flip: 'none' | 'horizontal' | 'vertical' | 'both';

  // Speed
  speed: number; // 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0

  // Audio
  volume: number; // 0 to 3.0
  audioMode: 'original' | 'mute' | 'replace' | 'mix';
  backgroundAudioFile?: File;
  backgroundAudioName?: string;
  bgAudioVolume: number; // 0 to 2.0

  // Filters & Adjustments
  filterType: VideoFilterType;
  brightness: number; // -0.5 to 0.5
  contrast: number; // 0.5 to 1.5
  saturation: number; // 0 to 2.0

  // Text Watermark
  watermarkText: string;
  watermarkPosition: WatermarkPosition;

  // Reverse
  reverse: boolean;

  // Output settings
  outputFormat: OutputFormat;
  resolution: ResolutionPreset;
  quality: QualityPreset;
  targetSizeMB?: number;
  gifFps?: number;
  gifWidth?: number;
  gifDither?: GifDither;
}

export const ASPECT_RATIOS: { key: AspectRatioPreset; label: string; desc: string; ratio: number | null }[] = [
  { key: 'original', label: 'Original', desc: 'Keep original framing', ratio: null },
  { key: '16:9', label: '16:9 Landscape', desc: 'YouTube, Desktop, TV', ratio: 16 / 9 },
  { key: '9:16', label: '9:16 Vertical', desc: 'TikTok, Reels, Shorts', ratio: 9 / 16 },
  { key: '1:1', label: '1:1 Square', desc: 'Instagram Feed, Square', ratio: 1 },
  { key: '4:5', label: '4:5 Portrait', desc: 'Instagram Portrait', ratio: 4 / 5 },
  { key: '21:9', label: '21:9 Ultrawide', desc: 'Cinematic CinemaScope', ratio: 21 / 9 },
];

export const SPEED_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0];

export const FILTER_PRESETS: { key: VideoFilterType; label: string; cssFilter: string }[] = [
  { key: 'none', label: 'Normal', cssFilter: 'none' },
  { key: 'grayscale', label: 'B&W', cssFilter: 'grayscale(100%)' },
  { key: 'sepia', label: 'Sepia', cssFilter: 'sepia(80%)' },
  { key: 'vintage', label: 'Warm Vintage', cssFilter: 'sepia(40%) contrast(110%) brightness(95%)' },
  { key: 'invert', label: 'Inverted', cssFilter: 'invert(100%)' },
];
