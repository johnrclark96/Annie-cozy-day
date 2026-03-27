    const PAWSTEP_ACTIONS = [
      { key: "sit", label: "Sit", pet: "obi", pose: "sit", expression: "happy", color: "#4A90D9" },
      { key: "paw", label: "Paw", pet: "luna", pose: "pounce", expression: null, color: "#A8C686" },
      { key: "shake", label: "Shake", pet: "obi", pose: "shake", expression: "excited", color: "#E8A84C" },
      { key: "groom", label: "Groom", pet: "luna", pose: "groom", expression: null, color: "#C39BD3" }
    ];

    const PAWSTEP_BUTTONS = [
      { x: 200, y: 440, w: 150, h: 60 },
      { x: 450, y: 440, w: 150, h: 60 },
      { x: 200, y: 510, w: 150, h: 60 },
      { x: 450, y: 510, w: 150, h: 60 }
    ];

    class PawstepPatternsScene extends BaseMinigameScene {
      constructor() {
        super("pawstep", "Pawstep Patterns",
          isMobile ? "Watch the pets, then tap the actions in the same order!"
                   : "Watch the pets, then click the actions in the same order!",
          [60, 150, 300], 90);
        this.sequence = [];
        this.playbackIndex = 0;
        this.inputIndex = 0;
        this.roundPhase = "generate";
        this.showTimer = 0;
        this.showDuration = 0.8;
        this.activeAction = null;
        this.resultTimer = 0;
        this.resultType = null;
        this.buttonFlash = {};
        this.longestSequence = 0;
        this.round = 0;
      }
      enter() {
        super.enter();
        this.sequence = [];
        this.longestSequence = 0;
        this.round = 0;
        this.buttonFlash = {};
      }
      startPlay() {
        super.startPlay();
        this.startNewSequence();
      }
      startNewSequence() {
        this.sequence = [];
        this.addToSequence();
        this.addToSequence();
        this.round = 0;
        this.beginShowPhase();
      }
      addToSequence() {
        const keys = PAWSTEP_ACTIONS.map(a => a.key);
        let next;
        do {
          next = keys[Math.floor(Math.random() * keys.length)];
        } while (this.sequence.length > 0 && next === this.sequence[this.sequence.length - 1]);
        this.sequence.push(next);
      }
      beginShowPhase() {
        this.roundPhase = "show";
        this.playbackIndex = 0;
        this.showTimer = 0;
        this.showDuration = Math.max(0.35, 0.8 - this.sequence.length * 0.04);
        this.activeAction = null;
      }
      beginInputPhase() {
        this.roundPhase = "input";
        this.inputIndex = 0;
        this.activeAction = null;
      }
      updatePlay(dt) {
        for (const key in this.buttonFlash) {
          this.buttonFlash[key] -= dt;
          if (this.buttonFlash[key] <= 0) delete this.buttonFlash[key];
        }
        if (this.activeAction) {
          this.activeAction.timer -= dt;
          if (this.activeAction.timer <= 0) this.activeAction = null;
        }
        if (this.roundPhase === "show") {
          this.showTimer += dt;
          if (this.showTimer >= this.showDuration) {
            this.showTimer = 0;
            if (this.playbackIndex < this.sequence.length) {
              const actionKey = this.sequence[this.playbackIndex];
              this.activeAction = { key: actionKey, timer: this.showDuration * 0.7 };
              this.buttonFlash[actionKey] = this.showDuration * 0.7;
              audio.tinyChime();
              this.playbackIndex++;
            } else {
              this.beginInputPhase();
            }
          }
        } else if (this.roundPhase === "result") {
          this.resultTimer += dt;
          if (this.resultTimer >= 1.2) {
            if (this.resultType === "correct") {
              this.round++;
              this.addToSequence();
              this.beginShowPhase();
            } else {
              this.startNewSequence();
            }
          }
        }
      }
      extraInteractiveAt(x, y) {
        if (this.roundPhase !== "input") return false;
        return PAWSTEP_BUTTONS.some(b => pointInRect(x, y, b));
      }
      onGameClick(x, y) {
        if (this.roundPhase !== "input") return;
        for (let i = 0; i < PAWSTEP_BUTTONS.length; i++) {
          if (pointInRect(x, y, PAWSTEP_BUTTONS[i])) {
            const clickedKey = PAWSTEP_ACTIONS[i].key;
            const expectedKey = this.sequence[this.inputIndex];
            this.buttonFlash[clickedKey] = 0.3;
            this.activeAction = { key: clickedKey, timer: 0.4 };
            if (clickedKey === expectedKey) {
              audio.tinyChime();
              this.inputIndex++;
              if (this.inputIndex >= this.sequence.length) {
                this.longestSequence = Math.max(this.longestSequence, this.sequence.length);
                const pts = this.sequence.length * 10 * this.combo;
                this.addScore(pts);
                this.combo++;
                this.roundPhase = "result";
                this.resultTimer = 0;
                this.resultType = "correct";
                spawnParticleBurst(400, 300, [COLORS.gold, COLORS.softPink], 12, ["star", "heart"]);
                audio.catch();
                if (this.combo > 1 && this.combo % 3 === 0) audio.combo();
                if (this.sequence.length >= 7) this.queueAchievement("goodMemory");
              }
            } else {
              this.roundPhase = "result";
              this.resultTimer = 0;
              this.resultType = "wrong";
              this.combo = 1;
              audio.miss();
              screenShake(3, 0.15);
            }
            return;
          }
        }
      }
      drawScene(c) {
        const bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#FFF8F0");
        bg.addColorStop(1, "#F5E6D3");
        c.fillStyle = bg;
        c.fillRect(0, 0, W, H);
        drawGlowCircle(c, 400, 300, 250, "rgba(255,240,210,ALPHA)", 0.08);
        const activeAct = this.activeAction ? PAWSTEP_ACTIONS.find(a => a.key === this.activeAction.key) : null;
        const obiPose = activeAct && activeAct.pet === "obi" ? activeAct.pose : "sit";
        const lunaPose = activeAct && activeAct.pet === "luna" ? activeAct.pose : "sit";
        drawObi(c, 280, 370, 1.3, {
          pose: obiPose,
          expression: obiPose === "shake" ? "excited" : "happy",
          tail: Math.sin(game.time * (obiPose === "shake" ? 12 : 6)),
          bounce: obiPose !== "sit" ? 0.06 : 0.02, facing: 1
        });
        drawLuna(c, 520, 360, 1.2, {
          pose: lunaPose === "pounce" ? "pounce" : lunaPose === "groom" ? "groom" : "sit",
          tail: Math.sin(game.time * 2.4),
          earTwitch: earSignal(game.time),
          pounceStretch: lunaPose === "pounce" ? 0.7 : 0, facing: -1
        });
        for (let i = 0; i < 4; i++) {
          const btn = PAWSTEP_BUTTONS[i];
          const action = PAWSTEP_ACTIONS[i];
          const flash = this.buttonFlash[action.key] || 0;
          const hover = this.roundPhase === "input" && pointInRect(game.mouse.x, game.mouse.y, btn);
          const isInputPhase = this.roundPhase === "input";
          c.save();
          if (flash > 0) {
            drawGlowCircle(c, btn.x + btn.w / 2, btn.y + btn.h / 2, btn.w * 0.7, "rgba(255,215,0,ALPHA)", flash * 0.3);
          }
          rr(c, btn.x, btn.y, btn.w, btn.h, 14);
          c.fillStyle = flash > 0 ? action.color : hover ? "rgba(255,255,255,1)" : "rgba(255,252,245,0.9)";
          c.fill();
          c.strokeStyle = flash > 0 ? COLORS.gold : hover ? action.color : "rgba(146,104,72,0.2)";
          c.lineWidth = flash > 0 ? 3 : 2;
          c.stroke();
          c.fillStyle = flash > 0 ? "#FFF8F0" : isInputPhase ? "#5C3D2E" : "rgba(92,61,46,0.4)";
          c.font = '18px "Fredoka One", sans-serif';
          c.textAlign = "center";
          c.fillText(action.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 7);
          c.font = '11px "Fredoka One", sans-serif';
          c.fillStyle = flash > 0 ? "rgba(255,248,240,0.7)" : "rgba(92,61,46,0.4)";
          c.fillText(action.pet === "obi" ? "Obi" : "Luna", btn.x + btn.w / 2, btn.y + 18);
          c.restore();
        }
        c.save();
        c.fillStyle = "rgba(92,68,52,0.5)";
        c.font = '16px "Fredoka One", sans-serif';
        c.textAlign = "center";
        if (this.roundPhase === "show") {
          c.fillText("Watch carefully...", W / 2, 80);
          for (let i = 0; i < this.sequence.length; i++) {
            c.fillStyle = i < this.playbackIndex ? COLORS.gold : "rgba(200,180,160,0.5)";
            c.beginPath(); c.arc(W / 2 - (this.sequence.length - 1) * 10 + i * 20, 100, 5, 0, Math.PI * 2); c.fill();
          }
        } else if (this.roundPhase === "input") {
          c.fillText("Your turn! Repeat the pattern", W / 2, 80);
          for (let i = 0; i < this.sequence.length; i++) {
            c.fillStyle = i < this.inputIndex ? COLORS.gold : "rgba(200,180,160,0.5)";
            c.beginPath(); c.arc(W / 2 - (this.sequence.length - 1) * 10 + i * 20, 100, 5, 0, Math.PI * 2); c.fill();
          }
        }
        c.restore();
        if (this.roundPhase === "result") {
          c.save();
          c.globalAlpha = clamp(1 - this.resultTimer / 1, 0, 1);
          c.font = '28px "Fredoka One", sans-serif';
          c.textAlign = "center";
          if (this.resultType === "correct") {
            c.fillStyle = COLORS.gold;
            c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 4;
            c.strokeText("Sequence length: " + this.sequence.length + "!", W / 2, 200);
            c.fillText("Sequence length: " + this.sequence.length + "!", W / 2, 200);
          } else {
            c.fillStyle = COLORS.warmRed;
            c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 4;
            c.strokeText("Wrong! Starting over...", W / 2, 200);
            c.fillText("Wrong! Starting over...", W / 2, 200);
          }
          c.restore();
        }
        c.fillStyle = "rgba(92,68,52,0.4)";
        c.font = '13px "Fredoka One", sans-serif';
        c.textAlign = "center";
        c.fillText("Longest: " + this.longestSequence + " steps", W / 2, H - 10);
      }
      drawInstructionIcon(c, x, y) {
        c.save(); c.translate(x, y);
        for (let i = -1; i <= 1; i++) {
          c.fillStyle = ["#4A90D9", "#A8C686", "#C39BD3"][i + 1];
          c.beginPath(); c.arc(i * 18, 0, 7, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }
      drawResultCharacter(c) {
        drawObi(c, 340, 405, 1.2, { pose: "sit", expression: "excited", tail: Math.sin(game.time * 10), bounce: 0.06 });
        drawLuna(c, 460, 400, 1.1, { pose: "sit", tail: Math.sin(game.time * 2.2), earTwitch: earSignal(game.time) });
      }
    }
    SceneRegistry.register("pawstep", () => new PawstepPatternsScene());
