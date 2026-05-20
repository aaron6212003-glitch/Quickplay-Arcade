export function init(container) {
  // Ensure the container fills its parent without scrolling
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  container.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      .np-wrapper {
        font-family: 'Outfit', sans-serif;
        color: #fff; width: 100%; height: 100%; max-width: 600px; margin: 0 auto;
        background: #0f172a; border-radius: 12px;
        display: flex; flex-direction: column; overflow: hidden;
        user-select: none; border: 2px solid #334155;
      }

      /* HEADER */
      .np-header {
        background: #1e293b; padding: 10px 15px; border-bottom: 2px solid #334155;
        display: flex; justify-content: space-between; align-items: center; z-index: 10;
        flex-shrink: 0;
      }
      .np-money-val { font-size: 1.8rem; font-weight: 900; color: #10B981; text-shadow: 0 0 10px rgba(16,185,129,0.5); }
      .np-stats { text-align: right; font-size: 0.8rem; color: #cbd5e1; font-weight: 700; }
      .np-stats span { color: #38BDF8; }

      /* MISSION BAR */
      .np-mission-bar {
        background: #4c0519; padding: 8px 15px; border-bottom: 2px solid #F43F5E;
        display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
        box-shadow: 0 0 15px rgba(244,63,94,0.3);
      }
      .np-mission-title { font-weight: 900; color: #F43F5E; text-transform: uppercase; font-size: 1rem; text-shadow: 0 0 5px #F43F5E; }

      /* GAME AREA */
      .np-game {
        flex: 1; position: relative; cursor: crosshair; overflow: hidden;
        background: radial-gradient(circle at top, #1e293b, #020617); min-height: 200px;
      }
      canvas { display: block; position: absolute; inset: 0; width: 100%; height: 100%; }
      
      .np-cannon {
        position: absolute; top: -5px; left: 50%; transform: translateX(-50%);
        width: 30px; height: 25px; background: #38BDF8; border-radius: 0 0 15px 15px;
        box-shadow: 0 0 15px #38BDF8; z-index: 5;
      }

      /* UPGRADE PANEL (NO SCROLLING - GRID) */
      .np-panel {
        background: #1e293b; border-top: 2px solid #334155; flex-shrink: 0;
      }
      .np-upgrades {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px;
      }
      .np-upg-card {
        background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
        padding: 8px; display: flex; flex-direction: column; justify-content: space-between; align-items: center;
        text-align: center; transition: transform 0.1s;
      }
      .np-upg-card:active { transform: scale(0.98); }
      .np-upg-info h4 { margin: 0 0 2px 0; font-size: 0.95rem; color: #fff; }
      .np-upg-info p { margin: 0 0 6px 0; font-size: 0.75rem; color: #94a3b8; line-height: 1.1; }
      
      .np-btn {
        background: #38BDF8; color: #000; border: none; padding: 6px 12px; border-radius: 6px;
        font-weight: 900; font-size: 0.9rem; cursor: pointer; box-shadow: 0 3px 0 #0284c7;
        width: 100%; transition: transform 0.1s, box-shadow 0.1s;
      }
      .np-btn:active { transform: translateY(3px); box-shadow: 0 0 0 #0284c7; }
      .np-btn:disabled { background: #475569; box-shadow: 0 3px 0 #334155; color: #94a3b8; transform: none; cursor: not-allowed; }

      .np-float {
        position: absolute; font-weight: 900; font-size: 1.2rem; pointer-events: none;
        animation: floatUp 1s forwards; z-index: 100; text-shadow: 0 2px 4px #000;
      }
      @keyframes floatUp { 0% { opacity: 1; transform: translateY(0) scale(0.5); } 20% { transform: translateY(-10px) scale(1.2); } 100% { opacity: 0; transform: translateY(-30px) scale(1); } }
      
      .np-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 100; text-align: center; }
    </style>

    <div class="np-wrapper" id="np-main">
      <div class="np-header">
        <div class="np-money-box">
          <div class="np-money-val">$<span id="np-money">0</span></div>
        </div>
        <div class="np-stats">
          <div>Active Balls: <span id="np-ball-count" style="color:#fff;">0</span>/<span id="np-ball-max">10</span></div>
        </div>
      </div>
      
      <div class="np-mission-bar">
        <div class="np-mission-title">Level <span id="np-level-num">1</span></div>
        <div style="font-size:0.9rem; font-weight:800;">Targets: <span id="np-targets-left" style="color:#fff;">5</span></div>
      </div>

      <div class="np-game" id="np-game">
        <div class="np-cannon" id="np-cannon"></div>
        <canvas id="np-canvas"></canvas>
        <div class="np-overlay" id="np-overlay">
          <h1 style="color:#F59E0B; font-size:3rem; margin:0; text-shadow:0 0 20px #F59E0B;">CLEARED!</h1>
          <p style="font-size:1.5rem; color:#fff;" id="np-reward-text">Reward: $1,000</p>
          <button class="np-btn" style="margin-top:20px; font-size:1.2rem; padding:10px 30px; width:auto;" onclick="nextLevel()">NEXT LEVEL</button>
        </div>
      </div>

      <div class="np-panel">
        <div class="np-upgrades" id="np-upgrades"></div>
      </div>
    </div>
  `;

  // --- STATE ---
  const STATE_KEY = 'np_mission_v2';
  const BASE_UPGRADES = {
    damage: { lvl: 1, val: 1, cost: 50, mult: 1.5, name: "Kinetic Force", desc: "Damage per direct hit." },
    multi: { lvl: 1, val: 1, cost: 200, mult: 2.0, name: "Multi-Shot", desc: "Balls fired per tap." },
    blast: { lvl: 0, val: 0, cost: 300, mult: 2.2, name: "Explosive Rounds", desc: "Blast radius on impact." },
    autoDrop: { lvl: 0, val: 0, cost: 150, mult: 1.8, name: "Auto-Cannon", desc: "Fires automatically (shots/sec)." }
  };

  let state = {
    money: 0,
    level: 1,
    upg: JSON.parse(JSON.stringify(BASE_UPGRADES))
  };
  
  try { const s = localStorage.getItem(STATE_KEY); if(s) state = { ...state, ...JSON.parse(s) }; } catch(e){}

  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    updateUI();
  }

  // --- UI UPDATES ---
  function formatMoney(num) {
    if (num >= 1000000000) return (num/1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num/1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num/1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
  }

  function updateUI() {
    document.getElementById('np-money').innerText = formatMoney(state.money);
    document.getElementById('np-ball-count').innerText = balls.length;
    // Max balls dynamically scales with multi-shot so it never bottlenecks
    const maxB = 10 + state.upg.multi.val * 5 + (state.upg.autoDrop.val * 2);
    document.getElementById('np-ball-max').innerText = Math.floor(maxB);
    document.getElementById('np-level-num').innerText = state.level;
    renderUpgrades();
  }

  function renderUpgrades() {
    const list = document.getElementById('np-upgrades');
    list.innerHTML = '';
    const keys = ['damage', 'multi', 'blast', 'autoDrop'];
    
    keys.forEach(k => {
      const u = state.upg[k];
      const affordable = state.money >= u.cost;
      
      let valDisplay = u.val;
      if (k === 'damage') valDisplay = u.val + ' HP';
      if (k === 'multi') valDisplay = u.val + ' Shots';
      if (k === 'blast') valDisplay = u.val === 0 ? 'None' : (u.val * 10) + 'px';
      if (k === 'autoDrop') valDisplay = u.val.toFixed(1) + '/sec';

      list.innerHTML += `
        <div class="np-upg-card">
          <div class="np-upg-info">
            <h4>${u.name} <span style="color:#38BDF8;">L${u.lvl}</span></h4>
            <p>${u.desc}<br><strong style="color:#fff;">${valDisplay}</strong></p>
          </div>
          <button class="np-btn" ${affordable ? '' : 'disabled'} onclick="buyUpgrade('${k}')">
            $${formatMoney(u.cost)}
          </button>
        </div>
      `;
    });
  }

  window.buyUpgrade = function(k) {
    const u = state.upg[k];
    if (state.money >= u.cost) {
      state.money -= u.cost;
      u.lvl++;
      u.cost = Math.floor(u.cost * u.mult);
      
      if (k === 'damage') u.val += 1 + Math.floor(u.lvl/5);
      if (k === 'multi') u.val += 1;
      if (k === 'blast') u.val += 1; // logical radius units
      if (k === 'autoDrop') u.val += 0.5;
      
      saveState();
    }
  };

  function spawnFloatText(txt, color, x, y) {
    const el = document.createElement('div');
    el.className = 'np-float'; el.style.color = color; el.innerText = txt;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.getElementById('np-game').appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  // --- PHYSICS ENGINE ---
  const canvas = document.getElementById('np-canvas');
  const ctx = canvas.getContext('2d');
  const gameArea = document.getElementById('np-game');
  
  let W = 400, H = 600;
  let balls = [];
  let pegs = [];
  let explosions = [];

  function resize() {
    W = gameArea.offsetWidth;
    H = gameArea.offsetHeight;
    if(W === 0 || H === 0) return; // Hidden
    canvas.width = W;
    canvas.height = H;
    if(pegs.length === 0) buildBoard();
  }
  // Try immediate resize and delayed in case flex layout shifts
  resize();
  setTimeout(resize, 100);
  window.addEventListener('resize', resize);

  function buildBoard() {
    pegs = [];
    balls = [];
    explosions = [];
    
    // Build Hex Grid Pegs 
    const pegRad = 5;
    const spacing = 35;
    // Calculate rows to fill vertically but leave a gap at bottom
    const rows = Math.max(5, Math.floor((H - 80) / (spacing * 0.866))); 
    const cols = Math.floor((W - 20) / spacing);
    
    for (let r = 0; r < rows; r++) {
      let y = 60 + r * spacing * 0.866;
      let offset = (r % 2 === 0) ? 0 : spacing / 2;
      for (let c = 0; c < cols - (r % 2); c++) {
        let x = (W - (cols*spacing))/2 + offset + c * spacing; // Centered
        pegs.push({
          x, y, r: pegRad, glow: 0,
          target: false, hp: 0, maxHp: 0
        });
      }
    }

    // Select Target Pegs
    let numTargets = Math.min(pegs.length, 3 + state.level * 2);
    for(let i=0; i<numTargets; i++) {
      let p;
      do { p = pegs[Math.floor(Math.random() * pegs.length)]; } while (p.target);
      p.target = true;
      p.hp = state.level * 5; 
      p.maxHp = p.hp;
      p.r = 8; 
    }
    updateTargetsLeft();
  }

  function updateTargetsLeft() {
    const left = pegs.filter(p => p.target).length;
    document.getElementById('np-targets-left').innerText = left;
    
    if (left === 0 && !document.getElementById('np-overlay').style.display.includes('flex')) {
      const reward = Math.floor(state.level * state.level * 100);
      document.getElementById('np-reward-text').innerText = `Reward: $${formatMoney(reward)}`;
      document.getElementById('np-overlay').style.display = 'flex';
      state.money += reward;
      saveState();
    }
  }

  window.nextLevel = function() {
    state.level++;
    document.getElementById('np-overlay').style.display = 'none';
    saveState();
    buildBoard();
  };

  let lastTime = performance.now();
  let autoTimer = 0;

  function fireBall(tx, ty) {
    const maxB = 10 + state.upg.multi.val * 5 + (state.upg.autoDrop.val * 2);
    if (balls.length >= maxB) return;
    
    const sx = W / 2;
    const sy = 0;
    
    let dx = tx - sx;
    let dy = ty - sy;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if(dist === 0) { dx=0; dy=1; dist=1; }
    
    const speed = 600; // Fast initial speed

    // Multi-shot
    const shots = state.upg.multi.val;
    for(let i=0; i<shots; i++) {
      // Add slight spread angle
      let spread = (i - (shots-1)/2) * 0.05; 
      let cos = Math.cos(spread), sin = Math.sin(spread);
      let nx = (dx/dist)*cos - (dy/dist)*sin;
      let ny = (dx/dist)*sin + (dy/dist)*cos;

      balls.push({
        x: sx, y: sy,
        vx: nx * speed,
        vy: ny * speed, 
        r: 5,
        color: '#fff'
      });
    }
    updateUI();
  }

  gameArea.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (document.getElementById('np-overlay').style.display === 'flex') return;
    const rect = canvas.getBoundingClientRect();
    fireBall(e.clientX - rect.left, e.clientY - rect.top);
  });

  function triggerExplosion(x, y) {
    if (state.upg.blast.val <= 0) return;
    const radius = state.upg.blast.val * 15 + 10;
    
    // Visual explosion
    explosions.push({ x, y, r: 0, maxR: radius, alpha: 1.0 });

    // Damage logic
    pegs.forEach(p => {
      let dx = p.x - x; let dy = p.y - y;
      if (dx*dx + dy*dy <= radius*radius) {
        if (p.target) damagePeg(p, Math.max(1, Math.floor(state.upg.damage.val / 2))); // 50% damage to AoE
        else p.glow = 1.0;
      }
    });
  }

  function damagePeg(p, dmg) {
    if (!p.target) return;
    p.hp -= dmg;
    p.glow = 1.0;
    state.money += state.level * 2; // small cash per hit
    
    if (p.hp <= 0) {
      pegs.splice(pegs.indexOf(p), 1);
      updateTargetsLeft();
      spawnFloatText('💥', '#F59E0B', p.x, p.y);
      triggerExplosion(p.x, p.y);
    }
  }

  function resolveCollision(b, p) {
    let dx = b.x - p.x; let dy = b.y - p.y;
    let dist2 = dx*dx + dy*dy;
    let rad = b.r + p.r;
    
    if (dist2 < rad*rad) {
      let dist = Math.sqrt(dist2);
      if(dist === 0) { dx = 1; dist = 1; }
      let nx = dx/dist; let ny = dy/dist;
      
      let over = rad - dist;
      b.x += nx * over; b.y += ny * over;
      
      let vdot = b.vx*nx + b.vy*ny;
      if (vdot < 0) {
        let e = 0.7; // bouncy!
        b.vx -= (1 + e) * vdot * nx;
        b.vy -= (1 + e) * vdot * ny;
        b.vx += (Math.random() - 0.5) * 40; // chaos
        
        if (p.target) {
          damagePeg(p, state.upg.damage.val);
        } else {
          p.glow = 1.0; 
          state.money += state.level; // base income
        }
        
        // Force update money quickly
        document.getElementById('np-money').innerText = formatMoney(state.money);
      }
    }
  }

  function loop(now) {
    // Delta time clamping
    const rawDt = (now - lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05); // max 50ms per frame to prevent mega-jumps
    lastTime = now;

    // Auto Fire
    if (state.upg.autoDrop.val > 0 && document.getElementById('np-overlay').style.display !== 'flex') {
      autoTimer += dt;
      const dropInterval = 1 / state.upg.autoDrop.val;
      while (autoTimer >= dropInterval) {
        autoTimer -= dropInterval;
        fireBall(Math.random() * W, H); 
      }
    }

    ctx.clearRect(0, 0, W, H);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for(let i=0; i<W; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
    for(let i=0; i<H; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }

    // Update Explosions
    for(let i = explosions.length - 1; i >= 0; i--) {
      let ex = explosions[i];
      ex.r += 200 * dt; // expand fast
      ex.alpha -= 3 * dt; // fade fast
      
      if (ex.alpha <= 0) {
        explosions.splice(i, 1);
        continue;
      }
      
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(244, 63, 94, ${ex.alpha * 0.5})`;
      ctx.fill();
    }

    // Draw Pegs
    pegs.forEach(p => {
      if (p.glow > 0) p.glow -= dt * 2;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      
      if (p.target) {
        const hpPct = Math.max(0, p.hp / p.maxHp);
        ctx.fillStyle = p.glow > 0 ? '#fff' : `rgba(244, 63, 94, ${0.5 + hpPct*0.5})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#F43F5E';
        ctx.stroke();
        
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = '800 9px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(p.hp, p.x, p.y - 10);
      } else {
        ctx.fillStyle = p.glow > 0 ? `rgba(56, 189, 248, 1)` : '#334155';
        ctx.fill();
        if (p.glow > 0) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 8 * p.glow;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });

    // SUBSTEPPING PHYSICS
    const substeps = 4;
    const sdt = dt / substeps;

    for (let step = 0; step < substeps; step++) {
      for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];
        
        b.vy += 800 * sdt; // Gravity
        b.x += b.vx * sdt;
        b.y += b.vy * sdt;
        
        // Walls
        if (b.x < b.r) { b.x = b.r; b.vx *= -0.8; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.8; }

        pegs.forEach(p => resolveCollision(b, p));

        // Floor (Despawn)
        if (b.y > H + 10) {
          balls.splice(i, 1);
          if (step === substeps - 1) updateUI(); // Update UI string only once per frame
        }
      }
    }

    // Draw Balls
    for (let i = 0; i < balls.length; i++) {
      let b = balls[i];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(loop);
  }

  // Init
  resize();
  updateUI();
  requestAnimationFrame(loop);
  setInterval(saveState, 2000);
}
