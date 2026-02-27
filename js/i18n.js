/**
 * i18n.js — Internationalization module
 * Handles Arabic / English translations + RTL layout switching
 *
 * Written by: @dev  |  Last updated: 2024-11
 */

const TRANSLATIONS = {
  ar: {
    dir: "rtl",
    gameName: "المشنوق",
    tagline: "خمّن الكلمة قبل فوات الأوان",
    wins: "انتصارات",
    losses: "هزائم",
    points: "نقاط",
    attempts: "المحاولات",
    category: "الفئة",
    difficulty: "الصعوبة",
    hint: "تلميح",
    buyHint: "شراء تلميح",
    hintCost: "تكلفة: ٥٠ نقطة",
    notEnoughPoints: "نقاطك غير كافية!",
    hintAlreadyUsed: "استخدمت التلميح بالفعل",
    pressKey: "اضغط على حرف أو اكتبه",
    newGame: "لعبة جديدة",
    tryAgain: "حاول مجدداً",
    youWon: "أحسنت! 🎉",
    youLost: "خسرت هذه الجولة 💀",
    answerWas: "الكلمة كانت:",
    timeLeft: "الوقت المتبقي",
    achievements: "الإنجازات",
    settings: "الإعدادات",
    soundOn: "الصوت مفعّل",
    soundOff: "الصوت معطّل",
    theme: "السمة",
    language: "اللغة",
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
    streakMsg: "سلسلة انتصارات:",
    achievementUnlocked: "إنجاز جديد!",
    allCategories: "جميع الفئات",
    selectCategory: "اختر الفئة",
    timeBonus: "مكافأة السرعة",
    perfectGame: "لعبة مثالية!",
    wrongLetters: "حروف خاطئة",
    keyboardLabel: "لوحة الأحرف",
  },
  en: {
    dir: "ltr",
    gameName: "Hangman",
    tagline: "Guess the word before it's too late",
    wins: "Wins",
    losses: "Losses",
    points: "Points",
    attempts: "Attempts",
    category: "Category",
    difficulty: "Difficulty",
    hint: "Hint",
    buyHint: "Buy Hint",
    hintCost: "Cost: 50 pts",
    notEnoughPoints: "Not enough points!",
    hintAlreadyUsed: "Hint already used",
    pressKey: "Press a key or click a letter",
    newGame: "New Game",
    tryAgain: "Try Again",
    youWon: "You Won! 🎉",
    youLost: "You Lost 💀",
    answerWas: "The word was:",
    timeLeft: "Time Left",
    achievements: "Achievements",
    settings: "Settings",
    soundOn: "Sound On",
    soundOff: "Sound Off",
    theme: "Theme",
    language: "Language",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    streakMsg: "Win streak:",
    achievementUnlocked: "Achievement Unlocked!",
    allCategories: "All Categories",
    selectCategory: "Select Category",
    timeBonus: "Speed Bonus",
    perfectGame: "Perfect Game!",
    wrongLetters: "Wrong Letters",
    keyboardLabel: "Keyboard",
  }
};

class I18n {
  constructor() {
    this.lang = localStorage.getItem("hm_lang") || "ar";
  }

  t(key) {
    return TRANSLATIONS[this.lang][key] || key;
  }

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem("hm_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = TRANSLATIONS[lang].dir;
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  toggle() {
    this.setLang(this.lang === "ar" ? "en" : "ar");
  }

  isRTL() {
    return TRANSLATIONS[this.lang].dir === "rtl";
  }
}

// Export singleton
const i18n = new I18n();
