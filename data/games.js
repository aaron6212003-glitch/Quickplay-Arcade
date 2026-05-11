export const CATEGORIES = [
  { id: "all", label: "🎮 All" },
  { id: "color-games", label: "🎨 Color Games" },
  { id: "battle-simulators", label: "⚔️ Battle" },
  { id: "sports-games", label: "🏆 Sports" },
  { id: "trivia", label: "🧠 Trivia" },
  { id: "guessing-games", label: "🔍 Guessing" },
  { id: "daily-challenges", label: "🔥 Daily" },
];

// Add new games here — they auto-appear site-wide
export const GAMES = [
  { id: "color-guess", title: "Color Guess Challenge", description: "Guess the exact color of famous cartoon characters, logos, and objects.", category: "color-games", difficulty: "Easy", playTime: "30 sec", emoji: "🎨", gradient: ["#FF6B6B","#FF8E53"], badges: ["trending","new"], featured: true },
  { id: "logo-memory", title: "Logo Memory Test", description: "Guess the missing color, shape, or detail from popular logos.", category: "color-games", difficulty: "Medium", playTime: "1 min", emoji: "🏷️", gradient: ["#A18CD1","#FBC2EB"], badges: ["trending"], featured: true },
  { id: "battle-ball", title: "Battle Ball Simulator", description: "Watch two crazy balls battle it out with spikes, parasites, shields, and upgrades.", category: "battle-simulators", difficulty: "Easy", playTime: "15 sec", emoji: "⚔️", gradient: ["#F093FB","#F5576C"], badges: ["hot"], featured: true },
  { id: "sports-trivia", title: "Sports Trivia Blitz", description: "Quick sports questions against the clock.", category: "sports-games", difficulty: "Medium", playTime: "1 min", emoji: "🏆", gradient: ["#4FACFE","#00F2FE"], badges: ["new"], featured: true },
  { id: "would-you-rather", title: "Would You Rather Arena", description: "Pick a side and see what everyone else chose.", category: "trivia", difficulty: "Easy", playTime: "15 sec", emoji: "🤔", gradient: ["#FA709A","#FEE140"], badges: ["hot","new"], featured: true },
  { id: "guess-the-player", title: "Guess the Player", description: "Guess the athlete from clues, stats, or a blurred image.", category: "guessing-games", difficulty: "Hard", playTime: "1 min", emoji: "🏅", gradient: ["#43E97B","#38F9D7"], badges: ["trending"], featured: true },
  { id: "emoji-code", title: "Emoji Code Breaker", description: "Decode the hidden phrase using only emojis as clues.", category: "guessing-games", difficulty: "Hard", playTime: "30 sec", emoji: "😂", gradient: ["#FDDB92","#D1FDFF"], badges: ["new"], featured: false },
  { id: "viral-challenge", title: "Today's Viral Challenge", description: "The daily game everyone is talking about. New every 24 hours.", category: "daily-challenges", difficulty: "Medium", playTime: "1 min", emoji: "🔥", gradient: ["#FF0844","#FFB199"], badges: ["daily","hot"], featured: false },
];

export const LEADERBOARD = [
  { rank: 1, username: "SpeedKing99",   score: 9850, game: "Color Guess Challenge",  avatar: "👑" },
  { rank: 2, username: "TriviaMaster",  score: 9400, game: "Sports Trivia Blitz",    avatar: "🏆" },
  { rank: 3, username: "LogoLegend",    score: 8970, game: "Logo Memory Test",        avatar: "🥇" },
  { rank: 4, username: "BallBattler_X", score: 8600, game: "Battle Ball Simulator",  avatar: "⚔️" },
  { rank: 5, username: "QuickFingers",  score: 8200, game: "Would You Rather Arena", avatar: "🎯" },
  { rank: 6, username: "AthleteMind",   score: 7750, game: "Guess the Player",        avatar: "🏅" },
  { rank: 7, username: "NeonGamer",     score: 7100, game: "Color Guess Challenge",  avatar: "🌈" },
  { rank: 8, username: "DailyPlayer",   score: 6900, game: "Viral Challenge",         avatar: "🔥" },
];
