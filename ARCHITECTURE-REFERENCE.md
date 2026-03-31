# Architecture Reference — Annie's Cozy Day

## File: annies-cozy-day-test.html (~13,400 lines)

All game code is inline JS inside a single IIFE. The file structure follows this order:

### Section Map (approximate line ranges)

| Lines | Section | Contents |
|-------|---------|----------|
| 1-75 | HTML/CSS | Canvas element, responsive styling, Google Fonts |
| 76-100 | Constants | COLORS, TIER_COLORS, canAccessTier() |
| 100-300 | Data Arrays | ACHIEVEMENTS, TITLE_SUBTITLES, DECOR_ITEMS, BACKYARD_DECOR_ITEMS, DAILY_TASK_POOL, WEEKLY_CHALLENGES, ACCESSORIES, STAR_MILESTONES, COZY_UPGRADES, CHALLENGE_MODIFIERS, SCRAPBOOK_GOALS, WEATHER_TYPES, VISITOR_TYPES, DECOR_REACTIONS, PET_MOODS, DAY_OF_WEEK_PREFS, LUNA_PERCHES |
| 300-500 | Storage | sKey(), loadJSON/saveJSON, loadNumber/saveNumber, loadBool/saveBool, store object, migration backfills |
| 500-700 | Utility Functions | totalStarsEarned(), checkStarMilestones(), hasUpgrade(), calculatePassiveIncome(), updateWeather(), getCareBonus(), totalChallengeStars(), getDailyMood(), getMoodData() |
| 700-900 | Math/Draw Helpers | clamp, lerp, rand, easeOutBack, dist, rr(), drawHeart, drawStar, drawBone, drawBadgeIcon, lightenColor, darkenColor |
| 900-1000 | UI Functions | drawButton(), drawTooltip(), drawSpeakerIcon(), drawGlowCircle(), wrapText() |
| 1000-1100 | Game Engine | SceneRegistry, game object, particle system, audio system |
| 1100-1500 | Sprites | spriteArt system, SPRITE_ATLAS_URI (data URI), drawObiSprite, drawLunaSprite, drawAnnieSprite, drawFrameImage, getAccessoryOffset, drawAccessoryOverlay |
| 1500-2000 | Character Drawing | drawObi(), drawLuna(), drawAnnie() — high-level character renderers |
| 2000-3500 | Room Drawing | drawLivingRoom(), buildStaticCaches() — all decor rendering |
| 3500-3800 | Title Scene | TitleScene class |
| 3800-7700 | Hangout Scene | HangoutScene class (constructor, enter, update, onClick, draw, all subsystems) |
| 7700-9000 | Backyard Scene | BackyardScene class |
| 9000-9600 | BaseMinigameScene | Full minigame framework (phases, HUD, results, replay) |
| 9600-13200 | Minigame Scenes | All 12 individual minigame classes |
| 13200-13400 | Game Loop & Input | requestAnimationFrame loop, mouse/touch/keyboard event handlers, test hooks |

## Scene Classes

