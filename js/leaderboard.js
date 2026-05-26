import { db, auth, collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, increment, where } from './firebase.js';
import { getDailyGame, getYesterdayDateString } from './daily.js';

let activeRankingsTab = 'daily'; // 'daily' or 'alltime'

// --- CLASH ROYALE LEVEL PROGRESSION CALCULATOR ---
function getLevelData(totalXP) {
  const levels = [
    { lvl: 1, xpToNext: 100 },
    { lvl: 2, xpToNext: 250 },
    { lvl: 3, xpToNext: 500 },
    { lvl: 4, xpToNext: 1000 },
    { lvl: 5, xpToNext: 2500 },
    { lvl: 6, xpToNext: 5000 },
    { lvl: 7, xpToNext: 10000 },
    { lvl: 8, xpToNext: 25000 }
  ];

  let currentLvl = 1;
  let accumulatedXP = 0;
  let xpNeeded = 100;

  for (let i = 0; i < levels.length; i++) {
    const lvlInfo = levels[i];
    if (totalXP >= accumulatedXP + lvlInfo.xpToNext) {
      accumulatedXP += lvlInfo.xpToNext;
      currentLvl = lvlInfo.lvl + 1;
    } else {
      xpNeeded = lvlInfo.xpToNext;
      break;
    }
  }

  if (currentLvl >= 9) {
    const extraXP = totalXP - accumulatedXP;
    const extraLevels = Math.floor(extraXP / 50000);
    currentLvl = 9 + extraLevels;
    accumulatedXP = accumulatedXP + (extraLevels * 50000);
    xpNeeded = 50000;
  }

  const xpProgress = totalXP - accumulatedXP;
  const xpPercent = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));

  return {
    level: currentLvl,
    xpForCurrentLevel: accumulatedXP,
    xpForNextLevel: accumulatedXP + xpNeeded,
    xpNeeded: xpNeeded,
    xpProgress: xpProgress,
    xpPercent: xpPercent
  };
}

// --- PREMIUM TOAST NOTIFICATION ---
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    min-width: 280px;
    max-width: 400px;
    padding: 16px 20px;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
  `;

  let icon = 'ℹ️';
  if (type === 'success') {
    icon = '✅';
    toast.style.borderLeft = '4px solid #10B981';
  } else if (type === 'warning') {
    icon = '⚠️';
    toast.style.borderLeft = '4px solid #F59E0B';
  } else if (type === 'error') {
    icon = '❌';
    toast.style.borderLeft = '4px solid #EF4444';
  }

  toast.innerHTML = `
    <span style="font-size: 1.25rem;">${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

// --- SAVE SCORE ---
window.saveScore = async function(gameName, score) {
  const user = auth.currentUser;
  if (!user) {
    console.log("User not logged in, score not saved to global leaderboard.");
    showToast("⚠️ Score not saved! Log in using the top-right button to join the rankings.", "warning");
    return;
  }

  try {
    const isDaily = window.isDailyRun === true;
    let dateString = null;
    if (isDaily) {
      const { dateString: activeDate } = getDailyGame();
      dateString = activeDate;
    }

    // 1. Fetch current user avatar
    let userAvatar = "👾";
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        userAvatar = uData.avatar || "👾";
      }
    } catch (avatarError) {
      console.log("Could not fetch user avatar for leaderboard scores:", avatarError);
    }

    // 2. Add score to the global scores collection
    await addDoc(collection(db, "scores"), {
      uid: user.uid,
      username: user.displayName || "Unknown Player",
      avatar: userAvatar,
      game: gameName,
      score: score,
      timestamp: new Date(),
      daily: isDaily,
      dateString: dateString
    });
    
    // 2. Map raw score to normalized XP and Coins (exactly +10 XP/Coins per action, capped at 100 per match)
    const gameConfigs = {
      'Higher or Lower': { mult: 10.0, max: 100 },
      'Word Rush':       { mult: 10.0, max: 100 },
      'Color Guess':     { mult: 0.25, max: 100 }, // score / 4
      'Math Avalanche':  { mult: 0.3333, max: 100 }, // score / 3
      'Word Gravity':    { mult: 0.3333, max: 100 }, // score / 3
      'Toy Tanks':       { mult: 0.1, max: 100 }, // score / 10
      'Pop Lock':        { mult: 10.0, max: 100 }  // each target popped = 10 XP/Coins
    };

    const config = gameConfigs[gameName] || { mult: 0.1, max: 100 };

    let baseEarned = Math.round(score * config.mult);
    
    // Ensure players get at least 10 XP/Coins if score > 0, otherwise 0
    let xpEarned = score > 0 ? Math.max(10, Math.min(config.max, baseEarned)) : 0;
    let coinsEarned = score > 0 ? Math.max(10, Math.min(config.max, baseEarned)) : 0;

    if (isDaily) {
      xpEarned += 25; // +25 XP Bonus for daily challenge run
      coinsEarned += 15; // +15 Coins Bonus for daily challenge run
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        totalPoints: increment(xpEarned), // totalPoints in DB represents total cumulative XP
        gamesPlayed: increment(1),
        playCoins: increment(coinsEarned)
      });
      console.log(`User profile stats updated: Earned +${xpEarned} XP & +${coinsEarned} Coins!`);
    } catch (e) {
      console.error("Could not update user profile stats:", e);
    }
    
    // Show premium visual success feedback displaying both XP and Coins
    if (isDaily) {
      showToast(`🚀 Daily Score saved! Earned +${xpEarned} XP ⭐ & +${coinsEarned} Coins 🪙!`, "success");
    } else {
      showToast(`🏆 Score of ${score.toLocaleString()} saved! Earned +${xpEarned} XP ⭐ & +${coinsEarned} Coins 🪙!`, "success");
    }
    
    // Refresh leaderboard if we are on the homepage
    if (document.getElementById('leaderboard-table')) {
      window.loadLeaderboard();
    }
  } catch (e) {
    console.error("Error adding score: ", e);
    showToast("❌ Failed to save score to the leaderboard.", "error");
  }
};

