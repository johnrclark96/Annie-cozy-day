# Annie's Cozy Day — Deep Visual Audit (v2)

> **Source**: Visual/UX/writing audit, May 2026. Build inspected: `annies-cozy-day-test.html` · 14,060 lines.
>** Severity legend**: 🔴 high (looks broken) · 🟡 mid (inconsistent) · ⚪ low (polish) · 💙 heart (intentional warmth nearly working)

---


# Annie's Cozy Day
_a love letter, with the seams pulled wide open_ 

A second pass — much deeper than v1. Where v1 said "the HUD overflows," this one walks every system: the hangout, the backyard, all twelve minigames, the four locked panels (Decor / Wardrobe / Scrapbook / Game Menu), the dedication overlay, the daily-gift calendar, the away story, the weather and visitor systems, the writing, the audio cues, the empty/win/lose states, and the long tail of polish.

Note from your auditor
This is a gift you made by hand for the people you love. The bones are warmer than a lot of "real" cozy games — Annie's hair sway, Obi's tail wag, Luna's ear twitch, the dedication card on first launch, the away-story when someone comes back the next day. None of that is filler.

What follows is long because there is a lot in this game and you asked for maximum effort.** Almost every "fix" below is a small, isolated change. **Nothing here says you should rebuild it. The clunk lives in the chrome around the warmth, not in the warmth itself.

**Build inspected** annies-cozy-day-test.html · 14,060 lines
**Scenes** Title · Hangout · Backyard · 12 minigames
**Panels** Decor · Wardrobe · Scrapbook · Game Menu · Daily Gift · Dedication
**Systems** Joy · Mood · Streak · Coins · Stars · Achievements · Weather · Visitors · Photos · Challenges
**Resolution** 800 × 600 fixed canvas
**Approach** Per-screen + per-system, with severity tags 01 TL;DR — what's hurting it 02 What's already working 03 Per-screen findings 04 All 12 minigames, one by one 05 The four locked panels 06 Living systems (joy, weather, etc.) 07 Writing & voice 08 Motion, audio, juice 09 Reading & accessibility 10 The dedication card 11 Fix list, prioritized

---


**Section 01**
## The ten things doing most of the damage
v1 had six. After a deeper pass I've added four. Each shows up across many scenes, so a single fix pays back everywhere. Severity is "how broken does it look to a first-time player."


- F1 · systemic [🔴 high]

#### The HUD has no grid.
Tab pills overflow at "Wardrobe." Pet status pills, coin/star counters, top-right buttons, and the bottom Goal pill all live at hand-placed pixel coordinates. Nothing is anchored to a safe area, and nothing shares a row.

- F2 · systemic [🔴 high]

#### One typeface is doing seven jobs.
"Fredoka One" is set on every text element — title, body, Time/Score readouts, button labels, fine print. It's a beautiful display face, but as body text it's soft and as a HUD digit it's mushy. The whole game feels written in headline.

- F3 · systemic [🔴 high]

#### Two art languages collide everywhere.
Annie / Obi / Luna are richly painted (atlas sprites). The bookshelf, picture frame, food bowl, fence, sky-window clouds, fairy-light dots, and especially the tree are flat icon art. The pets always look like they're standing in a pre-vis level.

- F4 · systemic [🔴 high]

#### Tab colors are random.
Six brown tabs, "Pet" red, "Decor" purple. There's no semantic logic — Decor isn't a different category from Wardrobe. Reads as a bug, not a system.

- F5 · systemic [🔴 high]

#### Every minigame intro stacks five blocks at the same weight.
Title · body · pictogram · "Happy Pets Bonus" green text · Esc/Click footnote — all roughly the same size. Plus the dim-overlay strength varies per scene (Laser Chase is near-black; Window Watch is barely tinted).

- F6 · systemic [🔴 high]

#### The top-right action stack clips Score.
In every minigame, the Score pill on the right is partly hidden by the sound icon. Sound, camera, and (in hangout) scrapbook each have a different bevel/radius. The pause "‖" is yet another shape next to the rounded "Time:" pill.

- F7 · systemic [🔴 high]

#### The four "modal" panels are inconsistent with each other.
Game Menu, Decor, Wardrobe, Scrapbook all use a different layout, a different close-button position, a different way of paginating, and a different tab style. They were built four times. They want to be one component.

- F8 · systemic [🟡 mid]

#### Every pet/screen "speaks" in a slightly different voice.
"Welcome home! Obi and Luna are happy to see you." (warm, in-world). "Happy Pets Bonus +3s, +10% score" (Steam achievement). "Goal: Dreaming Obi (+10 coins)" (quest log). "Time: 63" (debug). Pick one voice for in-world copy, one for stats; today they're shuffled.

- F9 · systemic [🟡 mid]

#### State badges are inconsistent with state.
"Day 1 — 10 coins" gets a yellow ring; "Day 5 — 30 coins" gets red strikethrough on the gift name; "Day 7 — 40 coins + Mystery!" gets a star icon overlapping. The Daily Gift modal alone has three different ways of expressing "this is the active day."

- F10 · systemic [🟡 mid]

#### The minigame backdrop is never authored for being behind a modal.
Annie's head pokes from above the Treat Toss modal. A sliver of Luna pokes from the side in Wild Wand and Window Watch. A floating window asset hovers in Wild Wand's preview. The room is rendered as if it's the foreground; then a modal lands on top of it.

---


**Section 02**
## What is already working — keep these
An audit that only lists problems lies about the game. Here is what is genuinely good. None of this should be touched in the cleanup.


#### Annie / Obi / Luna at every scale
Same painted sprite at 0.65×, 0.7×, 0.8× across title, dedication, hub, and minigame results. Pose + breath + blink + tail + ear-twitch all driven by shared signal helpers. The characters carry the warmth.


#### Joy / Mood as a real system
Each pet has a day-of-week mood preference (Obi: playful/cuddly/hungry rotation; Luna: curious/aloof/affectionate/mischievous), and joyMult per action. The math behind the sleepy/curious pills is real; today nobody can read the math because the pills are tiny.


#### Dedication card on first visit
"Made with Love · for Annie, Obi, and Luna" with floating hearts and a triple-character cheer pose. This is the soul of the game and it's already authored well — the problems below are just small framing issues around it.


#### 33-star + 24-achievement progression spine
Every minigame has 3 thresholds + a challenge star (4th). Achievements are named with affection ("Obi's Best Friend," "Cat Whisperer," "Dedicated Caretaker"). The names already do half the work of the cozy tone.


#### Weather + visitor + season system
Sunny / cloudy / rain / snow / golden hour each with window tints. Mail carrier, neighbor cat, squirrel, robin, bunny (spring), ice-cream truck (summer), scarecrow (autumn), Santa elf (winter). Almost no first-pass cozy game has this much going on.


