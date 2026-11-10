import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, Scale, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { CalculatorKey } from './types';

interface EverydayCalcsProps {
  toolKey: CalculatorKey;
  onBack?: () => void;
}

export const EverydayCalcs: React.FC<EverydayCalcsProps> = ({ toolKey, onBack }) => {
  // 1. AGE CALCULATOR STATE
  const [birthDateStr, setBirthDateStr] = useState<string>('1998-05-15');
  const [targetDateStr, setTargetDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // 2. DATE CALCULATOR STATE
  const [date1Str, setDate1Str] = useState<string>(new Date().toISOString().split('T')[0]);
  const [date2Str, setDate2Str] = useState<string>('2027-01-01');
  const [addDays, setAddDays] = useState<number>(30);
  const [addMode, setAddMode] = useState<'add' | 'subtract'>('add');

  // 3. WORK HOURS STATE
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:30');
  const [breakMinutes, setBreakMinutes] = useState<number>(30);
  const [hourlyRate, setHourlyRate] = useState<number>(25);

  // 4. TIP CALCULATOR STATE
  const [billAmount, setBillAmount] = useState<number>(85.0);
  const [tipPercent, setTipPercent] = useState<number>(18);
  const [splitCount, setSplitCount] = useState<number>(2);

  // 5. UNIT CONVERTER STATE
  type UnitCategory = 'length' | 'weight' | 'temp' | 'area' | 'volume' | 'speed' | 'data';
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('length');
  const [unitValFrom, setUnitValFrom] = useState<number>(100);
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');

  // -------------------------------------------------------------------
  // 1. AGE CALCULATION
  // -------------------------------------------------------------------
  const bDate = new Date(birthDateStr);
  const tDate = new Date(targetDateStr);
  let ageYears = tDate.getFullYear() - bDate.getFullYear();
  let ageMonths = tDate.getMonth() - bDate.getMonth();
  let ageDays = tDate.getDate() - bDate.getDate();

  if (ageDays < 0) {
    ageMonths -= 1;
    const prevMonthDays = new Date(tDate.getFullYear(), tDate.getMonth(), 0).getDate();
    ageDays += prevMonthDays;
  }
  if (ageMonths < 0) {
    ageYears -= 1;
    ageMonths += 12;
  }
  const totalDiffMs = Math.max(0, tDate.getTime() - bDate.getTime());
  const totalDays = Math.floor(totalDiffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = totalDays * 24;

  // Next birthday countdown
  let nextBday = new Date(tDate.getFullYear(), bDate.getMonth(), bDate.getDate());
  if (nextBday < tDate) {
    nextBday = new Date(tDate.getFullYear() + 1, bDate.getMonth(), bDate.getDate());
  }
  const daysToNextBday = Math.ceil((nextBday.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));

  // -------------------------------------------------------------------
  // 2. DATE DIFFERENCE & ADDITION
  // -------------------------------------------------------------------
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffDays = Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  const diffWeeks = (diffDays / 7).toFixed(1);

  // Add / Subtract Date
  const addedDate = new Date(date1Str);
  addedDate.setDate(addedDate.getDate() + (addMode === 'add' ? addDays : -addDays));
  const formattedAddedDate = addedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // -------------------------------------------------------------------
  // 3. WORK HOURS & TIMECARD
  // -------------------------------------------------------------------
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let durationMins = endH * 60 + endM - (startH * 60 + startM);
  if (durationMins < 0) durationMins += 24 * 60; // Crosses midnight
  durationMins = Math.max(0, durationMins - breakMinutes);
  const workHours = Math.floor(durationMins / 60);
  const workRemainderMins = durationMins % 60;
  const decimalHours = durationMins / 60;
  const totalGrossPay = decimalHours * hourlyRate;

  // -------------------------------------------------------------------
  // 4. TIP CALCULATOR
  // -------------------------------------------------------------------
  const tipAmount = (billAmount * tipPercent) / 100;
  const totalBillWithTip = billAmount + tipAmount;
  const tipPerPerson = tipAmount / Math.max(1, splitCount);
  const totalPerPerson = totalBillWithTip / Math.max(1, splitCount);

  // -------------------------------------------------------------------
  // 5. UNIT CONVERTER
  // -------------------------------------------------------------------
  const UNIT_DEFINITIONS: Record<
    UnitCategory,
    { label: string; units: Record<string, { name: string; toBase: (v: number) => number; fromBase: (v: number) => number }> }
  > = {
    length: {
      label: 'Length & Distance',
      units: {
        m: { name: 'Meters (m)', toBase: (v) => v, fromBase: (v) => v },
        km: { name: 'Kilometers (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        cm: { name: 'Centimeters (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        mm: { name: 'Millimeters (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        in: { name: 'Inches (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
        ft: { name: 'Feet (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        yd: { name: 'Yards (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
        mi: { name: 'Miles (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      },
    },
    weight: {
      label: 'Weight & Mass',
      units: {
        kg: { name: 'Kilograms (kg)', toBase: (v) => v, fromBase: (v) => v },
        g: { name: 'Grams (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        mg: { name: 'Milligrams (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
        lb: { name: 'Pounds (lbs)', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
        oz: { name: 'Ounces (oz)', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
        ton: { name: 'Metric Ton (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      },
    },
    temp: {
      label: 'Temperature',
      units: {
        C: { name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
        F: { name: 'Fahrenheit (°F)', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
        K: { name: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      },
    },
    area: {
      label: 'Area',
      units: {
        sqm: { name: 'Square Meters (m²)', toBase: (v) => v, fromBase: (v) => v },
        sqft: { name: 'Square Feet (ft²)', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
        acre: { name: 'Acres (ac)', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
        ha: { name: 'Hectares (ha)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
        sqkm: { name: 'Square Kilometers (km²)', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      },
    },
    volume: {
      label: 'Volume & Liquid',
      units: {
        l: { name: 'Liters (L)', toBase: (v) => v, fromBase: (v) => v },
        ml: { name: 'Milliliters (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        gal: { name: 'US Gallons (gal)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
        cup: { name: 'US Cups', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
        floz: { name: 'Fluid Ounces (fl oz)', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      },
    },
    speed: {
      label: 'Speed',
      units: {
        kmh: { name: 'Kilometers per hour (km/h)', toBase: (v) => v, fromBase: (v) => v },
        mph: { name: 'Miles per hour (mph)', toBase: (v) => v * 1.60934, fromBase: (v) => v / 1.60934 },
        ms: { name: 'Meters per second (m/s)', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 },
        knot: { name: 'Knots (kn)', toBase: (v) => v * 1.852, fromBase: (v) => v / 1.852 },
      },
    },
    data: {
      label: 'Data Storage',
      units: {
        B: { name: 'Bytes (B)', toBase: (v) => v, fromBase: (v) => v },
        KB: { name: 'Kilobytes (KB)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
        MB: { name: 'Megabytes (MB)', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
        GB: { name: 'Gigabytes (GB)', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
        TB: { name: 'Terabytes (TB)', toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
      },
    },
  };

  // Unit conversion calculation
  const currentCategoryUnits = UNIT_DEFINITIONS[unitCategory].units;
  const safeFromUnit = currentCategoryUnits[fromUnit] ? fromUnit : Object.keys(currentCategoryUnits)[0];
  const safeToUnit = currentCategoryUnits[toUnit] ? toUnit : Object.keys(currentCategoryUnits)[1] || safeFromUnit;

  const baseVal = currentCategoryUnits[safeFromUnit].toBase(unitValFrom);
  const convertedVal = currentCategoryUnits[safeToUnit].fromBase(baseVal);

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

      {/* ---------------- 1. AGE CALCULATOR ---------------- */}
      {toolKey === 'age' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Age Calculator & Birthday Countdown</h2>
              <p className="text-xs text-slate-500">Calculate exact chronological age in years, months, days, and next birthday.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={birthDateStr}
                  onChange={(e) => setBirthDateStr(e.target.value)}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age at the Date of</label>
                <input
                  type="date"
                  value={targetDateStr}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Exact Chronological Age</span>
                <div className="text-3xl sm:text-4xl font-black text-orange-400 font-mono mt-1">
                  {ageYears} Years, {ageMonths} Months, {ageDays} Days
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Countdown to Next Birthday:</span>
                    <span className="font-mono font-bold text-emerald-400">{daysToNextBday} days</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Weeks Lived:</span>
                    <span className="font-mono font-bold text-white">{totalWeeks.toLocaleString()} weeks</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Days Lived:</span>
                    <span className="font-mono font-bold text-white">{totalDays.toLocaleString()} days</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Approximate Hours:</span>
                    <span className="font-mono font-bold text-white">{totalHours.toLocaleString()} hours</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Born on {bDate.toLocaleDateString('en-US', { weekday: 'long' })}.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. DATE CALCULATOR ---------------- */}
      {toolKey === 'date' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Date Calculator</h2>
              <p className="text-xs text-slate-500">Calculate duration between two dates, or add/subtract days from a date.</p>
            </div>
          </div>

          {/* Section 1: Days Between */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              1. Days Between Two Dates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={date1Str}
                  onChange={(e) => setDate1Str(e.target.value)}
                  className="calc-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={date2Str}
                  onChange={(e) => setDate2Str(e.target.value)}
                  className="calc-input"
                />
              </div>
              <div className="bg-slate-900 text-white rounded-xl p-4 text-center">
                <span className="text-[11px] text-slate-400">Total Difference</span>
                <div className="text-2xl font-black text-blue-400 font-mono mt-0.5">
                  {diffDays} Days
                </div>
                <div className="text-[11px] text-slate-300 font-mono mt-0.5">{diffWeeks} Weeks</div>
              </div>
            </div>
          </div>

          {/* Section 2: Add/Subtract */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              2. Add or Subtract Days from Date
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Date</label>
                <input
                  type="date"
                  value={date1Str}
                  onChange={(e) => setDate1Str(e.target.value)}
                  className="calc-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operation</label>
                <select
                  value={addMode}
                  onChange={(e) => setAddMode(e.target.value as any)}
                  className="calc-input"
                >
                  <option value="add">Add (+)</option>
                  <option value="subtract">Subtract (−)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Number of Days</label>
                <input
                  type="number"
                  value={addDays}
                  onChange={(e) => setAddDays(Number(e.target.value))}
                  className="calc-input"
                />
              </div>
              <div className="bg-slate-900 text-white rounded-xl p-4 text-center">
                <span className="text-[11px] text-slate-400">Result Date</span>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5 leading-tight">
                  {formattedAddedDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. WORK HOURS CALCULATOR ---------------- */}
      {toolKey === 'hours' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Work Hours & Timecard Calculator</h2>
              <p className="text-xs text-slate-500">Calculate total worked hours, lunch deductions, and paycheck gross pay.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time (Clock In)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time (Clock Out)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unpaid Break / Lunch (Minutes)</label>
                <input
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Pay Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Total Worked Time</span>
                <div className="text-3xl sm:text-4xl font-black text-purple-400 font-mono mt-1">
                  {workHours}h {workRemainderMins}m
                </div>

                <div className="mt-6 space-y-3 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Decimal Hours:</span>
                    <span className="font-mono font-bold text-white">{decimalHours.toFixed(2)} hours</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                    <span>Gross Paycheck:</span>
                    <span className="font-mono text-emerald-400 text-lg font-bold">
                      ${totalGrossPay.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Automatic overnight wrap-around supported if end time is past midnight.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. TIP CALCULATOR ---------------- */}
      {toolKey === 'tip' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Tip & Bill Splitter Calculator</h2>
              <p className="text-xs text-slate-500">Calculate gratuity and split restaurant checks evenly among friends.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bill Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(Number(e.target.value))}
                  className="calc-input text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tip Percentage</label>
                <div className="grid grid-cols-5 gap-2">
                  {[10, 15, 18, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setTipPercent(pct)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        tipPercent === pct
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Split Between (People)</label>
                <input
                  type="number"
                  min={1}
                  value={splitCount}
                  onChange={(e) => setSplitCount(Math.max(1, Number(e.target.value)))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Total per Person</span>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-1">
                  ${totalPerPerson.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal"> / person</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Tip per Person:</span>
                    <span className="font-mono font-bold text-white">${tipPerPerson.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Gratuity ({tipPercent}%):</span>
                    <span className="font-mono font-bold text-white">${tipAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                    <span>Grand Total Bill:</span>
                    <span className="font-mono text-emerald-400 text-base font-bold">
                      ${totalBillWithTip.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Split evenly among {splitCount} {splitCount === 1 ? 'person' : 'people'}.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. UNIT CONVERTER ---------------- */}
      {toolKey === 'unit-converter' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Universal Unit Converter</h2>
              <p className="text-xs text-slate-500">Fast conversion between metric and imperial units across length, weight, temperature, and data.</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-100">
            {(Object.keys(UNIT_DEFINITIONS) as UnitCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setUnitCategory(cat);
                  const firstUnit = Object.keys(UNIT_DEFINITIONS[cat].units)[0];
                  const secondUnit = Object.keys(UNIT_DEFINITIONS[cat].units)[1] || firstUnit;
                  setFromUnit(firstUnit);
                  setToUnit(secondUnit);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  unitCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {UNIT_DEFINITIONS[cat].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Input From */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">From Value</label>
                <input
                  type="number"
                  value={unitValFrom}
                  onChange={(e) => setUnitValFrom(Number(e.target.value))}
                  className="calc-input text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">From Unit</label>
                <select
                  value={safeFromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="calc-input"
                >
                  {Object.entries(currentCategoryUnits).map(([key, def]) => (
                    <option key={key} value={key}>
                      {def.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setFromUnit(safeToUnit);
                    setToUnit(safeFromUnit);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Swap From and To Units</span>
                </button>
              </div>
            </div>

            {/* Output To */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-400 mb-1">To Unit</label>
                  <select
                    value={safeToUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="calc-input bg-slate-800 text-white border-slate-700"
                  >
                    {Object.entries(currentCategoryUnits).map(([key, def]) => (
                      <option key={key} value={key}>
                        {def.name}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-semibold text-slate-400">Converted Value</span>
                <div className="text-3xl sm:text-4xl font-black text-teal-400 font-mono mt-1 break-all">
                  {Number.isFinite(convertedVal) ? Math.round(convertedVal * 1e6) / 1e6 : '—'}
                </div>
              </div>

              <div className="text-xs text-slate-400 mt-6 pt-3 border-t border-slate-800">
                1 {currentCategoryUnits[safeFromUnit].name} ={' '}
                {(
                  currentCategoryUnits[safeToUnit].fromBase(currentCategoryUnits[safeFromUnit].toBase(1))
                ).toFixed(4)}{' '}
                {currentCategoryUnits[safeToUnit].name}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .calc-input {
          width: 100%;
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
