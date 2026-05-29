import { db, auth, doc, getDoc, setDoc, updateDoc, sendEmailVerification } from './firebase.js';
import { onAuthStateChanged } from './firebase.js';
import { triggerHaptic } from './haptics.js';

// --- COSMETICS DEFINITION SYSTEM ---
const COSMETICS = [
  // --- AVATARS (Emojis) ---
  // Common
  { id: "avatar:👾", type: "avatar", name: "Cyber Alien", val: "👾", rarity: "common" },
  { id: "avatar:🎮", type: "avatar", name: "Retro Pad", val: "🎮", rarity: "common" },
  { id: "avatar:🕹️", type: "avatar", name: "Joystick", val: "🕹️", rarity: "common" },
  { id: "avatar:🐱", type: "avatar", name: "Arcade Cat", val: "🐱", rarity: "common" },
  { id: "avatar:🛡️", type: "avatar", name: "Arcade Shield", val: "🛡️", rarity: "common" },
  { id: "avatar:📦", type: "avatar", name: "Loot Crate", val: "📦", rarity: "common" },
  { id: "avatar:🍕", type: "avatar", name: "Pixel Pizza", val: "🍕", rarity: "common" },
  { id: "avatar:🪙", type: "avatar", name: "Retro Coin", val: "🪙", rarity: "common" },
  { id: "avatar:🍄", type: "avatar", name: "1-Up Mushroom", val: "🍄", rarity: "common" },
  // Uncommon
  { id: "avatar:🚀", type: "avatar", name: "Space Rider", val: "🚀", rarity: "uncommon" },
  { id: "avatar:🛸", type: "avatar", name: "UFO Invader", val: "🛸", rarity: "uncommon" },
  { id: "avatar:🐯", type: "avatar", name: "Cyber Tiger", val: "🐯", rarity: "uncommon" },
  { id: "avatar:🤖", type: "avatar", name: "Cyber Bot", val: "🤖", rarity: "uncommon" },
  { id: "avatar:🎯", type: "avatar", name: "Bullseye", val: "🎯", rarity: "uncommon" },
  { id: "avatar:🦊", type: "avatar", name: "Stealth Fox", val: "🦊", rarity: "uncommon" },
  { id: "avatar:🏹", type: "avatar", name: "Arcade Bow", val: "🏹", rarity: "uncommon" },
  { id: "avatar:🛩️", type: "avatar", name: "Sky Fighter", val: "🛩️", rarity: "uncommon" },
  { id: "avatar:🕶️", type: "avatar", name: "Cool Retro", val: "🕶️", rarity: "uncommon" },
  { id: "avatar:🔋", type: "avatar", name: "Power Cell", val: "🔋", rarity: "uncommon" },
  // Rare
  { id: "avatar:👻", type: "avatar", name: "Neon Ghost", val: "👻", rarity: "rare" },
  { id: "avatar:🦄", type: "avatar", name: "Neon Unicorn", val: "🦄", rarity: "rare" },
  { id: "avatar:💀", type: "avatar", name: "Pixel Skull", val: "💀", rarity: "rare" },
  { id: "avatar:🦁", type: "avatar", name: "Arcade Lion", val: "🦁", rarity: "rare" },
  { id: "avatar:🦈", type: "avatar", name: "Cyber Shark", val: "🦈", rarity: "rare" },
  { id: "avatar:💎", type: "avatar", name: "Arcane Prism", val: "💎", rarity: "rare" },
  { id: "avatar:🔮", type: "avatar", name: "Crystal Ball", val: "🔮", rarity: "rare" },
  { id: "avatar:🪐", type: "avatar", name: "Ringed Planet", val: "🪐", rarity: "rare" },
  { id: "avatar:🧛", type: "avatar", name: "Pixel Count", val: "🧛", rarity: "rare" },
  { id: "avatar:👽", type: "avatar", name: "Glow Xenomorph", val: "👽", rarity: "rare" },
  { id: "avatar:🌀", type: "avatar", name: "Cosmic Vortex", val: "🌀", rarity: "rare" },
  // Epic
  { id: "avatar:🐉", type: "avatar", name: "Holo Dragon", val: "🐉", rarity: "epic" },
  { id: "avatar:🧙‍♂️", type: "avatar", name: "Arcade Mage", val: "🧙‍♂️", rarity: "epic" },
  { id: "avatar:⚡", type: "avatar", name: "Lightning Sprite", val: "⚡", rarity: "epic" },
  { id: "avatar:👹", type: "avatar", name: "Oni Demon", val: "👹", rarity: "epic" },
  { id: "avatar:☄️", type: "avatar", name: "Meteor Strike", val: "☄️", rarity: "epic" },
  { id: "avatar:🧬", type: "avatar", name: "Cyber Helix", val: "🧬", rarity: "epic" },
  { id: "avatar:⚔️", type: "avatar", name: "Holo Blade", val: "⚔️", rarity: "epic" },
  { id: "avatar:🪶", type: "avatar", name: "Phoenix Feather", val: "🪶", rarity: "epic" },
  { id: "avatar:📡", type: "avatar", name: "Deep Dish Signal", val: "📡", rarity: "epic" },
  { id: "avatar:🦾", type: "avatar", name: "Cybernetic Arm", val: "🦾", rarity: "epic" },
  // Legendary
  { id: "avatar:👑", type: "avatar", name: "Golden Emperor", val: "👑", rarity: "legendary" },
  { id: "avatar:🌌", type: "avatar", name: "Cosmic Nebula", val: "🌌", rarity: "legendary" },
  { id: "avatar:🧿", type: "avatar", name: "Stardust Eye", val: "🧿", rarity: "legendary" },
  { id: "avatar:🦖", type: "avatar", name: "Robo T-Rex", val: "🦖", rarity: "legendary" },
  { id: "avatar:🔥", type: "avatar", name: "Flame Core", val: "🔥", rarity: "legendary" },
  { id: "avatar:🏆", type: "avatar", name: "Grand Trophy", val: "🏆", rarity: "legendary" },
  { id: "avatar:🔱", type: "avatar", name: "Golden Trident", val: "🔱", rarity: "legendary" },
  { id: "avatar:🎭", type: "avatar", name: "Neon Persona", val: "🎭", rarity: "legendary" },
  { id: "avatar:🌟", type: "avatar", name: "Cosmic Star", val: "🌟", rarity: "legendary" },
  { id: "avatar:💫", type: "avatar", name: "Supernova", val: "💫", rarity: "legendary" },
  { id: "avatar:🎴", type: "avatar", name: "Arcane Card", val: "🎴", rarity: "legendary" },

  // --- BORDERS (Avatar Ring Auras) ---
  // Common
  { id: "border:border-common", type: "border", name: "Slate Ring", val: "border-common", rarity: "common" },
  // Uncommon
  { id: "border:border-uncommon", type: "border", name: "Green Aura", val: "border-uncommon", rarity: "uncommon" },
  // Rare
  { id: "border:border-rare", type: "border", name: "Cyan Frost", val: "border-rare", rarity: "rare" },
  { id: "border:border-electric", type: "border", name: "Static Volt", val: "border-electric", rarity: "rare" },
  // Epic
  { id: "border:border-epic", type: "border", name: "Synth Pulse", val: "border-epic", rarity: "epic" },
  { id: "border:border-shadow", type: "border", name: "Shadow Void", val: "border-shadow", rarity: "epic" },
  { id: "border:border-glitch", type: "border", name: "Cyber Corruption", val: "border-glitch", rarity: "epic" },
  // Legendary
  { id: "border:border-legendary", type: "border", name: "Cosmic Flame", val: "border-legendary", rarity: "legendary" },
  { id: "border:border-ruby", type: "border", name: "Ruby Eclipse", val: "border-ruby", rarity: "legendary" },
  { id: "border:border-rainbow", type: "border", name: "Rainbow Horizon", val: "border-rainbow", rarity: "legendary" },
  { id: "border:border-diamond", type: "border", name: "Prism Crystal", val: "border-diamond", rarity: "legendary" },
  { id: "border:border-phoenix", type: "border", name: "Solar Prominence", val: "border-phoenix", rarity: "legendary" },
  { id: "border:border-nebula", type: "border", name: "Celestial Nebula", val: "border-nebula", rarity: "legendary" },

  // --- THEMES (Card Backgrounds) ---
  // Common
  { id: "theme:theme-common", type: "theme", name: "Default Glass", val: "theme-common", rarity: "common" },
  { id: "theme:theme-slate", type: "theme", name: "Dark Slate", val: "theme-slate", rarity: "common" },
  { id: "theme:theme-ocean", type: "theme", name: "Ocean Breeze", val: "theme-ocean", rarity: "common" },
  // Uncommon
  { id: "theme:theme-uncommon", type: "theme", name: "Cyber Grid", val: "theme-uncommon", rarity: "uncommon" },
  { id: "theme:theme-amethyst", type: "theme", name: "Amethyst Spark", val: "theme-amethyst", rarity: "uncommon" },
  { id: "theme:theme-forest", type: "theme", name: "Emerald Forest", val: "theme-forest", rarity: "uncommon" },
  // Rare
  { id: "theme:theme-rare", type: "theme", name: "Frozen Aurora", val: "theme-rare", rarity: "rare" },
  { id: "theme:theme-sunset", type: "theme", name: "Pastel Horizon", val: "theme-sunset", rarity: "rare" },
  { id: "theme:theme-solar", type: "theme", name: "Solar Flare", val: "theme-solar", rarity: "rare" },
  { id: "theme:theme-toxic", type: "theme", name: "Toxic Waste", val: "theme-toxic", rarity: "rare" },
  // Epic
  { id: "theme:theme-epic", type: "theme", name: "Retro Synthwave", val: "theme-epic", rarity: "epic" },
  { id: "theme:theme-matrix", type: "theme", name: "Digital Rain", val: "theme-matrix", rarity: "epic" },
  { id: "theme:theme-static", type: "theme", name: "TV Glitch", val: "theme-static", rarity: "epic" },
  { id: "theme:theme-deepspace", type: "theme", name: "Deep Space", val: "theme-deepspace", rarity: "epic" },
  { id: "theme:theme-frost", type: "theme", name: "Glacial Frost", val: "theme-frost", rarity: "epic" },
  // Legendary
  { id: "theme:theme-legendary", type: "theme", name: "Nebula Storm", val: "theme-legendary", rarity: "legendary" },
  { id: "theme:theme-magma", type: "theme", name: "Magma Chamber", val: "theme-magma", rarity: "legendary" },
  { id: "theme:theme-royal", type: "theme", name: "Imperial Silk", val: "theme-royal", rarity: "legendary" },
  { id: "theme:theme-hyperdrive", type: "theme", name: "Hyperdrive", val: "theme-hyperdrive", rarity: "legendary" },
  { id: "theme:theme-borealis", type: "theme", name: "Aurora Celestial", val: "theme-borealis", rarity: "legendary" },
  { id: "theme:theme-abyss", type: "theme", name: "Bioluminescent Abyss", val: "theme-abyss", rarity: "legendary" },
  { id: "theme:theme-gilded", type: "theme", name: "Gilded Gold", val: "theme-gilded", rarity: "legendary" },
  { id: "theme:theme-blackhole", type: "theme", name: "Cosmic Singularity", val: "theme-blackhole", rarity: "legendary" },
  { id: "theme:theme-cyberpunk", type: "theme", name: "Neon Cyberpunk", val: "theme-cyberpunk", rarity: "legendary" },
  { id: "theme:theme-vortex", type: "theme", name: "Chrono Vortex", val: "theme-vortex", rarity: "legendary" },
  { id: "theme:theme-prism", type: "theme", name: "Prismatic Hologram", val: "theme-prism", rarity: "legendary" },
  { id: "theme:theme-inferno", type: "theme", name: "Infernal Embers", val: "theme-inferno", rarity: "legendary" },

  // --- TITLES (Witty Clash Royale-style slogan tags) ---
  // Common — Self-deprecating, relatable, new player energy
  { id: "title:THE ROOKIE", type: "title", name: "THE ROOKIE", val: "THE ROOKIE", rarity: "common" },
  { id: "title:JUST VIBING", type: "title", name: "JUST VIBING", val: "JUST VIBING", rarity: "common" },
  { id: "title:ACCIDENTALLY GOOD", type: "title", name: "ACCIDENTALLY GOOD", val: "ACCIDENTALLY GOOD", rarity: "common" },
  { id: "title:PARTICIPATION TROPHY", type: "title", name: "PARTICIPATION TROPHY", val: "PARTICIPATION TROPHY", rarity: "common" },
  { id: "title:BUTTON MASHER", type: "title", name: "BUTTON MASHER", val: "BUTTON MASHER", rarity: "common" },
  { id: "title:TRUST THE PROCESS", type: "title", name: "TRUST THE PROCESS", val: "TRUST THE PROCESS", rarity: "common" },
  { id: "title:AFK LEGEND", type: "title", name: "AFK LEGEND", val: "AFK LEGEND", rarity: "common" },
  { id: "title:MORAL SUPPORT", type: "title", name: "MORAL SUPPORT", val: "MORAL SUPPORT", rarity: "common" },
  // Uncommon — Cocky beginner energy, starting to talk trash
  { id: "title:CERTIFIED MENACE", type: "title", name: "CERTIFIED MENACE", val: "CERTIFIED MENACE", rarity: "uncommon" },
  { id: "title:BUILT DIFFERENT", type: "title", name: "BUILT DIFFERENT", val: "BUILT DIFFERENT", rarity: "uncommon" },
  { id: "title:NO CHILL", type: "title", name: "NO CHILL", val: "NO CHILL", rarity: "uncommon" },
  { id: "title:LOWKEY CRACKED", type: "title", name: "LOWKEY CRACKED", val: "LOWKEY CRACKED", rarity: "uncommon" },
  { id: "title:SLEEP IS OVERRATED", type: "title", name: "SLEEP IS OVERRATED", val: "SLEEP IS OVERRATED", rarity: "uncommon" },
  { id: "title:COIN GOBLIN", type: "title", name: "COIN GOBLIN", val: "COIN GOBLIN", rarity: "uncommon" },
  { id: "title:CHAOS AGENT", type: "title", name: "CHAOS AGENT", val: "CHAOS AGENT", rarity: "uncommon" },
  { id: "title:UNRANKED THREAT", type: "title", name: "UNRANKED THREAT", val: "UNRANKED THREAT", rarity: "uncommon" },
  // Rare — Real flex, witty and confident
  { id: "title:RENT FREE IN YOUR HEAD", type: "title", name: "RENT FREE IN YOUR HEAD", val: "RENT FREE IN YOUR HEAD", rarity: "rare" },
  { id: "title:MAIN CHARACTER", type: "title", name: "MAIN CHARACTER", val: "MAIN CHARACTER", rarity: "rare" },
  { id: "title:RAGE QUIT INDUCER", type: "title", name: "RAGE QUIT INDUCER", val: "RAGE QUIT INDUCER", rarity: "rare" },
  { id: "title:EMOTIONAL DAMAGE", type: "title", name: "EMOTIONAL DAMAGE", val: "EMOTIONAL DAMAGE", rarity: "rare" },
  { id: "title:PIXEL PERFECT", type: "title", name: "PIXEL PERFECT", val: "PIXEL PERFECT", rarity: "rare" },
  { id: "title:SPEED DEMON", type: "title", name: "SPEED DEMON", val: "SPEED DEMON", rarity: "rare" },
  { id: "title:NOT EVEN TRYING", type: "title", name: "NOT EVEN TRYING", val: "NOT EVEN TRYING", rarity: "rare" },
  { id: "title:WIFI WARRIOR", type: "title", name: "WIFI WARRIOR", val: "WIFI WARRIOR", rarity: "rare" },
  { id: "title:EAT SLEEP GAME REPEAT", type: "title", name: "EAT SLEEP GAME REPEAT", val: "EAT SLEEP GAME REPEAT", rarity: "rare" },
  // Epic — Intimidating, legendary trash talk energy
  { id: "title:YOUR NIGHTMARE", type: "title", name: "YOUR NIGHTMARE", val: "YOUR NIGHTMARE", rarity: "epic" },
  { id: "title:NERF ME PLS", type: "title", name: "NERF ME PLS", val: "NERF ME PLS", rarity: "epic" },
  { id: "title:ACTUAL PSYCHOPATH", type: "title", name: "ACTUAL PSYCHOPATH", val: "ACTUAL PSYCHOPATH", rarity: "epic" },
  { id: "title:WALKS AMONG MORTALS", type: "title", name: "WALKS AMONG MORTALS", val: "WALKS AMONG MORTALS", rarity: "epic" },
  { id: "title:DELETE YOUR ACCOUNT", type: "title", name: "DELETE YOUR ACCOUNT", val: "DELETE YOUR ACCOUNT", rarity: "epic" },
  { id: "title:LIVES IN THE MATRIX", type: "title", name: "LIVES IN THE MATRIX", val: "LIVES IN THE MATRIX", rarity: "epic" },
  { id: "title:GGEZ NO RE", type: "title", name: "GGEZ NO RE", val: "GGEZ NO RE", rarity: "epic" },
  { id: "title:UNFAIRLY TALENTED", type: "title", name: "UNFAIRLY TALENTED", val: "UNFAIRLY TALENTED", rarity: "epic" },
  { id: "title:THE FINAL BOSS", type: "title", name: "THE FINAL BOSS", val: "THE FINAL BOSS", rarity: "epic" },
  // Legendary — Absolute peak, absurd flex, makes people jealous
  { id: "title:TOUCHED GRASS ONCE", type: "title", name: "TOUCHED GRASS ONCE", val: "TOUCHED GRASS ONCE, DIDN'T LIKE IT", rarity: "legendary" },
  { id: "title:SKILL ISSUE", type: "title", name: "SKILL ISSUE", val: "SKILL ISSUE? NEVER HEARD OF HER", rarity: "legendary" },
  { id: "title:THE CHOSEN ONE", type: "title", name: "THE CHOSEN ONE", val: "THE CHOSEN ONE", rarity: "legendary" },
  { id: "title:PLAYHAUS GOAT", type: "title", name: "PLAYHAUS GOAT", val: "PLAYHAUS G.O.A.T.", rarity: "legendary" },
  { id: "title:THEY NERFED THE WRONG GUY", type: "title", name: "THEY NERFED THE WRONG GUY", val: "THEY NERFED THE WRONG GUY", rarity: "legendary" },
  { id: "title:GOLDEN GOD", type: "title", name: "GOLDEN GOD", val: "GOLDEN GOD", rarity: "legendary" },
  { id: "title:BORN TO GAME", type: "title", name: "BORN TO GAME", val: "BORN TO GAME, FORCED TO TOUCH GRASS", rarity: "legendary" },
  { id: "title:PERMANENTLY BANNED IRL", type: "title", name: "PERMANENTLY BANNED IRL", val: "PERMANENTLY BANNED IRL", rarity: "legendary" },
  { id: "title:INFINITY GAMER", type: "title", name: "INFINITY GAMER", val: "INFINITY GAMER", rarity: "legendary" },



  // --- EFFECTS (Card Animations) ---
  // Common
  { id: "card_anim:anim-none", type: "card_anim", name: "Static Card", val: "anim-none", emoji: "❌", rarity: "common" },
  // Uncommon
  { id: "card_anim:anim-pulse", type: "card_anim", name: "Pulse Aura", val: "anim-pulse", emoji: "💗", rarity: "uncommon" },
  // Rare
  { id: "card_anim:anim-shimmer", type: "card_anim", name: "Glimmer Shimmer", val: "anim-shimmer", emoji: "✨", rarity: "rare" },
  // Epic
  { id: "card_anim:anim-glitch", type: "card_anim", name: "Glitch Scanlines", val: "anim-glitch", emoji: "📺", rarity: "epic" },
  { id: "card_anim:anim-snow", type: "card_anim", name: "Blizzard Snow", val: "anim-snow", emoji: "❄️", rarity: "epic" },
  // Legendary
  { id: "card_anim:anim-particles", type: "card_anim", name: "Cosmic Particles", val: "anim-particles", emoji: "🌌", rarity: "legendary" },

  // --- FRAMES (Gamer Card Borders) ---
  // Common
  { id: "frame:frame-none", type: "frame", name: "No Frame", val: "frame-none", emoji: "❌", rarity: "common" },
  // Uncommon
  { id: "frame:frame-wooden", type: "frame", name: "Retro Wooden", val: "frame-wooden", emoji: "🪵", rarity: "uncommon" },
  // Rare
  { id: "frame:frame-steel", type: "frame", name: "Brushed Steel", val: "frame-steel", emoji: "⚙️", rarity: "rare" },
  // Epic
  { id: "frame:frame-neon", type: "frame", name: "Neon Cyan Glow", val: "frame-neon", emoji: "🔷", rarity: "epic" },
  // Legendary
  { id: "frame:frame-golden", type: "frame", name: "Midas Gold Frame", val: "frame-golden", emoji: "👑", rarity: "legendary" },
  { id: "frame:frame-rainbow", type: "frame", name: "Chroma Prism Frame", val: "frame-rainbow", emoji: "🌈", rarity: "legendary" }
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

// Vending elements (Claw Machine)
const btnClawDrop = document.getElementById('btn-claw-drop');
const btnJoystickLeft = document.getElementById('btn-joystick-left');
const btnJoystickRight = document.getElementById('btn-joystick-right');
const joystickBase = document.getElementById('joystick-base');
const clawAssembly = document.getElementById('claw-assembly');
const clawString = document.getElementById('claw-string');
const clawHand = document.getElementById('claw-hand');
const prizePile = document.getElementById('prize-pile');

// Reveal Modal elements
const clawRevealModal = document.getElementById('claw-reveal-modal');
const modalRevealIcon = document.getElementById('modal-reveal-icon');
const modalRevealBadge = document.getElementById('modal-reveal-badge');
const modalRevealName = document.getElementById('modal-reveal-name');
const modalRevealType = document.getElementById('modal-reveal-type');
const btnModalEquip = document.getElementById('btn-modal-equip');
const btnModalContinue = document.getElementById('btn-modal-continue');

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
  const item = COSMETICS.find(c => c.type === 'title' && c.val === titleText);
  if (item) {
    return RARITY_COLORS[item.rarity] || "#94a3b8";
  }
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

  const activeCardAnim = activeCosmetics.card_anim || "anim-none";
  const activeFrame = activeCosmetics.frame || "frame-none";

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
  if (previewAvatar) {
    if (activeAvatar.startsWith('http://') || activeAvatar.startsWith('https://')) {
      previewAvatar.innerHTML = `<img src="${activeAvatar}" alt="Avatar">`;
    } else {
      previewAvatar.innerText = activeAvatar;
    }
  }

  // Ring Borders outline
  if (previewAvatarRing) {
    previewAvatarRing.className = `avatar-ring ${activeBorder}`;
  }

  // Gradients, Card Animations, and Name Plate Frames card backdrop
  if (previewCard) {
    previewCard.className = `gamer-card ${activeTheme} ${activeCardAnim} ${activeFrame}`;
    

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
        data.ownedCosmetics = [
          "avatar:👾", "border:border-common", "theme:theme-common", "title:THE ROOKIE",
          "card_anim:anim-none", "frame:frame-none"
        ];
        needsMerge = true;
      } else {
        const starters = ["card_anim:anim-none", "frame:frame-none"];
        starters.forEach(item => {
          if (!data.ownedCosmetics.includes(item)) {
            data.ownedCosmetics.push(item);
            needsMerge = true;
          }
        });
      }
      if (data.activeCosmetics === undefined) {
        data.activeCosmetics = {
          avatar: data.avatar || "👾",
          border: "border-common",
          theme: "theme-common",
          title: "THE ROOKIE",

          card_anim: "anim-none",
          frame: "frame-none"
        };
        needsMerge = true;
      } else {

        if (!data.activeCosmetics.card_anim) { data.activeCosmetics.card_anim = "anim-none"; needsMerge = true; }
        if (!data.activeCosmetics.frame) { data.activeCosmetics.frame = "frame-none"; needsMerge = true; }
      }

      if (needsMerge) {
        await setDoc(userRef, data, { merge: true });
      }

      userDocData = data;

      // Update layouts
      updateCurrencyDisplay(userDocData);
      updatePreviewCard(userDocData, user);

      // ── Email Verification Rewards & Banner Loop ──
      const verifyBanner = document.getElementById('email-verify-banner');
      const verifyBtn = document.getElementById('btn-verify-email');
      
      if (verifyBanner && verifyBtn) {
        if (user.emailVerified) {
          // If email is verified but they haven't claimed the 100 Gems reward yet
          if (userDocData.emailVerifiedRewardClaimed !== true) {
            try {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                scrap: (userDocData.scrap || 0) + 100,
                emailVerifiedRewardClaimed: true
              });
              userDocData.scrap = (userDocData.scrap || 0) + 100;
              userDocData.emailVerifiedRewardClaimed = true;
              updateCurrencyDisplay(userDocData);
              showToast("🎉 Email verified! +100 Gems claimed successfully! 💎", "success");
            } catch (err) {
              console.error("Error claiming verification reward:", err);
            }
          }
          verifyBanner.style.display = 'none';
        } else {
          // Email is not verified and they haven't claimed the reward
          if (userDocData.emailVerifiedRewardClaimed !== true) {
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
    // Check ownership
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

    } else if (currentLockerCategory === 'card_anim') {
      isEquipped = (active.card_anim === item.val);
    } else if (currentLockerCategory === 'frame') {
      isEquipped = (active.frame === item.val);
    }

    // Create item DOM structure
    const el = document.createElement('div');
    el.className = `inventory-item rarity-${item.rarity}`;
    if (isEquipped) el.classList.add('equipped');
    if (!isOwned) el.classList.add('locked');

    const lockTag = !isOwned ? `<div style="font-size:0.6rem; color:#EF4444; font-weight:800; margin-top:4px;">🔒 ${SCRAP_COSTS[item.rarity]} Gems</div>` : '';

    // Build the visual preview based on item type
    if (item.type === 'theme') {
      el.classList.add('inventory-item--theme');
      el.innerHTML = `
        <div class="theme-preview-card gamer-card ${item.val}" aria-label="${item.name} preview">
          <span class="theme-preview-emoji">👾</span>
        </div>
        <div class="inventory-name" title="${item.name}">${item.name}</div>
        <div class="inventory-rarity-lbl" style="color: ${RARITY_COLORS[item.rarity]};">${item.rarity}</div>
        ${lockTag}
      `;
    } else if (item.type === 'border') {
      el.innerHTML = `
        <div class="border-preview-wrap">
          <div class="avatar-ring ${item.val} border-preview-ring">
            <div class="gamer-avatar" style="font-size:1.8rem; width:52px; height:52px;">👾</div>
          </div>
        </div>
        <div class="inventory-name" title="${item.name}">${item.name}</div>
        <div class="inventory-rarity-lbl" style="color: ${RARITY_COLORS[item.rarity]};">${item.rarity}</div>
        ${lockTag}
      `;
    } else if (item.type === 'avatar') {
      el.innerHTML = `
        <div class="inventory-icon">${item.val}</div>
        <div class="inventory-name" title="${item.name}">${item.name}</div>
        <div class="inventory-rarity-lbl" style="color: ${RARITY_COLORS[item.rarity]};">${item.rarity}</div>
        ${lockTag}
      `;
    } else if (item.type === 'title') {
      el.innerHTML = `
        <div class="inventory-icon" style="color: ${RARITY_COLORS[item.rarity]}; font-size: 0.62rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; padding: 6px 8px; border: 1px solid ${RARITY_COLORS[item.rarity]}44; border-radius: 6px; background: rgba(0,0,0,0.4); max-width: 100%; text-align:center; line-height:1.4;">${item.val}</div>
        <div class="inventory-name" title="${item.name}">${item.name}</div>
        <div class="inventory-rarity-lbl" style="color: ${RARITY_COLORS[item.rarity]};">${item.rarity}</div>
        ${lockTag}
      `;

    } else if (item.type === 'card_anim') {
      el.innerHTML = `
        <div class="inventory-icon" style="font-size: 1.8rem; height: 52px; display: flex; align-items: center; justify-content: center;">${item.emoji || '✨'}</div>
        <div class="inventory-name" title="${item.name}">${item.name}</div>
        <div class="inventory-rarity-lbl" style="color: ${RARITY_COLORS[item.rarity]};">${item.rarity}</div>
        ${lockTag}
      `;
    } else if (item.type === 'frame') {
      el.innerHTML = `
        <div class="inventory-icon" style="font-size: 1.8rem; height: 52px; display: flex; align-items: center; justify-content: center;">${item.emoji || '🖼️'}</div>
        <div class="inventory-name" title="${item.name}">${item.name}</div>
        <div class="inventory-rarity-lbl" style="color: ${RARITY_COLORS[item.rarity]};">${item.rarity}</div>
        ${lockTag}
      `;
    }

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

  // 1. UPDATE LOCAL CACHE & UI IMMEDIATELY (INSTANT OPTIMISTIC UI)
  const updatedActive = { ...(userDocData.activeCosmetics || {}) };

  if (item.type === 'avatar') {
    updatedActive.avatar = item.val;
    userDocData.avatar = item.val;
  } else if (item.type === 'border') {
    updatedActive.border = item.val;
  } else if (item.type === 'theme') {
    updatedActive.theme = item.val;
  } else if (item.type === 'title') {
    updatedActive.title = item.val;

  } else if (item.type === 'card_anim') {
    updatedActive.card_anim = item.val;
  } else if (item.type === 'frame') {
    updatedActive.frame = item.val;
  }

  userDocData.activeCosmetics = updatedActive;

  // Render instantly!
  updatePreviewCard(userDocData, user);
  renderLockerGrid();
  showToast(`Equipped "${item.name}"!`, "success");

  // 2. RUN FIRESTORE WRITE IN BACKGROUND
  try {
    const userRef = doc(db, "users", user.uid);
    const docUpdates = { activeCosmetics: updatedActive };
    if (item.type === 'avatar') {
      docUpdates.avatar = item.val;
    }
    await setDoc(userRef, docUpdates, { merge: true });
  } catch (err) {
    console.error("Error saving equipped item in Firestore:", err);
    showToast("Server sync failed, but equipped locally.", "warning");
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
    showToast(`Insufficient Gems! Need ${cost} Gems but you only have ${currentScrap}.`, "error");
    return;
  }

  const confirmMsg = `Buy "${item.name}" (${item.rarity.toUpperCase()}) directly for ${cost} Gems?`;
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


// Draw based on exact percentage probabilities shown on rates card
function drawRandomCosmetic() {
  const rand = Math.random() * 100;
  let rarity = "common";
  
  if (rand < 55) {
    rarity = "common";
  } else if (rand < 80) {
    rarity = "uncommon";
  } else if (rand < 93) {
    rarity = "rare";
  } else if (rand < 98.5) {
    rarity = "epic";
  } else {
    rarity = "legendary";
  }

  const pool = COSMETICS.filter(c => c.rarity === rarity);
  if (pool.length === 0) return COSMETICS[0];
  
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// Draw a random cosmetic of a specific rarity
function drawRandomCosmeticOfRarity(rarity) {
  const pool = COSMETICS.filter(c => c.rarity === rarity);
  if (pool.length === 0) return COSMETICS[0];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// ── Status LED State Management ──────────────────────────────────────────────
function updateClawLED(state) {
  const clawLed = document.getElementById('claw-led');
  if (!clawLed) return;
  clawLed.classList.remove('led-ready', 'led-moving', 'led-grabbing');
  if (state === 'ready') {
    clawLed.classList.add('led-ready');
  } else if (state === 'moving') {
    clawLed.classList.add('led-moving');
  } else if (state === 'grabbing') {
    clawLed.classList.add('led-grabbing');
  }
}

// ── Interactive Confetti Particle Explosion for All Unlocks ──────────
function triggerConfetti(rarity = 'common') {
  const container = document.getElementById('claw-reveal-modal');
  if (!container) return;
  
  let colors = ['#94A3B8', '#CBD5E1', '#E2E8F0']; // Default common
  let particleCount = 20;
  let useStars = false;

  if (rarity === 'uncommon') {
    colors = ['#10B981', '#34D399', '#059669', '#6EE7B7'];
    particleCount = 25;
  } else if (rarity === 'rare') {
    colors = ['#38BDF8', '#60A5FA', '#0EA5E9', '#93C5FD'];
    particleCount = 35;
  } else if (rarity === 'epic') {
    colors = ['#A78BFA', '#C084FC', '#8B5CF6', '#DDD6FE'];
    particleCount = 45;
  } else if (rarity === 'legendary') {
    colors = ['#F59E0B', '#FBBF24', '#EF4444', '#EC4899', '#38BDF8'];
    particleCount = 60;
    useStars = true;
  }
  
  // Dynamic explosive particle burst
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = '50%';
    p.style.top = '40%'; // Burst from the center of the reveal card!
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    
    const size = Math.random() * 6 + 6; // 6px to 12px
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.borderRadius = Math.random() > 0.4 ? '50%' : '3px';
    p.style.zIndex = '99999';
    
    // Calculate random explosive trajectory vectors!
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 160 + 50;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 20; // slight upward drift
    
    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    
    container.appendChild(p);
    
    setTimeout(() => {
      p.remove();
    }, 1400);
  }

  // Generate spinning stars for legendary unboxings
  if (useStars) {
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.className = 'confetti-piece';
      star.innerText = '⭐';
      star.style.left = '50%';
      star.style.top = '40%';
      star.style.background = 'transparent';
      star.style.fontSize = `${Math.random() * 1.4 + 0.8}rem`;
      star.style.display = 'flex';
      star.style.alignItems = 'center';
      star.style.justifyContent = 'center';
      star.style.animationDelay = `${Math.random() * 0.25}s`;
      star.style.zIndex = '99999';
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 140 + 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 80; // Float upwards heavily!
      
      star.style.setProperty('--tx', `${tx}px`);
      star.style.setProperty('--ty', `${ty}px`);
      
      container.appendChild(star);
      setTimeout(() => {
        star.remove();
      }, 1400);
    }
  }
}

// ── Interactive Claw Machine Logic State ────────────────────────────────────
let clawPositionPercent = 50; // Starting claw center percent
let isClawRunning = false;
let spawnedPrizes = [];

// Initialize colorful mystery prize box stack styled as cute gifts in a dense pile
function initPrizePile() {
  if (!prizePile) return;
  prizePile.innerHTML = '';
  spawnedPrizes = [];

  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const rarityOdds = [55, 25, 13, 5.5, 1.5]; // Authentic challenging gacha: 1.5% Legendary!

  // Spawn 100 mystery gift visual items inside glass chamber layered into an organic 4-layer stacked heap
  const numGifts = 100;
  for (let i = 0; i < numGifts; i++) {
    // Determine random visual color base
    const roll = Math.random() * 100;
    let boxRarity = 'common';
    let sum = 0;
    for (let r = 0; r < rarities.length; r++) {
      sum += rarityOdds[r];
      if (roll <= sum) {
        boxRarity = rarities[r];
        break;
      }
    }

    const box = document.createElement('div');
    box.className = `prize-box prize-box--${boxRarity}`;
    
    // Add the decorative ribbon bow loop knot on top!
    const bow = document.createElement('div');
    bow.className = 'prize-box-bow';
    box.appendChild(bow);

    // Determine layered vertical positioning to form a full physical pile heap
    let posY = 0;
    let minX = 70;
    let maxX = 405;
    
    if (i < 40) {
      // Layer 1 (Base Floor): spread wide sitting on the floor
      posY = Math.floor(Math.random() * 6);
      minX = 70;
      maxX = 405;
    } else if (i < 70) {
      // Layer 2 (Middle Heap): stacked middle gifts spread wide
      posY = Math.floor(Math.random() * 8 + 14);
      minX = 75;
      maxX = 400;
    } else if (i < 90) {
      // Layer 3 (High Peak): stacked higher peak pile
      posY = Math.floor(Math.random() * 8 + 26);
      minX = 85;
      maxX = 390;
    } else {
      // Layer 4 (Top Summit): top summit peak pile
      posY = Math.floor(Math.random() * 8 + 36);
      minX = 100;
      maxX = 375;
    }

    const posX = Math.floor(Math.random() * (maxX - minX) + minX);
    const rot = Math.floor(Math.random() * 70 - 35); // -35deg to 35deg
    
    box.style.cssText = `
      position: absolute;
      left: ${posX}px;
      bottom: ${posY}px;
      transform: rotate(${rot}deg);
    `;
    
    prizePile.appendChild(box);
    spawnedPrizes.push({ element: box, x: posX, y: posY, rarity: boxRarity });
  }
}

// ── Web Audio API Arcade Synthesizer ─────────────────────────────────────────
class ClawAudioController {
  constructor() {
    this.ctx = null;
    this.motorOsc = null;
    this.motorGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    this.resume();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  startMotor() {
    this.resume();
    if (!this.ctx || this.motorOsc) return;

    this.motorOsc = this.ctx.createOscillator();
    this.motorGain = this.ctx.createGain();

    this.motorOsc.type = 'sawtooth';
    this.motorOsc.frequency.setValueAtTime(75, this.ctx.currentTime);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.motorGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.motorGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.1);

    this.motorOsc.connect(filter);
    filter.connect(this.motorGain);
    this.motorGain.connect(this.ctx.destination);

    this.motorOsc.start();
  }

  stopMotor() {
    if (!this.motorOsc) return;
    const osc = this.motorOsc;
    const gain = this.motorGain;
    this.motorOsc = null;
    this.motorGain = null;

    if (this.ctx) {
      gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      setTimeout(() => {
        try { osc.stop(); } catch (e) {}
      }, 200);
    }
  }

  playDropSound() {
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.25);
  }

  playClang() {
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playWinSound() {
    this.resume();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const startTime = this.ctx.currentTime;
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.09);
      
      gain.gain.setValueAtTime(0, startTime + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.04, startTime + idx * 0.09 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.09 + 0.18);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(startTime + idx * 0.09);
      osc.stop(startTime + idx * 0.09 + 0.18);
    });
  }
}
const ClawAudio = new ClawAudioController();

