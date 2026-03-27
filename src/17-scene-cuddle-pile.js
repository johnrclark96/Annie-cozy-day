    class CuddlePileScene extends BaseMinigameScene {
      constructor() {
        super("cuddle", "Cuddle Pile", isMobile ? "Keep everyone balanced on the couch! Tap the LEFT and RIGHT buttons to shift Annie's weight!" : "Keep everyone balanced on the couch! Press LEFT and RIGHT arrow keys to shift Annie's weight!", [30, 60, 90], 90);
        this.balance = 0;
        this.balanceTarget = 0;
        this.eventTimer = 0;
        this.bubble = null;
        this.failedSide = null;
        this.winState = false;
        this.btnFlash = { left: 0, right: 0 };
      }
      enter() {
        super.enter();
        this.balance = 0;
        this.balanceTarget = 0;
        this.eventTimer = rand(3.8, 4.8);
        this.bubble = null;
        this.failedSide = null;
        this.winState = false;
        this.btnFlash = { left: 0, right: 0 };
      }
      extraInteractiveAt(x, y) {
        if (isMobile) {
          const ab = this.cuddleArrowButtons();
          return pointInRect(x, y, ab.left) || pointInRect(x, y, ab.right);
        }
        return false;
      }
      onGameClick(x, y) {
        if (isMobile) {
          const ab = this.cuddleArrowButtons();
          if (pointInRect(x, y, ab.left)) {
            this.balanceTarget = clamp(this.balanceTarget - 10, -100, 100);
            this.btnFlash.left = 0.2;
          } else if (pointInRect(x, y, ab.right)) {
            this.balanceTarget = clamp(this.balanceTarget + 10, -100, 100);
            this.btnFlash.right = 0.2;
          }
        }
      }
      onKeyDown(key) {
        if (key === "Escape") {
          if (this.phase === "instructions" || this.phase === "countdown") {
            audio.menu();
            transitionTo(SceneRegistry.create("hangout"));
          } else if (this.phase === "play") {
            this.paused = !this.paused;
          }
          return;
        }
        if (this.phase === "play") {
          if (key === " ") {
            this.paused = !this.paused;
            return;
          }
          if (key === "ArrowLeft") { this.balanceTarget = clamp(this.balanceTarget - 10, -100, 100); this.btnFlash.left = 0.2; }
          if (key === "ArrowRight") { this.balanceTarget = clamp(this.balanceTarget + 10, -100, 100); this.btnFlash.right = 0.2; }
        }
      }
      updatePlay(dt) {
        if (this.playHintTimer <= 0 && !this.playHint && this.score < 2) {
          this.playHint = { text: isMobile ? "Tap LEFT/RIGHT to keep balanced!" : "Press LEFT/RIGHT arrows to keep balanced!", life: 5 };
          this.playHintTimer = -1;
        }
        this.score = 90 - this.timeLeft;
        this.balance = lerp(this.balance, this.balanceTarget, dt * 6);
        this.btnFlash.left = Math.max(0, this.btnFlash.left - dt);
        this.btnFlash.right = Math.max(0, this.btnFlash.right - dt);
        if (this.bubble) {
          this.bubble.time -= dt;
          if (this.bubble.time <= 0) this.bubble = null;
        }
        const survived = this.score;
        let minGap = 4;
        let maxGap = 5;
        let shiftMin = 15;
        let shiftMax = 20;
        let allowDouble = false;
        if (survived >= 30) {
          minGap = 3;
          maxGap = 4;
          shiftMin = 20;
          shiftMax = 25;
        }
        if (survived >= 60) {
          minGap = 2;
          maxGap = 3;
          shiftMin = 20;
          shiftMax = 25;
          allowDouble = true;
        }
        this.eventTimer -= dt;
        if (this.eventTimer <= 0) {
          this.triggerFidget(shiftMin, shiftMax, allowDouble);
          this.eventTimer = rand(minGap, maxGap);
        }

        if (Math.abs(this.balance) >= 100) {
          this.failedSide = this.balance < 0 ? "obi" : "luna";
          this.phase = "ending";
          this.phaseTime = 0;
          return;
        }
        if (survived >= 90 && !this.winState) {
          this.winState = true;
          this.phase = "ending";
          this.phaseTime = 0;
          store.stats.bestCuddle = Math.max(store.stats.bestCuddle, 90);
          store.stats.cuddleWon = true;
          saveStats();
          this.queueAchievement("couchPotato");
          this.queueAchievement("maximumCozy");
          audio.lullaby();
          return;
        }
        if (survived >= 30) this.queueAchievement("couchPotato");
      }
      triggerFidget(shiftMin, shiftMax, allowDouble) {
        const obiLines = ["Obi dreams of squirrels!", "Obi stretches out!", "Obi rolls over!", "Obi kicks in his sleep!"];
        const lunaLines = ["Luna starts grooming!", "Luna kneads the cushion!", "Luna's tail goes wild!", "Luna stretches!"];
        const side = allowDouble && Math.random() < 0.18 ? "both" : (Math.random() < 0.5 ? "obi" : "luna");
        if (side === "obi" || side === "both") {
          const amount = -rand(shiftMin, shiftMax);
          this.balanceTarget = clamp(this.balanceTarget + amount, -100, 100);
          this.bubble = { who: "obi", text: obiLines[(Math.random() * obiLines.length) | 0], time: 1.2 };
        }
        if (side === "luna" || side === "both") {
          const amount = rand(shiftMin, shiftMax);
          this.balanceTarget = clamp(this.balanceTarget + amount, -100, 100);
          this.bubble = { who: side === "both" ? "both" : "luna", text: side === "both" ? "Double fidget chaos!" : lunaLines[(Math.random() * lunaLines.length) | 0], time: 1.2 };
        }
        audio.fidget();
      }
      updateEnding(dt) {
        this.phaseTime += dt;
        if (this.winState) {
          if (Math.random() < 0.4) spawnParticleBurst(rand(260, 540), rand(240, 420), [COLORS.softPink, COLORS.gold], 1, ["heart"]);
          if (this.phaseTime >= 2.3) {
            this.score = 90;
            this.finishGame();
          }
        } else if (this.phaseTime >= 1.3) {
          this.score = Math.floor(90 - this.timeLeft);
          this.finishGame();
        }
      }
      finishGame() {
        this.score = Math.round(this.score);
        this.resultsStars = this.calculateStars(this.score);
        this.newBest = setBest("cuddle", this.score);
        this.personalBest = store.best_cuddle;
        this.phase = "results";
        this.phaseTime = 0;
        this.scoreInT = 0;
        this.revealedStars = 0;
        this.starTimer = 0;
      }
      drawTopHud(c) {
        c.save();
        c.fillStyle = "rgba(92,68,52,0.82)";
        rr(c, 14, 12, 140, 42, 16);
        c.fill();
        rr(c, 200, 12, 430, 42, 16);
        c.fill();

        /* pause button */
        const pb = this.pauseButtonRect();
        const pbHover = pointInRect(game.mouse.x, game.mouse.y, pb);
        c.fillStyle = pbHover ? "rgba(92,68,52,0.92)" : "rgba(92,68,52,0.68)";
        rr(c, pb.x, pb.y, pb.w, pb.h, 12);
        c.fill();
        c.fillStyle = COLORS.cream;
        c.fillRect(pb.x + 13, pb.y + 10, 4, 16);
        c.fillRect(pb.x + 21, pb.y + 10, 4, 16);

        c.fillStyle = COLORS.cream;
        c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "left";
        c.fillText("Time: " + Math.floor(this.score) + "s", 28, 39);
        c.textAlign = "center";
        c.fillText("Balance Meter", 415, 39);
        c.strokeStyle = "#FFF8F0";
        c.lineWidth = 3;
        rr(c, 266, 22, 320, 20, 10);
        c.stroke();
        const markerX = lerp(276, 576, (this.balance + 100) / 200);
        c.fillStyle = "#7DB36C";
        rr(c, 270, 26, 152, 12, 6);
        c.fill();
        c.fillStyle = "#D39B6A";
        rr(c, 422, 26, 160, 12, 6);
        c.fill();
        c.fillStyle = COLORS.cream;
        c.beginPath();
        c.arc(markerX, 32, 10, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#7A4E36";
        c.stroke();
        c.restore();
      }
      cuddleArrowButtons() {
        return {
          left:  { x: 30,    y: H - 90, w: 110, h: 64 },
          right: { x: W - 140, y: H - 90, w: 110, h: 64 }
        };
      }
      drawScene(c) {
        drawLivingRoom(c, "cuddle");
        c.fillStyle = "rgba(255,255,255,0.06)";
        c.fillRect(0, 0, W, H);

        /* danger edge glow when balance is extreme */
        const absBal = Math.abs(this.balance);
        if (absBal > 60 && this.phase === "play" && !this.paused) {
          const danger = clamp((absBal - 60) / 40, 0, 1);
          const pulse = 0.12 + 0.08 * Math.sin(game.time * 6);
          const edgeAlpha = danger * pulse;
          const side = this.balance < 0 ? 0 : W;
          const grad = c.createLinearGradient(side, 0, side + (this.balance < 0 ? 120 : -120), 0);
          grad.addColorStop(0, `rgba(200,40,20,${edgeAlpha})`);
          grad.addColorStop(1, "rgba(200,40,20,0)");
          c.fillStyle = grad;
          c.fillRect(0, 0, W, H);
        }

        const tilt = this.balance / 100;

        c.save();
        c.translate(400, 330);
        c.rotate(tilt * 0.05);
        c.translate(-400, -330);

        drawObi(c, 300 + tilt * 14 + (this.failedSide === "obi" ? -this.phaseTime * 180 : 0), 360 + Math.abs(tilt) * 4 + (this.failedSide === "obi" ? this.phaseTime * 180 : 0), 1.04, this.winState ? {
          pose: "sleeping"
        } : {
          pose: "sit",
          expression: tilt < -0.45 ? "sad" : "happy",
          tail: Math.sin(game.time * 7) * (1 - Math.min(1, Math.abs(tilt))),
          bounce: 0.03 * Math.sin(game.time * 4)
        });

        drawAnnie(c, 402 + tilt * 8, 324, 1.22, this.winState ? {
          pose: "sleeping",
          breath: Math.sin(game.time * 1.5),
          blink: true,
          hairSway: Math.sin(game.time * 0.8),
          headTilt: 0.6
        } : {
          pose: "sit",
          breath: Math.sin(game.time * 2),
          blink: blinkSignal(game.time + 0.4, 0.6),
          hairSway: Math.sin(game.time * 1.2),
          headTilt: tilt * 0.25
        });

        drawLuna(c, 506 + tilt * 14 + (this.failedSide === "luna" ? this.phaseTime * 180 : 0), 352 + Math.abs(tilt) * 3 + (this.failedSide === "luna" ? this.phaseTime * 180 : 0), 1.02, this.winState ? {
          pose: "sleeping"
        } : {
          pose: "lounge",
          tail: Math.sin(game.time * 2.2),
          earTwitch: earSignal(game.time),
          blink: blinkSignal(game.time + 1.2, 0.45)
        });
        c.restore();

        c.fillStyle = "rgba(92,68,52,0.72)";
        c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "center";
        if (isMobile) {
          const ab = this.cuddleArrowButtons();
          const lHover = pointInRect(game.mouse.x, game.mouse.y, ab.left);
          const rHover = pointInRect(game.mouse.x, game.mouse.y, ab.right);
          const lFlash = this.btnFlash.left > 0;
          const rFlash = this.btnFlash.right > 0;
          c.fillStyle = lFlash ? "rgba(255,255,255,0.85)" : lHover ? "rgba(92,68,52,0.85)" : "rgba(92,68,52,0.55)";
          rr(c, ab.left.x, ab.left.y, ab.left.w, ab.left.h, 18);
          c.fill();
          c.fillStyle = rFlash ? "rgba(255,255,255,0.85)" : rHover ? "rgba(92,68,52,0.85)" : "rgba(92,68,52,0.55)";
          rr(c, ab.right.x, ab.right.y, ab.right.w, ab.right.h, 18);
          c.fill();
          c.font = '28px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillStyle = lFlash ? "#5C4434" : COLORS.cream;
          c.fillText("\u25C4 Left", ab.left.x + ab.left.w / 2, ab.left.y + 42);
          c.fillStyle = rFlash ? "#5C4434" : COLORS.cream;
          c.fillText("Right \u25BA", ab.right.x + ab.right.w / 2, ab.right.y + 42);
        } else {
          c.fillText("← Shift left", 150, 576);
          c.fillText("Shift right →", 650, 576);
        }

        if (this.bubble) {
          const bx = this.bubble.who === "obi" ? 258 : this.bubble.who === "luna" ? 556 : 400;
          const by = this.bubble.who === "obi" ? 270 : this.bubble.who === "luna" ? 244 : 230;
          drawTooltip(c, bx, by, "Fidget!", this.bubble.text, clamp(this.bubble.time / 1.2, 0, 1));
        }

        /* directional hint arrows (Update 13) */
        if (this.phase === "play" && !this.paused && Math.abs(this.balance) > 30) {
          const arrowAlpha = clamp((Math.abs(this.balance) - 30) / 40, 0, 0.6);
          const pulse = 0.7 + 0.3 * Math.sin(game.time * 4);
          const intensity = clamp((Math.abs(this.balance) - 30) / 70, 0, 1);
          const r = Math.floor(200 + 55 * intensity);
          const g2 = Math.floor(120 - 80 * intensity);
          const b = Math.floor(40 - 20 * intensity);
          c.save();
          c.globalAlpha = arrowAlpha * pulse;
          c.fillStyle = `rgb(${r},${g2},${b})`;
          if (this.balance < -30) {
            /* hint right */
            drawGlowCircle(c, 740, 300, 40, `rgba(${r},${g2},${b},ALPHA)`, 0.15);
            c.beginPath(); c.moveTo(720, 280); c.lineTo(760, 300); c.lineTo(720, 320); c.closePath(); c.fill();
            if (isMobile) {
              c.font = '16px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
              c.textAlign = "center";
              c.fillText("\u25BA", 740, 260);
            }
          } else {
            /* hint left */
            drawGlowCircle(c, 60, 300, 40, `rgba(${r},${g2},${b},ALPHA)`, 0.15);
            c.beginPath(); c.moveTo(80, 280); c.lineTo(40, 300); c.lineTo(80, 320); c.closePath(); c.fill();
            if (isMobile) {
              c.font = '16px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
              c.textAlign = "center";
              c.fillText("\u25C4", 60, 260);
            }
          }
          c.restore();
        }
      }
      drawEndingOverlay(c) {
        if (this.winState) {
          c.save();
          c.fillStyle = "rgba(255,248,240,0.18)";
          c.fillRect(0, 0, W, H);
          c.fillStyle = "#B84B3A";
          c.textAlign = "center";
          c.font = '42px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Maximum Cozy!", W / 2, 120);
          c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Everyone drifts into the happiest little cuddle nap.", W / 2, 154);
          c.restore();
        }
      }
      drawResultCharacter(c) {
        drawAnnie(c, 400, 416, 1.3, {
          pose: "sit",
          breath: Math.sin(game.time * 2),
          blink: blinkSignal(game.time, 0.6),
          hairSway: Math.sin(game.time * 1.1)
        });
        drawObi(c, 308, 426, 0.9, { pose: "sit", expression: "happy", tail: Math.sin(game.time * 8) });
        drawLuna(c, 500, 418, 0.88, { pose: "sit", tail: Math.sin(game.time * 2), earTwitch: earSignal(game.time) });
      }
    }

    SceneRegistry.register("cuddle", () => new CuddlePileScene());
