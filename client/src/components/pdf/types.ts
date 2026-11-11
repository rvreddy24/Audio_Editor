export type PdfToolKey =
  | 'home'
  | 'merge'
  | 'split'
  | 'compress'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'edit-pdf'
  | 'pdf-to-jpg'
  | 'jpg-to-pdf'
  | 'sign'
  | 'watermark'
  | 'rotate'
  | 'html-to-pdf'
  | 'unlock'
  | 'protect'
  | 'organize'
  | 'pdf-to-pdfa'
  | 'repair-pdf'
  | 'page-numbers'
  | 'scan-pdf'
  | 'ocr-pdf'
  | 'compare'
  | 'redact'
  | 'crop'
  | 'pdf-to-excel'
  | 'pdf-to-markdown'
  | 'excel-to-pdf'
  | 'pdf-to-excel-xlsx'
  | 'pptx-to-pdf'
  | 'pdf-to-pptx'
  | 'compress-image'
  | 'resize-image'
  | 'convert-image'
  | 'watermark-image';

export interface ToolMeta {
  key: PdfToolKey;
  title: string;
  shortDesc: string;
  category: 'organize' | 'optimize' | 'convert' | 'security' | 'edit' | 'office' | 'image';
  badgeColor: string;
  iconName: string;
  popular?: boolean;
}

