export const GIFTS = [
  // LOW tier — 100–500 coins
  { id: "rose",      name: "Rose",        icon: "🌹", coins: 100,   tier: "low" },
  { id: "heart",     name: "Heart",       icon: "❤️", coins: 150,   tier: "low" },
  { id: "star",      name: "Star",        icon: "⭐", coins: 200,   tier: "low" },
  { id: "thumbs",    name: "Big Up",      icon: "👍", coins: 250,   tier: "low" },
  { id: "balloon",   name: "Balloon",     icon: "🎈", coins: 300,   tier: "low" },
  { id: "icecream",  name: "Ice Cream",   icon: "🍦", coins: 400,   tier: "low" },
  { id: "music",     name: "Music",       icon: "🎵", coins: 500,   tier: "low" },

  // MID tier — 1,000–3,000 coins
  { id: "giftbox",   name: "Gift Box",    icon: "🎁", coins: 1000,  tier: "mid" },
  { id: "trophy",    name: "Trophy",      icon: "🏆", coins: 1500,  tier: "mid" },
  { id: "diamond",   name: "Diamond",     icon: "💎", coins: 2000,  tier: "mid" },
  { id: "rocket",    name: "Rocket",      icon: "🚀", coins: 2500,  tier: "mid" },
  { id: "minicrown", name: "Mini Crown",  icon: "👑", coins: 3000,  tier: "mid" },

  // HIGH tier — 5,000–15,000 coins
  { id: "car",       name: "Luxury Car",  icon: "🏎️", coins: 5000,  tier: "high" },
  { id: "castle",    name: "Castle",      icon: "🏰", coins: 7000,  tier: "high" },
  { id: "crown",     name: "Crown",       icon: "💫", coins: 10000, tier: "high" },
  { id: "rainbow",   name: "Rainbow",     icon: "🌈", coins: 12000, tier: "high" },
  { id: "galaxy",    name: "Galaxy",      icon: "🌌", coins: 15000, tier: "high" },

  // ELITE tier — 20,000–30,000 coins
  { id: "supercrown", name: "Super Crown", icon: "✨", coins: 20000, tier: "elite" },
  { id: "dragon",    name: "Gold Dragon", icon: "🐉", coins: 25000, tier: "elite" },
  { id: "palace",    name: "Crystal Palace", icon: "🔮", coins: 30000, tier: "elite" },

  // ULTRA tier — 40,000–50,000 coins
  { id: "universe",  name: "Universe",    icon: "🌠", coins: 40000, tier: "ultra" },
  { id: "supreme",   name: "AURA Supreme",icon: "⚡", coins: 50000, tier: "ultra" },
];

export const TIER_CONFIG = {
  low:   { color: "#aaaaaa", glowColor: "#ffffff33", animDuration: 1.2, scale: 1.0 },
  mid:   { color: "#00ffe5", glowColor: "#00ffe544", animDuration: 1.8, scale: 1.4 },
  high:  { color: "#ffd700", glowColor: "#ffd70066", animDuration: 2.4, scale: 1.9 },
  elite: { color: "#ff4dff", glowColor: "#ff4dff88", animDuration: 3.0, scale: 2.5 },
  ultra: { color: "#ff6b2b", glowColor: "#ff6b2baa", animDuration: 4.0, scale: 3.5 },
};

export const PLATFORM_FEE = 0.30; // 30% platform cut