#### Pet-to-pet decoration reactions
"Luna sits on the book stack. Of course." "Obi grabbed a toy from the basket!" "Luna relaxes by the candlelight." (nighttime only). Specific, in-character lines tied to specific decorations. This is the writing voice; the rest of the copy should sound like this.


#### The away story
A short narrated scene when the player comes back after time has passed. Almost nobody implements this; it's a true love-letter feature. (It needs the same hierarchy treatment as the other modals — see §3.)


#### Cozy upgrades that change gameplay
Comfy Bowls, Treats Jar, Cozy Blankets, Joyful Home, Lucky Charm — the shop economy isn't pure cosmetics. There's a real "cozier life" loop hidden in the Decor list.


#### The cycling subtitle on the title
"Obi wants belly rubs." "Luna is judging you lovingly." "Everyone's favorite nap spot." This is good writing and shouldn't be flattened. Just kill the lone JavaScript joke (M3 below).

---


**Section 03**
## Per-screen findings
Annotated screens. Numbers on the left match numbered notes on the right. Severity tags: [🔴 high] looks broken · [🟡 mid] inconsistent · [⚪ low] polish · [💙 heart] intentional warmth that's nearly working.

1
2
3
4
5
6


### 01 — Title

## The cover of the book. Almost there.

- **Title vs. tagline weight mismatch** [🟡 mid] — heavy display brown sits oddly above the thin grey "A Cozy Minigame Collection". Drop the tagline weight to the same family but tracked-out small caps; or rewrite to match the warmer cycling subtitles below.
- **Cycling subtitle currently includes a devlog joke** [🟡 mid] — "Made with love and way too much JavaScript." Cute to you; jarring to anyone else and especially to Annie. It also competes with the_ actual _"made with love" line on the dedication card, which is the real version. Drop it from the rotation.
- **Lone sound button** [⚪ low] — floats at top-right with no companion. Either remove it from the title (it'll appear in hub anyway) or pair with a small settings/info button so it reads as a toolbar.
- **Three-character lineup** [⚪ low] — Annie centered, Obi front-left, Luna front-right, all on the same baseline, no overlap, no scale. A subtle Y-stagger (Annie back, pets forward, Annie 1.0×, pets 0.9×) reads as a portrait instead of a roster.
- **Background floats are random** [⚪ low] — hearts and stars hover around at ~0.3 alpha with no rhythm. Either pick one (hearts) and place them deliberately, or make them slow-rise from below the canvas to feel like ambient warmth.
- **"Click to Start" is a button-shaped CTA on a no-button screen** [⚪ low] — the cushioned red pill is fine, but it's the only "UI" on a poster-style screen. A simpler "Click anywhere" prompt with the same cycling-subtitle style might let the characters carry the page.


1
2
3
4
5
6
7
8
9
10
11


### 02 — Hangout (the hub) with Daily Gift modal

## The most important screen, doing the most things, with the least order.

- **Tab row overflows canvas** [🔴 high] — "Wardrobe" is clipped. The single most "broken" thing in the game. Quick fix: rename to "Closet," shave per-tab padding, drop tab bevels.
- **Status pills stack under tabs** [🔴 high] — Obi/Luna pills overlap the tab pills' shadow; the Lv.1 chip on the bar reads as visual noise.
- **Coin / star counters jammed between status pills** [🟡 mid] — tiny, unlabeled, and lose to the loud tab colors flanking them. Coin count "5" needs a label so it doesn't look like leftover debug.
- **Tab color randomness** [🔴 high] — Pet (red), Decor (purple), everything else (brown). No semantic logic. One active accent only.
- **Day calendar uses three competing ways to mark "today"** [🟡 mid] — yellow ring (Day 1), red strikethrough (Day 5 "30 coins"), gold star overlap (Day 7). Pick one.
- **Daily Gift gift sprite is generic** [⚪ low] — a tiny iconographic gift box on top of a hand-painted Annie/Obi/Luna world. Either replace with a painted gift box or have Obi_ nudge _a real present in the room.
- **"Click to open!" doubles up on the modal title** [⚪ low] — "Welcome back! Here's your Day 1 gift." + "Click to open!" — two CTAs in one panel. One sentence, one button.
- **Welcome banner is generic** [🟡 mid] — "Welcome home! Obi and Luna are happy to see you." This is good writing for day 1, but it doesn't change. Rotate it through the same writing voice as the cycling title subtitles, or vary by mood ("Luna is in a curious mood today.").
- **Goal pill is tiny and clipped** [🟡 mid] — "Goal: Dreaming Obi (+10 coins)" is half off-canvas at the bottom-left. The goal system is genuinely good — it deserves a real anchor.
- **Bottom welcome banner shape collides with the canvas radius** [⚪ low] — the banner pill touches the rounded corner mask of the canvas. Inset 16px.
- **Photo / scrapbook icons stacked under the sound icon** [🟡 mid] — three different shapes (rounded square, square, square with no padding) drifting downward in a column. No visible label until hover.

1
2
3
4
5
6
7
8
9


### 03 — Backyard

## A real, painterly bench parked next to placeholder props.

- **Tree is two flat green circles on a brown line** [🔴 high] — strongest art-style mismatch in the game. Bench, pets, bird feeder, sundial, and birdhouse are all rendered; the tree is unfinished.
- **"← Go Inside" pill is invisible** [🔴 high] — same color family as the bench/grass behind it. New players will not find their way back. Cream-on-cocoa with a left arrow, top-left, anchored to the safe area.
- **Flat single-tone grass** [🟡 mid] — no horizon shading, no variation. A subtle vertical gradient or low-density grass-blade noise unifies the scene.
- **Lone shovel + dirt pile + stump** [⚪ low] — three medium-detail props with no spatial logic. Either group as a "garden corner" or distribute.
- **Decor button uses the inside-only purple** [🟡 mid] — repeats the inconsistent tab-color decision from the hangout. It's also the_ only _top-bar control on this screen, so the purple is even more arbitrary.
- **HUD doesn't carry over** [🔴 high] — coin/star counters move to top-center, no pet status pills, no tab row. Reads like a different game. The tab bar should still be there (with a "Yard"-tinted active state) so the player understands they're in the same world.
- **Welcome banner is identical to inside** [⚪ low] — same component, same tone. A backyard-specific line ("It's sunny out there." / "Smells like rain.") would earn the change of scene_ and _show off the weather system.
- **Garden patch sits on top of the bench** [⚪ low] — depth ordering: the bench is foreground but the flowers in the dirt are also foreground. No middle ground. Push the garden down 20–40px or shift right.
- **Bird feeder bird sprite is iconographic** [🟡 mid] — tiny pixel-icon bird sitting on a painted feeder. Same F3 issue at small scale.

1
2
3
4
5
6
7
8


### 04 — Bath Time intro modal (representative of the 12 minigame intros)

## Five blocks asking for the same eyeball, on a backdrop that wasn't authored for being a backdrop.

- **Five competing text blocks** [🔴 high] — title, body, twin pet pictogram, green "Happy Pets Bonus" line, esc-footnote. All roughly the same weight.
- **Two-pet pictogram is iconographic** [🟡 mid] — two tiny "wet pet" icons sit between the body and the bonus line. They're cute on their own but they're a third art language showing up in the modal (painted bg / painted modal text / icon characters). Either drop the icon or use the actual painted Obi+Luna mid-bath behind the modal.
- **Bonus line speaks like a Steam achievement** [🟡 mid] — "+3s, +10% score." Compare with the Decor reactions ("Luna sits on the book stack. Of course."). The bonus is a gift; phrase it like one.
- **"Time:" pill, raw integer, no units** [🔴 high] — "Time: 48" has no colon-formatted readout, no label hierarchy. Mono digits with stacked label fixes it.
- **Score widget partly hidden by sound icon** [🔴 high] — bath time, snack sort, pillow pop, where's luna, pawstep, wild wand, window watch — the issue repeats in every screenshot here.
- **Pause icon is a different chip** [⚪ low] — square pause "‖" sits next to the rounded "Time:" pill. Same chip family, please.
- **"SCRUB — Obi" target tag is a debug-style label** [⚪ low] — small all-caps with em-dash, anchored on top of the bath rug. Reads as an instruction overlay rather than part of the world.
- **Bath props (stripes on the wall, soap shelf) are flat icon** [🟡 mid] — tile lines and shelf are pure rectangles on the painted floor. Same F3 split.

1
2
3
4
5


### 05 — Snack Sort

## The first minigame where the room is purpose-built for the modal — and it works.

- **"← Dog Treats" header** [⚪ low] — directional cues are clear and consistent with "Cat Treats →" on the right. Keep this pattern in other minigames.
- **Center divider dotted line** [⚪ low] — actually does the navigational job that "←/→" arrows usually do. Good. Color it slightly warmer (cream-brown vs. neutral grey).
- **Bowl colors are the only feedback** [🟡 mid] — yellow Obi-bowl on the left, pink Luna-bowl on the right. Almost works, but the bowls are otherwise identical ovals. Painting paw print + bone vs. paw print + fish on the bowl rims would make the side-bias obvious.
- **Pet sprites at the back of the room are cropped** [⚪ low] — Obi and Luna sit at the back wall. Their faces are below the modal but their bodies are awkwardly half-present. Either bring them forward into the gameplay area or push them down so just a head peeks (a deliberate "they're watching" framing).
- **Vertical center divider runs through the modal** [⚪ low] — the dashed line appears to cross the modal panel (drawn underneath, but visually distracting). Stop the line at the modal's bounding box.

1
2
3
4


### 06 — Laser Chase (representative of "indoor minigame" set)

## The dim-overlay strength is set per-scene and it shows.

- **Room dim is near-black here** [🟡 mid] — compare to Pillow Pop / Where's Luna / Window Watch, where the dim is barely there. The intro screens don't feel like the same product.
- **Modal floats over a dark fog** [🟡 mid] — the cream modal looks harsh on this dim. A consistent ~55% scrim with a small blur reads better. Plus the dim is strongest where it should be lightest (the laser-glow areas the player needs to see).
- **Glowing laser targets fade into the fog** [⚪ low] — players can't tell what they're committing to. Either lift the dim around the targets (vignette inverted), or boost the glow alpha during instructions.
- **Luna is below the modal** [⚪ low] — the only character in the scene during instructions, and she's invisible (covered by the modal). She should be visible in the lower half of the canvas waiting for the laser, not hidden.

1
2
3


### 07 — Luna's Wild Wand (the "preview thumbnail" issue)

## The instruction-state previews are unframed.

- **Floating window-thumbnail at top-center** [🟡 mid] — a tiny window prop hovers over the canvas top edge with no context. It looks like an asset placement bug, not a preview. If it's a "next obstacle" preview, it needs a label or a frame.
- **Luna sliver pokes from the left edge** [⚪ low] — same root issue as Treat Toss/Window Watch: the gameplay scene isn't authored as a "behind-the-modal" composition.
- **"Cleared: 0" pill at very bottom** [⚪ low] — half off-canvas, raw label. Joins the family of inconsistent counters: Time, Score, Goal, Cleared, Longest, Round, Combo. Each minigame invents its own.

---


**Section 04**
## All 12 minigames, one by one
Above we covered the modal pattern. Below is a per-minigame note: what's specific to_ that _game's HUD, art, and tuning. Same severity tags. Some entries are short — that means the only issues are the systemic ones (which are still real, but covered above).


---


---


01

Tier 1 · 60s · click to toss
Treat Toss


- **Annie's head pokes above the modal** — frame her into the lower-third of the canvas during instructions.
- **"Combo" is one of the only places mono digits would shine** — the painterly font is currently used for "x3" — rendered as a script. Mono ×3 with a small pulse on increment would feel like real game-feel.
- **Obi's catch hitbox isn't telegraphed pre-game** — the instruction modal could draw a dotted catch zone behind it.
- **Speed-up timer on misses adds pressure** — keep, but communicate it: a small pet emoji-mood icon next to the score that flips when Obi gets faster.

---


---


02

Tier 1 · 60s · mouse-follow
Luna's Laser Chase


- **Dim is too strong** (see §3-06).
- **Laser dot is a flat circle** — paint a soft red glow + tiny core highlight. The dot is the most-watched object in the game; spend 6 lines on it.
- **"Move your mouse to control the laser dot!" is wordy** — "Lead Luna with your laser." That's it.
- **Targets need a "consumed" animation** — currently they vanish; a quick paw-bat + sparkle reads as Luna catching them, not as a UI dismissal.

---


---


03

Tier 2 · 90s · LEFT/RIGHT balance
Cuddle Pile
[ no captured shot · placeholder ]


- **"Press LEFT and RIGHT" instructions are a keyboard-icon problem** — show the actual ← / → key glyphs, not text. Currently the words "LEFT" and "RIGHT" sit in the body.
- **Win state at 90s deserves a payoff** — "Maximum Cozy" achievement. Build a quiet 2-second hero shot of all three asleep on the couch before kicking back to the results modal.
- **Balance bar is the most game-feel-dependent meter in the build** — needs a colored danger zone at the ends and a gentle wobble animation, not just a moving tick.

---


---


04

Tier 2 · 60s · side-scroll click
Obi's Walk


- **Houses behind the fence are flat color triangles** [🟡 mid] — purple, blue, green, red roofs on identical beige boxes. The single most "this is a placeholder" moment in the game after the backyard tree.
- **Annie + Obi held in place, world scrolls past** — good. Add a tiny vertical bob on Obi (already there?) and a heel-step on Annie's boot to sell the walk.
- **Fire hydrant sits alone** — needs a friend (a lamppost, a mailbox) to feel like a street.
- **Squirrel callout reads "tap squirrels before Obi chases them"** — phrase as_ Obi's _stake: "Stop Obi from chasing squirrels into the road."

---


---


05

Tier 2 · 60s · placement / drift
Luna's Nap Spot
[ no captured shot · placeholder ]


- **Sunbeams are the visual hero** — they need to be painterly: warm gold gradient, soft edge, slow drift, dust motes. Today they're likely flat shapes (assumed from screenshots of similar-tier scenes). Spend art budget here.
- **Cushions vs. sunbeams as a "place + follow" loop** is a great cozy mechanic. The instruction sentence is two sentences too long: "Place cushions in the sun. Move them to follow the light."
- **Luna's nap pose during play** — make sure she settles, breathes, then dreams (Z's). Today she likely just "sits."

