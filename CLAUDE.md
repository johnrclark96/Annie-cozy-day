# Annie's Cozy Day — Project Guide

## What This Is

A single-file HTML5 Canvas cozy pet game (800x600) featuring Annie (human), Obi (dog), and Luna (cat). All code is inline JS inside an IIFE in `annies-cozy-day-test.html`. The game runs on GitHub Pages at `https://johnrclark96.github.io/Annie-cozy-day/`. This is a personal gift project — the tone is warm, playful, and cozy. No harsh punishment mechanics.

## Key Files

| File | Purpose |
|------|---------|
| `annies-cozy-day-test.html` | Working copy — edit this one |
| `annies-cozy-day.html` | Production copy — `cp` from test before committing |
| `index.html` | GitHub Pages redirect to the game |
| `ARCHITECTURE-REFERENCE.md` | Detailed technical reference (line numbers, store schema, constants) |
| `CHANGELOG.md` | Running log of all changes |
| `claude-code-bootstrap-prompt.md` | Playwright setup guide for automated testing |
| `.claude/agents/canvas-game-playtester.md` | Visual playtester agent spec |

## Architecture Overview

**Scene System**: All screens are classes extending `BaseScene`. Minigames extend `BaseMinigameScene` which provides the full flow: instructions → countdown → play → ending → results. Scenes are registered with `SceneRegistry.register(key, factory)` and created via `SceneRegistry.create(key)`.

**Input**: `game.mouse.x/y/down` tracks mouse/touch state. Canvas events scale coordinates from CSS to 800x600 canvas space. Scenes receive `onClick(x,y)`, `onMouseMove(x,y)`, `onKeyDown(key)`.

**Persistence**: All state lives in `store` object, saved to localStorage with `anniesCozyDay_` prefix. Three helpers: `saveJSON`/`loadJSON`, `saveNumber`/`loadNumber`, `saveBool`/`loadBool`. Migration backfills in the store initialization section handle new keys for existing saves.

**Drawing**: `drawObi()`, `drawLuna()`, `drawAnnie()` render characters from a sprite atlas. `rr()` draws rounded rectangles. `drawButton()`, `drawTooltip()`, `drawStar()` are shared UI functions. Room backgrounds are cached in `sceneCache.livingRoomBase`.

**Audio**: Procedurally synthesized via Web Audio API. `audio.tinyChime()`, `audio.combo()`, `audio.miss()`, `audio.pounce()`, etc. Mute state persisted.

## Current Game Content

**Scenes**: Title, Hangout (main hub), Backyard, + 12 minigames
**Minigames**: Treat Toss, Laser Chase, Cuddle Pile, Obi's Walk, Luna's Nap Spot, Bath Time, Snack Sort, Pillow Pop, Where's Luna, Window Watch, Pawstep Patterns, Luna's Wild Wand
**Systems**: Pet mood/personality (daily rotation), care streaks, daily tasks, weekly challenges, scrapbook goals, weather, visitors, decoration reactions, pet memory, challenge stars (4th star per game)
**Economy**: Coins from minigames/events/streaks, spent on decorations (32 items), accessories (30 items), Cozy Upgrades (5 gameplay items), Golden Room (5 premium items)
**Progression**: 36 stars across 12 games, 24 achievements, 12 scrapbook goals, care streak milestones

## Development Workflow

1. Edit `annies-cozy-day-test.html`
2. Syntax check: `"/c/Program Files/Microsoft Visual Studio/2022/Community/MSBuild/Microsoft/VisualStudio/NodeJs/node.exe" -e "const fs=require('fs');const html=fs.readFileSync('annies-cozy-day-test.html','utf-8');const m=html.match(/<script>([\\s\\S]*?)<\\/script>/);try{new Function(m[1]);console.log('OK')}catch(e){console.log('ERR:',e.message)}"`
3. Copy to production: `cp annies-cozy-day-test.html annies-cozy-day.html`
4. Stage both: `git add annies-cozy-day.html annies-cozy-day-test.html`
5. Commit with descriptive message + `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
6. Push: `git push origin main`
7. GitHub Pages deploys automatically (~60s)

## Important Conventions

- **All code in one file** — no external JS. Everything inside the IIFE.
- **New store keys** need migration backfill (see the `/* Backfill migrations */` section after the store object).
- **New minigames** need: class extending BaseMinigameScene, SceneRegistry.register, gameCards entry in HangoutScene, store.best_KEY, entry in totalStarsEarned(), entry in all 3 t3 threshold maps, CHALLENGE_MODIFIERS entry.
- **New decorations** need: entry in DECOR_ITEMS or BACKYARD_DECOR_ITEMS, rendering code in drawLivingRoom() or drawInteractiveObjects(), key in newDecorKeys migration array.
- **Cache invalidation**: After any decor toggle, `sceneCache.livingRoomBase = null` is called automatically.
- **Test hooks**: `window.__getScene()`, `__getSceneDetails()`, `__modifyScene()`, `__goToScene()` — DO NOT modify these.

## Playtesting

Use Playwright via the bootstrap prompt (`claude-code-bootstrap-prompt.md`) or the visual playtester agent. Key: one action → screenshot → visually inspect → decide next action. Never batch actions without viewing results.

## Session End Checklist

Before final commit of any session:
1. Update `CHANGELOG.md` with what was done
2. If architecture changed, update `ARCHITECTURE-REFERENCE.md`
3. If priorities changed, update "Known Issues" below

## Known Issues / Current Priorities

- Obi's Walk could use more pace/variety
- Some decorations are very subtle at 800x600 resolution
- No settings screen (volume, reset save)
- No first-visit tutorial arrows
- Ambient music could rotate between variations
