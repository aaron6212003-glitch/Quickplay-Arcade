export function init(container) {
  // Clear any existing contents
  container.innerHTML = '';

  // Setup Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 550;
  canvas.height = 700;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '550px';
  canvas.style.height = 'auto';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = 'radial-gradient(circle, #101026 0%, #050512 100%)';
  canvas.style.border = '8px solid #334155'; // Slate metallic frame
  canvas.style.borderRadius = '16px';
  canvas.style.boxShadow = 'inset 0 0 40px rgba(0,0,0,0.8), 0 15px 30px rgba(0,0,0,0.5)';
  canvas.style.cursor = 'pointer';

  // Wrapper for DOM overlays
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.textAlign = 'center';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '550px';
  wrapper.style.margin = '0 auto';
  wrapper.appendChild(canvas);

  container.appendChild(wrapper);

  // Floating Exit Button (Translucent glassmorphic Close)
  const exitBtn = document.createElement('button');
  exitBtn.innerHTML = '✕';
  exitBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
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
    transition: background 0.2s, transform 0.1s;
  `;
  exitBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    cancelAnimationFrame(animationId);
    document.body.classList.remove('game-active');
    window.location.href = 'index.html';
  });
  // hover effect
  exitBtn.addEventListener('mouseenter', () => { exitBtn.style.background = 'rgba(255, 255, 255, 0.25)'; exitBtn.style.transform = 'scale(1.05)'; });
  exitBtn.addEventListener('mouseleave', () => { exitBtn.style.background = 'rgba(255, 255, 255, 0.12)'; exitBtn.style.transform = 'scale(1)'; });
  
  wrapper.appendChild(exitBtn);

  const ctx = canvas.getContext('2d');

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

    if (type === 'pop') {
      // Crisp retro tap ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'fail') {
      // Low, disappointed mechanical buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now); // A2
      osc.frequency.linearRampToValueAtTime(55, now + 0.35); // A1
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.41);
    } else if (type === 'unlock') {
      // Triumphant mechanical combination unlock chime
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, now + index * 0.08);
        noteGain.gain.setValueAtTime(0.12, now + index * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);
        
        noteOsc.start(now + index * 0.08);
        noteOsc.stop(now + index * 0.08 + 0.26);
      });
    }
  }

  // --- GAME STATE ---
  let score = 0;
  let level = 1;
  let isGameOver = false;
  let isLevelCleared = false;
  let clicksThisLevel = 0;
  let remainingPops = 3; // Starts at 3 for level 1
  let targetPops = 3;

  // Dial Properties
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2; // perfectly centered vertically
  const dialRadius = 140; // larger dial for a bold arcade machine aesthetic!

  // Indicator Needle
  let indicatorAngle = -Math.PI / 2; // Starts at top
  let baseSpeed = 0.035;
  let speedMultiplier = 1;
  let speed = baseSpeed;

  // Target Circle Dot
  let targetAngle = 0;
  let targetRadius = 14;

  // Animations & Physics Particles
  let particles = [];
  let screenShake = 0;
  let shackleYOffset = 0; // Animates up when unlocked
  let dialScale = 1; // Pulses on click
  let buttonScale = 1; // Pulses on click
  let backgroundPulse = 0;

  // Spawn target at a safe angle away from current indicator
  function spawnTarget() {
    let diff = 0;
    let attempts = 0;
    do {
      targetAngle = Math.random() * Math.PI * 2;
      // Calculate angular distance
      let d = Math.abs(targetAngle - indicatorAngle);
      while (d > Math.PI) d = Math.PI * 2 - d;
      diff = d;
      attempts++;
    } while (diff < 1.3 && attempts < 100); // Ensure target is at least 75 degrees away
  }

  // Set up details for the current level
  function initLevel() {
    isLevelCleared = false;
    clicksThisLevel = 0;
    targetPops = 2 + level; // Level 1 = 3, Level 2 = 4, etc.
    remainingPops = targetPops;
    
    // Scale speed slightly as levels advance
    speed = (baseSpeed + Math.min(level * 0.004, 0.025)) * (Math.random() < 0.5 ? 1 : -1);
    shackleYOffset = 0;
    spawnTarget();
  }

  // Spark / Glow Particles
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 2;
      this.vx = Math.cos(angle) * velocity;
      this.vy = Math.sin(angle) * velocity;
      this.radius = Math.random() * 4 + 2;
      this.life = 1.0;
      this.decay = Math.random() * 0.03 + 0.02;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += 0.12 * dt; // gravity drift
      this.life -= this.decay * dt;
    }

    draw(c) {
      c.save();
      c.globalAlpha = this.life;
      c.fillStyle = this.color;
      c.shadowColor = this.color;
      c.shadowBlur = 10;
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  function spawnExplosion(x, y, color) {
    for (let i = 0; i < 18; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

  // Check tap overlap
  function handleTap() {
    if (isGameOver) return;

    if (isLevelCleared) return;

    // Calculate angular offset
    let diff = Math.abs(indicatorAngle - targetAngle);
    while (diff > Math.PI) diff = Math.PI * 2 - diff;

    // Allowed tolerance decreases slightly as levels scale up
    const tolerance = Math.max(0.14, 0.19 - level * 0.005); 

    if (diff <= tolerance) {
      // SUCCESSFUL POP!
      remainingPops--;
      score++;
      clicksThisLevel++;
      
      // Pulse effects
      dialScale = 1.08;
      backgroundPulse = 0.35;
      
      // Spark colors match level gradient
      const particleColor = level % 2 === 0 ? '#ec4899' : '#f59e0b';
      const targetX = centerX + Math.cos(targetAngle) * dialRadius;
      const targetY = centerY + Math.sin(targetAngle) * dialRadius;
      spawnExplosion(targetX, targetY, particleColor);
      
      playSound('pop');

      if (remainingPops <= 0) {
        // LEVEL CLEARED
        isLevelCleared = true;
        playSound('unlock');
        shackleYOffset = 0; // Trigger lock shackle animation
      } else {
        // Reverse direction and spawn next lock target
        speed = -speed;
        
        // Speed up slightly on consecutive hits in the same level
        const speedBoost = 1 + (clicksThisLevel * 0.08);
        const dir = speed > 0 ? 1 : -1;
        speed = dir * Math.abs(baseSpeed + Math.min(level * 0.004, 0.025)) * speedBoost;
        
        spawnTarget();
      }
    } else {
      // MISSED / FAILED!
      isGameOver = true;
      screenShake = 12;
      playSound('fail');
      
      // Save highscore
      if (window.saveScore) {
        window.saveScore('Pop Lock', score);
      }
    }
  }

  // --- GAME LOOP ---
  function update(dt) {
    // Screen Shake Decay
    if (screenShake > 0) {
      screenShake *= Math.pow(0.9, dt);
      if (screenShake < 0.2) screenShake = 0;
    }

    // Dial Pulse Decay
    if (dialScale > 1) {
      dialScale -= 0.015 * dt;
    }

    // Background Pulse Decay
    if (backgroundPulse > 0) {
      backgroundPulse -= 0.015 * dt;
    }

    if (!isGameOver && !isLevelCleared) {
      // Advance indicator needle angle scaled by delta time!
      indicatorAngle += speed * dt;
      // keep in standard bounds
      if (indicatorAngle > Math.PI * 2) indicatorAngle -= Math.PI * 2;
      if (indicatorAngle < 0) indicatorAngle += Math.PI * 2;
    }

    // Shackle unlocking animation
    if (isLevelCleared) {
      if (shackleYOffset > -40) {
        shackleYOffset -= 4 * dt; // slide shackle up
      } else {
        // After shackle pops, load next level
        isLevelCleared = false;
        level++;
        initLevel();
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update(dt);
      if (particles[i].life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.save();
    
    // Apply Screen Shake
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dynamic Pulsing Background glow
    if (backgroundPulse > 0) {
      const grad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 300);
      const color = level % 2 === 0 ? `rgba(236,72,153,${backgroundPulse * 0.15})` : `rgba(139,92,246,${backgroundPulse * 0.15})`;
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ==========================================
    // 1. DRAW METAL SHACKLE (PADLOCK TOP U-BAR)
    // ==========================================
    ctx.save();
    ctx.translate(centerX, centerY - 60 + shackleYOffset);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    ctx.lineCap = 'round';
    
    // U-Bar Base shadow/dark layer
    ctx.strokeStyle = '#1e293b'; // dark border steel
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(-65, 30);
    ctx.lineTo(-65, -45);
    ctx.arc(0, -45, 65, Math.PI, 0); // U-loop top arch
    ctx.lineTo(65, 30);
    ctx.stroke();

    // U-Bar Main steel body
    ctx.strokeStyle = '#475569'; // steel grey
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(-65, 30);
    ctx.lineTo(-65, -45);
    ctx.arc(0, -45, 65, Math.PI, 0);
    ctx.lineTo(65, 30);
    ctx.stroke();

    // U-Bar Core shiny cylinder reflection
    ctx.strokeStyle = '#94a3b8'; // light steel
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-65, 30);
    ctx.lineTo(-65, -45);
    ctx.arc(0, -45, 65, Math.PI, 0);
    ctx.lineTo(65, 30);
    ctx.stroke();
    
    // U-Bar Brightest highlight (offset slightly left to simulate directional lighting!)
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-68, 30);
    ctx.lineTo(-68, -45);
    ctx.arc(0, -45, 68, Math.PI, 0);
    ctx.lineTo(62, 30);
    ctx.stroke();
    ctx.restore();
    
    // Shiny gold brass bushing bases
    ctx.lineWidth = 6;
    ctx.lineCap = 'butt';
    
    const leftBushGrad = ctx.createLinearGradient(-80, 0, -50, 0);
    leftBushGrad.addColorStop(0, '#78350f'); // Dark gold
    leftBushGrad.addColorStop(0.5, '#f59e0b'); // Bright brass
    leftBushGrad.addColorStop(1, '#d97706'); // Medium gold
    ctx.strokeStyle = leftBushGrad;
    ctx.beginPath();
    ctx.moveTo(-78, 20);
    ctx.lineTo(-52, 20);
    ctx.stroke();
    
    const rightBushGrad = ctx.createLinearGradient(52, 0, 82, 0);
    rightBushGrad.addColorStop(0, '#78350f');
    rightBushGrad.addColorStop(0.5, '#f59e0b');
    rightBushGrad.addColorStop(1, '#d97706');
    ctx.strokeStyle = rightBushGrad;
    ctx.beginPath();
    ctx.moveTo(52, 20);
    ctx.lineTo(78, 20);
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 2. DRAW MAIN COMBINATION DIAL CASING
    // ==========================================
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Scale body on hits
    ctx.scale(dialScale, dialScale);

    // Dynamic Outer Neon Glow Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius + 45, 0, Math.PI * 2);
    ctx.shadowColor = level % 2 === 0 ? '#ec4899' : '#06b6d4';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = level % 2 === 0 ? 'rgba(236,72,153,0.5)' : 'rgba(6,182,212,0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Drop Shadow for main casing body
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 15;

    // Outermost steel rim dial body
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius + 45, 0, Math.PI * 2);
    const casingGrad = ctx.createRadialGradient(0, 0, 80, 0, 0, dialRadius + 45);
    casingGrad.addColorStop(0, '#1e293b');
    casingGrad.addColorStop(0.7, '#0f172a');
    casingGrad.addColorStop(1, '#020617');
    ctx.fillStyle = casingGrad;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Brushed Silver Outer Bezel ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius + 42, 0, Math.PI * 2);
    const metalGrad = ctx.createLinearGradient(-dialRadius - 45, -dialRadius - 45, dialRadius + 45, dialRadius + 45);
    metalGrad.addColorStop(0, '#f1f5f9');
    metalGrad.addColorStop(0.25, '#94a3b8');
    metalGrad.addColorStop(0.5, '#475569');
    metalGrad.addColorStop(0.75, '#cbd5e1');
    metalGrad.addColorStop(1, '#1e293b');
    ctx.strokeStyle = metalGrad;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Padlock dynamic neon glowing background ring
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius, 0, Math.PI * 2);
    ctx.strokeStyle = level % 2 === 0 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(34, 211, 238, 0.12)';
    ctx.lineWidth = 28;
    ctx.stroke();

    // 3D Neon Level Progress Ring (drawn around dialRadius in slot)
    const popped = targetPops - remainingPops;
    const progressRatio = popped / targetPops;
    if (progressRatio > 0) {
      ctx.save();
      ctx.beginPath();
      // Clockwise progress starting from 12 o'clock (-Math.PI / 2)
      ctx.arc(0, 0, dialRadius, -Math.PI / 2, -Math.PI / 2 + progressRatio * Math.PI * 2);
      ctx.strokeStyle = level % 2 === 0 ? '#ec4899' : '#06b6d4';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.shadowColor = level % 2 === 0 ? '#ec4899' : '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();
    }


    // Glowing Neon circular slot path outline
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Diagonal Glass Reflection Highlight sweep
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius + 38, 0, Math.PI * 2);
    ctx.clip(); // clip inside bevel
    const shineGrad = ctx.createLinearGradient(-150, -150, 150, 150);
    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    shineGrad.addColorStop(0.28, 'rgba(255, 255, 255, 0.06)');
    shineGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
    shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shineGrad;
    ctx.fill();
    ctx.restore();
    // Center metallic combination hub wheel (radial brushed metal safe dial texture)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius - 38, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, dialRadius - 38);
    innerGrad.addColorStop(0, '#475569'); // slate grey steel
    innerGrad.addColorStop(0.35, '#1e293b'); // dark steel
    innerGrad.addColorStop(0.7, '#334155'); // medium steel
    innerGrad.addColorStop(0.9, '#0f172a'); // deep steel bevel
    innerGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = innerGrad;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.restore();
    
    // Inner glass bezel line / glossy shine border
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius - 40, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 3. DRAW TARGET POP LOCK DOT
    // ==========================================
    if (!isGameOver) {
      const tx = Math.cos(targetAngle) * dialRadius;
      const ty = Math.sin(targetAngle) * dialRadius;
      
      ctx.save();
      ctx.translate(tx, ty);
      
      // Blinking / Pulsing animation for dynamic target dot
      let pulse = 1 + Math.sin(frameCount * 0.12) * 0.15;
      if (level >= 4) {
        // Level 4+ blinks target dot rapidly
        if (Math.floor(frameCount / 18) % 2 === 0) pulse = 0.55;
      }
      
      // Target Glow Outer Ring
      ctx.beginPath();
      ctx.arc(0, 0, targetRadius * pulse * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'; // neon yellow-orange
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Main solid Target Core
      ctx.beginPath();
      ctx.arc(0, 0, targetRadius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#fcd34d'; // bright gold
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    // ==========================================
    // 4. DRAW ROTATING NEEDLE/INDICATOR
    // ==========================================
    if (!isGameOver) {
      const ix = Math.cos(indicatorAngle) * dialRadius;
      const iy = Math.sin(indicatorAngle) * dialRadius;

      ctx.save();
      ctx.shadowColor = '#06b6d4'; // bright electric cyan
      ctx.shadowBlur = 18;
      
      // Rotating needle pointer
      ctx.beginPath();
      ctx.arc(ix, iy, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // ==========================================
    // 5. DRAW VAULT CORE TEXT (REMAINING POPS)
    // ==========================================
    ctx.save();
    ctx.shadowBlur = 0;
    
    // Giant Remaining clicks digit
    ctx.font = '900 80px "Outfit", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = remainingPops === 1 ? '#ef4444' : '#ffffff';
    ctx.fillText(remainingPops, 0, -5);

    // Small objective helper text
    ctx.font = '700 12px "Outfit", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.letterSpacing = '1px';
    ctx.fillText('LOCKED POPS', 0, 42);
    ctx.restore();

    ctx.restore(); // Undo dial scales/translates

    // ==========================================
    // 6. DRAW EXPLODING PARTICLES
    // ==========================================
    particles.forEach(p => p.draw(ctx));

    // ==========================================
    // 7. DRAW INTERACTIVE TEXT & SCORES
    // ==========================================
    // Level & Score display at the top
    ctx.save();
    ctx.font = '900 24px "Outfit", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 30, 45);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#c084fc'; // purple neon
    ctx.fillText(`VAULT LEVEL: ${level}`, canvas.width - 30, 45);

    // Standard control message
    if (!isGameOver && !isLevelCleared) {
      ctx.textAlign = 'center';
      ctx.font = '700 13px "Outfit", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('TAP THE RED DOME BUTTON WHEN CYAN DOT OVERLAPS TARGET!', canvas.width / 2, canvas.height - 150);
    }
    ctx.restore();

    // ==========================================
    // DRAW ARCADE "TAP" PUSH BUTTON AT BOTTOM
    // ==========================================
    if (!isGameOver) {
      ctx.save();
      const btnY = canvas.height - 80;
      
      // Let the button visually compress down when pressed!
      ctx.translate(centerX, btnY);
      ctx.scale(buttonScale, buttonScale);
      
      const btnRad = 45;
      
      // Button Outer Chrome Bezel
      ctx.beginPath();
      ctx.arc(0, 0, btnRad, 0, Math.PI * 2);
      const bezelGrad = ctx.createLinearGradient(-40, -40, 40, 40);
      bezelGrad.addColorStop(0, '#cbd5e1'); // shiny light metal
      bezelGrad.addColorStop(0.5, '#475569');
      bezelGrad.addColorStop(1, '#0f172a'); // dark metal shadow
      ctx.fillStyle = bezelGrad;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.fill();
      
      // Bezel inner silver highlight ring
      ctx.beginPath();
      ctx.arc(0, 0, btnRad - 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Red Dome Button (3D radial sphere gradient)
      ctx.beginPath();
      ctx.arc(0, 0, btnRad - 8, 0, Math.PI * 2);
      const domeGrad = ctx.createRadialGradient(-10, -10, 2, 0, 0, btnRad - 8);
      // Make it glow even brighter when clicked!
      if (buttonScale < 0.98) {
        domeGrad.addColorStop(0, '#fca5a5'); // super hot pink-red
        domeGrad.addColorStop(0.4, '#ef4444');
        domeGrad.addColorStop(1, '#7f1d1d');
      } else {
        domeGrad.addColorStop(0, '#f87171');
        domeGrad.addColorStop(0.6, '#dc2626');
        domeGrad.addColorStop(1, '#991b1b');
      }
      ctx.fillStyle = domeGrad;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = buttonScale < 0.98 ? 25 : 15;
      ctx.fill();

      // Sleek shiny curved gloss highlight on the red dome itself
      ctx.beginPath();
      ctx.ellipse(-10, -12, 16, 8, Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();

      // "TAP" text inside button
      ctx.font = '900 18px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.shadowOffsetY = 1;
      ctx.fillText('TAP', 0, 0);
      ctx.restore();
    }

    // ==========================================
    // 8. GAME OVER OVERLAY SCREEN
    // ==========================================
    if (isGameOver) {
      ctx.save();
      // Glassmorphic background card
      ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.translate(centerX, centerY - 20);

      // Warning ring outline
      ctx.strokeStyle = '#ef4444'; // Red alarm
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -90, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Red cross alert icon
      ctx.font = '900 48px "Outfit", sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚨', 0, -90);

      ctx.font = '900 42px "Outfit", sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('ALARM TRIGGERED', 0, -10);

      ctx.font = '700 16px "Outfit", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Your pick snapped! The vault remains locked.', 0, 24);

      // Final Level & Score Stats Box
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-160, 55, 320, 95, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 14px "Outfit", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('VAULT TIER ACHIEVED', -80, 85);
      ctx.fillText('LOCK TARGETS POPPED', 80, 85);

      ctx.font = '900 32px "Outfit", sans-serif';
      ctx.fillStyle = '#c084fc';
      ctx.fillText(`Lvl ${level}`, -80, 120);
      ctx.fillStyle = '#fcd34d';
      ctx.fillText(score, 80, 120);

      // Buttons
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 1. Play Again Button (Neon pink)
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(-130, 150, 260, 48, 24);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px "Outfit", sans-serif';
      ctx.fillText('TRY AGAIN', 0, 174);

      // 2. Exit to Lobby Button (Outline style)
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-130, 210, 260, 48, 24);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '900 16px "Outfit", sans-serif';
      ctx.fillText('EXIT TO LOBBY', 0, 234);

      ctx.restore();
    }
    
    ctx.restore(); // Final base pop
  }

  let frameCount = 0;
  let animationId;
  let lastTime = performance.now();

  function loop(timestamp) {
    if (!timestamp) timestamp = performance.now();
    const dt = (timestamp - lastTime) / 16.666;
    lastTime = timestamp;
    
    const cappedDt = Math.min(dt, 3.0);
    
    frameCount++;
    update(cappedDt);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // --- POINTER EVENT HANDLERS (TAP ANYWHERE) ---
  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (isGameOver) {
      const btnTryMinX = centerX - 130;
      const btnTryMaxX = centerX + 130;
      const btnTryMinY = centerY + 150; // aligned with new centerY
      const btnTryMaxY = centerY + 198;

      const btnExitMinX = centerX - 130;
      const btnExitMaxX = centerX + 130;
      const btnExitMinY = centerY + 210;
      const btnExitMaxY = centerY + 258;

      if (clickX >= btnTryMinX && clickX <= btnTryMaxX && clickY >= btnTryMinY && clickY <= btnTryMaxY) {
        e.preventDefault();
        score = 0;
        level = 1;
        isGameOver = false;
        initLevel();
      } else if (clickX >= btnExitMinX && clickX <= btnExitMaxX && clickY >= btnExitMinY && clickY <= btnExitMaxY) {
        e.preventDefault();
        cancelAnimationFrame(animationId);
        document.body.classList.remove('game-active');
        window.location.href = 'index.html';
      }
      return;
    }

    // Normal gameplay - tap ANYWHERE on the canvas!
    e.preventDefault();
    dialScale = 1.06; // physical bounce on click
    handleTap();
  }

  // Bind Pointer Event
  canvas.addEventListener('pointerdown', handlePointerDown);

  // --- INITIALIZATION ---
  initLevel();
  loop();
}
