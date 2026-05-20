import { db, auth, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, increment, where } from './firebase.js';
import { getDailyGame, getYesterdayDateString } from './daily.js';

let activeRankingsTab = 'daily'; // 'daily' or 'alltime'

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

    // 1. Add score to the global scores collection
    await addDoc(collection(db, "scores"), {
      uid: user.uid,
      username: user.displayName || "Unknown Player",
      game: gameName,
      score: score,
      timestamp: new Date(),
      daily: isDaily,
      dateString: dateString
    });
    
    // 2. Update the user's personal profile stats
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        totalPoints: increment(score),
        gamesPlayed: increment(1)
      });
      console.log("User profile stats updated!");
    } catch (e) {
      console.error("Could not update user profile stats:", e);
    }
    
    // Show premium visual success feedback
    if (isDaily) {
      showToast(`🚀 Score of ${score.toLocaleString()} saved to Today's Daily Challenge!`, "success");
    } else {
      showToast(`🏆 Score of ${score.toLocaleString()} saved to All-Time rankings!`, "success");
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
      
      html += `
        <div class="lb-row ${rank <= 3 ? 'lb-row--top' : ''} ${isCurrentUser ? 'is-me' : ''}" ${isCurrentUser ? 'style="border-left: 4px solid #38BDF8;"' : ''}>
          <span class="lb-rank">${rankDisplay}</span>
          <span class="lb-avatar">👾</span>
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLeaderboard);
} else {
  initLeaderboard();
}
