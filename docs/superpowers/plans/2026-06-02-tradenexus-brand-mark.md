# TradeNexus Brand Mark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the missing favicon and placeholder blue-circle logo with the Orbital Bridge brand mark across all app surfaces.

**Architecture:** SVG-first approach. The mark is defined once as inline SVG and adapted per context. PNG raster icons are generated from SVG via Python cairosvg for PWA/apple-touch fallbacks. All assets live in `public/`. The App.tsx nav rail inlines the SVG directly (no network request for a 40px icon).

**Tech Stack:** SVG, Python cairosvg + PIL (for PNG generation), React/TSX inline SVG

---

### Task 1: Create favicon SVG

**Files:**
- Create: `public/favicon.svg`

The favicon SVG uses scaled-up stroke widths so the mark remains legible at 16×16 and 32×32. Same 52×52 viewBox as the primary mark but with thicker strokes.

- [ ] **Step 1: Write the favicon SVG file**

```bash
cat > public/favicon.svg << 'SVGEOF'
<svg width="32" height="32" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer ring (thicker for favicon legibility) -->
  <circle cx="26" cy="26" r="20" stroke="#3b82f6" stroke-width="4" fill="none"/>
  <!-- Upper orbital arc -->
  <path d="M14 26 A12 12 0 0 1 38 26" stroke="#3b82f6" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Lower orbital arc -->
  <path d="M14 26 A12 12 0 0 0 38 26" stroke="#60a5fa" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Left anchor -->
  <circle cx="14" cy="26" r="4.5" fill="#3b82f6"/>
  <circle cx="14" cy="26" r="2.2" fill="white"/>
  <!-- Right anchor -->
  <circle cx="38" cy="26" r="4.5" fill="#60a5fa"/>
  <circle cx="38" cy="26" r="2.2" fill="white"/>
  <!-- Center nexus -->
  <circle cx="26" cy="26" r="6" fill="#3b82f6"/>
  <circle cx="26" cy="26" r="3" fill="white"/>
</svg>
SVGEOF
```

- [ ] **Step 2: Verify the file was written**

```bash
head -3 public/favicon.svg && echo "exists"
```

- [ ] **Step 3: Commit**

```bash
git add public/favicon.svg
git commit -m "feat: add favicon SVG with Orbital Bridge mark

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Create logo SVG (horizontal lockup with wordmark)

**Files:**
- Create: `public/logo.svg`

Full horizontal lockup: icon on the left, "TradeNexus" text on the right. Used for OG images, docs, and any context needing the full brand mark.

- [ ] **Step 1: Write the logo SVG file**

```bash
cat > public/logo.svg << 'SVGEOF'
<svg width="220" height="40" viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Orbital Bridge mark (40x40 at x=0) -->
  <circle cx="20" cy="20" r="15" stroke="#3b82f6" stroke-width="2.5" fill="none"/>
  <path d="M10 20 A10 10 0 0 1 30 20" stroke="#3b82f6" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M10 20 A10 10 0 0 0 30 20" stroke="#60a5fa" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="10" cy="20" r="3.5" fill="#3b82f6"/>
  <circle cx="10" cy="20" r="1.8" fill="white"/>
  <circle cx="30" cy="20" r="3.5" fill="#60a5fa"/>
  <circle cx="30" cy="20" r="1.8" fill="white"/>
  <circle cx="20" cy="20" r="4.5" fill="#3b82f6"/>
  <circle cx="20" cy="20" r="2.2" fill="white"/>
  <!-- Wordmark -->
  <text x="52" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" letter-spacing="-0.5" fill="white">TradeNexus</text>
</svg>
SVGEOF
```

- [ ] **Step 2: Verify**

```bash
grep "TradeNexus" public/logo.svg && echo "exists"
```

- [ ] **Step 3: Commit**

```bash
git add public/logo.svg
git commit -m "feat: add horizontal logo SVG lockup

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Generate PNG app icons from SVG

**Files:**
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Create: `public/apple-touch-icon.png`