---


---


06

Tier 2 · 45s · drag-to-scrub
Bath Time


- **Three-step instruction — "scrub / rinse / dry"** — show 3 micro-pictograms in a row instead of cramming three verbs into a body sentence.
- **"SCRUB — Obi" target label** reads as debug. Replace with a soft pulsing hand cursor outline and remove the text.
- **Tiled wall + tub looks like icon art** — the room asset needs a paint pass. Flat aqua tile + cream tub doesn't match the painted Obi.
- **Rubber duck is a bright yellow blob in the screenshot** — give it a beak and an eye dot, that's all the affordance you need.

---


---


07

Tier 1 · 60s · drag to bowls
Snack Sort


- **The two-side composition is the cleanest minigame setup in the game** — left dog, right cat, divider. Use this as the template for "two-pet" mechanics.
- **Wrong-side feedback isn't mentioned in the modal** — what happens if you drag a bone right? Show the failure state in a tiny pictogram.
- **Treat sprite is iconographic** — a yellow bone and a pink fish-shape on a painted floor. Paint the treats once, reuse everywhere they show up (Treat Toss, Daily Gift, achievements).

---


---


08

Tier 2 · 60s · whack
Pillow Pop


- **Pillows are six identical pastel ovals** — vary slightly: one with stripes, one with a moon, one with a paw print. Today the difference between a "pillow with Luna in it" and "pillow with Obi in it" is just the ear color.
- **"Click Luna! Don't click Obi!" is a negative instruction** — flip it: "Tap when Luna pops up — Obi loves naps."
- **Tiny ear-tip preview at modal-bottom** — cute! Make it bigger and label it ("This means Luna").
- **Fail state — tapping Obi** — needs a soft sleepy "zzz" + small score deduction. Don't punish hard.

