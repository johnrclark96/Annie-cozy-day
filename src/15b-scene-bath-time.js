    class BathTimeScene extends BaseMinigameScene {
      constructor() {
        super("bath", "Bath Time", isMobile ? "Tap and drag to scrub! Tap the tub to rinse! Drag to dry!" : "Click and drag to scrub! Click the tub to rinse! Drag to dry!", [80, 200, 400], 45);
        this.currentPet = "obi";
        this.washPhase = "scrub"; // scrub → rinse → dry
        this.cleanMeter = 0;
        this.dryMeter = 0;
        this.rinseCount = 0;
        this.rinsesNeeded = 5;
        this.bubbles = [];
        this.petsDone = 0;
        this.transitionTimer = 0;
        this.shakeTimer = 0;
        this.phaseStartTime = 0;
        this.petHitbox = { x: 310, y: 300, w: 180, h: 160 };
        this.tubHitbox = { x: 280, y: 380, w: 240, h: 80 };
      }
      updatePlay(dt) {
        this.shakeTimer = Math.max(0, this.shakeTimer - dt);

        // Transition between pets
        if (this.transitionTimer > 0) {
          this.transitionTimer -= dt;
          if (this.transitionTimer <= 0) {
            this.currentPet = "luna";
            this.washPhase = "scrub";
            this.cleanMeter = 0;
            this.dryMeter = 0;
            this.rinseCount = 0;
            this.bubbles = [];
            this.phaseStartTime = this.phaseTime;
          }
          return;
        }

        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
          const b = this.bubbles[i];
          b.y += b.vy * dt;
          b.life -= dt;
          if (b.life <= 0) this.bubbles.splice(i, 1);
        }

        const mx = game.mouse.x, my = game.mouse.y;
        const overPet = pointInRect(mx, my, this.petHitbox);

        if (this.washPhase === "scrub") {
          if (game.mouse.down && overPet) {
            this.cleanMeter = clamp(this.cleanMeter + dt * 35, 0, 100);
            this.addScore(dt * 30);
            // Spawn bubbles
            if (Math.random() < dt * 12) {
              this.bubbles.push({ x: mx + rand(-20, 20), y: my + rand(-10, 10), size: rand(4, 10), life: rand(2, 4), vy: rand(-8, -3) });
            }
          }
          if (this.cleanMeter >= 100) {
            const elapsed = this.phaseTime - this.phaseStartTime;
            this.addScore(35 + Math.max(0, Math.round(15 - elapsed * 1.5)));
            audio.tinyChime();
            this.washPhase = "rinse";
            this.phaseStartTime = this.phaseTime;
            this.playHint = "Rinse! " + (isMobile ? "Tap" : "Click") + " the tub (" + this.rinseCount + "/" + this.rinsesNeeded + ")";
          } else {
            this.playHint = "Scrub! " + Math.round(this.cleanMeter) + "%";
          }
        } else if (this.washPhase === "rinse") {
          this.playHint = "Rinse! " + (isMobile ? "Tap" : "Click") + " the tub (" + this.rinseCount + "/" + this.rinsesNeeded + ")";
        } else if (this.washPhase === "dry") {
          if (game.mouse.down && overPet) {
            this.dryMeter = clamp(this.dryMeter + dt * 30, 0, 100);
            this.addScore(dt * 25);
          }
          if (this.dryMeter >= 100) {
            const elapsed = this.phaseTime - this.phaseStartTime;
            this.addScore(35 + Math.max(0, Math.round(15 - elapsed * 1.5)));
            audio.combo();
            this.petsDone++;
            if (this.petsDone === 1) {
              this.transitionTimer = 1.5;
              this.playHint = "Great! Now Luna's turn...";
            } else {
              // Both done! Combo bonus
              this.addScore(40);
              this.playHint = "Both pets squeaky clean!";
              spawnParticleBurst(400, 350, [COLORS.gold, "#87CEEB", COLORS.softPink], 16, ["star", "heart"]);
              screenShake(4, 0.3);
              if (this.score >= 200) this.queueAchievement("squeakyClean");
            }
          } else {
            this.playHint = "Dry! " + Math.round(this.dryMeter) + "%";
          }
        }
      }
      onGameClick(x, y) {
        if (this.transitionTimer > 0) return;
        if (this.washPhase === "rinse" && pointInRect(x, y, this.tubHitbox)) {
          this.rinseCount++;
          spawnParticleBurst(400, 380, ["#6CB4EE", "#A0D4FF"], 6, ["star"]);
          this.shakeTimer = 0.3;
          audio.tinyChime();
          // Remove some bubbles
          const toRemove = Math.min(this.bubbles.length, Math.ceil(this.bubbles.length / (this.rinsesNeeded - this.rinseCount + 1)));
          this.bubbles.splice(0, toRemove);
          if (this.rinseCount >= this.rinsesNeeded) {
            const elapsed = this.phaseTime - this.phaseStartTime;
            this.addScore(35 + Math.max(0, Math.round(15 - elapsed * 1.5)));
            audio.tinyChime();
            this.washPhase = "dry";
            this.phaseStartTime = this.phaseTime;
          }
        }
      }
      drawScene(c) {
        // Bathroom background
        const wallG = c.createLinearGradient(0, 0, 0, H * 0.6);
        wallG.addColorStop(0, "#D8E4EC");
        wallG.addColorStop(1, "#C8D4DC");
        c.fillStyle = wallG;
        c.fillRect(0, 0, W, H * 0.6);
        c.fillStyle = "#E8E8E8";
        c.fillRect(0, H * 0.6, W, H * 0.4);

        // Tile grid
        c.strokeStyle = "rgba(180,190,200,0.3)";
        c.lineWidth = 1;
        for (let tx = 0; tx < W; tx += 40) { c.beginPath(); c.moveTo(tx, 0); c.lineTo(tx, H); c.stroke(); }
        for (let ty = 0; ty < H; ty += 40) { c.beginPath(); c.moveTo(0, ty); c.lineTo(W, ty); c.stroke(); }

        // Shelf with bottles
        c.fillStyle = "#B0A090";
        rr(c, 580, 60, 160, 12, 4); c.fill();
        const bottleColors = ["#D04040", "#40A0D0", "#D0D040"];
        for (let bi = 0; bi < 3; bi++) {
          c.fillStyle = bottleColors[bi];
          rr(c, 600 + bi * 48, 20, 20, 40, 6); c.fill();
          c.fillStyle = "rgba(255,255,255,0.3)";
          rr(c, 604 + bi * 48, 24, 6, 28, 4); c.fill();
        }

        // Tub
        c.save();
        c.translate(400, 420);
        // Tub body
        const tubG = c.createLinearGradient(-120, -40, -120, 40);
        tubG.addColorStop(0, "#C0C8D0");
        tubG.addColorStop(0.5, "#A0A8B0");
        tubG.addColorStop(1, "#808890");
        c.fillStyle = tubG;
        c.beginPath();
        c.ellipse(0, 0, 120, 45, 0, 0, Math.PI * 2);
        c.fill();
        // Water surface
        c.fillStyle = "rgba(100,180,240,0.45)";
        c.beginPath();
        c.ellipse(0, -5, 105, 35, 0, 0, Math.PI * 2);
        c.fill();
        // Rim highlight
        c.strokeStyle = "rgba(255,255,255,0.4)";
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, -8, 115, 40, 0, Math.PI, Math.PI * 2);
        c.stroke();
        c.restore();

        // Pet
        if (this.transitionTimer <= 0) {
          const shake = this.shakeTimer > 0 ? Math.sin(game.time * 30) * 3 : 0;
          if (this.currentPet === "obi") {
            drawObi(c, 400 + shake, 390, 1.1, { pose: "bath", expression: "happy", bounce: this.shakeTimer > 0 ? 0.05 : 0, facing: 1 });
          } else {
            drawLuna(c, 400 + shake, 385, 1.0, { pose: "bath", facing: 1, wiggle: this.shakeTimer > 0 ? 0.1 : 0 });
          }
        } else {
          // Transition: show text
          c.fillStyle = COLORS.dark;
          c.textAlign = "center";
          c.font = '22px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Luna's turn!", W / 2, H / 2 - 20);
        }

        // Bubbles
        for (const b of this.bubbles) {
          c.save();
          c.globalAlpha = clamp(b.life / 2, 0, 0.7);
          const bg = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
          bg.addColorStop(0, "rgba(255,255,255,0.8)");
          bg.addColorStop(0.5, "rgba(180,220,255,0.4)");
          bg.addColorStop(1, "rgba(180,220,255,0)");
          c.fillStyle = bg;
          c.beginPath(); c.arc(b.x, b.y, b.size, 0, Math.PI * 2); c.fill();
          c.restore();
        }

        // Phase meter
        let meter = 0, label = "";
        if (this.washPhase === "scrub") { meter = this.cleanMeter; label = "SCRUB"; }
        else if (this.washPhase === "rinse") { meter = (this.rinseCount / this.rinsesNeeded) * 100; label = "RINSE"; }
        else if (this.washPhase === "dry") { meter = this.dryMeter; label = "DRY"; }
        c.save();
        c.fillStyle = "rgba(0,0,0,0.15)";
        rr(c, 300, 520, 200, 18, 9); c.fill();
        if (meter > 0) {
          rr(c, 300, 520, 200 * clamp(meter / 100, 0, 1), 18, 9);
          c.fillStyle = this.washPhase === "scrub" ? "#87CEEB" : this.washPhase === "rinse" ? "#6CB4EE" : "#FFD700";
          c.fill();
        }
        c.fillStyle = "#fff";
        c.textAlign = "center";
        c.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText(label + " — " + this.currentPet.charAt(0).toUpperCase() + this.currentPet.slice(1), 400, 534);
        c.restore();
      }
      drawInstructionIcon(c, x, y) {
        drawObi(c, x - 20, y + 10, 0.5, { pose: "bath", facing: 1 });
        drawLuna(c, x + 30, y + 10, 0.45, { pose: "bath", facing: -1 });
      }
      drawResultCharacter(c) {
        drawObi(c, 350, 400, 0.9, { pose: "sit", expression: "excited", bounce: 0.04, facing: 1 });
        drawLuna(c, 450, 395, 0.85, { pose: "sit", wiggle: 0.02, facing: -1 });
      }
    }
    SceneRegistry.register("bath", () => new BathTimeScene());
