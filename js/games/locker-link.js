import { LOCKER_LINK_DATA } from './locker-link-data.js';

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
      } else if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'success') {
        // High double-tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'fail') {
        // Low buzzer
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.27);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'win') {
        // Chime arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const noteOsc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(audioCtx.destination);
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, now + index * 0.08);
          noteGain.gain.setValueAtTime(0.04, now + index * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.18);
          noteOsc.start(now + index * 0.08);
          noteOsc.stop(now + index * 0.08 + 0.2);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- STYLE INJECTION ---
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .ll-wrapper {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      padding: 12px;
      box-sizing: border-box;
      font-family: 'Outfit', sans-serif;
      color: #fff;
    }
    .ll-header {
      text-align: center;
      margin-bottom: 15px;
    }
    .ll-title {
      font-size: 2rem;
      font-weight: 900;
      margin: 0;
      background: linear-gradient(135deg, #38BDF8, #818CF8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    .ll-subtitle {
      font-size: 0.88rem;
      color: #94a3b8;
      margin: 4px 0 0 0;
      font-weight: 600;
    }
    .ll-status-bar {
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
    .ll-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      margin-bottom: 16px;
    }
    .ll-tile {
      aspect-ratio: 1 / 1;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 6px;
      box-sizing: border-box;
      font-size: 0.78rem;
      font-weight: 800;
      color: #cbd5e1;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    }
    .ll-tile:hover {
      background: #334155;
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    .ll-tile.selected {
      background: #3b82f6;
      border-color: #60a5fa;
      color: #fff;
      transform: scale(0.96);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
    }
    .ll-tile.solved {
      display: none;
    }
    .ll-banner {
      grid-column: span 4;
      border-radius: 12px;
      padding: 12px 8px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      animation: bannerPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .ll-banner.easy { background: #eab308; color: #1e293b; } /* Yellow */
    .ll-banner.medium { background: #22c55e; color: #fff; } /* Green */
    .ll-banner.hard { background: #3b82f6; color: #fff; } /* Blue */
    .ll-banner.expert { background: #a855f7; color: #fff; } /* Purple */
    
    .ll-banner-title {
      font-size: 0.95rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ll-banner-items {
      font-size: 0.8rem;
      font-weight: 700;
      margin-top: 3px;
      opacity: 0.9;
    }
    @keyframes bannerPop {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .ll-mistakes-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .ll-mistake-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e2e8f0;
      transition: all 0.3s ease;
      box-shadow: 0 0 4px rgba(255,255,255,0.1);
    }
    .ll-mistake-dot.spent {
      background: #475569;
      transform: scale(0.8);
      box-shadow: none;
    }
    .ll-actions {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .btn-ll {
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
    .btn-ll:hover:not(:disabled) {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.3);
    }
    .btn-ll.primary {
      background: #fff;
      color: #0f172a;
      border-color: #fff;
    }
    .btn-ll.primary:hover:not(:disabled) {
      background: #e2e8f0;
    }
    .btn-ll:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .ll-results-card {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 24px 20px;
      text-align: center;
      animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes popIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .emoji-grid-box {
      background: rgba(0,0,0,0.25);
      border-radius: 12px;
      padding: 12px;
      font-size: 1.1rem;
      line-height: 1.4;
      letter-spacing: 2px;
      display: inline-block;
      margin: 15px 0;
      font-family: monospace;
    }
    .shake {
      animation: shakeAnim 0.35s ease;
    }
    @keyframes shakeAnim {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .ll-toast {
      position: fixed;
      top: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      padding: 10px 20px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 0.85rem;
      z-index: 3000;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      animation: toastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes toastSlide {
      from { top: -20px; opacity: 0; }
      to { top: 25px; opacity: 1; }
    }
    .toast-shake {
      animation: shakeAnim 0.35s ease;
    }
  `;
  document.head.appendChild(styleEl);

  // --- GAME STATE VARIABLES ---
  const isDailyMode = !window.isPracticeMode;
  let puzzleCategories = [];
  let boardItems = []; // List of objects: { text: "Item", categoryIndex: X }
  let selectedIndices = []; // Indices in boardItems
  let solvedCategories = []; // List of solved category objects
  let mistakesMade = 0;
  const maxMistakes = 4;
  let timeSeconds = 0;
  let timerInterval = null;
  let isGameOver = false;
  let guessLog = []; // Record of guesses for the grid result sharing

  // --- TOAST HELPER ---
  function showToast(message, isAlert = false) {
    const existing = document.getElementById('ll-active-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'll-active-toast';
    toast.className = 'll-toast' + (isAlert ? ' toast-shake' : '');
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // --- DATE PUZZLE SEED ---
  function getPuzzleDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // --- INITIALIZATION ---
  function loadPuzzle() {
    if (isDailyMode) {
      const dateKey = getPuzzleDateKey();
      // Try to load today's daily puzzle. Fall back to the 2026-06-11 puzzle if not found.
      puzzleCategories = LOCKER_LINK_DATA.dailyPuzzles[dateKey] || LOCKER_LINK_DATA.dailyPuzzles["2026-06-11"];
    } else {
      // Pick a random practice board
      const pool = LOCKER_LINK_DATA.practicePool;
      const randIdx = Math.floor(Math.random() * pool.length);
      puzzleCategories = pool[randIdx];
    }

    // Flatten all items
    boardItems = [];
    puzzleCategories.forEach((cat, catIdx) => {
      cat.items.forEach(itemText => {
        boardItems.push({
          text: itemText,
          categoryIndex: catIdx,
          solved: false
        });
      });
    });

    shuffleBoard();
  }

  function shuffleBoard() {
    // Collect unsolved items
    const unsolved = boardItems.filter(item => !item.solved);
    // Shuffle them
    for (let i = unsolved.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unsolved[i], unsolved[j]] = [unsolved[j], unsolved[i]];
    }
    
    // Map them back into boardItems replacing the unsolved positions
    let uIdx = 0;
    boardItems = boardItems.map(item => {
      if (item.solved) return item;
      return unsolved[uIdx++];
    });

    selectedIndices = [];
  }

  // --- RENDER MAIN LAYOUT ---
  function renderMain() {
    container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'll-wrapper';

    // Header
    const header = document.createElement('div');
    header.className = 'll-header';
    header.innerHTML = `
      <h2 class="ll-title">Locker Link</h2>
      <p class="ll-subtitle">${isDailyMode ? 'Daily Sports Connections' : 'Practice Connections'}</p>
    `;
    wrap.appendChild(header);

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'll-status-bar';
    statusBar.innerHTML = `
      <div>Mode: <span style="color:#38bdf8;">${isDailyMode ? 'Daily' : 'Practice'}</span></div>
      <div>Time: <span id="ll-timer">00:00</span></div>
    `;
    wrap.appendChild(statusBar);

    // Grid Container
    const grid = document.createElement('div');
    grid.className = 'll-grid';
    grid.id = 'll-grid-element';
    wrap.appendChild(grid);

    // Mistakes panel
    const mistakesPanel = document.createElement('div');
    mistakesPanel.style.textAlign = 'center';
    mistakesPanel.style.marginBottom = '6px';
    mistakesPanel.style.fontSize = '0.82rem';
    mistakesPanel.style.fontWeight = '700';
    mistakesPanel.style.color = '#94a3b8';
    mistakesPanel.innerText = 'Mistakes remaining:';
    wrap.appendChild(mistakesPanel);

    const mistakesDots = document.createElement('div');
    mistakesDots.className = 'll-mistakes-container';
    mistakesDots.id = 'll-mistakes-dots';
    wrap.appendChild(mistakesDots);

    // Actions panel
    const actions = document.createElement('div');
    actions.className = 'll-actions';
    
    const btnShuffle = document.createElement('button');
    btnShuffle.className = 'btn-ll';
    btnShuffle.innerText = 'Shuffle';
    btnShuffle.addEventListener('click', () => {
      playSound('click');
      shuffleBoard();
      updateGrid();
    });
    actions.appendChild(btnShuffle);

    const btnDeselect = document.createElement('button');
    btnDeselect.className = 'btn-ll';
    btnDeselect.innerText = 'Deselect All';
    btnDeselect.id = 'btn-ll-deselect';
    btnDeselect.addEventListener('click', () => {
      playSound('click');
      selectedIndices = [];
      updateGrid();
    });
    actions.appendChild(btnDeselect);

    const btnSubmit = document.createElement('button');
    btnSubmit.className = 'btn-ll primary';
    btnSubmit.innerText = 'Submit';
    btnSubmit.id = 'btn-ll-submit';
    btnSubmit.addEventListener('click', () => {
      handleSubmit();
    });
    actions.appendChild(btnSubmit);

    wrap.appendChild(actions);
    container.appendChild(wrap);

    // Start Timer
    timeSeconds = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeSeconds++;
      const timerEl = document.getElementById('ll-timer');
      if (timerEl) {
        timerEl.innerText = formatTime(timeSeconds);
      }
    }, 1000);

    // Check Daily completion
    if (isDailyMode) {
      const savedResult = localStorage.getItem(`playhaus_lockerlink_daily_${getPuzzleDateKey()}`);
      if (savedResult) {
        // Already completed today! Skip straight to results
        isGameOver = true;
        clearInterval(timerInterval);
        const data = JSON.parse(savedResult);
        renderResults(data.solved, data.time, data.mistakes, data.guessLog);
        return;
      }
    }

    updateGrid();
  }

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- UPDATE GRID RENDERING ---
  function updateGrid() {
    const gridEl = document.getElementById('ll-grid-element');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    // 1. Render Solved Banners first
    solvedCategories.forEach(cat => {
      const banner = document.createElement('div');
      banner.className = `ll-banner ${cat.difficulty}`;
      banner.innerHTML = `
        <div class="ll-banner-title">${cat.title}</div>
        <div class="ll-banner-items">${cat.items.join(', ')}</div>
      `;
      gridEl.appendChild(banner);
    });

    // 2. Render remaining active items
    boardItems.forEach((item, idx) => {
      if (item.solved) return;

      const tile = document.createElement('div');
      tile.className = 'll-tile';
      tile.innerText = item.text;

      // Handle selection
      const isSelected = selectedIndices.includes(idx);
      if (isSelected) {
        tile.classList.add('selected');
      }

      tile.addEventListener('click', () => {
        if (isGameOver) return;
        playSound('select');
        
        if (isSelected) {
          selectedIndices = selectedIndices.filter(i => i !== idx);
        } else {
          if (selectedIndices.length < 4) {
            selectedIndices.push(idx);
          } else {
            // Replace the oldest selection
            selectedIndices.shift();
            selectedIndices.push(idx);
          }
        }
        updateGrid();
      });

      gridEl.appendChild(tile);
    });

    // Enable/disable buttons based on active selections
    const btnSubmit = document.getElementById('btn-ll-submit');
    const btnDeselect = document.getElementById('btn-ll-deselect');

    if (btnSubmit) btnSubmit.disabled = (selectedIndices.length !== 4);
    if (btnDeselect) btnDeselect.disabled = (selectedIndices.length === 0);

    // Update Mistakes Dots
    const dotsEl = document.getElementById('ll-mistakes-dots');
    if (dotsEl) {
      dotsEl.innerHTML = '';
      for (let i = 0; i < maxMistakes; i++) {
        const dot = document.createElement('div');
        dot.className = 'll-mistake-dot' + (i < mistakesMade ? ' spent' : '');
        dotsEl.appendChild(dot);
      }
    }
  }

  // --- SUBMIT GUESS ---
  function handleSubmit() {
    if (selectedIndices.length !== 4 || isGameOver) return;

    const selectedItems = selectedIndices.map(idx => boardItems[idx]);
    const firstCatIdx = selectedItems[0].categoryIndex;
    const isCorrect = selectedItems.every(item => item.categoryIndex === firstCatIdx);

    // Log the guess for category colors sharing
    guessLog.push(selectedItems.map(item => item.categoryIndex));

    if (isCorrect) {
      // Mark as solved
      selectedIndices.forEach(idx => {
        boardItems[idx].solved = true;
      });

      const matchedCat = puzzleCategories[firstCatIdx];
      solvedCategories.push(matchedCat);

      playSound('success');
      showToast(`Correct: ${matchedCat.title}!`);

      selectedIndices = [];
      updateGrid();

      // Check win condition
      if (solvedCategories.length === 4) {
        handleGameOver(true);
      }
    } else {
      // Incorrect guess
      playSound('fail');
      mistakesMade++;
      
      // Animate shake on selected items
      const tiles = document.querySelectorAll('.ll-tile.selected');
      tiles.forEach(tile => {
        tile.classList.add('shake');
        tile.addEventListener('animationend', () => {
          tile.classList.remove('shake');
        });
      });

      // Check if "One Away"
      const categoryCounts = {};
      selectedItems.forEach(item => {
        categoryCounts[item.categoryIndex] = (categoryCounts[item.categoryIndex] || 0) + 1;
      });
      const maxMatches = Math.max(...Object.values(categoryCounts));

      if (maxMatches === 3) {
        showToast("One away!", true);
      } else {
        showToast("Incorrect category match!", true);
      }

      updateGrid();

      // Check loss condition
      if (mistakesMade >= maxMistakes) {
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
      setTimeout(() => {
        // Save daily puzzle completion
        if (isDailyMode) {
          localStorage.setItem(`playhaus_lockerlink_daily_${getPuzzleDateKey()}`, JSON.stringify({
            solved: true,
            time: timeSeconds,
            mistakes: mistakesMade,
            guessLog: guessLog
          }));
        }
        renderResults(true, timeSeconds, mistakesMade, guessLog);
      }, 1200);
    } else {
      // Reveal remaining categories one by one
      let revealDelay = 600;
      puzzleCategories.forEach((cat, catIdx) => {
        const alreadySolved = solvedCategories.some(sc => sc.title === cat.title);
        if (!alreadySolved) {
          setTimeout(() => {
            solvedCategories.push(cat);
            boardItems.forEach(item => {
              if (item.categoryIndex === catIdx) item.solved = true;
            });
            updateGrid();
            playSound('select');
          }, revealDelay);
          revealDelay += 1000;
        }
      });

      setTimeout(() => {
        if (isDailyMode) {
          localStorage.setItem(`playhaus_lockerlink_daily_${getPuzzleDateKey()}`, JSON.stringify({
            solved: false,
            time: timeSeconds,
            mistakes: mistakesMade,
            guessLog: guessLog
          }));
        }
        renderResults(false, timeSeconds, mistakesMade, guessLog);
      }, revealDelay + 1000);
    }
  }

  // --- RESULTS SCREEN ---
  function renderResults(isWin, totalTime, mistakes, finalGuessLog) {
    container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'll-wrapper';

    const header = document.createElement('div');
    header.className = 'll-header';
    header.innerHTML = `
      <h2 class="ll-title">Locker Link</h2>
      <p class="ll-subtitle">${isDailyMode ? 'Daily Challenge' : 'Practice Challenge'}</p>
    `;
    wrap.appendChild(header);

    const card = document.createElement('div');
    card.className = 'll-results-card';

    const resultTitle = document.createElement('h3');
    resultTitle.style.fontSize = '1.6rem';
    resultTitle.style.fontWeight = '900';
    resultTitle.style.margin = '0 0 10px 0';
    resultTitle.style.color = isWin ? '#22c55e' : '#ef4444';
    resultTitle.innerText = isWin ? '🏆 PUZZLE SOLVED!' : 'Game Over';
    card.appendChild(resultTitle);

    const timeStat = document.createElement('p');
    timeStat.style.margin = '5px 0';
    timeStat.style.fontWeight = '700';
    timeStat.style.fontSize = '1.05rem';
    timeStat.innerHTML = `Time Taken: <span style="color:#38bdf8;">${formatTime(totalTime)}</span>`;
    card.appendChild(timeStat);

    const mistakesStat = document.createElement('p');
    mistakesStat.style.margin = '5px 0';
    mistakesStat.style.fontWeight = '700';
    mistakesStat.style.fontSize = '1.05rem';
    mistakesStat.innerHTML = `Mistakes Made: <span style="color:#f43f5e;">${mistakes} / ${maxMistakes}</span>`;
    card.appendChild(mistakesStat);

    // Save score if logged in and in daily mode
    if (isWin && isDailyMode && window.saveScore) {
      // score is based on mistakes and time
      const scoreVal = 10000 - (mistakes * 1500) - Math.min(4000, totalTime * 3);
      const user = auth.currentUser;
      const uid = user ? user.uid : 'guest';
      const timestamp = Date.now();
      const signature = generateScoreSignature(uid, 'Locker Link', scoreVal, timestamp);
      window.saveScore('Locker Link', scoreVal, signature, timestamp);
    }

    // Generate Emoji Grid for sharing
    // Yellow, Green, Blue, Purple
    const emojiMap = { 0: '🟨', 1: '🟩', 2: '🟦', 3: '🟪' };
    let emojiText = '';
    finalGuessLog.forEach(row => {
      row.forEach(catIdx => {
        emojiText += emojiMap[catIdx] || '⬜';
      });
      emojiText += '\n';
    });

    if (emojiText) {
      const emojiBox = document.createElement('pre');
      emojiBox.className = 'emoji-grid-box';
      emojiBox.innerText = emojiText;
      card.appendChild(emojiBox);
    }

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn-ll primary';
    shareBtn.style.width = '100%';
    shareBtn.style.padding = '12px 20px';
    shareBtn.style.borderRadius = '24px';
    shareBtn.style.fontSize = '0.95rem';
    shareBtn.style.margin = '10px 0';
    shareBtn.innerText = '🔗 SHARE RESULTS';
    shareBtn.addEventListener('click', () => {
      playSound('click');
      const shareStr = `🎮 PlayHaus Locker Link - ${isDailyMode ? 'Daily' : 'Practice'}\nTime: ${formatTime(totalTime)}\nMistakes: ${mistakes}/${maxMistakes}\n\n${emojiText}https://playhaus.fun`;
      navigator.clipboard.writeText(shareStr).then(() => {
        showToast("📋 Results copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy results", err);
      });
    });
    card.appendChild(shareBtn);

    // Extra action buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexDirection = 'column';
    actions.style.gap = '8px';
    actions.style.marginTop = '15px';

    if (!isDailyMode) {
      const btnReplay = document.createElement('button');
      btnReplay.className = 'btn-ll';
      btnReplay.innerText = '🔄 PLAY ANOTHER BOARD';
      btnReplay.addEventListener('click', () => {
        playSound('click');
        loadPuzzle();
        solvedCategories = [];
        mistakesMade = 0;
        isGameOver = false;
        guessLog = [];
        renderMain();
      });
      actions.appendChild(btnReplay);
    }

    const btnLobby = document.createElement('button');
    btnLobby.className = 'btn-ll';
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

  // --- START GAME ---
  loadPuzzle();
  renderMain();
}
