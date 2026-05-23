export function init(container) {
  container.innerHTML = `
    <style>
      .ma-wrapper {
        display: flex; flex-direction: column; align-items: center;
        width: 100%; max-width: 400px; margin: 0 auto;
        font-family: 'Outfit', sans-serif;
        color: #fff; padding: 10px 10px 30px;
        height: calc(100vh - 100px); min-height: 500px;
        position: relative; overflow: hidden;
      }
      
      .ma-header {
        display: flex; justify-content: space-between; width: 100%;
        margin-bottom: 10px; font-weight: 800; font-size: 1.1rem;
      }
      .ma-score-box { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; }
      
      .ma-target-box {
        width: 100%; background: linear-gradient(135deg, #EF4444, #F59E0B);
        border-radius: 12px; padding: 10px; text-align: center;
        margin-bottom: 15px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
      }
      .ma-target-label { font-size: 0.9rem; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.8); }
      .ma-target-val { font-size: 2.5rem; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }

      .ma-board-container {
        flex: 1; width: 100%; background: rgba(0,0,0,0.3); border-radius: 12px;
        border: 2px solid rgba(255,255,255,0.1); position: relative; overflow: hidden;
        margin-bottom: 15px;
      }
      
      .ma-tile {
        position: absolute; width: calc(100% / 6); height: calc(100% / 8);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s;
        user-select: none;
      }
      .ma-tile-inner {
        width: 90%; height: 90%; background: #4B5563; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.8rem; font-weight: 900; color: #fff;
        box-shadow: 0 4px 0 rgba(0,0,0,0.3); cursor: pointer;
        transition: all 0.1s;
      }
      .ma-tile.is-op .ma-tile-inner { background: #374151; color: #FCD34D; }
      
      .ma-tile.selected .ma-tile-inner {
        background: #F59E0B; color: #000; box-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
        transform: scale(0.9);
      }
      
      .ma-controls { width: 100%; display: flex; flex-direction: column; gap: 10px; }
      .ma-eq-bar {
        background: #1F2937; height: 50px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.5rem; font-weight: 800; letter-spacing: 2px;
        border: 2px solid rgba(255,255,255,0.2);
      }
      .ma-btn-row { display: flex; gap: 10px; width: 100%; }
      .ma-btn {
        flex: 1; background: #374151; color: white; border: none; padding: 15px;
        border-radius: 10px; font-size: 1.1rem; font-weight: 800; cursor: pointer;
        transition: background 0.2s; text-transform: uppercase;
      }
      .ma-btn:active { transform: scale(0.95); }
      .ma-btn-submit { background: #10B981; flex: 2; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
      .ma-btn-clear { background: #EF4444; }
      
      .ma-toast {
        position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);
        background: white; color: black; padding: 10px 20px; border-radius: 8px;
        font-weight: 800; opacity: 0; pointer-events: none; transition: opacity 0.3s;
        z-index: 200; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-size: 1.2rem; text-align: center;
      }
      
      /* Game Over Overlay */
      .ma-overlay {
        position: absolute; inset: 0; background: rgba(10,10,20,0.95);
        display: none; flex-direction: column; align-items: center; justify-content: center;
        z-index: 100; text-align: center; border-radius: 12px;
      }
      .ma-title { font-size: 3rem; font-weight: 900; color: #EF4444; margin-bottom: 10px; line-height: 1.1; }
      .ma-final-score { font-size: 5rem; font-weight: 900; color: #fff; margin-bottom: 30px; text-shadow: 0 0 30px rgba(255,255,255,0.3); }
      
      .ma-btn-overlay {
        background: #F59E0B; color: #000; border: none; padding: 15px 30px;
        border-radius: 50px; font-size: 1.2rem; font-weight: 900; cursor: pointer;
        width: 80%; margin-bottom: 10px; box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
      }
      
      @keyframes pop-points { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-50px) scale(1.5); opacity: 0; } }
      .ma-points-anim {
        position: absolute; font-size: 2.5rem; font-weight: 900; color: #10B981;
        text-shadow: 0 0 15px rgba(16, 185, 129, 0.8); pointer-events: none;
        animation: pop-points 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; z-index: 50;
      }
    </style>

    <div class="ma-wrapper">
      <div class="ma-header">
        <div class="ma-score-box">Score: <span id="ma-score">0</span></div>
        <div class="ma-score-box" style="background: rgba(245, 158, 11, 0.2); color: #F59E0B; border-color: #F59E0B;">Best: <span id="ma-best">0</span></div>
      </div>
      
      <div class="ma-target-box">
        <div class="ma-target-label">Target Number</div>
        <div class="ma-target-val" id="ma-target-val">--</div>
      </div>

      <div class="ma-board-container" id="ma-board">
        <div class="ma-toast" id="ma-toast">Invalid</div>
      </div>

      <div class="ma-controls">
        <div class="ma-eq-bar" id="ma-eq-bar"></div>
        <div class="ma-btn-row">
          <button class="ma-btn ma-btn-clear" onclick="window.maClear()">Clear</button>
          <button class="ma-btn ma-btn-submit" onclick="window.maSubmit()">Submit</button>
        </div>
      </div>

      <!-- Start Overlay -->
      <div class="ma-overlay" id="ma-start-overlay" style="display: flex;">
        <div class="ma-title" style="color: #F59E0B;">MATH<br>AVALANCHE</div>
        <div style="color: #ccc; font-weight: 500; font-size: 1.1rem; margin-bottom: 30px; padding: 0 20px;">
          Numbers and operators drop from the sky.<br><br>Tap them to build an equation that equals the TARGET NUMBER!
        </div>
        <button class="ma-btn-overlay" onclick="window.maStartGame()">START PANICKING</button>
      </div>

      <!-- Game Over Overlay -->
      <div class="ma-overlay" id="ma-overlay">
        <div class="ma-title">OVERFLOW</div>
        <div style="color: #aaa; font-weight: 700; margin-bottom: 5px;">FINAL SCORE</div>
        <div class="ma-final-score" id="ma-final-score-display">0</div>
        
        <button class="ma-btn-overlay" onclick="window.maRestart()">PLAY AGAIN</button>
        <button class="ma-btn-overlay" style="background: #10B981;" onclick="window.maCopyResult()">COPY RESULT</button>
        <button class="ma-btn-overlay" style="background: #333; color: #fff; box-shadow: none;" onclick="window.location.href='index.html'">BACK TO ARCADE</button>
      </div>
    </div>
  `;

  // --- CONFIG ---
  let SPAWN_RATE_MS = 1200;    
  const GRAVITY_RATE_MS = 150; 
  const COLS = 6;              
  const ROWS = 8;              
  
  const NUMBERS = ["1","2","3","4","5","6","7","8","9"];
  const OPERATORS = ["+", "-", "×", "÷"];

  // --- STATE ---
  let score = 0;
  let best = parseInt(localStorage.getItem('ma-best')) || 0;
  let grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
  let tiles = {}; 
  let selectedIds = [];
  let currentTarget = 0;
  let isGameOver = false;
  let spawnInterval, gravityInterval, difficultyInterval;

  // --- DOM ---
  const elBoard = document.getElementById('ma-board');
  const elScore = document.getElementById('ma-score');
  const elBest = document.getElementById('ma-best');
  const elEqBar = document.getElementById('ma-eq-bar');
  const elToast = document.getElementById('ma-toast');
  const elOverlay = document.getElementById('ma-overlay');
  const elTargetVal = document.getElementById('ma-target-val');

  elBest.innerText = best;

  // --- LOGIC ---
  function getRandomBlock() {
    // Count active operator and number blocks on the board
    let numCount = 0;
    let opCount = 0;
    Object.values(tiles).forEach(t => {
      if (t.type === 'op') opCount++;
      else numCount++;
    });

    // Enforce 45% operator ratio: if operators are below 45%, force an operator to drop!
    const totalTiles = numCount + opCount;
    let spawnOp = Math.random() < 0.45; // 45% baseline operator spawn rate
    if (totalTiles > 0 && (opCount / totalTiles) < 0.45) {
      spawnOp = true;
    }

    if (spawnOp) {
      // Dynamic operator pool: multiplication is unlocked immediately! Division unlocks at score 100.
      let activeOperators = ["+", "-", "×"];
      if (score >= 100) {
        activeOperators = ["+", "-", "×", "÷"];
      }
      return { type: 'op', val: activeOperators[Math.floor(Math.random() * activeOperators.length)] };
    } else {
      // Dynamic numbers pool: starts with 1-6 for easy target combos, expands to 1-9 at score 100
      let activeNumbers = ["1", "2", "3", "4", "5", "6"];
      if (score >= 100) {
        activeNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      }
      return { type: 'num', val: activeNumbers[Math.floor(Math.random() * activeNumbers.length)] };
    }
  }

  function generateTarget() {
    // Dynamic target brackets: starts at 1-20, expands to 5-60 at score 100
    let minTarget = 1;
    let maxTarget = 20;
    
    if (score >= 100) {
      minTarget = 5;
      maxTarget = 60;
    }

    currentTarget = Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget;
    
    // Animate target change
    elTargetVal.style.transform = 'scale(1.5)';
    elTargetVal.style.color = '#fff';
    setTimeout(() => {
      elTargetVal.style.transform = 'scale(1)';
      elTargetVal.style.color = '';
    }, 200);
    
    elTargetVal.innerText = currentTarget;
  }

  function showToast(msg, color = 'white') {
    elToast.innerText = msg;
    elToast.style.background = color;
    elToast.style.color = color === 'white' ? 'black' : 'white';
    elToast.style.opacity = '1';
    setTimeout(() => { elToast.style.opacity = '0'; }, 1200);
  }

  function renderTile(tile) {
    tile.el.style.transform = `translate(${tile.col * 100}%, ${tile.row * 100}%)`;
    if (tile.selected) tile.el.classList.add('selected');
    else tile.el.classList.remove('selected');
  }

  function spawnBlock() {
    if (isGameOver) return;
    
    const availableCols = [];
    for (let c = 0; c < COLS; c++) {
      if (grid[0][c] === null) availableCols.push(c);
    }
    
    if (availableCols.length === 0) {
      endGame();
      return;
    }

    const col = availableCols[Math.floor(Math.random() * availableCols.length)];
    const id = Math.random().toString(36).substr(2, 9);
    const block = getRandomBlock();
    
    const tileEl = document.createElement('div');
    tileEl.className = 'ma-tile' + (block.type === 'op' ? ' is-op' : '');
    tileEl.innerHTML = `<div class="ma-tile-inner">${block.val}</div>`;
    tileEl.dataset.id = id;
    
    tileEl.addEventListener('mousedown', () => toggleSelect(id));
    tileEl.addEventListener('touchstart', (e) => { e.preventDefault(); toggleSelect(id); });

    elBoard.appendChild(tileEl);
    
    const tile = { id, char: block.val, type: block.type, row: 0, col, selected: false, el: tileEl };
    tiles[id] = tile;
    grid[0][col] = id;
    
    renderTile(tile);
  }

  function applyGravity() {
    if (isGameOver) return;
    for (let r = ROWS - 2; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        const id = grid[r][c];
        if (id && grid[r+1][c] === null) {
          grid[r+1][c] = id;
          grid[r][c] = null;
          tiles[id].row = r + 1;
          renderTile(tiles[id]);
        }
      }
    }
  }

  function toggleSelect(id) {
    if (isGameOver) return;
    const tile = tiles[id];
    
    if (tile.selected) {
      // Must unselect from the end of the equation to maintain order
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
    updateEqBar();
  }

  function updateEqBar() {
    const eq = selectedIds.map(id => tiles[id].char).join(' ');
    elEqBar.innerText = eq;
  }

  window.maClear = function() {
    selectedIds.forEach(id => {
      tiles[id].selected = false;
      renderTile(tiles[id]);
    });
    selectedIds = [];
    updateEqBar();
  };

  window.maSubmit = function() {
    if (isGameOver || selectedIds.length === 0) return;
    
    // Build javascript math string
    let rawStr = selectedIds.map(id => tiles[id].char).join('');
    let mathStr = rawStr.replace(/×/g, '*').replace(/÷/g, '/');

    // Basic syntax validation
    // Avoid running eval on obviously bad syntax like "5++5" or ending in "*"
    if (/^[+*\/]/.test(mathStr) || /[+*\/-]$/.test(mathStr) || /[+*\/-]{2,}/.test(mathStr)) {
      showToast('Syntax Error!\nCheck your math symbols.', '#EF4444');
      window.maClear();
      return;
    }

    let result = null;
    try {
      result = eval(mathStr);
    } catch(e) {
      showToast('Syntax Error!', '#EF4444');
      window.maClear();
      return;
    }

    if (result === currentTarget) {
      // SUCCESS!
      let pts = selectedIds.length * 10;
      score += pts;
      elScore.innerText = score;
      
      const lastTile = tiles[selectedIds[selectedIds.length - 1]];
      if (lastTile) {
        const anim = document.createElement('div');
        anim.className = 'ma-points-anim';
        anim.innerText = `+${pts}`;
        anim.style.left = `${lastTile.col * (100/COLS)}%`;
        anim.style.top = `${lastTile.row * (100/ROWS)}%`;
        elBoard.appendChild(anim);
        setTimeout(() => anim.remove(), 1000);
      }
      
      showToast('PERFECT!', '#10B981');

      // Remove tiles
      selectedIds.forEach(id => {
        const t = tiles[id];
        grid[t.row][t.col] = null;
        t.el.remove();
        delete tiles[id];
      });
      
      selectedIds = [];
      updateEqBar();
      generateTarget(); // New Target!
      
    } else {
      showToast(`That equals ${result}!\nTarget is ${currentTarget}.`, '#EF4444');
      window.maClear();
    }
  };

  function endGame() {
    isGameOver = true;
    clearInterval(spawnInterval);
    clearInterval(gravityInterval);
    clearInterval(difficultyInterval);
    
    if (score > best) {
      best = score;
      localStorage.setItem('ma-best', best);
      elBest.innerText = best;
    }

    // Save to global leaderboard!
    if (window.saveScore && score > 0) {
      window.saveScore('Math Avalanche', score);
    }
    
    document.getElementById('ma-final-score-display').innerText = score;
    elOverlay.style.display = 'flex';
  }

  window.maRestart = function() {
    elOverlay.style.display = 'none';
    document.getElementById('ma-start-overlay').style.display = 'flex';
    
    Object.values(tiles).forEach(t => t.el.remove());
    grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    tiles = {};
    selectedIds = [];
    score = 0;
    SPAWN_RATE_MS = 1200;
    isGameOver = false;
    
    elScore.innerText = score;
    elTargetVal.innerText = '--';
    updateEqBar();
  };

  window.maStartGame = function() {
    document.getElementById('ma-start-overlay').style.display = 'none';
    generateTarget();
    
    spawnInterval = setInterval(spawnBlock, SPAWN_RATE_MS);
    gravityInterval = setInterval(applyGravity, GRAVITY_RATE_MS);
    
    difficultyInterval = setInterval(() => {
      if (SPAWN_RATE_MS > 400) {
        SPAWN_RATE_MS -= 60;
        clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnBlock, SPAWN_RATE_MS);
      }
    }, 15000);
  };

  window.maCopyResult = function() {
    const text = `Math Avalanche 🔢\nScore: ${score}\nCan you beat my score?\nhttps://quickplay-arcade.vercel.app`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  window.maRestart();
}
