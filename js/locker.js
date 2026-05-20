import { db, auth, doc, getDoc, setDoc, updateDoc } from './firebase.js';
import { onAuthStateChanged } from './firebase.js';

// --- COSMETICS DEFINITION SYSTEM ---
const COSMETICS = [
  // Avatars (Emojis)
  { id: "avatar:👾", type: "avatar", name: "Cyber Alien", val: "👾", rarity: "common" },
  { id: "avatar:🛡️", type: "avatar", name: "Arcade Shield", val: "🛡️", rarity: "common" },
  { id: "avatar:🎮", type: "avatar", name: "Retro Pad", val: "🎮", rarity: "common" },
  { id: "avatar:🐱", type: "avatar", name: "Arcade Cat", val: "🐱", rarity: "common" },
  { id: "avatar:🚀", type: "avatar", name: "Space Rider", val: "🚀", rarity: "uncommon" },
  { id: "avatar:🛸", type: "avatar", name: "UFO Invader", val: "🛸", rarity: "uncommon" },
  { id: "avatar:🐯", type: "avatar", name: "Cyber Tiger", val: "🐯", rarity: "uncommon" },
  { id: "avatar:🤖", type: "avatar", name: "Cyber Bot", val: "🤖", rarity: "uncommon" },
  { id: "avatar:👻", type: "avatar", name: "Neon Ghost", val: "👻", rarity: "rare" },
  { id: "avatar:🦄", type: "avatar", name: "Neon Unicorn", val: "🦄", rarity: "rare" },
  { id: "avatar:🦊", type: "avatar", name: "Cyber Fox", val: "🦊", rarity: "rare" },
  { id: "avatar:💀", type: "avatar", name: "Pixel Skull", val: "💀", rarity: "rare" },
  { id: "avatar:🐉", type: "avatar", name: "Holo Dragon", val: "🐉", rarity: "epic" },
  { id: "avatar:🧙‍♂️", type: "avatar", name: "Arcade Mage", val: "🧙‍♂️", rarity: "epic" },
  { id: "avatar:⚡", type: "avatar", name: "Lightning Sprite", val: "⚡", rarity: "epic" },
  { id: "avatar:👹", type: "avatar", name: "Oni Demon", val: "👹", rarity: "epic" },
  { id: "avatar:👑", type: "avatar", name: "Golden Emperor", val: "👑", rarity: "legendary" },
  { id: "avatar:🌌", type: "avatar", name: "Cosmic Nebula", val: "🌌", rarity: "legendary" },
  { id: "avatar:🧿", type: "avatar", name: "Stardust Eye", val: "🧿", rarity: "legendary" },
  { id: "avatar:🦖", type: "avatar", name: "Robo T-Rex", val: "🦖", rarity: "legendary" },

  // Avatar Borders (CSS auras)
  { id: "border:border-common", type: "border", name: "Slate Ring", val: "border-common", rarity: "common" },
  { id: "border:border-uncommon", type: "border", name: "Green Aura", val: "border-uncommon", rarity: "uncommon" },
  { id: "border:border-rare", type: "border", name: "Cyan Frost", val: "border-rare", rarity: "rare" },
  { id: "border:border-epic", type: "border", name: "Synth Pulse", val: "border-epic", rarity: "epic" },
  { id: "border:border-legendary", type: "border", name: "Cosmic Flame", val: "border-legendary", rarity: "legendary" },

  // Themes (Card background visual styles)
  { id: "theme:theme-common", type: "theme", name: "Default Glass", val: "theme-common", rarity: "common" },
  { id: "theme:theme-uncommon", type: "theme", name: "Cyber Grid", val: "theme-uncommon", rarity: "uncommon" },
  { id: "theme:theme-rare", type: "theme", name: "Frozen Aurora", val: "theme-rare", rarity: "rare" },
  { id: "theme:theme-epic", type: "theme", name: "Retro Synthwave", val: "theme-epic", rarity: "epic" },
  { id: "theme:theme-legendary", type: "theme", name: "Nebula Storm", val: "theme-legendary", rarity: "legendary" },

  // Titles (Slogan tags)
  { id: "title:THE ROOKIE", type: "title", name: "THE ROOKIE", val: "THE ROOKIE", rarity: "common" },
  { id: "title:BUTTON MASHER", type: "title", name: "BUTTON MASHER", val: "BUTTON MASHER", rarity: "common" },
  { id: "title:DAILY GRINDER", type: "title", name: "DAILY GRINDER", val: "DAILY GRINDER", rarity: "uncommon" },
  { id: "title:WORD WIZARD", type: "title", name: "WORD WIZARD", val: "WORD WIZARD", rarity: "uncommon" },
  { id: "title:TANKS COMMANDER", type: "title", name: "TANKS COMMANDER", val: "TANKS COMMANDER", rarity: "rare" },
  { id: "title:COLOR CONNOISSEUR", type: "title", name: "COLOR CONNOISSEUR", val: "COLOR CONNOISSEUR", rarity: "rare" },
  { id: "title:LOGOS MAESTRO", type: "title", name: "LOGOS MAESTRO", val: "LOGOS MAESTRO", rarity: "epic" },
  { id: "title:ARCADE GLITCHER", type: "title", name: "ARCADE GLITCHER", val: "ARCADE GLITCHER", rarity: "epic" },
  { id: "title:PLAYHAUS CHAMPION", type: "title", name: "PLAYHAUS CHAMPION", val: "PLAYHAUS CHAMPION", rarity: "legendary" },
  { id: "title:COSMIC DEITY", type: "title", name: "COSMIC DEITY", val: "COSMIC DEITY", rarity: "legendary" },
  { id: "title:UNBEATABLE", type: "title", name: "UNBEATABLE", val: "UNBEATABLE", rarity: "legendary" }
];

