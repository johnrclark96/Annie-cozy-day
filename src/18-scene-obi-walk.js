    /* ═══════════════════════════════════════════════════════
       Obi's Walk — side-scrolling walk through the neighborhood
       ═══════════════════════════════════════════════════════ */
    class ObiWalkScene extends BaseMinigameScene {
      constructor() {
        super("walk", "Obi's Walk", isMobile ? "Tap items along the path to let Obi sniff them! Tap squirrels before Obi chases them!" : "Click items along the path to let Obi sniff them! Click squirrels before Obi chases them!", [150, 300, 600], 45);
        this.scrollX = 0;
        this.obiY = 440;
        this.obiPose = "run";
        this.obiSniffTimer = 0;
        this.items = [];
        this.squirrels = [];
        this.collected = [];
        this.nextItemX = 500;
        this.missFlash = 0;
      }
      enter() {
        super.enter();
        this.scrollX = 0;
        this.obiPose = "run";
        this.obiSniffTimer = 0;
        this.items = [];
        this.squirrels = [];
        this.collected = [];
        this.nextItemX = 500;
        this.missFlash = 0;
        this.fillItems();
      }
      fillItems() {
        while (this.items.length < 4) {
          const types = ["hydrant", "bush", "mailbox", "flower", "bone"];
          const type = types[Math.floor(Math.random() * types.length)];
          const points = type === "bone" ? 30 : type === "flower" ? 20 : 15;
          this.items.push({ type, x: this.nextItemX, points, found: false, fade: 0 });
          this.nextItemX += rand(180, 280);
        }
        /* occasional squirrel */
        if (this.squirrels.length < 1 && Math.random() < 0.3) {
          this.squirrels.push({ x: this.nextItemX + rand(60, 140), y: rand(360, 420), caught: false, missed: false, timer: 2.5, fade: 1 });
        }
      }
      extraInteractiveAt() { return true; }
      onGameClick(x, y) {
        /* check squirrels first - generous hitbox */
        for (const sq of this.squirrels) {
          if (!sq.caught && !sq.missed && Math.abs(x - (sq.x - this.scrollX)) < 52 && Math.abs(y - sq.y) < 52) {
            sq.caught = true;
            this.addScore(25 * this.combo);
            this.combo++;
            audio.targetHit();
            spawnParticleBurst(x, y - 10, [COLORS.gold, "#FFF4C0"], 8, ["star"]);
            return;
          }
        }
        /* check items - generous hitbox for mobile */
        for (const it of this.items) {
          const ix = it.x - this.scrollX;
          if (!it.found && Math.abs(x - ix) < 56 && y > 340 && y < 490) {
            it.found = true;
            this.obiSniffTimer = 0.7;
            this.obiPose = "sniff";
            this.addScore(it.points * this.combo);
            this.combo++;
            audio.catch();
            this.collected.push({ x: ix, y: this.obiY - 40, text: "+" + (it.points * (this.combo - 1)), life: 1.2 });
            spawnParticleBurst(ix, this.obiY - 30, [COLORS.softPink, COLORS.gold], 6, ["heart", "star"]);
            return;
          }
        }
      }
      updatePlay(dt) {
        /* slow scroll while sniffing for better feel */
        const baseSpeed = 120 + (this.duration - this.timeLeft) * 1.5;
        const speed = this.obiSniffTimer > 0 ? baseSpeed * 0.25 : baseSpeed;
        this.scrollX += speed * dt;
        this.missFlash = Math.max(0, this.missFlash - dt * 3);

        /* obi sniff timer */
        if (this.obiSniffTimer > 0) {
          this.obiSniffTimer -= dt;
          if (this.obiSniffTimer <= 0) this.obiPose = "run";
        }

        /* remove off-screen items */
        this.items = this.items.filter(it => it.x - this.scrollX > -100);
        this.fillItems();

        /* update squirrels */
        for (let i = this.squirrels.length - 1; i >= 0; i--) {
          const sq = this.squirrels[i];
          if (sq.caught) {
            sq.fade -= dt * 3;
            if (sq.fade <= 0) this.squirrels.splice(i, 1);
          } else if (sq.missed) {
            /* squirrel runs away */
            sq.x -= 200 * dt;
            sq.y -= 80 * dt;
            sq.fade -= dt * 1.5;
            if (sq.fade <= 0) this.squirrels.splice(i, 1);
          } else if (sq.x - this.scrollX < -60) {
            this.squirrels.splice(i, 1);
          } else if (!sq.missed && sq.x - this.scrollX < 200) {
            sq.timer -= dt;
            if (sq.timer <= 0) {
              sq.missed = true;
              this.combo = 1;
              this.missFlash = 1;
              audio.miss();
            }
          }
        }

        /* floating score text */
        for (let i = this.collected.length - 1; i >= 0; i--) {
          this.collected[i].life -= dt;
          this.collected[i].y -= 30 * dt;
          if (this.collected[i].life <= 0) this.collected.splice(i, 1);
        }

        if (this.score >= 300) this.queueAchievement("goodWalker");
      }
      drawInstructionIcon(c, x, y) {
        drawBone(c, x, y, 26, 12, "#7A4E36");
      }
      drawScene(c) {
        /* sky */
        const skyG = c.createLinearGradient(0, 0, 0, 280);
        skyG.addColorStop(0, "#87CEEB");
        skyG.addColorStop(1, "#C8E8F8");
        c.fillStyle = skyG;
        c.fillRect(0, 0, W, 280);

        /* sun */
        c.fillStyle = "rgba(255,245,200,0.5)";
        c.beginPath(); c.arc(680, 60, 40, 0, Math.PI * 2); c.fill();

        /* clouds */
        c.fillStyle = "rgba(255,255,255,0.7)";
        for (let i = 0; i < 4; i++) {
          const cx = ((i * 260 + 100 - this.scrollX * 0.15) % (W + 200)) - 100;
          c.beginPath();
          c.ellipse(cx, 70 + i * 30, 50 + i * 10, 20, 0, 0, Math.PI * 2);
          c.ellipse(cx + 30, 65 + i * 30, 35, 16, 0, 0, Math.PI * 2);
          c.fill();
        }

        /* distant houses */
        const houseColors = ["#E8D4BC", "#D4BC9C", "#F0DCC8", "#DCCAB4", "#E0C8B0"];
        const roofColors = ["#C0392B", "#8E44AD", "#2980B9", "#27AE60", "#D35400"];
        for (let i = 0; i < 8; i++) {
          const hx = ((i * 140 + 40 - this.scrollX * 0.35) % (W + 300)) - 150;
          const hw = 80 + (i % 3) * 20;
          const hh = 70 + (i % 4) * 15;
          c.fillStyle = houseColors[i % houseColors.length];
          c.fillRect(hx, 260 - hh, hw, hh);
          c.fillStyle = roofColors[i % roofColors.length];
          c.beginPath();
          c.moveTo(hx - 8, 260 - hh);
          c.lineTo(hx + hw / 2, 260 - hh - 30);
          c.lineTo(hx + hw + 8, 260 - hh);
          c.closePath();
          c.fill();
          /* windows */
          c.fillStyle = "rgba(180,220,255,0.6)";
          c.fillRect(hx + 12, 260 - hh + 18, 14, 14);
          c.fillRect(hx + hw - 26, 260 - hh + 18, 14, 14);
          /* door */
          c.fillStyle = "#8B6B4A";
          rr(c, hx + hw / 2 - 8, 260 - 36, 16, 36, 3);
          c.fill();
        }

        /* trees */
        for (let i = 0; i < 6; i++) {
          const tx = ((i * 190 + 80 - this.scrollX * 0.45) % (W + 300)) - 100;
          c.fillStyle = "#8B6B4A";
          c.fillRect(tx + 10, 240, 10, 40);
          c.fillStyle = "#5B8C3E";
          c.beginPath(); c.arc(tx + 15, 230, 28 + (i % 3) * 6, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#6EA84A";
          c.beginPath(); c.arc(tx + 10, 222, 20 + (i % 2) * 5, 0, Math.PI * 2); c.fill();
        }

        /* ground */
        c.fillStyle = "#78B84A";
        c.fillRect(0, 260, W, 40);
        /* sidewalk */
        c.fillStyle = "#D8D0C4";
        c.fillRect(0, 300, W, 160);
        /* sidewalk lines */
        c.strokeStyle = "rgba(180,170,155,0.3)";
        c.lineWidth = 2;
        for (let i = 0; i < 14; i++) {
          const lx = ((i * 70 - this.scrollX * 0.98) % (W + 70));
          c.beginPath(); c.moveTo(lx, 300); c.lineTo(lx, 460); c.stroke();
        }
        /* curb */
        c.fillStyle = "#C0B8A8";
        c.fillRect(0, 296, W, 6);

        /* draw items on sidewalk */
        for (const it of this.items) {
          const ix = it.x - this.scrollX;
          if (ix < -60 || ix > W + 60) continue;
          c.save();
          c.translate(ix, 420);
          if (it.found) {
            c.globalAlpha = 0.3;
            /* sparkle marker where item was */
            drawStar(c, 0, -10, 8, COLORS.gold);
          } else {
            /* draw item based on type */
            if (it.type === "hydrant") {
              c.fillStyle = "#D44040";
              rr(c, -10, -40, 20, 40, 4); c.fill();
              c.fillStyle = "#B83030";
              c.fillRect(-14, -32, 28, 6);
              c.fillRect(-6, -44, 12, 8);
            } else if (it.type === "bush") {
              c.fillStyle = "#4A8C30";
              c.beginPath(); c.ellipse(0, -18, 28, 22, 0, 0, Math.PI * 2); c.fill();
              c.fillStyle = "#5AA040";
              c.beginPath(); c.ellipse(-8, -24, 18, 16, 0, 0, Math.PI * 2); c.fill();
            } else if (it.type === "mailbox") {
              c.fillStyle = "#4A78B8";
              c.fillRect(-4, -40, 8, 40);
              rr(c, -16, -56, 32, 22, 6); c.fill();
              c.fillStyle = "#3A68A0";
              c.fillRect(-12, -42, 24, 4);
            } else if (it.type === "flower") {
              c.fillStyle = "#5A8A38";
              c.fillRect(-2, -24, 4, 24);
              c.fillStyle = "#FF8FAA";
              for (let p = 0; p < 5; p++) {
                const a = p * Math.PI * 2 / 5;
                c.beginPath(); c.arc(Math.cos(a) * 8, -30 + Math.sin(a) * 8, 5, 0, Math.PI * 2); c.fill();
              }
              c.fillStyle = "#FFD700";
              c.beginPath(); c.arc(0, -30, 4, 0, Math.PI * 2); c.fill();
            } else if (it.type === "bone") {
              drawGlowCircle(c, 0, -16, 20, "rgba(255,215,0,ALPHA)", 0.2);
              drawBone(c, 0, -16, 22, 10, "#FFD700");
            }
            /* sniff indicator - pulsing ? */
            if (ix > 60 && ix < 340) {
              const pulse = 0.7 + Math.sin(game.time * 5) * 0.3;
              c.globalAlpha = pulse;
              c.fillStyle = "#FFF8F0";
              c.strokeStyle = "#8A6045";
              c.lineWidth = 2;
              c.font = '20px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
              c.textAlign = "center";
              c.strokeText("?", 0, -56);
              c.fillText("?", 0, -56);
            }
          }
          c.restore();
        }

        /* draw squirrels */
        for (const sq of this.squirrels) {
          const sx = sq.x - this.scrollX;
          if (sx < -60 || sx > W + 60) continue;
          c.save();
          c.globalAlpha = sq.fade;
          c.translate(sx, sq.y);
          if (sq.caught) {
            c.globalAlpha = sq.fade * 0.5;
            drawStar(c, 0, -10, 10, COLORS.gold);
          } else {
            /* draw squirrel */
            c.fillStyle = "#A0704C";
            c.beginPath(); c.ellipse(0, -8, 14, 10, 0, 0, Math.PI * 2); c.fill(); /* body */
            c.fillStyle = "#8C604A";
            c.beginPath(); c.arc(-12, -14, 7, 0, Math.PI * 2); c.fill(); /* head */
            c.fillStyle = "#000";
            c.beginPath(); c.arc(-14, -16, 2, 0, Math.PI * 2); c.fill(); /* eye */
            /* bushy tail */
            c.fillStyle = "#B08060";
            c.beginPath();
            c.moveTo(10, -12);
            c.quadraticCurveTo(22, -32, 12, -36);
            c.quadraticCurveTo(4, -28, 8, -10);
            c.fill();
            /* warning indicator */
            if (!sq.caught && !sq.missed && sq.timer < 1.5) {
              const urgency = 1 - sq.timer / 1.5;
              c.fillStyle = `rgba(220,60,40,${0.5 + urgency * 0.5})`;
              c.font = '18px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
              c.textAlign = "center";
              c.fillText("!", 0, -36);
            }
          }
          c.restore();
        }

        /* warm glow behind Annie and Obi */
        drawGlowCircle(c, 210, 400, 140, "rgba(255,240,200,ALPHA)", 0.08);

        /* Annie upper body holding leash */
        drawAnnie(c, 160, 340, 0.9, {
          pose: "upper",
          breath: Math.sin(game.time * 2.5),
          blink: blinkSignal(game.time, 0.5),
          hairSway: Math.sin(game.time * 1.8),
          armRaise: 0.3
        });

        /* leash line */
        c.strokeStyle = "#8B6B4A";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(190, 320);
        c.quadraticCurveTo(220, 380 + Math.sin(game.time * 3) * 4, 248, this.obiY - 30);
        c.stroke();

        /* Obi */
        drawObi(c, 260, this.obiY, 1.0, {
          pose: this.obiPose,
          expression: this.obiSniffTimer > 0 ? "excited" : "happy",
          tail: Math.sin(game.time * (this.obiPose === "run" ? 12 : 4)) * 0.9,
          bounce: this.obiPose === "run" ? 0.06 * Math.sin(game.time * 14) : 0,
          facing: 1
        });

        /* floating score text */
        for (const ft of this.collected) {
          c.save();
          c.globalAlpha = clamp(ft.life, 0, 1);
          c.fillStyle = COLORS.gold;
          c.strokeStyle = "#5C3D2E";
          c.lineWidth = 3;
          c.font = '20px "Fredoka One", "Comic Sans MS", cursive, sans-serif';
          c.textAlign = "center";
          c.strokeText(ft.text, ft.x, ft.y);
          c.fillText(ft.text, ft.x, ft.y);
          c.restore();
        }

        /* miss flash */
        if (this.missFlash > 0) {
          c.fillStyle = `rgba(200,40,20,${this.missFlash * 0.12})`;
          c.fillRect(0, 0, W, H);
        }
      }
      drawResultCharacter(c) {
        drawAnnie(c, 340, 410, 1.1, { pose: "cheer", breath: Math.sin(game.time * 2), blink: blinkSignal(game.time, 0.5), hairSway: Math.sin(game.time * 1.2) });
        drawObi(c, 460, 420, 1.2, { pose: "sit", expression: "excited", tail: Math.sin(game.time * 10), bounce: 0.06 * Math.sin(game.time * 8) });
      }
    }

    SceneRegistry.register("walk", () => new ObiWalkScene());
