/*
 * audio.js — Sound & Music engine
 *
 * Uses Web Audio API only — no external files needed.
 * All sounds are synthesized procedurally so there's nothing to download.
 *
 * Architecture:
 *   AudioEngine.play(soundName)  → one-shot SFX
 *   AudioEngine.music.start()    → looping ambient track
 *   AudioEngine.music.stop()
 */

const AudioEngine = (() => {
  let ctx = null;
  let musicNode = null;
  let musicGain = null;
  let sfxEnabled = true;
  let musicEnabled = false; // off by default, user opt-in

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  // --- Low-level helpers ---

  function playTone(freq, type, duration, gainVal, startTime, destination) {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(destination || ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  function playNoise(duration, gainVal, startTime) {
    const ac = getCtx();
    const bufSize = ac.sampleRate * duration;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    src.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    src.start(startTime);
  }

  // --- Sound definitions ---

  const sounds = {
    correct() {
      if (!sfxEnabled) return;
      const ac = getCtx();
      const now = ac.currentTime;
      playTone(440, "sine", 0.1, 0.3, now);
      playTone(554, "sine", 0.1, 0.3, now + 0.08);
      playTone(659, "sine", 0.2, 0.3, now + 0.16);
    },

    wrong() {
      if (!sfxEnabled) return;
      const ac = getCtx();
      const now = ac.currentTime;
      playTone(220, "sawtooth", 0.15, 0.2, now);
      playTone(196, "sawtooth", 0.2, 0.2, now + 0.1);
    },

    win() {
      if (!sfxEnabled) return;
      const ac = getCtx();
      const now = ac.currentTime;
      const melody = [523, 659, 784, 1047];
      melody.forEach((f, i) => playTone(f, "sine", 0.25, 0.3, now + i * 0.15));
    },

    lose() {
      if (!sfxEnabled) return;
      const ac = getCtx();
      const now = ac.currentTime;
      [330, 277, 220].forEach((f, i) =>
        playTone(f, "sawtooth", 0.3, 0.25, now + i * 0.2)
      );
      playNoise(0.4, 0.08, now + 0.6);
    },

    click() {
      if (!sfxEnabled) return;
      const ac = getCtx();
      playTone(800, "square", 0.04, 0.08, ac.currentTime);
    },

    hint() {
      if (!sfxEnabled) return;
      const ac = getCtx();
      const now = ac.currentTime;
      playTone(880, "sine", 0.06, 0.15, now);
      playTone(1100, "sine", 0.12, 0.15, now + 0.06);
    },

    achievement() {
      if (!sfxEnabled) return;
      const ac = getCtx();
      const now = ac.currentTime;
      [523, 659, 784, 880, 1047].forEach((f, i) =>
        playTone(f, "sine", 0.18, 0.28, now + i * 0.1)
      );
    },
  };

  // --- Ambient music (simple looping arpeggio) ---

  function startMusic() {
    if (!musicEnabled) return;
    const ac = getCtx();
    musicGain = ac.createGain();
    musicGain.gain.value = 0.06;
    musicGain.connect(ac.destination);

    // Simple pentatonic arpeggio in C
    const notes = [261, 311, 392, 466, 523, 622, 784];
    let step = 0;

    function tick() {
      if (!musicEnabled) return;
      const now = ac.currentTime;
      const freq = notes[step % notes.length];
      playTone(freq, "triangle", 0.4, 0.3, now, musicGain);
      step++;
      musicNode = setTimeout(tick, 480 + Math.random() * 120);
    }
    tick();
  }

  function stopMusic() {
    clearTimeout(musicNode);
    if (musicGain) {
      musicGain.gain.exponentialRampToValueAtTime(
        0.0001,
        getCtx().currentTime + 0.5
      );
    }
  }

  return {
    play(name) {
      try {
        if (sounds[name]) sounds[name]();
      } catch (e) {
        // AudioContext may be suspended on first interaction
      }
    },
    setSfx(enabled) {
      sfxEnabled = enabled;
    },
    setMusic(enabled) {
      musicEnabled = enabled;
      if (enabled) startMusic();
      else stopMusic();
    },
    resume() {
      // Must be called on user gesture
      if (ctx && ctx.state === "suspended") ctx.resume();
    },
  };
})();
