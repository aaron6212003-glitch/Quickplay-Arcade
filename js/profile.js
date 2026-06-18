import { 
  db, 
  auth, 
  doc, 
  getDoc, 
  setDoc, 
  onAuthStateChanged, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateProfile, 
  updateDoc, 
  sendEmailVerification, 
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  updatePassword,
  updateEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  orderBy,
  limit
} from './firebase.js';

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

// --- SAFE FIRESTORE DATE PARSER ---
function parseFirestoreDate(ts) {
  let date = new Date();
  try {
    if (ts) {
      if (ts.seconds !== undefined) {
        date = new Date(ts.seconds * 1000);
      } else if (ts instanceof Date) {
        date = ts;
      } else if (typeof ts.toDate === 'function') {
        date = ts.toDate();
      } else if (typeof ts === 'string' || typeof ts === 'number') {
        date = new Date(ts);
      }
    }
  } catch (err) {
    console.error("Error parsing date, using now:", err);
  }
  return isNaN(date.getTime()) ? new Date() : date;
}

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
      let data = {};
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
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
          try {
            await setDoc(userRef, data);
          } catch (writeErr) {
            console.warn("[Playhaus Auth] Failed to write backfill user doc, ignoring:", writeErr);
          }
        }
      } catch (readErr) {
        console.warn("[Playhaus Auth] Failed to read user doc, falling back to Auth details:", readErr);
        data = {
          uid: user.uid,
          username: user.displayName || "Gamer",
          email: user.email,
          totalPoints: 0,
          gamesPlayed: 0,
          joinDate: new Date(),
          badges: ["new"]
        };
      }
      
      currentUserDoc = data;
      
      // Update Gamer Card fields
      const username = data.username || user.displayName || "Gamer";
      const tagline = data.tagline || "Ready to play some arcade games!";
      const favGame = data.favoriteGame || "None";
      const avatar = String(data.avatar || "👾");
      
      const activeCosmetics = data.activeCosmetics || {};
      const activeTitle = activeCosmetics.title || "THE ROOKIE";
      const activeBorder = activeCosmetics.border || "border-common";
      const activeTheme = activeCosmetics.theme || "theme-common";
      const activeCardAnim = activeCosmetics.card_anim || "anim-none";
      const activeFrame = activeCosmetics.frame || "frame-none";
      
      if (cardUsername) cardUsername.innerText = username;
      if (cardTagline) cardTagline.innerText = `"${tagline}"`;
      if (cardFavGame) cardFavGame.innerText = `🎯 Favorite: ${favGame}`;
      if (cardAvatar) {
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
          cardAvatar.innerHTML = `<img src="${avatar}" alt="Avatar">`;
        } else {
          cardAvatar.innerText = avatar;
        }
      }
      
      // Update custom title badge
      const titleBadge = document.getElementById('card-title-badge');
      if (titleBadge) {
        titleBadge.innerText = activeTitle;
        // Dynamically style based on rarity of equipped title
        let badgeColor = "#94a3b8"; // common
        const legendaries = ["PLAYHAUS CHAMPION", "COSMIC DEITY", "UNBEATABLE", "HIGH SCORE LEGEND", "GOLDEN BOY", "MIDAS TOUCH", "DIAMOND HANDS"];
        const epics = ["LOGOS MAESTRO", "ARCADE GLITCHER", "VOID WALKER", "CODEBREAKER", "LAVA SURFER", "HYPERDRIVE PILOT", "QUANTUM GLITCHER"];
        const rares = ["TANKS COMMANDER", "COLOR CONNOISSEUR", "SPEEDRUNNER", "PIXEL PERFECT", "ABYSSAL GUARDIAN"];
        const uncommons = ["DAILY GRINDER", "WORD WIZARD", "REACTION CHAMP", "COIN HUNTER"];
        
        if (legendaries.includes(activeTitle)) badgeColor = "#F59E0B";
        else if (epics.includes(activeTitle)) badgeColor = "#A78BFA";
        else if (rares.includes(activeTitle)) badgeColor = "#38BDF8";
        else if (uncommons.includes(activeTitle)) badgeColor = "#10B981";
        
        titleBadge.style.color = badgeColor;
        titleBadge.style.borderColor = badgeColor + "33"; // subtle border
      }
      
      // Update avatar border aura
      const avatarRing = document.querySelector('.avatar-ring');
      if (avatarRing) {
        avatarRing.className = `avatar-ring ${activeBorder}`;
      }
      
      // Update gamer card theme, card animations, and frames
      const gamerCard = document.querySelector('.gamer-card');
      if (gamerCard) {
        gamerCard.className = `gamer-card ${activeTheme} ${activeCardAnim} ${activeFrame}`;
      }
      
      // Setup edit profile button text depending on profile setup state
      const isDefaultProfile = !data.tagline && !data.avatar && (!data.favoriteGame || data.favoriteGame === "None");
      if (btnEditProfile) {
        btnEditProfile.innerText = isDefaultProfile ? "Set Up Profile" : "Edit Profile";
      }
      
      // XP & Gamer Leveling math calculations (Clash Royale slower quadratic curve)
      const totalPoints = Number(data.totalPoints) || 0;
      const lvlData = getLevelData(totalPoints);
      
      if (profileLevel) profileLevel.innerText = `LVL ${lvlData.level}`;
      if (xpProgressBar) xpProgressBar.style.width = `${lvlData.xpPercent}%`;
      if (xpProgressText) xpProgressText.innerText = `${lvlData.xpProgress} / ${lvlData.xpNeeded} XP to next level`;
      
      // Update Analytics stats
      if (pointsEl) pointsEl.innerText = totalPoints.toLocaleString();
      if (gamesEl) gamesEl.innerText = (Number(data.gamesPlayed) || 0).toLocaleString();
      
      const emailDisplay = document.getElementById('settings-email-display');
      if (emailDisplay) emailDisplay.innerText = user.email || "";
      
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
          const timeA = parseFirestoreDate(a.timestamp);
          const timeB = parseFirestoreDate(b.timestamp);
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
            "Math Avalanche": "❄️"
          };
          
          timelineContainer.innerHTML = recentScores.map(scoreItem => {
            const gameName = scoreItem.game || "Game";
            const emoji = gameEmojis[gameName] || "🎯";
            const scoreVal = Number(scoreItem.score) || 0;
            
            let date = parseFirestoreDate(scoreItem.timestamp);
            
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
      
      // ── Email Verification Rewards & Banner Loop ──
      const verifyBanner = document.getElementById('email-verify-banner');
      const verifyBtn = document.getElementById('btn-verify-email');
      
      if (verifyBanner && verifyBtn) {
        if (user.emailVerified) {
          // If email is verified but they haven't claimed the 100 Gems reward yet
          if (currentUserDoc.emailVerifiedRewardClaimed !== true) {
            try {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                scrap: (currentUserDoc.scrap || 0) + 100,
                emailVerifiedRewardClaimed: true
              });
              currentUserDoc.scrap = (currentUserDoc.scrap || 0) + 100;
              currentUserDoc.emailVerifiedRewardClaimed = true;
              showToast("🎉 Email verified! +100 Gems claimed successfully! 💎", "success");
            } catch (err) {
              console.error("Error claiming verification reward:", err);
            }
          }
          verifyBanner.style.display = 'none';
        } else {
          // Email is not verified and they haven't claimed the reward
          if (currentUserDoc.emailVerifiedRewardClaimed !== true) {
            verifyBanner.style.display = 'flex';
            
            // Avoid duplicate listeners
            const newVerifyBtn = verifyBtn.cloneNode(true);
            verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
            
            newVerifyBtn.addEventListener('click', async () => {
              newVerifyBtn.disabled = true;
              newVerifyBtn.innerText = "Sending...";
              try {
                await sendEmailVerification(user);
                showToast("✉️ Verification email sent! Check your inbox/spam folder.", "success");
                newVerifyBtn.innerText = "Check Inbox 📥";
              } catch (err) {
                console.error("Error sending verification email:", err);
                showToast("❌ Failed to send verification link. Try again later.", "error");
                newVerifyBtn.disabled = false;
                newVerifyBtn.innerText = "Verify Email";
              }
            });
          } else {
            verifyBanner.style.display = 'none';
          }
        }
      }

      // Toggle visibility from loading overlay to profile panels
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (profileContent) profileContent.style.display = 'grid';
      
    } catch (e) {
      console.error("Error loading profile details:", e);
      if (loadingOverlay) {
        loadingOverlay.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #EF4444; font-family: 'Outfit', sans-serif;">
            <h3 style="font-size: 1.5rem; font-weight: 900; margin-bottom: 8px;">Error Loading Profile</h3>
            <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px; color: #fff;">${e.message}</p>
            <pre style="text-align: left; font-size: 0.75rem; background: rgba(0,0,0,0.5); padding: 12px; border-radius: 8px; overflow-x: auto; max-width: 90vw; margin: 15px auto; line-height: 1.4; white-space: pre-wrap; word-break: break-all; color: #94a3b8; border: 1px solid rgba(255,255,255,0.08);">${e.stack || e}</pre>
            <button class="btn btn--outline" onclick="window.location.reload()" style="margin-top: 15px; border-color: rgba(255,255,255,0.2); color: #fff; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 700; background: transparent;">Retry</button>
          </div>
        `;
      }
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
      if (cardAvatar) {
        if (selectedAvatar.startsWith('http://') || selectedAvatar.startsWith('https://')) {
          cardAvatar.innerHTML = `<img src="${selectedAvatar}" alt="Avatar">`;
        } else {
          cardAvatar.innerText = selectedAvatar;
        }
      }
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

// ── FIREBASE STORAGE CUSTOM AVATAR UPLOAD SYSTEM ──
function initAvatarUpload() {
  const dropzone = document.getElementById('avatar-upload-dropzone');
  const fileInput = document.getElementById('avatar-upload-input');
  const uploadIcon = document.getElementById('avatar-upload-icon');
  const uploadText = document.getElementById('avatar-upload-text');
  const progressContainer = document.getElementById('avatar-upload-progress');
  const progressBar = document.getElementById('avatar-upload-progress-bar');

  if (!dropzone || !fileInput) return;

  // Click to open file dialog
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag over styling
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragging');
  });

  // Drag leave styling
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragging');
  });

  // Drop handler
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragging');
    if (e.dataTransfer.files.length > 0) {
      handleAvatarFile(e.dataTransfer.files[0]);
    }
  });

  // File input change handler
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleAvatarFile(e.target.files[0]);
    }
  });

  // Upload handler logic
  async function handleAvatarFile(file) {
    const user = auth.currentUser;
    if (!user) {
      showToast("You must be logged in to upload avatars!", "error");
      return;
    }

    // Size limit check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image size exceeds 2MB limit!", "error");
      return;
    }

    // Format type check
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Invalid format! Please upload PNG, JPG, or WebP.", "error");
      return;
    }

    // Visual loading state
    uploadIcon.innerText = "⏳";
    uploadText.innerText = "Uploading Image...";
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '10%';

    try {
      // Import storage functions from ./firebase.js dynamically or directly
      const storageRef = ref(storage, `avatars/${user.uid}`);
      
      // Simulate fast progress loading
      let progress = 10;
      const interval = setInterval(() => {
        if (progress < 90) {
          progress += 15;
          if (progressBar) progressBar.style.width = `${progress}%`;
        }
      }, 200);

      // Perform actual upload
      await uploadBytes(storageRef, file);
      clearInterval(interval);
      if (progressBar) progressBar.style.width = '100%';

      const downloadUrl = await getDownloadURL(storageRef);

      // Update Local preview and equip selection instantly
      selectedAvatar = downloadUrl;
      
      // Clear selected classes from emoji options in the grid
      const items = document.querySelectorAll('.avatar-item');
      items.forEach(item => item.classList.remove('selected'));

      // Complete visual state
      uploadIcon.innerText = "✅";
      uploadText.innerText = "Image Uploaded successfully!";
      showToast("Custom avatar uploaded! Click 'Save Changes' to equip it. 📷", "success");

      setTimeout(() => {
        uploadIcon.innerText = "📷";
        uploadText.innerText = "Click or Drop Image Here";
        if (progressContainer) progressContainer.style.display = 'none';
        if (progressBar) progressBar.style.width = '0%';
      }, 3000);

    } catch (err) {
      console.error("Firebase Storage Upload Error:", err);
      uploadIcon.innerText = "📷";
      uploadText.innerText = "Click or Drop Image Here";
      showToast("Failed to upload image. Please try again.", "error");
      if (progressContainer) progressContainer.style.display = 'none';
    }
  }
}

// Bind upload system
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAvatarUpload);
} else {
  initAvatarUpload();
}

// ── Hamburger Menu Toggle ───────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

// ── ACCOUNT SETTINGS & ADMINISTRATION PANEL SYSTEM ───────────────────────────
function initAccountSettings() {
  // Modal Elements
  const updateEmailModal = document.getElementById('update-email-modal');
  const updatePasswordModal = document.getElementById('update-password-modal');
  const reauthModal = document.getElementById('reauth-modal');

  // Trigger Buttons
  const btnChangeEmail = document.getElementById('btn-change-email');
  const btnChangePassword = document.getElementById('btn-change-password');
  const btnDeleteAccountTrigger = document.getElementById('btn-delete-account-trigger');

  // Close Buttons
  const btnEmailModalClose = document.getElementById('btn-email-modal-close');
  const btnPasswordModalClose = document.getElementById('btn-password-modal-close');
  const btnReauthModalClose = document.getElementById('btn-reauth-modal-close');

  // Input Fields
  const inputNewEmail = document.getElementById('input-new-email');
  const inputNewPassword = document.getElementById('input-new-password');
  const inputConfirmNewPassword = document.getElementById('input-confirm-new-password');
  const inputReauthPassword = document.getElementById('input-reauth-password');

  // Action Buttons
  const btnSaveNewEmail = document.getElementById('btn-save-new-email');
  const btnSaveNewPassword = document.getElementById('btn-save-new-password');
  const btnReauthSubmit = document.getElementById('btn-reauth-submit');
  const reauthDesc = document.getElementById('reauth-modal-description');

  if (!btnChangeEmail) return; // Exit if not on profile page

  // Reauth context state variables
  let currentReauthAction = ""; // "email", "password", or "delete"
  let currentReauthPayload = "";

  // 1. Show Email Modal
  btnChangeEmail.addEventListener('click', () => {
    if (inputNewEmail) inputNewEmail.value = "";
    if (updateEmailModal) updateEmailModal.style.display = 'flex';
  });

  if (btnEmailModalClose) {
    btnEmailModalClose.addEventListener('click', () => {
      if (updateEmailModal) updateEmailModal.style.display = 'none';
    });
  }

  // 2. Show Password Modal
  btnChangePassword.addEventListener('click', () => {
    if (inputNewPassword) inputNewPassword.value = "";
    if (inputConfirmNewPassword) inputConfirmNewPassword.value = "";
    if (updatePasswordModal) updatePasswordModal.style.display = 'flex';
  });

  if (btnPasswordModalClose) {
    btnPasswordModalClose.addEventListener('click', () => {
      if (updatePasswordModal) updatePasswordModal.style.display = 'none';
    });
  }

  // 3. Close Reauth Modal
  if (btnReauthModalClose) {
    btnReauthModalClose.addEventListener('click', () => {
      if (reauthModal) reauthModal.style.display = 'none';
    });
  }

  // 4. Trigger Reauth for Email Update
  if (btnSaveNewEmail) {
    btnSaveNewEmail.addEventListener('click', () => {
      const newEmail = inputNewEmail.value.trim();
      if (!newEmail || !newEmail.includes('@')) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
      currentReauthAction = "email";
      currentReauthPayload = newEmail;
      if (reauthDesc) {
        reauthDesc.innerText = "For your security, please verify your current password before updating your registered email address.";
      }
      if (inputReauthPassword) inputReauthPassword.value = "";
      if (reauthModal) reauthModal.style.display = 'flex';
    });
  }

  // 5. Trigger Reauth for Password Update
  if (btnSaveNewPassword) {
    btnSaveNewPassword.addEventListener('click', () => {
      const newPass = inputNewPassword.value;
      const confirmPass = inputConfirmNewPassword.value;
      
      if (newPass.length < 6) {
        showToast("New password must be at least 6 characters.", "error");
        return;
      }
      if (newPass !== confirmPass) {
        showToast("Passwords do not match!", "error");
        return;
      }
      currentReauthAction = "password";
      currentReauthPayload = newPass;
      if (reauthDesc) {
        reauthDesc.innerText = "For your security, please verify your current password before changing your password credentials.";
      }
      if (inputReauthPassword) inputReauthPassword.value = "";
      if (reauthModal) reauthModal.style.display = 'flex';
    });
  }

  // 6. Trigger Reauth for Account Deletion
  btnDeleteAccountTrigger.addEventListener('click', () => {
    currentReauthAction = "delete";
    currentReauthPayload = "";
    if (reauthDesc) {
      reauthDesc.innerHTML = `<span style="color: #EF4444; font-weight: 800;">⚠️ WARNING:</span> You are about to permanently delete your Playhaus account, match timeline history, and Firestore records. This is irreversible. Please verify your password to proceed.`;
    }
    if (inputReauthPassword) inputReauthPassword.value = "";
    if (reauthModal) reauthModal.style.display = 'flex';
  });

  // 7. Handle Re-Authentication & Action Execution
  if (btnReauthSubmit) {
    btnReauthSubmit.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user) return;

      const password = inputReauthPassword.value;
      if (!password) {
        showToast("Password cannot be empty!", "error");
        return;
      }

      btnReauthSubmit.innerText = "Verifying...";
      btnReauthSubmit.disabled = true;

      try {
        // Step 1: Re-authenticate session
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        console.log("[Playhaus Admin] Security check passed. Executing: " + currentReauthAction);

        // Step 2: Execute requested security action
        if (currentReauthAction === "email") {
          await updateEmail(user, currentReauthPayload);
          // Sync with Firestore
          await updateDoc(doc(db, "users", user.uid), { email: currentReauthPayload });
          if (currentUserDoc) currentUserDoc.email = currentReauthPayload;
          
          showToast("📧 Registered email updated successfully!", "success");
          
          const emailDisplay = document.getElementById('settings-email-display');
          if (emailDisplay) emailDisplay.innerText = currentReauthPayload;
          
          if (updateEmailModal) updateEmailModal.style.display = 'none';
          if (reauthModal) reauthModal.style.display = 'none';

        } else if (currentReauthAction === "password") {
          await updatePassword(user, currentReauthPayload);
          showToast("🔑 Password updated successfully!", "success");
          
          if (updatePasswordModal) updatePasswordModal.style.display = 'none';
          if (reauthModal) reauthModal.style.display = 'none';

        } else if (currentReauthAction === "delete") {
          // Perform full data scrubbing deletion
          if (reauthModal) reauthModal.style.display = 'none';
          if (loadingOverlay) {
            loadingOverlay.innerHTML = `<div style="text-align: center;"><div class="loading-spinner"></div><div>Scrubbing account data...</div></div>`;
            loadingOverlay.style.display = 'flex';
          }

          const uid = user.uid;

          // 1. Delete Firestore user document
          await deleteDoc(doc(db, "users", uid));

          // 2. Query and delete all scores belonging to this user
          const scoresQuery = query(collection(db, "scores"), where("uid", "==", uid));
          const scoresSnap = await getDocs(scoresQuery);
          const deletePromises = [];
          scoresSnap.forEach(sDoc => {
            deletePromises.push(deleteDoc(sDoc.ref));
          });
          await Promise.all(deletePromises);

          // 3. Delete avatar from Firebase Storage if custom image
          try {
            if (currentUserDoc && currentUserDoc.avatar && currentUserDoc.avatar.includes("firebasestorage")) {
              const avatarRef = ref(storage, `avatars/${uid}`);
              await deleteObject(avatarRef);
            }
          } catch (avatarError) {
            console.log("No custom avatar to scrub or deletion skipped:", avatarError);
          }

          // 4. Delete the Firebase Auth User
          await deleteUser(user);

          if (loadingOverlay) loadingOverlay.style.display = 'none';
          showToast("🚪 Account permanently deleted. We're sorry to see you go!", "success");
          
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
        }

      } catch (err) {
        console.error("Administrative action failed:", err);
        let errorMsgText = "Security verification failed. Please try again.";
        if (err.code === "auth/wrong-password") {
          errorMsgText = "Incorrect password! Verification failed.";
        } else if (err.code === "auth/invalid-credential" || err.code === "auth/invalid-email") {
          errorMsgText = "Invalid credentials. Please verify your password.";
        }
        showToast("❌ " + errorMsgText, "error");
      } finally {
        btnReauthSubmit.innerText = "Confirm Identity";
        btnReauthSubmit.disabled = false;
      }
    });
  }
}

// Bind Settings Panel
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccountSettings);
} else {
  initAccountSettings();
}



