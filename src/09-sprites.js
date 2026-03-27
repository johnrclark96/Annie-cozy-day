    const SPRITE_ATLAS_URI = "assets/cozy-sprites-atlas.webp";

    const SPRITE_FRAME_BOXES = {
      "annie": {
            "stand": {
                  "x": 8,
                  "y": 8,
                  "w": 462,
                  "h": 974
            },
            "sit": {
                  "x": 472,
                  "y": 990,
                  "w": 515,
                  "h": 957
            },
            "cheer": {
                  "x": 478,
                  "y": 8,
                  "w": 514,
                  "h": 970
            },
            "laugh": {
                  "x": 8,
                  "y": 990,
                  "w": 456,
                  "h": 970
            },
            "kneel": {
                  "x": 8,
                  "y": 7467,
                  "w": 730,
                  "h": 745
            },
            "walkSide": {
                  "x": 8,
                  "y": 8220,
                  "w": 633,
                  "h": 970
            },
            "walkFront": {
                  "x": 8,
                  "y": 9198,
                  "w": 613,
                  "h": 984
            }
      },
      "items": {
            "yarnBall": {
                  "x": 8,
                  "y": 10190,
                  "w": 352,
                  "h": 257
            },
            "brush": {
                  "x": 8,
                  "y": 10455,
                  "w": 381,
                  "h": 294
            },
            "foodBowl": {
                  "x": 8,
                  "y": 14106,
                  "w": 644,
                  "h": 410
            },
            "waterBowl": {
                  "x": 8,
                  "y": 14524,
                  "w": 645,
                  "h": 406
            },
            "giftBox": {
                  "x": 8,
                  "y": 14938,
                  "w": 484,
                  "h": 410
            },
            "dogTreats": {
                  "x": 8,
                  "y": 15356,
                  "w": 580,
                  "h": 258
            },
            "catTreats": {
                  "x": 8,
                  "y": 15622,
                  "w": 489,
                  "h": 208
            }
      },
      "obi": {
            "sitHappy": {
                  "x": 8,
                  "y": 2558,
                  "w": 360,
                  "h": 512
            },
            "run": {
                  "x": 8,
                  "y": 3907,
                  "w": 564,
                  "h": 379
            },
            "leap": {
                  "x": 8,
                  "y": 3517,
                  "w": 485,
                  "h": 382
            },
            "sitSad": {
                  "x": 376,
                  "y": 2558,
                  "w": 367,
                  "h": 471
            },
            "sleep": {
                  "x": 8,
                  "y": 4666,
                  "w": 653,
                  "h": 342
            },
            "sniff": {
                  "x": 8,
                  "y": 5016,
                  "w": 757,
                  "h": 509
            },
            "shake": {
                  "x": 8,
                  "y": 5533,
                  "w": 644,
                  "h": 520
            },
            "eat": {
                  "x": 8,
                  "y": 10765,
                  "w": 634,
                  "h": 423
            },
            "drink": {
                  "x": 8,
                  "y": 11196,
                  "w": 663,
                  "h": 412
            },
            "carryToy": {
                  "x": 8,
                  "y": 11616,
                  "w": 560,
                  "h": 392
            },
            "bath": {
                  "x": 8,
                  "y": 12016,
                  "w": 560,
                  "h": 506
            }
      },
      "luna": {
            "sit": {
                  "x": 8,
                  "y": 1968,
                  "w": 428,
                  "h": 582
            },
            "crouch": {
                  "x": 8,
                  "y": 4294,
                  "w": 524,
                  "h": 356
            },
            "pounce": {
                  "x": 8,
                  "y": 3078,
                  "w": 680,
                  "h": 431
            },
            "paw": {
                  "x": 444,
                  "y": 1968,
                  "w": 353,
                  "h": 533
            },
            "sleep": {
                  "x": 8,
                  "y": 6069,
                  "w": 719,
                  "h": 372
            },
            "groom": {
                  "x": 8,
                  "y": 6449,
                  "w": 581,
                  "h": 576
            },
            "bellyUp": {
                  "x": 8,
                  "y": 7033,
                  "w": 868,
                  "h": 418
            },
            "eat": {
                  "x": 8,
                  "y": 12530,
                  "w": 782,
                  "h": 336
            },
            "drink": {
                  "x": 8,
                  "y": 12874,
                  "w": 783,
                  "h": 387
            },
            "stretch": {
                  "x": 8,
                  "y": 13269,
                  "w": 714,
                  "h": 411
            },
            "bath": {
                  "x": 8,
                  "y": 13688,
                  "w": 560,
                  "h": 410
            }
      }
};

    const SPRITE_BASE_SCALE = {
      annie: 0.158,
      obi: 0.205,
      luna: 0.198
    };

    const spriteArt = {
      ready: false,
      loading: false,
      image: null,
      frames: SPRITE_FRAME_BOXES
    };

    function makeBufferCanvas(w, h) {
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w));
      cv.height = Math.max(1, Math.round(h));
      return cv;
    }

    function loadCozyArt() {
      if (spriteArt.loading || spriteArt.ready) return;
      spriteArt.loading = true;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        spriteArt.image = img;
        spriteArt.loading = false;
        spriteArt.ready = true;
      };
      img.onerror = () => {
        spriteArt.loading = false;
      };
      img.src = SPRITE_ATLAS_URI;
    }

    function drawZzz(c, x, y, scale = 1, alpha = 0.9) {
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = "#FFF8F0";
      c.strokeStyle = "rgba(92,68,52,0.45)";
      c.lineWidth = 2;
      c.font = `${Math.round(16 * scale)}px "Fredoka One", "Comic Sans MS", cursive, sans-serif`;
      c.strokeText("Zzz", x, y);
      c.fillText("Zzz", x, y);
      c.restore();
    }


    function drawFrameImage(c, frame, x, y, scale, options = {}) {
      if (!frame || !spriteArt.image) return;
      const pxScale = (options.baseScale || 0.18) * scale;
      const stretchX = options.stretchX || 1;
      const stretchY = options.stretchY || 1;
      const w = frame.w * pxScale * stretchX;
      const h = frame.h * pxScale * stretchY;
      const bob = options.bob || 0;
      const flip = options.flip || 1;
      const rotation = options.rotation || 0;
      const shadowAlpha = options.shadowAlpha == null ? 0.16 : options.shadowAlpha;

      c.save();
      c.translate(x, y + bob);
      c.rotate(rotation);
      c.scale(flip, 1);
      if (shadowAlpha > 0) {
        drawShadowEllipse(c, 0, -4, Math.max(20, w * 0.22), Math.max(6, h * 0.045), shadowAlpha);
      }
      if (options.glow) {
        c.shadowColor = options.glow;
        c.shadowBlur = options.glowBlur || 22;
      }
      c.drawImage(spriteArt.image, frame.x, frame.y, frame.w, frame.h, -w / 2, -h, w, h);
      c.restore();
    }

    function drawUpperFrame(c, frame, x, y, scale, options = {}) {
      if (!frame || !spriteArt.image) return;
      const crop = options.crop || 0.6;
      const sw = frame.w;
      const sh = Math.max(1, Math.floor(frame.h * crop));
      const pxScale = (options.baseScale || 0.16) * scale;
      const w = sw * pxScale;
      const h = sh * pxScale;
      c.save();
      c.translate(x, y + (options.bob || 0));
      c.rotate(options.rotation || 0);
      if (options.glow) {
        c.shadowColor = options.glow;
        c.shadowBlur = options.glowBlur || 20;
      }
      c.drawImage(spriteArt.image, frame.x, frame.y, sw, sh, -w / 2, -h * 0.15, w, h);
      c.restore();
    }

    function drawAnnieSprite(c, x, y, scale, s) {
      const pose = s.pose || "idle";
      const frames = spriteArt.frames.annie;
      let frame = frames.stand;
      if (pose === "sit") frame = frames.sit;
      else if (pose === "kneel") frame = frames.kneel;
      else if (pose === "walk") frame = frames.walkSide;
      else if (pose === "walkFront") frame = frames.walkFront;
      else if (pose === "cheer") frame = frames.cheer;
      else if (pose === "laugh") frame = frames.laugh;
      else if (pose === "upper") frame = (s.armRaise || 0) > 0.4 ? frames.cheer : frames.stand;
      else if (pose === "sleeping") frame = frames.laugh;
      else if (pose === "happy") frame = frames.cheer;
      else if ((s.blink && pose !== "upper" && pose !== "sit") || (s.armRaise || 0) > 0.7) frame = frames.cheer;
      const bob = -(s.breath || 0) * 2.4 + (pose === "walk" || pose === "walkFront" ? Math.sin(game.time * 8) * 2 : 0);
      const rotation = (s.headTilt || 0) * 0.08 + (s.hairSway || 0) * 0.02;
      if (pose === "upper") {
        drawUpperFrame(c, frame, x, y + 4, scale, {
          baseScale: SPRITE_BASE_SCALE.annie,
          crop: frame === frames.cheer ? 0.58 : 0.62,
          rotation,
          bob,
          glow: s.glow
        });
        return;
      }
      drawFrameImage(c, frame, x, y, scale, {
        baseScale: SPRITE_BASE_SCALE.annie,
        flip: s.facing || 1,
        rotation,
        bob,
        stretchY: 1 + (s.breath || 0) * 0.015,
        glow: s.glow
      });
      if (pose === "sleeping") drawZzz(c, x + 34, y - 150 * scale, 0.9 * scale);
    }

    function drawObiSprite(c, x, y, scale, s) {
      const pose = s.pose || "sit";
      const expression = s.expression || "happy";
      const frames = spriteArt.frames.obi;
      const happyMotion = (s.bounce || 0) > 0.06 || expression === "excited";
      let frame = frames.sitHappy;
      if (pose === "run" || pose === "side") frame = Math.sin(game.time * (happyMotion ? 18 : 12)) > 0 ? frames.run : frames.leap;
      else if (pose === "sleeping") frame = frames.sleep;
      else if (pose === "sniff") frame = frames.sniff;
      else if (pose === "shake") frame = frames.shake;
      else if (pose === "eat") frame = frames.eat;
      else if (pose === "drink") frame = frames.drink;
      else if (pose === "carryToy") frame = frames.carryToy;
      else if (pose === "bath") frame = frames.bath;
      else if (expression === "sad") frame = frames.sitSad;
      else if (happyMotion) frame = Math.sin(game.time * 14) > 0 ? frames.leap : frames.sitHappy;
      drawFrameImage(c, frame, x, y, scale, {
        baseScale: SPRITE_BASE_SCALE.obi,
        flip: s.facing || 1,
        bob: -(s.bounce || 0) * 20,
        rotation: (expression === "sad" ? -0.03 * (s.facing || 1) : 0) + (pose === "shake" ? Math.sin(game.time * 24) * 0.06 : 0),
        stretchY: 1 + (s.bounce || 0) * 0.04,
        glow: s.glow
      });
      if (pose === "sleeping") drawZzz(c, x + 30, y - 96 * scale, 0.85 * scale);
    }

    function drawLunaSprite(c, x, y, scale, s) {
      const pose = s.pose || "sit";
      const frames = spriteArt.frames.luna;
      let frame = frames.sit;
      if (pose === "lounge") frame = Math.sin(game.time * 2.4) > 0 ? frames.crouch : frames.paw;
      else if (pose === "sleeping") frame = frames.sleep;
      else if (pose === "groom") frame = frames.groom;
      else if (pose === "bellyUp") frame = frames.bellyUp;
      else if (pose === "eat") frame = frames.eat;
      else if (pose === "drink") frame = frames.drink;
      else if (pose === "stretch") frame = frames.stretch;
      else if (pose === "bath") frame = frames.bath;
      else if (pose === "topdown") {
        if ((s.pawBat || 0) > 0.12) frame = frames.paw;
        else if ((s.pounceStretch || 0) > 0.35) frame = frames.pounce;
        else frame = frames.crouch;
      } else if ((s.pawBat || 0) > 0.12) frame = frames.paw;
      else if ((s.blink && pose !== "topdown") || (s.pounceStretch || 0) > 0.25) frame = frames.pounce;
      const topdownRot = pose === "topdown" ? clamp(Math.atan2(game.mouse.y - y, game.mouse.x - x) * 0.18, -0.42, 0.42) : 0;
      const bellyRock = pose === "bellyUp" ? Math.sin(game.time * 3) * 0.04 : 0;
      drawFrameImage(c, frame, x, y, scale, {
        baseScale: SPRITE_BASE_SCALE.luna,
        flip: (pose === "topdown" ? (game.mouse.x >= x ? 1 : -1) : (s.facing || 1)),
        bob: -Math.abs(s.wiggle || 0) * 2 - (s.pawBat || 0) * 4 + (pose === "bellyUp" ? Math.sin(game.time * 2) * 2 : 0),
        rotation: topdownRot + (s.earTwitch || 0) * 0.04 + bellyRock,
        stretchX: 1 + (s.pounceStretch || 0) * 0.12,
        stretchY: 1 - (s.pounceStretch || 0) * 0.06,
        glow: s.glow
      });
      if (pose === "sleeping") drawZzz(c, x + 26, y - 90 * scale, 0.82 * scale);
    }

    function normalizeState(state, fallbackPose = "idle") {
      if (!state) return { pose: fallbackPose };
      if (typeof state === "string") return { pose: state };
      return state;
    }

    function drawAnnie(c, x, y, scale, state) {
      const s = normalizeState(state, "idle");
      const pose = s.pose || "idle";
      const breath = s.breath || 0;
      const blink = !!s.blink;
      const hairSway = s.hairSway || 0;
      const headTilt = s.headTilt || 0;
      const armRaise = s.armRaise || 0;
      const sit = pose === "sit";
      const upper = pose === "upper";
      const sleeping = pose === "sleeping";
      const happy = pose === "happy";

      if (spriteArt.ready) {
        drawAnnieSprite(c, x, y, scale, s);
        return;
      }

      c.save();
      c.translate(x, y);
      c.scale(scale, scale);

      const bodyYScale = 1 + breath * 0.04;
      const hairDx = hairSway * 3;
      const bodyTop = upper ? -16 : -8;

      if (!upper) drawShadowEllipse(c, 0, sit ? 78 : 88, sit ? 34 : 28, sit ? 10 : 8, 0.12);

      c.save();
      c.translate(0, headTilt * 4);
      c.fillStyle = "#E8C95A";
      c.beginPath();
      c.moveTo(-34 + hairDx, -36);
      c.quadraticCurveTo(-46 + hairDx, 0, -38 + hairDx, 56);
      c.quadraticCurveTo(-26 + hairDx, 70, -8 + hairDx, 52);
      c.lineTo(18 + hairDx, 56);
      c.quadraticCurveTo(34 + hairDx, 74, 42 + hairDx, 48);
      c.quadraticCurveTo(48 + hairDx, 6, 34 + hairDx, -34);
      c.quadraticCurveTo(0 + hairDx, -60, -34 + hairDx, -36);
      c.fill();

      c.beginPath();
      c.moveTo(-24 + hairDx, -32);
      c.quadraticCurveTo(-12 + hairDx, -50, 6 + hairDx, -42);
      c.quadraticCurveTo(18 + hairDx, -40, 24 + hairDx, -26);
      c.quadraticCurveTo(8 + hairDx, -22, -4 + hairDx, -10);
      c.quadraticCurveTo(-14 + hairDx, -2, -20 + hairDx, -16);
      c.fill();
      c.restore();

      if (!upper) {
        c.fillStyle = "#1F2F6B";
        if (sit) {
          rr(c, -18, 44, 16, 32, 8);
          c.fill();
          rr(c, 2, 44, 16, 32, 8);
          c.fill();
          c.fillStyle = "#A66B3E";
          rr(c, -24, 66, 20, 18, 7);
          c.fill();
          rr(c, 0, 66, 20, 18, 7);
          c.fill();
        } else {
          rr(c, -18, 32, 14, 44, 6);
          c.fill();
          rr(c, 4, 32, 14, 44, 6);
          c.fill();
          c.fillStyle = "#A66B3E";
          rr(c, -22, 70, 18, 18, 6);
          c.fill();
          rr(c, 4, 70, 18, 18, 6);
          c.fill();
        }
      }

      c.save();
      c.translate(0, upper ? 0 : bodyTop);
      c.scale(1, bodyYScale);
      c.fillStyle = COLORS.warmRed;
      rr(c, -26, 0, 52, upper ? 54 : 54, 22);
      c.fill();
      c.restore();

      c.strokeStyle = "#C98E59";
      c.lineWidth = 5;
      c.lineCap = "round";
      if (!upper) {
        if (sit) {
          c.beginPath();
          c.moveTo(-18, 12);
          c.lineTo(-32, 34);
          c.moveTo(18, 12);
          c.lineTo(30, 32);
          c.stroke();
        } else {
          c.beginPath();
          c.moveTo(-20, 8);
          c.lineTo(-30, 30);
          c.moveTo(20, 8);
          c.lineTo(28, 30);
          c.stroke();
        }
      } else {
        c.beginPath();
        c.moveTo(-20, 6);
        c.lineTo(-28, 26);
        c.moveTo(18, 2);
        c.lineTo(26 + armRaise * 12, -8 - armRaise * 18);
        c.stroke();
      }

      c.save();
      c.translate(0, headTilt * 2);
      c.fillStyle = "#FFDFC4";
      c.beginPath();
      c.arc(0, -30, 28, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = "#F8C7D0";
      c.beginPath();
      c.arc(-16, -22, 4.5, 0, Math.PI * 2);
      c.arc(16, -22, 4.5, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = "#D7A980";
      c.lineWidth = 2;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-12, -40);
      c.quadraticCurveTo(-4, -48, 4, -40);
      c.stroke();

      c.fillStyle = "#3E2723";
      if (blink || sleeping) {
        c.lineWidth = 2.8;
        c.beginPath();
        c.moveTo(-12, -30);
        c.lineTo(-3, -30);
        c.moveTo(3, -30);
        c.lineTo(12, -30);
        c.stroke();
      } else {
        c.beginPath();
        c.arc(-8, -30, 4.5, 0, Math.PI * 2);
        c.arc(8, -30, 4.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(-6.8, -31.3, 1.2, 0, Math.PI * 2);
        c.arc(9.2, -31.3, 1.2, 0, Math.PI * 2);
        c.fill();
      }

      c.strokeStyle = "#A45A5A";
      c.lineWidth = 2.6;
      c.beginPath();
      if (sleeping) {
        c.moveTo(-6, -12);
        c.quadraticCurveTo(0, -8, 6, -12);
      } else if (happy) {
        c.arc(0, -14, 7, 0.2, Math.PI - 0.2);
      } else {
        c.arc(0, -16, 5.5, 0.1, Math.PI - 0.1);
      }
      c.stroke();
      c.restore();
      c.restore();
    }

    function drawObi(c, x, y, scale, state) {
      const s = normalizeState(state, "sit");
      const pose = s.pose || "sit";
      const expression = s.expression || "happy";
      const tail = s.tail || 0;
      const facing = s.facing || 1;
      const bounce = s.bounce || 0;
      const earDroop = s.earDroop || 0;
      const sleeping = pose === "sleeping";
      const side = pose === "run" || pose === "side";

      if (spriteArt.ready) {
        drawObiSprite(c, x, y, scale, s);
        return;
      }

      c.save();
      c.translate(x, y + bounce * -6);
      c.scale(scale * facing, scale);

      if (sleeping) {
        drawShadowEllipse(c, 0, 26, 28, 8, 0.14);
        c.fillStyle = "#FAFAFA";
        c.beginPath();
        c.arc(0, 0, 22, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#8B6914";
        c.beginPath();
        c.arc(14, -8, 11, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#4A90D9";
        c.beginPath();
        c.moveTo(-12, 4);
        c.lineTo(0, 16);
        c.lineTo(10, 2);
        c.closePath();
        c.fill();
        c.fillStyle = "#FFDFC4";
        c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Zzz", 26, -12);
        c.restore();
        return;
      }

      if (side) {
        drawShadowEllipse(c, 0, 36, 34, 8, 0.12);
        c.strokeStyle = "#8B6914";
        c.lineWidth = 5;
        c.lineCap = "round";
        c.save();
        c.translate(-30, 8);
        c.rotate(tail * 0.45 - 0.3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-24, -10);
        c.stroke();
        c.restore();

        c.fillStyle = "#FAFAFA";
        rr(c, -18, -4, 58, 28, 14);
        c.fill();
        c.fillStyle = "#DDB27A";
        c.beginPath();
        c.arc(16, 8, 9, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#FAFAFA";
        rr(c, -6, 16, 10, 20, 4);
        c.fill();
        rr(c, 14, 16, 10, 20, 4);
        c.fill();
        rr(c, -20, 16, 10, 20, 4);
        c.fill();
        rr(c, 30, 16, 10, 20, 4);
        c.fill();

        c.fillStyle = "#FAFAFA";
        c.beginPath();
        c.ellipse(40, 0, 22, 18, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#8B6914";
        c.beginPath();
        c.ellipse(34, -4, 8, 11, 0, 0, Math.PI * 2);
        c.ellipse(47, -4, 8, 11, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(26, -10 - earDroop * 2, 7, 15, -0.4, 0, Math.PI * 2);
        c.ellipse(54, -10 - earDroop * 2, 7, 15, 0.4, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#FAFAFA";
        c.beginPath();
        c.ellipse(40, 4, 12, 9, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#4A90D9";
        c.beginPath();
        c.moveTo(18, 10);
        c.lineTo(32, 18);
        c.lineTo(36, 6);
        c.closePath();
        c.fill();

        c.fillStyle = "#3E2723";
        if (expression === "sad") {
          c.beginPath();
          c.arc(34, -1, 3.5, 0, Math.PI * 2);
          c.arc(46, -1, 3.5, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#7A4A4A";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(36, 9);
          c.quadraticCurveTo(40, 6, 44, 9);
          c.stroke();
        } else {
          c.beginPath();
          c.arc(34, -1, 3.5, 0, Math.PI * 2);
          c.arc(46, -1, 3.5, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#fff";
          c.beginPath();
          c.arc(35, -2, 1, 0, Math.PI * 2);
          c.arc(47, -2, 1, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#7A4A4A";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(40, 9, 7, 0.1, Math.PI - 0.1);
          c.stroke();
          if (expression === "happy" || expression === "excited") {
            c.fillStyle = COLORS.softPink;
            c.beginPath();
            c.moveTo(40, 11);
            c.quadraticCurveTo(36, 18, 43, 18);
            c.quadraticCurveTo(46, 15, 43, 10);
            c.fill();
          }
        }

        c.fillStyle = "#FFB6C1";
        c.beginPath();
        c.arc(40, 5, 3, 0, Math.PI * 2);
        c.fill();
      } else {
        drawShadowEllipse(c, 0, 54, 26, 8, 0.12);

        c.strokeStyle = "#8B6914";
        c.lineWidth = 5;
        c.lineCap = "round";
        c.save();
        c.translate(0, 24);
        c.rotate(tail * 0.55);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(18, 14);
        c.stroke();
        c.restore();

        c.fillStyle = "#FAFAFA";
        rr(c, -18, 8, 36, 42, 16);
        c.fill();

        c.fillStyle = "#FAFAFA";
        c.beginPath();
        c.ellipse(0, -14, 25, 23, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#8B6914";
        c.beginPath();
        c.ellipse(-12, -16, 11, 14, 0, 0, Math.PI * 2);
        c.ellipse(12, -16, 11, 14, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(-18, -28 - earDroop * 3, 8, 18, 0.25, 0, Math.PI * 2);
        c.ellipse(18, -28 - earDroop * 3, 8, 18, -0.25, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#FAFAFA";
        c.beginPath();
        c.ellipse(0, -8, 14, 10, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#4A90D9";
        c.beginPath();
        c.moveTo(-14, 8);
        c.lineTo(0, 24);
        c.lineTo(14, 8);
        c.closePath();
        c.fill();

        c.fillStyle = "#FAFAFA";
        rr(c, -15, 44, 12, 18, 5);
        c.fill();
        rr(c, 3, 44, 12, 18, 5);
        c.fill();

        c.fillStyle = "#3E2723";
        if (expression === "sleeping") {
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-12, -16);
          c.lineTo(-5, -16);
          c.moveTo(5, -16);
          c.lineTo(12, -16);
          c.stroke();
        } else {
          c.beginPath();
          c.arc(-8, -16, 4.5, 0, Math.PI * 2);
          c.arc(8, -16, 4.5, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#fff";
          c.beginPath();
          c.arc(-6.7, -17, 1.2, 0, Math.PI * 2);
          c.arc(9.3, -17, 1.2, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#3E2723";
        }

        c.fillStyle = "#FFB6C1";
        c.beginPath();
        c.arc(0, -5, 4, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "#7A4A4A";
        c.lineWidth = 2.3;
        c.beginPath();
        if (expression === "sad") {
          c.moveTo(-6, 8);
          c.quadraticCurveTo(0, 4, 6, 8);
        } else {
          c.arc(0, 5, 8, 0.15, Math.PI - 0.15);
        }
        c.stroke();

        if (expression === "happy" || expression === "excited") {
          c.fillStyle = COLORS.softPink;
          c.beginPath();
          c.moveTo(0, 8);
          c.quadraticCurveTo(-3, 14, 3, 14);
          c.quadraticCurveTo(5, 10, 2, 7);
          c.fill();
        }
      }

      c.restore();
    }

    function drawLuna(c, x, y, scale, state) {
      const s = normalizeState(state, "sit");
      const pose = s.pose || "sit";
      const tail = s.tail || 0;
      const facing = s.facing || 1;
      const blink = !!s.blink;
      const earTwitch = s.earTwitch || 0;
      const wiggle = s.wiggle || 0;
      const pawBat = s.pawBat || 0;

      if (spriteArt.ready) {
        drawLunaSprite(c, x, y, scale, s);
        return;
      }
      const pounceStretch = s.pounceStretch || 0;
      const sleeping = pose === "sleeping";
      const topdown = pose === "topdown";

      c.save();
      c.translate(x, y);
      c.scale(scale * facing, scale);

      if (topdown) {
        drawShadowEllipse(c, 0, 28, 36, 10, 0.12);

        c.save();
        c.translate(Math.sin(wiggle * Math.PI * 2) * 5, 0);
        c.rotate(0.08 * Math.sin(wiggle * Math.PI * 4));
        c.fillStyle = "#9B7D3C";
        c.beginPath();
        c.ellipse(0 + pounceStretch * 8, 0, 36 + pounceStretch * 8, 22 - pounceStretch * 4, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#4A3B1F";
        [-18, 0, 18].forEach((dx, i) => {
          c.beginPath();
          c.arc(dx, -2 + i % 2 * 5, 4, 0, Math.PI * 2);
          c.fill();
        });

        c.fillStyle = "#9B7D3C";
        c.beginPath();
        c.ellipse(32 + pounceStretch * 16, -2, 20, 16, 0, 0, Math.PI * 2);
        c.fill();

        c.save();
        c.translate(38 + pounceStretch * 12, -16);
        c.rotate(-0.35 + earTwitch * 0.12);
        c.fillStyle = "#9B7D3C";
        c.beginPath();
        c.moveTo(-6, 0);
        c.lineTo(0, -28);
        c.lineTo(8, 0);
        c.closePath();
        c.fill();
        c.restore();

        c.save();
        c.translate(28 + pounceStretch * 12, -16);
        c.rotate(-0.05 - earTwitch * 0.12);
        c.fillStyle = "#9B7D3C";
        c.beginPath();
        c.moveTo(-8, 0);
        c.lineTo(-1, -28);
        c.lineTo(8, 0);
        c.closePath();
        c.fill();
        c.restore();

        c.fillStyle = "#7CB342";
        c.beginPath();
        c.arc(31 + pounceStretch * 8, -3, 5.2, 0, Math.PI * 2);
        c.arc(44 + pounceStretch * 8, -3, 5.2, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "#1B1B1B";
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(31 + pounceStretch * 8, -7);
        c.lineTo(31 + pounceStretch * 8, 1);
        c.moveTo(44 + pounceStretch * 8, -7);
        c.lineTo(44 + pounceStretch * 8, 1);
        c.stroke();

        c.fillStyle = "#FAFAFA";
        c.beginPath();
        c.ellipse(38 + pounceStretch * 8, 6, 8, 6, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#FFB6C1";
        c.beginPath();
        c.arc(38 + pounceStretch * 8, 3, 2.8, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "#4A3B1F";
        c.lineWidth = 3;
        c.lineCap = "round";
        c.save();
        c.translate(-32, 2);
        c.rotate(tail * 0.55 + 0.7);
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(-24, -12, -30, 8);
        c.stroke();
        c.strokeStyle = "#9B7D3C";
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(-24, -12, -30, 8);
        c.stroke();
        c.restore();

        c.strokeStyle = "#4A3B1F";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(43, 8);
        c.lineTo(58 + pawBat * 10, 2 - pawBat * 4);
        c.stroke();
        c.restore();
        c.restore();
        return;
      }

      if (sleeping) {
        drawShadowEllipse(c, 0, 22, 28, 8, 0.14);
        c.fillStyle = "#9B7D3C";
        c.beginPath();
        c.arc(0, 0, 24, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#4A3B1F";
        c.beginPath();
        c.arc(8, -2, 5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#FAFAFA";
        c.beginPath();
        c.ellipse(10, 4, 9, 6, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#FFDFC4";
        c.font = '14px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
        c.fillText("Zzz", 24, -16);
        c.restore();
        return;
      }

      drawShadowEllipse(c, 0, 52, 28, 8, 0.12);

      c.strokeStyle = "#4A3B1F";
      c.lineWidth = 5;
      c.lineCap = "round";
      c.save();
      c.translate(10, 26);
      c.rotate(tail * 0.4 + 0.65);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(22, -10, 28, -30);
      c.stroke();
      c.restore();

      c.fillStyle = "#9B7D3C";
      if (pose === "lounge") {
        c.beginPath();
        c.ellipse(0, 20, 38, 20, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#9B7D3C";
        c.beginPath();
        c.ellipse(26, -2, 20, 18, 0, 0, Math.PI * 2);
        c.fill();
      } else if (pose === "pounce") {
        c.beginPath();
        c.ellipse(0 + pounceStretch * 6, 18, 34 + pounceStretch * 12, 18 - pounceStretch * 2, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(34 + pounceStretch * 12, 0, 20, 18, 0, 0, Math.PI * 2);
        c.fill();
      } else {
        rr(c, -16, 10, 34, 40, 14);
        c.fill();
        c.beginPath();
        c.ellipse(2, -10, 22, 20, 0, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = "#4A3B1F";
      c.beginPath();
      c.moveTo(-4, -20);
      c.lineTo(0, -26);
      c.lineTo(4, -20);
      c.lineTo(8, -27);
      c.lineTo(12, -20);
      c.strokeStyle = "#4A3B1F";
      c.lineWidth = 3;
      c.lineJoin = "round";
      c.stroke();

      c.fillStyle = "#9B7D3C";
      c.save();
      c.translate(-10, -24);
      c.rotate(-0.18 - earTwitch * 0.14);
      c.beginPath();
      c.moveTo(-8, 0);
      c.lineTo(0, -34);
      c.lineTo(10, 0);
      c.closePath();
      c.fill();
      c.restore();

      c.save();
      c.translate(14, -24);
      c.rotate(0.18 + earTwitch * 0.14);
      c.beginPath();
      c.moveTo(-10, 0);
      c.lineTo(0, -34);
      c.lineTo(8, 0);
      c.closePath();
      c.fill();
      c.restore();

      c.fillStyle = "#F7D9BE";
      c.beginPath();
      c.moveTo(-8, -22);
      c.lineTo(-2, -36);
      c.lineTo(4, -22);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(8, -22);
      c.lineTo(14, -36);
      c.lineTo(20, -22);
      c.closePath();
      c.fill();

      c.fillStyle = "#7CB342";
      if (blink) {
        c.strokeStyle = "#4A3B1F";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-6, -8);
        c.lineTo(2, -8);
        c.moveTo(10, -8);
        c.lineTo(18, -8);
        c.stroke();
      } else {
        c.beginPath();
        c.arc(-2, -8, 7.2, 0, Math.PI * 2);
        c.arc(14, -8, 7.2, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#1B1B1B";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-2, -14);
        c.lineTo(-2, -2);
        c.moveTo(14, -14);
        c.lineTo(14, -2);
        c.stroke();
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(0, -10, 1.4, 0, Math.PI * 2);
        c.arc(16, -10, 1.4, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = "#FAFAFA";
      c.beginPath();
      c.ellipse(6, 2, 12, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#FFB6C1";
      c.beginPath();
      c.arc(6, 0, 3.2, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#8C5C5C";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(6, 4, 4.5, 0.15, Math.PI - 0.15);
      c.stroke();

      c.strokeStyle = "#FAFAFA";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-2, 4);
      c.lineTo(-18, 2);
      c.moveTo(-2, 6);
      c.lineTo(-19, 10);
      c.moveTo(14, 4);
      c.lineTo(30, 2);
      c.moveTo(14, 6);
      c.lineTo(31, 10);
      c.stroke();

      c.fillStyle = "#4A3B1F";
      c.beginPath();
      c.arc(0, 14, 4, 0, Math.PI * 2);
      c.arc(10, 22, 4, 0, Math.PI * 2);
      c.arc(-6, 24, 4, 0, Math.PI * 2);
      c.fill();

      if (pawBat > 0) {
        c.strokeStyle = "#9B7D3C";
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(10, 20);
        c.lineTo(24 + pawBat * 12, 8 - pawBat * 6);
        c.stroke();
      }

      c.restore();
    }
