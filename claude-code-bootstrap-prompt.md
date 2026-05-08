# Annie's Cozy Day — Playwright Bootstrap Guide

This is everything you need to open, load, and interact with the game `annies-cozy-day-test.html` via Playwright in headless Chromium.

---

## 1. Install Playwright

```bash
pip install playwright --break-system-packages
playwright install chromium
```

---

## 2. Launch Browser with Required Flags

The game is a local HTML file that uses `localStorage` and Canvas. These flags are **mandatory**:

```python
from playwright.async_api import async_playwright

async with async_playwright() as p:
    browser = await p.chromium.launch(
        headless=True,
        args=[
            "--allow-file-access-from-files",   # CRITICAL: game uses localStorage on file:// protocol
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security",           # allows file:// localStorage
        ]
    )

    context = await browser.new_context(
        viewport={"width": 800, "height": 600},  # must match canvas size exactly
        device_scale_factor=1,                     # 1:1 pixel mapping
    )

    page = await context.new_page()
```

---

## 3. Navigate and Wait for Canvas Init

```python
GAME = "file:///path/to/annies-cozy-day-test.html"

await page.goto(GAME)
await page.wait_for_timeout(3000)  # wait for canvas init + font loading
```

The game needs ~2–3 seconds to initialize the Canvas, load fonts (`Fredoka One`), and set up the IIFE.

---

## 4. CRITICAL: Fix Canvas CSS Positioning

The game wraps the `<canvas id="game">` in a centered `<div id="wrap">` with CSS that scales/centers it: `max-width: calc(100vw - 24px)`. This means **viewport coordinates ≠ canvas coordinates** — every click will be offset by ~12px and scaled wrong.

**You MUST inject this CSS fix immediately after the page loads:**

```python
await page.evaluate("""() => {
    const c = document.getElementById('game');
    if (!c) return;
    c.style.maxWidth = 'none';
    c.style.maxHeight = 'none';
    c.style.position = 'fixed';
    c.style.left = '0';
    c.style.top = '0';
    c.style.borderRadius = '0';
    c.style.boxShadow = 'none';
    const w = document.getElementById('wrap');
    if (w) { w.style.display = 'block'; w.style.padding = '0'; w.style.margin = '0'; }
    document.body.style.display = 'block';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
}""")
await page.wait_for_timeout(100)  # let layout settle
```

After this, viewport pixel (x, y) = canvas pixel (x, y). The canvas is 800×600 pinned at (0, 0).

---

## 5. Click Past the Title Screen

The game starts on a title screen. The "Play" button is centered at approximately **(400, 528)**.

```python
await page.mouse.click(400, 528)
await page.wait_for_timeout(1500)  # wait for transition animation to hangout scene
```

After this you'll be in the **hangout scene** — the main game screen.

---

## 6. Dismiss First-Visit Overlays (if any)

On a **true first visit** (no localStorage), the game shows:
1. A **dedication overlay** (must be viewed for ~1.5s before dismissible) — click anywhere to dismiss
2. A **Daily Gift overlay** — click to claim/dismiss
3. A **thought bubble onboarding** tooltip

To **skip all of these**, seed localStorage BEFORE loading the game:

