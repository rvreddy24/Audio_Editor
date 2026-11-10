export type CalcCategory = 'all' | 'scientific' | 'financial' | 'health' | 'math' | 'everyday';

export type CalculatorKey =
  | 'home'
  | 'scientific'
  // Financial
  | 'mortgage'
  | 'loan'
  | 'auto-loan'
  | 'compound-interest'
  | 'retirement'
  | 'salary'
  // Health & Fitness
  | 'bmi'
  | 'calorie'
  | 'body-fat'
  | 'bmr'
  | 'ideal-weight'
  | 'pace'
  // Math & Statistics
  | 'percentage'
  | 'fraction'
  | 'statistics'
  | 'random'
  // Everyday & Conversions
  | 'age'
  | 'date'
  | 'hours'
  | 'tip'
  | 'unit-converter';

export interface CalculatorMeta {
  key: CalculatorKey;
  name: string;
  category: CalcCategory;
  shortDesc: string;
  badge?: string;
  iconName: string;
}

export const ALL_CALCULATORS: CalculatorMeta[] = [
  // Scientific
  {
    key: 'scientific',
    name: 'Scientific & Basic Calculator',
    category: 'scientific',
    shortDesc: 'Comprehensive scientific keypad with trigonometry, logarithms, powers, roots, and calculation history.',
    badge: 'Popular',
    iconName: 'Calculator',
  },
  // Financial
  {
    key: 'mortgage',
    name: 'Mortgage Calculator',
    category: 'financial',
    shortDesc: 'Calculate monthly mortgage payment, interest, taxes, and complete amortization breakdown.',
    badge: 'Finance',
    iconName: 'DollarSign',
  },
  {
    key: 'loan',
    name: 'Loan Calculator',
    category: 'financial',
    shortDesc: 'Compute monthly EMI payments, total interest paid, and payoff schedule for personal or business loans.',
    badge: 'Finance',
    iconName: 'DollarSign',
  },
  {
    key: 'auto-loan',
    name: 'Auto Loan Calculator',
    category: 'financial',
    shortDesc: 'Calculate car loan payments with trade-in value, sales tax, down payment, and dealer interest rates.',
    badge: 'Finance',
    iconName: 'DollarSign',
  },
  {
    key: 'compound-interest',
    name: 'Compound Interest & Investment',
    category: 'financial',
    shortDesc: 'See how your savings and investments compound over time with recurring deposits and annual yields.',
    badge: 'Growth',
    iconName: 'DollarSign',
  },
  {
    key: 'retirement',
    name: 'Retirement Nest Egg Planner',
    category: 'financial',
    shortDesc: 'Plan your 401(k), IRA, and pension goal. Calculate your required savings to retire comfortably.',
    badge: 'Finance',
    iconName: 'DollarSign',
  },
  {
    key: 'salary',
    name: 'Salary & Hourly Wage Calculator',
    category: 'financial',
    shortDesc: 'Convert between hourly wage, daily pay, bi-weekly paycheck, monthly income, and annual salary.',
    badge: 'Finance',
    iconName: 'DollarSign',
  },
  // Health & Fitness
  {
    key: 'bmi',
    name: 'BMI Calculator (Body Mass Index)',
    category: 'health',
    shortDesc: 'Check your Body Mass Index (BMI) and healthy weight range for adults, teens, and children.',
    badge: 'Health',
    iconName: 'Scale',
  },
  {
    key: 'calorie',
    name: 'Calorie & TDEE Calculator',
    category: 'health',
    shortDesc: 'Calculate maintenance calories, daily energy expenditure (TDEE), and safe weight loss deficit targets.',
    badge: 'Health',
    iconName: 'Activity',
  },
  {
    key: 'body-fat',
    name: 'Body Fat % (US Navy Method)',
    category: 'health',
    shortDesc: 'Estimate body fat percentage, lean body mass, and fat mass using circumference measurements.',
    badge: 'Health',
    iconName: 'HeartPulse',
  },
  {
    key: 'bmr',
    name: 'BMR Calculator (Metabolic Rate)',
    category: 'health',
    shortDesc: 'Calculate Basal Metabolic Rate via Mifflin-St Jeor and Harris-Benedict formulas.',
    badge: 'Health',
    iconName: 'HeartPulse',
  },
  {
    key: 'ideal-weight',
    name: 'Ideal Body Weight Calculator',
    category: 'health',
    shortDesc: 'Compare ideal target weight ranges based on Devine, Robinson, Miller, and Hamwi medical formulas.',
    badge: 'Health',
    iconName: 'Scale',
  },
  {
    key: 'pace',
    name: 'Running & Walking Pace Calculator',
    category: 'health',
    shortDesc: 'Calculate running pace (min/km, min/mile), target split times, and race finish time projections.',
    badge: 'Fitness',
    iconName: 'Activity',
  },
  // Math & Statistics
  {
    key: 'percentage',
    name: 'Percentage Calculator',
    category: 'math',
    shortDesc: 'Quickly calculate percent changes, percentage increase/decrease, and X% of Y in 3 flexible modes.',
    badge: 'Math',
    iconName: 'Percent',
  },
  {
    key: 'fraction',
    name: 'Fraction Calculator',
    category: 'math',
    shortDesc: 'Add, subtract, multiply, and divide fractions with mixed numbers, step-by-step simplification, and decimal conversion.',
    badge: 'Math',
    iconName: 'Hash',
  },
  {
    key: 'statistics',
    name: 'Standard Deviation & Statistics',
    category: 'math',
    shortDesc: 'Compute population and sample standard deviation, variance, mean, median, sum, and range for any dataset.',
    badge: 'Math',
    iconName: 'Hash',
  },
  {
    key: 'random',
    name: 'Random Number Generator',
    category: 'math',
    shortDesc: 'Generate cryptographically random numbers within custom ranges with sorting and duplicate toggles.',
    badge: 'Math',
    iconName: 'Hash',
  },
  // Everyday & Conversions
  {
    key: 'age',
    name: 'Age Calculator & Birthday Countdown',
    category: 'everyday',
    shortDesc: 'Find exact chronological age in years, months, days, hours, minutes, and countdown to next birthday.',
    badge: 'Everyday',
    iconName: 'Calendar',
  },
  {
    key: 'date',
    name: 'Date Difference & Duration',
    category: 'everyday',
    shortDesc: 'Calculate days, weeks, and months between two dates, or add/subtract time from any calendar date.',
    badge: 'Everyday',
    iconName: 'Calendar',
  },
  {
    key: 'hours',
    name: 'Work Hours & Timecard Calculator',
    category: 'everyday',
    shortDesc: 'Track clock-in, clock-out, and lunch break hours. Calculates decimal hours and gross payroll.',
    badge: 'Everyday',
    iconName: 'Clock',
  },
  {
    key: 'tip',
    name: 'Tip & Bill Splitter',
    category: 'everyday',
    shortDesc: 'Calculate tip amount, total bill, and split evenly across friends with preset or custom percentages.',
    badge: 'Everyday',
    iconName: 'DollarSign',
  },
  {
    key: 'unit-converter',
    name: 'Universal Unit Converter',
    category: 'everyday',
    shortDesc: 'Convert units for length, weight/mass, temperature, area, volume, speed, and digital data storage.',
    badge: 'Universal',
    iconName: 'Scale',
  },
];