// --- LOAD LEADERBOARD ---
window.loadLeaderboard = async function(gameFilter = 'all') {
  const table = document.getElementById('leaderboard-table');
  if (!table) return;

  table.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">Loading live rankings...</div>';

  try {
    let rawScores = [];

    if (activeRankingsTab === 'daily') {
      const { dateString } = getDailyGame();
      const q = query(
        collection(db, "scores"),
        where("daily", "==", true),
        where("dateString", "==", dateString)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => rawScores.push(doc.data()));
    } else {
      const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(300));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => rawScores.push(doc.data()));
      
      if (gameFilter !== 'all') {
        rawScores = rawScores.filter(data => data.game === gameFilter);
      }
    }

    // Deduplicate: Keep only the highest score for each unique player (uid)
    const bestScoresMap = new Map();
    rawScores.forEach(data => {
      const existing = bestScoresMap.get(data.uid);
      if (!existing || data.score > existing.score) {
        bestScoresMap.set(data.uid, data);
      }
    });

    let allScores = Array.from(bestScoresMap.values());
    allScores.sort((a, b) => b.score - a.score);
    allScores = allScores.slice(0, 10);
    
    if (allScores.length === 0) {
      table.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">No scores yet for this board! Be the first to play.</div>';
      return;
    }

    let html = '';
    let rank = 1;
    const medals = ["🥇", "🥈", "🥉"];

    allScores.forEach((data) => {
      const rankDisplay = rank <= 3 ? medals[rank - 1] : `#${rank}`;
      const isCurrentUser = auth.currentUser && auth.currentUser.uid === data.uid;
      const escapedUsername = (data.username || "Gamer").replace(/'/g, "\\'");
      
      html += `
        <div class="lb-row ${rank <= 3 ? 'lb-row--top' : ''} ${isCurrentUser ? 'is-me' : ''}" ${isCurrentUser ? 'style="border-left: 4px solid #38BDF8;"' : ''} onclick="window.showPlayerCard('${data.uid}', '${escapedUsername}', ${data.score})">
          <span class="lb-rank">${rankDisplay}</span>
          <span class="lb-avatar">${
            data.avatar && (data.avatar.startsWith('http://') || data.avatar.startsWith('https://'))
              ? `<img src="${data.avatar}" alt="Avatar">`
              : (data.avatar || '👾')
          }</span>
          <span class="lb-user">
            ${data.username}
            ${isCurrentUser ? '<span style="font-size:0.6rem; background:#38BDF8; color:#000; padding:2px 4px; border-radius:4px; margin-left:6px; font-weight:800;">YOU</span>' : ''}
          </span>
          <span class="lb-game">${data.game}</span>
          <span class="lb-score">${data.score.toLocaleString()}</span>
        </div>
      `;
      rank++;
    });

    table.innerHTML = html;
  } catch (e) {
    console.error("Error loading leaderboard:", e);
    table.innerHTML = '<div style="text-align:center; padding:20px; color:#EF4444;">Could not load rankings.</div>';
  }
};

