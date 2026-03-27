    class BackyardScene extends BaseScene {
      constructor() {
        super("backyard");
        this.obi = {
          x: 300, y: 480, homeX: 300, homeY: 480,
          targetX: 300, targetY: 480, joy: store.pet_obi_joy, facing: 1,
          bounce: 0, petTimer: 0, happyTimer: 0,
          pose: "sit", actionTimer: rand(3, 6), action: "idle",
          splashing: false, digging: false
        };
        this.luna = {
          x: 600, y: 480, homeX: 600, homeY: 480,
          targetX: 600, targetY: 480, joy: store.pet_luna_joy, facing: -1,
          wiggle: 0, earTwitch: 0,
          pose: "sit", actionTimer: rand(3, 6), action: "idle",
          inTree: false, stalking: false
        };
        this.goInsideButton = { x: 10, y: 300, w: 60, h: 80 };
        this.hoverKey = null;
        this.statusText = "Welcome to the backyard!";
        this.statusPulse = 0;
        this.floatingTexts = [];
        this.coinPopup = null;
        this.cameraFlash = 0;
        /* bird feeder */
        this.feeder = { x: 620, y: 280, filled: false, birdTimer: 0, birds: [] };
        /* garden */
        this.garden = { x: 180, y: 460 };
        /* kiddie pool */
        this.pool = { x: 420, y: 480 };
        /* tree */
        this.tree = { x: 680, y: 180 };
        /* tooltip */
        this.tooltip = null;
        /* camera — below mute icon */
        this.cameraButton = { x: W - 54, y: 56, w: 40, h: 40 };
        /* joy save timer */
        this.joySaveTimer = 0;
        /* first visit scrapbook */
        this.checkedFirstVisit = false;
      }
      enter() {
        this.obi.joy = store.pet_obi_joy;
        this.luna.joy = store.pet_luna_joy;
        audio.startAmbient();
        if (!this.checkedFirstVisit) {
          this.checkedFirstVisit = true;
          var entries = store.scrapbook.entries;
          var hasVisit = false;
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].type === "milestone" && entries[i].text === "Explored the backyard for the first time!") { hasVisit = true; break; }
          }
          if (!hasVisit) {
            addScrapbookEntry("milestone", "Explored the backyard for the first time!", "heart");
          }
        }
      }
      addFloatingText(text, x, y, color) {
        this.floatingTexts.push({ text: text, x: x, y: y, color: color || COLORS.gold, life: 1.5 });
      }
      earnCoins(amount) {
        addCoins(amount);
        this.coinPopup = { amount: amount, timer: 1.5 };
      }
      capturePhoto() {
        if (!spriteArt.ready) {
          this.statusText = "Please wait for images to load...";
          this.statusPulse = 1;
          return;
        }
        var captureCanvas = makeBufferCanvas(W, H);
        var cc = captureCanvas.getContext("2d");
        var tod = store.decor.timeOfDay || 1;
        this.drawBackground(cc, tod);
        this.drawInteractiveObjects(cc);
        var obiSt = { pose: this.obi.pose, expression: "happy", tail: Math.sin(game.time * 7), bounce: this.obi.bounce, facing: this.obi.facing };
        drawObi(cc, this.obi.x, this.obi.y, 1.0, obiSt);
        drawAccessoryOverlay(cc, "obi", this.obi.x, this.obi.y, 1.0, obiSt.pose, obiSt.facing);
        var lunaSt = { pose: this.luna.pose, tail: Math.sin(game.time * 2), facing: this.luna.facing, wiggle: this.luna.wiggle, earTwitch: this.luna.earTwitch };
        drawLuna(cc, this.luna.x, this.luna.y, 0.95, lunaSt);
        drawAccessoryOverlay(cc, "luna", this.luna.x, this.luna.y, 0.95, lunaSt.pose, lunaSt.facing);
        cc.fillStyle = "rgba(122,78,54,0.3)";
        cc.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        cc.textAlign = "right";
        cc.fillText("Annie's Cozy Day", W - 12, H - 8);
        var dataURL;
        try { dataURL = captureCanvas.toDataURL("image/png"); }
        catch(e) { this.statusText = "Couldn't capture photo."; this.statusPulse = 1; return; }
        if (isMobile) { window.open(dataURL, "_blank"); }
        else {
          var link = document.createElement("a");
          link.download = "cozy-moment-" + Date.now() + ".png";
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        this.cameraFlash = 0.4;
        audio.tinyChime();
        this.statusText = "Photo saved!";
        this.statusPulse = 1;
        var thumbCanvas = makeBufferCanvas(160, 120);
        thumbCanvas.getContext("2d").drawImage(captureCanvas, 0, 0, 160, 120);
        var thumbData;
        try { thumbData = thumbCanvas.toDataURL("image/jpeg", 0.6); } catch(e) { return; }
        var photos = loadJSON("photos", []);
        photos.push({ data: thumbData, date: new Date().toDateString(), room: this.name });
        if (photos.length > 20) photos.shift();
        saveJSON("photos", photos);
        store.stats.totalPhotos++;
        saveStats();
        if (store.stats.totalPhotos === 1) {
          addScrapbookEntry("milestone", "Took the first photo!", "star");
        }
      }
      saveJoy() {
        store.pet_obi_joy = this.obi.joy;
        store.pet_luna_joy = this.luna.joy;
        saveNumber("pet_obi_joy", this.obi.joy);
        saveNumber("pet_luna_joy", this.luna.joy);
      }
      update(dt) {
        super.update(dt);
        this.statusPulse = Math.max(0, this.statusPulse - dt * 2.6);
        if (this.coinPopup) {
          this.coinPopup.timer -= dt;
          if (this.coinPopup.timer <= 0) this.coinPopup = null;
        }
        if (this.cameraFlash > 0) this.cameraFlash = Math.max(0, this.cameraFlash - dt * 2.5);
        /* floating texts */
        for (var fi = this.floatingTexts.length - 1; fi >= 0; fi--) {
          this.floatingTexts[fi].life -= dt;
          this.floatingTexts[fi].y -= dt * 30;
          if (this.floatingTexts[fi].life <= 0) this.floatingTexts.splice(fi, 1);
        }
        /* joy save */
        this.joySaveTimer += dt;
        if (this.joySaveTimer > 5) {
          this.joySaveTimer = 0;
          this.saveJoy();
        }
        /* update obi */
        this.updateObiBackyard(dt);
        /* update luna */
        this.updateLunaBackyard(dt);
        /* bird feeder */
        this.updateFeeder(dt);
      }
      updateObiBackyard(dt) {
        var o = this.obi;
        o.bounce = Math.max(0, o.bounce - dt * 3);
        o.happyTimer = Math.max(0, o.happyTimer - dt);
        o.actionTimer -= dt;
        /* move toward target */
        if (Math.abs(o.x - o.targetX) > 4) {
          o.facing = o.targetX > o.x ? 1 : -1;
          o.x = clamp(o.x + Math.sign(o.targetX - o.x) * 60 * dt, 80, 720);
          o.pose = "run";
        } else if (o.digging) {
          o.pose = "dig";
        } else if (o.splashing) {
          o.pose = "splash";
          o.happyTimer = 0.5;
        } else {
          o.pose = "sit";
        }
        if (o.actionTimer <= 0 && !o.splashing && !o.digging) {
          o.actionTimer = rand(5, 10);
          var choice = Math.random();
          if (choice < 0.3) {
            /* wander */
            o.targetX = clamp(rand(120, 600), 120, 600);
          } else if (choice < 0.5 && store.backyardFlowers > 0) {
            /* dig up a flower */
            o.targetX = this.garden.x;
            o.digging = true;
            o.actionTimer = 3;
          } else {
            /* sniff around */
            o.targetX = clamp(rand(120, 600), 120, 600);
          }
        }
        /* finish digging */
        if (o.digging && o.actionTimer <= 0) {
          o.digging = false;
          if (store.backyardFlowers > 0) {
            o.joy = clamp(o.joy + 4, 0, 100);
            store.backyardFlowers = Math.max(0, store.backyardFlowers - 1);
            saveNumber("backyardFlowers", store.backyardFlowers);
            this.addFloatingText("Obi dug up a flower!", o.x, o.y - 60, "#8B6914");
            this.statusText = "Obi dug up a tulip! Bad boy!";
            this.statusPulse = 1;
            spawnParticleBurst(o.x, o.y - 30, ["#8B6914", "#5C7A3A"], 6, ["star"]);
            addScrapbookEntry("event", "Obi dug up a flower in the garden!", "bone");
          }
        }
        /* finish splashing */
        if (o.splashing && o.actionTimer <= 0) {
          o.splashing = false;
        }
      }
      updateLunaBackyard(dt) {
        var l = this.luna;
        l.wiggle = Math.sin(game.time * 2) * 0.02;
        l.earTwitch = earSignal(game.time);
        l.actionTimer -= dt;
        if (l.inTree) {
          l.pose = "treeSit";
          l.x = this.tree.x - 30;
          l.y = this.tree.y + 40;
        } else if (l.stalking) {
          l.pose = "stalk";
        } else if (Math.abs(l.x - l.targetX) > 4) {
          l.facing = l.targetX > l.x ? 1 : -1;
          l.x = clamp(l.x + Math.sign(l.targetX - l.x) * 40 * dt, 80, 720);
          l.pose = "lounge";
        } else {
          l.pose = "sit";
        }
        if (l.actionTimer <= 0 && !l.inTree && !l.stalking) {
          l.actionTimer = rand(6, 12);
          var choice = Math.random();
          if (choice < 0.35) {
            /* climb tree */
            l.inTree = true;
            l.actionTimer = rand(8, 15);
          } else if (choice < 0.55) {
            /* stalk bugs */
            l.stalking = true;
            l.targetX = rand(200, 500);
            l.actionTimer = rand(3, 5);
          } else {
            /* wander */
            l.targetX = clamp(rand(150, 650), 150, 650);
          }
        }
        /* finish tree */
        if (l.inTree && l.actionTimer <= 0) {
          l.inTree = false;
          l.y = 480;
          l.targetY = 480;
          l.targetX = rand(200, 500);
        }
        /* finish stalking */
        if (l.stalking && l.actionTimer <= 0) {
          l.stalking = false;
          l.joy = clamp(l.joy + 2, 0, 100);
          spawnParticleBurst(l.x, l.y - 30, ["#5C7A3A"], 3, ["star"]);
        }
      }
      updateFeeder(dt) {
        if (this.feeder.filled) {
          this.feeder.birdTimer -= dt;
          if (this.feeder.birdTimer <= 0 && this.feeder.birds.length === 0) {
            /* birds arrive */
            var count = Math.floor(rand(2, 4));
            for (var i = 0; i < count; i++) {
              this.feeder.birds.push({ x: this.feeder.x + rand(-20, 20), y: this.feeder.y - 10 + rand(-10, 10), phase: rand(0, 6) });
            }
            this.luna.joy = clamp(this.luna.joy + 2, 0, 100);
            this.addFloatingText("+2 Luna joy", this.luna.x, this.luna.y - 50, "#9B7D3C");
            this.feeder.birdTimer = 0;
          } else if (this.feeder.birds.length > 0 && this.feeder.birdTimer < -8) {
            this.feeder.birds = [];
            this.feeder.filled = false;
          }
        }
      }
      onClick(x, y) {
        /* camera */
        if (pointInRect(x, y, this.cameraButton)) {
          this.capturePhoto();
          return;
        }
        /* go inside */
        if (pointInRect(x, y, this.goInsideButton)) {
          audio.menu();
          this.saveJoy();
          transitionTo(SceneRegistry.create("hangout"));
          return;
        }
        /* bird feeder */
        if (Math.abs(x - this.feeder.x) < 40 && Math.abs(y - this.feeder.y) < 40) {
          if (!this.feeder.filled) {
            this.feeder.filled = true;
            this.feeder.birdTimer = rand(8, 15);
            this.feeder.birds = [];
            audio.tinyChime();
            this.statusText = "Feeder filled! Birds will come soon.";
            this.statusPulse = 1;
          }
          return;
        }
        /* garden — plant a flower */
        if (Math.abs(x - this.garden.x) < 50 && Math.abs(y - this.garden.y) < 40) {
          if (store.backyardFlowers < 6) {
            if (store.coins >= 3) {
              addCoins(-3);
              store.backyardFlowers++;
              saveNumber("backyardFlowers", store.backyardFlowers);
              audio.tinyChime();
              this.addFloatingText("Planted!", this.garden.x, this.garden.y - 30, "#5C7A3A");
              this.statusText = "Planted a flower! (" + store.backyardFlowers + "/6)";
              this.statusPulse = 1;
            } else {
              audio.miss();
              this.statusText = "Need 3 coins to plant a flower!";
              this.statusPulse = 1;
            }
          } else {
            this.statusText = "Garden is full! (6/6)";
          }
          return;
        }
        /* kiddie pool — call Obi */
        if (Math.abs(x - this.pool.x) < 50 && Math.abs(y - this.pool.y) < 40) {
          if (!this.obi.splashing && !this.obi.digging) {
            this.obi.targetX = this.pool.x;
            this.obi.splashing = true;
            this.obi.actionTimer = rand(3, 5);
            this.obi.joy = clamp(this.obi.joy + 6, 0, 100);
            this.addFloatingText("+6 Obi joy", this.obi.x, this.obi.y - 50, "#4A90D9");
            this.statusText = "Obi loves the pool!";
            this.statusPulse = 1;
            audio.combo();
            spawnParticleBurst(this.pool.x, this.pool.y - 20, ["#87CEEB", "#B3D9FF"], 8, ["star"]);
          }
          return;
        }
      }
      onMouseMove(x, y) {
        this.hoverKey = null;
        this.tooltip = null;
        if (pointInRect(x, y, this.cameraButton)) this.hoverKey = "camera";
        else if (pointInRect(x, y, this.goInsideButton)) this.hoverKey = "inside";
        else if (Math.abs(x - this.feeder.x) < 40 && Math.abs(y - this.feeder.y) < 40) {
          this.hoverKey = "feeder";
          this.tooltip = { x: this.feeder.x, y: this.feeder.y - 40, title: "Bird Feeder", body: this.feeder.filled ? "Birds are coming..." : "Click to fill!" };
        } else if (Math.abs(x - this.garden.x) < 50 && Math.abs(y - this.garden.y) < 40) {
          this.hoverKey = "garden";
          this.tooltip = { x: this.garden.x, y: this.garden.y - 40, title: "Garden", body: store.backyardFlowers + "/6 flowers. 3 coins to plant." };
        } else if (Math.abs(x - this.pool.x) < 50 && Math.abs(y - this.pool.y) < 40) {
          this.hoverKey = "pool";
          this.tooltip = { x: this.pool.x, y: this.pool.y - 40, title: "Kiddie Pool", body: "Click to call Obi for a splash!" };
        } else if (Math.abs(x - this.tree.x) < 50 && y > this.tree.y - 60 && y < this.tree.y + 100) {
          this.hoverKey = "tree";
          this.tooltip = { x: this.tree.x, y: this.tree.y - 60, title: "Oak Tree", body: this.luna.inTree ? "Luna is relaxing up there!" : "Luna loves to climb here." };
        }
      }
      interactiveAt(x, y) {
        if (pointInRect(x, y, this.cameraButton)) return true;
        if (pointInRect(x, y, this.goInsideButton)) return true;
        if (Math.abs(x - this.feeder.x) < 40 && Math.abs(y - this.feeder.y) < 40) return true;
        if (Math.abs(x - this.garden.x) < 50 && Math.abs(y - this.garden.y) < 40) return true;
        if (Math.abs(x - this.pool.x) < 50 && Math.abs(y - this.pool.y) < 40) return true;
        if (Math.abs(x - this.tree.x) < 50 && y > this.tree.y - 60 && y < this.tree.y + 100) return true;
        return false;
      }
      onKeyDown(key) {
        if (key === "Escape") {
          audio.menu();
          this.saveJoy();
          transitionTo(SceneRegistry.create("hangout"));
        }
      }
      draw(c) {
        var tod = store.decor.timeOfDay || 1;
        this.drawBackground(c, tod);
        this.drawInteractiveObjects(c);
        /* draw pets */
        var obiState = { pose: this.obi.pose, expression: this.obi.happyTimer > 0 ? "excited" : "happy",
          tail: Math.sin(game.time * 7), bounce: this.obi.bounce, facing: this.obi.facing };
        drawObi(c, this.obi.x, this.obi.y, 1.0, obiState);
        drawAccessoryOverlay(c, "obi", this.obi.x, this.obi.y, 1.0, obiState.pose, obiState.facing);

        var lunaState = { pose: this.luna.pose, tail: Math.sin(game.time * 2), facing: this.luna.facing,
          wiggle: this.luna.wiggle, earTwitch: this.luna.earTwitch, pawBat: this.luna.pawBat || 0 };
        drawLuna(c, this.luna.x, this.luna.y, 0.95, lunaState);
        drawAccessoryOverlay(c, "luna", this.luna.x, this.luna.y, 0.95, lunaState.pose, lunaState.facing);

        /* feeder birds */
        for (var bi = 0; bi < this.feeder.birds.length; bi++) {
          var bird = this.feeder.birds[bi];
          c.save();
          c.translate(bird.x + Math.sin(game.time * 3 + bird.phase) * 4, bird.y + Math.cos(game.time * 2 + bird.phase) * 3);
          c.fillStyle = "#5C4434";
          c.beginPath();
          c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#E8A020";
          c.beginPath(); c.moveTo(5, -1); c.lineTo(9, 0); c.lineTo(5, 1); c.closePath(); c.fill();
          /* wings */
          c.fillStyle = "#6B5B4E";
          c.beginPath(); c.ellipse(-3, -2, 6, 3, -0.3 + Math.sin(game.time * 8 + bird.phase) * 0.3, 0, Math.PI * 2); c.fill();
          c.restore();
        }

        /* go inside button */
        c.save();
        var insideHover = this.hoverKey === "inside";
        c.fillStyle = insideHover ? "rgba(255,248,240,0.85)" : "rgba(255,248,240,0.5)";
        rr(c, this.goInsideButton.x, this.goInsideButton.y, this.goInsideButton.w, this.goInsideButton.h, 10);
        c.fill();
        c.fillStyle = insideHover ? "#7A4E36" : "rgba(122,78,54,0.6)";
        c.textAlign = "center";
        c.font = '12px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("\u2190 Go", 40, this.goInsideButton.y + 35);
        c.fillText("Inside", 40, this.goInsideButton.y + 50);
        c.restore();

        /* floating texts */
        for (var fi = 0; fi < this.floatingTexts.length; fi++) {
          var ft = this.floatingTexts[fi];
          c.save();
          c.globalAlpha = clamp(ft.life / 0.4, 0, 1);
          c.fillStyle = ft.color;
          c.font = '16px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.fillText(ft.text, ft.x, ft.y);
          c.restore();
        }

        /* camera button */
        c.save();
        var camH = this.hoverKey === "camera";
        c.fillStyle = camH ? "rgba(92,68,52,0.82)" : "rgba(92,68,52,0.45)";
        rr(c, this.cameraButton.x, this.cameraButton.y, this.cameraButton.w, this.cameraButton.h, 10);
        c.fill();
        c.fillStyle = COLORS.cream;
        rr(c, this.cameraButton.x + 8, this.cameraButton.y + 12, 24, 18, 4);
        c.fill();
        c.fillStyle = camH ? "rgba(92,68,52,0.82)" : "rgba(92,68,52,0.45)";
        c.beginPath(); c.arc(this.cameraButton.x + 20, this.cameraButton.y + 21, 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = COLORS.cream;
        rr(c, this.cameraButton.x + 14, this.cameraButton.y + 8, 12, 5, 2);
        c.fill();
        c.restore();

        /* coin pill (same as hangout) */
        c.save();
        c.fillStyle = "rgba(255,248,240,0.65)";
        rr(c, 452, 12, 72, 22, 11);
        c.fill();
        c.fillStyle = COLORS.gold;
        c.beginPath(); c.arc(466, 23, 7, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#FFF4C0";
        c.beginPath(); c.arc(464, 21, 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = COLORS.gold;
        c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "center";
        c.fillText(store.coins, 503, 28);
        c.restore();
        /* coin popup */
        if (this.coinPopup) {
          c.save();
          var cpAlpha = clamp(this.coinPopup.timer / 0.4, 0, 1);
          c.globalAlpha = cpAlpha;
          c.fillStyle = COLORS.gold;
          c.font = '15px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.fillText("+" + this.coinPopup.amount, 503, 6 - (1 - cpAlpha) * 12);
          c.restore();
        }

        /* status text */
        c.fillStyle = "#5C3D2E";
        c.textAlign = "center";
        c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        var sAlpha = 0.7 + this.statusPulse * 0.3;
        c.globalAlpha = sAlpha;
        c.fillText(this.statusText, 400, 560);
        c.globalAlpha = 1;

        /* tooltip */
        if (this.tooltip && this.tooltipAlpha > 0.02) drawTooltip(c, this.tooltip.x, this.tooltip.y, this.tooltip.title, this.tooltip.body, this.tooltipAlpha);

        /* camera flash */
        if (this.cameraFlash > 0) {
          c.save();
          c.globalAlpha = this.cameraFlash;
          c.fillStyle = "#FFFFFF";
          c.fillRect(0, 0, W, H);
          c.restore();
        }
      }
      drawBackground(c, tod) {
        /* sky */
        var skyG = c.createLinearGradient(0, 0, 0, 250);
        if (tod === 0) { skyG.addColorStop(0, "#FFB088"); skyG.addColorStop(1, "#FFCDA8"); }
        else if (tod === 1) { skyG.addColorStop(0, "#87CEEB"); skyG.addColorStop(1, "#B3E0F2"); }
        else if (tod === 2) { skyG.addColorStop(0, "#C87848"); skyG.addColorStop(1, "#D89060"); }
        else { skyG.addColorStop(0, "#1A1E38"); skyG.addColorStop(1, "#2A3058"); }
        c.fillStyle = skyG;
        c.fillRect(0, 0, W, 300);

        /* stars at night */
        if (tod === 3) {
          c.fillStyle = "rgba(255,255,220,0.6)";
          var starPositions = [[100, 30], [250, 60], [380, 20], [520, 50], [650, 35], [720, 70], [180, 80]];
          for (var si = 0; si < starPositions.length; si++) {
            var sx = starPositions[si][0], sy = starPositions[si][1];
            var tw = Math.sin(game.time * 2 + si * 1.3) * 0.3 + 0.7;
            c.globalAlpha = tw * 0.6;
            c.beginPath(); c.arc(sx, sy, 1.5, 0, Math.PI * 2); c.fill();
          }
          c.globalAlpha = 1;
        }

        /* grass */
        var grassG = c.createLinearGradient(0, 280, 0, H);
        grassG.addColorStop(0, tod === 3 ? "#2A4020" : "#7CB342");
        grassG.addColorStop(1, tod === 3 ? "#1E3018" : "#5A8E2A");
        c.fillStyle = grassG;
        c.fillRect(0, 280, W, H - 280);

        /* grass detail */
        c.fillStyle = tod === 3 ? "rgba(80,120,50,0.3)" : "rgba(100,160,60,0.3)";
        for (var gi = 0; gi < 20; gi++) {
          var gx = (gi * 41 + 15) % W;
          var gy = 290 + (gi * 17 % 200);
          c.beginPath();
          c.moveTo(gx, gy); c.lineTo(gx + 3, gy - 8 - Math.sin(game.time + gi) * 2); c.lineTo(gx + 6, gy);
          c.fill();
        }

        /* fence */
        c.fillStyle = tod === 3 ? "#4A3828" : "#D2B48C";
        for (var fi = 0; fi < 14; fi++) {
          var fx = 20 + fi * 58;
          c.fillRect(fx, 260, 8, 50);
          /* picket top */
          c.beginPath(); c.moveTo(fx - 2, 260); c.lineTo(fx + 4, 248); c.lineTo(fx + 10, 260); c.closePath(); c.fill();
        }
        /* horizontal rails */
        c.fillRect(0, 275, W, 5);
        c.fillRect(0, 295, W, 5);

        /* tree */
        c.fillStyle = tod === 3 ? "#3A2818" : "#8B6914";
        c.fillRect(this.tree.x - 10, this.tree.y, 20, 320);
        /* branch */
        c.fillRect(this.tree.x - 50, this.tree.y + 30, 60, 8);
        /* canopy */
        c.fillStyle = tod === 3 ? "#1E3818" : "#4A8030";
        c.beginPath(); c.arc(this.tree.x, this.tree.y - 20, 60, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(this.tree.x - 30, this.tree.y + 10, 40, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(this.tree.x + 25, this.tree.y + 5, 45, 0, Math.PI * 2); c.fill();
      }
      drawInteractiveObjects(c) {
        var tod = store.decor.timeOfDay || 1;
        var byFrames = spriteArt.ready ? spriteArt.frames.backyard : null;

        /* bench — decorative, drawn behind other objects */
        if (byFrames && byFrames.bench) {
          drawFrameImage(c, byFrames.bench, 100, 380, 0.8, { baseScale: 1, shadowAlpha: 0.10 });
        } else {
          c.fillStyle = tod === 3 ? "#3A3020" : "#8B7A58";
          rr(c, 60, 368, 80, 30, 6); c.fill();
          c.fillRect(66, 398, 6, 20); c.fillRect(128, 398, 6, 20);
        }

        /* garden patch */
        if (byFrames && byFrames.gardenPatch) {
          drawFrameImage(c, byFrames.gardenPatch, this.garden.x, this.garden.y, 0.8, { baseScale: 1, shadowAlpha: 0.10 });
        } else {
          c.fillStyle = tod === 3 ? "#3A2818" : "#7A5428";
          rr(c, this.garden.x - 50, this.garden.y - 18, 100, 40, 8);
          c.fill();
        }
        /* flowers on top of garden */
        var flowerColors = ["#FF6B9D", "#FFD700", "#FF8C42", "#E040FB", "#4FC3F7", "#AED581"];
        for (var fi = 0; fi < store.backyardFlowers; fi++) {
          var fx = this.garden.x - 35 + fi * 14;
          var fy = this.garden.y - 16;
          c.fillStyle = "#5C7A3A";
          c.fillRect(fx, fy, 2, 14);
          c.fillStyle = flowerColors[fi % flowerColors.length];
          c.beginPath(); c.arc(fx + 1, fy - 4, 5, 0, Math.PI * 2); c.fill();
        }

        /* kiddie pool */
        if (byFrames && byFrames.kiddiePool) {
          drawFrameImage(c, byFrames.kiddiePool, this.pool.x, this.pool.y, 0.85, { baseScale: 1, shadowAlpha: 0.08 });
        } else {
          c.fillStyle = "#4A90D9";
          c.globalAlpha = 0.5;
          c.beginPath(); c.ellipse(this.pool.x, this.pool.y, 50, 22, 0, 0, Math.PI * 2); c.fill();
          c.globalAlpha = 1;
          c.strokeStyle = "#87CEEB"; c.lineWidth = 3;
          c.beginPath(); c.ellipse(this.pool.x, this.pool.y, 50, 22, 0, 0, Math.PI * 2); c.stroke();
        }
        /* water ripples on pool */
        c.strokeStyle = "rgba(255,255,255,0.3)"; c.lineWidth = 1;
        c.beginPath();
        c.ellipse(this.pool.x + Math.sin(game.time * 2) * 12, this.pool.y, 22, 9, 0, 0, Math.PI * 2);
        c.stroke();

        /* bird feeder */
        if (byFrames && byFrames.birdFeeder) {
          drawFrameImage(c, byFrames.birdFeeder, this.feeder.x, this.feeder.y, 0.8, { baseScale: 1, shadowAlpha: 0.10 });
        } else {
          c.fillStyle = tod === 3 ? "#3A2818" : "#8B6914";
          c.fillRect(this.feeder.x - 4, this.feeder.y, 8, 55);
          c.fillStyle = tod === 3 ? "#4A3828" : "#D2B48C";
          rr(c, this.feeder.x - 22, this.feeder.y - 12, 44, 18, 5);
          c.fill();
        }
        /* seed indicator */
        if (this.feeder.filled) {
          c.fillStyle = "#E8C44C";
          c.beginPath(); c.arc(this.feeder.x, this.feeder.y - 4, 7, 0, Math.PI * 2); c.fill();
        }
      }
    }

    SceneRegistry.register("backyard", function() { return new BackyardScene(); });
