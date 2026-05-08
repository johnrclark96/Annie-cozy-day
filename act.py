"""
Single-action playtest via CDP reconnect.
Usage: python act.py ACTION STEPNAME
Actions: setup, screenshot, click:X:Y, goto:SCENE, key:KEY, wait:MS, eval:JS
"""
import sys, asyncio
from playwright.async_api import async_playwright

DIR = "C:/Users/johnr/documents/claut/test-screenshots-v8"

CSS_FIX = """() => {
    const c = document.getElementById('game');
    if (!c) return 'no canvas';
    c.style.maxWidth='none';c.style.maxHeight='none';
    c.style.position='fixed';c.style.left='0';c.style.top='0';
    c.style.borderRadius='0';c.style.boxShadow='none';
    const w = document.getElementById('wrap');
    if(w){w.style.display='block';w.style.padding='0';w.style.margin='0';}
    document.body.style.display='block';document.body.style.margin='0';
    document.body.style.padding='0';document.body.style.overflow='hidden';
    return 'fixed';
}"""

SEED = """() => {
    const P='anniesCozyDay_';
    localStorage.setItem(P+'firstVisit','false');
    localStorage.setItem(P+'bubbleOnboarded','true');
    localStorage.setItem(P+'muted','true');
    localStorage.setItem(P+'coins','999');
    localStorage.setItem(P+'pet_obi_joy','70');
    localStorage.setItem(P+'pet_luna_joy','65');
    localStorage.setItem(P+'pet_food_fill','90');
    localStorage.setItem(P+'pet_food_lastFill',String(Date.now()));
    localStorage.setItem(P+'pet_water_fill','85');
    localStorage.setItem(P+'pet_water_lastFill',String(Date.now()));
    localStorage.setItem(P+'backyardFlowers','3');
    localStorage.setItem(P+'lastKnownStars','15');
    localStorage.setItem(P+'stats',JSON.stringify({totalTreatCatches:30,bestTreatCombo:5,bestLaserCombo:3,bestCuddle:45,cuddleWon:false,totalSessions:10,totalPhotos:3,totalCoinsEarned:300,totalFlowersPlanted:8,totalBowlsFilled:20,petInteractionsSeen:4}));
    localStorage.setItem(P+'achievements',JSON.stringify({obiBestFriend:true,comboStar:false,catWhisperer:false,pouncePerfect:false,couchPotato:true,maximumCozy:false,goodWalker:false,napMaster:false,squeakyClean:false,sortingPro:false,whackQueen:false,sharpEye:false,birdWatcher:false,goodMemory:false,greenThumb:false,shutterBug:false,fashionista:false,dedicated:false,socialButterfly:false,fullHouse:false,wellFed:false,collector:false,challengeChampion:false}));
    localStorage.setItem(P+'decor',JSON.stringify({fairyLights:true,plant2:true,petBed:true,rugColor:0,lampOn:true,roomPreset:0,timeOfDay:1,wallArt2:0,windowPlant:true,cozyBlanket:true,photoWall:false,floorCushion:true,corkBoard:true,bookStack:true,couchPillows:0,hangingPlant:true,candles:true,wallClock:true,rugPattern:0,garland:2,petToys:true,musicBox:false,familyPortrait:false,comfyBowls:false,treatsJar:false,cozyBlankets:false,joyfulHome:false,luckyCharm:false}));
    localStorage.setItem(P+'backyardDecor',JSON.stringify({windChime:true,gardenGnome:true,picnicBlanket:true,birdBath:true,lanterns:true,birdHouse:true,sundial:false,dogHouse:false,butterflyGarden:true,fountain:false}));
    localStorage.setItem(P+'lastVisitDate',JSON.stringify(new Date().toDateString()));
    localStorage.setItem(P+'careStreak',JSON.stringify({count:8,lastCareDate:new Date().toDateString(),todayActions:[],bestStreak:8,milestonesClaimed:[3]}));
    localStorage.setItem(P+'dailyTasks',JSON.stringify({date:new Date().toDateString(),tasks:['pet','feed','game'],completed:[]}));
    localStorage.setItem(P+'wardrobe',JSON.stringify({owned:['bandanaRed','partyHat','sweaterRed','bowPink','starCollar','headbandFloral','braceletBeaded'],equipped:{obi:{head:'partyHat',neck:'bandanaRed',body:'sweaterRed'},luna:{head:'bowPink',neck:'starCollar'},annie:{head:'headbandFloral',wrist:'braceletBeaded'}}}));
    localStorage.setItem(P+'scrapbook',JSON.stringify({entries:[{type:'milestone',text:'First session!',date:new Date().toDateString(),icon:'star'}],photosViewed:0}));
    localStorage.setItem(P+'weeklyChallenge',JSON.stringify({weekId:null,challengeId:null,progress:0,target:0,completed:false,reward:0}));
    localStorage.setItem(P+'starMilestonesClaimed',JSON.stringify([10]));
    localStorage.setItem(P+'decorPurchased',JSON.stringify(['floorCushion','corkBoard','bookStack','hangingPlant','candles','wallClock','garland','petToys']));
    localStorage.setItem(P+'cozyUpgrades',JSON.stringify([]));
    localStorage.setItem(P+'lastPassiveIncomeDate',JSON.stringify(new Date().toDateString()));
    localStorage.setItem(P+'petPersonality',JSON.stringify({obi:{dailyMood:null,moodSeed:null,prefHistory:[]},luna:{dailyMood:null,moodSeed:null,prefHistory:[]}}));
    localStorage.setItem(P+'challengeStars',JSON.stringify({}));
    localStorage.setItem(P+'weather',JSON.stringify({current:'sunny',lastUpdate:null}));
    localStorage.setItem(P+'scrapbookGoals',JSON.stringify({completed:[]}));
    localStorage.setItem(P+'petMemory',JSON.stringify({lastActions:['pet_obi','brush_luna'],lastJoy:{obi:70,luna:65},lastDate:null,memories:[]}));
    localStorage.setItem(P+'best_treat','400');
    localStorage.setItem(P+'best_laser','250');
    localStorage.setItem(P+'best_cuddle','45');
    localStorage.setItem(P+'best_walk','220');
    localStorage.setItem(P+'best_nap','300');
    localStorage.setItem(P+'best_bath','150');
    localStorage.setItem(P+'best_sort','150');
    localStorage.setItem(P+'best_pillow','200');
    localStorage.setItem(P+'best_findluna','120');
    localStorage.setItem(P+'best_window','180');
    localStorage.setItem(P+'best_pawstep','100');
    return 'seeded';
}"""