// Enable audio on first touch
document.body.addEventListener('click', () => ClawAudio.resume(), { once: true });
document.body.addEventListener('touchstart', () => ClawAudio.resume(), { once: true });

// ── Interactive Claw Machine Physics State ──────────────────────────────────
let clawX = 50;          // percent
let clawVx = 0;          // velocity
let clawSway = 0;        // sway angle
let clawSwayV = 0;       // sway angular velocity
let activeMoveDirection = null; // 'left', 'right', or null
let clawXTarget = null;  // automated slide target percentage

// Physics tick loop
function updateClawPhysics() {
  if (!isClawRunning) {
    if (activeMoveDirection === 'left') {
      clawVx = Math.max(-1.8, clawVx - 0.12);
      ClawAudio.startMotor();
    } else if (activeMoveDirection === 'right') {
      clawVx = Math.min(1.8, clawVx + 0.12);
      ClawAudio.startMotor();
    } else {
      clawVx *= 0.88;
      if (Math.abs(clawVx) < 0.05) {
        clawVx = 0;
        ClawAudio.stopMotor();
      }
    }
  } else {
    // If automated claw run, handle horizontal gantry travel slides via physics engine!
    if (clawXTarget !== null) {
      const diff = clawXTarget - clawX;
      if (Math.abs(diff) > 0.1) {
        // Smooth distance-based velocity ramping! Eases in and eases out seamlessly!
        const targetVx = Math.sign(diff) * Math.min(2.4, Math.abs(diff) * 0.16);
        clawVx += (targetVx - clawVx) * 0.22; // smooth gantry acceleration & deceleration
        ClawAudio.startMotor();
      } else {
        clawX = clawXTarget;
        clawVx = 0;
        clawXTarget = null;
        ClawAudio.stopMotor();
      }
    } else {
      clawVx *= 0.88;
      if (Math.abs(clawVx) < 0.05) {
        clawVx = 0;
        ClawAudio.stopMotor();
      }
    }
  }

  // Update horizontal position
  clawX = Math.max(16, Math.min(94, clawX + clawVx * 0.45));
  clawPositionPercent = clawX;
  
  if (clawX <= 16 || clawX >= 94) {
    clawVx = 0;
  }

  // Sway spring-damper physics
  const torque = -clawVx * 2.5; 
  const springForce = -clawSway * 0.14; 
  const damping = -clawSwayV * 0.08; 
  
  clawSwayV += torque + springForce + damping;
  clawSwayV *= 0.94; 
  clawSway += clawSwayV * 0.55;

  // Apply transforms
  if (clawAssembly) {
    clawAssembly.style.left = `${clawX}%`;
    clawAssembly.style.transform = `translateX(-50%) rotate(${clawSway}deg)`;
  }

  // Laser sight and target spot positioning/opacity
  const clawLaser = document.getElementById('claw-laser');
  if (clawLaser) {
    clawLaser.style.opacity = isClawRunning ? '0' : '0.85';
  }
  
  const laserTargetSpot = document.getElementById('laser-target-spot');
  if (laserTargetSpot) {
    laserTargetSpot.style.left = `${clawX}%`;
    laserTargetSpot.style.opacity = isClawRunning ? '0' : '0.85';
  }

  requestAnimationFrame(updateClawPhysics);
}

