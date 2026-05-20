import { db, auth, doc, getDoc, setDoc, onAuthStateChanged, collection, query, where, getDocs, updateProfile } from './firebase.js';

// DOM selection
const loadingOverlay = document.getElementById('profile-loading');
const profileContent = document.getElementById('profile-content');

// Left Column elements
const cardAvatar = document.getElementById('card-avatar');
const cardUsername = document.getElementById('card-username');
const cardTagline = document.getElementById('card-tagline');
const cardFavGame = document.getElementById('card-fav-game');
const profileLevel = document.getElementById('profile-level');
const xpProgressBar = document.getElementById('xp-progress-bar');
const xpProgressText = document.getElementById('xp-progress-text');
const btnEditProfile = document.getElementById('btn-edit-profile');

// Stats elements
const pointsEl = document.getElementById('stat-points');
const gamesEl = document.getElementById('stat-games');
const rankEl = document.getElementById('stat-rank');

// Timeline container
const timelineContainer = document.getElementById('timeline-container');

// Achievements badge cards
const badgeRookie = document.getElementById('badge-rookie');
const badgePioneer = document.getElementById('badge-pioneer');
const badgeHigherPower = document.getElementById('badge-higher-power');
const badgeLogosExpert = document.getElementById('badge-logos-expert');
const badgeTanksVet = document.getElementById('badge-tanks-vet');
const badgeGamerElite = document.getElementById('badge-gamer-elite');

// Modal elements
const editModal = document.getElementById('edit-profile-modal');
const btnEditModalClose = document.getElementById('btn-edit-modal-close');
const modalAvatarGrid = document.getElementById('modal-avatar-grid');
const modalInputUsername = document.getElementById('modal-input-username');
const modalInputTagline = document.getElementById('modal-input-tagline');
const modalSelectFav = document.getElementById('modal-select-fav');
const btnEditModalSave = document.getElementById('btn-edit-modal-save');

let currentUserDoc = null;
let selectedAvatar = "👾"; // default

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
    toast.style.borderLeft = '4px solid #38BDF8';
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
  }, 4000);
}

// --- SELECT AVATAR FROM GRID ---
const avatarItems = document.querySelectorAll('.avatar-item');
avatarItems.forEach(item => {
  item.addEventListener('click', () => {
    avatarItems.forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    selectedAvatar = item.getAttribute('data-val');
  });
});

