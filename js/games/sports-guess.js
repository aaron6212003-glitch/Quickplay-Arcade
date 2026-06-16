import { auth } from '../firebase.js';
import { generateScoreSignature } from '../security.js';
import { SPORTS_PLAYERS } from './sports-data.js';

export function init(container) {
  // Clear container
  container.innerHTML = '';

  // --- AUDIO SYNTHESISER (Web Audio API) ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(type) {
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
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'submit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, index) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        noteOsc.type = 'square';
        noteOsc.frequency.setValueAtTime(freq, now + index * 0.08);
        noteGain.gain.setValueAtTime(0.06, now + index * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);
        noteOsc.start(now + index * 0.08);
        noteOsc.stop(now + index * 0.08 + 0.26);
      });
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.4);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.46);
    }
  }

  // --- SEEDED RANDOM HELPER ---
  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // --- GAME STATE ---
  const sportsList = ['nfl', 'nba', 'nhl'];
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  
  // Seeded random daily sport selection (deterministic but pseudo-random per day)
  const dailySportSeed = daysSinceEpoch * 12345;
  const dailySport = sportsList[Math.floor(seededRandom(dailySportSeed) * sportsList.length)];

  let isDailyMode = !window.isPracticeMode; 
  let selectedSport = isDailyMode ? dailySport : (localStorage.getItem('statline_last_practice_sport') || 'nfl');
  let secretPlayer = null;
  let remainingGuesses = 8;
  let guessedPlayers = [];
  let isGameOver = false;

  // --- STATE PERSISTENCE ---
  function saveGameState() {
    if (isDailyMode) {
      const stateKey = `statline_daily_state_${daysSinceEpoch}`;
      const state = {
        guessedPlayers,
        remainingGuesses,
        isGameOver,
        selectedSport
      };
      localStorage.setItem(stateKey, JSON.stringify(state));
    } else {
      const stateKey = `statline_practice_state_${selectedSport}`;
      const state = {
        secretPlayer,
        guessedPlayers,
        remainingGuesses,
        isGameOver,
        selectedSport
      };
      localStorage.setItem(stateKey, JSON.stringify(state));
    }
  }

  function loadGameState() {
    if (isDailyMode) {
      const stateKey = `statline_daily_state_${daysSinceEpoch}`;
      const saved = localStorage.getItem(stateKey);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          guessedPlayers = state.guessedPlayers || [];
          remainingGuesses = state.remainingGuesses ?? 8;
          isGameOver = state.isGameOver || false;
          selectedSport = state.selectedSport || dailySport;
          return true;
        } catch (e) {
          console.error("Error parsing daily state", e);
        }
      }
    } else {
      const stateKey = `statline_practice_state_${selectedSport}`;
      const saved = localStorage.getItem(stateKey);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          secretPlayer = state.secretPlayer || null;
          guessedPlayers = state.guessedPlayers || [];
          remainingGuesses = state.remainingGuesses ?? 8;
          isGameOver = state.isGameOver || false;
          selectedSport = state.selectedSport || 'nfl';
          return true;
        } catch (e) {
          console.error("Error parsing practice state", e);
        }
      }
    }
    return false;
  }

  // Initialize UI Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'sports-guess-wrapper';
  wrapper.style.cssText = `
    width: 100%;
    max-width: 650px;
    margin: 0 auto;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 30px 20px;
    box-sizing: border-box;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    position: relative;
  `;

  // floating exit button
  const exitBtn = document.createElement('button');
  exitBtn.innerHTML = '✕';
  exitBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    transition: all 0.2s ease;
  `;
  exitBtn.addEventListener('click', () => {
    playSound('click');
    window.location.href = 'index.html';
  });
  wrapper.appendChild(exitBtn);

  // Game Header / Title (StatLine)
  const title = document.createElement('h1');
  title.innerText = 'StatLine';
  title.style.cssText = `
    font-size: 2.2rem;
    font-weight: 900;
    text-align: center;
    margin: 0 0 5px 0;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `;
  wrapper.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.innerText = 'Guess the active NFL, NBA, or NHL player by their stats!';
  subtitle.style.cssText = `
    text-align: center;
    color: #94a3b8;
    margin: 0 0 25px 0;
    font-size: 0.95rem;
  `;
  wrapper.appendChild(subtitle);

  // TABS: Mode switch (Daily vs Practice)
  const modeContainer = document.createElement('div');
  modeContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  `;
  const btnDaily = document.createElement('button');
  btnDaily.innerText = '📅 Daily Challenge';
  const btnPractice = document.createElement('button');
  btnPractice.innerText = '🔄 Unlimited Practice';

  const applyModeStyles = () => {
    const active = `
      flex: 1;
      max-width: 180px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid #3B82F6;
      background: rgba(59, 130, 246, 0.15);
      color: white;
      font-weight: 800;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    `;
    const inactive = `
      flex: 1;
      max-width: 180px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
      color: #94a3b8;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    `;
    const disabledStyle = `
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    `;

    btnDaily.style.cssText = isDailyMode ? active : inactive;
    btnPractice.style.cssText = !isDailyMode ? active : inactive;

    // Lock mode switch mid-game in Practice Mode
    if (!isDailyMode && guessedPlayers.length > 0 && !isGameOver) {
      btnDaily.style.cssText += disabledStyle;
      btnPractice.style.cssText += disabledStyle;
    }
  };

  btnDaily.addEventListener('click', () => {
    playSound('click');
    isDailyMode = true;
    selectedSport = dailySport; // Force daily sport
    applyModeStyles();
    updateSportTabStyles();
    initGame();
  });
  btnPractice.addEventListener('click', () => {
    playSound('click');
    isDailyMode = false;
    selectedSport = localStorage.getItem('statline_last_practice_sport') || 'nfl';
    applyModeStyles();
    updateSportTabStyles();
    initGame();
  });
  modeContainer.appendChild(btnDaily);
  modeContainer.appendChild(btnPractice);
  // Do NOT append modeContainer to wrapper so they can't toggle back and forth!
  // wrapper.appendChild(modeContainer);

  // TABS: Sports switch (NFL, NBA, NHL)
  const sportTabsContainer = document.createElement('div');
  sportTabsContainer.style.cssText = `
    display: flex;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 4px;
    margin-bottom: 25px;
    gap: 4px;
  `;
  const sports = [
    { id: 'nfl', label: '🏈 NFL' },
    { id: 'nba', label: '🏀 NBA' },
    { id: 'nhl', label: '🏒 NHL' }
  ];
  const tabElements = {};

  sports.forEach(sport => {
    const tab = document.createElement('button');
    tab.innerText = sport.label;
    tab.style.cssText = `
      flex: 1;
      padding: 10px;
      border: none;
      background: transparent;
      color: #94a3b8;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.2s;
    `;
    tab.addEventListener('click', () => {
      if (isDailyMode) return; // Daily mode locks the sport
      playSound('click');
      selectedSport = sport.id;
      localStorage.setItem('statline_last_practice_sport', sport.id);
      updateSportTabStyles();
      initGame();
    });
    sportTabsContainer.appendChild(tab);
    tabElements[sport.id] = tab;
  });

  const updateSportTabStyles = () => {
    sports.forEach(s => {
      const el = tabElements[s.id];
      const isSelected = s.id === selectedSport;

      // Base active/inactive color styles
      if (isSelected) {
        el.style.background = 'rgba(255,255,255,0.08)';
        el.style.color = '#ffffff';
        el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
      } else {
        el.style.background = 'transparent';
        el.style.color = '#94a3b8';
        el.style.boxShadow = 'none';
      }

      // Lock conditions
      if (isDailyMode) {
        // Daily Challenge: Lock other sports completely
        if (!isSelected) {
          el.style.opacity = '0.25';
          el.style.cursor = 'not-allowed';
          el.style.pointerEvents = 'none';
        } else {
          el.style.opacity = '1';
          el.style.cursor = 'default';
          el.style.pointerEvents = 'none';
        }
      } else {
        // Practice Mode: Lock tabs once a guess is made
        if (guessedPlayers.length > 0 && !isGameOver) {
          el.style.pointerEvents = 'none';
          if (!isSelected) {
            el.style.opacity = '0.3';
            el.style.cursor = 'not-allowed';
          }
        } else {
          el.style.opacity = '1';
          el.style.cursor = 'pointer';
          el.style.pointerEvents = 'auto';
        }
      }
    });
  };
  wrapper.appendChild(sportTabsContainer);

  // Setup main layout slots
  const gameplayContainer = document.createElement('div');
  wrapper.appendChild(gameplayContainer);

  container.appendChild(wrapper);
  applyModeStyles();
  updateSportTabStyles();
  initGame();

  // --- GAME INITIALIZATION ---
  function initGame(forceNewGame = false) {
    if (forceNewGame) {
      if (isDailyMode) {
        localStorage.removeItem(`statline_daily_state_${daysSinceEpoch}`);
      } else {
        localStorage.removeItem(`statline_practice_state_${selectedSport}`);
      }
    }

    const hasSavedState = !forceNewGame && loadGameState();

    if (!hasSavedState) {
      remainingGuesses = 8;
      guessedPlayers = [];
      isGameOver = false;

      const filtered = SPORTS_PLAYERS.filter(p => p.sport === selectedSport);
      if (isDailyMode) {
        // Seeded random for daily player selection:
        const playerSeed = daysSinceEpoch * 54321;
        const playerIndex = Math.floor(seededRandom(playerSeed) * filtered.length);
        secretPlayer = filtered[playerIndex];
      } else {
        // Random Selector
        const index = Math.floor(Math.random() * filtered.length);
        secretPlayer = filtered[index];
      }
      
      saveGameState();
    }

    console.log(`[Playhaus Debug] Secret Player loaded:`, secretPlayer.name);

    applyModeStyles();
    updateSportTabStyles();
    renderGameplay();

    // Populate already guessed players rows if any
    const tbody = document.getElementById('guess-rows-body');
    if (tbody && guessedPlayers.length > 0) {
      guessedPlayers.forEach(playerName => {
        const pObj = SPORTS_PLAYERS.find(p => p.name === playerName);
        if (pObj) {
          const tr = createGuessRow(pObj);
          tbody.insertBefore(tr, tbody.firstChild);
        }
      });
    }

    // Disable search input and show overlay if game is already over
    if (isGameOver) {
      const searchInput = document.getElementById('sports-player-search');
      if (searchInput) {
        searchInput.disabled = true;
        searchInput.parentElement.style.opacity = '0.5';
      }
      const isWin = guessedPlayers[guessedPlayers.length - 1] === secretPlayer.name;
      showGameOverOverlay(isWin);
    }
  }

  // --- RENDER GAMEPLAY VIEWS ---
  function renderGameplay() {
    gameplayContainer.innerHTML = '';

    // Daily Mode Locked Notice banner
    if (isDailyMode) {
      const dailyNotice = document.createElement('div');
      dailyNotice.innerText = `🔒 Today's Daily Challenge sport is locked to ${selectedSport.toUpperCase()}.`;
      dailyNotice.style.cssText = `
        text-align: center;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.2);
        padding: 8px;
        border-radius: 8px;
        color: #3b82f6;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 15px;
      `;
      gameplayContainer.appendChild(dailyNotice);
    }

    // Guess counter
    const counter = document.createElement('div');
    counter.id = 'guesses-counter';
    counter.innerText = `Guesses Remaining: ${remainingGuesses} / 8`;
    counter.style.cssText = `
      text-align: center;
      font-weight: 800;
      color: #cbd5e1;
      font-size: 1.1rem;
      margin-bottom: 20px;
    `;
    gameplayContainer.appendChild(counter);

    // Search bar container
    const searchForm = document.createElement('div');
    searchForm.style.cssText = `
      position: relative;
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      width: 100%;
    `;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'sports-player-search';
    input.placeholder = `Search active ${selectedSport.toUpperCase()} players...`;
    input.autocomplete = 'off';
    input.style.cssText = `
      flex: 1;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(10, 15, 30, 0.6);
      color: #ffffff;
      font-size: 1rem;
      box-sizing: border-box;
      outline: none;
      transition: all 0.25s;
    `;
    input.addEventListener('focus', () => {
      input.style.borderColor = '#3B82F6';
      input.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.25)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      input.style.boxShadow = 'none';
    });

    const suggestions = document.createElement('div');
    suggestions.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0 0 12px 12px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 100;
      display: none;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    `;

    const btnSubmit = document.createElement('button');
    btnSubmit.innerText = 'GUESS';
    btnSubmit.style.cssText = `
      padding: 0 24px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 800;
      border: none;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
      transition: all 0.2s;
    `;
    btnSubmit.addEventListener('mouseenter', () => {
      btnSubmit.style.transform = 'translateY(-2px)';
      btnSubmit.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.45)';
    });
    btnSubmit.addEventListener('mouseleave', () => {
      btnSubmit.style.transform = 'none';
      btnSubmit.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
    });

    // Wire autocomplete logic
    const allPlayersInSport = SPORTS_PLAYERS.filter(p => p.sport === selectedSport);
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        suggestions.style.display = 'none';
        return;
      }
      const matches = allPlayersInSport.filter(p => 
        p.name.toLowerCase().includes(query) && !guessedPlayers.includes(p.name)
      );

      suggestions.innerHTML = '';
      if (matches.length > 0) {
        matches.slice(0, 15).forEach(player => { // limit autocomplete to 15 entries for performance
          const item = document.createElement('div');
          item.innerText = player.name;
          item.style.cssText = `
            padding: 12px 16px;
            color: #cbd5e1;
            cursor: pointer;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            font-weight: 600;
            font-size: 0.95rem;
            transition: background 0.15s;
          `;
          item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(255,255,255,0.05)';
            item.style.color = '#ffffff';
          });
          item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
            item.style.color = '#cbd5e1';
          });
          item.addEventListener('click', () => {
            input.value = player.name;
            suggestions.style.display = 'none';
            submitGuess(player);
          });
          suggestions.appendChild(item);
        });
        suggestions.style.display = 'block';
      } else {
        suggestions.style.display = 'none';
      }
    });

    // Close suggestions if clicked outside
    document.addEventListener('click', (e) => {
      if (!searchForm.contains(e.target)) {
        suggestions.style.display = 'none';
      }
    });

    btnSubmit.addEventListener('click', () => {
      const name = input.value.trim();
      const match = allPlayersInSport.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (match) {
        submitGuess(match);
      } else {
        alert("Please select a valid player from the active roster suggestions!");
      }
    });

    searchForm.appendChild(input);
    searchForm.appendChild(suggestions);
    searchForm.appendChild(btnSubmit);
    gameplayContainer.appendChild(searchForm);

    // Render Concede button if game is in progress and not over
    if (!isGameOver) {
      const concedeWrapper = document.createElement('div');
      concedeWrapper.id = 'concede-btn-wrapper';
      concedeWrapper.style.cssText = `
        display: flex;
        justify-content: flex-end;
        margin-top: -20px;
        margin-bottom: 20px;
      `;
      const btnConcede = document.createElement('button');
      btnConcede.innerText = '🏳️ CONCEDE';
      btnConcede.style.cssText = `
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 800;
        border: 1px solid rgba(239, 68, 68, 0.35);
        background: rgba(239, 68, 68, 0.08);
        color: #fca5a5;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      btnConcede.addEventListener('mouseenter', () => {
        btnConcede.style.background = 'rgba(239, 68, 68, 0.18)';
        btnConcede.style.borderColor = 'rgba(239, 68, 68, 0.6)';
        btnConcede.style.transform = 'translateY(-1px)';
      });
      btnConcede.addEventListener('mouseleave', () => {
        btnConcede.style.background = 'rgba(239, 68, 68, 0.08)';
        btnConcede.style.borderColor = 'rgba(239, 68, 68, 0.35)';
        btnConcede.style.transform = 'none';
      });
      btnConcede.addEventListener('click', () => {
        playSound('click');
        showConcedeConfirmation();
      });
      concedeWrapper.appendChild(btnConcede);
      gameplayContainer.appendChild(concedeWrapper);
    }

    // Grid guess table wrapper
    const tableWrapper = document.createElement('div');
    tableWrapper.style.cssText = `
      width: 100%;
      overflow-x: auto;
      background: rgba(10, 15, 30, 0.4);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      margin-bottom: 20px;
    `;
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      text-align: center;
      font-size: 0.9rem;
    `;

    // Headers
    const thead = document.createElement('thead');
    thead.style.cssText = `
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    `;
    const headerRow = document.createElement('tr');
    const cols = ['Player', 'Team', 'Conf / Div', 'Pos', 'Height', 'Age', 'Jersey'];
    cols.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col;
      th.style.cssText = `
        padding: 14px 10px;
        color: #94a3b8;
        font-weight: 800;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.id = 'guess-rows-body';
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    gameplayContainer.appendChild(tableWrapper);
  }

  // --- SUBMIT GUESS FLOW ---
  function submitGuess(player) {
    if (isGameOver) return;

    playSound('submit');
    if (window.triggerHaptic) window.triggerHaptic('light');

    guessedPlayers.push(player.name);
    remainingGuesses--;
    saveGameState();

    const counter = document.getElementById('guesses-counter');
    if (counter) {
      counter.innerText = `Guesses Remaining: ${remainingGuesses} / 8`;
    }

    const searchInput = document.getElementById('sports-player-search');
    if (searchInput) searchInput.value = '';

    const tbody = document.getElementById('guess-rows-body');
    if (tbody) {
      const tr = createGuessRow(player);
      tbody.insertBefore(tr, tbody.firstChild);
    }

    // Apply active locks on tabs/mode select
    applyModeStyles();
    updateSportTabStyles();

    // Check Win/Loss conditions
    if (player.name === secretPlayer.name) {
      handleGameOver(true);
    } else if (remainingGuesses <= 0) {
      handleGameOver(false);
    }
  }

  // Helper: check position similarity categories
  function checkPositionColor(guessPos, targetPos) {
    if (guessPos === targetPos) return '#22c55e'; // Green - exact match
    
    // NFL Offense vs Defense groups
    if (selectedSport === 'nfl') {
      const off = ['QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'C', 'FB'];
      const def = ['LB', 'DE', 'DT', 'CB', 'S', 'NT', 'DL', 'DB', 'OLB', 'ILB'];
      const guessOff = off.includes(guessPos);
      const targetOff = off.includes(targetPos);
      if (guessOff === targetOff) return '#eab308'; // Yellow - same side of ball
    }
    // NBA Guards/Forwards/Centers
    if (selectedSport === 'nba') {
      const getCategory = (pos) => {
        if (pos.includes('G')) return 'guard';
        if (pos.includes('F')) return 'forward';
        return 'center';
      };
      if (getCategory(guessPos) === getCategory(targetPos)) return '#eab308';
    }
    // NHL Forward vs Defense
    if (selectedSport === 'nhl') {
      const forwards = ['C', 'LW', 'RW', 'F'];
      const guessFwd = forwards.includes(guessPos);
      const targetFwd = forwards.includes(targetPos);
      if (guessFwd === targetFwd) return '#eab308'; // Yellow - both forwards
    }

    return '#374151'; // Grey - wrong
  }

  // --- GUESS ROW HTML CREATOR ---
  function createGuessRow(player) {
    const tr = document.createElement('tr');
    tr.style.cssText = `
      border-bottom: 1px solid rgba(255,255,255,0.06);
    `;

    // 1. Player Name
    const tdName = document.createElement('td');
    tdName.innerText = player.name;
    tdName.style.cssText = `
      padding: 14px 10px;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
    `;
    tr.appendChild(tdName);

    // Comparison cells helper
    const cellStyle = (bgColor) => `
      padding: 12px 6px;
      color: #ffffff;
      font-weight: 800;
      background-color: ${bgColor} !important;
      border: 1px solid rgba(0,0,0,0.3);
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      border-radius: 4px;
    `;

    // 2. Team
    const tdTeam = document.createElement('td');
    tdTeam.innerText = player.team;
    let teamColor = '#374151';
    if (player.team === secretPlayer.team) {
      teamColor = '#22c55e'; // Green
    } else if (player.division === secretPlayer.division) {
      teamColor = '#eab308'; // Yellow (same division, different team)
    }
    tdTeam.style.cssText = cellStyle(teamColor);
    tr.appendChild(tdTeam);

    // 3. Conf / Div
    const tdDiv = document.createElement('td');
    tdDiv.innerText = `${player.conference.substring(0,3)} ${player.division}`;
    let divColor = '#374151';
    if (player.division === secretPlayer.division) {
      divColor = '#22c55e'; // Green
    } else if (player.conference === secretPlayer.conference) {
      divColor = '#eab308'; // Yellow (same conference, different division)
    }
    tdDiv.style.cssText = cellStyle(divColor);
    tr.appendChild(tdDiv);

    // 4. Position
    const tdPos = document.createElement('td');
    tdPos.innerText = player.position;
    const posColor = checkPositionColor(player.position, secretPlayer.position);
    tdPos.style.cssText = cellStyle(posColor);
    tr.appendChild(tdPos);

    // Helper for arrows
    const arrow = (val, targetVal) => {
      if (val === targetVal) return '';
      return val < targetVal ? ' ⬆️' : ' ⬇️';
    };

    // Helper for Height string format
    const formatHeight = (inches) => {
      const feet = Math.floor(inches / 12);
      const rem = inches % 12;
      return `${feet}'${rem}"`;
    };

    // 5. Height
    const tdHeight = document.createElement('td');
    tdHeight.innerText = formatHeight(player.height) + arrow(player.height, secretPlayer.height);
    let heightColor = '#374151';
    if (player.height === secretPlayer.height) {
      heightColor = '#22c55e';
    } else if (Math.abs(player.height - secretPlayer.height) <= 2) {
      heightColor = '#eab308'; // within 2 inches
    }
    tdHeight.style.cssText = cellStyle(heightColor);
    tr.appendChild(tdHeight);

    // 6. Age
    const tdAge = document.createElement('td');
    tdAge.innerText = player.age + arrow(player.age, secretPlayer.age);
    let ageColor = '#374151';
    if (player.age === secretPlayer.age) {
      ageColor = '#22c55e';
    } else if (Math.abs(player.age - secretPlayer.age) <= 2) {
      ageColor = '#eab308'; // within 2 years
    }
    tdAge.style.cssText = cellStyle(ageColor);
    tr.appendChild(tdAge);

    // 7. Jersey
    const tdJersey = document.createElement('td');
    tdJersey.innerText = player.jersey + arrow(player.jersey, secretPlayer.jersey);
    let jerseyColor = '#374151';
    if (player.jersey === secretPlayer.jersey) {
      jerseyColor = '#22c55e';
    } else if (Math.abs(player.jersey - secretPlayer.jersey) <= 5) {
      jerseyColor = '#eab308'; // within 5 numbers
    }
    tdJersey.style.cssText = cellStyle(jerseyColor);
    tr.appendChild(tdJersey);

    return tr;
  }

  function showConcedeConfirmation() {
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: modalFadeIn 0.25s ease forwards;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    `;

    const modalTitle = document.createElement('h3');
    modalTitle.innerText = 'Concede Game?';
    modalTitle.style.cssText = `
      margin: 0 0 12px 0;
      color: #ffffff;
      font-size: 1.4rem;
      font-weight: 800;
    `;
    box.appendChild(modalTitle);

    const desc = document.createElement('p');
    desc.innerText = 'Are you sure you want to give up? This will end the game and reveal the mystery player.';
    desc.style.cssText = `
      margin: 0 0 24px 0;
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.5;
    `;
    box.appendChild(desc);

    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;

    const btnCancel = document.createElement('button');
    btnCancel.innerText = 'Cancel';
    btnCancel.style.cssText = `
      flex: 1;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: transparent;
      color: #cbd5e1;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    `;
    btnCancel.addEventListener('click', () => {
      playSound('click');
      confirmModal.remove();
    });

    const btnConfirm = document.createElement('button');
    btnConfirm.innerText = 'Yes, Concede';
    btnConfirm.style.cssText = `
      flex: 1;
      padding: 12px;
      border-radius: 10px;
      border: none;
      background: #ef4444;
      color: #ffffff;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    `;
    btnConfirm.addEventListener('click', () => {
      playSound('click');
      confirmModal.remove();
      handleGameOver(false);
    });

    actions.appendChild(btnCancel);
    actions.appendChild(btnConfirm);
    box.appendChild(actions);
    confirmModal.appendChild(box);
    document.body.appendChild(confirmModal);
  }

  // --- GAME OVER SCREEN AND SCORES ---
  function handleGameOver(isWin) {
    isGameOver = true;

    // Calculate score
    let score = 0;
    if (isWin) {
      playSound('win');
      if (window.triggerHaptic) window.triggerHaptic('medium');
      const attemptsUsed = 8 - remainingGuesses;
      score = 100 - (attemptsUsed - 1) * 10;
    } else {
      playSound('fail');
      if (window.triggerHaptic) window.triggerHaptic('heavy');
    }

    // Save score to leaderboards
    if (score > 0 && window.saveScore) {
      const user = auth.currentUser;
      const uid = user ? user.uid : "guest";
      const timestamp = Date.now();
      const signature = generateScoreSignature(uid, 'StatLine', score, timestamp);
      window.saveScore('StatLine', score, signature, timestamp);
    }

    // Save final game state
    saveGameState();

    // Hide search form and concede button
    const searchInput = document.getElementById('sports-player-search');
    if (searchInput) {
      searchInput.disabled = true;
      searchInput.parentElement.style.opacity = '0.5';
    }
    const concedeBtnWrapper = document.getElementById('concede-btn-wrapper');
    if (concedeBtnWrapper) {
      concedeBtnWrapper.style.display = 'none';
    }

    // Re-enable tabs for next game
    applyModeStyles();
    updateSportTabStyles();

    showGameOverOverlay(isWin);
  }

  function showGameOverOverlay(isWin) {
    const existingOverlay = gameplayContainer.querySelector('.game-over-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.style.cssText = `
      margin-top: 30px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid ${isWin ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      animation: fadeIn 0.4s ease;
    `;

    const statusTitle = document.createElement('h2');
    statusTitle.innerText = isWin ? '🎉 TARGET GUESSED!' : '💀 OUT OF GUESSES!';
    statusTitle.style.cssText = `
      font-size: 1.5rem;
      font-weight: 900;
      color: ${isWin ? '#22c55e' : '#ef4444'};
      margin: 0 0 10px 0;
    `;
    overlay.appendChild(statusTitle);

    const revealText = document.createElement('p');
    revealText.innerHTML = `The secret player was: <strong style="color: #ffffff; font-size: 1.2rem;">${secretPlayer.name}</strong> (${secretPlayer.team} · #${secretPlayer.jersey})`;
    revealText.style.cssText = `
      color: #94a3b8;
      margin: 0 0 16px 0;
      font-size: 0.95rem;
    `;
    overlay.appendChild(revealText);

    if (isWin) {
      const attemptsUsed = 8 - remainingGuesses;
      const score = 100 - (attemptsUsed - 1) * 10;
      const scoreText = document.createElement('p');
      scoreText.innerHTML = `Ranked Score: <strong style="color: #fcd34d; font-size: 1.4rem;">${score} points</strong>`;
      scoreText.style.cssText = `
        color: #cbd5e1;
        margin: 0 0 20px 0;
        font-weight: 700;
      `;
      overlay.appendChild(scoreText);
    }

    if (!isDailyMode) {
      const btnPlayAgain = document.createElement('button');
      btnPlayAgain.innerText = 'PLAY AGAIN';
      btnPlayAgain.style.cssText = `
        padding: 12px 28px;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 800;
        border: none;
        background: linear-gradient(135deg, #22c55e, #10b981);
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
        transition: all 0.2s;
      `;
      btnPlayAgain.addEventListener('click', () => {
        playSound('click');
        initGame(true);
      });
      overlay.appendChild(btnPlayAgain);
    } else {
      const dailyNotice = document.createElement('p');
      dailyNotice.innerText = 'Come back tomorrow for a new Daily Challenge! Or switch to Unlimited Practice mode above to keep playing right now.';
      dailyNotice.style.cssText = `
        color: #64748b;
        font-size: 0.85rem;
        font-style: italic;
        line-height: 1.4;
      `;
      overlay.appendChild(dailyNotice);
    }

    gameplayContainer.appendChild(overlay);
  }
}
