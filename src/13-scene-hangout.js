    function getCurrentFavorite(pet) {
      const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const seed = pet === "obi" ? weekNumber * 3 : weekNumber * 7 + 2;
      const favorites = pet === "obi"
        ? ["belly", "treats", "ball", "brushing"]
        : ["chin", "yarn", "brushing", "sunbeam"];
      return favorites[seed % favorites.length];
    }

    class HangoutScene extends BaseScene {
      constructor() {
        super("hangout");
        this.gamesButton = { x: 20, y: 16, w: 122, h: 40 };
        this.decorButton = { x: 600, y: 16, w: 122, h: 40 };
        this.modeButtons = [
          { key: "pet", label: "Pet", x: 148, y: 16, w: 88, h: 40 },
          { key: "treat", label: "Treats", x: 242, y: 16, w: 88, h: 40 },
          { key: "toy", label: "Play", x: 336, y: 16, w: 88, h: 40 },
          { key: "brush", label: "Brush", x: 430, y: 16, w: 88, h: 40 }
        ];
        this.hoverKey = null;
        this.mode = "pet";
        this.menuOpen = false;
        this.decorOpen = false;
        this.decorHover = null;
        this.decorFade = 0;
        this.menuHover = null;
        this.menuFade = 0;
        this.dedication = store.firstVisit ? { phase: 0, alpha: 0 } : null;
        this.gameCards = [
          { key: "treat", title: "Treat Toss", desc: "Toss treats to Obi and build catch combos!", color: "#E8A84C", icon: "bone", best: () => { const s = store.best_treat; const st = (s>=1000?3:s>=500?2:s>=200?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
          { key: "laser", title: "Laser Chase", desc: "Guide Luna's laser dot through glowing targets!", color: "#D44040", icon: "catEye", best: () => { const s = store.best_laser; const st = (s>=800?3:s>=400?2:s>=150?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
          { key: "cuddle", title: "Cuddle Pile", desc: "Keep the couch balanced while everyone fidgets!", color: "#7FB3D5", icon: "heart", best: () => { const s = store.best_cuddle; const st = (s>=90?3:s>=60?2:s>=30?1:0); return "Best: " + s + "s  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
          { key: "walk", title: "Obi's Walk", desc: "Walk Obi through the neighborhood and find treasures!", color: "#8D6E4C", icon: "bone", best: () => { const s = store.best_walk; const st = (s>=600?3:s>=300?2:s>=150?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
          { key: "nap", title: "Luna's Nap Spot", desc: "Place cushions in sunbeams to help Luna nap!", color: "#C39BD3", icon: "heart", best: () => { const s = store.best_nap; const st = (s>=800?3:s>=450?2:s>=200?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
          { key: "bath", title: "Bath Time", desc: "Scrub, rinse, and dry Obi and Luna!", color: "#87CEEB", icon: "heart", best: () => { const s = store.best_bath; const st = (s>=400?3:s>=200?2:s>=80?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } },
          { key: "sort", title: "Snack Sort", desc: "Sort treats into the right bowls!", color: "#E8A84C", icon: "bone", best: () => { const s = store.best_sort; const st = (s>=700?3:s>=350?2:s>=150?1:0); return "Best: " + s + "  " + "\u2605".repeat(st) + "\u2606".repeat(3-st); } }
        ];
        this.statusText = "Welcome home! Obi and Luna are happy to see you.";
        this.statusPulse = 0;
        this.sessionJoy = 0;
        this.idleTime = 0;
        this.strokeTick = 0;
        this.treats = [];
        this.toy = null;
        this.annie = {
          x: 404, y: 336, homeX: 404, homeY: 336, floorY: 420,
          pose: "idle", poseTimer: rand(3, 6), facing: 1,
          state: "idle", stateTimer: rand(4, 7), targetY: 336
        };
        this.obi = {
          x: 164, y: 430, homeX: 164, homeY: 430, matX: 262, matY: 446,
          targetX: 164, targetY: 430, joy: store.pet_obi_joy, facing: 1, bounce: 0,
          petTimer: 0, happyTimer: 0, sleepy: false,
          sniffTimer: 0, shakeTimer: 0, sniffing: false,
          carryingToy: false, carryTimer: 0
        };
        this.luna = {
          x: 694, y: 258, floorX: 598, floorY: 430,
          targetX: 694, targetY: 258, joy: store.pet_luna_joy, perch: "tower", facing: 1,
          petTimer: 0, happyTimer: 0, wiggle: 0, pounce: 0, pawBat: 0,
          groomTimer: 0, grooming: false, bellyUp: false, stretching: false, idleBehaviorTimer: rand(5, 8)
        };
        /* pet-to-pet interaction */
        this.petInteraction = { active: false, type: null, timer: rand(12, 18), phase: 0 };
        /* thought bubbles */
        this.obiBubble = null;
        this.lunaBubble = null;
        this.bubbleTimer = store.bubbleOnboarded ? rand(8, 14) : 2;
        this.bubbleWantHistory = [];
        /* joy save timer */
        this.joySaveTimer = 0;
        /* decoration unlock notification */
        this.decorNotification = null;
        /* floating reaction texts */
        this.floatingTexts = [];
        /* joy milestone tracking */
        this.obiMilestone = this.joyTier(this.obi.joy);
        this.lunaMilestone = this.joyTier(this.luna.joy);
        /* stroke trail for pet/brush mode */
        this.strokeTrail = [];
        /* food & water bowls — apply real-time depletion */
        const now = Date.now();
        const foodElapsed = (now - store.pet_food_lastFill) / 1000;
        const waterElapsed = (now - store.pet_water_lastFill) / 1000;
        this.foodBowl = {
          x: 130, y: 462,
          fill: clamp(store.pet_food_fill - foodElapsed / 144, 0, 100),
          lastFill: store.pet_food_lastFill
        };
        this.waterBowl = {
          x: 430, y: 466,
          fill: clamp(store.pet_water_fill - waterElapsed / 108, 0, 100),
          lastFill: store.pet_water_lastFill
        };
        this.foodBowlHitbox = { x: this.foodBowl.x - 28, y: this.foodBowl.y - 20, w: 56, h: 36 };
        this.waterBowlHitbox = { x: this.waterBowl.x - 28, y: this.waterBowl.y - 20, w: 56, h: 36 };
        this.bowlSaveTimer = 0;
        /* pet eating/drinking state */
        this.obi.eating = false;
        this.obi.drinking = false;
        this.obi.eatDrinkTimer = 0;
        this.luna.eating = false;
        this.luna.drinking = false;
        this.luna.eatDrinkTimer = 0;
        /* lamp & toy basket hitboxes */
        this.lampHitbox = { x: 96, y: 128, w: 58, h: 62 };
        this.toyBasketHitbox = { x: 248, y: 375, w: 38, h: 30 };
        /* daily gift */
        this.dailyGift = null;
        /* favorites */
        this.favDiscovered = { obi: false, luna: false };
        /* ambient events */
        this.ambientEvent = null;
        this.ambientEventCooldown = rand(60, 180);
        /* decor pagination */
        this.decorPage = 0;
        /* window + pet bed hitboxes */
        this.windowHitbox = { x: 62, y: 48, w: 128, h: 160 };
        this.petBedHitbox = { x: 142, y: 448, w: 76, h: 28 };
      }
      enter() {
        this.hoverKey = null;
        this.tooltip = null;
        audio.startAmbient();
        /* welcome back message if joy decayed while away */
        if (this.obi.joy < 40 || this.luna.joy < 40) {
          const msgs = ["The pets missed you! Give them some love.", "Obi and Luna could use some attention.", "Welcome back! The pets are waiting for you."];
          this.statusText = msgs[Math.floor(Math.random() * msgs.length)];
          this.statusPulse = 0.5;
        }
        /* check for newly unlocked decorations */
        const stars = totalStarsEarned();
        if (stars > store.lastKnownStars) {
          for (const item of DECOR_ITEMS) {
            if (item.stars > store.lastKnownStars && item.stars <= stars) {
              this.decorNotification = { text: "New decoration unlocked: " + item.name + "!", timer: 4 };
              break;
            }
          }
          store.lastKnownStars = stars;
          saveNumber("lastKnownStars", stars);
        }
        /* daily gift check */
        const today = new Date().toDateString();
        if (store.lastVisitDate !== today) {
          this.dailyGift = { phase: 0, collected: false };
          store.lastVisitDate = today;
          saveJSON("lastVisitDate", today);
        }
        /* care streak milestones */
        const streak = store.careStreak;
        const milestones = [
          { days: 3, reward: () => { this.obi.joy = clamp(this.obi.joy + 10, 0, 100); this.luna.joy = clamp(this.luna.joy + 10, 0, 100); }, text: "3-day care streak! Both pets are thrilled!" },
          { days: 7, reward: () => { store.decor.cozyBlanket = true; saveDecor(); }, text: "7-day streak! You earned the Cozy Blanket!" },
          { days: 14, reward: () => { this.obi.joy = clamp(this.obi.joy + 15, 0, 100); this.luna.joy = clamp(this.luna.joy + 15, 0, 100); if (this.foodBowl) this.foodBowl.fill = 100; if (this.waterBowl) this.waterBowl.fill = 100; }, text: "2-week streak! You're an amazing pet parent!" },
          { days: 30, reward: () => { store.decor.photoWall = true; saveDecor(); }, text: "30-day streak! A whole month of care!" }
        ];
        for (const m of milestones) {
          if (streak.count >= m.days && !streak.milestonesClaimed.includes(m.days)) {
            streak.milestonesClaimed.push(m.days);
            saveCareStreak();
            m.reward();
            this.decorNotification = { text: m.text, timer: 5 };
          }
        }
        /* daily tasks */
        if (store.dailyTasks.date !== today) {
          const seed = today.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
          const shuffled = [...DAILY_TASK_POOL].sort((a, b) => ((a.id.charCodeAt(0) * seed) % 97) - ((b.id.charCodeAt(0) * seed) % 97));
          store.dailyTasks = { date: today, tasks: shuffled.slice(0, 3).map(t => t.id), completed: [] };
          saveJSON("dailyTasks", store.dailyTasks);
        }
      }
      getPetRect(key) {
        if (key === "obi") return { x: this.obi.x - 72, y: this.obi.y - 112, w: 144, h: 120 };
        const y = this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y : this.luna.y;
        return { x: this.luna.x - 68, y: y - 104, w: 136, h: 120 };
      }
      setMode(nextMode) {
        if (this.mode !== nextMode) {
          this.mode = nextMode;
          this.statusPulse = 1;
          if (nextMode === "pet") this.statusText = isMobile ? "Pet mode \u2014 tap and drag over Obi or Luna!" : "Pet mode \u2014 click and drag over Obi or Luna!";
          else if (nextMode === "treat") this.statusText = isMobile ? "Treat mode \u2014 tap anywhere to toss a snack!" : "Treat mode \u2014 click anywhere to toss a snack!";
          else if (nextMode === "toy") this.statusText = isMobile ? "Play mode \u2014 tap left for Obi's ball, right for Luna's yarn!" : "Play mode \u2014 click left for Obi's ball, right for Luna's yarn!";
          else if (nextMode === "brush") this.statusText = isMobile ? "Brush mode \u2014 tap and drag over a pet to brush them!" : "Brush mode \u2014 drag over a pet to brush them until they sparkle!";
        }
      }
      pickPetForPoint(x, y) {
        if (pointInRect(x, y, this.getPetRect("obi"))) return "obi";
        if (pointInRect(x, y, this.getPetRect("luna"))) return "luna";
        return x < W * 0.5 ? "obi" : "luna";
      }
      petName(key) { return key === "obi" ? "Obi" : "Luna"; }
      petMood(key) {
        const pet = key === "obi" ? this.obi : this.luna;
        const joy = pet.joy;
        const food = this.foodBowl ? this.foodBowl.fill : 100;
        const water = this.waterBowl ? this.waterBowl.fill : 100;
        if (food < 30) return "hungry";
        if (water < 30) return "thirsty";
        if (pet.sleepy) return "sleepy";
        if (joy > 70 && this.idleTime > 12) return "sleepy";
        if (joy >= 35 && joy <= 70 && this.idleTime < 30) return "playful";
        return "cuddly";
      }
      moodLabel(key) {
        const mood = this.petMood(key);
        const labels = {
          hungry:  { obi: "hungry",  luna: "hungry" },
          thirsty: { obi: "thirsty", luna: "thirsty" },
          sleepy:  { obi: "sleepy",  luna: "drowsy" },
          playful: { obi: "waggy",   luna: "curious" },
          cuddly:  { obi: "cuddly",  luna: "aloof" }
        };
        return (labels[mood] || labels.cuddly)[key];
      }
      petSpriteState(key) {
        if (key === "obi") {
          let pose = "sit";
          if (this.obi.carryingToy) pose = "carryToy";
          else if (this.obi.eating) pose = "eat";
          else if (this.obi.drinking) pose = "drink";
          else if (this.obi.shakeTimer > 0) pose = "shake";
          else if (this.obi.sleepy) pose = "sleeping";
          else if (this.obi.sniffing) pose = "sniff";
          else if (this.toy && this.toy.pet === "obi") pose = "run";
          /* idle breathing bob */
          const obiBreathe = pose === "sit" ? Math.sin(game.time * 2.2) * 0.012 : 0;
          /* tail wags continuously with varying speed based on mood */
          const tailSpeed = this.obi.happyTimer > 0.1 ? 10 : (this.obi.joy > 65 ? 7 : this.obi.joy > 40 ? 5 : 3);
          const tailAmp = this.obi.sleepy ? 0.2 : (this.obi.joy > 65 ? 1.0 : 0.6);
          /* occasional head tilt fidget */
          const obiHeadBob = pose === "sit" ? Math.sin(game.time * 0.7) * 0.015 : 0;
          return {
            pose,
            expression: this.obi.sleepy ? "sad" : (this.obi.happyTimer > 0.1 || this.obi.petTimer > 0.08) ? "excited" : "happy",
            tail: Math.sin(game.time * tailSpeed) * tailAmp,
            bounce: this.obi.bounce + (this.obi.petTimer > 0 ? 0.04 : 0) + obiBreathe,
            facing: this.obi.facing,
            glow: this.hoverKey === "obi" ? "rgba(255,215,0,0.30)" : null
          };
        }
        /* Luna idle micro-animations */
        const lunaPose = this.luna.eating ? "eat" : this.luna.drinking ? "drink" : this.luna.stretching ? "stretch" : this.luna.bellyUp ? "bellyUp" : this.luna.grooming ? "groom" : this.luna.perch !== "floor" ? "lounge" : "sit";
        const lunaBreathe = (lunaPose === "sit" || lunaPose === "lounge") ? Math.sin(game.time * 1.8 + 0.5) * 0.01 : 0;
        /* tail sways with more organic motion (two overlapping sine waves) */
        const lunaTail = Math.sin(game.time * 1.7 + 1.2) * 0.7 + Math.sin(game.time * 2.9 + 0.4) * 0.3;
        /* periodic ear flick */
        const earBase = earSignal(game.time + 0.8);
        const earMicro = Math.sin(game.time * 0.6) > 0.92 ? 0.3 : 0;
        return {
          pose: lunaPose,
          tail: lunaTail,
          earTwitch: earBase + earMicro,
          blink: blinkSignal(game.time + 1.3, 0.38),
          wiggle: this.luna.wiggle + lunaBreathe,
          pounceStretch: this.luna.pounce,
          pawBat: this.luna.pawBat,
          facing: this.luna.facing,
          glow: this.hoverKey === "luna" ? "rgba(255,215,0,0.30)" : null
        };
      }
      rewardPet(key, amount, source, x, y) {
        const pet = key === "obi" ? this.obi : this.luna;
        pet.joy = clamp(pet.joy + amount, 0, 100);
        store[key === "obi" ? "pet_obi_joy" : "pet_luna_joy"] = pet.joy;
        saveNumber(key === "obi" ? "pet_obi_joy" : "pet_luna_joy", pet.joy);
        pet.petTimer = source === "pet" ? 0.32 : 0.18;
        pet.happyTimer = 0.9;
        this.statusPulse = 1;
        this.idleTime = 0;
        this.sessionJoy += amount;
        if (key === "obi") this.obi.sleepy = false;
        if (key === "obi" && pet.joy >= 88 && source === "pet" && this.obi.shakeTimer <= 0) {
          this.obi.shakeTimer = 1.2;
          this.statusText = "Obi does a happy little shake!";
          spawnParticleBurst(x, y - 14, [COLORS.gold, COLORS.softPink], 8, ["star"]);
        }
        if (key === "luna") {
          this.luna.perch = "floor";
          this.luna.perch = "floor";
          this.luna.targetX = this.luna.floorX;
          this.luna.targetY = this.luna.floorY;
          this.luna.grooming = false;
          this.luna.bellyUp = false;
          this.luna.stretching = false;
          this.luna.idleBehaviorTimer = rand(5, 8);
        }
        if (source === "pet") {
          this.statusText = this.petName(key) + " loves the attention.";
          spawnParticleBurst(x, y - 18, [COLORS.softPink, COLORS.gold], 6, ["heart"]);
          audio.tinyChime();
        } else if (source === "treat") {
          this.statusText = this.petName(key) + " happily crunches the treat.";
          spawnParticleBurst(x, y - 8, [COLORS.softPink, COLORS.gold], 9, ["heart", "star"]);
          audio.catch();
        } else if (source === "brush") {
          /* handled by brush click handler */
        } else if (source === "feed" || source === "water") {
          /* handled by bowl click handler */
        } else {
          this.statusText = key === "obi" ? "Obi chased the ball and brought it back!" : "Luna pounced on the yarn ball!";
          spawnParticleBurst(x, y - 8, [COLORS.gold, COLORS.softPink], 10, ["star", "heart"]);
          if (key === "obi") audio.combo(); else { audio.pounce(); audio.targetHit(); }
        }
        this.checkBubbleReward(key, source);
        this.checkJoyMilestone(key);
        this.recordCareAction(source);
        /* favorite item detection */
        const fav = getCurrentFavorite(key);
        const isFavAction =
          (fav === "belly" && source === "pet") || (fav === "treats" && source === "treat") ||
          (fav === "ball" && source === "toy") || (fav === "brushing" && source === "brush") ||
          (fav === "chin" && source === "pet") || (fav === "yarn" && source === "toy") || (fav === "sunbeam");
        if (isFavAction) {
          const bonus = fav === "sunbeam" ? 3 : 5;
          pet.joy = clamp(pet.joy + bonus, 0, 100);
          if (!this.favDiscovered[key]) {
            this.favDiscovered[key] = true;
            this.addFloatingText("Favorite!", px, py - 20, "#FF69B4");
            spawnParticleBurst(px, py - 10, ["#FF69B4", COLORS.gold, "#FFF4C0"], 10, ["heart", "star"]);
            audio.combo();
            this.statusText = this.petName(key) + "'s favorite thing this week!";
          } else {
            spawnParticleBurst(px, py - 10, ["#FF69B4"], 3, ["heart"]);
          }
        }
      }
      updateHover(x, y) {
        if (this.dedication) return;
        if (this.menuOpen) {
          this.menuHover = null;
          for (let i = 0; i < this.gameCards.length; i++) {
            const cr = this.getCardRect(i);
            if (pointInRect(x, y, cr)) { this.menuHover = i; break; }
          }
          const closeBtn = { x: W / 2 + 200, y: 84, w: 36, h: 36 };
          if (pointInRect(x, y, closeBtn)) this.menuHover = "close";
          return;
        }
        if (this.decorOpen) {
          this.decorHover = null;
          const pageItems = this.getDecorPageItems();
          for (let i = 0; i < pageItems.length; i++) {
            if (pointInRect(x, y, this.getDecorItemRect(i))) { this.decorHover = i; break; }
          }
          const closeBtn = { x: W / 2 + 200, y: 84, w: 36, h: 36 };
          if (pointInRect(x, y, closeBtn)) this.decorHover = "close";
          if (pointInRect(x, y, { x: 300, y: 530, w: 40, h: 30 })) this.decorHover = "prevPage";
          if (pointInRect(x, y, { x: 460, y: 530, w: 40, h: 30 })) this.decorHover = "nextPage";
          return;
        }
        this.hoverKey = null;
        if (pointInRect(x, y, this.gamesButton)) this.hoverKey = "games";
        else if (pointInRect(x, y, this.decorButton)) this.hoverKey = "decor";
        else {
          for (const btn of this.modeButtons) {
            if (pointInRect(x, y, btn)) {
              this.hoverKey = btn.key;
              return;
            }
          }
          if (pointInRect(x, y, this.foodBowlHitbox)) this.hoverKey = "foodBowl";
          else if (pointInRect(x, y, this.waterBowlHitbox)) this.hoverKey = "waterBowl";
          else if (pointInRect(x, y, this.lampHitbox)) this.hoverKey = "lamp";
          else if (pointInRect(x, y, this.toyBasketHitbox)) this.hoverKey = "toyBasket";
          else if (pointInRect(x, y, this.windowHitbox)) this.hoverKey = "window";
          else if (store.decor.petBed && pointInRect(x, y, this.petBedHitbox)) this.hoverKey = "petBed";
          else if (pointInRect(x, y, this.getPetRect("obi"))) this.hoverKey = "obi";
          else if (pointInRect(x, y, this.getPetRect("luna"))) this.hoverKey = "luna";
          else if (this.mode !== "pet" && this.mode !== "brush" && y > 90) this.hoverKey = "playfield";
        }
      }
      getCardRect(i) {
        return { x: 90, y: 114 + i * 64, w: 620, h: 56 };
      }
      getDecorItemRect(i) {
        return { x: 130, y: 150 + i * 88, w: 540, h: 78 };
      }
      getDecorPageItems() {
        return DECOR_ITEMS.slice(this.decorPage * 4, this.decorPage * 4 + 4);
      }
      decorPageCount() {
        return Math.ceil(DECOR_ITEMS.length / 4);
      }
      onMouseMove(x, y) {
        this.updateHover(x, y);
      }
      interactiveAt(x, y) {
        if (this.dedication) return true;
        if (this.menuOpen) {
          for (let i = 0; i < this.gameCards.length; i++) {
            if (pointInRect(x, y, this.getCardRect(i))) return true;
          }
          return pointInRect(x, y, { x: W / 2 + 200, y: 84, w: 36, h: 36 });
        }
        if (this.decorOpen) {
          const pageItems = this.getDecorPageItems();
          for (let i = 0; i < pageItems.length; i++) {
            if (pointInRect(x, y, this.getDecorItemRect(i))) return true;
          }
          if (pointInRect(x, y, { x: 300, y: 530, w: 40, h: 30 })) return true;
          if (pointInRect(x, y, { x: 460, y: 530, w: 40, h: 30 })) return true;
          return pointInRect(x, y, { x: W / 2 + 200, y: 84, w: 36, h: 36 });
        }
        if (pointInRect(x, y, this.gamesButton)) return true;
        if (pointInRect(x, y, this.decorButton)) return true;
        if (this.modeButtons.some((btn) => pointInRect(x, y, btn))) return true;
        if (pointInRect(x, y, this.foodBowlHitbox)) return true;
        if (pointInRect(x, y, this.waterBowlHitbox)) return true;
        if (pointInRect(x, y, this.lampHitbox)) return true;
        if (pointInRect(x, y, this.toyBasketHitbox)) return true;
        if (pointInRect(x, y, this.windowHitbox)) return true;
        if (store.decor.petBed && pointInRect(x, y, this.petBedHitbox)) return true;
        if (pointInRect(x, y, this.getPetRect("obi")) || pointInRect(x, y, this.getPetRect("luna"))) return true;
        return y > 90 && this.mode !== "pet" && this.mode !== "brush";
      }
      onClick(x, y) {
        /* dedication screen - click anywhere to dismiss */
        if (this.dedication) {
          if (this.dedication.alpha > 0.5) {
            this.dedication = null;
            store.firstVisit = false;
            saveBool("firstVisit", false);
            audio.tinyChime();
          }
          return;
        }
        /* daily gift overlay */
        if (this.dailyGift && !this.dailyGift.collected) {
          if (this.dailyGift.phase > 0.5) {
            this.dailyGift.collected = true;
            const gifts = [
              { text: "+5 joy for Obi and Luna!", effect: () => { this.obi.joy = clamp(this.obi.joy + 5, 0, 100); this.luna.joy = clamp(this.luna.joy + 5, 0, 100); } },
              { text: "Bowls refilled!", effect: () => { this.foodBowl.fill = 100; this.waterBowl.fill = 100; } },
              { text: "+8 joy for Obi!", effect: () => { this.obi.joy = clamp(this.obi.joy + 8, 0, 100); } },
              { text: "+8 joy for Luna!", effect: () => { this.luna.joy = clamp(this.luna.joy + 8, 0, 100); } },
              { text: "Both pets are happy to see you!", effect: () => { this.obi.joy = clamp(this.obi.joy + 3, 0, 100); this.luna.joy = clamp(this.luna.joy + 3, 0, 100); } }
            ];
            const gift = gifts[Math.floor(Math.random() * gifts.length)];
            gift.effect();
            this.statusText = gift.text;
            this.statusPulse = 1;
            spawnParticleBurst(W / 2, 260, [COLORS.gold, COLORS.softPink, "#FFF4C0"], 18, ["star", "heart"]);
            audio.combo();
            screenShake(4, 0.25);
          }
          return;
        }
        if (this.menuOpen) {
          const closeBtn = { x: W / 2 + 200, y: 84, w: 36, h: 36 };
          if (pointInRect(x, y, closeBtn)) { audio.menu(); this.menuOpen = false; return; }
          for (let i = 0; i < this.gameCards.length; i++) {
            if (pointInRect(x, y, this.getCardRect(i))) {
              audio.menu();
              audio.stopAmbient();
              transitionTo(SceneRegistry.create(this.gameCards[i].key));
              return;
            }
          }
          audio.menu();
          this.menuOpen = false;
          return;
        }
        if (this.decorOpen) {
          const closeBtn = { x: W / 2 + 200, y: 84, w: 36, h: 36 };
          if (pointInRect(x, y, closeBtn)) { audio.menu(); this.decorOpen = false; return; }
          /* page navigation */
          if (pointInRect(x, y, { x: 300, y: 530, w: 40, h: 30 }) && this.decorPage > 0) {
            this.decorPage--; audio.menu(); return;
          }
          if (pointInRect(x, y, { x: 460, y: 530, w: 40, h: 30 }) && this.decorPage < this.decorPageCount() - 1) {
            this.decorPage++; audio.menu(); return;
          }
          const stars = totalStarsEarned();
          const pageItems = this.getDecorPageItems();
          for (let i = 0; i < pageItems.length; i++) {
            if (pointInRect(x, y, this.getDecorItemRect(i))) {
              const item = pageItems[i];
              if (item.streakUnlock && store.careStreak.count < item.streakUnlock) {
                audio.miss(); this.statusText = "Need a " + item.streakUnlock + "-day care streak to unlock!"; this.statusPulse = 1; return;
              }
              if (item.stars > 0 && stars < item.stars) { audio.miss(); this.statusText = "Need " + (item.stars - stars) + " more star" + (item.stars - stars === 1 ? "" : "s") + " to unlock " + item.name + "!"; this.statusPulse = 1; return; }
              if (item.type === "toggle") {
                store.decor[item.key] = !store.decor[item.key];
              } else if (item.type === "cycle") {
                store.decor[item.key] = (store.decor[item.key] + 1) % (item.max + 1);
              }
              saveDecor();
              audio.tinyChime();
              if (item.key === "rugColor" || item.key === "roomPreset" || item.key === "wallArt2") { sceneCache.livingRoomBase = null; }
              return;
            }
          }
          audio.menu();
          this.decorOpen = false;
          return;
        }
        if (pointInRect(x, y, this.gamesButton)) {
          audio.menu();
          this.menuOpen = true;
          this.menuFade = 0;
          return;
        }
        if (pointInRect(x, y, this.decorButton)) {
          audio.menu();
          this.decorOpen = true;
          this.decorFade = 0;
          return;
        }
        for (const btn of this.modeButtons) {
          if (pointInRect(x, y, btn)) {
            audio.menu();
            this.setMode(btn.key);
            return;
          }
        }
        /* bowl refills */
        if (!this.menuOpen && !this.decorOpen) {
          if (pointInRect(x, y, this.foodBowlHitbox)) {
            this.foodBowl.fill = 100;
            this.foodBowl.lastFill = Date.now();
            store.pet_food_fill = 100;
            store.pet_food_lastFill = this.foodBowl.lastFill;
            saveNumber("pet_food_fill", 100);
            saveNumber("pet_food_lastFill", this.foodBowl.lastFill);
            this.statusText = "Annie filled the food bowl!";
            this.statusPulse = 0.6;
            spawnParticleBurst(this.foodBowl.x, this.foodBowl.y - 10, ["#D2A87C", COLORS.brown], 6, ["star"]);
            audio.tinyChime();
            this.checkBubbleReward("obi", "feed");
            this.checkBubbleReward("luna", "feed");
            return;
          }
          if (pointInRect(x, y, this.waterBowlHitbox)) {
            this.waterBowl.fill = 100;
            this.waterBowl.lastFill = Date.now();
            store.pet_water_fill = 100;
            store.pet_water_lastFill = this.waterBowl.lastFill;
            saveNumber("pet_water_fill", 100);
            saveNumber("pet_water_lastFill", this.waterBowl.lastFill);
            this.statusText = "Annie refilled the water!";
            this.statusPulse = 0.6;
            spawnParticleBurst(this.waterBowl.x, this.waterBowl.y - 10, ["#6CB4EE", "#A0D4FF"], 6, ["star"]);
            audio.tinyChime();
            this.checkBubbleReward("obi", "water");
            this.checkBubbleReward("luna", "water");
            return;
          }
          /* lamp toggle */
          if (pointInRect(x, y, this.lampHitbox)) {
            store.decor.lampOn = !store.decor.lampOn;
            saveDecor();
            audio.tinyChime();
            this.statusText = store.decor.lampOn ? "Annie turned the lamp on." : "Annie turned the lamp off.";
            this.statusPulse = 0.4;
            return;
          }
          /* window click */
          if (pointInRect(x, y, this.windowHitbox)) {
            const tod = store.decor.timeOfDay || 1;
            let msg = "Nice view today.";
            if (this.ambientEvent && this.ambientEvent.type === "butterfly") msg = "Luna is fascinated by the butterflies!";
            else if (this.ambientEvent && this.ambientEvent.type === "rain") msg = "Listen to the rain... so cozy.";
            else if (tod === 3) msg = "The stars are beautiful tonight.";
            else if (tod === 0) msg = "What a lovely sunrise.";
            this.statusText = msg;
            this.statusPulse = 0.3;
            spawnParticleBurst(126, 130, ["#FFF4C0", COLORS.gold], 3, ["star"]);
            audio.tinyChime();
            return;
          }
          /* pet bed click */
          if (store.decor.petBed && pointInRect(x, y, this.petBedHitbox)) {
            const nearest = x < W / 2 ? "obi" : "luna";
            const pet = nearest === "obi" ? this.obi : this.luna;
            if (nearest === "obi") {
              pet.targetX = 180; pet.targetY = 456;
              pet.sleepy = true;
              pet.joy = clamp(pet.joy + 3, 0, 100);
              this.statusText = "Obi curled up in his bed!";
            } else {
              this.luna.perch = "floor";
              pet.targetX = 180; pet.targetY = 456;
              pet.joy = clamp(pet.joy + 3, 0, 100);
              this.statusText = "Luna claimed the pet bed.";
            }
            this.statusPulse = 0.4;
            audio.tinyChime();
            return;
          }
          /* toy basket shortcut */
          if (pointInRect(x, y, this.toyBasketHitbox)) {
            const nearest = x < W / 2 ? "obi" : "luna";
            const petObj = nearest === "obi" ? this.obi : this.luna;
            const py = nearest === "luna" && this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y : petObj.y;
            this.throwToy(petObj.x, py);
            this.statusText = "Annie grabbed a toy from the basket!";
            this.statusPulse = 0.5;
            spawnParticleBurst(265, 388, [COLORS.gold], 4, ["star"]);
            return;
          }
        }
        this.idleTime = 0;
        if (this.mode === "pet") {
          const target = this.pickPetForPoint(x, y);
          if (pointInRect(x, y, this.getPetRect(target))) {
            const zone = this.getPetZone(target, x, y);
            if (target === "obi") {
              const msgs = { head: "Obi loves ear scratches!", body: "Good boy, Obi!", belly: "Belly rubs make Obi's day!" };
              const floats = { head: "Ear scratches!", body: "Good boy!", belly: "Belly rubs!" };
              this.rewardPet("obi", zone === "belly" ? 9 : zone === "head" ? 8 : 6, "pet", x, y);
              this.statusText = msgs[zone];
              this.addFloatingText(floats[zone], x, y - 20, COLORS.softPink);
            } else {
              if (zone === "belly" && Math.random() < 0.35) {
                this.luna.pawBat = Math.max(this.luna.pawBat, 0.7);
                this.statusText = "Luna swats! That's her belly — off limits!";
                this.statusPulse = 1;
                this.luna.joy = clamp(this.luna.joy - 2, 0, 100);
                audio.miss();
                this.addFloatingText("Luna swats!", x, y - 20, COLORS.warmRed);
              } else {
                const msgs = { head: "Luna leans into the chin scratch.", body: "Luna purrs softly.", belly: "Luna... actually let you touch her belly!" };
                const floats = { head: "Chin scratch!", body: "Purrs...", belly: "Belly touch!" };
                this.rewardPet("luna", zone === "head" ? 8 : 6, "pet", x, y);
                this.statusText = msgs[zone];
                this.addFloatingText(floats[zone], x, y - 20, COLORS.softPink);
              }
            }
          }
        } else if (this.mode === "treat") {
          this.tossTreat(x, y);
        } else if (this.mode === "toy") {
          this.throwToy(x, y);
        } else if (this.mode === "brush") {
          const target = this.pickPetForPoint(x, y);
          if (pointInRect(x, y, this.getPetRect(target))) {
            this.rewardPet(target, 10, "brush", x, y);
            if (target === "obi") {
              this.obi.shakeTimer = Math.max(this.obi.shakeTimer, 1.0);
            }
            spawnParticleBurst(x, y - 24, ["#FFF4C0", "#FFEAA7", COLORS.gold], 8, ["star"]);
            this.statusText = this.petName(target) + " sparkles after a good brushing!";
            this.statusPulse = 1;
            audio.tinyChime();
          }
        }
        /* dismiss tooltip after interaction */
        this.hoverKey = null;
        this.tooltip = null;
        this.tooltipAlpha = 0;
      }
      onKeyDown(key) {
        if (key === "Escape") {
          audio.menu();
          if (this.dedication) { this.dedication = null; store.firstVisit = false; saveBool("firstVisit", false); }
          else if (this.menuOpen) { this.menuOpen = false; }
          else if (this.decorOpen) { this.decorOpen = false; }
          else { audio.stopAmbient(); transitionTo(SceneRegistry.create("title")); }
        }
        if (!this.menuOpen && !this.decorOpen && !this.dedication) {
          if (key === "1" || key === "p") { audio.menu(); this.setMode("pet"); }
          else if (key === "2" || key === "t") { audio.menu(); this.setMode("treat"); }
          else if (key === "3" || key === "y") { audio.menu(); this.setMode("toy"); }
          else if (key === "4" || key === "b") { audio.menu(); this.setMode("brush"); }
          else if (key === "g") { audio.menu(); this.menuOpen = true; this.menuFade = 0; }
          else if (key === "d") { audio.menu(); this.decorOpen = true; this.decorFade = 0; }
        }
      }
      tossTreat(x, y) {
        if (this.treats.length >= 2) return;
        const pet = this.pickPetForPoint(x, y);
        const targetX = clamp(x, pet === "obi" ? 86 : 438, pet === "obi" ? 362 : 734);
        const targetY = clamp(y, 168, pet === "obi" ? 476 : (this.luna.perch !== "floor" ? 314 : 476));
        this.treats.push({
          x: 400, y: 234, startX: 400, startY: 234, targetX, targetY,
          t: 0, state: "air", pet, life: 5
        });
        this.statusText = "Annie tossed a treat toward " + this.petName(pet) + ".";
        this.statusPulse = 1;
        if (pet === "obi") {
          this.obi.targetX = targetX;
          this.obi.targetY = this.obi.homeY;
          this.obi.sleepy = false;
        } else {
          this.luna.perch = "floor";
          this.luna.targetX = clamp(targetX, 474, 710);
          this.luna.targetY = this.luna.floorY;
        }
      }
      throwToy(x, y) {
        if (this.toy) return;
        const pet = this.pickPetForPoint(x, y);
        if (pet === "obi") {
          const targetX = clamp(x, 100, 340);
          this.toy = {
            type: "ball", pet: "obi", x: 400, y: 236, startX: 400, startY: 236,
            targetX, targetY: 452, t: 0, state: "air", life: 8
          };
          this.obi.targetX = targetX;
          this.obi.targetY = this.obi.homeY;
          this.obi.sleepy = false;
          this.statusText = "Obi spotted the ball and took off after it.";
        } else {
          this.luna.perch = "floor";
          this.toy = {
            type: "yarn", pet: "luna", x: clamp(x, 458, 728), y: clamp(y, 172, 458),
            homeX: clamp(x, 458, 728), homeY: clamp(y, 172, 458), state: "tease", life: 7, phase: 0
          };
          this.luna.targetX = clamp(this.toy.x, 478, 710);
          this.luna.targetY = this.luna.floorY;
          this.statusText = "Luna locked onto the yarn ball!";
        }
        this.statusPulse = 1;
      }
      updateTreats(dt) {
        for (let i = this.treats.length - 1; i >= 0; i--) {
          const t = this.treats[i];
          if (t.state === "air") {
            t.t = clamp(t.t + dt * 1.8, 0, 1);
            t.x = lerp(t.startX, t.targetX, t.t);
            t.y = lerp(t.startY, t.targetY, t.t) - Math.sin(t.t * Math.PI) * 84;
            if (t.t >= 1) {
              t.state = "ground";
              t.x = t.targetX;
              t.y = t.targetY;
            }
          } else {
            t.life -= dt;
            const px = t.pet === "obi" ? this.obi.x : this.luna.x;
            const py = t.pet === "obi" ? this.obi.y - 22 : (this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y - 8 : this.luna.y - 18);
            if (dist(px, py, t.x, t.y) < 46) {
              this.rewardPet(t.pet, 10, "treat", t.x, t.y);
              this.treats.splice(i, 1);
              continue;
            }
            if (t.life <= 0) this.treats.splice(i, 1);
          }
        }
      }
      updateToy(dt) {
        if (!this.toy) return;
        if (this.toy.type === "ball") {
          if (this.toy.state === "air") {
            this.toy.t = clamp(this.toy.t + dt * 1.9, 0, 1);
            this.toy.x = lerp(this.toy.startX, this.toy.targetX, this.toy.t);
            this.toy.y = lerp(this.toy.startY, this.toy.targetY, this.toy.t) - Math.sin(this.toy.t * Math.PI) * 72;
            if (this.toy.t >= 1) {
              this.toy.state = "ground";
              this.toy.x = this.toy.targetX;
              this.toy.y = this.toy.targetY;
            }
          } else if (this.toy.state === "ground") {
            if (dist(this.obi.x, this.obi.y - 12, this.toy.x, this.toy.y) < 48) {
              this.toy.state = "return";
              this.obi.targetX = this.obi.homeX;
              this.obi.targetY = this.obi.homeY;
            }
          } else if (this.toy.state === "return") {
            this.toy.x = this.obi.x + this.obi.facing * 12;
            this.toy.y = this.obi.y - 30;
            if (dist(this.obi.x, this.obi.y, this.obi.homeX, this.obi.homeY) < 14) {
              this.rewardPet("obi", 12, "toy", this.obi.x, this.obi.y - 20);
              this.toy = null;
            }
          }
          if (this.toy) this.toy.life -= dt;
          if (this.toy && this.toy.life <= 0) this.toy = null;
        } else {
          this.toy.life -= dt;
          this.toy.phase += dt * 4.5;
          this.toy.x = this.toy.homeX + Math.sin(this.toy.phase) * 18;
          this.toy.y = this.toy.homeY + Math.cos(this.toy.phase * 1.35) * 10;
          this.luna.wiggle = Math.max(this.luna.wiggle, 0.28 + 0.16 * Math.sin(this.toy.phase * 2));
          if (dist(this.luna.x, this.luna.y - 18, this.toy.x, this.toy.y) < 74) {
            this.luna.pounce = Math.max(this.luna.pounce, 0.55);
            this.luna.pawBat = Math.max(this.luna.pawBat, 0.45);
          }
          if (dist(this.luna.x, this.luna.y - 18, this.toy.x, this.toy.y) < 46) {
            this.rewardPet("luna", 12, "toy", this.toy.x, this.toy.y);
            this.toy = null;
          } else if (this.toy.life <= 0) {
            this.toy = null;
            this.statusText = "The yarn ball rolled away. Luna pretends not to care.";
            this.statusPulse = 1;
          }
        }
      }
      updateAnnie(dt) {
        const a = this.annie;
        a.poseTimer -= dt;
        a.stateTimer -= dt;

        /* smooth Y interpolation toward target */
        const dy = a.targetY - a.y;
        if (Math.abs(dy) > 1) {
          a.y += Math.sign(dy) * Math.min(Math.abs(dy), 80 * dt);
        } else {
          a.y = a.targetY;
        }

        /* reactive poses override idle behavior */
        if (this.obi.happyTimer > 0.1 || this.luna.happyTimer > 0.1) {
          a.pose = "cheer";
          a.poseTimer = 1.5;
          a.facing = this.obi.happyTimer > this.luna.happyTimer ? -1 : 1;
        } else if (this.mode === "brush" && this.obi.shakeTimer > 0) {
          a.pose = "laugh";
          a.poseTimer = 1;
        } else if (this.petInteraction.active) {
          a.pose = "laugh";
          a.poseTimer = 0.5;
          a.facing = this.obi.x < 400 ? -1 : 1;
        } else if (a.poseTimer <= 0) {
          /* autonomous state machine */
          if (a.stateTimer <= 0) {
            const r = Math.random();
            if (r < 0.22 && a.state !== "walkToObi" && a.state !== "walkToLuna") {
              a.state = "walkToObi";
              a.stateTimer = rand(3, 5);
              a.targetY = a.floorY;
            } else if (r < 0.44 && a.state !== "walkToLuna" && a.state !== "walkToObi") {
              a.state = "walkToLuna";
              a.stateTimer = rand(3, 5);
              a.targetY = a.floorY;
            } else if (r < 0.56) {
              a.state = "wander";
              a.stateTimer = rand(2.5, 4);
              a.targetX = rand(180, 560);
              a.targetY = a.floorY;
            } else if (r < 0.7) {
              a.state = "kneel";
              a.stateTimer = rand(2, 4);
              a.pose = "kneel";
              a.poseTimer = a.stateTimer;
              a.targetY = a.floorY;
            } else if (r < 0.85) {
              a.state = "returnHome";
              a.stateTimer = rand(3, 5);
              a.targetY = a.homeY;
            } else {
              a.state = "idle";
              a.stateTimer = rand(3, 5);
              a.pose = Math.abs(a.y - a.homeY) < 10 ? "sit" : "idle";
              a.poseTimer = a.stateTimer;
            }
          }

          /* movement */
          if (a.state === "walkToObi") {
            const tx = this.obi.x + 50;
            a.pose = "walk";
            a.poseTimer = 0.5;
            a.facing = tx < a.x ? -1 : 1;
            if (Math.abs(a.x - tx) > 14 || Math.abs(a.y - a.floorY) > 10) {
              a.x += Math.sign(tx - a.x) * 60 * dt;
            } else {
              a.state = "kneel";
              a.stateTimer = rand(2.5, 4);
              a.pose = "kneel";
              a.poseTimer = a.stateTimer;
              a.facing = this.obi.x < a.x ? -1 : 1;
              this.statusText = "Annie kneels down to check on Obi.";
              this.statusPulse = 0.3;
              spawnParticleBurst(this.obi.x, this.obi.y - 30, [COLORS.softPink], 3, ["heart"]);
            }
          } else if (a.state === "walkToLuna") {
            const lunaX = this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].x : this.luna.x;
            const tx = lunaX - 55;
            a.pose = "walk";
            a.poseTimer = 0.5;
            a.facing = tx < a.x ? -1 : 1;
            if (Math.abs(a.x - tx) > 14 || Math.abs(a.y - a.floorY) > 10) {
              a.x += Math.sign(tx - a.x) * 60 * dt;
            } else {
              a.state = "idle";
              a.stateTimer = rand(2, 3.5);
              a.pose = "laugh";
              a.poseTimer = 1.5;
              a.facing = lunaX > a.x ? 1 : -1;
              this.statusText = "Annie smiles at Luna.";
              this.statusPulse = 0.3;
            }
          } else if (a.state === "wander") {
            const tx = a.targetX || a.homeX;
            a.pose = "walk";
            a.poseTimer = 0.5;
            a.facing = tx < a.x ? -1 : 1;
            if (Math.abs(a.x - tx) > 8) {
              a.x += Math.sign(tx - a.x) * 55 * dt;
            } else {
              a.state = "idle";
              a.stateTimer = rand(2, 4);
              a.pose = "idle";
              a.poseTimer = a.stateTimer;
            }
          } else if (a.state === "returnHome") {
            a.pose = "walk";
            a.poseTimer = 0.5;
            a.facing = a.homeX < a.x ? -1 : 1;
            if (Math.abs(a.x - a.homeX) > 10 || Math.abs(a.y - a.homeY) > 10) {
              a.x += Math.sign(a.homeX - a.x) * 55 * dt;
            } else {
              a.x = a.homeX;
              a.state = "idle";
              a.stateTimer = rand(3, 6);
              a.pose = "sit";
              a.poseTimer = a.stateTimer;
            }
          }

          /* if far from home and idle, eventually return */
          if ((a.state === "idle" || a.state === "kneel") && Math.abs(a.x - a.homeX) > 60 && a.stateTimer < 0.5) {
            a.state = "returnHome";
            a.stateTimer = rand(3, 5);
            a.targetY = a.homeY;
          }
        }

        a.x = clamp(a.x, 140, 640);
        a.y = clamp(a.y, a.homeY, a.floorY);
      }
      updateObi(dt) {
        this.obi.petTimer = Math.max(0, this.obi.petTimer - dt);
        this.obi.happyTimer = Math.max(0, this.obi.happyTimer - dt);
        this.obi.shakeTimer = Math.max(0, this.obi.shakeTimer - dt);
        const busy = this.treats.some((t) => t.pet === "obi") || (this.toy && this.toy.pet === "obi");
        const interacting = this.petInteraction.active;
        if (!busy && !interacting) {
          if (this.idleTime > 10 && this.obi.joy > 72) {
            /* sleepy time after long idle */
            this.obi.targetX = this.obi.matX;
            this.obi.targetY = this.obi.matY;
            if (dist(this.obi.x, this.obi.y, this.obi.matX, this.obi.matY) < 18) {
              if (!this.obi.sleepy) {
                this.obi.sleepy = true;
                const napMsgs = ["Obi found his favorite nap spot.", "Obi curls up for a snooze.", "Obi is dreaming of treats.", "Obi settles in for a cozy nap."];
                this.statusText = napMsgs[Math.floor(Math.random() * napMsgs.length)];
              }
            }
            this.obi.sniffing = false;
          } else if (this.idleTime > 3 && !this.obi.sleepy && this.obi.shakeTimer <= 0) {
            /* Obi sniffs around when idle */
            this.obi.sniffTimer -= dt;
            if (this.obi.sniffTimer <= 0) {
              this.obi.sniffing = !this.obi.sniffing;
              this.obi.sniffTimer = this.obi.sniffing ? rand(1.5, 3) : rand(2, 4);
              if (this.obi.sniffing) {
                this.obi.targetX = rand(100, 380);
                this.obi.targetY = this.obi.homeY;
                const msgs = ["Obi is sniffing around the room.", "Obi found an interesting smell!", "Obi's nose is hard at work."];
                this.statusText = msgs[Math.floor(Math.random() * msgs.length)];
              } else {
                this.obi.targetX = this.obi.homeX;
                this.obi.targetY = this.obi.homeY;
              }
            }
          } else if (!this.obi.sniffing) {
            this.obi.targetX = this.obi.homeX;
            this.obi.targetY = this.obi.homeY;
            this.obi.sleepy = false;
          }
        } else if (!interacting) {
          this.obi.sniffing = false;
        }
        const dx = this.obi.targetX - this.obi.x;
        const dy = this.obi.targetY - this.obi.y;
        const d = Math.hypot(dx, dy);
        const speed = busy ? 210 : this.obi.sleepy ? 0 : 92;
        if (d > 1 && speed > 0) {
          const step = Math.min(d, speed * dt);
          this.obi.x += dx / d * step;
          this.obi.y += dy / d * step;
          if (Math.abs(dx) > 2) this.obi.facing = dx >= 0 ? 1 : -1;
        }
        this.obi.bounce = busy ? 0.07 * Math.abs(Math.sin(game.time * 11)) : this.obi.petTimer > 0 ? 0.03 : 0;
        this.obi.joy = clamp(this.obi.joy - dt * 0.3, 0, 100);
        /* carryToy idle behavior */
        if (this.obi.carryingToy) {
          this.obi.carryTimer -= dt;
          if (this.obi.carryTimer <= 0 || dist(this.obi.x, this.obi.y, this.obi.targetX, this.obi.homeY) < 14) {
            this.obi.carryingToy = false;
            this.obi.targetX = this.obi.homeX;
            this.obi.targetY = this.obi.homeY;
            this.statusText = "Obi dropped the bone and wagged his tail.";
            spawnParticleBurst(this.obi.x, this.obi.y - 20, [COLORS.softPink], 3, ["heart"]);
          }
        } else if (!busy && !this.obi.sleepy && !this.obi.sniffing && this.obi.joy > 60 && Math.random() < dt * 0.015) {
          this.obi.carryingToy = true;
          this.obi.carryTimer = rand(3, 6);
          this.obi.targetX = rand(120, 360);
          this.obi.targetY = this.obi.homeY;
          this.statusText = "Obi picked up his favorite bone!";
        }
        /* eating / drinking behavior */
        if (this.obi.eating || this.obi.drinking) {
          this.obi.eatDrinkTimer -= dt;
          if (this.obi.eatDrinkTimer <= 0) {
            const bowl = this.obi.eating ? this.foodBowl : this.waterBowl;
            bowl.fill = clamp(bowl.fill - rand(8, 12), 0, 100);
            this.obi.joy = clamp(this.obi.joy + rand(3, 5), 0, 100);
            this.obi.eating = false;
            this.obi.drinking = false;
            this.obi.targetX = this.obi.homeX;
            this.obi.targetY = this.obi.homeY;
          }
        } else if (!busy && !this.obi.sleepy && this.idleTime > 4) {
          if (this.foodBowl.fill > 20 && !this.luna.eating && Math.random() < dt * 0.08) {
            this.obi.eating = true;
            this.obi.eatDrinkTimer = rand(2, 4);
            this.obi.targetX = this.foodBowl.x + 20;
            this.obi.targetY = this.foodBowl.y;
          } else if (this.waterBowl.fill > 20 && !this.luna.drinking && Math.random() < dt * 0.06) {
            this.obi.drinking = true;
            this.obi.eatDrinkTimer = rand(2, 4);
            this.obi.targetX = this.waterBowl.x + 20;
            this.obi.targetY = this.waterBowl.y;
          }
        }
      }
      updateLuna(dt) {
        this.luna.petTimer = Math.max(0, this.luna.petTimer - dt);
        this.luna.happyTimer = Math.max(0, this.luna.happyTimer - dt);
        this.luna.wiggle = Math.max(0, this.luna.wiggle - dt * 1.8);
        this.luna.pounce = Math.max(0, this.luna.pounce - dt * 2.5);
        this.luna.pawBat = Math.max(0, this.luna.pawBat - dt * 2.8);
        const busy = this.treats.some((t) => t.pet === "luna") || (this.toy && this.toy.pet === "luna");
        const interacting = this.petInteraction.active;
        if (!busy && !interacting) {
          if (this.idleTime > 8 && this.luna.joy > 48 && !this.luna.grooming && !this.luna.bellyUp) {
            /* retreat to tower after long idle */
            if (this.luna.perch === "floor") {
              this.luna.perch = "tower";
              const perchMsgs = ["Luna hopped up to her favorite perch.", "Luna retreats to the high ground.", "Luna surveys her kingdom from above.", "Luna claims the best seat in the house."];
              this.statusText = perchMsgs[Math.floor(Math.random() * perchMsgs.length)];
            }
            this.luna.targetX = LUNA_PERCHES[this.luna.perch].x;
            this.luna.targetY = LUNA_PERCHES[this.luna.perch].y;
            this.luna.grooming = false;
            this.luna.bellyUp = false;
          } else if (this.idleTime > 2 && this.luna.perch === "floor") {
            /* idle floor behaviors: groom, belly up, or sit */
            this.luna.idleBehaviorTimer -= dt;
            if (this.luna.idleBehaviorTimer <= 0) {
              const r = Math.random();
              if (r < 0.3 && !this.luna.grooming) {
                this.luna.grooming = true;
                this.luna.bellyUp = false;
                this.luna.idleBehaviorTimer = rand(2.5, 4.5);
                const msgs = ["Luna starts grooming her paw.", "Luna is cleaning up. Very dignified.", "Bath time for Luna."];
                this.statusText = msgs[Math.floor(Math.random() * msgs.length)];
              } else if (r < 0.55 && !this.luna.bellyUp && this.luna.joy >= 55) {
                this.luna.bellyUp = true;
                this.luna.grooming = false;
                this.luna.stretching = false;
                this.luna.idleBehaviorTimer = rand(3, 5);
                spawnParticleBurst(this.luna.x, this.luna.y - 20, [COLORS.softPink], 3, ["heart"]);
                this.statusText = "Luna rolled onto her back! She's feeling trusting.";
              } else if (r < 0.7 && !this.luna.stretching) {
                this.luna.stretching = true;
                this.luna.grooming = false;
                this.luna.bellyUp = false;
                this.luna.idleBehaviorTimer = rand(1.5, 3);
                const msgs = ["Luna does a big stretch.", "Luna stretches out. Very yoga.", "Luna reaches way out with a yawn."];
                this.statusText = msgs[Math.floor(Math.random() * msgs.length)];
              } else {
                this.luna.grooming = false;
                this.luna.bellyUp = false;
                this.luna.stretching = false;
                this.luna.idleBehaviorTimer = rand(3, 6);
              }
            }
          } else if (!this.luna.grooming && !this.luna.bellyUp) {
            this.luna.perch = "floor";
            this.luna.targetX = this.luna.floorX;
            this.luna.targetY = this.luna.floorY;
          }
        } else if (!interacting) {
          this.luna.grooming = false;
          this.luna.bellyUp = false;
        }
        const dx = this.luna.targetX - this.luna.x;
        const dy = this.luna.targetY - this.luna.y;
        const d = Math.hypot(dx, dy);
        const speed = busy ? 145 : this.luna.perch !== "floor" ? 86 : 96;
        if (d > 1) {
          const step = Math.min(d, speed * dt);
          this.luna.x += dx / d * step;
          this.luna.y += dy / d * step;
          if (Math.abs(dx) > 2) this.luna.facing = dx >= 0 ? 1 : -1;
        }
        if (this.luna.perch === "floor" && (busy || this.hoverKey === "luna")) {
          this.luna.x += Math.sin(game.time * 7 + this.luna.x * 0.03) * 8 * dt;
        }
        this.luna.joy = clamp(this.luna.joy - dt * 0.28, 0, 100);
        /* eating / drinking behavior */
        if (this.luna.eating || this.luna.drinking) {
          this.luna.eatDrinkTimer -= dt;
          if (this.luna.eatDrinkTimer <= 0) {
            const bowl = this.luna.eating ? this.foodBowl : this.waterBowl;
            bowl.fill = clamp(bowl.fill - rand(8, 12), 0, 100);
            this.luna.joy = clamp(this.luna.joy + rand(3, 5), 0, 100);
            this.luna.eating = false;
            this.luna.drinking = false;
            this.luna.targetX = LUNA_PERCHES[this.luna.perch].x;
            this.luna.targetY = LUNA_PERCHES[this.luna.perch].y;
          }
        } else if (!busy && this.luna.perch === "floor" && this.idleTime > 4) {
          if (this.foodBowl.fill > 20 && !this.obi.eating && Math.random() < dt * 0.06) {
            this.luna.eating = true;
            this.luna.eatDrinkTimer = rand(2, 4);
            this.luna.targetX = this.foodBowl.x - 20;
            this.luna.targetY = this.foodBowl.y;
          } else if (this.waterBowl.fill > 20 && !this.obi.drinking && Math.random() < dt * 0.05) {
            this.luna.drinking = true;
            this.luna.eatDrinkTimer = rand(2, 4);
            this.luna.targetX = this.waterBowl.x - 20;
            this.luna.targetY = this.waterBowl.y;
          }
        }
      }
      handlePetStroke(dt) {
        if (!game.mouse.down || (this.mode !== "pet" && this.mode !== "brush")) return;
        this.strokeTick -= dt;
        const x = game.mouse.x;
        const y = game.mouse.y;
        const target = pointInRect(x, y, this.getPetRect("obi")) ? "obi" : pointInRect(x, y, this.getPetRect("luna")) ? "luna" : null;
        if (!target) return;
        /* stroke trail */
        const last = this.strokeTrail[this.strokeTrail.length - 1];
        if (!last || dist(last.x, last.y, x, y) > 6) {
          this.strokeTrail.push({ x, y, life: 0.35 });
          if (this.strokeTrail.length > 20) this.strokeTrail.shift();
        }
        if (this.strokeTick <= 0) {
          this.strokeTick = 0.1;
          const zone = this.getPetZone(target, x, y);
          const amount = this.mode === "brush" ? 3.5 : 2.5;
          if (target === "obi") {
            if (zone === "head") {
              this.rewardPet("obi", amount + 1, this.mode, x, y);
              if (Math.random() < 0.3) this.statusText = "Obi loves ear scratches!";
            } else if (zone === "belly") {
              this.rewardPet("obi", amount + 2, this.mode, x, y);
              if (Math.random() < 0.3) this.statusText = "Belly rubs! Obi's favorite!";
            } else {
              this.rewardPet("obi", amount, this.mode, x, y);
              if (Math.random() < 0.2) this.statusText = "Obi wags happily.";
            }
          } else {
            if (zone === "head") {
              this.rewardPet("luna", amount + 1, this.mode, x, y);
              if (Math.random() < 0.3) this.statusText = "Luna tilts into the chin scratch.";
            } else if (zone === "belly") {
              /* cats don't always like belly rubs - same odds as click (35%) */
              if (Math.random() < 0.35) {
                this.luna.pawBat = Math.max(this.luna.pawBat, 0.6);
                this.statusText = "Luna swats! She's not a belly-rub cat.";
                this.statusPulse = 1;
                this.luna.joy = clamp(this.luna.joy - 2, 0, 100);
                this.addFloatingText("Luna swats!", x, y - 20, COLORS.warmRed);
              } else {
                this.rewardPet("luna", amount, this.mode, x, y);
                if (Math.random() < 0.3) this.statusText = "Luna tolerates the belly touch... barely.";
              }
            } else {
              this.rewardPet("luna", amount + 0.5, this.mode, x, y);
              if (Math.random() < 0.3) this.statusText = "Luna purrs as you stroke her back.";
            }
          }
          if (this.mode === "brush") {
            spawnParticleBurst(x, y - 10, ["#FFF4C0", "#FFEAA7"], 2, ["star"]);
          }
        }
      }
      getPetZone(key, mx, my) {
        const rect = this.getPetRect(key);
        const relX = (mx - rect.x) / rect.w;
        const relY = (my - rect.y) / rect.h;
        if (relY < 0.35) return "head";
        if (relY > 0.7) return "belly";
        return "body";
      }
      update(dt) {
        super.update(dt);
        this.idleTime += dt;
        this.tooltip = null;
        if (this.hoverKey === "games") this.tooltip = { x: 82, y: 66, title: "Minigames", body: "Play cozy games with Obi and Luna!" };
        else if (this.hoverKey === "decor") this.tooltip = { x: 662, y: 66, title: "Decorate", body: "Customize the living room with unlockable items!" };
        else if (this.hoverKey === "pet") this.tooltip = { x: 198, y: 66, title: "Pet Mode", body: "Stroke directly over Obi or Luna for happy reactions." };
        else if (this.hoverKey === "treat") this.tooltip = { x: 310, y: 66, title: "Treat Mode", body: "Click to toss snacks from Annie toward either pet." };
        else if (this.hoverKey === "toy") this.tooltip = { x: 422, y: 66, title: "Play Mode", body: "Obi chases a ball; Luna stalks a yarn ball." };
        else if (this.hoverKey === "brush") this.tooltip = { x: 534, y: 66, title: "Brush Mode", body: "Brush Obi or Luna until they sparkle!" };
        else if (this.hoverKey === "foodBowl") this.tooltip = { x: this.foodBowl.x, y: this.foodBowl.y - 36, title: "Food Bowl", body: "Fill: " + Math.round(this.foodBowl.fill) + "%. Click to refill!" };
        else if (this.hoverKey === "waterBowl") this.tooltip = { x: this.waterBowl.x, y: this.waterBowl.y - 36, title: "Water Bowl", body: "Fill: " + Math.round(this.waterBowl.fill) + "%. Click to refill!" };
        else if (this.hoverKey === "lamp") this.tooltip = { x: 126, y: 122, title: "Lamp", body: "Click to toggle the lamp." };
        else if (this.hoverKey === "toyBasket") this.tooltip = { x: 265, y: 368, title: "Toy Basket", body: "Click to toss a toy!" };
        else if (this.hoverKey === "window") this.tooltip = { x: 126, y: 44, title: "Window", body: "Click to look outside." };
        else if (this.hoverKey === "petBed") this.tooltip = { x: 180, y: 442, title: "Pet Bed", body: "Click to call a pet to nap." };
        else if (this.hoverKey === "obi") this.tooltip = { x: this.obi.x, y: this.obi.y - 104, title: "Obi", body: "Mood: " + this.moodLabel("obi") };
        else if (this.hoverKey === "luna") this.tooltip = { x: this.luna.x, y: (this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y : this.luna.y) - 104, title: "Luna", body: "Mood: " + this.moodLabel("luna") };
        /* Annie behavior system */
        this.updateAnnie(dt);

        this.statusPulse = Math.max(0, this.statusPulse - dt * 2.6);
        /* daily gift animation */
        if (this.dailyGift && !this.dailyGift.collected) {
          this.dailyGift.phase += dt;
          return;
        }
        if (this.dailyGift && this.dailyGift.collected) {
          this.dailyGift.phase += dt;
          if (this.dailyGift.phase > 3) this.dailyGift = null;
        }
        /* bowl depletion during play */
        this.foodBowl.fill = clamp(this.foodBowl.fill - dt * 0.4, 0, 100);
        this.waterBowl.fill = clamp(this.waterBowl.fill - dt * 0.55, 0, 100);
        this.bowlSaveTimer += dt;
        if (this.bowlSaveTimer > 10) {
          this.bowlSaveTimer = 0;
          store.pet_food_fill = this.foodBowl.fill;
          store.pet_water_fill = this.waterBowl.fill;
          saveNumber("pet_food_fill", this.foodBowl.fill);
          saveNumber("pet_water_fill", this.waterBowl.fill);
        }
        /* dedication screen */
        if (this.dedication) {
          this.dedication.phase += dt;
          this.dedication.alpha = clamp(this.dedication.phase / 1.5, 0, 1);
          return;
        }
        if (this.menuOpen) { this.menuFade = clamp(this.menuFade + dt * 5, 0, 1); return; }
        this.menuFade = clamp(this.menuFade - dt * 5, 0, 1);
        if (this.decorOpen) { this.decorFade = clamp(this.decorFade + dt * 5, 0, 1); return; }
        this.decorFade = clamp(this.decorFade - dt * 5, 0, 1);
        this.handlePetStroke(dt);
        this.updateTreats(dt);
        this.updateToy(dt);
        this.updateObi(dt);
        this.updateLuna(dt);
        this.updatePetInteraction(dt);
        this.updateThoughtBubbles(dt);
        this.updateAmbientEvents(dt);
        /* ambient particles - occasional dust motes */
        if (Math.random() < dt * 0.8) {
          spawnParticleBurst(rand(100, 700), rand(150, 450), ["rgba(255,240,200,0.5)"], 1, ["star"]);
        }
        /* periodic joy save */
        this.joySaveTimer -= dt;
        if (this.joySaveTimer <= 0) {
          this.joySaveTimer = 2;
          store.pet_obi_joy = this.obi.joy;
          store.pet_luna_joy = this.luna.joy;
          saveNumber("pet_obi_joy", this.obi.joy);
          saveNumber("pet_luna_joy", this.luna.joy);
        }
        /* decoration notification tick */
        if (this.decorNotification) {
          this.decorNotification.timer -= dt;
          if (this.decorNotification.timer <= 0) this.decorNotification = null;
        }
        /* stroke trail tick */
        for (let i = this.strokeTrail.length - 1; i >= 0; i--) {
          this.strokeTrail[i].life -= dt;
          if (this.strokeTrail[i].life <= 0) this.strokeTrail.splice(i, 1);
        }
        /* floating text tick */
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
          const ft = this.floatingTexts[i];
          ft.life -= dt;
          ft.y -= 25 * dt;
          if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
      }
      updatePetInteraction(dt) {
        const pi = this.petInteraction;
        const obiBusy = this.treats.some(t => t.pet === "obi") || (this.toy && this.toy.pet === "obi") || this.obi.sleepy;
        const lunaBusy = this.treats.some(t => t.pet === "luna") || (this.toy && this.toy.pet === "luna") || this.luna.perch !== "floor";
        if (pi.active) {
          pi.phase += dt;
          const midX = (this.obi.x + this.luna.x) / 2;
          const midY = Math.min(this.obi.y, this.luna.y) - 20;

          if (pi.type === "obiSniffsLuna") {
            this.obi.targetX = this.luna.x - 42;
            this.obi.facing = 1;
            this.obi.sniffing = true;
            if (pi.phase < 0.8 && pi.phase > 0.2) this.statusText = "Obi is trotting over to Luna...";
            if (Math.abs(this.obi.x - this.luna.x) < 55 && pi.phase > 0.8) {
              if (Math.random() < dt * 2.5) spawnParticleBurst(midX, midY, [COLORS.softPink], 1, ["heart"]);
              this.statusText = "Obi is sniffing Luna curiously...";
              if (pi.phase > 2.2) {
                this.statusText = "Obi gave Luna a little nose boop!";
                this.statusPulse = 1;
                spawnParticleBurst(midX, midY, [COLORS.softPink, COLORS.gold], 8, ["heart", "star"]);
                audio.tinyChime();
                this.addFloatingText("Nose boop!", midX, midY - 10, COLORS.softPink);
                this.obi.joy = clamp(this.obi.joy + 6, 0, 100);
                this.luna.joy = clamp(this.luna.joy + 4, 0, 100);
                pi.active = false; pi.timer = rand(8, 14); pi.phase = 0;
                this.obi.sniffing = false;
                this.obi.targetX = this.obi.homeX;
              }
            }
          } else if (pi.type === "lunaBatsObi") {
            this.luna.targetX = this.obi.x + 38;
            this.luna.facing = -1;
            if (pi.phase < 0.6 && pi.phase > 0.2) this.statusText = "Luna is creeping toward Obi's tail...";
            if (Math.abs(this.luna.x - this.obi.x) < 52 && pi.phase > 0.6) {
              this.luna.pawBat = Math.max(this.luna.pawBat, 0.4 + Math.sin(game.time * 6) * 0.4);
              this.statusText = "Luna is batting at Obi's tail!";
              if (Math.random() < dt * 3) spawnParticleBurst(midX, this.obi.y - 25, [COLORS.gold, "#FFF4C0"], 1, ["star"]);
              if (pi.phase > 1.8) {
                this.statusText = "Luna got Obi's tail! He wags even harder.";
                this.statusPulse = 1;
                spawnParticleBurst(this.obi.x, this.obi.y - 20, [COLORS.gold, COLORS.softPink], 6, ["star", "heart"]);
                audio.tinyChime();
                this.addFloatingText("Got the tail!", midX, midY - 10, COLORS.gold);
                this.luna.joy = clamp(this.luna.joy + 6, 0, 100);
                this.obi.joy = clamp(this.obi.joy + 4, 0, 100);
                pi.active = false; pi.timer = rand(8, 14); pi.phase = 0;
                this.luna.pawBat = 0;
                this.luna.targetX = this.luna.floorX;
              }
            }
          } else if (pi.type === "obiLiesNearLuna") {
            this.obi.targetX = this.luna.x - 50;
            this.obi.facing = 1;
            if (pi.phase < 0.6) this.statusText = "Obi is wandering over to Luna...";
            if (Math.abs(this.obi.x - this.luna.x) < 60) {
              this.obi.sleepy = true;
              this.statusText = "Obi curled up next to Luna. So cozy!";
              if (Math.random() < dt * 1.5) spawnParticleBurst(midX, midY, [COLORS.softPink], 1, ["heart"]);
              if (pi.phase > 3.5) {
                spawnParticleBurst(midX, midY, [COLORS.softPink, "#FFF4C0"], 5, ["heart"]);
                audio.tinyChime();
                this.obi.joy = clamp(this.obi.joy + 4, 0, 100);
                this.luna.joy = clamp(this.luna.joy + 4, 0, 100);
                pi.active = false; pi.timer = rand(10, 16); pi.phase = 0;
                this.obi.sleepy = false;
                this.obi.targetX = this.obi.homeX;
              }
            }
          } else if (pi.type === "bothLookAtAnnie") {
            this.obi.targetX = 340;
            this.luna.targetX = 460;
            this.obi.facing = 1;
            this.luna.facing = -1;
            if (pi.phase > 0.5) this.statusText = "Obi and Luna are both looking at Annie...";
            if (Math.abs(this.obi.x - 340) < 20 && Math.abs(this.luna.x - 460) < 20 && pi.phase > 1) {
              if (Math.random() < dt * 2) spawnParticleBurst(400, 300, [COLORS.softPink, COLORS.gold], 1, ["heart"]);
              if (pi.phase > 2.5) {
                this.statusText = "They both want Annie's attention!";
                this.statusPulse = 1;
                spawnParticleBurst(400, 290, [COLORS.softPink, COLORS.gold, "#FFF4C0"], 10, ["heart", "star"]);
                audio.combo();
                this.obi.joy = clamp(this.obi.joy + 5, 0, 100);
                this.luna.joy = clamp(this.luna.joy + 5, 0, 100);
                pi.active = false; pi.timer = rand(12, 18); pi.phase = 0;
                this.obi.targetX = this.obi.homeX;
                this.luna.targetX = this.luna.floorX;
              }
            }
          }
          if (pi.phase > 5) { pi.active = false; pi.timer = rand(8, 14); pi.phase = 0; this.obi.sniffing = false; }
        } else {
          pi.timer -= dt;
          if (pi.timer <= 0 && !obiBusy && !lunaBusy && this.idleTime > 1.5) {
            pi.active = true;
            pi.phase = 0;
            const r = Math.random();
            if (r < 0.3) pi.type = "obiSniffsLuna";
            else if (r < 0.55) pi.type = "lunaBatsObi";
            else if (r < 0.75) pi.type = "obiLiesNearLuna";
            else pi.type = "bothLookAtAnnie";
            this.idleTime = 0;
            this.obi.sniffing = false;
            this.luna.grooming = false;
            this.luna.bellyUp = false;
          }
        }
      }
      pickWant(pet) {
        const food = this.foodBowl.fill;
        const water = this.waterBowl.fill;
        if (food < 25) return "food";
        if (water < 25) return "water";
        const mood = this.petMood(pet);
        if (pet === "obi") {
          if (mood === "hungry") return Math.random() < 0.7 ? "food" : "treat";
          if (mood === "sleepy") return Math.random() < 0.6 ? "pet" : "brush";
          if (mood === "playful") return Math.random() < 0.5 ? "toy" : "treat";
          return Math.random() < 0.5 ? "pet" : "brush";
        } else {
          if (mood === "hungry") return Math.random() < 0.6 ? "food" : "treat";
          if (mood === "sleepy") return Math.random() < 0.5 ? "pet" : "brush";
          if (mood === "playful") return Math.random() < 0.6 ? "toy" : "treat";
          return Math.random() < 0.4 ? "toy" : (Math.random() < 0.5 ? "brush" : "pet");
        }
      }
      updateThoughtBubbles(dt) {
        if (this.obiBubble) {
          this.obiBubble.timer -= dt;
          this.obiBubble.age += dt;
          if (this.obiBubble.timer <= 0) {
            this.obi.joy = clamp(this.obi.joy - 3, 0, 100);
            spawnParticleBurst(this.obi.x, this.obi.y - 40, ["rgba(160,140,120,0.6)"], 3, ["heart"]);
            this.statusText = "Obi's wish went unanswered...";
            audio.miss();
            this.obiBubble = null;
          }
        }
        if (this.lunaBubble) {
          this.lunaBubble.timer -= dt;
          this.lunaBubble.age += dt;
          if (this.lunaBubble.timer <= 0) {
            this.luna.joy = clamp(this.luna.joy - 3, 0, 100);
            const ly = this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y : this.luna.y;
            spawnParticleBurst(this.luna.x, ly - 40, ["rgba(160,140,120,0.6)"], 3, ["heart"]);
            this.statusText = "Luna lost interest. Typical cat.";
            audio.miss();
            this.lunaBubble = null;
          }
        }
        this.bubbleTimer -= dt;
        if (this.bubbleTimer <= 0 && !this.petInteraction.active) {
          this.bubbleTimer = rand(5, 10);
          const obiBusy = this.treats.some(t => t.pet === "obi") || (this.toy && this.toy.pet === "obi") || this.obi.eating || this.obi.drinking;
          const lunaBusy = this.treats.some(t => t.pet === "luna") || (this.toy && this.toy.pet === "luna") || this.luna.eating || this.luna.drinking;
          const canObi = !this.obiBubble && !this.obi.sleepy && !obiBusy;
          const canLuna = !this.lunaBubble && this.luna.perch === "floor" && !lunaBusy;
          if (!canObi && !canLuna) return;
          const pet = (canObi && canLuna) ? (Math.random() < 0.5 ? "obi" : "luna") : (canObi ? "obi" : "luna");
          let want = this.pickWant(pet);
          /* avoid repeating recent wants */
          const allWants = ["pet", "treat", "toy", "brush", "food", "water"];
          const recent = this.bubbleWantHistory.slice(-2);
          if (recent.includes(want)) {
            const alternatives = allWants.filter(w => !recent.includes(w));
            if (alternatives.length > 0) want = alternatives[Math.floor(Math.random() * alternatives.length)];
          }
          this.bubbleWantHistory.push(want);
          if (this.bubbleWantHistory.length > 6) this.bubbleWantHistory.shift();
          const bubble = { want, timer: rand(6, 10), age: 0 };
          const wantNames = { pet: "pets", treat: "a treat", toy: "to play", brush: "brushing", food: "food", water: "water" };
          if (pet === "obi") {
            this.obiBubble = bubble;
            if (!store.bubbleOnboarded) {
              const modeNames = { pet: "Pet", treat: "Treats", toy: "Play", brush: "Brush", food: "the food bowl", water: "the water bowl" };
              this.statusText = "Obi wants " + wantNames[want] + "! " + (want === "food" || want === "water" ? "Click " + modeNames[want] + " to refill it!" : "Switch to " + modeNames[want] + " mode!");
              store.bubbleOnboarded = true;
              saveBool("bubbleOnboarded", true);
            } else {
              this.statusText = "Obi is thinking about " + wantNames[want] + "...";
            }
          } else {
            this.lunaBubble = bubble;
            if (!store.bubbleOnboarded) {
              const modeNames = { pet: "Pet", treat: "Treats", toy: "Play", brush: "Brush", food: "the food bowl", water: "the water bowl" };
              this.statusText = "Luna wants " + wantNames[want] + "! " + (want === "food" || want === "water" ? "Click " + modeNames[want] + " to refill it!" : "Switch to " + modeNames[want] + " mode!");
              store.bubbleOnboarded = true;
              saveBool("bubbleOnboarded", true);
            } else {
              this.statusText = "Luna wants " + wantNames[want] + "...";
            }
          }
          this.statusPulse = 0.5;
        }
      }
      joyTier(joy) { return joy >= 85 ? 3 : joy >= 65 ? 2 : joy >= 40 ? 1 : 0; }
      checkJoyMilestone(key) {
        const pet = key === "obi" ? this.obi : this.luna;
        const tier = this.joyTier(pet.joy);
        const prev = key === "obi" ? this.obiMilestone : this.lunaMilestone;
        if (tier > prev) {
          if (key === "obi") this.obiMilestone = tier;
          else this.lunaMilestone = tier;
          const px = key === "obi" ? this.obi.x : this.luna.x;
          const py = key === "obi" ? this.obi.y - 40 : (this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y - 40 : this.luna.y - 40);
          const msgs = key === "obi"
            ? ["Obi perks up!", "Obi is wagging hard!", "Obi is thrilled!"]
            : ["Luna is warming up!", "Luna is curious!", "Luna is purring!"];
          this.addFloatingText(msgs[tier - 1], px, py, COLORS.gold);
          spawnParticleBurst(px, py, [COLORS.gold, COLORS.softPink], tier >= 3 ? 14 : 8, ["star", "heart"]);
          if (tier >= 3) screenShake(3.5, 0.25);
          audio.tinyChime();
        }
      }
      addFloatingText(text, x, y, color = "#7A4E36") {
        this.floatingTexts.push({ text, x, y, life: 1.5, color });
      }
      checkBubbleReward(key, source) {
        const bubble = key === "obi" ? this.obiBubble : this.lunaBubble;
        if (!bubble) return;
        const want = bubble.want;
        const isExact = (want === source) ||
                        (want === "food" && source === "feed") ||
                        (want === "water" && source === "water");
        const relatedMap = { pet: ["brush"], treat: ["feed"], toy: ["pet"], brush: ["pet"], food: ["treat"], water: [] };
        const isRelated = (relatedMap[want] || []).includes(source);
        const pet = key === "obi" ? this.obi : this.luna;
        const px = key === "obi" ? this.obi.x : this.luna.x;
        const py = key === "obi" ? this.obi.y - 50 : (this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y - 50 : this.luna.y - 50);
        if (isExact) {
          pet.joy = clamp(pet.joy + 10, 0, 100);
          this.sessionJoy += 10;
          spawnParticleBurst(px, py, [COLORS.gold, "#FFF4C0"], 12, ["star"]);
          this.statusText = this.petName(key) + " got exactly what they wanted!";
          this.statusPulse = 1;
          audio.combo();
          screenShake(3, 0.2);
          this.addFloatingText("Perfect!", px, py, COLORS.gold);
          if (key === "obi") this.obiBubble = null;
          else this.lunaBubble = null;
        } else if (isRelated) {
          pet.joy = clamp(pet.joy + 3, 0, 100);
          this.sessionJoy += 3;
          spawnParticleBurst(px, py, [COLORS.softPink], 4, ["star"]);
          this.statusText = "That helped a little, but " + this.petName(key) + " wanted something else...";
          this.addFloatingText("Close!", px, py, COLORS.softPink);
          audio.tinyChime();
        }
      }
      drawPetCard(c, x, y, title, joy, accent, body) {
        c.save();
        rr(c, x, y, 208, 74, 18);
        c.fillStyle = "rgba(255,255,255,0.78)";
        c.fill();
        c.strokeStyle = "rgba(146,104,72,0.18)";
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = "#7A4E36";
        c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "left";
        c.fillText(title, x + 16, y + 24);
        c.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillStyle = "rgba(122,78,54,0.78)";
        c.fillText(body, x + 16, y + 42);
        rr(c, x + 16, y + 50, 176, 10, 8);
        c.fillStyle = "rgba(122,78,54,0.14)";
        c.fill();
        rr(c, x + 16, y + 50, 176 * clamp(joy / 100, 0, 1), 10, 8);
        c.fillStyle = accent;
        c.fill();
        c.restore();
      }
      drawTreat(c, t) {
        c.save();
        c.translate(t.x, t.y);
        c.rotate(Math.sin(game.time * 8 + t.x * 0.01) * 0.16);
        drawBone(c, 0, 0, 20, 12, t.pet === "obi" ? "#D49A4A" : "#FFD08A");
        c.restore();
      }
      drawToy(c) {
        if (!this.toy) return;
        c.save();
        if (this.toy.type === "ball") {
          c.fillStyle = "#4A90D9";
          c.beginPath();
          c.arc(this.toy.x, this.toy.y, 13, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "rgba(255,255,255,0.65)";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(this.toy.x - 4, this.toy.y - 3, 4, 0, Math.PI * 2);
          c.stroke();
        } else {
          /* yarn ball */
          const yarnFrame = spriteArt.frames.items ? spriteArt.frames.items.yarnBall : null;
          if (yarnFrame && spriteArt.image) {
            const ys = 0.14;
            const yw = yarnFrame.w * ys;
            const yh = yarnFrame.h * ys;
            c.save();
            c.translate(this.toy.x, this.toy.y);
            c.rotate(Math.sin(game.time * 4) * 0.15);
            c.drawImage(spriteArt.image, yarnFrame.x, yarnFrame.y, yarnFrame.w, yarnFrame.h, -yw/2, -yh/2, yw, yh);
            c.restore();
          } else {
            drawGlowCircle(c, this.toy.x, this.toy.y, 18, "rgba(255,150,150,ALPHA)", 0.22);
            c.fillStyle = "#E88";
            c.beginPath();
            c.arc(this.toy.x, this.toy.y, 12, 0, Math.PI * 2);
            c.fill();
          }
          drawGlowCircle(c, this.toy.x, this.toy.y, 22, "rgba(255,180,180,ALPHA)", 0.15);
        }
        c.restore();
      }
      drawBowl(c, bowl, frameKey, hovered) {
        const frame = spriteArt.frames.items[frameKey];
        if (hovered) drawGlowCircle(c, bowl.x, bowl.y - 8, 36, "rgba(255,215,0,ALPHA)", 0.25);
        drawShadowEllipse(c, bowl.x, bowl.y + 8, 24, 6, 0.12);
        if (spriteArt.ready && frame) {
          c.save();
          const scale = 0.08;
          const w = frame.w * scale;
          const h = frame.h * scale;
          c.drawImage(spriteArt.image, frame.x, frame.y, frame.w, frame.h, bowl.x - w / 2, bowl.y - h, w, h);
          c.restore();
        }
        /* darkening overlay when low */
        if (bowl.fill < 50) {
          c.save();
          c.globalAlpha = 0.3 * (1 - bowl.fill / 100);
          c.fillStyle = "#000";
          c.beginPath();
          c.ellipse(bowl.x, bowl.y - 6, 22, 14, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
        /* fill bar on hover */
        if (hovered) {
          const bw = 44;
          const bx = bowl.x - bw / 2;
          const by = bowl.y + 12;
          c.save();
          rr(c, bx, by, bw, 6, 3);
          c.fillStyle = "rgba(0,0,0,0.2)";
          c.fill();
          const fw = bw * clamp(bowl.fill / 100, 0, 1);
          if (fw > 1) {
            rr(c, bx, by, fw, 6, 3);
            c.fillStyle = bowl.fill > 50 ? "#6CBF6C" : bowl.fill > 25 ? "#E8C84A" : "#D45050";
            c.fill();
          }
          c.restore();
        }
      }
      drawToyBasket(c, hovered) {
        c.save();
        c.translate(265, 388);
        if (hovered) drawGlowCircle(c, 0, 0, 26, "rgba(255,215,0,ALPHA)", 0.18);
        drawShadowEllipse(c, 0, 12, 16, 5, 0.1);
        /* basket body */
        c.fillStyle = "#A07040";
        rr(c, -15, -4, 30, 20, 5);
        c.fill();
        /* darker rim */
        c.fillStyle = "#8B6030";
        rr(c, -17, -6, 34, 6, 3);
        c.fill();
        /* wicker lines */
        c.strokeStyle = "rgba(120,85,50,0.4)";
        c.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(-12, 1 + i * 5);
          c.lineTo(12, 1 + i * 5);
          c.stroke();
        }
        /* toys peeking out */
        c.fillStyle = "#E85050";
        c.beginPath(); c.arc(-5, -5, 4, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#6CB4EE";
        c.beginPath(); c.arc(6, -4, 3.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#F0D070";
        c.beginPath(); c.moveTo(-2, -9); c.lineTo(4, -9); c.lineTo(1, -13); c.closePath(); c.fill();
        c.restore();
      }
      drawDailyGift(c) {
        if (!this.dailyGift) return;
        const ph = this.dailyGift.phase;
        c.save();
        /* backdrop */
        c.fillStyle = "rgba(60,40,28,0.5)";
        c.fillRect(0, 0, W, H);
        /* panel */
        const panelAlpha = clamp(ph / 0.5, 0, 1);
        c.globalAlpha = panelAlpha;
        const px = W / 2 - 200, py = 160;
        rr(c, px, py, 400, 280, 20);
        c.fillStyle = COLORS.cream;
        c.fill();
        c.strokeStyle = "rgba(146,104,72,0.25)";
        c.lineWidth = 2;
        c.stroke();
        /* gift box */
        const giftFrame = spriteArt.frames.items.giftBox;
        if (spriteArt.ready && giftFrame && !this.dailyGift.collected) {
          const scaleIn = ph < 1 ? easeOutBack(clamp(ph, 0, 1)) : 1;
          const wiggle = ph > 1 && ph < 1.5 ? Math.sin(ph * 30) * 4 : 0;
          const gScale = 0.18 * scaleIn;
          const gw = giftFrame.w * gScale;
          const gh = giftFrame.h * gScale;
          const bob = Math.sin(ph * 2.5) * 4;
          c.save();
          c.translate(W / 2 + wiggle, 260 + bob);
          c.drawImage(spriteArt.image, giftFrame.x, giftFrame.y, giftFrame.w, giftFrame.h, -gw / 2, -gh / 2, gw, gh);
          c.restore();
        }
        if (this.dailyGift.collected) {
          /* post-collect: show reward text */
          c.fillStyle = COLORS.dark;
          c.textAlign = "center";
          c.font = '22px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText(this.statusText, W / 2, 280);
        }
        /* title */
        c.fillStyle = COLORS.dark;
        c.textAlign = "center";
        c.font = '28px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Daily Gift!", W / 2, 200);
        c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillStyle = "rgba(92,68,52,0.75)";
        c.fillText("Welcome back! Here's something for Obi and Luna.", W / 2, 225);
        if (!this.dailyGift.collected && ph > 0.5) {
          c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillStyle = COLORS.warmRed;
          c.fillText(isMobile ? "Tap to open!" : "Click to open!", W / 2, 400);
        }
        c.restore();
      }
      recordCareAction(actionType) {
        const today = new Date().toDateString();
        const streak = store.careStreak;
        if (streak.lastCareDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (streak.lastCareDate === yesterday.toDateString()) {
            streak.count++;
          } else {
            streak.count = 1;
          }
          streak.lastCareDate = today;
          streak.todayActions = [];
          streak.bestStreak = Math.max(streak.bestStreak, streak.count);
        }
        if (!streak.todayActions.includes(actionType)) {
          streak.todayActions.push(actionType);
        }
        saveCareStreak();
        /* daily task completion */
        if (store.dailyTasks.tasks.includes(actionType) && !store.dailyTasks.completed.includes(actionType)) {
          store.dailyTasks.completed.push(actionType);
          saveJSON("dailyTasks", store.dailyTasks);
          this.addFloatingText("Task done!", 400, 100, COLORS.gold);
          audio.tinyChime();
          if (store.dailyTasks.completed.length >= 3) {
            this.obi.joy = clamp(this.obi.joy + 5, 0, 100);
            this.luna.joy = clamp(this.luna.joy + 5, 0, 100);
            this.decorNotification = { text: "All daily tasks complete! +5 joy for both pets!", timer: 4 };
            audio.combo();
          }
        }
      }
      updateAmbientEvents(dt) {
        if (this.ambientEvent) {
          this.ambientEvent.timer -= dt;
          if (this.ambientEvent.type === "butterfly") {
            for (const bf of this.ambientEvent.data) {
              bf.x += Math.sin(game.time * 2.5 + bf.phase) * 20 * dt;
              bf.y += Math.cos(game.time * 1.8 + bf.phase) * 12 * dt;
              bf.x = clamp(bf.x, 70, 180);
              bf.y = clamp(bf.y, 56, 196);
            }
          }
          if (this.ambientEvent.timer <= 0) {
            this.ambientEvent = null;
            this.ambientEventCooldown = rand(120, 300);
          }
          return;
        }
        this.ambientEventCooldown -= dt;
        if (this.ambientEventCooldown <= 0) {
          const r = Math.random();
          if (r < 0.35) this.spawnButterflyEvent();
          else if (r < 0.6) this.spawnBirdEvent();
          else if (r < 0.85) this.spawnRainEvent();
          else this.spawnPackageEvent();
        }
      }
      spawnButterflyEvent() {
        const count = Math.floor(rand(1, 4));
        const data = [];
        for (let i = 0; i < count; i++) data.push({ x: rand(80, 170), y: rand(70, 160), phase: rand(0, 6), color: ["#FFB3D9", "#B3D9FF", "#FFFAB3"][i % 3] });
        this.ambientEvent = { type: "butterfly", timer: rand(12, 18), data };
        this.statusText = "Butterflies at the window!";
      }
      spawnBirdEvent() {
        const count = Math.floor(rand(1, 3));
        const data = [];
        for (let i = 0; i < count; i++) data.push({ x: rand(80, 160), y: 196, hop: 0, phase: rand(0, 6) });
        this.ambientEvent = { type: "bird", timer: rand(8, 14), data };
        this.statusText = "Birds on the window sill!";
      }
      spawnRainEvent() {
        const drops = [];
        for (let i = 0; i < 25; i++) drops.push({ x: rand(68, 184), y: rand(54, 200), speed: rand(80, 140), len: rand(6, 14) });
        this.ambientEvent = { type: "rain", timer: rand(30, 60), data: drops };
        this.statusText = "It's raining outside... so cozy in here.";
      }
      spawnPackageEvent() {
        this.ambientEvent = { type: "package", timer: rand(10, 15), data: { x: 740, y: 458, alpha: 1 } };
        this.statusText = "A package at the door!";
        audio.tinyChime();
      }
      drawAmbientEvent(c) {
        if (!this.ambientEvent) return;
        const ev = this.ambientEvent;
        if (ev.type === "butterfly") {
          c.save();
          c.beginPath(); rr(c, 66, 52, 120, 152, 5); c.clip();
          for (const bf of ev.data) {
            c.save();
            c.translate(bf.x, bf.y);
            const flap = Math.sin(game.time * 8 + bf.phase) * 0.6;
            c.fillStyle = bf.color;
            c.save(); c.rotate(flap); c.beginPath(); c.ellipse(-4, 0, 6, 3, 0, 0, Math.PI * 2); c.fill(); c.restore();
            c.save(); c.rotate(-flap); c.beginPath(); c.ellipse(4, 0, 6, 3, 0, 0, Math.PI * 2); c.fill(); c.restore();
            c.fillStyle = "#333"; c.beginPath(); c.arc(0, 0, 1.5, 0, Math.PI * 2); c.fill();
            c.restore();
          }
          c.restore();
        } else if (ev.type === "bird") {
          c.save();
          c.beginPath(); rr(c, 66, 52, 120, 152, 5); c.clip();
          for (const bd of ev.data) {
            const hop = Math.sin(game.time * 3 + bd.phase) > 0.9 ? -4 : 0;
            c.save();
            c.translate(bd.x, bd.y + hop);
            c.fillStyle = "#8B6914"; c.beginPath(); c.arc(0, -4, 5, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#A08030"; c.beginPath(); c.arc(0, 3, 7, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#E8A020"; c.beginPath(); c.moveTo(5, -4); c.lineTo(10, -3); c.lineTo(5, -2); c.closePath(); c.fill();
            c.fillStyle = "#222"; c.beginPath(); c.arc(-1, -5, 1, 0, Math.PI * 2); c.fill();
            c.restore();
          }
          c.restore();
        } else if (ev.type === "rain") {
          c.save();
          c.beginPath(); rr(c, 66, 52, 120, 152, 5); c.clip();
          c.fillStyle = "rgba(20,30,50,0.15)"; c.fillRect(66, 52, 120, 152);
          c.strokeStyle = "rgba(150,180,220,0.5)"; c.lineWidth = 1;
          for (const d of ev.data) {
            const yOff = (game.time * d.speed + d.y) % 160;
            c.beginPath(); c.moveTo(d.x, 52 + yOff); c.lineTo(d.x - 1, 52 + yOff + d.len); c.stroke();
          }
          c.restore();
        } else if (ev.type === "package") {
          const pk = ev.data;
          c.save();
          c.globalAlpha = clamp(ev.timer / 2, 0, 1);
          c.translate(pk.x, pk.y);
          c.fillStyle = "#A08050"; rr(c, -16, -18, 32, 22, 4); c.fill();
          c.strokeStyle = "#806030"; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(-16, -7); c.lineTo(16, -7); c.stroke();
          c.beginPath(); c.moveTo(0, -18); c.lineTo(0, 4); c.stroke();
          c.fillStyle = "#D04040"; c.beginPath(); c.arc(0, -18, 5, 0, Math.PI * 2); c.fill();
          c.restore();
        }
      }
      drawThoughtBubble(c, x, y, bubble) {
        const bob = Math.sin(game.time * 2.2) * 4;
        const fadeIn = clamp(bubble.age / 0.4, 0, 1);
        const fadeOut = clamp(bubble.timer / 1.2, 0, 1);
        const alpha = Math.min(fadeIn, fadeOut);
        const pulse = 1 + Math.sin(game.time * 3.5) * 0.06;
        c.save();
        c.globalAlpha = alpha;
        c.translate(x, y + bob);
        c.scale(pulse, pulse);

        /* outer glow */
        drawGlowCircle(c, 0, 0, 38, "rgba(255,240,200,ALPHA)", 0.12);

        /* main cloud - multi-circle for fluffy look */
        c.fillStyle = "rgba(255,255,255,0.96)";
        c.strokeStyle = "rgba(146,104,72,0.25)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(0, -2, 28, 22, 0, 0, Math.PI * 2);
        c.fill(); c.stroke();
        c.beginPath();
        c.ellipse(-14, 2, 16, 14, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(14, 2, 16, 14, 0, 0, Math.PI * 2);
        c.fill();

        /* connecting trail dots */
        c.fillStyle = "rgba(255,255,255,0.9)";
        c.strokeStyle = "rgba(146,104,72,0.2)";
        c.beginPath(); c.arc(-6, 22, 6, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath(); c.arc(-12, 30, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();

        /* icon inside - bigger and cleaner */
        if (bubble.want === "pet") {
          drawHeart(c, 0, -4, 1.0, COLORS.softPink);
        } else if (bubble.want === "treat") {
          drawBone(c, 0, -4, 20, 10, "#D49A4A");
        } else if (bubble.want === "toy") {
          drawStar(c, 0, -4, 12, COLORS.gold);
        } else if (bubble.want === "brush") {
          c.fillStyle = "#E0A0C0";
          c.textAlign = "center";
          c.font = '20px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("\u2726", 0, 3);
        } else if (bubble.want === "food") {
          const f = spriteArt.frames.items.foodBowl;
          if (spriteArt.ready && f) {
            const s = 0.035;
            c.drawImage(spriteArt.image, f.x, f.y, f.w, f.h, -f.w * s / 2, -f.h * s, f.w * s, f.h * s);
          }
        } else if (bubble.want === "water") {
          const f = spriteArt.frames.items.waterBowl;
          if (spriteArt.ready && f) {
            const s = 0.035;
            c.drawImage(spriteArt.image, f.x, f.y, f.w, f.h, -f.w * s / 2, -f.h * s, f.w * s, f.h * s);
          }
        }
        /* text label */
        const labels = { pet: "Pets!", treat: "Treat!", toy: "Play!", brush: "Brush!", food: "Food!", water: "Water!" };
        c.fillStyle = "rgba(122,78,54,0.7)";
        c.textAlign = "center";
        c.font = '11px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText(labels[bubble.want], 0, 12);
        c.restore();
      }
      draw(c) {
        drawLivingRoom(c);

        /* mode-specific ambient overlay */
        if (!this.menuOpen && !this.decorOpen && !this.dedication) {
          if (this.mode === "treat") {
            c.save();
            c.fillStyle = "rgba(232,168,76,0.04)";
            c.fillRect(0, 0, W, H);
            c.restore();
          } else if (this.mode === "toy") {
            c.save();
            c.fillStyle = "rgba(74,144,217,0.03)";
            c.fillRect(0, 0, W, H);
            c.restore();
          } else if (this.mode === "brush") {
            c.save();
            c.fillStyle = "rgba(224,160,192,0.04)";
            c.fillRect(0, 0, W, H);
            c.restore();
          }
        }

        /* buttons row */
        drawButton(c, this.gamesButton, "Games", this.hoverKey === "games", "#A86D3F");
        drawButton(c, this.decorButton, "Decorate", this.hoverKey === "decor", "#9B7DBD");
        for (const btn of this.modeButtons) {
          const active = this.mode === btn.key;
          drawButton(c, btn, btn.label, this.hoverKey === btn.key || active, active ? "#B84B3A" : "#C7A37B");
        }

        /* star counter */
        c.save();
        c.fillStyle = "rgba(255,248,240,0.65)";
        rr(c, 527, 57, 68, 22, 11);
        c.fill();
        c.fillStyle = COLORS.gold;
        c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "center";
        c.fillText("\u2605 " + totalStarsEarned() + "/21", 561, 73);
        c.restore();

        /* care streak pill */
        if (store.careStreak.count > 0) {
          c.save();
          const sk = store.careStreak;
          const streakColor = sk.count >= 7 ? "rgba(255,215,0,0.75)" : sk.count >= 3 ? "rgba(230,140,50,0.75)" : "rgba(180,160,140,0.65)";
          rr(c, 527, 34, 68, 20, 10);
          c.fillStyle = streakColor;
          c.fill();
          c.fillStyle = "#FF6B35";
          c.beginPath(); c.arc(541, 43, 4, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#FFD700";
          c.beginPath(); c.arc(541, 41, 2.5, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#FFF8F0";
          c.font = '11px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.fillText(sk.count + "d", 571, 48);
          c.restore();
        }

        /* daily tasks counter */
        if (store.dailyTasks.tasks.length > 0) {
          c.save();
          const done = store.dailyTasks.completed.length;
          const total = store.dailyTasks.tasks.length;
          rr(c, 600, 34, 60, 20, 10);
          c.fillStyle = done >= total ? "rgba(100,190,100,0.75)" : "rgba(180,160,140,0.65)";
          c.fill();
          c.fillStyle = "#FFF8F0";
          c.font = '11px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.fillText(done + "/" + total, 630, 48);
          c.restore();
        }

        /* compact pet status - small pills */
        c.save();
        rr(c, 14, 62, 140, 42, 12);
        c.fillStyle = "rgba(255,255,255,0.78)";
        c.fill();
        c.strokeStyle = "rgba(146,104,72,0.12)";
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = "#5A3E2B";
        c.textAlign = "left";
        c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Obi: " + this.moodLabel("obi"), 24, 78);
        drawMoodIcon(c, this.petMood("obi"), 142, 76);
        rr(c, 24, 84, 120, 12, 6);
        c.fillStyle = "rgba(0,0,0,0.08)";
        c.fill();
        const obiBarW = 120 * clamp(this.obi.joy / 100, 0, 1);
        if (obiBarW > 1) {
          rr(c, 24, 84, obiBarW, 12, 6);
          c.fillStyle = "#4A90D9";
          c.fill();
          /* bar shine */
          c.fillStyle = "rgba(255,255,255,0.25)";
          rr(c, 24, 84, obiBarW, 5, 6);
          c.fill();
        }
        c.restore();

        c.save();
        rr(c, 646, 62, 140, 42, 12);
        c.fillStyle = "rgba(255,255,255,0.78)";
        c.fill();
        c.strokeStyle = "rgba(146,104,72,0.12)";
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = "#5A3E2B";
        c.textAlign = "left";
        c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Luna: " + this.moodLabel("luna"), 656, 78);
        drawMoodIcon(c, this.petMood("luna"), 774, 76);
        rr(c, 656, 84, 120, 12, 6);
        c.fillStyle = "rgba(0,0,0,0.08)";
        c.fill();
        const lunaBarW = 120 * clamp(this.luna.joy / 100, 0, 1);
        if (lunaBarW > 1) {
          rr(c, 656, 84, lunaBarW, 12, 6);
          c.fillStyle = "#A8C686";
          c.fill();
          c.fillStyle = "rgba(255,255,255,0.25)";
          rr(c, 656, 84, lunaBarW, 5, 6);
          c.fill();
        }
        c.restore();

        /* warm scene glow */
        drawGlowCircle(c, 400, 380, 200, "rgba(255,240,210,ALPHA)", 0.06);
        /* dynamic character shadows - light source from window (~126, 130) */
        const lightX = 126, lightY = 130;
        const drawDynShadow = (cx, cy, baseW, baseH) => {
          const dx = (cx - lightX) * 0.12;
          const stretch = 1 + Math.abs(cx - lightX) * 0.001;
          const shadowAlpha = clamp(0.18 - Math.abs(cx - lightX) * 0.0003, 0.06, 0.18);
          c.save();
          const sg = c.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, baseW * stretch * 1.2);
          sg.addColorStop(0, `rgba(80,55,35,${shadowAlpha})`);
          sg.addColorStop(1, "rgba(80,55,35,0)");
          c.fillStyle = sg;
          c.beginPath();
          c.ellipse(cx + dx, cy, baseW * stretch, baseH, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        };
        drawDynShadow(this.annie.x, Math.max(this.annie.y + 120, 458), 44, 14);
        drawDynShadow(this.obi.x, 466, 42, 14);
        const lunaY = this.luna.perch !== "floor" ? 280 : 462;
        drawDynShadow(this.luna.x, lunaY + 8, 38, 12);

        /* treat mode side indicators */
        if (this.mode === "treat" && !this.menuOpen && !this.decorOpen && !this.dedication) {
          c.save();
          c.globalAlpha = 0.45;
          c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.fillStyle = "#4A90D9";
          c.fillText("\u2190 Obi's side", 200, 520);
          c.fillStyle = "#A8C686";
          c.fillText("Luna's side \u2192", 600, 520);
          /* subtle center divider */
          c.strokeStyle = "rgba(122,78,54,0.2)";
          c.setLineDash([4, 6]);
          c.beginPath();
          c.moveTo(400, 110);
          c.lineTo(400, 530);
          c.stroke();
          c.setLineDash([]);
          c.restore();
        }

        drawAnnie(c, this.annie.x, this.annie.y, 1.34, {
          pose: this.annie.pose,
          breath: Math.sin(game.time * 2),
          blink: blinkSignal(game.time + 0.25, 0.55),
          hairSway: Math.sin(game.time * 1.2),
          headTilt: this.annie.pose === "walk" ? 0 : 0.1 * Math.sin(game.time * 0.8),
          facing: this.annie.facing
        });

        /* ambient events — drawn after background, before characters */
        this.drawAmbientEvent(c);

        /* food & water bowls — drawn before characters */
        this.drawBowl(c, this.foodBowl, "foodBowl", this.hoverKey === "foodBowl");
        this.drawBowl(c, this.waterBowl, "waterBowl", this.hoverKey === "waterBowl");

        /* toy basket */
        this.drawToyBasket(c, this.hoverKey === "toyBasket");

        drawObi(c, this.obi.x, this.obi.y, 1.12, this.petSpriteState("obi"));
        const lunaDrawY = this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y : this.luna.y;
        const lunaDrawScale = this.luna.perch === "floor" ? 0.98 : this.luna.perch === "tower" ? 1.06 : 0.92;
        drawLuna(c, this.luna.x, lunaDrawY, lunaDrawScale, this.petSpriteState("luna"));

        /* thought bubbles */
        if (this.obiBubble) this.drawThoughtBubble(c, this.obi.x + 32, this.obi.y - 92, this.obiBubble);
        if (this.lunaBubble) {
          const ly = this.luna.perch !== "floor" ? LUNA_PERCHES[this.luna.perch].y : this.luna.y;
          this.drawThoughtBubble(c, this.luna.x + 30, ly - 88, this.lunaBubble);
        }

        for (const t of this.treats) this.drawTreat(c, t);
        this.drawToy(c);

        /* stroke trail */
        if (this.strokeTrail.length > 0 && (this.mode === "pet" || this.mode === "brush")) {
          for (const pt of this.strokeTrail) {
            c.save();
            c.globalAlpha = clamp(pt.life / 0.35, 0, 1) * 0.35;
            const color = this.mode === "brush" ? COLORS.gold : COLORS.softPink;
            c.fillStyle = color;
            c.beginPath();
            c.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
        }

        /* brush cursor sprite (Update 5) */
        if (this.mode === "brush" && !this.menuOpen && !this.decorOpen && !this.dedication) {
          drawGlowCircle(c, game.mouse.x, game.mouse.y, 28, "rgba(255,220,140,ALPHA)", 0.12);
          const brushFrame = spriteArt.frames.items ? spriteArt.frames.items.brush : null;
          if (brushFrame && spriteArt.image) {
            c.save();
            c.translate(game.mouse.x, game.mouse.y);
            c.rotate(-0.4);
            const bs = 0.18;
            c.drawImage(spriteArt.image, brushFrame.x, brushFrame.y, brushFrame.w, brushFrame.h, -brushFrame.w*bs/2, -brushFrame.h*bs, brushFrame.w*bs, brushFrame.h*bs);
            c.restore();
          }
        }

        /* floating reaction texts (Update 6) */
        for (const ft of this.floatingTexts) {
          c.save();
          const fadeAlpha = clamp(ft.life / 0.4, 0, 1);
          const scaleIn = ft.life > 1.2 ? easeOutBack(clamp((1.5 - ft.life) / 0.3, 0, 1)) : 1;
          c.globalAlpha = fadeAlpha;
          c.translate(ft.x, ft.y);
          c.scale(scaleIn, scaleIn);
          c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.strokeStyle = "rgba(255,255,255,0.85)";
          c.lineWidth = 3.5;
          c.strokeText(ft.text, 0, 0);
          c.fillStyle = ft.color;
          c.fillText(ft.text, 0, 0);
          c.restore();
        }

        /* decoration notification banner (Update 2) */
        if (this.decorNotification) {
          c.save();
          const dn = this.decorNotification;
          const fadeAlpha = clamp(dn.timer / 0.5, 0, 1) * clamp((4 - dn.timer) / 0.5, 0, 1);
          c.globalAlpha = fadeAlpha;
          const glow = 0.5 + 0.5 * Math.sin(game.time * 4);
          /* shadow */
          c.fillStyle = "rgba(60,30,80,0.12)";
          rr(c, 202, 108, 400, 36, 18);
          c.fill();
          /* banner */
          const grad = c.createLinearGradient(200, 105, 600, 105);
          grad.addColorStop(0, "rgba(128,80,180,0.94)");
          grad.addColorStop(1, "rgba(200,160,60,0.94)");
          rr(c, 200, 105, 400, 36, 18);
          c.fillStyle = grad;
          c.fill();
          c.strokeStyle = "rgba(255,255,255,0.3)";
          c.lineWidth = 1.5;
          c.stroke();
          /* shine */
          c.fillStyle = "rgba(255,255,255,0.1)";
          rr(c, 204, 106, 392, 14, 14);
          c.fill();
          drawGlowCircle(c, 400, 123, 220, "rgba(255,215,0,ALPHA)", 0.06 * glow);
          c.fillStyle = "#FFF8F0";
          c.textAlign = "center";
          c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("\u2605 " + dn.text + " \u2605", 400, 128);
          c.restore();
        }

        c.save();
        /* status bar shadow */
        c.fillStyle = "rgba(92,68,52,0.06)";
        rr(c, 124, 539, 556, 40, 18);
        c.fill();
        /* status bar */
        rr(c, 122, 536, 556, 40, 18);
        c.fillStyle = "rgba(255,255,255,0.9)";
        c.fill();
        c.strokeStyle = "rgba(146,104,72,0.18)";
        c.lineWidth = 1.5;
        c.stroke();
        /* shine */
        c.fillStyle = "rgba(255,255,255,0.2)";
        rr(c, 126, 537, 548, 16, 14);
        c.fill();
        /* pulse glow */
        if (this.statusPulse > 0.05) {
          c.globalAlpha = this.statusPulse * 0.15;
          drawGlowCircle(c, 400, 556, 300, "rgba(255,215,0,ALPHA)", 0.12);
          c.globalAlpha = 1;
        }
        c.fillStyle = "#7A5040";
        c.textAlign = "center";
        c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText(this.statusText, 400, 560);
        c.restore();

        if (this.tooltip && this.tooltipAlpha > 0.02) drawTooltip(c, this.tooltip.x, this.tooltip.y, this.tooltip.title, this.tooltip.body, this.tooltipAlpha);

        /* ── Games menu overlay ── */
        if (this.menuFade > 0.01) {
          c.save();
          c.globalAlpha = this.menuFade;

          /* dim background */
          c.fillStyle = "rgba(40,28,18,0.55)";
          c.fillRect(0, 0, W, H);

          /* menu panel */
          rr(c, 60, 70, 680, 500, 28);
          c.fillStyle = "rgba(255,248,240,0.97)";
          c.fill();
          c.strokeStyle = "rgba(146,104,72,0.2)";
          c.lineWidth = 3;
          c.stroke();

          /* title */
          c.fillStyle = "#7A4E36";
          c.textAlign = "center";
          c.font = '30px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Minigames", W / 2, 110);

          /* close button */
          const closeHover = this.menuHover === "close";
          if (closeHover) drawGlowCircle(c, W / 2 + 218, 100, 24, "rgba(180,80,60,ALPHA)", 0.2);
          c.fillStyle = closeHover ? "rgba(200,70,50,0.95)" : "rgba(140,100,70,0.55)";
          c.beginPath();
          c.arc(W / 2 + 218, 100, closeHover ? 18 : 16, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#FFF8F0";
          c.lineWidth = closeHover ? 3 : 2.5;
          c.beginPath(); c.moveTo(W / 2 + 212, 94); c.lineTo(W / 2 + 224, 106); c.stroke();
          c.beginPath(); c.moveTo(W / 2 + 224, 94); c.lineTo(W / 2 + 212, 106); c.stroke();

          /* game cards */
          for (let i = 0; i < this.gameCards.length; i++) {
            const card = this.gameCards[i];
            const cr = this.getCardRect(i);
            const hover = this.menuHover === i;
            const scale = hover ? 1.02 : 1;

            c.save();
            c.translate(cr.x + cr.w / 2, cr.y + cr.h / 2);
            c.scale(scale, scale);
            c.translate(-(cr.x + cr.w / 2), -(cr.y + cr.h / 2));

            /* card shadow */
            c.fillStyle = "rgba(92,68,52,0.08)";
            rr(c, cr.x + 2, cr.y + 3, cr.w, cr.h, 14);
            c.fill();

            /* card bg */
            rr(c, cr.x, cr.y, cr.w, cr.h, 14);
            c.fillStyle = hover ? "rgba(255,255,255,1)" : "rgba(255,252,245,0.95)";
            c.fill();
            c.strokeStyle = hover ? card.color : "rgba(146,104,72,0.15)";
            c.lineWidth = hover ? 3 : 2;
            c.stroke();

            /* colored accent bar */
            c.fillStyle = card.color;
            rr(c, cr.x, cr.y, 8, cr.h, 14);
            c.fill();
            c.fillRect(cr.x + 7, cr.y + 4, 1, cr.h - 8);

            /* icon circle with glow */
            c.save();
            c.globalAlpha = this.menuFade * 0.28;
            c.fillStyle = card.color;
            c.beginPath(); c.arc(cr.x + 52, cr.y + cr.h / 2, 30, 0, Math.PI * 2); c.fill();
            c.restore();
            c.fillStyle = card.color;
            c.beginPath(); c.arc(cr.x + 52, cr.y + cr.h / 2, 22, 0, Math.PI * 2); c.fill();

            /* icon */
            c.save();
            c.translate(cr.x + 52, cr.y + cr.h / 2);
            if (card.icon === "bone") drawBone(c, 0, 0, 18, 8, "#FFF8F0");
            else if (card.icon === "catEye") drawBadgeIcon(c, "catEye", 0, 0, "#FFF8F0");
            else if (card.icon === "heart") drawHeart(c, 0, 0, 1.0, "#FFF8F0");
            c.restore();

            /* text */
            c.fillStyle = "#5C3D2E";
            c.textAlign = "left";
            c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
            c.fillText(card.title, cr.x + 88, cr.y + 30);
            c.fillStyle = "rgba(92,61,46,0.65)";
            c.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
            c.fillText(card.desc, cr.x + 88, cr.y + 50);
            c.fillStyle = "rgba(92,61,46,0.5)";
            c.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
            c.fillText(card.best(), cr.x + 88, cr.y + 67);

            /* play arrow */
            c.fillStyle = hover ? card.color : "rgba(92,61,46,0.4)";
            c.beginPath();
            c.moveTo(cr.x + cr.w - 42, cr.y + cr.h / 2 - 10);
            c.lineTo(cr.x + cr.w - 42, cr.y + cr.h / 2 + 10);
            c.lineTo(cr.x + cr.w - 26, cr.y + cr.h / 2);
            c.closePath();
            c.fill();

            c.restore();
          }

          /* achievements count */
          c.fillStyle = "rgba(92,61,46,0.5)";
          c.textAlign = "center";
          c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          const unlocked = Object.values(store.achievements).filter(Boolean).length;
          c.fillText("Achievements: " + unlocked + " / " + ACHIEVEMENTS.length, W / 2, 558);

          c.restore();
        }

        /* ── Decoration panel overlay ── */
        if (this.decorFade > 0.01) {
          c.save();
          c.globalAlpha = this.decorFade;
          c.fillStyle = "rgba(40,28,18,0.55)";
          c.fillRect(0, 0, W, H);

          rr(c, 100, 70, 600, 480, 28);
          c.fillStyle = "rgba(255,248,240,0.97)";
          c.fill();
          c.strokeStyle = "rgba(146,104,72,0.2)";
          c.lineWidth = 3;
          c.stroke();

          c.fillStyle = "#7A4E36";
          c.textAlign = "center";
          c.font = '28px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Decorate", W / 2, 110);

          const stars = totalStarsEarned();
          c.fillStyle = "rgba(92,61,46,0.5)";
          c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Stars earned: " + stars + " / 21  •  Unlock items by earning stars in minigames!", W / 2, 130);

          /* close button */
          const closeHover = this.decorHover === "close";
          if (closeHover) drawGlowCircle(c, W / 2 + 200, 100, 24, "rgba(180,80,60,ALPHA)", 0.2);
          c.fillStyle = closeHover ? "rgba(200,70,50,0.95)" : "rgba(140,100,70,0.55)";
          c.beginPath(); c.arc(W / 2 + 200, 100, closeHover ? 18 : 16, 0, Math.PI * 2); c.fill();
          c.strokeStyle = "#FFF8F0"; c.lineWidth = closeHover ? 3 : 2.5;
          c.beginPath(); c.moveTo(W / 2 + 194, 94); c.lineTo(W / 2 + 206, 106); c.stroke();
          c.beginPath(); c.moveTo(W / 2 + 206, 94); c.lineTo(W / 2 + 194, 106); c.stroke();

          const pageItems = this.getDecorPageItems();
          for (let i = 0; i < pageItems.length; i++) {
            const item = pageItems[i];
            const ir = this.getDecorItemRect(i);
            const hover = this.decorHover === i;
            const have = item.streakUnlock ? store.careStreak.count >= item.streakUnlock : (item.stars === 0 || stars >= item.stars);
            const active = item.type === "toggle" ? store.decor[item.key] : store.decor[item.key] > 0;

            c.save();
            if (!have) c.globalAlpha = 0.6;
            /* item shadow */
            c.fillStyle = "rgba(92,68,52,0.05)";
            rr(c, ir.x + 2, ir.y + 2, ir.w, ir.h, 14);
            c.fill();
            rr(c, ir.x, ir.y, ir.w, ir.h, 14);
            c.fillStyle = hover ? "rgba(255,255,255,1)" : "rgba(255,252,245,0.95)";
            c.fill();
            if (hover && have) drawGlowCircle(c, ir.x + ir.w / 2, ir.y + ir.h / 2, ir.w * 0.6, "rgba(155,125,189,ALPHA)", 0.08);
            c.strokeStyle = hover && have ? "#9B7DBD" : !have ? "rgba(146,104,72,0.1)" : "rgba(146,104,72,0.15)";
            c.lineWidth = hover && have ? 3 : 2;
            c.stroke();

            /* star cost */
            c.fillStyle = have ? COLORS.gold : "rgba(180,160,140,0.5)";
            c.textAlign = "center";
            c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
            if (item.streakUnlock) {
              c.fillStyle = have ? "#FF6B35" : "rgba(180,160,140,0.5)";
              c.beginPath(); c.arc(ir.x + 32, ir.y + ir.h / 2 - 6, 6, 0, Math.PI * 2); c.fill();
              c.fillStyle = have ? "#8A6045" : "rgba(160,140,120,0.6)";
              c.fillText(item.streakUnlock + "d", ir.x + 32, ir.y + ir.h / 2 + 18);
            } else {
              drawStar(c, ir.x + 32, ir.y + ir.h / 2 - 8, 10, have ? COLORS.gold : "#C8B8A8");
              c.fillStyle = have ? "#8A6045" : "rgba(160,140,120,0.6)";
              c.fillText(item.stars, ir.x + 32, ir.y + ir.h / 2 + 18);
            }

            /* name and desc */
            c.textAlign = "left";
            c.fillStyle = have ? "#5C3D2E" : "rgba(92,61,46,0.4)";
            c.font = '17px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
            c.fillText(item.name, ir.x + 64, ir.y + 30);
            c.fillStyle = have ? "rgba(92,61,46,0.6)" : "rgba(92,61,46,0.3)";
            c.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
            c.fillText(item.desc, ir.x + 64, ir.y + 50);

            /* toggle/cycle state */
            if (have) {
              if (item.type === "toggle") {
                const tx = ir.x + ir.w - 60;
                const ty = ir.y + ir.h / 2;
                rr(c, tx, ty - 12, 44, 24, 12);
                c.fillStyle = active ? "#7DB36C" : "rgba(180,160,140,0.4)";
                c.fill();
                c.fillStyle = "#FFF8F0";
                c.beginPath(); c.arc(active ? tx + 32 : tx + 12, ty, 9, 0, Math.PI * 2); c.fill();
              } else if (item.type === "cycle") {
                c.fillStyle = "rgba(92,61,46,0.6)";
                c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
                c.textAlign = "right";
                c.fillText(item.labels[store.decor[item.key]] + " ▸", ir.x + ir.w - 24, ir.y + ir.h / 2 + 5);
              }
            } else {
              c.fillStyle = "rgba(160,140,120,0.4)";
              c.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
              c.textAlign = "right";
              if (item.streakUnlock) {
                c.fillText("Need " + item.streakUnlock + "-day streak", ir.x + ir.w - 24, ir.y + ir.h / 2 + 5);
              } else {
                c.fillText("Need " + item.stars + " \u2605", ir.x + ir.w - 24, ir.y + ir.h / 2 + 5);
              }
            }
            c.restore();
          }
          /* page navigation */
          if (this.decorPageCount() > 1) {
            c.fillStyle = "#7A4E36";
            c.textAlign = "center";
            c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
            c.fillText("Page " + (this.decorPage + 1) + "/" + this.decorPageCount(), W / 2, 548);
            if (this.decorPage > 0) {
              c.fillStyle = this.decorHover === "prevPage" ? COLORS.warmRed : "#8A6045";
              c.fillText("\u25C4", 318, 548);
            }
            if (this.decorPage < this.decorPageCount() - 1) {
              c.fillStyle = this.decorHover === "nextPage" ? COLORS.warmRed : "#8A6045";
              c.fillText("\u25BA", 482, 548);
            }
          }
          c.restore();
        }

        /* daily gift overlay */
        this.drawDailyGift(c);

        /* ── First visit dedication screen ── */
        if (this.dedication) {
          const a = this.dedication.alpha;
          c.save();
          c.globalAlpha = a;
          c.fillStyle = "rgba(60,40,28,0.7)";
          c.fillRect(0, 0, W, H);

          /* warm glow behind text */
          drawGlowCircle(c, W / 2, 260, 220, "rgba(255,230,180,ALPHA)", 0.15 * a);

          /* main panel */
          rr(c, 120, 120, 560, 360, 32);
          c.fillStyle = "rgba(255,248,240,0.96)";
          c.fill();
          c.strokeStyle = "rgba(200,160,120,0.25)";
          c.lineWidth = 3;
          c.stroke();

          /* heart decorations */
          for (let i = 0; i < 8; i++) {
            c.save();
            c.globalAlpha = a * (0.15 + Math.sin(game.time * 1.5 + i * 0.9) * 0.08);
            const hx = 160 + i * 72;
            const hy = 140 + Math.sin(game.time * 0.8 + i * 1.3) * 8;
            drawHeart(c, hx, hy, 0.5, COLORS.softPink);
            c.restore();
          }

          c.fillStyle = "#7A4E36";
          c.textAlign = "center";
          c.font = '36px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Made with Love", W / 2, 220);
          c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillStyle = "rgba(122,78,54,0.8)";
          c.fillText("for Annie, Obi, and Luna", W / 2, 256);

          /* small characters */
          c.save();
          c.globalAlpha = a * clamp(this.dedication.phase - 0.5, 0, 1);
          drawAnnie(c, 320, 370, 0.8, { pose: "cheer", breath: Math.sin(game.time * 2), blink: blinkSignal(game.time, 0.5), hairSway: Math.sin(game.time * 1.2) });
          drawObi(c, 420, 390, 0.7, { pose: "sit", expression: "happy", tail: Math.sin(game.time * 8) });
          drawLuna(c, 500, 382, 0.65, { pose: "sit", tail: Math.sin(game.time * 2), earTwitch: earSignal(game.time) });
          c.restore();

          /* click to continue */
          c.globalAlpha = a * (0.4 + Math.sin(game.time * 2.5) * 0.3);
          c.fillStyle = "#8A6045";
          c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText(isMobile ? "Tap anywhere to begin" : "Click anywhere to begin", W / 2, 454);

          c.restore();
        }
      }
    }

    SceneRegistry.register("hangout", () => new HangoutScene());
