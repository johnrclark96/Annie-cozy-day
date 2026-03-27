    class TitleScene extends BaseScene {
      constructor() {
        super("title");
        this.startButton = { x: W / 2 - 140, y: 500, w: 280, h: 56 };
        this.hoverStart = false;
        /* live character state */
        this.annie = { x: 400, y: 380, state: "idle", timer: rand(3, 6), facing: 1 };
        this.obi   = { x: 240, y: 440, state: "wander", timer: rand(1, 3), vx: 0, facing: 1, targetX: 240 };
        this.luna  = { x: 560, y: 420, state: "sit", timer: rand(2, 5), vx: 0, facing: -1, targetX: 560 };
        this.interaction = null;  /* { type, timer } */
        this.subtitleIndex = Math.floor(Math.random() * TITLE_SUBTITLES.length);
        this.subtitleTimer = 6;
      }
      enter() {
        this.annie.timer = rand(2, 4);
        this.obi.timer = rand(1, 3);
        this.luna.timer = rand(2, 4);
      }
      pickAnnieState() {
        const r = Math.random();
        if (r < 0.25) return { state: "idle", timer: rand(3, 6) };
        if (r < 0.45) return { state: "cheer", timer: rand(1.5, 2.5) };
        if (r < 0.6) return { state: "laugh", timer: rand(2, 3.5) };
        if (r < 0.78) return { state: "kneel", timer: rand(2, 3.5) };
        return { state: "walk", timer: rand(2.5, 4), targetX: 400 + rand(-100, 100) };
      }
      pickObiState() {
        const r = Math.random();
        if (r < 0.25) {
          const tx = rand(100, 700);
          return { state: "wander", timer: rand(2, 4), targetX: tx, facing: tx > this.obi.x ? 1 : -1 };
        }
        if (r < 0.42) return { state: "sit", timer: rand(2, 5) };
        if (r < 0.55) return { state: "sniff", timer: rand(2, 3.5), targetX: this.obi.x + rand(-60, 60), facing: Math.random() < 0.5 ? 1 : -1 };
        if (r < 0.66) return { state: "nap", timer: rand(3, 5) };
        if (r < 0.8) return { state: "sniffLuna", timer: rand(2.5, 4), targetX: this.luna.x - 40, facing: 1 };
        /* run toward Annie */
        return { state: "approach", timer: rand(1.5, 2.5), targetX: this.annie.x - 50, facing: 1 };
      }
      pickLunaState() {
        const r = Math.random();
        if (r < 0.2) return { state: "sit", timer: rand(2, 5) };
        if (r < 0.38) {
          const tx = rand(100, 700);
          return { state: "wander", timer: rand(2, 3.5), targetX: tx, facing: tx > this.luna.x ? 1 : -1 };
        }
        if (r < 0.5) return { state: "groom", timer: rand(2.5, 4) };
        if (r < 0.62) return { state: "nap", timer: rand(3, 5) };
        if (r < 0.74) return { state: "bellyUp", timer: rand(2, 4) };
        if (r < 0.86) return { state: "batObi", timer: rand(2, 3.5), targetX: this.obi.x + 35, facing: -1 };
        /* pounce at something */
        return { state: "pounce", timer: rand(0.6, 1.2), targetX: this.luna.x + (Math.random() < 0.5 ? -80 : 80) };
      }
      update(dt) {
        super.update(dt);
        this.hoverStart = pointInRect(game.mouse.x, game.mouse.y, this.startButton) && spriteArt.ready;
        this.subtitleTimer -= dt;
        if (this.subtitleTimer <= 0) {
          this.subtitleIndex = (this.subtitleIndex + 1) % TITLE_SUBTITLES.length;
          this.subtitleTimer = 6;
        }
        const a = this.annie, o = this.obi, l = this.luna;

        /* Annie */
        a.timer -= dt;
        if (a.state === "walk" && a.targetX !== undefined) {
          const dir = Math.sign(a.targetX - a.x);
          a.x += dir * 50 * dt;
          a.facing = dir || a.facing;
          if (Math.abs(a.x - a.targetX) < 8) { a.x = a.targetX; a.state = "idle"; a.timer = rand(2, 4); }
        }
        a.x = clamp(a.x || 400, 200, 600);
        if (a.timer <= 0) Object.assign(a, this.pickAnnieState());

        /* Obi */
        o.timer -= dt;
        if (o.state === "wander" || o.state === "approach" || o.state === "sniff" || o.state === "sniffLuna") {
          const speed = o.state === "approach" ? 110 : o.state === "sniff" ? 30 : o.state === "sniffLuna" ? 70 : 60;
          if (o.state === "sniffLuna") o.targetX = l.x - 40;
          const dir = Math.sign(o.targetX - o.x);
          o.x += dir * speed * dt;
          o.facing = dir || o.facing;
          if (Math.abs(o.x - o.targetX) < 8) {
            if (o.state === "sniffLuna") { o.x = o.targetX; o.state = "sniffLunaIdle"; o.timer = rand(1.5, 2.5); }
            else { o.x = o.targetX; o.state = "sit"; o.timer = rand(1, 3); }
          }
        }
        if (o.timer <= 0) Object.assign(o, this.pickObiState());
        o.x = clamp(o.x, 80, 720);

        /* Luna */
        l.timer -= dt;
        if (l.state === "wander" || l.state === "batObi") {
          const speed = l.state === "batObi" ? 55 : 45;
          if (l.state === "batObi") l.targetX = o.x + 35;
          const dir = Math.sign(l.targetX - l.x);
          l.x += dir * speed * dt;
          l.facing = dir || l.facing;
          if (Math.abs(l.x - l.targetX) < 8) {
            if (l.state === "batObi") { l.x = l.targetX; l.state = "batObiIdle"; l.timer = rand(1, 2); }
            else { l.x = l.targetX; l.state = "sit"; l.timer = rand(1.5, 3); }
          }
        } else if (l.state === "pounce") {
          const dir = Math.sign(l.targetX - l.x);
          l.x += dir * 200 * dt;
          l.facing = dir || l.facing;
        }
        if (l.timer <= 0) Object.assign(l, this.pickLunaState());
        l.x = clamp(l.x, 80, 720);

        /* interaction sparkles */
        if (o.state === "approach" && Math.abs(o.x - a.x) < 60) {
          if (Math.random() < dt * 3) spawnParticleBurst(o.x, o.y - 30, [COLORS.softPink], 1, ["heart"]);
        }
        if (l.state === "pounce" && l.timer < 0.3) {
          if (Math.random() < dt * 4) spawnParticleBurst(l.x, l.y - 20, [COLORS.gold], 1, ["star"]);
        }
        /* Obi sniffing Luna */
        if (o.state === "sniffLunaIdle" && Math.abs(o.x - l.x) < 60) {
          if (Math.random() < dt * 2.5) spawnParticleBurst((o.x + l.x) / 2, Math.min(o.y, l.y) - 30, [COLORS.softPink, COLORS.gold], 1, ["heart"]);
        }
        /* Luna batting at Obi */
        if (l.state === "batObiIdle" && Math.abs(l.x - o.x) < 60) {
          if (Math.random() < dt * 3) spawnParticleBurst((o.x + l.x) / 2, Math.min(o.y, l.y) - 25, [COLORS.gold, "#FFF4C0"], 2, ["star"]);
        }
      }
      onMouseMove(x, y) {
        this.hoverStart = pointInRect(x, y, this.startButton) && spriteArt.ready;
      }
      interactiveAt(x, y) {
        return spriteArt.ready && pointInRect(x, y, this.startButton);
      }
      onClick(x, y) {
        if (spriteArt.ready && pointInRect(x, y, this.startButton)) {
          audio.menu();
          transitionTo(SceneRegistry.create("hangout"));
        }
      }
      draw(c) {
        drawTitleBg(c);
        drawGlowCircle(c, 400, 340, 220, "rgba(255,255,255,ALPHA)", 0.10);

        const a = this.annie, o = this.obi, l = this.luna;

        /* draw characters sorted by Y for natural overlap */
        const chars = [
          { type: "obi", y: o.y },
          { type: "annie", y: a.y },
          { type: "luna", y: l.y }
        ].sort((a, b) => a.y - b.y);

        for (const ch of chars) {
          if (ch.type === "obi") {
            const isMoving = o.state === "wander" || o.state === "approach" || o.state === "sniffLuna";
            const pose = o.state === "nap" ? "sleeping" : (o.state === "sniff" || o.state === "sniffLuna" || o.state === "sniffLunaIdle") ? "sniff" : isMoving ? "run" : "sit";
            drawObi(c, o.x, o.y, 1.20, {
              pose,
              expression: o.state === "approach" ? "excited" : "happy",
              tail: Math.sin(game.time * (isMoving ? 10 : o.state === "sniffLunaIdle" ? 12 : 6)) * 0.9,
              bounce: isMoving ? 0.08 * Math.sin(game.time * 12) : 0.04 * Math.sin(game.time * 3),
              facing: o.facing
            });
          } else if (ch.type === "annie") {
            let pose = "idle";
            if (a.state === "cheer") pose = "cheer";
            else if (a.state === "laugh") pose = "laugh";
            else if (a.state === "kneel") pose = "kneel";
            else if (a.state === "walk") pose = "walk";
            drawAnnie(c, a.x, a.y, 1.50, {
              pose,
              breath: Math.sin(game.time * 2.1),
              blink: blinkSignal(game.time, 0.6),
              hairSway: Math.sin(game.time * 1.35),
              facing: a.facing || 1
            });
          } else {
            const isPounce = l.state === "pounce";
            const isMoving = l.state === "wander" || l.state === "batObi";
            let lunaPose = "sit";
            if (isPounce) lunaPose = "pounce";
            else if (isMoving) lunaPose = "topdown";
            else if (l.state === "groom") lunaPose = "groom";
            else if (l.state === "nap") lunaPose = "sleeping";
            else if (l.state === "bellyUp") lunaPose = "bellyUp";
            else if (l.state === "batObi" || l.state === "batObiIdle") lunaPose = "pounce";
            drawLuna(c, l.x, l.y, 1.16, {
              pose: lunaPose,
              tail: Math.sin(game.time * (isPounce ? 8 : l.state === "batObiIdle" ? 6 : 1.6)),
              earTwitch: earSignal(game.time),
              blink: blinkSignal(game.time + 1.4, 0.42),
              pounceStretch: isPounce ? 0.9 : (l.state === "batObiIdle" ? 0.4 : 0),
              pawBat: l.state === "batObiIdle" ? (0.5 + Math.sin(game.time * 6) * 0.5) : 0,
              wiggle: isPounce ? game.time * 3 % 1 : 0,
              facing: l.facing
            });
          }
        }

        /* title text with glow and layered shadow */
        c.save();
        c.textAlign = "center";
        /* warm glow behind title */
        drawGlowCircle(c, W / 2, 88, 200, "rgba(255,240,210,ALPHA)", 0.1);
        /* deep shadow */
        c.fillStyle = "rgba(92,58,32,0.2)";
        c.font = '50px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Annie's Cozy Day", W / 2 + 3, 96);
        /* light outline */
        c.strokeStyle = "rgba(255,248,240,0.5)";
        c.lineWidth = 6;
        c.font = '50px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.strokeText("Annie's Cozy Day", W / 2, 92);
        /* main title */
        c.fillStyle = "#7A4E36";
        c.fillText("Annie's Cozy Day", W / 2, 92);
        /* subtitle with softer style */
        c.fillStyle = "rgba(122,78,54,0.7)";
        c.font = '23px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("A Cozy Minigame Collection", W / 2, 128);
        c.restore();

        const pulse = 1 + 0.06 * Math.sin(game.time * 3);
        c.save();
        c.translate(W / 2, 528);
        c.scale(pulse, pulse);
        const loadDots = ".".repeat(Math.floor(game.time * 2) % 4);
        drawButton(c, { x: -140, y: -28, w: 280, h: 56 }, spriteArt.ready ? (isMobile ? "Tap to Start" : "Click to Start") : "Loading Cozy Art" + loadDots, this.hoverStart, "#B84B3A");
        c.restore();

        c.save();
        const subFade = Math.min(clamp(this.subtitleTimer / 0.8, 0, 1), clamp((6 - this.subtitleTimer) / 0.8, 0, 1));
        c.globalAlpha = subFade * 0.85;
        c.fillStyle = "#7A4E36";
        c.font = '16px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "center";
        c.fillText(TITLE_SUBTITLES[this.subtitleIndex], W / 2, 574);
        c.restore();
      }
    }

    SceneRegistry.register("title", () => new TitleScene());
