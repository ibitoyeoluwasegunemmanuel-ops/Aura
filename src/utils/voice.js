function getVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(x => x.name.includes("Google") && x.lang.startsWith("en"))
      || voices.find(x => x.lang.startsWith("en"));
}

export function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#`[\]]/g, "").trim();
  const u = new SpeechSynthesisUtterance(clean.slice(0, 300));
  u.rate = 1.05; u.pitch = 1.1;
  const v = getVoice(); if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export function speakFull(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#`[\]]/g, "").trim();
  const sentences = clean.match(/[^.!?\n]+[.!?\n]*/g) || [clean];
  let i = 0;
  const next = () => {
    if (i >= sentences.length) return;
    const u = new SpeechSynthesisUtterance(sentences[i].trim());
    u.rate = 1.05; u.pitch = 1.1;
    const v = getVoice(); if (v) u.voice = v;
    u.onend = () => { i++; next(); };
    window.speechSynthesis.speak(u);
  };
  next();
}