// Start physics loop on load
requestAnimationFrame(updateClawPhysics);

function startMovingClaw(direction) {
  if (isClawRunning) return;
  activeMoveDirection = direction;
  ClawAudio.playClick();
  updateClawLED('moving');
  
  if (joystickBase) {
    joystickBase.classList.remove('tilt-left', 'tilt-right');
    joystickBase.classList.add(direction === 'left' ? 'tilt-left' : 'tilt-right');
  }
}

function stopMovingClaw() {
  activeMoveDirection = null;
  updateClawLED('ready');
  if (joystickBase) {
    joystickBase.classList.remove('tilt-left', 'tilt-right');
  }
}

// Bind button directional controllers
if (btnJoystickLeft) {
  btnJoystickLeft.addEventListener('mousedown', () => startMovingClaw('left'));
  btnJoystickLeft.addEventListener('mouseup', stopMovingClaw);
  btnJoystickLeft.addEventListener('mouseleave', stopMovingClaw);
  
  btnJoystickLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startMovingClaw('left');
  }, { passive: false });
  btnJoystickLeft.addEventListener('touchend', stopMovingClaw);
}

if (btnJoystickRight) {
  btnJoystickRight.addEventListener('mousedown', () => startMovingClaw('right'));
  btnJoystickRight.addEventListener('mouseup', stopMovingClaw);
  btnJoystickRight.addEventListener('mouseleave', stopMovingClaw);
  
  btnJoystickRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startMovingClaw('right');
  }, { passive: false });
  btnJoystickRight.addEventListener('touchend', stopMovingClaw);
}

