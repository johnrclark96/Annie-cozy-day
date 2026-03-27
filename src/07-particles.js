    function spawnParticleBurst(x, y, colors = [COLORS.softPink, COLORS.gold], amount = 10, kindMix = ["heart", "star"]) {
      if (game.particles.length > 240) game.particles.splice(0, game.particles.length - 240);
      for (let i = 0; i < amount; i++) {
        game.particles.push({
          x, y,
          vx: rand(-50, 50),
          vy: rand(-90, -30),
          life: 1,
          maxLife: 1,
          size: rand(5, 10),
          rot: rand(0, Math.PI * 2),
          vr: rand(-3, 3),
          shape: kindMix[Math.floor(Math.random() * kindMix.length)],
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }
    function initAmbient() {
      for (let i = 0; i < 18; i++) {
        game.ambient.push({
          x: rand(20, W - 20),
          y: rand(40, H - 20),
          vy: rand(-10, -22),
          drift: rand(-8, 8),
          size: rand(6, 12),
          color: Math.random() < 0.5 ? COLORS.softPink : COLORS.gold,
          shape: Math.random() < 0.5 ? "heart" : "star",
          phase: rand(0, Math.PI * 2)
        });
      }
    }
    initAmbient();

    function updateSharedParticles(dt) {
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 50 * dt;
        p.rot += p.vr * dt;
        if (p.life <= 0) game.particles.splice(i, 1);
      }
      if (game.scene instanceof TitleScene) {
        for (const a of game.ambient) {
          a.y += a.vy * dt;
          a.x += Math.sin(game.time * 0.8 + a.phase) * 8 * dt + a.drift * dt * 0.25;
          if (a.y < -20) {
            a.y = H + 20;
            a.x = rand(20, W - 20);
          }
          if (a.x < -20) a.x = W + 20;
          if (a.x > W + 20) a.x = -20;
        }
      }
    }
    function drawSharedParticles(c) {
      for (const p of game.particles) {
        c.save();
        c.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        if (p.shape === "heart") drawHeart(c, 0, 0, p.size / 12, p.color);
        else drawStar(c, 0, 0, p.size, p.color);
        c.restore();
      }
    }