```python
await page.evaluate("""() => {
    localStorage.clear();
    const P = 'anniesCozyDay_';

    // Skip first-visit popups
    localStorage.setItem(P+'firstVisit', 'false');
    localStorage.setItem(P+'bubbleOnboarded', 'true');

    // Minimal required state
    localStorage.setItem(P+'muted', 'false');
    localStorage.setItem(P+'coins', '50');
    localStorage.setItem(P+'pet_obi_joy', '54');
    localStorage.setItem(P+'pet_luna_joy', '56');
    localStorage.setItem(P+'pet_food_fill', '80');
    localStorage.setItem(P+'pet_food_lastFill', String(Date.now()));
    localStorage.setItem(P+'pet_water_fill', '80');
    localStorage.setItem(P+'pet_water_lastFill', String(Date.now()));
    localStorage.setItem(P+'backyardFlowers', '0');
    localStorage.setItem(P+'lastKnownStars', '0');

    // JSON keys (game crashes without these)
    localStorage.setItem(P+'stats', JSON.stringify({
        totalTreatCatches:0, bestTreatCombo:1, bestLaserCombo:1,
        bestCuddle:0, cuddleWon:false, totalSessions:0, totalPhotos:0,
        totalCoinsEarned:0, totalFlowersPlanted:0, totalBowlsFilled:0,
        petInteractionsSeen:0
    }));
    localStorage.setItem(P+'achievements', JSON.stringify({
        obiBestFriend:false, comboStar:false, catWhisperer:false, pouncePerfect:false,
        couchPotato:false, maximumCozy:false, goodWalker:false, napMaster:false,
        squeakyClean:false, sortingPro:false, whackQueen:false, sharpEye:false,
        birdWatcher:false, goodMemory:false, greenThumb:false, shutterBug:false,
        fashionista:false, dedicated:false, socialButterfly:false, fullHouse:false,
        wellFed:false, collector:false
    }));
    localStorage.setItem(P+'decor', JSON.stringify({
        fairyLights:false, plant2:false, petBed:false, rugColor:0,
        lampOn:true, roomPreset:0, timeOfDay:1, wallArt2:0,
        windowPlant:false, cozyBlanket:false, photoWall:false,
        floorCushion:false, corkBoard:false, bookStack:false, couchPillows:0,
        hangingPlant:false, candles:false, wallClock:false, rugPattern:0,
        garland:0, petToys:false, musicBox:false, familyPortrait:false
    }));
    localStorage.setItem(P+'backyardDecor', JSON.stringify({
        windChime:false, gardenGnome:false, picnicBlanket:false,
        birdBath:false, lanterns:false, birdHouse:false,
        sundial:false, dogHouse:false, butterflyGarden:false, fountain:false
    }));
    localStorage.setItem(P+'lastVisitDate', JSON.stringify(new Date().toDateString()));
    localStorage.setItem(P+'careStreak', JSON.stringify({
        count:0, lastCareDate:null, todayActions:[], bestStreak:0, milestonesClaimed:[]
    }));
    localStorage.setItem(P+'dailyTasks', JSON.stringify({
        date: new Date().toDateString(), tasks:[], completed:[]
    }));
    localStorage.setItem(P+'wardrobe', JSON.stringify({
        owned:[], equipped:{obi:null, luna:null}
    }));
    localStorage.setItem(P+'scrapbook', JSON.stringify({
        entries:[], photosViewed:0
    }));
    localStorage.setItem(P+'weeklyChallenge', JSON.stringify({
        weekId:null, challengeId:null, progress:0, target:0,
        completed:false, reward:0
    }));
    localStorage.setItem(P+'starMilestonesClaimed', JSON.stringify([]));
    localStorage.setItem(P+'decorPurchased', JSON.stringify([]));

    // Number keys for best scores (all zero = no stars earned)
    const games = ['treat','laser','cuddle','walk','nap','bath','sort','pillow','findluna','window','pawstep'];
    games.forEach(g => localStorage.setItem(P+'best_'+g, '0'));
}""")

# RELOAD after setting localStorage so the game picks it up
await page.reload()
await page.wait_for_timeout(2500)
```

