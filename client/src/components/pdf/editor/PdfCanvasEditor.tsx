import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MousePointer,
  Type,
  PenTool,
  Eraser,
  Square,
  Circle,
  CheckSquare,
  XSquare,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Download,
  CheckCircle2,
  Undo,
  Plus,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Move,
  Copy,
  Sparkles,
  Maximize2,
  FileText,
  Highlighter,
  X,
} from 'lucide-react';
import { PdfFileInfo, parsePdfFile, downloadBytes, getBufferFromFile } from '../../../utils/pdfOperations';
import { getPdfDocument } from '../../../utils/pdfRenderer';
import { formatFileSize } from '../../../utils/formatters';
import { EditorItem, DrawingStroke, EditorTool, SavedSignature, FontFamily, ShapeType } from './types';
import { SignatureModal } from './SignatureModal';
import { burnEditsIntoPdf } from './pdfBurner';

interface PdfCanvasEditorProps {
  initialFile?: PdfFileInfo | null;
  mode?: 'edit' | 'sign' | 'redact';
  onBack: () => void;
}

interface PageMeta {
  pageNum: number;
  widthPts: number;
  heightPts: number;
}

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Green', hex: '#4ade80' },
  { name: 'Cyan', hex: '#38bdf8' },
  { name: 'Pink', hex: '#f472b6' },
];

const PEN_COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'Blue', hex: '#1d4ed8' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
];

