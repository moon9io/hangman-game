/*
 * ui.js — UI layer
 *
 * Responsible for all DOM reads/writes. Zero game logic here.
 * Listens to user events → calls GameEngine → re-renders.
 *
 * Toast notifications, achievement popups, settings panel,
 * gallows SVG animation, and keyboard rendering all live here.
 */

// ─── State ────────────────────────────────────────────────────────────────────
let currentTheme = localStorage.getItem("hm_theme") || "dark";
let currentDifficulty = localStorage.getItem("hm_diff") || "medium";
let sfxOn = localStorage.getItem("hm_sfx") !== "false";
let musicOn = localStorage.getItem("hm_music") === "true";
let toastQueue = [];
let toastBusy = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(currentTheme);
  setLang(getLang());
  buildKeyboard();
  bindControls();
  updateStatsBar();

  // Start timer tick listener
  GameEngine.onTick((timeLeft) => {
    renderTimer(timeLeft);
  });

  startNewGame();
});

// ─── Game flow ────────────────────────────────────────────────────────────────

async function startNewGame() {
  clearMessage();
  AudioEngine.resume();

  const snap = await GameEngine.newGame(getLang(), currentDifficulty);
  render(snap);
  updateStatsBar();
}

function handleGuess(letter) {
  const result = GameEngine.guess(letter);
  if (!result) return;

  AudioEngine.play(result.correct ? "correct" : "wrong");
  render(result);

  if (result.status === "won") {
    AudioEngine.play("win");
    showMessage("win");
    updateStatsBar();
    triggerAchievements(result);
  } else if (result.status === "lost") {
    AudioEngine.play("lose");
    showMessage("lose");
    updateStatsBar();
    revealWord(result.displayWord, result.guessed);
    triggerAchievements(result);
  }
}