---


---


09

Tier 2 · 60s · spot Luna
Where's Luna?


- **Three cushions with a "?" on the green one** — currently the indicator is a literal text question mark. A cat-tail twitch peeking out from one cushion would do the same job, in-world.
- **"Round 0" label is debug-y** — drop the integer; make it "Round 1" and increment, or just don't show it at all (the cushions tell the story).
- **Cushion shuffle animation is the entire game-feel** — slow ease, slight hop, soft "swish" sound. Worth 30 minutes of polish.

---


---


10

Tier 2 · 60s · click bird/butterfly
Window Watch


- **The window itself is the gameplay frame** [🟡 mid] — but the painted Luna sits in front of the window during instructions. She needs to be at the bottom or the side, not blocking the playfield.
- **Tiny lone tongue/leaf icon at modal-bottom** — the "don't click leaves" pictogram reads as a debug glyph. Make it a real leaf with a soft fall animation.
- **Score progression is invisible** — a small Luna-tail wag rate that picks up as score goes up would make the playthrough feel rewarding without changing UI.

---


---


11

Tier 3 · sequence memory
Pawstep Patterns


- **2×2 button grid feels like a settings dialog** [🟡 mid] — generic rounded-rect buttons with a faint outline. Replace with circular Obi/Luna face buttons (head shot in a paw-print frame), action label below.
- **"Longest: 0 steps" runs off the bottom** [🟡 mid] — meta info clipped by canvas edge.
- **Sequence playback uses Simon-style flashes** — cozy version: each pet "speaks" their step (paw-tap sound + tail wag) instead of a button glow.
- **Reverse-sequence challenge mode** is brutal — keep it, but tutorialize it with a tiny preview of the reverse sequence on round 1.

---


---


12

Tier 3 · flap-style avoid
Luna's Wild Wand


- **Wild Wand = Flappy Bird in cat form** — that's good. The framing currently doesn't sell that joke. The instruction body should read "Tap to wiggle the wand. Lead Luna through the gaps." with three tiny gap pictograms.
- **The window thumbnail at top is the obstacle preview** — nobody knows that. Either label it or remove it from the instruction state and re-introduce it in the first 3 seconds of play.
- **"Cleared: 0" counter is the bottom-right "score family"** — fold into the unified Score widget.

---


**Section 05**
## The four locked panels — Decor / Wardrobe / Scrapbook / Game Menu
v1 couldn't get to these because the dedication overlay was up during capture. Inspecting the code: each panel has its own pagination, its own tab style, its own close-button position (all at {x: W/2 + 200, y: 84, w: 36, h: 36} — same coords, but each panel's content frame around it is different sizes). They want to be_ one _reusable panel component with: tabs · paginated grid · close button · empty state · price/locked chip.


#### Decor — 40+ items, 4 tiers, seasonal, gameplay-affecting
It's a real interior-design shop hiding behind a "decor" word.

- **Mixing decoration toggles, palette cycles, gameplay upgrades, and seasonal items in one paginated list** — these are four different shop categories. Tabs: Room · Comfy Upgrades · Seasonal · Cozy Set.
- **The "✨ Comfy Bowls" name-prefix sparkle** is the only signal that this item changes gameplay. Move that to a real "boost" badge on the card (small honey-yellow chip: "+25% bowl life") so it shows up at-a-glance.
- **Locked items show stars-required as a number** — better:_ show the lock state _with the star count so the player understands they're earning toward it ("17 / 25 stars").
- **Cycle items (e.g. Rug Color, Room Style)** currently increment via tap. They should preview in-place — small swatch row on the card, tap a swatch to set it.
- **Room Style cycle has 5 labels but max=4** — code: { max: 4, labels: ["Cozy Neutral","Pastel Cute","Warm Cottage","Moonlight Blue","Bookish Cozy"] }. One label is unreachable or off-by-one; verify.
- **Decor Reactions are invisible until they trigger** — the player buys "Music Box" not knowing Luna will ever paw at it. A tiny "interactions" chip on the item card ("Luna might paw at this.") makes the purchase feel meaningful.


#### Wardrobe — 3 characters, ~16 items each, 4 slots
A dress-up paper-doll in a paginated form.

