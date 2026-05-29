import { auth } from '../firebase.js';
import { generateScoreSignature } from '../security.js';

export function init(container) {
  container.innerHTML = `
    <style>
      .cg-wrapper {
        display: flex; flex-direction: column; align-items: center;
        width: 100%; max-width: 500px; margin: 0 auto;
        font-family: 'Outfit', sans-serif;
        color: #fff; padding: 10px 10px 30px;
      }
      .cg-header {
        display: flex; justify-content: space-between; width: 100%;
        margin-bottom: 15px; font-weight: 800; font-size: 1.1rem;
      }
      .cg-score-box { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; }
      
      .cg-question-card {
        background: linear-gradient(135deg, #2a2a3e, #1a1a2e);
        width: 100%; padding: 25px 20px; border-radius: 24px;
        text-align: center; margin-bottom: 25px;
        border: 2px solid rgba(255,255,255,0.05);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      .cg-target-hint { color: #aaa; font-size: 0.95rem; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
      .cg-target-name { font-size: 1.8rem; font-weight: 900; margin-bottom: 15px; line-height: 1.2; }
      
      .cg-target-img-container {
        width: 240px; height: 240px; margin: 0 auto 20px;
        display: flex; align-items: center; justify-content: center;
        background: #fff; border-radius: 20px; padding: 15px;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
      }
      .cg-target-img {
        max-width: 100%; max-height: 100%; object-fit: contain;
        filter: grayscale(100%) contrast(1.2);
        transition: filter 0.5s ease;
      }

      .cg-color-preview {
        width: 100%; height: 60px; border-radius: 12px;
        margin: 0 auto; background: #ffffff;
        border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-family: monospace; font-size: 1.2rem; font-weight: bold; color: #000; text-shadow: 0 0 5px #fff;
      }

      .cg-sliders { width: 100%; display: flex; flex-direction: column; gap: 20px; margin-bottom: 30px; }
      .cg-slider-group { display: flex; flex-direction: column; }
      .cg-slider-label { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 700; font-size: 0.9rem; color: #ccc; }
      
      input[type=range] { -webkit-appearance: none; width: 100%; height: 12px; border-radius: 10px; outline: none; }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%;
        background: #fff; cursor: pointer; border: 3px solid #333; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      }
      #slider-h { background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%); }

      .cg-btn {
        background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: white; border: none; padding: 18px 40px;
        border-radius: 50px; font-size: 1.3rem; font-weight: 900; cursor: pointer; width: 100%; box-shadow: 0 8px 25px rgba(255,107,107,0.4);
      }
      .cg-btn:active { transform: scale(0.96); }

      /* Result Overlay */
      .cg-overlay {
        position: fixed; inset: 0; background: rgba(10,10,20,0.95);
        display: none; flex-direction: column; align-items: center; justify-content: center;
        z-index: 100; padding: 20px; text-align: center;
      }
      .cg-overlay-img { width: 180px; height: 180px; object-fit: contain; background: #fff; border-radius: 20px; padding: 15px; margin-bottom: 20px; box-shadow: 0 0 30px rgba(255,255,255,0.2); }
      
      .cg-compare { display: flex; gap: 20px; margin-bottom: 20px; width: 100%; justify-content: center; }
      .cg-swatch { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; max-width: 140px; }
      .cg-swatch-color { width: 100%; aspect-ratio: 1/1; border-radius: 16px; border: 3px solid #fff; }
      .cg-swatch-label { font-weight: 800; font-size: 1rem; color: #aaa; }
      .cg-swatch-hex { font-family: monospace; font-size: 1.1rem; font-weight: bold; background: rgba(0,0,0,0.5); padding: 4px 10px; border-radius: 8px; }
      
      .cg-points { font-size: 4rem; font-weight: 900; margin-bottom: 5px; color: #34D399; text-shadow: 0 0 20px rgba(52,211,153,0.4); }
      .cg-msg { font-size: 1.4rem; margin-bottom: 30px; font-weight: 800; }
    </style>

    <div class="cg-wrapper">
      <div class="cg-header">
        <div class="cg-score-box">Round: <span id="cg-round">1</span>/<span id="cg-max-round">5</span></div>
        <div class="cg-score-box">Score: <span id="cg-score">0</span></div>
        <div class="cg-score-box" style="background: rgba(245, 158, 11, 0.2); color: #F59E0B; border-color: #F59E0B;">Best: <span id="cg-high-score">0</span></div>
      </div>

      <div class="cg-question-card">
        <div class="cg-target-hint">What color is...</div>
        <div class="cg-target-name" id="cg-target-name">...</div>
        <div class="cg-target-img-container">
          <img id="cg-img" class="cg-target-img" src="" alt="Target">
        </div>
        <div class="cg-color-preview" id="cg-preview">#FFFFFF</div>
      </div>

      <div class="cg-sliders">
        <div class="cg-slider-group">
          <div class="cg-slider-label"><span>Color (Hue)</span></div>
          <input type="range" id="slider-h" min="0" max="360" value="180">
        </div>
        <div class="cg-slider-group">
          <div class="cg-slider-label"><span>Intensity (Saturation)</span></div>
          <input type="range" id="slider-s" min="0" max="100" value="50">
        </div>
        <div class="cg-slider-group">
          <div class="cg-slider-label"><span>Brightness (Lightness)</span></div>
          <input type="range" id="slider-l" min="0" max="100" value="50">
        </div>
      </div>

      <button class="cg-btn" id="btn-guess">LOCK IN GUESS</button>
    </div>

    <!-- Result Overlay -->
    <div class="cg-overlay" id="cg-result-overlay">
      <img id="cg-overlay-img" class="cg-overlay-img" src="">
      <div class="cg-compare">
        <div class="cg-swatch">
          <div class="cg-swatch-label">ACTUAL</div>
          <div class="cg-swatch-color" id="swatch-target"></div>
          <div class="cg-swatch-hex" id="hex-target">#000000</div>
        </div>
        <div class="cg-swatch">
          <div class="cg-swatch-label">YOURS</div>
          <div class="cg-swatch-color" id="swatch-guess"></div>
          <div class="cg-swatch-hex" id="hex-guess">#000000</div>
        </div>
      </div>
      <div class="cg-points">+<span id="cg-pts-earned">0</span></div>
      <div class="cg-msg" id="cg-msg">Incredible!</div>
      <button class="cg-btn" id="btn-next" style="width: 80%; max-width: 300px;">NEXT ROUND</button>
    </div>

    <!-- Game Over Overlay -->
    <div class="cg-overlay" id="cg-game-over-overlay" style="background: rgba(10,10,20,0.98);">
      <div style="font-size: 3rem; font-weight: 900; color: #38BDF8; margin-bottom: 10px;">GAME OVER</div>
      <div style="color: #aaa; font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">FINAL SCORE</div>
      <div style="font-size: 5rem; font-weight: 900; color: #fff; margin-bottom: 30px; text-shadow: 0 0 30px rgba(255,255,255,0.3);" id="cg-final-score">0</div>
      
      <div style="display: flex; gap: 15px; flex-direction: column; width: 100%; max-width: 300px;">
        <button class="cg-btn" style="background: #38BDF8; color: #000; box-shadow: 0 8px 25px rgba(56,189,248,0.4);" onclick="window.location.reload()">PLAY AGAIN</button>
        <button class="cg-btn" style="background: #333; box-shadow: none;" onclick="window.location.href='index.html'">BACK TO HAUS</button>
      </div>
    </div>

    <!-- Category Selection Overlay -->
    <div class="cg-overlay" id="cg-category-overlay" style="display: flex; background: rgba(10,10,20,0.98);">
      <div style="font-size: 2.5rem; font-weight: 900; color: #38BDF8; margin-bottom: 20px;">CHOOSE A DECK</div>
      <div style="display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 300px;">
        <button class="cg-btn cat-btn" data-cat="logos" style="background: linear-gradient(135deg, #3B82F6, #60A5FA);">Famous Logos</button>
        <button class="cg-btn cat-btn" data-cat="characters" style="background: linear-gradient(135deg, #F59E0B, #FBBF24);">Characters</button>
        <button class="cg-btn cat-btn" data-cat="sports" style="background: linear-gradient(135deg, #10B981, #34D399);">Sports Logos</button>
      </div>
      <button class="cg-btn" style="background: transparent; color: #aaa; box-shadow: none; margin-top: 20px; font-size: 1rem;" onclick="window.location.href='index.html'">Cancel</button>
    </div>
  `;

  // --- Game Data ---
  const TARGETS = {
    logos: [
      { name: "Chick-fil-A", r: 221, g: 0, b: 49, hex: "#DD0031", img: "img/Chick-fila.png" },
      { name: "Coca-Cola", r: 244, g: 0, b: 9, hex: "#F40009", img: "img/Coca-Cola.png" },
      { name: "Dell", r: 0, g: 118, b: 206, hex: "#0076CE", img: "img/DElll.png" },
      { name: "LG", r: 165, g: 0, b: 52, hex: "#A50034", img: "img/LG-1.png" },
      { name: "HP", r: 0, g: 150, b: 214, hex: "#0096D6", img: "img/hp-1.png" },
      { name: "Pinterest", r: 230, g: 0, b: 35, hex: "#E60023", img: "img/pinerest.webp" },
      { name: "Starbucks", r: 0, g: 112, b: 74, hex: "#00704A", img: "img/starbucks.avif" },
      { name: "Domino's (Blue Tile)", r: 0, g: 85, b: 165, hex: "#0055A5", img: "img/Dominos-1.png" },
      { name: "Dunkin' (The Text 'Dunkin')", r: 255, g: 103, b: 31, hex: "#FF671F", img: "img/Dunkin-1.png" },
      { name: "McDonald's (The Arches)", r: 255, g: 199, b: 44, hex: "#FFC72C", img: "img/McDonalds.png" },
      { name: "Pepsi (Top Half)", r: 201, g: 0, b: 43, hex: "#C9002B", img: "img/Pepsi-1.png" },
      { name: "Shell (The Outline)", r: 221, g: 29, b: 33, hex: "#DD1D21", img: "img/Shell-1.png" },
      { name: "Ferrari (Yellow Background)", r: 255, g: 242, b: 0, hex: "#FFF200", img: "img/Ferrari-2.png" },
      { name: "Nintendo", r: 228, g: 0, b: 15, hex: "#E4000F", img: "img/Nintendo-1.png" },
      { name: "Rockstar Games", r: 255, g: 165, b: 0, hex: "#FFA500", img: "img/Rockstar-Games.png" },
      { name: "Sega", r: 0, g: 137, b: 207, hex: "#0089CF", img: "img/Sega-1.png" },
      { name: "Taco Bell", r: 112, g: 32, b: 130, hex: "#702082", img: "img/Taco-bell-1.png" },
    ],
    characters: [
      { name: "SpongeBob", r: 252, g: 232, b: 23, hex: "#FCE817", img: "img/spongebob.webp" },
      { name: "Patrick Star (Body)", r: 255, g: 152, b: 150, hex: "#FF9896", img: "img/patrick star.webp" },
      { name: "Peppa Pig", r: 255, g: 179, b: 217, hex: "#FFB3D9", img: "img/peppa pig.webp" },
      { name: "Pikachu", r: 246, g: 216, b: 61, hex: "#F6D83D", img: "img/pikachu.png" },
      { name: "Shrek (Skin)", r: 196, g: 211, b: 0, hex: "#C4D300", img: "img/shrek.jpg" },
    ],
    sports: [
      { name: "Formula 1", r: 238, g: 0, b: 0, hex: "#EE0000", img: "img/F1-Formula-1.png" },
      { name: "Atlanta Hawks (Red)", r: 224, g: 58, b: 62, hex: "#E03A3E", img: "img/Atlanta Hawks.png" },
      { name: "Cincinnati Bengals (Orange)", r: 251, g: 79, b: 20, hex: "#FB4F14", img: "img/Bengals.png" },
      { name: "Tampa Bay Buccaneers (Red)", r: 213, g: 10, b: 10, hex: "#D50A0A", img: "img/Bucs.png" },
      { name: "New York Jets (Green)", r: 18, g: 87, b: 64, hex: "#125740", img: "img/Jets.png" },
      { name: "Detroit Lions (Honolulu Blue)", r: 0, g: 118, b: 182, hex: "#0076B6", img: "img/Lions.png" },
      { name: "Detroit Red Wings (Red)", r: 206, g: 17, b: 38, hex: "#CE1126", img: "img/Redwings.gif" },
      { name: "Buffalo Sabres (Blue)", r: 0, g: 38, b: 84, hex: "#002654", img: "img/Sabres.gif" },
      { name: "Tampa Bay Lightning (Blue)", r: 0, g: 40, b: 104, hex: "#002868", img: "img/Tampa Bay Lightning.gif" },
      { name: "Utah Jazz (Gold)", r: 249, g: 160, b: 27, hex: "#F9A01B", img: "img/Utah Jazz.png" },
      { name: "Chicago Bears (Orange)", r: 200, g: 56, b: 3, hex: "#C83803", img: "img/bears.png" },
      { name: "Dallas Cowboys (Blue)", r: 0, g: 53, b: 148, hex: "#003594", img: "img/cowboys.png" },
      { name: "Cleveland Browns (Orange)", r: 255, g: 60, b: 0, hex: "#FF3C00", img: "img/browns logo.webp" },
    ]
  };

  let gameSequence = [];
  let currentRound = 0;
  let totalScore = 0;
  let highScore = localStorage.getItem('cg-high-score') || 0;
  let currentH = 180, currentS = 50, currentL = 50;

  // DOM Elements
  const elName = document.getElementById('cg-target-name');
  const elImg = document.getElementById('cg-img');
  const elPreview = document.getElementById('cg-preview');
  const elRound = document.getElementById('cg-round');
  const elMaxRound = document.getElementById('cg-max-round');
  const elScore = document.getElementById('cg-score');
  const elHighScore = document.getElementById('cg-high-score');
  
  const sliderH = document.getElementById('slider-h');
  const sliderS = document.getElementById('slider-s');
  const sliderL = document.getElementById('slider-l');

  elHighScore.innerText = highScore;

  // HSL to RGB conversion
  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }

  function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
  }

  function getContrastYIQ(r, g, b){
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  function updateColor() {
    currentH = sliderH.value;
    currentS = sliderS.value;
    currentL = sliderL.value;
    
    const hsl = `hsl(${currentH}, ${currentS}%, ${currentL}%)`;
    elPreview.style.background = hsl;
    
    const [r, g, b] = hslToRgb(currentH, currentS, currentL);
    elPreview.innerText = rgbToHex(r, g, b);
    elPreview.style.color = getContrastYIQ(r, g, b);
    
    sliderS.style.background = `linear-gradient(to right, hsl(${currentH}, 0%, ${currentL}%), hsl(${currentH}, 100%, ${currentL}%))`;
    sliderL.style.background = `linear-gradient(to right, #000, hsl(${currentH}, ${currentS}%, 50%), #fff)`;
  }

  sliderH.addEventListener('input', updateColor);
  sliderS.addEventListener('input', updateColor);
  sliderL.addEventListener('input', updateColor);

  function loadRound() {
    const target = gameSequence[currentRound];
    elName.innerText = target.name;
    elImg.src = target.img;
    elRound.innerText = currentRound + 1;
    
    // Reset sliders
    sliderH.value = Math.floor(Math.random() * 360); 
    sliderS.value = 50; 
    sliderL.value = 50;
    updateColor();
  }

  document.getElementById('btn-guess').addEventListener('click', () => {
    const target = gameSequence[currentRound];
    const targetRgb = [target.r, target.g, target.b];
    const guessRgb = hslToRgb(currentH, currentS, currentL);
    const guessHex = rgbToHex(guessRgb[0], guessRgb[1], guessRgb[2]);

    const dist = Math.sqrt(
      Math.pow(targetRgb[0] - guessRgb[0], 2) + 
      Math.pow(targetRgb[1] - guessRgb[1], 2) + 
      Math.pow(targetRgb[2] - guessRgb[2], 2)
    );
    
    // Max RGB distance ~441
    let points = Math.max(0, Math.floor(100 - (dist / 441) * 200)); 
    if (dist < 15) points = 100; // Perfect tolerance

    totalScore += points;
    elScore.innerText = totalScore;

    // Show result overlay
    document.getElementById('cg-overlay-img').src = target.img;
    document.getElementById('swatch-target').style.background = target.hex;
    document.getElementById('swatch-guess').style.background = guessHex;
    document.getElementById('hex-target').innerText = target.hex;
    document.getElementById('hex-guess').innerText = guessHex;
    document.getElementById('cg-pts-earned').innerText = points;

    const msgEl = document.getElementById('cg-msg');
    if (points === 100) { msgEl.innerText = "PERFECT MATCH! 🤯"; msgEl.style.color = "#FFD700"; }
    else if (points > 85) { msgEl.innerText = "SO CLOSE! 🔥"; msgEl.style.color = "#34D399"; }
    else if (points > 60) { msgEl.innerText = "Not bad! 🤔"; msgEl.style.color = "#fff"; }
    else { msgEl.innerText = "Way off... 💀"; msgEl.style.color = "#FF6B6B"; }

    document.getElementById('cg-result-overlay').style.display = 'flex';
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    document.getElementById('cg-result-overlay').style.display = 'none';
    currentRound++;
    
    if (currentRound >= gameSequence.length) {
      if (totalScore > highScore) {
        highScore = totalScore;
        localStorage.setItem('cg-high-score', highScore);
        elHighScore.innerText = highScore;
      }
      
      if (window.saveScore && totalScore > 0) {
        const user = auth.currentUser;
        const uid = user ? user.uid : "guest";
        const timestamp = Date.now();
        const signature = generateScoreSignature(uid, 'Color Guess', totalScore, timestamp);
        window.saveScore('Color Guess', totalScore, signature, timestamp);
      }
      
      document.getElementById('cg-final-score').innerText = totalScore;
      document.getElementById('cg-game-over-overlay').style.display = 'flex';
    } else {
      loadRound();
    }
  });

  // Set up categories
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catId = e.target.getAttribute('data-cat');
      gameSequence = [...TARGETS[catId]].sort(() => Math.random() - 0.5);
      
      // We limit to 5 rounds max per deck to keep it snappy, or use all if less than 5
      if (gameSequence.length > 5) gameSequence = gameSequence.slice(0, 5);
      
      elMaxRound.innerText = gameSequence.length;
      document.getElementById('cg-category-overlay').style.display = 'none';
      
      // Init
      loadRound();
    });
  });
}
