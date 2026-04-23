import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Inp } from "../components/ui";
import { callClaude, genImg } from "../utils/api";
import { speakFull } from "../utils/voice";
import { sto } from "../utils/storage";
import { FOUNDER_SYSTEM_BLOCK } from "../data/founder";

const QUICK = [
  "Build a landing page for AURA OS",
  "Generate an image of a futuristic African city",
  "Design a logo for AURA",
  "What's my current location?",
  "Translate hello to Yoruba, Pidgin and French",
  "Write Python code to scrape prices",
];

export default function ChatScreen({ auraName }) {
  const [msgs, setMsgs] = useState([{
    role: "assistant", type: "text",
    content: `Hey! I'm ${auraName} 👋 Powered by Claude AI.\n\nI can:\n🧠 Chat & answer anything\n💻 Build websites & apps\n✦ Generate designs\n🎨 Create images\n🌍 Translate 44 languages\n🗺️ Navigate anywhere\n🧠 Remember you across sessions\n\nSay "Hey ${auraName}" or tap 🎙 to start!`,
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeOn, setWakeOn]   = useState(false);
  const [copied, setCopied]   = useState(null);
  const endRef       = useRef();
  const wakeRef      = useRef();
  const listeningRef = useRef(false);

  const userProfile = sto.get("user_profile", null);

  const SYSTEM = `You are ${auraName}, a genius personal AI OS. You are warm, sharp, like a brilliant best friend.
${FOUNDER_SYSTEM_BLOCK}
${userProfile?.name || userProfile?.role ? `
USER PROFILE — remember this always:
  Name: ${userProfile.name || "not set"}
  Role: ${userProfile.role || "not set"}
  Preferences: ${userProfile.preferences || "none"}
  Active Projects: ${userProfile.projects || "none"}
Address the user by name when you know it. Personalize every response to their context.` : ""}

Special commands — add these on their own line when relevant:
[IMAGE: detailed description] — when asked to generate/create/show an image
[PREVIEW: visual description] — when building a website/app/landing page (also write the full HTML code)
[LOCATION] — when asked for location/GPS
[OPEN: url] — when asked to open a website or app

You have these brains:
- Claude AI Brain: answer anything, research, write, analyze
- Claude Code Brain: build real apps, websites, scripts
- Claude Design Brain: create UI designs, logos, brand assets
- Image Generator: create any image from description

Be genuinely helpful, use emojis naturally, keep responses focused.`;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const startWake = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onstart = () => setWakeOn(true);
    r.onend   = () => { setWakeOn(false); if (!listeningRef.current) setTimeout(startWake, 600); };
    r.onresult = (e) => {
      const t = Array.from(e.results).map(x => x[0].transcript).join("").toLowerCase();
      const name = auraName.toLowerCase();
      if (t.includes(`hey ${name}`) || t.includes(name)) { r.stop(); setTimeout(startVoice, 400); }
    };
    r.onerror = (e) => {
      setWakeOn(false);
      if (e.error !== "aborted" && !listeningRef.current) setTimeout(startWake, 800);
    };
    wakeRef.current = r;
    try { r.start(); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auraName]);

  useEffect(() => { startWake(); return () => wakeRef.current?.stop(); }, [startWake]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice requires Chrome browser"); return; }
    wakeRef.current?.stop();
    listeningRef.current = true;
    const r = new SR(); r.lang = "en-US"; r.interimResults = false;
    r.onstart  = () => setListening(true);
    r.onend    = () => { setListening(false); listeningRef.current = false; setTimeout(startWake, 600); };
    r.onresult = (e) => send(e.results[0][0].transcript);
    r.onerror  = () => { setListening(false); listeningRef.current = false; };
    try { r.start(); } catch {}
  };

  const copyMsg = (text, idx) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(idx); setTimeout(() => setCopied(null), 2000); });
  };

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput("");
    const newHistory = [...msgs, { role: "user", type: "text", content: t }];
    setMsgs(newHistory);
    setLoading(true);
    try {
      const reply = await callClaude(newHistory.map(m => ({ role: m.role, content: m.content })), SYSTEM);
      const out = [];

      if (reply.includes("[IMAGE:")) {
        const match = reply.match(/\[IMAGE:\s*(.+?)\]/);
        const desc  = match?.[1] || t;
        const clean = reply.replace(/\[IMAGE:[^\]]+\]/, "").trim();
        if (clean) out.push({ role: "assistant", type: "text", content: clean });
        out.push({ role: "assistant", type: "image", imageUrl: genImg(desc), caption: desc });
      } else if (reply.includes("[PREVIEW:")) {
        const match = reply.match(/\[PREVIEW:\s*(.+?)\]/);
        const desc  = match?.[1] || t;
        const clean = reply.replace(/\[PREVIEW:[^\]]+\]/, "").trim();
        out.push({ role: "assistant", type: "text", content: clean });
        out.push({ role: "assistant", type: "preview", imageUrl: genImg(`website UI screenshot ${desc}, dark professional modern`), caption: desc });
      } else if (reply.includes("[LOCATION]")) {
        const clean = reply.replace("[LOCATION]", "").trim();
        navigator.geolocation?.getCurrentPosition(
          p => setMsgs(m => [...m, { role: "assistant", type: "text", content: clean || `📍 Your location: ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}` }]),
          () => setMsgs(m => [...m, { role: "assistant", type: "text", content: "Please allow location access in browser settings." }])
        );
        setLoading(false); return;
      } else if (reply.includes("[OPEN:")) {
        const match = reply.match(/\[OPEN:\s*(.+?)\]/);
        const url   = match?.[1]?.trim();
        if (url) window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
        out.push({ role: "assistant", type: "text", content: reply.replace(/\[OPEN:[^\]]+\]/, "").trim() || `Opening ${url}...` });
      } else {
        out.push({ role: "assistant", type: "text", content: reply });
      }

      setMsgs(m => {
        const next  = [...m, ...out];
        const plain = next.filter(x => x.type === "text").map(x => ({ role: x.role, content: x.content })).slice(-20);
        sto.set("chat_history", plain);
        return next;
      });
      const firstText = out.find(r => r.type === "text");
      if (firstText) speakFull(firstText.content);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", type: "text", content: `Connection issue: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "5px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: wakeOn ? C.green : C.border, boxShadow: wakeOn ? `0 0 8px ${C.green}` : "none", animation: wakeOn ? "pulse 1.5s infinite" : "none" }} />
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", letterSpacing: 2, flex: 1 }}>
          {wakeOn ? `WAKE WORD ACTIVE — SAY "HEY ${auraName.toUpperCase()}"` : "WAKE WORD STANDBY"}
        </span>
        <button onClick={() => speakFull(`Hey! I'm ${auraName}. Ready.`)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 11 }}>🔊</button>
      </div>

      {msgs.length <= 1 && (
        <div style={{ padding: "8px 12px 0", display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0 }}>
          {QUICK.map((q, i) => (
            <div key={i} onClick={() => send(q)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}>{q}</div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◈</div>
            )}
            <div style={{ maxWidth: "80%" }}>
              {(!m.type || m.type === "text") && (
                <>
                  <div style={{ padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? `${C.purple}22` : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? C.purple + "33" : C.border}`, fontSize: 13, lineHeight: 1.7, color: m.role === "user" ? C.blue : "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                      <button onClick={() => copyMsg(m.content, i)} style={{ background: copied === i ? `${C.green}20` : "rgba(255,255,255,0.04)", border: `1px solid ${copied === i ? C.green + "44" : C.border}`, borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 10, color: copied === i ? C.green : "rgba(255,255,255,0.35)" }}>
                        {copied === i ? "✓ Copied" : "⧉ Copy"}
                      </button>
                      <button onClick={() => speakFull(m.content)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 8px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>🔊</button>
                    </div>
                  )}
                </>
              )}
              {(m.type === "image" || m.type === "preview") && (
                <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${m.type === "preview" ? C.purple + "44" : C.cyan + "33"}` }}>
                  <div style={{ padding: "5px 9px", fontSize: 10, color: m.type === "preview" ? C.purple : C.cyan, background: m.type === "preview" ? `${C.purple}10` : `${C.cyan}08`, display: "flex", gap: 6 }}>
                    {m.type === "preview" ? "💻 Preview" : "🎨 Image"}
                    <button onClick={() => copyMsg(m.imageUrl, i + 9999)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 10 }}>⧉</button>
                  </div>
                  <img src={m.imageUrl} alt={m.caption} style={{ width: "100%", display: "block", minHeight: 100, background: "rgba(0,0,0,0.3)" }} onError={e => { e.target.style.opacity = "0.2"; }} />
                  <div style={{ padding: "4px 9px", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{m.caption?.slice(0, 80)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◈</div>
            <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: "14px 14px 14px 4px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.cyan, animation: `pulse ${0.7 + i * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "9px 12px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 7, alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: `1px solid ${listening ? C.red + "66" : C.cyan + "33"}`, borderRadius: 14, padding: "9px 11px" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask ${auraName} anything...`}
            rows={1} style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 12, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", lineHeight: 1.5, maxHeight: 80, overflowY: "auto" }} />
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button onClick={startVoice} style={{ background: listening ? `${C.red}22` : "rgba(255,255,255,0.05)", border: `1px solid ${listening ? C.red + "55" : C.border}`, borderRadius: 8, padding: "7px 8px", cursor: "pointer", fontSize: 14, color: listening ? C.red : "rgba(255,255,255,0.45)", animation: listening ? "pulse 1s infinite" : "none" }}>{listening ? "🔴" : "🎙"}</button>
            <button onClick={() => send()} style={{ background: `linear-gradient(135deg,${C.cyan},${C.purple})`, border: "none", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontSize: 12, color: "#000", fontWeight: 700 }}>▶</button>
          </div>
        </div>
      </div>
    </div>
  );
}
