export type EditorTool =
  | 'select'
  | 'text'
  | 'sign'
  | 'whiteout'
  | 'redact'
  | 'image'
  | 'shape'
  | 'draw'
  | 'highlight'
  | 'check'
  | 'cross';

export type ShapeType = 'rectangle' | 'circle' | 'check' | 'cross' | 'line';

export type FontFamily = 'Helvetica' | 'HelveticaBold' | 'Times' | 'Courier';

export interface EditorItem {
  id: string;
  pageIndex: number;
  type: 'text' | 'signature' | 'image' | 'whiteout' | 'redact' | 'shape';
  x: number; // in PDF points (relative to top-left of page)
  y: number; // in PDF points (relative to top-left of page)
  width: number; // in PDF points
  height: number; // in PDF points
  // Text specific
  text?: string;
  fontSize?: number; // e.g. 14
  fontFamily?: FontFamily;
  color?: string; // hex #000000
  isBold?: boolean;
  isItalic?: boolean;
  // Signature / Image specific
  imageDataUrl?: string;
  // Shape specific
  shapeType?: ShapeType;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface DrawingStroke {
  id: string;
  pageIndex: number;
  points: { x: number; y: number }[]; // in PDF points
  color: string;
  lineWidth: number;
  isHighlighter?: boolean;
}

export interface SavedSignature {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: number;
}
