import React, { useState } from 'react';
import { DollarSign, ArrowLeft, TrendingUp, Calendar, PieChart, ShieldCheck } from 'lucide-react';
import { CalculatorKey } from './types';

interface FinancialCalcsProps {
  toolKey: CalculatorKey;
  onBack?: () => void;
}

export const FinancialCalcs: React.FC<FinancialCalcsProps> = ({ toolKey, onBack }) => {
  // 1. MORTGAGE STATE
  const [homePrice, setHomePrice] = useState<number>(400000);
  const [downPayment, setDownPayment] = useState<number>(80000);
  const [mortgageTermYears, setMortgageTermYears] = useState<number>(30);
  const [mortgageRate, setMortgageRate] = useState<number>(6.5);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState<number>(4000);
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState<number>(1200);

  // 2. LOAN STATE
  const [loanAmount, setLoanAmount] = useState<number>(25000);
  const [loanTermMonths, setLoanTermMonths] = useState<number>(36);
  const [loanRate, setLoanRate] = useState<number>(7.9);

  // 3. AUTO LOAN STATE
  const [autoPrice, setAutoPrice] = useState<number>(32000);
  const [autoDownPayment, setAutoDownPayment] = useState<number>(5000);
  const [autoTradeIn, setAutoTradeIn] = useState<number>(2000);
  const [autoRate, setAutoRate] = useState<number>(5.9);
  const [autoTermMonths, setAutoTermMonths] = useState<number>(60);
  const [autoSalesTaxRate, setAutoSalesTaxRate] = useState<number>(7.0);

  // 4. COMPOUND INTEREST / INVESTMENT STATE
  const [initialPrincipal, setInitialPrincipal] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [investmentYears, setInvestmentYears] = useState<number>(20);
  const [annualReturn, setAnnualReturn] = useState<number>(8.0);

  // 5. RETIREMENT STATE
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retireAge, setRetireAge] = useState<number>(65);
  const [currentSavings, setCurrentSavings] = useState<number>(50000);
  const [annualSavings, setAnnualSavings] = useState<number>(12000);
  const [retireReturn, setRetireReturn] = useState<number>(7.0);

  // 6. SALARY STATE
  const [salaryMode, setSalaryMode] = useState<'annual' | 'hourly'>('annual');
  const [salaryAmount, setSalaryAmount] = useState<number>(75000);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);

  // -------------------------------------------------------------
  // CALCULATIONS
  // -------------------------------------------------------------

  // Mortgage Calculation
  const loanPrincipal = Math.max(0, homePrice - downPayment);
  const monthlyRate = mortgageRate / 100 / 12;
  const numPayments = mortgageTermYears * 12;
  const monthlyPI =
    monthlyRate > 0
      ? (loanPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanPrincipal / numPayments;
  const monthlyTax = propertyTaxAnnual / 12;
  const monthlyInsurance = homeInsuranceAnnual / 12;
  const totalMonthlyMortgage = monthlyPI + monthlyTax + monthlyInsurance;
  const totalInterestMortgage = monthlyPI * numPayments - loanPrincipal;
  const totalCostMortgage = monthlyPI * numPayments + downPayment;

  // Loan Calculation
  const loanMonthlyRate = loanRate / 100 / 12;
  const monthlyLoanPayment =
    loanMonthlyRate > 0
      ? (loanAmount * (loanMonthlyRate * Math.pow(1 + loanMonthlyRate, loanTermMonths))) /
        (Math.pow(1 + loanMonthlyRate, loanTermMonths) - 1)
      : loanAmount / loanTermMonths;
  const totalLoanInterest = monthlyLoanPayment * loanTermMonths - loanAmount;
  const totalLoanCost = monthlyLoanPayment * loanTermMonths;

  // Auto Loan Calculation
  const taxableAmount = Math.max(0, autoPrice - autoTradeIn);
  const salesTax = (taxableAmount * autoSalesTaxRate) / 100;
  const totalAutoFinanced = Math.max(0, autoPrice + salesTax - autoDownPayment - autoTradeIn);
  const autoMonthlyRate = autoRate / 100 / 12;
  const monthlyAutoPayment =
    autoMonthlyRate > 0
      ? (totalAutoFinanced * (autoMonthlyRate * Math.pow(1 + autoMonthlyRate, autoTermMonths))) /
        (Math.pow(1 + autoMonthlyRate, autoTermMonths) - 1)
      : totalAutoFinanced / autoTermMonths;
  const totalAutoInterest = monthlyAutoPayment * autoTermMonths - totalAutoFinanced;
  const totalAutoCost = autoDownPayment + autoTradeIn + monthlyAutoPayment * autoTermMonths;

  // Compound Interest Calculation
  let totalInvestmentValue = initialPrincipal;
  let totalDeposits = initialPrincipal;
  const monthlyInvRate = annualReturn / 100 / 12;
  for (let m = 1; m <= investmentYears * 12; m++) {
    totalInvestmentValue = (totalInvestmentValue + monthlyContribution) * (1 + monthlyInvRate);
    totalDeposits += monthlyContribution;
  }
  const totalInvestmentInterest = Math.max(0, totalInvestmentValue - totalDeposits);

  // Retirement Calculation
  const yearsToRetire = Math.max(1, retireAge - currentAge);
  let retirementNestEgg = currentSavings;
  let totalRetirementContributed = currentSavings;
  const retAnnualRate = retireReturn / 100;
  for (let y = 1; y <= yearsToRetire; y++) {
    retirementNestEgg = (retirementNestEgg + annualSavings) * (1 + retAnnualRate);
    totalRetirementContributed += annualSavings;
  }
  // 4% safe withdrawal rule
  const safeMonthlyRetireIncome = (retirementNestEgg * 0.04) / 12;

  // Salary Conversion
  let annualVal = salaryAmount;
  let hourlyVal = 0;
  if (salaryMode === 'annual') {
    hourlyVal = salaryAmount / (hoursPerWeek * 52);
  } else {
    hourlyVal = salaryAmount;
    annualVal = salaryAmount * hoursPerWeek * 52;
  }
  const monthlySalary = annualVal / 12;
  const biWeeklySalary = annualVal / 26;
  const weeklySalary = annualVal / 52;
  const dailySalary = annualVal / 260; // 5 days/wk

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      Math.round(n)
    );

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
                  onChange={(e) => setHomePrice(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Down Payment ($)</label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loan Term (Years)</label>
                  <select
                    value={mortgageTermYears}
                    onChange={(e) => setMortgageTermYears(Number(e.target.value))}
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
                    onChange={(e) => setMortgageRate(Number(e.target.value))}
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
                    onChange={(e) => setPropertyTaxAnnual(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Insurance ($/yr)</label>
                  <input
                    type="number"
                    value={homeInsuranceAnnual}
                    onChange={(e) => setHomeInsuranceAnnual(Number(e.target.value))}
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
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loan Term (Months)</label>
                <input
                  type="number"
                  value={loanTermMonths}
                  onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  onChange={(e) => setLoanRate(Number(e.target.value))}
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
                    <span className="font-mono font-bold text-white">{formatCurrency(loanAmount)}</span>
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
                Total duration: {loanTermMonths} months ({(loanTermMonths / 12).toFixed(1)} years)
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
                  onChange={(e) => setAutoPrice(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Down Payment ($)</label>
                  <input
                    type="number"
                    value={autoDownPayment}
                    onChange={(e) => setAutoDownPayment(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trade-in Value ($)</label>
                  <input
                    type="number"
                    value={autoTradeIn}
                    onChange={(e) => setAutoTradeIn(Number(e.target.value))}
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
                    onChange={(e) => setAutoRate(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Term (Months)</label>
                  <select
                    value={autoTermMonths}
                    onChange={(e) => setAutoTermMonths(Number(e.target.value))}
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
                  onChange={(e) => setAutoSalesTaxRate(Number(e.target.value))}
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
                  onChange={(e) => setInitialPrincipal(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Contribution ($)</label>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years to Grow</label>
                  <input
                    type="number"
                    value={investmentYears}
                    onChange={(e) => setInvestmentYears(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Return (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={annualReturn}
                    onChange={(e) => setAnnualReturn(Number(e.target.value))}
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
                      style={{ width: `${Math.min(100, (totalDeposits / totalInvestmentValue) * 100)}%` }}
                    />
                    <div className="bg-emerald-400 h-full flex-1" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>■ Principal ({Math.round((totalDeposits / totalInvestmentValue) * 100)}%)</span>
                    <span>■ Interest Earned ({Math.round((totalInvestmentInterest / totalInvestmentValue) * 100)}%)</span>
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
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Retirement Age</label>
                  <input
                    type="number"
                    value={retireAge}
                    onChange={(e) => setRetireAge(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Savings & 401(k) ($)</label>
                <input
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Annual Savings Contribution ($/yr)</label>
                <input
                  type="number"
                  value={annualSavings}
                  onChange={(e) => setAnnualSavings(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Annual Return (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={retireReturn}
                  onChange={(e) => setRetireReturn(Number(e.target.value))}
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
                    onClick={() => setSalaryMode('annual')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      salaryMode === 'annual'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Annual Salary ($)
                  </button>
                  <button
                    onClick={() => setSalaryMode('hourly')}
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
                  onChange={(e) => setSalaryAmount(Number(e.target.value))}
                  className="calc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Working Hours per Week</label>
                <input
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
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