// Joystick touch drag movement helper
if (joystickBase) {
  joystickBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const baseRect = joystickBase.getBoundingClientRect();
    const centerX = baseRect.left + baseRect.width / 2;
    
    if (touchX < centerX) {
      startMovingClaw('left');
    } else {
      startMovingClaw('right');
    }
  }, { passive: false });
  
  joystickBase.addEventListener('touchend', stopMovingClaw);
}

// ── Interactive Sparks Burst when Claw Clamps Cargo ─────────────────────────
function triggerGrabSparks() {
  const chamber = document.getElementById('claw-chamber');
  if (!chamber) return;
  
  // Find current visual position of the claw hand
  const clawHandEl = document.getElementById('claw-hand');
  if (!clawHandEl) return;
  
  const rect = clawHandEl.getBoundingClientRect();
  const chamberRect = chamber.getBoundingClientRect();
  
  // Calculate relative coordinate offsets inside the chamber
  const posX = rect.left - chamberRect.left + rect.width / 2;
  const posY = rect.top - chamberRect.top + rect.height / 2 + 10;
  
  // Spawn 15 electrical grab sparks!
  for (let i = 0; i < 15; i++) {
    const s = document.createElement('div');
    s.style.cssText = `
      position: absolute;
      left: ${posX}px;
      top: ${posY}px;
      width: 4px;
      height: 4px;
      background: #38bdf8;
      box-shadow: 0 0 6px #38bdf8;
      border-radius: 50%;
      pointer-events: none;
      z-index: 101;
      opacity: 1;
      transition: all 0.5s cubic-bezier(0.1, 0.8, 0.25, 1);
    `;
    chamber.appendChild(s);
    
    // Animate sparks outward exploding from claw fingers!
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 45 + 15;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    requestAnimationFrame(() => {
      s.style.transform = `translate(${tx}px, ${ty}px) scale(0.1)`;
      s.style.opacity = '0';
    });
    
    setTimeout(() => {
      s.remove();
    }, 550);
  }
}

