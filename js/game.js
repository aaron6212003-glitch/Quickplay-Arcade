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

  // Load specific game logic if it exists (using a unified pre-screen start card)
  const gameContainer = document.getElementById('game-container');
  const comingSoon = document.getElementById('coming-soon');
  const preScreen = document.getElementById('game-pre-screen');
  
  const activeGames = ['color-guess', 'higher-lower', 'word-rush', 'word-gravity', 'math-avalanche', 'tanks', 'cyber-bot', 'neon-plinko'];
  
  if (activeGames.includes(gameId)) {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'none';
    preScreen.style.display = 'flex';
    
    // Format rules HTML to leverage pre-screen layout classes
    let rulesHtml = game.rules || '';
    if (gameId === 'tanks') {
      rulesHtml = `
        <div style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; width: 100%; box-sizing: border-box; text-align: left;">
          <div style="font-weight: 900; color: #38BDF8; font-size: 0.95rem; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">💻 Desktop Controls</div>
          <div class="pre-screen-list-item" style="margin-bottom: 8px;">
            <span>🕹️</span>
            <div>Drive: <strong>WASD</strong> or <strong>Arrow Keys</strong></div>
          </div>
          <div class="pre-screen-list-item" style="margin-bottom: 8px;">
            <span>🖱️</span>
            <div>Aim & Shoot: <strong>Move Mouse</strong> and <strong>Left Click</strong></div>
          </div>
          <div class="pre-screen-list-item">
            <span>💣</span>
            <div>Landmine: Press <strong>Spacebar</strong></div>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); width: 100%; box-sizing: border-box; text-align: left;">
          <div style="font-weight: 900; color: #a78bfa; font-size: 0.95rem; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">📱 Mobile Controls</div>
          <div class="pre-screen-list-item" style="margin-bottom: 8px;">
            <span>🕹️</span>
            <div>Drive: Use the <strong>Virtual Joystick</strong> in the bottom panel</div>
          </div>
          <div class="pre-screen-list-item" style="margin-bottom: 8px;">
            <span>👆</span>
            <div>Aim & Shoot: <strong>Tap anywhere</strong> on the play board!</div>
          </div>
          <div class="pre-screen-list-item">
            <span>💣</span>
            <div>Landmine: Tap the <strong>MINE Button</strong> in the bottom panel</div>
          </div>
        </div>
        
        <div class="pre-screen-list-item" style="margin-top: 15px; text-align: left; width: 100%;">
          <span>🔄</span>
          <div>Bullets bounce off walls <strong>ONCE</strong>! Use bounce shots around corners to catch enemies off guard.</div>
        </div>
      `;
    } else {
      rulesHtml = rulesHtml
        .replace(/style='display:\s*flex;\s*gap:\s*12px;'/g, 'class="pre-screen-list-item"')
        .replace(/style="display:\s*flex;\s*gap:\s*12px;"/g, 'class="pre-screen-list-item"');
    }
      
    preScreen.innerHTML = `
      <div class="pre-screen-icon">${game.emoji}</div>
      <h2 class="pre-screen-title">${game.title}</h2>
      <p class="pre-screen-desc">${game.description}</p>
      
      <div class="pre-screen-divider"></div>
      
      <h3 class="pre-screen-section-title">🕹️ How to Play</h3>
      <div class="pre-screen-list">
        ${rulesHtml}
      </div>
      
      <div class="pre-screen-divider"></div>
      
      <h3 class="pre-screen-section-title">🪙 How to Score</h3>
      <div class="pre-screen-list">
        <div class="pre-screen-list-item">
          <span>⭐</span>
          <div>Earn exactly <strong>+10 XP</strong> per successful action (capped at 100 XP max).</div>
        </div>
        <div class="pre-screen-list-item">
          <span>🪙</span>
          <div>Earn exactly <strong>+10 Coins</strong> per successful action (capped at 100 Coins max).</div>
        </div>
        ${isDaily ? `
        <div class="pre-screen-list-item" style="color: #F59E0B; border: 1px dashed rgba(245,158,11,0.3); padding: 10px 14px; border-radius: 12px; background: rgba(245,158,11,0.05); margin-top: 5px; width: 100%; box-sizing: border-box;">
          <span>🔥</span>
          <div><strong>Daily Challenge Bonus:</strong> Get <strong>+25 XP</strong> & <strong>+15 Coins</strong> for finishing this run!</div>
        </div>
        ` : ''}
      </div>
      
      <button class="pre-screen-start-btn" id="start-game-btn">Start Game</button>
    `;
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
      preScreen.style.display = 'none';
      gameContainer.style.display = 'block';
      
      if (gameId === 'color-guess') {
        import('./games/color-guess.js').then(module => {
          module.init(gameContainer);
        });
      } else if (gameId === 'higher-lower') {
        import('./games/higher-lower.js').then(module => {
          module.init(gameContainer);
        });
      } else if (gameId === 'word-rush') {
        import('./games/word-rush.js').then(module => {
          module.init(gameContainer);
        });
      } else if (gameId === 'word-gravity') {
        import('./games/word-gravity.js').then(module => {
          module.init(gameContainer);
        });
      } else if (gameId === 'math-avalanche') {
        import('./games/math-avalanche.js').then(module => {
          module.init(gameContainer);
        });
      } else if (gameId === 'tanks') {
        import('./games/tanks.js').then(module => {
          module.initTanks(gameContainer);
        });
      } else if (gameId === 'cyber-bot') {
        import('./games/cyber-bot.js').then(module => {
          module.init(gameContainer);
        });
      } else if (gameId === 'neon-plinko') {
        import('./games/neon-plinko.js').then(module => {
          module.init(gameContainer);
        });
      }
    });
  } else {
    comingSoon.style.display = 'block';
    gameContainer.style.display = 'none';
    preScreen.style.display = 'none';
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
