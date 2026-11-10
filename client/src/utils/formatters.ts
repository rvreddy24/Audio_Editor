export function formatTime(seconds: number, includeMs: boolean = true): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const mStr = String(mins).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  const msStr = String(ms).padStart(2, '0');

  if (includeMs) {
    return `${mStr}:${sStr}.${msStr}`;
  }
  return `${mStr}:${sStr}`;
}

export function formatTimePrecise(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00.000';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function parseTimeToSeconds(str: string): number {
  if (!str) return 0;
  // Handle formats like "01:23.45" or "00:01:23.45" or raw float "83.45"
  const parts = str.trim().split(':');
  if (parts.length === 1) {
    const val = parseFloat(parts[0]);
    return isNaN(val) ? 0 : val;
  }
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]) || 0;
    const mins = parseFloat(parts[1]) || 0;
    const secs = parseFloat(parts[2]) || 0;
    return hrs * 3600 + mins * 60 + secs;
  }
  return 0;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}
