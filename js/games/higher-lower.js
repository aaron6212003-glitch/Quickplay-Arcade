export function init(container) {
  container.innerHTML = `
    <style>
      .hl-wrapper {
        display: flex; flex-direction: column; height: calc(100vh - 120px); min-height: 550px;
        width: 100%; font-family: 'Outfit', sans-serif; position: relative; overflow: hidden;
        background: #090d16; border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        border: 1px solid rgba(255,255,255,0.05);
      }
      
      /* Sleek Glowing Timer Progress Bar */
      .hl-timer-container {
        position: absolute; top: 0; left: 0; right: 0; height: 6px;
        background: rgba(255, 255, 255, 0.03); z-index: 15;
      }
      .hl-timer-bar {
        width: 100%; height: 100%; background: #10B981;
        box-shadow: 0 0 12px #10B981;
        transition: width 0.05s linear, background-color 0.2s ease;
      }
      
      /* Ambient Blurred Orbs background */
      .hl-orb {
        position: absolute; width: 350px; height: 350px; border-radius: 50%;
        filter: blur(120px); opacity: 0.12; pointer-events: none; z-index: 0;
      }
      .hl-orb-1 { background: #38BDF8; top: 5%; left: -80px; animation: hlDrift 18s infinite alternate ease-in-out; }
      .hl-orb-2 { background: #EC4899; bottom: 5%; right: -80px; animation: hlDrift 22s infinite alternate-reverse ease-in-out; }
      @keyframes hlDrift {
        0% { transform: translate(0, 0) scale(1); }
        100% { transform: translate(60px, 40px) scale(1.25); }
      }
      
      .hl-score-banner {
        position: absolute; top: 22px; left: 0; right: 0; z-index: 10;
        display: flex; justify-content: center; gap: 15px; pointer-events: none;
      }
      .hl-score-pill {
        background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 8px 24px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.08);
        font-weight: 800; font-size: 1rem; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      }
      
      .hl-card {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; position: relative; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
        padding: 35px 20px; text-align: center; color: white; z-index: 2;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .hl-card-top {
        border-bottom: none;
        border-radius: 20px 20px 0 0;
        box-shadow: 0 10px 30px rgba(56, 189, 248, 0.03), inset 0 0 20px rgba(56, 189, 248, 0.01);
      }
      .hl-card-top::after {
        content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.25), transparent);
      }
      
      .hl-card-bottom {
        border-top: none;
        border-radius: 0 0 20px 20px;
        box-shadow: 0 -10px 30px rgba(236, 72, 153, 0.03), inset 0 0 20px rgba(236, 72, 153, 0.01);
      }
      
      /* Slide Swapping Animations */
      .hl-card-top.slide-out {
        transform: translateY(-100%);
        opacity: 0;
      }
      .hl-card-bottom.slide-up-merge {
        transform: translateY(calc(-100% - 1px));
        border-radius: 20px 20px 0 0;
      }
      
      .hl-vs-circle {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 64px; height: 64px;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center; z-index: 10;
        font-weight: 900; font-size: 1.15rem; color: #fff;
        border: 2px solid rgba(255,255,255,0.15);
        box-shadow: 0 0 30px rgba(56, 189, 248, 0.25), inset 0 2px 4px rgba(255,255,255,0.2);
        letter-spacing: 1px;
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .hl-name {
        font-size: 2.8rem; font-weight: 900; margin-bottom: 8px;
        text-shadow: 0 4px 15px rgba(0,0,0,0.6);
        text-transform: uppercase; letter-spacing: -1.5px; line-height: 1.05;
        background: linear-gradient(to bottom, #ffffff, #e2e8f0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .hl-subtitle {
        font-size: 0.95rem; font-weight: 800; opacity: 0.75;
        text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;
        color: #38BDF8;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .hl-card-bottom .hl-subtitle {
        color: rgba(255, 255, 255, 0.4);
        text-transform: lowercase;
        font-style: italic;
        font-size: 1.1rem;
        font-weight: 400;
        letter-spacing: 1px;
        margin-bottom: 15px;
        text-shadow: none;
      }
      
      .hl-value-container { min-height: 80px; display: flex; align-items: center; justify-content: center; }
      .hl-value {
        font-size: 3.8rem; font-weight: 900; color: #FCD34D;
        text-shadow: 0 0 25px rgba(252, 211, 77, 0.6);
      }
      
      .hl-btn-group { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 320px; }
      .hl-btn {
        background: transparent; color: white; border: 2px solid rgba(255,255,255,0.25);
        padding: 14px 28px; border-radius: 50px; font-size: 1.25rem; font-weight: 800;
        cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); text-transform: uppercase;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        letter-spacing: 0.5px;
      }
      
      .hl-btn-higher {
        background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.5); color: #10B981;
        text-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
      }
      .hl-btn-higher:hover {
        background: #10B981; border-color: #10B981; color: #fff;
        transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
      }
      .hl-btn-lower {
        background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.5); color: #EF4444;
        text-shadow: 0 0 10px rgba(239, 68, 68, 0.25);
      }
      .hl-btn-lower:hover {
        background: #EF4444; border-color: #EF4444; color: #fff;
        transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
      }
      .hl-btn:active { transform: translateY(1px); }
      
      .hl-overlay {
        position: absolute; inset: 0;
        background: rgba(9, 13, 22, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 100;
        display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center;
        border-radius: 20px;
        padding: 40px 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .hl-game-over-title {
        font-size: 3.5rem; font-weight: 900;
        background: linear-gradient(135deg, #EF4444 0%, #F59E0B 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 8px;
        letter-spacing: -1.5px;
        filter: drop-shadow(0 4px 10px rgba(239,68,68,0.25));
      }
      .hl-final-score {
        font-size: 6.5rem; font-weight: 900; color: #fff; margin-bottom: 30px;
        text-shadow: 0 0 45px rgba(56, 189, 248, 0.55);
        line-height: 0.9;
        letter-spacing: -2px;
      }
      .hl-play-again {
        background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
        color: #fff; border: none; padding: 18px 48px;
        border-radius: 50px; font-size: 1.3rem; font-weight: 900; cursor: pointer;
        box-shadow: 0 8px 25px rgba(56, 189, 248, 0.35);
        transition: all 0.25s;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .hl-play-again:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 30px rgba(56, 189, 248, 0.55);
      }
      .hl-play-again:active { transform: translateY(1px) scale(0.98); }

      /* Premium Animations */
      @keyframes hlPopIn {
        0% { transform: scale(0.7); opacity: 0; filter: blur(5px); }
        100% { transform: scale(1); opacity: 1; filter: blur(0); }
      }
      .anim-pop { animation: hlPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2); }
      
      @keyframes hlSlideUp {
        0% { transform: translateY(30px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      .anim-slide-up { animation: hlSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      
      @keyframes hlShake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-8px); }
        40%, 80% { transform: translateX(8px); }
      }
      .hl-shake { animation: hlShake 0.4s ease-in-out; }
    </style>

    <div class="hl-wrapper">
      <!-- 5s Glowing Visual Timer -->
      <div class="hl-timer-container">
        <div class="hl-timer-bar" id="hl-timer-bar"></div>
      </div>
      
      <!-- Background stellar elements -->
      <div class="hl-orb hl-orb-1"></div>
      <div class="hl-orb hl-orb-2"></div>
      
      <div class="hl-score-banner">
        <div class="hl-score-pill">Score: <span id="hl-score">0</span></div>
        <div class="hl-score-pill">Best: <span id="hl-high-score">0</span></div>
      </div>
      
      <div class="hl-card hl-card-top" id="card-top">
        <div class="hl-subtitle">"Monthly Searches"</div>
        <div class="hl-name" id="top-name">Minecraft</div>
        <div class="hl-value-container">
          <div class="hl-value anim-pop" id="top-value">30,000,000</div>
        </div>
      </div>
      
      <div class="hl-vs-circle">VS</div>
      
      <div class="hl-card hl-card-bottom" id="card-bottom">
        <div class="hl-name" id="bottom-name">Bitcoin</div>
        <div class="hl-subtitle">has</div>
        
        <div class="hl-value-container" id="bottom-value-container">
          <div class="hl-btn-group" id="btn-group">
            <button class="hl-btn hl-btn-higher" onclick="guess('higher')">Higher ⬆️</button>
            <button class="hl-btn hl-btn-lower" onclick="guess('lower')">Lower ⬇️</button>
          </div>
        </div>
      </div>

      <div class="hl-overlay" id="game-over-overlay">
        <div class="hl-game-over-title">GAME OVER</div>
        <div style="color: #64748b; font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">FINAL SCORE</div>
        <div class="hl-final-score" id="final-score-display">0</div>
        <button class="hl-play-again" onclick="resetGame()">PLAY AGAIN</button>
      </div>
    </div>
  `;

  // DATASET: Expanded, massive question bank curated for maximum variation & anti-cheating
  const DATABASES = {
    "Monthly Google Searches": {
      prefix: "",
      items: [
        { name: "Google", val: 85000000 },
        { name: "YouTube", val: 75000000 },
        { name: "Facebook", val: 65000000 },
        { name: "Instagram", val: 60000000 },
        { name: "TikTok", val: 55000000 },
        { name: "Weather", val: 50000000 },
        { name: "Amazon", val: 45000000 },
        { name: "Translate", val: 40000000 },
        { name: "ChatGPT", val: 38000000 },
        { name: "Wordle", val: 35000000 },
        { name: "Netflix", val: 32000000 },
        { name: "Minecraft", val: 30000000 },
        { name: "Roblox", val: 28000000 },
        { name: "Bitcoin", val: 24000000 },
        { name: "Taylor Swift", val: 22000000 },
        { name: "NBA", val: 20000000 },
        { name: "Cristiano Ronaldo", val: 18000000 },
        { name: "NFL", val: 18000000 },
        { name: "Lionel Messi", val: 16000000 },
        { name: "GTA 5", val: 14000000 },
        { name: "Spider-Man", val: 13000000 },
        { name: "McDonald's", val: 12000000 },
        { name: "Nike", val: 11000000 },
        { name: "PlayStation 5", val: 10000000 },
        { name: "Harry Potter", val: 9500000 },
        { name: "Nintendo", val: 9000000 },
        { name: "Xbox", val: 8500000 },
        { name: "Starbucks", val: 8000000 },
        { name: "Batman", val: 7000000 },
        { name: "Formula 1", val: 6000000 },
        { name: "SpongeBob", val: 5000000 },
        { name: "Ferrari", val: 4000000 },
        { name: "Elden Ring", val: 3000000 },
        { name: "Shrek", val: 2500000 },
        { name: "Taco Bell", val: 2000000 }
      ]
    },
    "Net Worth": {
      prefix: "$",
      items: [
        { name: "Elon Musk", val: 782000000000 },
        { name: "Larry Page", val: 313000000000 },
        { name: "Sergey Brin", val: 295000000000 },
        { name: "Jeff Bezos", val: 272000000000 },
        { name: "Mark Zuckerberg", val: 210000000000 },
        { name: "Larry Ellison", val: 205000000000 },
        { name: "Steve Ballmer", val: 148000000000 },
        { name: "Bernard Arnault", val: 143000000000 },
        { name: "Warren Buffett", val: 140000000000 },
        { name: "Jensen Huang", val: 122000000000 },
        { name: "Michael Dell", val: 120000000000 },
        { name: "Bill Gates", val: 105000000000 },
        { name: "Mukesh Ambani", val: 116000000000 },
        { name: "Gautam Adani", val: 102000000000 },
        { name: "Phil Knight", val: 40000000000 },
        { name: "Donald Trump", val: 6500000000 },
        { name: "Michael Jordan", val: 4300000000 },
        { name: "Oprah Winfrey", val: 3000000000 },
        { name: "MrBeast", val: 2600000000 },
        { name: "Jay-Z", val: 2500000000 },
        { name: "Kim Kardashian", val: 1900000000 },
        { name: "Taylor Swift", val: 1600000000 },
        { name: "Rihanna", val: 1400000000 },
        { name: "Selena Gomez", val: 1300000000 },
        { name: "Cristiano Ronaldo", val: 1200000000 },
        { name: "Tiger Woods", val: 1100000000 },
        { name: "LeBron James", val: 1000000000 },
        { name: "Lionel Messi", val: 850000000 },
        { name: "Dwayne Johnson", val: 800000000 },
        { name: "Beyoncé", val: 800000000 },
        { name: "Kylie Jenner", val: 700000000 },
        { name: "Drake", val: 250000000 }
      ]
    },
    "Box Office Gross": {
      prefix: "$",
      items: [
        { name: "Avatar", val: 2923000000 },
        { name: "Avengers: Endgame", val: 2797000000 },
        { name: "Avatar: The Way of Water", val: 2320000000 },
        { name: "Titanic", val: 2257000000 },
        { name: "Star Wars: The Force Awakens", val: 2068000000 },
        { name: "Avengers: Infinity War", val: 2048000000 },
        { name: "Spider-Man: No Way Home", val: 1921000000 },
        { name: "Jurassic World", val: 1671000000 },
        { name: "The Lion King (2019)", val: 1656000000 },
        { name: "The Avengers (2012)", val: 1518000000 },
        { name: "Furious 7", val: 1515000000 },
        { name: "Top Gun: Maverick", val: 1495000000 },
        { name: "Frozen II", val: 1450000000 },
        { name: "Barbie", val: 1445000000 },
        { name: "Avengers: Age of Ultron", val: 1405000000 },
        { name: "The Super Mario Bros. Movie", val: 1361000000 },
        { name: "Black Panther", val: 1347000000 },
        { name: "Harry Potter & Deathly Hallows Part 2", val: 1342000000 },
        { name: "Star Wars: The Last Jedi", val: 1332000000 },
        { name: "Jurassic World: Fallen Kingdom", val: 1310000000 },
        { name: "Frozen", val: 1280000000 },
        { name: "Beauty and the Beast (2017)", val: 1263000000 },
        { name: "Incredibles 2", val: 1242000000 },
        { name: "The Fate of the Furious", val: 1236000000 },
        { name: "Iron Man 3", val: 1214000000 },
        { name: "Minions", val: 1159000000 },
        { name: "Captain America: Civil War", val: 1153000000 },
        { name: "Aquaman", val: 1148000000 },
        { name: "Skyfall", val: 1108000000 },
        { name: "Transformers: Dark of the Moon", val: 1123000000 },
        { name: "Toy Story 4", val: 1073000000 },
        { name: "Joker", val: 1074000000 }
      ]
    },
    "Instagram Followers": {
      prefix: "",
      items: [
        { name: "Instagram", val: 675000000 },
        { name: "Cristiano Ronaldo", val: 664000000 },
        { name: "Lionel Messi", val: 506000000 },
        { name: "Selena Gomez", val: 406000000 },
        { name: "Dwayne 'The Rock' Johnson", val: 396000000 },
        { name: "Kylie Jenner", val: 383000000 },
        { name: "Ariana Grande", val: 363000000 },
        { name: "Kim Kardashian", val: 345000000 },
        { name: "Beyoncé", val: 312000000 },
        { name: "Khloé Kardashian", val: 305000000 },
        { name: "Nike", val: 302000000 },
        { name: "Kendall Jenner", val: 291000000 },
        { name: "Justin Bieber", val: 290000000 },
        { name: "Taylor Swift", val: 283000000 },
        { name: "National Geographic", val: 280000000 },
        { name: "Virat Kohli", val: 270000000 },
        { name: "Neymar Jr", val: 220000000 },
        { name: "Zendaya", val: 182000000 },
        { name: "Cardi B", val: 165000000 },
        { name: "LeBron James", val: 160000000 },
        { name: "Demi Lovato", val: 155000000 },
        { name: "Rihanna", val: 151000000 },
        { name: "Drake", val: 145000000 },
        { name: "Billie Eilish", val: 110000000 },
        { name: "Shakira", val: 90000000 },
        { name: "Khaby Lame", val: 81000000 },
        { name: "Real Madrid CF", val: 162000000 },
        { name: "FC Barcelona", val: 130000000 },
        { name: "NASA", val: 97000000 },
        { name: "Miley Cyrus", val: 215000000 },
        { name: "Eminem", val: 44000000 }
      ]
    }
  };

  let currentCategoryName = "";
  let currentCategory = null;
  let currentCard = null;
  let nextCard = null;
  let score = 0;
  let highScore = localStorage.getItem('hl-high-score') || 0;
  
  // Anti-repeat & timer states
  let seenNames = new Set();
  let isTransitioning = false;
  let timerInterval = null;
  const timeLimitMs = 5000; // Hard 5-second timer
  
  // DOM Elements
  const elScore = container.querySelector('#hl-score');
  const elHighScore = container.querySelector('#hl-high-score');
  const elTopName = container.querySelector('#top-name');
  const elTopSubtitle = container.querySelector('.hl-card-top .hl-subtitle');
  const elTopValue = container.querySelector('#top-value');
  const elBottomName = container.querySelector('#bottom-name');
  const elBottomSubtitle = container.querySelector('.hl-card-bottom .hl-subtitle');
  const elBottomContainer = container.querySelector('#bottom-value-container');
  const elBtnGroup = container.querySelector('#btn-group');
  const elGameOver = container.querySelector('#game-over-overlay');
  const elFinalScore = container.querySelector('#final-score-display');
  const cardTop = container.querySelector('#card-top');
  const cardBottom = container.querySelector('#card-bottom');
  const vsCircle = container.querySelector('.hl-vs-circle');
  const hlWrapper = container.querySelector('.hl-wrapper');

  elHighScore.innerText = highScore;

  function formatNumber(num) {
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return currentCategory.prefix + formatted;
  }

  function getRandomCard(excludeName = "") {
    let available = currentCategory.items.filter(item => 
      item.name !== excludeName && !seenNames.has(item.name)
    );
    
    // Fallback if all cards have been seen
    if (available.length === 0) {
      seenNames.clear();
      if (excludeName) {
        seenNames.add(excludeName);
      }
      available = currentCategory.items.filter(item => item.name !== excludeName);
    }
    
    const card = available[Math.floor(Math.random() * available.length)];
    seenNames.add(card.name);
    return card;
  }

  // --- TIMER LOGIC ---
  function startTimer() {
    stopTimer();
    const timerBar = container.querySelector('#hl-timer-bar');
    if (!timerBar) return;
    
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = '#10B981';
    timerBar.style.boxShadow = '0 0 12px #10B981';
    
    const startTime = Date.now();
    
    timerInterval = setInterval(() => {
      if (isTransitioning) return;
      
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      const pct = (remaining / timeLimitMs) * 100;
      
      timerBar.style.width = pct + '%';
      
      if (pct > 50) {
        timerBar.style.backgroundColor = '#10B981';
        timerBar.style.boxShadow = '0 0 12px #10B981';
      } else if (pct > 22) {
        timerBar.style.backgroundColor = '#F59E0B';
        timerBar.style.boxShadow = '0 0 12px #F59E0B';
      } else {
        timerBar.style.backgroundColor = '#EF4444';
        timerBar.style.boxShadow = '0 0 12px #EF4444';
      }
      
      if (remaining <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 20);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function handleTimeout() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    // Show TIME'S UP overlay element in the bottom card
    const valDiv = document.createElement('div');
    valDiv.className = 'hl-value anim-pop';
    valDiv.innerText = "TIME'S UP! ⏰";
    valDiv.style.color = '#EF4444';
    valDiv.style.textShadow = '0 0 25px rgba(239, 68, 68, 0.6)';
    valDiv.style.fontSize = '2.5rem';
    
    elBottomContainer.innerHTML = '';
    elBottomContainer.appendChild(valDiv);
    
    // Shake screen
    hlWrapper.classList.add('hl-shake');
    setTimeout(() => hlWrapper.classList.remove('hl-shake'), 450);

    // Save score
    if (window.saveScore && score > 0) {
      window.saveScore('Higher or Lower', score);
    }
    
    setTimeout(() => {
      elFinalScore.innerText = score;
      elGameOver.style.display = 'flex';
      isTransitioning = false;
    }, 1500);
  }

  function initGame() {
    score = 0;
    elScore.innerText = score;
    elGameOver.style.display = 'none';
    seenNames.clear();
    isTransitioning = false;
    stopTimer();
    
    // Pick random category for this round
    const categories = Object.keys(DATABASES);
    currentCategoryName = categories[Math.floor(Math.random() * categories.length)];
    currentCategory = DATABASES[currentCategoryName];
    
    currentCard = getRandomCard();
    nextCard = getRandomCard(currentCard.name);
    
    renderCards();
    startTimer();
  }

  function renderCards() {
    elTopSubtitle.innerText = `"${currentCategoryName}"`;
    elTopName.innerText = currentCard.name;
    elTopValue.innerText = formatNumber(currentCard.val);
    
    elBottomName.innerText = nextCard.name;
    elBottomSubtitle.innerText = "has";
    
    // Reset bottom container back to buttons
    elBottomContainer.innerHTML = '';
    elBottomContainer.appendChild(elBtnGroup);
    
    cardBottom.classList.remove('anim-slide-up');
    void cardBottom.offsetWidth; // trigger reflow
    cardBottom.classList.add('anim-slide-up');
  }

  window.guess = function(choice) {
    if (isTransitioning) return;
    isTransitioning = true;
    stopTimer(); // Freeze timer immediately

    // Reveal value
    const isHigher = nextCard.val >= currentCard.val;
    const isLower = nextCard.val <= currentCard.val;
    
    let isCorrect = false;
    if (choice === 'higher' && isHigher) isCorrect = true;
    if (choice === 'lower' && isLower) isCorrect = true;

    // Show the revealed number
    const valDiv = document.createElement('div');
    valDiv.className = 'hl-value anim-pop';
    valDiv.innerText = formatNumber(nextCard.val);
    if (!isCorrect) {
      valDiv.style.color = '#EF4444';
      valDiv.style.textShadow = '0 0 25px rgba(239, 68, 68, 0.6)';
    } else {
      valDiv.style.color = '#10B981';
      valDiv.style.textShadow = '0 0 25px rgba(16, 185, 129, 0.6)';
    }
    
    elBottomContainer.innerHTML = '';
    elBottomContainer.appendChild(valDiv);

    if (isCorrect) {
      score++;
      elScore.innerText = score;
      if (score > highScore) {
        highScore = score;
        elHighScore.innerText = highScore;
        localStorage.setItem('hl-high-score', highScore);
      }
      
      // Slide transitions
      setTimeout(() => {
        cardTop.classList.add('slide-out');
        cardBottom.classList.add('slide-up-merge');
        vsCircle.style.opacity = '0';
        vsCircle.style.transform = 'translate(-50%, -50%) scale(0) rotate(180deg)';
        
        setTimeout(() => {
          currentCard = nextCard;
          nextCard = getRandomCard(currentCard.name);
          
          cardTop.classList.remove('slide-out');
          cardBottom.classList.remove('slide-up-merge');
          
          vsCircle.style.opacity = '1';
          vsCircle.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
          
          renderCards();
          isTransitioning = false;
          startTimer(); // Start fresh countdown for next card
        }, 600);
      }, 1500);
      
    } else {
      // Game Over: Shake screen and save score
      hlWrapper.classList.add('hl-shake');
      setTimeout(() => hlWrapper.classList.remove('hl-shake'), 450);

      if (window.saveScore && score > 0) {
        window.saveScore('Higher or Lower', score);
      }
      
      setTimeout(() => {
        elFinalScore.innerText = score;
        elGameOver.style.display = 'flex';
        isTransitioning = false;
      }, 1500);
    }
  };

  window.resetGame = initGame;

  // Cleanup timers and global handlers if user leaves the page
  const observer = new MutationObserver((mutations) => {
    if (!document.contains(container)) {
      stopTimer();
      delete window.guess;
      delete window.resetGame;
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Start the high-stakes premium experience
  initGame();
}
