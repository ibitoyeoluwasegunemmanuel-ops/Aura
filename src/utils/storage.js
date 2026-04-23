export const sto = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("aura_" + k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("aura_" + k, JSON.stringify(v)); } catch {} },
};