Use Python cairosvg to rasterize the favicon SVG at the required sizes. The mark is rendered centered on a dark slate-950 background.

- [ ] **Step 1: Write and run the PNG generation script**

```python
# Save as /tmp/generate_icons.py
import cairosvg
from PIL import Image
import io

svg_source = open('public/favicon.svg', 'r').read()

# Wrap mark on dark background for app icons
def wrap_on_bg(svg_mark, size):
    """Center the 52x52 viewBox mark on a dark rounded-rect canvas."""
    # Scale factor: the mark viewBox is 52x52, we want it ~70% of the canvas
    mark_px = int(size * 0.65)
    offset = (size - mark_px) // 2
    return f'''<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="{size}" height="{size}" rx="{size*0.2}" fill="#0f172a"/>
      <g transform="translate({offset},{offset}) scale({mark_px/52})">
        {svg_mark.replace('<svg width="32" height="32" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
      </g>
    </svg>'''

sizes = {
    'public/icon-192.png': 192,
    'public/icon-512.png': 512,
    'public/apple-touch-icon.png': 180,
}

for path, size in sizes.items():
    wrapped = wrap_on_bg(svg_source, size)
    png_bytes = cairosvg.svg2png(bytestring=wrapped.encode('utf-8'), output_width=size, output_height=size)
    img = Image.open(io.BytesIO(png_bytes))
    img.save(path, 'PNG')
    print(f'Created {path} ({size}x{size})')
```

Run with:
```bash
python3 /tmp/generate_icons.py
```

Expected output:
```
Created public/icon-192.png (192x192)
Created public/icon-512.png (512x512)
Created public/apple-touch-icon.png (180x180)
```

- [ ] **Step 2: Verify files exist and have reasonable sizes**

```bash
ls -lh public/icon-192.png public/icon-512.png public/apple-touch-icon.png
```

- [ ] **Step 3: Commit**

```bash
git add public/icon-192.png public/icon-512.png public/apple-touch-icon.png
git commit -m "feat: add PNG app icons (192, 512, apple-touch-180)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Add favicon and icon meta tags to index.html

**Files:**
- Modify: `index.html`

Add `<link>` tags for SVG favicon, PNG fallback, Apple touch icon, and PWA manifest icons. Also add a `<link rel="manifest">` if one doesn't exist yet (we'll create a minimal one) and a theme-color meta tag.

- [ ] **Step 1: Read current head section to find insertion point**

The tags go inside `<head>`, after the existing `<link rel="stylesheet" href="/index.css">`.

- [ ] **Step 2: Add favicon and icon meta tags**

Insert after `<link rel="stylesheet" href="/index.css">` in `index.html`:

```html
    <!-- Favicon & App Icons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#0f172a" />
```

The exact edit is: find the line `<link rel="stylesheet" href="/index.css">` and append the block above after it.

- [ ] **Step 3: Verify the edit**

```bash
grep -c "favicon" index.html
# Expected: at least 1
grep "apple-touch-icon" index.html
# Expected: match found
grep "theme-color" index.html
# Expected: match found
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add favicon, apple-touch-icon, and theme-color meta tags

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Replace nav rail blue circle with SVG mark in App.tsx

**Files:**
- Modify: `App.tsx:1242-1251`

Replace the plain `<button>` with `bg-primary-500/90 rounded-full` (a featureless blue circle) with a button containing the Orbital Bridge SVG. Keep the same `onClick`, `aria-label`, and `title` attributes.

- [ ] **Step 1: Read the current button code at lines 1242-1251 of App.tsx**

Current code:
```tsx
        <button
          onClick={() => {
            setView('OPERATIONS');
            setSelectedLeadId(null);
            setIsSidebarOpen(true);
          }}
          className="w-9 h-9 rounded-full bg-primary-500/90 shadow-lg shadow-primary-500/20"
          aria-label="TradeNexus home"
          title="TradeNexus"
        />
```

- [ ] **Step 2: Replace the button with SVG mark version**

