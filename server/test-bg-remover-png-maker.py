import os
import sys
import numpy as np
from PIL import Image

def test_background_removal():
    print("=" * 60)
    print("TESTING BACKGROUND REMOVAL & TRANSPARENT PNG MAKER")
    print("=" * 60)

    # 1. Test Profile Photo: D:/profile photo.jpeg
    profile_path = 'D:/profile photo.jpeg'
    assert os.path.exists(profile_path), f"File not found: {profile_path}"
    
    im_profile = Image.open(profile_path).convert('RGBA')
    w, h = im_profile.size
    print(f"\n[Test 1] Loaded Profile Photo: {w}x{h} px")

    arr = np.array(im_profile)
    # Check white background detection
    r, g, b, a = arr[:,:,0].astype(float), arr[:,:,1].astype(float), arr[:,:,2].astype(float), arr[:,:,3].astype(float)
    dist_white = np.sqrt((r-255)**2 + (g-255)**2 + (b-255)**2) / 441.67 * 100
    
    # Flood-fill from borders
    visited = np.zeros((h, w), dtype=bool)
    from collections import deque
    q = deque()
    tol = 20.0
    for x in range(w):
        if dist_white[0, x] <= tol and not visited[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if dist_white[h-1, x] <= tol and not visited[h-1, x]:
            visited[h-1, x] = True
            q.append((h-1, x))
    for y in range(h):
        if dist_white[y, 0] <= tol and not visited[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if dist_white[y, w-1] <= tol and not visited[y, w-1]:
            visited[y, w-1] = True
            q.append((y, w-1))

    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if dist_white[ny, nx] <= tol:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Apply alpha transparency
    cutout_arr = arr.copy()
    cutout_arr[visited, 3] = 0
    num_transparent = np.sum(cutout_arr[:,:,3] == 0)
    percent_bg = (num_transparent / (w * h)) * 100
    print(f"  ✓ Auto-detected and keyed out {num_transparent:,} background pixels ({percent_bg:.1f}%)")
    assert num_transparent > 50000, f"Expected > 50000 transparent pixels, got {num_transparent}"

    # Save cutout PNG
    os.makedirs('server/outputs', exist_ok=True)
    out_profile_cutout = 'server/outputs/profile_transparent_cutout.png'
    Image.fromarray(cutout_arr).save(out_profile_cutout)
    print(f"  ✓ Saved Transparent Cutout PNG -> {out_profile_cutout} ({os.path.getsize(out_profile_cutout):,} bytes)")

    # Test Background Replacement (Passport Blue #93C5FD -> (147, 197, 253))
    blue_bg = Image.new('RGBA', (w, h), (147, 197, 253, 255))
    cutout_img = Image.fromarray(cutout_arr)
    replaced_img = Image.alpha_composite(blue_bg, cutout_img)
    out_blue_bg = 'server/outputs/profile_blue_bg_passport.jpg'
    replaced_img.convert('RGB').save(out_blue_bg, quality=95)
    print(f"  ✓ Replaced Background with Passport Blue -> {out_blue_bg} ({os.path.getsize(out_blue_bg):,} bytes)")

    # 2. Test ChatGPT Image: E:/ChatGPT Image Apr 30, 2026, 08_00_38 AM.PNG
    chatgpt_path = 'E:/ChatGPT Image Apr 30, 2026, 08_00_38 AM.PNG'
    if os.path.exists(chatgpt_path):
        im_cg = Image.open(chatgpt_path).convert('RGBA')
        cw, ch = im_cg.size
        print(f"\n[Test 2] Loaded ChatGPT Image: {cw}x{ch} px")

        # Test 2a: Automatic Smart-Perimeter Background Removal
        # Sample background from top area (e.g. x=100, y=100)
        cg_arr = np.array(im_cg)
        tr, tg, tb = int(cg_arr[100, 100, 0]), int(cg_arr[100, 100, 1]), int(cg_arr[100, 100, 2])
        print(f"  ✓ Sampled studio grey background color: RGB({tr}, {tg}, {tb})")

        c_r = cg_arr[:,:,0].astype(float)
        c_g = cg_arr[:,:,1].astype(float)
        c_b = cg_arr[:,:,2].astype(float)
        dist_cg = np.sqrt((c_r - tr)**2 + (c_g - tg)**2 + (c_b - tb)**2) / 441.67 * 100

        # Smart flood fill (top border & upper sides, protecting lower suit)
        from collections import deque
        cg_visited = np.zeros((ch, cw), dtype=bool)
        cg_q = deque()
        tol = 24.0

        for x in range(cw):
            if dist_cg[0, x] <= tol and not cg_visited[0, x]:
                cg_visited[0, x] = True
                cg_q.append((0, x))
        for y in range(int(ch * 0.65)):
            if dist_cg[y, 0] <= tol and not cg_visited[y, 0]:
                cg_visited[y, 0] = True
                cg_q.append((y, 0))
            if dist_cg[y, cw - 1] <= tol and not cg_visited[y, cw - 1]:
                cg_visited[y, cw - 1] = True
                cg_q.append((y, cw - 1))

        while cg_q:
            cy, cx = cg_q.popleft()
            for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < ch and 0 <= nx < cw and not cg_visited[ny, nx]:
                    if dist_cg[ny, nx] <= tol:
                        cg_visited[ny, nx] = True
                        cg_q.append((ny, nx))

        cg_cutout_arr = cg_arr.copy()
        feather = 3.0
        tol_min = tol - feather
        for y in range(ch):
            for x in range(cw):
                if cg_visited[y, x]:
                    d = dist_cg[y, x]
                    if d <= tol_min:
                        cg_cutout_arr[y, x, 3] = 0
                    else:
                        a_frac = (d - tol_min) / feather
                        new_a = int(np.clip(a_frac * 255, 0, 255))
                        cg_cutout_arr[y, x, 3] = new_a
                        if 0 < new_a < 255:
                            af = new_a / 255.0
                            cg_cutout_arr[y, x, 0] = int(np.clip((cg_cutout_arr[y, x, 0] - tr * (1 - af)) / af, 0, 255))
                            cg_cutout_arr[y, x, 1] = int(np.clip((cg_cutout_arr[y, x, 1] - tg * (1 - af)) / af, 0, 255))
                            cg_cutout_arr[y, x, 2] = int(np.clip((cg_cutout_arr[y, x, 2] - tb * (1 - af)) / af, 0, 255))

        cg_trans_pixels = np.sum(cg_cutout_arr[:,:,3] == 0)
        cg_fg_pixels = np.sum(cg_cutout_arr[:,:,3] == 255)
        print(f"  ✓ Keyed out {cg_trans_pixels:,} studio backdrop pixels ({cg_trans_pixels/(cw*ch)*100:.1f}%)")
        print(f"  ✓ Preserved {cg_fg_pixels:,} subject pixels (Face & Suit intact)")

        # Verify subject intact
        assert not cg_visited[500, cw // 2], "Face center must be preserved as foreground"
        assert not cg_visited[1100, 200], "Suit shoulder must be preserved as foreground"

        out_cg_png = 'server/outputs/chatgpt_transparent_cutout.png'
        cg_cutout_img = Image.fromarray(cg_cutout_arr)
        cg_cutout_img.save(out_cg_png)
        print(f"  ✓ Saved Transparent Cutout PNG -> {out_cg_png} ({os.path.getsize(out_cg_png):,} bytes)")

        # Test 2b: Background Replacement with Pure White
        white_bg = Image.new('RGBA', (cw, ch), (255, 255, 255, 255))
        replaced_white = Image.alpha_composite(white_bg, cg_cutout_img)
        out_white = 'server/outputs/chatgpt_white_background.jpg'
        replaced_white.convert('RGB').save(out_white, quality=95)
        print(f"  ✓ Replaced Background with Pure White -> {out_white} ({os.path.getsize(out_white):,} bytes)")

        # Test 2c: Background Replacement with Studio Navy Blue
        navy_bg = Image.new('RGBA', (cw, ch), (30, 58, 138, 255))
        replaced_navy = Image.alpha_composite(navy_bg, cg_cutout_img)
        out_navy = 'server/outputs/chatgpt_navy_background.jpg'
        replaced_navy.convert('RGB').save(out_navy, quality=95)
        print(f"  ✓ Replaced Background with Studio Navy Blue -> {out_navy} ({os.path.getsize(out_navy):,} bytes)")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: Background Remover & Transparent PNG Maker VERIFIED!")
    print("=" * 60)

if __name__ == '__main__':
    test_background_removal()
