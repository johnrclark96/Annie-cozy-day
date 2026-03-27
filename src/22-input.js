    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      game.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      game.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
      const activeScene = game.transition ? game.transition.from : game.scene;
      if (activeScene && activeScene.onMouseMove) activeScene.onMouseMove(game.mouse.x, game.mouse.y);
    });
    canvas.addEventListener("mousedown", () => { game.mouse.down = true; });
    window.addEventListener("mouseup", () => { game.mouse.down = false; });
    canvas.addEventListener("mouseleave", () => { game.mouse.down = false; });

    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width / r.width);
      const y = (e.clientY - r.top) * (canvas.height / r.height);
      game.mouse.x = x;
      game.mouse.y = y;
      audio.ensure();
      if (game.transition) return;
      if (handleMuteClick(x, y)) return;
      const activeScene = game.scene;
      if (activeScene && activeScene.onClick) activeScene.onClick(x, y);
    });

    /* ── Touch support ── */
    function touchCoords(e) {
      const t = e.changedTouches[0];
      const r = canvas.getBoundingClientRect();
      return {
        x: (t.clientX - r.left) * (canvas.width / r.width),
        y: (t.clientY - r.top) * (canvas.height / r.height)
      };
    }
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const { x, y } = touchCoords(e);
      game.mouse.x = x;
      game.mouse.y = y;
      game.mouse.down = true;
      audio.ensure();
      if (game.transition) return;
      const activeScene = game.scene;
      if (activeScene && activeScene.onMouseMove) activeScene.onMouseMove(x, y);
      if (handleMuteClick(x, y)) return;
      if (activeScene && activeScene.onClick) activeScene.onClick(x, y);
    }, { passive: false });
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const { x, y } = touchCoords(e);
      game.mouse.x = x;
      game.mouse.y = y;
      const activeScene = game.transition ? game.transition.from : game.scene;
      if (activeScene && activeScene.onMouseMove) activeScene.onMouseMove(x, y);
    }, { passive: false });
    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      game.mouse.down = false;
    }, { passive: false });
    canvas.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      game.mouse.down = false;
    }, { passive: false });

    window.addEventListener("keydown", (e) => {
      game.keys[e.key] = true;
      const activeScene = game.transition ? game.transition.from : game.scene;
      if (activeScene && activeScene.onKeyDown) activeScene.onKeyDown(e.key);
      if ([" ", "ArrowLeft", "ArrowRight", "Escape"].includes(e.key)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => { game.keys[e.key] = false; });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        const activeScene = game.transition ? game.transition.from : game.scene;
        if (activeScene instanceof BaseMinigameScene && activeScene.phase === "play") activeScene.paused = true;
      }
    });
