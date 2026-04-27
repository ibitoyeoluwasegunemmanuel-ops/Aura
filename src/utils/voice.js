function getLang() {
  try { return JSON.parse(localStorage.getItem("aura_aura_lang")) || "en-US"; }
  catch { return "en-US"; }
}

function getVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  const base = lang?.split("-")[0] || "en";
  return voices.find(x => x.name.includes("Google") && x.lang === lang)
      || voices.find(x => x.lang === lang)
      || voices.find(x => x.name.includes("Google") && x.lang.startsWith(base))
      || voices.find(x => x.lang.startsWith(base))
      || voices.find(x => x.lang.startsWith("en"));
}

export function speakFull(text, onDone) {
  if (!window.speechSynthesis) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const lang  = getLang();
  const clean = text.replace(/[*#`[\]>_]/g, "").trim();
  if (!clean) { onDone?.(); return; }
  const sentences = clean.match(/[^.!?\n]+[.!?\n]*/g) || [clean];
  let idx = 0;
  const next = () => {
    if (idx >= sentences.length) { onDone?.(); return; }
    const u = new SpeechSynthesisUtterance(sentences[idx++].trim());
    u.lang = lang; u.rate = 1.05; u.pitch = 1.1;
    const v = getVoice(lang); if (v) u.voice = v;
    u.onend = next;
    u.onerror = next;
    window.speechSynthesis.speak(u);
  };
  next();
}
