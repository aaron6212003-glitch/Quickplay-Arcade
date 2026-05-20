export function init(container) {
  container.innerHTML = `
    <style>
      .hl-wrapper {
        display: flex; flex-direction: column; height: calc(100vh - 100px); min-height: 500px;
        width: 100%; font-family: 'Outfit', sans-serif; position: relative; overflow: hidden;
      }
      
      .hl-score-banner {
        position: absolute; top: 10px; left: 0; right: 0; z-index: 10;
        display: flex; justify-content: center; gap: 20px; pointer-events: none;
      }
      .hl-score-pill {
        background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
        padding: 8px 20px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1);
        font-weight: 800; font-size: 1.1rem; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }
      
      .hl-card {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; position: relative; transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
        padding: 20px; text-align: center; color: white;
      }
      
      .hl-card-top { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); z-index: 2; }
      .hl-card-bottom { background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%); z-index: 1; }
      
      .hl-vs-circle {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 60px; height: 60px; background: #111; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; z-index: 5;
        font-weight: 900; font-size: 1.2rem; color: #fff; border: 4px solid #222;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
      }
      
      .hl-name { font-size: 2.5rem; font-weight: 900; margin-bottom: 10px; text-shadow: 0 4px 10px rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: -1px; line-height: 1.1; }
      .hl-subtitle { font-size: 1.1rem; font-weight: 600; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; }
      
      .hl-value-container { height: 60px; display: flex; align-items: center; justify-content: center; }
      .hl-value { font-size: 3.5rem; font-weight: 900; color: #FCD34D; text-shadow: 0 0 20px rgba(252, 211, 77, 0.4); }
      
      .hl-btn-group { display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 300px; }
      .hl-btn {
        background: transparent; color: white; border: 3px solid rgba(255,255,255,0.4);
        padding: 15px 30px; border-radius: 50px; font-size: 1.4rem; font-weight: 800;
        cursor: pointer; transition: all 0.2s; text-transform: uppercase;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        backdrop-filter: blur(5px);
      }
      .hl-btn:hover { background: rgba(255,255,255,0.1); border-color: #fff; transform: translateY(-2px); }
      .hl-btn:active { transform: translateY(2px); }
      
      .hl-btn-higher:hover { background: rgba(52, 211, 153, 0.2); border-color: #34D399; color: #34D399; }
      .hl-btn-lower:hover { background: rgba(248, 113, 113, 0.2); border-color: #F87171; color: #F87171; }
      
      .hl-overlay {
        position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 100;
        display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center;
      }
      .hl-game-over-title { font-size: 3rem; font-weight: 900; color: #F87171; margin-bottom: 10px; }
      .hl-final-score { font-size: 5rem; font-weight: 900; color: #fff; margin-bottom: 30px; text-shadow: 0 0 30px rgba(255,255,255,0.3); }
      .hl-play-again {
        background: #fff; color: #000; border: none; padding: 20px 50px;
        border-radius: 50px; font-size: 1.5rem; font-weight: 900; cursor: pointer;
        box-shadow: 0 10px 30px rgba(255,255,255,0.3);
      }

      /* Animations */
      @keyframes popIn {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .anim-pop { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      
      @keyframes slideUp {
        0% { transform: translateY(100%); }
        100% { transform: translateY(0); }
      }
      .anim-slide-up { animation: slideUp 0.5s ease-out forwards; }
    </style>

    <div class="hl-wrapper">
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
        <div style="color: #aaa; font-size: 1.2rem; font-weight: 600;">FINAL SCORE</div>
        <div class="hl-final-score" id="final-score-display">0</div>
        <button class="hl-play-again" onclick="resetGame()">PLAY AGAIN</button>
      </div>
    </div>
  `;

  // DATASET: Grouped by categories with real approximate data (2024)
  const DATABASES = {
    "Monthly Google Searches": {
      prefix: "",
      items: [
        { name: "Google", val: 85000000 },
        { name: "YouTube", val: 75000000 },
        { name: "Facebook", val: 65000000 },
        { name: "TikTok", val: 55000000 },
        { name: "Instagram", val: 60000000 },
        { name: "Minecraft", val: 30000000 },
        { name: "Bitcoin", val: 24000000 },
        { name: "Taylor Swift", val: 22000000 },
        { name: "Cristiano Ronaldo", val: 18000000 },
        { name: "Lionel Messi", val: 16000000 },
        { name: "Elon Musk", val: 15000000 },
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
        { name: "Peppa Pig", val: 3500000 },
        { name: "Shrek", val: 2500000 },
        { name: "Taco Bell", val: 2000000 }
      ]
    },
    "Net Worth": {
      prefix: "$",
      items: [
        { name: "Elon Musk", val: 210000000000 },
        { name: "Bernard Arnault", val: 200000000000 },
        { name: "Jeff Bezos", val: 190000000000 },
        { name: "Mark Zuckerberg", val: 160000000000 },
        { name: "Bill Gates", val: 130000000000 },
        { name: "Warren Buffett", val: 130000000000 },
        { name: "Michael Jordan", val: 3200000000 },
        { name: "Oprah Winfrey", val: 2800000000 },
        { name: "Jay-Z", val: 2500000000 },
        { name: "Kim Kardashian", val: 1700000000 },
        { name: "Rihanna", val: 1400000000 },
        { name: "Taylor Swift", val: 1100000000 },
        { name: "Tiger Woods", val: 1100000000 },
        { name: "LeBron James", val: 1000000000 },
        { name: "Dwayne 'The Rock' Johnson", val: 800000000 },
        { name: "Cristiano Ronaldo", val: 600000000 },
        { name: "MrBeast", val: 500000000 }
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
        { name: "The Avengers", val: 1518000000 },
        { name: "Top Gun: Maverick", val: 1495000000 },
        { name: "Frozen II", val: 1450000000 },
        { name: "Barbie", val: 1445000000 },
        { name: "The Super Mario Bros. Movie", val: 1361000000 },
        { name: "Black Panther", val: 1347000000 }
      ]
    },
    "Instagram Followers": {
      prefix: "",
      items: [
        { name: "Cristiano Ronaldo", val: 620000000 },
        { name: "Lionel Messi", val: 500000000 },
        { name: "Selena Gomez", val: 430000000 },
        { name: "Kylie Jenner", val: 400000000 },
        { name: "Dwayne Johnson", val: 396000000 },
        { name: "Ariana Grande", val: 380000000 },
        { name: "Kim Kardashian", val: 364000000 },
        { name: "Beyoncé", val: 320000000 },
        { name: "Khloé Kardashian", val: 310000000 },
        { name: "Kendall Jenner", val: 295000000 },
        { name: "Justin Bieber", val: 293000000 },
        { name: "Taylor Swift", val: 280000000 },
        { name: "Virat Kohli", val: 266000000 },
        { name: "Jennifer Lopez", val: 253000000 },
        { name: "Nicki Minaj", val: 228000000 }
      ]
    }
  };

  let currentCategoryName = "";
  let currentCategory = null;
  let currentCard = null;
  let nextCard = null;
  let score = 0;
  let highScore = localStorage.getItem('hl-high-score') || 0;
  
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
  const cardBottom = container.querySelector('#card-bottom');

  elHighScore.innerText = highScore;

  function formatNumber(num) {
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return currentCategory.prefix + formatted;
  }

  function getRandomCard(excludeName = "") {
    let card;
    do {
      card = currentCategory.items[Math.floor(Math.random() * currentCategory.items.length)];
    } while (card.name === excludeName);
    return card;
  }

  function initGame() {
    score = 0;
    elScore.innerText = score;
    elGameOver.style.display = 'none';
    
    // Pick random category for this round
    const categories = Object.keys(DATABASES);
    currentCategoryName = categories[Math.floor(Math.random() * categories.length)];
    currentCategory = DATABASES[currentCategoryName];
    
    currentCard = getRandomCard();
    nextCard = getRandomCard(currentCard.name);
    
    renderCards();
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
    
    // Randomize gradients for bottom card
    const hues = [0, 60, 120, 200, 280, 320];
    const randH = hues[Math.floor(Math.random() * hues.length)];
    cardBottom.style.background = `linear-gradient(135deg, hsl(${randH}, 80%, 30%) 0%, hsl(${randH + 30}, 80%, 20%) 100%)`;
    
    // Remove slide animation to reset
    cardBottom.classList.remove('anim-slide-up');
    void cardBottom.offsetWidth; // trigger reflow
    cardBottom.classList.add('anim-slide-up');
  }

  window.guess = function(choice) {
    // Reveal value
    const isHigher = nextCard.val >= currentCard.val;
    const isLower = nextCard.val <= currentCard.val;
    
    let isCorrect = false;
    if (choice === 'higher' && isHigher) isCorrect = true;
    if (choice === 'lower' && isLower) isCorrect = true;

    // Show the number
    const valDiv = document.createElement('div');
    valDiv.className = 'hl-value anim-pop';
    valDiv.innerText = formatNumber(nextCard.val);
    if (!isCorrect) valDiv.style.color = '#F87171'; // Red if wrong
    
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
      
      // Wait a sec, then slide up
      setTimeout(() => {
        currentCard = nextCard;
        nextCard = getRandomCard(currentCard.name);
        renderCards();
      }, 1500);
    } else {
      // Game Over
      if (window.saveScore && score > 0) {
        window.saveScore('Higher or Lower', score);
      }
      setTimeout(() => {
        elFinalScore.innerText = score;
        elGameOver.style.display = 'flex';
      }, 1500);
    }
  };

  window.resetGame = initGame;

  // Start
  initGame();
}
