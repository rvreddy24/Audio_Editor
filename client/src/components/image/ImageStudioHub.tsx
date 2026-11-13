import React, { useState, useEffect } from 'react';
import {
  Minimize2,
  Maximize2,
  Scaling,
  UserCheck,
  PenTool,
  Calendar,
  Printer,
  Combine,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Contact,
  Crop,
  Circle,
  Square,
  Sliders,
  ShieldAlert,
  Type,
  RotateCw,
  Grid,
  Pipette,
  FileSearch,
  Eraser,
} from 'lucide-react';
import { ImageToolKey, ImageCategory, IMAGE_TOOLS, ImageToolMeta } from './types';
import { TargetCompressor } from './TargetCompressor';
import { DimensionResizer } from './DimensionResizer';
import { PassportPhotoMaker } from './PassportPhotoMaker';
import { SignatureResizer } from './SignatureResizer';
import { NameDatePhotoStamp } from './NameDatePhotoStamp';
import { PhotoSignatureMergeWorkspace } from './PhotoSignatureMergeWorkspace';
import { CropShapeWorkspace } from './CropShapeWorkspace';
import { PhotoEffectsWorkspace } from './PhotoEffectsWorkspace';
import { BlurCensorWorkspace } from './BlurCensorWorkspace';
import { RotateFlipWorkspace } from './RotateFlipWorkspace';
import { WatermarkImageStudioWorkspace } from './WatermarkImageStudioWorkspace';
import { ImageSplitterWorkspace } from './ImageSplitterWorkspace';
import { ColorPickerWorkspace } from './ColorPickerWorkspace';
import { MetadataWorkspace } from './MetadataWorkspace';
import { ImageJoinerWorkspace } from './ImageJoinerWorkspace';
import { ConvertImageWorkspace } from '../pdf/workspaces/ConvertImageWorkspace';
import { BackgroundRemoverWorkspace } from './BackgroundRemoverWorkspace';
import { PngMakerWorkspace } from './PngMakerWorkspace';

interface ImageStudioHubProps {
  initialTool?: ImageToolKey;
  onSelectTool?: (tool: ImageToolKey | null) => void;
  onBackToHome?: () => void;
}

