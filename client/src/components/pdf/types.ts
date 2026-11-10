export type PdfToolKey =
  | 'home'
  | 'merge'
  | 'split'
  | 'compress'
  | 'organize'
  | 'rotate'
  | 'pdf-to-jpg'
  | 'jpg-to-pdf'
  | 'watermark'
  | 'page-numbers'
  | 'protect'
  | 'unlock'
  | 'sign';

export interface ToolMeta {
  key: PdfToolKey | 'audio';
  title: string;
  shortDesc: string;
  category: 'organize' | 'optimize' | 'convert' | 'security' | 'audio';
  badgeColor: string;
  iconName: string;
  popular?: boolean;
}

export const PDF_TOOLS: ToolMeta[] = [
  {
    key: 'merge',
    title: 'Merge PDF',
    shortDesc: 'Combine PDFs in the order you want with the easiest PDF merger available.',
    category: 'organize',
    badgeColor: 'bg-red-500',
    iconName: 'Copy',
    popular: true,
  },
  {
    key: 'split',
    title: 'Split PDF',
    shortDesc: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    category: 'organize',
    badgeColor: 'bg-amber-500',
    iconName: 'Scissors',
    popular: true,
  },
  {
    key: 'compress',
    title: 'Compress PDF',
    shortDesc: 'Reduce file size while optimizing for maximal PDF quality.',
    category: 'optimize',
    badgeColor: 'bg-emerald-500',
    iconName: 'Minimize2',
    popular: true,
  },
  {
    key: 'organize',
    title: 'Organize PDF',
    shortDesc: 'Sort, add, delete, and reorder PDF pages. Drag and drop the page thumbnails.',
    category: 'organize',
    badgeColor: 'bg-purple-600',
    iconName: 'LayoutGrid',
    popular: true,
  },
  {
    key: 'pdf-to-jpg',
    title: 'PDF to JPG',
    shortDesc: 'Extract all images contained in a PDF or convert each page into a JPG image.',
    category: 'convert',
    badgeColor: 'bg-yellow-500',
    iconName: 'Image',
    popular: true,
  },
  {
    key: 'jpg-to-pdf',
    title: 'JPG to PDF',
    shortDesc: 'Convert your JPG/PNG images to PDF. Adjust orientation and margins in seconds.',
    category: 'convert',
    badgeColor: 'bg-sky-500',
    iconName: 'FileImage',
    popular: true,
  },
  {
    key: 'rotate',
    title: 'Rotate PDF',
    shortDesc: 'Rotate your PDFs the way you need them. Rotate multiple PDFs or pages at once!',
    category: 'organize',
    badgeColor: 'bg-indigo-600',
    iconName: 'RotateCw',
  },
  {
    key: 'watermark',
    title: 'Watermark',
    shortDesc: 'Stamp an image or text over your PDF in seconds. Choose typography, transparency and position.',
    category: 'security',
    badgeColor: 'bg-rose-500',
    iconName: 'Stamp',
  },
  {
    key: 'page-numbers',
    title: 'Page numbers',
    shortDesc: 'Add page numbers into PDFs with ease. Choose positions, dimensions, typography.',
    category: 'organize',
    badgeColor: 'bg-blue-600',
    iconName: 'Hash',
  },
  {
    key: 'protect',
    title: 'Protect PDF',
    shortDesc: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
    category: 'security',
    badgeColor: 'bg-slate-700',
    iconName: 'Lock',
  },
  {
    key: 'unlock',
    title: 'Unlock PDF',
    shortDesc: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.',
    category: 'security',
    badgeColor: 'bg-pink-600',
    iconName: 'Unlock',
  },
  {
    key: 'sign',
    title: 'Sign PDF',
    shortDesc: 'Sign yourself or draw, type, and upload electronic signatures onto your PDF documents.',
    category: 'security',
    badgeColor: 'bg-teal-600',
    iconName: 'PenTool',
  },
  {
    key: 'audio',
    title: 'Audio Studio',
    shortDesc: 'Full-featured audio editing workstation: convert, trim, compress, extract audio, and DSP effects.',
    category: 'audio',
    badgeColor: 'bg-violet-600',
    iconName: 'Music',
    popular: true,
  },
];