// --- CROWN YESTERDAY'S CHAMPION ---
async function loadYesterdayChampion() {
  const banner = document.getElementById('yesterday-champion-banner');
  const textEl = document.getElementById('yesterday-champion-text');
  if (!banner || !textEl) return;

  try {
    const yesterdayDateStr = getYesterdayDateString();
    const q = query(
      collection(db, "scores"),
      where("daily", "==", true),
      where("dateString", "==", yesterdayDateStr)
    );
    const querySnapshot = await getDocs(q);
    let allScores = [];
    querySnapshot.forEach(doc => allScores.push(doc.data()));
    
    if (allScores.length > 0) {
      allScores.sort((a, b) => b.score - a.score);
      const champ = allScores[0];
      textEl.innerHTML = `Yesterday's Champion: <strong>@${champ.username}</strong> with <strong>${champ.score.toLocaleString()}</strong> points on ${champ.game}! 👑`;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  } catch (e) {
    console.error("Error loading yesterday's champion:", e);
  }
}

// --- SETUP TABS AND LISTENERS ---
function initLeaderboard() {
  const btnDaily = document.getElementById('tab-daily-rankings');
  const btnAllTime = document.getElementById('tab-alltime-rankings');
  const lbFilter = document.getElementById('leaderboard-filter');

  if (btnDaily && btnAllTime) {
    btnDaily.addEventListener('click', () => {
      activeRankingsTab = 'daily';
      btnDaily.style.background = '#1f2937';
      btnDaily.style.color = '#38BDF8';
      btnAllTime.style.background = 'transparent';
      btnAllTime.style.color = '#94a3b8';
      if (lbFilter) lbFilter.style.display = 'none';
      window.loadLeaderboard();
    });

    btnAllTime.addEventListener('click', () => {
      activeRankingsTab = 'alltime';
      btnAllTime.style.background = '#1f2937';
      btnAllTime.style.color = '#38BDF8';
      btnDaily.style.background = 'transparent';
      btnDaily.style.color = '#94a3b8';
      if (lbFilter) lbFilter.style.display = 'block';
      window.loadLeaderboard(lbFilter ? lbFilter.value : 'all');
    });
  }

  // Load initial states
  if (document.getElementById('leaderboard-table')) {
    window.loadLeaderboard();
    loadYesterdayChampion();
  }
  
  // Register close handlers for player card modal
  initPlayerCardCloseHandlers();
}

// --- DYNAMIC GAMER CARD OVERLAY MODAL HANDLERS ---
window.showPlayerCard = async function(uid, fallbackUsername, fallbackScore) {
  const modal = document.getElementById('player-card-modal');
  if (!modal) return;

  // Add the active class to trigger fade-in transition
  modal.classList.add('active');

  const loadingSection = document.getElementById('player-card-loading');
  const loadedSection = document.getElementById('player-card-loaded');

  const cardAvatar = document.getElementById('modal-card-avatar');
  const cardUsername = document.getElementById('modal-card-username');
  const cardTagline = document.getElementById('modal-card-tagline');
  const cardFavGame = document.getElementById('modal-card-fav-game');
  const profileLevel = document.getElementById('modal-profile-level');
  const xpProgressBar = document.getElementById('modal-xp-progress-bar');
  const xpProgressText = document.getElementById('modal-xp-progress-text');
  const cardTitleBadge = document.getElementById('modal-card-title-badge');
  const gamerCard = document.getElementById('modal-gamer-card');
  const avatarRing = document.getElementById('modal-avatar-ring');
  const statPoints = document.getElementById('modal-stat-points');
  const statGames = document.getElementById('modal-stat-games');

  // Reset to loading state with default clean themes
  loadingSection.style.display = 'flex';
  loadedSection.style.display = 'none';
  gamerCard.className = 'gamer-card theme-common';
  avatarRing.className = 'avatar-ring border-common';

  let data = null;
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      data = userSnap.data();
    }
  } catch (error) {
    console.error("Error retrieving player card profile document:", error);
  }

  // Populate data using actual Firestore document or guest fallback values
  const username = (data && data.username) || fallbackUsername || "Guest Gamer";
  const tagline = (data && data.tagline) || "A mysterious guest who loves playing mini games!";
  const favGame = (data && data.favoriteGame) || "None";
  const avatar = (data && data.avatar) || "👾";
  const totalPoints = (data && typeof data.totalPoints === 'number') ? data.totalPoints : (fallbackScore || 0);
  const gamesPlayed = (data && typeof data.gamesPlayed === 'number') ? data.gamesPlayed : 1;

  const activeCosmetics = (data && data.activeCosmetics) || {};
  const activeTitle = activeCosmetics.title || "THE ROOKIE";
  const activeBorder = activeCosmetics.border || "border-common";
  const activeTheme = activeCosmetics.theme || "theme-common";

  // Set card contents
  cardUsername.innerText = username;
  cardTagline.innerText = `"${tagline}"`;
  cardFavGame.innerText = `🎯 Favorite: ${favGame}`;
  if (cardAvatar) {
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      cardAvatar.innerHTML = `<img src="${avatar}" alt="Avatar">`;
    } else {
      cardAvatar.innerText = avatar;
    }
  }
  statPoints.innerText = totalPoints.toLocaleString();
  statGames.innerText = gamesPlayed.toLocaleString();
  cardTitleBadge.innerText = activeTitle;

  // Compute gamer level progression math (Clash Royale slower quadratic curve)
  const lvlData = getLevelData(totalPoints);
 
  profileLevel.innerText = `LVL ${lvlData.level}`;
  xpProgressBar.style.width = `${lvlData.xpPercent}%`;
  xpProgressText.innerText = `${lvlData.xpProgress} / ${lvlData.xpNeeded} XP to next level`;

  // Dynamically color coordinate Slogan Badge based on rarity levels
  let badgeColor = "#94a3b8"; // common
  const legendaries = ["PLAYHAUS CHAMPION", "COSMIC DEITY", "UNBEATABLE", "HIGH SCORE LEGEND", "GOLDEN BOY", "MIDAS TOUCH", "DIAMOND HANDS"];
  const epics = ["LOGOS MAESTRO", "ARCADE GLITCHER", "VOID WALKER", "CODEBREAKER", "LAVA SURFER", "HYPERDRIVE PILOT", "QUANTUM GLITCHER"];
  const rares = ["TANKS COMMANDER", "COLOR CONNOISSEUR", "SPEEDRUNNER", "PIXEL PERFECT", "ABYSSAL GUARDIAN"];
  const uncommons = ["DAILY GRINDER", "WORD WIZARD", "REACTION CHAMP", "COIN HUNTER"];

  if (legendaries.includes(activeTitle)) badgeColor = "#F59E0B";
  else if (epics.includes(activeTitle)) badgeColor = "#A78BFA";
  else if (rares.includes(activeTitle)) badgeColor = "#38BDF8";
  else if (uncommons.includes(activeTitle)) badgeColor = "#10B981";

  cardTitleBadge.style.color = badgeColor;
  cardTitleBadge.style.borderColor = badgeColor + "33"; // 20% alpha border

  // Apply equipped layout cosmetic styles
  gamerCard.className = `gamer-card ${activeTheme}`;
  avatarRing.className = `avatar-ring ${activeBorder}`;

  // Swap spinner for loaded profile
  loadingSection.style.display = 'none';
  loadedSection.style.display = 'flex';
};

// Bind player card modal close handlers
function initPlayerCardCloseHandlers() {
  const cardModal = document.getElementById('player-card-modal');
  const btnCardClose = document.getElementById('btn-player-card-close');
  if (btnCardClose && cardModal) {
    btnCardClose.addEventListener('click', () => {
      cardModal.classList.remove('active');
    });
    cardModal.addEventListener('click', (e) => {
      if (e.target === cardModal) {
        cardModal.classList.remove('active');
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLeaderboard);
} else {
  initLeaderboard();
}
