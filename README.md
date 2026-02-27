# 🎯 Hangman Game — المشنوق

A clean, feature-rich browser-based Hangman game built with **vanilla HTML, CSS & JavaScript** — no frameworks, no build tools, just open `index.html` and play.

![screenshot placeholder](https://placehold.co/860x460/0c0c12/d4a843?text=Hangman+Game)

## ✨ Features

- **Bilingual** — full Arabic 🇸🇦 and English 🇬🇧 support with RTL/LTR layout switching
- **Dark & Light themes** — toggle instantly, preference saved
- **Achievement system** — 10 unlockable achievements tracked across sessions
- **Points economy** — earn points for correct guesses, spend them on hints
- **Countdown timer** — three difficulty levels change time limits
- **Procedural audio** — sound effects and ambient music via Web Audio API (no files needed)
- **Difficulty levels** — Easy / Medium / Hard each tune max mistakes and timer
- **Persistent save** — points, wins, streaks and achievements stored in `localStorage`
- **Keyboard support** — play entirely from physical keyboard

## 📁 Project Structure

```
hangman-game/
├── index.html          # Entry point — all markup lives here
├── css/
│   └── style.css       # All styles: themes, layout, animations
├── js/
│   ├── i18n.js         # Translation strings + language switching
│   ├── audio.js        # Web Audio API sound engine
│   ├── achievements.js # Points, saves, achievement definitions
│   ├── game.js         # Core game logic (no DOM touches)
│   └── ui.js           # DOM rendering + event handling
└── data/
    ├── words-ar.json   # Arabic word list with hints
    └── words-en.json   # English word list with hints
```

> **Design principle:** `game.js` is intentionally UI-agnostic. It returns plain state objects; `ui.js` owns all DOM reads/writes. This separation makes it easy to test the logic or swap the UI layer.

## 🚀 Getting Started

### Option 1 — Just open it

```bash
git clone https://github.com/your-username/hangman-game.git
cd hangman-game
# Open index.html in your browser
```

> **Note:** Word lists are loaded via `fetch()`. Some browsers block local file fetches. If words don't load, use Option 2.

### Option 2 — Serve locally

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# Then open http://localhost:8080
```

## 🎮 How to Play

1. A hidden word is shown as blank tiles
2. Guess letters by clicking the keyboard or pressing keys on your physical keyboard
3. Each wrong guess draws another body part on the gallows
4. Guess the full word before the figure is complete to win
5. Earn **points** for correct guesses — spend them on **hints** 💡

## 🏆 Achievements

| Icon | Name (EN) | Condition |
|------|-----------|-----------|
| 🎯 | First Blood | Win your first game |
| ✨ | Flawless | Win with zero mistakes |
| 🔥 | On Fire | Win 3 games in a row |
| ⚡ | Lightning | Win 5 games in a row |
| 💰 | Half a Grand | Reach 500 lifetime points |
| 👑 | Millionaire | Reach 1000 lifetime points |
| 🧠 | No Cheating | Win 5 games without buying hints |
| ⏱ | Speed Runner | Win a game in under 20 seconds |
| 🌍 | Bilingual | Win in both Arabic and English |
| 🎖 | Veteran | Play 20 games total |

## 🔧 Customisation

**Add more words:** Edit `data/words-ar.json` or `data/words-en.json`. Each entry needs:
```json
{ "word": "your-word", "category": "Category", "hint": "A helpful clue" }
```

**Add a translation key:** Add to both language objects in `js/i18n.js`, then use `data-i18n="your_key"` in HTML or `t("your_key")` in JS.

**Adjust difficulty:** Edit the `DIFFICULTY` object in `js/game.js`.

## 🌐 Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires ES6+.  
Web Audio API is used for sound — no fallback for very old browsers, but the game works fine without sound.

## 📜 License

MIT — do whatever you like with it.

---

*Built with care — no frameworks, no bundlers, no nonsense.*
