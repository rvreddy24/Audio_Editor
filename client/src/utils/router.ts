import { PdfToolKey } from '../components/pdf/types';
import { CalculatorKey } from '../components/calculator/types';
import { ImageToolKey } from '../components/image/types';

export type ViewMode = 'home' | 'pdf' | 'audio' | 'calc' | 'image' | 'video' | 'media';
export type AudioTabKey = 'trim' | 'convert' | 'video' | 'effects' | 'merge' | 'tags';

export interface RouteState {
  viewMode: ViewMode;
  pdfTool: PdfToolKey;
  calcTool: CalculatorKey;
  imageTool?: ImageToolKey;
  audioTab?: AudioTabKey;
}

export const VALID_AUDIO_TABS: AudioTabKey[] = ['trim', 'convert', 'video', 'effects', 'merge', 'tags'];

export const VALID_IMAGE_TOOLS: ImageToolKey[] = [
  'compress-kb',
  'increase-kb',
  'resize-dimensions',
  'passport-photo',
  'signature-resizer',
  'name-date-stamp',
  'photo-signature-merge',
  'dpi-converter',
  'crop-shape',
  'circle-crop',
  'round-corners',
  'image-splitter',
  'rotate-flip',
  'photo-effects',
  'blur-censor',
  'watermark-text',
  'color-picker',
  'metadata-cleaner',
  'image-joiner',
  'format-convert',
];

export const VALID_PDF_TOOLS: PdfToolKey[] = [
  'home',
  'merge',
  'split',
  'compress',
  'pdf-to-word',
  'word-to-pdf',
  'edit-pdf',
  'pdf-to-jpg',
  'jpg-to-pdf',
  'sign',
  'watermark',
  'rotate',
  'html-to-pdf',
  'unlock',
  'protect',
  'organize',
  'pdf-to-pdfa',
  'repair-pdf',
  'page-numbers',
  'scan-pdf',
  'ocr-pdf',
  'compare',
  'redact',
  'crop',
  'pdf-to-excel',
  'pdf-to-markdown',
  'excel-to-pdf',
  'pdf-to-excel-xlsx',
  'pptx-to-pdf',
  'pdf-to-pptx',
  'compress-image',
  'resize-image',
  'convert-image',
  'watermark-image',
];

export const VALID_CALCULATORS: CalculatorKey[] = [
  'home',
  'scientific',
  'mortgage',
  'loan',
  'auto-loan',
  'compound-interest',
  'retirement',
  'salary',
  'bmi',
  'calorie',
  'body-fat',
  'bmr',
  'ideal-weight',
  'pace',
  'percentage',
  'fraction',
  'statistics',
  'random',
  'age',
  'date',
  'hours',
  'tip',
  'unit-converter',
];

/**
 * Parses the current browser location (supports both HTML5 pathname and hash routing)
 */
export function parseRouteFromLocation(): RouteState {
  if (typeof window === 'undefined') {
    return { viewMode: 'home', pdfTool: 'home', calcTool: 'home' };
  }

  let raw = '';
  // Check hash first (e.g. #/video or #video), fallback to pathname
  if (window.location.hash && window.location.hash.length > 1) {
    raw = window.location.hash.replace(/^#\/?/, '');
  } else if (window.location.pathname && window.location.pathname !== '/') {
    raw = window.location.pathname.replace(/^\//, '');
  }

  const clean = raw.split('?')[0].replace(/\/+$/, '').toLowerCase();
  const segments = clean ? clean.split('/') : [];
  const primary = segments[0] || 'home';
  const secondary = segments[1] || '';

  // 1. Home
  if (!primary || primary === 'home') {
    return { viewMode: 'home', pdfTool: 'home', calcTool: 'home' };
  }

  // 2. Video Studio
  if (primary === 'video' || primary === 'video-studio' || primary === 'video-editor') {
    return { viewMode: 'video', pdfTool: 'home', calcTool: 'home' };
  }

  // 3. Audio Studio
  if (primary === 'audio' || primary === 'audio-studio' || primary === 'audio-editor') {
    const audioTab = VALID_AUDIO_TABS.includes(secondary as AudioTabKey)
      ? (secondary as AudioTabKey)
      : undefined;
    return { viewMode: 'audio', pdfTool: 'home', calcTool: 'home', audioTab };
  }

  // 4. Media Studio Hub
  if (primary === 'media' || primary === 'media-studio') {
    return { viewMode: 'media', pdfTool: 'home', calcTool: 'home' };
  }

  // 5. Image Studio
  if (primary === 'image' || primary === 'image-studio') {
    const imageTool = VALID_IMAGE_TOOLS.includes(secondary as ImageToolKey)
      ? (secondary as ImageToolKey)
      : undefined;
    return { viewMode: 'image', pdfTool: 'home', calcTool: 'home', imageTool };
  }

  // 6. PDF Studio
  if (primary === 'pdf' || primary === 'pdf-tools') {
    const pdfTool = VALID_PDF_TOOLS.includes(secondary as PdfToolKey)
      ? (secondary as PdfToolKey)
      : 'home';
    return { viewMode: 'pdf', pdfTool, calcTool: 'home' };
  }

  // 7. Calculator Studio
  if (primary === 'calc' || primary === 'calculator' || primary === 'calculators') {
    const calcTool = VALID_CALCULATORS.includes(secondary as CalculatorKey)
      ? (secondary as CalculatorKey)
      : 'home';
    return { viewMode: 'calc', pdfTool: 'home', calcTool };
  }

  // Fallback to Home
  return { viewMode: 'home', pdfTool: 'home', calcTool: 'home' };
}

/**
 * Builds the canonical URL path for a given route state
 */
export function buildRouteUrl(route: Partial<RouteState>): string {
  const mode = route.viewMode || 'home';

  switch (mode) {
    case 'home':
      return '/';
    case 'video':
      return '/video';
    case 'audio':
      return route.audioTab && route.audioTab !== 'trim' ? `/audio/${route.audioTab}` : '/audio';
    case 'media':
      return '/media';
    case 'image':
      return route.imageTool ? `/image/${route.imageTool}` : '/image';
    case 'pdf':
      return route.pdfTool && route.pdfTool !== 'home' ? `/pdf/${route.pdfTool}` : '/pdf';
    case 'calc':
      return route.calcTool && route.calcTool !== 'home' ? `/calc/${route.calcTool}` : '/calc';
    default:
      return '/';
  }
}

/**
 * Updates browser history (pushState or replaceState) if the URL changed
 */
export function syncRouteToUrl(route: Partial<RouteState>, replace: boolean = false) {
  if (typeof window === 'undefined') return;
  const targetUrl = buildRouteUrl(route);
  if (window.location.pathname !== targetUrl) {
    if (replace) {
      window.history.replaceState({ ...route }, '', targetUrl);
    } else {
      window.history.pushState({ ...route }, '', targetUrl);
    }
  }
}