export const ImageStudioHub: React.FC<ImageStudioHubProps> = ({
  initialTool,
  onSelectTool,
  onBackToHome,
}) => {
  const [activeTool, setActiveTool] = useState<ImageToolKey | null>(initialTool || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setActiveTool(initialTool || null);
  }, [initialTool]);

  const handleSelectTool = (toolKey: ImageToolKey | null) => {
    setActiveTool(toolKey);
    onSelectTool?.(toolKey);
  };

  const categories = [
    { id: 'all', label: 'All Tools (22)' },
    { id: 'compress', label: 'Compress Size' },
    { id: 'official', label: 'Official Forms & Exams' },
    { id: 'resize', label: 'Resize & DPI' },
    { id: 'crop', label: 'Crop & Shapes' },
    { id: 'edit', label: 'Filters & Edit' },
    { id: 'utility', label: 'Colors & Privacy' },
  ];

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'Minimize2':
        return <Minimize2 className="w-6 h-6 text-emerald-600" />;
      case 'Maximize2':
        return <Maximize2 className="w-6 h-6 text-indigo-600" />;
      case 'Scaling':
        return <Scaling className="w-6 h-6 text-blue-600" />;
      case 'UserCheck':
        return <UserCheck className="w-6 h-6 text-sky-600" />;
      case 'PenTool':
        return <PenTool className="w-6 h-6 text-purple-600" />;
      case 'Calendar':
        return <Calendar className="w-6 h-6 text-amber-600" />;
      case 'Printer':
        return <Printer className="w-6 h-6 text-rose-600" />;
      case 'Combine':
        return <Combine className="w-6 h-6 text-teal-600" />;
      case 'Contact':
        return <Contact className="w-6 h-6 text-indigo-600" />;
      case 'Crop':
        return <Crop className="w-6 h-6 text-blue-600" />;
      case 'Circle':
        return <Circle className="w-6 h-6 text-sky-600" />;
      case 'Square':
        return <Square className="w-6 h-6 text-amber-600" />;
      case 'Sliders':
        return <Sliders className="w-6 h-6 text-purple-600" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-6 h-6 text-rose-600" />;
      case 'Type':
        return <Type className="w-6 h-6 text-indigo-600" />;
      case 'RotateCw':
        return <RotateCw className="w-6 h-6 text-indigo-600" />;
      case 'Grid':
        return <Grid className="w-6 h-6 text-teal-600" />;
      case 'Pipette':
        return <Pipette className="w-6 h-6 text-pink-600" />;
      case 'FileSearch':
        return <FileSearch className="w-6 h-6 text-cyan-600" />;
      case 'Eraser':
        return <Eraser className="w-6 h-6 text-orange-600" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-indigo-600" />;
      case 'RefreshCw':
      default:
        return <RefreshCw className="w-6 h-6 text-slate-600" />;
    }
  };

  const filteredTools = IMAGE_TOOLS.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // If a tool is currently open, render its workspace
  if (activeTool === 'compress-kb') {
    return <TargetCompressor mode="compress" onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'increase-kb') {
    return <TargetCompressor mode="increase" onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'resize-dimensions') {
    return <DimensionResizer onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'dpi-converter') {
    return <DimensionResizer defaultDpiMode onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'passport-photo') {
    return <PassportPhotoMaker onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'signature-resizer') {
    return <SignatureResizer onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'name-date-stamp') {
    return <NameDatePhotoStamp onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'photo-signature-merge') {
    return <PhotoSignatureMergeWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'crop-shape') {
    return <CropShapeWorkspace initialMode="crop" onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'circle-crop') {
    return <CropShapeWorkspace initialMode="circle" onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'round-corners') {
    return <CropShapeWorkspace initialMode="round" onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'image-splitter') {
    return <ImageSplitterWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'rotate-flip') {
    return <RotateFlipWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'photo-effects') {
    return <PhotoEffectsWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'blur-censor') {
    return <BlurCensorWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'watermark-text') {
    return <WatermarkImageStudioWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'color-picker') {
    return <ColorPickerWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'metadata-cleaner') {
    return <MetadataWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'image-joiner') {
    return <ImageJoinerWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'format-convert') {
    return <ConvertImageWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'remove-bg') {
    return <BackgroundRemoverWorkspace onBack={() => handleSelectTool(null)} />;
  }
  if (activeTool === 'png-maker') {
    return <PngMakerWorkspace onBack={() => handleSelectTool(null)} />;
  }

  // Otherwise render Image Studio Hub Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Studio Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold mb-3 shadow-2xs border border-slate-200 dark:border-slate-800">
          <img src="/rv-logo.png" alt="logo" className="w-4 h-4 object-contain dark:hidden" />
          <img src="/rv-logo-dark.png" alt="logo" className="w-4 h-4 object-contain hidden dark:block" />
          <span>
            rajvarshith<span className="text-orange-500 font-bold">.com</span> Image Studio
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Complete Image & Document Photo Suite
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Compress photos to exact KB limits, resize signatures, create passport photos with printable sheets, crop shapes, apply filters, and censor private info. 100% private in-browser processing with zero server uploads.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-[11px] text-slate-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant In-Browser Compression</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Server Uploads & Total Privacy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>20 Professional Image Tools</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-8 max-w-lg mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any image tool... (e.g. 20KB, Passport, Signature, Crop, Blur, Watermark)"
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.key}
            onClick={() => handleSelectTool(tool.key)}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-emerald-100/40 dark:bg-emerald-950/20 blur-2xl group-hover:bg-emerald-200/50 dark:group-hover:bg-emerald-900/30 transition-colors pointer-events-none" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  {getToolIcon(tool.icon)}
                </div>
                {tool.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                    {tool.badge}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {tool.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {tool.shortDesc}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              <span>Launch Tool</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