Replace the button block with:

```tsx
        <button
          onClick={() => {
            setView('OPERATIONS');
            setSelectedLeadId(null);
            setIsSidebarOpen(true);
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-primary-500/90 shadow-lg shadow-primary-500/20"
          aria-label="TradeNexus home"
          title="TradeNexus"
        >
          <svg width="24" height="24" viewBox="0 0 52 52" fill="none" className="w-5 h-5">
            <circle cx="26" cy="26" r="20" stroke="white" strokeWidth="2.5" fill="none" opacity="0.7"/>
            <path d="M14 26 A12 12 0 0 1 38 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M14 26 A12 12 0 0 0 38 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
            <circle cx="14" cy="26" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="38" cy="26" r="3.5" fill="white" opacity="0.7"/>
            <circle cx="26" cy="26" r="4.5" fill="white"/>
            <circle cx="26" cy="26" r="2.2" fill="#3b82f6"/>
          </svg>
        </button>
```

Note: The SVG uses white strokes on the blue button background rather than the blue-on-dark version. This creates a clean white-on-blue monogram look for the nav rail button. The white variant works because the button already has `bg-primary-500/90` as its background.

- [ ] **Step 3: Verify the edit**

```bash
grep -c "viewBox=\"0 0 52 52\"" App.tsx
# Expected: 1 (the new SVG is present)
grep "bg-primary-500/90 rounded-full" App.tsx
# Expected: 1 (still has the background, but now also has the SVG inside)
```

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: replace plain blue circle with Orbital Bridge SVG in nav rail

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Update LandingPage nav logo with SVG mark

**Files:**
- Modify: `components/LandingPage.tsx`

The landing page nav has a pulsing blue dot inside a rounded square as its logo placeholder. Replace it with the same white-on-blue SVG mark used in App.tsx.

- [ ] **Step 1: Read the current logo code**

Current (approx line 52-57):
```tsx
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              TradeNexus <span className="text-blue-500">AI</span>
            </span>
```

- [ ] **Step 2: Replace the logo div with SVG mark**

Replace the `<div>` containing the pulsing dot with:

```tsx
            <div className="w-8 h-8 bg-primary-500/90 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="20" stroke="white" strokeWidth="2.5" fill="none" opacity="0.7"/>
                <path d="M14 26 A12 12 0 0 1 38 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M14 26 A12 12 0 0 0 38 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
                <circle cx="14" cy="26" r="3.5" fill="white" opacity="0.9"/>
                <circle cx="38" cy="26" r="3.5" fill="white" opacity="0.7"/>
                <circle cx="26" cy="26" r="4.5" fill="white"/>
                <circle cx="26" cy="26" r="2.2" fill="#3b82f6"/>
              </svg>
            </div>
```

- [ ] **Step 3: Verify the edit**

```bash
grep -c "viewBox=\"0 0 52 52\"" components/LandingPage.tsx
# Expected: 1
```

- [ ] **Step 4: Commit**

```bash
git add components/LandingPage.tsx
git commit -m "feat: replace landing page nav placeholder with Orbital Bridge SVG

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Verify end-to-end

- [ ] **Step 1: Check all files exist**

```bash
ls -1 public/favicon.svg public/logo.svg public/icon-192.png public/icon-512.png public/apple-touch-icon.png
```

- [ ] **Step 2: Verify index.html has the required meta tags**

```bash
grep -E 'favicon|apple-touch-icon|theme-color' index.html
```

- [ ] **Step 3: Verify App.tsx has the inline SVG**

```bash
grep "viewBox=\"0 0 52 52\"" App.tsx
```

- [ ] **Step 4: Start the dev server and check there are no build errors**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000 | head -20
# Should return HTML without errors
```

- [ ] **Step 5: Verify favicon is served**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/favicon.svg
# Expected: 200
```

- [ ] **Step 6: Commit final verification notes**

```bash
git add -A
git commit -m "chore: final verification of brand mark rollout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
