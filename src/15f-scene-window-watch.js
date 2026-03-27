    class WindowWatchScene extends BaseMinigameScene {
      constructor() {
        super("window", "Window Watch",
          isMobile ? "Tap birds and butterflies! Don't tap the leaves!"
                   : "Click birds and butterflies! Don't click the leaves!",
          [150, 400, 750], 60);
        this.flyers = [];
        this.spawnTimer = 0;
        this.spawnRate = 1.2;
        this.lunaReact = 0;
        this.scorePopups = [];
        this.leafWarning = 0;
        this.goldenReady = false;
      }
      updatePlay(dt) {
        const elapsed = this.duration - this.timeLeft;
        this.spawnRate = Math.max(0.3, 1.2 - elapsed * 0.012);
        this.lunaReact = Math.max(0, this.lunaReact - dt);
        this.leafWarning = Math.max(0, this.leafWarning - dt * 3);
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnFlyer(elapsed);
          this.spawnTimer = this.spawnRate;
        }
        for (let i = this.flyers.length - 1; i >= 0; i--) {
          const f = this.flyers[i];
          f.x += f.vx * dt;
          f.y += Math.sin(game.time * 2 + f.phase) * (f.type === "leaf" ? 30 : 15) * dt;
          f.wingPhase += dt * (f.type === "butterfly" || f.type === "golden" ? 16 : 10);
          if ((f.vx > 0 && f.x > W + 40) || (f.vx < 0 && f.x < -40)) {
            if (f.alive && (f.type === "bird" || f.type === "butterfly" || f.type === "golden")) {
              this.combo = 1;
            }
            this.flyers.splice(i, 1);
          }
        }
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
          this.scorePopups[i].life -= dt;
          this.scorePopups[i].y -= 35 * dt;
          if (this.scorePopups[i].life <= 0) this.scorePopups.splice(i, 1);
        }
        if (this.combo >= 5 && !this.goldenReady) {
          this.goldenReady = true;
        }
        if (this.score >= 300) this.queueAchievement("birdWatcher");
      }
      spawnFlyer(elapsed) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -30 : W + 30;
        const dir = fromLeft ? 1 : -1;
        const speed = rand(40, 80) + elapsed * 0.5;
        let type;
        const r = Math.random();
        if (this.goldenReady && r < 0.15) {
          type = "golden";
          this.goldenReady = false;
        } else if (r < 0.35) type = "bird";
        else if (r < 0.65) type = "butterfly";
        else type = "leaf";
        this.flyers.push({ type, x, y: rand(80, 190), vx: speed * dir, vy: 0, phase: rand(0, 6.28), wingPhase: rand(0, 6.28), alive: true });
      }
      extraInteractiveAt() { return true; }
      onGameClick(x, y) {
        for (let i = this.flyers.length - 1; i >= 0; i--) {
          const f = this.flyers[i];
          if (!f.alive) continue;
          if (dist(x, y, f.x, f.y) < 36) {
            f.alive = false;
            if (f.type === "leaf") {
              this.addScore(-10);
              this.combo = 1;
              this.leafWarning = 1;
              audio.miss();
              this.scorePopups.push({ x: f.x, y: f.y, text: "-10", color: COLORS.warmRed, life: 0.8 });
              screenShake(2, 0.1);
            } else {
              const base = f.type === "golden" ? 50 : f.type === "butterfly" ? 25 : 15;
              const pts = base * this.combo;
              this.addScore(pts);
              this.combo++;
              this.lunaReact = 0.4;
              this.scorePopups.push({ x: f.x, y: f.y, text: "+" + pts, color: COLORS.gold, life: 1 });
              spawnParticleBurst(f.x, f.y, f.type === "golden" ? [COLORS.gold, "#FFF4C0"] : [COLORS.softPink, COLORS.gold], f.type === "golden" ? 14 : 8, ["star", "heart"]);
              audio.catch();
              if (this.combo > 1 && this.combo % 5 === 0) audio.combo();
            }
            this.flyers.splice(i, 1);
            return;
          }
        }
      }
      drawBirdFlyer(c, f) {
        const dir = f.vx > 0 ? 1 : -1;
        c.scale(dir, 1);
        c.fillStyle = "#6B4A2A";
        c.beginPath(); c.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#5A3A2A";
        c.beginPath(); c.arc(8, -5, 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#E8A84C";
        c.beginPath(); c.moveTo(12, -5); c.lineTo(18, -4); c.lineTo(12, -3); c.closePath(); c.fill();
        c.fillStyle = "#1A1A1A";
        c.beginPath(); c.arc(10, -6, 1.2, 0, Math.PI * 2); c.fill();
        const wingY = Math.sin(f.wingPhase) * 6;
        c.fillStyle = "#8B6B4A";
        c.beginPath(); c.ellipse(-2, wingY - 5, 10, 4, -0.3, 0, Math.PI * 2); c.fill();
      }
      drawButterflyFlyer(c, f) {
        const wingAngle = Math.sin(f.wingPhase) * 0.6;
        const color = f.type === "golden" ? COLORS.gold : ["#E88090", "#87CEEB", "#C39BD3"][Math.floor(f.phase) % 3];
        if (f.type === "golden") {
          drawGlowCircle(c, 0, 0, 18, "rgba(255,215,0,ALPHA)", 0.2);
        }
        c.fillStyle = color;
        c.save(); c.rotate(-wingAngle);
        c.beginPath(); c.ellipse(-6, 0, 9, 5, -0.3, 0, Math.PI * 2); c.fill();
        c.restore();
        c.save(); c.rotate(wingAngle);
        c.beginPath(); c.ellipse(6, 0, 9, 5, 0.3, 0, Math.PI * 2); c.fill();
        c.restore();
        c.fillStyle = "#3E2723";
        c.fillRect(-1, -4, 2, 8);
      }
      drawLeafFlyer(c, f) {
        c.save();
        c.rotate(Math.sin(game.time * 2 + f.phase) * 0.5);
        c.fillStyle = "#8BC860";
        c.beginPath(); c.ellipse(0, 0, 10, 6, 0.3, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "#6BAA48";
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke();
        c.restore();
      }
      drawScene(c) {
        drawLivingRoom(c);
        c.fillStyle = "rgba(40,28,18,0.35)";
        c.fillRect(0, 0, W, H);
        c.save();
        c.globalCompositeOperation = "destination-out";
        c.fillStyle = "rgba(0,0,0,1)";
        rr(c, 42, 28, 168, 210, 12);
        c.fill();
        c.restore();
        c.save();
        c.beginPath();
        rr(c, 42, 28, 168, 210, 12);
        c.clip();
        c.fillStyle = "#B8E0F0";
        c.fillRect(42, 28, 168, 210);
        for (const f of this.flyers) {
          if (!f.alive) continue;
          c.save();
          c.translate(f.x, f.y);
          if (f.type === "bird") this.drawBirdFlyer(c, f);
          else if (f.type === "butterfly" || f.type === "golden") this.drawButterflyFlyer(c, f);
          else if (f.type === "leaf") this.drawLeafFlyer(c, f);
          c.restore();
        }
        c.restore();
        c.strokeStyle = "#C8A882";
        c.lineWidth = 6;
        rr(c, 42, 28, 168, 210, 12);
        c.stroke();
        drawLuna(c, 126, 260, 0.9, {
          pose: "sit", tail: Math.sin(game.time * 3),
          earTwitch: this.lunaReact > 0 ? 1 : earSignal(game.time),
          pawBat: this.lunaReact > 0 ? 0.6 : 0,
          blink: blinkSignal(game.time + 1, 0.5), facing: 1
        });
        c.save();
        c.fillStyle = "rgba(255,248,240,0.85)";
        rr(c, 260, 80, 200, 100, 12);
        c.fill();
        c.font = '12px "Fredoka One", sans-serif';
        c.fillStyle = "#5A3E2B";
        c.textAlign = "left";
        c.fillText("Bird = 15 pts", 280, 105);
        c.fillText("Butterfly = 25 pts", 280, 125);
        c.fillText("Golden = 50 pts", 280, 145);
        c.fillStyle = COLORS.warmRed;
        c.fillText("Leaf = -10 pts!", 280, 165);
        c.restore();
        for (const sp of this.scorePopups) {
          c.save();
          c.globalAlpha = clamp(sp.life, 0, 1);
          c.font = '18px "Fredoka One", sans-serif';
          c.textAlign = "center";
          c.strokeStyle = "rgba(60,40,20,0.7)"; c.lineWidth = 3;
          c.strokeText(sp.text, sp.x, sp.y);
          c.fillStyle = sp.color || COLORS.gold;
          c.fillText(sp.text, sp.x, sp.y);
          c.restore();
        }
        if (this.leafWarning > 0) {
          c.save();
          c.globalAlpha = this.leafWarning * 0.12;
          c.fillStyle = COLORS.warmRed;
          c.fillRect(0, 0, W, H);
          c.restore();
        }
      }
      drawInstructionIcon(c, x, y) {
        c.save(); c.translate(x, y);
        c.strokeStyle = "#7A4E36"; c.lineWidth = 3;
        rr(c, -20, -16, 40, 32, 4); c.stroke();
        c.fillStyle = "#E88090";
        c.beginPath(); c.ellipse(6, -2, 6, 3, 0.3, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(-2, -2, 6, 3, -0.3, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      drawResultCharacter(c) {
        drawLuna(c, 400, 405, 1.5, { pose: "sit", tail: Math.sin(game.time * 2.2), earTwitch: earSignal(game.time), blink: blinkSignal(game.time + 1.5, 0.45) });
      }
    }
    SceneRegistry.register("window", () => new WindowWatchScene());
