"""
Single-action playtest script.
Usage: python pt.py "cmd1;cmd2;cmd3" output_name
Commands: click:X:Y  wait:MS  goto:SCENE  key:KEY  screenshot  scene  errors  drag:X1:Y1:X2:Y2
"""
import sys, os, json, asyncio
from playwright.async_api import async_playwright

GAME = "file:///C:/Users/johnr/documents/claut/annies-cozy-day-test.html"
DIR = "C:/Users/johnr/documents/claut/test-screenshots-v6"
os.makedirs(DIR, exist_ok=True)

CSS_FIX = """() => {
    const c = document.getElementById('game');
    if (!c) return;
    c.style.maxWidth='none';c.style.maxHeight='none';
    c.style.position='fixed';c.style.left='0';c.style.top='0';
    c.style.borderRadius='0';c.style.boxShadow='none';
    const w = document.getElementById('wrap');
    if(w){w.style.display='block';w.style.padding='0';w.style.margin='0';}
    document.body.style.display='block';document.body.style.margin='0';
    document.body.style.padding='0';document.body.style.overflow='hidden';
}"""

SEED = """() => {
    const P='anniesCozyDay_';
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
    localStorage.setItem(P+'lastVisitDate',JSON.stringify(new Date().toDateString()));
    localStorage.setItem(P+'careStreak',JSON.stringify({count:3,lastCareDate:new Date().toDateString(),todayActions:[],bestStreak:3,milestonesClaimed:[]}));
    localStorage.setItem(P+'dailyTasks',JSON.stringify({date:new Date().toDateString(),tasks:['pet','feed','game'],completed:[]}));
    localStorage.setItem(P+'wardrobe',JSON.stringify({owned:['bandanaRed'],equipped:{obi:{head:null,neck:'bandanaRed',body:null},luna:{head:null,neck:null},annie:{head:null,wrist:null}}}));
    localStorage.setItem(P+'scrapbook',JSON.stringify({entries:[{type:'milestone',text:'First session!',date:new Date().toDateString(),icon:'star'}],photosViewed:0}));
    localStorage.setItem(P+'weeklyChallenge',JSON.stringify({weekId:null,challengeId:null,progress:0,target:0,completed:false,reward:0}));
    localStorage.setItem(P+'starMilestonesClaimed',JSON.stringify([]));
    localStorage.setItem(P+'decorPurchased',JSON.stringify([]));
    localStorage.setItem(P+'cozyUpgrades',JSON.stringify([]));
    localStorage.setItem(P+'lastPassiveIncomeDate',JSON.stringify(new Date().toDateString()));
    localStorage.setItem(P+'petPersonality',JSON.stringify({obi:{dailyMood:null,moodSeed:null,prefHistory:[]},luna:{dailyMood:null,moodSeed:null,prefHistory:[]}}));
    localStorage.setItem(P+'challengeStars',JSON.stringify({}));
    localStorage.setItem(P+'weather',JSON.stringify({current:'sunny',lastUpdate:null}));
    localStorage.setItem(P+'scrapbookGoals',JSON.stringify({completed:[]}));
    localStorage.setItem(P+'petMemory',JSON.stringify({lastActions:['pet_obi','brush_luna'],lastJoy:{obi:70,luna:65},lastDate:null,memories:[]}));
    ['treat','laser','cuddle','walk','nap','bath','sort','pillow','findluna','window','pawstep'].forEach(g=>localStorage.setItem(P+'best_'+g,'0'));
}"""

errs = []

async def main():
    cmds_str = sys.argv[1] if len(sys.argv) > 1 else "screenshot"
    name = sys.argv[2] if len(sys.argv) > 2 else "output"

    p = await async_playwright().start()
    browser = await p.chromium.launch(headless=True, args=[
        "--allow-file-access-from-files","--disable-gpu","--no-sandbox",
        "--disable-dev-shm-usage","--disable-web-security"
    ])
    ctx = await browser.new_context(viewport={"width":800,"height":600}, device_scale_factor=1)
    page = await ctx.new_page()
    page.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    page.on("pageerror", lambda e: errs.append(str(e)))

    await page.goto(GAME)
    await page.wait_for_timeout(1500)
    await page.evaluate(SEED)
    await page.reload()
    await page.wait_for_timeout(3000)
    await page.evaluate(CSS_FIX)
    await page.wait_for_timeout(300)

    # Execute commands
    for cmd in cmds_str.split(";"):
        cmd = cmd.strip()
        if not cmd:
            continue
        parts = cmd.split(":")
        action = parts[0]
        if action == "click":
            await page.mouse.click(int(parts[1]), int(parts[2]))
            await page.wait_for_timeout(800)
        elif action == "wait":
            await page.wait_for_timeout(int(parts[1]))
        elif action == "goto":
            await page.evaluate(f"()=>window.__goToScene('{parts[1]}')")
            await page.wait_for_timeout(1500)
        elif action == "key":
            await page.keyboard.press(parts[1])
            await page.wait_for_timeout(600)
        elif action == "drag":
            await page.mouse.move(int(parts[1]),int(parts[2]))
            await page.mouse.down()
            steps = 15
            for i in range(steps):
                t = (i+1)/steps
                mx = int(parts[1]) + (int(parts[3])-int(parts[1]))*t
                my = int(parts[2]) + (int(parts[4])-int(parts[2]))*t
                await page.mouse.move(mx, my)
                await page.wait_for_timeout(30)
            await page.mouse.up()
            await page.wait_for_timeout(500)
        elif action == "screenshot":
            pass  # just take screenshot at end

    # Final screenshot
    path = f"{DIR}/{name}.png"
    await page.screenshot(path=path)

    # Scene info
    scene = await page.evaluate("()=>typeof window.__getScene==='function'?window.__getScene():'?'")
    det = await page.evaluate("()=>typeof window.__getSceneDetails==='function'?JSON.stringify(window.__getSceneDetails()):'?'")

    print(f"Screenshot: {path}")
    print(f"Scene: {scene}")
    print(f"Details: {det}")
    if errs:
        print(f"ERRORS: {errs}")
    else:
        print("No console errors")

    await browser.close()
    await p.stop()

asyncio.run(main())
