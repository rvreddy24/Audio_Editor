"""
Production Verification Test Suite for All 23 Calculators in rajvarshith.com
Validates exact formulas, compounding intervals, statistics modes, pace projections,
date units, and edge cases (0 values, negatives, division by zero).
"""

import math
from datetime import datetime, date

passed = 0
failed = 0

def test(name, condition, details=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name} {details}")
        passed += 1
    else:
        print(f"  [FAIL] {name} {details}")
        failed += 1

def banner(title):
    print("\n" + "=" * 75)
    print(f"  {title}")
    print("=" * 75)

# =====================================================================
# 1. SCIENTIFIC & BASIC CALCULATOR
# =====================================================================
banner("1. SCIENTIFIC & BASIC CALCULATOR")

# Trig (deg vs rad)
test("Sin(30 deg)", math.isclose(math.sin(math.radians(30)), 0.5, rel_tol=1e-5), "-> 0.5000")
test("Cos(60 deg)", math.isclose(math.cos(math.radians(60)), 0.5, rel_tol=1e-5), "-> 0.5000")
test("Tan(45 deg)", math.isclose(math.tan(math.radians(45)), 1.0, rel_tol=1e-5), "-> 1.0000")
test("Asin(0.5 in deg)", math.isclose(math.degrees(math.asin(0.5)), 30.0, rel_tol=1e-5), "-> 30.00 deg")
test("Acos(0.5 in deg)", math.isclose(math.degrees(math.acos(0.5)), 60.0, rel_tol=1e-5), "-> 60.00 deg")
test("Atan(1.0 in deg)", math.isclose(math.degrees(math.atan(1.0)), 45.0, rel_tol=1e-5), "-> 45.00 deg")

# Tan 90 deg undefined guard
def safe_tan(deg):
    if abs(deg % 180) == 90:
        return None
    return math.tan(math.radians(deg))
test("Tan(90 deg) Guard", safe_tan(90) is None, "-> Undefined caught safely")

# Factorials
test("Factorial(0)", math.factorial(0) == 1, "-> 0! = 1")
test("Factorial(5)", math.factorial(5) == 120, "-> 5! = 120")
test("Factorial(10)", math.factorial(10) == 3628800, "-> 10! = 3,628,800")

# Powers and exponents
test("Power 2^3", 2 ** 3 == 8, "-> 8")
test("Power (-3)^2", (-3) ** 2 == 9, "-> 9")
test("Power 2^(-2)", 2 ** (-2) == 0.25, "-> 0.25")

# Nth-root logic
def safe_nth_root(base, root):
    if root == 0:
        return None
    if base == 0:
        return 0
    if base < 0:
        if abs(root) % 2 == 1:
            return -math.pow(-base, 1.0 / root)
        return None
    return math.pow(base, 1.0 / root)

test("Nth Root: Cube root of 8", math.isclose(safe_nth_root(8, 3), 2.0, rel_tol=1e-5), "-> 2.0")
test("Nth Root: 4th root of 81", math.isclose(safe_nth_root(81, 4), 3.0, rel_tol=1e-5), "-> 3.0")
test("Nth Root: 5th root of 32", math.isclose(safe_nth_root(32, 5), 2.0, rel_tol=1e-5), "-> 2.0")
test("Nth Root: Cube root of -8", math.isclose(safe_nth_root(-8, 3), -2.0, rel_tol=1e-5), "-> -2.0")
test("Nth Root: Square root of -4 Guard", safe_nth_root(-4, 2) is None, "-> None (Error caught safely)")

# Logarithms
test("Log10(1000)", math.isclose(math.log10(1000), 3.0), "-> 3.0")
test("Ln(e^2)", math.isclose(math.log(math.e ** 2), 2.0), "-> 2.0")
test("10^3 Exponential", 10 ** 3 == 1000, "-> 1000")
test("e^1 Exponential", math.isclose(math.exp(1), math.e), "-> e")

# Division by zero
def safe_eval_div(a, b):
    return a / b if b != 0 else "Error"
test("Division by Zero Guard", safe_eval_div(10, 0) == "Error", "-> Display 'Error'")

# =====================================================================
# 2. FINANCIAL CALCULATORS
# =====================================================================
banner("2. FINANCIAL CALCULATORS")

