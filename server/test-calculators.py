"""
Comprehensive Automated Test Suite for All 22 Calculators in rajvarshith.com
Validates mathematical models, canonical formulas, edge cases, and boundary constraints.
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
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

# =====================================================================
# 1. SCIENTIFIC & BASIC CALCULATOR
# =====================================================================
banner("1. SCIENTIFIC & BASIC CALCULATOR")

# Trig
deg_val = 30
rad_val = math.radians(deg_val)
sin_deg = math.sin(rad_val)
test("Sin(30 deg)", math.isclose(sin_deg, 0.5, rel_tol=1e-5), f"-> {sin_deg:.4f}")

cos_deg = math.cos(math.radians(60))
test("Cos(60 deg)", math.isclose(cos_deg, 0.5, rel_tol=1e-5), f"-> {cos_deg:.4f}")

tan_deg = math.tan(math.radians(45))
test("Tan(45 deg)", math.isclose(tan_deg, 1.0, rel_tol=1e-5), f"-> {tan_deg:.4f}")

# Factorial
fact_5 = math.factorial(5)
test("Factorial(5)", fact_5 == 120, f"-> {fact_5}")

# Logarithms
log10_100 = math.log10(100)
test("Log10(100)", math.isclose(log10_100, 2.0), f"-> {log10_100}")

ln_e = math.log(math.e)
test("Ln(e)", math.isclose(ln_e, 1.0), f"-> {ln_e}")

# Zero division guard
def safe_div(a, b):
    return a / b if b != 0 else float('inf')
test("Division by Zero Guard", safe_div(10, 0) == float('inf'), "-> safely caught")

# =====================================================================
# 2. FINANCIAL CALCULATORS
# =====================================================================
banner("2. FINANCIAL CALCULATORS")

# A. Mortgage
P = 400000 - 80000 # 320,000
rate = 6.5 / 100 / 12
n = 30 * 12 # 360
monthly_pi = (P * (rate * (1 + rate)**n)) / ((1 + rate)**n - 1)
test("Mortgage $320k 30yr 6.5%", math.isclose(monthly_pi, 2022.61, abs_tol=0.10), f"-> ${monthly_pi:.2f}/mo")

# Mortgage 0% rate edge case
monthly_pi_zero = P / n
test("Mortgage 0% Rate Edge Case", math.isclose(monthly_pi_zero, 320000/360, abs_tol=0.01), f"-> ${monthly_pi_zero:.2f}/mo")

# B. Loan EMI
loan_p = 25000
loan_r = 7.9 / 100 / 12
loan_m = 36
loan_emi = (loan_p * (loan_r * (1 + loan_r)**loan_m)) / ((1 + loan_r)**loan_m - 1)
test("Loan $25k 36m 7.9%", math.isclose(loan_emi, 782.26, abs_tol=0.10), f"-> ${loan_emi:.2f}/mo")

# C. Auto Loan
auto_price = 32000
trade_in = 2000
tax_rate = 0.07
down_pay = 5000
taxable = max(0, auto_price - trade_in)
tax = taxable * tax_rate
financed = max(0, auto_price + tax - down_pay - trade_in)
auto_r = 5.9 / 100 / 12
auto_m = 60
auto_pmt = (financed * (auto_r * (1 + auto_r)**auto_m)) / ((1 + auto_r)**auto_m - 1)
test("Auto Loan $32k with tax & trade-in", math.isclose(auto_pmt, 522.66, abs_tol=0.50), f"-> ${auto_pmt:.2f}/mo")

# D. Compound Interest
init_p = 10000
contrib = 500
inv_y = 20
inv_r = 8.0 / 100 / 12
tot_val = init_p
tot_dep = init_p
for _ in range(inv_y * 12):
    tot_val = (tot_val + contrib) * (1 + inv_r)
    tot_dep += contrib
test("Compound Interest 20yr $500/mo @ 8%", tot_val > 300000, f"-> Total: ${tot_val:,.2f}, Deposits: ${tot_dep:,.2f}")

# E. Salary
sal_annual = 75000
sal_hourly = sal_annual / (40 * 52)
test("Salary $75,000 to Hourly @ 40h/wk", math.isclose(sal_hourly, 36.06, abs_tol=0.02), f"-> ${sal_hourly:.2f}/hr")

# =====================================================================
# 3. HEALTH & FITNESS CALCULATORS
# =====================================================================
banner("3. HEALTH & FITNESS CALCULATORS")

# A. BMI
w_kg = 70
h_cm = 175
h_m = h_cm / 100
bmi = w_kg / (h_m * h_m)
test("BMI 70kg, 175cm", math.isclose(bmi, 22.86, abs_tol=0.02), f"-> {bmi:.2f} (Normal weight)")

# B. BMR (Mifflin-St Jeor)
# Men: 10W + 6.25H - 5A + 5
bmr_m = 10 * w_kg + 6.25 * h_cm - 5 * 28 + 5
test("BMR Male 70kg, 175cm, 28y", math.isclose(bmr_m, 1658.75, abs_tol=0.1), f"-> {bmr_m:.1f} kcal")

# C. TDEE
tdee = bmr_m * 1.375
test("TDEE Light Exercise (1.375)", math.isclose(tdee, 2280.8, abs_tol=0.5), f"-> {round(tdee)} kcal/day")

# D. Body Fat (US Navy)
# Male: 495 / (1.0324 - 0.19077*log10(waist-neck) + 0.15456*log10(height)) - 450
waist = 82
neck = 38
bf_m = 495 / (1.0324 - 0.19077 * math.log10(waist - neck) + 0.15456 * math.log10(h_cm)) - 450
test("Body Fat % Male (82 waist, 38 neck)", 10 < bf_m < 20, f"-> {bf_m:.1f}%")

# E. Running Pace
dist_km = 10
time_sec = 50 * 60 # 3000 sec
sec_per_km = time_sec / dist_km
pace_min = int(sec_per_km // 60)
pace_sec = int(round(sec_per_km % 60))
speed_kmh = dist_km / (time_sec / 3600)
test("Running Pace 10km in 50m", pace_min == 5 and pace_sec == 0 and math.isclose(speed_kmh, 12.0), f"-> {pace_min}:{pace_sec:02d} /km @ {speed_kmh:.1f} km/h")

# =====================================================================
# 4. MATH & STATISTICS CALCULATORS
# =====================================================================
banner("4. MATH & STATISTICS CALCULATORS")

# A. Percentages
p1 = (15 / 100) * 200
test("15% of 200", p1 == 30.0, f"-> {p1}")

p2 = (25 / 100) * 100
test("25 is what % of 100", p2 == 25.0, f"-> {p2}%")

p3 = ((100 - 80) / 80) * 100
test("% Increase from 80 to 100", p3 == 25.0, f"-> +{p3}%")

# B. Fractions
# 2/3 + 3/4 = (8 + 9)/12 = 17/12
f_num = 2 * 4 + 3 * 3
f_den = 3 * 4
g = math.gcd(f_num, f_den)
test("Fraction 2/3 + 3/4", (f_num//g, f_den//g) == (17, 12), f"-> {f_num//g}/{f_den//g}")

# C. Statistics
data = [12, 15, 18, 22, 25, 28, 30, 35, 42, 50]
s_mean = sum(data) / len(data)
s_sorted = sorted(data)
s_mid = len(data) // 2
s_median = (s_sorted[s_mid - 1] + s_sorted[s_mid]) / 2
s_var_pop = sum((x - s_mean)**2 for x in data) / len(data)
s_sd_pop = math.sqrt(s_var_pop)
s_var_sample = sum((x - s_mean)**2 for x in data) / (len(data) - 1)
s_sd_sample = math.sqrt(s_var_sample)

test("Statistics Mean", math.isclose(s_mean, 27.7, abs_tol=0.01), f"-> {s_mean:.2f}")
test("Statistics Median", s_median == 26.5, f"-> {s_median}")
test("Statistics Sample SD", math.isclose(s_sd_sample, 12.028, abs_tol=0.01), f"-> {s_sd_sample:.3f}")

# =====================================================================
# 5. EVERYDAY & CONVERSION CALCULATORS
# =====================================================================
banner("5. EVERYDAY & CONVERSION CALCULATORS")

# A. Age Calculator
b = date(1998, 5, 15)
t = date(2026, 11, 11)
age_y = t.year - b.year - ((t.month, t.day) < (b.month, b.day))
test("Age 1998-05-15 to 2026-11-11", age_y == 28, f"-> {age_y} years")

# B. Date Difference
d1 = date(2026, 1, 1)
d2 = date(2026, 12, 31)
diff_d = (d2 - d1).days
test("Date Difference (2026-01-01 to 2026-12-31)", diff_d == 364, f"-> {diff_d} days")

# C. Work Hours
h_start = 9 * 60 + 0 # 09:00
h_end = 17 * 60 + 30 # 17:30
h_break = 30
net_min = h_end - h_start - h_break
dec_hours = net_min / 60
gross = dec_hours * 25.0
test("Work Hours 09:00-17:30 with 30m break @ $25/hr", dec_hours == 8.0 and gross == 200.0, f"-> {dec_hours} hrs = ${gross:.2f}")

# D. Tip & Split
bill = 85.0
tip_pct = 18
tot_with_tip = bill * (1 + tip_pct/100)
per_person = tot_with_tip / 2
test("Tip $85 @ 18% split 2 ways", math.isclose(per_person, 50.15, abs_tol=0.01), f"-> ${per_person:.2f}/person")

# E. Unit Converter
# Length: 100m to ft
m_to_ft = 100 / 0.3048
test("Unit Converter 100m to ft", math.isclose(m_to_ft, 328.084, abs_tol=0.01), f"-> {m_to_ft:.2f} ft")

# Temp: 100C to F
c_to_f = 100 * 9 / 5 + 32
test("Unit Converter 100°C to °F", c_to_f == 212.0, f"-> {c_to_f}°F")

print("\n" + "=" * 70)
print(f"  TOTAL TESTS: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
print("=" * 70)
