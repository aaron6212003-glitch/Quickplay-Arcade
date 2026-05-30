import { GAMES } from '../data/games.js';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, increment } from './firebase.js?v=12';
import { showInterstitialAd } from './monetization.js?v=12';

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

  // Format rules HTML to leverage pre-screen layout classes (and two-part desktop/mobile instructions for tanks!)
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
          <div>Aim & Shoot: <strong>Move Mouse</strong> and <strong>Left Click</strong> — crosshair auto-locks onto enemies!</div>
        </div>
        <div class="pre-screen-list-item">
          <span>💣</span>
          <div>Landmine: Press <strong>Spacebar</strong></div>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; width: 100%; box-sizing: border-box; text-align: left;">
        <div style="font-weight: 900; color: #a78bfa; font-size: 0.95rem; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">📱 Mobile Controls</div>
        <div class="pre-screen-list-item" style="margin-bottom: 8px;">
          <span>🕹️</span>
          <div>Drive: Use the <strong>Virtual Joystick</strong> in the bottom panel</div>
        </div>
        <div class="pre-screen-list-item" style="margin-bottom: 8px;">
          <span>🚀</span>
          <div>Fire: Tap <strong>FIRE</strong> — auto-aims at locked target. Each shot cycles to the next enemy!</div>
        </div>
        <div class="pre-screen-list-item">
          <span>💣</span>
          <div>Landmine: Tap the <strong>MINE Button</strong> in the bottom panel</div>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 12px; width: 100%; box-sizing: border-box; text-align: left;">
        <div style="font-weight: 900; color: #fbbf24; font-size: 0.95rem; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">⚠️ Enemy Types</div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>🟤</span><div><strong>Brown</strong> — Stationary, easy target</div></div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>⚫</span><div><strong>Grey</strong> — Moves & shoots</div></div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>🟢</span><div><strong>Green</strong> — Fast, fires bouncing bullets</div></div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>🟠</span><div><strong>Orange Kamikaze</strong> — Rushes you, explodes on contact!</div></div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>🔴</span><div><strong>Red Sniper</strong> — Slow, fires fast accurate bullets</div></div>
        <div class="pre-screen-list-item"><span>👾</span><div><strong>Boss (every 5 levels)</strong> — 5 HP, always drops a powerup!</div></div>
      </div>

      <div style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); width: 100%; box-sizing: border-box; text-align: left;">
        <div style="font-weight: 900; color: #10b981; font-size: 0.95rem; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">⚡ Powerups</div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>⚡</span><div><strong>Rapid Fire</strong> — 4x fire rate for 5 seconds</div></div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>🛡️</span><div><strong>Force Shield</strong> — Absorbs all hits for 5 seconds</div></div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>✨</span><div><strong>Trishot</strong> — Fire 3 spread bullets for 6 seconds</div></div>
        <div class="pre-screen-list-item" style="margin-bottom: 6px;"><span>❄️</span><div><strong>EMP Freeze</strong> — Freezes all enemies for 4 seconds</div></div>
        <div class="pre-screen-list-item"><span>🪙</span><div><strong>Coin Drop</strong> — +250 bonus points instantly</div></div>
      </div>

      <div class="pre-screen-list-item" style="margin-top: 15px; text-align: left; width: 100%;">
        <span>🔄</span>
        <div>Your bullets bounce off walls <strong>ONCE</strong>! Use bounce shots around corners to catch enemies off guard.</div>
      </div>
    `;
  } else {
    rulesHtml = rulesHtml
      .replace(/style='display:\s*flex;\s*gap:\s*12px;'/g, 'class="pre-screen-list-item"')
      .replace(/style="display:\s*flex;\s*gap:\s*12px;"/g, 'class="pre-screen-list-item"');
  }

  // Handle Info Button & Rules Modal
  if (game.rules) {
    const infoBtn = document.getElementById('info-btn');
    infoBtn.style.display = 'flex';
    infoBtn.addEventListener('click', () => {
      // Use the beautiful dynamic rulesHtml (with phone controls!) so it displays cleanly in the popup!
      document.getElementById('rules-content').innerHTML = rulesHtml;
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
  
  const activeGames = ['color-guess', 'higher-lower', 'word-rush', 'word-gravity', 'math-avalanche', 'tanks', 'pop-lock'];
  
  if (activeGames.includes(gameId)) {
    comingSoon.style.display = 'none';
    gameContainer.style.display = 'none';
    preScreen.style.display = 'flex';

    function startCountdown(callback) {
      gameContainer.innerHTML = '';
      
      const overlay = document.createElement('div');
      overlay.id = 'countdown-overlay';
      overlay.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 550px;
        height: 700px;
        background: radial-gradient(circle, #101026 0%, #050512 100%);
        border: 8px solid #334155;
        border-radius: 16px;
        color: #fff;
        font-family: 'Outfit', sans-serif;
        box-shadow: 0 15px 30px rgba(0,0,0,0.5);
        margin: 0 auto;
        position: relative;
        overflow: hidden;
      `;
      
      const numberEl = document.createElement('div');
      numberEl.style.cssText = `
        font-size: 8rem;
        font-weight: 900;
        background: linear-gradient(135deg, #FF6B6B, #A78BFA, #38BDF8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        transform: scale(0.5);
        opacity: 0;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
      `;
      
      const labelEl = document.createElement('div');
      labelEl.innerText = "GET READY";
      labelEl.style.cssText = `
        font-size: 1.2rem;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 4px;
        margin-top: 20px;
        text-transform: uppercase;
      `;
      
      overlay.appendChild(numberEl);
      overlay.appendChild(labelEl);
      gameContainer.appendChild(overlay);
      
      // Auto-center viewport directly onto the countdown card!
      gameContainer.scrollIntoView({ behavior: 'auto', block: 'center' });
      const targetScroll = gameContainer.offsetTop - (window.innerHeight - 700) / 2;
      window.scrollTo({ top: targetScroll, behavior: 'auto' });

      // Synthesize Countdown Audio
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      function beep(freq, duration) {
        try {
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
          osc.start();
          osc.stop(audioCtx.currentTime + duration + 0.05);
        } catch (e) {
          console.log("Audio count beep failed:", e);
        }
      }

      let count = 3;
      function tick() {
        if (count > 0) {
          numberEl.innerText = count;
          beep(880, 0.15); // short crisp A5 beep
          
          // Trigger pop-up animations
          numberEl.style.transform = 'scale(0.5)';
          numberEl.style.opacity = '0';
          setTimeout(() => {
            numberEl.style.transform = 'scale(1.2)';
            numberEl.style.opacity = '1';
          }, 50);
          
          count--;
          setTimeout(tick, 1000);
        } else if (count === 0) {
          numberEl.innerText = "GO!";
          labelEl.innerText = "GET SET...";
          beep(1760, 0.35); // high triumphant A6 chime
          
          numberEl.style.transform = 'scale(0.5)';
          numberEl.style.opacity = '0';
          setTimeout(() => {
            numberEl.style.transform = 'scale(1.4)';
            numberEl.style.opacity = '1';
          }, 50);
          
          count--;
          setTimeout(tick, 700);
        } else {
          // Finish and trigger load
          gameContainer.innerHTML = '';
          callback();
        }
      }
      
      // Start counting
      tick();
    }

    onAuthStateChanged(auth, async (user) => {
      let attemptsPlayed = 0;
      let remainingAttempts = 3;
      const today = new Date();
      const yyyy = today.getUTCFullYear();
      const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(today.getUTCDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      if (user) {
        try {
          const attemptsRef = doc(db, "users", user.uid, "dailyAttempts", `${dateString}_${gameId}`);
          const attemptsSnap = await getDoc(attemptsRef);
          if (attemptsSnap.exists()) {
            attemptsPlayed = attemptsSnap.data().attempts || 0;
            remainingAttempts = Math.max(0, 3 - attemptsPlayed);
          }
        } catch (e) {
          console.error("Error fetching daily attempts:", e);
        }
      }

      preScreen.innerHTML = `
        <div class="pre-screen-icon" style="font-size: 3.5rem !important; margin-bottom: 12px !important; height: 3.5rem !important; display: flex !important; align-items: center !important; justify-content: center !important;">${game.emoji}</div>
        <h2 class="pre-screen-title" style="font-size: 1.8rem !important; margin-bottom: 8px !important; text-align: center !important; width: 100% !important;">${game.title}</h2>
        <p class="pre-screen-desc" style="font-size: 0.95rem !important; margin-bottom: 16px !important; line-height: 1.4 !important; color: #94a3b8 !important; text-align: center !important;">${game.description}</p>
        
        <div class="mode-select-row" style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:400px; margin: 15px auto 10px auto;">
          <button class="pre-screen-start-btn" id="practice-mode-btn" style="background: rgba(16, 185, 129, 0.15); border: 2px solid #10B981; color: #10B981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.15); margin-top: 0; padding: 12px 24px; font-weight: 800; font-size: 1rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;">🟢 Practice Mode (Unlimited)</button>
          
          ${user ? (
            remainingAttempts > 0 ? `
              <button class="pre-screen-start-btn" id="competitive-mode-btn" style="background: linear-gradient(135deg, #38BDF8, #818CF8); border: none; color: #fff; box-shadow: 0 4px 20px rgba(56, 189, 248, 0.3); margin-top: 0; padding: 12px 24px; font-weight: 800; font-size: 1rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;">🏆 Competitive Mode (${remainingAttempts}/3 remaining)</button>
            ` : `
              <button class="pre-screen-start-btn" id="competitive-mode-btn" disabled style="background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.15); color: rgba(255,255,255,0.25); cursor: not-allowed; padding: 12px 24px; font-weight: 800; font-size: 1rem; border-radius: 12px; box-shadow: none;">🔒 Locked (0/3 remaining today)</button>
            `
          ) : `
            <button class="pre-screen-start-btn" id="competitive-mode-btn" disabled style="background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.15); color: rgba(255,255,255,0.25); cursor: not-allowed; padding: 12px 24px; font-weight: 800; font-size: 1rem; border-radius: 12px; box-shadow: none;">🔒 Log In to Play Competitive</button>
          `}
        </div>

        <p style="font-size: 0.8rem; color: #64748b; margin-top: 5px; text-align: center; font-weight: 700;">
          Competitive scores post to Leaderboards and award XP and Coins.
        </p>

        ${game.earn ? `
        <div style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 12px; padding: 10px 16px; margin: 12px auto 0; max-width: 400px; width: 100%; box-sizing: border-box; text-align: center;">
          <div style="font-size: 0.8rem; font-weight: 900; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">How to Earn</div>
          <div style="font-size: 0.88rem; color: #e2e8f0; font-weight: 600; line-height: 1.4;">${game.earn}</div>
        </div>
        ` : ''}

        <div class="pre-screen-divider" style="margin: 15px 0 !important;"></div>

        <button id="pre-screen-rules-toggle" style="background: transparent; border: none; color: #a78bfa; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 5px 15px; margin: 0 auto; transition: color 0.2s;">
          View Rules &amp; Controls
        </button>
      `;

      let loadingGame = false;
      const practiceBtn = document.getElementById('practice-mode-btn');
      const competitiveBtn = document.getElementById('competitive-mode-btn');
      const rulesToggle = document.getElementById('pre-screen-rules-toggle');

      if (rulesToggle) {
        rulesToggle.addEventListener('click', () => {
          document.getElementById('rules-content').innerHTML = rulesHtml;
          document.getElementById('rules-modal').style.display = 'flex';
        });
      }

      function launchGameSequence() {
        preScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        document.body.classList.add('game-active');

        // Trigger Countdown!
        startCountdown(() => {
          function centerActiveGame() {
            setTimeout(() => {
              gameContainer.scrollIntoView({ behavior: 'auto', block: 'center' });
              const containerHeight = gameContainer.offsetHeight || 700;
              const targetScroll = gameContainer.offsetTop - (window.innerHeight - containerHeight) / 2;
              window.scrollTo({ top: targetScroll, behavior: 'auto' });
            }, 60);
          }

          const modules = {
            'color-guess': './games/color-guess.js',
            'higher-lower': './games/higher-lower.js',
            'word-rush': './games/word-rush.js',
            'word-gravity': './games/word-gravity.js',
            'math-avalanche': './games/math-avalanche.js',
            'pop-lock': './games/pop-lock.js'
          };

          if (gameId === 'tanks') {
            import('./games/tanks.js').then(module => {
              module.initTanks(gameContainer);
              centerActiveGame();
            });
          } else {
            const path = modules[gameId];
            if (path) {
              import(path).then(module => {
                module.init(gameContainer);
                centerActiveGame();
              });
            }
          }
        });
      }

      if (practiceBtn) {
        practiceBtn.addEventListener('click', () => {
          if (loadingGame) return;
          loadingGame = true;
          window.isPracticeMode = true;
          
          practiceBtn.disabled = true;
          practiceBtn.innerText = "Starting Practice...";
          practiceBtn.style.opacity = "0.7";
          if (competitiveBtn) competitiveBtn.disabled = true;

          launchGameSequence();
        });
      }

      if (competitiveBtn && user && remainingAttempts > 0) {
        competitiveBtn.addEventListener('click', async () => {
          if (loadingGame) return;
          loadingGame = true;
          window.isPracticeMode = false;

          competitiveBtn.disabled = true;
          competitiveBtn.innerText = "Registering Attempt...";
          competitiveBtn.style.opacity = "0.7";
          if (practiceBtn) practiceBtn.disabled = true;

          try {
            // Immediate anti-cheat attempts deduction
            const attemptsRef = doc(db, "users", user.uid, "dailyAttempts", `${dateString}_${gameId}`);
            await setDoc(attemptsRef, {
              attempts: increment(1),
              lastAttempt: new Date()
            }, { merge: true });
            console.log(`Competitive run start successfully recorded: ${attemptsPlayed + 1}/3 attempts.`);
          } catch (e) {
            console.error("Could not increment daily attempts:", e);
          }

          launchGameSequence();
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

// ── Hamburger Menu Toggle ───────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

// ── Intercept Lobby Navigation for Interstitial Ad Delivery ──
document.addEventListener('click', async (e) => {
  // Capture any anchor tag pointing back to the index.html lobby
  const anchor = e.target.closest('a');
  if (anchor && anchor.getAttribute('href') && anchor.getAttribute('href').startsWith('index.html')) {
    const targetUrl = anchor.getAttribute('href');
    
    e.preventDefault();
    console.log(`[Playhaus Interstitial] Navigating to: ${targetUrl}. Triggering interstitial...`);
    
    // Play full screen interstitial ad
    await showInterstitialAd();
    
    // Smoothly redirect
    window.location.href = targetUrl;
  }
});

