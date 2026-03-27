    class TreatTossScene extends BaseMinigameScene {
      constructor() {
        super("treat", "Treat Toss", isMobile ? "Tap to toss treats to Obi! Consecutive catches build combos!" : "Click to toss treats to Obi! Consecutive catches build combos!", [300, 700, 1400], 60);
        this.treat = null;
        this.obiX = 120;
        this.obiPhase = 0;
        this.obiSpeed = 1;
        this.obiFacing = 1;
        this.catches = 0;
        this.goldenReady = false;
        this.happyTimer = 0;
        this.sadTimer = 0;
        this.rampStep = 0;
        this.perfectTimer = 0;
        this.goldenFlash = 0;
        this.missTimer = 0;
        this.speedUpTimer = 0;
      }
      enter() {
        super.enter();
        this.treat = null;
        this.obiX = 140;
        this.obiPhase = 0;
        this.obiSpeed = 1;
        this.obiFacing = 1;
        this.catches = 0;
        this.goldenReady = false;
        this.happyTimer = 0;
        this.sadTimer = 0;
        this.rampStep = 0;
        this.perfectTimer = 0;
        this.goldenFlash = 0;
        this.missTimer = 0;
        this.speedUpTimer = 0;
      }
      extraInteractiveAt() { return true; }
      onGameClick(x) {
        if (this.treat) return;
        const spawnX = W / 2 + 22;
        const spawnY = 104;
        const flight = 0.92;
        this.treat = {
          x: spawnX,
          y: spawnY,
          vx: (x - spawnX) / flight,
          vy: 30,
          gravity: 640,
          bounced: false,
          fade: 1,
          fading: false,
          golden: this.goldenReady
        };
        if (this.goldenReady) this.goldenReady = false;
        audio.menu();
      }
      updatePlay(dt) {
        if (this.playHintTimer <= 0 && !this.playHint && this.score === 0 && !this.treat) {
          this.playHint = { text: isMobile ? "Tap anywhere to toss a treat!" : "Click anywhere to toss a treat!", life: 5 };
          this.playHintTimer = -1;
        }
        const elapsed = this.duration - this.timeLeft;
        const newRamp = Math.floor(elapsed / 15);
        if (newRamp > this.rampStep) {
          this.rampStep = newRamp;
          this.obiSpeed = Math.pow(1.15, this.rampStep);
          this.speedUpTimer = 1.0;
          audio.pounce();
        }

        this.perfectTimer = Math.max(0, this.perfectTimer - dt);
        this.missTimer = Math.max(0, this.missTimer - dt);
        this.speedUpTimer = Math.max(0, this.speedUpTimer - dt);
        this.goldenFlash = Math.max(0, this.goldenFlash - dt);
        this.obiPhase += dt * (1.2 * this.obiSpeed);
        const prevX = this.obiX;
        this.obiX = 400 + Math.sin(this.obiPhase) * 250;
        this.obiFacing = this.obiX >= prevX ? 1 : -1;
        this.happyTimer = Math.max(0, this.happyTimer - dt);
        this.sadTimer = Math.max(0, this.sadTimer - dt);

        if (this.treat) {
          this.treat.x += this.treat.vx * dt;
          this.treat.y += this.treat.vy * dt;
          this.treat.vy += this.treat.gravity * dt;

          const obiY = 495;
          const catchX = this.obiX;
          if (!this.treat.fading && Math.abs(this.treat.x - catchX) < 48 && Math.abs(this.treat.y - obiY) < 44) {
            let value = (this.treat.golden ? 50 : 10) * this.combo;
            const perfect = Math.abs(this.treat.x - catchX) < 16 && Math.abs(this.treat.y - obiY) < 18;
            if (perfect) {
              value += 5 * this.combo;
              this.perfectTimer = 0.8;
              spawnParticleBurst(this.obiX, 454, [COLORS.gold, "#FFF4C0"], 12, ["star"]);
            }
            this.addScore(value);
            this.catches++;
            store.stats.totalTreatCatches++;
            store.stats.bestTreatCombo = Math.max(store.stats.bestTreatCombo, this.combo);
            saveStats();
            if (store.stats.totalTreatCatches >= 30) this.queueAchievement("obiBestFriend");
            this.combo++;
            if (this.combo >= 10) this.queueAchievement("comboStar");
            if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
            this.happyTimer = 0.45;
            this.treat = null;
            if (this.catches > 0 && this.catches % 20 === 0) {
              this.goldenReady = true;
              this.goldenFlash = 1.2;
            }
            audio.catch();
            if (this.combo >= 5) screenShake(2, 0.12);
            spawnParticleBurst(this.obiX, 470, [COLORS.softPink, COLORS.gold], this.combo >= 3 ? 14 : 10, ["heart", "star"]);
            return;
          }

          const groundY = 525;
          if (!this.treat.fading && this.treat.y >= groundY) {
            if (!this.treat.bounced) {
              this.treat.bounced = true;
              this.treat.y = groundY;
              this.treat.vy *= -0.38;
            } else {
              this.treat.fading = true;
              this.treat.y = groundY;
              this.treat.vx *= 0.2;
              this.treat.vy = 0;
              this.combo = 1;
              this.sadTimer = 0.6;
              this.missTimer = 0.7;
              audio.miss();
            }
          }

          if (this.treat.fading) {
            this.treat.fade -= dt * 3.3;
            if (this.treat.fade <= 0) this.treat = null;
          }
        }
      }
      drawInstructionIcon(c, x, y) {
        c.save();
        c.translate(x, y);
        c.strokeStyle = "#7A4E36";
        c.lineWidth = 3;
        rr(c, -26, -16, 52, 32, 8);
        c.stroke();
        c.beginPath();
        c.moveTo(0, 18);
        c.lineTo(0, 38);
        c.stroke();
        c.beginPath();
        c.arc(-6, -2, 4, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      drawScene(c) {
        drawTreatBackdrop(c);

        if (!this.treat && this.phase === "play" && !this.paused) {
          drawAimPreview(c, W / 2 + 18, 98, game.mouse.x);
        }

        drawAnnie(c, 400, 120, 1.34, {
          pose: "upper",
          breath: Math.sin(game.time * 2),
          blink: blinkSignal(game.time + 0.3, 0.6),
          hairSway: Math.sin(game.time * 1.1),
          armRaise: this.treat ? 0.8 : 0.2
        });

        drawObi(c, this.obiX, 496, 1.02, {
          pose: "run",
          expression: this.sadTimer > 0 ? "sad" : (this.happyTimer > 0 ? "excited" : "happy"),
          tail: Math.sin(game.time * (this.happyTimer > 0 ? 12 : 7)),
          facing: this.obiFacing,
          bounce: this.happyTimer > 0 ? 0.14 * Math.sin(game.time * 18) : 0.06 * Math.sin(game.time * 8),
          earDroop: this.sadTimer > 0 ? 0.8 : 0
        });

        if (this.treat) {
          c.save();
          c.globalAlpha = this.treat.fade;
          if (this.treat.golden) {
            drawGlowCircle(c, this.treat.x, this.treat.y, 24, "rgba(255,215,0,ALPHA)", 0.22);
            spawnTrail(this.treat.x, this.treat.y, COLORS.gold);
          }
          drawBone(c, this.treat.x, this.treat.y, 22, 10, this.treat.golden ? COLORS.gold : "#8D5A2B");
          c.restore();
        }

        if (this.goldenReady) {
          const pulse = 1 + Math.sin(game.time * 8) * 0.04;
          c.save();
          c.translate(400, 76);
          c.scale(pulse, pulse);
          rr(c, -102, -20, 204, 38, 18);
          c.fillStyle = "rgba(255,215,0,0.92)";
          c.fill();
          c.fillStyle = "#7A4E36";
          c.textAlign = "center";
          c.font = '16px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Golden Bone Ready!", 0, 5);
          c.restore();
        }

        if (this.perfectTimer > 0) {
          c.save();
          c.globalAlpha = clamp(this.perfectTimer / 0.8, 0, 1);
          c.fillStyle = "#FFF4C0";
          c.strokeStyle = "#7A4E36";
          c.lineWidth = 5;
          c.font = '26px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.strokeText("Perfect Catch!", 400, 118);
          c.fillText("Perfect Catch!", 400, 118);
          c.restore();
        }
        if (this.missTimer > 0) {
          c.save();
          c.globalAlpha = clamp(this.missTimer / 0.4, 0, 1);
          c.fillStyle = COLORS.warmRed;
          c.strokeStyle = "rgba(255,255,255,0.7)";
          c.lineWidth = 4;
          c.font = '22px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.strokeText("Miss!", 400, 118);
          c.fillText("Miss!", 400, 118);
          c.restore();
        }
        if (this.speedUpTimer > 0) {
          c.save();
          c.globalAlpha = clamp(this.speedUpTimer / 0.5, 0, 1);
          c.fillStyle = "#E88A20";
          c.strokeStyle = "rgba(255,255,255,0.6)";
          c.lineWidth = 3;
          c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.strokeText("Obi speeds up!", 400, 150);
          c.fillText("Obi speeds up!", 400, 150);
          c.restore();
        }
      }
      drawResultCharacter(c) {
        drawObi(c, 400, 405, 1.45, {
          pose: "sit",
          expression: "excited",
          tail: Math.sin(game.time * 10),
          bounce: 0.08 * Math.sin(game.time * 8)
        });
      }
    }

    SceneRegistry.register("treat", () => new TreatTossScene());
