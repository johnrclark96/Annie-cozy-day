# Sprite Processing Instructions for Claude Code

## Task

Process three uploaded sprite sheet images (white backgrounds, not transparent), crop each individual sprite, remove white backgrounds, scale them ~1.5x, and append them to the bottom of the existing sprite atlas at `assets/cozy-sprites-atlas.webp`. Then update `src/09-sprites.js` with the new frame coordinates.

## CRITICAL: WebP Height Limit

The WebP format has a **hard limit of 16383 pixels** in any dimension. The existing atlas is 1024×10757px. You must stay under 16383px total height. Use **1.5x scaling** (not 1.7-1.8x). Pack smaller sprites side-by-side where possible (e.g. dogTreats + catTreats on the same row, foodBowl + waterBowl on the same row).

## CRITICAL: Don't Corrupt the Atlas

**Never write output to the same path as the source atlas.** Write to a new file first, verify it loads, THEN replace the original. The atlas at `assets/cozy-sprites-atlas.webp` is the only copy (besides `dist/assets/`).

## Input Files

### Image 1 — Obi (beagle) new poses (4 sprites stacked vertically, white background)
- `eat` — standing, head in red food bowl, bandana on
- `drink` — standing, head in blue water bowl, bandana on
- `carryToy` — trotting with bone in mouth, bandana on  
- `bath` — sitting in metal tub with soap bubbles, no bandana

### Image 2 — Luna (bengal cat) new poses (4 sprites stacked vertically, white background)
- `eat` — standing, head in brown food bowl
- `drink` — standing, head in blue water bowl, tongue out
- `stretch` — classic cat stretch (front paws forward, rear up, yawning)
- `bath` — angry cat face in metal basin with bubbles

### Image 3 — Items (5 items stacked vertically, white background)
- `foodBowl` — cream bowl with paw print, full of kibble
- `waterBowl` — blue bowl with paw print, full of water
- `giftBox` — red/coral with heart pattern, gold bow
- `dogTreats` — bone biscuit + round cookies + small training treats
- `catTreats` — fish-shaped + round treats in salmon/pink tones

## Processing Steps

### 1. Install dependencies
```bash
pip install Pillow numpy --break-system-packages
```

### 2. Analyze each image to find sprite bounding boxes
Each image is 1024×1536 RGBA. Sprites are on **white backgrounds** (not black). Scan for contiguous rows of non-white content to find the vertical blocks, then find horizontal extent within each block.

Detection criteria for "background" pixels: `(R > 235 AND G > 235 AND B > 235 AND A > 100) OR (A < 30)`

### 3. Crop each sprite
For each detected block, crop it out with ~4px margin, then:
- Make near-white pixels transparent (R>235 && G>235 && B>235 && A>100 → set A=0)
- Trim to actual content bounding box (remove transparent edges)

### 4. Scale
Scale each cropped sprite by **1.5x** using LANCZOS resampling. This is slightly smaller than the original atlas sprites (~1.7-1.8x) but necessary to stay under the WebP height limit.

### 5. Pack into atlas
- Load existing atlas from `assets/cozy-sprites-atlas.webp` (1024×10757)
- Append new sprites below the existing content
- Use 8px padding between sprites and from the left edge
- **Pack smaller sprites side-by-side** to save vertical space:
  - `dogTreats` + `catTreats` on the same row
  - `foodBowl` + `waterBowl` on the same row (if they fit — each is ~616px wide, so they won't fit side by side at 1024. Keep them stacked.)
- Record the exact `{x, y, w, h}` for each placed sprite

### 6. Save new atlas
- Save to a NEW temporary file first (e.g. `assets/cozy-sprites-atlas-new.webp`)
- Verify it loads correctly with `Image.open()`
- **ONLY THEN** replace the original and copy to `dist/assets/`
- Save as WebP, quality=90

### 7. Update `src/09-sprites.js`

Add the new frame entries into the existing `SPRITE_FRAME_BOXES` object. The structure is:

```js
const SPRITE_FRAME_BOXES = {
    "annie": { ... },
    "obi": {
        "sitHappy": { ... },
        // ... existing frames ...
        // ADD NEW OBI FRAMES HERE:
        "eat": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "drink": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "carryToy": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "bath": { "x": ??, "y": ??, "w": ??, "h": ?? }
    },
    "luna": {
        "sit": { ... },
        // ... existing frames ...
        // ADD NEW LUNA FRAMES HERE:
        "eat": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "drink": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "stretch": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "bath": { "x": ??, "y": ??, "w": ??, "h": ?? }
    },
    "items": {
        "yarnBall": { ... },
        "brush": { ... },
        // ADD NEW ITEM FRAMES HERE:
        "foodBowl": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "waterBowl": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "giftBox": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "dogTreats": { "x": ??, "y": ??, "w": ??, "h": ?? },
        "catTreats": { "x": ??, "y": ??, "w": ??, "h": ?? }
    }
};
```

Fill in the actual coordinates from step 5.

### 8. Rebuild
```bash
node build.js
```

### 9. Verify
- Confirm build passes syntax check
- Confirm new atlas loads: `python3 -c "from PIL import Image; img = Image.open('assets/cozy-sprites-atlas.webp'); print(img.size)"`
- Confirm atlas height < 16383

## Existing Atlas Reference

The existing atlas is 1024×10757px. The last existing sprite ends around y=10749 (brush item at y=10455, h=294 → bottom at 10749). New content should start at approximately y=10757 + 8 = 10765.

## Do NOT Modify

- Do NOT change any existing frame coordinates in SPRITE_FRAME_BOXES
- Do NOT change `drawObiSprite`, `drawLunaSprite`, or any rendering functions yet — just add the frame data. The rendering code to USE these new frames will be done separately.
- Do NOT change `SPRITE_BASE_SCALE`
