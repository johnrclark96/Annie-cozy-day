    /* ═══════════════════════════════════════════════════════
       Luna's Nap Spot — place cushions in drifting sunbeams
       ═══════════════════════════════════════════════════════ */
    class LunaNapScene extends BaseMinigameScene {
      constructor() {
        super("nap", "Luna's Nap Spot", isMobile ? "Tap to place cushions in the sunbeams! Luna will nap on the coziest spot." : "Click to place cushions in the sunbeams! Luna will nap on the coziest spot.", [250, 550, 1000], 60);
        this.beams = [];
        this.cushions = [];
        this.luna = { x: 400, y: 350, targetX: 400, targetY: 350, napping: false, napTimer: 0, facing: 1 };
        this.scoreRate = 0;
        this.napParticleTimer = 0;
        this.maxCushions = 3;
      }
      enter() {
        super.enter();
        this.beams = [];
        this.cushions = [];
        this.luna = { x: 400, y: 350, targetX: 400, targetY: 350, napping: false, napTimer: 0, facing: 1 };
        this.scoreRate = 0;
        this.napParticleTimer = 0;
        this.spawnBeams();
      }
      spawnBeams() {
        this.beams = [];
        const count = 2 + Math.floor((this.duration - this.timeLeft) / 20);
        for (let i = 0; i < Math.min(count, 4); i++) {
          this.beams.push({
            x: rand(120, W - 120),
            y: rand(200, 450),
            w: rand(90, 140),
            h: rand(100, 160),
            vx: rand(-15, 15),
            vy: rand(-5, 5),
            phase: rand(0, Math.PI * 2),
            life: rand(8, 14)
          });
        }
      }
      extraInteractiveAt() { return true; }
      onGameClick(x, y) {
        if (y < 100) return;
        /* place or remove cushion */
        /* check if clicking an existing cushion to pick it up */
        for (let i = this.cushions.length - 1; i >= 0; i--) {
          if (dist(x, y, this.cushions[i].x, this.cushions[i].y) < 30) {
            this.cushions.splice(i, 1);
            audio.menu();
            return;
          }
        }
        if (this.cushions.length >= this.maxCushions) {
          /* remove oldest with visual feedback */
          const old = this.cushions.shift();
          spawnParticleBurst(old.x, old.y - 6, ["rgba(200,170,210,0.6)"], 3, ["star"]);
        }
        this.cushions.push({ x, y, warmth: 0 });
        audio.tinyChime();
        spawnParticleBurst(x, y - 10, ["#FFF4C0"], 4, ["star"]);
      }
      updatePlay(dt) {
        if (this.playHintTimer <= 0 && !this.playHint && this.cushions.length === 0) {
          this.playHint = { text: isMobile ? "Tap in the bright spots to place cushions!" : "Click in the bright spots to place cushions!", life: 5 };
          this.playHintTimer = -1;
        }
        /* update sunbeams */
        for (let i = this.beams.length - 1; i >= 0; i--) {
          const b = this.beams[i];
          b.x += b.vx * dt + Math.sin(game.time * 0.5 + b.phase) * 8 * dt;
          b.y += b.vy * dt + Math.cos(game.time * 0.3 + b.phase) * 4 * dt;
          b.x = clamp(b.x, 60, W - 60);
          b.y = clamp(b.y, 150, 480);
          b.life -= dt;
          if (b.life <= 0) {
            this.beams.splice(i, 1);
          }
        }
        /* respawn beams */
        const targetCount = 2 + Math.floor((this.duration - this.timeLeft) / 18);
        while (this.beams.length < Math.min(targetCount, 4)) {
          this.beams.push({
            x: rand(120, W - 120),
            y: rand(200, 450),
            w: rand(90, 140),
            h: rand(100, 160),
            vx: rand(-15, 15),
            vy: rand(-5, 5),
            phase: rand(0, Math.PI * 2),
            life: rand(8, 14)
          });
        }

        /* calculate cushion warmth */
        for (const cu of this.cushions) {
          cu.warmth = 0;
          for (const b of this.beams) {
            const dx = Math.abs(cu.x - b.x) / (b.w * 0.5);
            const dy = Math.abs(cu.y - b.y) / (b.h * 0.5);
            if (dx < 1 && dy < 1) {
              cu.warmth += (1 - dx) * (1 - dy);
            }
          }
        }

        /* find best cushion */
        let bestCushion = null;
        let bestWarmth = 0.2;
        for (const cu of this.cushions) {
          if (cu.warmth > bestWarmth) { bestWarmth = cu.warmth; bestCushion = cu; }
        }

        /* Luna behavior */
        if (bestCushion) {
          this.luna.targetX = bestCushion.x;
          this.luna.targetY = bestCushion.y;
          const d = dist(this.luna.x, this.luna.y, bestCushion.x, bestCushion.y);
          if (d < 20 && bestCushion.warmth > 0.3) {
            if (!this.luna.napping) {
              this.luna.napping = true;
              this.luna.napTimer = 0;
            }
            this.luna.napTimer += dt;
            this.scoreRate = bestCushion.warmth * 3;
            this.addScore(this.scoreRate * dt * 10);
            this.napParticleTimer -= dt;
            if (this.napParticleTimer <= 0) {
              this.napParticleTimer = 0.8;
              spawnParticleBurst(this.luna.x, this.luna.y - 30, [COLORS.softPink, "#FFF4C0"], 2, ["heart"]);
            }
          } else {
            this.luna.napping = false;
            this.luna.napTimer = 0;
            this.scoreRate = 0;
          }
        } else {
          this.luna.targetX = 400 + Math.sin(game.time * 0.8) * 100;
          this.luna.targetY = 350;
          this.luna.napping = false;
          this.luna.napTimer = 0;
          this.scoreRate = 0;
        }

        /* move Luna */
        if (!this.luna.napping) {
          const dx = this.luna.targetX - this.luna.x;
          const dy = this.luna.targetY - this.luna.y;
          const d = Math.hypot(dx, dy);
          if (d > 3) {
            const speed = 90;
            this.luna.x += dx / d * speed * dt;
            this.luna.y += dy / d * speed * dt;
            this.luna.facing = dx >= 0 ? 1 : -1;
          }
        }
        this.luna.x = clamp(this.luna.x, 60, W - 60);
        this.luna.y = clamp(this.luna.y, 160, 500);

        if (this.score >= 400) this.queueAchievement("napMaster");
      }
      drawInstructionIcon(c, x, y) {
        drawHeart(c, x, y, 1.2, COLORS.softPink);
      }
      drawScene(c) {
        drawLivingRoom(c);
        c.fillStyle = "rgba(255,250,240,0.04)";
        c.fillRect(0, 0, W, H);

        /* sunbeams with dust motes */
        for (const b of this.beams) {
          const fadeEdge = clamp(b.life / 2, 0, 1);
          c.save();
          /* warm glow area */
          c.globalAlpha = 0.40 * fadeEdge;
          const g = c.createRadialGradient(b.x, b.y - b.h * 0.3, 10, b.x, b.y, Math.max(b.w, b.h) * 0.7);
          g.addColorStop(0, "rgba(255,235,150,1)");
          g.addColorStop(0.4, "rgba(255,225,120,0.6)");
          g.addColorStop(1, "rgba(255,210,80,0)");
          c.fillStyle = g;
          c.fillRect(b.x - b.w, b.y - b.h, b.w * 2, b.h * 2);

          /* beam shaft from top — visible light column */
          c.globalAlpha = 0.16 * fadeEdge;
          c.fillStyle = "rgba(255,235,140,1)";
          c.beginPath();
          c.moveTo(b.x - b.w * 0.25, 0);
          c.lineTo(b.x + b.w * 0.25, 0);
          c.lineTo(b.x + b.w * 0.55, b.y + b.h * 0.4);
          c.lineTo(b.x - b.w * 0.55, b.y + b.h * 0.4);
          c.closePath();
          c.fill();

          /* bright center spot on floor */
          c.globalAlpha = 0.25 * fadeEdge;
          c.fillStyle = "rgba(255,240,160,0.8)";
          c.beginPath();
          c.ellipse(b.x, b.y, b.w * 0.45, b.h * 0.25, 0, 0, Math.PI * 2);
          c.fill();

          /* floating dust motes in beam */
          c.globalAlpha = 0.55 * fadeEdge;
          c.fillStyle = "rgba(255,245,200,0.95)";
          for (let m = 0; m < 7; m++) {
            const mx = b.x + Math.sin(game.time * 0.7 + m * 2.3 + b.phase) * b.w * 0.4;
            const my = b.y + Math.cos(game.time * 0.5 + m * 1.7 + b.phase) * b.h * 0.35 - b.h * 0.15;
            const mr = 2.0 + Math.sin(game.time * 1.5 + m) * 1.0;
            c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
          }
          c.restore();
        }

        /* cushions with warmth indicators */
        for (const cu of this.cushions) {
          c.save();
          c.translate(cu.x, cu.y);
          const warm = clamp(cu.warmth, 0, 1);
          /* cushion shadow */
          c.fillStyle = "rgba(0,0,0,0.08)";
          c.beginPath(); c.ellipse(2, 6, 28, 10, 0, 0, Math.PI * 2); c.fill();
          /* cushion body - shifts from cool purple to warm golden */
          if (warm > 0.3) {
            const r = Math.round(200 + warm * 55);
            const g = Math.round(180 + warm * 60);
            const b = Math.round(160 + warm * 40);
            c.fillStyle = `rgb(${r},${g},${b})`;
          } else {
            c.fillStyle = "#C8ACD8";
          }
          c.beginPath(); c.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2); c.fill();
          /* cushion highlight */
          c.fillStyle = "rgba(255,255,255,0.3)";
          c.beginPath(); c.ellipse(-4, -4, 14, 7, -0.3, 0, Math.PI * 2); c.fill();
          /* warmth glow */
          if (warm > 0.2) {
            c.globalAlpha = warm * 0.35;
            drawGlowCircle(c, 0, 0, 34, "rgba(255,230,150,ALPHA)", 0.3);
          } else {
            /* cool indicator - subtle pulse to hint "move me" */
            c.globalAlpha = 0.15 + Math.sin(game.time * 3) * 0.08;
            c.strokeStyle = "#9880B0";
            c.lineWidth = 1.5;
            c.setLineDash([4, 4]);
            c.beginPath(); c.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2); c.stroke();
            c.setLineDash([]);
          }
          c.restore();
        }

        /* Luna */
        drawLuna(c, this.luna.x, this.luna.y, 1.05, {
          pose: this.luna.napping ? "sleeping" : (dist(this.luna.x, this.luna.y, this.luna.targetX, this.luna.targetY) > 10 ? "topdown" : "sit"),
          tail: Math.sin(game.time * (this.luna.napping ? 0.8 : 2.2)),
          earTwitch: earSignal(game.time),
          blink: this.luna.napping ? true : blinkSignal(game.time + 1.2, 0.45),
          facing: this.luna.facing
        });

        /* cozy meter display */
        if (this.scoreRate > 0 && this.luna.napping) {
          c.save();
          c.globalAlpha = 0.8;
          c.fillStyle = "#FFF8F0";
          c.strokeStyle = "#8A6045";
          c.lineWidth = 2;
          c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          const cozyLabel = this.scoreRate > 2 ? "Maximum Cozy!" : this.scoreRate > 1 ? "Very Cozy!" : "Cozy!";
          c.strokeText(cozyLabel, this.luna.x, this.luna.y - 60);
          c.fillText(cozyLabel, this.luna.x, this.luna.y - 60);
          c.restore();
        }

        /* HUD hint */
        c.fillStyle = "rgba(92,68,52,0.5)";
        c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "center";
        c.fillText("Cushions: " + this.cushions.length + " / " + this.maxCushions + "  •  " + (isMobile ? "Tap" : "Click") + " to place or pick up", W / 2, 580);
      }
      drawResultCharacter(c) {
        drawLuna(c, 400, 410, 1.4, { pose: "sleeping", tail: Math.sin(game.time * 0.8), earTwitch: 0, blink: true });
      }
    }

    SceneRegistry.register("nap", () => new LunaNapScene());
