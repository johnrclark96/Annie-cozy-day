    function sKey(key) { return STORE_PREFIX + key; }
    function loadJSON(key, fallback) {
      try {
        const raw = localStorage.getItem(sKey(key));
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) {
        return fallback;
      }
    }
    function saveJSON(key, value) {
      try { localStorage.setItem(sKey(key), JSON.stringify(value)); } catch (err) {}
    }
    function loadNumber(key, fallback = 0) {
      try {
        const raw = localStorage.getItem(sKey(key));
        const num = raw === null ? fallback : Number(raw);
        return Number.isFinite(num) ? num : fallback;
      } catch (err) {
        return fallback;
      }
    }
    function saveNumber(key, value) {
      try { localStorage.setItem(sKey(key), String(value)); } catch (err) {}
    }
    function loadBool(key, fallback = false) {
      try {
        const raw = localStorage.getItem(sKey(key));
        return raw === null ? fallback : raw === "true";
      } catch (err) {
        return fallback;
      }
    }
    function saveBool(key, value) {
      try { localStorage.setItem(sKey(key), String(!!value)); } catch (err) {}
    }

    const store = {
      muted: loadBool("muted", false),
      best_treat: loadNumber("best_treat", 0),
      best_laser: loadNumber("best_laser", 0),
      best_cuddle: loadNumber("best_cuddle", 0),
      best_walk: loadNumber("best_walk", 0),
      best_nap: loadNumber("best_nap", 0),
      best_bath: loadNumber("best_bath", 0),
      best_sort: loadNumber("best_sort", 0),
      best_pillow: loadNumber("best_pillow", 0),
      best_findluna: loadNumber("best_findluna", 0),
      best_window: loadNumber("best_window", 0),
      best_pawstep: loadNumber("best_pawstep", 0),
      stats: loadJSON("stats", {
        totalTreatCatches: 0,
        bestTreatCombo: 1,
        bestLaserCombo: 1,
        bestCuddle: 0,
        cuddleWon: false
      }),
      achievements: loadJSON("achievements", {
        obiBestFriend: false,
        comboStar: false,
        catWhisperer: false,
        pouncePerfect: false,
        couchPotato: false,
        maximumCozy: false,
        goodWalker: false,
        napMaster: false,
        squeakyClean: false,
        sortingPro: false,
        whackQueen: false,
        sharpEye: false,
        birdWatcher: false,
        goodMemory: false
      }),
      decor: loadJSON("decor", {
        fairyLights: false,
        plant2: false,
        petBed: false,
        rugColor: 0,
        lampOn: true,
        roomPreset: 0,
        timeOfDay: 1,
        wallArt2: 0,
        windowPlant: false,
        cozyBlanket: false,
        photoWall: false
      }),
      firstVisit: loadBool("firstVisit", true),
      pet_obi_joy: loadNumber("pet_obi_joy", 54),
      pet_luna_joy: loadNumber("pet_luna_joy", 56),
      lastKnownStars: loadNumber("lastKnownStars", 0),
      bubbleOnboarded: loadBool("bubbleOnboarded", false),
      pet_food_fill: loadNumber("pet_food_fill", 80),
      pet_food_lastFill: loadNumber("pet_food_lastFill", Date.now()),
      pet_water_fill: loadNumber("pet_water_fill", 80),
      pet_water_lastFill: loadNumber("pet_water_lastFill", Date.now()),
      lastVisitDate: loadJSON("lastVisitDate", null),
      careStreak: loadJSON("careStreak", { count: 0, lastCareDate: null, todayActions: [], bestStreak: 0, milestonesClaimed: [] }),
      dailyTasks: loadJSON("dailyTasks", { date: null, tasks: [], completed: [] }),
      coins: loadNumber("coins", 50),
      wardrobe: loadJSON("wardrobe", { owned: [], equipped: { obi: null, luna: null } }),
      backyardFlowers: loadNumber("backyardFlowers", 0),
      scrapbook: loadJSON("scrapbook", { entries: [], photosViewed: 0 })
    };

    /* backfill decor keys for existing saves */
    if (store.decor.lampOn === undefined) store.decor.lampOn = true;
    if (store.decor.roomPreset === undefined) store.decor.roomPreset = 0;
    if (store.decor.timeOfDay === undefined) store.decor.timeOfDay = 1;
    if (store.decor.wallArt2 === undefined) store.decor.wallArt2 = 0;
    if (store.decor.windowPlant === undefined) store.decor.windowPlant = false;
    if (store.decor.cozyBlanket === undefined) store.decor.cozyBlanket = false;
    if (store.decor.photoWall === undefined) store.decor.photoWall = false;
    if (store.achievements.squeakyClean === undefined) store.achievements.squeakyClean = false;
    if (store.achievements.sortingPro === undefined) store.achievements.sortingPro = false;
    if (store.achievements.whackQueen === undefined) store.achievements.whackQueen = false;
    if (store.achievements.sharpEye === undefined) store.achievements.sharpEye = false;
    if (store.achievements.birdWatcher === undefined) store.achievements.birdWatcher = false;
    if (store.achievements.goodMemory === undefined) store.achievements.goodMemory = false;
    /* stats migration for Phase 3 */
    if (store.stats.totalSessions === undefined) store.stats.totalSessions = 0;
    if (store.stats.totalPhotos === undefined) store.stats.totalPhotos = 0;
    if (store.stats.totalCoinsEarned === undefined) store.stats.totalCoinsEarned = 0;

    function saveStats() { saveJSON("stats", store.stats); }
    function saveAchievements() { saveJSON("achievements", store.achievements); }
    function saveDecor() { saveJSON("decor", store.decor); }
    function saveCareStreak() { saveJSON("careStreak", store.careStreak); }
    function setBest(gameId, value) {
      const key = "best_" + gameId;
      if (value > store[key]) {
        store[key] = value;
        saveNumber(key, value);
        return true;
      }
      return false;
    }
    function addCoins(amount) {
      store.coins = Math.max(0, store.coins + amount);
      saveNumber("coins", store.coins);
      if (amount > 0) {
        store.stats.totalCoinsEarned += amount;
        saveStats();
      }
      return store.coins;
    }
    function saveWardrobe() { saveJSON("wardrobe", store.wardrobe); }
    function addScrapbookEntry(type, text, icon) {
      var entry = { type: type, text: text, date: new Date().toDateString(), icon: icon || "star" };
      store.scrapbook.entries.push(entry);
      if (store.scrapbook.entries.length > 50) store.scrapbook.entries.shift();
      saveJSON("scrapbook", store.scrapbook);
    }
    function totalStarsEarned() {
      const games = [
        { best: store.best_treat, thresholds: [300, 700, 1400] },
        { best: store.best_laser, thresholds: [200, 500, 1000] },
        { best: store.best_cuddle, thresholds: [30, 60, 90] },
        { best: store.best_walk, thresholds: [200, 450, 800] },
        { best: store.best_nap, thresholds: [250, 550, 1000] },
        { best: store.best_bath, thresholds: [120, 280, 500] },
        { best: store.best_sort, thresholds: [120, 280, 550] },
        { best: store.best_pillow, thresholds: [150, 350, 650] },
        { best: store.best_findluna, thresholds: [100, 250, 500] },
        { best: store.best_window, thresholds: [150, 400, 750] },
        { best: store.best_pawstep, thresholds: [80, 200, 400] }
      ];
      let total = 0;
      for (const g of games) {
        if (g.best >= g.thresholds[0]) total++;
        if (g.best >= g.thresholds[1]) total++;
        if (g.best >= g.thresholds[2]) total++;
      }
      return total;
    }