// Duplicate metal compensation scrap values
const DUP_REWARDS = {
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
  legendary: 250
};

// Direct purchase direct scrap values
const SCRAP_COSTS = {
  uncommon: 50,
  rare: 150,
  epic: 300,
  legendary: 600
};

// Rarity hex colors
const RARITY_COLORS = {
  common: "#94A3B8",
  uncommon: "#10B981",
  rare: "#38BDF8",
  epic: "#A78BFA",
  legendary: "#F59E0B"
};

// --- DOM ELEMENTS SELECTION ---
const textPlayCoins = document.getElementById('text-play-coins');
const textScrap = document.getElementById('text-scrap');
const loadingOverlay = document.getElementById('locker-loading');
const lockerContent = document.getElementById('locker-content');

// Developer Tools
const btnAddCoins = document.getElementById('btn-dev-add-coins');
const btnAddScrap = document.getElementById('btn-dev-add-scrap');
const btnUnlockAll = document.getElementById('btn-dev-unlock-all');
const btnDevReset = document.getElementById('btn-dev-reset');

// Navigation Tabs
const tabVending = document.getElementById('tab-vending');
const tabLocker = document.getElementById('tab-locker');
const panelVending = document.getElementById('panel-vending');
const panelLocker = document.getElementById('panel-locker');

// Vending elements
const crankLever = document.getElementById('crank-lever');
const revealViewport = document.getElementById('reveal-viewport');
const machineDome = document.querySelector('.machine-dome');

// Locker Grid Elements
const subtabButtons = document.querySelectorAll('.subtab-btn');
const inventoryContainer = document.getElementById('inventory-container');

// State Cache Variables
let userDocData = null;
let currentLockerCategory = "avatar"; // defaults to Avatar emojis

// --- PRESET DYNAMIC TOAST NOTIFICATION ---
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

  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// --- COSMETIC GETTERS & STYLING ---
function getTitleColor(titleText) {
  if (titleText.includes("DEITY") || titleText.includes("CHAMP")) return "#F59E0B"; 
  if (titleText.includes("MAESTRO") || titleText.includes("GLITCHER")) return "#A78BFA"; 
  if (titleText.includes("COMMANDER") || titleText.includes("CONNOISSEUR")) return "#38BDF8"; 
  if (titleText.includes("GRINDER") || titleText.includes("WIZARD")) return "#10B981"; 
  return "#94a3b8"; 
}