- **Three character tabs (Obi / Luna / Annie) at top, list below** — but the tabs are tiny boxes at {x: 80–340, y: 130}. They should be the largest UI in the panel — a full row of three painted character portraits, the active one lifted slightly.
- **The wardrobe has slots** (head / neck / body / wrist) but the panel doesn't show the character with their current outfit. The whole appeal of dress-up is seeing the character change. A hero portrait of the active character on the left, item grid on the right — and tapping an item swaps it live.
- **Mixed unlock methods: price, tier, achievementUnlock, starUnlock, season** — the card needs to surface which lock applies. A single chip: 🏆 trophy (achievement), ⭐ stars, 🪙 coins, 🌸 season.
- **Floral Crown for Annie has achievementUnlock: "napMaster+catWhisperer"** — a compound unlock with no UI affordance for "you have 1/2." Ladder progress is invisible.
- **Seasonal items (Cherry Branch, Sun Visor, Plaid Scarf, Reindeer Antlers)** need a "this season" sash and a calendar tooltip — otherwise it looks like the item is randomly broken.


#### Scrapbook — photos · milestones · achievements · goals
The most narratively important panel. Currently the most "list-y."

- **Three tabs at {x:80}, {x:158}, {x:?}** — same tab pill style as the wardrobe but a different size. A scrapbook should feel like an actual book: paper texture, page corners, photo-album captions.
- **Photos are stored as data URLs (canvas captures with "Annie's Cozy Day" watermark)** — fantastic feature. Display them as instant-print Polaroids with hand-written captions, not as a flat grid.
- **Milestones / achievements / goals are intermixed in the entries** — the entry types "milestone" | "achievement" | "photo" should each have their own paper style: milestone = ribbon, achievement = stamp, photo = polaroid.
- **Scrapbook Goals (Dreaming Obi, Grooming Session, Both 80+ Joy, Rainy Day, etc.)** are not surfaced with hints. The whole "wait for the right moment, take the photo" loop is invisible to the player. A "challenges" tab inside Scrapbook with checkbox progress would surface it.
- **The entries are real, dated, narrative** ("Played Annie's Cozy Day for the first time!", "Dedicated Caretaker unlocked!"). Lean into that — make them sentences, not log lines.


#### Game Menu — 12 game cards, paginated 6 at a time
Twelve doors. A long scroll. No sense of progression.

- **One huge horizontal-ish list of 12 cards with 6 visible** — but the player has 33 stars to earn, plus 12 challenge stars. The Game Menu should be the place where total stars, % complete, and which game is next-to-3-star_ live _. Today it's a dumb list.
- **Each card has a star count derived inline** — (s>=1400?3:s>=700?2:s>=300?1:0) — fine, but the next threshold ("you need 700 for a 2nd star") isn't shown. The minigame menu is the natural place for "next goal" hints.
- **Card icon vs. tier color vs. game color** — a card has a `color` and an `icon` (`bone`, `star`, `paw`, etc.) and lives in a tier (1-4) which has its own color. Three signals fighting. Pick: tier sets the tab, card stays neutral.
- **Locked tier-4 games** need to read as "earn more stars" not as "this is broken." A single padlock tile with the star/streak/achievement requirement spelled out.
- **Scroll-up / scroll-down chevrons live as separate hover keys** — no scroll wheel support, no swipe, no keyboard up/down. Add at minimum keyboard nav.


#### The shared component you wish you'd built first

- **Frame** — panel(W, H, title, onClose). Cream rounded rect, soft shadow, top-bar with title + tab slots + close. All four panels share this.
- **Tabs** — segmented pill row anchored top-left of the panel content;_ not _floating chips at hand-coded x-positions. Active = accent fill.
- **Card grid** — 3-column responsive (3×2 = 6 per page). Each card has: thumbnail, name, sub-line, lock/price chip, hover state. Pagination chevrons live in the panel chrome, not in the content area.
- **Lock chip** — <chip kind="stars|coins|achievement|season|streak" value="..."/>. One component, six lock kinds, consistent placement (top-right of card).
- **Empty state** — every panel needs one. "No photos yet — try the camera at top-right." "No achievements yet — play a minigame." Currently empty tabs render as empty blanks.
- **Close button** — single × chip at_ panel _top-right (not at canvas top-right). Today it's at W/2 + 200 which only works if the panel is exactly 400px wide and centered.

---


**Section 06**
## Living systems — joy, weather, visitors, mood, streak
These are systems the game runs but rarely surfaces. Each one is a "the game is alive" feature that's currently invisible to a first-time player.


#### Pet Joy + Mood
Real math, but the pills don't show their work.

- **"Obi: sleepy" / "Luna: aloof"** — these are mood labels driven by the day-of-week mood preference. The pill doesn't say it's a mood; it reads as a static descriptor.
- **Joy is a 0–100 number** — currently shown as a thin bar without numerals or thresholds. Add a tiny numeric readout on hover and milestone marks at 50/80.
- **Mood multipliers are real** (e.g. cuddly Obi: pet ×1.5) — the player gets no signal that "now is a good time to brush." A small mood-icon next to the action chip ("brush is x1.4 for Obi today") would teach the system without a tutorial.
- **Joy decay rate varies per mood** — invisible. Show a tiny down-arrow rate next to the pill in the hub when joy is dropping fast.
- **Joy > 80 unlocks the "Happy Pets Bonus" in minigames** — that's a great connection. Lean in: the "+3s, +10%" bonus chip should literally say "Obi & Luna are happy. Bonus active."


#### Weather + Window Tint
Beautifully implemented, almost never noticed.

- **5 weather types with weighted spawn** (sunny 0.3, cloudy 0.25, rain 0.2, snow 0.1, golden 0.15) — and a per-weather window tint. Lovely. Now_ tell the player it's raining. _
- **The "Rainy Day" Scrapbook goal** is invisible until you happen to look at the window. A tiny weather chip in the HUD ("☁ rainy") lets the player know to take a picture.
- **Snow weather should change pet idle behavior** — Luna pressed-against-the-window mode. Today the weather is purely cosmetic on the window pane.
- **Golden hour weather** is a magic-cozy mood — author a one-line floating banner ("The light is gold today.") for the first time in a session.


#### Visitors
Mail carrier, neighbor cat, squirrel, bunny, ice cream truck — and you'd never know.

- **Spawn timing isn't telegraphed** — a visitor walks on, gives a 12–16s window to interact, then leaves. The player needs to_ see they only have 14 seconds _. A soft chime + a one-line banner ("A robin is singing outside!") happens, but if the player is mid-action they miss it.
- **"A bunny hopped by with a basket!" (spring only)** — author the banner with a tiny bunny silhouette next to it, not just text. Same for all 8 visitor types.
- **Coin / joy reward isn't shown** — the player gets coins and joy from interacting; they don't know which visitor gave what.
- **Seasonal visitors** — the game already has 4 (bunny / ice cream / scarecrow / Santa elf) — call them out in a "first appearance" beat for that season.


