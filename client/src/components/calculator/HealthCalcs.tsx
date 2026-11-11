import React, { useState } from 'react';
import { Scale, HeartPulse, Activity, ArrowLeft, Flame, Award, AlertTriangle, Info } from 'lucide-react';
import { CalculatorKey } from './types';

interface HealthCalcsProps {
  toolKey: CalculatorKey;
  onBack?: () => void;
}

export const HealthCalcs: React.FC<HealthCalcsProps> = ({ toolKey, onBack }) => {
  // UNIT MODE: 'metric' (kg, cm) vs 'us' (lbs, feet/inches)
  const [unitMode, setUnitMode] = useState<'metric' | 'us'>('metric');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(28);

  // Common measurements
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightLbs, setWeightLbs] = useState<number>(154);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(9);

  // Synchronized unit helpers to ensure metric and US state never desync
  const updateMetricHeight = (cm: number) => {
    const safeCm = Math.max(0, cm);
    setHeightCm(safeCm);
    const totalIn = safeCm / 2.54;
    setHeightFeet(Math.floor(totalIn / 12));
    setHeightInches(Math.round(totalIn % 12));
  };

  const updateUsHeight = (ft: number, inc: number) => {
    const safeFt = Math.max(0, ft);
    const safeIn = Math.max(0, inc);
    setHeightFeet(safeFt);
    setHeightInches(safeIn);
    setHeightCm(Math.round((safeFt * 12 + safeIn) * 2.54));
  };

  const updateMetricWeight = (kg: number) => {
    const safeKg = Math.max(0, kg);
    setWeightKg(safeKg);
    setWeightLbs(Math.round(safeKg * 2.20462262));
  };

  const updateUsWeight = (lbs: number) => {
    const safeLbs = Math.max(0, lbs);
    setWeightLbs(safeLbs);
    setWeightKg(Math.round(safeLbs * 0.45359237 * 10) / 10);
  };

  // Calorie & TDEE activity factor
  const [activityLevel, setActivityLevel] = useState<number>(1.375); // Light exercise

  // Body Fat circumference measurements (cm)
  const [waistCm, setWaistCm] = useState<number>(82);
  const [neckCm, setNeckCm] = useState<number>(38);
  const [hipCm, setHipCm] = useState<number>(95); // for female

  // Pace Calculator
  const [paceDistanceKm, setPaceDistanceKm] = useState<number>(10);
  const [paceHours, setPaceHours] = useState<number>(0);
  const [paceMinutes, setPaceMinutes] = useState<number>(50);
  const [paceSeconds, setPaceSeconds] = useState<number>(0);

  // Effective metric values
  const effectiveHeightCm = Math.max(0, heightCm);
  const effectiveWeightKg = Math.max(0, weightKg);

  // 1. BMI CALCULATION
  const heightMeters = effectiveHeightCm / 100;
  const isValidBmiInputs = heightMeters > 0.4 && effectiveWeightKg > 5;
  const bmi = isValidBmiInputs ? effectiveWeightKg / (heightMeters * heightMeters) : 0;
  let bmiCategory = 'Normal weight';
  let bmiColor = 'text-emerald-400';
  let bmiBg = 'bg-emerald-500/20';
  if (!isValidBmiInputs) {
    bmiCategory = 'Enter measurements';
    bmiColor = 'text-slate-400';
    bmiBg = 'bg-slate-500/20';
  } else if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = 'text-blue-400';
    bmiBg = 'bg-blue-500/20';
  } else if (bmi < 25.0) {
    bmiCategory = 'Normal weight';
    bmiColor = 'text-emerald-400';
    bmiBg = 'bg-emerald-500/20';
  } else if (bmi < 30.0) {
    bmiCategory = 'Overweight';
    bmiColor = 'text-yellow-400';
    bmiBg = 'bg-yellow-500/20';
  } else {
    bmiCategory = 'Obese';
    bmiColor = 'text-red-400';
    bmiBg = 'bg-red-500/20';
  }
  const minNormalWeight = heightMeters > 0 ? 18.5 * heightMeters * heightMeters : 0;
  const maxNormalWeight = heightMeters > 0 ? 24.9 * heightMeters * heightMeters : 0;

  // 2. BMR (Mifflin-St Jeor & Harris-Benedict)
  const validBioInputs = effectiveWeightKg > 0 && effectiveHeightCm > 0 && age > 0;
  const bmr = validBioInputs
    ? gender === 'male'
      ? 10 * effectiveWeightKg + 6.25 * effectiveHeightCm - 5 * age + 5
      : 10 * effectiveWeightKg + 6.25 * effectiveHeightCm - 5 * age - 161
    : 0;

  const bmrHarrisBenedict = validBioInputs
    ? gender === 'male'
      ? 88.362 + 13.397 * effectiveWeightKg + 4.799 * effectiveHeightCm - 5.677 * age
      : 447.593 + 9.247 * effectiveWeightKg + 3.098 * effectiveHeightCm - 4.33 * age
    : 0;

  // 3. TDEE & CALORIES
  const tdee = Math.round(bmr * activityLevel);
  const minSafeIntake = gender === 'female' ? 1200 : 1500;

  // 4. BODY FAT % (US Navy Formula)
  let bodyFatPct = 0;
  let bodyFatError: string | null = null;
  if (effectiveHeightCm <= 0) {
    bodyFatError = 'Please enter a valid height.';
  } else if (gender === 'male') {
    if (waistCm <= neckCm) {
      bodyFatError = 'Waist circumference must be greater than neck circumference.';
    } else {
      const denom = 1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(effectiveHeightCm);
      bodyFatPct = denom > 0 ? 495 / denom - 450 : 0;
    }
  } else {
    if (waistCm + hipCm <= neckCm) {
      bodyFatError = 'Waist + hip circumference must be greater than neck circumference.';
    } else {
      const denom = 1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(effectiveHeightCm);
      bodyFatPct = denom > 0 ? 495 / denom - 450 : 0;
    }
  }
  if (!bodyFatError) {
    bodyFatPct = Math.max(2, Math.min(65, bodyFatPct));
  }
  const fatMassKg = (effectiveWeightKg * bodyFatPct) / 100;
  const leanMassKg = Math.max(0, effectiveWeightKg - fatMassKg);

  // 5. IDEAL BODY WEIGHT (Devine, Robinson, Miller, Hamwi)
  const totalInches = effectiveHeightCm / 2.54;
  const inchesOver5Ft = totalInches - 60;
  const idealDevine = validBioInputs
    ? Math.max(25, gender === 'male' ? 50 + 2.3 * inchesOver5Ft : 45.5 + 2.3 * inchesOver5Ft)
    : 0;
  const idealRobinson = validBioInputs
    ? Math.max(25, gender === 'male' ? 52 + 1.9 * inchesOver5Ft : 49 + 1.7 * inchesOver5Ft)
    : 0;
  const idealMiller = validBioInputs
    ? Math.max(25, gender === 'male' ? 56.2 + 1.41 * inchesOver5Ft : 53.1 + 1.36 * inchesOver5Ft)
    : 0;
  const idealHamwi = validBioInputs
    ? Math.max(25, gender === 'male' ? 48.0 + 2.7 * inchesOver5Ft : 45.5 + 2.2 * inchesOver5Ft)
    : 0;

  // 6. PACE CALCULATION
  const totalSeconds = Math.max(0, paceHours) * 3600 + Math.max(0, paceMinutes) * 60 + Math.max(0, paceSeconds);
  const paceSecPerKm = paceDistanceKm > 0 && totalSeconds > 0 ? totalSeconds / paceDistanceKm : 0;
  const totalPaceSecKmRounded = Math.round(paceSecPerKm);
  const paceMinKm = Math.floor(totalPaceSecKmRounded / 60);
  const paceRemainderSecKm = totalPaceSecKmRounded % 60;

  const paceSecPerMile = paceSecPerKm * 1.609344;
  const totalPaceSecMileRounded = Math.round(paceSecPerMile);
  const paceMinMile = Math.floor(totalPaceSecMileRounded / 60);
  const paceRemainderSecMile = totalPaceSecMileRounded % 60;
  const speedKmh = paceDistanceKm > 0 && totalSeconds > 0 ? paceDistanceKm / (totalSeconds / 3600) : 0;

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

      {/* ---------------- 1. BMI CALCULATOR ---------------- */}
      {toolKey === 'bmi' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">BMI Calculator</h2>
                <p className="text-xs text-slate-500">Calculate Body Mass Index and healthy weight target range.</p>
              </div>
            </div>

            {/* Units Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setUnitMode('metric')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  unitMode === 'metric' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                }`}
              >
                Metric (kg/cm)
              </button>
              <button
                onClick={() => setUnitMode('us')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  unitMode === 'us' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                }`}
              >
                US Units (lbs/ft)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="calc-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              {unitMode === 'metric' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => updateMetricHeight(Number(e.target.value))}
                      className="calc-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => updateMetricWeight(Number(e.target.value))}
                      className="calc-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Height (Feet)</label>
                      <input
                        type="number"
                        value={heightFeet}
                        onChange={(e) => updateUsHeight(Number(e.target.value), heightInches)}
                        className="calc-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Height (Inches)</label>
                      <input
                        type="number"
                        value={heightInches}
                        onChange={(e) => updateUsHeight(heightFeet, Number(e.target.value))}
                        className="calc-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Weight (lbs)</label>
                    <input
                      type="number"
                      value={weightLbs}
                      onChange={(e) => updateUsWeight(Number(e.target.value))}
                      className="calc-input"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Your Body Mass Index (BMI)</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                    {bmi.toFixed(1)}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bmiBg} ${bmiColor}`}>
                    {bmiCategory}
                  </span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Healthy BMI Range:</span>
                    <span className="font-mono text-emerald-400 font-bold">18.5 – 24.9 kg/m²</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Ideal Weight for Your Height:</span>
                    <span className="font-mono text-white font-bold">
                      {unitMode === 'metric'
                        ? `${minNormalWeight.toFixed(1)} kg – ${maxNormalWeight.toFixed(1)} kg`
                        : `${(minNormalWeight * 2.20462).toFixed(1)} lbs – ${(maxNormalWeight * 2.20462).toFixed(1)} lbs`}
                    </span>
                  </div>
                </div>

                {/* Visual BMI scale bar */}
                <div className="mt-6">
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
                    <div className="bg-blue-500 w-[18.5%]" title="Underweight" />
                    <div className="bg-emerald-500 w-[25%]" title="Normal" />
                    <div className="bg-yellow-500 w-[20%]" title="Overweight" />
                    <div className="bg-red-500 flex-1" title="Obese" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>18.5</span>
                    <span>25.0</span>
                    <span>30.0</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                WHO Standards. For adults age 20+.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. CALORIE & TDEE CALCULATOR ---------------- */}
      {toolKey === 'calorie' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daily Calorie & TDEE Calculator</h2>
              <p className="text-xs text-slate-500">Calculate maintenance energy expenditure and weight loss targets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="calc-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => updateMetricHeight(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => updateMetricWeight(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(Number(e.target.value))}
                  className="calc-input"
                >
                  <option value={1.2}>Sedentary (Little or no exercise, desk job)</option>
                  <option value={1.375}>Light (Light exercise 1-3 days/week)</option>
                  <option value={1.55}>Moderate (Moderate exercise 3-5 days/week)</option>
                  <option value={1.725}>Active (Hard exercise 6-7 days/week)</option>
                  <option value={1.9}>Very Active (Hard daily workout & physical job)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Daily Maintenance Calories</span>
                <div className="text-3xl sm:text-4xl font-black text-orange-400 font-mono mt-1">
                  {tdee.toLocaleString()}
                  <span className="text-xs text-slate-400 font-normal"> kcal / day</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between items-center bg-slate-800/60 p-2 rounded-xl">
                    <span>Mild Weight Loss (-0.25 kg/wk):</span>
                    <span className="font-mono font-bold text-emerald-400">{Math.max(800, Math.round(tdee - 250))} kcal</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/60 p-2 rounded-xl">
                    <span>Standard Weight Loss (-0.5 kg/wk):</span>
                    <span className="font-mono font-bold text-yellow-400">{Math.max(800, Math.round(tdee - 500))} kcal</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/60 p-2 rounded-xl">
                    <span>Fast Weight Loss (-1.0 kg/wk):</span>
                    <span className="font-mono font-bold text-red-400">{Math.max(800, Math.round(tdee - 1000))} kcal</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/60 p-2 rounded-xl">
                    <span>Muscle Surplus (+0.25 kg/wk):</span>
                    <span className="font-mono font-bold text-purple-400">{Math.round(tdee + 300)} kcal</span>
                  </div>
                </div>

                {Math.round(tdee - 1000) < minSafeIntake && (
                  <div className="mt-4 p-3 bg-red-950/80 border border-red-800 rounded-xl flex items-start gap-2 text-[11px] text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      Notice: Calorie targets below {minSafeIntake} kcal/day for {gender}s should only be undertaken under direct clinical guidance.
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Basal Metabolic Rate (BMR): {Math.round(bmr)} kcal/day at total rest.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. BODY FAT % CALCULATOR ---------------- */}
      {toolKey === 'body-fat' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Body Fat % Calculator (US Navy Method)</h2>
              <p className="text-xs text-slate-500">Calculate body fat percentage and lean muscle mass.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="calc-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => updateMetricWeight(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => updateMetricHeight(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Neck Circumference (cm)</label>
                  <input
                    type="number"
                    value={neckCm}
                    onChange={(e) => setNeckCm(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Waist Circumference (cm)</label>
                <input
                  type="number"
                  value={waistCm}
                  onChange={(e) => setWaistCm(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              {gender === 'female' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hip Circumference (cm)</label>
                  <input
                    type="number"
                    value={hipCm}
                    onChange={(e) => setHipCm(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Estimated Body Fat</span>
                {bodyFatError ? (
                  <div className="mt-3 p-3 bg-red-950/80 border border-red-800 rounded-xl flex items-start gap-2 text-xs text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{bodyFatError}</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl sm:text-4xl font-black text-violet-400 font-mono mt-1">
                      {bodyFatPct.toFixed(1)}%
                    </div>

                    <div className="mt-6 space-y-3 text-xs border-t border-slate-800 pt-4">
                      <div className="flex justify-between text-slate-300">
                        <span>Total Fat Mass:</span>
                        <span className="font-mono font-bold text-yellow-400">{fatMassKg.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Lean Body Mass:</span>
                        <span className="font-mono font-bold text-emerald-400">{leanMassKg.toFixed(1)} kg</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3 flex">
                        <div className="bg-yellow-400 h-full" style={{ width: `${bodyFatPct}%` }} />
                        <div className="bg-emerald-500 h-full flex-1" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Official U.S. Navy circumference method.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. BMR CALCULATOR ---------------- */}
      {toolKey === 'bmr' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">BMR Calculator (Basal Metabolic Rate)</h2>
              <p className="text-xs text-slate-500">Calculate resting calories needed for basic life-sustaining functions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="calc-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Basal Metabolic Rate</span>
                <div className="text-3xl sm:text-4xl font-black text-pink-400 font-mono mt-1">
                  {Math.round(bmr).toLocaleString()}
                  <span className="text-xs text-slate-400 font-normal"> kcal / day</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Sedentary (BMR × 1.2):</span>
                    <span className="font-mono font-bold text-white">{Math.round(bmr * 1.2)} kcal</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Light Exercise (BMR × 1.375):</span>
                    <span className="font-mono font-bold text-white">{Math.round(bmr * 1.375)} kcal</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Moderate Exercise (BMR × 1.55):</span>
                    <span className="font-mono font-bold text-white">{Math.round(bmr * 1.55)} kcal</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Heavy Exercise (BMR × 1.725):</span>
                    <span className="font-mono font-bold text-white">{Math.round(bmr * 1.725)} kcal</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Mifflin-St Jeor Equation (Widely considered the most accurate medical standard).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. IDEAL BODY WEIGHT ---------------- */}
      {toolKey === 'ideal-weight' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ideal Body Weight Calculator</h2>
              <p className="text-xs text-slate-500">Compare ideal weight ranges across major clinical formulas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="calc-input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Devine Formula Target</span>
                <div className="text-3xl sm:text-4xl font-black text-teal-400 font-mono mt-1">
                  {idealDevine.toFixed(1)} kg
                  <span className="text-xs text-slate-400 font-normal"> ({(idealDevine * 2.20462).toFixed(1)} lbs)</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Robinson Formula (1983):</span>
                    <span className="font-mono font-bold text-white">{idealRobinson.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Miller Formula (1983):</span>
                    <span className="font-mono font-bold text-white">{idealMiller.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Hamwi Formula (1964):</span>
                    <span className="font-mono font-bold text-white">{idealHamwi.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Healthy WHO BMI Range:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {minNormalWeight.toFixed(1)} – {maxNormalWeight.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Clinical formulas developed for pharmacological dosing and target health ranges.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 6. PACE CALCULATOR ---------------- */}
      {toolKey === 'pace' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Running & Walking Pace Calculator</h2>
              <p className="text-xs text-slate-500">Calculate running pace, splits, and speed for 5k, 10k, and marathons.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Distance (km)</label>
                <div className="flex gap-2 mb-2">
                  {[
                    { label: '5 km', d: 5 },
                    { label: '10 km', d: 10 },
                    { label: 'Half Marathon (21.1)', d: 21.0975 },
                    { label: 'Marathon (42.2)', d: 42.195 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setPaceDistanceKm(p.d)}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={paceDistanceKm}
                  onChange={(e) => setPaceDistanceKm(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Time (Hours : Minutes : Seconds)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="HH"
                    value={paceHours}
                    onChange={(e) => setPaceHours(Number(e.target.value))}
                    className="calc-input text-center"
                  />
                  <input
                    type="number"
                    placeholder="MM"
                    value={paceMinutes}
                    onChange={(e) => setPaceMinutes(Number(e.target.value))}
                    className="calc-input text-center"
                  />
                  <input
                    type="number"
                    placeholder="SS"
                    value={paceSeconds}
                    onChange={(e) => setPaceSeconds(Number(e.target.value))}
                    className="calc-input text-center"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Pace per Kilometer</span>
                <div className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono mt-1">
                  {paceMinKm}:{paceRemainderSecKm.toString().padStart(2, '0')}
                  <span className="text-xs text-slate-400 font-normal"> / km</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Pace per Mile:</span>
                    <span className="font-mono font-bold text-white">
                      {paceMinMile}:{paceRemainderSecMile.toString().padStart(2, '0')} / mile
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Average Speed:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {speedKmh.toFixed(2)} km/h ({(speedKmh * 0.621371).toFixed(2)} mph)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Calculated over {paceDistanceKm.toFixed(2)} km distance.
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
