"""
Persistent Playwright playtest server.
Reads commands from stdin, one per line. Outputs results to stdout.
Commands:
  click X Y NAME     — click, wait 800ms, screenshot
  screenshot NAME    — just screenshot
  scene              — print scene details
  goto KEY NAME      — navigate to scene
  wait MS NAME       — wait then screenshot
  key KEY NAME       — press key
  drag X1 Y1 X2 Y2 NAME — drag
  errors             — print console errors
  quit               — close and exit
"""
import sys, os, json, asyncio
from playwright.async_api import async_playwright

GAME = "file:///C:/Users/johnr/documents/claut/annies-cozy-day-test.html"
DIR = "C:/Users/johnr/documents/claut/test-screenshots-v6"

CSS_FIX = """() => {
    const c = document.getElementById('game');
    if (!c) return;
    c.style.maxWidth = 'none'; c.style.maxHeight = 'none';
    c.style.position = 'fixed'; c.style.left = '0'; c.style.top = '0';
    c.style.borderRadius = '0'; c.style.boxShadow = 'none';
    const w = document.getElementById('wrap');
    if (w) { w.style.display='block'; w.style.padding='0'; w.style.margin='0'; }
    document.body.style.display='block'; document.body.style.margin='0';
    document.body.style.padding='0'; document.body.style.overflow='hidden';
}"""

SEED = """() => {
    const P = 'anniesCozyDay_';
    localStorage.setItem(P+'firstVisit','false');
    localStorage.setItem(P+'bubbleOnboarded','true');
    localStorage.setItem(P+'muted','true');
    localStorage.setItem(P+'coins','200');
    localStorage.setItem(P+'pet_obi_joy','70');
    localStorage.setItem(P+'pet_luna_joy','65');
    localStorage.setItem(P+'pet_food_fill','80');
    localStorage.setItem(P+'pet_food_lastFill',String(Date.now()));
    localStorage.setItem(P+'pet_water_fill','75');
    localStorage.setItem(P+'pet_water_lastFill',String(Date.now()));
    localStorage.setItem(P+'backyardFlowers','2');
    localStorage.setItem(P+'lastKnownStars','0');
    localStorage.setItem(P+'stats',JSON.stringify({totalTreatCatches:5,bestTreatCombo:3,bestLaserCombo:2,bestCuddle:0,cuddleWon:false,totalSessions:3,totalPhotos:1,totalCoinsEarned:80,totalFlowersPlanted:2,totalBowlsFilled:4,petInteractionsSeen:1}));
    localStorage.setItem(P+'achievements',JSON.stringify({obiBestFriend:false,comboStar:false,catWhisperer:false,pouncePerfect:false,couchPotato:false,maximumCozy:false,goodWalker:false,napMaster:false,squeakyClean:false,sortingPro:false,whackQueen:false,sharpEye:false,birdWatcher:false,goodMemory:false,greenThumb:false,shutterBug:false,fashionista:false,dedicated:false,socialButterfly:false,fullHouse:false,wellFed:false,collector:false,challengeChampion:false}));
    localStorage.setItem(P+'decor',JSON.stringify({fairyLights:true,plant2:false,petBed:true,rugColor:0,lampOn:true,roomPreset:0,timeOfDay:1,wallArt2:0,windowPlant:false,cozyBlanket:false,photoWall:false,floorCushion:false,corkBoard:false,bookStack:false,couchPillows:0,hangingPlant:false,candles:false,wallClock:true,rugPattern:0,garland:0,petToys:false,musicBox:false,familyPortrait:false,comfyBowls:false,treatsJar:false,cozyBlankets:false,joyfulHome:false,luckyCharm:false}));
    localStorage.setItem(P+'backyardDecor',JSON.stringify({windChime:false,gardenGnome:false,picnicBlanket:false,birdBath:false,lanterns:false,birdHouse:false,sundial:false,dogHouse:false,butterflyGarden:false,fountain:false}));
    localStorage.setItem(P+'lastVisitDate',JSON.stringify(null));
    localStorage.setItem(P+'careStreak',JSON.stringify({count:3,lastCareDate:null,todayActions:[],bestStreak:3,milestonesClaimed:[]}));
    localStorage.setItem(P+'dailyTasks',JSON.stringify({date:null,tasks:[],completed:[]}));
    localStorage.setItem(P+'wardrobe',JSON.stringify({owned:['bandanaRed'],equipped:{obi:{head:null,neck:'bandanaRed',body:null},luna:{head:null,neck:null},annie:{head:null,wrist:null}}}));
    localStorage.setItem(P+'scrapbook',JSON.stringify({entries:[{type:'milestone',text:'First session!',date:new Date().toDateString(),icon:'star'}],photosViewed:0}));
    localStorage.setItem(P+'weeklyChallenge',JSON.stringify({weekId:null,challengeId:null,progress:0,target:0,completed:false,reward:0}));
    localStorage.setItem(P+'starMilestonesClaimed',JSON.stringify([]));
    localStorage.setItem(P+'decorPurchased',JSON.stringify([]));
    localStorage.setItem(P+'cozyUpgrades',JSON.stringify([]));
    localStorage.setItem(P+'lastPassiveIncomeDate',JSON.stringify(null));
    localStorage.setItem(P+'petPersonality',JSON.stringify({obi:{dailyMood:null,moodSeed:null,prefHistory:[]},luna:{dailyMood:null,moodSeed:null,prefHistory:[]}}));
    localStorage.setItem(P+'challengeStars',JSON.stringify({}));
    localStorage.setItem(P+'weather',JSON.stringify({current:'sunny',lastUpdate:null}));
    localStorage.setItem(P+'scrapbookGoals',JSON.stringify({completed:[]}));
    localStorage.setItem(P+'petMemory',JSON.stringify({lastActions:[],lastJoy:{obi:70,luna:65},lastDate:null,memories:[]}));
    ['treat','laser','cuddle','walk','nap','bath','sort','pillow','findluna','window','pawstep'].forEach(g=>localStorage.setItem(P+'best_'+g,'0'));
}"""