async def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "screenshot"
    name = sys.argv[2] if len(sys.argv) > 2 else "out"

    p = await async_playwright().start()
    browser = await p.chromium.connect_over_cdp("http://localhost:9222")
    ctx = browser.contexts[0]
    page = ctx.pages[0]

    if action == "setup":
        await page.evaluate(SEED)
        await page.reload()
        await page.wait_for_timeout(3000)
        r = await page.evaluate(CSS_FIX)
        await page.wait_for_timeout(300)
        path = f"{DIR}/{name}.png"
        await page.screenshot(path=path)
        errs = await page.evaluate("() => window.__playtest_errors || []")
        print(f"Setup done. CSS: {r}. Screenshot: {path}. Errors: {errs}")
    elif action.startswith("click:"):
        parts = action.split(":")
        x, y = int(parts[1]), int(parts[2])
        await page.mouse.click(x, y)
        await page.wait_for_timeout(800)
        path = f"{DIR}/{name}.png"
        await page.screenshot(path=path)
        scene = await page.evaluate("()=>typeof window.__getScene==='function'?window.__getScene():'?'")
        print(f"Clicked ({x},{y}). Scene: {scene}. Screenshot: {path}")
    elif action.startswith("goto:"):
        key = action.split(":")[1]
        await page.evaluate(f"()=>window.__goToScene('{key}')")
        await page.wait_for_timeout(1500)
        path = f"{DIR}/{name}.png"
        await page.screenshot(path=path)
        scene = await page.evaluate("()=>typeof window.__getScene==='function'?window.__getScene():'?'")
        print(f"Goto {key}. Scene: {scene}. Screenshot: {path}")
    elif action.startswith("wait:"):
        ms = int(action.split(":")[1])
        await page.wait_for_timeout(ms)
        path = f"{DIR}/{name}.png"
        await page.screenshot(path=path)
        print(f"Waited {ms}ms. Screenshot: {path}")
    elif action.startswith("key:"):
        k = action.split(":")[1]
        await page.keyboard.press(k)
        await page.wait_for_timeout(600)
        path = f"{DIR}/{name}.png"
        await page.screenshot(path=path)
        print(f"Pressed {k}. Screenshot: {path}")
    elif action.startswith("eval:"):
        js = action[5:]
        result = await page.evaluate(js)
        path = f"{DIR}/{name}.png"
        await page.screenshot(path=path)
        print(f"Eval result: {result}. Screenshot: {path}")
    elif action == "screenshot":
        path = f"{DIR}/{name}.png"
        await page.screenshot(path=path)
        scene = await page.evaluate("()=>typeof window.__getScene==='function'?window.__getScene():'?'")
        det = await page.evaluate("()=>typeof window.__getSceneDetails==='function'?JSON.stringify(window.__getSceneDetails()):'?'")
        print(f"Scene: {scene}. Screenshot: {path}")
        print(f"Details: {det}")
    elif action == "errors":
        errs = await page.evaluate("()=>window.__playtest_errors||[]")
        print(f"Errors: {errs}")
    else:
        print(f"Unknown action: {action}")

asyncio.run(main())
