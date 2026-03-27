    buildStaticCaches();
    loadCozyArt();
    game.scene = SceneRegistry.create("title");
    game.scene.enter();
    requestAnimationFrame(loop);
