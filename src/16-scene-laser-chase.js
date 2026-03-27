    class LaserChaseScene extends BaseMinigameScene {
      constructor() {
        super("laser", "Luna's Laser Chase", isMobile ? "Drag your finger to control the laser dot! Lead Luna through the glowing targets!" : "Move your mouse to control the laser dot! Lead Luna through the glowing targets!", [150, 400, 800], 60);
        this.luna = { x: 220, y: 320, vx: 0, vy: 0, wiggle: 0, pounceTimer: 0, pounceTarget: null, pawBat: 0, facing: 1 };
        this.targets = [];
        this.spawnedTargetCap = 1;
        this.trail = [];
        this.scorePopups = [];
      }
      enter() {
        super.enter();
        this.luna = { x: 220, y: 320, vx: 0, vy: 0, wiggle: 0, pounceTimer: 0, pounceTarget: null, pawBat: 0, facing: 1 };
        this.targets = [];
        this.spawnedTargetCap = 1;
        this.trail = [];
        this.scorePopups = [];
        this.fillTargets();
      }
      obstacles() {
        return [
          { x: 44, y: 118, w: 160, h: 80 },
          { x: 272, y: 228, w: 150, h: 70 },
          { x: 608, y: 92, w: 100, h: 150 },
          { x: 588, y: 370, w: 96, h: 96 }
        ];
      }
      extraInteractiveAt() { return true; }
      onGameClick() {}
      fillTargets() {
        while (this.targets.length < this.spawnedTargetCap) this.targets.push(this.makeTarget());
      }
      makeTarget() {
        const obs = this.obstacles();
        const elapsed = this.duration - this.timeLeft;
        for (let attempt = 0; attempt < 80; attempt++) {
          const bonus = elapsed > 14 && Math.random() < 0.16;
          const t = { x: rand(80, W - 80), y: rand(110, H - 80), life: bonus ? 6.2 : 8, fade: 1, fading: false, pulse: rand(0, Math.PI * 2), bonus };
          let bad = false;
          for (const o of obs) {
            if (t.x > o.x - 32 && t.x < o.x + o.w + 32 && t.y > o.y - 32 && t.y < o.y + o.h + 32) { bad = true; break; }
          }
          if (!bad) return t;
        }
        return { x: rand(100, W - 100), y: rand(110, H - 90), life: 8, fade: 1, fading: false, pulse: rand(0, Math.PI * 2), bonus: false };
      }
      updatePlay(dt) {
        const elapsed = this.duration - this.timeLeft;
        this.spawnedTargetCap = elapsed >= 40 ? 2 : 1;
        this.fillTargets();

        for (let i = this.targets.length - 1; i >= 0; i--) {
          const t = this.targets[i];
          t.life -= dt;
          if (t.life <= 0 && !t.fading) {
            t.fading = true;
            if (this.combo > 1) {
              this.scorePopups.push({ x: t.x, y: t.y, text: "Miss!", life: 0.8 });
              audio.miss();
            }
            this.combo = 1;
          }
          if (t.fading) {
            t.fade -= dt * 2;
            if (t.fade <= 0) this.targets.splice(i, 1);
          }
        }
        this.fillTargets();

        this.luna.pawBat = Math.max(0, this.luna.pawBat - dt * 4);
        this.luna.wiggle += dt;
        const mx = clamp(game.mouse.x, 20, W - 20);
        const my = clamp(game.mouse.y, 60, H - 20);
        const d = dist(this.luna.x, this.luna.y, mx, my);
        const angle = Math.atan2(my - this.luna.y, mx - this.luna.x);
        this.luna.facing = mx >= this.luna.x ? 1 : -1;

        const lastTrail = this.trail[this.trail.length - 1];
        if (!lastTrail || dist(lastTrail.x, lastTrail.y, mx, my) > 8) {
          this.trail.push({ x: mx, y: my, life: 0.35 });
          if (this.trail.length > 14) this.trail.shift();
        }
        this.trail.forEach((p) => p.life -= dt);
        this.trail = this.trail.filter((p) => p.life > 0);

        if (this.luna.pounceTimer > 0) {
          this.luna.pounceTimer -= dt;
          if (this.luna.pounceTarget) {
            const px = this.luna.pounceTarget.x;
            const py = this.luna.pounceTarget.y;
            const ad = Math.atan2(py - this.luna.y, px - this.luna.x);
            this.luna.x += Math.cos(ad) * 280 * dt;
            this.luna.y += Math.sin(ad) * 280 * dt;
          }
          if (this.luna.pounceTimer <= 0) this.luna.pounceTarget = null;
        } else if (d < 50) {
          this.luna.pounceTimer = 0.5;
          this.luna.pounceTarget = { x: mx, y: my };
          audio.pounce();
        } else {
          const speed = d > 150 ? 72 : 142 + Math.sin(game.time * 10) * 15;
          const wobble = Math.sin(game.time * 5 + this.luna.y * 0.02) * 0.38;
          this.luna.x += Math.cos(angle + wobble) * speed * dt;
          this.luna.y += Math.sin(angle + wobble) * speed * dt;
        }

        this.luna.x = clamp(this.luna.x, 40, W - 40);
        this.luna.y = clamp(this.luna.y, 72, H - 40);

        for (let i = this.targets.length - 1; i >= 0; i--) {
          const t = this.targets[i];
          if (dist(this.luna.x, this.luna.y, t.x, t.y) < 30) {
            const pts = (t.bonus ? 35 : 20) * this.combo;
            this.addScore(pts);
            this.scorePopups.push({ x: t.x, y: t.y, text: "+" + pts, life: 1 });
            this.combo++;
            store.stats.bestLaserCombo = Math.max(store.stats.bestLaserCombo, this.combo);
            saveStats();
            if (this.score >= 400) this.queueAchievement("catWhisperer");
            if (this.combo >= 5) this.queueAchievement("pouncePerfect");
            if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
            audio.targetHit();
            this.luna.pawBat = 1;
            spawnParticleBurst(t.x, t.y, t.bonus ? [COLORS.gold, COLORS.softPink, "#FFF4C0"] : [COLORS.gold, COLORS.softPink], t.bonus ? 16 : 12, ["star", "heart"]);
            this.targets.splice(i, 1);
            this.fillTargets();
            break;
          }
        }
        /* tick score popups */
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
          this.scorePopups[i].life -= dt;
          this.scorePopups[i].y -= 40 * dt;
          if (this.scorePopups[i].life <= 0) this.scorePopups.splice(i, 1);
        }
      }
      drawInstructionIcon(c, x, y) {
        c.save();
        c.translate(x, y);
        c.strokeStyle = "#7A4E36";
        c.lineWidth = 3;
        rr(c, -26, -16, 52, 32, 10);
        c.stroke();
        c.beginPath();
        c.moveTo(-8, -2);
        c.lineTo(8, -2);
        c.lineTo(8, 10);
        c.stroke();
        c.beginPath();
        c.arc(22, -24, 6, 0, Math.PI * 2);
        c.fillStyle = "#D32F2F";
        c.fill();
        c.restore();
      }
      drawScene(c) {
        drawLaserBackdrop(c);

        for (const t of this.trail) {
          c.save();
          c.globalAlpha = clamp(t.life / 0.35, 0, 1) * 0.35;
          drawGlowCircle(c, t.x, t.y, 18, "rgba(255,0,0,ALPHA)", 0.18);
          c.restore();
        }

        for (const t of this.targets) {
          c.save();
          c.globalAlpha = t.fade;
          if (t.bonus) {
            drawGlowCircle(c, t.x, t.y, 42 + Math.sin(game.time * 5 + t.pulse) * 6, "rgba(255,182,193,ALPHA)", 0.24);
            drawGlowCircle(c, t.x, t.y, 30 + Math.sin(game.time * 5 + t.pulse) * 4, "rgba(255,215,0,ALPHA)", 0.26);
          } else {
            drawGlowCircle(c, t.x, t.y, 34 + Math.sin(game.time * 4 + t.pulse) * 4, "rgba(255,215,0,ALPHA)", 0.3);
          }
          c.fillStyle = t.bonus ? COLORS.softPink : COLORS.gold;
          c.beginPath();
          c.arc(t.x, t.y, t.bonus ? 22 : 20, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#FFF4C0";
          c.beginPath();
          c.arc(t.x, t.y, t.bonus ? 13 : 12, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        drawGlowCircle(c, game.mouse.x, game.mouse.y, 24, "rgba(255,0,0,ALPHA)", 0.24);
        c.fillStyle = "#D32F2F";
        c.beginPath();
        c.arc(game.mouse.x, game.mouse.y, 5, 0, Math.PI * 2);
        c.fill();

        drawLuna(c, this.luna.x, this.luna.y + 8, 0.96, {
          pose: "topdown",
          tail: Math.sin(game.time * 2.4),
          wiggle: this.luna.pounceTarget ? (game.time * 4 % 1) : 0,
          earTwitch: earSignal(game.time + 1.1),
          pounceStretch: this.luna.pounceTarget ? 0.9 : 0,
          pawBat: this.luna.pawBat
        });

        /* score popups */
        for (const sp of this.scorePopups) {
          c.save();
          c.globalAlpha = clamp(sp.life, 0, 1);
          c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.strokeStyle = "rgba(60,40,20,0.7)";
          c.lineWidth = 3;
          c.strokeText(sp.text, sp.x, sp.y);
          c.fillStyle = COLORS.gold;
          c.fillText(sp.text, sp.x, sp.y);
          c.restore();
        }

        c.fillStyle = "rgba(92,68,52,0.5)";
        c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "center";
        c.fillText(isMobile ? "Drag to move the laser dot" : "Follow the laser dot", W / 2, 34);
      }
      drawResultCharacter(c) {
        drawLuna(c, 400, 405, 1.55, {
          pose: "sit",
          tail: Math.sin(game.time * 2.2),
          earTwitch: earSignal(game.time),
          blink: blinkSignal(game.time + 1.5, 0.45)
        });
      }
    }

    SceneRegistry.register("laser", () => new LaserChaseScene());
