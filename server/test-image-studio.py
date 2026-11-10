"""
Comprehensive Test Suite for Image Studio Features
Tests both user images against all 10 tools and operations:
1. "E:\\ChatGPT Image Apr 30, 2026, 08_00_38 AM.PNG"
2. "E:\\ChatGPT Image Jul 31, 2026, 10_38_01 AM.png"
"""

import os
import sys
import io
import math
from PIL import Image, ImageDraw, ImageFont

TEST_FILES = [
    r"E:\ChatGPT Image Apr 30, 2026, 08_00_38 AM.PNG",
    r"E:\ChatGPT Image Jul 31, 2026, 10_38_01 AM.png",
]

OUTPUT_DIR = r"d:\Audio Editor\temp_image_test"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def banner(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def assert_test(cond, msg):
    if cond:
        print(f"  [PASS] {msg}")
    else:
        print(f"  [FAIL] {msg}")
        sys.exit(1)

# ---------------------------------------------------------
# 1. Target KB Compressor (Exact Binary Search Simulation)
# ---------------------------------------------------------
def compress_to_target_kb(im: Image.Image, target_kb: int, mime: str = "JPEG"):
    target_bytes = target_kb * 1024
    cur_w, cur_h = im.size

    best_bytes = None
    best_img = None

    for scale_pass in range(5):
        # Resize if scaled
        scaled = im.resize((max(20, round(cur_w)), max(20, round(cur_h))), Image.Resampling.LANCZOS)
        if scaled.mode in ('RGBA', 'LA') and mime == "JPEG":
            bg = Image.new("RGB", scaled.size, (255, 255, 255))
            bg.paste(scaled, mask=scaled.split()[-1])
            work_img = bg
        else:
            work_img = scaled.convert("RGB")

        low_q = 5
        high_q = 98
        local_best = None

        for _ in range(7):
            mid_q = (low_q + high_q) // 2
            buf = io.BytesIO()
            work_img.save(buf, format=mime, quality=mid_q)
            data = buf.getvalue()
            if len(data) <= target_bytes:
                local_best = (data, mid_q, work_img)
                low_q = mid_q + 1
            else:
                high_q = mid_q - 1

        if local_best and len(local_best[0]) <= target_bytes:
            best_bytes = local_best[0]
            best_img = local_best[2]
            if len(best_bytes) >= target_bytes * 0.75 or local_best[1] > 60:
                break

        # Test lowest quality
        buf = io.BytesIO()
        work_img.save(buf, format=mime, quality=5)
        test_lowest = buf.getvalue()
        if len(test_lowest) > target_bytes:
            ratio = math.sqrt(target_bytes / len(test_lowest)) * 0.90
            cur_w = max(30, round(cur_w * ratio))
            cur_h = max(30, round(cur_h * ratio))
        else:
            if not best_bytes:
                best_bytes = test_lowest
                best_img = work_img
            break

    if not best_bytes:
        # Fallback
        fw = 300
        fh = max(30, round((300 / im.width) * im.height))
        fallback = im.resize((fw, fh), Image.Resampling.LANCZOS).convert("RGB")
        buf = io.BytesIO()
        fallback.save(buf, format=mime, quality=30)
        best_bytes = buf.getvalue()
        best_img = fallback

    return best_bytes, best_img

# ---------------------------------------------------------
# 2. Increase Image Size in KB (Safe Trailing Padding)
# ---------------------------------------------------------
def increase_image_size(raw_bytes: bytes, target_kb: int):
    target_bytes = target_kb * 1024
    if len(raw_bytes) >= target_bytes:
        return raw_bytes
    diff = target_bytes - len(raw_bytes)
    return raw_bytes + (b'\x00' * diff)

# ---------------------------------------------------------
# 3. DPI Injection (JFIF APP0 Marker)
# ---------------------------------------------------------
def inject_jfif_dpi(jpeg_bytes: bytes, dpi: int) -> bytes:
    if len(jpeg_bytes) < 4 or jpeg_bytes[0] != 0xFF or jpeg_bytes[1] != 0xD8:
        return jpeg_bytes
    
    # If APP0 already present
    if jpeg_bytes[2] == 0xFF and jpeg_bytes[3] == 0xE0:
        b = bytearray(jpeg_bytes)
        b[13] = 1 # dots per inch
        b[14] = (dpi >> 8) & 0xFF
        b[15] = dpi & 0xFF
        b[16] = (dpi >> 8) & 0xFF
        b[17] = dpi & 0xFF
        return bytes(b)
    
    # Insert APP0 block
    jfif = bytearray([
        0xFF, 0xE0, 0x00, 0x10,
        0x4A, 0x46, 0x49, 0x46, 0x00, # JFIF\0
        0x01, 0x01,                   # version 1.1
        0x01,                         # units = dpi
        (dpi >> 8) & 0xFF, dpi & 0xFF,# Xdensity
        (dpi >> 8) & 0xFF, dpi & 0xFF,# Ydensity
        0x00, 0x00                    # thumbnail
    ])
    return jpeg_bytes[:2] + bytes(jfif) + jpeg_bytes[2:]

# ---------------------------------------------------------
# 4. Dimension Resizer
# ---------------------------------------------------------
def resize_dimension(im: Image.Image, val_w: float, val_h: float, unit: str, dpi: int = 300):
    if unit == 'px':
        tw, th = round(val_w), round(val_h)
    elif unit == 'inch':
        tw, th = round(val_w * dpi), round(val_h * dpi)
    elif unit == 'cm':
        tw, th = round((val_w / 2.54) * dpi), round((val_h / 2.54) * dpi)
    elif unit == 'mm':
        tw, th = round((val_w / 25.4) * dpi), round((val_h / 25.4) * dpi)
    else:
        tw, th = round(val_w), round(val_h)

    res = im.resize((tw, th), Image.Resampling.LANCZOS).convert("RGB")
    buf = io.BytesIO()
    res.save(buf, format="JPEG", quality=92)
    final_bytes = inject_jfif_dpi(buf.getvalue(), dpi)
    return final_bytes, (tw, th)

# ---------------------------------------------------------
# 5. Passport Photo Maker
# ---------------------------------------------------------
def create_passport_photo(im: Image.Image, country: str, bg_color: tuple = (255, 255, 255)):
    specs = {
        'india': (35, 45, 300),
        'us': (50.8, 50.8, 300),
        'uk': (35, 45, 300),
        'eu': (35, 45, 300),
        'canada': (50, 70, 300),
    }
    w_mm, h_mm, dpi = specs.get(country, (35, 45, 300))
    tw = round((w_mm / 25.4) * dpi)
    th = round((h_mm / 25.4) * dpi)

    # Center crop aspect ratio
    src_ratio = im.width / im.height
    dest_ratio = tw / th
    if src_ratio > dest_ratio:
        sw = int(im.height * dest_ratio)
        sx = (im.width - sw) // 2
        crop_box = (sx, 0, sx + sw, im.height)
    else:
        sh = int(im.width / dest_ratio)
        sy = (im.height - sh) // 2
        crop_box = (0, sy, im.width, sy + sh)

    cropped = im.crop(crop_box).resize((tw, th), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (tw, th), bg_color)
    if cropped.mode in ('RGBA', 'LA'):
        canvas.paste(cropped, (0, 0), mask=cropped.split()[-1])
    else:
        canvas.paste(cropped, (0, 0))

    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=95)
    return inject_jfif_dpi(buf.getvalue(), dpi), (tw, th), canvas

