export function initTanks(container) {
  // Setup Canvas (Taller and responsive arcade ratio)
  const canvas = document.createElement('canvas');
  canvas.width = 550;
  canvas.height = 900; // Taller play area
  canvas.style.width = '100%';
  canvas.style.maxWidth = '550px';
  canvas.style.height = 'auto'; // Let height scale responsively
  canvas.style.maxHeight = 'calc(100vh - 160px)'; // Avoid cutting off screen
  canvas.style.aspectRatio = '550 / 900'; // Maintain correct aspect ratio
  canvas.style.objectFit = 'contain';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = '#e7e5e4'; // Corkboard/paper background
  canvas.style.border = '8px solid #78350f'; // Solid wooden arcade frame
  canvas.style.borderRadius = '8px 8px 8px 8px'; // Base rounded border
  canvas.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.5)';
  canvas.style.cursor = 'none'; // Hide default cursor, draw custom crosshair
  
  // Wrapper for UI (Flex container for vertical DOM flow stacking)
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.textAlign = 'center';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '550px';
  wrapper.style.margin = '0 auto';
  wrapper.style.maxHeight = '100vh';
  wrapper.style.justifyContent = 'center';
  
  // ── Unified HUD bar (score + level + lives in one clean pill)
  const hudBar = document.createElement('div');
  hudBar.style.cssText = [
    'position:absolute',
    'top:8px',
    'left:50%',
    'transform:translateX(-50%)',
    'display:flex',
    'align-items:center',
    'gap:0',
    'background:rgba(0,0,0,0.42)',
    'backdrop-filter:blur(4px)',
    'border-radius:50px',
    'border:1.5px solid rgba(255,255,255,0.12)',
    'font-family:Outfit,monospace',
    'font-weight:800',
    'font-size:13px',
    'overflow:hidden',
    'white-space:nowrap',
    'pointer-events:none',
    'z-index:10'
  ].join(';');

  const hudLives = document.createElement('div');
  hudLives.id = 'hud-lives';
  hudLives.style.cssText = 'padding:5px 12px; color:#f87171; border-right:1px solid rgba(255,255,255,0.1);';
  hudLives.innerText = '♥ ♥ ♥';

  const hudLevel = document.createElement('div');
  hudLevel.id = 'hud-level';
  hudLevel.style.cssText = 'padding:5px 14px; color:#fcd34d; border-right:1px solid rgba(255,255,255,0.1); letter-spacing:0.5px;';
  hudLevel.innerText = 'LVL 1';

  const hudScore = document.createElement('div');
  hudScore.id = 'hud-score';
  hudScore.style.cssText = 'padding:5px 12px; color:#fff;';
  hudScore.innerText = '0 pts';

  hudBar.appendChild(hudLives);
  hudBar.appendChild(hudLevel);
  hudBar.appendChild(hudScore);

  // Keep legacy references for code that updates them
  const scoreDisplay = hudScore;
  const livesDisplay = hudLives;
  const levelDisplay = hudLevel;

  wrapper.appendChild(canvas);
  wrapper.appendChild(hudBar);

 
  // Mobile Controls Overlay (Dedicated panel below the canvas, blending into the wooden frame!)
  const mobileControls = document.createElement('div');
  mobileControls.style.display = 'none'; // hidden until touch trigger
  mobileControls.style.width = '100%';
  mobileControls.style.maxWidth = '550px';
  mobileControls.style.height = '120px'; // Shorter height to fit viewports
  mobileControls.style.background = 'linear-gradient(135deg, #1e1e2e, #11111b)';
  mobileControls.style.border = '8px solid #78350f';
  mobileControls.style.borderTop = 'none'; // Blends seamlessly under the canvas frame
  mobileControls.style.borderRadius = '0 0 12px 12px';
  mobileControls.style.boxSizing = 'border-box';
  mobileControls.style.alignItems = 'center';
  mobileControls.style.justifyContent = 'space-between';
  mobileControls.style.pointerEvents = 'auto';
  mobileControls.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
  mobileControls.style.marginTop = '0px'; // Blend directly under canvas
  
  mobileControls.innerHTML = `
    <style>
      .tanks-mobile-btn {
        touch-action: none;
        border: 3px solid #ffffff;
        color: #ffffff;
        font-weight: 900;
        font-family: 'Outfit', sans-serif;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.1s;
      }
      .tanks-mobile-btn:active {
        transform: scale(0.9) !important;
      }
    </style>
    <!-- Virtual Joystick Area (Left Column) -->
    <div id="joy-container" style="flex:1; display:flex; align-items:center; justify-content:flex-start; padding-left:30px; height:100%;">
      <div id="joy-base" style="position:relative; width:90px; height:90px; background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.15); border-radius:50%; touch-action:none; box-shadow:inset 0 0 10px rgba(0,0,0,0.5);">
        <div id="joy-stick" style="position:absolute; top:27px; left:27px; width:36px; height:36px; background:#38BDF8; border:2px solid #ffffff; border-radius:50%; box-shadow:0 4px 8px rgba(0,0,0,0.4); transition: transform 0.05s ease-out;"></div>
      </div>
    </div>
    
    <!-- Action Area (Right Column) -->
    <div id="action-container" style="flex:1.8; display:flex; align-items:center; justify-content:flex-end; gap:16px; padding-right:25px; height:100%;">
      <button id="btn-mine" class="tanks-mobile-btn" style="width:65px; height:65px; border-radius:50%; background:linear-gradient(135deg, #F59E0B, #D97706); border:3px solid #ffffff; font-size:0.8rem; letter-spacing:0.5px; box-shadow: 0 6px 15px rgba(245,158,11,0.4); display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0;">
        <span>MINE</span>
        <span style="font-size:1.1rem; line-height:1;">💣</span>
      </button>
      <button id="btn-shoot" class="tanks-mobile-btn" style="width:76px; height:76px; border-radius:50%; background:linear-gradient(135deg, #ef4444, #b91c1c); border:3.5px solid #ffffff; font-size:0.9rem; font-weight:900; letter-spacing:0.5px; box-shadow: 0 6px 20px rgba(239,68,68,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; flex-shrink:0;">
        <span>FIRE</span>
        <span style="font-size:1.3rem; line-height:1;">🚀</span>
      </button>
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
  let screenShake = 0; // Screen shake intensity, fades over time
  let lockedTargetIndex = 0; // Which enemy the crosshair is locked onto
  let autoTarget = null; // Module-scope so draw() can reference it for crosshair color
  
  const keys = { w:false, a:false, s:false, d:false, ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  
  // Touch control variables
  let touchJoy = { active: false, dx: 0, dy: 0, touchId: null };
  let isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
  if (isMobile) {
    mobileControls.style.display = 'flex';
    canvas.style.borderRadius = '8px 8px 0 0';
  }

  // Entities
  let player;
  let enemies = [];
  let bullets = [];
  let mines = [];
  let particles = [];
  let blocks = [];
  let tracks = []; // Tank tread marks
  let powerups = []; // Floating arcade powerup items

  class PowerUp {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type; // 'rapid', 'shield', 'coin', 'trishot', 'emp'
      this.radius = 14;
      this.life = 600; // 10 seconds to collect
    }
    
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      
      const colors = {
        rapid: '#38bdf8', // Cyan
        shield: '#a78bfa', // Purple
        coin: '#fbbf24', // Gold
        trishot: '#10b981', // Green
        emp: '#06b6d4' // Cyan electric
      };
      
      const emojis = {
        rapid: '⚡',
        shield: '🛡️',
        coin: '🪙',
        trishot: '✨',
        emp: '❄️'
      };
      
      const color = colors[this.type] || '#fff';
      
      // Floating neon aura pulse
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + Math.sin(frameCount * 0.1) * 3, 0, Math.PI * 2);
      ctx.fillStyle = color + '33'; // transparent aura
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fill();
      
      ctx.font = '14px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojis[this.type], 0, 1);
      
      ctx.restore();
    }
  }

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
      this.rapidTimer = 0; // Rapid fire powerup frames
      this.shieldTimer = 0; // Invincible bubble shield frames
      this.trishotTimer = 0; // Spread/Trishot powerup frames
      this.frozenTimer = 0; // Stunned/EMP frames
      this.flashTimer = 0; // Hit impact white-flash frames
      this.hp = 1;
      this.maxHp = 1;
      
      // Spawn protection
      this.invincible = isPlayer ? 120 : 0; // 2 seconds at 60fps
      this.startDelay = isPlayer ? 0 : 120; // Enemies wait 2s before acting
      
      // Types: player (blue), brown (stationary), grey (moving), green (fast, bounces), boss (giant purple)
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
      } else if (type === 'orange') {
        this.color = '#ea580c'; // Orange (Kamikaze)
        this.speed = 2.4; // Chases player very fast!
        this.cooldown = 999999; // Never fires bullets
        this.maxBullets = 0;
      } else if (type === 'red') {
        this.color = '#dc2626'; // Red (Sniper)
        this.speed = 0.6; // Very slow sniper
        this.cooldown = 1800; // Slow deliberate shots
        this.maxBullets = 1;
      } else if (type === 'boss') {
        this.color = '#7c3aed'; // Deep purple Boss
        this.speed = 0.8;
        this.cooldown = 1400;
        this.maxBullets = 3;
        this.radius = 28;
        this.hp = 5;
        this.maxHp = 5;
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

      // Glowing Force Shield Bubble (if active on player)
      if (this.isPlayer && this.shieldTimer > 0) {
        ctx.save();
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        // Dynamic pulsating bubble radius
        ctx.arc(0, 0, this.radius + 12 + Math.sin(frameCount * 0.15) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#a78bfa'; // Purple glowing forcefield
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        
        ctx.fillStyle = 'rgba(167, 139, 250, 0.18)';
        ctx.fill();
        
        // Inner spinning neon dots for premium look
        ctx.save();
        ctx.rotate(frameCount * 0.04);
        ctx.fillStyle = '#818cf8';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.arc(Math.cos(a) * (this.radius + 12), Math.sin(a) * (this.radius + 12), 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
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
      
      const angle = Math.atan2(this.vy, this.vx);
      ctx.rotate(angle);
      
      // Shadow (drawn slightly offset based on 3D height)
      ctx.save();
      ctx.translate(2, 3); // shadow offset
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(2, -3);
      ctx.quadraticCurveTo(7, 0, 7, 0); // Pointy tip at the front
      ctx.quadraticCurveTo(7, 0, 2, 3);
      ctx.lineTo(-6, 3);
      ctx.quadraticCurveTo(-8, 0, -6, -3); // Rounded back
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Sleek pointed shell/bullet
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(2, -3);
      ctx.quadraticCurveTo(7, 0, 7, 0); // Pointy tip
      ctx.quadraticCurveTo(7, 0, 2, 3);
      ctx.lineTo(-6, 3);
      ctx.quadraticCurveTo(-8, 0, -6, -3); // Rounded back
      ctx.closePath();
      
      // Fill color: player is gold brass shell, Sniper is orange, standard enemy is dark steel gray
      ctx.fillStyle = this.isPlayer ? '#fbbf24' : (this.speed > 7 ? '#f97316' : '#64748b');
      ctx.fill();
      
      // Tip overlay for detail
      ctx.beginPath();
      ctx.moveTo(1, -3);
      ctx.quadraticCurveTo(7, 0, 7, 0);
      ctx.quadraticCurveTo(7, 0, 1, 3);
      ctx.closePath();
      ctx.fillStyle = this.isPlayer ? '#ea580c' : (this.speed > 7 ? '#dc2626' : '#334155'); // Copper/Red tip
      ctx.fill();

      // Border outline
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(2, -3);
      ctx.quadraticCurveTo(7, 0, 7, 0);
      ctx.quadraticCurveTo(7, 0, 2, 3);
      ctx.lineTo(-6, 3);
      ctx.quadraticCurveTo(-8, 0, -6, -3);
      ctx.closePath();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.2;
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

  function spawnExplosion(x, y, big = false) {
    // Screen shake (bigger for bosses!)
    screenShake = big ? 22 : 10;

    // Smoke and sparks (more for big explosions!)
    const count = big ? 30 : 15;
    for(let i=0; i<count; i++) {
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
    powerups = [];
    
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

    // Spawn enemies (with Boss every 5 levels!)
    const isBossLevel = level % 5 === 0;
    let totalEnemies = 1;
    if (level === 2) totalEnemies = 2;
    if (level === 3) totalEnemies = 3;
    if (level === 4) totalEnemies = 3;
    if (level >= 5) totalEnemies = Math.min(4 + Math.floor((level - 5) / 2), 10);

    // Speed scaling — enemies get faster every 5 levels
    const speedBonus = Math.floor(level / 5) * 0.2;

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
      
      // Boss spawns as the first enemy on every 5th level
      if (isBossLevel && i === 0) {
        type = 'boss';
      } else if (level === 1) {
        type = 'brown'; // Tutorial: stationary
      } else if (level === 2) {
        type = Math.random() < 0.5 ? 'brown' : 'grey';
      } else if (level === 3) {
        const rand = Math.random();
        if (rand < 0.4) type = 'grey';
        else if (rand < 0.7) type = 'orange'; // Introduce Kamikaze at Lvl 3!
        else type = 'brown';
      } else if (level === 4) {
        const rand = Math.random();
        if (rand < 0.4) type = 'grey';
        else if (rand < 0.7) type = 'green'; // Introduce Fast Green at Lvl 4!
        else if (rand < 0.9) type = 'orange';
        else type = 'brown';
      } else if (level >= 5) {
        // Red Snipers appear at Level 5!
        const rand = Math.random();
        if (rand < 0.2) type = 'red'; // 20% Sniper
        else if (rand < 0.4) type = 'orange'; // 20% Kamikaze
        else if (rand < 0.7) type = 'green'; // 30% Green
        else if (rand < 0.9) type = 'grey'; // 20% Grey
        else type = 'brown'; // 10% Brown
      }
      
      if (level >= 10) {
        // Higher stakes! Less brown tanks, more snipers and green tanks
        if (!isBossLevel || i > 0) {
          const rand = Math.random();
          if (rand < 0.25) type = 'red';
          else if (rand < 0.5) type = 'orange';
          else if (rand < 0.75) type = 'green';
          else type = 'grey';
        }
      }
      
      if (level >= 15) {
        // Elite tier! Only Sniper, Kamikaze, and fast Green tanks
        if (!isBossLevel || i > 0) {
          const rand = Math.random();
          if (rand < 0.35) type = 'red';
          else if (rand < 0.7) type = 'orange';
          else type = 'green';
        }
      }

      const tank = new Tank(ex, ey, type, false);
      // Apply speed bonus for non-boss non-stationary enemies
      if (type !== 'boss' && type !== 'brown') tank.speed += speedBonus;
      enemies.push(tank);
    }

    // Reset locked target index for new level
    lockedTargetIndex = 0;
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

  function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Raycast: check 10 points along the path between player and target
    for (let t = 0.05; t < 0.95; t += 0.1) {
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      if (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) {
        return true;
      }
    }
    return false;
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
      const closestX = Math.max(b.x, Math.min(entity.x, b.x + b.w));
      const closestY = Math.max(b.y, Math.min(entity.y, b.y + b.h));
      const distX = entity.x - closestX;
      const distY = entity.y - closestY;
      const distance = Math.hypot(distX, distY);
      
      if (distance < entity.radius) {
        collided = true;
        if (distance > 0.001) {
          // Smoothly push out along normal vector to allow perfect sliding
          const overlap = entity.radius - distance;
          entity.x += (distX / distance) * overlap;
          entity.y += (distY / distance) * overlap;
        } else {
          // If perfectly centered, resolve by pushing to the closest side
          const distL = entity.x - b.x;
          const distR = (b.x + b.w) - entity.x;
          const distT = entity.y - b.y;
          const distB = (b.y + b.h) - entity.y;
          const min = Math.min(distL, distR, distT, distB);
          if (min === distL) entity.x = b.x - entity.radius;
          else if (min === distR) entity.x = b.x + b.w + entity.radius;
          else if (min === distT) entity.y = b.y - entity.radius;
          else if (min === distB) entity.y = b.y + b.h + entity.radius;
        }
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
    const maxB = (tank.isPlayer && tank.rapidTimer > 0) ? 8 : tank.maxBullets;
    if (activeBullets >= maxB) return;
    
    const activeCooldown = (tank.isPlayer && tank.rapidTimer > 0) ? 120 : tank.cooldown;
    if (Date.now() - tank.lastShot < activeCooldown) return;

    tank.lastShot = Date.now();
    
    // Calculate the angle directly to target (tx, ty) for perfect player accuracy!
    let angle = tank.turretAngle;
    if (tank.isPlayer) {
      angle = Math.atan2(ty - tank.y, tx - tank.x);
      // Snap turret to the clicked angle instantly so the barrel matches the shot!
      tank.turretAngle = angle;
    }
    
    const speed = tank.isPlayer ? 6 : (tank.type === 'red' ? 9 : (tank.type === 'boss' ? 5 : 4));
    // Spawn bullet at end of barrel
    const bx = tank.x + Math.cos(angle) * (tank.radius + 15);
    const by = tank.y + Math.sin(angle) * (tank.radius + 15);
    
    let bounces = tank.isPlayer ? 1 : 0;
    if (tank.type === 'green') bounces = 1;

    bullets.push(new Bullet(bx, by, Math.cos(angle)*speed, Math.sin(angle)*speed, tank.isPlayer, bounces));
    
    // Trishot! Spread 2 extra bullets at ±18 degrees
    if (tank.isPlayer && tank.trishotTimer > 0) {
      const spread = 0.31; // ~18 degrees
      for (const offset of [-spread, spread]) {
        const a2 = angle + offset;
        const bx2 = tank.x + Math.cos(a2) * (tank.radius + 15);
        const by2 = tank.y + Math.sin(a2) * (tank.radius + 15);
        bullets.push(new Bullet(bx2, by2, Math.cos(a2)*speed, Math.sin(a2)*speed, true, bounces));
      }
    }
    
    // Recoil effect
    tank.x -= Math.cos(angle) * 3;
    tank.y -= Math.sin(angle) * 3;
    
    // Muzzle flash
    particles.push(new Particle(bx, by, 'smoke'));

    // After firing, cycle the locked target to the next enemy!
    if (tank.isPlayer && enemies.length > 1) {
      lockedTargetIndex = (lockedTargetIndex + 1) % enemies.length;
    }
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

    let targetTurretAngle;
    autoTarget = null;

    if (enemies.length > 0) {
      // Auto-aim: try to lock onto the cycled target index first
      // Clamp index in case enemies were removed
      if (lockedTargetIndex >= enemies.length) lockedTargetIndex = 0;
      const preferredTarget = enemies[lockedTargetIndex];

      // Check if preferred target has line-of-sight
      let preferredLoS = true;
      for (let b of blocks) {
        if (lineIntersectsRect(player.x, player.y, preferredTarget.x, preferredTarget.y, b.x, b.y, b.w, b.h)) {
          preferredLoS = false;
          break;
        }
      }

      if (preferredLoS) {
        autoTarget = preferredTarget;
      } else {
        // Fall back to closest in line-of-sight
        let minDist = Infinity;
        for (let e of enemies) {
          const dist = Math.hypot(e.x - player.x, e.y - player.y);
          if (dist < minDist) {
            let lineOfSight = true;
            for (let b of blocks) {
              if (lineIntersectsRect(player.x, player.y, e.x, e.y, b.x, b.y, b.w, b.h)) {
                lineOfSight = false;
                break;
              }
            }
            if (lineOfSight) {
              minDist = dist;
              autoTarget = e;
            }
          }
        }
      }
    }

    if (autoTarget) {
      // Aim turret directly at target smoothly, and automatically snap the crosshair!
      mouseX = autoTarget.x;
      mouseY = autoTarget.y;
      targetTurretAngle = Math.atan2(autoTarget.y - player.y, autoTarget.x - player.x);
    } else {
      // Manual aim
      targetTurretAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
    }

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

      // EMP freeze — skip movement and shooting if frozen!
      if (e.frozenTimer > 0) {
        e.frozenTimer--;
        // Draw freeze crackle effect is handled in draw()
        continue;
      }

      // Hit flash timer
      if (e.flashTimer > 0) e.flashTimer--;
      
      // Movement
      if (e.speed > 0) {
        if (e.type === 'orange') {
          // Kamikaze chases the player directly
          e.targetAngle = Math.atan2(player.y - e.y, player.x - e.x);
          e.vx = Math.cos(e.targetAngle) * e.speed;
          e.vy = Math.sin(e.targetAngle) * e.speed;
          e.x += e.vx;
          e.y += e.vy;
          
          let eDiff = e.targetAngle - e.angle;
          while (eDiff < -Math.PI) eDiff += Math.PI*2;
          while (eDiff > Math.PI) eDiff -= Math.PI*2;
          e.angle += eDiff * 0.1;

          addTrack(e);
          checkBlockCollisions(e);

          // Explode on player contact!
          if (player.invincible <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius) {
            spawnExplosion(e.x, e.y);
            enemies.splice(i, 1);
            playerHit();
            continue;
          }
        } else {
          // Standard wandering AI movement
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

            // Boss tanks take multi-hit damage
            e.hp--;
            e.flashTimer = 8; // Hit flash!
            if (e.hp > 0) break; // Boss survives!

            spawnExplosion(e.x, e.y, e.type === 'boss');
            
            // Close blast damage from Kamikaze tanks
            if (e.type === 'orange' && player.invincible <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < 75) {
              playerHit();
            }

            // Roll 30% chance to drop powerup! (Boss always drops one)
            const dropChance = e.type === 'boss' ? 1.0 : 0.3;
            if (Math.random() < dropChance) {
              const types = ['rapid', 'shield', 'coin', 'trishot', 'emp'];
              const randType = types[Math.floor(Math.random() * types.length)];
              powerups.push(new PowerUp(e.x, e.y, randType));
            }

            // If locked target is destroyed, reset to next
            if (enemies[j] === enemies[lockedTargetIndex]) {
              lockedTargetIndex = 0;
            }

            enemies.splice(j, 1);
            score += (e.type === 'boss' ? 500 : 100) * level;
            hudScore.innerText = `${score} pts`;
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
            hudScore.innerText = `${score} pts`;
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

    // Update Player Powerup Timers
    if (player.rapidTimer > 0) player.rapidTimer--;
    if (player.shieldTimer > 0) player.shieldTimer--;
    if (player.trishotTimer > 0) player.trishotTimer--;

    // Apply screen shake
    if (screenShake > 0) {
      const s = screenShake;
      canvas.style.transform = `translate(${(Math.random()-0.5)*s}px, ${(Math.random()-0.5)*s}px)`;
      screenShake = Math.max(0, screenShake - 1.5);
      if (screenShake <= 0) canvas.style.transform = 'translate(0,0)';
    }

    // Update Floating PowerUps
    for (let i = powerups.length - 1; i >= 0; i--) {
      let p = powerups[i];
      p.life--;
      if (p.life <= 0) {
        powerups.splice(i, 1);
        continue;
      }
      
      // Collision with player
      if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.radius) {
        if (p.type === 'rapid') {
          player.rapidTimer = 300; // 5 seconds of rapid double speed!
          // Spawn cyan sparks
          for (let s = 0; s < 12; s++) {
            const part = new Particle(p.x, p.y, 'spark');
            part.color = '#38bdf8';
            particles.push(part);
          }
        } else if (p.type === 'shield') {
          player.shieldTimer = 300; // 5 seconds of invincibility shield!
          // Spawn purple sparks
          for (let s = 0; s < 12; s++) {
            const part = new Particle(p.x, p.y, 'spark');
            part.color = '#a78bfa';
            particles.push(part);
          }
        } else if (p.type === 'coin') {
          score += 250;
          hudScore.innerText = `${score} pts`;
          // Spawn golden sparks
          for (let s = 0; s < 12; s++) {
            const part = new Particle(p.x, p.y, 'spark');
            part.color = '#fbbf24';
            particles.push(part);
          }
        } else if (p.type === 'trishot') {
          player.trishotTimer = 360; // 6 seconds of triple spread fire!
          for (let s = 0; s < 12; s++) {
            const part = new Particle(p.x, p.y, 'spark');
            part.color = '#10b981';
            particles.push(part);
          }
        } else if (p.type === 'emp') {
          // EMP: freeze ALL enemies for 4 seconds!
          for (let e of enemies) {
            e.frozenTimer = 240;
          }
          // Big blue flash
          for (let s = 0; s < 25; s++) {
            const part = new Particle(p.x, p.y, 'spark');
            part.color = '#06b6d4';
            particles.push(part);
          }
          screenShake = 12;
        }
        
        powerups.splice(i, 1);
      }
    }
  }

  function playerHit() {
    // If shield is active, block the hit completely!
    if (player && player.shieldTimer > 0) {
      // Spawn beautiful shield deflection particles!
      for (let s = 0; s < 15; s++) {
        const part = new Particle(player.x, player.y, 'spark');
        part.color = '#c084fc'; // neon purple sparks
        particles.push(part);
      }
      return;
    }

    spawnExplosion(player.x, player.y);
    screenShake = 18; // Extra shake on player death
    lives--;
    let lifeStr = '';
    for(let i=0; i<lives; i++) lifeStr += '♥';
    for(let i=lives; i<3; i++) lifeStr += '○';
    hudLives.innerText = lifeStr.split('').join(' ');
    hudLives.style.color = lives <= 1 ? '#ef4444' : lives === 2 ? '#fb923c' : '#f87171';
    
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
      hudLevel.innerText = `LVL ${level}`;
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
      // Outer faint glowing path
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Sharp dashed laser guide
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.setLineDash([8, 4]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      
      player.draw(ctx);
    }
    
    // Draw active powerups
    powerups.forEach(p => p.draw(ctx));

    // Draw Sniper targeting lasers
    enemies.forEach(e => {
      if (e.type === 'red' && e.startDelay <= 0 && !isGameOver) {
        let hasLoS = true;
        for (let b of blocks) {
          if (lineIntersectsRect(e.x, e.y, player.x, player.y, b.x, b.y, b.w, b.h)) {
            hasLoS = false;
            break;
          }
        }
        if (hasLoS) {
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(player.x, player.y);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)'; // Faint red targeting line
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });

    // Draw enemies with freeze and hit-flash effects
    enemies.forEach(e => {
      // EMP freeze: draw icy overlay
      if (e.frozenTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.45 + Math.sin(frameCount * 0.3) * 0.15;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      // Hit flash: draw white overlay
      if (e.flashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      e.draw(ctx);

      // HP bar for boss tanks
      if (e.type === 'boss' && e.maxHp > 1) {
        const barW = e.radius * 3;
        const barH = 7;
        const barX = e.x - barW / 2;
        const barY = e.y - e.radius - 16;
        const pct = e.hp / e.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = pct > 0.5 ? '#22c55e' : (pct > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(barX, barY, barW * pct, barH);
      }
    });
    particles.forEach(p => p.draw(ctx));
    
    // Premium animated targeting reticle crosshair
    if (!isGameOver && !isMobile) {
      const r1 = 12;
      const r2 = 20;
      const gap = 6;
      const spin = frameCount * 0.04;
      ctx.save();
      ctx.translate(mouseX, mouseY);

      // Outer spinning corner brackets
      ctx.strokeStyle = autoTarget ? '#ef4444' : 'rgba(239,68,68,0.45)';
      ctx.lineWidth = 2;
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate(spin + q * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(gap, r1);
        ctx.lineTo(gap, r2);
        ctx.moveTo(r1, gap);
        ctx.lineTo(r2, gap);
        ctx.stroke();
        ctx.restore();
      }

      // Center dot pulsing
      const pulse = 1.5 + Math.sin(frameCount * 0.18) * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.fillStyle = autoTarget ? '#ef4444' : 'rgba(239,68,68,0.6)';
      ctx.fill();
      ctx.restore();
    } else if (!isGameOver) {
      // Mobile: simpler small crosshair dot
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function loop() {
    if (!isGameOver) {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    }
  }

  // Input bindings
  const handleKeyDown = (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.code === 'Space' && !isGameOver) {
      e.preventDefault();
      dropMine(player);
    }
  };

  const handleKeyUp = (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
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
  let joyRect;

  const enableMobileUI = () => {
    if (!isMobile) {
      isMobile = true;
      mobileControls.style.display = 'flex'; // Use flex layout for bottom bar console
      canvas.style.borderRadius = '8px 8px 0 0'; // Round top corners of canvas to match arcade look
    }
  };
  window.addEventListener('touchstart', enableMobileUI, {passive: true});

  // Cleanup observer when leaving the room
  const observer = new MutationObserver((mutations) => {
    if (!document.contains(container)) {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', enableMobileUI);
      if (animationId) cancelAnimationFrame(animationId);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Tap-to-fire on the battlefield canvas absolutely
  canvas.addEventListener('touchstart', (e) => {
    enableMobileUI();
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
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      mouseX = (touch.clientX - rect.left) * scaleX;
      mouseY = (touch.clientY - rect.top) * scaleY;
    }
  }, {passive: false});

  // Joystick & button handlers
  const joyBase = document.getElementById('joy-base');
  const joyStick = document.getElementById('joy-stick');
  const btnMine = document.getElementById('btn-mine');

  if (joyBase && joyStick) {
    function updateJoy(touch) {
      // 45 is exactly half of 90 (the new smaller width)
      let nx = touch.clientX - joyRect.left - 45;
      let ny = touch.clientY - joyRect.top - 45;
      const dist = Math.hypot(nx, ny);
      
      // 30 is the new smaller maximum stick movement distance
      if (dist > 30) {
        nx = (nx / dist) * 30;
        ny = (ny / dist) * 30;
      }
      joyStick.style.transform = `translate(${nx}px, ${ny}px)`;
      touchJoy.dx = nx / 30;
      touchJoy.dy = ny / 30;
    }

    joyBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enableMobileUI();
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

  window.autoAimEnabled = true; // Auto-aim is universally active by default

  if (btnMine) {
    btnMine.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enableMobileUI();
      if (!isGameOver) dropMine(player);
    }, {passive: false});
  }

  const btnShoot = document.getElementById('btn-shoot');
  if (btnShoot) {
    btnShoot.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enableMobileUI();
      if (!isGameOver) {
        // Fire at locked auto-aim target; if no target, fire along turret angle
        let tx, ty;
        if (enemies.length > 0 && lockedTargetIndex < enemies.length) {
          tx = enemies[lockedTargetIndex].x;
          ty = enemies[lockedTargetIndex].y;
        } else {
          tx = player.x + Math.cos(player.turretAngle) * 400;
          ty = player.y + Math.sin(player.turretAngle) * 400;
        }
        shoot(player, tx, ty);
        // Cycle to next locked target after firing!
        if (enemies.length > 1) lockedTargetIndex = (lockedTargetIndex + 1) % enemies.length;
      }
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
      hudLives.innerText = '♥ ♥ ♥';
      hudLives.style.color = '#f87171';
      score = 0;
      hudScore.innerText = '0 pts';
      level = 1;
      hudLevel.innerText = 'LVL 1';
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