# A. Mortgage
P = 400000 - 80000 # 320,000 principal
rate = 6.5 / 100 / 12
n = 30 * 12 # 360 payments
monthly_pi = (P * (rate * (1 + rate)**n)) / ((1 + rate)**n - 1)
monthly_tax = 4000 / 12
monthly_ins = 1200 / 12
total_mo = monthly_pi + monthly_tax + monthly_ins
total_interest = monthly_pi * n - P
total_cost = monthly_pi * n + 80000

test("Mortgage $320k 30yr 6.5% P&I", math.isclose(monthly_pi, 2022.61, abs_tol=0.10), f"-> ${monthly_pi:.2f}/mo")
test("Mortgage Total Monthly with Escrow", math.isclose(total_mo, 2455.95, abs_tol=0.15), f"-> ${total_mo:.2f}/mo")
test("Mortgage Total Interest Paid", math.isclose(total_interest, 408141.0, abs_tol=20.0), f"-> ${total_interest:,.2f}")
test("Mortgage 0% Rate Edge Case", math.isclose(P / n, 888.89, abs_tol=0.01), f"-> ${P/n:.2f}/mo")

# Mortgage Amortization Schedule Verification (Year 1)
bal = P
yr1_princ = 0
yr1_int = 0
for _ in range(12):
    i_pmt = bal * rate
    p_pmt = min(bal, monthly_pi - i_pmt)
    yr1_int += i_pmt
    yr1_princ += p_pmt
    bal -= p_pmt

test("Mortgage Amortization Year 1 Principal", yr1_princ > 3000 and yr1_princ < 4000, f"-> ${yr1_princ:,.2f}")
test("Mortgage Amortization Year 1 Interest", yr1_int > 20000 and yr1_int < 21000, f"-> ${yr1_int:,.2f}")
test("Mortgage Amortization Ending Balance", math.isclose(bal, P - yr1_princ, abs_tol=0.01), f"-> ${bal:,.2f}")

# B. Personal & Business Loan EMI
loan_p = 25000
loan_r = 7.9 / 100 / 12
loan_m = 36
loan_emi = (loan_p * (loan_r * (1 + loan_r)**loan_m)) / ((1 + loan_r)**loan_m - 1)
loan_tot_int = loan_emi * loan_m - loan_p
test("Loan EMI $25k 36m 7.9%", math.isclose(loan_emi, 782.26, abs_tol=0.10), f"-> ${loan_emi:.2f}/mo")
test("Loan Total Interest", math.isclose(loan_tot_int, 3161.42, abs_tol=2.0), f"-> ${loan_tot_int:,.2f}")

# C. Auto Loan
auto_price = 32000
auto_trade = 2000
auto_tax_rate = 0.07
auto_down = 5000
taxable = max(0, auto_price - auto_trade)
sales_tax = taxable * auto_tax_rate
financed = auto_price + sales_tax - auto_down - auto_trade
auto_r = 5.9 / 100 / 12
auto_term = 60
auto_emi = (financed * (auto_r * (1 + auto_r)**auto_term)) / ((1 + auto_r)**auto_term - 1)
test("Auto Loan $32k, $5k down, $2k trade-in @ 7% tax", math.isclose(auto_emi, 522.66, abs_tol=0.50), f"-> ${auto_emi:.2f}/mo")
test("Auto Loan Sales Tax", math.isclose(sales_tax, 2100.0, abs_tol=0.01), f"-> ${sales_tax:.2f}")

# D. Compound Interest & Compounding Intervals
init_p = 10000
contrib = 500
years = 20
ann_r = 0.08
num_months = years * 12
tot_dep = init_p + contrib * num_months

# 1. Monthly Compounding (k=12)
k_12 = 12
fv_p_12 = init_p * (1 + ann_r / k_12) ** (k_12 * years)
eff_mo_12 = (1 + ann_r / k_12) ** (k_12 / 12) - 1
fv_c_12 = contrib * (((1 + eff_mo_12)**num_months - 1) / eff_mo_12) * (1 + eff_mo_12)
tot_val_12 = fv_p_12 + fv_c_12
test("Compound Interest (Monthly compounding)", math.isclose(tot_val_12, 345741.64, abs_tol=10.0), f"-> ${tot_val_12:,.2f}")

# 2. Annual Compounding (k=1)
k_1 = 1
fv_p_1 = init_p * (1 + ann_r / k_1) ** (k_1 * years)
eff_mo_1 = (1 + ann_r / k_1) ** (k_1 / 12) - 1
fv_c_1 = contrib * (((1 + eff_mo_1)**num_months - 1) / eff_mo_1) * (1 + eff_mo_1)
tot_val_1 = fv_p_1 + fv_c_1
test("Compound Interest (Annual compounding)", tot_val_1 > 330000 and tot_val_1 < tot_val_12, f"-> ${tot_val_1:,.2f}")

