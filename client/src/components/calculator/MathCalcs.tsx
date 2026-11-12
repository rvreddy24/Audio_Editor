import React, { useState } from 'react';
import { Percent, Hash, ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { CalculatorKey, parseCalcInput } from './types';

interface MathCalcsProps {
  toolKey: CalculatorKey;
  onBack?: () => void;
}

export const MathCalcs: React.FC<MathCalcsProps> = ({ toolKey, onBack }) => {
  // 1. PERCENTAGE STATE
  // Mode 1: What is P% of X?
  const [p1Pct, setP1Pct] = useState<number | ''>(15);
  const [p1Num, setP1Num] = useState<number | ''>(200);
  // Mode 2: X is what percent of Y?
  const [p2Num, setP2Num] = useState<number | ''>(25);
  const [p2Total, setP2Total] = useState<number | ''>(100);
  // Mode 3: % Increase/Decrease from X to Y
  const [p3From, setP3From] = useState<number | ''>(80);
  const [p3To, setP3To] = useState<number | ''>(100);

  // 2. FRACTION STATE
  const [f1Num, setF1Num] = useState<number | ''>(2);
  const [f1Den, setF1Den] = useState<number | ''>(3);
  const [fractionOp, setFractionOp] = useState<'+' | '-' | '×' | '÷'>('+');
  const [f2Num, setF2Num] = useState<number | ''>(3);
  const [f2Den, setF2Den] = useState<number | ''>(4);

  // 3. STATISTICS STATE
  const [datasetText, setDatasetText] = useState<string>('12, 15, 18, 22, 25, 28, 30, 35, 42, 50');

  // 4. RANDOM NUMBER STATE
  const [randMin, setRandMin] = useState<number | ''>(1);
  const [randMax, setRandMax] = useState<number | ''>(100);
  const [randCount, setRandCount] = useState<number | ''>(5);
  const [randUnique, setRandUnique] = useState<boolean>(true);
  const [randSorted, setRandSorted] = useState<boolean>(false);
  const [randResults, setRandResults] = useState<number[]>([14, 27, 42, 68, 91]);
  const [copied, setCopied] = useState<boolean>(false);

  // Percentage Calculations
  const numP1Pct = Number(p1Pct) || 0;
  const numP1Num = Number(p1Num) || 0;
  const numP2Num = Number(p2Num) || 0;
  const numP2Total = Number(p2Total) || 0;
  const numP3From = Number(p3From) || 0;
  const numP3To = Number(p3To) || 0;

  const r1 = (numP1Pct / 100) * numP1Num;
  const r2Valid = numP2Total !== 0;
  const r2 = r2Valid ? (numP2Num / numP2Total) * 100 : 0;
  const r3Diff = numP3To - numP3From;
  const r3Valid = numP3From !== 0;
  const r3Pct = r3Valid ? (r3Diff / Math.abs(numP3From)) * 100 : 0;

  // Fraction Calculations
  const numF1Num = Number(f1Num) || 0;
  const numF1Den = Number(f1Den) || 0;
  const numF2Num = Number(f2Num) || 0;
  const numF2Den = Number(f2Den) || 0;

  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  let resNum = 0;
  let resDen = 1;
  const isDivByZero = numF1Den === 0 || numF2Den === 0 || (fractionOp === '÷' && numF2Num === 0);

  if (!isDivByZero) {
    if (fractionOp === '+') {
      resNum = numF1Num * numF2Den + numF2Num * numF1Den;
      resDen = numF1Den * numF2Den;
    } else if (fractionOp === '-') {
      resNum = numF1Num * numF2Den - numF2Num * numF1Den;
      resDen = numF1Den * numF2Den;
    } else if (fractionOp === '×') {
      resNum = numF1Num * numF2Num;
      resDen = numF1Den * numF2Den;
    } else if (fractionOp === '÷') {
      resNum = numF1Num * numF2Den;
      resDen = numF1Den * numF2Num;
    }
  }

  if (resDen < 0) {
    resNum = -resNum;
    resDen = -resDen;
  }

  const divisor = !isDivByZero && resDen !== 0 ? gcd(resNum, resDen) : 1;
  const simplifiedNum = !isDivByZero ? resNum / (divisor || 1) : 0;
  const simplifiedDen = !isDivByZero ? resDen / (divisor || 1) : 0;
  const decimalVal = !isDivByZero && resDen !== 0 ? resNum / resDen : 0;

  // Mixed fraction
  const isNegative = simplifiedNum < 0;
  const absNum = Math.abs(simplifiedNum);
  const absDen = Math.abs(simplifiedDen);
  const wholePart = absDen !== 0 ? Math.floor(absNum / absDen) : 0;
  const remainderNum = absDen !== 0 ? absNum % absDen : 0;

  // Statistics Calculations
  const numbers = datasetText
    .split(/[\s,]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  const count = numbers.length;
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = count > 0 ? sum / count : 0;
  // Median
  const sorted = [...numbers].sort((a, b) => a - b);
  let median = 0;
  if (count > 0) {
    const mid = Math.floor(count / 2);
    median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  // Variance & Standard Deviation
  const variancePop = count > 0 ? numbers.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / count : 0;
  const sdPop = Math.sqrt(variancePop);
  const varianceSample = count > 1 ? numbers.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / (count - 1) : null;
  const sdSample = varianceSample !== null ? Math.sqrt(varianceSample) : null;
  const minVal = count > 0 ? Math.min(...numbers) : 0;
  const maxVal = count > 0 ? Math.max(...numbers) : 0;

  // Mode Calculation
  const freqMap = new Map<number, number>();
  let maxFreq = 0;
  for (const n of numbers) {
    const f = (freqMap.get(n) || 0) + 1;
    freqMap.set(n, f);
    if (f > maxFreq) maxFreq = f;
  }
  let modeStr = 'N/A';
  if (count > 0 && maxFreq > 1) {
    const modes: number[] = [];
    freqMap.forEach((freq, val) => {
      if (freq === maxFreq) modes.push(val);
    });
    modes.sort((a, b) => a - b);
    modeStr = modes.join(', ');
  } else if (count > 0) {
    modeStr = 'No unique mode (all appear once)';
  }

  // Random generation
  const handleGenerateRandom = () => {
    const minVal = Number(randMin) || 0;
    const maxVal = Number(randMax) || 0;
    const effectiveMin = Math.min(minVal, maxVal);
    const effectiveMax = Math.max(minVal, maxVal);
    const poolSize = effectiveMax - effectiveMin + 1;
    const safeCount = Math.max(1, Math.min(Number(randCount) || 1, 100));
    const countToGen = randUnique ? Math.min(safeCount, poolSize) : safeCount;
    const generated: number[] = [];
    const used = new Set<number>();

    const getCryptoInt = (min: number, max: number): number => {
      const range = max - min + 1;
      if (range <= 1) return min;
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint32Array(1);
        const maxUint = 0xffffffff;
        const limit = maxUint - (maxUint % range);
        let r: number;
        do {
          window.crypto.getRandomValues(arr);
          r = arr[0];
        } while (r >= limit);
        return min + (r % range);
      }
      return Math.floor(Math.random() * range) + min;
    };

    while (generated.length < countToGen) {
      const val = getCryptoInt(effectiveMin, effectiveMax);
      if (randUnique) {
        if (!used.has(val)) {
          used.add(val);
          generated.push(val);
        }
      } else {
        generated.push(val);
      }
    }
    if (randSorted) {
      generated.sort((a, b) => a - b);
    }
    setRandResults(generated);
  };

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

      {/* ---------------- 1. PERCENTAGE CALCULATOR ---------------- */}
      {toolKey === 'percentage' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Percentage Calculator</h2>
              <p className="text-xs text-slate-500">Calculate percentage fractions, discounts, and percentage changes.</p>
            </div>
          </div>

          {/* Form 1 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Calculation 1: What is P% of X?
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">What is</span>
              <input
                type="number"
                placeholder="0"
                value={p1Pct}
                onFocus={(e) => e.target.select()}
                  onChange={(e) => setP1Pct(parseCalcInput(e.target.value))}
                className="w-24 calc-input"
              />
              <span className="text-sm font-semibold text-slate-700">% of</span>
              <input
                type="number"
                placeholder="0"
                value={p1Num}
                onFocus={(e) => e.target.select()}
                  onChange={(e) => setP1Num(parseCalcInput(e.target.value))}
                className="w-32 calc-input"
              />
              <span className="text-sm font-semibold text-slate-700">=</span>
              <div className="px-4 py-2 bg-slate-900 text-orange-400 font-mono font-bold text-base rounded-xl">
                {r1.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Form 2 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Calculation 2: X is what % of Y?
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                placeholder="0"
                value={p2Num}
                onFocus={(e) => e.target.select()}
                  onChange={(e) => setP2Num(parseCalcInput(e.target.value))}
                className="w-28 calc-input"
              />
              <span className="text-sm font-semibold text-slate-700">is what percent of</span>
              <input
                type="number"
                placeholder="0"
                value={p2Total}
                onFocus={(e) => e.target.select()}
                  onChange={(e) => setP2Total(parseCalcInput(e.target.value))}
                className="w-32 calc-input"
              />
              <span className="text-sm font-semibold text-slate-700">=</span>
              <div className="px-4 py-2 bg-slate-900 text-blue-400 font-mono font-bold text-base rounded-xl">
                {r2.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Form 3 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Calculation 3: Percentage Increase / Decrease
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">From</span>
              <input
                type="number"
                placeholder="0"
                value={p3From}
                onFocus={(e) => e.target.select()}
                  onChange={(e) => setP3From(parseCalcInput(e.target.value))}
                className="w-28 calc-input"
              />
              <span className="text-sm font-semibold text-slate-700">to</span>
              <input
                type="number"
                placeholder="0"
                value={p3To}
                onFocus={(e) => e.target.select()}
                  onChange={(e) => setP3To(parseCalcInput(e.target.value))}
                className="w-28 calc-input"
              />
              <span className="text-sm font-semibold text-slate-700">=</span>
              <div
                className={`px-4 py-2 font-mono font-bold text-base rounded-xl ${
                  !r3Valid
                    ? 'bg-slate-800 text-slate-400'
                    : r3Pct >= 0
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-red-950 text-red-400'
                }`}
              >
                {!r3Valid
                  ? 'Undefined (Base is 0)'
                  : r3Pct >= 0
                  ? `+${r3Pct.toFixed(2)}% Increase`
                  : `${Math.abs(r3Pct).toFixed(2)}% Decrease`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. FRACTION CALCULATOR ---------------- */}
      {toolKey === 'fraction' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Fraction Calculator</h2>
              <p className="text-xs text-slate-500">Perform fraction operations with step-by-step simplification.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Input Fractions */}
            <div className="flex items-center justify-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              {/* Fraction 1 */}
              <div className="flex flex-col items-center w-20">
                <input
                  type="number"
                  placeholder="0"
                  value={f1Num}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setF1Num(parseCalcInput(e.target.value))}
                  className="calc-input text-center text-base"
                />
                <div className="w-full h-0.5 bg-slate-900 my-1.5" />
                <input
                  type="number"
                  placeholder="0"
                  value={f1Den}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setF1Den(parseCalcInput(e.target.value))}
                  className="calc-input text-center text-base"
                />
              </div>

              {/* Operator */}
              <select
                value={fractionOp}
                onChange={(e) => setFractionOp(e.target.value as any)}
                className="bg-slate-900 text-white font-bold p-2.5 rounded-xl text-lg text-center"
              >
                <option value="+">+</option>
                <option value="-">−</option>
                <option value="×">×</option>
                <option value="÷">÷</option>
              </select>

              {/* Fraction 2 */}
              <div className="flex flex-col items-center w-20">
                <input
                  type="number"
                  placeholder="0"
                  value={f2Num}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setF2Num(parseCalcInput(e.target.value))}
                  className="calc-input text-center text-base"
                />
                <div className="w-full h-0.5 bg-slate-900 my-1.5" />
                <input
                  type="number"
                  placeholder="0"
                  value={f2Den}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setF2Den(parseCalcInput(e.target.value))}
                  className="calc-input text-center text-base"
                />
              </div>
            </div>

            {/* Result */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Simplified Fraction</span>
                {isDivByZero ? (
                  <div className="py-6 text-red-400 font-bold text-base">
                    Undefined (Division by zero)
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-3 my-4">
                      {isNegative && <span className="text-3xl font-black text-purple-400 font-mono">−</span>}
                      {wholePart > 0 && (
                        <span className="text-3xl font-black text-slate-300 font-mono">{wholePart}</span>
                      )}
                      {!(wholePart > 0 && remainderNum === 0) && (
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-purple-400 font-mono">
                            {wholePart > 0 ? remainderNum : absNum}
                          </span>
                          <div className="w-12 h-0.5 bg-slate-600 my-1" />
                          <span className="text-2xl font-black text-purple-400 font-mono">{absDen}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs flex justify-between text-slate-300">
                      <span>Decimal Representation:</span>
                      <span className="font-mono font-bold text-white text-sm">{decimalVal.toFixed(4)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Greatest Common Divisor (GCD): {!isDivByZero ? divisor : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. STATISTICS CALCULATOR ---------------- */}
      {toolKey === 'statistics' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Standard Deviation & Statistics</h2>
              <p className="text-xs text-slate-500">Calculate sample and population standard deviation, variance, mean, and range.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter Dataset (Comma or space separated numbers)
              </label>
              <textarea
                rows={5}
                value={datasetText}
                onChange={(e) => setDatasetText(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:border-orange-500 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total numbers detected: <strong className="text-slate-700">{count}</strong>
              </span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Sample Std Dev (s):</span>
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {sdSample !== null ? sdSample.toFixed(4) : count < 2 ? 'Undefined (N < 2)' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Population Std Dev (σ):</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {count > 0 ? sdPop.toFixed(4) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Arithmetic Mean (Average):</span>
                  <span className="font-mono font-bold text-white">{count > 0 ? mean.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Median:</span>
                  <span className="font-mono font-bold text-white">{count > 0 ? median.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Mode:</span>
                  <span className="font-mono font-bold text-white text-right max-w-[200px] truncate" title={modeStr}>
                    {modeStr}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Sample Variance (s²):</span>
                  <span className="font-mono font-bold text-white">
                    {varianceSample !== null ? varianceSample.toFixed(4) : count < 2 ? 'Undefined (N < 2)' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Range (Max − Min):</span>
                  <span className="font-mono font-bold text-white">
                    {count > 0 ? (maxVal - minVal).toFixed(2) : 0} ({minVal} to {maxVal})
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                  <span>Sum (Σx):</span>
                  <span className="font-mono text-orange-400">{sum.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Full descriptive statistical summary.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. RANDOM NUMBER GENERATOR ---------------- */}
      {toolKey === 'random' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Random Number Generator</h2>
              <p className="text-xs text-slate-500">Generate cryptographically fair numbers within any lower and upper bounds.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lower Bound (Min)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={randMin}
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setRandMin(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Upper Bound (Max)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={randMax}
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setRandMax(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity of Numbers to Generate</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  placeholder="0"
                  value={randCount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setRandCount(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={randUnique}
                    onChange={(e) => setRandUnique(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Generate Unique Numbers (No Duplicates)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={randSorted}
                    onChange={(e) => setRandSorted(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Sort Results Ascending</span>
                </label>
              </div>

              <button
                onClick={handleGenerateRandom}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Generate Random Numbers</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Generated Results</span>
                  {randResults.length > 0 && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(randResults.join(', '));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5 my-4">
                  {randResults.map((num, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 bg-slate-800 text-emerald-400 font-mono font-bold text-lg rounded-xl border border-slate-700"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4 border-t border-slate-800 pt-3 flex justify-between">
                <span>Range: [{Math.min(Number(randMin) || 0, Number(randMax) || 0)}, {Math.max(Number(randMin) || 0, Number(randMax) || 0)}]</span>
                <span>Count: {randResults.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .calc-input {
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
          outline: none;
          transition: border-color 150ms;
        }
        .calc-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
        }
      `}</style>
    </div>
  );
};
