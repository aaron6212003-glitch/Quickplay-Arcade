import { GRIDLOCK_DATA } from './gridlock-data.js';
import { CAP_ROOM_DATA } from './cap-room-data.js';

export function init(container) {
  // --- AUDIO SYNTHESIZER ---
  let audioCtx = null;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn("Web Audio API not supported");
  }

  function playSound(type) {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.33);
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, index) => {
          const noteOsc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(audioCtx.destination);
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, now + index * 0.1);
          noteGain.gain.setValueAtTime(0.04, now + index * 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.2);
          noteOsc.start(now + index * 0.1);
          noteOsc.stop(now + index * 0.1 + 0.22);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- STYLE INJECTION ---
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .gl-wrapper {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      padding: 12px;
      box-sizing: border-box;
      font-family: 'Outfit', sans-serif;
      color: #fff;
    }
    .gl-header {
      text-align: center;
      margin-bottom: 15px;
    }
    .gl-title {
      font-size: 2.2rem;
      font-weight: 900;
      margin: 0;
      background: linear-gradient(135deg, #F59E0B, #EF4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    .gl-subtitle {
      font-size: 0.88rem;
      color: #94a3b8;
      margin: 4px 0 0 0;
      font-weight: 600;
    }
    .gl-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .gl-grid-container {
      display: grid;
      grid-template-columns: 80px repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 18px;
    }
    .gl-cell-header {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 6px;
      font-size: 0.72rem;
      font-weight: 900;
      color: #94a3b8;
      text-transform: uppercase;
      box-sizing: border-box;
      min-height: 80px;
    }
    .gl-cell-empty {
      visibility: hidden;
    }
    .gl-cell-active {
      aspect-ratio: 1 / 1;
      background: rgba(30, 41, 59, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 6px;
      box-sizing: border-box;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .gl-cell-active:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: #F59E0B;
      transform: scale(1.02);
    }
    .gl-cell-active.solved {
      background: linear-gradient(135deg, #065f46, #022c22);
      border-color: #059669;
      cursor: default;
      transform: none;
    }
    .gl-cell-active.failed {
      border-color: #ef4444;
    }
    .gl-cell-name {
      font-size: 0.8rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .gl-cell-detail {
      font-size: 0.65rem;
      color: #34d399;
      font-weight: 700;
    }
    .gl-cell-rarity {
      position: absolute;
      bottom: 6px;
      right: 6px;
      font-size: 0.58rem;
      font-weight: 800;
      color: #94a3b8;
      background: rgba(0,0,0,0.3);
      padding: 1px 4px;
      border-radius: 4px;
    }
    .gl-attempts-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
      border-radius: 12px;
      padding: 10px;
      text-align: center;
      font-weight: 800;
      font-size: 0.9rem;
      margin-bottom: 15px;
    }
    .gl-attempts-banner.success {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.25);
      color: #a7f3d0;
    }
    /* Modal Search Overlay */
    .gl-modal {
      position: fixed;
      inset: 0;
      background: rgba(5,5,10,0.85);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .gl-modal-card {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 20px;
      width: 100%;
      max-width: 400px;
      position: relative;
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .gl-modal-title {
      font-size: 1.1rem;
      font-weight: 850;
      margin: 0 0 12px 0;
      color: #fff;
      text-align: center;
    }
    .gl-search-wrapper {
      position: relative;
      width: 100%;
    }
    .gl-search-input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 25px;
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      font-size: 0.95rem;
      box-sizing: border-box;
      outline: none;
      font-family: inherit;
    }
    .gl-search-input:focus {
      border-color: #F59E0B;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
    }
    .gl-dropdown {
      position: absolute;
      top: 50px;
      left: 0;
      right: 0;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 200;
      display: none;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
    }
    .gl-dropdown-item {
      padding: 10px 14px;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 700;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: all 0.15s;
    }
    .gl-dropdown-item:hover {
      background: #334155;
      color: #F59E0B;
    }
    .gl-results-card {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 24px 20px;
      text-align: center;
      animation: popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .btn-gl {
      padding: 10px 18px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      color: #fff;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-gl:hover:not(:disabled) {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.3);
    }
    .btn-gl.primary {
      background: #F59E0B;
      color: #fff;
      border-color: #F59E0B;
    }
    .btn-gl.primary:hover:not(:disabled) {
      background: #d97706;
    }
    .gl-league-btn {
      width: 100%;
      padding: 14px 20px;
      border-radius: 14px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: white;
      font-size: 1.05rem;
      font-weight: 800;
      cursor: pointer;
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }
    .gl-league-btn:hover {
      background: rgba(245, 158, 11, 0.08);
      border-color: #F59E0B;
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(styleEl);

  // --- GAME STATE ---
  let selectedLeagueKey = null;
  let attemptsLeft = 9;
  let timeSeconds = 0;
  let timerInterval = null;
  let isGameOver = false;

  // Grid answers matrix (3x3 array)
  // Store objects: { solved: boolean, playerGuess: string, rarity: number }
  let gridState = Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({
    solved: false,
    playerGuess: "",
    rarity: 0
  })));

  // Autocomplete cache list
  let activeAutocompleteList = [];

  // --- SCREEN ROUTING ---
  function showScreen(screen) {
    if (screen === 'select-league') {
      renderLeagueSelection();
    } else if (screen === 'gameplay') {
      renderGameplay();
    } else if (screen === 'results') {
      renderResults();
    }
  }

  // --- SCREEN 1: LEAGUE SELECTION ---
  function renderLeagueSelection() {
    container.innerHTML = '';
    
    const wrap = document.createElement('div');
    wrap.className = 'gl-wrapper';

    // Header
    const header = document.createElement('div');
    header.className = 'gl-header';
    header.innerHTML = `
      <h2 class="gl-title">Gridlock</h2>
      <p class="gl-subtitle">Daily Sports Grid Challenge</p>
    `;
    wrap.appendChild(header);

    const selectionCard = document.createElement('div');
    selectionCard.className = 'gl-results-card';
    selectionCard.innerHTML = `
      <div style="font-size:0.9rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:18px; text-align:center;">Select Your Sport</div>
    `;

    const leagueList = document.createElement('div');
    leagueList.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

    const leagues = [
      { key: "nba", label: "🏀 NBA Basketball", desc: "Lakers, Celtics, Warriors & Stars" },
      { key: "nfl", label: "🏈 NFL Football", desc: "Chiefs, 49ers, Patriots & Legends" },
      { key: "nhl", label: "🏒 NHL Hockey", desc: "Penguins, Oilers, Rangers & MVPs" }
    ];

    leagues.forEach(l => {
      const btn = document.createElement('button');
      btn.className = 'gl-league-btn';
      btn.innerHTML = `
        <div>
          <div style="font-weight:800; font-size:1.05rem;">${l.label}</div>
          <div style="font-size:0.75rem; color:#94a3b8; font-weight:600; margin-top:2px;">${l.desc}</div>
        </div>
        <span style="font-size:1.1rem;">➔</span>
      `;
      btn.addEventListener('click', () => {
        playSound('click');
        selectedLeagueKey = l.key;
        initGame();
      });
      leagueList.appendChild(btn);
    });

    selectionCard.appendChild(leagueList);
    wrap.appendChild(selectionCard);
    container.appendChild(wrap);
  }

  // --- INITIALIZE GAME STATE ---
  function initGame() {
    attemptsLeft = 9;
    gridState = Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({
      solved: false,
      playerGuess: "",
      rarity: 0
    })));
    isGameOver = false;

    // Load autocomplete list from gridlock-data and cap-room-data
    const leagueData = GRIDLOCK_DATA[selectedLeagueKey];
    const capRoomPlayers = (CAP_ROOM_DATA[selectedLeagueKey]?.players || []).map(p => p.name);
    
    // Combine lists and deduplicate
    const combinedSet = new Set([...leagueData.allPlayers, ...capRoomPlayers]);
    activeAutocompleteList = Array.from(combinedSet).sort();

    showScreen('gameplay');
  }

  // --- SCREEN 2: GAMEPLAY SCREEN ---
  function renderGameplay() {
    container.innerHTML = '';
    const lData = GRIDLOCK_DATA[selectedLeagueKey];

    // Start timer
    timeSeconds = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeSeconds++;
      const timerEl = document.getElementById('gl-timer');
      if (timerEl) {
        timerEl.innerText = formatTime(timeSeconds);
      }
    }, 1000);

    const wrap = document.createElement('div');
    wrap.className = 'gl-wrapper';

    // Header
    const header = document.createElement('div');
    header.className = 'gl-header';
    header.innerHTML = `
      <h2 class="gl-title">Gridlock</h2>
      <p class="gl-subtitle">${lData.name} Grid</p>
    `;
    wrap.appendChild(header);

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'gl-status-bar';
    statusBar.innerHTML = `
      <div>Guesses: <span style="color:#F59E0B;" id="gl-attempts">${attemptsLeft} Left</span></div>
      <div>Time: <span id="gl-timer">00:00</span></div>
    `;
    wrap.appendChild(statusBar);

    // Attempts Banner Alert
    const banner = document.createElement('div');
    banner.className = 'gl-attempts-banner';
    banner.id = 'gl-attempts-banner';
    banner.innerText = `🔥 You have ${attemptsLeft} attempts to fill all 9 cells. Choose wisely!`;
    wrap.appendChild(banner);

    // Grid Element
    const gridGrid = document.createElement('div');
    gridGrid.className = 'gl-grid-container';
    gridGrid.id = 'gl-grid-container';
    wrap.appendChild(gridGrid);

    // Give Up / Lobby actions
    const footerActions = document.createElement('div');
    footerActions.style.cssText = 'display:flex; gap:10px; margin-top:10px;';

    const btnConcede = document.createElement('button');
    btnConcede.className = 'btn-gl';
    btnConcede.style.flex = '1';
    btnConcede.innerText = '🏳️ CONCEDE / SHOW SUMMARY';
    btnConcede.addEventListener('click', () => {
      playSound('click');
      handleGameOver(false);
    });
    footerActions.appendChild(btnConcede);

    wrap.appendChild(footerActions);
    container.appendChild(wrap);

    updateGrid();
  }

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- REDRAW THE GRID ---
  function updateGrid() {
    const gridEl = document.getElementById('gl-grid-container');
    if (!gridEl) return;

    gridEl.innerHTML = '';
    const lData = GRIDLOCK_DATA[selectedLeagueKey];

    // 1. Column Headers (Top Row)
    // First cell is empty top-left
    const emptyCell = document.createElement('div');
    emptyCell.className = 'gl-cell-header gl-cell-empty';
    gridEl.appendChild(emptyCell);

    lData.cols.forEach(col => {
      const colCell = document.createElement('div');
      colCell.className = 'gl-cell-header';
      colCell.innerText = col.label;
      gridEl.appendChild(colCell);
    });

    // 2. Rows (Row Header + 3 Active Cells)
    for (let r = 0; r < 3; r++) {
      // Row Header
      const rowHeader = document.createElement('div');
      rowHeader.className = 'gl-cell-header';
      rowHeader.innerText = lData.rows[r].label;
      gridEl.appendChild(rowHeader);

      // 3 Cells
      for (let c = 0; c < 3; c++) {
        const cellState = gridState[r][c];
        const cell = document.createElement('div');
        cell.className = 'gl-cell-active';

        if (cellState.solved) {
          cell.classList.add('solved');
          cell.innerHTML = `
            <div class="gl-cell-name">${cellState.playerGuess}</div>
            <div class="gl-cell-detail">✔️ Match</div>
            <div class="gl-cell-rarity">${cellState.rarity}% rarity</div>
          `;
        } else {
          cell.innerHTML = `<span style="font-size:1.3rem; color:rgba(255,255,255,0.12);">❓</span>`;
          if (attemptsLeft > 0 && !isGameOver) {
            cell.addEventListener('click', () => {
              playSound('click');
              openSearchModal(r, c);
            });
          }
        }

        gridEl.appendChild(cell);
      }
    }

    // Update Banner
    const bannerEl = document.getElementById('gl-attempts-banner');
    if (bannerEl) {
      if (attemptsLeft === 0) {
        bannerEl.innerText = "❌ No attempts left! Game Over.";
        bannerEl.classList.add('spent');
      } else {
        bannerEl.innerText = `🔥 You have ${attemptsLeft} attempts remaining.`;
      }
    }

    const attemptsEl = document.getElementById('gl-attempts');
    if (attemptsEl) {
      attemptsEl.innerText = `${attemptsLeft} Left`;
    }
  }

  // --- OPEN SEARCH MODAL ---
  function openSearchModal(rowIdx, colIdx) {
    const existing = document.getElementById('gl-search-modal');
    if (existing) existing.remove();

    const lData = GRIDLOCK_DATA[selectedLeagueKey];
    const rowName = lData.rows[rowIdx].label;
    const colName = lData.cols[colIdx].label;

    const modal = document.createElement('div');
    modal.id = 'gl-search-modal';
    modal.className = 'gl-modal';

    const card = document.createElement('div');
    card.className = 'gl-modal-card';
    card.innerHTML = `
      <h3 class="gl-modal-title">Guess Player for:<br><span style="color:#F59E0B;">${rowName}</span> ✕ <span style="color:#38bdf8;">${colName}</span></h3>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.06); border: none; color: #94a3b8; font-size: 14px;
      font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center;
    `;
    closeBtn.addEventListener('click', () => {
      playSound('click');
      modal.remove();
    });
    card.appendChild(closeBtn);

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'gl-search-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'gl-search-input';
    input.placeholder = 'Search player name...';
    input.autocomplete = 'off';

    const dropdown = document.createElement('div');
    dropdown.className = 'gl-dropdown';

    searchWrapper.appendChild(input);
    searchWrapper.appendChild(dropdown);
    card.appendChild(searchWrapper);
    modal.appendChild(card);
    container.appendChild(modal);

    input.focus();

    // Suggestion Autocomplete
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      dropdown.innerHTML = '';
      if (!q) {
        dropdown.style.display = 'none';
        return;
      }

      const matches = activeAutocompleteList.filter(name => name.toLowerCase().includes(q));
      if (matches.length > 0) {
        matches.slice(0, 10).forEach(name => {
          const item = document.createElement('div');
          item.className = 'gl-dropdown-item';
          item.innerText = name;
          item.addEventListener('click', () => {
            modal.remove();
            submitGuess(rowIdx, colIdx, name);
          });
          dropdown.appendChild(item);
        });
        dropdown.style.display = 'block';
      } else {
        dropdown.innerHTML = `<div style="padding:10px; color:#64748b; text-align:center; font-weight:700;">No players found</div>`;
        dropdown.style.display = 'block';
      }
    });

    // Close on click outside card
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        playSound('click');
        modal.remove();
      }
    });
  }

  // --- SUBMIT GUESS VALIDATION ---
  function submitGuess(rowIdx, colIdx, playerName) {
    if (isGameOver || attemptsLeft <= 0) return;

    const lData = GRIDLOCK_DATA[selectedLeagueKey];
    const cellId = `${lData.rows[rowIdx].id}_${lData.cols[colIdx].id}`;
    const validSolutions = lData.solutions[cellId] || [];

    // Case-insensitive match check
    const isCorrect = validSolutions.some(sol => sol.toLowerCase() === playerName.toLowerCase());

    if (isCorrect) {
      // Retrieve overall rating for rarity score calculation
      let rating = 80; // default fallback
      
      // Look up player details in CAP_ROOM_DATA
      const playersPool = CAP_ROOM_DATA[selectedLeagueKey]?.players || [];
      const dbPlayer = playersPool.find(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (dbPlayer) {
        rating = dbPlayer.rating;
      }

      // Mock Rarity Score: elite/99 rated players are guessed by everyone (high rarity percentage),
      // role players have lower ratings and thus a lower rarity percentage!
      // Formula: 100 - rating. E.g. Connor McDavid (98 OVR) -> 2% rarity score.
      const mockRarity = Math.max(1, Math.min(99, Math.floor(100 - rating)));

      gridState[rowIdx][colIdx] = {
        solved: true,
        playerGuess: playerName,
        rarity: mockRarity
      };

      playSound('success');
      attemptsLeft--;
      updateGrid();

      // Check win condition (all 9 solved)
      const allSolved = gridState.every(row => row.every(cell => cell.solved));
      if (allSolved) {
        handleGameOver(true);
      } else if (attemptsLeft <= 0) {
        handleGameOver(false);
      }
    } else {
      // Incorrect
      playSound('fail');
      attemptsLeft--;
      updateGrid();

      // Animate shake on cell
      const cells = document.querySelectorAll('.gl-grid-container .gl-cell-active');
      // Calculate correct flat cell index: row label cell + col cells
      // flat grid is 4 columns wide
      const targetFlatIndex = (rowIdx + 1) * 4 + (colIdx + 1);
      const targetCell = cells[targetFlatIndex - 4]; // adjust offset
      
      if (targetCell) {
        targetCell.classList.add('failed');
        targetCell.classList.add('shake');
        targetCell.addEventListener('animationend', () => {
          targetCell.classList.remove('shake');
          targetCell.classList.remove('failed');
        });
      }

      if (attemptsLeft <= 0) {
        handleGameOver(false);
      }
    }
  }

  // --- GAME OVER ---
  function handleGameOver(isWin) {
    isGameOver = true;
    clearInterval(timerInterval);

    if (isWin) {
      playSound('win');
    } else {
      playSound('fail');
    }

    setTimeout(() => {
      showScreen('results');
    }, 1500);
  }

  // --- RESULTS SCREEN ---
  function renderResults() {
    container.innerHTML = '';
    const lData = GRIDLOCK_DATA[selectedLeagueKey];

    const wrap = document.createElement('div');
    wrap.className = 'gl-wrapper';

    const header = document.createElement('div');
    header.className = 'gl-header';
    header.innerHTML = `
      <h2 class="gl-title">Gridlock</h2>
      <p class="gl-subtitle">${lData.name} Results</p>
    `;
    wrap.appendChild(header);

    const card = document.createElement('div');
    card.className = 'gl-results-card';

    // Solved count
    let solvedCount = 0;
    let totalRarity = 0;
    gridState.forEach(row => row.forEach(c => {
      if (c.solved) {
        solvedCount++;
        totalRarity += c.rarity;
      }
    }));

    const avgRarity = solvedCount > 0 ? (totalRarity / solvedCount).toFixed(1) : "0.0";

    const resultTitle = document.createElement('h3');
    resultTitle.style.fontSize = '1.6rem';
    resultTitle.style.fontWeight = '900';
    resultTitle.style.margin = '0 0 10px 0';
    resultTitle.style.color = solvedCount === 9 ? '#22c55e' : '#f59e0b';
    resultTitle.innerText = solvedCount === 9 ? '🏆 PERFECT GRID!' : `${solvedCount} / 9 Solved`;
    card.appendChild(resultTitle);

    const scoreStat = document.createElement('p');
    scoreStat.style.margin = '5px 0';
    scoreStat.style.fontWeight = '800';
    scoreStat.style.fontSize = '1.1rem';
    scoreStat.innerHTML = `Score: <span style="color:#eab308;">${solvedCount * 1000} pts</span>`;
    card.appendChild(scoreStat);

    const statsDetail = document.createElement('div');
    statsDetail.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:10px; margin: 15px 0; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px; font-size:0.88rem; font-weight:700;';
    statsDetail.innerHTML = `
      <div>Time Taken: <span style="color:#38bdf8;">${formatTime(timeSeconds)}</span></div>
      <div>Avg Rarity: <span style="color:#059669;">${avgRarity}%</span></div>
    `;
    card.appendChild(statsDetail);

    // Save Daily score if perfect or high score
    if (isDailyMode && window.saveScore && solvedCount > 0) {
      // Score calculation: higher solved, lower rarity, faster time
      const finalScore = (solvedCount * 10000) + (attemptsLeft * 1000) - Math.min(3000, timeSeconds * 2);
      const user = auth.currentUser;
      const uid = user ? user.uid : 'guest';
      const timestamp = Date.now();
      const signature = generateScoreSignature(uid, 'Gridlock', finalScore, timestamp);
      window.saveScore('Gridlock', finalScore, signature, timestamp);
    }

    // Generate Emoji Grid sharing string
    let emojiText = '';
    gridState.forEach(row => {
      row.forEach(cell => {
        emojiText += cell.solved ? '🟩' : '🟥';
      });
      emojiText += '\n';
    });

    const emojiBox = document.createElement('pre');
    emojiBox.className = 'emoji-grid-box';
    emojiBox.innerText = emojiText;
    card.appendChild(emojiBox);

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn-gl primary';
    shareBtn.style.width = '100%';
    shareBtn.style.padding = '12px 20px';
    shareBtn.style.borderRadius = '24px';
    shareBtn.style.fontSize = '0.95rem';
    shareBtn.style.margin = '10px 0';
    shareBtn.innerText = '🔗 SHARE GRID RESULTS';
    shareBtn.addEventListener('click', () => {
      playSound('click');
      const shareStr = `🎮 PlayHaus Gridlock - ${lData.name}\nScore: ${solvedCount}/9 cells\nAvg Rarity: ${avgRarity}%\nTime: ${formatTime(timeSeconds)}\n\n${emojiText}https://playhaus.fun`;
      navigator.clipboard.writeText(shareStr).then(() => {
        showToast("📋 Grid copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy results", err);
      });
    });
    card.appendChild(shareBtn);

    // Toast Alert
    function showToast(message) {
      const existing = document.getElementById('gl-results-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'gl-results-toast';
      toast.className = 'll-toast';
      toast.innerText = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }

    // Extra actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexDirection = 'column';
    actions.style.gap = '8px';
    actions.style.marginTop = '15px';

    const btnReplay = document.createElement('button');
    btnReplay.className = 'btn-gl';
    btnReplay.innerText = '🔄 PLAY ANOTHER SPORT';
    btnReplay.addEventListener('click', () => {
      playSound('click');
      showScreen('select-league');
    });
    actions.appendChild(btnReplay);

    const btnLobby = document.createElement('button');
    btnLobby.className = 'btn-gl';
    btnLobby.innerText = '🏠 BACK TO LOBBY';
    btnLobby.addEventListener('click', () => {
      playSound('click');
      window.location.href = 'index.html';
    });
    actions.appendChild(btnLobby);

    card.appendChild(actions);
    wrap.appendChild(card);
    container.appendChild(wrap);
  }

  // --- START ENTRY ---
  showScreen('select-league');
}
