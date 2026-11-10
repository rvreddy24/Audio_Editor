import React, { useState } from 'react';
import {
  Copy,
  Scissors,
  Minimize2,
  LayoutGrid,
  Image,
  FileImage,
  RotateCw,
  Stamp,
  Hash,
  Lock,
  Unlock,
  PenTool,
  Music,
  Search,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PDF_TOOLS, PdfToolKey, ToolMeta } from './types';

interface PdfGridProps {
  onSelectTool: (tool: PdfToolKey | 'audio') => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Copy,
  Scissors,
  Minimize2,
  LayoutGrid,
  Image,
  FileImage,
  RotateCw,
  Stamp,
  Hash,
  Lock,
  Unlock,
  PenTool,
  Music,
};

export const PdfGrid: React.FC<PdfGridProps> = ({ onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'All Tools' },
    { key: 'organize', label: 'Organize PDF' },
    { key: 'optimize', label: 'Optimize' },
    { key: 'convert', label: 'Convert' },
    { key: 'security', label: 'Security & Sign' },
    { key: 'audio', label: 'Audio Tools' },
  ];

  const filteredTools = PDF_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search any tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredTools.map((tool) => {
          const IconComponent = ICON_MAP[tool.iconName] || Copy;

          return (
            <div
              key={tool.key}
              onClick={() => onSelectTool(tool.key)}
              className="group relative bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              {/* Popular indicator */}
              {tool.popular && (
                <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-current" />
                  Popular
                </div>
              )}

              <div>
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${tool.badgeColor} text-white flex items-center justify-center shadow-xs mb-4 group-hover:scale-105 transition-transform duration-200`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#e5322d] transition-colors flex items-center justify-between">
                  {tool.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {tool.shortDesc}
                </p>
              </div>

              {/* Bottom Action Hint */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-400 group-hover:text-[#e5322d] transition-colors">
                <span>Open tool</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