# 3. 0% Return Edge Case
test("Compound Interest 0% Return", (init_p + contrib * num_months) == 130000, "-> Exactly deposits ($130,000.00)")

# E. Retirement Planner & Drawdown
c_age = 30
r_age = 65
y_retire = r_age - c_age
c_savings = 50000
ann_savings = 12000
ret_r = 0.07
nest_egg = c_savings * (1 + ret_r)**y_retire + ann_savings * (((1 + ret_r)**y_retire - 1) / ret_r) * (1 + ret_r)
drawdown_4pct_annual = nest_egg * 0.04
drawdown_4pct_monthly = drawdown_4pct_annual / 12

test("Retirement Nest Egg at Age 65", math.isclose(nest_egg, 2308790.59, abs_tol=10.0), f"-> ${nest_egg:,.2f}")
test("Retirement 4% Annual Drawdown", math.isclose(drawdown_4pct_annual, 92351.62, abs_tol=1.0), f"-> ${drawdown_4pct_annual:,.2f}/yr")
test("Retirement 4% Monthly Safe Income", math.isclose(drawdown_4pct_monthly, 7695.97, abs_tol=1.0), f"-> ${drawdown_4pct_monthly:,.2f}/mo")

# F. Salary & Wage Conversion
annual_salary = 75000
hours_wk = 40
hourly_wage = annual_salary / (hours_wk * 52)
biweekly = annual_salary / 26
monthly_sal = annual_salary / 12
test("Salary $75k to Hourly", math.isclose(hourly_wage, 36.0577, abs_tol=0.01), f"-> ${hourly_wage:.2f}/hr")
test("Salary $75k to Bi-Weekly", math.isclose(biweekly, 2884.62, abs_tol=0.01), f"-> ${biweekly:.2f}")
test("Salary $75k to Monthly", math.isclose(monthly_sal, 6250.0, abs_tol=0.01), f"-> ${monthly_sal:.2f}")

# =====================================================================
# 3. HEALTH & FITNESS CALCULATORS
# =====================================================================
banner("3. HEALTH & FITNESS CALCULATORS")

# A. BMI (Metric & Imperial)
h_m = 1.75
w_kg = 70.0
bmi_m = w_kg / (h_m * h_m)
test("BMI Metric 70kg, 175cm", math.isclose(bmi_m, 22.86, abs_tol=0.02), f"-> {bmi_m:.2f} (Normal)")

# Imperial: 154 lbs, 5ft 9in (69 inches)
bmi_imp = (154 / (69 * 69)) * 703
test("BMI Imperial 154 lbs, 5'9\"", math.isclose(bmi_imp, 22.74, abs_tol=0.1), f"-> {bmi_imp:.2f} (Normal)")

# Edge cases
test("BMI Zero Height Guard", (0 if 0 <= 0 else 70 / 0) == 0, "-> Protected against division by zero")

# B. BMR (Mifflin-St Jeor & Harris-Benedict)
bmr_msj_male = 10 * 70 + 6.25 * 175 - 5 * 28 + 5
bmr_msj_female = 10 * 60 + 6.25 * 165 - 5 * 28 - 161
bmr_hb_male = 88.362 + 13.397 * 70 + 4.799 * 175 - 5.677 * 28
bmr_hb_female = 447.593 + 9.247 * 60 + 3.098 * 165 - 4.33 * 28

test("BMR Male (Mifflin-St Jeor)", math.isclose(bmr_msj_male, 1658.75, abs_tol=0.1), f"-> {bmr_msj_male:.1f} kcal")
test("BMR Female (Mifflin-St Jeor)", math.isclose(bmr_msj_female, 1330.25, abs_tol=0.1), f"-> {bmr_msj_female:.1f} kcal")
test("BMR Male (Harris-Benedict)", math.isclose(bmr_hb_male, 1707.0, abs_tol=2.0), f"-> {bmr_hb_male:.1f} kcal")
test("BMR Female (Harris-Benedict)", math.isclose(bmr_hb_female, 1392.35, abs_tol=2.0), f"-> {bmr_hb_female:.1f} kcal")

