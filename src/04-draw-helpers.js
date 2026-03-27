    function drawHeart(c, x, y, s, color) {
      c.save();
      c.translate(x, y);
      c.scale(s, s);
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, 6);
      c.bezierCurveTo(-12, -6, -18, -20, -5, -24);
      c.bezierCurveTo(0, -26, 4, -22, 5, -18);
      c.bezierCurveTo(6, -22, 10, -26, 15, -24);
      c.bezierCurveTo(28, -20, 22, -6, 10, 6);
      c.lineTo(5, 11);
      c.lineTo(0, 6);
      c.fill();
      c.restore();
    }
    function drawStar(c, x, y, r, color) {
      c.save();
      c.translate(x, y);
      c.fillStyle = color;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + i * Math.PI / 5;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.restore();
    }
    function drawBone(c, x, y, w, h, color) {
      c.save();
      c.translate(x, y);
      c.fillStyle = color;
      /* central bar */
      rr(c, -w * 0.45, -h * 0.28, w * 0.9, h * 0.56, h * 0.2);
      c.fill();
      /* knobs - drawn after rr so beginPath doesn't erase them */
      c.beginPath();
      c.arc(-w * 0.35, -h * 0.25, h * 0.25, 0, Math.PI * 2);
      c.arc(-w * 0.35, h * 0.25, h * 0.25, 0, Math.PI * 2);
      c.arc(w * 0.35, -h * 0.25, h * 0.25, 0, Math.PI * 2);
      c.arc(w * 0.35, h * 0.25, h * 0.25, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    function drawGlowCircle(c, x, y, r, color, alpha = 0.3) {
      c.save();
      const grad = c.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, color.replace("ALPHA", alpha.toFixed(3)));
      grad.addColorStop(1, color.replace("ALPHA", "0"));
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    function wrapText(c, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      for (let i = 0; i < words.length; i++) {
        const test = line + words[i] + " ";
        if (c.measureText(test).width > maxWidth && line) {
          c.fillText(line.trim(), x, y);
          y += lineHeight;
          line = words[i] + " ";
        } else {
          line = test;
        }
      }
      if (line) c.fillText(line.trim(), x, y);
    }
