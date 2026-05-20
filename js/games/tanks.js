export function initTanks(container) {
  // Setup Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '800px';
  canvas.style.height = 'auto';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = '#e7e5e4'; // Corkboard/paper background
  canvas.style.border = '12px solid #78350f'; // Thick wooden frame
  canvas.style.borderRadius = '8px';
  canvas.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.5)';
  canvas.style.cursor = 'none'; // Hide default cursor, draw custom crosshair
  
  // Wrapper for UI
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.textAlign = 'center';
  
  // Score display
  const scoreDisplay = document.createElement('div');
  scoreDisplay.style.position = 'absolute';
  scoreDisplay.style.top = '10px';
  scoreDisplay.style.left = '20px';
  scoreDisplay.style.fontSize = '24px';
  scoreDisplay.style.fontWeight = '900';
  scoreDisplay.style.color = '#78350f';
  scoreDisplay.style.fontFamily = 'monospace';
  scoreDisplay.innerText = 'SCORE: 0';
  
  // Lives display
  const livesDisplay = document.createElement('div');
  livesDisplay.style.position = 'absolute';
  livesDisplay.style.top = '10px';
  livesDisplay.style.right = '20px';
  livesDisplay.style.fontSize = '24px';
  livesDisplay.style.fontWeight = '900';
  livesDisplay.style.color = '#dc2626';
  livesDisplay.style.fontFamily = 'monospace';
  livesDisplay.innerText = '♥♥♥';

  // Level display
  const levelDisplay = document.createElement('div');
  levelDisplay.style.position = 'absolute';
  levelDisplay.style.bottom = '10px';
  levelDisplay.style.left = '20px';
  levelDisplay.style.fontSize = '20px';
  levelDisplay.style.fontWeight = '900';
  levelDisplay.style.color = '#78350f';
  levelDisplay.style.fontFamily = 'monospace';
  levelDisplay.innerText = 'LEVEL 1';

  wrapper.appendChild(canvas);
  wrapper.appendChild(scoreDisplay);
  wrapper.appendChild(livesDisplay);
  wrapper.appendChild(levelDisplay);

  // Mobile Controls Overlay
  const mobileControls = document.createElement('div');
  mobileControls.style.display = 'none'; // hidden until touch
  mobileControls.style.position = 'absolute';
  mobileControls.style.inset = '0';
  mobileControls.style.pointerEvents = 'none';
  mobileControls.innerHTML = `
    <div id="joy-base" style="position:absolute; bottom:20px; left:20px; width:120px; height:120px; background:rgba(0,0,0,0.2); border-radius:50%; pointer-events:auto; touch-action:none;">
      <div id="joy-stick" style="position:absolute; top:35px; left:35px; width:50px; height:50px; background:rgba(255,255,255,0.6); border-radius:50%; box-shadow:0 4px 10px rgba(0,0,0,0.3);"></div>
    </div>
    <div style="position:absolute; bottom:20px; right:20px; pointer-events:auto; display:flex; gap:10px; align-items:flex-end;">
      <button id="btn-mine" style="width:60px; height:60px; border-radius:50%; background:rgba(56,189,248,0.6); border:3px solid #fff; color:#fff; font-weight:900; touch-action:none;">MINE</button>
    </div>
  `;
  wrapper.appendChild(mobileControls);

  container.appendChild(wrapper);
  const ctx = canvas.getContext('2d');
  
  // Game State
  let animationId;
  let isGameOver = false;
  let score = 0;
  let lives = 3;
  let level = 1;
  let frameCount = 0;
  
  const keys = { w:false, a:false, s:false, d:false, ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  
  // Touch Joy
  let touchJoy = { active: false, dx: 0, dy: 0, touchId: null };
  let isMobile = false;
  
  // Entities
  let player;
  let enemies = [];
  let bullets = [];
  let mines = [];
  let particles = [];
  let blocks = [];
  let tracks = []; // Tank tread marks

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  class Tank {
    constructor(x, y, type, isPlayer = false) {
      this.x = x;
      this.y = y;
      this.radius = 16;
      this.isPlayer = isPlayer;
      this.angle = 0;
      this.turretAngle = 0;
      this.type = type;
      this.lastShot = 0;
      this.vx = 0;
      this.vy = 0;
      
      // Spawn protection
      this.invincible = isPlayer ? 120 : 0; // 2 seconds at 60fps
      this.startDelay = isPlayer ? 0 : 120; // Enemies wait 2s before acting
      
      // Types: player (blue), brown (stationary), grey (moving), green (fast, bounces)
      if (isPlayer) {
        this.color = '#2563eb'; // Blue
        this.speed = 2.5;
        this.cooldown = 400;
        this.maxBullets = 5;
      } else if (type === 'brown') {
        this.color = '#92400e'; // Brown
        this.speed = 0;
        this.cooldown = 1500;
        this.maxBullets = 1;
      } else if (type === 'grey') {
        this.color = '#64748b'; // Grey
        this.speed = 1.2;
        this.cooldown = 1200;
        this.maxBullets = 1;
      } else if (type === 'green') {
        this.color = '#15803d'; // Green
        this.speed = 1.8;
        this.cooldown = 800;
        this.maxBullets = 2;
      }
      
      // Enemy AI stuff
      this.moveTimer = 0;
      this.targetAngle = 0;
    }

    draw(ctx) {
      if (this.invincible > 0 && Math.floor(this.invincible / 10) % 2 === 0) {
        return; // Blink
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Tank Drop Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 4;
      
      ctx.save();
      ctx.rotate(this.angle);
      
      // Draw treads (grey boxes on sides)
      ctx.fillStyle = '#444';
      ctx.fillRect(-18, -20, 36, 8);
      ctx.fillRect(-18, 12, 36, 8);
      // Tread detail
      ctx.fillStyle = '#222';
      for(let i=-16; i<=16; i+=4) {
        ctx.fillRect(i, -20, 2, 8);
        ctx.fillRect(i, 12, 2, 8);
      }
      
      // Draw body
      ctx.fillStyle = this.color;
      roundRect(ctx, -14, -14, 28, 28, 6);
      ctx.fill();
      
      // Body highlight (toy effect)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore(); // Undo body rotation

      // Draw turret
      ctx.save();
      ctx.rotate(this.turretAngle);
      
      // Barrel
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, -4, 28, 8);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, -4, 28, 8);
      // Barrel tip
      ctx.fillStyle = '#475569';
      ctx.fillRect(24, -5, 6, 10);
      
      // Turret base
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Player special accent
      if (this.isPlayer) {
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fcd34d'; // Yellow dot
        ctx.fill();
      }

      ctx.restore(); // Undo turret rotation
      ctx.restore(); // Undo translate
    }
  }

  class Bullet {
    constructor(x, y, vx, vy, isPlayer, bouncesLeft = 1) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = 4;
      this.isPlayer = isPlayer;
      this.bouncesLeft = bouncesLeft;
      this.speed = Math.hypot(vx, vy);
      this.active = true;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Shadow
      ctx.beginPath();
      ctx.arc(3, 3, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();

      // Bullet
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.isPlayer ? '#fcd34d' : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    }
  }

  class Mine {
    constructor(x, y, isPlayer) {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.isPlayer = isPlayer;
      this.timer = 300; // 5 seconds at 60fps
      this.active = true;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Shadow
      ctx.beginPath();
      ctx.arc(2, 2, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // Base
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f'; // Wood cork base
      ctx.fill();
      
      // Blinking light
      const blinkSpeed = this.timer < 60 ? 5 : 15; // Blinks faster at end
      const isLit = Math.floor(frameCount / blinkSpeed) % 2 === 0;
      
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = isLit ? '#ef4444' : '#7f1d1d';
      ctx.fill();
      
      ctx.restore();
    }
  }

  class Particle {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type; // 'smoke', 'spark', 'wood'
      const angle = Math.random() * Math.PI * 2;
      
      if (type === 'smoke') {
        const speed = Math.random() * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 10 + 5;
        this.color = `rgba(100, 100, 100, ${Math.random()*0.5+0.5})`;
        this.decay = Math.random() * 0.02 + 0.01;
      } else if (type === 'spark') {
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 3 + 1;
        this.color = '#f59e0b';
        this.decay = Math.random() * 0.05 + 0.03;
      } else { // wood
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 4 + 2;
        this.color = '#92400e';
        this.decay = Math.random() * 0.03 + 0.02;
      }
      this.life = 1.0;
    }
    
    draw(ctx) {
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95; // friction
      this.vy *= 0.95;
      if (this.type === 'smoke') this.size += 0.2; // Smoke expands
      this.life -= this.decay;
    }
  }

  function spawnExplosion(x, y) {
    // Screen shake
    const intensity = 8;
    canvas.style.transform = `translate(${(Math.random()-0.5)*intensity}px, ${(Math.random()-0.5)*intensity}px)`;
    setTimeout(() => { canvas.style.transform = 'translate(0,0)'; }, 50);

    // Smoke and sparks
    for(let i=0; i<15; i++) {
      particles.push(new Particle(x, y, 'smoke'));
      particles.push(new Particle(x, y, 'spark'));
      particles.push(new Particle(x, y, 'wood'));
    }
  }

  function generateLevel() {
    blocks = [];
    enemies = [];
    bullets = [];
    mines = [];
    particles = [];
    tracks = [];
    
    // Spawn player safely at bottom center
    player = new Tank(canvas.width/2, canvas.height - 50, 'player', true);
    player.angle = -Math.PI/2;
    player.turretAngle = -Math.PI/2;
    
    // Grid-based level generation for nicer layouts
    const cols = 8;
    const rows = 6;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;
    
    // Generate blocks
    const numBlocks = Math.min(5 + level * 2, 20);
    let blockCells = [];
    for(let i=0; i<numBlocks; i++) {
      let c, r;
      do {
        c = Math.floor(Math.random() * cols);
        r = Math.floor(Math.random() * (rows - 2)); // Keep blocks away from bottom
      } while (blockCells.some(bc => bc.c === c && bc.r === r));
      blockCells.push({c, r});
      
      const bw = 50;
      const bh = 50;
      const bx = c * cellW + (cellW/2 - bw/2);
      const by = r * cellH + (cellH/2 - bh/2);
      blocks.push({ x: bx, y: by, w: bw, h: bh });
    }

    // Spawn enemies
    let totalEnemies = 1;
    if (level === 2) totalEnemies = 2;
    if (level === 3) totalEnemies = 2;
    if (level === 4) totalEnemies = 3;
    if (level >= 5) totalEnemies = Math.min(3 + Math.floor((level - 5) / 2), 10);

    for(let i=0; i<totalEnemies; i++) {
      let ex, ey;
      let valid = false;
      let attempts = 0;
      do {
        ex = 50 + Math.random() * (canvas.width - 100);
        ey = 50 + Math.random() * (canvas.height/2); // Spawn top half
        valid = !blocks.some(b => AABB(ex, ey, 35, b.x, b.y, b.w, b.h));
        attempts++;
      } while (!valid && attempts < 100);
      
      let type = 'brown';
      
      // Level progression logic
      if (level >= 3 && i === totalEnemies - 1) type = 'grey';
      if (level >= 4 && i % 2 === 0) type = 'grey';
      if (level >= 6 && i === 0) type = 'green';
      if (level >= 10) {
        const rand = Math.random();
        if (rand < 0.3) type = 'green';
        else if (rand < 0.7) type = 'grey';
      }
      if (level >= 15) {
        const rand = Math.random();
        if (rand < 0.5) type = 'green';
        else type = 'grey'; // No brown tanks past level 15
      }

      enemies.push(new Tank(ex, ey, type, false));
    }
  }

  function AABB(x, y, r, rx, ry, rw, rh) {
    let testX = x;
    let testY = y;
    if (x < rx) testX = rx; else if (x > rx + rw) testX = rx + rw;
    if (y < ry) testY = ry; else if (y > ry + rh) testY = ry + rh;
    let distX = x - testX;
    let distY = y - testY;
    let distance = Math.sqrt((distX*distX) + (distY*distY));
    return distance <= r;
  }

  function checkBlockCollisions(entity) {
    let collided = false;
    // Edges
    if (entity.x - entity.radius < 0) { entity.x = entity.radius; collided = true; }
    if (entity.x + entity.radius > canvas.width) { entity.x = canvas.width - entity.radius; collided = true; }
    if (entity.y - entity.radius < 0) { entity.y = entity.radius; collided = true; }
    if (entity.y + entity.radius > canvas.height) { entity.y = canvas.height - entity.radius; collided = true; }

    // Blocks
    for (let b of blocks) {
      if (AABB(entity.x, entity.y, entity.radius, b.x, b.y, b.w, b.h)) {
        collided = true;
        // Simple slide resolution
        // Find closest edge
        const distL = Math.abs(entity.x - b.x);
        const distR = Math.abs(entity.x - (b.x + b.w));
        const distT = Math.abs(entity.y - b.y);
        const distB = Math.abs(entity.y - (b.y + b.h));
        const min = Math.min(distL, distR, distT, distB);
        
        if (min === distL) entity.x = b.x - entity.radius;
        else if (min === distR) entity.x = b.x + b.w + entity.radius;
        else if (min === distT) entity.y = b.y - entity.radius;
        else if (min === distB) entity.y = b.y + b.h + entity.radius;
      }
    }
    return collided;
  }

  function bulletBlockCollision(bullet) {
    let hit = false;
    // Edges
    if (bullet.x - bullet.radius < 0) { bullet.x = bullet.radius; bullet.vx *= -1; hit = true; }
    else if (bullet.x + bullet.radius > canvas.width) { bullet.x = canvas.width - bullet.radius; bullet.vx *= -1; hit = true; }
    
    if (bullet.y - bullet.radius < 0) { bullet.y = bullet.radius; bullet.vy *= -1; hit = true; }
    else if (bullet.y + bullet.radius > canvas.height) { bullet.y = canvas.height - bullet.radius; bullet.vy *= -1; hit = true; }

    if (hit) return true;

    // Blocks
    for (let b of blocks) {
      if (AABB(bullet.x, bullet.y, bullet.radius, b.x, b.y, b.w, b.h)) {
        // Reflect based on position relative to center of block
        const cx = b.x + b.w/2;
        const cy = b.y + b.h/2;
        const dx = Math.abs(bullet.x - cx) - b.w/2;
        const dy = Math.abs(bullet.y - cy) - b.h/2;
        
        if (dx > dy) bullet.vx *= -1;
        else bullet.vy *= -1;
        
        // Spawn small spark on bounce
        particles.push(new Particle(bullet.x, bullet.y, 'spark'));
        return true;
      }
    }
    return false;
  }

  function shoot(tank, tx, ty) {
    const activeBullets = bullets.filter(b => b.isPlayer === tank.isPlayer && b.active).length;
    if (activeBullets >= tank.maxBullets) return;
    if (Date.now() - tank.lastShot < tank.cooldown) return;

    tank.lastShot = Date.now();
    const angle = tank.turretAngle; // Use exact turret angle for accuracy
    const speed = tank.isPlayer ? 6 : 4;
    // Spawn bullet at end of barrel
    const bx = tank.x + Math.cos(angle) * (tank.radius + 15);
    const by = tank.y + Math.sin(angle) * (tank.radius + 15);
    
    let bounces = tank.isPlayer ? 1 : 0;
    if (tank.type === 'green') bounces = 1;

    bullets.push(new Bullet(bx, by, Math.cos(angle)*speed, Math.sin(angle)*speed, tank.isPlayer, bounces));
    
    // Recoil effect
    tank.x -= Math.cos(angle) * 3;
    tank.y -= Math.sin(angle) * 3;
    
    // Muzzle flash
    particles.push(new Particle(bx, by, 'smoke'));
  }

  function dropMine(tank) {
    const activeMines = mines.filter(m => m.isPlayer === tank.isPlayer && m.active).length;
    if (activeMines >= 2) return;
    mines.push(new Mine(tank.x, tank.y, tank.isPlayer));
  }

  function addTrack(tank) {
    if (Math.abs(tank.vx) > 0.1 || Math.abs(tank.vy) > 0.1) {
      if (frameCount % 4 === 0) {
        tracks.push({
          x: tank.x,
          y: tank.y,
          angle: tank.angle,
          life: 1.0
        });
      }
    }
  }

  function update() {
    frameCount++;
    if (isGameOver) return;

    if (player.invincible > 0) player.invincible--;

    // Player Movement
    player.vx = 0; player.vy = 0;
    if (keys.w || keys.ArrowUp) player.vy -= player.speed;
    if (keys.s || keys.ArrowDown) player.vy += player.speed;
    if (keys.a || keys.ArrowLeft) player.vx -= player.speed;
    if (keys.d || keys.ArrowRight) player.vx += player.speed;

    if (touchJoy.active) {
      player.vx = touchJoy.dx * player.speed;
      player.vy = touchJoy.dy * player.speed;
    }

    // Normalize diagonal movement
    if (player.vx !== 0 && player.vy !== 0 && !touchJoy.active) {
      player.vx *= 0.7071;
      player.vy *= 0.7071;
    }

    if (player.vx !== 0 || player.vy !== 0) {
      // Smooth tank body rotation
      const targetAngle = Math.atan2(player.vy, player.vx);
      // Determine shortest rotation path
      let diff = targetAngle - player.angle;
      while (diff < -Math.PI) diff += Math.PI*2;
      while (diff > Math.PI) diff -= Math.PI*2;
      player.angle += diff * 0.2;
      
      addTrack(player);
    }
    
    player.x += player.vx;
    player.y += player.vy;
    checkBlockCollisions(player);

    // Smooth turret rotation to mouse
    const targetTurretAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
    let tDiff = targetTurretAngle - player.turretAngle;
    while (tDiff < -Math.PI) tDiff += Math.PI*2;
    while (tDiff > Math.PI) tDiff -= Math.PI*2;
    player.turretAngle += tDiff * 0.3;

    // Enemy AI
    for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      
      if (e.startDelay > 0) {
        e.startDelay--;
        continue; // Don't move or shoot while starting
      }
      
      // Movement
      if (e.speed > 0) {
        e.moveTimer--;
        if (e.moveTimer <= 0) {
          e.targetAngle = Math.random() * Math.PI * 2;
          e.moveTimer = 60 + Math.random() * 120;
        }
        e.vx = Math.cos(e.targetAngle) * e.speed;
        e.vy = Math.sin(e.targetAngle) * e.speed;
        e.x += e.vx;
        e.y += e.vy;
        
        // Rotate body smoothly
        let eDiff = e.targetAngle - e.angle;
        while (eDiff < -Math.PI) eDiff += Math.PI*2;
        while (eDiff > Math.PI) eDiff -= Math.PI*2;
        e.angle += eDiff * 0.1;

        addTrack(e);
        
        if (checkBlockCollisions(e)) {
           e.moveTimer = 0; // Turn around
        }
      }

      // Aim at player
      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      if (distToPlayer < 500) {
        // Simple prediction
        const pTx = player.x + player.vx * 10;
        const pTy = player.y + player.vy * 10;
        
        const targetAim = Math.atan2(pTy - e.y, pTx - e.x);
        let aDiff = targetAim - e.turretAngle;
        while (aDiff < -Math.PI) aDiff += Math.PI*2;
        while (aDiff > Math.PI) aDiff -= Math.PI*2;
        e.turretAngle += aDiff * 0.05; // AI turns turret slowly
        
        // Raycast logic
        let lineOfSight = true;
        for (let b of blocks) {
          if (AABB(e.x + Math.cos(e.turretAngle)*50, e.y + Math.sin(e.turretAngle)*50, 10, b.x, b.y, b.w, b.h)) {
            lineOfSight = false;
          }
        }
        
        // If close enough and looking roughly at player
        if (lineOfSight && Math.abs(aDiff) < 0.2 && Math.random() < 0.03) {
          shoot(e, pTx, pTy);
        }
      }
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      let b = bullets[i];
      if (!b.active) { bullets.splice(i, 1); continue; }

      b.x += b.vx;
      b.y += b.vy;

      if (bulletBlockCollision(b)) {
        if (b.bouncesLeft > 0) {
          b.bouncesLeft--;
        } else {
          particles.push(new Particle(b.x, b.y, 'smoke'));
          b.active = false;
        }
      }

      // Hit Player
      if (!b.isPlayer && player.invincible <= 0 && Math.hypot(player.x - b.x, player.y - b.y) < player.radius + b.radius) {
        b.active = false;
        playerHit();
      }

      // Hit Enemies
      if (b.isPlayer) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          let e = enemies[j];
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
            b.active = false;
            spawnExplosion(e.x, e.y);
            enemies.splice(j, 1);
            score += 100 * level;
            scoreDisplay.innerText = `SCORE: ${score}`;
            checkLevelClear();
            break;
          }
        }
      }
      
      // Bullets hitting bullets
      for (let j = i - 1; j >= 0; j--) {
        let b2 = bullets[j];
        if (b2.active && b.isPlayer !== b2.isPlayer && Math.hypot(b.x - b2.x, b.y - b2.y) < b.radius + b2.radius) {
          b.active = false;
          b2.active = false;
          spawnExplosion((b.x+b2.x)/2, (b.y+b2.y)/2);
        }
      }
    }

    // Mines
    for (let i = mines.length - 1; i >= 0; i--) {
      let m = mines[i];
      m.timer--;
      
      let exploded = false;
      if (m.timer <= 0) exploded = true;
      
      // Proximity
      if (!m.isPlayer && Math.hypot(player.x - m.x, player.y - m.y) < 40) exploded = true;
      if (m.isPlayer) {
        for (let e of enemies) {
          if (Math.hypot(e.x - m.x, e.y - m.y) < 40) exploded = true;
        }
      }

      if (exploded) {
        spawnExplosion(m.x, m.y);
        mines.splice(i, 1);
        
        // Blast radius check
        if (player.invincible <= 0 && Math.hypot(player.x - m.x, player.y - m.y) < 70) playerHit();
        for (let j = enemies.length - 1; j >= 0; j--) {
          let e = enemies[j];
          if (Math.hypot(e.x - m.x, e.y - m.y) < 70) {
            spawnExplosion(e.x, e.y);
            enemies.splice(j, 1);
            score += 50 * level;
            scoreDisplay.innerText = `SCORE: ${score}`;
            checkLevelClear();
          }
        }
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    // Update Tracks
    for (let i = tracks.length - 1; i >= 0; i--) {
      tracks[i].life -= 0.002;
      if (tracks[i].life <= 0) tracks.splice(i, 1);
    }
  }

  function playerHit() {
    spawnExplosion(player.x, player.y);
    lives--;
    let lifeStr = '';
    for(let i=0; i<lives; i++) lifeStr += '♥';
    livesDisplay.innerText = lifeStr;
    
    if (lives <= 0) {
      isGameOver = true;
      // Show Game Over UI
      setTimeout(endGame, 1000);
    } else {
      // Respawn
      player.x = canvas.width/2;
      player.y = canvas.height - 50;
      player.vx = 0; player.vy = 0;
      player.invincible = 120;
    }
  }

  function checkLevelClear() {
    if (enemies.length === 0) {
      level++;
      levelDisplay.innerText = `LEVEL ${level}`;
      setTimeout(generateLevel, 1500);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Tracks
    tracks.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.fillStyle = `rgba(0,0,0,${t.life * 0.15})`;
      ctx.fillRect(-16, -18, 32, 4);
      ctx.fillRect(-16, 14, 32, 4);
      ctx.restore();
    });

    // Draw Blocks (3D Wooden toy look)
    for (let b of blocks) {
      ctx.fillStyle = '#b45309'; // Base wood
      ctx.fillRect(b.x, b.y, b.w, b.h);
      
      // Top/Left highlight bevel
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.w, b.y);
      ctx.lineTo(b.x + b.w - 5, b.y + 5);
      ctx.lineTo(b.x + 5, b.y + 5);
      ctx.lineTo(b.x + 5, b.y + b.h - 5);
      ctx.lineTo(b.x, b.y + b.h);
      ctx.fill();
      
      // Bottom/Right shadow bevel
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(b.x + b.w, b.y + b.h);
      ctx.lineTo(b.x, b.y + b.h);
      ctx.lineTo(b.x + 5, b.y + b.h - 5);
      ctx.lineTo(b.x + b.w - 5, b.y + b.h - 5);
      ctx.lineTo(b.x + b.w - 5, b.y + 5);
      ctx.lineTo(b.x + b.w, b.y);
      ctx.fill();

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(b.x + b.w, b.y + 5, 5, b.h);
      ctx.fillRect(b.x + 5, b.y + b.h, b.w, 5);
    }

    mines.forEach(m => m.draw(ctx));
    bullets.forEach(b => b.draw(ctx));
    
    // Draw Aiming Guide for Player
    if (!isGameOver) {
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      
      player.draw(ctx);
    }
    
    enemies.forEach(e => e.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    
    // Custom Crosshair
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fill();
  }

  function loop() {
    if (!isGameOver) {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    }
  }

  // Input bindings
  window.addEventListener('keydown', e => {
    if(keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if(e.code === 'Space' && !isGameOver) {
      e.preventDefault();
      dropMine(player);
    }
  });
  window.addEventListener('keyup', e => {
    if(keys.hasOwnProperty(e.key)) keys[e.key] = false;
  });
  
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
  });
  
  canvas.addEventListener('mousedown', e => {
    if (!isGameOver) shoot(player, mouseX, mouseY);
  });

  // Mobile Touch Controls
  const joyBase = document.getElementById('joy-base');
  const joyStick = document.getElementById('joy-stick');
  const btnMine = document.getElementById('btn-mine');
  let joyRect;

  canvas.addEventListener('touchstart', (e) => {
    if (!isMobile) {
      isMobile = true;
      mobileControls.style.display = 'block';
    }
    if (!isGameOver) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        mouseX = (touch.clientX - rect.left) * scaleX;
        mouseY = (touch.clientY - rect.top) * scaleY;
        shoot(player, mouseX, mouseY);
      }
    }
  }, {passive: false});

  canvas.addEventListener('touchmove', (e) => {
    if (isMobile) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      mouseX = (e.changedTouches[i].clientX - rect.left) * (canvas.width / rect.width);
      mouseY = (e.changedTouches[i].clientY - rect.top) * (canvas.height / rect.height);
    }
  }, {passive: false});

  if (joyBase) {
    function updateJoy(touch) {
      let nx = touch.clientX - joyRect.left - 60;
      let ny = touch.clientY - joyRect.top - 60;
      const dist = Math.hypot(nx, ny);
      if (dist > 40) {
        nx = (nx / dist) * 40;
        ny = (ny / dist) * 40;
      }
      joyStick.style.transform = `translate(${nx}px, ${ny}px)`;
      touchJoy.dx = nx / 40;
      touchJoy.dy = ny / 40;
    }

    joyBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      touchJoy.active = true;
      touchJoy.touchId = touch.identifier;
      joyRect = joyBase.getBoundingClientRect();
      updateJoy(touch);
    }, {passive: false});

    joyBase.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      for (let i=0; i<e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchJoy.touchId) {
          updateJoy(e.changedTouches[i]);
        }
      }
    }, {passive: false});

    const endJoy = (e) => {
      for (let i=0; i<e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchJoy.touchId) {
          touchJoy.active = false;
          touchJoy.touchId = null;
          touchJoy.dx = 0; touchJoy.dy = 0;
          joyStick.style.transform = `translate(0px, 0px)`;
        }
      }
    };
    joyBase.addEventListener('touchend', endJoy);
    joyBase.addEventListener('touchcancel', endJoy);
  }

  if (btnMine) {
    btnMine.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isGameOver) dropMine(player);
    }, {passive: false});
  }

  // End game logic
  function endGame() {
    canvas.style.cursor = 'default';
    canvas.style.opacity = '0.5';
    
    const overDiv = document.createElement('div');
    overDiv.style.position = 'absolute';
    overDiv.style.top = '50%';
    overDiv.style.left = '50%';
    overDiv.style.transform = 'translate(-50%, -50%)';
    overDiv.style.background = '#1e293b';
    overDiv.style.padding = '40px';
    overDiv.style.borderRadius = '16px';
    overDiv.style.color = '#fff';
    overDiv.style.border = '2px solid #334155';
    overDiv.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    
    overDiv.innerHTML = `
      <h2 style="font-size:2rem; font-weight:900; color:#ef4444; margin-bottom:10px;">GAME OVER</h2>
      <p style="font-size:1.2rem; color:#cbd5e1; margin-bottom: 20px;">You reached Level ${level} with ${score} points!</p>
      <button id="tank-restart" class="btn btn--primary" style="margin-right:10px;">Play Again</button>
      <button id="tank-quit" class="btn btn--outline">Exit</button>
    `;
    wrapper.appendChild(overDiv);
    
    document.getElementById('tank-restart').addEventListener('click', () => {
      wrapper.removeChild(overDiv);
      canvas.style.cursor = 'none';
      canvas.style.opacity = '1';
      score = 0;
      level = 1;
      lives = 3;
      scoreDisplay.innerText = 'SCORE: 0';
      livesDisplay.innerText = '♥♥♥';
      levelDisplay.innerText = 'LEVEL 1';
      isGameOver = false;
      generateLevel();
      loop();
    });
    
    document.getElementById('tank-quit').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    
    if (window.saveScore) {
      window.saveScore("Toy Tanks", score);
    }
  }

  // Start
  generateLevel();
  loop();
}
