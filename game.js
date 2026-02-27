/**
 * game.js — Core game logic
 *
 * Manages game state machine:
 *   idle → playing → (win | lose) → idle
 *
 * Deliberately separated from rendering (ui.js).
 * This makes it easy to test and extend without touching the DOM.
 */

const MAX_WRONG = 6;
const TIMER_SECONDS = 90;

class HangmanGame {
  constructor() {
    this.state = "idle"; // idle | playing | win | lose
    this.word = "";
    this.wordData = null;
    this.guessed = new Set();
    this.wrongCount = 0;
    this.hintUsed = false;
    this.timerInterval = null;
    this.timeLeft = TIMER_SECONDS;
    this.startTime = null;
    this.callbacks = {};
  }

  on(event, fn) {
    this.callbacks[event] = fn;
    return this;
  }

  emit(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data);
  }

  start(wordData) {
    clearInterval(this.timerInterval);

    this.word = wordData.word.toLowerCase();
    this.wordData = wordData;
    this.guessed = new Set();
    this.wrongCount = 0;
    this.hintUsed = false;
    this.timeLeft = TIMER_SECONDS;
    this.startTime = Date.now();
    this.state = "playing";

    this.emit("start", { wordData });
    this._startTimer();
  }

  _startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.emit("tick", { timeLeft: this.timeLeft });

      // Urgent ticking sound when low on time
      if (this.timeLeft <= 10 && this.timeLeft > 0) {
        Sound.play("tick");
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this._handleLose();
      }
    }, 1000);
  }

  guess(letter) {
    if (this.state !== "playing") return;
    letter = letter.toLowerCase();

    // Skip already guessed
    if (this.guessed.has(letter)) return;
    this.guessed.add(letter);

    if (this.getWordChars().includes(letter)) {
      Sound.play("correct");
      achievements.recordCorrectGuess();
      this.emit("correct", { letter });

      if (this.isWordComplete()) {
        this._handleWin();
      }
    } else {
      this.wrongCount++;
      Sound.play("wrong");
      this.emit("wrong", { letter, wrongCount: this.wrongCount });

      if (this.wrongCount >= MAX_WRONG) {
        this._handleLose();
      }
    }
  }

  useHint() {
    if (this.state !== "playing") return false;
    if (this.hintUsed) {
      this.emit("hintFailed", { reason: "used" });
      return false;
    }
    if (!achievements.spendPoints(50)) {
      this.emit("hintFailed", { reason: "points" });
      return false;
    }
    this.hintUsed = true;
    achievements.recordHintBuy();
    Sound.play("hint");
    this.emit("hintRevealed", { hint: this.wordData.hint });
    return true;
  }

  _handleWin() {
    clearInterval(this.timerInterval);
    this.state = "win";

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const timeBonus = Math.max(0, Math.floor((TIMER_SECONDS - elapsed) * 0.5));
    const perfect = this.wrongCount === 0;

    const pts = achievements.recordWin({
      perfect,
      timeBonus,
      difficulty: this.wordData.difficulty,
      lang: i18n.lang
    });

    // Check achievements
    const newAch = achievements.check();
    newAch.forEach(ach => {
      Sound.play("achievement");
      this.emit("achievementUnlocked", { ach });
    });

    Sound.play("win");
    this.emit("win", { pts, timeBonus, perfect, streak: achievements.streak });
  }

  _handleLose() {
    clearInterval(this.timerInterval);
    this.state = "lose";
    achievements.recordLoss();
    achievements.check();
    Sound.play("lose");
    this.emit("lose", { word: this.word });
  }

  // ── Helpers ────────────────────────────────────────────────────────

  getWordChars() {
    // For Arabic, return individual characters; for English, letters
    return [...new Set(this.word.split("").filter(c => c !== " "))];
  }

  isWordComplete() {
    return this.getWordChars().every(c => this.guessed.has(c));
  }

  getDisplayWord() {
    return this.word.split("").map(c => {
      if (c === " ") return " ";
      return this.guessed.has(c) ? c : "_";
    });
  }

  getWrongLetters() {
    return [...this.guessed].filter(c => !this.word.includes(c));
  }

  getCorrectLetters() {
    return [...this.guessed].filter(c => this.word.includes(c));
  }
}

const game = new HangmanGame();
