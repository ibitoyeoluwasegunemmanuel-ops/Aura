function getVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(x => x.name.includes("Google") && x.lang.startsWith("en"))
      || voices.find(x => x.lang.startsWith("en"));
}

export function speakFull(text, onDone) {
  if (!window.speechSynthesis) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#`[\]>_]/g, "").trim();
  if (!clean) { onDone?.(); return; }
  const sentences = clean.match(/[^.!?\n]+[.!?\n]*/g) || [clean];
  let idx = 0;
  const next = () => {
    if (idx >= sentences.length) { onDone?.(); return; }
    const u = new SpeechSynthesisUtterance(sentences[idx++].trim());
    u.rate = 1.05; u.pitch = 1.1;
    const v = getVoice(); if (v) u.voice = v;
    u.onend = next;
    u.onerror = next;
    window.speechSynthesis.speak(u);
  };
  next();
}