errors = []

async def main():
    os.makedirs(DIR, exist_ok=True)
    p = await async_playwright().start()
    browser = await p.chromium.launch(headless=True, args=[
        "--allow-file-access-from-files","--disable-gpu","--no-sandbox",
        "--disable-dev-shm-usage","--disable-web-security"
    ])
    ctx = await browser.new_context(viewport={"width":800,"height":600}, device_scale_factor=1)
    page = await ctx.new_page()
    page.on("console", lambda m: errors.append(m.text) if m.type=="error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    # Load, seed, reload, fix CSS
    await page.goto(GAME)
    await page.wait_for_timeout(2000)
    await page.evaluate(SEED)
    await page.reload()
    await page.wait_for_timeout(3000)
    await page.evaluate(CSS_FIX)
    await page.wait_for_timeout(300)
    await page.screenshot(path=f"{DIR}/step_000_title.png")
    print(f"READY|{DIR}/step_000_title.png|No errors" if not errors else f"READY|{DIR}/step_000_title.png|Errors: {errors}")
    sys.stdout.flush()

    # Command loop
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        cmd = parts[0]
        try:
            if cmd == "click" and len(parts) >= 4:
                x, y, name = int(parts[1]), int(parts[2]), parts[3]
                await page.mouse.click(x, y)
                await page.wait_for_timeout(800)
                path = f"{DIR}/step_{name}.png"
                await page.screenshot(path=path)
                scene = await page.evaluate("()=>typeof window.__getScene==='function'?window.__getScene():'?'")
                det = await page.evaluate("()=>typeof window.__getSceneDetails==='function'?JSON.stringify(window.__getSceneDetails()):'?'")
                print(f"OK|{path}|scene={scene}|{det}")
            elif cmd == "screenshot" and len(parts) >= 2:
                name = parts[1]
                path = f"{DIR}/step_{name}.png"
                await page.screenshot(path=path)
                scene = await page.evaluate("()=>typeof window.__getScene==='function'?window.__getScene():'?'")
                print(f"OK|{path}|scene={scene}")
            elif cmd == "scene":
                det = await page.evaluate("()=>typeof window.__getSceneDetails==='function'?JSON.stringify(window.__getSceneDetails()):'?'")
                print(f"SCENE|{det}")
            elif cmd == "goto" and len(parts) >= 3:
                key, name = parts[1], parts[2]
                await page.evaluate(f"()=>window.__goToScene('{key}')")
                await page.wait_for_timeout(1500)
                path = f"{DIR}/step_{name}.png"
                await page.screenshot(path=path)
                scene = await page.evaluate("()=>typeof window.__getScene==='function'?window.__getScene():'?'")
                print(f"OK|{path}|scene={scene}")
            elif cmd == "wait" and len(parts) >= 3:
                ms, name = int(parts[1]), parts[2]
                await page.wait_for_timeout(ms)
                path = f"{DIR}/step_{name}.png"
                await page.screenshot(path=path)
                print(f"OK|{path}")
            elif cmd == "key" and len(parts) >= 3:
                k, name = parts[1], parts[2]
                await page.keyboard.press(k)
                await page.wait_for_timeout(800)
                path = f"{DIR}/step_{name}.png"
                await page.screenshot(path=path)
                print(f"OK|{path}")
            elif cmd == "drag" and len(parts) >= 6:
                x1,y1,x2,y2,name = int(parts[1]),int(parts[2]),int(parts[3]),int(parts[4]),parts[5]
                await page.mouse.move(x1,y1)
                await page.mouse.down()
                await page.mouse.move(x2,y2,steps=10)
                await page.mouse.up()
                await page.wait_for_timeout(800)
                path = f"{DIR}/step_{name}.png"
                await page.screenshot(path=path)
                print(f"OK|{path}")
            elif cmd == "errors":
                print(f"ERRORS|{json.dumps(errors)}")
            elif cmd == "quit":
                print("BYE")
                break
            else:
                print(f"UNKNOWN|{line}")
        except Exception as e:
            print(f"ERROR|{e}")
        sys.stdout.flush()

    await browser.close()
    await p.stop()

asyncio.run(main())