export const PdfCanvasEditor: React.FC<PdfCanvasEditorProps> = ({
  initialFile = null,
  mode = 'edit',
  onBack,
}) => {
  // Document state
  const [file, setFile] = useState<PdfFileInfo | null>(initialFile);
  const [pagesMeta, setPagesMeta] = useState<PageMeta[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.25);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Active Tool state: default to 'select' so clicking/moving does not accidentally stamp text
  const [activeTool, setActiveTool] = useState<EditorTool>(
    mode === 'sign' ? 'sign' : mode === 'redact' ? 'redact' : 'select'
  );

  // Placed items & freehand drawings
  const [items, setItems] = useState<EditorItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [history, setHistory] = useState<{ items: EditorItem[]; strokes: DrawingStroke[] }[]>([]);

  // Page level modifications
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});

  // Style attributes
  const [penColor, setPenColor] = useState<string>('#111827');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [highlighterColor, setHighlighterColor] = useState<string>('#facc15');

  // Signatures
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [activeSignatureToStamp, setActiveSignatureToStamp] = useState<SavedSignature | null>(null);

  // Processing & Success
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Canvas refs per page
  const pageCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const drawingCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const currentStroke = useRef<DrawingStroke | null>(null);

  // Dragging & Resizing item state
  const draggingItem = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialItemX: number;
    initialItemY: number;
    hasMoved: boolean;
  } | null>(null);

  const resizingItem = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  const wasDraggingOrResizing = useRef(false);

  // --- 1. LOAD PDF PAGES & METADATA ---
  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    setIsLoadingPdf(true);

    const loadPages = async () => {
      try {
        const buffer = await getBufferFromFile(file);
        const pdf = await getPdfDocument(buffer);

        const metas: PageMeta[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          metas.push({
            pageNum: i,
            widthPts: viewport.width,
            heightPts: viewport.height,
          });
        }

        if (isMounted) {
          setPagesMeta(metas);
          setActivePageIndex(0);
        }
      } catch (err) {
        console.error('Failed to load PDF pages:', err);
      } finally {
        if (isMounted) setIsLoadingPdf(false);
      }
    };

    loadPages();
    return () => {
      isMounted = false;
    };
  }, [file]);

  // --- 2. RENDER PDF PAGES ONTO HTML5 CANVASES ---
  const renderPagesToCanvas = useCallback(async () => {
    if (!file || pagesMeta.length === 0) return;

    try {
      const buffer = await getBufferFromFile(file);
      const pdf = await getPdfDocument(buffer);

      for (let i = 0; i < pagesMeta.length; i++) {
        const canvas = pageCanvasRefs.current[i];
        if (!canvas) continue;

        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: zoom });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        } as any).promise;
      }
    } catch (err) {
      console.warn('Canvas render error:', err);
    }
  }, [file, pagesMeta, zoom]);

  useEffect(() => {
    renderPagesToCanvas();
  }, [renderPagesToCanvas]);

  // Push history snapshot before modifications
  const recordHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-15), { items: [...items], strokes: [...strokes] }]);
  }, [items, strokes]);

  // Delete an item cleanly
  const handleDeleteItem = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    recordHistory();
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedItemId(null);
  }, [recordHistory]);

  // --- 3. KEYBOARD SHORTCUTS (DELETE / BACKSPACE) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId) {
          e.preventDefault();
          handleDeleteItem(selectedItemId);
        }
      } else if (e.key === 'Escape') {
        setSelectedItemId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, handleDeleteItem]);

  // Repaint freehand drawing & highlighter strokes whenever strokes, zoom, or pages change
  useEffect(() => {
    pagesMeta.forEach((_meta, pIdx) => {
      const canvas = drawingCanvasRefs.current[pIdx];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pageStrokes = strokes.filter((s) => s.pageIndex === pIdx);
      for (const stroke of pageStrokes) {
        if (stroke.points.length < 2) continue;
        ctx.save();
        ctx.scale(zoom, zoom);
        if (stroke.isHighlighter) {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.lineWidth;
          ctx.lineCap = 'square';
        } else {
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    });
  }, [strokes, zoom, pagesMeta]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setItems(last.items);
    setStrokes(last.strokes);
    setHistory((prev) => prev.slice(0, -1));
  };

  // --- 4. PAGE INTERACTION (CLICK TO ADD ITEMS) ---
  const handlePageClick = (pageIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    // If just finished dragging or resizing, do NOT stamp anything!
    if (wasDraggingOrResizing.current || draggingItem.current || resizingItem.current) {
      return;
    }

    // In Select mode, clicking blank canvas deselects active item
    if (activeTool === 'select') {
      setSelectedItemId(null);
      return;
    }

    const overlay = e.currentTarget;
    const rect = overlay.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    recordHistory();

    // 1. Text Tool
    if (activeTool === 'text') {
      const newItem: EditorItem = {
        id: `txt-${Date.now()}`,
        pageIndex,
        type: 'text',
        x: Math.max(10, clickX - 10),
        y: Math.max(10, clickY - 12),
        width: 180,
        height: 32,
        text: 'Type text here',
        fontSize: 14,
        fontFamily: 'Helvetica',
        color: '#111827',
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select'); // Switch to select so user can drag/type without accidental stamps
    }

    // 2. Whiteout Tool (Solid White Box to cover/erase text)
    else if (activeTool === 'whiteout') {
      const newItem: EditorItem = {
        id: `wht-${Date.now()}`,
        pageIndex,
        type: 'whiteout',
        x: Math.max(10, clickX - 40),
        y: Math.max(10, clickY - 10),
        width: 140,
        height: 24,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
    }

    // 3. Redact Tool (Solid Black Box)
    else if (activeTool === 'redact') {
      const newItem: EditorItem = {
        id: `red-${Date.now()}`,
        pageIndex,
        type: 'redact',
        x: Math.max(10, clickX - 40),
        y: Math.max(10, clickY - 10),
        width: 140,
        height: 24,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
    }

    // 4. Stamping Signature
    else if (activeTool === 'sign') {
      if (activeSignatureToStamp) {
        const newItem: EditorItem = {
          id: `sig-${Date.now()}`,
          pageIndex,
          type: 'signature',
          x: Math.max(10, clickX - 75),
          y: Math.max(10, clickY - 25),
          width: 150,
          height: 50,
          imageDataUrl: activeSignatureToStamp.dataUrl,
        };
        setItems((prev) => [...prev, newItem]);
        setSelectedItemId(newItem.id);
        setActiveTool('select');
      } else {
        setIsSigModalOpen(true);
      }
    }

    // 5. Shapes (Rectangle / Circle)
    else if (activeTool === 'shape') {
      const newItem: EditorItem = {
        id: `shp-${Date.now()}`,
        pageIndex,
        type: 'shape',
        shapeType: 'rectangle',
        x: Math.max(10, clickX - 50),
        y: Math.max(10, clickY - 30),
        width: 120,
        height: 60,
        strokeColor: '#dc2626',
        strokeWidth: 2,
        fillColor: undefined,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
    }

    // 6. Checkmark (✓)
    else if (activeTool === 'check') {
      const newItem: EditorItem = {
        id: `chk-${Date.now()}`,
        pageIndex,
        type: 'shape',
        shapeType: 'check',
        x: Math.max(10, clickX - 12),
        y: Math.max(10, clickY - 12),
        width: 24,
        height: 24,
        strokeColor: '#16a34a',
        strokeWidth: 2.5,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
    }

    // 7. Cross (✗)
    else if (activeTool === 'cross') {
      const newItem: EditorItem = {
        id: `crs-${Date.now()}`,
        pageIndex,
        type: 'shape',
        shapeType: 'cross',
        x: Math.max(10, clickX - 10),
        y: Math.max(10, clickY - 10),
        width: 20,
        height: 20,
        strokeColor: '#dc2626',
        strokeWidth: 2.5,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
    }
  };

  // --- 5. ITEM DRAG & RESIZE HANDLERS ---
  const handleItemMouseDown = (item: EditorItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItemId(item.id);

    draggingItem.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialItemX: item.x,
      initialItemY: item.y,
      hasMoved: false,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentDrag = draggingItem.current;
      if (!currentDrag) return;
      const dx = (moveEvent.clientX - currentDrag.startX) / zoom;
      const dy = (moveEvent.clientY - currentDrag.startY) / zoom;

      if (Math.hypot(dx, dy) > 2) {
        currentDrag.hasMoved = true;
        wasDraggingOrResizing.current = true;
      }

      moveEvent.preventDefault();

      const newX = Math.max(0, currentDrag.initialItemX + dx);
      const newY = Math.max(0, currentDrag.initialItemY + dy);
      const dragId = currentDrag.id;

      setItems((prev) =>
        prev.map((it) =>
          it.id === dragId
            ? {
                ...it,
                x: newX,
                y: newY,
              }
            : it
        )
      );
    };

    const handleMouseUp = () => {
      const didMove = draggingItem.current?.hasMoved;
      draggingItem.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (didMove) {
        setTimeout(() => {
          wasDraggingOrResizing.current = false;
        }, 150);
      } else {
        wasDraggingOrResizing.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (item: EditorItem, e: React.MouseEvent) => {
    e.stopPropagation();
    resizingItem.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: item.width,
      initialHeight: item.height,
    };
    wasDraggingOrResizing.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentResize = resizingItem.current;
      if (!currentResize) return;
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - currentResize.startX) / zoom;
      const dy = (moveEvent.clientY - currentResize.startY) / zoom;

      const newW = Math.max(20, currentResize.initialWidth + dx);
      const newH = Math.max(16, currentResize.initialHeight + dy);
      const resizeId = currentResize.id;

      setItems((prev) =>
        prev.map((it) =>
          it.id === resizeId
            ? {
                ...it,
                width: newW,
                height: newH,
              }
            : it
        )
      );
    };

    const handleMouseUp = () => {
      resizingItem.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setTimeout(() => {
        wasDraggingOrResizing.current = false;
      }, 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // --- 6. FREEHAND DRAWING & HIGHLIGHTING HANDLERS ---
  const handleDrawingMouseDown = (pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw' && activeTool !== 'highlight') return;
    const canvas = drawingCanvasRefs.current[pageIndex];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const isHighlighter = activeTool === 'highlight';
    const stroke: DrawingStroke = {
      id: `str-${Date.now()}`,
      pageIndex,
      points: [{ x, y }],
      color: isHighlighter ? highlighterColor : penColor,
      lineWidth: isHighlighter ? 18 : penWidth,
      isHighlighter,
    };

    currentStroke.current = stroke;
  };

  const handleDrawingMouseMove = (pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentStroke.current || currentStroke.current.pageIndex !== pageIndex) return;
    const canvas = drawingCanvasRefs.current[pageIndex];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    currentStroke.current.points.push({ x, y });

    // Live draw on overlay canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(zoom, zoom);
    if (currentStroke.current.isHighlighter) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = currentStroke.current.color;
      ctx.lineWidth = currentStroke.current.lineWidth;
      ctx.lineCap = 'square';
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = currentStroke.current.color;
      ctx.lineWidth = currentStroke.current.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    const pts = currentStroke.current.points;
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handleDrawingMouseUp = (pageIndex: number) => {
    if (currentStroke.current && currentStroke.current.pageIndex === pageIndex) {
      setStrokes((prev) => [...prev, currentStroke.current!]);
      currentStroke.current = null;
    }
  };

  // --- 7. IMAGE INSERTION ---
  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngDataUrl = canvas.toDataURL('image/png');
          const newItem: EditorItem = {
            id: `img-${Date.now()}`,
            pageIndex: activePageIndex,
            type: 'image',
            x: 100,
            y: 100,
            width: Math.min(220, Math.round(canvas.width)),
            height: Math.min(160, Math.round(canvas.height)),
            imageDataUrl: pngDataUrl,
          };
          recordHistory();
          setItems((prev) => [...prev, newItem]);
          setSelectedItemId(newItem.id);
          setActiveTool('select');
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(imgFile);
    e.target.value = '';
  };

  // --- 8. APPLY EDITS & DOWNLOAD PDF ---
  const handleApplyChanges = async () => {
    if (!file) return;
    setIsApplying(true);
    try {
      const buffer = await getBufferFromFile(file);
      const outputBytes = await burnEditsIntoPdf(
        buffer,
        items,
        strokes,
        deletedPages,
        pageRotations
      );

      const downloadName = `${mode === 'sign' ? 'signed' : 'edited'}_${file.name}`;
      downloadBytes(outputBytes, downloadName);

      const blob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsSuccess(true);
    } catch (err: any) {
      alert('Failed to apply changes: ' + (err.message || 'Unknown error'));
    } finally {
      setIsApplying(false);
    }
  };

  // Duplicate an item cleanly
  const handleDuplicateItem = (item: EditorItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    recordHistory();
    const clone: EditorItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      x: item.x + 15,
      y: item.y + 15,
    };
    setItems((prev) => [...prev, clone]);
    setSelectedItemId(clone.id);
  };

  // --- INITIAL FILE DROPZONE VIEW ---
  if (!file) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All PDF Tools</span>
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Document Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'sign' ? 'Sign PDF Document' : mode === 'redact' ? 'Redact & Blackout PDF' : 'Edit PDF Document'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Directly on canvas: type text, whiteout & redact, draw or type signatures, highlight passages, and add shapes. 100% private in your browser.
          </p>
        </div>

        {/* Upload Box */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-red-500 p-10 text-center transition-all shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            Choose a PDF file to edit
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Upload any document, ticket, or application form to edit and sign directly
          </p>

          <div className="flex items-center justify-center">
            <label className="bg-[#e5322d] hover:bg-[#d02824] text-white font-bold px-8 py-3.5 rounded-2xl text-xs shadow-md hover:scale-102 transition-all cursor-pointer">
              <span>Select PDF File</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const parsed = await parsePdfFile(e.target.files[0]);
                    setFile(parsed);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // --- SUCCESS VIEW AFTER DOWNLOADING ---
  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              PDF Successfully {mode === 'sign' ? 'Signed' : 'Edited'}!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your edits, signatures, whiteouts, and highlights are burned into the document.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${mode === 'sign' ? 'signed' : 'edited'}_${file.name}`}
                className="flex-1 bg-[#e5322d] hover:bg-[#d02824] text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Again</span>
              </a>
            )}
            <button
              onClick={() => {
                setIsSuccess(false);
                setDownloadUrl(null);
              }}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
            >
              Continue Editing
            </button>
          </div>

          <button
            onClick={() => {
              setFile(null);
              setItems([]);
              setStrokes([]);
              setIsSuccess(false);
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Edit another file
          </button>
        </div>
      </div>
    );
  }

  const selectedItem = items.find((it) => it.id === selectedItemId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* 1. TOP DOCUMENT EDITING SUBHEADER & TOOLBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
        {/* Top Info Bar */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tools</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {file.name}
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              ({pagesMeta.length} pages • {formatFileSize(file.size)})
            </span>
          </div>

          {/* Zoom, Delete Item & Apply Actions */}
          <div className="flex items-center gap-2.5">
            {/* Delete Selected Item Button in Header */}
            {selectedItem && (
              <button
                type="button"
                onClick={(e) => handleDeleteItem(selectedItem.id, e)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Delete selected item (Delete or Backspace key)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {selectedItem.type}</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-700 px-2 min-w-[42px] text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleUndo}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="Undo last action"
              >
                <Undo className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={handleApplyChanges}
              disabled={isApplying}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm hover:shadow flex items-center gap-2 transition-all hover:scale-102"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <span>Apply Changes</span>
                  <Download className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Tool Selection Strip */}
        <div className="px-4 py-2 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {/* Tool 0: Select / Move / Edit */}
          <button
            onClick={() => setActiveTool('select')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'select'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Select, drag, resize, or delete existing items"
          >
            <MousePointer className="w-4 h-4" />
            <span>Select</span>
          </button>

          {/* Tool 1: Text */}
          <button
            onClick={() => setActiveTool('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Click document to add text"
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>

          {/* Tool 2: Sign */}
          <button
            onClick={() => {
              setActiveTool('sign');
              if (savedSignatures.length === 0) {
                setIsSigModalOpen(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'sign'
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Sign</span>
          </button>

          {/* Tool 3: Whiteout (Erase) */}
          <button
            onClick={() => setActiveTool('whiteout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'whiteout'
                ? 'bg-amber-500 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Erase or cover existing text/numbers with a white block"
          >
            <Eraser className="w-4 h-4" />
            <span>Whiteout</span>
          </button>

          {/* Tool 4: Redact */}
          <button
            onClick={() => setActiveTool('redact')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'redact'
                ? 'bg-slate-950 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Blackout sensitive data"
          >
            <Square className="w-4 h-4 fill-slate-900" />
            <span>Redact</span>
          </button>

          {/* Tool 5: Images */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors">
            <ImageIcon className="w-4 h-4" />
            <span>Images</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInsertImage}
            />
          </label>

          {/* Tool 6: Annotate / Draw */}
          <button
            onClick={() => setActiveTool('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'draw'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Square className="w-3.5 h-3.5 rotate-45" />
            <span>Draw</span>
          </button>

          {/* Tool 7: Highlighter */}
          <button
            onClick={() => setActiveTool('highlight')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'highlight'
                ? 'bg-yellow-500 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Highlighter className="w-4 h-4" />
            <span>Highlight</span>
          </button>

          {/* Tool 8: Shapes */}
          <button
            onClick={() => setActiveTool('shape')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTool === 'shape'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Square className="w-4 h-4" />
            <span>Shapes</span>
          </button>

          {/* Tool 9: Quick Check & Cross */}
          <button
            onClick={() => setActiveTool('check')}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'check' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
            title="Stamp Checkmark (✓)"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('cross')}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'cross' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 hover:bg-red-50'
            }`}
            title="Stamp Crossmark (✗)"
          >
            <XSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Context Bar (Active Tool Options) */}
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            {activeTool === 'select' && (
              <span className="font-semibold text-slate-700">
                🖐️ Click any item to select, drag to reposition, use corner to resize, or hit Delete.
              </span>
            )}

            {activeTool === 'text' && (
              <span className="font-semibold text-blue-700">
                👉 Click anywhere on the document to add new text.
              </span>
            )}

            {activeTool === 'whiteout' && (
              <span className="font-semibold text-amber-700">
                👉 Click anywhere on the document to place a Whiteout box to cover up dates, names, or numbers.
              </span>
            )}

            {activeTool === 'redact' && (
              <span className="font-semibold text-slate-800">
                👉 Click anywhere on the document to place a confidential Blackout redaction block.
              </span>
            )}

            {activeTool === 'sign' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSigModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Signature</span>
                </button>
                {savedSignatures.map((sig) => (
                  <button
                    key={sig.id}
                    onClick={() => setActiveSignatureToStamp(sig)}
                    className={`h-7 px-2.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                      activeSignatureToStamp?.id === sig.id
                        ? 'border-violet-600 bg-violet-50 ring-2 ring-violet-200'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <img src={sig.dataUrl} alt={sig.title} className="h-5 object-contain" />
                    <span className="text-[10px] font-bold text-slate-700 truncate max-w-[80px]">
                      {sig.title}
                    </span>
                  </button>
                ))}
                <span className="text-[11px] text-slate-500">
                  {activeSignatureToStamp ? 'Click document to stamp signature' : 'Create or choose signature to place'}
                </span>
              </div>
            )}

            {activeTool === 'draw' && (
              <div className="flex items-center gap-3">
                <span>Pen Color:</span>
                <div className="flex items-center gap-1.5">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setPenColor(c.hex)}
                      className={`w-5 h-5 rounded-full border ${penColor === c.hex ? 'ring-2 ring-rose-400 scale-110' : ''}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <span>Size:</span>
                {[2, 3.5, 5].map((w) => (
                  <button
                    key={w}
                    onClick={() => setPenWidth(w)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      penWidth === w ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            )}

            {activeTool === 'highlight' && (
              <div className="flex items-center gap-3">
                <span>Highlighter Color:</span>
                <div className="flex items-center gap-1.5">
                  {HIGHLIGHTER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setHighlighterColor(c.hex)}
                      className={`w-5 h-5 rounded-md border ${
                        highlighterColor === c.hex ? 'ring-2 ring-yellow-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">Drag over text to highlight</span>
              </div>
            )}
          </div>

          {/* Quick Page Info */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span>Page {activePageIndex + 1} of {pagesMeta.length}</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN DOCUMENT WORKSPACE & PAGES VIEW */}
      <main className="flex-1 overflow-auto p-6 sm:p-10 flex flex-col items-center gap-8">
        {isLoadingPdf ? (
          <div className="py-24 flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="text-sm font-semibold">Rendering PDF pages...</span>
          </div>
        ) : (
          pagesMeta.map((meta, idx) => {
            const isPageDeleted = deletedPages.includes(idx);
            if (isPageDeleted) return null;

            const pageWidthPx = meta.widthPts * zoom;
            const pageHeightPx = meta.heightPts * zoom;
            const pageItems = items.filter((it) => it.pageIndex === idx);

            return (
              <div
                key={meta.pageNum}
                id={`pdf-page-${idx}`}
                className="relative bg-white shadow-xl rounded-md border border-slate-300 transition-all"
                style={{
                  width: `${pageWidthPx}px`,
                  height: `${pageHeightPx}px`,
                }}
              >
                {/* PDF Native Rendered Background Canvas */}
                <canvas
                  ref={(el) => {
                    pageCanvasRefs.current[idx] = el;
                  }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: `${pageWidthPx}px`, height: `${pageHeightPx}px` }}
                />

                {/* Freehand Annotation Canvas Layer */}
                <canvas
                  ref={(el) => {
                    drawingCanvasRefs.current[idx] = el;
                  }}
                  width={pageWidthPx}
                  height={pageHeightPx}
                  onMouseDown={(e) => handleDrawingMouseDown(idx, e)}
                  onMouseMove={(e) => handleDrawingMouseMove(idx, e)}
                  onMouseUp={() => handleDrawingMouseUp(idx)}
                  className={`absolute inset-0 z-10 ${
                    activeTool === 'draw' || activeTool === 'highlight' ? 'cursor-crosshair' : 'pointer-events-none'
                  }`}
                  style={{ width: `${pageWidthPx}px`, height: `${pageHeightPx}px` }}
                />

                {/* Interactive Placement & Click Overlay Layer */}
                <div
                  onClick={(e) => handlePageClick(idx, e)}
                  className={`absolute inset-0 z-20 ${
                    activeTool !== 'draw' && activeTool !== 'highlight' ? 'cursor-default' : 'pointer-events-none'
                  }`}
                >
                  {/* Render Placed Items */}
                  {pageItems.map((item) => {
                    const isSelected = selectedItemId === item.id;
                    const itemLeftPx = item.x * zoom;
                    const itemTopPx = item.y * zoom;
                    const itemWidthPx = item.width * zoom;
                    const itemHeightPx = item.height * zoom;

                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item.id);
                        }}
                        onMouseDown={(e) => handleItemMouseDown(item, e)}
                        className={`absolute group cursor-move select-none transition-shadow ${
                          isSelected ? 'ring-2 ring-blue-500 shadow-md z-30' : 'hover:ring-1 hover:ring-blue-300 z-20'
                        }`}
                        style={{
                          left: `${itemLeftPx}px`,
                          top: `${itemTopPx}px`,
                          width: `${itemWidthPx}px`,
                          height: `${itemHeightPx}px`,
                        }}
                      >
                        {/* 1. Text Item */}
                        {item.type === 'text' && (
                          <div className="w-full h-full relative flex items-center bg-white/30 rounded border border-blue-200">
                            <div
                              className="w-5 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0"
                              title="Drag to move"
                            >
                              <Move className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="text"
                              value={item.text}
                              onMouseDown={(e) => e.stopPropagation()} // Allow clicking inside to type
                              onChange={(e) => {
                                const newTxt = e.target.value;
                                setItems((prev) =>
                                  prev.map((it) => (it.id === item.id ? { ...it, text: newTxt } : it))
                                );
                              }}
                              className="flex-1 h-full px-1 bg-transparent border-none outline-none font-sans cursor-text"
                              style={{
                                fontSize: `${(item.fontSize || 14) * zoom}px`,
                                color: item.color || '#111827',
                                fontWeight: item.isBold ? 'bold' : 'normal',
                                fontStyle: item.isItalic ? 'italic' : 'normal',
                              }}
                            />
                          </div>
                        )}

                        {/* 2. Whiteout Item (Solid 100% White Box) */}
                        {item.type === 'whiteout' && (
                          <div className="w-full h-full bg-white border border-dashed border-amber-400 group-hover:border-amber-600 flex items-center justify-between px-1.5 cursor-grab active:cursor-grabbing shadow-2xs">
                            <Move className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100" />
                            <span className="text-[10px] font-bold text-amber-600/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              Whiteout
                            </span>
                            <span />
                          </div>
                        )}

                        {/* 3. Redact Item (Solid Black Box) */}
                        {item.type === 'redact' && (
                          <div className="w-full h-full bg-black flex items-center justify-between px-1.5 cursor-grab active:cursor-grabbing">
                            <Move className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                            <span className="text-[10px] font-bold text-slate-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              Redacted
                            </span>
                            <span />
                          </div>
                        )}

                        {/* 4. Signature & Image Items */}
                        {(item.type === 'signature' || item.type === 'image') && item.imageDataUrl && (
                          <div className="w-full h-full p-0.5 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
                            <img
                              src={item.imageDataUrl}
                              alt="stamp"
                              className="w-full h-full object-contain pointer-events-none"
                            />
                          </div>
                        )}

                        {/* 5. Shapes (Rectangle / Circle / Check / Cross) */}
                        {item.type === 'shape' && (
                          <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
                            {item.shapeType === 'rectangle' && (
                              <div
                                className="w-full h-full"
                                style={{
                                  border: `${(item.strokeWidth || 2) * zoom}px solid ${item.strokeColor || '#dc2626'}`,
                                  backgroundColor: item.fillColor || 'transparent',
                                }}
                              />
                            )}
                            {item.shapeType === 'circle' && (
                              <div
                                className="w-full h-full rounded-full"
                                style={{
                                  border: `${(item.strokeWidth || 2) * zoom}px solid ${item.strokeColor || '#dc2626'}`,
                                  backgroundColor: item.fillColor || 'transparent',
                                }}
                              />
                            )}
                            {item.shapeType === 'check' && (
                              <CheckSquare
                                className="w-full h-full"
                                style={{ color: item.strokeColor || '#16a34a' }}
                              />
                            )}
                            {item.shapeType === 'cross' && (
                              <XSquare
                                className="w-full h-full"
                                style={{ color: item.strokeColor || '#dc2626' }}
                              />
                            )}
                          </div>
                        )}

                        {/* Floating Action Pill for Selected Item */}
                        {isSelected && (
                          <div
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 bg-slate-900 text-white rounded-xl shadow-xl px-2.5 py-1.5 flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                            style={{
                              top: item.y < 50 ? `${itemHeightPx + 8}px` : '-42px',
                            }}
                          >
                            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-400 border-r border-slate-700 pr-1.5">
                              <Move className="w-3 h-3" />
                              <span>{item.type.toUpperCase()}</span>
                            </div>

                            {/* Font size +/- for text */}
                            {item.type === 'text' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it.id === item.id
                                          ? { ...it, fontSize: Math.max(8, (it.fontSize || 14) - 2) }
                                          : it
                                      )
                                    );
                                  }}
                                  className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-xs font-bold"
                                  title="Decrease font size"
                                >
                                  -
                                </button>
                                <span className="text-[11px] font-bold font-mono px-1">
                                  {item.fontSize || 14}pt
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it.id === item.id
                                          ? { ...it, fontSize: Math.min(48, (it.fontSize || 14) + 2) }
                                          : it
                                      )
                                    );
                                  }}
                                  className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-xs font-bold"
                                  title="Increase font size"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it.id === item.id ? { ...it, isBold: !it.isBold } : it
                                      )
                                    );
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                    item.isBold ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                                  }`}
                                  title="Toggle Bold"
                                >
                                  B
                                </button>
                                <input
                                  type="color"
                                  value={item.color || '#111827'}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it.id === item.id ? { ...it, color: e.target.value } : it
                                      )
                                    );
                                  }}
                                  className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
                                  title="Change text color"
                                />
                                <div className="h-3 w-px bg-slate-700" />
                              </>
                            )}

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={(e) => handleDuplicateItem(item, e)}
                              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 rounded text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete Item (Delete or Backspace)"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}

                        {/* Corner Quick-Delete (X) Button */}
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteItem(item.id, e);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer z-50 transition-transform hover:scale-110 border-2 border-white"
                            title="Delete this item"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}

                        {/* Corner Resize Handle */}
                        {isSelected && (
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(item, e)}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full cursor-se-resize shadow-xs z-30"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Page Number & Bottom Controls */}
                <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
                  <span>Page {meta.pageNum}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setPageRotations((prev) => ({
                          ...prev,
                          [idx]: ((prev[idx] || 0) + 90) % 360,
                        }))
                      }
                      className="hover:text-slate-700 flex items-center gap-1 text-[11px]"
                      title="Rotate page 90 degrees"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotate</span>
                    </button>
                    {pagesMeta.length > 1 && (
                      <button
                        onClick={() => setDeletedPages((prev) => [...prev, idx])}
                        className="hover:text-red-600 flex items-center gap-1 text-[11px]"
                        title="Delete this page"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Signature Creator Modal */}
      <SignatureModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onSaveSignature={(sig) => {
          setSavedSignatures((prev) => [sig, ...prev]);
          setActiveSignatureToStamp(sig);
          setActiveTool('sign');
        }}
      />
    </div>
  );
};
