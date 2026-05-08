"""
Persistent Playwright helper for step-by-step visual playtesting.
Run actions one at a time via command line args.
Usage:
  python playtest-helper.py setup          — launch browser, load game, apply CSS fix
  python playtest-helper.py screenshot N   — take screenshot as step_N.png and print path
  python playtest-helper.py click X Y N    — click at (X,Y), wait, screenshot as step_N.png
  python playtest-helper.py hover X Y N    — hover at (X,Y), wait, screenshot as step_N.png
  python playtest-helper.py scene          — print current scene details via test hooks
  python playtest-helper.py goto KEY N     — navigate to scene, screenshot as step_N.png
  python playtest-helper.py wait MS N      — wait MS milliseconds, screenshot as step_N.png
  python playtest-helper.py key KEY N      — press keyboard key, screenshot as step_N.png
  python playtest-helper.py drag X1 Y1 X2 Y2 N — drag from (X1,Y1) to (X2,Y2), screenshot
  python playtest-helper.py errors         — print all captured console errors
  python playtest-helper.py close          — close browser
"""
import sys, os, json, asyncio
from playwright.async_api import async_playwright

GAME_PATH = "file:///C:/Users/johnr/documents/claut/annies-cozy-day-test.html"
SCREENSHOT_DIR = "C:/Users/johnr/documents/claut/test-screenshots-v6"
STATE_FILE = "C:/Users/johnr/documents/claut/.playtest-state.json"

CSS_FIX = """() => {
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
}"""

SEED_LOCALSTORAGE = """() => {
    const P = 'anniesCozyDay_';
    localStorage.setItem(P+'firstVisit', 'false');
    localStorage.setItem(P+'bubbleOnboarded', 'true');
    localStorage.setItem(P+'muted', 'true');
    localStorage.setItem(P+'coins', '200');
    localStorage.setItem(P+'pet_obi_joy', '70');
    localStorage.setItem(P+'pet_luna_joy', '65');
    localStorage.setItem(P+'pet_food_fill', '80');
    localStorage.setItem(P+'pet_food_lastFill', String(Date.now()));
    localStorage.setItem(P+'pet_water_fill', '75');
    localStorage.setItem(P+'pet_water_lastFill', String(Date.now()));
    localStorage.setItem(P+'backyardFlowers', '2');
    localStorage.setItem(P+'lastKnownStars', '0');
    localStorage.setItem(P+'stats', JSON.stringify({
        totalTreatCatches:5, bestTreatCombo:3, bestLaserCombo:2,
        bestCuddle:0, cuddleWon:false, totalSessions:3, totalPhotos:1,
        totalCoinsEarned:80, totalFlowersPlanted:2, totalBowlsFilled:4,
        petInteractionsSeen:1
    }));
    localStorage.setItem(P+'achievements', JSON.stringify({
        obiBestFriend:false, comboStar:false, catWhisperer:false, pouncePerfect:false,
        couchPotato:false, maximumCozy:false, goodWalker:false, napMaster:false,
        squeakyClean:false, sortingPro:false, whackQueen:false, sharpEye:false,
        birdWatcher:false, goodMemory:false, greenThumb:false, shutterBug:false,
        fashionista:false, dedicated:false, socialButterfly:false, fullHouse:false,
        wellFed:false, collector:false, challengeChampion:false
    }));
    localStorage.setItem(P+'decor', JSON.stringify({
        fairyLights:true, plant2:false, petBed:true, rugColor:0,
        lampOn:true, roomPreset:0, timeOfDay:1, wallArt2:0,
        windowPlant:false, cozyBlanket:false, photoWall:false,
        floorCushion:false, corkBoard:false, bookStack:false, couchPillows:0,
        hangingPlant:false, candles:false, wallClock:true, rugPattern:0,
        garland:0, petToys:false, musicBox:false, familyPortrait:false,
        comfyBowls:false, treatsJar:false, cozyBlankets:false, joyfulHome:false, luckyCharm:false
    }));
    localStorage.setItem(P+'backyardDecor', JSON.stringify({
        windChime:false, gardenGnome:false, picnicBlanket:false,
        birdBath:false, lanterns:false, birdHouse:false,
        sundial:false, dogHouse:false, butterflyGarden:false, fountain:false
    }));
    localStorage.setItem(P+'lastVisitDate', JSON.stringify(null));
    localStorage.setItem(P+'careStreak', JSON.stringify({
        count:3, lastCareDate:null, todayActions:[], bestStreak:3, milestonesClaimed:[]
    }));
    localStorage.setItem(P+'dailyTasks', JSON.stringify({
        date:null, tasks:[], completed:[]
    }));
    localStorage.setItem(P+'wardrobe', JSON.stringify({
        owned:['bandanaRed'], equipped:{
            obi:{head:null,neck:'bandanaRed',body:null},
            luna:{head:null,neck:null},
            annie:{head:null,wrist:null}
        }
    }));
    localStorage.setItem(P+'scrapbook', JSON.stringify({
        entries:[{type:'milestone',text:'First session!',date:new Date().toDateString(),icon:'star'}], photosViewed:0
    }));
    localStorage.setItem(P+'weeklyChallenge', JSON.stringify({
        weekId:null, challengeId:null, progress:0, target:0, completed:false, reward:0
    }));
    localStorage.setItem(P+'starMilestonesClaimed', JSON.stringify([]));
    localStorage.setItem(P+'decorPurchased', JSON.stringify([]));
    localStorage.setItem(P+'cozyUpgrades', JSON.stringify([]));
    localStorage.setItem(P+'lastPassiveIncomeDate', JSON.stringify(null));
    localStorage.setItem(P+'petPersonality', JSON.stringify({
        obi:{dailyMood:null,moodSeed:null,prefHistory:[]},
        luna:{dailyMood:null,moodSeed:null,prefHistory:[]}
    }));
    localStorage.setItem(P+'challengeStars', JSON.stringify({}));
    localStorage.setItem(P+'weather', JSON.stringify({current:'sunny',lastUpdate:null}));
    localStorage.setItem(P+'scrapbookGoals', JSON.stringify({completed:[]}));
    localStorage.setItem(P+'petMemory', JSON.stringify({lastActions:[],lastJoy:{obi:70,luna:65},lastDate:null,memories:[]}));
    var games = ['treat','laser','cuddle','walk','nap','bath','sort','pillow','findluna','window','pawstep'];
    games.forEach(g => localStorage.setItem(P+'best_'+g, '0'));
}"""