// --- UPDATE LIVE PREVIEW CARD CARD ---
function updatePreviewCard(data, user) {
  const username = data.username || user.displayName || "Gamer";
  const tagline = data.tagline || "Ready to play some arcade games!";
  const favGame = data.favoriteGame || "None";
  const activeCosmetics = data.activeCosmetics || {};
  const activeAvatar = activeCosmetics.avatar || data.avatar || "👾";
  const activeBorder = activeCosmetics.border || "border-common";
  const activeTheme = activeCosmetics.theme || "theme-common";
  const activeTitle = activeCosmetics.title || "THE ROOKIE";

  const previewUsername = document.getElementById('preview-username');
  const previewTagline = document.getElementById('preview-tagline');
  const previewFavGame = document.getElementById('preview-fav-game');
  const previewAvatar = document.getElementById('preview-avatar');
  const previewAvatarRing = document.getElementById('preview-avatar-ring');
  const previewCard = document.getElementById('preview-card');
  const previewTitle = document.getElementById('preview-title');

  if (previewUsername) previewUsername.innerText = username;
  if (previewTagline) previewTagline.innerText = `"${tagline}"`;
  if (previewFavGame) previewFavGame.innerText = `🎯 Favorite: ${favGame}`;
  if (previewAvatar) previewAvatar.innerText = activeAvatar;

  // Ring Borders outline
  if (previewAvatarRing) {
    previewAvatarRing.className = `avatar-ring ${activeBorder}`;
  }

  // Gradients card backdrop
  if (previewCard) {
    previewCard.className = `gamer-card ${activeTheme}`;
  }

  // Tag Titles Color
  if (previewTitle) {
    previewTitle.innerText = activeTitle;
    const titleColor = getTitleColor(activeTitle);
    previewTitle.style.color = titleColor;
    previewTitle.style.borderColor = titleColor + "33"; // subtle boundary
  }
}

// --- POPULATE CURRENCIES TO UI ---
function updateCurrencyDisplay(data) {
  if (textPlayCoins) textPlayCoins.innerText = data.playCoins !== undefined ? data.playCoins : 200;
  if (textScrap) textScrap.innerText = data.scrap !== undefined ? data.scrap : 0;
}

// --- TAB SWITCHER LOGIC ---
if (tabVending && tabLocker) {
  tabVending.addEventListener('click', () => {
    tabVending.classList.add('active');
    tabLocker.classList.remove('active');
    panelVending.style.display = 'block';
    panelLocker.style.display = 'none';
  });

  tabLocker.addEventListener('click', () => {
    tabLocker.classList.add('active');
    tabVending.classList.remove('active');
    panelLocker.style.display = 'block';
    panelVending.style.display = 'none';
    renderLockerGrid();
  });
}

// --- CATEGORY SUBTAB SWITCHER LOGIC ---
subtabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    subtabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLockerCategory = btn.getAttribute('data-type');
    renderLockerGrid();
  });
});

