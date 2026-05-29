import { GAMES } from '../data/games.js';

let timeOffset = 0; // difference between client clock and UTC server time

// Initialize fast background time synchronization
async function syncTimeOffset() {
  try {
    const start = performance.now();
    // Fetch UTC time from a fast, reliable public time endpoint
    const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { cache: 'no-store' });
    const data = await res.json();
    const serverTime = new Date(data.utc_datetime).getTime();
    const latency = (performance.now() - start) / 2;
    
    // Apply network delay adjustment
    const adjustedServerTime = serverTime + latency;
    timeOffset = adjustedServerTime - Date.now();
    console.log(`[Daily Sync] Server time synchronized. Offset: ${timeOffset}ms`);
  } catch (err) {
    console.warn("[Daily Sync] Could not sync UTC server time. Using device clock fallback.", err);
  }
}

// Background sync on load
syncTimeOffset();

export function getDailyGame() {
  // Rotates through all available games in a consistent sequence
  const gamesToRotate = ["color-guess", "higher-lower", "word-rush", "word-gravity", "math-avalanche", "tanks"];
  
  // Apply synced server time offset
  const today = new Date(Date.now() + timeOffset);
  
  // Normalize to UTC for global sync
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;
  
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const gameIndex = daysSinceEpoch % gamesToRotate.length;
  const gameId = gamesToRotate[gameIndex];
  
  const game = GAMES.find(g => g.id === gameId);
  return {
    game,
    dateString
  };
}

export function getYesterdayDateString() {
  const yesterday = new Date(Date.now() + timeOffset);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yyyy = yesterday.getUTCFullYear();
  const mm = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
