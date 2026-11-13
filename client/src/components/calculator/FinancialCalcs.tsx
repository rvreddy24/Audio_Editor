import React, { useState } from 'react';
import { DollarSign, ArrowLeft, TrendingUp, Calendar, PieChart, ShieldCheck } from 'lucide-react';
import { CalculatorKey, parseCalcInput } from './types';

interface FinancialCalcsProps {
  toolKey: CalculatorKey;
  onBack?: () => void;
}

export const FinancialCalcs: React.FC<FinancialCalcsProps> = ({ toolKey, onBack }) => {
  // 1. MORTGAGE STATE
  const [homePrice, setHomePrice] = useState<number | ''>(400000);
  const [downPayment, setDownPayment] = useState<number | ''>(80000);
  const [mortgageTermYears, setMortgageTermYears] = useState<number | ''>(30);
  const [mortgageRate, setMortgageRate] = useState<number | ''>(6.5);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState<number | ''>(4000);
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState<number | ''>(1200);

  // 2. LOAN STATE
  const [loanAmount, setLoanAmount] = useState<number | ''>(25000);
  const [loanTermMonths, setLoanTermMonths] = useState<number | ''>(36);
  const [loanRate, setLoanRate] = useState<number | ''>(7.9);

  // 3. AUTO LOAN STATE
  const [autoPrice, setAutoPrice] = useState<number | ''>(32000);
  const [autoDownPayment, setAutoDownPayment] = useState<number | ''>(5000);
  const [autoTradeIn, setAutoTradeIn] = useState<number | ''>(2000);
  const [autoRate, setAutoRate] = useState<number | ''>(5.9);
  const [autoTermMonths, setAutoTermMonths] = useState<number | ''>(60);
  const [autoSalesTaxRate, setAutoSalesTaxRate] = useState<number | ''>(7.0);

  // 4. COMPOUND INTEREST / INVESTMENT STATE
  const [initialPrincipal, setInitialPrincipal] = useState<number | ''>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number | ''>(500);
  const [investmentYears, setInvestmentYears] = useState<number | ''>(20);
  const [annualReturn, setAnnualReturn] = useState<number | ''>(8.0);
  const [compoundFreq, setCompoundFreq] = useState<number>(12); // 1 = Annually, 2 = Semi-Annually, 4 = Quarterly, 12 = Monthly, 365 = Daily

  // 5. RETIREMENT STATE
  const [currentAge, setCurrentAge] = useState<number | ''>(30);
  const [retireAge, setRetireAge] = useState<number | ''>(65);
  const [currentSavings, setCurrentSavings] = useState<number | ''>(50000);
  const [annualSavings, setAnnualSavings] = useState<number | ''>(12000);
  const [retireReturn, setRetireReturn] = useState<number | ''>(7.0);
  const [retireDrawdownPct, setRetireDrawdownPct] = useState<number | ''>(4.0);

  // Schedule display toggles
  const [showMortgageSchedule, setShowMortgageSchedule] = useState<boolean>(false);
  const [showLoanSchedule, setShowLoanSchedule] = useState<boolean>(false);

  // 6. SALARY STATE
  const [salaryMode, setSalaryMode] = useState<'annual' | 'hourly'>('annual');
  const [salaryAmount, setSalaryAmount] = useState<number | ''>(75000);
  const [hoursPerWeek, setHoursPerWeek] = useState<number | ''>(40);

  // -------------------------------------------------------------
  // CALCULATIONS
  // -------------------------------------------------------------

  // Mortgage Calculation
  const validHomePrice = Math.max(0, Number(homePrice) || 0);
  const validDownPayment = Math.max(0, Number(downPayment) || 0);
  const loanPrincipal = Math.max(0, validHomePrice - validDownPayment);
  const validMortgageRate = Math.max(0, Number(mortgageRate) || 0);
  const monthlyRate = validMortgageRate / 100 / 12;
  const numPayments = Math.max(1, (Number(mortgageTermYears) || 30) * 12);
  const monthlyPI =
    loanPrincipal <= 0
      ? 0
      : monthlyRate > 0
      ? (loanPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanPrincipal / numPayments;
  const monthlyTax = Math.max(0, Number(propertyTaxAnnual) || 0) / 12;
  const monthlyInsurance = Math.max(0, Number(homeInsuranceAnnual) || 0) / 12;
  const totalMonthlyMortgage = monthlyPI + monthlyTax + monthlyInsurance;
  const totalInterestMortgage = Math.max(0, monthlyPI * numPayments - loanPrincipal);
  const totalCostMortgage = monthlyPI * numPayments + Math.min(validDownPayment, validHomePrice);

  // Amortization Schedule (Year-by-Year breakdown)
  const mortgageAmortization = React.useMemo(() => {
    if (loanPrincipal <= 0 || monthlyPI <= 0) return [];
    const schedule: { year: number; startBal: number; principalPaid: number; interestPaid: number; endBal: number }[] = [];
    let currentBal = loanPrincipal;
    const totalYears = Math.min(40, Math.max(1, Number(mortgageTermYears) || 30));

    for (let y = 1; y <= totalYears && currentBal > 0.01; y++) {
      const startBal = currentBal;
      let yrPrincipal = 0;
      let yrInterest = 0;

      for (let m = 1; m <= 12 && currentBal > 0.01; m++) {
        const intPmt = currentBal * monthlyRate;
        const princPmt = Math.min(currentBal, Math.max(0, monthlyPI - intPmt));
        yrInterest += intPmt;
        yrPrincipal += princPmt;
        currentBal = Math.max(0, currentBal - princPmt);
      }

      schedule.push({
        year: y,
        startBal,
        principalPaid: yrPrincipal,
        interestPaid: yrInterest,
        endBal: currentBal,
      });
    }
    return schedule;
  }, [loanPrincipal, monthlyPI, monthlyRate, mortgageTermYears]);

  // Loan Calculation
  const validLoanAmount = Math.max(0, Number(loanAmount) || 0);
  const validLoanTerm = Math.max(1, Number(loanTermMonths) || 1);
  const validLoanRate = Math.max(0, Number(loanRate) || 0);
  const loanMonthlyRate = validLoanRate / 100 / 12;
  const monthlyLoanPayment =
    validLoanAmount <= 0
      ? 0
      : loanMonthlyRate > 0
      ? (validLoanAmount * (loanMonthlyRate * Math.pow(1 + loanMonthlyRate, validLoanTerm))) /
        (Math.pow(1 + loanMonthlyRate, validLoanTerm) - 1)
      : validLoanAmount / validLoanTerm;
  const totalLoanInterest = Math.max(0, monthlyLoanPayment * validLoanTerm - validLoanAmount);
  const totalLoanCost = monthlyLoanPayment * validLoanTerm;

  // Loan Payback Schedule
  const loanPaybackSchedule = React.useMemo(() => {
    if (validLoanAmount <= 0 || monthlyLoanPayment <= 0) return [];
    const schedule: { period: string; principalPaid: number; interestPaid: number; remainingBal: number }[] = [];
    let currentBal = validLoanAmount;
    const totalMonths = Math.min(120, validLoanTerm);
    const stepMonths = totalMonths <= 24 ? 3 : totalMonths <= 60 ? 6 : 12;
    let periodPrincipal = 0;
    let periodInterest = 0;

    for (let m = 1; m <= totalMonths && currentBal > 0.01; m++) {
      const intPmt = currentBal * loanMonthlyRate;
      const princPmt = Math.min(currentBal, Math.max(0, monthlyLoanPayment - intPmt));
      periodInterest += intPmt;
      periodPrincipal += princPmt;
      currentBal = Math.max(0, currentBal - princPmt);

      if (m % stepMonths === 0 || m === totalMonths) {
        schedule.push({
          period: `Month ${m}`,
          principalPaid: periodPrincipal,
          interestPaid: periodInterest,
          remainingBal: currentBal,
        });
        periodPrincipal = 0;
        periodInterest = 0;
      }
    }
    return schedule;
  }, [validLoanAmount, monthlyLoanPayment, loanMonthlyRate, validLoanTerm]);

  // Auto Loan Calculation
  const validAutoPrice = Math.max(0, Number(autoPrice) || 0);
  const validTradeIn = Math.max(0, Number(autoTradeIn) || 0);
  const validAutoDown = Math.max(0, Number(autoDownPayment) || 0);
  const validTaxRate = Math.max(0, Number(autoSalesTaxRate) || 0);
  const validAutoRate = Math.max(0, Number(autoRate) || 0);
  const validAutoTerm = Math.max(1, Number(autoTermMonths) || 1);

  const taxableAmount = Math.max(0, validAutoPrice - validTradeIn);
  const salesTax = (taxableAmount * validTaxRate) / 100;
  const totalDue = validAutoPrice + salesTax;
  const effectiveTradeIn = Math.min(validTradeIn, totalDue);
  const remainingAfterTradeIn = totalDue - effectiveTradeIn;
  const effectiveDownPayment = Math.min(validAutoDown, remainingAfterTradeIn);
  const totalAutoFinanced = Math.max(0, remainingAfterTradeIn - effectiveDownPayment);

  const autoMonthlyRate = validAutoRate / 100 / 12;
  const monthlyAutoPayment =
    totalAutoFinanced <= 0
      ? 0
      : autoMonthlyRate > 0
      ? (totalAutoFinanced * (autoMonthlyRate * Math.pow(1 + autoMonthlyRate, validAutoTerm))) /
        (Math.pow(1 + autoMonthlyRate, validAutoTerm) - 1)
      : totalAutoFinanced / validAutoTerm;
  const totalAutoInterest = Math.max(0, monthlyAutoPayment * validAutoTerm - totalAutoFinanced);
  const totalAutoCost = effectiveDownPayment + effectiveTradeIn + totalAutoFinanced + totalAutoInterest;

  // Compound Interest Calculation with Compounding Intervals
  const validPrincipal = Math.max(0, Number(initialPrincipal) || 0);
  const validContribution = Math.max(0, Number(monthlyContribution) || 0);
  const validYears = Math.max(0, Number(investmentYears) || 0);
  const numInvMonths = Math.round(validYears * 12);
  const validAnnualReturn = Math.max(0, Number(annualReturn) || 0) / 100;
  const totalDeposits = validPrincipal + validContribution * numInvMonths;
  let totalInvestmentValue = validPrincipal;

  if (numInvMonths > 0) {
    if (validAnnualReturn === 0) {
      totalInvestmentValue = totalDeposits;
    } else {
      const k = compoundFreq || 12;
      const fvPrincipal = validPrincipal * Math.pow(1 + validAnnualReturn / k, k * validYears);
      const effectiveMonthlyRate = Math.pow(1 + validAnnualReturn / k, k / 12) - 1;
      const fvDeposits =
        effectiveMonthlyRate > 0
          ? validContribution *
            ((Math.pow(1 + effectiveMonthlyRate, numInvMonths) - 1) / effectiveMonthlyRate) *
            (1 + effectiveMonthlyRate)
          : validContribution * numInvMonths;
      totalInvestmentValue = fvPrincipal + fvDeposits;
    }
  }
  const totalInvestmentInterest = Math.max(0, totalInvestmentValue - totalDeposits);

  // Retirement Calculation & Trajectory
  const validCurrentAge = Math.max(0, Number(currentAge) || 0);
  const validRetireAge = Math.max(0, Number(retireAge) || 0);
  const yearsToRetire = Math.max(0, validRetireAge - validCurrentAge);
  const validCurrentSavings = Math.max(0, Number(currentSavings) || 0);
  const validAnnualSavings = Math.max(0, Number(annualSavings) || 0);
  const retAnnualRate = Math.max(0, Number(retireReturn) || 0) / 100;
  const totalRetirementContributed = validCurrentSavings + validAnnualSavings * yearsToRetire;
  let retirementNestEgg = validCurrentSavings;
  if (yearsToRetire > 0) {
    if (retAnnualRate === 0) {
      retirementNestEgg = totalRetirementContributed;
    } else {
      retirementNestEgg =
        validCurrentSavings * Math.pow(1 + retAnnualRate, yearsToRetire) +
        validAnnualSavings *
          ((Math.pow(1 + retAnnualRate, yearsToRetire) - 1) / retAnnualRate) *
          (1 + retAnnualRate);
    }
  }

  // Drawdown Calculations
  const validDrawdownRate = Math.max(0, Number(retireDrawdownPct) || 0) / 100;
  const annualDrawdown = retirementNestEgg * validDrawdownRate;
  const safeMonthlyRetireIncome = annualDrawdown / 12;

  // Retirement Trajectory Milestones
  const retirementTrajectory = React.useMemo(() => {
    if (yearsToRetire <= 0) return [];
    const milestones: { age: number; balance: number; contributed: number }[] = [];
    const step = Math.max(5, Math.round(yearsToRetire / 4));
    for (let yr = 0; yr <= yearsToRetire; yr += step) {
      const cAge = validCurrentAge + yr;
      let bal = validCurrentSavings;
      const contrib = validCurrentSavings + validAnnualSavings * yr;
      if (yr > 0) {
        if (retAnnualRate === 0) {
          bal = contrib;
        } else {
          bal =
            validCurrentSavings * Math.pow(1 + retAnnualRate, yr) +
            validAnnualSavings *
              ((Math.pow(1 + retAnnualRate, yr) - 1) / retAnnualRate) *
              (1 + retAnnualRate);
        }
      }
      milestones.push({ age: cAge, balance: bal, contributed: contrib });
      if (yr + step > yearsToRetire && yr < yearsToRetire) {
        milestones.push({
          age: validRetireAge,
          balance: retirementNestEgg,
          contributed: totalRetirementContributed,
        });
        break;
      }
    }
    return milestones;
  }, [validCurrentAge, validRetireAge, yearsToRetire, validCurrentSavings, validAnnualSavings, retAnnualRate, retirementNestEgg, totalRetirementContributed]);

  // Salary Conversion
  const validHours = Math.max(1, Number(hoursPerWeek) || 0);
  const validSalary = Math.max(0, Number(salaryAmount) || 0);
  let annualVal = validSalary;
  let hourlyVal = 0;
  if (salaryMode === 'annual') {
    hourlyVal = validSalary / (validHours * 52);
  } else {
    hourlyVal = validSalary;
    annualVal = validSalary * validHours * 52;
  }
  const monthlySalary = annualVal / 12;
  const biWeeklySalary = annualVal / 26;
  const weeklySalary = annualVal / 52;
  const dailySalary = hourlyVal * 8;

  const formatCurrency = (n: number, showCents: boolean = false) => {
    if (!Number.isFinite(n) || isNaN(n)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: showCents ? 2 : 0,
      minimumFractionDigits: showCents ? 2 : 0,
    }).format(showCents ? Math.round(n * 100) / 100 : Math.round(n));
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

      {/* ---------------- 1. MORTGAGE CALCULATOR ---------------- */}
      {toolKey === 'mortgage' && (
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mortgage Calculator</h2>
              <p className="text-xs text-slate-500">Calculate monthly payment, interest, taxes, and loan payoff breakdown.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Home Purchase Price ($)</label>
                <input
                  type="number"
                  value={homePrice}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setHomePrice(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Down Payment ($)</label>
                <input
                  type="number"
                  value={downPayment}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDownPayment(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loan Term (Years)</label>
                  <select
                    value={mortgageTermYears}
                    onChange={(e) => setMortgageTermYears(parseCalcInput(e.target.value))}
                    className="calc-input"
                  >
                    <option value={30}>30 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={15}>15 Years</option>
                    <option value={10}>10 Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={mortgageRate}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setMortgageRate(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Property Tax ($/yr)</label>
                  <input
                    type="number"
                    value={propertyTaxAnnual}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setPropertyTaxAnnual(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Insurance ($/yr)</label>
                  <input
                    type="number"
                    value={homeInsuranceAnnual}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setHomeInsuranceAnnual(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Total Monthly Payment</span>
                <div className="text-3xl sm:text-4xl font-black text-orange-400 font-mono mt-1">
                  {formatCurrency(totalMonthlyMortgage, true)}
                  <span className="text-xs text-slate-400 font-normal"> / mo</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Principal & Interest:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(monthlyPI, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Property Taxes:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(monthlyTax, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Home Insurance:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(monthlyInsurance, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                    <span>Total Interest Paid:</span>
                    <span className="font-mono text-orange-400">{formatCurrency(totalInterestMortgage)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Overall Out-of-Pocket:</span>
                    <span className="font-mono text-white">{formatCurrency(totalCostMortgage)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Loan Amount: {formatCurrency(loanPrincipal)} • Term: {mortgageTermYears} years ({numPayments} payments)
              </div>
            </div>
          </div>

          {/* Amortization Schedule Toggle & Breakdown */}
          {mortgageAmortization.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Annual Amortization Schedule</h3>
                  <p className="text-xs text-slate-500">Yearly breakdown of principal reduction, interest paid, and remaining balance.</p>
                </div>
                <button
                  onClick={() => setShowMortgageSchedule(!showMortgageSchedule)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                >
                  {showMortgageSchedule ? 'Hide Amortization' : 'View Amortization Schedule'}
                </button>
              </div>

              {showMortgageSchedule && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Year</th>
                        <th className="p-3">Starting Balance</th>
                        <th className="p-3">Principal Paid</th>
                        <th className="p-3">Interest Paid</th>
                        <th className="p-3">Ending Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {mortgageAmortization.map((row) => (
                        <tr key={row.year} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">Year {row.year}</td>
                          <td className="p-3">{formatCurrency(row.startBal)}</td>
                          <td className="p-3 text-emerald-600 font-semibold">{formatCurrency(row.principalPaid)}</td>
                          <td className="p-3 text-orange-600">{formatCurrency(row.interestPaid)}</td>
                          <td className="p-3 font-semibold">{formatCurrency(row.endBal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- 2. LOAN CALCULATOR ---------------- */}
      {toolKey === 'loan' && (
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Personal & Business Loan Calculator</h2>
              <p className="text-xs text-slate-500">Calculate monthly EMI, interest schedule, and overall payback.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount ($)</label>
                <input
                  type="number"
                  value={loanAmount}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setLoanAmount(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loan Term (Months)</label>
                <input
                  type="number"
                  value={loanTermMonths}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setLoanTermMonths(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setLoanRate(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Monthly Payment</span>
                <div className="text-3xl sm:text-4xl font-black text-blue-400 font-mono mt-1">
                  {formatCurrency(monthlyLoanPayment, true)}
                  <span className="text-xs text-slate-400 font-normal"> / mo</span>
                </div>

                <div className="mt-6 space-y-3 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Principal Financed:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(Number(loanAmount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Interest to Pay:</span>
                    <span className="font-mono font-bold text-orange-400">{formatCurrency(totalLoanInterest)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                    <span>Total Amount Repaid:</span>
                    <span className="font-mono text-white text-sm">{formatCurrency(totalLoanCost)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Total duration: {Number(loanTermMonths) || 0} months ({((Number(loanTermMonths) || 0) / 12).toFixed(1)} years)
              </div>
            </div>
          </div>

          {/* Loan Payback Schedule */}
          {loanPaybackSchedule.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Loan Payoff Schedule</h3>
                  <p className="text-xs text-slate-500">Milestone breakdown of principal repayment and outstanding balance.</p>
                </div>
                <button
                  onClick={() => setShowLoanSchedule(!showLoanSchedule)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  {showLoanSchedule ? 'Hide Schedule' : 'View Payoff Schedule'}
                </button>
              </div>

              {showLoanSchedule && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Period</th>
                        <th className="p-3">Principal Repaid</th>
                        <th className="p-3">Interest Paid</th>
                        <th className="p-3">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {loanPaybackSchedule.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{row.period}</td>
                          <td className="p-3 text-emerald-600 font-semibold">{formatCurrency(row.principalPaid)}</td>
                          <td className="p-3 text-orange-600">{formatCurrency(row.interestPaid)}</td>
                          <td className="p-3 font-semibold">{formatCurrency(row.remainingBal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- 3. AUTO LOAN CALCULATOR ---------------- */}
      {toolKey === 'auto-loan' && (
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Auto Loan Calculator</h2>
              <p className="text-xs text-slate-500">Calculate car financing with trade-in, down payment, and sales tax.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Price ($)</label>
                <input
                  type="number"
                  value={autoPrice}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAutoPrice(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Down Payment ($)</label>
                  <input
                    type="number"
                    value={autoDownPayment}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setAutoDownPayment(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trade-in Value ($)</label>
                  <input
                    type="number"
                    value={autoTradeIn}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setAutoTradeIn(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={autoRate}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setAutoRate(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Term (Months)</label>
                  <select
                    value={autoTermMonths}
                    onChange={(e) => setAutoTermMonths(parseCalcInput(e.target.value))}
                    className="calc-input"
                  >
                    <option value={36}>36 Months (3 yrs)</option>
                    <option value={48}>48 Months (4 yrs)</option>
                    <option value={60}>60 Months (5 yrs)</option>
                    <option value={72}>72 Months (6 yrs)</option>
                    <option value={84}>84 Months (7 yrs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sales Tax (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={autoSalesTaxRate}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAutoSalesTaxRate(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Monthly Auto Payment</span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
                  {formatCurrency(monthlyAutoPayment, true)}
                  <span className="text-xs text-slate-400 font-normal"> / mo</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Financed:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(totalAutoFinanced)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Sales Tax:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(salesTax)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Finance Interest:</span>
                    <span className="font-mono text-orange-400 font-bold">{formatCurrency(totalAutoInterest)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                    <span>Total Vehicle Cost:</span>
                    <span className="font-mono text-white text-sm">{formatCurrency(totalAutoCost)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Total Paid = Down Payment + Trade-in + Monthly Payments
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. COMPOUND INTEREST ---------------- */}
      {toolKey === 'compound-interest' && (
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Compound Interest & Investment Calculator</h2>
              <p className="text-xs text-slate-500">Calculate future portfolio growth with recurring deposits and compound returns.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Starting Principal ($)</label>
                <input
                  type="number"
                  value={initialPrincipal}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setInitialPrincipal(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Contribution ($)</label>
                <input
                  type="number"
                  value={monthlyContribution}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMonthlyContribution(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years to Grow</label>
                  <input
                    type="number"
                    value={investmentYears}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setInvestmentYears(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Return (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={annualReturn}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setAnnualReturn(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Compounding Frequency</label>
                <select
                  value={compoundFreq}
                  onChange={(e) => setCompoundFreq(Number(e.target.value))}
                  className="calc-input"
                >
                  <option value={12}>Monthly (12 times / year)</option>
                  <option value={4}>Quarterly (4 times / year)</option>
                  <option value={2}>Semi-Annually (2 times / year)</option>
                  <option value={1}>Annually (1 time / year)</option>
                  <option value={365}>Daily (365 times / year)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Future Balance in {investmentYears} Years</span>
                <div className="text-3xl sm:text-4xl font-black text-purple-400 font-mono mt-1">
                  {formatCurrency(totalInvestmentValue)}
                </div>

                <div className="mt-6 space-y-3 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Principal Contributed:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(totalDeposits)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Compound Growth (Net Profit):</span>
                    <span className="font-mono font-bold text-emerald-400">+{formatCurrency(totalInvestmentInterest)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Growth / Net Profit Margin:</span>
                    <span className="font-mono font-bold text-purple-300">
                      {totalInvestmentValue > 0 ? ((totalInvestmentInterest / totalInvestmentValue) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3 flex">
                    <div
                      className="bg-purple-500 h-full"
                      style={{
                        width: `${
                          totalInvestmentValue > 0
                            ? Math.min(100, (totalDeposits / totalInvestmentValue) * 100)
                            : 100
                        }%`,
                      }}
                    />
                    <div className="bg-emerald-400 h-full flex-1" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>
                      ■ Capital (
                      {totalInvestmentValue > 0
                        ? Math.round((totalDeposits / totalInvestmentValue) * 100)
                        : 100}
                      %)
                    </span>
                    <span>
                      ■ Net Profit (
                      {totalInvestmentValue > 0
                        ? Math.round((totalInvestmentInterest / totalInvestmentValue) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Compounded {compoundFreq === 12 ? 'monthly' : compoundFreq === 4 ? 'quarterly' : compoundFreq === 2 ? 'semi-annually' : compoundFreq === 1 ? 'annually' : 'daily'}.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. RETIREMENT PLANNER ---------------- */}
      {toolKey === 'retirement' && (
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Retirement Nest Egg Planner</h2>
              <p className="text-xs text-slate-500">Plan your 401(k), IRA, savings trajectory, and annual drawdown for financial freedom.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Age</label>
                  <input
                    type="number"
                    value={currentAge}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setCurrentAge(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Retirement Age</label>
                  <input
                    type="number"
                    value={retireAge}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  onChange={(e) => setRetireAge(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Savings & 401(k) ($)</label>
                <input
                  type="number"
                  value={currentSavings}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCurrentSavings(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Annual Savings Contribution ($/yr)</label>
                <input
                  type="number"
                  value={annualSavings}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAnnualSavings(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Return (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={retireReturn}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRetireReturn(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual Drawdown Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={retireDrawdownPct}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRetireDrawdownPct(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Total Nest Egg at Age {retireAge}</span>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-1">
                  {formatCurrency(retirementNestEgg)}
                </div>

                <div className="mt-6 space-y-3 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Annual Safe Drawdown ({Number(retireDrawdownPct) || 4}%):</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(annualDrawdown)} / yr
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Monthly Safe Income:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatCurrency(safeMonthlyRetireIncome, true)} / mo
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Contributed By You:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(totalRetirementContributed)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Investment Earnings:</span>
                    <span className="font-mono font-bold text-amber-400">
                      +{formatCurrency(Math.max(0, retirementNestEgg - totalRetirementContributed))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Based on {yearsToRetire} years of compounding growth at {retireReturn}% annual return.
              </div>
            </div>
          </div>

          {/* Savings Trajectory Table */}
          {retirementTrajectory.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Projected Savings Trajectory</h3>
              <p className="text-xs text-slate-500 mb-4">Milestone forecast of your nest egg accumulation over time.</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Milestone Age</th>
                      <th className="p-3">Total Portfolio</th>
                      <th className="p-3">Total Contributed</th>
                      <th className="p-3">Compound Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {retirementTrajectory.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">Age {row.age} {row.age === Number(retireAge) ? '(Retirement)' : ''}</td>
                        <td className="p-3 text-amber-600 font-bold">{formatCurrency(row.balance)}</td>
                        <td className="p-3">{formatCurrency(row.contributed)}</td>
                        <td className="p-3 text-emerald-600 font-semibold">+{formatCurrency(Math.max(0, row.balance - row.contributed))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 6. SALARY CALCULATOR ---------------- */}
      {toolKey === 'salary' && (
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Salary & Hourly Paycheck Calculator</h2>
              <p className="text-xs text-slate-500">Convert effortlessly between annual salary, monthly, bi-weekly, and hourly pay.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pay Input Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (salaryMode !== 'annual') {
                        setSalaryMode('annual');
                        setSalaryAmount(Math.round(Number(salaryAmount) * (Number(hoursPerWeek) || 40) * 52));
                      }
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      salaryMode === 'annual'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Annual Salary ($)
                  </button>
                  <button
                    onClick={() => {
                      if (salaryMode !== 'hourly') {
                        setSalaryMode('hourly');
                        setSalaryAmount(Math.round((Number(salaryAmount) / ((Number(hoursPerWeek) || 40) * 52)) * 100) / 100);
                      }
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      salaryMode === 'hourly'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Hourly Wage ($/hr)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {salaryMode === 'annual' ? 'Annual Base Salary ($)' : 'Hourly Wage ($/hr)'}
                </label>
                <input
                  type="number"
                  value={salaryAmount}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setSalaryAmount(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Working Hours per Week</label>
                <input
                  type="number"
                  value={hoursPerWeek}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setHoursPerWeek(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Equivalent Hourly Rate</span>
                <div className="text-3xl sm:text-4xl font-black text-rose-400 font-mono mt-1">
                  ${hourlyVal.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal"> / hour</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Daily Pay (8 hrs):</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(dailySalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Weekly Pay ({hoursPerWeek} hrs):</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(weeklySalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Bi-Weekly Paycheck:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(biWeeklySalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Monthly Gross Pay:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(monthlySalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-semibold">
                    <span>Annual Gross Salary:</span>
                    <span className="font-mono text-rose-400 text-sm">{formatCurrency(annualVal)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Assumes 52 work weeks per year and {hoursPerWeek} hours/week standard.
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
