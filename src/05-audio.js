    class CozyAudio {
      constructor() {
        this.ctx = null;
      }
      ensure() {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
        return this.ctx;
      }
      canPlay() {
        return !!this.ctx && !store.muted;
      }
      envGain(gainNode, when, attack, sustain, release, gain) {
        gainNode.gain.cancelScheduledValues(when);
        gainNode.gain.setValueAtTime(0.0001, when);
        gainNode.gain.exponentialRampToValueAtTime(gain, when + attack);
        gainNode.gain.setTargetAtTime(0.0001, when + attack + sustain, release);
      }
      tone(freq, duration = 0.1, gain = 0.18, type = "sine", endFreq = null, whenOffset = 0) {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime + whenOffset;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
        osc.connect(g);
        g.connect(this.ctx.destination);
        this.envGain(g, now, 0.008, duration * 0.55, duration * 0.35, gain);
        osc.start(now);
        osc.stop(now + duration + 0.2);
      }
      vibratoTone(freq, duration = 0.15, gain = 0.15) {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        lfo.frequency.value = 18;
        lfoGain.gain.value = 16;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(g);
        g.connect(this.ctx.destination);
        this.envGain(g, now, 0.01, duration * 0.6, duration * 0.4, gain);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + duration + 0.25);
        lfo.stop(now + duration + 0.25);
      }
      noisePop() {
        if (!this.canPlay()) return;
        const now = this.ctx.currentTime;
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / data.length * 4);
        const src = this.ctx.createBufferSource();
        const band = this.ctx.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 800;
        band.Q.value = 0.8;
        const g = this.ctx.createGain();
        src.buffer = buffer;
        src.connect(band);
        band.connect(g);
        g.connect(this.ctx.destination);
        this.envGain(g, now, 0.005, 0.03, 0.08, 0.16);
        src.start(now);
      }
      chord(freqs, duration = 0.3, gain = 0.12) {
        if (!this.canPlay()) return;
        freqs.forEach((f) => this.tone(f, duration, gain, "sine"));
      }
      menu() { this.tone(440, 0.1, 0.15, "sine"); }
      catch() { this.noisePop(); }
      miss() { this.tone(300, 0.2, 0.14, "sine", 200); }
      combo() {
        [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.08, 0.12, "sine", null, i * 0.08));
      }
      pounce() { this.tone(300, 0.1, 0.14, "sine", 600); }
      targetHit() { this.vibratoTone(880, 0.15, 0.14); }
      fidget() { this.tone(200, 0.1, 0.12, "sine"); }
      lullaby() {
        [392, 329.63, 261.63, 196].forEach((f, i) => this.tone(f, 0.42, 0.12, "sine", null, i * 0.4));
      }
      achievement() { this.chord([261.63, 329.63, 392], 0.3, 0.11); }
      tinyChime() { this.tone(660, 0.09, 0.08, "sine"); }
      startAmbient() {
        if (this.ambientActive) return;
        if (!this.ensure()) return;
        if (store.muted) return;
        this.ambientActive = true;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const g = this.ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.value = 110;
        osc2.type = "sine";
        osc2.frequency.value = 165;
        lfo.type = "sine";
        lfo.frequency.value = 0.15;
        lfoGain.gain.value = 0.005;
        lfo.connect(lfoGain);
        lfoGain.connect(g.gain);
        g.gain.value = 0.018;
        osc1.connect(g);
        osc2.connect(g);
        g.connect(this.ctx.destination);
        osc1.start(now);
        osc2.start(now);
        lfo.start(now);
        this._ambientNodes = { osc1, osc2, lfo, lfoGain, g };
      }
      stopAmbient() {
        if (!this.ambientActive) return;
        this.ambientActive = false;
        const n = this._ambientNodes;
        if (!n) return;
        this._ambientNodes = null;
        try {
          const now = this.ctx.currentTime;
          n.g.gain.setTargetAtTime(0, now, 0.1);
          const osc1 = n.osc1, osc2 = n.osc2, lfo = n.lfo;
          setTimeout(() => {
            try { osc1.stop(); osc2.stop(); lfo.stop(); } catch(e) {}
          }, 300);
        } catch(e) {}
      }
    }
    const audio = new CozyAudio();

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ("ontouchstart" in window);
