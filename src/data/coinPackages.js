export const COIN_RATE = 100; // 100 coins = $1 USD

export const COIN_PACKAGES = [
  { id: "p1",   coins: 100,   usd: 1,   label: "$1",   bonus: 0,    popular: false },
  { id: "p5",   coins: 500,   usd: 5,   label: "$5",   bonus: 0,    popular: false },
  { id: "p10",  coins: 1100,  usd: 10,  label: "$10",  bonus: 100,  popular: true  },
  { id: "p50",  coins: 5500,  usd: 50,  label: "$50",  bonus: 500,  popular: false },
  { id: "p100", coins: 12000, usd: 100, label: "$100", bonus: 2000, popular: false },
];

export const CURRENCY_RATES = {
  USD: { symbol: "$",  rate: 1,       name: "US Dollar" },
  NGN: { symbol: "₦",  rate: 1550,    name: "Nigerian Naira" },
  GBP: { symbol: "£",  rate: 0.79,    name: "British Pound" },
  EUR: { symbol: "€",  rate: 0.92,    name: "Euro" },
  GHS: { symbol: "₵",  rate: 15.2,    name: "Ghana Cedi" },
  KES: { symbol: "KSh", rate: 129,    name: "Kenyan Shilling" },
  ZAR: { symbol: "R",  rate: 18.5,    name: "South African Rand" },
};

export function localToUsd(amount, currency) {
  const r = CURRENCY_RATES[currency]?.rate || 1;
  return amount / r;
}

export function usdToCoins(usd) {
  return Math.floor(usd * COIN_RATE);
}

export function coinsToUsd(coins) {
  return (coins / COIN_RATE).toFixed(2);
}