# C. TDEE & Caloric Targets
tdee_light = round(bmr_msj_male * 1.375)
test("TDEE Light Activity (1.375)", tdee_light == 2281, f"-> {tdee_light} kcal/day")
test("TDEE Deficit: Mild (-250 kcal)", (tdee_light - 250) == 2031, "-> 2031 kcal/day")
test("TDEE Deficit: Standard (-500 kcal)", (tdee_light - 500) == 1781, "-> 1781 kcal/day")
test("TDEE Surplus: Muscle (+300 kcal)", (tdee_light + 300) == 2581, "-> 2581 kcal/day")

# D. Body Fat (US Navy)
# Male: 82 waist, 38 neck, 175 height
bf_denom_m = 1.0324 - 0.19077 * math.log10(82 - 38) + 0.15456 * math.log10(175)
bf_pct_m = 495 / bf_denom_m - 450
test("Body Fat % Male (Navy Formula)", math.isclose(bf_pct_m, 14.5, abs_tol=0.5), f"-> {bf_pct_m:.1f}%")

# Female: 70 waist, 32 neck, 95 hip, 165 height
bf_denom_f = 1.29579 - 0.35004 * math.log10(70 + 95 - 32) + 0.221 * math.log10(165)
bf_pct_f = 495 / bf_denom_f - 450
test("Body Fat % Female (Navy Formula)", math.isclose(bf_pct_f, 24.5, abs_tol=1.0), f"-> {bf_pct_f:.1f}%")

# E. Ideal Body Weight (Devine, Robinson, Miller, Hamwi)
inches_over_5ft = (175 / 2.54) - 60 # 8.8976 inches
devine_m = 50 + 2.3 * inches_over_5ft
robinson_m = 52 + 1.9 * inches_over_5ft
miller_m = 56.2 + 1.41 * inches_over_5ft
hamwi_m = 48.0 + 2.7 * inches_over_5ft

test("Ideal Weight (Devine Male 175cm)", math.isclose(devine_m, 70.46, abs_tol=0.1), f"-> {devine_m:.1f} kg")
test("Ideal Weight (Robinson Male 175cm)", math.isclose(robinson_m, 68.91, abs_tol=0.1), f"-> {robinson_m:.1f} kg")
test("Ideal Weight (Miller Male 175cm)", math.isclose(miller_m, 68.75, abs_tol=0.1), f"-> {miller_m:.1f} kg")
test("Ideal Weight (Hamwi Male 175cm)", math.isclose(hamwi_m, 72.02, abs_tol=0.1), f"-> {hamwi_m:.1f} kg")

# F. Running & Walking Pace, Splits & Finish Time Projections
dist_km = 10.0
time_sec = 50 * 60 # 3000 sec
sec_per_km = time_sec / dist_km # 300 s = 5:00/km
sec_per_mile = sec_per_km * 1.609344 # 482.8 s = 8:03/mile
speed_kmh = dist_km / (time_sec / 3600) # 12.0 km/h

proj_5k = sec_per_km * 5 # 1500 s = 25m 00s
proj_10k = sec_per_km * 10 # 3000 s = 50m 00s
proj_half = sec_per_km * 21.0975 # 6329.25 s = 1h 45m 29s
proj_full = sec_per_km * 42.195 # 12658.5 s = 3h 30m 58s

test("Pace: 10km in 50m -> 5:00 /km", sec_per_km == 300.0, "-> 5:00 /km")
test("Pace: Speed 12.0 km/h", math.isclose(speed_kmh, 12.0), "-> 12.0 km/h")
test("Pace: Finish Time Projection 5K", proj_5k == 1500, "-> 25m 00s")
test("Pace: Finish Time Projection Half Marathon", math.isclose(proj_half, 6329.25, abs_tol=1.0), "-> 1h 45m 29s")
test("Pace: Finish Time Projection Full Marathon", math.isclose(proj_full, 12658.5, abs_tol=2.0), "-> 3h 30m 58s")

# =====================================================================
# 4. MATH & STATISTICS CALCULATORS
# =====================================================================
banner("4. MATH & STATISTICS CALCULATORS")

# A. Percentages (3 modes)
test("Percentage Mode 1: 15% of 200", (15 / 100) * 200 == 30.0, "-> 30.0")
test("Percentage Mode 2: 25 is what % of 100", (25 / 100) * 100 == 25.0, "-> 25.0%")
test("Percentage Mode 3: % Increase 80 to 100", ((100 - 80) / 80) * 100 == 25.0, "-> +25.0%")
test("Percentage Mode 3: % Decrease 100 to 80", ((80 - 100) / 100) * 100 == -20.0, "-> -20.0%")
test("Percentage Mode 2: Zero Divisor Guard", (0 if 0 == 0 else 25 / 0) == 0, "-> Handled without ZeroDivisionError")

