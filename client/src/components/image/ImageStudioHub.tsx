import React, { useState } from 'react';
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
} from 'lucide-react';
import { ImageToolKey, ImageCategory, IMAGE_TOOLS, ImageToolMeta } from './types';
import { TargetCompressor } from './TargetCompressor';
import { DimensionResizer } from './DimensionResizer';
import { PassportPhotoMaker } from './PassportPhotoMaker';
import { SignatureResizer } from './SignatureResizer';
import { NameDatePhotoStamp } from './NameDatePhotoStamp';
import { ImageJoinerWorkspace } from './ImageJoinerWorkspace';
import { ConvertImageWorkspace } from '../pdf/workspaces/ConvertImageWorkspace';

interface ImageStudioHubProps {
  initialTool?: ImageToolKey;
  onBackToHome?: () => void;
}

export const ImageStudioHub: React.FC<ImageStudioHubProps> = ({
  initialTool,
  onBackToHome,
}) => {
  const [activeTool, setActiveTool] = useState<ImageToolKey | null>(initialTool || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Image Tools' },
    { id: 'compress', label: 'Compress Size' },
    { id: 'resize', label: 'Resize & DPI' },
    { id: 'official', label: 'Official Forms & Exams' },
    { id: 'edit', label: 'Edit & Join' },
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
    return <TargetCompressor mode="compress" onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'increase-kb') {
    return <TargetCompressor mode="increase" onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'resize-dimensions') {
    return <DimensionResizer onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'dpi-converter') {
    return <DimensionResizer defaultDpiMode onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'passport-photo') {
    return <PassportPhotoMaker onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'signature-resizer') {
    return <SignatureResizer onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'name-date-stamp') {
    return <NameDatePhotoStamp onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'image-joiner') {
    return <ImageJoinerWorkspace onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'format-convert') {
    return <ConvertImageWorkspace onBack={() => setActiveTool(null)} />;
  }

  // Otherwise render Image Studio Hub Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Studio Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-slate-800 text-xs font-semibold mb-3 shadow-2xs border border-slate-200">
          <img src="/rv-logo.png" alt="logo" className="w-4 h-4 object-contain" />
          <span>
            rajvarshith<span className="text-orange-500 font-bold">.com</span> Image Studio
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Complete Image & Document Photo Suite
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Compress photos to exact KB limits, resize signatures, create passport photos with printable sheets, and inject DPI. 100% private in-browser processing with zero server uploads.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-[11px] text-slate-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant In-Browser Compression</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Private (No File Leaves Device)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Official Recruitment Portal Compliant</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search image tools (e.g. 50kb, passport, signature)..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.key}
            onClick={() => setActiveTool(tool.key)}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getToolIcon(tool.icon)}
                </div>
                {tool.badge && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/80">
                    {tool.badge}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                {tool.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {tool.shortDesc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
              <span>Launch Tool</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