Then apply the CSS fix again (it's lost on reload) and click past title:

```python
# Re-apply CSS fix (lost on reload)
await page.evaluate("""() => { /* same CSS fix as above */ }""")
await page.wait_for_timeout(100)

# Click past title screen
await page.mouse.click(400, 528)
await page.wait_for_timeout(1500)
```

---

## 7. Inject Test Hooks (Optional — for programmatic scene inspection/navigation)

The game's JS runs inside an IIFE, so `game`, `store`, etc. aren't on `window`. To inspect or navigate scenes programmatically, inject these hooks **into the HTML file** just before `requestAnimationFrame(loop);` (inside the IIFE, where `game` is in scope):

```javascript
// TEST HOOK: get current scene name
window.__getScene = () => {
    if (game.transition) return 'transition:' + (game.transition.to && game.transition.to.name ? game.transition.to.name : 'unknown');
    if (game.scene) return game.scene.name || 'unknown';
    return 'none';
};

// TEST HOOK: get scene details (panels, overlays, timers, pets)
window.__getSceneDetails = () => {
    const s = game.scene;
    if (!s) return { name: 'none' };
    const result = { name: s.name || 'unknown' };
    if (s.menuOpen !== undefined) result.menuOpen = s.menuOpen;
    if (s.decorOpen !== undefined) result.decorOpen = s.decorOpen;
    if (s.wardrobeOpen !== undefined) result.wardrobeOpen = s.wardrobeOpen;
    if (s.scrapbookOpen !== undefined) result.scrapbookOpen = s.scrapbookOpen;
    if (s.dedication !== undefined) result.dedication = !!s.dedication;
    if (s.dailyGift !== undefined) result.dailyGift = !!s.dailyGift;
    if (s.phase !== undefined) result.phase = s.phase;
    if (s.paused !== undefined) result.paused = s.paused;
    if (s.timer !== undefined) result.timer = s.timer;
    if (s.foodBowl) result.foodBowl = { fill: s.foodBowl.fill };
    if (s.waterBowl) result.waterBowl = { fill: s.waterBowl.fill };
    if (s.obi) result.obi = { joy: s.obi.joy, x: s.obi.x, y: s.obi.y };
    if (s.luna) result.luna = { joy: s.luna.joy, x: s.luna.x, y: s.luna.y, perch: s.luna.perch };
    return result;
};

// TEST HOOK: modify scene state (pass a function that receives scene as 's')
window.__modifyScene = (fn) => {
    if (game.scene) { fn(game.scene); return true; }
    return false;
};

// TEST HOOK: navigate to a scene by key (e.g., "hangout", "treat", "backyard")
window.__goToScene = (key) => {
    try {
        const newScene = SceneRegistry.create(key);
        if (newScene) { transitionTo(newScene); return true; }
        return 'unknown_scene';
    } catch(e) { return 'error: ' + e.message; }
};
```

Place these right before the line `requestAnimationFrame(loop);` inside the main IIFE. Both `game`, `SceneRegistry`, and `transitionTo` are in scope there.

---

## 8. Key Canvas Coordinates (Hangout Scene)

Once in the hangout scene, here are the main interactive areas:

| Element | Approx (x, y) | Notes |
|---------|---------------|-------|
| Mute button | (28, 28) | Top-left corner |
| Coin pill | (488, 59) | Shows coin count |
| Obi (dog) | (340, 430) | Clickable for petting |
| Luna (cat) | (520, 380) | On floor by default; can be on tower/window/couch |
| Food bowl | (180, 478) | Click to refill |
| Water bowl | (230, 478) | Click to refill |
| Games button | (710, 530) | Opens minigame menu |
| Decor button | (90, 530) | Opens decoration panel |
| Wardrobe button | (170, 530) | Opens wardrobe panel |
| Scrapbook button | (250, 530) | Opens scrapbook |
| Camera button | (330, 530) | Takes screenshot |
| Backyard button | (660, 530) | Goes to backyard scene |
| Lamp | (118, 340) | Clickable; toggleable |

---

## 9. localStorage Key Format

All keys are prefixed `anniesCozyDay_`. Three storage formats:

| Format | Save | Load | Example Key |
|--------|------|------|-------------|
| Bool | `saveBool(k, v)` → stores raw `"true"`/`"false"` | `loadBool(k, default)` | `muted`, `firstVisit` |
| Number | `saveNumber(k, v)` → stores raw `String(v)` | `loadNumber(k, default)` | `coins`, `pet_obi_joy`, `best_treat` |
| JSON | `saveJSON(k, v)` → stores `JSON.stringify(v)` | `loadJSON(k, default)` | `stats`, `decor`, `wardrobe`, `scrapbook` |

---

## 10. Quick Verification Script

Minimal script to confirm everything works:

```python
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--allow-file-access-from-files", "--disable-gpu", "--no-sandbox",
                  "--disable-dev-shm-usage", "--disable-web-security"]
        )
        context = await browser.new_context(viewport={"width": 800, "height": 600}, device_scale_factor=1)
        page = await context.new_page()

        # Seed localStorage to skip popups
        await page.goto("file:///path/to/annies-cozy-day-test.html")
        await page.wait_for_timeout(3000)

        await page.evaluate("""() => {
            const P = 'anniesCozyDay_';
            localStorage.setItem(P+'firstVisit', 'false');
            localStorage.setItem(P+'bubbleOnboarded', 'true');
            localStorage.setItem(P+'muted', 'false');
        }""")
        await page.reload()
        await page.wait_for_timeout(2500)

        # Fix canvas positioning
        await page.evaluate("""() => {
            const c = document.getElementById('game');
            if (!c) return;
            c.style.maxWidth = 'none'; c.style.maxHeight = 'none';
            c.style.position = 'fixed'; c.style.left = '0'; c.style.top = '0';
            c.style.borderRadius = '0'; c.style.boxShadow = 'none';
            const w = document.getElementById('wrap');
            if (w) { w.style.display = 'block'; w.style.padding = '0'; w.style.margin = '0'; }
            document.body.style.display = 'block'; document.body.style.margin = '0';
            document.body.style.padding = '0'; document.body.style.overflow = 'hidden';
        }""")
        await page.wait_for_timeout(100)

        # Click past title
        await page.mouse.click(400, 528)
        await page.wait_for_timeout(1500)

        # Take screenshot to verify we're in the game
        await page.screenshot(path="game_loaded.png")
        print("Screenshot saved to game_loaded.png — verify hangout scene is visible")

        # If hooks are injected, verify scene:
        # scene = await page.evaluate("() => window.__getScene()")
        # print(f"Current scene: {scene}")

        await browser.close()

asyncio.run(main())
```

---

## Common Pitfalls

1. **Forgetting `--allow-file-access-from-files`** → localStorage doesn't work on `file://`, game breaks with missing data
2. **Forgetting the CSS fix** → all click coordinates are offset by ~12px and scaled ~97%, every interaction misses its target
3. **Not waiting long enough after load** → canvas hasn't initialized, clicks hit nothing
4. **Clicking title before fonts load** → the Play button position may differ; wait the full 2.5s
5. **Forgetting to re-apply CSS fix after reload** → the `page.reload()` in `fresh_start` resets all injected styles
6. **Not seeding all JSON keys** → game reads `JSON.parse(null)` and crashes silently; the full localStorage seed in section 6 covers every key the game expects
