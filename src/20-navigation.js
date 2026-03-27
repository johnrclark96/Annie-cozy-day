    function blinkSignal(t, offset = 0.6) {
      const mod = (t + offset) % 4.2;
      return mod < 0.14 || (mod > 2.4 && mod < 2.53);
    }
    function earSignal(t) {
      const mod = t % 3.8;
      if (mod < 0.18) return Math.sin(mod / 0.18 * Math.PI);
      return 0;
    }

    function spawnTrail(x, y, color) {
      if (game.particles.length > 280) return;
      if (Math.random() < 0.55) {
        game.particles.push({
          x: x + rand(-4, 4),
          y: y + rand(-4, 4),
          vx: rand(-8, 8),
          vy: rand(-15, -5),
          life: 0.35,
          maxLife: 0.35,
          size: rand(3, 5),
          rot: rand(0, Math.PI * 2),
          vr: rand(-2, 2),
          shape: "star",
          color
        });
      }
    }

    function transitionTo(nextScene) {
      nextScene.enter();
      game.transition = {
        from: game.scene,
        to: nextScene,
        t: 0,
        duration: 0.6
      };
    }

