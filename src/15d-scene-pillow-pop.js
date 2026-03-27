    const CUSHION_POSITIONS = [
      { x: 160, y: 420, color: "#E8B8A0" },
      { x: 290, y: 410, color: "#A8C686" },
      { x: 400, y: 400, color: "#FFB6C1" },
      { x: 510, y: 410, color: "#7FB3D5" },
      { x: 640, y: 420, color: "#C39BD3" }
    ];

    class PillowPopScene extends BaseMinigameScene {
      constructor() {
        super("pillow", "Pillow Pop",
          isMobile ? "Tap Luna when she pops up! Don't tap Obi!"
                   : "Click Luna when she pops up! Don't click Obi!",
          [100, 250, 500], 45);
        this.popups = [];
        this.spawnTimer = 0;
        this.spawnRate = 1.4;
        this.boopEffects = [];
        this.missEffects = [];
        this.streak = 0;
        this.obiAppearChance = 0.15;
      }
      updatePlay(dt) {
        const elapsed = this.duration - this.timeLeft;
        this.spawnRate = Math.max(0.5, 1.4 - elapsed * 0.018);
        const holdDuration = Math.max(0.4, 1.2 - elapsed * 0.015);
        this.obiAppearChance = Math.min(0.3, 0.15 + elapsed * 0.003);
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.popups.filter(p => !p.hit).length < 2) {
          this.spawnPopup(holdDuration);
          this.spawnTimer = this.spawnRate;
        }
        for (let i = this.popups.length - 1; i >= 0; i--) {
          const p = this.popups[i];
          if (p.phase === "rise") {
            p.riseT += dt * 4;
            if (p.riseT >= 1) { p.riseT = 1; p.phase = "hold"; }
          } else if (p.phase === "hold") {
            p.holdT += dt;
            if (p.holdT >= p.holdDuration) { p.phase = "fall"; }
          } else if (p.phase === "fall") {
            p.fallT += dt * 3;
            if (p.fallT >= 1) {
              if (p.type === "luna" && !p.hit) { this.combo = 1; this.streak = 0; }
              this.popups.splice(i, 1);
            }
          }
        }
        for (let i = this.boopEffects.length - 1; i >= 0; i--) {
          this.boopEffects[i].life -= dt;
          if (this.boopEffects[i].life <= 0) this.boopEffects.splice(i, 1);
        }
        for (let i = this.missEffects.length - 1; i >= 0; i--) {
          this.missEffects[i].life -= dt;
          if (this.missEffects[i].life <= 0) this.missEffects.splice(i, 1);
        }
        if (this.score >= 250) this.queueAchievement("whackQueen");
      }
      spawnPopup(holdDuration) {
        const usedSlots = this.popups.map(p => p.slot);
        const available = [0,1,2,3,4].filter(s => !usedSlots.includes(s));
        if (available.length === 0) return;
        const slot = available[Math.floor(Math.random() * available.length)];
        let type = "luna";
        const r = Math.random();
        if (r < this.obiAppearChance) type = "obi";
        else if (r < this.obiAppearChance + 0.08) type = "earFake";
        this.popups.push({ slot, type, riseT: 0, holdT: 0, holdDuration, fallT: 0, phase: "rise", hit: false });
      }
      onGameClick(x, y) {
        for (const p of this.popups) {
          if (p.hit || p.phase === "fall") continue;
          const pos = CUSHION_POSITIONS[p.slot];
          const visibility = p.phase === "rise" ? p.riseT : p.phase === "hold" ? 1 : 1 - p.fallT;
          if (visibility < 0.3) continue;
          const hitbox = { x: pos.x - 40, y: pos.y - 80 * visibility, w: 80, h: 80 * visibility };
          if (pointInRect(x, y, hitbox)) {
            if (p.type === "luna") {
              const pts = 15 * this.combo;
              this.addScore(pts);
              this.combo++;
              this.streak++;
              p.hit = true;
              p.phase = "fall"; p.fallT = 0.3;
              this.boopEffects.push({ x: pos.x, y: pos.y - 50, life: 0.6, text: "+" + pts });
              spawnParticleBurst(pos.x, pos.y - 50, [COLORS.softPink, COLORS.gold], 8, ["heart", "star"]);
              audio.catch();
              if (this.combo >= 5) screenShake(2, 0.1);
              if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
              return;
            } else if (p.type === "obi") {
              this.addScore(-10);
              this.combo = 1;
              this.streak = 0;
              p.hit = true;
              p.phase = "fall";
              this.missEffects.push({ x: pos.x, y: pos.y - 50, life: 0.7 });
              audio.miss();
              screenShake(3, 0.15);
              return;
            }
            return;
          }
        }
      }
      drawScene(c) {
        drawLivingRoom(c);
        c.fillStyle = "rgba(40,28,18,0.15)";
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < CUSHION_POSITIONS.length; i++) {
          const pos = CUSHION_POSITIONS[i];
          const popup = this.popups.find(p => p.slot === i);
          if (popup && !popup.hit) {
            const visibility = popup.phase === "rise" ? popup.riseT : popup.phase === "hold" ? 1 : 1 - popup.fallT;
            c.save();
            c.beginPath();
            c.rect(pos.x - 60, pos.y - 120, 120, 80 * visibility + 5);
            c.clip();
            if (popup.type === "luna") {
              drawLuna(c, pos.x, pos.y - 10, 0.85, { pose: "sit", tail: Math.sin(game.time * 3), earTwitch: earSignal(game.time + i), blink: blinkSignal(game.time + i * 0.7, 0.5), facing: i < 2 ? -1 : 1 });
            } else if (popup.type === "obi") {
              drawObi(c, pos.x, pos.y - 5, 0.8, { pose: "sit", expression: "happy", tail: Math.sin(game.time * 8), bounce: 0.03, facing: i < 2 ? 1 : -1 });
            } else if (popup.type === "earFake") {
              c.fillStyle = "#B8956A";
              const earY = pos.y - 10 - 20 * visibility;
              c.beginPath(); c.moveTo(pos.x - 12, earY + 14); c.lineTo(pos.x - 6, earY); c.lineTo(pos.x, earY + 14); c.fill();
              c.beginPath(); c.moveTo(pos.x + 6, earY + 14); c.lineTo(pos.x + 12, earY); c.lineTo(pos.x + 18, earY + 14); c.fill();
            }
            c.restore();
          }
          c.save();
          c.fillStyle = pos.color;
          c.beginPath(); c.ellipse(pos.x, pos.y, 52, 28, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = "rgba(255,255,255,0.2)";
          c.beginPath(); c.ellipse(pos.x - 8, pos.y - 6, 30, 14, -0.2, 0, Math.PI * 2); c.fill();
          c.fillStyle = "rgba(0,0,0,0.08)";
          c.beginPath(); c.ellipse(pos.x, pos.y + 16, 48, 10, 0, 0, Math.PI * 2); c.fill();
          c.restore();
        }
        for (const e of this.boopEffects) {
          c.save();
          c.globalAlpha = clamp(e.life / 0.3, 0, 1);
          c.fillStyle = COLORS.gold;
          c.font = '20px "Fredoka One", sans-serif';
          c.textAlign = "center";
          c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 3;
          c.strokeText(e.text, e.x, e.y - (0.6 - e.life) * 30);
          c.fillText(e.text, e.x, e.y - (0.6 - e.life) * 30);
          c.restore();
        }
        for (const e of this.missEffects) {
          c.save();
          c.globalAlpha = clamp(e.life / 0.3, 0, 1);
          c.fillStyle = COLORS.warmRed;
          c.font = '18px "Fredoka One", sans-serif';
          c.textAlign = "center";
          c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 3;
          c.strokeText("Obi! No!", e.x, e.y - (0.7 - e.life) * 25);
          c.fillText("Obi! No!", e.x, e.y - (0.7 - e.life) * 25);
          c.restore();
        }
        if (this.streak >= 3) {
          c.fillStyle = "rgba(255,248,240,0.7)";
          c.font = '14px "Fredoka One", sans-serif';
          c.textAlign = "center";
          c.fillText("Streak: " + this.streak + " boops!", W / 2, 86);
        }
      }
      drawInstructionIcon(c, x, y) {
        c.save(); c.translate(x, y);
        c.fillStyle = "#FFB6C1";
        c.beginPath(); c.ellipse(0, 8, 30, 16, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#B8956A";
        c.beginPath(); c.moveTo(-10, 4); c.lineTo(-5, -12); c.lineTo(0, 4); c.fill();
        c.beginPath(); c.moveTo(6, 4); c.lineTo(11, -12); c.lineTo(16, 4); c.fill();
        c.restore();
      }
      drawResultCharacter(c) {
        drawLuna(c, 400, 405, 1.45, { pose: "sit", tail: Math.sin(game.time * 2.2), earTwitch: earSignal(game.time), blink: blinkSignal(game.time + 1.5, 0.45) });
      }
    }
    SceneRegistry.register("pillow", () => new PillowPopScene());
