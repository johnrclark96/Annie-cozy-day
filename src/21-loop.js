    function drawMuteIcon(c) {
      const hovered = pointInRect(game.mouse.x, game.mouse.y, { x: W - 54, y: 12, w: 40, h: 40 });
      drawSpeakerIcon(c, W - 34, 32, store.muted, hovered);
    }

    function handleMuteClick(x, y) {
      const rect = { x: W - 54, y: 12, w: 40, h: 40 };
      if (pointInRect(x, y, rect)) {
        audio.ensure();
        store.muted = !store.muted;
        saveBool("muted", store.muted);
        if (!store.muted) { audio.menu(); if (game.scene && game.scene.name === "hangout") audio.startAmbient(); }
        else { audio.stopAmbient(); }
        return true;
      }
      return false;
    }

    function loop(ts) {
      if (!game.last) game.last = ts;
      let dt = (ts - game.last) / 1000;
      game.last = ts;
      dt = clamp(dt, 0, 0.033);
      game.time += dt;

      updateSharedParticles(dt);

      if (game.transition) {
        game.transition.t += dt;
        if (game.transition.from) game.transition.from.update(dt);
        if (game.transition.t >= game.transition.duration) {
          game.scene = game.transition.to;
          game.transition = null;
        }
      } else if (game.scene) {
        game.scene.update(dt);
      }

      /* screen shake */
      if (game.shake > 0) {
        game.shake -= dt;
        const intensity = game.shakeIntensity * clamp(game.shake / 0.1, 0, 1);
        game.shakeX = (Math.random() - 0.5) * intensity * 2;
        game.shakeY = (Math.random() - 0.5) * intensity * 2;
      } else {
        game.shakeX = 0;
        game.shakeY = 0;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(game.shakeX, game.shakeY);
      if (game.transition) {
        const p = clamp(game.transition.t / game.transition.duration, 0, 1);
        if (game.transition.from) {
          ctx.save();
          ctx.globalAlpha = 1 - p;
          ctx.translate(W/2, H/2); ctx.scale(1 - p*0.03, 1 - p*0.03); ctx.translate(-W/2, -H/2);
          game.transition.from.draw(ctx);
          drawMuteIcon(ctx);
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = p;
        ctx.translate(W/2, H/2); ctx.scale(0.97 + p*0.03, 0.97 + p*0.03); ctx.translate(-W/2, -H/2);
        game.transition.to.draw(ctx);
        drawMuteIcon(ctx);
        ctx.restore();
      } else if (game.scene) {
        game.scene.draw(ctx);
        drawMuteIcon(ctx);
      }
      drawSharedParticles(ctx);

      /* warm vignette */
      ctx.save();
      const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.35, W/2, H/2, Math.max(W,H)*0.72);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(40,25,15,0.18)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.restore(); /* end screen shake transform */

      if (game.scene || game.transition) {
        const activeScene = game.transition ? game.transition.from : game.scene;
        const overMute = pointInRect(game.mouse.x, game.mouse.y, { x: W - 54, y: 12, w: 40, h: 40 });
        canvas.style.cursor = (overMute || (activeScene && activeScene.interactiveAt(game.mouse.x, game.mouse.y))) ? "pointer" : "default";
      }

      requestAnimationFrame(loop);
    }
