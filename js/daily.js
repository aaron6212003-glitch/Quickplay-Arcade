import { GAMES } from '../data/games.js';

export function getDailyGame() {
  // Rotates through all available games in a consistent sequence
  const gamesToRotate = ["color-guess", "higher-lower", "word-rush", "word-gravity", "math-avalanche", "tanks"];
  const today = new Date();
  
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
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yyyy = yesterday.getUTCFullYear();
  const mm = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
