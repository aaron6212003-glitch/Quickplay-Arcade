import { GAMES, CATEGORIES, LEADERBOARD } from '../data/games.js';

// ── DOM refs ────────────────────────────────────────────────────────────────
const categoryScroll = document.getElementById('category-scroll');
const gamesGrid      = document.getElementById('games-grid');
const gameCount      = document.getElementById('game-count');
const searchInput    = document.getElementById('search-input');
const searchClear    = document.getElementById('search-clear');
const noResults      = document.getElementById('no-results');
const lbTable        = document.getElementById('leaderboard-table');
const randomBtn      = document.getElementById('random-btn');
const hamburger      = document.getElementById('hamburger');
const mobileMenu     = document.getElementById('mobile-menu');
const countdownEl    = document.getElementById('countdown-timer');

// ── State ────────────────────────────────────────────────────────────────────
let activeCategory = 'all';
let searchQuery    = '';

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
    const matchCat   = activeCategory === 'all' || g.category === activeCategory;
    const matchSearch = g.title.toLowerCase().includes(searchQuery) ||
                        g.description.toLowerCase().includes(searchQuery) ||
                        g.category.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
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
        <a href="game.html?id=${game.id}" class="btn btn--primary btn--sm">▶ Play</a>
      </div>
    </article>
  `;
}

// ── Render games grid ────────────────────────────────────────────────────────
function renderGames() {
  const list = filteredGames();
  gameCount.textContent = `${list.length} game${list.length !== 1 ? 's' : ''}`;
  if (list.length === 0) {
    gamesGrid.innerHTML = '';
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
    gamesGrid.innerHTML = list.map(gameCardHTML).join('');
  }
}

// ── Render leaderboard ───────────────────────────────────────────────────────
function renderLeaderboard() {
  lbTable.innerHTML = LEADERBOARD.map(row => `
    <div class="lb-row ${row.rank <= 3 ? 'lb-row--top' : ''}">
      <span class="lb-rank">${row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank-1] : '#' + row.rank}</span>
      <span class="lb-avatar">${row.avatar}</span>
      <span class="lb-user">${row.username}</span>
      <span class="lb-game">${row.game}</span>
      <span class="lb-score">${row.score.toLocaleString()}</span>
    </div>
  `).join('');
}

// ── Search ───────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  searchClear.style.opacity = searchQuery ? '1' : '0';
  renderGames();
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.style.opacity = '0';
  renderGames();
});
searchClear.style.opacity = '0';

// ── Random game ──────────────────────────────────────────────────────────────
randomBtn.addEventListener('click', () => {
  const g = GAMES[Math.floor(Math.random() * GAMES.length)];
  window.location.href = `game.html?id=${g.id}`;
});

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

// ── Init ─────────────────────────────────────────────────────────────────────
renderCategories();
renderGames();
renderLeaderboard();
