export type ImageToolKey =
  | 'compress-kb'
  | 'increase-kb'
  | 'resize-dimensions'
  | 'passport-photo'
  | 'signature-resizer'
  | 'name-date-stamp'
  | 'dpi-converter'
  | 'image-joiner'
  | 'format-convert';

export type ImageCategory = 'compress' | 'resize' | 'official' | 'edit';

export interface ImageToolMeta {
  key: ImageToolKey;
  title: string;
  shortDesc: string;
  category: ImageCategory;
  badge?: string;
  icon: string;
}

export const IMAGE_TOOLS: ImageToolMeta[] = [
  {
    key: 'compress-kb',
    title: 'Compress Image to KB / MB',
    shortDesc: 'Target exact file sizes (20KB, 50KB, 100KB, 200KB, or custom) for online government & job portals.',
    category: 'compress',
    badge: 'Popular',
    icon: 'Minimize2',
  },
  {
    key: 'increase-kb',
    title: 'Increase Image Size in KB',
    shortDesc: 'Increase photo or signature file size without losing quality to meet strict minimum portal requirements.',
    category: 'compress',
    badge: 'Utility',
    icon: 'Maximize2',
  },
  {
    key: 'resize-dimensions',
    title: 'Resize by Dimensions & DPI',
    shortDesc: 'Resize photos to exact pixels, centimeters, millimeters, or inches with custom DPI (200, 300 DPI).',
    category: 'resize',
    badge: 'Precision',
    icon: 'Scaling',
  },
  {
    key: 'passport-photo',
    title: 'Passport Size Photo Maker',
    shortDesc: 'Create official passport photos for India, US, UK, EU with background tint and printable A4/4x6 sheets.',
    category: 'official',
    badge: 'Official Forms',
    icon: 'UserCheck',
  },
  {
    key: 'signature-resizer',
    title: 'Signature Resizer & Cleaner',
    shortDesc: 'Crop digital signatures, clean grey paper shadows, and compress under 10KB–20KB for recruitment forms.',
    category: 'official',
    badge: 'Fast',
    icon: 'PenTool',
  },
  {
    key: 'name-date-stamp',
    title: 'Name & Date on Photo (DoP)',
    shortDesc: 'Add candidate Name and Date of Photograph stamp at the bottom, required for SSC, UPSC, and NEET.',
    category: 'official',
    badge: 'Govt Exams',
    icon: 'Calendar',
  },
  {
    key: 'dpi-converter',
    title: 'Convert Image DPI',
    shortDesc: 'Change image resolution to 200, 300, or 600 DPI for high-resolution document and photo uploads.',
    category: 'resize',
    icon: 'Printer',
  },
  {
    key: 'image-joiner',
    title: 'Join & Merge Images',
    shortDesc: 'Merge multiple images side-by-side or stacked vertically (e.g., Photo + Signature combined card).',
    category: 'edit',
    icon: 'Combine',
  },
  {
    key: 'format-convert',
    title: 'Image Format Converter',
    shortDesc: 'Convert between JPG, PNG, and WebP instantly inside your browser without data uploads.',
    category: 'edit',
    icon: 'RefreshCw',
  },
];