#### Streak
A 30-day streak unlocks "Dedicated Caretaker." That word matters. Earn it.

- **Current streak is shown only inside the Daily Gift modal** — "Streak: 0 days." It's the most emotionally meaningful number in the save. Surface it on the title screen.
- **30-day milestone** writes a Scrapbook entry: "Dedicated Caretaker unlocked!". Make this a real beat — full-screen ribbon, character cheer, sound.
- **Streak break is silent** — if the player misses a day, the counter resets without any "your pets missed you" beat. A one-time "Obi looked for you yesterday." line earns the streak emotionally without nagging.


#### Coin / star / achievement economy
Three currencies, no clear hierarchy.

- **Coins (🟡) buy decor + accessories**. **Stars (⭐) unlock content tiers + achievements**. **Achievements (🏆) unlock special items**. A first-time player can't tell those apart.
- **Currency icons don't scale** — coin is rendered as a generic yellow dot, star as a yellow star, achievement as a colored circle. Paint them once; reuse everywhere.
- **Star milestones (10, 20, 25, 30, 33)** award bonus coins. Make this a fanfare — currently it's silent.
- **"Lucky Charm" upgrade gives +2 coins per minigame** — invisible to the player after they buy it. Show "+12 (Lucky Charm)" floating text instead of just "+10".


#### Daily tasks · Weekly challenges
Two parallel quest systems with no UI for either.

- **Daily Task pool: 7 tasks (pet, feed, water, brush, toy, treat, game)** — these are tracked per day but never shown to the player as a checklist. A small "Today: 2/3" chip in the HUD turns this into a real loop.
- **Weekly Challenge pool: 8 challenges (Play 5 games, earn 8 stars, etc.)** — same problem. The reward (40–60 coins) is real but the player never sees the challenge unless they happen to scroll the right panel.
- **Both systems already track gamesPlayed, starsEarned, petActions, feederFills, flowersPlanted, photosTaken, streakDays, itemsBought** — the data is all there. The UI is the missing piece.


#### Challenge stars (the secret 4th star)
Each minigame has a hidden modifier — Speedy Obi, Invisible Targets, Wiggly Pile. Players don't know.

- **Challenge mode is unlocked after 3-starring a minigame**, but there's no UI in the minigame menu to "switch to challenge mode." Add a small "★+1" chip on the card once it's eligible.
- **The 12 modifiers are good writing**: "Speedy Obi" (Obi moves 50% faster), "Invisible Targets" (targets fade), "Restless Beams" (sunbeams 2x faster). Surface the modifier as a banner on the start screen — it's the entire identity of the run.
- **"Challenge Champion" achievement = 5 challenge stars** — a real flex. Make sure it has a real reveal.

---


**Section 07**
## Writing & voice
There are at least four narrative voices in the game right now. The cozy voice is already there in places — it just needs to take over.


#### The four voices, in their natural habitats

Cozy
"Welcome home! Obi and Luna are happy to see you."
Quest log
"Goal: Dreaming Obi (+10 coins)"
Steam toast
"Happy Pets Bonus +3s, +10% score"
Debug
"Time: 63 Round 0 Cleared: 0 Longest: 0 steps"
Plus a fifth voice from the cycling subtitles ("Obi wants belly rubs," "Luna is judging you lovingly"). That one's the one to keep.


#### Specific lines to rewrite

- **Title cycler** — drop "Made with love and way too much JavaScript." Adds nothing to anyone but you, breaks tone.
- **Modal footer** — "Click to begin early • Esc to go back" → split into two: a real button row + a single line of meta. Or, even better: "Tap when you're ready · Esc to cuddle instead."
- **Bonus chips** — "Happy Pets Bonus +3s, +10% score" → "Obi and Luna are happy today. Bonus time."
- **HUD readouts** — "Time: 63" → label-stack: "TIME / 1:03". "Score" → label-stack: "SCORE / 240". "Round 0" → "Round 1" (1-indexed) or hide if redundant.
- **Goal pill** — "Goal: Dreaming Obi (+10 coins)" → on the goal card itself: "Take a photo of Obi while he's napping." (This is what it actually means.) The "+10 coins" earn-back is fine in small print.
- **Pet status** — "Obi: sleepy" is fine. "Luna: aloof" is great. But "Lv.1" on the joy bar is debug. Drop it; level reveals via decoration unlocks.
- **Minigame instructions** — average length is 14 words. Trim to ≤ 8. "Click and drag to scrub! Click the tub to rinse! Drag to dry!" → "Drag to scrub. Tap the tub to rinse. Drag again to dry." Same content, calmer cadence.
- **"Click anywhere to begin"** on the dedication card — when this is the most important moment of the game's first session, "Click anywhere to begin" is corporate. "Tap to start the day." or just leave it implicit.


#### The voice you already have, that everything should sound like
From the Decor Reactions table:

- **"Luna sits on the book stack. Of course."** — period, with the in-character editorial.
- **"Obi grabbed a toy from the basket!"** — exclamation, action, pet name, no UI words.
- **"Both pets look up at the family portrait."** — quiet, observed.
- **"Luna relaxes by the candlelight."** — conditional ("nighttime only"), ambient, six words.
Apply this voice to: welcome banner rotation, minigame intros, achievement reveals, daily-gift opens, milestone scrapbook entries, level-up moments. The pattern is:_ specific pet · specific action · period or quiet exclamation · no game-system words. _

---


**Section 08**
## Motion, audio, juice
The game has a particle system, a procedural audio manager, ambient loops per scene, and a real animation foundation (breath, blink, tail, ear, hair sway). Here's where to spend the next hour of polish budget.


#### Mode transitions

- Hangout → minigame uses a crossfade. Good. The minigame → results path uses a hard cut. Match.
- Backyard ↔ Hangout has no transition; the screen swaps. A 200ms fade covers a multitude of art-style differences.
- The dedication card is the one transition that's genuinely well-staged (alpha + delayed-character reveal). Use that as the template.


#### Score / combo feedback

- "+10 coins" floating text exists. Make it spring out, not float linearly.
- Combo numbers should pulse + scale up with combo count, not stay the same size.
- "Score" needs a tiny tick increment animation, not just a value swap.
- Star results screen — all 3 stars should land sequentially with a small bounce (cozy, not grandiose). Today they likely all show at once.


#### Pet idle

- Annie's hair sway, blink, breath are real and look great. Keep.
- Obi's tail wag rate could vary by mood (waggy mood = fast, sleepy = slow swing).
- Luna's ear twitch needs more idle variety — sometimes she should turn her head slowly, sometimes fast.
- Both pets should occasionally_ look at the cursor _when it's near. 30 minutes of work, huge personality dividend.


