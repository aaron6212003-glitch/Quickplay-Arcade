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
  const centerY = canvas.height / 2 + 30; // slightly offset down to leave room for lock shackle
  const dialRadius = 110;

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

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.12; // gravity drift
      this.life -= this.decay;
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
  function update() {
    // Screen Shake Decay
    if (screenShake > 0) {
      screenShake *= 0.9;
      if (screenShake < 0.2) screenShake = 0;
    }

    // Dial Pulse Decay
    if (dialScale > 1) {
      dialScale -= 0.015;
    }

    // Background Pulse Decay
    if (backgroundPulse > 0) {
      backgroundPulse -= 0.015;
    }

    if (!isGameOver && !isLevelCleared) {
      // Advance indicator needle angle
      indicatorAngle += speed;
      // keep in standard bounds
      if (indicatorAngle > Math.PI * 2) indicatorAngle -= Math.PI * 2;
      if (indicatorAngle < 0) indicatorAngle += Math.PI * 2;
    }

    // Shackle unlocking animation
    if (isLevelCleared) {
      if (shackleYOffset > -40) {
        shackleYOffset -= 4; // slide shackle up
      } else {
        // After shackle pops, load next level
        isLevelCleared = false;
        level++;
        initLevel();
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
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
    ctx.strokeStyle = '#64748b'; // Steel grey
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    
    ctx.beginPath();
    // Drawn as a U shape
    ctx.moveTo(-65, 30);
    ctx.lineTo(-65, -45);
    ctx.arc(0, -45, 65, Math.PI, 0); // U-loop top arch
    ctx.lineTo(65, 30);
    ctx.stroke();
    
    // Gold metallic accent rings on shackle bases
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-78, 20);
    ctx.lineTo(-52, 20);
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

    // Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 15;

    // Outermost steel rim
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius + 45, 0, Math.PI * 2);
    ctx.fillStyle = 'linear-gradient(135deg, #1e293b, #0f172a)'; // slate grey
    const casingGrad = ctx.createRadialGradient(0, 0, 80, 0, 0, dialRadius + 45);
    casingGrad.addColorStop(0, '#1e293b');
    casingGrad.addColorStop(0.7, '#0f172a');
    casingGrad.addColorStop(1, '#020617');
    ctx.fillStyle = casingGrad;
    ctx.fill();
    
    // Glowing Neon circular slot path
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Outer rim highlight
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius + 43, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center metallic combination hub wheel
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius - 38, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, dialRadius - 38);
    innerGrad.addColorStop(0, '#334155');
    innerGrad.addColorStop(0.8, '#1e293b');
    innerGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = innerGrad;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    
    // Inner glass bezel line
    ctx.beginPath();
    ctx.arc(0, 0, dialRadius - 40, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

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
      ctx.font = '700 15px "Outfit", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('TAP/CLICK ANYWHERE WHEN RED INDICATOR COVERS TARGET!', canvas.width / 2, canvas.height - 40);
    }
    ctx.restore();

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
      ctx.roundRect(-130, 170, 260, 48, 24);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px "Outfit", sans-serif';
      ctx.fillText('TRY AGAIN', 0, 194);

      // 2. Exit to Lobby Button (Outline style)
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-130, 230, 260, 48, 24);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '900 16px "Outfit", sans-serif';
      ctx.fillText('EXIT TO LOBBY', 0, 254);

      ctx.restore();
    }
    
    ctx.restore(); // Final base pop
  }

  let frameCount = 0;
  let animationId;

  function loop() {
    frameCount++;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // --- MOUSE & TOUCH EVENT HANDLERS ---
  function handleInput(e) {
    e.preventDefault();
    
    if (isGameOver) {
      // Check which button was tapped
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
      const clickY = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;

      // Try Again Button box: centered horizontally at centerX, y range: [centerY - 20 + 170, centerY - 20 + 218]
      const btnTryMinX = centerX - 130;
      const btnTryMaxX = centerX + 130;
      const btnTryMinY = centerY - 20 + 170;
      const btnTryMaxY = centerY - 20 + 218;

      // Exit Button box: centered horizontally at centerX, y range: [centerY - 20 + 230, centerY - 20 + 278]
      const btnExitMinX = centerX - 130;
      const btnExitMaxX = centerX + 130;
      const btnExitMinY = centerY - 20 + 230;
      const btnExitMaxY = centerY - 20 + 278;

      if (clickX >= btnTryMinX && clickX <= btnTryMaxX && clickY >= btnTryMinY && clickY <= btnTryMaxY) {
        // Restart the game
        score = 0;
        level = 1;
        isGameOver = false;
        initLevel();
      } else if (clickX >= btnExitMinX && clickX <= btnExitMaxX && clickY >= btnExitMinY && clickY <= btnExitMaxY) {
        // Exit to main lobby
        cancelAnimationFrame(animationId);
        window.location.href = 'index.html';
      }
      return;
    }

    // Normal gameplay hit checking
    handleTap();
  }

  // Bind Mouse & Touch Taps
  canvas.addEventListener('mousedown', handleInput);
  canvas.addEventListener('touchstart', handleInput, { passive: false });

  // --- INITIALIZATION ---
  initLevel();
  loop();
}
