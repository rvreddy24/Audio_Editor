export type ImageToolKey =
  | 'compress-kb'
  | 'increase-kb'
  | 'resize-dimensions'
  | 'passport-photo'
  | 'signature-resizer'
  | 'name-date-stamp'
  | 'photo-signature-merge'
  | 'dpi-converter'
  | 'crop-shape'
  | 'circle-crop'
  | 'round-corners'
  | 'image-splitter'
  | 'rotate-flip'
  | 'photo-effects'
  | 'blur-censor'
  | 'watermark-text'
  | 'color-picker'
  | 'metadata-cleaner'
  | 'image-joiner'
  | 'format-convert'
  | 'remove-bg'
  | 'png-maker';

export type ImageCategory = 'compress' | 'resize' | 'official' | 'crop' | 'edit' | 'utility';

export interface ImageToolMeta {
  key: ImageToolKey;
  title: string;
  shortDesc: string;
  category: ImageCategory;
  badge?: string;
  icon: string;
}

export const IMAGE_TOOLS: ImageToolMeta[] = [
  // 1. Compression
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

  // 2. Official Forms & Exams
  {
    key: 'passport-photo',
    title: 'Passport Size Photo Maker',
    shortDesc: 'Create official passport photos for India, US, UK, EU with face guide oval, manual adjusters, and printable sheets.',
    category: 'official',
    badge: 'Essential',
    icon: 'UserCheck',
  },
  {
    key: 'signature-resizer',
    title: 'Signature Resizer & Cleaner',
    shortDesc: 'Crop digital signatures, clean grey paper shadows, and compress strictly under 10KB–20KB for recruitment forms.',
    category: 'official',
    badge: 'Fast',
    icon: 'PenTool',
  },
  {
    key: 'name-date-stamp',
    title: 'Name & Date on Photo (DoP)',
    shortDesc: 'Add candidate Name and Date of Photograph stamp at the bottom, mandatory for SSC, UPSC, and NEET.',
    category: 'official',
    badge: 'Govt Exams',
    icon: 'Calendar',
  },
  {
    key: 'photo-signature-merge',
    title: 'Merge Photo & Signature',
    shortDesc: 'Combine passport photograph and signature into one official candidate card with candidate name under 50KB.',
    category: 'official',
    badge: 'Official',
    icon: 'Contact',
  },

  // 3. Resize & Dimensions
  {
    key: 'resize-dimensions',
    title: 'Resize by Dimensions & DPI',
    shortDesc: 'Resize photos to exact pixels, centimeters, millimeters, or inches with custom DPI (200, 300 DPI).',
    category: 'resize',
    badge: 'Precision',
    icon: 'Scaling',
  },
  {
    key: 'dpi-converter',
    title: 'Convert Image DPI',
    shortDesc: 'Change image resolution to 200, 300, or 600 DPI with embedded JFIF APP0 headers for printing.',
    category: 'resize',
    icon: 'Printer',
  },
  {
    key: 'image-splitter',
    title: 'Image Splitter & Grid Maker',
    shortDesc: 'Split images into Instagram grids (3×1, 3×2, 3×3) or vertical/horizontal slices and download as ZIP.',
    category: 'resize',
    badge: 'Social Grid',
    icon: 'Grid',
  },

  // 4. Crop & Shapes
  {
    key: 'crop-shape',
    title: 'Crop Image & Aspect Ratio',
    shortDesc: 'Crop unwanted edges with standard aspect ratios (1:1 Square, 4:5 Portrait, 16:9 Landscape, 9:16 Story).',
    category: 'crop',
    icon: 'Crop',
  },
  {
    key: 'circle-crop',
    title: 'Circle Crop / Avatar Maker',
    shortDesc: 'Crop pictures into perfect circular profile photos with transparent background or colored borders.',
    category: 'crop',
    badge: 'Profile DP',
    icon: 'Circle',
  },
  {
    key: 'round-corners',
    title: 'Round Image Corners',
    shortDesc: 'Add smooth rounded corners (border radius) to pictures for modern web and card designs.',
    category: 'crop',
    icon: 'Square',
  },

  // 5. Creative & Filters
  {
    key: 'photo-effects',
    title: 'Photo Effects & Filters',
    shortDesc: 'Enhance photos with Grayscale, Black & White, Sepia, Invert, Brightness, Contrast, and Polaroid borders.',
    category: 'edit',
    icon: 'Sliders',
  },
  {
    key: 'blur-censor',
    title: 'Blur & Censor Private Info',
    shortDesc: 'Conceal faces, phone numbers, addresses, and sensitive document details with blur and pixelate censor bars.',
    category: 'edit',
    badge: 'Privacy',
    icon: 'ShieldAlert',
  },
  {
    key: 'watermark-text',
    title: 'Add Watermark & Text',
    shortDesc: 'Stamp copyright notices, logos, or repeated diagonal tiled watermarks to protect your photos.',
    category: 'edit',
    icon: 'Type',
  },
  {
    key: 'rotate-flip',
    title: 'Rotate & Flip Image',
    shortDesc: 'Rotate 90°, 180°, flip horizontally (mirror), flip vertically, or fine-tune angles to straighten tilted photos.',
    category: 'edit',
    icon: 'RotateCw',
  },
  {
    key: 'image-joiner',
    title: 'Join & Merge Multiple Images',
    shortDesc: 'Merge multiple images side-by-side horizontally or stacked vertically with custom gaps and background colors.',
    category: 'edit',
    icon: 'Combine',
  },
  {
    key: 'remove-bg',
    title: 'Remove Background from Image',
    shortDesc: 'Automatically isolate subjects, erase or restore backgrounds with magic wand & brushes, and replace with transparent or solid colors.',
    category: 'edit',
    badge: 'Magic Cutout',
    icon: 'Eraser',
  },

  // 6. Utility & Conversions
  {
    key: 'png-maker',
    title: 'Transparent PNG Maker',
    shortDesc: 'Convert logos, signatures, and photos to transparent PNGs by removing white, black, or custom keyed backgrounds with edge feathering.',
    category: 'utility',
    badge: 'Popular',
    icon: 'Sparkles',
  },
  {
    key: 'format-convert',
    title: 'Image Format Converter',
    shortDesc: 'Convert between JPG, PNG, and WebP instantly inside your browser without uploading to any server.',
    category: 'utility',
    icon: 'RefreshCw',
  },
  {
    key: 'color-picker',
    title: 'Image Color Picker (Eyedropper)',
    shortDesc: 'Inspect and extract exact HEX, RGB, and HSL color codes from any pixel with interactive magnifier loupe.',
    category: 'utility',
    badge: 'Eyedropper',
    icon: 'Pipette',
  },
  {
    key: 'metadata-cleaner',
    title: 'EXIF Metadata Viewer & Stripper',
    shortDesc: 'Inspect camera, location, and date metadata and strip all EXIF tags in one click for 100% photo privacy.',
    category: 'utility',
    icon: 'FileSearch',
  },
];