#### Audio

- **Procedural audio with mute persistence** — already done. Compliment.
- **Per-scene ambient loop** — hub vs. backyard differ. Minigames ideally each have their own (bath splash, walk neighborhood, window birds).
- **"audio.tinyChime()"** is everywhere — different actions deserve different chimes. Currently the tab change, panel close, and milestone reach all sound similar.
- **Pet vocals** — a single quiet bark/meow on pet, never on idle, would make the pets feel alive without becoming annoying.
- **Music box decoration** should actually_ play _when activated — the name promises it, the audio system can deliver.


#### Particles

- Heart particles on pet — confirmed in code, looks great.
- Confetti on achievement unlock — should be cozier (drifting paper rather than colorful confetti).
- Steam from the tub in Bath Time — the water is there, the steam isn't. Two curved rising lines, ~30% alpha, low priority but huge ambiance.
- Snow / rain particles on the window during weather — already implemented? Verify with a snow-day capture.
- Sun-dust motes during golden-hour weather and Luna's Nap — "premium cozy" particles, worth the spend.

---


**Section 09**
## Reading, accessibility, edge cases
Annie should be able to play this with one hand, on a laptop, with the volume off, while petting an actual cat. Some of these are real bugs; others are lightweight wins.


#### Text contrast & size

- **"Goal:" pill on the bottom-left of the hub** — small, brown-on-cream, often half-clipped. WCAG: questionable. Bump size, anchor to safe area.
- **"← Go Inside" pill in the backyard** — fails contrast badly (sage on sage). Fix is the same as F4.
- **"A Cozy Minigame Collection" tagline** — light grey on cream. Bump weight or color.
- **"Click to begin early • Esc to go back" footnote** — tiny, on a colored bonus background. Increase size; or split into a button row.
- **HUD digits (Time, Score, Combo)** — Fredoka One is soft as a digit. A mono replacement (IBM Plex Mono / DM Mono / Recursive Mono) reads at 50% the size and twice the clarity.


#### Input

- **Mouse + keyboard + touch handled** — instructions branch on isMobile. Good.
- **No keyboard nav inside panels** — a keyboard-only player can't browse the Decor list.
- **Esc closes the topmost panel** — good. But the Esc behavior cascade through dedication → menu → decor → wardrobe → scrapbook → title-out is undocumented to the player.
- **No "are you sure" on quitting a minigame** — Esc dumps progress immediately. Mid-run protection: a soft confirmation chip "Esc again to leave."
- **Cuddle Pile uses ← / → keys** — modal says "Press LEFT and RIGHT" in words; show key glyphs.


#### State edge cases

- **Empty scrapbook** — no photos, no milestones, no goals = blank tabs. Empty state for each tab.
- **First minigame play** — modal lands instantly. No "Hey, here's how stars work." beat. A 1-time tutorial chip ("3 stars → bonus coins") on the first run only.
- **0-score result** — what does the results screen say if you scored zero? "Maybe next time!" needs to feel like Annie's pets still love her, not a fail screen.
- **Day-1 player closes the dedication, then quits without playing a minigame** — coming back the next day, do they get the "away story"? Verify.
- **localStorage cleared between sessions** — the store keys default to firstVisit: true, joy: 54/56, etc. The dedication will re-show. Good. But all stars and money reset; no resilience to a corrupted save.


#### Reduced motion / sensitivity

- No prefers-reduced-motion branch. Annie may be photo-sensitive after a long day. A toggle in a (currently nonexistent) Settings panel: dim the heart-particle confetti, slow the camera flash.
- Camera flash on photo capture is a brief full-canvas white. Add a "low flash" option.
- The dedication card hearts pulse continuously. Slow the pulse on reduced-motion.

---


**Section 10**
## The dedication card
This is the heart of the project, so it gets its own section. The current state is already_ good _. Below are surgical changes that take it from "a sweet thing" to "the moment Annie remembers."


#### What it currently does (verified from source)

- **Triggered on first visit ( store.firstVisit )**.
- **Fades up over 1.5s, then the three characters fade in 0.5s later** ( this.dedication.phase ).
- **Eight pulsing pink hearts** drift in a sine wave above the panel.
- **Title:** "Made with Love" / Subtitle: "for Annie, Obi, and Luna"
- **Annie in a "cheer" pose, Obi sitting happy, Luna sitting with a tail sway and ear twitch**.
- **A pulsing "Click anywhere to begin" prompt** at the bottom.
- **Esc_ also _dismisses it** — and_ also _sets firstVisit = false. Should it? Esc-dismiss feels cheap for a one-time moment.
- **Dismissal writes a Scrapbook entry** ("Played Annie's Cozy Day for the first time!") — perfect, keep.


#### Surgical improvements

- **The text is two lines.** It could be three:_ For Annie. For Obi. For Luna. _Three separate fades, each character lit as their name appears. (Annie at "For Annie", Obi at "For Obi", Luna at "For Luna.")
- **"Click anywhere to begin" is corporate.** Replace with "_ (turn the page) _" in italic small caps, or just nothing — a 4-second auto-progress.
- **Hearts** — currently 8 evenly-spaced floats. Replace with a small heart leaving Annie's hand and rising past the title.
- **The card itself** — a softer cream-white, with a faint paper texture and a hand-drawn border. The current rectangle reads as a UI panel; the moment wants to read as a card-on-a-table.
- **Disable Esc-dismiss until the 1.5s phase has elapsed** — already gated to phase >= 1.5 for click, but Esc bypasses (line 5354). Match.
- **Audio** — a single soft chord on entry, not the menu chime. audio.tinyChime() on dismiss is fine.
- **Once a year** — show this card again on the anniversary of first launch. (One-line check on game boot.) Tiny detail that turns a one-time moment into a tradition.


#### The line itself
"Made with Love · for Annie, Obi, and Luna"
It works. If you want to push it further, the current text is the only place in the whole game that breaks the "specific pet · specific action" voice from §7. That's correct for a dedication. Don't overthink it.
If you do want to extend, consider a third line under the names that moves with the cycling-subtitle voice:

- "_ The important things, mostly. _"
- "_ Obi's bark, Luna's purr, Annie's morning. _"
- "_ For all the cozy days. _"
One line, italic, ~70% alpha. Don't pile on.

---


**Section 11**
## What to fix, in order
Quick wins first — small code changes that visibly de-clunk the game. Medium = touches one system. Large = touches an art direction. [💙 heart] tags are emotionally significant and shouldn't be batched with the rest.

