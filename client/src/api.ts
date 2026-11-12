import { LoadedFile, ProcessingResult } from './types';

const API_BASE = '/api';

export async function checkHealth(): Promise<{ status: string; ffmpeg: boolean; version: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend server is not responding');
  return res.json();
}

export function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<LoadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', `${API_BASE}/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            ...data,
            isVideo: data.probe?.hasVideo && !file.type.startsWith('audio/')
          });
        } catch (e: any) {
          reject(new Error(`Failed to parse upload response: ${e.message}`));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

export async function convertAudio(params: {
  fileId: string;
  targetFormat: string;
  bitrate?: string;
  sampleRate?: number | string;
  channels?: number | string;
}): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Conversion failed' }));
    throw new Error(err.error || 'Conversion failed');
  }
  return res.json();
}

export async function trimAudio(params: {
  fileId: string;
  start: number;
  end: number;
  mode?: 'keep' | 'remove';
  fadeIn?: number;
  fadeOut?: number;
  targetFormat?: string;
  bitrate?: string;
}): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Trimming failed' }));
    throw new Error(err.error || 'Trimming failed');
  }
  return res.json();
}

export async function videoToAudio(params: {
  fileId: string;
  targetFormat?: string;
  bitrate?: string;
  sampleRate?: number | string;
  channels?: number | string;
  start?: number;
  end?: number;
}): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/video-to-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
    throw new Error(err.error || 'Extraction failed');
  }
  return res.json();
}

export async function applyEffects(params: {
  fileId: string;
  speed?: number;
  pitch?: number;
  preservePitch?: boolean;
  volume?: number;
  normalize?: 'none' | 'ebu_r128' | 'peak';
  bass?: number;
  treble?: number;
  preset?: string;
  reverse?: boolean;
  panning8D?: boolean;
  vocalRemover?: boolean;
  noiseReduction?: 'none' | 'light' | 'medium' | 'heavy';
  targetFormat?: string;
  bitrate?: string;
}): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Effects processing failed' }));
    throw new Error(err.error || 'Effects processing failed');
  }
  return res.json();
}

export async function adjustVolume(params: {
  fileId: string;
  volume: number;
  targetFormat?: string;
  bitrate?: string;
}): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/volume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Volume adjustment failed' }));
    throw new Error(err.error || 'Volume adjustment failed');
  }
  return res.json();
}

export async function reduceNoise(params: {
  fileId: string;
  strength?: 'light' | 'medium' | 'heavy';
  noiseReductionDb?: number;
  targetFormat?: string;
  bitrate?: string;
}): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/noise-reduction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Noise reduction failed' }));
    throw new Error(err.error || 'Noise reduction failed');
  }
  return res.json();
}

export async function mergeAudio(params: {
  files?: File[];
  fileIds?: string[];
  crossfade?: number;
  targetFormat?: string;
  bitrate?: string;
}): Promise<ProcessingResult> {
  const formData = new FormData();
  if (params.files) {
    for (const f of params.files) {
      formData.append('files', f);
    }
  }
  if (params.fileIds) {
    formData.append('fileIds', JSON.stringify(params.fileIds));
  }
  formData.append('crossfade', (params.crossfade || 0).toString());
  formData.append('targetFormat', params.targetFormat || 'mp3');
  formData.append('bitrate', params.bitrate || '320k');

  const res = await fetch(`${API_BASE}/merge`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Audio merge failed' }));
    throw new Error(err.error || 'Audio merge failed');
  }
  return res.json();
}

export async function updateMetadata(params: {
  fileId: string;
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  comment?: string;
}): Promise<ProcessingResult> {
  const res = await fetch(`${API_BASE}/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Metadata update failed' }));
    throw new Error(err.error || 'Metadata update failed');
  }
  return res.json();
}
