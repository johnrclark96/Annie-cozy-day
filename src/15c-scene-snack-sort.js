    class SnackSortScene extends BaseMinigameScene {
      constructor() {
        super("sort", "Snack Sort", isMobile ? "Drag dog treats LEFT to Obi, cat treats RIGHT to Luna!" : "Drag dog treats LEFT to Obi, cat treats RIGHT to Luna!", [150, 350, 700], 60);
        this.treats = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.8;
        this.dragging = null;
        this.obiHappy = 0;
        this.lunaHappy = 0;
        this.wrongFlash = 0;
        this.correctStreak = 0;
        this.obiBowl = { x: 150, y: 520 };
        this.lunaBowl = { x: 650, y: 520 };
      }
      spawnTreat() {
        const isDog = Math.random() < 0.5;
        const dogSubs = ["bone", "round", "training"];
        const catSubs = ["fish", "roundCat", "premium"];
        const subs = isDog ? dogSubs : catSubs;
        const sub = subs[Math.floor(Math.random() * subs.length)];
        const elapsed = (this.duration - this.timeLeft) / this.duration;
        this.treats.push({
          x: rand(160, 640),
          y: -20,
          vy: rand(40, 70) * (1 + elapsed * 0.6),
          type: isDog ? "dog" : "cat",
          subtype: sub,
          points: sub === "premium" || sub === "training" ? 15 : 10,
          dragging: false,
          settled: false,
          settleTimer: 0
        });
      }
      updatePlay(dt) {
        this.obiHappy = Math.max(0, this.obiHappy - dt);
        this.lunaHappy = Math.max(0, this.lunaHappy - dt);
        this.wrongFlash = Math.max(0, this.wrongFlash - dt * 2);

        // Spawn treats
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnTreat();
          const elapsed = (this.duration - this.timeLeft) / this.duration;
          this.spawnInterval = lerp(1.8, 0.6, elapsed);
          this.spawnTimer = this.spawnInterval;
        }

        // Drop detection: if dragging and mouse released
        if (this.dragging && !game.mouse.down) {
          this.dropTreat();
        }

        // Update treat positions
        for (let i = this.treats.length - 1; i >= 0; i--) {
          const t = this.treats[i];
          if (t.settled) {
            t.settleTimer -= dt;
            if (t.settleTimer <= 0) this.treats.splice(i, 1);
            continue;
          }
          if (t.dragging) {
            t.x = game.mouse.x;
            t.y = game.mouse.y;
            continue;
          }
          t.y += t.vy * dt;
          if (t.y > H + 30) {
            this.treats.splice(i, 1);
            this.combo = 1; // passive miss resets combo but NOT correctStreak
          }
        }
      }
      dropTreat() {
        const t = this.dragging;
        if (!t) return;
        t.dragging = false;
        this.dragging = null;
        if (t.y < 350) {
          t.vy = 60;
          return;
        }
        const obiSide = t.x < W / 2;
        const correct = (t.type === "dog" && obiSide) || (t.type === "cat" && !obiSide);
        if (correct) {
          this.addScore(t.points * this.combo);
          this.combo++;
          this.correctStreak++;
          t.settled = true; t.settleTimer = 0.5;
          spawnParticleBurst(obiSide ? 150 : 650, 450, [COLORS.gold, COLORS.softPink], 8, ["star", "heart"]);
          audio.catch();
          if (obiSide) this.obiHappy = 0.5; else this.lunaHappy = 0.5;
          if (this.correctStreak >= 10) this.queueAchievement("sortingPro");
        } else {
          this.addScore(-5);
          this.combo = 1;
          this.correctStreak = 0;
          this.wrongFlash = 1;
          t.settled = true; t.settleTimer = 0.3;
          audio.miss();
          screenShake(2, 0.1);
        }
      }
      onGameClick(x, y) {
        for (let i = this.treats.length - 1; i >= 0; i--) {
          const t = this.treats[i];
          if (t.settled || t.dragging) continue;
          if (dist(x, y, t.x, t.y) < 32) {
            t.dragging = true;
            this.dragging = t;
            return;
          }
        }
      }
      onMouseMove(x, y) {
        super.onMouseMove(x, y);
        if (this.dragging) {
          this.dragging.x = x;
          this.dragging.y = y;
        }
      }
      drawTreatShape(c, t) {
        c.save();
        c.translate(t.x, t.y);
        if (t.settled) c.globalAlpha = clamp(t.settleTimer / 0.3, 0, 1);
        if (t.subtype === "bone") {
          drawBone(c, 0, 0, 20, 10, "#D4A44C");
        } else if (t.subtype === "round") {
          c.fillStyle = "#A07040";
          c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.fill();
          c.fillStyle = "rgba(255,255,255,0.3)";
          c.beginPath(); c.arc(-3, -3, 4, 0, Math.PI * 2); c.fill();
        } else if (t.subtype === "training") {
          c.fillStyle = "#D4B88C";
          rr(c, -8, -5, 16, 10, 3); c.fill();
        } else if (t.subtype === "fish") {
          c.fillStyle = "#E88070";
          c.beginPath();
          c.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
          c.fill();
          c.beginPath(); c.moveTo(12, 0); c.lineTo(18, -6); c.lineTo(18, 6); c.closePath(); c.fill();
        } else if (t.subtype === "roundCat") {
          c.fillStyle = "#C08070";
          c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.fill();
          c.fillStyle = "rgba(255,255,255,0.25)";
          c.beginPath(); c.arc(-2, -2, 3.5, 0, Math.PI * 2); c.fill();
        } else if (t.subtype === "premium") {
          c.fillStyle = "#E89080";
          rr(c, -10, -6, 20, 12, 4); c.fill();
          c.fillStyle = "rgba(255,255,255,0.3)";
          rr(c, -7, -4, 8, 6, 2); c.fill();
        }
        c.restore();
      }
      drawScene(c) {
        // Background
        c.fillStyle = "#F8F0E8";
        c.fillRect(0, 0, W, H);

        // Divider
        c.setLineDash([6, 6]);
        c.strokeStyle = "rgba(150,120,90,0.3)";
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(W / 2, 60); c.lineTo(W / 2, H); c.stroke();
        c.setLineDash([]);

        // Labels
        c.fillStyle = "rgba(100,80,60,0.5)";
        c.textAlign = "center";
        c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("\u2190 Dog Treats", 200, 80);
        c.fillText("Cat Treats \u2192", 600, 80);

        // Bowls
        c.save();
        c.fillStyle = "#D4A44C";
        c.beginPath(); c.ellipse(this.obiBowl.x, this.obiBowl.y, 40, 16, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#E88070";
        c.beginPath(); c.ellipse(this.lunaBowl.x, this.lunaBowl.y, 40, 16, 0, 0, Math.PI * 2); c.fill();
        c.restore();

        // Pets
        const obiB = this.obiHappy > 0 ? 0.06 : 0;
        const lunaW = this.lunaHappy > 0 ? 0.1 : 0;
        drawObi(c, 150, 480, 0.9, { pose: "sit", expression: this.obiHappy > 0 ? "excited" : "happy", bounce: obiB, facing: 1 });
        drawLuna(c, 650, 470, 0.85, { pose: "sit", wiggle: lunaW, facing: -1 });

        // Wrong flash
        if (this.wrongFlash > 0) {
          c.save();
          c.globalAlpha = this.wrongFlash * 0.15;
          c.fillStyle = "#FF0000";
          c.fillRect(0, 0, W, H);
          c.restore();
        }

        // Treats
        for (const t of this.treats) {
          this.drawTreatShape(c, t);
        }

        // Combo display
        if (this.combo > 1) {
          c.save();
          c.fillStyle = COLORS.gold;
          c.textAlign = "center";
          c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText(this.combo + "x combo!", W / 2, 550);
          c.restore();
        }
      }
      drawInstructionIcon(c, x, y) {
        drawBone(c, x - 18, y, 18, 8, "#D4A44C");
        c.fillStyle = "#E88070";
        c.beginPath(); c.ellipse(x + 18, y, 10, 5, 0, 0, Math.PI * 2); c.fill();
      }
      drawResultCharacter(c) {
        drawObi(c, 340, 410, 0.85, { pose: "sit", expression: "excited", bounce: 0.04, facing: 1 });
        drawLuna(c, 460, 405, 0.8, { pose: "sit", wiggle: 0.03, facing: -1 });
      }
    }
    SceneRegistry.register("sort", () => new SnackSortScene());
