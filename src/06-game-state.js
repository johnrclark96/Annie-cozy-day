    const game = {
      time: 0,
      last: 0,
      scene: null,
      transition: null,
      mouse: { x: 0, y: 0, down: false },
      keys: Object.create(null),
      hovered: false,
      particles: [],
      ambient: [],
      visible: true,
      shake: 0,
      shakeIntensity: 4,
      shakeX: 0,
      shakeY: 0
    };

    function screenShake(intensity = 4, duration = 0.2) {
      game.shake = Math.max(game.shake, duration);
      game.shakeIntensity = intensity;
    }

    const SceneRegistry = {
      _factories: {},
      register(name, factory) { this._factories[name] = factory; },
      create(name) {
        const f = this._factories[name];
        if (!f) throw new Error("Unknown scene: " + name);
        return f();
      }
    };
