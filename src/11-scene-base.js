    class BaseScene {
      constructor(name) {
        this.name = name;
        this.tooltip = null;
        this.tooltipAlpha = 0;
      }
      enter() {}
      update(dt) {
        this.tooltipAlpha += ((this.tooltip ? 1 : 0) - this.tooltipAlpha) * dt * 10;
      }
      draw(c) {}
      onClick() {}
      onKeyDown() {}
      onMouseMove() {}
      interactiveAt() { return false; }
      hoveredLabel() { return null; }
    }