| Class | Key | Lines | Description |
|-------|-----|-------|-------------|
| BaseScene | - | ~3520 | Minimal base with name, tooltip |
| TitleScene | "title" | ~3540 | Title screen with cycling subtitles |
| HangoutScene | "hangout" | ~3800 | Main hub — pets, decor, wardrobe, scrapbook, modes |
| BackyardScene | "backyard" | ~7770 | Outdoor area — garden, pool, feeder, tree, fetch, sprinkler, bugs |
| BaseMinigameScene | - | ~9040 | Framework: instructions→countdown→play→ending→results |
| TreatTossScene | "treat" | ~9610 | Toss treats to Obi, catch combos |
| BathTimeScene | "bath" | ~9870 | Scrub/rinse/dry two pets |
| SnackSortScene | "sort" | ~10120 | Drag-sort dog/cat treats with golden/rotten |
| PillowPopScene | "pillow" | ~10400 | Whack-a-mole, click Luna, avoid Obi |
| WheresLunaScene | "findluna" | ~10590 | Shell game — track Luna under cushions |
| WindowWatchScene | "window" | ~10820 | Click birds/butterflies, avoid leaves |
| PawstepPatternsScene | "pawstep" | ~11070 | Simon Says with pet actions (capped at 5) |
| LaserChaseScene | "laser" | ~11330 | Mouse-controlled laser dot, Luna chases targets |
| CuddlePileScene | "cuddle" | ~11560 | Balance game — keep couch level with arrow keys |
| ObiWalkScene | "walk" | ~11930 | Side-scrolling walk, click items and squirrels |
| LunaNapScene | "nap" | ~12280 | Place cushions in sunbeams for Luna to nap |
| WildWandScene | "wildwand" | ~12600 | Flappy-style wand game with physics lure |

## Store Schema (localStorage keys)

All prefixed with `anniesCozyDay_`. Key categories:

**Booleans**: muted, firstVisit, bubbleOnboarded
**Numbers**: coins, pet_obi_joy, pet_luna_joy, pet_food_fill, pet_water_fill, pet_food_lastFill, pet_water_lastFill, backyardFlowers, lastKnownStars, best_treat, best_laser, best_cuddle, best_walk, best_nap, best_bath, best_sort, best_pillow, best_findluna, best_window, best_pawstep, best_wildwand
**JSON Objects**: stats, achievements, decor, backyardDecor, careStreak, dailyTasks, wardrobe, scrapbook, weeklyChallenge, starMilestonesClaimed, decorPurchased, cozyUpgrades, lastPassiveIncomeDate, petPersonality, challengeStars, weather, scrapbookGoals, petMemory, lastVisitDate

## Adding a New Minigame — Checklist

1. Create class extending `BaseMinigameScene(gameId, title, instruction, [t1,t2,t3], duration)`
2. Implement: `enter()`, `updatePlay(dt)`, `onGameClick(x,y)`, `drawScene(c)`, `drawInstructionIcon(c,x,y)`, `drawResultCharacter(c)`
3. `SceneRegistry.register("key", () => new YourScene())`
4. Add to `gameCards` array in HangoutScene constructor
5. Add `store.best_key = loadNumber("best_key", 0)` to store
6. Add `{ best: store.best_key, thresholds: [t1,t2,t3] }` to `totalStarsEarned()`
7. Add `key: threshold3` to ALL THREE t3 maps (search for `pawstep: 400`)
8. Add entry to `CHALLENGE_MODIFIERS`
9. Optionally add achievement to `ACHIEVEMENTS` array + `allAchKeys` migration + `store.achievements` default

## Adding a New Decoration — Checklist

1. Add to `DECOR_ITEMS` or `BACKYARD_DECOR_ITEMS` array
2. Add key to `newDecorKeys` migration array
3. Add rendering code in `drawLivingRoom()` or `drawInteractiveObjects()`
4. Cache invalidation is automatic (all toggles invalidate)

## Canvas Coordinate System

- Canvas: 800x600 (W=800, H=600)
- CSS scales with `max-width: min(100vw-24, (100vh-24)*4/3)` and matching max-height
- All coordinates in game logic use 800x600 space
- `getBoundingClientRect()` + scaling converts DOM events to canvas coords

## Audio System

Procedural Web Audio API synthesis. No audio files. Key methods:
- `audio.menu()` — UI navigation beep
- `audio.catch()` — Treat caught
- `audio.miss()` — Failure/wrong
- `audio.combo()` — Combo milestone
- `audio.pounce()` — Luna pounce
- `audio.tinyChime()` — Small success
- `audio.achievement()` — Achievement unlock
- `audio.startAmbient()` / `audio.stopAmbient()` — Background drone
- `audio.ensure()` — Called on first user interaction to unlock audio context
