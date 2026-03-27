    function drawButton(c, r, label, hovered, fill = COLORS.warmRed, textColor = "#fff") {
      c.save();
      const shadowY = hovered ? 4 : 6;
      c.fillStyle = "rgba(92,68,52,0.18)";
      rr(c, r.x, r.y + shadowY, r.w, r.h, 18);
      c.fill();
      if (hovered) {
        drawGlowCircle(c, r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.95, "rgba(255,215,0,ALPHA)", 0.18);
      }
      const grad = c.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      grad.addColorStop(0, hovered ? "#DE5544" : "#D24A3C");
      grad.addColorStop(1, fill);
      c.fillStyle = grad;
      rr(c, r.x, r.y, r.w, r.h, 18);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.65)";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = "rgba(255,255,255,0.14)";
      rr(c, r.x + 4, r.y + 4, r.w - 8, r.h * 0.4, 14);
      c.fill();
      c.fillStyle = textColor;
      c.font = '20px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
      c.restore();
    }

    function drawTooltip(c, x, y, title, body, alpha = 1) {
      c.save();
      c.globalAlpha = alpha;
      const w = 220;
      const h = 74;
      /* shadow */
      c.fillStyle = "rgba(60,40,25,0.15)";
      rr(c, x - w / 2 + 3, y - h + 3, w, h, 14);
      c.fill();
      /* main box */
      rr(c, x - w / 2, y - h, w, h, 14);
      c.fillStyle = "rgba(82,58,42,0.94)";
      c.fill();
      /* top highlight */
      c.fillStyle = "rgba(255,255,255,0.06)";
      rr(c, x - w / 2 + 4, y - h + 4, w - 8, h * 0.35, 12);
      c.fill();
      /* text */
      c.fillStyle = "#FFF8F0";
      c.textAlign = "center";
      c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
      c.fillText(title, x, y - h + 24);
      c.font = '13px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
      c.fillStyle = "rgba(255,248,240,0.85)";
      wrapText(c, body, x, y - h + 44, 190, 16);
      /* pointer */
      c.fillStyle = "rgba(82,58,42,0.94)";
      c.beginPath();
      c.moveTo(x - 8, y);
      c.quadraticCurveTo(x, y + 12, x + 8, y);
      c.closePath();
      c.fill();
      c.restore();
    }

    function drawSpeakerIcon(c, x, y, muted, hovered) {
      c.save();
      c.translate(x, y);
      if (hovered) drawGlowCircle(c, 0, 0, 26, "rgba(255,215,0,ALPHA)", 0.18);
      c.fillStyle = "rgba(92,68,52,0.9)";
      rr(c, -20, -20, 40, 40, 12);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.6)";
      c.lineWidth = 1.5;
      c.stroke();
      c.strokeStyle = "#FFF8F0";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-8, -6);
      c.lineTo(-2, -6);
      c.lineTo(6, -14);
      c.lineTo(6, 14);
      c.lineTo(-2, 6);
      c.lineTo(-8, 6);
      c.stroke();
      if (!muted) {
        c.beginPath();
        c.arc(7, 0, 7, -0.7, 0.7);
        c.stroke();
        c.beginPath();
        c.arc(7, 0, 12, -0.8, 0.8);
        c.stroke();
      } else {
        c.strokeStyle = COLORS.softPink;
        c.beginPath();
        c.moveTo(10, -10);
        c.lineTo(20, 10);
        c.moveTo(20, -10);
        c.lineTo(10, 10);
        c.stroke();
      }
      c.restore();
    }

    function drawBadgeIcon(c, icon, x, y, color) {
      c.save();
      c.translate(x, y);
      c.fillStyle = color;
      c.strokeStyle = "#fff";
      c.lineWidth = 1.5;
      if (icon === "bone") {
        drawBone(c, 0, 0, 18, 10, color);
      } else if (icon === "star") {
        drawStar(c, 0, 0, 8, color);
      } else if (icon === "catEye") {
        c.beginPath();
        c.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.strokeStyle = "#2E7D32";
        c.beginPath();
        c.moveTo(0, -4);
        c.lineTo(0, 4);
        c.stroke();
      } else if (icon === "paw") {
        c.beginPath();
        c.arc(0, 2, 6, 0, Math.PI * 2);
        c.fill();
        [-6, -1, 4, 9].forEach((dx) => {
          c.beginPath();
          c.arc(dx, -7, 3, 0, Math.PI * 2);
          c.fill();
        });
      } else if (icon === "couch") {
        rr(c, -10, -2, 20, 8, 4);
        c.fill();
        rr(c, -13, -8, 26, 8, 5);
        c.fill();
      } else if (icon === "heart") {
        drawHeart(c, 0, 6, 0.45, color);
      }
      c.restore();
    }

    function drawWaterDrop(c, x, y, s, color) {
      c.save();
      c.translate(x, y);
      c.scale(s, s);
      c.fillStyle = color || "#6CB4EE";
      c.beginPath();
      c.moveTo(0, -6);
      c.quadraticCurveTo(5, 0, 4, 4);
      c.quadraticCurveTo(0, 8, -4, 4);
      c.quadraticCurveTo(-5, 0, 0, -6);
      c.closePath();
      c.fill();
      c.restore();
    }

    function drawMoodIcon(c, mood, x, y) {
      if (mood === "hungry") drawBone(c, x, y, 10, 5, "#A07050");
      else if (mood === "thirsty") drawWaterDrop(c, x, y, 0.8, "#6CB4EE");
      else if (mood === "sleepy") {
        c.save();
        c.fillStyle = "#9B8EC2";
        c.font = '9px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("Zzz", x, y);
        c.restore();
      } else if (mood === "playful") drawStar(c, x, y, 5, COLORS.gold);
      else if (mood === "cuddly") drawHeart(c, x, y + 3, 0.22, COLORS.softPink);
    }

    function drawAchievementBanner(c, banner) {
      if (!banner) return;
      const t = clamp(banner.time / banner.maxTime, 0, 1);
      const slide = 1 - easeOutQuad(Math.min(1, (banner.maxTime - banner.time) / 0.2));
      const y = lerp(24, -84, slide);
      c.save();
      c.translate(W / 2, y);
      rr(c, -180, 0, 360, 64, 16);
      c.fillStyle = "rgba(92,68,52,0.96)";
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.4)";
      c.lineWidth = 2;
      c.stroke();
      drawStar(c, -145, 32, 12, COLORS.gold);
      c.fillStyle = COLORS.cream;
      c.textAlign = "left";
      c.font = '16px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
      c.fillText("Achievement Unlocked!", -120, 23);
      c.font = '20px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
      c.fillText(banner.name, -120, 46);
      c.restore();
    }
