/**
 * achievements.js — Points system & achievement tracker
 *
 * Points economy:
 *   Correct guess  → +10 pts
 *   Win game       → +50 pts base + time bonus + difficulty multiplier
 *   Lose game      → +0 pts
 *   Buy hint       → -50 pts
 *   Perfect win    → +100 pts bonus
 *
 * Achievements are stored in localStorage.
 */

const ACHIEVEMENTS_DEF = [
  { id: "first_win",    icon: "🏅", nameAr: "أول انتصار",       nameEn: "First Win",       descAr: "فاز للمرة الأولى",             descEn: "Won your first game",          condition: (s) => s.wins >= 1 },
  { id: "streak3",      icon: "🔥", nameAr: "ثلاثة على التوالي", nameEn: "Hat Trick",        descAr: "ثلاث انتصارات متتالية",        descEn: "3 wins in a row",              condition: (s) => s.streak >= 3 },
  { id: "streak7",      icon: "⚡", nameAr: "أسطورة",            nameEn: "Legend",           descAr: "سبع انتصارات متتالية",         descEn: "7 wins in a row",              condition: (s) => s.streak >= 7 },
  { id: "perfect",      icon: "💎", nameAr: "لعبة مثالية",       nameEn: "Flawless",         descAr: "فاز بدون أي خطأ",             descEn: "Won without any mistake",      condition: (s) => s.lastPerfect },
  { id: "points500",    icon: "💰", nameAr: "خمسمائة",           nameEn: "Five Hundred",     descAr: "جمع ٥٠٠ نقطة",               descEn: "Accumulated 500 points",       condition: (s) => s.points >= 500 },
  { id: "points2000",   icon: "👑", nameAr: "ملك النقاط",        nameEn: "Point King",       descAr: "جمع ٢٠٠٠ نقطة",             descEn: "Accumulated 2000 points",      condition: (s) => s.points >= 2000 },
  { id: "speedster",    icon: "⏱️", nameAr: "خاطف البرق",       nameEn: "Speedster",        descAr: "فاز في أقل من ١٥ ثانية",    descEn: "Won in under 15 seconds",      condition: (s) => s.lastTimeBonus >= 85 },
  { id: "hard_win",     icon: "🧠", nameAr: "عقل نادر",          nameEn: "Big Brain",        descAr: "فاز بكلمة صعبة",             descEn: "Won a hard difficulty word",   condition: (s) => s.hardWins >= 1 },
  { id: "bilingue",     icon: "🌍", nameAr: "ثنائي اللغة",       nameEn: "Bilingual",        descAr: "لعب بكلا اللغتين",           descEn: "Played in both languages",     condition: (s) => s.playedAr && s.playedEn },
  { id: "collector",    icon: "🎒", nameAr: "جامع التلميحات",    nameEn: "Hint Collector",   descAr: "اشترى ٥ تلميحات",           descEn: "Bought 5 hints",               condition: (s) => s.hintsBought >= 5 },
];

class AchievementSystem {
  constructor() {
    this.stats = this._load();
    this.unlocked = new Set(this.stats.unlocked || []);
    this.pendingToast = [];
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem("hm_stats") || "{}");
    } catch { return {}; }
  }

  _save() {
    this.stats.unlocked = [...this.unlocked];
    localStorage.setItem("hm_stats", JSON.stringify(this.stats));
  }

  // Called after every game event
  check() {
    const newlyUnlocked = [];
    for (const def of ACHIEVEMENTS_DEF) {
      if (!this.unlocked.has(def.id) && def.condition(this.stats)) {
        this.unlocked.add(def.id);
        newlyUnlocked.push(def);
      }
    }
    this._save();
    return newlyUnlocked;
  }

  addPoints(n) {
    this.stats.points = (this.stats.points || 0) + n;
    this._save();
    return this.stats.points;
  }

  spendPoints(n) {
    if ((this.stats.points || 0) < n) return false;
    this.stats.points -= n;
    this._save();
    return true;
  }

  recordWin({ perfect, timeBonus, difficulty, lang }) {
    this.stats.wins = (this.stats.wins || 0) + 1;
    this.stats.streak = (this.stats.streak || 0) + 1;
    this.stats.lastPerfect = perfect;
    this.stats.lastTimeBonus = timeBonus;
    if (difficulty === "hard") this.stats.hardWins = (this.stats.hardWins || 0) + 1;
    if (lang === "ar") this.stats.playedAr = true;
    if (lang === "en") this.stats.playedEn = true;

    let pts = 50;
    if (perfect) pts += 100;
    if (timeBonus > 0) pts += timeBonus;
    if (difficulty === "hard") pts = Math.floor(pts * 1.5);
    if (difficulty === "medium") pts = Math.floor(pts * 1.2);

    this.addPoints(pts);
    return pts;
  }

  recordLoss() {
    this.stats.losses = (this.stats.losses || 0) + 1;
    this.stats.streak = 0;
    this.stats.lastPerfect = false;
    this._save();
  }

  recordCorrectGuess() {
    this.addPoints(10);
  }

  recordHintBuy() {
    this.stats.hintsBought = (this.stats.hintsBought || 0) + 1;
    this._save();
  }

  get points() { return this.stats.points || 0; }
  get wins()   { return this.stats.wins || 0; }
  get losses() { return this.stats.losses || 0; }
  get streak() { return this.stats.streak || 0; }

  getAllWithStatus() {
    return ACHIEVEMENTS_DEF.map(def => ({
      ...def,
      unlocked: this.unlocked.has(def.id)
    }));
  }
}

const achievements = new AchievementSystem();
