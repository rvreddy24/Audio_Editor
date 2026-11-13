import React, { useState } from 'react';
import {
  Search,
  Calculator,
  DollarSign,
  HeartPulse,
  Scale,
  Percent,
  Calendar,
  Clock,
  Hash,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CalcCategory, CalculatorKey, ALL_CALCULATORS, CalculatorMeta } from './types';
import { ScientificCalc } from './ScientificCalc';
import { FinancialCalcs } from './FinancialCalcs';
import { HealthCalcs } from './HealthCalcs';
import { MathCalcs } from './MathCalcs';
import { EverydayCalcs } from './EverydayCalcs';

interface CalculatorHubProps {
  activeCalc: CalculatorKey;
  onSelectCalc: (key: CalculatorKey) => void;
}

export const CalculatorHub: React.FC<CalculatorHubProps> = ({ activeCalc, onSelectCalc }) => {
  const [selectedCategory, setSelectedCategory] = useState<CalcCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Icon mapping helper
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-5 h-5" />;
      case 'DollarSign':
        return <DollarSign className="w-5 h-5" />;
      case 'Scale':
        return <Scale className="w-5 h-5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      case 'Activity':
        return <Activity className="w-5 h-5" />;
      case 'Percent':
        return <Percent className="w-5 h-5" />;
      case 'Hash':
        return <Hash className="w-5 h-5" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5" />;
      case 'Clock':
        return <Clock className="w-5 h-5" />;
      default:
        return <Calculator className="w-5 h-5" />;
    }
  };

  // Color mapping per category
  const getCategoryTheme = (category: CalcCategory) => {
    switch (category) {
      case 'scientific':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/80',
          hoverBorder: 'hover:border-orange-500 dark:hover:border-orange-500',
          glow: 'group-hover:bg-orange-500/10 dark:group-hover:bg-orange-500/20',
          badge: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/80',
          textLink: 'text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300',
        };
      case 'financial':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/80',
          hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-500',
          glow: 'group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20',
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80',
          textLink: 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300',
        };
      case 'health':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/80',
          hoverBorder: 'hover:border-rose-500 dark:hover:border-rose-500',
          glow: 'group-hover:bg-rose-500/10 dark:group-hover:bg-rose-500/20',
          badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80',
          textLink: 'text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300',
        };
      case 'math':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/80',
          hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-500',
          glow: 'group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20',
          badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80',
          textLink: 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300',
        };
      case 'everyday':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/80',
          hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-500',
          glow: 'group-hover:bg-purple-500/10 dark:group-hover:bg-purple-500/20',
          badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80',
          textLink: 'text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300',
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700',
          hoverBorder: 'hover:border-orange-500 dark:hover:border-orange-500',
          glow: 'group-hover:bg-slate-500/10 dark:group-hover:bg-slate-500/20',
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          textLink: 'text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300',
        };
    }
  };

  // Filtered calculators
  const filteredCalcs = ALL_CALCULATORS.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      c.name.toLowerCase().includes(q) ||
      c.shortDesc.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.badge && c.badge.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // If a specific calculator is open, render that calculator's workspace
  if (activeCalc !== 'home') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeCalc === 'scientific' && (
          <ScientificCalc onBack={() => onSelectCalc('home')} />
        )}
        {[
          'mortgage',
          'loan',
          'auto-loan',
          'compound-interest',
          'retirement',
          'salary',
        ].includes(activeCalc) && (
          <FinancialCalcs toolKey={activeCalc} onBack={() => onSelectCalc('home')} />
        )}
        {['bmi', 'calorie', 'body-fat', 'bmr', 'ideal-weight', 'pace'].includes(
          activeCalc
        ) && <HealthCalcs toolKey={activeCalc} onBack={() => onSelectCalc('home')} />}
        {['percentage', 'fraction', 'statistics', 'random'].includes(activeCalc) && (
          <MathCalcs toolKey={activeCalc} onBack={() => onSelectCalc('home')} />
        )}
        {['age', 'date', 'hours', 'tip', 'unit-converter'].includes(activeCalc) && (
          <EverydayCalcs toolKey={activeCalc} onBack={() => onSelectCalc('home')} />
        )}
      </div>
    );
  }

  // Otherwise, render the Calculator Hub Grid & Search
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold mb-3 shadow-2xs border border-slate-200 dark:border-slate-800">
          <img src="/rv-logo.png" alt="logo" className="w-4 h-4 object-contain" />
          <span>
            rajvarshith<span className="text-orange-500 font-bold">.com</span> Calculator Suite
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Free Online Calculators for Every Need
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Instant, private, 100% free financial, fitness, math, scientific, and everyday conversion tools.
        </p>

        {/* Global Search Bar */}
        <div className="mt-6 max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search any calculator... (e.g. Mortgage, BMI, Percentage, Age)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {[
          { id: 'all', label: 'All Calculators' },
          { id: 'scientific', label: 'Scientific & Basic' },
          { id: 'financial', label: 'Financial' },
          { id: 'health', label: 'Fitness & Health' },
          { id: 'math', label: 'Math & Algebra' },
          { id: 'everyday', label: 'Everyday & Units' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as CalcCategory)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedCategory === tab.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCalcs.map((calc) => {
          const theme = getCategoryTheme(calc.category);
          return (
            <div
              key={calc.key}
              onClick={() => onSelectCalc(calc.key)}
              className={`group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xs hover:shadow-lg ${theme.hoverBorder} hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden`}
            >
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-orange-100/40 dark:bg-orange-950/20 blur-2xl group-hover:bg-orange-200/50 dark:group-hover:bg-orange-900/30 transition-colors pointer-events-none" />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${theme.bg} ${theme.glow} shadow-2xs group-hover:scale-105 transition-all shrink-0`}
                  >
                    {renderIcon(calc.iconName)}
                  </div>
                  {calc.badge && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${theme.badge}`}>
                      {calc.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-1.5 leading-snug">
                  {calc.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {calc.shortDesc}
                </p>
              </div>

              <div className={`mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold ${theme.textLink}`}>
                <span>Open Calculator</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredCalcs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">No calculators match your search query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-3 text-xs font-bold text-orange-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
