import { GAMES, CATEGORIES } from '../data/games.js';
import { getDailyGame } from './daily.js';

// ── DOM refs ────────────────────────────────────────────────────────────────
const categoryScroll = document.getElementById('category-scroll');
const gamesGrid      = document.getElementById('games-grid');
const gameCount      = document.getElementById('game-count');
const lbTable        = document.getElementById('leaderboard-table');
const randomBtn      = document.getElementById('random-btn');
const hamburger      = document.getElementById('hamburger');
const mobileMenu     = document.getElementById('mobile-menu');
const countdownEl    = document.getElementById('countdown-timer');

// ── State ────────────────────────────────────────────────────────────────────
let activeCategory = 'all';

// ── Render categories ────────────────────────────────────────────────────────
function renderCategories() {
  categoryScroll.innerHTML = CATEGORIES.map(cat => `
    <button
      class="category-btn ${cat.id === activeCategory ? 'active' : ''}"
      data-id="${cat.id}"
    >${cat.label}</button>
  `).join('');

  categoryScroll.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.id;
      renderCategories();
      renderGames();
    });
  });
}

// ── Filter games ─────────────────────────────────────────────────────────────
function filteredGames() {
  return GAMES.filter(g => {
    return activeCategory === 'all' || g.category === activeCategory;
  });
}

// ── Build badge HTML ──────────────────────────────────────────────────────────
function badgesHTML(badges) {
  return badges.map(b => `<span class="badge badge--${b}">${b}</span>`).join('');
}

// ── Difficulty tag class ─────────────────────────────────────────────────────
function diffClass(diff) {
  return diff === 'Easy' ? 'easy' : diff === 'Medium' ? 'medium' : 'hard';
}

// ── Build one game card ───────────────────────────────────────────────────────
function gameCardHTML(game) {
  const [c1, c2] = game.gradient;
  return `
    <article class="game-card fade-in-up" data-id="${game.id}" role="article">
      <div class="game-card__thumb" style="background:linear-gradient(135deg,${c1},${c2})">
        ${game.emoji}
        <div class="game-card__badges">${badgesHTML(game.badges)}</div>
      </div>
      <div class="game-card__body">
        <h3 class="game-card__title">${game.title}</h3>
        <p class="game-card__desc">${game.description}</p>
        <div class="game-card__meta">
          <span class="meta-tag meta-tag--${diffClass(game.difficulty)}">${game.difficulty}</span>
          <span class="meta-tag">⏱ ${game.playTime}</span>
        </div>
      </div>
      <div class="game-card__footer">
        <a href="game.html?id=${game.id}" class="btn btn--primary btn--sm">▶ Play Game</a>
      </div>
    </article>
  `;
}

// ── Render games grid ────────────────────────────────────────────────────────
function renderGames() {
  const list = filteredGames();
  if (gameCount) gameCount.textContent = `${list.length} game${list.length !== 1 ? 's' : ''}`;
  if (gamesGrid) gamesGrid.innerHTML = list.map(gameCardHTML).join('');
}

// ── Random game ──────────────────────────────────────────────────────────────
if (randomBtn) {
  randomBtn.addEventListener('click', () => {
    const g = GAMES[Math.floor(Math.random() * GAMES.length)];
    window.location.href = `game.html?id=${g.id}`;
  });
}

// ── Hamburger ────────────────────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// ── Sticky nav scroll shadow ─────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('top-nav').style.boxShadow =
    window.scrollY > 10 ? '0 4px 30px rgba(0,0,0,.4)' : '';
}, { passive: true });

// ── Daily countdown ──────────────────────────────────────────────────────────
function updateCountdown() {
  const now  = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = next - now;
  const h  = String(Math.floor(diff / 3.6e6)).padStart(2,'0');
  const m  = String(Math.floor((diff % 3.6e6) / 6e4)).padStart(2,'0');
  const s  = String(Math.floor((diff % 6e4) / 1e3)).padStart(2,'0');
  if (countdownEl) countdownEl.textContent = `${h}:${m}:${s}`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ── Leaderboard Filter ───────────────────────────────────────────────────────
const lbFilter = document.getElementById('leaderboard-filter');
if (lbFilter) {
  lbFilter.addEventListener('change', (e) => {
    if (window.loadLeaderboard) {
      window.loadLeaderboard(e.target.value);
    }
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
renderCategories();
renderGames();

// ── Populate Daily Card ──────────────────────────────────────────────────────
const dailyNameEl = document.getElementById('daily-game-name');
const dailyPlayBtn = document.getElementById('daily-play-btn');
const dailyEmojiEl = document.getElementById('daily-game-emoji');

if (dailyNameEl && dailyPlayBtn && dailyEmojiEl) {
  const { game } = getDailyGame();
  if (game) {
    dailyNameEl.textContent = game.title;
    dailyPlayBtn.href = `game.html?id=${game.id}&daily=true`;
    dailyEmojiEl.textContent = game.emoji;
  }
}