// Dynamic helper to wait until claw arrives at target
async function waitForClawArrival() {
  return new Promise((resolve) => {
    function check() {
      if (clawXTarget === null) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    }
    check();
  });
}

// ── Interactive Claw Drop Sequence ──────────────────────────────────────────
async function performClawDrop() {
  if (isClawRunning) return;
  
  const user = auth.currentUser;
  if (!user || !userDocData) {
    showToast("Please log in to play the claw machine!", "error");
    return;
  }

  const currentCoins = userDocData.playCoins !== undefined ? userDocData.playCoins : 200;
  if (currentCoins < 100) {
    showToast("Requires 100 Coins to play!", "error");
    return;
  }

  isClawRunning = true;
  
  // Disable controls
  if (btnClawDrop) btnClawDrop.disabled = true;
  if (btnJoystickLeft) btnJoystickLeft.disabled = true;
  if (btnJoystickRight) btnJoystickRight.disabled = true;

  // 1. Deduct 100 Coins
  const userRef = doc(db, "users", user.uid);
  const nextCoins = currentCoins - 100;
  
  try {
    await updateDoc(userRef, { playCoins: nextCoins });
    userDocData.playCoins = nextCoins;
    updateCurrencyDisplay(userDocData);
  } catch (deductErr) {
    console.error("Coin deduction failed:", deductErr);
    showToast("Transaction failed. Try again.", "error");
    isClawRunning = false;
    if (btnClawDrop) btnClawDrop.disabled = false;
    if (btnJoystickLeft) btnJoystickLeft.disabled = false;
    if (btnJoystickRight) btnJoystickRight.disabled = false;
    updateClawLED('ready');
    return;
  }

  showToast("🕹️ Claw dropping! Good luck!", "success");
  ClawAudio.playDropSound();
  updateClawLED('moving'); // State LED -> Moving yellow flash

  // 2. Open Claw Fingers at the Top (Phase 1a)
  if (clawHand) {
    clawHand.classList.remove('is-closed');
    clawHand.classList.add('is-open');
  }
  ClawAudio.playClang();
  triggerHaptic('light');
  
  // Wait 400ms for prongs to flare open at the top
  await new Promise(res => setTimeout(res, 400));

  // 3. Extend Claw String Downward (Phase 1b)
  if (clawString) {
    clawString.style.transition = 'height 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // Gravity descent curve
    clawString.style.height = '210px';
  }
  if (clawHand) {
    clawHand.style.transition = 'transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    clawHand.style.transform = 'translate(-50%, 100%) scale(1.05)';
  }

  // Wait 1.1 seconds for claw string extension to complete
  await new Promise(res => setTimeout(res, 1100));
  triggerHaptic('light');

  // Slacken bounce on pile contact!
  if (clawString) {
    clawString.style.transition = 'height 0.12s ease-out';
    clawString.style.height = '218px';
    await new Promise(res => setTimeout(res, 120));
    clawString.style.transition = 'height 0.15s ease-in-out';
    clawString.style.height = '210px';
    await new Promise(res => setTimeout(res, 150));
  }

  // 3. Find top-most visual prize box box horizontally close to claw
  const chamberRect = document.getElementById('claw-chamber').getBoundingClientRect();
  const clawTargetX = (clawPositionPercent / 100) * chamberRect.width;
  
  let closestBox = null;
  
  // Find all boxes within a reasonable horizontal proximity (e.g. 26px)
  const nearbyBoxes = spawnedPrizes.filter(b => Math.abs(b.x - clawTargetX) < 26);
  
  if (nearbyBoxes.length > 0) {
    // Grab the top-most (highest Y coordinate) box in proximity!
    nearbyBoxes.sort((a, b) => b.y - a.y);
    closestBox = nearbyBoxes[0];
  } else {
    // Fallback to absolute closest horizontal box if none are directly under
    let absoluteClosest = null;
    let absoluteMinDiff = Infinity;
    spawnedPrizes.forEach(b => {
      const diff = Math.abs(b.x - clawTargetX);
      if (diff < absoluteMinDiff) {
        absoluteMinDiff = diff;
        absoluteClosest = b;
      }
    });
    closestBox = absoluteClosest;
  }

  // Determine rolled prize matching the grabbed box's rarity
  const grabbedRarity = closestBox ? closestBox.rarity : 'common';
  const rolledItem = drawRandomCosmeticOfRarity(grabbedRarity);
  const owned = userDocData.ownedCosmetics || [];
  const isDuplicate = owned.includes(rolledItem.id) || rolledItem.rarity === 'common';

  // 4. Claw Grab / Close Fingers around box (Phase 2)
  updateClawLED('grabbing'); // State LED -> Grabbing solid red
  if (clawHand) {
    clawHand.classList.remove('is-open');
    clawHand.classList.add('is-closed');
  }
  ClawAudio.playClang();
  triggerHaptic('medium');
  triggerGrabSparks();

  // Recoil compression bounce on grab clamping!
  if (clawString) {
    clawString.style.transition = 'height 0.12s ease-out';
    clawString.style.height = '198px';
  }

  let prizeBoxNode = null;
  if (closestBox && closestBox.element) {
    // Hide box from bottom pile
    closestBox.element.style.opacity = '0';
    closestBox.element.style.transition = 'opacity 0.2s';
    
    // Create box inside claw hand
    prizeBoxNode = document.createElement('div');
    prizeBoxNode.className = `prize-box prize-box--${closestBox.rarity}`;
    prizeBoxNode.style.cssText = `
      position: absolute;
      bottom: -15px;
      left: 50%;
      border-radius: 4px;
      z-index: 100;
    `;
    clawHand.appendChild(prizeBoxNode);
  }

  // Wait 120ms for upward compression bounce, then stretch string taut
  await new Promise(res => setTimeout(res, 120));
  if (clawString) {
    clawString.style.transition = 'height 0.15s ease-in-out';
    clawString.style.height = '210px';
  }
  // Wait remaining 480ms of the 600ms grab window
  await new Promise(res => setTimeout(res, 480));

  // 5. Retract Gantry String (Phase 3)
  updateClawLED('grabbing'); // Keep red solid as it ascends with cargo
  if (clawString) {
    // Retract with a heavy spring-rebound overshoot curve!
    clawString.style.transition = 'height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    clawString.style.height = '40px';
  }

  // Wait 1.2 seconds for spring retraction and settling oscillation
  await new Promise(res => setTimeout(res, 1200));

  // 6. Slide Claw Assembly to Left Drop Chute (Phase 4)
  // Use our continuous physics engine to travel left to the center of the chute (16%)
  clawXTarget = 16; 
  await waitForClawArrival();

  // 7. Open Claw / Drop Prize Box down chute (Phase 5)
  updateClawLED('moving'); // Back to yellow flash as cargo drops
  if (clawHand) {
    clawHand.classList.remove('is-closed');
  }
  ClawAudio.playClang();

  if (prizeBoxNode) {
    // 1. Get absolute positions relative to the entire chamber container
    const chamber = document.getElementById('claw-chamber');
    const boxRect = prizeBoxNode.getBoundingClientRect();
    const chamberRect = chamber.getBoundingClientRect();
    const relLeft = boxRect.left - chamberRect.left;
    const relTop = boxRect.top - chamberRect.top;

    // 2. Transfer element from claw hand to chamber container so it can drop all the way down
    prizeBoxNode.style.transition = 'none';
    prizeBoxNode.style.animation = 'none';
    prizeBoxNode.style.left = `${relLeft}px`;
    prizeBoxNode.style.top = `${relTop}px`;
    prizeBoxNode.style.bottom = 'auto';
    prizeBoxNode.style.transform = 'scale(0.8)';
    chamber.appendChild(prizeBoxNode);

    // 3. Force reflow
    prizeBoxNode.offsetHeight;

    // 4. Premium gravity fall acceleration transition completely off-screen below the bottom!
    prizeBoxNode.style.transition = 'all 0.85s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
    prizeBoxNode.style.top = `${chamberRect.height + 40}px`;
    prizeBoxNode.style.opacity = '0';
    
    const chuteOutlet = document.getElementById('chute-outlet');
    if (chuteOutlet) {
      setTimeout(() => {
        chuteOutlet.innerText = "🎁";
        chuteOutlet.style.transform = 'scale(1.25)';
        triggerHaptic('light');
        setTimeout(() => chuteOutlet.style.transform = 'scale(1)', 220);
      }, 450);
    }
  }

  // Release recoil upward jump!
  if (clawString) {
    clawString.style.transition = 'height 0.1s ease-out';
    clawString.style.height = '24px'; // jump up
    setTimeout(() => {
      clawString.style.transition = 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'; // spring settle back to top
      clawString.style.height = '40px';
    }, 100);
  }

  // Trigger sudden horizontal sway impulse on mass release!
  clawSwayV += (Math.random() > 0.5 ? 1 : -1) * 9.5;

  // Wait 0.85 seconds for gravity falling drop to finish
  await new Promise(res => setTimeout(res, 850));

  // 8. Open Prize Win Reveal Modal Popup (Phase 6)
  if (clawRevealModal) {
    // Inject rarity custom CSS color variable for card glow
    clawRevealModal.style.setProperty('--loot-rarity-color', RARITY_COLORS[rolledItem.rarity]);

    // Populate modal tags
    if (modalRevealIcon) {
      if (rolledItem.type === 'avatar') {
        modalRevealIcon.innerHTML = `<span style="font-size: 4rem; display: block; animation: floatHolo 3s infinite ease-in-out;">${rolledItem.val}</span>`;
      } else {
        modalRevealIcon.innerHTML = `
          <div class="modal-present rarity-${rolledItem.rarity}">
            <div class="modal-present-bow"></div>
          </div>
        `;
      }
    }
    
    const modalGlow = document.getElementById('modal-reveal-glow');
    if (modalGlow) {
      modalGlow.style.background = `radial-gradient(circle, ${RARITY_COLORS[rolledItem.rarity]} 0%, transparent 68%)`;
    }

    if (modalRevealBadge) {
      modalRevealBadge.innerText = `${rolledItem.rarity.toUpperCase()} UNLOCK`;
      modalRevealBadge.style.borderColor = RARITY_COLORS[rolledItem.rarity];
      modalRevealBadge.style.color = RARITY_COLORS[rolledItem.rarity];
    }
    if (modalRevealName) {
      modalRevealName.innerText = rolledItem.name;
    }
    if (modalRevealType) {
      modalRevealType.innerText = rolledItem.type;
    }

    // Direct database update
    try {
      if (!isDuplicate) {
        // Add to owned list
        const updatedOwned = [...owned, rolledItem.id];
        await updateDoc(userRef, { ownedCosmetics: updatedOwned });
        userDocData.ownedCosmetics = updatedOwned;

        // Custom Equip Button Hook - Fetch fresh to prevent memory leaks or disconnected handles
        const equipBtn = document.getElementById('btn-modal-equip');
        if (equipBtn) {
          equipBtn.style.display = 'block';
          const freshEquipBtn = equipBtn.cloneNode(true);
          equipBtn.replaceWith(freshEquipBtn);
          freshEquipBtn.addEventListener('click', () => {
            equipItem(rolledItem);
            clawRevealModal.classList.remove('active');
          });
        }
        ClawAudio.playWinSound();
        triggerHaptic(rolledItem.rarity === 'legendary' ? 'heavy' : rolledItem.rarity === 'epic' || rolledItem.rarity === 'rare' ? 'medium' : 'light');
        showToast(`NEW UNLOCK! You grabbed a ${rolledItem.rarity.toUpperCase()} "${rolledItem.name}"!`, "success");
      } else {
        // Recycle Duplicate to Gems
        const scrapCompensation = DUP_REWARDS[rolledItem.rarity] || 10;
        const nextScrap = (userDocData.scrap || 0) + scrapCompensation;
        await updateDoc(userRef, { scrap: nextScrap });
        userDocData.scrap = nextScrap;
        
        updateCurrencyDisplay(userDocData);

        const equipBtn = document.getElementById('btn-modal-equip');
        if (equipBtn) {
          equipBtn.style.display = 'none'; // hide equip button for recycled duplicates
        }
        
        if (modalRevealBadge) {
          modalRevealBadge.innerText = `DUPLICATE (+${scrapCompensation} GEMS)`;
          modalRevealBadge.style.color = '#10B981';
          modalRevealBadge.style.borderColor = '#10B981';
        }
        
        ClawAudio.playClick();
        triggerHaptic('light');
        showToast(`Duplicate! Converted to +${scrapCompensation} Gems.`, "warning");
      }

      // Open visual modal
      clawRevealModal.classList.add('active');
      
      // Fire explosive unboxing particles matching rolled rarity!
      triggerConfetti(rolledItem.rarity);

      // Re-render inventory grid
      renderLockerGrid();

    } catch (dbErr) {
      console.error("DB update failed during claw sequence:", dbErr);
      showToast("Error updating inventory items.", "error");
    }
  }

  // 9. Reset Claw Position (Phase 7)
  if (prizeBoxNode) prizeBoxNode.remove();
  
  if (clawHand) {
    clawHand.classList.remove('is-open', 'is-closed');
  }

  // Slide back to center 50% using our continuous physics engine!
  clawXTarget = 50;
  await waitForClawArrival();

  // Regenerate boxes pile
  initPrizePile();

  // Unlock controls & reset LED back to ready green pulse
  isClawRunning = false;
  updateClawLED('ready');
  if (btnClawDrop) btnClawDrop.disabled = false;
  if (btnJoystickLeft) btnJoystickLeft.disabled = false;
  if (btnJoystickRight) btnJoystickRight.disabled = false;
}


