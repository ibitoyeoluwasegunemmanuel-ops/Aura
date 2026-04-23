import { useState, useRef } from "react";
import { C } from "../theme/colors";
import { Card, Lbl } from "../components/ui";
import { callClaude } from "../utils/api";
import { speakFull } from "../utils/voice";
import { LANGS } from "../data/languages";

export default function TranslateScreen() {
  const [toLang, setToLang]   = useState("English");
  const [text, setText]       = useState("");
  const [result, setResult]   = useState("");
  const [detected, setDetected] = useState("");
  const [loading, setLoading] = useState(false);
  const [earMode, setEarMode] = useState(false);
  const [copied, setCopied]   = useState(false);
  const earRef = useRef();

  const doTranslate = async (t) => {
    if (!t?.trim()) return;
    setText(t); setLoading(true); setResult("");
    const res = await callClaude(
      [{ role: "user", content: t }],
      `Universal translator. Detect language then translate to ${toLang}. Respond EXACTLY:\nDETECTED: [language]\nTRANSLATION: [translated text only]`
    );
    setDetected(res.match(/DETECTED:\s*(.+)/)?.[1]?.trim() || "");
    const trans = res.match(/TRANSLATION:\s*([\s\S]+)/)?.[1]?.trim() || res;
    setResult(trans);
    speakFull(trans);
    setLoading(false);
  };

  const listenOnce = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome for voice"); return; }
    const r = new SR(); r.lang = ""; r.interimResults = false;
    r.onstart = () => setLoading(true);
    r.onend   = () => setLoading(false);
    r.onresult = (e) => doTranslate(e.results[0][0].transcript);
    r.onerror  = () => setLoading(false);
    try { r.start(); } catch {}
  };

  const toggleEar = () => {
    if (earMode) { earRef.current?.stop(); setEarMode(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome"); return; }
    const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = "";
    r.onresult = (e) => doTranslate(e.results[e.results.length - 1][0].transcript);
    r.onerror  = () => setEarMode(false);
    earRef.current = r;
    try { r.start(); setEarMode(true); } catch {}
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.green}>Universal Translator · {LANGS.length} Languages · Auto-Detect</Lbl>

      <div>
        <Lbl color={C.green}>Translate Into</Lbl>
        <select value={toLang} onChange={e => setToLang(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
          {LANGS.map(l => <option key={l} style={{ background: "#111" }}>{l}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 7 }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Type text or tap 🎙 to speak / hold near someone talking..."
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", height: 70, lineHeight: 1.6 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <button onClick={listenOnce} style={{ background: loading ? `${C.red}20` : `${C.green}15`, border: `1px solid ${loading ? C.red + "44" : C.green + "44"}`, borderRadius: 9, padding: "10px 11px", cursor: "pointer", fontSize: 20, animation: loading ? "pulse 1s infinite" : "none" }}>{loading ? "⏳" : "🎙"}</button>
          <button onClick={() => doTranslate(text)} style={{ background: `${C.green}15`, border: `1px solid ${C.green}44`, borderRadius: 9, padding: "10px 11px", cursor: "pointer", fontSize: 16, color: C.green }}>→</button>
        </div>
      </div>

      <div onClick={toggleEar} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: earMode ? `${C.gold}10` : "rgba(255,255,255,0.02)", border: `1px solid ${earMode ? C.gold + "44" : C.border}`, borderRadius: 12, cursor: "pointer" }}>
        <div style={{ fontSize: 22 }}>👂</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: earMode ? C.gold : "#fff" }}>{earMode ? "🔴 EAR MODE — tap to stop" : "Ear Mode — Listen to someone beside you"}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Continuous live translation into your ears. Any language.</div>
        </div>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: earMode ? C.gold : "rgba(255,255,255,0.1)", boxShadow: earMode ? `0 0 10px ${C.gold}` : "none", animation: earMode ? "pulse 1s infinite" : "none" }} />
      </div>

      {result && (
        <Card color={C.cyan}>
          {detected && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>🔍 Detected: <span style={{ color: C.cyan }}>{detected}</span></div>}
          <Lbl color={C.green}>{toLang}</Lbl>
          <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.8, fontFamily: "'Exo 2',sans-serif", fontWeight: 600, marginBottom: 10 }}>{result}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: copied ? `${C.green}20` : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? C.green + "44" : C.border}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 11, color: copied ? C.green : "rgba(255,255,255,0.4)" }}>{copied ? "✓ Copied" : "⧉ Copy"}</button>
            <button onClick={() => speakFull(result)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 11px", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>🔊</button>
          </div>
        </Card>
      )}

      <Card>
        <Lbl>All Languages</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {LANGS.map((l, i) => (
            <div key={i} onClick={() => setToLang(l)} style={{ padding: "3px 8px", borderRadius: 20, background: toLang === l ? `${C.green}20` : "rgba(255,255,255,0.02)", border: `1px solid ${toLang === l ? C.green + "55" : "rgba(255,255,255,0.05)"}`, fontSize: 9, color: toLang === l ? C.green : "rgba(255,255,255,0.28)", cursor: "pointer" }}>{l}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
