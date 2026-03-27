    class WheresLunaScene extends BaseMinigameScene {
      constructor() {
        super("findluna", "Where's Luna?",
          isMobile ? "Watch where Luna hides, then tap the right cushion!"
                   : "Watch where Luna hides, then click the right cushion!",
          [100, 250, 500], 60);
        this.cushions = [
          { x: 200, y: 380, targetX: 200 },
          { x: 400, y: 380, targetX: 400 },
          { x: 600, y: 380, targetX: 600 }
        ];
        this.lunaSlot = 0;
        this.roundPhase = "show";
        this.roundTimer = 0;
        this.shuffleMoves = [];
        this.shuffleIndex = 0;
        this.shuffleT = 0;
        this.shuffleSpeed = 1.5;
        this.numShuffles = 2;
        this.round = 0;
        this.consecutiveCorrect = 0;
        this.revealResult = null;
        this.resultTimer = 0;
        this.pickable = false;
      }
      enter() {
        super.enter();
        this.round = 0;
        this.consecutiveCorrect = 0;
      }
      startPlay() {
        super.startPlay();
        this.startRound();
      }
      startRound() {
        this.round++;
        this.numShuffles = Math.min(8, 2 + Math.floor(this.round / 2));
        this.shuffleSpeed = Math.max(0.2, 1.2 - this.round * 0.08);
        this.lunaSlot = Math.floor(Math.random() * 3);
        this.roundPhase = "show";
        this.roundTimer = 0;
        this.pickable = false;
        this.revealResult = null;
        this.cushions[0].x = 200; this.cushions[0].targetX = 200;
        this.cushions[1].x = 400; this.cushions[1].targetX = 400;
        this.cushions[2].x = 600; this.cushions[2].targetX = 600;
        this.shuffleMoves = [];
        for (let i = 0; i < this.numShuffles; i++) {
          const a = Math.floor(Math.random() * 3);
          const b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
          this.shuffleMoves.push({ a, b });
        }
        this.shuffleIndex = 0;
        this.shuffleT = 0;
      }
      updatePlay(dt) {
        this.roundTimer += dt;
        if (this.roundPhase === "show") {
          if (this.roundTimer >= 1.2) {
            this.roundPhase = "shuffle";
            this.roundTimer = 0;
            this.shuffleIndex = 0;
            this.shuffleT = 0;
          }
        } else if (this.roundPhase === "shuffle") {
          if (this.shuffleIndex >= this.shuffleMoves.length) {
            this.roundPhase = "pick";
            this.roundTimer = 0;
            this.pickable = true;
            return;
          }
          const swap = this.shuffleMoves[this.shuffleIndex];
          this.shuffleT += dt / this.shuffleSpeed;
          const ca = this.cushions[swap.a];
          const cb = this.cushions[swap.b];
          const t = easeOutQuad(clamp(this.shuffleT, 0, 1));
          const baseAX = [200, 400, 600][swap.a];
          const baseBX = [200, 400, 600][swap.b];
          ca.x = lerp(baseAX, baseBX, t);
          cb.x = lerp(baseBX, baseAX, t);
          if (this.shuffleT >= 1) {
            ca.x = baseBX; ca.targetX = baseBX;
            cb.x = baseAX; cb.targetX = baseAX;
            const tmp = this.cushions[swap.a];
            this.cushions[swap.a] = this.cushions[swap.b];
            this.cushions[swap.b] = tmp;
            if (this.lunaSlot === swap.a) this.lunaSlot = swap.b;
            else if (this.lunaSlot === swap.b) this.lunaSlot = swap.a;
            this.shuffleIndex++;
            this.shuffleT = 0;
            this.cushions[0].x = this.cushions[0].targetX;
            this.cushions[1].x = this.cushions[1].targetX;
            this.cushions[2].x = this.cushions[2].targetX;
            audio.menu();
          }
        } else if (this.roundPhase === "pick") {
          if (this.roundTimer >= 4) {
            this.revealResult = "wrong";
            this.roundPhase = "reveal";
            this.roundTimer = 0;
            this.combo = 1;
            this.consecutiveCorrect = 0;
            audio.miss();
          }
        } else if (this.roundPhase === "reveal") {
          if (this.roundTimer >= 1.5) {
            this.startRound();
          }
        }
      }
      onGameClick(x, y) {
        if (!this.pickable) return;
        for (let i = 0; i < 3; i++) {
          const cx = this.cushions[i].x;
          if (Math.abs(x - cx) < 70 && Math.abs(y - 380) < 50) {
            this.pickable = false;
            const pickTime = this.roundTimer;
            this.roundPhase = "reveal";
            this.roundTimer = 0;
            if (i === this.lunaSlot) {
              const speedBonus = Math.max(0, Math.round(20 - pickTime * 5));
              const pts = (20 + speedBonus) * this.combo;
              this.addScore(pts);
              this.combo++;
              this.consecutiveCorrect++;
              this.revealResult = "correct";
              spawnParticleBurst(cx, 340, [COLORS.gold, COLORS.softPink], 12, ["star", "heart"]);
              audio.catch();
              if (this.consecutiveCorrect >= 8) this.queueAchievement("sharpEye");
              if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
            } else {
              this.revealResult = "wrong";
              this.combo = 1;
              this.consecutiveCorrect = 0;
              audio.miss();
              screenShake(2, 0.12);
            }
            return;
          }
        }
      }
      drawScene(c) {
        drawLivingRoom(c);
        c.fillStyle = "rgba(40,28,18,0.2)";
        c.fillRect(0, 0, W, H);
        const cushionColors = ["#E8B8A0", "#A8C686", "#C39BD3"];
        for (let i = 0; i < 3; i++) {
          const cx = this.cushions[i].x;
          const cy = 380;
          if (i === this.lunaSlot && this.roundPhase === "show") {
            drawLuna(c, cx, cy - 30, 0.7, { pose: "sit", tail: Math.sin(game.time * 3), blink: blinkSignal(game.time, 0.5), facing: 1 });
          }
          if (i === this.lunaSlot && this.roundPhase === "reveal") {
            drawLuna(c, cx, cy - 30, 0.7, { pose: "sit", tail: Math.sin(game.time * 4), earTwitch: earSignal(game.time), facing: 1 });
          }
          if (!(this.roundPhase === "reveal" && i === this.lunaSlot)) {
            c.save();
            const hover = this.pickable && pointInRect(game.mouse.x, game.mouse.y, { x: cx - 70, y: cy - 50, w: 140, h: 100 });
            if (hover) drawGlowCircle(c, cx, cy, 70, "rgba(255,215,0,ALPHA)", 0.15);
            c.fillStyle = cushionColors[i % 3];
            c.beginPath(); c.ellipse(cx, cy, 60, 35, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = "rgba(255,255,255,0.15)";
            c.beginPath(); c.ellipse(cx - 10, cy - 8, 35, 18, -0.15, 0, Math.PI * 2); c.fill();
            if (this.roundPhase === "pick") {
              c.fillStyle = "rgba(92,68,52,0.5)";
              c.font = '28px "Fredoka One", sans-serif';
              c.textAlign = "center";
              c.fillText("?", cx, cy + 10);
            }
            c.restore();
          }
        }
        if (this.roundPhase === "reveal" && this.revealResult) {
          c.save();
          c.globalAlpha = clamp(1 - this.roundTimer / 1.2, 0, 1);
          c.font = '32px "Fredoka One", sans-serif';
          c.textAlign = "center";
          if (this.revealResult === "correct") {
            c.fillStyle = COLORS.gold;
            c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 4;
            c.strokeText("Found her!", W / 2, 200);
            c.fillText("Found her!", W / 2, 200);
          } else {
            c.fillStyle = COLORS.warmRed;
            c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 4;
            c.strokeText("Not there!", W / 2, 200);
            c.fillText("Not there!", W / 2, 200);
          }
          c.restore();
        }
        if (this.roundPhase === "shuffle") {
          c.fillStyle = "rgba(92,68,52,0.4)";
          c.font = '14px "Fredoka One", sans-serif';
          c.textAlign = "center";
          c.fillText("Shuffling... " + (this.shuffleIndex + 1) + "/" + this.shuffleMoves.length, W / 2, 300);
        }
        c.fillStyle = "rgba(92,68,52,0.4)";
        c.font = '13px "Fredoka One", sans-serif';
        c.textAlign = "center";
        c.fillText("Round " + this.round, W / 2, 86);
      }
      drawInstructionIcon(c, x, y) {
        c.save(); c.translate(x, y);
        for (let i = -1; i <= 1; i++) {
          c.fillStyle = ["#E8B8A0", "#A8C686", "#C39BD3"][i + 1];
          c.beginPath(); c.ellipse(i * 30, 0, 22, 14, 0, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = "#7A4E36";
        c.font = '16px "Fredoka One", sans-serif';
        c.textAlign = "center";
        c.fillText("?", 0, 6);
        c.restore();
      }
      drawResultCharacter(c) {
        drawLuna(c, 400, 405, 1.5, { pose: "sit", tail: Math.sin(game.time * 2.4), earTwitch: earSignal(game.time), blink: blinkSignal(game.time + 1, 0.4) });
      }
    }
    SceneRegistry.register("findluna", () => new WheresLunaScene());