-
id
effort
fix
area
-
Q1
small
**Stop the tab bar from clipping.** Reduce per-tab padding, rename "Wardrobe" → "Closet," collapse to a single accent for the active tab only. Drop Pet-red and Decor-purple.
HangoutScene
top tab row
-
Q2
small
**16px safe-area gutter on every HUD widget.** Goal pill, Score pill, Longest counter, Cleared counter — none render outside the safe area.
drawButton + HUD draws
-
Q3
small
**Standardize top-right buttons.** One chip shape, same size, same padding. Sound + pause + (hub only) camera + scrapbook.
drawSpeakerIcon, pauseIcon, cameraButton, scrapbookButton
-
Q4
small
**Make "← Go Inside" visible in the backyard.** Cream-on-cocoa chip, top-left, anchored to safe area.
BackyardScene.goInsideButton
-
Q5
small
**Unify dim-overlay strength.** One scrim color (~55% cocoa) + small blur for every minigame intro.
BaseMinigameScene.drawInstructions
-
Q6
small
**Format Time as 0:42, label Score with mono caps.** Replace "Time: 63" with stacked label + mono digits.
BaseMinigameScene HUD
-
Q7
small
**Drop the "JavaScript" subtitle** from TITLE_SUBTITLES. Keep the rest of the rotation.
TITLE_SUBTITLES (line 116)
-
Q8
small
**Trim minigame instruction copy** to ≤ 8 words. "Click and drag to scrub! Click the tub to rinse! Drag to dry!" → "Drag to scrub. Tap to rinse. Drag to dry."
12 BaseMinigameScene constructors
-
Q9
small
**Bonus chip rewrite.** "Happy Pets Bonus +3s, +10% score" → "Obi & Luna are happy today. Bonus time."
BaseMinigameScene
-
Q10
small
**Fix "Round 0" → "Round 1"** (1-indexed). Same for any other 0-indexed counter the player sees.
WheresLunaScene + grep
-
Q11
small
**Drop "Lv.1" badge from the joy bar.** The pet level system is opaque; this badge adds noise without info.
HangoutScene status pill
-
Q12
small
**Esc-dismiss on dedication should respect the 1.5s phase gate.** Currently bypasses; click already gates correctly.
HangoutScene.onKeyDown line 5354
-
Q13
small
**Verify roomPreset max/labels off-by-one.** 5 labels, max=4 — last label likely unreachable.
DECOR_ITEMS roomPreset
-
M1
medium
**Rebuild the minigame intro modal.** Eyebrow + title + 1 body sentence + bonus chip + Start button + tiny meta line. Apply to all 12. Frame the gameplay scene_ behind _the modal so no character gets sliced.
BaseMinigameScene + each enter()
-
M2
medium
**Rebuild the hangout HUD as one widget.** Pill-tab row + status/coin/star pills + icon group, on a single safe-area band.
HangoutScene draw
-
M3
medium
**Build the shared Panel component** (frame · tabs · card grid · close · empty state · lock chip). Refactor Game Menu, Decor, Wardrobe, Scrapbook to use it.
new drawPanel() helper
-
M4
medium
**Surface daily tasks + weekly challenges.** Tiny "Today: 2/3" chip on hub HUD; full panel inside Scrapbook.
HangoutScene + ScrapbookPanel
-
M5
medium
**Wardrobe = paper-doll.** Hero portrait of active character, item grid swaps live. Three painted character tabs at top.
WardrobePanel
-
M6
medium
**Tab the Decor panel** (Room / Comfy Upgrades / Seasonal / Cozy Set). Add lock chips with required state.
DecorPanel
-
M7
medium
**Repaint the floor bowls + cat-tower toy + window-watch leaf icon + Where's-Luna "?"** Replace iconographic placeholders with painted/atlas equivalents matching the pet sprites.
drawLivingRoom + minigame props
-
M8
medium
**Pawstep targets become circular pet faces.** Replace 2×2 form buttons with Obi/Luna head circles.
PawstepPatternsScene
-
M9
medium
**Streak surfacing.** Show streak count on the title screen; ribbon/celebrate at 7/14/30 day milestones.
TitleScene + careStreak hook
-
M10
medium
**Welcome banner rotation.** Replace the static "Welcome home!" with mood-aware rotation (15+ lines in the Decor-Reaction voice).
HangoutScene welcome
-
H1
medium [💙 heart]
**Polish the dedication card.** Three-line reveal ("For Annie. For Obi. For Luna."), heart leaving Annie's hand, soft chord on entry, paper-card frame, anniversary re-trigger. (See §10.)
HangoutScene drawDedication path
-
H2
small [💙 heart]
**"Maximum Cozy" win-state hero shot.** 2-second pause on the all-three-asleep tableau in Cuddle Pile before results.
CuddlePileScene win path
-
H3
small [💙 heart]
**"Dedicated Caretaker" reveal at 30 days.** Full-screen ribbon, character cheer pose, single chime, scrapbook entry written as a sentence not a log line.
care-streak milestone path
-
L1
large
**Repaint placeholder props** — backyard tree, hangout bookshelf, picture frame, fence, window clouds, walk-mode neighborhood houses, bath tile, Pillow Pop pillows. Either paint up to the pet level, or choose a uniform low-fi cozy style and bring everything down to it. The system matters more than the level.
drawLivingRoom · drawBackyard · ObiWalkScene · BathTimeScene · PillowPopScene
-
L2
large
**Frame minigames so the backdrop isn't accidentally sliced.** Each minigame's instruction state gets a "behind-modal" composition (no half-Annie, no sliver-Luna, no floating asset preview).
All 12 minigame enter()
-
L3
large
**Shared HUD type system.** Add a humanist sans for body and a mono for digits. Keep Fredoka for display only. Touches every scene.
font loader + draw helpers

---


**Section 12**
## One last note

The thing I want to say in plain English, with all the audit jargon turned off:
This game already has the part that's hardest to fake. The pets are alive. The dedication is real. The streak system_ knows what it's for _. Most of the fixes above are about getting the chrome out of the way of what's already there — they're not "make the game better," they're "stop the UI from talking over the game."
If you do nothing else, do **Q1, Q4, Q5, Q6, Q7, Q9, Q11, Q12** in an evening. That's eight one-line edits and it cleans up 70% of what makes this look unfinished. Then keep going on M1, M2, M3 over a weekend. Save L1 for when you have a free Saturday and a coffee.
And whatever you do, keep the dedication card. That's the whole reason this exists.

- **A.**** Take Q1–Q13 as a single source patch — I'll write the diffs against annies-cozy-day-test.html.
- **B.**** Build a clickable HTML mock of the new HUD + minigame intro modal first, before touching the canvas code, so you can feel the new system.
- **C.**** Build the shared Panel component (M3) and refactor one panel (Decor or Wardrobe) as a proof-of-concept.
- **D.**** Polish only the dedication / win-state / streak-milestone moments (H1–H3) — the heart tier first.
- **E.**** Repaint pass on the placeholder props (L1) — single biggest art-direction win, but the slowest. 