console_errors = []

async def do_setup():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    p = await async_playwright().start()
    browser = await p.chromium.launch(
        headless=True,
        args=["--allow-file-access-from-files", "--disable-gpu", "--no-sandbox",
              "--disable-dev-shm-usage", "--disable-web-security"]
    )
    context = await browser.new_context(viewport={"width": 800, "height": 600}, device_scale_factor=1)
    page = await context.new_page()

    # Capture console errors
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: console_errors.append(str(err)))

    await page.goto(GAME_PATH)
    await page.wait_for_timeout(2000)
    await page.evaluate(SEED_LOCALSTORAGE)
    await page.reload()
    await page.wait_for_timeout(3000)
    await page.evaluate(CSS_FIX)
    await page.wait_for_timeout(200)

    # Save CDP endpoint for reconnection
    ws = browser.contexts[0].pages[0].url  # not actually needed, we persist
    state = {"ws": p._connection._transport._ws_endpoint if hasattr(p, '_connection') else ""}

    # Take initial screenshot
    path = f"{SCREENSHOT_DIR}/step_000_title.png"
    await page.screenshot(path=path)
    print(f"SETUP COMPLETE. Screenshot: {path}")

    # Check for console errors
    if console_errors:
        print(f"CONSOLE ERRORS: {console_errors}")
    else:
        print("No console errors.")

    scene = await page.evaluate("() => typeof window.__getScene === 'function' ? window.__getScene() : 'no hooks'")
    print(f"Current scene: {scene}")

    return p, browser, context, page

async def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return

    cmd = args[0]

    if cmd == "setup":
        p, browser, context, page = await do_setup()
        # Keep alive by saving page reference — but since we can't persist across processes,
        # we'll use a single long-running script instead. For now, just setup and screenshot.
        # We need a different approach - use a server mode.
        input("Press Enter to close browser...")
        await browser.close()
        await p.stop()
        return

    print("Use the 'setup' command first, or use the interactive REPL approach.")

if __name__ == "__main__":
    asyncio.run(main())