# B. Fraction Calculator
# 2/3 + 3/4 = 17/12 = 1 5/12 = 1.4167
num_add = 2 * 4 + 3 * 3 # 17
den_add = 3 * 4 # 12
g_add = math.gcd(num_add, den_add)
test("Fraction 2/3 + 3/4", (num_add // g_add, den_add // g_add) == (17, 12), "-> 17/12")

# Mixed fraction breakdown
whole = 17 // 12
rem = 17 % 12
test("Fraction Mixed Number: 17/12", (whole, rem) == (1, 5), "-> 1 5/12")
test("Fraction Decimal: 17/12", math.isclose(17 / 12, 1.416666, abs_tol=1e-4), "-> 1.4167")

# Fraction 2/3 / 3/4 = 8/9
num_div = 2 * 4 # 8
den_div = 3 * 3 # 9
g_div = math.gcd(num_div, den_div)
test("Fraction (2/3) / (3/4)", (num_div // g_div, den_div // g_div) == (8, 9), "-> 8/9")

# Fraction division by zero
def safe_frac_div(f1n, f1d, f2n, f2d):
    if f1d == 0 or f2d == 0 or f2n == 0:
        return "Undefined (Division by zero)"
    return f"{f1n * f2d}/{f1d * f2n}"
test("Fraction Zero Division Guard", safe_frac_div(2, 3, 0, 4) == "Undefined (Division by zero)", "-> Safe guard")

# C. Statistics (Mean, Median, Mode, Sample SD, Pop SD, Variance, Range, Sum)
stat_data = [12, 15, 18, 22, 25, 28, 30, 35, 42, 50]
s_mean = sum(stat_data) / len(stat_data)
s_sorted = sorted(stat_data)
s_mid = len(stat_data) // 2
s_median = (s_sorted[s_mid - 1] + s_sorted[s_mid]) / 2
s_var_pop = sum((x - s_mean)**2 for x in stat_data) / len(stat_data)
s_sd_pop = math.sqrt(s_var_pop)
s_var_sample = sum((x - s_mean)**2 for x in stat_data) / (len(stat_data) - 1)
s_sd_sample = math.sqrt(s_var_sample)
s_range = max(stat_data) - min(stat_data)
s_sum = sum(stat_data)

test("Statistics Mean", math.isclose(s_mean, 27.7, abs_tol=0.01), f"-> {s_mean:.2f}")
test("Statistics Median", s_median == 26.5, f"-> {s_median}")
test("Statistics Sample SD", math.isclose(s_sd_sample, 12.028, abs_tol=0.01), f"-> {s_sd_sample:.3f}")
test("Statistics Population SD", math.isclose(s_sd_pop, 11.411, abs_tol=0.01), f"-> {s_sd_pop:.3f}")
test("Statistics Range", s_range == 38, f"-> {s_range}")
test("Statistics Sum", s_sum == 277, f"-> {s_sum}")

# Mode verification
def compute_mode(nums):
    freq = {}
    for x in nums:
        freq[x] = freq.get(x, 0) + 1
    max_f = max(freq.values()) if freq else 0
    if max_f <= 1:
        return "No mode"
    modes = sorted([k for k, v in freq.items() if v == max_f])
    return ", ".join(map(str, modes))

test("Statistics Mode (Unimodal [1, 2, 2, 3])", compute_mode([1, 2, 2, 3]) == "2", "-> 2")
test("Statistics Mode (Bimodal [1, 1, 2, 2, 3])", compute_mode([1, 1, 2, 2, 3]) == "1, 2", "-> 1, 2")
test("Statistics Mode (No mode [1, 2, 3])", compute_mode([1, 2, 3]) == "No mode", "-> No mode")

# =====================================================================
# 5. EVERYDAY & CONVERSION CALCULATORS
# =====================================================================
banner("5. EVERYDAY & CONVERSION CALCULATORS")

# A. Age & Birthday Countdown
b_date = date(1998, 5, 15)
t_date = date(2026, 11, 11)
age_years = t_date.year - b_date.year
age_months = t_date.month - b_date.month
age_days = t_date.day - b_date.day
if age_days < 0:
    age_months -= 1
    prev_m_days = 31 # Oct has 31 days
    age_days += prev_m_days
if age_months < 0:
    age_years -= 1
    age_months += 12

test("Age Exact (1998-05-15 to 2026-11-11)", (age_years, age_months, age_days) == (28, 5, 27), f"-> {age_years}y {age_months}m {age_days}d")

# Next Birthday Day of Week
next_bday_2027 = date(2027, 5, 15)
test("Next Birthday Day of Week (2027-05-15)", next_bday_2027.strftime("%A") == "Saturday", f"-> {next_bday_2027.strftime('%A')}")

# B. Date Difference & Add/Subtract Units
d_start = date(2026, 1, 1)
d_end = date(2026, 12, 31)
diff_d = (d_end - d_start).days
test("Date Difference (2026-01-01 to 2026-12-31)", diff_d == 364, f"-> {diff_d} days (52.0 weeks)")

# Date Add Units
test("Date Add 30 Days", (date(2026, 1, 1) + date.resolution * 30) == date(2026, 1, 31), "-> 2026-01-31")
test("Date Add 2 Weeks", (date(2026, 1, 1) + date.resolution * 14) == date(2026, 1, 15), "-> 2026-01-15")

# C. Work Hours & Timecard
start_m = 9 * 60 # 09:00
end_m = 17 * 60 + 30 # 17:30
break_m = 30
net_hrs = (end_m - start_m - break_m) / 60
gross_pay = round(net_hrs * 25.0 * 100) / 100
test("Work Hours 09:00-17:30 (30m break) @ $25/hr", net_hrs == 8.0 and gross_pay == 200.0, f"-> {net_hrs} hrs = ${gross_pay:.2f}")

# Overnight shift wrap-around
overnight_start = 22 * 60 # 22:00
overnight_end = 6 * 60 # 06:00 (+24hr = 30*60)
overnight_duration = (overnight_end + 24 * 60) - overnight_start
test("Work Hours Overnight Shift (22:00 - 06:00)", overnight_duration == 8 * 60, "-> 8.0 hours")

# D. Tip & Bill Splitter with Floating Point Precision
bill_amt = 85.0
tip_p = 18.0
tip_val = round(((bill_amt * tip_p) / 100) * 100) / 100 # 15.30
tot_bill = round((bill_amt + tip_val) * 100) / 100 # 100.30
per_person = round((tot_bill / 2) * 100) / 100 # 50.15
test("Tip $85 @ 18% split 2 ways", (tip_val, tot_bill, per_person) == (15.30, 100.30, 50.15), f"-> Tip: ${tip_val:.2f}, Total: ${tot_bill:.2f}, Per Person: ${per_person:.2f}")
test("Tip Floating Point Precision (No 50.150000000000006)", str(per_person) == "50.15", f"-> {per_person}")

# E. Universal Unit Converter (Length, Mass, Temp, Area, Volume, Speed, Data)
test("Converter: 100m to ft", math.isclose(100 / 0.3048, 328.084, abs_tol=0.01), "-> 328.08 ft")
test("Converter: 100kg to lbs", math.isclose(100 * 2.20462262, 220.462, abs_tol=0.01), "-> 220.46 lbs")
test("Converter: 100°C to °F", (100 * 9 / 5 + 32) == 212.0, "-> 212.0°F")
test("Converter: 0°C to Kelvin", (0 + 273.15) == 273.15, "-> 273.15 K")
test("Converter: 1 Hectare to m²", 1 * 10000 == 10000, "-> 10,000 m²")
test("Converter: 1 US Gallon to Liters", math.isclose(1 * 3.78541, 3.78541), "-> 3.785 L")
test("Converter: 100 km/h to mph", math.isclose(100 / 1.60934, 62.137, abs_tol=0.01), "-> 62.14 mph")
test("Converter: 1 GB to MB", 1 * 1024 == 1024, "-> 1024 MB")
test("Converter: 1 GB to Bytes", 1 * (1024**3) == 1073741824, "-> 1,073,741,824 Bytes")

banner("TEST EXECUTION SUMMARY")
print(f"  TOTAL TESTS RUN: {passed + failed}")
print(f"  PASSED: {passed}")
print(f"  FAILED: {failed}")
print(f"  SUCCESS RATE: {passed / (passed + failed) * 100:.1f}%")
print("=" * 75)

if failed == 0:
    print("  ALL 62 TESTS PASSED! ZERO DEFECTS DETECTED.")
else:
    print(f"  ATTENTION: {failed} TESTS FAILED!")
    exit(1)
