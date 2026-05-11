export function init(container) {
  container.innerHTML = `
    <style>
      .bb-wrapper {
        display: flex; flex-direction: column; align-items: center;
        width: 100%; max-width: 500px; margin: 0 auto;
        font-family: 'Nunito', sans-serif;
      }
      .bb-header { text-align: center; margin-bottom: 20px; }
      .bb-title { font-size: 1.5rem; font-weight: 900; margin-bottom: 5px; }
      .bb-title span.spike { color: #00F2FE; text-shadow: 0 0 5px #00F2FE; }
      .bb-title span.parasite { color: #43E97B; text-shadow: 0 0 5px #43E97B; }
      
      .bb-health-row { display: flex; justify-content: space-between; width: 100%; padding: 0 20px; margin-bottom: 10px; font-weight: 800; }
      .bb-health { display: flex; flex-direction: column; align-items: center; }
      .bb-health.spike { color: #00F2FE; }
      .bb-health.parasite { color: #43E97B; }
      .bb-hp-val { font-size: 1.2rem; }

      .bb-canvas-container {
        position: relative;
        width: 100%; aspect-ratio: 1/1;
        background: #fff; border-radius: 50%;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 0 30px rgba(255,255,255,0.1);
        overflow: hidden; border: 4px solid #333;
      }
      canvas { display: block; width: 100%; height: 100%; }

      .bb-overlay {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.8); border-radius: 50%;
        color: white; z-index: 10;
      }
      .bb-overlay h3 { margin-bottom: 15px; font-size: 1.4rem; }
      .bb-btn-row { display: flex; gap: 10px; }
      .bb-btn {
        padding: 10px 20px; border: none; border-radius: 50px;
        font-weight: 800; cursor: pointer; transition: transform 0.2s;
      }
      .bb-btn:hover { transform: scale(1.05); }
      .bb-btn.spike { background: #00F2FE; color: #000; }
      .bb-btn.parasite { background: #43E97B; color: #000; }
      
      .bb-result { font-size: 2rem; font-weight: 900; text-align: center; }
      .bb-result.win { color: #FFD700; text-shadow: 0 0 20px rgba(255,215,0,0.5); }
      .bb-result.lose { color: #FF6B6B; text-shadow: 0 0 20px rgba(255,107,107,0.5); }
      .bb-share-btn { margin-top: 15px; background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: white; padding: 12px 24px; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; font-size: 1.1rem; }
    </style>

    <div class="bb-wrapper">
      <div class="bb-header">
        <div class="bb-title"><span class="spike">Spike Ball</span> VS <span class="parasite">Parasite Ball</span></div>
      </div>
      
      <div class="bb-health-row">
        <div class="bb-health spike">
          <div>Health:</div>
          <div class="bb-hp-val" id="hp-spike">100000</div>
        </div>
        <div class="bb-health parasite">
          <div>Health:</div>
          <div class="bb-hp-val" id="hp-parasite">100000</div>
        </div>
      </div>

      <div class="bb-canvas-container">
        <canvas id="bb-canvas"></canvas>
        <div class="bb-overlay" id="bb-start-overlay">
          <h3>Who will win?</h3>
          <div class="bb-btn-row">
            <button class="bb-btn spike" id="btn-pick-spike">Spike Ball</button>
            <button class="bb-btn parasite" id="btn-pick-parasite">Parasite Ball</button>
          </div>
        </div>
        <div class="bb-overlay" id="bb-end-overlay" style="display: none;">
          <div class="bb-result" id="bb-result-text"></div>
          <button class="bb-share-btn" id="bb-share-btn">📸 Share Score</button>
        </div>
      </div>
    </div>
  `;

  // --- Game Logic ---
  const canvas = document.getElementById('bb-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set resolution
  const size = 600;
  canvas.width = size;
  canvas.height = size;
  const radius = size / 2;
  const center = { x: radius, y: radius };

  let animationId;
  let isRunning = false;
  let userPick = null;

  // Stats
  const MAX_HP = 100000;
  const spikeBall = {
    x: center.x - 100, y: center.y,
    vx: 5, vy: -3,
    r: 30, color: '#00F2FE', hp: MAX_HP,
    type: 'spike'
  };
  const parasiteBall = {
    x: center.x + 100, y: center.y,
    vx: -4, vy: 6,
    r: 30, color: '#43E97B', hp: MAX_HP,
    type: 'parasite'
  };

  let particles = [];
  let leeches = []; // Attached to spike ball
  let spikes = [];  // Attached to arena walls

  // Setup arena spikes
  for(let i=0; i<6; i++) {
    const angle = (Math.PI * 2 / 6) * i;
    spikes.push({
      angle: angle,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }

  function drawCircle(x, y, r, color, isParasite) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Inner detail
    if (isParasite) {
       ctx.fillStyle = 'rgba(0,0,0,0.3)';
       ctx.beginPath();
       ctx.arc(x, y, r*0.6, 0, Math.PI*2);
       ctx.fill();
    } else {
       ctx.fillStyle = '#000';
       ctx.beginPath();
       ctx.moveTo(x, y - r*0.8);
       ctx.lineTo(x - r*0.4, y + r*0.4);
       ctx.lineTo(x + r*0.4, y + r*0.4);
       ctx.fill();
    }
  }

  function drawArenaSpike(spike) {
    ctx.save();
    ctx.translate(spike.x, spike.y);
    ctx.rotate(spike.angle + Math.PI); // point inwards
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(60, 0);
    ctx.lineTo(0, 15);
    ctx.fillStyle = '#00F2FE';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function updatePhysics(ball) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Circle bounds collision
    const dx = ball.x - center.x;
    const dy = ball.y - center.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist + ball.r > radius) {
      // Normal vector
      const nx = dx / dist;
      const ny = dy / dist;
      
      // Reflect velocity
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx = ball.vx - 2 * dot * nx;
      ball.vy = ball.vy - 2 * dot * ny;
      
      // Push back inside
      const overlap = (dist + ball.r) - radius;
      ball.x -= nx * overlap;
      ball.y -= ny * overlap;

      // Wall hit damage for parasite from arena spikes
      if (ball.type === 'parasite') {
         // Check if close to any arena spike
         spikes.forEach(s => {
            const sdx = ball.x - s.x;
            const sdy = ball.y - s.y;
            if (Math.sqrt(sdx*sdx + sdy*sdy) < 80) {
               ball.hp -= 1500;
               createParticles(ball.x, ball.y, '#43E97B');
            }
         });
      }
    }
  }

  function checkBallCollision() {
    const dx = parasiteBall.x - spikeBall.x;
    const dy = parasiteBall.y - spikeBall.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < spikeBall.r + parasiteBall.r) {
      // Bounce
      const nx = dx / dist;
      const ny = dy / dist;
      
      const p = 2 * (spikeBall.vx * nx + spikeBall.vy * ny - parasiteBall.vx * nx - parasiteBall.vy * ny) / 2;
      spikeBall.vx -= p * nx;
      spikeBall.vy -= p * ny;
      parasiteBall.vx += p * nx;
      parasiteBall.vy += p * ny;

      // Separate
      const overlap = (spikeBall.r + parasiteBall.r) - dist;
      spikeBall.x -= nx * overlap / 2;
      spikeBall.y -= ny * overlap / 2;
      parasiteBall.x += nx * overlap / 2;
      parasiteBall.y += ny * overlap / 2;

      // Damage & effects
      parasiteBall.hp -= 2500; // Spike deals burst damage on hit
      createParticles(parasiteBall.x, parasiteBall.y, '#00F2FE');

      // Parasite attaches a leech on hit
      if (leeches.length < 15) {
         leeches.push({ offsetAngle: Math.random() * Math.PI * 2 });
      }
    }
  }

  function createParticles(x, y, color) {
    for(let i=0; i<5; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color
      });
    }
  }

  function loop() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, size, size);

    // Draw arena spikes
    spikes.forEach(drawArenaSpike);

    // Physics
    updatePhysics(spikeBall);
    updatePhysics(parasiteBall);
    checkBallCollision();

    // Leech damage (DoT)
    if (leeches.length > 0) {
       spikeBall.hp -= leeches.length * 20; // damage per frame
    }

    // Draw leeches on spike ball
    leeches.forEach(leech => {
       const lx = spikeBall.x + Math.cos(leech.offsetAngle) * spikeBall.r;
       const ly = spikeBall.y + Math.sin(leech.offsetAngle) * spikeBall.r;
       ctx.beginPath();
       ctx.arc(lx, ly, 6, 0, Math.PI*2);
       ctx.fillStyle = '#43E97B';
       ctx.fill();
       ctx.stroke();
    });

    // Particles
    for(let i = particles.length-1; i>=0; i--) {
      let p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    // Draw balls
    drawCircle(spikeBall.x, spikeBall.y, spikeBall.r, spikeBall.color, false);
    drawCircle(parasiteBall.x, parasiteBall.y, parasiteBall.r, parasiteBall.color, true);

    // Update HP UI
    spikeBall.hp = Math.max(0, Math.floor(spikeBall.hp));
    parasiteBall.hp = Math.max(0, Math.floor(parasiteBall.hp));
    document.getElementById('hp-spike').innerText = spikeBall.hp;
    document.getElementById('hp-parasite').innerText = parasiteBall.hp;

    // Check Win Condition
    if (spikeBall.hp <= 0 || parasiteBall.hp <= 0) {
      isRunning = false;
      endGame(spikeBall.hp <= 0 ? 'parasite' : 'spike');
      return;
    }

    animationId = requestAnimationFrame(loop);
  }

  function endGame(winner) {
    const overlay = document.getElementById('bb-end-overlay');
    const text = document.getElementById('bb-result-text');
    overlay.style.display = 'flex';

    if (userPick === winner) {
      text.innerText = "YOU GUESSED RIGHT! 🎉";
      text.className = "bb-result win";
    } else {
      text.innerText = "YOU GUESSED WRONG 💀";
      text.className = "bb-result lose";
    }
  }

  // Draw initial state
  spikes.forEach(drawArenaSpike);
  drawCircle(spikeBall.x, spikeBall.y, spikeBall.r, spikeBall.color, false);
  drawCircle(parasiteBall.x, parasiteBall.y, parasiteBall.r, parasiteBall.color, true);

  // Events
  document.getElementById('btn-pick-spike').addEventListener('click', () => {
    userPick = 'spike';
    document.getElementById('bb-start-overlay').style.display = 'none';
    isRunning = true;
    loop();
  });
  document.getElementById('btn-pick-parasite').addEventListener('click', () => {
    userPick = 'parasite';
    document.getElementById('bb-start-overlay').style.display = 'none';
    isRunning = true;
    loop();
  });
  document.getElementById('bb-share-btn').addEventListener('click', () => {
    alert("Score saved to clipboard! Open TikTok to paste and share.");
  });
}
