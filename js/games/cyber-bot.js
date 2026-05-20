export function init(container) {
  container.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      .cb-wrapper {
        font-family: 'Outfit', sans-serif;
        color: #fff; width: 100%; max-width: 500px; margin: 0 auto;
        height: 700px; background: #0f172a;
        border: 2px solid #334155; border-radius: 16px;
        overflow: hidden; position: relative;
        user-select: none; display: flex; flex-direction: column;
      }

      /* HEADER */
      .cb-header {
        display: flex; justify-content: space-around; align-items: center;
        background: #1e293b; padding: 15px; border-bottom: 2px solid #334155; z-index: 50;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      }
      .c-stat { text-align: center; font-weight: 900; font-size: 1.2rem; }
      .c-stat span { font-size: 0.7rem; color: #888; display: block; text-transform: uppercase; }
      .c-eng { color: #10B981; } .c-cred { color: #F59E0B; }

      /* CONTENT VIEWS */
      .cb-content { flex: 1; position: relative; overflow: hidden; background: radial-gradient(circle at center, #1e293b, #0f172a); }
      .cb-view { position: absolute; inset: 0; display: none; flex-direction: column; }
      .cb-view.active { display: flex; }

      /* TAB BAR */
      .cb-tabbar {
        display: flex; background: #1e293b; border-top: 2px solid #334155; height: 70px; z-index: 50;
      }
      .cb-tab {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: #888; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 0.8rem; gap: 4px;
      }
      .cb-tab.active { color: #38BDF8; background: rgba(56,189,248,0.1); border-top: 3px solid #38BDF8; }

      /* UI CARDS */
      .cb-title { font-size: 2rem; font-weight: 900; margin: 20px 0; text-align: center; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
      .cb-scroll { flex: 1; overflow-y: auto; padding: 0 20px 20px 20px; }
      .cb-card {
        background: rgba(30,41,59,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
        padding: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.1s;
      }
      .cb-card:active { transform: scale(0.98); }
      .cb-card-info h4 { margin: 0 0 5px 0; font-size: 1.2rem; }
      .cb-card-info p { margin: 0; color: #aaa; font-size: 0.8rem; }
      .cb-btn {
        background: #38BDF8; color: #000; border: none; padding: 12px 24px; border-radius: 8px;
        font-weight: 900; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 0 #0284c7;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .cb-btn:active, .cb-btn.pressed { transform: translateY(4px); box-shadow: 0 0 0 #0284c7; }

      /* BOT VISUALS */
      .bot-stage { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 200px; height: 60px; background: rgba(0,0,0,0.3); border-radius: 50%; border: 2px solid rgba(56,189,248,0.3); box-shadow: 0 0 20px rgba(56,189,248,0.2); }
      .bot { position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%); width: 60px; height: 80px; z-index: 10; }
      .bot-body { position: absolute; bottom: 15px; left: 0; width: 60px; height: 50px; background: #64748b; border-radius: 15px; border: 3px solid #334155; z-index: 2; transition: background 0.3s; box-shadow: inset 0 -10px 0 rgba(0,0,0,0.2); }
      .bot-eye-l, .bot-eye-r { position: absolute; top: 12px; width: 14px; height: 20px; background: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 5px #38BDF8; }
      .bot-eye-l { left: 10px; } .bot-eye-r { right: 10px; }
      .bot-pupil { width: 8px; height: 10px; background: #0f172a; border-radius: 50%; }
      .bot-legs { position: absolute; bottom: 0; left: 20px; width: 20px; height: 15px; background: #475569; border-radius: 4px; z-index: 1; }
      .bot-arms { position: absolute; top: 25px; left: -10px; width: 80px; height: 10px; background: #475569; border-radius: 5px; z-index: 1; }
      
      .anim-idle { animation: idle 2s infinite alternate ease-in-out; }
      @keyframes idle { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(-5px); } }

      /* GARAGE STATS */
      .g-stats { display: flex; gap: 10px; padding: 20px; }
      .g-stat-box { flex: 1; background: rgba(0,0,0,0.5); padding: 15px 10px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
      .g-stat-title { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
      .g-stat-val { font-size: 1.5rem; font-weight: 900; margin-bottom: 10px; }
      .g-bar-bg { height: 8px; background: #334155; border-radius: 4px; overflow: hidden; position: relative; }
      .g-bar-fill { position: absolute; top: 0; left: 0; height: 100%; transition: width 0.2s; }

      /* MINIGAME: SPEED (MASH) */
      .mg-mash-btn { width: 200px; height: 200px; border-radius: 50%; background: #38BDF8; margin: 40px auto; border: 10px solid #0284c7; box-shadow: 0 15px 0 #0369a1, 0 0 50px rgba(56,189,248,0.5); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 900; color: #fff; cursor: pointer; transition: transform 0.05s, box-shadow 0.05s; }
      .mg-mash-btn:active, .mg-mash-btn.pressed { transform: translateY(15px); box-shadow: 0 0 0 #0369a1, 0 0 20px rgba(56,189,248,0.5); background: #7dd3fc; }
      
      /* MINIGAME: FLY (BALANCE) */
      .mg-fly-area { width: 60px; height: 300px; background: #1e293b; border: 4px solid #334155; border-radius: 30px; margin: 40px auto; position: relative; overflow: hidden; }
      .mg-fly-target { position: absolute; left: 0; width: 100%; height: 80px; background: rgba(16,185,129,0.3); border-top: 4px solid #10B981; border-bottom: 4px solid #10B981; }
      .mg-fly-cursor { position: absolute; left: 10px; width: 32px; height: 32px; background: #8B5CF6; border-radius: 50%; box-shadow: 0 0 15px #8B5CF6; border: 4px solid #fff; }

      /* MINIGAME: POWER (TIMING) */
      .mg-pow-area { width: 80%; height: 40px; background: #1e293b; border: 4px solid #334155; border-radius: 20px; margin: 80px auto; position: relative; }
      .mg-pow-target { position: absolute; left: 50%; transform: translateX(-50%); width: 40px; height: 100%; background: rgba(244,63,94,0.3); border-left: 4px solid #F43F5E; border-right: 4px solid #F43F5E; }
      .mg-pow-cursor { position: absolute; top: -10px; left: 0; width: 10px; height: 52px; background: #fff; box-shadow: 0 0 10px #fff; border-radius: 5px; }

      .mg-timer-bar { position: absolute; top: 0; left: 0; height: 6px; background: #F59E0B; width: 100%; }

      /* RACE */
      .race-track { position: absolute; top: 60px; left: 0; width: 10000px; height: 200px; display: flex; }
      .r-zone { height: 100%; position: relative; border-right: 4px dashed #fff; display: flex; align-items: flex-end; }
      .z-spd { background: repeating-linear-gradient(45deg, #0f172a, #0f172a 20px, #1e293b 20px, #1e293b 40px); border-bottom: 10px solid #38BDF8; }
      .z-fly { background: #1e1b4b; border-bottom: 10px solid transparent; } /* Gap */
      .z-pow { background: #4c0519; border-bottom: 10px solid #F43F5E; } /* Walls */
      .r-wall { position: absolute; bottom: 0; left: 50%; width: 40px; height: 100px; background: #F43F5E; border: 4px solid #fff; border-radius: 8px 8px 0 0; }
      
      .r-bot { position: absolute; bottom: 0; transition: left 0.1s linear, bottom 0.1s linear; z-index: 10; transform: scale(0.7); transform-origin: bottom center; }
      
      .race-energy-container { position: absolute; bottom: 20px; left: 20px; right: 20px; background: #1e293b; height: 24px; border-radius: 12px; z-index: 50; overflow: hidden; border: 3px solid #334155; }
      .race-energy-fill { height: 100%; background: #10B981; transition: width 0.1s; }

      /* EFFECTS */
      .particle { position: absolute; pointer-events: none; font-weight: 900; font-size: 1.5rem; animation: popUp 0.8s forwards; z-index: 100; text-shadow: 0 2px 4px #000; }
      @keyframes popUp { 0% { opacity: 1; transform: scale(0.5) translateY(0); } 50% { transform: scale(1.2) translateY(-30px); } 100% { opacity: 0; transform: scale(1) translateY(-50px); } }
      .screen-shake { animation: shake 0.3s; }
      @keyframes shake { 0%,100%{transform:translate(0,0);} 25%{transform:translate(-5px,-5px);} 50%{transform:translate(5px,5px);} 75%{transform:translate(-5px,5px);} }
      
      .overlay-msg { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; }

    </style>

    <div class="cb-wrapper" id="cb-main">
      
      <!-- HEADER -->
      <div class="cb-header">
        <div class="c-stat c-eng"><div id="h-eng">100</div><span>Energy</span></div>
        <div class="c-stat c-cred"><div id="h-cred">50</div><span>Coins</span></div>
      </div>

      <!-- CONTENT -->
      <div class="cb-content">
        
        <!-- 1. GARAGE -->
        <div class="cb-view active" id="view-garage">
          <div class="g-stats">
            <div class="g-stat-box">
              <div class="g-stat-title" style="color:#38BDF8;">SPEED</div>
              <div class="g-stat-val" id="lvl-spd">1</div>
              <div class="g-bar-bg"><div class="g-bar-fill" id="bar-spd" style="background:#38BDF8; width:0%;"></div></div>
            </div>
            <div class="g-stat-box">
              <div class="g-stat-title" style="color:#8B5CF6;">FLIGHT</div>
              <div class="g-stat-val" id="lvl-fly">1</div>
              <div class="g-bar-bg"><div class="g-bar-fill" id="bar-fly" style="background:#8B5CF6; width:0%;"></div></div>
            </div>
            <div class="g-stat-box">
              <div class="g-stat-title" style="color:#F43F5E;">POWER</div>
              <div class="g-stat-val" id="lvl-pow">1</div>
              <div class="g-bar-bg"><div class="g-bar-fill" id="bar-pow" style="background:#F43F5E; width:0%;"></div></div>
            </div>
          </div>
          
          <div class="bot-stage"></div>
          <div class="bot anim-idle" id="garage-bot"></div>
        </div>

        <!-- 2. TRAIN (FREE) -->
        <div class="cb-view" id="view-train">
          <div class="cb-title">TRAIN STATS</div>
          <div class="cb-scroll">
            <div class="cb-card" style="border-left: 6px solid #38BDF8;">
              <div class="cb-card-info">
                <h4 style="color:#38BDF8;">⚡ Speed Treadmill</h4>
                <p>Tap repeatedly to build Speed.</p>
              </div>
              <button class="cb-btn" onclick="startMinigame('spd')" style="background:#38BDF8;">START</button>
            </div>
            <div class="cb-card" style="border-left: 6px solid #8B5CF6;">
              <div class="cb-card-info">
                <h4 style="color:#8B5CF6;">🚀 Hover Tunnel</h4>
                <p>Balance cursor to build Flight.</p>
              </div>
              <button class="cb-btn" onclick="startMinigame('fly')" style="background:#8B5CF6; color:#fff;">START</button>
            </div>
            <div class="cb-card" style="border-left: 6px solid #F43F5E;">
              <div class="cb-card-info">
                <h4 style="color:#F43F5E;">💥 Power Crusher</h4>
                <p>Perfect timing builds Power.</p>
              </div>
              <button class="cb-btn" onclick="startMinigame('pow')" style="background:#F43F5E; color:#fff;">START</button>
            </div>
          </div>
        </div>

        <!-- 3. SHOP -->
        <div class="cb-view" id="view-shop">
          <div class="cb-title">SHOP</div>
          <div class="cb-scroll">
            <h3 style="color:#888; margin: 0 0 10px 0;">FOOD (RESTORE ENERGY)</h3>
            <div class="cb-card">
              <div class="cb-card-info"><h4 style="color:#10B981;">🔋 Battery Pack</h4><p>Instantly restores +50 Energy.</p></div>
              <button class="cb-btn" onclick="buyItem('food', 10, 50)" style="background:#10B981; color:#fff;">10 💰</button>
            </div>
            
            <h3 style="color:#888; margin: 20px 0 10px 0;">PAINT JOBS</h3>
            <div class="cb-card">
              <div class="cb-card-info"><h4 style="color:#64748b;">Steel Gray</h4></div>
              <button class="cb-btn" onclick="buyItem('color', 0, '#64748b')" style="background:#475569; color:#fff;">EQUIP</button>
            </div>
            <div class="cb-card">
              <div class="cb-card-info"><h4 style="color:#F43F5E;">Neon Red</h4></div>
              <button class="cb-btn" onclick="buyItem('color', 50, '#F43F5E')" style="background:#F43F5E; color:#fff;">50 💰</button>
            </div>
            <div class="cb-card">
              <div class="cb-card-info"><h4 style="color:#38BDF8;">Cyber Blue</h4></div>
              <button class="cb-btn" onclick="buyItem('color', 50, '#38BDF8')" style="background:#38BDF8; color:#fff;">50 💰</button>
            </div>
            <div class="cb-card">
              <div class="cb-card-info"><h4 style="color:#F59E0B;">Gold Edition</h4></div>
              <button class="cb-btn" onclick="buyItem('color', 150, '#F59E0B')" style="background:#F59E0B; color:#000;">150 💰</button>
            </div>
          </div>
        </div>

        <!-- 4. RACE MENU -->
        <div class="cb-view" id="view-race-menu">
          <div class="cb-title">TOURNAMENTS</div>
          <p style="text-align:center; color:#aaa; margin-top:-10px; margin-bottom:15px; padding:0 20px;">Racing drains Energy! Max it out at the Shop before racing.</p>
          <div class="cb-scroll" id="race-list"></div>
        </div>

        <!-- 5. ACTIVE MINIGAME -->
        <div class="cb-view" id="view-minigame">
          <div class="mg-timer-bar" id="mg-timer-bar"></div>
          <div style="text-align:center; font-size:2rem; font-weight:900; margin-top:20px; color:#F59E0B;" id="mg-score">0</div>
          <div style="text-align:center; color:#888;" id="mg-inst">INSTRUCTIONS</div>
          
          <div id="mg-container-spd" style="display:none;">
            <div class="mg-mash-btn" id="btn-mash">TAP!</div>
          </div>

          <div id="mg-container-fly" style="display:none;">
            <div class="mg-fly-area">
              <div class="mg-fly-target" id="fly-target"></div>
              <div class="mg-fly-cursor" id="fly-cursor"></div>
            </div>
            <button class="cb-btn" id="btn-fly" style="display:block; margin:0 auto; width:200px; padding:20px;">HOLD TO RISE</button>
          </div>

          <div id="mg-container-pow" style="display:none;">
            <div class="mg-pow-area">
              <div class="mg-pow-target"></div>
              <div class="mg-pow-cursor" id="pow-cursor"></div>
            </div>
            <button class="cb-btn" id="btn-pow" style="display:block; margin:0 auto; width:200px; padding:20px; background:#F43F5E; color:#fff;">TAP TO SMASH</button>
          </div>

          <div class="overlay-msg" id="mg-msg">
            <h2 style="font-size:3rem; margin:0; color:#38BDF8;" id="mg-res-title">TIME UP!</h2>
            <p style="font-size:1.5rem; color:#fff;" id="mg-res-txt">+10 XP</p>
            <button class="cb-btn" onclick="exitGame()" style="margin-top:20px;">CONTINUE</button>
          </div>
        </div>

        <!-- 6. ACTIVE RACE -->
        <div class="cb-view" id="view-active-race">
          <div style="position:absolute; top:20px; left:20px; font-size:2rem; font-weight:900; color:#fff; z-index:50;" id="rc-dist">0m</div>
          <div class="race-track" id="rc-track"></div>
          <div id="rc-bots"></div>
          
          <div class="race-energy-container">
            <div class="race-energy-fill" id="rc-energy-bar"></div>
          </div>

          <div class="overlay-msg" id="rc-msg">
            <h2 style="font-size:3rem; margin:0; color:#F59E0B;" id="rc-res-title">FINISHED</h2>
            <p style="font-size:1.5rem; color:#fff;" id="rc-res-txt">1st Place!</p>
            <button class="cb-btn" onclick="exitGame()" style="margin-top:20px;">BACK TO GARAGE</button>
          </div>
        </div>

      </div>

      <!-- TAB BAR -->
      <div class="cb-tabbar" id="tabbar">
        <div class="cb-tab active" onclick="nav('garage')">🏠 GARAGE</div>
        <div class="cb-tab" onclick="nav('train')">⚔️ TRAIN</div>
        <div class="cb-tab" onclick="nav('shop')">🛒 SHOP</div>
        <div class="cb-tab" onclick="nav('race-menu')">🏆 RACE</div>
      </div>

    </div>
  `;

  // --- ENGINE & STATE ---
  const STATE_KEY = 'cb_v8_addict';
  let state = { 
    eng: 100, maxEng: 100, cred: 50, 
    spd: {lvl:1, xp:0}, fly: {lvl:1, xp:0}, pow: {lvl:1, xp:0},
    color: '#64748b', unlocked: ['#64748b']
  };
  try { const s = localStorage.getItem(STATE_KEY); if(s) state = JSON.parse(s); } catch(e){}
  if(!state.unlocked) state.unlocked = ['#64748b'];

  function saveState() {
    if(state.eng > state.maxEng) state.eng = state.maxEng;
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    updateUI();
  }

  function getBotHTML(color) {
    const c = color || state.color;
    return `
      <div class="bot-arms"></div>
      <div class="bot-legs"></div>
      <div class="bot-body" style="background: ${c};">
        <div class="bot-eye-l"><div class="bot-pupil"></div></div>
        <div class="bot-eye-r"><div class="bot-pupil"></div></div>
      </div>
    `;
  }

  function updateUI() {
    document.getElementById('h-eng').innerText = Math.floor(state.eng);
    document.getElementById('h-cred').innerText = state.cred;
    
    document.getElementById('lvl-spd').innerText = state.spd.lvl;
    document.getElementById('lvl-fly').innerText = state.fly.lvl;
    document.getElementById('lvl-pow').innerText = state.pow.lvl;
    
    document.getElementById('bar-spd').style.width = Math.min(100, (state.spd.xp / (state.spd.lvl * 20)) * 100) + '%';
    document.getElementById('bar-fly').style.width = Math.min(100, (state.fly.xp / (state.fly.lvl * 20)) * 100) + '%';
    document.getElementById('bar-pow').style.width = Math.min(100, (state.pow.xp / (state.pow.lvl * 20)) * 100) + '%';

    document.getElementById('garage-bot').innerHTML = getBotHTML();
    buildRaceMenu();
  }

  window.nav = function(tab) {
    document.querySelectorAll('.cb-view').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.cb-tab').forEach(e => e.classList.remove('active'));
    document.getElementById(`view-${tab}`).classList.add('active');
    
    const tabs = ['garage', 'train', 'shop', 'race-menu'];
    const idx = tabs.indexOf(tab);
    if(idx >= 0) document.querySelectorAll('.cb-tab')[idx].classList.add('active');
  };

  function spawnParticle(containerId, txt, color, x, y) {
    const el = document.createElement('div');
    el.className = 'particle'; el.style.color = color; el.innerText = txt;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.getElementById(containerId).appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  // --- SHOP ---
  window.buyItem = function(type, cost, val) {
    if (type === 'color' && state.unlocked.includes(val)) {
      state.color = val; saveState(); return; 
    }
    if (state.cred < cost) { alert("Not enough Coins!"); return; }
    
    state.cred -= cost;
    if (type === 'color') {
      state.unlocked.push(val);
      state.color = val;
    } else if (type === 'food') {
      state.eng += val;
      spawnParticle('view-shop', `+${val}⚡`, '#10B981', window.innerWidth/2, 200);
    }
    saveState();
  };

  // --- FAST ADDICITIVE MINIGAMES ---
  let mgRAF, mgState = null;
  
  // Speed
  const btnMash = document.getElementById('btn-mash');
  btnMash.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if(!mgState || !mgState.active || mgState.type !== 'spd') return;
    btnMash.classList.add('pressed');
    setTimeout(() => btnMash.classList.remove('pressed'), 50);
    mgState.score += 1;
    document.getElementById('mg-score').innerText = mgState.score;
    const rect = btnMash.getBoundingClientRect();
    spawnParticle('view-minigame', "+1", "#38BDF8", rect.left + Math.random()*100 + 50, rect.top + Math.random()*50);
  });

  // Fly
  const btnFly = document.getElementById('btn-fly');
  btnFly.addEventListener('pointerdown', (e) => { e.preventDefault(); if(mgState) mgState.flyHold = true; });
  btnFly.addEventListener('pointerup', (e) => { e.preventDefault(); if(mgState) mgState.flyHold = false; });
  btnFly.addEventListener('pointercancel', (e) => { e.preventDefault(); if(mgState) mgState.flyHold = false; });

  // Power
  const btnPow = document.getElementById('btn-pow');
  btnPow.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if(!mgState || !mgState.active || mgState.type !== 'pow') return;
    
    // Check timing
    const dist = Math.abs(mgState.powX - 50);
    if(dist < 5) {
      mgState.score += 5;
      spawnParticle('view-minigame', "PERFECT! +5", "#F59E0B", window.innerWidth/2 - 50, 200);
      document.getElementById('cb-main').classList.add('screen-shake');
      setTimeout(()=>document.getElementById('cb-main').classList.remove('screen-shake'), 300);
    } else if (dist < 15) {
      mgState.score += 2;
      spawnParticle('view-minigame', "GOOD! +2", "#10B981", window.innerWidth/2 - 50, 200);
    } else {
      spawnParticle('view-minigame', "MISS", "#888", window.innerWidth/2 - 50, 200);
    }
    document.getElementById('mg-score').innerText = mgState.score;
  });


  window.startMinigame = function(type) {
    document.querySelectorAll('.cb-view').forEach(e => e.classList.remove('active'));
    document.getElementById('view-minigame').classList.add('active');
    document.getElementById('mg-msg').style.display = 'none';
    document.getElementById('tabbar').style.display = 'none';
    
    document.getElementById('mg-container-spd').style.display = 'none';
    document.getElementById('mg-container-fly').style.display = 'none';
    document.getElementById('mg-container-pow').style.display = 'none';
    document.getElementById('mg-container-' + type).style.display = 'block';

    mgState = { type, active: true, score: 0, timeLeft: 10.0 };
    document.getElementById('mg-score').innerText = "0";

    if(type === 'spd') document.getElementById('mg-inst').innerText = "MASH FAST!";
    if(type === 'fly') { 
      document.getElementById('mg-inst').innerText = "KEEP CURSOR IN GREEN ZONE";
      mgState.flyY = 150; mgState.flyTY = 100; mgState.flyTDir = 1; mgState.flyHold = false;
    }
    if(type === 'pow') {
      document.getElementById('mg-inst').innerText = "TAP WHEN CENTERED";
      mgState.powX = 0; mgState.powDir = 1;
    }

    lastFrame = performance.now();
    mgRAF = requestAnimationFrame(mgLoop);
  };

  let lastFrame = 0;
  function mgLoop(now) {
    if (!mgState.active) return;
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;

    mgState.timeLeft -= dt;
    document.getElementById('mg-timer-bar').style.width = Math.max(0, (mgState.timeLeft/10)*100) + '%';

    if (mgState.timeLeft <= 0) {
      return finishMinigame();
    }

    if (mgState.type === 'fly') {
      // Target moves automatically
      mgState.flyTY += mgState.flyTDir * 150 * dt;
      if(mgState.flyTY < 0) { mgState.flyTY = 0; mgState.flyTDir = 1; }
      if(mgState.flyTY > 220) { mgState.flyTY = 220; mgState.flyTDir = -1; }
      // Random direction change
      if(Math.random() < 0.02) mgState.flyTDir *= -1;
      
      // Cursor moves based on hold
      if(mgState.flyHold) mgState.flyY -= 200 * dt;
      else mgState.flyY += 200 * dt;
      
      if(mgState.flyY < 0) mgState.flyY = 0;
      if(mgState.flyY > 260) mgState.flyY = 260;

      document.getElementById('fly-target').style.top = mgState.flyTY + 'px';
      document.getElementById('fly-cursor').style.top = mgState.flyY + 'px';

      // Score if inside
      if(mgState.flyY > mgState.flyTY && mgState.flyY < mgState.flyTY + 80) {
        mgState.score += 5 * dt; // Score per second
        document.getElementById('mg-score').innerText = Math.floor(mgState.score);
        document.getElementById('fly-cursor').style.backgroundColor = '#10B981';
      } else {
        document.getElementById('fly-cursor').style.backgroundColor = '#8B5CF6';
      }
    }

    if (mgState.type === 'pow') {
      const speed = 150 + (state.pow.lvl * 5); // Goes faster as you level up!
      mgState.powX += mgState.powDir * speed * dt;
      if(mgState.powX > 100) { mgState.powX = 100; mgState.powDir = -1; }
      if(mgState.powX < 0) { mgState.powX = 0; mgState.powDir = 1; }
      document.getElementById('pow-cursor').style.left = mgState.powX + '%';
    }

    if(mgState.active) requestAnimationFrame(mgLoop);
  }

  function finishMinigame() {
    mgState.active = false;
    const finalScore = Math.floor(mgState.score);
    const xp = finalScore;
    const coins = Math.floor(finalScore / 2);
    
    state[mgState.type].xp += xp;
    state.cred += coins;
    
    let leveled = false;
    while(state[mgState.type].xp >= state[mgState.type].lvl * 20) {
      state[mgState.type].xp -= state[mgState.type].lvl * 20;
      state[mgState.type].lvl++;
      leveled = true;
    }
    saveState();

    document.getElementById('mg-res-txt').innerText = `+${xp} XP | +${coins} 💰` + (leveled ? '\n⭐ LEVEL UP!' : '');
    document.getElementById('mg-msg').style.display = 'flex';
  }

  window.exitGame = function() {
    document.getElementById('tabbar').style.display = 'flex';
    nav('garage');
  };

  // --- RACES ---
  const TOURNEYS = [
    { id: 1, name: "Rusty Sprint", opp: 3, prize: 50 },
    { id: 2, name: "Steel Dash", opp: 15, prize: 200 },
    { id: 3, name: "Neon Marathon", opp: 40, prize: 1000 }
  ];

  function buildRaceMenu() {
    const list = document.getElementById('race-list');
    list.innerHTML = '';
    TOURNEYS.forEach(t => {
      list.innerHTML += `
        <div class="cb-card">
          <div class="cb-card-info">
            <h4 style="color:#F59E0B">${t.name}</h4>
            <p>1st Place Prize: ${t.prize} 💰</p>
          </div>
          <button class="cb-btn" onclick="startRace(${t.id})">RACE</button>
        </div>
      `;
    });
  }

  let raceState = null;
  window.startRace = function(tid) {
    if(state.eng < 10) { alert("Energy is too low! Feed your robot."); return; }
    
    document.querySelectorAll('.cb-view').forEach(e => e.classList.remove('active'));
    document.getElementById('view-active-race').classList.add('active');
    document.getElementById('tabbar').style.display = 'none';
    document.getElementById('rc-msg').style.display = 'none';

    const t = TOURNEYS.find(x => x.id === tid);
    
    const track = document.getElementById('rc-track');
    track.innerHTML = '';
    
    let cx = 0;
    raceState = { active: true, bots: [], camX: 0, dist: 3000, zones: [] };
    const zTypes = ['spd', 'fly', 'pow'];
    
    while(cx < 3000) {
      const type = zTypes[Math.floor(Math.random()*3)];
      const w = 600 + Math.random()*600;
      const el = document.createElement('div');
      el.className = 'r-zone z-' + type;
      el.style.width = w+'px';
      
      // Visual indicator for Power zone
      if (type === 'pow') {
        const wall = document.createElement('div');
        wall.className = 'r-wall';
        el.appendChild(wall);
      }
      
      track.appendChild(el);
      raceState.zones.push({ type, s: cx, e: cx+w });
      cx += w;
    }

    // Bots
    const opp = t.opp;
    const stats = [
      state, 
      {spd:{lvl:opp+2}, fly:{lvl:opp-1}, pow:{lvl:opp}, eng:100, color:'#475569'}, 
      {spd:{lvl:opp-1}, fly:{lvl:opp+2}, pow:{lvl:opp}, eng:100, color:'#334155'}, 
      {spd:{lvl:opp}, fly:{lvl:opp}, pow:{lvl:opp+2}, eng:100, color:'#1e293b'}
    ];
    
    const bCont = document.getElementById('rc-bots');
    bCont.innerHTML = '';
    for(let i=0; i<4; i++) {
      const el = document.createElement('div');
      el.className = 'r-bot anim-idle bot';
      el.innerHTML = getBotHTML(stats[i].color);
      el.style.bottom = (i * 20 + 20) + 'px'; // Stagger them vertically on the 200px track
      if(i===0) el.innerHTML += `<div style="position:absolute; top:-20px; color:#fff; font-weight:900;">P1</div>`;
      bCont.appendChild(el);
      raceState.bots.push({ id: i, x: 0, s: stats[i], el, collapsed: false });
    }

    lastFrame = performance.now();
    mgRAF = requestAnimationFrame(raceLoopTick);
  };

  function raceLoopTick(now) {
    if(!raceState.active) return;
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;

    let leadX = 0;
    raceState.bots.forEach(b => {
      if (b.collapsed) return;
      
      const z = raceState.zones.find(z => b.x >= z.s && b.x < z.e);
      let lvl = 1;
      let action = 'run';
      if(z) {
        lvl = b.s[z.type].lvl;
        action = z.type;
      }
      
      // Calculate speed based on stat
      const speed = 150 + (lvl * 15) + (Math.random()*10);
      b.x += speed * dt;
      if(b.x > leadX) leadX = b.x;
      
      // Visual Action
      if (action === 'fly') b.el.style.bottom = (b.id * 20 + 60) + 'px'; // Fly up
      else b.el.style.bottom = (b.id * 20 + 20) + 'px'; // Ground
      
      // Drain energy
      if (b.id === 0) {
        state.eng -= 2 * dt; 
        document.getElementById('rc-energy-bar').style.width = Math.max(0, state.eng) + '%';
        if (state.eng <= 0) {
          b.collapsed = true;
          b.el.style.transform = 'rotate(90deg)';
        }
      }
      
      b.el.style.left = (b.x - raceState.camX + 50) + 'px';
    });

    const p1 = raceState.bots[0];
    raceState.camX += (p1.x - raceState.camX) * 0.1;
    document.getElementById('rc-dist').innerText = Math.floor(p1.x) + 'm';
    document.getElementById('rc-track').style.transform = `translateX(-${raceState.camX}px)`;

    if (leadX >= raceState.dist || p1.collapsed) {
      raceState.active = false;
      raceState.bots.sort((a,b) => b.x - a.x);
      const place = raceState.bots.findIndex(b => b.id === 0) + 1;
      
      let prize = place === 1 ? 100 : place === 2 ? 25 : 0;
      if(place===1) state.cred += prize; 
      saveState();

      document.getElementById('rc-res-title').innerText = p1.collapsed ? "NO ENERGY" : `FINISHED #${place}`;
      document.getElementById('rc-res-txt').innerText = place === 1 ? `Prize: ${prize} 💰` : 'Need more stats!';
      document.getElementById('rc-msg').style.display = 'flex';
    }

    if(raceState.active) requestAnimationFrame(raceLoopTick);
  }

  updateUI();
}
