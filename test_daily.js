import { getDailyGame, getYesterdayDateString } from './js/daily.js';

console.log("=== DIAGNOSTIC ===");
console.log("Current System Date:", new Date().toString());
console.log("UTC Date String:", new Date().toUTCString());

const { game, dateString } = getDailyGame();
console.log("getDailyGame result:");
console.log("- game ID:", game ? game.id : "NONE");
console.log("- game Title:", game ? game.title : "NONE");
console.log("- dateString:", dateString);
console.log("- yesterdayDateString:", getYesterdayDateString());