// --- AUTH STATE LISTENER & DATASYNC ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      let data = {};
      if (userSnap.exists()) {
        data = userSnap.data();
      } else {
        // Backfill if document does not exist yet
        data = {
          uid: user.uid,
          username: user.displayName || "Gamer",
          email: user.email,
          totalPoints: 0,
          gamesPlayed: 0,
          joinDate: new Date(),
          badges: ["new"]
        };
        await setDoc(userRef, data);
      }
      
      currentUserDoc = data;
      
      // Update Gamer Card fields
      const username = data.username || user.displayName || "Gamer";
      const tagline = data.tagline || "Ready to play some arcade games!";
      const favGame = data.favoriteGame || "None";
      const avatar = data.avatar || "👾";
      
      if (cardUsername) cardUsername.innerText = username;
      if (cardTagline) cardTagline.innerText = `"${tagline}"`;
      if (cardFavGame) cardFavGame.innerText = `🎯 Favorite: ${favGame}`;
      if (cardAvatar) cardAvatar.innerText = avatar;
      
      // Setup edit profile button text depending on profile setup state
      const isDefaultProfile = !data.tagline && !data.avatar && (!data.favoriteGame || data.favoriteGame === "None");
      if (btnEditProfile) {
        btnEditProfile.innerText = isDefaultProfile ? "Set Up Profile" : "Edit Profile";
      }
      
      // XP & Gamer Leveling math calculations
      const totalPoints = data.totalPoints || 0;
      const level = Math.floor(Math.sqrt(totalPoints / 10)) + 1;
      const xpForCurrentLevel = Math.pow(level - 1, 2) * 10;
      const xpForNextLevel = Math.pow(level, 2) * 10;
      const xpNeeded = xpForNextLevel - xpForCurrentLevel;
      const xpProgress = totalPoints - xpForCurrentLevel;
      const xpPercent = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));
      
      if (profileLevel) profileLevel.innerText = `LVL ${level}`;
      if (xpProgressBar) xpProgressBar.style.width = `${xpPercent}%`;
      if (xpProgressText) xpProgressText.innerText = `${xpProgress} / ${xpNeeded} XP to next level`;
      
      // Update Analytics stats
      if (pointsEl) pointsEl.innerText = totalPoints.toLocaleString();
      if (gamesEl) gamesEl.innerText = (data.gamesPlayed || 0).toLocaleString();
      
      // Query score history timeline dynamically without requiring composite indexes
      let scores = [];
      try {
        const scoresQuery = query(collection(db, "scores"), where("uid", "==", user.uid));
        const scoresSnap = await getDocs(scoresQuery);
        scoresSnap.forEach(sDoc => {
          scores.push(sDoc.data());
        });
        
        // Sort in memory by timestamp descending
        scores.sort((a, b) => {
          const timeA = a.timestamp ? (a.timestamp.seconds ? new Date(a.timestamp.seconds * 1000) : a.timestamp.toDate()) : new Date(0);
          const timeB = b.timestamp ? (b.timestamp.seconds ? new Date(b.timestamp.seconds * 1000) : b.timestamp.toDate()) : new Date(0);
          return timeB - timeA;
        });
      } catch (scoreError) {
        console.error("Error fetching score history:", scoreError);
      }
      
      // Render Matches Timeline
      if (timelineContainer) {
        const recentScores = scores.slice(0, 5);
        if (recentScores.length === 0) {
          timelineContainer.innerHTML = `
            <div style="color: #64748b; font-size: 0.95rem; text-align: center; padding: 20px;">
              No match history yet. Go play some games! 🎮
            </div>
          `;
        } else {
          const gameEmojis = {
            "Higher or Lower": "📊",
            "Color Guess": "🎨",
            "Toy Tanks": "🚜",
            "Word Rush": "📝",
            "Word Gravity": "🪐",
            "Math Avalanche": "❄️",
            "Neon Plinko": "🟢",
            "Cyber Bot": "🤖"
          };
          
          timelineContainer.innerHTML = recentScores.map(scoreItem => {
            const gameName = scoreItem.game || "Game";
            const emoji = gameEmojis[gameName] || "🎯";
            const scoreVal = scoreItem.score || 0;
            
            let date = new Date();
            if (scoreItem.timestamp) {
              date = scoreItem.timestamp.seconds ? new Date(scoreItem.timestamp.seconds * 1000) : scoreItem.timestamp.toDate();
            }
            
            const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ", " + 
                            date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            
            return `
              <div class="timeline-item">
                <div class="timeline-game-icon">${emoji}</div>
                <div class="timeline-details">
                  <div class="timeline-game-title">${gameName}</div>
                  <div class="timeline-time">${dateStr} ${scoreItem.daily ? '<span style="color:#EC4899; font-weight:800; font-size:0.65rem; margin-left:4px; text-transform:uppercase;">DAILY</span>' : ''}</div>
                </div>
                <div class="timeline-score">+${scoreVal.toLocaleString()}</div>
              </div>
            `;
          }).join('');
        }
      }
      
      // Achievements Unlock Engine
      const userBadges = data.badges || [];
      
      const hasRookie = !isDefaultProfile || userBadges.includes("rookie") || userBadges.includes("new");
      const hasPioneer = userBadges.includes("pioneer") || scores.some(s => s.daily === true);
      const hasHigherPower = scores.some(s => s.game === "Higher or Lower" && s.score >= 10);
      const hasLogosExpert = scores.some(s => s.game === "Color Guess" && s.score >= 5);
      const hasTanksVet = scores.some(s => s.game === "Toy Tanks" && s.score > 0);
      const hasGamerElite = totalPoints >= 500;
      
      const toggleBadge = (badgeEl, condition) => {
        if (!badgeEl) return;
        if (condition) {
          badgeEl.classList.add('unlocked');
        } else {
          badgeEl.classList.remove('unlocked');
        }
      };
      
      toggleBadge(badgeRookie, hasRookie);
      toggleBadge(badgePioneer, hasPioneer);
      toggleBadge(badgeHigherPower, hasHigherPower);
      toggleBadge(badgeLogosExpert, hasLogosExpert);
      toggleBadge(badgeTanksVet, hasTanksVet);
      toggleBadge(badgeGamerElite, hasGamerElite);
      
      // Global Rank Estimation
      try {
        const qRank = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(50));
        const qSnap = await getDocs(qRank);
        let rank = -1;
        let currentRank = 1;
        qSnap.forEach(d => {
          if (d.id === user.uid) rank = currentRank;
          currentRank++;
        });
        
        if (rankEl) {
          if (rank > 0) {
            rankEl.innerText = `#${rank}`;
          } else {
            rankEl.innerText = "50+";
          }
        }
      } catch (rankError) {
        console.error("Error calculating rank:", rankError);
        if (rankEl) rankEl.innerText = "#?";
      }
      
      // Toggle visibility from loading overlay to profile panels
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (profileContent) profileContent.style.display = 'grid';
      
    } catch (e) {
      console.error("Error loading profile details:", e);
      if (loadingOverlay) loadingOverlay.innerText = "Error loading gamer profile. Please refresh.";
    }
  } else {
    // Show premium "Access Denied" call to action
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="text-align:center; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <h2 style="font-size: 2.2rem; font-weight: 900; color: #fff; margin-bottom: 12px; background: linear-gradient(135deg, #FF6B6B, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Access Denied</h2>
          <p style="font-size:1.1rem; color:#94a3b8; margin-top:10px; margin-bottom: 30px; max-width: 340px; line-height: 1.6;">You must be logged in to view your gamer profile, customize avatars, and unlock arcade achievements.</p>
          <button class="btn btn--primary btn--lg pulse-ring" id="btn-profile-login-trigger" style="border-radius: 50px;">Log In / Sign Up</button>
        </div>
      `;
      const btnProfileLogin = document.getElementById('btn-profile-login-trigger');
      if (btnProfileLogin) {
        btnProfileLogin.addEventListener('click', () => {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.style.display = 'flex';
        });
      }
    }
  }
});

// --- EDIT MODAL INTERACTION ---

// Open Edit Profile Modal
if (btnEditProfile) {
  btnEditProfile.addEventListener('click', () => {
    if (!currentUserDoc) return;
    
    const currentUsername = currentUserDoc.username || auth.currentUser.displayName || "";
    const currentTagline = currentUserDoc.tagline || "";
    const currentFav = currentUserDoc.favoriteGame || "None";
    const currentAvatar = currentUserDoc.avatar || "👾";
    
    if (modalInputUsername) modalInputUsername.value = currentUsername;
    if (modalInputTagline) modalInputTagline.value = currentTagline;
    if (modalSelectFav) modalSelectFav.value = currentFav;
    
    // Set selected avatar in picker grid
    selectedAvatar = currentAvatar;
    const items = document.querySelectorAll('.avatar-item');
    items.forEach(item => {
      if (item.getAttribute('data-val') === currentAvatar) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    if (editModal) editModal.style.display = 'flex';
  });
}

// Close Edit Profile Modal
if (btnEditModalClose) {
  btnEditModalClose.addEventListener('click', () => {
    if (editModal) editModal.style.display = 'none';
  });
}

if (editModal) {
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.style.display = 'none';
    }
  });
}

// Save Changes Handler
if (btnEditModalSave) {
  btnEditModalSave.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const usernameVal = modalInputUsername.value.trim();
    const taglineVal = modalInputTagline.value.trim();
    const favGameVal = modalSelectFav.value;
    
    if (!usernameVal) {
      showToast("Gamer Name cannot be empty!", "error");
      return;
    }
    
    btnEditModalSave.innerText = "Saving...";
    btnEditModalSave.disabled = true;
    
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Update badges local state parity
      let updatedBadges = currentUserDoc.badges || [];
      if (!updatedBadges.includes("rookie")) {
        updatedBadges.push("rookie");
      }
      
      const updatedData = {
        username: usernameVal,
        tagline: taglineVal,
        favoriteGame: favGameVal,
        avatar: selectedAvatar,
        badges: updatedBadges
      };
      
      // Save to Firestore
      await setDoc(userRef, updatedData, { merge: true });
      
      // Sync display name to Firebase Auth profile
      await updateProfile(user, { displayName: usernameVal });
      
      // Update local state
      currentUserDoc = {
        ...currentUserDoc,
        ...updatedData
      };
      
      // Update Gamer Card instantly
      if (cardUsername) cardUsername.innerText = usernameVal;
      if (cardTagline) cardTagline.innerText = `"${taglineVal}"`;
      if (cardFavGame) cardFavGame.innerText = `🎯 Favorite: ${favGameVal}`;
      if (cardAvatar) cardAvatar.innerText = selectedAvatar;
      if (btnEditProfile) btnEditProfile.innerText = "Edit Profile";
      
      // Trigger instant unlock of Rookie achievement in the DOM
      if (badgeRookie) badgeRookie.classList.add('unlocked');
      
      // Dynamic welcome tag sync on top navigation
      const navUserText = document.querySelector('#auth-container span[style*="color:#38BDF8;"], #auth-container span[style*="color: rgb(56, 189, 248)"]');
      if (navUserText) navUserText.innerText = usernameVal;
      
      // Success feedback
      if (editModal) editModal.style.display = 'none';
      showToast("Gamer Profile updated successfully! 🚀", "success");
      
    } catch (saveError) {
      console.error("Error updating profile changes:", saveError);
      showToast("Failed to save changes. Try again.", "error");
    } finally {
      btnEditModalSave.innerText = "Save Changes";
      btnEditModalSave.disabled = false;
    }
  });
}