// --- LOAD USER STATE AND BACKFILL DEFAULTS ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let data = {};
      let needsMerge = false;

      if (userSnap.exists()) {
        data = userSnap.data();
      } else {
        data = {
          uid: user.uid,
          username: user.displayName || "Gamer",
          email: user.email,
          totalPoints: 0,
          gamesPlayed: 0,
          joinDate: new Date(),
          badges: ["new"]
        };
        needsMerge = true;
      }

      // Sync and initialize cosmetic economy defaults
      if (data.playCoins === undefined) {
        data.playCoins = 200; // Starter coins
        needsMerge = true;
      }
      if (data.scrap === undefined) {
        data.scrap = 0;
        needsMerge = true;
      }
      if (data.ownedCosmetics === undefined) {
        // Base starter pack
        data.ownedCosmetics = ["avatar:👾", "border:border-common", "theme:theme-common", "title:THE ROOKIE"];
        needsMerge = true;
      }
      if (data.activeCosmetics === undefined) {
        data.activeCosmetics = {
          avatar: data.avatar || "👾",
          border: "border-common",
          theme: "theme-common",
          title: "THE ROOKIE"
        };
        needsMerge = true;
      }

      if (needsMerge) {
        await setDoc(userRef, data, { merge: true });
      }

      userDocData = data;

      // Update layouts
      updateCurrencyDisplay(userDocData);
      updatePreviewCard(userDocData, user);

      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (lockerContent) lockerContent.style.display = 'grid';

      // Render items grid in background
      renderLockerGrid();

    } catch (err) {
      console.error("Error loading locker assets:", err);
      if (loadingOverlay) {
        loadingOverlay.innerHTML = `
          <div style="text-align:center; padding:20px; color:#EF4444;">
            <h3>Error Syncing Inventory</h3>
            <p>${err.message}</p>
          </div>
        `;
      }
    }
  } else {
    // Show Access Denied just like profile.js does
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="text-align:center; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <h2 style="font-size: 2.2rem; font-weight: 900; color: #fff; margin-bottom: 12px; background: linear-gradient(135deg, #FF6B6B, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Access Denied</h2>
          <p style="font-size:1.1rem; color:#94a3b8; margin-top:10px; margin-bottom: 30px; max-width: 340px; line-height: 1.6;">You must be logged in to access the Locker Room and spin the Capsule Vending Machine.</p>
          <button class="btn btn--primary btn--lg pulse-ring" id="btn-locker-login-trigger" style="border-radius: 50px;">Log In / Sign Up</button>
        </div>
      `;
      const btnLockerLogin = document.getElementById('btn-locker-login-trigger');
      if (btnLockerLogin) {
        btnLockerLogin.addEventListener('click', () => {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.style.display = 'flex';
        });
      }
    }
  }
});

// --- RENDER MY LOCKER INVENTORY GRID ---
function renderLockerGrid() {
  if (!inventoryContainer || !userDocData) return;
  inventoryContainer.innerHTML = '';

  const owned = userDocData.ownedCosmetics || [];
  const active = userDocData.activeCosmetics || {};

  // Filter cosmetics matching subtab selection
  const pool = COSMETICS.filter(item => item.type === currentLockerCategory);

  pool.forEach(item => {
    // Check ownership (Common items are automatically owned to avoid any migration issues)
    const isOwned = owned.includes(item.id) || item.rarity === 'common';

    // Check equipped status
    let isEquipped = false;
    if (currentLockerCategory === 'avatar') {
      isEquipped = (active.avatar === item.val || userDocData.avatar === item.val);
    } else if (currentLockerCategory === 'border') {
      isEquipped = (active.border === item.val);
    } else if (currentLockerCategory === 'theme') {
      isEquipped = (active.theme === item.val);
    } else if (currentLockerCategory === 'title') {
      isEquipped = (active.title === item.val);
    }

    // Create item DOM structure
    const el = document.createElement('div');
    el.className = `inventory-item rarity-${item.rarity}`;
    if (isEquipped) el.classList.add('equipped');
    if (!isOwned) el.classList.add('locked');

    // Choose visual icon representing category type
    let renderIcon = "👾";
    if (item.type === 'avatar') {
      renderIcon = item.val;
    } else if (item.type === 'border') {
      renderIcon = "🛡️";
    } else if (item.type === 'theme') {
      renderIcon = "🖼️";
    } else if (item.type === 'title') {
      renderIcon = "🏷️";
    }

    el.innerHTML = `
      <div class="inventory-icon">${renderIcon}</div>
      <div class="inventory-name" title="${item.name}">${item.name}</div>
      <div class="inventory-rarity-lbl" style="color: ${RARITY_COLORS[item.rarity]};">${item.rarity}</div>
      ${!isOwned ? `<div style="font-size:0.6rem; color:#EF4444; font-weight:800; margin-top:2px;">🔒 ${SCRAP_COSTS[item.rarity]} SCRAP</div>` : ''}
    `;

    // Click trigger for equip or purchase
    el.addEventListener('click', () => {
      if (isOwned) {
        equipItem(item);
      } else {
        purchaseItemWithScrap(item);
      }
    });

    inventoryContainer.appendChild(el);
  });
}

// --- EQUIP COSMETIC ACTION ---
async function equipItem(item) {
  const user = auth.currentUser;
  if (!user || !userDocData) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const updatedActive = { ...userDocData.activeCosmetics };

    if (item.type === 'avatar') {
      updatedActive.avatar = item.val;
    } else if (item.type === 'border') {
      updatedActive.border = item.val;
    } else if (item.type === 'theme') {
      updatedActive.theme = item.val;
    } else if (item.type === 'title') {
      updatedActive.title = item.val;
    }

    const docUpdates = { activeCosmetics: updatedActive };

    // Maintain compatibility with top-level avatar field
    if (item.type === 'avatar') {
      docUpdates.avatar = item.val;
    }

    await setDoc(userRef, docUpdates, { merge: true });

    // Update local cache
    userDocData.activeCosmetics = updatedActive;
    if (item.type === 'avatar') {
      userDocData.avatar = item.val;
    }

    showToast(`Equipped "${item.name}"!`, "success");
    updatePreviewCard(userDocData, user);
    renderLockerGrid();

  } catch (err) {
    console.error("Error equipping item:", err);
    showToast("Failed to equip item. Try again.", "error");
  }
}

// --- SCRAP METAL PURCHASE SYSTEM ---
async function purchaseItemWithScrap(item) {
  const user = auth.currentUser;
  if (!user || !userDocData) return;

  const cost = SCRAP_COSTS[item.rarity];
  if (!cost) {
    showToast("This item cannot be purchased directly.", "error");
    return;
  }

  const currentScrap = userDocData.scrap || 0;
  if (currentScrap < cost) {
    showToast(`Insufficient Scrap! Need ${cost} Scrap but you only have ${currentScrap}.`, "error");
    return;
  }

  const confirmMsg = `Buy "${item.name}" (${item.rarity.toUpperCase()}) directly for ${cost} Scrap Metal?`;
  if (!confirm(confirmMsg)) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const updatedOwned = [...(userDocData.ownedCosmetics || [])];

    if (!updatedOwned.includes(item.id)) {
      updatedOwned.push(item.id);
    }

    const updatedScrap = currentScrap - cost;

    const docUpdates = {
      scrap: updatedScrap,
      ownedCosmetics: updatedOwned
    };

    await setDoc(userRef, docUpdates, { merge: true });

    // Update local cache
    userDocData.scrap = updatedScrap;
    userDocData.ownedCosmetics = updatedOwned;

    showToast(`Unlocked "${item.name}"! Direct purchase completed!`, "success");
    updateCurrencyDisplay(userDocData);
    renderLockerGrid();

  } catch (err) {
    console.error("Error purchasing item:", err);
    showToast("Purchase transaction failed. Try again.", "error");
  }
}

// --- GASHAPON CAPSULE PULL DRAW ENGINE ---
if (crankLever) {
  crankLever.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !userDocData) {
      showToast("Please log in to spin the capsule station!", "error");
      return;
    }

    const currentCoins = userDocData.playCoins !== undefined ? userDocData.playCoins : 200;
    if (currentCoins < 100) {
      showToast("Insufficient Play Coins! Spins cost 100 PC.", "error");
      return;
    }

    // Disable crank button temporarily to prevent spamming
    crankLever.style.pointerEvents = 'none';

    // 1. Deduct 100 coins locally & Firestore
    const userRef = doc(db, "users", user.uid);
    const nextCoins = currentCoins - 100;
    
    try {
      await updateDoc(userRef, {
        playCoins: nextCoins
      });
      userDocData.playCoins = nextCoins;
      updateCurrencyDisplay(userDocData);
    } catch (deductErr) {
      console.error("Coin deduction failed:", deductErr);
      showToast("Transaction failed. Try again.", "error");
      crankLever.style.pointerEvents = 'auto';
      return;
    }

    // 2. Play crank visual rotation animation
    crankLever.style.transition = 'transform 1.2s ease';
    crankLever.style.transform = 'scale(0.95) rotate(720deg)';

    // 3. Play dome shaking animation
    if (machineDome) machineDome.classList.add('capsule-shake-anim');

    // 4. Update viewport status to "Rolling..."
    if (revealViewport) {
      revealViewport.innerHTML = `
        <div style="font-size:3.5rem; margin-bottom:15px; animation: floatDome 1.5s ease-in-out infinite;">🔮</div>
        <h3 style="font-size:1.1rem; font-weight:900; color:#fff; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Dispensing...</h3>
        <p style="color:#64748b; font-size:0.8rem; max-width:180px;">Rattling the capsule gears...</p>
      `;
      revealViewport.style.background = 'rgba(255, 255, 255, 0.02)';
      revealViewport.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      revealViewport.style.boxShadow = 'none';
    }

    // 5. Delay to simulate gashapon drop (1.5 seconds)
    setTimeout(async () => {
      // Pick random item based on weights
      const rolledItem = drawRandomCosmetic();
      const owned = userDocData.ownedCosmetics || [];
      const isDuplicate = owned.includes(rolledItem.id) || rolledItem.rarity === 'common';

      try {
        if (!isDuplicate) {
          // Add to owned list
          const updatedOwned = [...owned, rolledItem.id];
          await updateDoc(userRef, {
            ownedCosmetics: updatedOwned
          });
          userDocData.ownedCosmetics = updatedOwned;

          // Render viewport reveal
          revealViewport.innerHTML = `
            <div style="font-size:5rem; margin-bottom:10px; animation: floatDome 3s ease-in-out infinite;">${rolledItem.type === 'avatar' ? rolledItem.val : '🎁'}</div>
            <div style="font-size: 0.65rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid ${RARITY_COLORS[rolledItem.rarity]}66; margin-bottom: 8px;">
              ${rolledItem.rarity.toUpperCase()} UNLOCK
            </div>
            <h3 style="font-size:1.3rem; font-weight:900; color:#fff; margin-bottom:4px;">${rolledItem.name}</h3>
            <p style="color:#64748b; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">${rolledItem.type}</p>
            <button class="btn btn--primary" id="btn-reveal-equip" style="margin-top: 15px; padding: 6px 14px; font-size: 0.8rem; border-radius: 8px; font-weight:800;">Equip Now</button>
          `;
          
          // Apply matching neon glow background
          revealViewport.style.background = `radial-gradient(circle, ${RARITY_COLORS[rolledItem.rarity]}33 0%, rgba(15,23,42,0.9) 100%)`;
          revealViewport.style.borderColor = RARITY_COLORS[rolledItem.rarity];
          revealViewport.style.boxShadow = `0 10px 30px ${RARITY_COLORS[rolledItem.rarity]}26`;

          // Add equip button event listener
          const btnRevealEquip = document.getElementById('btn-reveal-equip');
          if (btnRevealEquip) {
            btnRevealEquip.addEventListener('click', () => {
              equipItem(rolledItem);
            });
          }

          showToast(`NEW UNLOCK! You pulled a ${rolledItem.rarity.toUpperCase()} "${rolledItem.name}"!`, "success");

        } else {
          // Recycle duplicate
          const scrapCompensation = DUP_REWARDS[rolledItem.rarity] || 10;
          const nextScrap = (userDocData.scrap || 0) + scrapCompensation;
          await updateDoc(userRef, {
            scrap: nextScrap
          });
          userDocData.scrap = nextScrap;
          updateCurrencyDisplay(userDocData);

          // Render duplicate recycled reveal
          revealViewport.innerHTML = `
            <div style="font-size:3.5rem; margin-bottom:10px; filter:grayscale(30%);">🔄</div>
            <div style="font-size: 0.65rem; font-weight: 900; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px;">DUPLICATE</div>
            <h3 style="font-size:1.15rem; font-weight:900; color:#fff; margin-bottom:4px;">${rolledItem.name}</h3>
            <p style="color:#64748b; font-size:0.8rem; margin-bottom: 12px;">Salvaged duplicate pulled!</p>
            <div style="font-size: 0.8rem; font-weight: 900; color: #10B981; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 8px 16px; border-radius: 50px; display: inline-flex; align-items: center; gap: 6px;">
              ⚙️ +${scrapCompensation} Scrap Metal
            </div>
          `;
          revealViewport.style.background = 'rgba(15,23,42,0.6)';
          revealViewport.style.borderColor = 'rgba(255,255,255,0.08)';
          revealViewport.style.boxShadow = 'none';

          showToast(`Duplicate! Converted "${rolledItem.name}" into +${scrapCompensation} Scrap Metal!`, "warning");
        }

        // Re-render locker inventory list
        renderLockerGrid();

      } catch (saveErr) {
        console.error("Failed to persist spun gashapon results:", saveErr);
        showToast("Error updating inventory items.", "error");
      } finally {
        // Reset animations and enable crank click again
        if (machineDome) machineDome.classList.remove('capsule-shake-anim');
        crankLever.style.transform = 'scale(1) rotate(0deg)';
        crankLever.style.pointerEvents = 'auto';
      }
    }, 1500);
  });
}

// Draw based on exact percentage probabilities
function drawRandomCosmetic() {
  const rand = Math.random() * 100;
  let rarity = "common";
  
  if (rand < 50) {
    rarity = "common";
  } else if (rand < 80) {
    rarity = "uncommon";
  } else if (rand < 92) {
    rarity = "rare";
  } else if (rand < 98) {
    rarity = "epic";
  } else {
    rarity = "legendary";
  }

  const pool = COSMETICS.filter(c => c.rarity === rarity);
  if (pool.length === 0) return COSMETICS[0];
  
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// --- SANDBOX DEVELOPER TESTING SUITE ---
if (btnAddCoins) {
  btnAddCoins.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !userDocData) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const nextCoins = (userDocData.playCoins || 0) + 500;
      await updateDoc(userRef, { playCoins: nextCoins });
      userDocData.playCoins = nextCoins;
      
      updateCurrencyDisplay(userDocData);
      showToast("Sandbox: Credited +500 Play Coins! 🪙", "success");
    } catch (e) {
      console.error(e);
      showToast("Sandbox: Failed to add coins.", "error");
    }
  });
}

if (btnAddScrap) {
  btnAddScrap.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !userDocData) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const nextScrap = (userDocData.scrap || 0) + 100;
      await updateDoc(userRef, { scrap: nextScrap });
      userDocData.scrap = nextScrap;
      
      updateCurrencyDisplay(userDocData);
      showToast("Sandbox: Credited +100 Scrap Metal! ⚙️", "success");
    } catch (e) {
      console.error(e);
      showToast("Sandbox: Failed to add scrap.", "error");
    }
  });
}

if (btnUnlockAll) {
  btnUnlockAll.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !userDocData) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const allIds = COSMETICS.map(item => item.id);
      await updateDoc(userRef, { ownedCosmetics: allIds });
      userDocData.ownedCosmetics = allIds;
      
      showToast("Sandbox: Unlocked all cosmetics! 🔓", "success");
      renderLockerGrid();
    } catch (e) {
      console.error(e);
      showToast("Sandbox: Failed to unlock items.", "error");
    }
  });
}

if (btnDevReset) {
  btnDevReset.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !userDocData) return;

    if (!confirm("Are you sure you want to reset all inventory progress, scrap metal, and custom equipped visuals to developer starter levels?")) {
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const defaultState = {
        playCoins: 200,
        scrap: 0,
        ownedCosmetics: ["avatar:👾", "border:border-common", "theme:theme-common", "title:THE ROOKIE"],
        activeCosmetics: {
          avatar: "👾",
          border: "border-common",
          theme: "theme-common",
          title: "THE ROOKIE"
        },
        avatar: "👾"
      };

      await setDoc(userRef, defaultState, { merge: true });

      // Update local cache
      userDocData.playCoins = defaultState.playCoins;
      userDocData.scrap = defaultState.scrap;
      userDocData.ownedCosmetics = defaultState.ownedCosmetics;
      userDocData.activeCosmetics = defaultState.activeCosmetics;
      userDocData.avatar = defaultState.avatar;

      // Update layouts
      updateCurrencyDisplay(userDocData);
      updatePreviewCard(userDocData, user);
      
      // Reset reveal box
      if (revealViewport) {
        revealViewport.innerHTML = `
          <div style="font-size:3.5rem; margin-bottom:15px; filter:grayscale(80%); opacity:0.3;">🎁</div>
          <h3 style="font-size:1.1rem; font-weight:900; color:#fff; margin-bottom:6px; text-transform:uppercase;">Station Idle</h3>
          <p style="color:#64748b; font-size:0.8rem; max-width:180px;">Crank the left wheel to pull an item!</p>
        `;
        revealViewport.style.background = 'rgba(255, 255, 255, 0.02)';
        revealViewport.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        revealViewport.style.boxShadow = 'none';
      }

      showToast("Sandbox: Restored default beginner inventory! 🔄", "warning");
      renderLockerGrid();

    } catch (e) {
      console.error(e);
      showToast("Sandbox: Failed to reset profile.", "error");
    }
  });
}
