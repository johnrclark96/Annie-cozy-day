    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function rand(min, max) { return min + Math.random() * (max - min); }
    function sign(v) { return v < 0 ? -1 : 1; }
    function easeOutBack(t) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
    function dist(ax, ay, bx, by) {
      const dx = bx - ax;
      const dy = by - ay;
      return Math.hypot(dx, dy);
    }
    function pointInRect(px, py, r) {
      return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }
    function pointInCircle(px, py, cx, cy, r) {
      return dist(px, py, cx, cy) <= r;
    }
    function rr(c, x, y, w, h, r) {
      const radius = Math.min(r, w * 0.5, h * 0.5);
      c.beginPath();
      c.moveTo(x + radius, y);
      c.arcTo(x + w, y, x + w, y + h, radius);
      c.arcTo(x + w, y + h, x, y + h, radius);
      c.arcTo(x, y + h, x, y, radius);
      c.arcTo(x, y, x + w, y, radius);
      c.closePath();
    }
    function drawShadowEllipse(c, x, y, rx, ry, alpha = 0.14) {
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = "#000";
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
