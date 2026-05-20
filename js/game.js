import { GAMES } from '../data/games.js';

// ── Get game id from URL ─────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');
const game   = GAMES.find(g => g.id === gameId);

const isDaily = params.get('daily') === 'true';
if (isDaily) {
  window.isDailyRun = true;
}

// ── Update page title & meta ─────────────────────────────────────────────────
if (game) {
  document.title = `${game.title} — Playhaus`;
  document.querySelector('meta[name="description"]').content = game.description;
}

// ── Fill game header ──────────────────────────────────────────────────────────
const titleEl = document.getElementById('game-title');
const descEl  = document.getElementById('game-desc');
const emojiEl = document.getElementById('game-emoji');
const metaEl  = document.getElementById('game-meta');

if (game) {
  titleEl.textContent = game.title;
  descEl.textContent  = game.description;
  emojiEl.textContent = game.emoji;

  const diffClass = game.difficulty === 'Easy' ? 'easy' : game.difficulty === 'Medium' ? 'medium' : 'hard';
  metaEl.innerHTML = `
    <span class="meta-tag meta-tag--${diffClass}">${game.difficulty}</span>
    <span class="meta-tag">⏱ ${game.playTime}</span>
    <span class="meta-tag">📂 ${game.category.replace(/-/g,' ')}</span>
  `;

  // Color the header emoji background
  const [c1, c2] = game.gradient;
  document.getElementById('game-header').style.borderColor = c1 + '55';

  // Handle Info Button & Rules Modal
  if (game.rules) {
    const infoBtn = document.getElementById('info-btn');
    infoBtn.style.display = 'flex';
    infoBtn.addEventListener('click', () => {
      document.getElementById('rules-content').innerHTML = game.rules;
      document.getElementById('rules-modal').style.display = 'flex';
    });
    
    document.getElementById('close-rules').addEventListener('click', () => {
      document.getElementById('rules-modal').style.display = 'none';
    });
  }

  // Load specific game logic if it exists
  const gameContainer = document.getElementById('game-container');
  const comingSoon = document.getElementById('coming-soon');
  
  if (gameId === 'color-guess') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/color-guess.js').then(module => {
      module.init(gameContainer);
    });
  } else if (gameId === 'higher-lower') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/higher-lower.js').then(module => {
      module.init(gameContainer);
    });
  } else if (gameId === 'word-rush') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/word-rush.js').then(module => {
      module.init(gameContainer);
    });
  } else if (gameId === 'word-gravity') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/word-gravity.js').then(module => {
      module.init(gameContainer);
    });
  } else if (gameId === 'math-avalanche') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/math-avalanche.js').then(module => {
      module.init(gameContainer);
    });
  } else if (gameId === 'tanks') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/tanks.js').then(module => {
      module.initTanks(gameContainer);
    });
  } else if (gameId === 'cyber-bot') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/cyber-bot.js').then(module => {
      module.init(gameContainer);
    });
  } else if (gameId === 'neon-plinko') {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'block';
    import('./games/neon-plinko.js').then(module => {
      module.init(gameContainer);
    });
  }

} else {
  titleEl.textContent = 'Game Not Found';
  descEl.textContent  = 'This game does not exist yet.';
}

// ── "More games" grid ─────────────────────────────────────────────────────────
const moreGrid = document.getElementById('more-games-grid');
const others   = GAMES.filter(g => g.id !== gameId).slice(0, 6);

function diffClass(d) { return d === 'Easy' ? 'easy' : d === 'Medium' ? 'medium' : 'hard'; }

moreGrid.innerHTML = others.map(g => {
  const [c1, c2] = g.gradient;
  return `
    <article class="game-card fade-in-up">
      <div class="game-card__thumb" style="background:linear-gradient(135deg,${c1},${c2})">
        ${g.emoji}
        <div class="game-card__badges">
          ${g.badges.map(b => `<span class="badge badge--${b}">${b}</span>`).join('')}
        </div>
      </div>
      <div class="game-card__body">
        <h3 class="game-card__title">${g.title}</h3>
        <p class="game-card__desc">${g.description}</p>
        <div class="game-card__meta">
          <span class="meta-tag meta-tag--${diffClass(g.difficulty)}">${g.difficulty}</span>
          <span class="meta-tag">⏱ ${g.playTime}</span>
        </div>
      </div>
      <div class="game-card__footer">
        <a href="game.html?id=${g.id}" class="btn btn--primary btn--sm">▶ Play Game</a>
      </div>
    </article>
  `;
}).join('');

// ── Random game button ────────────────────────────────────────────────────────
document.getElementById('random-btn')?.addEventListener('click', () => {
  const pick = GAMES[Math.floor(Math.random() * GAMES.length)];
  window.location.href = `game.html?id=${pick.id}`;
});
document.getElementById('random-game-btn')?.addEventListener('click', () => {
  const pick = GAMES[Math.floor(Math.random() * GAMES.length)];
  window.location.href = `game.html?id=${pick.id}`;
});
