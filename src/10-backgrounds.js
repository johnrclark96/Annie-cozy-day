    const sceneCache = Object.create(null);

    function buildStaticCaches() {
      /* ── Title screen background ── */
      const tc = makeBufferCanvas(W, H);
      const tx = tc.getContext("2d");
      const tg = tx.createLinearGradient(0, 0, 0, H);
      tg.addColorStop(0, "#FFE8D6");
      tg.addColorStop(0.5, "#FFDAB9");
      tg.addColorStop(1, "#F5C6A0");
      tx.fillStyle = tg;
      tx.fillRect(0, 0, W, H);
      tx.fillStyle = "rgba(255,255,255,0.12)";
      for (let i = 0; i < 6; i++) {
        tx.beginPath();
        tx.arc(130 + i * 140, 500 - i * 30 + (i % 2) * 60, 80 + i * 12, 0, Math.PI * 2);
        tx.fill();
      }
      tx.fillStyle = "rgba(255,200,160,0.18)";
      for (let i = 0; i < 4; i++) {
        tx.beginPath();
        tx.arc(200 + i * 180, 150 + (i % 2) * 100, 60, 0, Math.PI * 2);
        tx.fill();
      }
      sceneCache.titleBase = tc;

      /* ── Living room background ── */
      var roomPalettes = [
        /* 0: Cozy Neutral */ { wallTop: "#F5E6D3", wallBot: "#EDD8C4", stripe: "rgba(220,200,175,0.12)", wainscot: "#E8D4BC", wainLine: "#D8C0A4", floorTop: "#EFD8BE", floorBot: "#E2C6A4", plank: "rgba(180,145,110,0.15)", base: "#D4B896" },
        /* 1: Pastel Cute */  { wallTop: "#F5E0EE", wallBot: "#EEDAE8", stripe: "rgba(225,190,210,0.12)", wainscot: "#EECEDE", wainLine: "#DDB8CC", floorTop: "#F2DCD0", floorBot: "#E8C8B8", plank: "rgba(190,150,140,0.12)", base: "#DEB8AA" },
        /* 2: Warm Cottage */ { wallTop: "#F5E2C8", wallBot: "#EDD4B0", stripe: "rgba(210,180,140,0.15)", wainscot: "#E2C8A0", wainLine: "#D0B48C", floorTop: "#E0C4A0", floorBot: "#D4B088", plank: "rgba(170,130,90,0.18)", base: "#C8A478" },
        /* 3: Moonlight Blue */ { wallTop: "#D8E0F0", wallBot: "#C8D4E8", stripe: "rgba(180,195,220,0.12)", wainscot: "#C0D0E0", wainLine: "#A8B8D0", floorTop: "#D0D4DC", floorBot: "#BCC4D0", plank: "rgba(140,155,175,0.12)", base: "#A8B4C4" },
        /* 4: Bookish Cozy */ { wallTop: "#E8D8C0", wallBot: "#DCC8A8", stripe: "rgba(195,170,130,0.15)", wainscot: "#D4C0A0", wainLine: "#C0A880", floorTop: "#D8C0A0", floorBot: "#C8AE8C", plank: "rgba(160,130,95,0.18)", base: "#BCA078" }
      ];
      var rp = roomPalettes[store.decor.roomPreset || 0];
      const lc = makeBufferCanvas(W, H);
      const lx = lc.getContext("2d");
      /* wall */
      const wg = lx.createLinearGradient(0, 0, 0, 340);
      wg.addColorStop(0, rp.wallTop);
      wg.addColorStop(1, rp.wallBot);
      lx.fillStyle = wg;
      lx.fillRect(0, 0, W, 340);
      /* subtle wall texture stripes */
      lx.fillStyle = rp.stripe;
      for (let i = 0; i < 20; i++) lx.fillRect(i * 42, 0, 20, 340);
      /* wainscoting / lower wall panel */
      lx.fillStyle = rp.wainscot;
      lx.fillRect(0, 240, W, 100);
      lx.strokeStyle = rp.wainLine;
      lx.lineWidth = 2;
      lx.beginPath(); lx.moveTo(0, 240); lx.lineTo(W, 240); lx.stroke();
      lx.beginPath(); lx.moveTo(0, 248); lx.lineTo(W, 248); lx.stroke();
      /* floor */
      const fg = lx.createLinearGradient(0, 340, 0, H);
      fg.addColorStop(0, rp.floorTop);
      fg.addColorStop(1, rp.floorBot);
      lx.fillStyle = fg;
      lx.fillRect(0, 340, W, H - 340);
      /* floor wood plank lines */
      lx.strokeStyle = rp.plank;
      lx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        lx.beginPath(); lx.moveTo(0, 350 + i * 28); lx.lineTo(W, 350 + i * 28); lx.stroke();
      }
      /* baseboard */
      lx.fillStyle = rp.base;
      lx.fillRect(0, 336, W, 8);
      lx.fillStyle = "#C8A882";
      lx.fillRect(0, 336, W, 3);
      /* window */
      lx.fillStyle = "#B8D8F0";
      rr(lx, 62, 48, 128, 160, 8);
      lx.fill();
      /* window sky gradient */
      const skyg = lx.createLinearGradient(62, 48, 62, 208);
      skyg.addColorStop(0, "rgba(135,206,235,0.3)");
      skyg.addColorStop(1, "rgba(200,230,255,0.15)");
      lx.fillStyle = skyg;
      rr(lx, 62, 48, 128, 160, 8);
      lx.fill();
      lx.strokeStyle = "#C8A882";
      lx.lineWidth = 6;
      rr(lx, 62, 48, 128, 160, 8);
      lx.stroke();
      lx.lineWidth = 3;
      lx.beginPath();
      lx.moveTo(126, 48);
      lx.lineTo(126, 208);
      lx.moveTo(62, 128);
      lx.lineTo(190, 128);
      lx.stroke();
      /* window sill */
      lx.fillStyle = "#D8C0A0";
      rr(lx, 54, 206, 144, 10, 3);
      lx.fill();
      /* small plant on sill */
      lx.fillStyle = "#B8724A";
      rr(lx, 148, 192, 20, 16, 4);
      lx.fill();
      lx.fillStyle = "#6AAF50";
      lx.beginPath();
      lx.ellipse(158, 185, 14, 12, 0, 0, Math.PI * 2);
      lx.fill();
      lx.fillStyle = "#7CC462";
      lx.beginPath();
      lx.ellipse(154, 182, 10, 9, -0.3, 0, Math.PI * 2);
      lx.fill();
      /* curtains */
      lx.fillStyle = "rgba(195,160,130,0.3)";
      rr(lx, 46, 36, 24, 186, 4);
      lx.fill();
      rr(lx, 182, 36, 24, 186, 4);
      lx.fill();
      /* curtain rod */
      lx.fillStyle = "#B8986C";
      lx.fillRect(42, 34, 172, 4);
      lx.beginPath(); lx.arc(42, 36, 5, 0, Math.PI * 2); lx.fill();
      lx.beginPath(); lx.arc(214, 36, 5, 0, Math.PI * 2); lx.fill();
      /* rug with pattern */
      lx.fillStyle = COLORS.rug;
      lx.beginPath();
      lx.ellipse(400, 470, 220, 55, 0, 0, Math.PI * 2);
      lx.fill();
      lx.strokeStyle = "rgba(180,140,100,0.25)";
      lx.lineWidth = 3;
      lx.stroke();
      lx.fillStyle = "rgba(200,165,130,0.35)";
      lx.beginPath();
      lx.ellipse(400, 470, 170, 40, 0, 0, Math.PI * 2);
      lx.fill();
      lx.strokeStyle = "rgba(160,120,85,0.15)";
      lx.lineWidth = 2;
      lx.beginPath();
      lx.ellipse(400, 470, 120, 28, 0, 0, Math.PI * 2);
      lx.stroke();
      /* couch - more detailed */
      /* couch back */
      lx.fillStyle = "#A87C50";
      rr(lx, 276, 254, 252, 30, 14);
      lx.fill();
      /* couch body */
      lx.fillStyle = COLORS.couchDark;
      rr(lx, 280, 272, 244, 106, 18);
      lx.fill();
      lx.fillStyle = COLORS.couch;
      rr(lx, 286, 266, 232, 86, 16);
      lx.fill();
      /* couch seat cushions with stitch lines */
      lx.fillStyle = COLORS.couchDark;
      rr(lx, 296, 276, 100, 64, 12);
      lx.fill();
      rr(lx, 408, 276, 100, 64, 12);
      lx.fill();
      /* stitch details */
      lx.strokeStyle = "rgba(140,100,60,0.2)";
      lx.lineWidth = 1;
      lx.beginPath(); lx.moveTo(346, 282); lx.lineTo(346, 334); lx.stroke();
      lx.beginPath(); lx.moveTo(458, 282); lx.lineTo(458, 334); lx.stroke();
      /* couch armrests */
      lx.fillStyle = COLORS.couch;
      rr(lx, 264, 276, 32, 92, 14);
      lx.fill();
      rr(lx, 508, 276, 32, 92, 14);
      lx.fill();
      /* couch legs */
      lx.fillStyle = "#8B6B4A";
      rr(lx, 282, 370, 10, 14, 3);
      lx.fill();
      rr(lx, 512, 370, 10, 14, 3);
      lx.fill();
      /* throw pillows */
      lx.fillStyle = "#E8B8A0";
      lx.save();
      lx.translate(310, 292);
      lx.rotate(-0.15);
      rr(lx, -22, -18, 44, 36, 14);
      lx.fill();
      lx.restore();
      lx.fillStyle = "#A8C686";
      lx.save();
      lx.translate(490, 296);
      lx.rotate(0.12);
      rr(lx, -20, -16, 40, 32, 14);
      lx.fill();
      lx.restore();
      /* blanket draped over armrest */
      lx.fillStyle = "rgba(200,160,180,0.4)";
      rr(lx, 504, 280, 38, 72, 8);
      lx.fill();
      /* lamp with shade and glow — positioned right of window */
      lx.fillStyle = "#B89868";
      lx.fillRect(212, 178, 5, 110);
      /* lamp base */
      lx.fillStyle = "#A08060";
      rr(lx, 202, 284, 26, 8, 4);
      lx.fill();
      /* lamp shade */
      lx.fillStyle = "#FFEEBB";
      lx.beginPath();
      lx.moveTo(192, 178);
      lx.lineTo(238, 178);
      lx.lineTo(232, 138);
      lx.lineTo(198, 138);
      lx.closePath();
      lx.fill();
      lx.strokeStyle = "rgba(200,170,120,0.4)";
      lx.lineWidth = 2;
      lx.stroke();
      /* warm lamp glow on wall */
      var lampGlow = lx.createRadialGradient(215, 158, 10, 215, 158, 120);
      lampGlow.addColorStop(0, "rgba(255,240,200,0.12)");
      lampGlow.addColorStop(1, "rgba(255,240,200,0)");
      lx.fillStyle = lampGlow;
      lx.fillRect(80, 30, 300, 300);
      /* side table next to couch */
      lx.fillStyle = "#B89868";
      rr(lx, 230, 330, 40, 46, 6);
      lx.fill();
      lx.fillStyle = "#C8A878";
      rr(lx, 226, 326, 48, 8, 4);
      lx.fill();
      /* mug on side table */
      lx.fillStyle = "#E8D8C8";
      rr(lx, 238, 314, 16, 14, 4);
      lx.fill();
      lx.fillStyle = "#C8B098";
      lx.fillRect(254, 320, 6, 4);
      /* cat tower on right - more detailed */
      lx.fillStyle = "#C4A882";
      lx.fillRect(674, 200, 16, 280);
      lx.fillRect(706, 260, 16, 220);
      /* tower wrapping texture */
      lx.strokeStyle = "rgba(180,150,110,0.3)";
      lx.lineWidth = 1;
      for (let y = 200; y < 480; y += 6) {
        lx.beginPath(); lx.moveTo(674, y); lx.lineTo(690, y); lx.stroke();
      }
      /* platforms */
      lx.fillStyle = "#D8C0A0";
      rr(lx, 652, 186, 60, 18, 6);
      lx.fill();
      rr(lx, 686, 248, 54, 14, 5);
      lx.fill();
      rr(lx, 656, 360, 76, 16, 6);
      lx.fill();
      /* dangling toy on tower */
      lx.strokeStyle = "#A88060";
      lx.lineWidth = 1;
      lx.beginPath(); lx.moveTo(660, 204); lx.lineTo(650, 230); lx.stroke();
      lx.fillStyle = "#E88080";
      lx.beginPath(); lx.arc(650, 233, 5, 0, Math.PI * 2); lx.fill();
      /* bookshelf */
      lx.fillStyle = "#C4A076";
      rr(lx, 566, 56, 74, 186, 6);
      lx.fill();
      /* shelf edges */
      lx.fillStyle = "#B89060";
      lx.fillRect(566, 56, 74, 4);
      lx.fillStyle = "#D4B48E";
      lx.fillRect(572, 100, 62, 5);
      lx.fillRect(572, 145, 62, 5);
      lx.fillRect(572, 190, 62, 5);
      /* books - varied sizes */
      const bookColors = ["#C0392B","#2980B9","#27AE60","#8E44AD","#E67E22","#D4A44C","#1ABC9C","#E74C3C"];
      for (let s = 0; s < 3; s++) {
        const bx = 576;
        const by = 64 + s * 45;
        for (let b = 0; b < 5; b++) {
          lx.fillStyle = bookColors[(s * 5 + b) % bookColors.length];
          const bh = 24 + (b % 3) * 4;
          lx.fillRect(bx + b * 12, by + (32 - bh), 9, bh);
        }
      }
      /* framed photo on shelf */
      lx.fillStyle = "#C8A872";
      rr(lx, 577, 152, 22, 30, 2);
      lx.fill();
      lx.fillStyle = "#F0E0D0";
      rr(lx, 580, 155, 16, 24, 1);
      lx.fill();
      /* wall art - changes with wallArt2 decor setting */
      var artStyle = store.decor.wallArt2 || 0;
      lx.fillStyle = "#C8A872";
      rr(lx, 350, 60, 100, 72, 5);
      lx.fill();
      lx.fillStyle = "#E8D8C8";
      rr(lx, 356, 66, 88, 60, 4);
      lx.fill();
      if (artStyle === 0) {
        /* Landscape — sunset mountains */
        var sunsetG = lx.createLinearGradient(356, 66, 356, 126);
        sunsetG.addColorStop(0, "rgba(255,180,120,0.4)");
        sunsetG.addColorStop(0.5, "rgba(255,220,180,0.3)");
        sunsetG.addColorStop(1, "rgba(160,200,140,0.4)");
        lx.fillStyle = sunsetG;
        rr(lx, 356, 66, 88, 60, 4); lx.fill();
        lx.fillStyle = "rgba(120,160,100,0.5)";
        lx.beginPath();
        lx.moveTo(356, 116); lx.lineTo(380, 82); lx.lineTo(400, 100); lx.lineTo(420, 78); lx.lineTo(444, 116);
        lx.fill();
      } else if (artStyle === 1) {
        /* Floral — flowers on green */
        lx.fillStyle = "rgba(180,220,160,0.5)";
        rr(lx, 356, 66, 88, 60, 4); lx.fill();
        var flColors = ["#FF6B9D", "#FFD700", "#87CEEB", "#FF8C42", "#E040FB"];
        for (var fi = 0; fi < 7; fi++) {
          var fx = 370 + (fi % 4) * 18, fy = 80 + Math.floor(fi / 4) * 24;
          lx.fillStyle = "#5C8A3A"; lx.fillRect(fx + 3, fy + 4, 2, 10);
          lx.fillStyle = flColors[fi % 5];
          lx.beginPath(); lx.arc(fx + 4, fy + 2, 5, 0, Math.PI * 2); lx.fill();
        }
      } else if (artStyle === 2) {
        /* Portraits — two pet silhouettes */
        lx.fillStyle = "rgba(200,180,160,0.4)";
        rr(lx, 356, 66, 88, 60, 4); lx.fill();
        lx.fillStyle = "rgba(139,105,20,0.5)";
        lx.beginPath(); lx.arc(382, 96, 14, 0, Math.PI * 2); lx.fill();
        lx.beginPath(); lx.ellipse(382, 112, 10, 6, 0, 0, Math.PI * 2); lx.fill();
        lx.fillStyle = "rgba(155,125,60,0.5)";
        lx.beginPath(); lx.arc(420, 96, 12, 0, Math.PI * 2); lx.fill();
        lx.beginPath(); lx.moveTo(412, 86); lx.lineTo(408, 78); lx.lineTo(416, 84); lx.fill();
        lx.beginPath(); lx.moveTo(428, 86); lx.lineTo(432, 78); lx.lineTo(424, 84); lx.fill();
      } else {
        /* Abstract — geometric shapes */
        lx.fillStyle = "rgba(100,150,200,0.3)";
        rr(lx, 356, 66, 88, 60, 4); lx.fill();
        lx.fillStyle = "rgba(255,180,100,0.5)";
        lx.beginPath(); lx.arc(380, 90, 16, 0, Math.PI * 2); lx.fill();
        lx.fillStyle = "rgba(200,100,150,0.4)";
        lx.beginPath(); lx.moveTo(410, 72); lx.lineTo(436, 110); lx.lineTo(384, 110); lx.closePath(); lx.fill();
        lx.fillStyle = "rgba(100,200,180,0.4)";
        rr(lx, 400, 78, 30, 30, 3); lx.fill();
      }
      /* second smaller frame */
      lx.fillStyle = "#C8A872";
      rr(lx, 466, 76, 50, 50, 4);
      lx.fill();
      lx.fillStyle = "#FFE8D8";
      rr(lx, 470, 80, 42, 42, 3);
      lx.fill();
      /* paw print in small frame */
      lx.fillStyle = "rgba(180,140,110,0.4)";
      lx.beginPath(); lx.arc(491, 98, 8, 0, Math.PI * 2); lx.fill();
      lx.beginPath(); lx.arc(483, 90, 4, 0, Math.PI * 2); lx.fill();
      lx.beginPath(); lx.arc(499, 90, 4, 0, Math.PI * 2); lx.fill();
      lx.beginPath(); lx.arc(480, 97, 3.5, 0, Math.PI * 2); lx.fill();
      lx.beginPath(); lx.arc(502, 97, 3.5, 0, Math.PI * 2); lx.fill();
      sceneCache.livingRoomBase = lc;

      /* ── Treat Toss background ── */
      const rc = makeBufferCanvas(W, H);
      const rx = rc.getContext("2d");
      /* sky */
      const sg = rx.createLinearGradient(0, 0, 0, 200);
      sg.addColorStop(0, "#87CEEB");
      sg.addColorStop(1, "#B8E0F0");
      rx.fillStyle = sg;
      rx.fillRect(0, 0, W, 200);
      /* grass */
      const gg = rx.createLinearGradient(0, 160, 0, H);
      gg.addColorStop(0, "#A8D870");
      gg.addColorStop(0.3, "#8BC860");
      gg.addColorStop(1, "#6BAA48");
      rx.fillStyle = gg;
      rx.fillRect(0, 160, W, H - 160);
      /* fence */
      rx.fillStyle = "#E8D4B8";
      for (let i = 0; i < 12; i++) {
        rx.fillRect(i * 72 + 10, 120, 8, 100);
      }
      rx.fillRect(0, 140, W, 6);
      rx.fillRect(0, 180, W, 6);
      /* counter where Annie stands */
      rx.fillStyle = "#D8C0A0";
      rr(rx, 300, 140, 200, 70, 8);
      rx.fill();
      rx.fillStyle = "#C4A882";
      rr(rx, 304, 144, 192, 30, 6);
      rx.fill();
      /* sun */
      rx.fillStyle = "rgba(255,240,180,0.5)";
      rx.beginPath();
      rx.arc(680, 50, 44, 0, Math.PI * 2);
      rx.fill();
      rx.fillStyle = "rgba(255,250,220,0.6)";
      rx.beginPath();
      rx.arc(680, 50, 30, 0, Math.PI * 2);
      rx.fill();
      /* trees in background */
      rx.fillStyle = "#6B8E4E";
      rx.beginPath(); rx.arc(60, 130, 50, 0, Math.PI * 2); rx.fill();
      rx.beginPath(); rx.arc(740, 120, 60, 0, Math.PI * 2); rx.fill();
      rx.fillStyle = "#7CA858";
      rx.beginPath(); rx.arc(50, 115, 35, 0, Math.PI * 2); rx.fill();
      rx.beginPath(); rx.arc(755, 105, 42, 0, Math.PI * 2); rx.fill();
      /* tree trunks */
      rx.fillStyle = "#8B6B4A";
      rx.fillRect(54, 140, 12, 40);
      rx.fillRect(746, 130, 14, 50);
      sceneCache.treatBase = rc;

      /* ── Laser Chase background ── */
      const ec = makeBufferCanvas(W, H);
      const ex = ec.getContext("2d");
      /* dark room floor */
      const dg = ex.createLinearGradient(0, 0, 0, H);
      dg.addColorStop(0, "#3D3028");
      dg.addColorStop(1, "#2A2018");
      ex.fillStyle = dg;
      ex.fillRect(0, 0, W, H);
      /* slightly lighter floor area */
      ex.fillStyle = "rgba(80,60,45,0.4)";
      ex.fillRect(0, H * 0.55, W, H * 0.45);
      /* furniture obstacles (match this.obstacles() in LaserChaseScene) */
      ex.fillStyle = "rgba(90,70,50,0.6)";
      rr(ex, 44, 118, 160, 80, 12);
      ex.fill();
      rr(ex, 272, 228, 150, 70, 10);
      ex.fill();
      rr(ex, 608, 92, 100, 150, 10);
      ex.fill();
      rr(ex, 588, 370, 96, 96, 12);
      ex.fill();
      /* furniture highlights */
      ex.fillStyle = "rgba(120,95,70,0.35)";
      rr(ex, 48, 122, 152, 24, 8);
      ex.fill();
      rr(ex, 276, 232, 142, 20, 7);
      ex.fill();
      rr(ex, 612, 96, 92, 24, 7);
      ex.fill();
      /* ambient light from top right */
      const ag = ex.createRadialGradient(700, 80, 20, 700, 80, 300);
      ag.addColorStop(0, "rgba(255,236,177,0.08)");
      ag.addColorStop(1, "rgba(255,236,177,0)");
      ex.fillStyle = ag;
      ex.fillRect(0, 0, W, H);
      sceneCache.laserBase = ec;
    }


    function drawTreatBackdrop(c) {
      if (!sceneCache.treatBase) buildStaticCaches();
      c.drawImage(sceneCache.treatBase, 0, 0);
      c.save();
      c.globalAlpha = 0.24;
      c.translate((game.time * 12) % 220, 0);
      c.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = -1; i < 5; i++) {
        c.beginPath();
        c.arc(i * 220 + 80, 138 + (i % 2) * 18, 24, 0, Math.PI * 2);
        c.arc(i * 220 + 104, 146 + (i % 2) * 18, 16, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    function drawLaserBackdrop(c) {
      if (!sceneCache.laserBase) buildStaticCaches();
      c.drawImage(sceneCache.laserBase, 0, 0);
      drawGlowCircle(c, 702, 100, 86, "rgba(255,236,177,ALPHA)", 0.12);
    }

    function drawAimPreview(c, sx, sy, tx, flight = 0.92) {
      c.save();
      c.fillStyle = "rgba(255,255,255,0.75)";
      for (let i = 0; i < 12; i++) {
        const t = (i + 1) / 13 * flight;
        const px = sx + ((tx - sx) / flight) * t;
        const py = sy + 30 * t + 0.5 * 640 * t * t;
        c.beginPath();
        c.arc(px, py, 3 + i * 0.08, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    function drawTitleBg(c) {
      if (!sceneCache.titleBase) buildStaticCaches();
      c.drawImage(sceneCache.titleBase, 0, 0);

      /* layered bokeh lights - slow parallax */
      c.save();
      for (let layer = 0; layer < 3; layer++) {
        const speed = 0.08 + layer * 0.06;
        const baseSize = 30 + layer * 20;
        const alpha = 0.05 - layer * 0.012;
        for (let i = 0; i < 5; i++) {
          const bx = ((game.time * speed * 40 + i * 170 + layer * 90) % (W + 100)) - 50;
          const by = 80 + i * 100 + layer * 30 + Math.sin(game.time * 0.4 + i * 1.5 + layer) * 25;
          const bs = baseSize + Math.sin(game.time * 0.6 + i * 2) * 8;
          const bg = c.createRadialGradient(bx, by, 0, bx, by, bs);
          bg.addColorStop(0, `rgba(255,220,160,${alpha + 0.02})`);
          bg.addColorStop(0.5, `rgba(255,200,140,${alpha})`);
          bg.addColorStop(1, "rgba(255,200,140,0)");
          c.fillStyle = bg;
          c.beginPath();
          c.arc(bx, by, bs, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();

      /* floating hearts and stars */
      for (const a of game.ambient) {
        c.save();
        c.globalAlpha = 0.28 + 0.14 * Math.sin(game.time * 1.2 + a.phase);
        c.translate(0, Math.sin(game.time * 0.8 + a.phase) * 2);
        if (a.shape === "heart") drawHeart(c, a.x, a.y, a.size / 14, a.color);
        else drawStar(c, a.x, a.y, a.size, a.color);
        c.restore();
      }

      /* warm spotlight behind character area */
      const spotG = c.createRadialGradient(400, 400, 40, 400, 400, 240);
      spotG.addColorStop(0, "rgba(255,240,210,0.12)");
      spotG.addColorStop(0.6, "rgba(255,230,200,0.05)");
      spotG.addColorStop(1, "rgba(255,230,200,0)");
      c.fillStyle = spotG;
      c.fillRect(100, 200, 600, 350);
    }

    function drawLivingRoom(c, mode = "hub") {
      if (!sceneCache.livingRoomBase) buildStaticCaches();
      c.drawImage(sceneCache.livingRoomBase, 0, 0);

      /* room style preset tint */
      if (store.decor.roomPreset === 1) {
        c.save();
        c.globalCompositeOperation = "multiply";
        c.fillStyle = "rgba(245,225,238,0.15)";
        c.fillRect(0, 0, W, 340);
        c.fillStyle = "rgba(240,225,215,0.12)";
        c.fillRect(0, 340, W, H - 340);
        c.restore();
      } else if (store.decor.roomPreset === 2) {
        c.save();
        c.globalCompositeOperation = "multiply";
        c.fillStyle = "rgba(245,228,200,0.18)";
        c.fillRect(0, 0, W, 340);
        c.fillStyle = "rgba(235,210,180,0.14)";
        c.fillRect(0, 340, W, H - 340);
        c.restore();
      } else if (store.decor.roomPreset === 3) {
        c.save();
        c.globalCompositeOperation = "multiply";
        c.fillStyle = "rgba(200,215,240,0.15)";
        c.fillRect(0, 0, W, 340);
        c.fillStyle = "rgba(190,200,220,0.12)";
        c.fillRect(0, 340, W, H - 340);
        c.restore();
      } else if (store.decor.roomPreset === 4) {
        c.save();
        c.globalCompositeOperation = "multiply";
        c.fillStyle = "rgba(230,215,195,0.16)";
        c.fillRect(0, 0, W, 340);
        c.fillStyle = "rgba(220,200,175,0.12)";
        c.fillRect(0, 340, W, H - 340);
        c.restore();
      }

      /* animated window sky — time-of-day aware */
      const tod = store.decor.timeOfDay || 1;
      c.save();
      c.beginPath();
      rr(c, 66, 52, 120, 152, 5);
      c.clip();
      if (tod === 0) {
        const skyG = c.createLinearGradient(66, 52, 66, 204);
        skyG.addColorStop(0, "#FFB088");
        skyG.addColorStop(0.5, "#FFCDA8");
        skyG.addColorStop(1, "#FFE8C8");
        c.fillStyle = skyG;
        c.fillRect(66, 52, 120, 152);
      } else if (tod === 2) {
        const skyG = c.createLinearGradient(66, 52, 66, 204);
        skyG.addColorStop(0, "#C87848");
        skyG.addColorStop(0.4, "#D89060");
        skyG.addColorStop(1, "#A87098");
        c.fillStyle = skyG;
        c.fillRect(66, 52, 120, 152);
      } else if (tod === 3) {
        c.fillStyle = "#1A1E38";
        c.fillRect(66, 52, 120, 152);
        c.fillStyle = "#FFFFFF";
        const starPositions = [[82,68],[110,72],[140,60],[95,90],[160,80],[130,100],[75,110],[150,95],[108,118],[170,65]];
        for (const [sx,sy] of starPositions) {
          c.globalAlpha = 0.4 + Math.sin(game.time * 1.5 + sx * 0.1) * 0.3;
          c.beginPath(); c.arc(sx, sy, 1.2, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
        c.fillStyle = "#E8E4D8";
        c.beginPath(); c.arc(155, 72, 12, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#1A1E38";
        c.beginPath(); c.arc(160, 68, 10, 0, Math.PI * 2); c.fill();
      } else {
        const skyShift = Math.sin(game.time * 0.05) * 0.08;
        const skyG = c.createLinearGradient(66, 52, 66, 204);
        skyG.addColorStop(0, `rgba(${135 + skyShift * 40},${206 + skyShift * 20},${235},1)`);
        skyG.addColorStop(1, `rgba(${200 + skyShift * 30},${230 + skyShift * 10},255,1)`);
        c.fillStyle = skyG;
        c.fillRect(66, 52, 120, 152);
        c.fillStyle = "rgba(255,255,255,0.7)";
        for (let i = 0; i < 3; i++) {
          const cx = 66 + ((game.time * (6 + i * 2) + i * 55) % 160) - 20;
          const cy = 68 + i * 40 + Math.sin(game.time * 0.3 + i * 2) * 4;
          c.beginPath();
          c.ellipse(cx, cy, 18 + i * 4, 8 + i * 2, 0, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.ellipse(cx + 12, cy + 2, 12 + i * 2, 6 + i, 0, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();

      /* warm light rays from window */
      c.save();
      c.globalAlpha = 0.04 + 0.015 * Math.sin(game.time * 0.8);
      c.fillStyle = "rgba(255,240,180,1)";
      c.beginPath();
      c.moveTo(66, 52);
      c.lineTo(190, 52);
      c.lineTo(380, 480);
      c.lineTo(120, 480);
      c.closePath();
      c.fill();
      /* secondary softer ray */
      c.globalAlpha = 0.025 + 0.01 * Math.sin(game.time * 0.6 + 1);
      c.beginPath();
      c.moveTo(100, 80);
      c.lineTo(170, 80);
      c.lineTo(320, 470);
      c.lineTo(200, 470);
      c.closePath();
      c.fill();
      c.restore();

      /* time-of-day room lighting overlay */
      if (tod === 0) {
        c.save(); c.globalAlpha = 0.06;
        c.fillStyle = "#FFE0A0"; c.fillRect(0, 0, W, H);
        c.restore();
      } else if (tod === 2) {
        c.save(); c.globalAlpha = 0.08;
        c.fillStyle = "#E8A050"; c.fillRect(0, 0, W, H);
        c.restore();
      } else if (tod === 3) {
        c.save(); c.globalAlpha = 0.22;
        c.fillStyle = "#141828"; c.fillRect(0, 0, W, H);
        c.restore();
        if (store.decor.lampOn !== false) {
          drawGlowCircle(c, 216, 160, 180, "rgba(255,220,140,ALPHA)", 0.16);
        }
      }

      /* animated lamp glow - conditional on lamp state + time-of-day */
      const lampOn = store.decor.lampOn !== false;
      const todMult = tod === 3 ? 1.6 : tod === 2 ? 1.3 : tod === 0 ? 0.7 : 1.0;
      const lampFlicker = (0.08 + 0.025 * Math.sin(game.time * 1.2) + 0.01 * Math.sin(game.time * 4.7) + 0.005 * Math.sin(game.time * 11.3)) * todMult;
      const lampAlpha = lampOn ? lampFlicker : lampFlicker * 0.05;
      const glowColors = [
        ["rgba(255,232,160,ALPHA)", "rgba(255,220,140,ALPHA)"],
        ["rgba(255,210,230,ALPHA)", "rgba(255,200,220,ALPHA)"],
        ["rgba(255,200,140,ALPHA)", "rgba(255,190,120,ALPHA)"],
        ["rgba(200,215,255,ALPHA)", "rgba(190,205,245,ALPHA)"],
        ["rgba(255,225,170,ALPHA)", "rgba(245,215,155,ALPHA)"]
      ][store.decor.roomPreset || 0] || ["rgba(255,232,160,ALPHA)", "rgba(255,220,140,ALPHA)"];
      drawGlowCircle(c, 216, 146, 96, glowColors[0], lampAlpha);
      drawGlowCircle(c, 216, 160, 50, glowColors[1], lampAlpha * 0.6);
      if (!lampOn) {
        c.save();
        c.globalAlpha = 0.35;
        c.fillStyle = "#000";
        c.beginPath();
        c.ellipse(216, 160, 20, 30, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 0.06;
        c.fillRect(0, 0, W / 2, H);
        c.restore();
      }

      /* steam from mug on side table */
      c.save();
      c.globalAlpha = 0.18;
      for (let i = 0; i < 3; i++) {
        const st = (game.time * 0.6 + i * 1.2) % 3.6;
        const sy = 314 - st * 14;
        const sx = 246 + Math.sin(game.time * 1.5 + i * 2.1) * 4;
        const sa = clamp(1 - st / 3.6, 0, 1) * (st > 0.2 ? 1 : st / 0.2);
        c.globalAlpha = sa * 0.15;
        c.fillStyle = "rgba(255,255,255,0.9)";
        c.beginPath();
        c.ellipse(sx, sy, 3 + st * 1.5, 2 + st, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();

      /* dust motes floating in light rays */
      if (mode === "hub") {
        c.save();
        for (let i = 0; i < 8; i++) {
          const mt = (game.time * 0.15 + i * 1.7) % 6;
          const mx = 100 + i * 30 + Math.sin(game.time * 0.3 + i * 0.9) * 20;
          const my = 120 + mt * 60 + Math.sin(game.time * 0.5 + i * 1.3) * 8;
          if (my > 460) continue;
          /* only show motes in the light ray area */
          const inRay = mx > 80 && mx < 340 && my > 80;
          if (!inRay) continue;
          const mAlpha = 0.25 + 0.15 * Math.sin(game.time * 2 + i * 0.7);
          c.globalAlpha = mAlpha * clamp(1 - (my - 380) / 80, 0.2, 1);
          c.fillStyle = "#FFF8E0";
          c.beginPath();
          c.arc(mx, my, 1.5 + Math.sin(game.time + i) * 0.5, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }

      /* dynamic decorations */
      const d = store.decor;
      if (d.fairyLights) {
        c.save();
        /* string with natural sag */
        c.strokeStyle = "rgba(180,160,110,0.55)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(50, 228);
        for (let i = 1; i < 16; i++) {
          const px = 50 + i * 47;
          const py = 224 + Math.sin(i * 0.8) * 7 + Math.sin(i * 0.3) * 3;
          c.lineTo(px, py);
        }
        c.stroke();
        /* bulbs with glow */
        for (let i = 0; i < 16; i++) {
          const lx = 50 + i * 47;
          const ly = 224 + Math.sin(i * 0.8) * 7 + Math.sin(i * 0.3) * 3;
          const bulbColor = ["#FFD700","#FF8FAA","#87CEEB","#A8D870","#FFB347"][i % 5];
          const pulse = Math.sin(game.time * 2.5 + i * 1.1);
          /* outer glow */
          c.globalAlpha = 0.16 + pulse * 0.1;
          c.fillStyle = bulbColor;
          c.beginPath(); c.arc(lx, ly + 5, 12, 0, Math.PI * 2); c.fill();
          /* bulb body */
          c.globalAlpha = 0.7 + pulse * 0.25;
          c.beginPath(); c.arc(lx, ly + 5, 4.5, 0, Math.PI * 2); c.fill();
          /* highlight */
          c.globalAlpha = 0.5 + pulse * 0.2;
          c.fillStyle = "rgba(255,255,255,0.7)";
          c.beginPath(); c.arc(lx - 1, ly + 3, 1.5, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }
      if (d.plant2) {
        c.save();
        c.translate(236, 324);
        /* pot shadow */
        c.fillStyle = "rgba(0,0,0,0.06)";
        c.beginPath(); c.ellipse(0, 14, 14, 4, 0, 0, Math.PI * 2); c.fill();
        /* pot body */
        c.fillStyle = "#A07050";
        rr(c, -10, 0, 20, 14, 4);
        c.fill();
        /* pot rim */
        c.fillStyle = "#B08060";
        rr(c, -12, -2, 24, 5, 3);
        c.fill();
        /* foliage layers */
        c.fillStyle = "#4A9848";
        c.beginPath(); c.ellipse(0, -8, 15, 15, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#5EAA56";
        c.beginPath(); c.ellipse(-5, -14, 11, 11, -0.3, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#6CBC64";
        c.beginPath(); c.ellipse(5, -12, 9, 9, 0.2, 0, Math.PI * 2); c.fill();
        /* flowers */
        c.fillStyle = "#FF8090";
        c.beginPath(); c.arc(4, -20, 4.5, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(-9, -13, 3.5, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(8, -10, 3, 0, Math.PI * 2); c.fill();
        /* flower centers */
        c.fillStyle = "#FFD080";
        c.beginPath(); c.arc(4, -20, 1.5, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(-9, -13, 1.2, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      if (d.petBed) {
        c.save();
        c.translate(180, 460);
        /* shadow */
        c.fillStyle = "rgba(0,0,0,0.08)";
        c.beginPath(); c.ellipse(0, 8, 42, 14, 0, 0, Math.PI * 2); c.fill();
        /* outer rim */
        c.fillStyle = "#B88888";
        c.beginPath(); c.ellipse(0, 0, 38, 16, 0, 0, Math.PI * 2); c.fill();
        /* inner cushion */
        c.fillStyle = "#D4A0A0";
        c.beginPath(); c.ellipse(0, -1, 32, 12, 0, 0, Math.PI * 2); c.fill();
        /* pillow center */
        c.fillStyle = "#E0B4B4";
        c.beginPath(); c.ellipse(0, -3, 24, 9, 0, 0, Math.PI * 2); c.fill();
        /* highlight shine */
        c.fillStyle = "rgba(255,255,255,0.25)";
        c.beginPath(); c.ellipse(-6, -6, 14, 5, -0.2, 0, Math.PI * 2); c.fill();
        /* subtle rim stroke */
        c.strokeStyle = "rgba(160,100,100,0.2)";
        c.lineWidth = 1;
        c.beginPath(); c.ellipse(0, 0, 38, 16, 0, 0, Math.PI * 2); c.stroke();
        c.restore();
      }
      /* cozy blanket on couch back */
      if (d.cozyBlanket) {
        c.save();
        c.translate(400, 268);
        c.fillStyle = "#C4A088";
        c.beginPath();
        c.moveTo(-60, -4);
        c.quadraticCurveTo(-40, 8, -20, 2);
        c.quadraticCurveTo(0, -4, 20, 2);
        c.quadraticCurveTo(40, 8, 60, -2);
        c.lineTo(55, 24);
        c.quadraticCurveTo(30, 30, 0, 26);
        c.quadraticCurveTo(-30, 30, -55, 24);
        c.closePath();
        c.fill();
        c.strokeStyle = "rgba(160,120,90,0.3)";
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = "rgba(255,255,255,0.12)";
        c.beginPath();
        c.moveTo(-40, 0); c.quadraticCurveTo(-10, -4, 20, 2); c.lineTo(15, 14); c.quadraticCurveTo(-10, 10, -40, 14); c.closePath();
        c.fill();
        c.restore();
      }
      /* window herbs */
      if (d.windowPlant) {
        const herbX = [72, 110, 148];
        for (let hi = 0; hi < 3; hi++) {
          c.save();
          c.translate(herbX[hi], 196);
          c.fillStyle = "#906840";
          rr(c, -6, -2, 12, 8, 3); c.fill();
          c.fillStyle = "#4A9848";
          c.beginPath(); c.ellipse(0, -8, 7, 8, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#5EAA56";
          c.beginPath(); c.ellipse(-3, -12, 4, 5, -0.3, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.ellipse(3, -11, 4, 5, 0.3, 0, Math.PI * 2); c.fill();
          c.restore();
        }
      }
      /* photo wall */
      if (d.photoWall) {
        const frameY = [100, 140, 170];
        for (let fi = 0; fi < 3; fi++) {
          c.save();
          c.translate(548, frameY[fi]);
          c.fillStyle = "#8B7355";
          rr(c, -16, -12, 32, 24, 2); c.fill();
          c.fillStyle = "#FFF8E8";
          rr(c, -13, -9, 26, 18, 1); c.fill();
          c.fillStyle = "rgba(180,150,120,0.3)";
          c.beginPath(); c.arc(-2, 0, 5, 0, Math.PI * 2); c.fill();
          c.restore();
        }
      }
      const rugColors = ["rgba(216,194,168,1)", "rgba(168,198,148,1)", "rgba(185,170,210,1)", "rgba(210,175,168,1)"];
      if (d.rugColor > 0) {
        c.save();
        c.globalAlpha = 0.22;
        c.fillStyle = rugColors[d.rugColor];
        c.beginPath(); c.ellipse(400, 470, 220, 55, 0, 0, Math.PI * 2); c.fill();
        /* rug texture highlight */
        c.globalAlpha = 0.06;
        c.fillStyle = "#FFFFFF";
        c.beginPath(); c.ellipse(400, 465, 180, 40, 0, 0, Math.PI * 2); c.fill();
        c.restore();
      }

      if (mode === "cuddle") {
        drawGlowCircle(c, 398, 310, 170, "rgba(255,255,255,ALPHA)", 0.08);
      }
    }
