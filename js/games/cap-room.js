import { auth, db, doc, getDoc } from '../firebase.js';
import { generateScoreSignature } from '../security.js';
import { CAP_ROOM_DATA } from './cap-room-data.js';

export function init(container) {
  // Clear container
  container.innerHTML = '';

  // --- AUDIO SYNTHESISER (Web Audio API) ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(type) {
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
        osc.frequency.setValueAtTime(500, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'draft') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, index) => {
          const noteOsc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(audioCtx.destination);
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, now + index * 0.1);
          noteGain.gain.setValueAtTime(0.05, now + index * 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.2);
          noteOsc.start(now + index * 0.1);
          noteOsc.stop(now + index * 0.1 + 0.22);
        });
      } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.42);
        osc.start(now);
        osc.stop(now + 0.43);
      }
    } catch (e) {
      console.log("Audio failed", e);
    }
  }

  // --- GAME STATE ---
  let selectedLeagueKey = null; // 'nfl', 'nba', 'nhl'
  let selectedEra = 'modern'; // 'modern' or 'classic'
  let selectedCoachingStyle = 'moneyball'; // 'offense', 'defense', 'moneyball'
  let reRollsLeft = 3;
  let currentSpotIndex = 0;
  let remainingCap = 0;
  let draftedRoster = [];
  let availableDraftPool = [];
  let positionsToDraft = [];
  let wins = 0;
  let losses = 0;
  let playoffFinish = ""; // "Champions", "Finals", "Semifinals", "Quarterfinals", "Missed Playoffs"
  let playoffProgress = 0; // 0 = missed, 1 = QF, 2 = SF, 3 = F, 4 = CH
  let simLogs = [];
  let isGameOver = false;

  // --- STYLE INJECTION ---
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .cap-room-wrapper {
      width: 100%;
      max-width: 580px;
      margin: 0 auto;
      padding: 16px 12px;
      box-sizing: border-box;
      font-family: 'Outfit', sans-serif;
      color: #fff;
    }
    .cap-room-title {
      font-size: 2.2rem;
      font-weight: 900;
      text-align: center;
      margin: 0 0 4px 0;
      background: linear-gradient(135deg, #10B981, #3B82F6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    .cap-room-subtitle {
      font-size: 0.95rem;
      color: #94a3b8;
      text-align: center;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    .cr-card {
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 20px;
      box-sizing: border-box;
      box-shadow: 0 15px 30px rgba(0,0,0,0.5);
      margin-bottom: 20px;
    }
    .league-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (min-width: 480px) {
      .league-grid {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
    .league-select-card {
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .league-select-card:hover {
      border-color: #10B981;
      transform: translateY(-2px);
      background: rgba(16, 185, 129, 0.08);
    }
    .league-emoji {
      font-size: 2.5rem;
      margin-bottom: 8px;
    }
    .league-name {
      font-size: 1.15rem;
      font-weight: 800;
    }
    .league-cap {
      font-size: 0.82rem;
      color: #94a3b8;
      margin-top: 4px;
      font-weight: 700;
    }
    
    /* Config Toggles & Schemes */
    .config-toggle-btn {
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.06);
      transition: all 0.2s ease;
    }
    .config-toggle-btn:hover {
      border-color: rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
    }
    .scheme-option-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      transition: all 0.2s ease;
    }
    .scheme-option-card:hover {
      border-color: rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
    }

    /* Cap usage bar */
    .cap-bar-container {
      width: 100%;
      height: 14px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 7px;
      overflow: hidden;
      margin-bottom: 12px;
      position: relative;
    }
    .cap-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #10B981, #eab308);
      width: 0%;
      transition: width 0.3s ease;
    }
    .cap-bar-fill.warning {
      background: linear-gradient(90deg, #10B981, #ef4444);
    }

    /* Player draft card */
    .draft-player-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      transition: all 0.2s ease;
    }
    .draft-player-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255,255,255,0.12);
    }
    .draft-player-card.disabled {
      opacity: 0.35;
      pointer-events: none;
    }
    .player-ovr {
      background: linear-gradient(135deg, #10B981, #3B82F6);
      color: #fff;
      font-size: 1.25rem;
      font-weight: 900;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .player-ovr.filler {
      background: #475569;
    }
    .draft-action-btn {
      background: #10B981;
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s;
    }
    .draft-action-btn:hover {
      background: #059669;
      transform: scale(1.03);
    }

    .roster-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 15px;
    }
    .roster-cell {
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
    }
    .roster-cell.filled {
      border-style: solid;
      border-color: rgba(16, 185, 129, 0.25);
      background: rgba(16, 185, 129, 0.04);
    }

    .btn-cr-action {
      background: linear-gradient(135deg, #10B981, #3B82F6);
      border: none;
      color: white;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
    }
    .btn-cr-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }
    .btn-cr-outline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
    }
    .btn-cr-outline:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }

    /* Ticker/Logs */
    .sim-logs-container {
      background: #090d16;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 12px;
      height: 120px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 0.8rem;
      color: #38BDF8;
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 20px;
    }

    .ovr-badge {
      font-size: 1.8rem;
      font-weight: 900;
      color: #10B981;
      text-align: center;
    }

    .grade-badge {
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: linear-gradient(135deg, #eab308, #ef4444);
      color: #fff;
      font-size: 2.2rem;
      font-weight: 950;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 10px auto;
      box-shadow: 0 0 15px rgba(234, 179, 8, 0.3);
    }
  `;
  document.head.appendChild(styleEl);

  // --- HELPER FORMATTERS ---
  function formatMoney(num) {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    return `$${num.toLocaleString()}`;
  }

  // --- COACH SCHEME RATING BOOST CALCULATION ---
  function getBoostedRating(player) {
    if (selectedCoachingStyle === 'offense') {
      if (selectedLeagueKey === 'nba' && ['PG', 'SG', 'SF'].includes(player.position)) {
        return player.rating + 2;
      }
      if (selectedLeagueKey === 'nfl' && ['QB', 'WR', 'TE'].includes(player.position)) {
        return player.rating + 2;
      }
      if (selectedLeagueKey === 'nhl' && ['C', 'LW', 'RW'].includes(player.position)) {
        return player.rating + 2;
      }
    } else if (selectedCoachingStyle === 'defense') {
      if (selectedLeagueKey === 'nba' && ['PF', 'C', '6th Man'].includes(player.position)) {
        return player.rating + 2;
      }
      if (selectedLeagueKey === 'nfl' && ['DL', 'LB', 'DB'].includes(player.position)) {
        return player.rating + 2;
      }
      if (selectedLeagueKey === 'nhl' && ['LD', 'RD', 'G'].includes(player.position)) {
        return player.rating + 2;
      }
    }
    return player.rating;
  }

  // --- SHOW DYNAMIC PLAYER DETAIL MODAL ---
  function showPlayerCardModal(player) {
    const existing = document.getElementById('player-card-modal');
    if (existing) existing.remove();

    const baseRating = player.rating;
    const boostedRating = getBoostedRating(player);
    const hasBoost = boostedRating > baseRating;

    const modal = document.createElement('div');
    modal.id = 'player-card-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(5,5,10,0.85); z-index: 2000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      font-family: 'Outfit', sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 30px 25px;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.6);
      position: relative;
      animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    if (!document.getElementById('modal-anim-style')) {
      const animStyle = document.createElement('style');
      animStyle.id = 'modal-anim-style';
      animStyle.innerHTML = `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(animStyle);
    }

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.06); border: none; color: #94a3b8; font-size: 14px;
      font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    `;
    closeBtn.addEventListener('click', () => {
      playSound('click');
      modal.remove();
    });
    card.appendChild(closeBtn);

    const positionLabels = {
      'PG': 'Point Guard', 'SG': 'Shooting Guard', 'SF': 'Small Forward', 'PF': 'Power Forward', 'C': 'Center', '6th Man': '6th Man',
      'QB': 'Quarterback', 'RB': 'Running Back', 'WR': 'Wide Receiver', 'TE': 'Tight End', 'OL': 'Offensive Line', 'DL': 'Defensive Line', 'LB': 'Linebacker', 'DB': 'Defensive Back',
      'C-nhl': 'Center', 'LW': 'Left Wing', 'RW': 'Right Wing', 'LD': 'Left Defense', 'RD': 'Right Defense', 'D': 'Defenseman', 'D1': 'Defenseman', 'D2': 'Defenseman', 'G': 'Goaltender'
    };
    
    let labelKey = player.position;
    if (selectedLeagueKey === 'nhl' && player.position === 'C') {
      labelKey = 'C-nhl';
    }
    const fullPos = positionLabels[labelKey] || player.position;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; gap:16px; align-items:center; margin-bottom:20px;';
    header.innerHTML = `
      <div style="background:linear-gradient(135deg, #10B981, #3B82F6); color:#fff; font-size:1.6rem; font-weight:900; width:60px; height:60px; border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; line-height:1.1;">
        <span>${boostedRating}</span>
        <span style="font-size:0.55rem; text-transform:uppercase; opacity:0.85; margin-top:2px; font-weight:800;">Rating</span>
      </div>
      <div>
        <h3 style="margin:0; font-size:1.4rem; font-weight:900; color:#fff; line-height:1.2;">${player.name}</h3>
        <p style="margin:4px 0 0 0; font-size:0.85rem; color:#94a3b8; font-weight:700;">
          ${player.team} · Age ${player.age} · ${fullPos}
        </p>
        <p style="margin:4px 0 0 0; font-size:0.85rem; color:${hasBoost ? '#34d399' : '#10B981'}; font-weight:800;">
          Overall Rating: ${boostedRating}${hasBoost ? ' (+2 Scheme Boost)' : ''}
        </p>
      </div>
    `;
    card.appendChild(header);

    const salaryBox = document.createElement('div');
    salaryBox.style.cssText = `
      background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15);
      border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 15px;
    `;
    salaryBox.innerHTML = `
      <div style="font-size:0.85rem; color:#a7f3d0; font-weight:700;">SALARY CAP HIT</div>
      <div style="font-size:1.15rem; font-weight:900; color:#10B981;">${formatMoney(player.salary)}</div>
    `;
    card.appendChild(salaryBox);

    // Detail bio info
    const bioText = document.createElement('div');
    bioText.style.cssText = 'font-size:0.9rem; color:#cbd5e1; line-height:1.5; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;';
    bioText.innerHTML = `<strong>Scouting Report:</strong><br>${player.detail || 'No report available.'}`;
    card.appendChild(bioText);

    modal.appendChild(card);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        playSound('click');
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  // --- SCREEN ROUTER ---
  function showScreen(screen) {
    if (screen === 'select-league') {
      renderLeagueSelection();
    } else if (screen === 'configure-franchise') {
      renderConfigureFranchiseScreen();
    } else if (screen === 'draft') {
      renderDraftScreen();
    } else if (screen === 'review') {
      renderReviewScreen();
    } else if (screen === 'simulation') {
      renderSimulationScreen();
    } else if (screen === 'results') {
      renderResultsScreen();
    }
  }

  // --- SCREEN 1: LEAGUE SELECTION ---
  function renderLeagueSelection() {
    container.innerHTML = '';
    
    // Reset state
    currentSpotIndex = 0;
    draftedRoster = [];
    isGameOver = false;
    wins = 0;
    losses = 0;
    playoffFinish = "";
    playoffProgress = 0;
    simLogs = [];

    const wrap = document.createElement('div');
    wrap.className = 'cap-room-wrapper';

    // exit button
    const exitBtn = document.createElement('button');
    exitBtn.innerHTML = '✕';
    exitBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
      color: white; font-size: 16px; font-weight: 800; cursor: pointer; display: flex;
      align-items: center; justify-content: center; z-index: 10;
    `;
    exitBtn.addEventListener('click', () => {
      playSound('click');
      window.location.href = 'index.html';
    });
    wrap.appendChild(exitBtn);

    const title = document.createElement('h1');
    title.className = 'cap-room-title';
    title.innerText = 'Cap Room';
    wrap.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'cap-room-subtitle';
    sub.innerText = 'Draft starters under the salary cap and simulate the season.';
    wrap.appendChild(sub);

    const selectionCard = document.createElement('div');
    selectionCard.className = 'cr-card';
    selectionCard.innerHTML = `<div style="font-size:0.88rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:15px; text-align:center;">Select Your League</div>`;

    const grid = document.createElement('div');
    grid.className = 'league-grid';

    const leagues = [
      { key: "nfl", name: "NFL Football", emoji: "🏈", cap: 200000000 },
      { key: "nba", name: "NBA Basketball", emoji: "🏀", cap: 135000000 },
      { key: "nhl", name: "NHL Hockey", emoji: "🏒", cap: 40000000 }
    ];

    leagues.forEach(l => {
      const card = document.createElement('div');
      card.className = 'league-select-card';
      card.innerHTML = `
        <div class="league-emoji">${l.emoji}</div>
        <div class="league-name">${l.name}</div>
        <div class="league-cap">Cap: ${formatMoney(l.cap)}</div>
      `;
      card.addEventListener('click', () => {
        playSound('click');
        selectLeague(l.key);
      });
      grid.appendChild(card);
    });

    selectionCard.appendChild(grid);
    wrap.appendChild(selectionCard);

    // Disclaimer
    const disc = document.createElement('p');
    disc.style.cssText = 'font-size:0.8rem; color:#64748b; text-align:center; line-height:1.4; padding: 0 10px;';
    disc.innerText = "Disclaimer: Player ratings and salaries represent simplified cap hit estimations based on current league values. Salaries and rosters are subject to change.";
    wrap.appendChild(disc);

    container.appendChild(wrap);
  }

  function selectLeague(key) {
    selectedLeagueKey = key;
    selectedEra = 'modern';
    selectedCoachingStyle = 'moneyball';
    reRollsLeft = 3;
    showScreen('configure-franchise');
  }

  // --- SCREEN 1.5: STRATEGIC CONFIGURATION SCREEN ---
  function renderConfigureFranchiseScreen() {
    container.innerHTML = '';
    const lData = CAP_ROOM_DATA[selectedLeagueKey];

    const wrap = document.createElement('div');
    wrap.className = 'cap-room-wrapper';

    // exit button
    const exitBtn = document.createElement('button');
    exitBtn.innerHTML = '✕';
    exitBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
      color: white; font-size: 16px; font-weight: 800; cursor: pointer; display: flex;
      align-items: center; justify-content: center; z-index: 10;
    `;
    exitBtn.addEventListener('click', () => {
      playSound('click');
      showScreen('select-league');
    });
    wrap.appendChild(exitBtn);

    const title = document.createElement('h2');
    title.className = 'cap-room-title';
    title.innerText = 'Franchise Setup';
    wrap.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'cap-room-subtitle';
    sub.innerText = `Set strategy for your ${lData.name} franchise`;
    wrap.appendChild(sub);

    // Strategy Card
    const configCard = document.createElement('div');
    configCard.className = 'cr-card';
    configCard.innerHTML = `
      <div style="font-size:0.88rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:15px; text-align:center;">1. Select Era</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px;">
        <div id="era-modern" style="padding:15px 10px; border-radius:12px; border:2px solid #10B981; background:rgba(16,185,129,0.08); text-align:center; cursor:pointer; transition:all 0.2s;">
          <div style="font-size:1.6rem; margin-bottom:4px;">📱</div>
          <div style="font-weight:900; font-size:0.95rem;">Modern Era</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">Current rosters</div>
        </div>
        <div id="era-classic" style="padding:15px 10px; border-radius:12px; border:2px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); text-align:center; cursor:pointer; transition:all 0.2s;">
          <div style="font-size:1.6rem; margin-bottom:4px;">⏳</div>
          <div style="font-weight:900; font-size:0.95rem;">Legends Era</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">90s/00s Hall of Famers</div>
        </div>
      </div>

      <div style="font-size:0.88rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:15px; text-align:center;">2. Select Coaching Scheme</div>
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
        <div id="scheme-offense" style="padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:12px;">
          <div style="font-size:1.4rem;">🔥</div>
          <div>
             <div style="font-weight:900; font-size:0.95rem;">Offense Oriented</div>
             <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;" id="scheme-desc-offense">Rating boosts to offensive players</div>
          </div>
        </div>
        <div id="scheme-defense" style="padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:12px;">
          <div style="font-size:1.4rem;">🛡️</div>
          <div>
             <div style="font-weight:900; font-size:0.95rem;">Defense Oriented</div>
             <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;" id="scheme-desc-defense">Rating boosts to defensive players</div>
          </div>
        </div>
        <div id="scheme-moneyball" style="padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:12px;">
          <div style="font-size:1.4rem;">💰</div>
          <div>
             <div style="font-weight:900; font-size:0.95rem;">Moneyball Scheme</div>
             <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;" id="scheme-desc-moneyball">No boosts, but extra salary cap space</div>
          </div>
        </div>
      </div>
    `;

    wrap.appendChild(configCard);

    // Start Draft Button
    const startBtn = document.createElement('button');
    startBtn.className = 'btn-cr-action';
    startBtn.innerText = '🎮 LOCK SCHEME & START DRAFT';
    wrap.appendChild(startBtn);

    container.appendChild(wrap);

    // Set up descriptions dynamically based on sport
    const offDesc = document.getElementById('scheme-desc-offense');
    const defDesc = document.getElementById('scheme-desc-defense');
    const monDesc = document.getElementById('scheme-desc-moneyball');
     
    if (selectedLeagueKey === 'nba') {
      offDesc.innerText = "+2 Overall Rating to PG, SG, SF";
      defDesc.innerText = "+2 Overall Rating to PF, C, 6th Man";
      monDesc.innerText = "No boosts, but starts with +$10,000,000 Cap Space";
    } else if (selectedLeagueKey === 'nfl') {
      offDesc.innerText = "+2 Overall Rating to QB, WR, TE";
      defDesc.innerText = "+2 Overall Rating to DL, LB, DB";
      monDesc.innerText = "No boosts, but starts with +$10,000,000 Cap Space";
    } else if (selectedLeagueKey === 'nhl') {
      offDesc.innerText = "+2 Overall Rating to C, LW, RW";
      defDesc.innerText = "+2 Overall Rating to LD, RD, G";
      monDesc.innerText = "No boosts, but starts with +$3,000,000 Cap Space";
    }

    // Handle Era Selection
    const modernBtn = document.getElementById('era-modern');
    const classicBtn = document.getElementById('era-classic');
     
    modernBtn.addEventListener('click', () => {
      playSound('click');
      selectedEra = 'modern';
      modernBtn.style.borderColor = '#10B981';
      modernBtn.style.background = 'rgba(16,185,129,0.08)';
      classicBtn.style.borderColor = 'rgba(255,255,255,0.08)';
      classicBtn.style.background = 'rgba(255,255,255,0.02)';
    });

    classicBtn.addEventListener('click', () => {
      playSound('click');
      selectedEra = 'classic';
      classicBtn.style.borderColor = '#10B981';
      classicBtn.style.background = 'rgba(16,185,129,0.08)';
      modernBtn.style.borderColor = 'rgba(255,255,255,0.08)';
      modernBtn.style.background = 'rgba(255,255,255,0.02)';
    });

    // Handle Scheme Selection
    const schemeOff = document.getElementById('scheme-offense');
    const schemeDef = document.getElementById('scheme-defense');
    const schemeMon = document.getElementById('scheme-moneyball');

    function updateSchemeUI(activeId) {
      selectedCoachingStyle = activeId;
      [schemeOff, schemeDef, schemeMon].forEach(el => {
        if (el.id === `scheme-${activeId}`) {
          el.style.borderColor = '#10B981';
          el.style.borderWidth = '2px';
          el.style.background = 'rgba(16,185,129,0.08)';
        } else {
          el.style.borderColor = 'rgba(255,255,255,0.08)';
          el.style.borderWidth = '1px';
          el.style.background = 'rgba(255,255,255,0.02)';
        }
      });
    }

    // Default starting scheme is Moneyball
    updateSchemeUI('moneyball');

    schemeOff.addEventListener('click', () => { playSound('click'); updateSchemeUI('offense'); });
    schemeDef.addEventListener('click', () => { playSound('click'); updateSchemeUI('defense'); });
    schemeMon.addEventListener('click', () => { playSound('click'); updateSchemeUI('moneyball'); });

    // Lock scheme and start draft
    startBtn.addEventListener('click', () => {
      playSound('click');
       
      let finalCap = lData.cap;
      if (selectedCoachingStyle === 'moneyball') {
        if (selectedLeagueKey === 'nhl') {
          finalCap += 3000000;
        } else {
          finalCap += 10000000;
        }
      }
      remainingCap = finalCap;
      positionsToDraft = [...lData.spots];
      // Shuffle positions
      positionsToDraft.sort(() => Math.random() - 0.5);

      rollNextDraftPool();
      showScreen('draft');
    });
  }

  // --- ROLL NEXT DRAFT OPTION POOL ---
  function rollNextDraftPool() {
    const currentSpot = positionsToDraft[currentSpotIndex];
    const lData = CAP_ROOM_DATA[selectedLeagueKey];
    
    // Find matching players in database and filter by selected era
    let pool = [];
    const isLdOrRd = selectedLeagueKey === 'nhl' && (currentSpot === 'LD' || currentSpot === 'RD');
    pool = lData.players.filter(p => {
      // Match position
      const posMatch = isLdOrRd 
        ? ['LD', 'RD', 'D', 'D1', 'D2'].includes(p.position) 
        : p.position === currentSpot;
      
      // Match era (default to 'modern' if not specified)
      const playerEra = p.era || 'modern';
      const eraMatch = playerEra === selectedEra;
      
      return posMatch && eraMatch;
    });

    // Filter out already drafted player names
    const draftedNames = new Set(draftedRoster.map(p => p.name));
    pool = pool.filter(p => !draftedNames.has(p.name));

    // Sort by rating descending
    pool.sort((a, b) => b.rating - a.rating);

    // Choose 5 diverse players representing elite, high, mid, low, and budget tiers
    availableDraftPool = [];
    
    if (pool.length >= 5) {
      // Pick a spread of indices
      const indices = [
        0, 
        Math.floor(pool.length * 0.25), 
        Math.floor(pool.length * 0.5), 
        Math.floor(pool.length * 0.7), 
        pool.length - 1
      ];
      const uniqueIndices = Array.from(new Set(indices));
      uniqueIndices.forEach(idx => {
        availableDraftPool.push(pool[idx]);
      });
      // Ensure exactly 5 options (pad with next items if unique is smaller)
      let padIdx = 1;
      while (availableDraftPool.length < 5 && padIdx < pool.length) {
        if (!availableDraftPool.includes(pool[padIdx])) {
          availableDraftPool.push(pool[padIdx]);
        }
        padIdx++;
      }
    } else {
      availableDraftPool = [...pool];
    }

    // Sort options by rating descending
    availableDraftPool.sort((a, b) => b.rating - a.rating);
  }

  // --- SCREEN 2: DRAFT ROOM SCREEN ---
  function renderDraftScreen() {
    container.innerHTML = '';
    const currentSpot = positionsToDraft[currentSpotIndex];
    const lData = CAP_ROOM_DATA[selectedLeagueKey];
    const totalSpots = positionsToDraft.length;

    const wrap = document.createElement('div');
    wrap.className = 'cap-room-wrapper';

    // exit button
    const exitBtn = document.createElement('button');
    exitBtn.innerHTML = '✕';
    exitBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
      color: white; font-size: 16px; font-weight: 800; cursor: pointer; display: flex;
      align-items: center; justify-content: center; z-index: 10;
    `;
    exitBtn.addEventListener('click', () => {
      playSound('click');
      window.location.href = 'index.html';
    });
    wrap.appendChild(exitBtn);

    // Title / Position
    const headerTitle = document.createElement('h2');
    headerTitle.className = 'cap-room-title';
    headerTitle.innerText = `Drafting: ${currentSpot}`;
    wrap.appendChild(headerTitle);

    const sub = document.createElement('p');
    sub.className = 'cap-room-subtitle';
    sub.innerText = `Position ${currentSpotIndex + 1} of ${totalSpots} (${lData.name} · ${selectedEra === 'classic' ? 'Legends Era' : 'Modern Era'})`;
    wrap.appendChild(sub);

    // Cap Room Progress Box
    const capCard = document.createElement('div');
    capCard.className = 'cr-card';
    
    // Spent Cap vs Max Cap
    let totalCapVal = lData.cap;
    if (selectedCoachingStyle === 'moneyball') {
      totalCapVal += (selectedLeagueKey === 'nhl' ? 3000000 : 10000000);
    }
    const spentCap = totalCapVal - remainingCap;
    const capPercent = (spentCap / totalCapVal) * 100;

    capCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:700; margin-bottom:8px; color:#cbd5e1;">
        <div>Spent: <span style="color:#eab308; font-weight:900;">${formatMoney(spentCap)}</span></div>
        <div>Cap Space Left: <span style="color:#10B981; font-weight:900;">${formatMoney(remainingCap)}</span></div>
      </div>
      <div class="cap-bar-container">
        <div class="cap-bar-fill ${capPercent > 90 ? 'warning' : ''}" style="width: ${capPercent}%;"></div>
      </div>
    `;
    wrap.appendChild(capCard);

    // Draft Options List
    const draftCard = document.createElement('div');
    draftCard.className = 'cr-card';
    draftCard.innerHTML = `<div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:12px;">Draft Options</div>`;

    const optionsContainer = document.createElement('div');
    
    // Check if any player in the pool is affordable
    const hasAffordable = availableDraftPool.some(p => p.salary <= remainingCap);

    availableDraftPool.forEach(player => {
      const isAffordable = player.salary <= remainingCap;
      const pCard = document.createElement('div');
      pCard.className = `draft-player-card ${!isAffordable ? 'disabled' : ''}`;
      pCard.style.cursor = 'pointer';
      
      const baseRating = player.rating;
      const boostedRating = getBoostedRating(player);
      const hasBoost = boostedRating > baseRating;

      pCard.innerHTML = `
        <div class="player-ovr" style="flex-direction:column; font-size:1.15rem; line-height:1.1; width:48px; height:48px; border-radius:10px; background:linear-gradient(135deg, #10B981, #3B82F6);">
          <span>${boostedRating}</span>
          <span style="font-size:0.45rem; font-weight:800; opacity:0.85; text-transform:uppercase;">Rating</span>
        </div>
        <div style="flex:1; padding-right: 6px;">
          <div style="font-weight:800; font-size:1.05rem; color:#fff;">${player.name}</div>
          <div style="font-size:0.8rem; color:#cbd5e1; font-weight:700; margin-top:2px;">
            Position: <span style="color:#34d399; font-weight:900;">${player.position}</span> · ${player.team} · Rating: <span style="color:${hasBoost ? '#34d399' : '#10B981'}; font-weight:900;">${boostedRating} Overall${hasBoost ? ' (+2)' : ''}</span>
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div style="font-weight:900; color:#fff; font-size:0.95rem; margin-bottom:4px;">${formatMoney(player.salary)}</div>
          <button class="draft-action-btn" ${!isAffordable ? 'disabled style="background:#334155; color:#64748b; cursor:not-allowed;"' : ''}>DRAFT</button>
        </div>
      `;

      // Draft action when clicking button
      if (isAffordable) {
        pCard.querySelector('.draft-action-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          playSound('draft');
          draftPlayer(player);
        });
      }

      // Open detail modal when clicking card body
      pCard.addEventListener('click', (e) => {
        if (e.target.classList.contains('draft-action-btn')) return;
        showPlayerCardModal(player);
      });

      optionsContainer.appendChild(pCard);
    });

    // Lockout Protection: Minimum contract filler option
    if (!hasAffordable) {
      const filler = lData.filler;
      const fillerCard = document.createElement('div');
      fillerCard.className = 'draft-player-card';
      fillerCard.style.borderColor = '#ef4444';
      fillerCard.style.background = 'rgba(239,68,68,0.05)';
      fillerCard.style.cursor = 'pointer';
      
      fillerCard.innerHTML = `
        <div class="player-ovr filler" style="flex-direction:column; font-size:1.15rem; line-height:1.1; width:48px; height:48px;">
          <span>${filler.rating}</span>
          <span style="font-size:0.45rem; font-weight:800; opacity:0.85; text-transform:uppercase;">Rating</span>
        </div>
        <div style="flex:1; padding-right: 6px;">
          <div style="font-weight:800; font-size:1.05rem; color:#fca5a5;">⚠️ ${filler.name}</div>
          <div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">
            Emergency fallback player · Rating: <span style="font-weight:800;">${filler.rating} Overall</span>
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div style="font-weight:900; color:#ef4444; font-size:0.95rem; margin-bottom:4px;">${formatMoney(filler.salary)}</div>
          <button class="draft-action-btn" style="background:#ef4444;">DRAFT FILLER</button>
        </div>
      `;

      fillerCard.querySelector('.draft-action-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('draft');
        draftPlayer({
          ...filler,
          position: currentSpot // Assign current spot position
        });
      });

      fillerCard.addEventListener('click', (e) => {
        if (e.target.classList.contains('draft-action-btn')) return;
        showPlayerCardModal({
          ...filler,
          position: currentSpot
        });
      });

      optionsContainer.appendChild(fillerCard);

      const warningNotice = document.createElement('div');
      warningNotice.style.cssText = 'color:#fca5a5; font-size:0.82rem; margin-top:8px; font-weight:700; text-align:center;';
      warningNotice.innerText = "🚨 CAP SQUEEZE: You cannot afford any of today's regular rolls! You must take a Roster Filler.";
      optionsContainer.appendChild(warningNotice);
    }

    draftCard.appendChild(optionsContainer);

    // Re-roll strategic button row
    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'margin-top: 18px; display: flex; justify-content: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top:14px;';
    
    const rerollBtn = document.createElement('button');
    rerollBtn.className = 'btn-cr-action btn-cr-outline';
    rerollBtn.style.cssText = 'width: auto; padding: 10px 20px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; border-radius: 10px; margin: 0 auto;';
    
    if (reRollsLeft > 0) {
      rerollBtn.innerHTML = `🔄 Re-roll Options (${reRollsLeft} Left)`;
      rerollBtn.addEventListener('click', () => {
        playSound('click');
        reRollsLeft--;
        rollNextDraftPool();
        renderDraftScreen();
      });
    } else {
      rerollBtn.innerHTML = `🔄 Out of Re-rolls`;
      rerollBtn.disabled = true;
      rerollBtn.style.opacity = '0.4';
      rerollBtn.style.cursor = 'not-allowed';
    }
    
    actionRow.appendChild(rerollBtn);
    draftCard.appendChild(actionRow);

    wrap.appendChild(draftCard);

    // Current Roster Layout
    const rosterCard = document.createElement('div');
    rosterCard.className = 'cr-card';
    rosterCard.innerHTML = `<div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:12px;">Roster Draft Board</div>`;
    
    const rosterGrid = document.createElement('div');
    rosterGrid.className = 'roster-grid';

    positionsToDraft.forEach(spot => {
      const matchedPlayer = draftedRoster.find(p => p.position === spot);
      const cell = document.createElement('div');
      
      if (matchedPlayer) {
        const boosted = getBoostedRating(matchedPlayer);
        cell.className = 'roster-cell filled';
        cell.innerHTML = `
          <div style="font-weight:800; color:#10B981;">${spot}</div>
          <div style="font-weight:700; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${matchedPlayer.name} (${boosted})
          </div>
        `;
      } else {
        cell.className = 'roster-cell';
        cell.innerHTML = `
          <div style="font-weight:700; color:#475569;">${spot}</div>
          <div style="color:#64748b; font-style:italic;">Empty</div>
        `;
      }
      rosterGrid.appendChild(cell);
    });

    rosterCard.appendChild(rosterGrid);
    wrap.appendChild(rosterCard);
    container.appendChild(wrap);
  }

  function draftPlayer(player) {
    draftedRoster.push(player);
    
    // Deduct salary, floor remaining cap at 0
    remainingCap = Math.max(0, remainingCap - player.salary);
    
    currentSpotIndex++;
    if (currentSpotIndex < positionsToDraft.length) {
      rollNextDraftPool();
      renderDraftScreen();
    } else {
      showScreen('review');
    }
  }

  // --- SCREEN 3: ROSTER REVIEW SCREEN ---
  function renderReviewScreen() {
    container.innerHTML = '';
    const lData = CAP_ROOM_DATA[selectedLeagueKey];
    
    // Calculate Average OVR Rating (with scheme boosts)
    const totalRating = draftedRoster.reduce((sum, p) => sum + getBoostedRating(p), 0);
    const avgRating = Math.round(totalRating / draftedRoster.length);

    const wrap = document.createElement('div');
    wrap.className = 'cap-room-wrapper';

    const exitBtn = document.createElement('button');
    exitBtn.innerHTML = '✕';
    exitBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
      color: white; font-size: 16px; font-weight: 800; cursor: pointer; display: flex;
      align-items: center; justify-content: center; z-index: 10;
    `;
    exitBtn.addEventListener('click', () => {
      playSound('click');
      window.location.href = 'index.html';
    });
    wrap.appendChild(exitBtn);

    const title = document.createElement('h2');
    title.className = 'cap-room-title';
    title.innerText = 'Roster Locked';
    wrap.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'cap-room-subtitle';
    sub.innerText = `Review your drafted team (${lData.name})`;
    wrap.appendChild(sub);

    // Summary Card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'cr-card';
    summaryCard.style.cssText = 'display:flex; justify-content:space-around; align-items:center; padding:15px; margin-bottom:15px;';
    
    let schemeLabel = "Standard Balanced";
    if (selectedCoachingStyle === 'offense') schemeLabel = "Offense Scheme (+2)";
    if (selectedCoachingStyle === 'defense') schemeLabel = "Defense Scheme (+2)";
    if (selectedCoachingStyle === 'moneyball') schemeLabel = "Moneyball Cap Advantage";

    summaryCard.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:0.78rem; color:#64748b; font-weight:800; text-transform:uppercase;">Team Strength</div>
        <div class="ovr-badge" style="margin-top:2px;">${avgRating} Overall</div>
        <div style="font-size:0.65rem; color:#10B981; font-weight:700; margin-top:2px;">${schemeLabel}</div>
      </div>
      <div style="width:1px; height:60px; background:rgba(255,255,255,0.08);"></div>
      <div style="text-align:center;">
        <div style="font-size:0.78rem; color:#64748b; font-weight:800; text-transform:uppercase;">Cap Remaining</div>
        <div style="font-size:1.6rem; font-weight:900; color:#10B981; margin-top:2px;">${formatMoney(remainingCap)}</div>
      </div>
    `;
    wrap.appendChild(summaryCard);

    // Final roster listing
    const listCard = document.createElement('div');
    listCard.className = 'cr-card';
    listCard.innerHTML = `<div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:12px;">Drafted Lineup</div>`;

    const rosterList = document.createElement('div');
    rosterList.style.cssText = 'display:flex; flex-direction:column; gap:8px;';

    draftedRoster.forEach(player => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius:10px; cursor:pointer; transition:all 0.2s;';
      
      const base = player.rating;
      const boosted = getBoostedRating(player);
      const hasBoost = boosted > base;

      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.8rem; font-weight:800; background:#3b82f6; color:#fff; width:35px; height:22px; border-radius:4px; display:flex; align-items:center; justify-content:center;">
            ${player.position}
          </span>
          <span style="font-weight:700; color:#fff;">${player.name}</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:0.8rem; font-weight:800; color:${hasBoost ? '#34d399' : '#10B981'};">Overall Rating: ${boosted}${hasBoost ? ' (+2)' : ''}</span>
          <span style="font-size:0.85rem; color:#94a3b8; font-weight:700;">${formatMoney(player.salary)}</span>
        </div>
      `;

      item.addEventListener('mouseenter', () => {
        item.style.borderColor = '#10B981';
        item.style.background = 'rgba(16, 185, 129, 0.05)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.borderColor = 'rgba(255,255,255,0.05)';
        item.style.background = 'rgba(255,255,255,0.02)';
      });
      item.addEventListener('click', () => {
        showPlayerCardModal(player);
      });

      rosterList.appendChild(item);
    });

    listCard.appendChild(rosterList);
    wrap.appendChild(listCard);

    // Button to start sim
    const startSimBtn = document.createElement('button');
    startSimBtn.className = 'btn-cr-action';
    startSimBtn.innerText = '🚀 START SEASON SIMULATION';
    startSimBtn.addEventListener('click', () => {
      playSound('click');
      showScreen('simulation');
    });
    wrap.appendChild(startSimBtn);

    container.appendChild(wrap);
  }

  // --- SCREEN 4: SIMULATION SCREEN ---
  function renderSimulationScreen() {
    container.innerHTML = '';
    const lData = CAP_ROOM_DATA[selectedLeagueKey];

    const wrap = document.createElement('div');
    wrap.className = 'cap-room-wrapper';

    const title = document.createElement('h2');
    title.className = 'cap-room-title';
    title.innerText = 'Simulating...';
    wrap.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'cap-room-subtitle';
    sub.innerText = `Simulating full schedule for ${lData.name}`;
    wrap.appendChild(sub);

    // simulation ticker card
    const simCard = document.createElement('div');
    simCard.className = 'cr-card';
    simCard.innerHTML = `
      <div style="display:flex; justify-content:space-around; align-items:center; text-align:center; padding:10px 0; margin-bottom:15px;">
        <div>
          <div style="font-size:0.8rem; color:#64748b; font-weight:800; text-transform:uppercase;">Wins</div>
          <div id="sim-wins" style="font-size:2.8rem; font-weight:900; color:#10B981; line-height:1;">0</div>
        </div>
        <div>
          <div style="font-size:0.8rem; color:#64748b; font-weight:800; text-transform:uppercase;">Losses</div>
          <div id="sim-losses" style="font-size:2.8rem; font-weight:900; color:#ef4444; line-height:1;">0</div>
        </div>
      </div>
      <div id="sim-stage" style="font-weight:900; color:#fff; text-align:center; font-size:1.1rem; margin-bottom:10px; text-transform:uppercase;">Regular Season</div>
    `;
    
    // Logs Box
    const logsBox = document.createElement('div');
    logsBox.className = 'sim-logs-container';
    logsBox.id = 'sim-logs-box';
    simCard.appendChild(logsBox);

    wrap.appendChild(simCard);
    container.appendChild(wrap);

    // Start running simulation ticks
    runSimulationTicks();
  }

  function addLog(text) {
    simLogs.push(text);
    const box = document.getElementById('sim-logs-box');
    if (box) {
      const line = document.createElement('div');
      line.innerText = text;
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
    }
  }

  async function runSimulationTicks() {
    const totalGames = selectedLeagueKey === 'nfl' ? 17 : 82;
    
    // Average rating (with scheme boosts applied)
    const totalRating = draftedRoster.reduce((sum, p) => sum + getBoostedRating(p), 0);
    const avgRating = totalRating / draftedRoster.length;

    // Base win probability compared to an average team (rating 82)
    // 82 Overall = 50% chance, 90 Overall = 82% chance
    const baseProb = 0.5 + (avgRating - 82) * 0.04;
    const winProbability = Math.max(0.15, Math.min(0.95, baseProb));

    // Opponent team list
    const nflOpponents = ["Bills", "Ravens", "Chiefs", "Bengals", "Texans", "Packers", "Lions", "49ers", "Cowboys", "Eagles", "Dolphins", "Jets"];
    const nbaOpponents = ["Celtics", "Lakers", "Nuggets", "Bucks", "Suns", "Knicks", "Timberwolves", "Mavericks", "Heat", "Thunder", "Cavaliers"];
    const nhlOpponents = ["Rangers", "Oilers", "Panthers", "Bruins", "Avalanche", "Knights", "Hurricanes", "Stars", "Maple Leafs", "Canucks"];
    const oppList = selectedLeagueKey === 'nfl' ? nflOpponents : (selectedLeagueKey === 'nba' ? nbaOpponents : nhlOpponents);

    // 1. Regular Season Sim Ticks
    for (let i = 1; i <= totalGames; i++) {
      const opp = oppList[Math.floor(Math.random() * oppList.length)];
      const wonGame = Math.random() < winProbability;
      
      if (wonGame) {
        wins++;
        addLog(`Game ${i}: W vs ${opp}`);
      } else {
        losses++;
        addLog(`Game ${i}: L vs ${opp}`);
      }

      const winsEl = document.getElementById('sim-wins');
      const lossesEl = document.getElementById('sim-losses');
      if (winsEl) winsEl.innerText = wins;
      if (lossesEl) lossesEl.innerText = losses;

      // Fast tick rate
      await new Promise(r => setTimeout(r, 60));
    }

    // 2. Playoff Qualification check
    const playoffThreshold = selectedLeagueKey === 'nfl' ? 9 : 42;
    const qualified = wins >= playoffThreshold;

    await new Promise(r => setTimeout(r, 1000));
    
    const stageEl = document.getElementById('sim-stage');
    if (stageEl) {
      stageEl.innerText = "Playoffs Bracket";
      stageEl.style.color = "#eab308";
    }

    if (!qualified) {
      playoffFinish = "Missed Playoffs";
      playoffProgress = 0;
      addLog(`❌ Season over. You missed the playoffs.`);
      playSound('fail');
      await new Promise(r => setTimeout(r, 1500));
      showScreen('results');
      return;
    }

    addLog(`🎉 CLINCHED PLAYOFFS! Simulating Bracket...`);
    playSound('success');
    await new Promise(r => setTimeout(r, 1500));

    // Playoff rounds simulation
    const playoffRounds = [
      { name: "Quarterfinals", oppRating: 84 },
      { name: "Semifinals", oppRating: 88 },
      { name: "League Finals", oppRating: 92 }
    ];

    for (let r = 0; r < playoffRounds.length; r++) {
      const round = playoffRounds[r];
      if (stageEl) stageEl.innerText = round.name;
      
      const oppTeam = oppList[Math.floor(Math.random() * oppList.length)];
      addLog(`Playoffs: Facing the ${oppTeam} in the ${round.name}...`);
      await new Promise(r => setTimeout(r, 1000));

      // Check win probability in this round (team OVR vs Opponent OVR)
      const roundProb = 0.5 + (avgRating - round.oppRating) * 0.04;
      const matchProb = Math.max(0.1, Math.min(0.9, roundProb));

      let advanced = false;
      if (selectedLeagueKey === 'nfl') {
        // Single game elimination
        advanced = Math.random() < matchProb;
        if (advanced) {
          addLog(`🏆 Game Won! Advanced past the ${oppTeam}.`);
          playSound('success');
        } else {
          addLog(`💔 Game Lost. Eliminated by the ${oppTeam}.`);
          playSound('fail');
        }
      } else {
        // Best of 7 Series
        let userSeriesWins = 0;
        let oppSeriesWins = 0;
        addLog(`Series starts: Best of 7 vs ${oppTeam}`);
        
        while (userSeriesWins < 4 && oppSeriesWins < 4) {
          const gameWon = Math.random() < matchProb;
          if (gameWon) userSeriesWins++;
          else oppSeriesWins++;
          
          addLog(`  Series Game: ${userSeriesWins} - ${oppSeriesWins}`);
          await new Promise(r => setTimeout(r, 120));
        }

        advanced = userSeriesWins === 4;
        if (advanced) {
          addLog(`🏆 Won Series 4-${oppSeriesWins}! Advanced!`);
          playSound('success');
        } else {
          addLog(`💔 Lost Series ${userSeriesWins}-4. Eliminated.`);
          playSound('fail');
        }
      }

      await new Promise(r => setTimeout(r, 1500));

      if (!advanced) {
        if (r === 0) {
          playoffFinish = "Quarterfinals";
          playoffProgress = 1;
        } else if (r === 1) {
          playoffFinish = "Semifinals";
          playoffProgress = 2;
        } else if (r === 2) {
          playoffFinish = "Finals Runner-up";
          playoffProgress = 3;
        }
        showScreen('results');
        return;
      }
    }

    // Won all rounds!
    playoffFinish = "Champions";
    playoffProgress = 4;
    addLog(`🏆 CHAMPIONS! You won the title!`);
    playSound('win');
    await new Promise(r => setTimeout(r, 2000));
    showScreen('results');
  }

  // --- SCREEN 5: WIN / RESULTS SCREEN ---
  function renderResultsScreen() {
    container.innerHTML = '';
    const lData = CAP_ROOM_DATA[selectedLeagueKey];

    // Calculate rating and grade (using scheme-boosted ratings)
    const totalRating = draftedRoster.reduce((sum, p) => sum + getBoostedRating(p), 0);
    const avgRating = Math.round(totalRating / draftedRoster.length);

    let letterGrade = "F";
    if (avgRating >= 94 && remainingCap >= 1000000) letterGrade = "A+";
    else if (avgRating >= 90) letterGrade = "A";
    else if (avgRating >= 86) letterGrade = "B";
    else if (avgRating >= 82) letterGrade = "C";
    else if (avgRating >= 78) letterGrade = "D";
    else letterGrade = "F";

    // Payout logic
    let coinsEarned = 20; // Base participation
    if (playoffProgress >= 1) coinsEarned += 15; // Playoffs
    if (playoffProgress >= 3) coinsEarned += 20; // Finals
    if (playoffProgress === 4) coinsEarned += 30; // Champion
    // Under cap bonus
    let originalCap = lData.cap;
    if (selectedCoachingStyle === 'moneyball') {
      originalCap += (selectedLeagueKey === 'nhl' ? 3000000 : 10000000);
    }
    if (remainingCap >= originalCap * 0.1) coinsEarned += 15;

    // Best player finder (using boosted ratings)
    const bestPlayer = [...draftedRoster].sort((a,b) => getBoostedRating(b) - getBoostedRating(a))[0];
    const bestPlayerBoosted = getBoostedRating(bestPlayer);

    // Score saving formula
    const finalScore = (playoffProgress * 10000000) + (wins * 100000) + (avgRating * 100) + Math.min(99, Math.floor(remainingCap / 1000000));

    // Submit competitive score
    if (!window.isPracticeMode && window.saveScore) {
      const user = auth.currentUser;
      const uid = user ? user.uid : "guest";
      const timestamp = Date.now();
      const signature = generateScoreSignature(uid, 'Cap Room', finalScore, timestamp);
      window.saveScore('Cap Room', finalScore, signature, timestamp);
    }

    const wrap = document.createElement('div');
    wrap.className = 'cap-room-wrapper';

    const title = document.createElement('h2');
    title.className = 'cap-room-title';
    title.innerText = playoffFinish === "Champions" ? '🏆 CHAMPIONSHIP WON!' : 'Season Completed';
    title.style.color = playoffFinish === "Champions" ? '#10B981' : '#fff';
    wrap.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'cap-room-subtitle';
    sub.innerText = `Final results for your drafted lineup (${lData.name})`;
    wrap.appendChild(sub);

    // Grade and Summary Card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'cr-card';
    summaryCard.innerHTML = `
      <div class="grade-badge">${letterGrade}</div>
      <div style="font-size:1.15rem; font-weight:800; text-align:center; color:#fff; margin-bottom:15px;">
        ${playoffFinish === "Champions" ? '🏆 Champions' : playoffFinish} (${wins}-${losses})
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; border-top:1px solid rgba(255,255,255,0.06); padding-top:15px; text-align:center; font-size:0.9rem;">
        <div style="border-right: 1px solid rgba(255,255,255,0.06);">
          <div style="font-size:0.8rem; color:#64748b; font-weight:800; text-transform:uppercase;">Team Strength</div>
          <div style="font-size:1.3rem; font-weight:900; color:#fff; margin-top:2px;">${avgRating} Overall</div>
        </div>
        <div>
          <div style="font-size:0.8rem; color:#64748b; font-weight:800; text-transform:uppercase;">Coins Earned</div>
          <div style="font-size:1.3rem; font-weight:900; color:#eab308; margin-top:2px;">+${coinsEarned} 🪙</div>
        </div>
        <div style="border-right: 1px solid rgba(255,255,255,0.06); border-top: 1px solid rgba(255,255,255,0.06); padding-top:8px; margin-top:8px;">
          <div style="font-size:0.8rem; color:#64748b; font-weight:800; text-transform:uppercase;">Cap Remaining</div>
          <div style="font-size:1.3rem; font-weight:900; color:#10B981; margin-top:2px;">${formatMoney(remainingCap)}</div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top:8px; margin-top:8px;">
          <div style="font-size:0.8rem; color:#64748b; font-weight:800; text-transform:uppercase;">Best Player</div>
          <div style="font-size:1.1rem; font-weight:800; color:#fff; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${bestPlayer.name} (${bestPlayerBoosted} Overall)
          </div>
        </div>
      </div>
    `;
    wrap.appendChild(summaryCard);

    // List of drafted team
    const teamCard = document.createElement('div');
    teamCard.className = 'cr-card';
    teamCard.innerHTML = `<div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:12px; text-align:center;">Your Roster</div>`;

    const rosterList = document.createElement('div');
    rosterList.style.cssText = 'display:flex; flex-direction:column; gap:6px;';
    draftedRoster.forEach(p => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.02); border: 1px solid transparent; border-radius:8px; cursor:pointer; transition:all 0.2s;';
      
      const base = p.rating;
      const boosted = getBoostedRating(p);
      const hasBoost = boosted > base;

      row.innerHTML = `
        <span style="font-weight:700;">${p.name} <span style="font-size:0.75rem; color:#64748b; font-weight:800;">${p.position}</span></span>
        <span style="font-weight:800; color:${hasBoost ? '#34d399' : '#10B981'};">Overall Rating: ${boosted}${hasBoost ? ' (+2)' : ''}</span>
      `;

      row.addEventListener('mouseenter', () => {
        row.style.borderColor = '#10B981';
        row.style.background = 'rgba(16, 185, 129, 0.05)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.borderColor = 'transparent';
        row.style.background = 'rgba(255,255,255,0.02)';
      });
      row.addEventListener('click', () => {
        showPlayerCardModal(p);
      });

      rosterList.appendChild(row);
    });
    teamCard.appendChild(rosterList);
    wrap.appendChild(teamCard);

    // Action buttons
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; flex-direction:column; gap:10px; width:100%;';

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn-cr-action';
    shareBtn.innerText = '🔗 SHARE TEAM RESULTS';
    shareBtn.addEventListener('click', () => {
      playSound('click');
      copyShareCard();
    });
    actions.appendChild(shareBtn);

    const replayBtn = document.createElement('button');
    replayBtn.className = 'btn-cr-action btn-cr-outline';
    replayBtn.innerText = '🔄 DRAFT NEW TEAM';
    replayBtn.addEventListener('click', () => {
      playSound('click');
      showScreen('select-league');
    });
    actions.appendChild(replayBtn);

    const lobbyBtn = document.createElement('button');
    lobbyBtn.className = 'btn-cr-action btn-cr-outline';
    lobbyBtn.innerText = '🏠 BACK TO LOBBY';
    lobbyBtn.addEventListener('click', () => {
      playSound('click');
      window.location.href = 'index.html';
    });
    actions.appendChild(lobbyBtn);

    wrap.appendChild(actions);
    container.appendChild(wrap);

    // Copy Results helper
    function copyShareCard() {
      const shareText = `🎮 Cap Room - ${lData.name}\nRecord: ${wins}-${losses} (${playoffFinish})\nTeam Grade: ${letterGrade} (${avgRating} Overall Rating)\nCap Remaining: ${formatMoney(remainingCap)}\nBest Player: ${bestPlayer.name} (${bestPlayerBoosted} Overall Rating)\nPlayHaus Arcade\nhttps://playhaus.fun`;
      
      navigator.clipboard.writeText(shareText).then(() => {
        // Show Toast
        const lbContainer = document.getElementById('toast-container');
        if (lbContainer && window.showToast) {
          window.showToast("📋 Results copied to clipboard! Share with friends!", "success");
        } else {
          alert("Clipboard: Results copied!");
        }
      }).catch(err => {
        console.error("Copy failed", err);
      });
    }
  }

  // --- INITIAL ROUTE ---
  showScreen('select-league');
}
