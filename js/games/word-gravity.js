export function init(container) {
  container.innerHTML = `
    <style>
      .wg-wrapper {
        display: flex; flex-direction: column; align-items: center;
        width: 100%; max-width: 400px; margin: 0 auto;
        font-family: 'Outfit', sans-serif;
        color: #fff; padding: 10px 10px 30px;
        height: calc(100vh - 100px); min-height: 500px;
        position: relative; overflow: hidden;
      }
      
      .wg-header {
        display: flex; justify-content: space-between; width: 100%;
        margin-bottom: 15px; font-weight: 800; font-size: 1.1rem;
      }
      .wg-score-box { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; }
      
      .wg-board-container {
        flex: 1; width: 100%; background: rgba(0,0,0,0.3); border-radius: 12px;
        border: 2px solid rgba(255,255,255,0.1); position: relative; overflow: hidden;
        margin-bottom: 15px;
      }
      
      .wg-tile {
        position: absolute; width: calc(100% / 6); height: calc(100% / 8);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s;
        user-select: none;
      }
      .wg-tile-inner {
        width: 90%; height: 90%; background: #4B5563; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.8rem; font-weight: 900; color: #fff;
        box-shadow: 0 4px 0 rgba(0,0,0,0.3); cursor: pointer;
        transition: all 0.1s; text-transform: uppercase;
      }
      .wg-tile.selected .wg-tile-inner {
        background: #38BDF8; color: #000; box-shadow: 0 0 15px rgba(56,189,248,0.6);
        transform: scale(0.9);
      }
      
      .wg-controls {
        width: 100%; display: flex; flex-direction: column; gap: 10px;
      }
      .wg-word-bar {
        background: #1F2937; height: 50px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.5rem; font-weight: 800; letter-spacing: 3px;
        border: 2px solid rgba(255,255,255,0.2);
      }
      .wg-btn-row { display: flex; gap: 10px; width: 100%; }
      .wg-btn {
        flex: 1; background: #374151; color: white; border: none; padding: 15px;
        border-radius: 10px; font-size: 1.1rem; font-weight: 800; cursor: pointer;
        transition: background 0.2s; text-transform: uppercase;
      }
      .wg-btn:active { transform: scale(0.95); }
      .wg-btn-submit { background: #10B981; flex: 2; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
      .wg-btn-clear { background: #EF4444; }
      
      .wg-toast {
        position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);
        background: white; color: black; padding: 10px 20px; border-radius: 8px;
        font-weight: 800; opacity: 0; pointer-events: none; transition: opacity 0.3s;
        z-index: 200; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-size: 1.2rem;
      }
      
      /* Game Over Overlay */
      .wg-overlay {
        position: absolute; inset: 0; background: rgba(10,10,20,0.95);
        display: none; flex-direction: column; align-items: center; justify-content: center;
        z-index: 100; text-align: center; border-radius: 12px;
      }
      .wg-title { font-size: 3rem; font-weight: 900; color: #EF4444; margin-bottom: 10px; }
      .wg-final-score { font-size: 5rem; font-weight: 900; color: #fff; margin-bottom: 30px; text-shadow: 0 0 30px rgba(255,255,255,0.3); }
      
      .wg-btn-overlay {
        background: #38BDF8; color: #000; border: none; padding: 15px 30px;
        border-radius: 50px; font-size: 1.2rem; font-weight: 900; cursor: pointer;
        width: 80%; margin-bottom: 10px; box-shadow: 0 8px 25px rgba(56,189,248,0.4);
      }
      
      @keyframes pop-points {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
      }
      .wg-points-anim {
        position: absolute; font-size: 2rem; font-weight: 900; color: #10B981;
        text-shadow: 0 0 10px rgba(0,0,0,0.8); pointer-events: none;
        animation: pop-points 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; z-index: 50;
      }
    </style>

    <div class="wg-wrapper">
      <div class="wg-header">
        <div class="wg-score-box">Score: <span id="wg-score">0</span></div>
        <div class="wg-score-box" style="background: rgba(245, 158, 11, 0.2); color: #F59E0B; border-color: #F59E0B;">Best: <span id="wg-best">0</span></div>
      </div>
      
      <div class="wg-board-container" id="wg-board">
        <!-- Tiles spawn here -->
        <div class="wg-toast" id="wg-toast">Invalid Word</div>
      </div>

      <div class="wg-controls">
        <div class="wg-word-bar" id="wg-word-bar"></div>
        <div class="wg-btn-row">
          <button class="wg-btn wg-btn-clear" onclick="window.wgClear()">Clear</button>
          <button class="wg-btn wg-btn-submit" onclick="window.wgSubmit()">Submit</button>
        </div>
      </div>

      <!-- Start Game Overlay -->
      <div class="wg-overlay" id="wg-start-overlay" style="display: flex;">
        <div class="wg-title" style="color: #38BDF8;">WORD GRAVITY</div>
        <div style="color: #ccc; font-weight: 500; font-size: 1.1rem; margin-bottom: 30px; padding: 0 20px;">Build words before the board fills up. 3+ letters only!</div>
        <button class="wg-btn-overlay" onclick="window.wgStartGame()">START GAME</button>
      </div>

      <!-- Game Over Overlay -->
      <div class="wg-overlay" id="wg-overlay">
        <div class="wg-title">GAME OVER</div>
        <div style="color: #aaa; font-weight: 700; margin-bottom: 5px;">FINAL SCORE</div>
        <div class="wg-final-score" id="wg-final-score-display">0</div>
        
        <button class="wg-btn-overlay" onclick="window.wgRestart()">PLAY AGAIN</button>
        <button class="wg-btn-overlay" style="background: #10B981;" onclick="window.wgCopyResult()">COPY RESULT</button>
        <button class="wg-btn-overlay" style="background: #333; color: #fff; box-shadow: none;" onclick="window.location.href='index.html'">BACK TO ARCADE</button>
      </div>
    </div>
  `;

  // --- CONFIGURATION ---
  // You can edit these values to balance the game!
  let SPAWN_RATE_MS = 1000;    // How fast new letters spawn at the top
  const GRAVITY_RATE_MS = 150; // How fast letters fall down empty spaces
  const COLS = 6;              // Number of columns in the grid
  const ROWS = 8;              // Number of rows in the grid
  
  // Scoring rules
  const POINTS = {
    3: 30,
    4: 50,
    5: 100  // 5 or more letters = 100 pts
  };

  // Letter frequency distribution (more vowels and common consonants)
  const LETTER_POOL = "EEEEEEAAAAAIOOOOOUUUNNNRRRTTTLLSSSSDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ".split('');

  // --- STATE ---
  let score = 0;
  let best = parseInt(localStorage.getItem('wg-best')) || 0;
  let grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
  let tiles = {}; // Map of id -> tile state
  let selectedIds = [];
  let isGameOver = false;
  let spawnInterval, gravityInterval, difficultyInterval;

  // --- DOM Elements ---
  const elBoard = document.getElementById('wg-board');
  const elScore = document.getElementById('wg-score');
  const elBest = document.getElementById('wg-best');
  const elWordBar = document.getElementById('wg-word-bar');
  const elToast = document.getElementById('wg-toast');
  const elOverlay = document.getElementById('wg-overlay');

  elBest.innerText = best;

  // --- LOGIC ---
  function getRandomLetter() {
    return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
  }

  function showToast(msg, color = 'white') {
    elToast.innerText = msg;
    elToast.style.background = color;
    elToast.style.color = color === 'white' ? 'black' : 'white';
    elToast.style.opacity = '1';
    setTimeout(() => { elToast.style.opacity = '0'; }, 1000);
  }

  function renderTile(tile) {
    tile.el.style.transform = `translate(${tile.col * 100}%, ${tile.row * 100}%)`;
    if (tile.selected) {
      tile.el.classList.add('selected');
    } else {
      tile.el.classList.remove('selected');
    }
  }

  function spawnLetter() {
    if (isGameOver) return;
    
    // Find available columns
    const availableCols = [];
    for (let c = 0; c < COLS; c++) {
      if (grid[0][c] === null) availableCols.push(c);
    }
    
    // Check if top row is entirely occupied -> GAME OVER
    if (availableCols.length === 0) {
      endGame();
      return;
    }

    // Pick a random column from available
    const col = availableCols[Math.floor(Math.random() * availableCols.length)];

    const id = Math.random().toString(36).substr(2, 9);
    const char = getRandomLetter();
    
    const tileEl = document.createElement('div');
    tileEl.className = 'wg-tile';
    tileEl.innerHTML = `<div class="wg-tile-inner">${char}</div>`;
    tileEl.dataset.id = id;
    
    tileEl.addEventListener('mousedown', () => toggleSelect(id));
    tileEl.addEventListener('touchstart', (e) => { e.preventDefault(); toggleSelect(id); });

    elBoard.appendChild(tileEl);
    
    const tile = { id, char, row: 0, col, selected: false, el: tileEl };
    tiles[id] = tile;
    grid[0][col] = id;
    
    renderTile(tile);
  }

  function applyGravity() {
    if (isGameOver) return;
    let moved = false;
    
    // Iterate from bottom to top
    for (let r = ROWS - 2; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        const id = grid[r][c];
        if (id) {
          // If space below is empty, drop it
          if (grid[r+1][c] === null) {
            grid[r+1][c] = id;
            grid[r][c] = null;
            tiles[id].row = r + 1;
            renderTile(tiles[id]);
            moved = true;
          }
        }
      }
    }
  }

  function toggleSelect(id) {
    if (isGameOver) return;
    const tile = tiles[id];
    
    if (tile.selected) {
      // If tapping the last selected tile, unselect it. Otherwise ignore.
      if (selectedIds[selectedIds.length - 1] === id) {
        tile.selected = false;
        selectedIds.pop();
        renderTile(tile);
      }
    } else {
      tile.selected = true;
      selectedIds.push(id);
      renderTile(tile);
    }
    updateWordBar();
  }

  function updateWordBar() {
    const word = selectedIds.map(id => tiles[id].char).join('');
    elWordBar.innerText = word;
  }

  window.wgClear = function() {
    selectedIds.forEach(id => {
      tiles[id].selected = false;
      renderTile(tiles[id]);
    });
    selectedIds = [];
    updateWordBar();
  };

  window.wgSubmit = async function() {
    if (isGameOver || selectedIds.length === 0) return;
    
    const word = selectedIds.map(id => tiles[id].char).join('');
    
    if (word.length < 3) {
      showToast('Too short!', '#EF4444');
      window.wgClear();
      return;
    }

    // Quick sanity check for valid word via Free Dictionary API
    let isValid = false;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (res.status === 200) isValid = true;
    } catch(e) {
      // If API fails (cors/adblock), just allow it to prevent game breaking
      isValid = true;
    }

    if (!isValid) {
      showToast('Invalid Word', '#EF4444');
      window.wgClear();
      return;
    }

    // VALID WORD!
    // 1. Calculate points
    let pts = word.length * 10;
    if (word.length > 5) pts += ((word.length - 5) * 20); // Bonus
    
    score += pts;
    elScore.innerText = score;
    
    // Spawn point animation at the last selected tile
    const lastTile = tiles[selectedIds[selectedIds.length - 1]];
    if (lastTile) {
      const anim = document.createElement('div');
      anim.className = 'wg-points-anim';
      anim.innerText = `+${pts}`;
      anim.style.left = `${lastTile.col * (100/COLS) + 5}%`;
      anim.style.top = `${lastTile.row * (100/ROWS)}%`;
      elBoard.appendChild(anim);
      setTimeout(() => anim.remove(), 1000);
    }
    
    showToast('NICE!', '#10B981');

    // 2. Remove tiles from grid and DOM
    selectedIds.forEach(id => {
      const t = tiles[id];
      grid[t.row][t.col] = null;
      t.el.remove();
      delete tiles[id];
    });
    
    selectedIds = [];
    updateWordBar();
    
    // Gravity will automatically pull everything down on the next tick!
  };

  function endGame() {
    isGameOver = true;
    clearInterval(spawnInterval);
    clearInterval(gravityInterval);
    clearInterval(difficultyInterval);
    
    if (score > best) {
      best = score;
      localStorage.setItem('wg-best', best);
      elBest.innerText = best;
    }
    
    // Save to global leaderboard!
    if (window.saveScore && score > 0) {
      window.saveScore('Word Gravity', score);
    }
    
    document.getElementById('wg-final-score-display').innerText = score;
    elOverlay.style.display = 'flex';
  }

  window.wgRestart = function() {
    elOverlay.style.display = 'none';
    document.getElementById('wg-start-overlay').style.display = 'flex';
    
    // Cleanup DOM
    Object.values(tiles).forEach(t => t.el.remove());
    
    // Reset state
    grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    tiles = {};
    selectedIds = [];
    score = 0;
    SPAWN_RATE_MS = 1000;
    isGameOver = false;
    
    elScore.innerText = score;
    updateWordBar();
  };

  window.wgStartGame = function() {
    document.getElementById('wg-start-overlay').style.display = 'none';
    
    // Start Loops
    spawnInterval = setInterval(spawnLetter, SPAWN_RATE_MS);
    gravityInterval = setInterval(applyGravity, GRAVITY_RATE_MS);
    
    // Increase difficulty over time (speed up spawning)
    difficultyInterval = setInterval(() => {
      if (SPAWN_RATE_MS > 400) {
        SPAWN_RATE_MS -= 50;
        clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnLetter, SPAWN_RATE_MS);
      }
    }, 15000); // Speed up every 15 seconds
  };

  window.wgCopyResult = function() {
    const text = `Word Gravity ☄️\nScore: ${score}\nCan you beat my score?\nhttps://quickplay-arcade.vercel.app`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  // Start the game!
  window.wgRestart();
}