// Bind Grab Prize click handler
if (btnClawDrop) {
  btnClawDrop.addEventListener('click', performClawDrop);
}

// Bind win modal Close/Continue buttons
if (btnModalContinue) {
  btnModalContinue.addEventListener('click', () => {
    if (clawRevealModal) clawRevealModal.classList.remove('active');
  });
}

// Trigger initial piles load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPrizePile();
  });
} else {
  initPrizePile();
}

// Regenerate prizes if they navigate to vending panel
if (tabVending) {
  tabVending.addEventListener('click', () => {
    initPrizePile();
  });
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
      showToast("Sandbox: Credited +500 Coins! 🪙", "success");
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
      showToast("Sandbox: Credited +100 Gems! 💎", "success");
    } catch (e) {
      console.error(e);
      showToast("Sandbox: Failed to add Gems.", "error");
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

    if (!confirm("Are you sure you want to reset all inventory progress, Gems, and custom equipped visuals to developer starter levels?")) {
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

// ── GEMS STORE AND INTERACTIVE CHECKOUT SUITE ──
function initGemsStore() {
  const storeModal = document.getElementById('store-modal');
  const checkoutModal = document.getElementById('checkout-modal');
  const btnOpenStore = document.getElementById('btn-open-store');
  const btnCloseStore = document.getElementById('store-close');
  const checkoutStatus = document.getElementById('checkout-status');
  const checkoutDesc = document.getElementById('checkout-desc');
  const btnWatchAd = document.getElementById('btn-watch-ad');

  if (!storeModal || !checkoutModal) return;

  // Open Store
  if (btnOpenStore) {
    btnOpenStore.addEventListener('click', () => {
      const user = auth.currentUser;
      if (!user) {
        showToast("⚠️ Please log in to access the Gems Store!", "warning");
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'flex';
        return;
      }
      storeModal.style.display = 'flex';
    });
  }

  // Close Store
  if (btnCloseStore) {
    btnCloseStore.addEventListener('click', () => {
      storeModal.style.display = 'none';
    });
  }

  // Click handler for Store Modal background to close
  storeModal.addEventListener('click', (e) => {
    if (e.target === storeModal) {
      storeModal.style.display = 'none';
    }
  });

  // Watch Ad Simulator
  if (btnWatchAd) {
    btnWatchAd.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user || !userDocData) return;

      storeModal.style.display = 'none';
      checkoutModal.style.display = 'flex';
      checkoutStatus.innerText = "Loading Video Ad...";
      checkoutDesc.innerText = "Buffering rewarding video stream. Please do not close the window.";

      setTimeout(() => {
        checkoutStatus.innerText = "Ad Playing (5s)...";
        checkoutDesc.innerText = "🍿 Watching a Playhaus sponsored commercial. Earn +20 Gems upon completion!";
        
        setTimeout(async () => {
          try {
            const userRef = doc(db, "users", user.uid);
            const nextScrap = (userDocData.scrap || 0) + 20;
            await updateDoc(userRef, { scrap: nextScrap });
            userDocData.scrap = nextScrap;
            updateCurrencyDisplay(userDocData);
            
            checkoutModal.style.display = 'none';
            showToast("🍿 Ad watched! Earned +20 Gems! 💎", "success");
          } catch (err) {
            console.error(err);
            checkoutModal.style.display = 'none';
            showToast("❌ Failed to claim ad reward.", "error");
          }
        }, 5000);
      }, 2000);
    });
  }

  // Tier Cards clicks
  const storeCards = document.querySelectorAll('.store-card');
  storeCards.forEach(card => {
    card.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user || !userDocData) return;

      const gems = parseInt(card.dataset.gems);
      const price = card.dataset.price;

      storeModal.style.display = 'none';
      checkoutModal.style.display = 'flex';
      checkoutStatus.innerText = "Contacting App Store...";
      checkoutDesc.innerText = `Establishing a secure Sandbox checkout connection for ${gems} Gems.`;

      setTimeout(() => {
        checkoutStatus.innerText = "Apple Pay / Stripe secure checkout active...";
        checkoutDesc.innerText = `Processing simulated Sandbox payment of $${price}. Please authorize transaction.`;

        setTimeout(async () => {
          try {
            const userRef = doc(db, "users", user.uid);
            const nextScrap = (userDocData.scrap || 0) + gems;
            await updateDoc(userRef, { scrap: nextScrap });
            userDocData.scrap = nextScrap;
            updateCurrencyDisplay(userDocData);
            
            checkoutModal.style.display = 'none';
            showToast(`🛒 Purchase successful! +${gems} Gems credited to your locker! 💎`, "success");
          } catch (err) {
            console.error(err);
            checkoutModal.style.display = 'none';
            showToast("❌ Checkout authorization failed.", "error");
          }
        }, 3000);
      }, 2000);
    });
  });
}

// Initialize Gems Store listeners
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGemsStore);
} else {
  initGemsStore();
}

// ── Hamburger Menu Toggle ───────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

