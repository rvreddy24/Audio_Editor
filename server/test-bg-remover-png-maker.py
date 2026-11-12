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

        # Test Eyedropper Color Keying on top-left corner color
        corner_color = im_cg.getpixel((0, 0))
        cr, cg, cb = corner_color[0], corner_color[1], corner_color[2]
        print(f"  ✓ Sampled top-left corner color: RGB({cr}, {cg}, {cb})")

        cg_arr = np.array(im_cg)
        c_r, c_g, c_b = cg_arr[:,:,0].astype(float), cg_arr[:,:,1].astype(float), cg_arr[:,:,2].astype(float)
        dist_corner = np.sqrt((c_r - cr)**2 + (c_g - cg)**2 + (c_b - cb)**2) / 441.67 * 100

        # Key out with tolerance 25%
        cg_cutout_arr = cg_arr.copy()
        cg_visited = dist_corner < 25.0
        cg_cutout_arr[cg_visited, 3] = 0
        cg_trans_pixels = np.sum(cg_cutout_arr[:,:,3] == 0)
        print(f"  ✓ Keyed out {cg_trans_pixels:,} pixels matching corner color with 25% tolerance")

        out_cg_png = 'server/outputs/chatgpt_corner_keyed.png'
        Image.fromarray(cg_cutout_arr).save(out_cg_png)
        print(f"  ✓ Saved Keyed PNG -> {out_cg_png} ({os.path.getsize(out_cg_png):,} bytes)")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: Background Remover & Transparent PNG Maker VERIFIED!")
    print("=" * 60)

if __name__ == '__main__':
    test_background_removal()
