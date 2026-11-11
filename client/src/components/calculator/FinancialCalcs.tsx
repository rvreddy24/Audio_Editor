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

  // 5. RETIREMENT STATE
  const [currentAge, setCurrentAge] = useState<number | ''>(30);
  const [retireAge, setRetireAge] = useState<number | ''>(65);
  const [currentSavings, setCurrentSavings] = useState<number | ''>(50000);
  const [annualSavings, setAnnualSavings] = useState<number | ''>(12000);
  const [retireReturn, setRetireReturn] = useState<number | ''>(7.0);

  // 6. SALARY STATE
  const [salaryMode, setSalaryMode] = useState<'annual' | 'hourly'>('annual');
  const [salaryAmount, setSalaryAmount] = useState<number | ''>(75000);
  const [hoursPerWeek, setHoursPerWeek] = useState<number | ''>(40);

  // -------------------------------------------------------------
  // CALCULATIONS
  // -------------------------------------------------------------

  // Mortgage Calculation
  const validHomePrice = Math.max(0, homePrice || 0);
  const validDownPayment = Math.max(0, downPayment || 0);
  const loanPrincipal = Math.max(0, validHomePrice - validDownPayment);
  const validMortgageRate = Math.max(0, mortgageRate || 0);
  const monthlyRate = validMortgageRate / 100 / 12;
  const numPayments = Math.max(1, (mortgageTermYears || 30) * 12);
  const monthlyPI =
    loanPrincipal <= 0
      ? 0
      : monthlyRate > 0
      ? (loanPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanPrincipal / numPayments;
  const monthlyTax = Math.max(0, propertyTaxAnnual || 0) / 12;
  const monthlyInsurance = Math.max(0, homeInsuranceAnnual || 0) / 12;
  const totalMonthlyMortgage = monthlyPI + monthlyTax + monthlyInsurance;
  const totalInterestMortgage = Math.max(0, monthlyPI * numPayments - loanPrincipal);
  const totalCostMortgage = monthlyPI * numPayments + Math.min(validDownPayment, validHomePrice);

  // Loan Calculation
  const validLoanAmount = Math.max(0, loanAmount || 0);
  const validLoanTerm = Math.max(1, loanTermMonths || 1);
  const validLoanRate = Math.max(0, loanRate || 0);
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

  // Auto Loan Calculation
  const validAutoPrice = Math.max(0, autoPrice || 0);
  const validTradeIn = Math.max(0, autoTradeIn || 0);
  const validAutoDown = Math.max(0, autoDownPayment || 0);
  const validTaxRate = Math.max(0, autoSalesTaxRate || 0);
  const validAutoRate = Math.max(0, autoRate || 0);
  const validAutoTerm = Math.max(1, autoTermMonths || 1);

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

  // Compound Interest Calculation
  const validPrincipal = Math.max(0, initialPrincipal || 0);
  const validContribution = Math.max(0, monthlyContribution || 0);
  const validYears = Math.max(0, investmentYears || 0);
  const numInvMonths = Math.round(validYears * 12);
  const monthlyInvRate = Math.max(0, annualReturn || 0) / 100 / 12;
  const totalDeposits = validPrincipal + validContribution * numInvMonths;
  let totalInvestmentValue = validPrincipal;
  if (numInvMonths > 0) {
    if (monthlyInvRate === 0) {
      totalInvestmentValue = totalDeposits;
    } else {
      totalInvestmentValue =
        validPrincipal * Math.pow(1 + monthlyInvRate, numInvMonths) +
        validContribution *
          ((Math.pow(1 + monthlyInvRate, numInvMonths) - 1) / monthlyInvRate) *
          (1 + monthlyInvRate);
    }
  }
  const totalInvestmentInterest = Math.max(0, totalInvestmentValue - totalDeposits);

  // Retirement Calculation
  const validCurrentAge = Math.max(0, currentAge || 0);
  const validRetireAge = Math.max(0, retireAge || 0);
  const yearsToRetire = Math.max(0, validRetireAge - validCurrentAge);
  const validCurrentSavings = Math.max(0, currentSavings || 0);
  const validAnnualSavings = Math.max(0, annualSavings || 0);
  const retAnnualRate = Math.max(0, retireReturn || 0) / 100;
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
  // 4% safe withdrawal rule
  const safeMonthlyRetireIncome = (retirementNestEgg * 0.04) / 12;

  // Salary Conversion
  const validHours = Math.max(1, hoursPerWeek || 0);
  const validSalary = Math.max(0, salaryAmount || 0);
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

  const formatCurrency = (n: number) => {
    if (!Number.isFinite(n) || isNaN(n)) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      Math.round(n)
    );
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
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
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
                  {formatCurrency(totalMonthlyMortgage)}
                  <span className="text-xs text-slate-400 font-normal"> / mo</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Principal & Interest:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(monthlyPI)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Property Taxes:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(monthlyTax)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Home Insurance:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(monthlyInsurance)}</span>
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
        </div>
      )}

      {/* ---------------- 2. LOAN CALCULATOR ---------------- */}
      {toolKey === 'loan' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
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
                  onChange={(e) => setLoanRate(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Monthly Payment</span>
                <div className="text-3xl sm:text-4xl font-black text-blue-400 font-mono mt-1">
                  {formatCurrency(monthlyLoanPayment)}
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
        </div>
      )}

      {/* ---------------- 3. AUTO LOAN CALCULATOR ---------------- */}
      {toolKey === 'auto-loan' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
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
                  onChange={(e) => setAutoSalesTaxRate(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Monthly Auto Payment</span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
                  {formatCurrency(monthlyAutoPayment)}
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
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
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
                    onChange={(e) => setAnnualReturn(parseCalcInput(e.target.value))}
                    className="calc-input"
                  />
                </div>
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
                    <span>Total Compound Growth:</span>
                    <span className="font-mono font-bold text-emerald-400">+{formatCurrency(totalInvestmentInterest)}</span>
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
                      ■ Principal (
                      {totalInvestmentValue > 0
                        ? Math.round((totalDeposits / totalInvestmentValue) * 100)
                        : 100}
                      %)
                    </span>
                    <span>
                      ■ Interest Earned (
                      {totalInvestmentValue > 0
                        ? Math.round((totalInvestmentInterest / totalInvestmentValue) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-4">
                Compound growth accelerates dramatically over time through exponential returns.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. RETIREMENT PLANNER ---------------- */}
      {toolKey === 'retirement' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Retirement Nest Egg Calculator</h2>
              <p className="text-xs text-slate-500">Plan your 401(k), IRA, and retirement nest egg for financial freedom.</p>
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
                  onChange={(e) => setAnnualSavings(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Annual Return (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={retireReturn}
                  placeholder="0"
                  onChange={(e) => setRetireReturn(parseCalcInput(e.target.value))}
                  className="calc-input"
                />
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
                    <span>Safe Monthly Income (4% Rule):</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(safeMonthlyRetireIncome)} / mo
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
        </div>
      )}

      {/* ---------------- 6. SALARY CALCULATOR ---------------- */}
      {toolKey === 'salary' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
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
