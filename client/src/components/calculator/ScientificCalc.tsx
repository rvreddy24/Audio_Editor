import React, { useState, useEffect } from 'react';
import { Copy, Check, History, Trash2, ArrowLeft, Keyboard } from 'lucide-react';

interface ScientificCalcProps {
  onBack?: () => void;
}

export const ScientificCalc: React.FC<ScientificCalcProps> = ({ onBack }) => {
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [isRad, setIsRad] = useState<boolean>(false);
  const [isInverse, setIsInverse] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<{ eq: string; res: string }[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [shouldResetDisplay, setShouldResetDisplay] = useState<boolean>(false);

  // Safe nth root helper
  const safeNthRoot = (base: number, root: number): number => {
    if (root === 0) return NaN;
    if (base === 0) return 0;
    if (base < 0) {
      if (Math.abs(root) % 2 === 1) {
        return -Math.pow(-base, 1 / root);
      }
      return NaN;
    }
    return Math.pow(base, 1 / root);
  };

  // Sanitize math expression for safe evaluation
  const sanitizeExpr = (expr: string) => {
    // Handle nth root: x ʸ√ y -> safeNthRoot(x, y)
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**');

    // Handle negative numbers before power operator
    sanitized = sanitized.replace(/(^|[+\-*/\s(])(-\d+(?:\.\d+)?)\s*\*\*/g, '$1($2)**');

    // Handle nth root syntax if present
    if (sanitized.includes('ʸ√')) {
      sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*ʸ√\s*(\d+(?:\.\d+)?)/g, 'safeNthRoot($1, $2)');
    }

    return sanitized;
  };

  // Handle number click
  const handleDigit = (digit: string) => {
    if (shouldResetDisplay || display === '0' || display === '-0' || display === 'Error') {
      setDisplay(digit);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    if (shouldResetDisplay || display === 'Error') {
      setDisplay('0.');
      setShouldResetDisplay(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setShouldResetDisplay(false);
  };

  const handleDelete = () => {
    if (display !== 'Error' && display.length > 1) {
      const sliced = display.slice(0, -1);
      setDisplay(sliced === '-' ? '0' : sliced);
    } else {
      setDisplay('0');
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;

    // If an operation is already pending and user entered a new number, evaluate first
    if (equation && !shouldResetDisplay) {
      try {
        const fullExpr = equation + display;
        const sanitized = sanitizeExpr(fullExpr);
        const evalFn = new Function('safeNthRoot', `'use strict'; return (${sanitized})`);
        const res = evalFn(safeNthRoot);
        if (Number.isFinite(res)) {
          const formatted = String(Math.round(res * 1e12) / 1e12);
          setDisplay(formatted);
          setEquation(`${formatted} ${op} `);
          setShouldResetDisplay(true);
          return;
        }
      } catch {
        // Fall through on syntax error
      }
    }

    setEquation(`${display} ${op} `);
    setShouldResetDisplay(true);
  };

  const handleEqual = () => {
    if (!equation) return;
    try {
      const fullExpression = equation + display;
      const sanitized = sanitizeExpr(fullExpression);

      // Safely evaluate simple math expressions
      const evalFn = new Function('safeNthRoot', `'use strict'; return (${sanitized})`);
      const result = evalFn(safeNthRoot);
      const formatted = Number.isFinite(result) ? String(Math.round(result * 1e12) / 1e12) : 'Error';

      setHistory((prev) => [{ eq: fullExpression, res: formatted }, ...prev.slice(0, 19)]);
      setDisplay(formatted);
      setEquation('');
      setShouldResetDisplay(true);
    } catch {
      setDisplay('Error');
      setEquation('');
      setShouldResetDisplay(true);
    }
  };

  // Scientific functions
  const handleFunction = (fn: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res = 0;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    switch (fn) {
      case 'sin':
        res = Math.sin(isRad ? val : toRad(val));
        break;
      case 'cos':
        res = Math.cos(isRad ? val : toRad(val));
        break;
      case 'tan':
        if (!isRad && Math.abs(val % 180) === 90) {
          res = NaN;
        } else {
          res = Math.tan(isRad ? val : toRad(val));
        }
        break;
      case 'asin':
        if (val < -1 || val > 1) {
          res = NaN;
        } else {
          res = isRad ? Math.asin(val) : toDeg(Math.asin(val));
        }
        break;
      case 'acos':
        if (val < -1 || val > 1) {
          res = NaN;
        } else {
          res = isRad ? Math.acos(val) : toDeg(Math.acos(val));
        }
        break;
      case 'atan':
        res = isRad ? Math.atan(val) : toDeg(Math.atan(val));
        break;
      case 'ln':
        res = val > 0 ? Math.log(val) : NaN;
        break;
      case 'log':
        res = val > 0 ? Math.log10(val) : NaN;
        break;
      case 'exp':
        res = Math.exp(val);
        break;
      case 'pow10':
        res = Math.pow(10, val);
        break;
      case 'sqrt':
        res = val >= 0 ? Math.sqrt(val) : NaN;
        break;
      case 'cbrt':
        res = Math.cbrt(val);
        break;
      case 'sqr':
        res = val * val;
        break;
      case 'cube':
        res = val * val * val;
        break;
      case 'inv':
        res = val !== 0 ? 1 / val : NaN;
        break;
      case 'fact':
        if (val < 0 || !Number.isInteger(val) || val > 170) {
          setDisplay('Error');
          setShouldResetDisplay(true);
          return;
        }
        res = 1;
        for (let i = 2; i <= val; i++) res *= i;
        break;
      case 'plusminus':
        if (display === 'Error') return;
        if (display.startsWith('-')) {
          setDisplay(display.slice(1) || '0');
        } else if (display !== '0') {
          setDisplay('-' + display);
        }
        return;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      default:
        return;
    }

    const formatted = Number.isFinite(res) ? String(Math.round(res * 1e12) / 1e12) : 'Error';
    setDisplay(formatted);
    setShouldResetDisplay(true);
  };

  // Memory
  const handleMemory = (action: 'mc' | 'mr' | 'm+' | 'm-') => {
    const val = parseFloat(display) || 0;
    if (action === 'mc') setMemory(0);
    if (action === 'mr') {
      setDisplay(String(memory));
      setShouldResetDisplay(true);
    }
    if (action === 'm+') setMemory((m) => m + val);
    if (action === 'm-') setMemory((m) => m - val);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '^') {
        e.preventDefault();
        handleOperator('^');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleFunction(isInverse ? 'asin' : 'sin');
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleFunction(isInverse ? 'atan' : 'tan');
      } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleFunction('pi');
      } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleFunction('e');
      } else if (e.key === '!') {
        e.preventDefault();
        handleFunction('fact');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, equation, shouldResetDisplay, isRad, isInverse, memory]);

  return (
    <div className="max-w-4xl mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Calculators</span>
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calculator */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-3.5 sm:p-6 lg:p-8 shadow-xl border border-slate-800 text-white flex flex-col justify-between">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRad(!isRad)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  isRad
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle Radians / Degrees"
              >
                {isRad ? 'RAD' : 'DEG'}
              </button>
              <button
                onClick={() => setIsInverse(!isInverse)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  isInverse
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle 2nd Inverse Functions (sin⁻¹, cos⁻¹, tan⁻¹, nth-root, cube, 10ˣ, eˣ)"
              >
                {isInverse ? '2nd [ON]' : '2nd'}
              </button>
              {memory !== 0 && (
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                  M = {memory}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                <Keyboard className="w-3 h-3" />
                <span>Keys Active</span>
              </span>
              <button
                onClick={copyResult}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* LCD Display */}
          <div className="bg-slate-950/80 rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 border border-slate-800 text-right">
            <div className="h-5 text-xs text-slate-500 font-mono tracking-wider overflow-hidden truncate">
              {equation || ' '}
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono text-white mt-1 overflow-x-auto whitespace-nowrap">
              {display}
            </div>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-semibold select-none">
            {/* Row 1: Memory & Clear */}
            <button
              onClick={() => setIsInverse(!isInverse)}
              className={`calc-fn-btn font-bold ${isInverse ? '!bg-purple-950 !text-purple-300 !border-purple-600' : ''}`}
            >
              2nd
            </button>
            <button onClick={() => handleMemory('mc')} className="calc-fn-btn">MC</button>
            <button onClick={() => handleMemory('mr')} className="calc-fn-btn">MR</button>
            <button onClick={() => handleMemory('m+')} className="calc-fn-btn">M+</button>
            <button
              onClick={handleClear}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95 p-2 sm:p-3 rounded-xl transition-all font-mono font-bold text-[11px] sm:text-xs min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              AC
            </button>

            {/* Row 2: Sci Functions (sin, cos, tan, powers) */}
            <button
              onClick={() => handleFunction(isInverse ? 'asin' : 'sin')}
              className="calc-fn-btn"
            >
              {isInverse ? 'sin⁻¹' : 'sin'}
            </button>
            <button
              onClick={() => handleFunction(isInverse ? 'acos' : 'cos')}
              className="calc-fn-btn"
            >
              {isInverse ? 'cos⁻¹' : 'cos'}
            </button>
            <button
              onClick={() => handleFunction(isInverse ? 'atan' : 'tan')}
              className="calc-fn-btn"
            >
              {isInverse ? 'tan⁻¹' : 'tan'}
            </button>
            <button
              onClick={() => handleFunction(isInverse ? 'cube' : 'sqr')}
              className="calc-fn-btn"
            >
              {isInverse ? 'x³' : 'x²'}
            </button>
            <button
              onClick={() => handleOperator(isInverse ? 'ʸ√' : '^')}
              className="calc-fn-btn"
            >
              {isInverse ? 'ʸ√x' : 'xʸ'}
            </button>

            {/* Row 3: Roots, Logarithms, Reciprocal & Division */}
            <button
              onClick={() => handleFunction(isInverse ? 'cbrt' : 'sqrt')}
              className="calc-fn-btn"
            >
              {isInverse ? '∛x' : '√x'}
            </button>
            <button
              onClick={() => handleFunction(isInverse ? 'pow10' : 'log')}
              className="calc-fn-btn"
            >
              {isInverse ? '10ˣ' : 'log'}
            </button>
            <button
              onClick={() => handleFunction(isInverse ? 'exp' : 'ln')}
              className="calc-fn-btn"
            >
              {isInverse ? 'eˣ' : 'ln'}
            </button>
            <button onClick={() => handleFunction('inv')} className="calc-fn-btn">
              1/x
            </button>
            <button onClick={() => handleOperator('÷')} className="calc-op-btn">
              ÷
            </button>

            {/* Row 4: Constants & Numbers 7, 8, 9, Multiply */}
            <button onClick={() => handleFunction('pi')} className="calc-fn-btn">
              π
            </button>
            <button onClick={() => handleDigit('7')} className="calc-num-btn">
              7
            </button>
            <button onClick={() => handleDigit('8')} className="calc-num-btn">
              8
            </button>
            <button onClick={() => handleDigit('9')} className="calc-num-btn">
              9
            </button>
            <button onClick={() => handleOperator('×')} className="calc-op-btn">
              ×
            </button>

            {/* Row 5: e & Numbers 4, 5, 6, Minus */}
            <button onClick={() => handleFunction('e')} className="calc-fn-btn">
              e
            </button>
            <button onClick={() => handleDigit('4')} className="calc-num-btn">
              4
            </button>
            <button onClick={() => handleDigit('5')} className="calc-num-btn">
              5
            </button>
            <button onClick={() => handleDigit('6')} className="calc-num-btn">
              6
            </button>
            <button onClick={() => handleOperator('-')} className="calc-op-btn">
              −
            </button>

            {/* Row 6: Factorial & Numbers 1, 2, 3, Plus */}
            <button onClick={() => handleFunction('fact')} className="calc-fn-btn">
              n!
            </button>
            <button onClick={() => handleDigit('1')} className="calc-num-btn">
              1
            </button>
            <button onClick={() => handleDigit('2')} className="calc-num-btn">
              2
            </button>
            <button onClick={() => handleDigit('3')} className="calc-num-btn">
              3
            </button>
            <button onClick={() => handleOperator('+')} className="calc-op-btn">
              +
            </button>

            {/* Row 7: Sign toggle, 0, decimal, DEL, Equals */}
            <button onClick={() => handleFunction('plusminus')} className="calc-fn-btn">
              ±
            </button>
            <button onClick={() => handleDigit('0')} className="calc-num-btn">
              0
            </button>
            <button onClick={handleDecimal} className="calc-num-btn">
              .
            </button>
            <button
              onClick={handleDelete}
              className="bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 p-2 sm:p-3 rounded-xl transition-all font-mono font-bold text-[11px] sm:text-xs min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              DEL
            </button>
            <button
              onClick={handleEqual}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold p-2 sm:p-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all font-mono text-sm sm:text-base min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              =
            </button>
          </div>
        </div>

        {/* Calculation History Panel & Shortcuts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Calculation Log</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Clear History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No calculations recorded yet. Perform calculations to see results saved here.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setDisplay(item.res);
                      setShouldResetDisplay(true);
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/60 border border-slate-100 cursor-pointer transition-colors text-right"
                  >
                    <div className="text-[11px] text-slate-400 font-mono truncate">{item.eq} =</div>
                    <div className="text-sm font-bold text-slate-800 font-mono">{item.res}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Keyboard Shortcuts:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-mono">
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">0-9, . : Digits</div>
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">+ - * / : Operators</div>
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">Enter / = : Compute</div>
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">Esc / C : Clear</div>
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">Backspace : Delete</div>
              <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">s / t / p : sin / tan / π</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .calc-num-btn {
          background-color: #1e293b;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 0.75rem;
          transition: all 150ms;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
        }
        .calc-num-btn:hover {
          background-color: #334155;
          transform: scale(1.02);
        }
        .calc-num-btn:active {
          transform: scale(0.96);
        }
        .calc-fn-btn {
          background-color: #0f172a;
          color: #94a3b8;
          border: 1px solid #1e293b;
          padding: 0.75rem;
          border-radius: 0.75rem;
          transition: all 150ms;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
        }
        .calc-fn-btn:hover {
          background-color: #1e293b;
          color: #ffffff;
        }
        .calc-fn-btn:active {
          transform: scale(0.96);
        }
        .calc-op-btn {
          background-color: #f97316;
          color: #ffffff;
          font-weight: 700;
          padding: 0.75rem;
          border-radius: 0.75rem;
          transition: all 150ms;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
        }
        .calc-op-btn:hover {
          background-color: #ea580c;
          transform: scale(1.02);
        }
        .calc-op-btn:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
};