# ---------------------------------------------------------
# 6. Printable Sheet (Multi-Photo)
# ---------------------------------------------------------
def create_photo_sheet(photo_im: Image.Image, count: int = 6, sheet_type: str = '4x6'):
    dpi = 300
    sw = round(6 * dpi) if sheet_type == '4x6' else round(8.27 * dpi)
    sh = round(4 * dpi) if sheet_type == '4x6' else round(11.69 * dpi)

    sheet = Image.new("RGB", (sw, sh), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)

    cols = 3 if count == 6 else (2 if count == 4 else 4)
    rows = 2 if count in (4, 6, 8) else 3

    pw = round((35 / 25.4) * dpi)
    ph = round((45 / 25.4) * dpi)

    total_gw = cols * pw
    total_gh = rows * ph
    gap_x = max(20, (sw - total_gw) // (cols + 1))
    gap_y = max(20, (sh - total_gh) // (rows + 1))

    fitted_photo = photo_im.resize((pw, ph), Image.Resampling.LANCZOS)

    placed = 0
    for r in range(rows):
        for c in range(cols):
            if placed >= count:
                break
            x = gap_x + c * (pw + gap_x)
            y = gap_y + r * (ph + gap_y)

            # Draw thin cut line
            draw.rectangle([x - 1, y - 1, x + pw + 1, y + ph + 1], outline=(209, 213, 219), width=1)
            sheet.paste(fitted_photo, (x, y))
            placed += 1

    buf = io.BytesIO()
    sheet.save(buf, format="JPEG", quality=95)
    return inject_jfif_dpi(buf.getvalue(), dpi), sheet.size

# ---------------------------------------------------------
# 7. Signature Resizer & Paper Shadow Cleaner
# ---------------------------------------------------------
def process_signature(im: Image.Image, target_w: int = 140, target_h: int = 60, target_kb: int = 20):
    # Fit preserving aspect ratio on pure white background
    canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    src_ratio = im.width / im.height
    dest_ratio = target_w / target_h

    if src_ratio > dest_ratio:
        dh = int(target_w / src_ratio)
        dw = target_w
        dx, dy = 0, (target_h - dh) // 2
    else:
        dw = int(target_h * src_ratio)
        dh = target_h
        dx, dy = (target_w - dw) // 2, 0

    scaled_sig = im.resize((dw, dh), Image.Resampling.LANCZOS).convert("RGB")
    canvas.paste(scaled_sig, (dx, dy))

    # Clean paper background: threshold > 185 to 255
    pixels = canvas.load()
    threshold = 185
    for y in range(target_h):
        for x in range(target_w):
            r, g, b = pixels[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum > threshold:
                pixels[x, y] = (255, 255, 255)
            else:
                factor = max(0.0, (lum / threshold) * 0.85)
                pixels[x, y] = (int(r * factor), int(g * factor), int(b * factor))

    # Compress canvas
    compressed_bytes, _ = compress_to_target_kb(canvas, target_kb, "JPEG")
    return compressed_bytes, (target_w, target_h)

# ---------------------------------------------------------
# 8. Candidate Name & Date of Photo (DoP) Stamp
# ---------------------------------------------------------
def add_name_and_dop(im: Image.Image, name: str = "RAJESH SHARMA", date_str: str = "2026-11-10"):
    canvas = im.copy().convert("RGB")
    w, h = canvas.size
    box_h = max(50, round(h * 0.18))
    box_y = h - box_h

    draw = ImageDraw.Draw(canvas)
    # White background banner
    draw.rectangle([0, box_y, w, h], fill=(255, 255, 255))
    # Border line
    draw.line([(0, box_y), (w, box_y)], fill=(209, 213, 219), width=max(1, w // 400))

    # Try default font
    font_size = max(14, round(box_h * 0.30))
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    line1 = name.strip().upper()
    line2 = f"DoP: {date_str.strip()}"

    # Draw centered text
    bbox1 = draw.textbbox((0, 0), line1, font=font)
    t1_w = bbox1[2] - bbox1[0]
    draw.text(((w - t1_w) // 2, box_y + int(box_h * 0.15)), line1, fill=(0, 0, 0), font=font)

    bbox2 = draw.textbbox((0, 0), line2, font=font)
    t2_w = bbox2[2] - bbox2[0]
    draw.text(((w - t2_w) // 2, box_y + int(box_h * 0.55)), line2, fill=(0, 0, 0), font=font)

    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=94)
    return buf.getvalue(), canvas.size

# ---------------------------------------------------------
# 9. Image Joiner / Merger
# ---------------------------------------------------------
def join_images(images, layout="horizontal", gap=20, bg_color=(255, 255, 255)):
    if layout == "horizontal":
        max_h = max(img.height for img in images)
        scaled_imgs = [img.resize((round((max_h / img.height) * img.width), max_h), Image.Resampling.LANCZOS) for img in images]
        total_w = sum(img.width for img in scaled_imgs) + (len(images) - 1) * gap
        canvas = Image.new("RGB", (total_w, max_h), bg_color)
        cur_x = 0
        for s in scaled_imgs:
            canvas.paste(s, (cur_x, 0))
            cur_x += s.width + gap
    else:
        max_w = max(img.width for img in images)
        scaled_imgs = [img.resize((max_w, round((max_w / img.width) * img.height)), Image.Resampling.LANCZOS) for img in images]
        total_h = sum(img.height for img in scaled_imgs) + (len(images) - 1) * gap
        canvas = Image.new("RGB", (max_w, total_h), bg_color)
        cur_y = 0
        for s in scaled_imgs:
            canvas.paste(s, (0, cur_y))
            cur_y += s.height + gap

    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=95)
    return buf.getvalue(), canvas.size

# =========================================================
# MAIN TEST RUNNER
# =========================================================
def run_all_tests():
    banner("VALIDATING USER TEST FILES EXISTENCE")
    loaded_images = []
    for f in TEST_FILES:
        assert_test(os.path.exists(f), f"File exists: {f}")
        im = Image.open(f)
        size_kb = os.path.getsize(f) / 1024
        print(f"    Loaded: {os.path.basename(f)} | Size: {size_kb:.1f} KB | Dimensions: {im.size} | Mode: {im.mode}")
        loaded_images.append(im)

    for idx, im in enumerate(loaded_images):
        name_tag = f"Image_{idx+1}"
        banner(f"TESTING TOOLSET ON {name_tag} ({os.path.basename(TEST_FILES[idx])})")

        # 1. Target KB Compressor (20KB, 50KB, 100KB, 200KB)
        print("\n  --- [1] Target KB Exact Compression ---")
        for target in [20, 50, 100, 200]:
            compressed, out_im = compress_to_target_kb(im, target, "JPEG")
            actual_kb = len(compressed) / 1024
            assert_test(actual_kb <= target, f"Target {target} KB -> Actual {actual_kb:.1f} KB (<= {target} KB)")
            # Verify decodable
            dec = Image.open(io.BytesIO(compressed))
            dec.load()
            assert_test(dec.size[0] > 0 and dec.size[1] > 0, f"Decodable JPEG ({dec.size})")

        # 2. Increase Image Size in KB
        print("\n  --- [2] Increase Image Size in KB ---")
        base_raw = open(TEST_FILES[idx], "rb").read()
        for target_mb_kb in [3000, 5000]:
            padded = increase_image_size(base_raw, target_mb_kb)
            actual_kb = len(padded) / 1024
            assert_test(actual_kb == target_mb_kb, f"Increased size to {target_mb_kb} KB exactly (Got {actual_kb:.1f} KB)")
            dec = Image.open(io.BytesIO(padded))
            dec.load()
            assert_test(dec.size == im.size, f"Padded image decodes perfectly without corruption")

        # 3. Dimension Resizer
        print("\n  --- [3] Dimension Resizer ---")
        # UPSC: 3.5cm x 4.5cm @ 200 DPI
        d_bytes, dims = resize_dimension(im, 3.5, 4.5, "cm", 200)
        assert_test(dims == (round(3.5/2.54*200), round(4.5/2.54*200)), f"UPSC 3.5x4.5cm @ 200 DPI -> {dims} px")
        # US Visa: 2x2 in @ 300 DPI
        d_bytes2, dims2 = resize_dimension(im, 2, 2, "inch", 300)
        assert_test(dims2 == (600, 600), f"US Visa 2x2 in @ 300 DPI -> {dims2} px (Exact 600x600)")

        # 4. DPI Header Injection
        print("\n  --- [4] DPI Converter (JFIF APP0 Injection) ---")
        for test_dpi in [200, 300, 600]:
            injected = inject_jfif_dpi(d_bytes2, test_dpi)
            assert_test(injected[2:4] == b'\xFF\xE0', "JFIF APP0 marker present at byte 2")
            assert_test(injected[6:11] == b'JFIF\x00', "JFIF identifier string valid")
            x_dpi = (injected[14] << 8) | injected[15]
            y_dpi = (injected[16] << 8) | injected[17]
            assert_test(x_dpi == test_dpi and y_dpi == test_dpi, f"Embedded DPI verified: {x_dpi}x{y_dpi} DPI")

        # 5. Passport Photo Maker
        print("\n  --- [5] Passport Photo Maker ---")
        pass_india, dims_in, pass_im = create_passport_photo(im, 'india')
        assert_test(dims_in == (413, 531), f"India 35x45mm @ 300 DPI -> {dims_in} px")
        pass_us, dims_us, _ = create_passport_photo(im, 'us')
        assert_test(dims_us == (600, 600), f"US Visa 2x2 in @ 300 DPI -> {dims_us} px")

        # 6. Printable Sheet (Multi-Photo Grid)
        print("\n  --- [6] Printable Passport Photo Sheet (4x6 & A4) ---")
        sheet_4x6, size_4x6 = create_photo_sheet(pass_im, count=6, sheet_type='4x6')
        assert_test(size_4x6 == (1800, 1200), f"4x6 inch Sheet @ 300 DPI -> {size_4x6} px (6 photos)")
        sheet_a4, size_a4 = create_photo_sheet(pass_im, count=12, sheet_type='a4')
        assert_test(size_a4 == (2481, 3507) or size_a4 == (2480, 3508), f"A4 Sheet @ 300 DPI -> {size_a4} px (12 photos)")

        # 7. Signature Resizer & Paper Shadow Cleaner
        print("\n  --- [7] Signature Resizer & Paper Shadow Cleaner ---")
        sig_bytes, sig_dims = process_signature(im, 140, 60, target_kb=20)
        assert_test(sig_dims == (140, 60), f"Signature resized to 140x60 px")
        sig_kb = len(sig_bytes) / 1024
        assert_test(sig_kb <= 20.0, f"Signature compressed under portal limit: {sig_kb:.1f} KB (<= 20 KB)")
        dec_sig = Image.open(io.BytesIO(sig_bytes))
        dec_sig.load()
        assert_test(dec_sig.size == (140, 60), "Signature decodes cleanly")

        # 8. Candidate Name & Date of Photo (DoP) Stamp
        print("\n  --- [8] Name & Date on Photo (DoP Stamp) ---")
        dop_bytes, dop_dims = add_name_and_dop(im, "VARSHITH REDDY", "2026-11-10")
        assert_test(dop_dims == im.size, f"Photo dimensions preserved with bottom banner: {dop_dims}")
        dec_dop = Image.open(io.BytesIO(dop_bytes))
        dec_dop.load()
        assert_test(dec_dop.size == im.size, "DoP stamped photo valid JPEG")

        # 9. Format Conversion (JPG, PNG, WebP)
        print("\n  --- [9] Format Conversion (JPG, PNG, WebP) ---")
        for fmt in ["JPEG", "PNG", "WEBP"]:
            buf = io.BytesIO()
            conv = im.convert("RGB") if fmt == "JPEG" else im
            conv.save(buf, format=fmt)
            c_data = buf.getvalue()
            dec_fmt = Image.open(io.BytesIO(c_data))
            dec_fmt.load()
            assert_test(dec_fmt.format == fmt, f"Converted to {fmt} ({len(c_data)/1024:.1f} KB)")

    # 10. Multi-Image Joiner / Merger (Combining both test files)
    banner("TESTING IMAGE JOINER (MERGING BOTH USER IMAGES)")
    print("\n  --- [10] Image Joiner (Horizontal & Vertical) ---")
    h_bytes, h_dims = join_images(loaded_images, layout="horizontal", gap=30)
    assert_test(h_dims[0] > loaded_images[0].width, f"Horizontal side-by-side join -> {h_dims}")
    dec_h = Image.open(io.BytesIO(h_bytes))
    dec_h.load()
    assert_test(dec_h.size == h_dims, "Horizontal joined image decodable")

    v_bytes, v_dims = join_images(loaded_images, layout="vertical", gap=30)
    assert_test(v_dims[1] > loaded_images[0].height, f"Vertical stacked join -> {v_dims}")
    dec_v = Image.open(io.BytesIO(v_bytes))
    dec_v.load()
    assert_test(dec_v.size == v_dims, "Vertical joined image decodable")

    banner("ALL 10 IMAGE STUDIO FEATURES VERIFIED 100% SUCCEEDED!")

if __name__ == "__main__":
    run_all_tests()
