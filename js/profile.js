import { db, auth, doc, getDoc, onAuthStateChanged, collection, query, orderBy, limit, getDocs } from './firebase.js';

const loadingOverlay = document.getElementById('profile-loading');
const profileContent = document.getElementById('profile-content');
const usernameEl = document.getElementById('profile-username');
const joinedEl = document.getElementById('profile-joined');
const pointsEl = document.getElementById('stat-points');
const gamesEl = document.getElementById('stat-games');
const rankEl = document.getElementById('stat-rank');
const badgesContainer = document.getElementById('badges-container');

// Map badge IDs to display text/emojis
const badgeDict = {
  "new": "👶 Rookie",
  "pioneer": "⭐ Pioneer",
  "trending": "🔥 Trending",
  "hot": "🌶️ Hot Player"
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        usernameEl.innerText = data.username || "Player";
        
        // Format date
        if (data.joinDate) {
          const date = data.joinDate.toDate();
          joinedEl.innerText = `Joined: ${date.toLocaleDateString()}`;
        }
        
        pointsEl.innerText = (data.totalPoints || 0).toLocaleString();
        gamesEl.innerText = (data.gamesPlayed || 0).toLocaleString();
        
        // Render badges
        const badges = data.badges || [];
        if (badges.length > 0) {
          badgesContainer.innerHTML = badges.map(b => 
            `<div class="profile-badge">${badgeDict[b] || b}</div>`
          ).join('');
        } else {
          badgesContainer.innerHTML = '<div style="color:#94a3b8;">No badges yet. Keep playing!</div>';
        }
        
        // Calculate Global Rank (Estimating by fetching top 50 users by totalPoints)
        // Note: For large apps, this is inefficient and should be done via Cloud Functions
        const q = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(50));
        const qSnap = await getDocs(q);
        let rank = -1;
        let currentRank = 1;
        qSnap.forEach(doc => {
          if (doc.id === user.uid) rank = currentRank;
          currentRank++;
        });
        
        if (rank > 0) {
          rankEl.innerText = `#${rank}`;
        } else {
          rankEl.innerText = "50+";
        }
        
        loadingOverlay.style.display = 'none';
        profileContent.style.display = 'block';
      } else {
        // If they logged in but don't have a user doc yet (e.g. edge case during signup)
        usernameEl.innerText = user.displayName || "Player";
        loadingOverlay.style.display = 'none';
        profileContent.style.display = 'block';
      }
      
    } catch (e) {
      console.error("Error fetching profile:", e);
      loadingOverlay.innerText = "Error loading profile.";
    }
  } else {
    // Not logged in
    loadingOverlay.innerHTML = '<div style="text-align:center;"><h2>Please Log In</h2><p style="font-size:1rem; color:#94a3b8; margin-top:10px;">You must be logged in to view your profile.</p></div>';
  }
});
