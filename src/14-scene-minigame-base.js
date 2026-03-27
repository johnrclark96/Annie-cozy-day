    class BaseMinigameScene extends BaseScene {
      constructor(gameId, title, instruction, thresholds, duration) {
        super(gameId);
        this.gameId = gameId;
        this.displayTitle = title;
        this.instruction = instruction;
        this.thresholds = thresholds;
        this.duration = duration;
        this.phase = "instructions";
        this.phaseTime = 0;
        this.timeLeft = duration;
        this.score = 0;
        this.scorePop = 0;
        this.combo = 1;
        this.hoveredButton = null;
        this.paused = false;
        this.achievementFreeze = 0;
        this.achievementBanner = null;
        this.newBest = false;
        this.resultsStars = 0;
        this.revealedStars = 0;
        this.starTimer = 0;
        this.scoreInT = 0;
        this.personalBest = 0;
        this.playHint = null;
        this.playHintTimer = 4;
      }
      enter() {
        this.phase = "instructions";
        this.phaseTime = 0;
        this.timeLeft = this.duration;
        this.score = 0;
        this.scorePop = 0;
        this.combo = 1;
        this.hoveredButton = null;
        this.paused = false;
        this.achievementFreeze = 0;
        this.achievementBanner = null;
        this.newBest = false;
        this.resultsStars = 0;
        this.revealedStars = 0;
        this.starTimer = 0;
        this.scoreInT = 0;
        this.personalBest = store["best_" + this.gameId] || 0;
      }
      resultsButtons() {
        return {
          playAgain: { x: 176, y: 500, w: 180, h: 58 },
          back: { x: 444, y: 500, w: 180, h: 58 }
        };
      }
      pauseButtons() {
        return {
          resume: { x: 270, y: 312, w: 120, h: 48 },
          quit: { x: 410, y: 312, w: 120, h: 48 }
        };
      }
      startCountdown() {
        this.phase = "countdown";
        this.phaseTime = 0;
      }
      startPlay() {
        this.phase = "play";
        this.phaseTime = 0;
      }
      update(dt) {
        super.update(dt);
        this.scorePop = Math.max(0, this.scorePop - dt * 4);
        if (this.achievementBanner) {
          this.achievementBanner.time -= dt;
          if (this.achievementBanner.time <= 0) this.achievementBanner = null;
        }
        if (this.phase === "instructions") {
          this.phaseTime += dt;
          if (this.phaseTime >= 3) this.startCountdown();
        } else if (this.phase === "countdown") {
          this.phaseTime += dt;
          if (this.phaseTime >= 4) this.startPlay();
        } else if (this.phase === "play") {
          if (!this.paused) {
            if (this.achievementFreeze > 0) {
              this.achievementFreeze -= dt;
            } else {
              this.timeLeft = Math.max(0, this.timeLeft - dt);
              this.updatePlay(dt);
              /* first-play hint timer */
              if (this.playHint) {
                this.playHint.life -= dt;
                if (this.playHint.life <= 0) this.playHint = null;
              } else if (this.playHintTimer > 0) {
                this.playHintTimer -= dt;
              }
              if (this.timeLeft <= 0) this.finishGame();
            }
          }
        } else if (this.phase === "ending") {
          this.updateEnding(dt);
        } else if (this.phase === "results") {
          this.phaseTime += dt;
          this.scoreInT = Math.min(1, this.phaseTime / 0.45);
          if (this.revealedStars < this.resultsStars) {
            this.starTimer += dt;
            if (this.starTimer >= 0.3) {
              this.starTimer = 0;
              this.revealedStars++;
              audio.tinyChime();
            }
          }
        }
      }
      updatePlay() {}
      updateEnding(dt) {
        this.phaseTime += dt;
        if (this.phaseTime > 1.2) this.finishGame();
      }
      addScore(value) {
        this.score += value;
        this.scorePop = 1;
      }
      onMouseMove(x, y) {
        this.hoveredButton = null;
        if (this.phase === "results") {
          const btns = this.resultsButtons();
          if (pointInRect(x, y, btns.playAgain)) this.hoveredButton = "again";
          else if (pointInRect(x, y, btns.back)) this.hoveredButton = "back";
        } else if (this.phase === "play" && this.paused) {
          const btns = this.pauseButtons();
          if (pointInRect(x, y, btns.resume)) this.hoveredButton = "resume";
          else if (pointInRect(x, y, btns.quit)) this.hoveredButton = "quit";
        }
      }
      interactiveAt(x, y) {
        if (this.phase === "results") {
          const b = this.resultsButtons();
          return pointInRect(x, y, b.playAgain) || pointInRect(x, y, b.back);
        }
        if (this.phase === "instructions") return true;
        if (this.phase === "countdown") return pointInRect(x, y, this.pauseButtonRect());
        if (this.phase === "play" && this.paused) {
          const b = this.pauseButtons();
          return pointInRect(x, y, b.resume) || pointInRect(x, y, b.quit);
        }
        if (this.phase === "play" && pointInRect(x, y, this.pauseButtonRect())) return true;
        return this.extraInteractiveAt ? this.extraInteractiveAt(x, y) : false;
      }
      onClick(x, y) {
        if (this.phase === "instructions") {
          audio.menu();
          this.startCountdown();
          return;
        }
        if (this.phase === "results") {
          const btns = this.resultsButtons();
          if (pointInRect(x, y, btns.playAgain)) {
            audio.menu();
            transitionTo(this.createReplay());
          } else if (pointInRect(x, y, btns.back)) {
            audio.menu();
            transitionTo(SceneRegistry.create("hangout"));
          }
          return;
        }
        if (this.phase === "play" && this.paused) {
          const btns = this.pauseButtons();
          if (pointInRect(x, y, btns.resume)) {
            audio.menu();
            this.paused = false;
          } else if (pointInRect(x, y, btns.quit)) {
            audio.menu();
            transitionTo(SceneRegistry.create("hangout"));
          }
          return;
        }
        if (this.phase === "countdown" && pointInRect(x, y, this.pauseButtonRect())) {
          audio.menu();
          transitionTo(SceneRegistry.create("hangout"));
          return;
        }
        if (this.phase === "play") {
          if (pointInRect(x, y, this.pauseButtonRect())) {
            audio.menu();
            this.paused = true;
            return;
          }
          this.onGameClick(x, y);
        }
      }
      onGameClick() {}
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
        if (this.phase === "play" && key === " ") {
          this.paused = !this.paused;
        }
      }
      calculateStars(finalScore) {
        let stars = 0;
        if (finalScore >= this.thresholds[0]) stars = 1;
        if (finalScore >= this.thresholds[1]) stars = 2;
        if (finalScore >= this.thresholds[2]) stars = 3;
        return stars;
      }
      finishGame() {
        const finalScore = Math.round(this.gameId === "cuddle" ? this.score : this.score);
        this.resultsStars = this.calculateStars(finalScore);
        this.newBest = setBest(this.gameId, finalScore);
        this.personalBest = store["best_" + this.gameId] || finalScore;
        this.phase = "results";
        this.phaseTime = 0;
        this.scoreInT = 0;
        this.revealedStars = 0;
        this.starTimer = 0;
        this.confettiFired = false;
      }
      createReplay() {
        return SceneRegistry.create(this.gameId);
      }
      queueAchievement(key) {
        if (store.achievements[key]) return;
        store.achievements[key] = true;
        saveAchievements();
        const info = ACHIEVEMENTS.find((a) => a.key === key);
        if (info) {
          this.achievementFreeze = Math.max(this.achievementFreeze, 0.5);
          this.achievementBanner = { name: info.name, time: 1.25, maxTime: 1.25 };
          audio.achievement();
          spawnParticleBurst(W / 2, 42, [COLORS.gold, COLORS.softPink], 12, ["star", "heart"]);
        }
      }
      drawTopHud(c, showCombo = true) {
        c.save();
        c.fillStyle = "rgba(92,68,52,0.82)";
        rr(c, 14, 12, 130, 42, 16);
        c.fill();
        rr(c, W - 146, 12, 132, showCombo ? 70 : 42, 16);
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
        c.fillText("Time: " + Math.ceil(this.timeLeft), 28, 39);

        c.save();
        const scoreScale = 1 + this.scorePop * 0.2;
        c.translate(W - 80, 35);
        c.scale(scoreScale, scoreScale);
        c.fillStyle = COLORS.cream;
        c.textAlign = "center";
        c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Score " + Math.round(this.score), 0, 0);
        c.restore();

        if (showCombo) {
          c.fillStyle = "#FFEAA7";
          c.textAlign = "center";
          c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Combo x" + this.combo, W - 80, 59);
        }
        c.restore();
      }
      pauseButtonRect() { return { x: 152, y: 16, w: 38, h: 36 }; }
      drawInstructionCard(c, iconFn) {
        c.save();
        c.fillStyle = "rgba(92,68,52,0.22)";
        c.fillRect(0, 0, W, H);
        rr(c, 145, 150, 510, 260, 24);
        c.fillStyle = "rgba(255,248,240,0.97)";
        c.fill();
        c.strokeStyle = "rgba(92,68,52,0.18)";
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = "#7A4E36";
        c.textAlign = "center";
        c.font = '32px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText(this.displayTitle, W / 2, 198);
        c.font = '20px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        wrapText(c, this.instruction, W / 2, 252, 410, 30);
        if (iconFn) iconFn(c, W / 2, 320);
        c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillStyle = "#A06B4F";
        c.fillText(isMobile ? "Tap to begin" : "Click to begin early  •  Esc to go back", W / 2, 376);
        c.restore();
      }
      drawCountdown(c) {
        const t = this.phaseTime;
        let text = "3";
        if (t >= 1 && t < 2) text = "2";
        else if (t >= 2 && t < 3) text = "1";
        else if (t >= 3) text = "GO!";
        const local = t % 1;
        const scale = 1 + 0.2 * (1 - local);
        c.save();
        c.fillStyle = "rgba(92,68,52,0.22)";
        c.fillRect(0, 0, W, H);
        c.translate(W / 2, H / 2);
        c.scale(scale, scale);
        c.fillStyle = "#FFF8F0";
        c.strokeStyle = "#7A4E36";
        c.lineWidth = 8;
        c.textAlign = "center";
        c.font = '64px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.strokeText(text, 0, 0);
        c.fillText(text, 0, 0);
        c.restore();
      }
      drawPause(c) {
        c.save();
        c.fillStyle = "rgba(0,0,0,0.5)";
        c.fillRect(0, 0, W, H);
        c.fillStyle = "#FFF8F0";
        c.textAlign = "center";
        c.font = '52px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("PAUSED", W / 2, 230);
        c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText(isMobile ? "Choose an option below" : "Press Space or Esc to resume", W / 2, 262);
        const btns = this.pauseButtons();
        drawButton(c, btns.resume, "Resume", this.hoveredButton === "resume", "#7DB36C");
        drawButton(c, btns.quit, "Quit", this.hoveredButton === "quit", "#B86A58");
        c.restore();
      }
      drawResults(c, characterDraw) {
        c.save();
        c.fillStyle = "rgba(255,248,240,0.82)";
        c.fillRect(0, 0, W, H);

        /* confetti burst on 3 stars */
        if (this.resultsStars >= 3 && this.revealedStars >= 3 && !this.confettiFired) {
          this.confettiFired = true;
          const confettiColors = [COLORS.gold, COLORS.softPink, "#87CEEB", "#A8D870", "#FFB347", "#FF8FAA", "#C39BD3"];
          for (let i = 0; i < 40; i++) {
            game.particles.push({
              x: W / 2 + rand(-200, 200), y: rand(50, 200),
              vx: rand(-120, 120), vy: rand(-180, 40),
              life: rand(1.5, 3), maxLife: 3,
              size: rand(4, 8), rot: rand(0, 6.28), vr: rand(-5, 5),
              shape: Math.random() < 0.5 ? "star" : "heart",
              color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
            });
          }
          audio.achievement();
        }

        c.fillStyle = "#7A4E36";
        c.textAlign = "center";
        c.font = '38px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText(this.displayTitle + " Results", W / 2, 88);

        const scoreScale = easeOutBack(clamp(this.scoreInT, 0, 1));
        c.save();
        c.translate(W / 2, 166);
        c.scale(scoreScale, scoreScale);
        c.fillStyle = "#B84B3A";
        c.font = '54px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText(Math.round(this.score), 0, 0);
        c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillStyle = "#8A6045";
        c.fillText("Score", 0, 34);
        c.restore();

        c.fillStyle = "#8A6045";
        c.font = '17px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Personal Best  ★  " + this.personalBest, W / 2, 210);

        if (this.newBest) {
          const bestPulse = 1 + Math.sin(game.time * 4) * 0.04;
          c.save();
          c.translate(W / 2, 246);
          c.scale(bestPulse, bestPulse);
          rr(c, -120, -21, 240, 42, 18);
          c.fillStyle = "#E2B83B";
          c.fill();
          c.strokeStyle = "rgba(255,255,255,0.4)";
          c.lineWidth = 2;
          c.stroke();
          c.fillStyle = "#FFF8F0";
          c.font = '19px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.fillText("✦ New Personal Best! ✦", 0, 6);
          c.restore();
        }

        for (let i = 0; i < 3; i++) {
          const revealed = i < this.revealedStars;
          const t = revealed ? easeOutBack(clamp((this.phaseTime - i * 0.3) / 0.28, 0, 1)) : 0;
          c.save();
          c.translate(W / 2 - 64 + i * 64, 310);
          c.scale(t, t);
          if (revealed) {
            drawGlowCircle(c, 0, 0, 28, "rgba(255,215,0,ALPHA)", 0.15);
          }
          drawStar(c, 0, 0, 22, revealed ? COLORS.gold : "#D3C8B4");
          c.restore();
        }

        /* celebration message for 3 stars */
        if (this.resultsStars >= 3 && this.revealedStars >= 3) {
          c.save();
          c.globalAlpha = clamp(this.phaseTime - 1.2, 0, 1);
          c.fillStyle = COLORS.gold;
          c.textAlign = "center";
          c.font = '16px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText("Perfect score! Amazing!", W / 2, 348);
          c.restore();
        }

        characterDraw(c);

        const btns = this.resultsButtons();
        drawButton(c, btns.playAgain, "Play Again", this.hoveredButton === "again", "#7DB36C");
        drawButton(c, btns.back, "Back", this.hoveredButton === "back", "#B86A58");
        c.restore();
      }
      draw(c) {
        this.drawScene(c);
        this.drawTopHud(c, true);
        if (this.phase === "instructions") this.drawInstructionCard(c, this.drawInstructionIcon.bind(this));
        else if (this.phase === "countdown") this.drawCountdown(c);
        else if (this.phase === "play" && this.paused) this.drawPause(c);
        else if (this.phase === "results") this.drawResults(c, this.drawResultCharacter.bind(this));
        else if (this.phase === "ending") this.drawEndingOverlay(c);
        /* first-play hint */
        if (this.playHint && this.phase === "play") {
          c.save();
          c.globalAlpha = clamp(this.playHint.life / 0.5, 0, 1) * 0.85;
          c.fillStyle = "rgba(255,248,240,0.88)";
          rr(c, W/2 - 180, H - 60, 360, 34, 14);
          c.fill();
          c.fillStyle = "#7A4E36";
          c.textAlign = "center";
          c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.fillText(this.playHint.text, W/2, H - 38);
          c.restore();
        }
        drawAchievementBanner(c, this.achievementBanner);
      }
      drawScene() {}
      drawInstructionIcon() {}
      drawResultCharacter() {}
      drawEndingOverlay() {}
    }