export const PDF_TOOLS: ToolMeta[] = [
  // 1. Organize
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
    key: 'organize',
    title: 'Organize PDF',
    shortDesc: 'Sort, add, delete, and reorder PDF pages. Drag and drop the page thumbnails.',
    category: 'organize',
    badgeColor: 'bg-purple-600',
    iconName: 'LayoutGrid',
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

  // 2. Optimize
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
    key: 'repair-pdf',
    title: 'Repair PDF',
    shortDesc: 'Repair damaged or corrupted PDF files and recover data from malformed syntax.',
    category: 'optimize',
    badgeColor: 'bg-orange-500',
    iconName: 'Wrench',
  },
  {
    key: 'crop',
    title: 'Crop PDF',
    shortDesc: 'Trim page margins and crop document borders to customize page dimensions.',
    category: 'optimize',
    badgeColor: 'bg-lime-600',
    iconName: 'Crop',
  },

  // 3. Convert to PDF
  {
    key: 'jpg-to-pdf',
    title: 'JPG to PDF',
    shortDesc: 'Convert JPG, PNG, and images to PDF. Adjust orientation and margins in seconds.',
    category: 'convert',
    badgeColor: 'bg-sky-500',
    iconName: 'FileImage',
    popular: true,
  },
  {
    key: 'word-to-pdf',
    title: 'Word to PDF',
    shortDesc: 'Make DOC and DOCX files easy to read by converting them to clean PDF documents.',
    category: 'convert',
    badgeColor: 'bg-blue-600',
    iconName: 'FileType',
    popular: true,
  },
  {
    key: 'html-to-pdf',
    title: 'HTML to PDF',
    shortDesc: 'Convert web HTML snippets and online pages into printable PDF documents.',
    category: 'convert',
    badgeColor: 'bg-teal-600',
    iconName: 'Globe',
  },
  {
    key: 'scan-pdf',
    title: 'Scan to PDF',
    shortDesc: 'Capture physical paper documents using your webcam/camera and compile into PDF.',
    category: 'convert',
    badgeColor: 'bg-cyan-600',
    iconName: 'Camera',
  },

  // 4. Convert from PDF
  {
    key: 'excel-to-pdf',
    title: 'Excel to PDF',
    shortDesc: 'Convert Excel spreadsheets (.xlsx, .xls, .csv) into clean, printable PDF tables.',
    category: 'office',
    badgeColor: 'bg-emerald-600',
    iconName: 'Sheet',
    popular: true,
  },
  {
    key: 'pdf-to-excel-xlsx',
    title: 'PDF to Excel (.xlsx)',
    shortDesc: 'Extract tables and data from your PDF straight into an editable Microsoft Excel (.xlsx) file.',
    category: 'office',
    badgeColor: 'bg-emerald-600',
    iconName: 'Sheet',
    popular: true,
  },
  {
    key: 'pptx-to-pdf',
    title: 'PowerPoint to PDF',
    shortDesc: 'Make PPT and PPTX slideshows easy to view by converting them to clean PDF slide decks.',
    category: 'office',
    badgeColor: 'bg-orange-600',
    iconName: 'Presentation',
    popular: true,
  },
  {
    key: 'pdf-to-pptx',
    title: 'PDF to PowerPoint (.pptx)',
    shortDesc: 'Convert your PDF pages into presentation slides in Microsoft PowerPoint (.pptx) format.',
    category: 'office',
    badgeColor: 'bg-orange-500',
    iconName: 'Presentation',
    popular: true,
  },
  {
    key: 'compress-image',
    title: 'Compress Image',
    shortDesc: 'Compress JPG, PNG, and WebP images with the best quality-to-size ratio.',
    category: 'image',
    badgeColor: 'bg-amber-500',
    iconName: 'ImageIcon',
    popular: true,
  },
  {
    key: 'resize-image',
    title: 'Resize Image',
    shortDesc: 'Resize JPG, PNG, and WebP images by defining exact pixel dimensions or percentage scaling.',
    category: 'image',
    badgeColor: 'bg-blue-500',
    iconName: 'Scaling',
  },
  {
    key: 'convert-image',
    title: 'Convert Image Format',
    shortDesc: 'Convert images between JPG, PNG, and WebP with zero quality degradation.',
    category: 'image',
    badgeColor: 'bg-sky-600',
    iconName: 'RefreshCw',
  },
  {
    key: 'watermark-image',
    title: 'Watermark Image',
    shortDesc: 'Stamp text watermarks, copyright notices, or branding over your photos in seconds.',
    category: 'image',
    badgeColor: 'bg-rose-500',
    iconName: 'Stamp',
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
    key: 'pdf-to-word',
    title: 'PDF to Word',
    shortDesc: 'Easily convert your PDF files into editable DOCX Word documents.',
    category: 'convert',
    badgeColor: 'bg-blue-500',
    iconName: 'FileText',
    popular: true,
  },
  {
    key: 'pdf-to-excel',
    title: 'PDF to Excel / CSV',
    shortDesc: 'Extract tabular data and spreadsheets from PDF straight into CSV/Excel format.',
    category: 'convert',
    badgeColor: 'bg-emerald-600',
    iconName: 'Sheet',
  },
  {
    key: 'pdf-to-markdown',
    title: 'PDF to Markdown',
    shortDesc: 'Extract clean structured text and Markdown formatting from your PDF files.',
    category: 'convert',
    badgeColor: 'bg-slate-800',
    iconName: 'FileCode',
  },
  {
    key: 'pdf-to-pdfa',
    title: 'PDF to PDF/A',
    shortDesc: 'Transform your PDF into an ISO-standardized archival PDF/A document for long-term storage.',
    category: 'convert',
    badgeColor: 'bg-stone-600',
    iconName: 'Archive',
  },

  // 5. Edit & Security
  {
    key: 'edit-pdf',
    title: 'Edit PDF',
    shortDesc: 'Add text, shapes, comments, highlights, and annotations directly onto your PDF.',
    category: 'edit',
    badgeColor: 'bg-violet-600',
    iconName: 'Pencil',
    popular: true,
  },
  {
    key: 'sign',
    title: 'Sign PDF',
    shortDesc: 'Sign yourself or draw, type, and stamp electronic signatures onto your PDF documents.',
    category: 'security',
    badgeColor: 'bg-teal-600',
    iconName: 'PenTool',
    popular: true,
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
    key: 'redact',
    title: 'Redact PDF',
    shortDesc: 'Permanently black out and sanitize confidential text, personal data, or numbers.',
    category: 'security',
    badgeColor: 'bg-zinc-800',
    iconName: 'ShieldAlert',
  },
  {
    key: 'compare',
    title: 'Compare PDF',
    shortDesc: 'Side-by-side synchronized comparison between two PDF documents to detect differences.',
    category: 'edit',
    badgeColor: 'bg-indigo-500',
    iconName: 'SplitSquareVertical',
  },
  {
    key: 'ocr-pdf',
    title: 'OCR PDF',
    shortDesc: 'Optical Character Recognition to extract text from scanned images and PDFs.',
    category: 'convert',
    badgeColor: 'bg-amber-600',
    iconName: 'ScanText',
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
];
