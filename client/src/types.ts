export interface AudioStreamInfo {
  codec: string;
  codecLong?: string;
  sampleRate: number;
  channels: number;
  channelLayout?: string;
  bitRate: number; // in kbps
}

export interface VideoStreamInfo {
  codec: string;
  width: number;
  height: number;
  fps: number;
}

export interface ProbeData {
  duration: number;
  bitRate: number; // in kbps
  formatName: string;
  formatLongName?: string;
  size: number;
  tags?: Record<string, string>;
  hasAudio: boolean;
  hasVideo: boolean;
  audio?: AudioStreamInfo | null;
  video?: VideoStreamInfo | null;
}

export interface LoadedFile {
  fileId: string;
  originalName: string;
  size: number;
  probe: ProbeData;
  streamUrl: string;
  downloadUrl?: string;
  blobUrl?: string;
  isVideo?: boolean;
}

export interface ProcessingResult {
  outputId: string;
  downloadName: string;
  downloadUrl: string;
  streamUrl: string;
  probe: ProbeData;
}