function triggerAchievements(result) {
  // Check for newly unlocked achievements — they come back from recordResult
  const newOnes = Achievements.checkNewAchievements();
  newOnes.forEach((ach, i) => {
    setTimeout(() => {
      AudioEngine.play("achievement");
      showAchievementToast(ach);
    }, i * 1200);
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function render(snap) {
  renderWordDisplay(snap.displayWord, snap.guessed, snap.status === "lost");
  renderGallows(snap.wrongCount, snap.maxWrong);
  renderKeyboard(snap.guessed, snap.wrongLetters);
  renderWrongLetters(snap.wrongLetters);
  renderTimer(snap.timeLeft);
  renderHintArea(snap);
  renderCategory(snap.wordData);
}

function renderWordDisplay(word, guessed, reveal) {
  const container = document.getElementById("word-display");
  container.innerHTML = "";

  for (const ch of word) {
    if (ch === " ") {
      const spacer = document.createElement("div");
      spacer.className = "letter-space";
      container.appendChild(spacer);
      continue;
    }
    const box = document.createElement("div");
    const isShown = reveal || guessed.has(ch);
    box.className = "letter-box" + (isShown ? " revealed" : "");
    if (isShown) {
      box.textContent = ch.toUpperCase();
      if (!guessed.has(ch) && reveal) box.classList.add("missed");
    }
    container.appendChild(box);
  }
}

function revealWord(word, guessed) {
  // Called on loss to show unguessed letters highlighted
  renderWordDisplay(word, guessed, true);
}

function renderGallows(wrongCount, maxWrong) {
  // Map wrongCount proportionally to BODY_PART_IDS length
  const partsCount = GameEngine.BODY_PART_IDS.length;
  // Show parts proportionally to maxWrong
  const partsToShow = Math.round((wrongCount / maxWrong) * partsCount);

  GameEngine.BODY_PART_IDS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const shouldShow = i < partsToShow;
    if (shouldShow && el.style.opacity === "0" || el.style.opacity === "") {
      el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      el.style.opacity = shouldShow ? "1" : "0";
      el.style.transform = shouldShow ? "scale(1)" : "scale(0.5)";
    } else if (!shouldShow) {
      el.style.opacity = "0";
      el.style.transform = "scale(0.5)";
    }
  });
}

function renderKeyboard(guessed, wrongLetters) {
  document.querySelectorAll(".key[data-ch]").forEach((btn) => {
    const ch = btn.dataset.ch;
    btn.disabled = guessed.has(ch);
    btn.className = "key";
    if (guessed.has(ch)) {
      btn.classList.add(wrongLetters.includes(ch) ? "wrong" : "correct");
    }
  });
}

function renderWrongLetters(letters) {
  const el = document.getElementById("wrong-letters");
  if (!el) return;
  el.innerHTML = letters
    .map((l) => `<span class="wrong-badge">${l.toUpperCase()}</span>`)
    .join("");
}

function renderTimer(timeLeft) {
  const el = document.getElementById("timer-val");
  if (!el) return;
  el.textContent = Math.max(0, timeLeft);
  // Color shifts red as time runs low
  const pct = timeLeft / GameEngine.getSnapshot().timerSeconds;
  el.style.color = pct < 0.3 ? "var(--red)" : pct < 0.6 ? "var(--amber)" : "var(--accent)";
}

function renderHintArea(snap) {
  const btn = document.getElementById("hint-btn");
  const hintText = document.getElementById("hint-text");
  const costEl = document.getElementById("hint-cost");

  if (!btn) return;

  if (snap.hintRevealed) {
    btn.style.display = "none";
    hintText.textContent = "💡 " + snap.wordData.hint;
    hintText.style.opacity = "1";
  } else {
    btn.style.display = "inline-flex";
    if (costEl) costEl.textContent = snap.hintCost;
    hintText.style.opacity = "0.3";
    hintText.textContent = "💡 ???";
  }
}

function renderCategory(wordData) {
  const el = document.getElementById("cat-label");
  if (!el || !wordData) return;
  el.textContent = getLang() === "ar" ? wordData.category : wordData.category;
}

function renderTimer(timeLeft) {
  const el = document.getElementById("timer-val");
  if (!el) return;
  const snap = GameEngine.getSnapshot();
  const pct = snap.timerSeconds > 0 ? timeLeft / snap.timerSeconds : 1;
  el.textContent = Math.max(0, timeLeft);
  el.style.color =
    pct < 0.3 ? "var(--red)" : pct < 0.6 ? "var(--amber)" : "var(--accent)";

  // Animate the ring if present
  const ring = document.getElementById("timer-ring");
  if (ring) {
    const circumference = 2 * Math.PI * 28;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference * (1 - pct);
    ring.style.stroke =
      pct < 0.3 ? "var(--red)" : pct < 0.6 ? "var(--amber)" : "var(--accent)";
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function showMessage(type) {
  clearMessage();
  const el = document.getElementById(type === "win" ? "win-msg" : "lose-msg");
  if (!el) return;
  el.classList.add("visible");
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearMessage() {
  document.querySelectorAll(".end-message").forEach((el) =>
    el.classList.remove("visible")
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function updateStatsBar() {
  const s = Achievements.get();
  setText("stat-points", s.points);
  setText("stat-wins", s.wins);
  setText("stat-losses", s.losses);
  setText("stat-streak", s.streak);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────

function buildKeyboard() {
  const kb = document.getElementById("keyboard");
  if (!kb) return;
  kb.innerHTML = "";
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(97 + i);
    const btn = document.createElement("button");
    btn.className = "key";
    btn.dataset.ch = ch;
    btn.textContent = ch.toUpperCase();
    btn.addEventListener("click", () => {
      AudioEngine.resume();
      handleGuess(ch);
    });
    kb.appendChild(btn);
  }
}

// Physical keyboard support
document.addEventListener("keydown", (e) => {
  const ch = e.key.toLowerCase();
  if (/^[a-zA-Zأ-ي]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    AudioEngine.resume();
    handleGuess(ch);
  }
});

// ─── Controls (buttons, toggles) ─────────────────────────────────────────────

function bindControls() {
  // New game buttons
  document.querySelectorAll(".btn-new-game").forEach((btn) => {
    btn.addEventListener("click", () => {
      AudioEngine.play("click");
      startNewGame();
    });
  });

  // Hint button
  const hintBtn = document.getElementById("hint-btn");
  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      AudioEngine.resume();
      const success = GameEngine.buyHint();
      if (!success) {
        showToast(t("not_enough_points"), "error");
      } else {
        updateStatsBar();
        const snap = GameEngine.getSnapshot();
        renderHintArea(snap);
      }
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      AudioEngine.play("click");
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("hm_theme", currentTheme);
      applyTheme(currentTheme);
    });
  }

  // Language toggle
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", async () => {
      AudioEngine.play("click");
      const newLang = getLang() === "ar" ? "en" : "ar";
      setLang(newLang);
      await startNewGame();
    });
  }

  // Sound toggle
  const sfxBtn = document.getElementById("sfx-toggle");
  if (sfxBtn) {
    sfxBtn.addEventListener("click", () => {
      sfxOn = !sfxOn;
      localStorage.setItem("hm_sfx", sfxOn);
      AudioEngine.setSfx(sfxOn);
      sfxBtn.classList.toggle("off", !sfxOn);
      sfxBtn.textContent = sfxOn ? "🔊" : "🔇";
    });
  }

  // Music toggle
  const musicBtn = document.getElementById("music-toggle");
  if (musicBtn) {
    musicBtn.addEventListener("click", () => {
      AudioEngine.resume();
      musicOn = !musicOn;
      localStorage.setItem("hm_music", musicOn);
      AudioEngine.setMusic(musicOn);
      musicBtn.classList.toggle("off", !musicOn);
      musicBtn.textContent = musicOn ? "🎵" : "🎵";
      musicBtn.style.opacity = musicOn ? "1" : "0.4";
    });
  }

  // Difficulty buttons
  document.querySelectorAll("[data-diff]").forEach((btn) => {
    if (btn.dataset.diff === currentDifficulty) btn.classList.add("active");
    btn.addEventListener("click", () => {
      AudioEngine.play("click");
      currentDifficulty = btn.dataset.diff;
      localStorage.setItem("hm_diff", currentDifficulty);
      GameEngine.setDifficulty(currentDifficulty);
      document
        .querySelectorAll("[data-diff]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      startNewGame();
    });
  });

  // Achievements modal
  const achBtn = document.getElementById("achievements-btn");
  const achModal = document.getElementById("achievements-modal");
  const achClose = document.getElementById("ach-close");

  if (achBtn && achModal) {
    achBtn.addEventListener("click", () => {
      AudioEngine.play("click");
      renderAchievementsModal();
      achModal.classList.add("open");
    });
    achClose.addEventListener("click", () => achModal.classList.remove("open"));
    achModal.addEventListener("click", (e) => {
      if (e.target === achModal) achModal.classList.remove("open");
    });
  }
}

// ─── Achievements modal ───────────────────────────────────────────────────────

function renderAchievementsModal() {
  const grid = document.getElementById("ach-grid");
  if (!grid) return;
  const all = Achievements.getAll();
  const lang = getLang();
  grid.innerHTML = all
    .map(
      (a) => `
    <div class="ach-card ${a.unlocked ? "unlocked" : "locked"}">
      <div class="ach-icon">${a.unlocked ? a.icon : "🔒"}</div>
      <div class="ach-name">${lang === "ar" ? a.ar : a.en}</div>
      <div class="ach-desc">${lang === "ar" ? a.desc_ar : a.desc_en}</div>
    </div>
  `
    )
    .join("");
}

// ─── Toast notifications ──────────────────────────────────────────────────────

function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

function showAchievementToast(ach) {
  const lang = getLang();
  showToast(
    `${ach.icon} ${t("achievement_unlocked")} — ${lang === "ar" ? ach.ar : ach.en}`,
    "achievement"
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
