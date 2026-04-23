import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../theme/colors";
import { callClaudeStream, genImg } from "../utils/api";
import { speakFull } from "../utils/voice";
import { sto } from "../utils/storage";
import { FOUNDER_SYSTEM_BLOCK } from "../data/founder";

const CAPABILITIES = [
  { icon: "💻", title: "Build & Code", desc: "Websites, apps, scripts, APIs" },
  { icon: "🎨", title: "Create Images", desc: "Generate any image from text" },
  { icon: "🌍", title: "Translate", desc: "44 languages, instant" },
  { icon: "🧠", title: "Analyze & Research", desc: "Deep insights on any topic" },
];

const QUICK = [
  "Build a landing page for AURA OS",
  "Generate an image of a futuristic African city",
  "Write Python code to scrape prices",
  "Translate 'hello' to Yoruba, Pidgin and French",
];

const CMD_RE = /\[(IMAGE|PREVIEW|LOCATION|OPEN):[^\]]*\]|\[LOCATION\]/g;

function Markdown({ text }) {
  const lines = text.split("\n");
  const els = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      els.push(
        <pre key={i} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", overflowX: "auto", margin: "6px 0" }}>
          {lang && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 6, letterSpacing: 2 }}>{lang.toUpperCase()}</div>}
          <code style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#a8ff78", whiteSpace: "pre" }}>{code.join("\n")}</code>
        </pre>
      );
    } else if (/^#{1,3} /.test(line)) {
      const lvl = line.match(/^(#{1,3}) /)[1].length;
      const txt = line.replace(/^#{1,3} /, "");
      els.push(<div key={i} style={{ fontWeight: 700, fontSize: lvl === 1 ? 16 : lvl === 2 ? 14 : 13, color: "#fff", margin: "10px 0 4px" }}>{txt}</div>);
    } else if (/^[-*•] /.test(line)) {
      els.push(<div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: C.cyan, flexShrink: 0, marginTop: 2 }}>▸</span><span>{renderInline(line.replace(/^[-*•] /, ""))}</span></div>);
    } else if (/^\d+[.)]\s/.test(line)) {
      const num = line.match(/^(\d+)[.)]/)[1];
      const txt = line.replace(/^\d+[.)]\s*/, "");
      els.push(<div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: C.cyan, flexShrink: 0, minWidth: 16, fontWeight: 700 }}>{num}.</span><span>{renderInline(txt)}</span></div>);
    } else if (line.trim() === "") {
      els.push(<div key={i} style={{ height: 6 }} />);
    } else {
      els.push(<div key={i} style={{ marginBottom: 2 }}>{renderInline(line)}</div>);
    }
    i++;
  }
  return <div style={{ lineHeight: 1.75 }}>{els}</div>;
}

function renderInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={m.index} style={{ color: "#fff", fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} style={{ color: "rgba(255,255,255,0.8)" }}>{m[4]}</em>);
    else if (m[5]) parts.push(<code key={m.index} style={{ background: "rgba(0,255,229,0.08)", border: "1px solid rgba(0,255,229,0.15)", borderRadius: 4, padding: "1px 5px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.cyan }}>{m[6]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

export default function ChatScreen({ auraName }) {
  const [msgs, setMsgs]         = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeOn, setWakeOn]     = useState(false);
  const [copied, setCopied]     = useState(null);
  const endRef       = useRef();
  const wakeRef      = useRef();
  const textareaRef  = useRef();
  const listeningRef = useRef(false);

  const userProfile = sto.get("user_profile", null);
  const userName    = userProfile?.name || null;

  const SYSTEM = `You are ${auraName}, a genius personal AI OS — warm, sharp, like a brilliant best friend.
${FOUNDER_SYSTEM_BLOCK}
${userProfile?.name || userProfile?.role ? `
USER PROFILE — remember this always:
  Name: ${userProfile.name || "not set"}
  Role: ${userProfile.role || "not set"}
  Preferences: ${userProfile.preferences || "none"}
  Active Projects: ${userProfile.projects || "none"}
Address the user by name when you know it. Personalize every response.` : ""}

Special commands — emit on their own line when relevant:
[IMAGE: detailed description] — when asked to generate/create/show an image
[PREVIEW: visual description] — when building a website/app/landing page (also write full HTML)
[LOCATION] — when asked for location/GPS
[OPEN: url] — when asked to open a website

You have: Claude AI Brain, Claude Code Brain, Claude Design Brain, Image Generator.
Be helpful, use emojis naturally, keep responses clear and focused.`;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const startWake = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onstart  = () => setWakeOn(true);
    r.onend    = () => { setWakeOn(false); if (!listeningRef.current) setTimeout(startWake, 600); };
    r.onresult = (e) => {
      const t = Array.from(e.results).map(x => x[0].transcript).join("").toLowerCase();
      const n = auraName.toLowerCase();
      if (t.includes(`hey ${n}`) || t.includes(n)) { r.stop(); setTimeout(startVoice, 400); }
    };
    r.onerror = (e) => { setWakeOn(false); if (e.error !== "aborted" && !listeningRef.current) setTimeout(startWake, 800); };
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
    const history  = [...msgs, { role: "user", type: "text", content: t }];
    setMsgs(history);
    setLoading(true);

    const pid = Date.now();
    setMsgs(m => [...m, { role: "assistant", type: "text", content: "", id: pid, streaming: true }]);

    let full = "";
    try {
      await callClaudeStream(
        history.map(m => ({ role: m.role, content: m.content })),
        SYSTEM,
        (chunk) => {
          full += chunk;
          setMsgs(m => m.map(x => x.id === pid ? { ...x, content: full } : x));
        }
      );

      // Process special commands after full reply received
      const extra = [];
      if (full.includes("[IMAGE:")) {
        const match = full.match(/\[IMAGE:\s*(.+?)\]/);
        const desc  = match?.[1] || t;
        extra.push({ role: "assistant", type: "image", imageUrl: genImg(desc), caption: desc });
      } else if (full.includes("[PREVIEW:")) {
        const match = full.match(/\[PREVIEW:\s*(.+?)\]/);
        const desc  = match?.[1] || t;
        extra.push({ role: "assistant", type: "preview", imageUrl: genImg(`website UI screenshot ${desc}, dark professional modern`), caption: desc });
      } else if (full.includes("[LOCATION]")) {
        navigator.geolocation?.getCurrentPosition(
          p => setMsgs(m => m.map(x => x.id === pid ? { ...x, content: full.replace("[LOCATION]", "").trim() || `📍 ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`, streaming: false } : x)),
          () => setMsgs(m => m.map(x => x.id === pid ? { ...x, content: "Please allow location access in browser settings.", streaming: false } : x))
        );
        setLoading(false); return;
      } else if (full.includes("[OPEN:")) {
        const match = full.match(/\[OPEN:\s*(.+?)\]/);
        const url   = match?.[1]?.trim();
        if (url) window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
      }

      const cleanContent = full.replace(CMD_RE, "").trim();

      setMsgs(m => {
        let updated = m.map(x => x.id === pid ? { ...x, content: cleanContent, streaming: false } : x);
        if (extra.length) updated = [...updated, ...extra];
        const plain = updated.filter(x => x.type === "text").map(x => ({ role: x.role, content: x.content })).slice(-20);
        sto.set("chat_history", plain);
        return updated;
      });

      speakFull(cleanContent);
    } catch (e) {
      setMsgs(m => m.map(x => x.id === pid ? { ...x, content: `⚠️ ${e.message}`, streaming: false } : x));
    }
    setLoading(false);
  };

  const hasMessages = msgs.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>

      {/* Wake word bar */}
      <div style={{ padding: "4px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: wakeOn ? C.green : "rgba(255,255,255,0.1)", boxShadow: wakeOn ? `0 0 8px ${C.green}` : "none", transition: "all 0.3s" }} />
        <span style={{ fontSize: 9, color: wakeOn ? C.green : "rgba(255,255,255,0.18)", letterSpacing: 2, flex: 1 }}>
          {wakeOn ? `WAKE WORD ACTIVE — SAY "HEY ${auraName.toUpperCase()}"` : "WAKE WORD STANDBY"}
        </span>
        <button onClick={() => speakFull(`Hey! I'm ${auraName}. Ready.`)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 11, padding: "2px 6px" }}>🔊</button>
        {hasMessages && (
          <button onClick={() => { setMsgs([]); sto.set("chat_history", []); }} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "2px 8px", cursor: "pointer", fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>✕ New chat</button>
        )}
      </div>

      {/* Message area */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {!hasMessages ? (

          /* ── WELCOME SCREEN ── */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 20px 12px", gap: 22, maxWidth: 680, margin: "0 auto", width: "100%" }}>

            {/* Animated orb */}
            <div style={{ position: "relative", width: 76, height: 76 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1.5px solid ${C.cyan}44`, animation: "rotate 8s linear infinite" }} />
              <div style={{ position: "absolute", inset: 4, borderRadius: "50%", border: `1px solid ${C.purple}33`, animation: "rotate 12s linear infinite reverse" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: C.cyan }}>◈</div>
            </div>

            {/* Greeting */}
            <div style={{ textAlign: "center", lineHeight: 1 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: 1 }}>
                {userName ? `Good to see you, ${userName.split(" ")[0]}` : `How can I help?`}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                I'm {auraName} — your personal AI OS powered by Claude.
              </div>
            </div>

            {/* Capability cards 2×2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, width: "100%" }}>
              {CAPABILITIES.map((cap, i) => (
                <div key={i} onClick={() => send(cap.title)}
                  style={{ padding: "14px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", transition: "border-color 0.2s, background 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan + "55"; e.currentTarget.style.background = "rgba(0,255,229,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{cap.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{cap.title}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{cap.desc}</div>
                </div>
              ))}
            </div>

            {/* Quick prompts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {QUICK.map((q, i) => (
                <div key={i} onClick={() => send(q)}
                  style={{ padding: "5px 13px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 10.5, color: "rgba(255,255,255,0.38)", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.38)"; e.currentTarget.style.borderColor = C.border; }}>
                  {q}
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* ── MESSAGES ── */
          <div style={{ flex: 1, padding: "24px 16px 8px", display: "flex", flexDirection: "column", gap: 24, maxWidth: 760, margin: "0 auto", width: "100%" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>

                {/* Assistant avatar */}
                {m.role === "assistant" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginTop: 2 }}>◈</div>
                )}

                <div style={{ maxWidth: m.role === "user" ? "72%" : "84%" }}>
                  {(!m.type || m.type === "text") && (
                    <>
                      <div style={{
                        padding: m.role === "user" ? "10px 16px" : "0",
                        borderRadius: m.role === "user" ? "18px 18px 4px 18px" : 0,
                        background: m.role === "user" ? `linear-gradient(135deg,${C.purple}44,${C.blue}33)` : "transparent",
                        border: m.role === "user" ? `1px solid ${C.purple}44` : "none",
                        fontSize: 13.5,
                        color: "rgba(255,255,255,0.9)",
                        fontFamily: "'Inter','DM Mono',sans-serif",
                        letterSpacing: 0.1,
                      }}>
                        {m.role === "user"
                          ? <span style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{m.content}</span>
                          : <Markdown text={m.content} />
                        }
                        {m.streaming && (
                          <span style={{ display: "inline-block", width: 2, height: 15, background: C.cyan, marginLeft: 2, animation: "pulse 0.6s infinite", borderRadius: 1, verticalAlign: "text-bottom" }} />
                        )}
                      </div>
                      {m.role === "assistant" && !m.streaming && m.content && (
                        <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                          <button onClick={() => copyMsg(m.content, i)} style={{ background: copied === i ? `${C.green}18` : "rgba(255,255,255,0.04)", border: `1px solid ${copied === i ? C.green + "44" : "rgba(255,255,255,0.07)"}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 10, color: copied === i ? C.green : "rgba(255,255,255,0.3)" }}>
                            {copied === i ? "✓ Copied" : "⧉ Copy"}
                          </button>
                          <button onClick={() => speakFull(m.content)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>🔊</button>
                        </div>
                      )}
                    </>
                  )}

                  {(m.type === "image" || m.type === "preview") && (
                    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${m.type === "preview" ? C.purple + "44" : C.cyan + "33"}` }}>
                      <div style={{ padding: "6px 12px", fontSize: 11, color: m.type === "preview" ? C.purple : C.cyan, background: m.type === "preview" ? `${C.purple}10` : `${C.cyan}08`, display: "flex", alignItems: "center", gap: 6 }}>
                        {m.type === "preview" ? "💻 Preview" : "🎨 Generated Image"}
                        <button onClick={() => copyMsg(m.imageUrl, i + 9999)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 10 }}>⧉</button>
                      </div>
                      <img src={m.imageUrl} alt={m.caption} style={{ width: "100%", display: "block", minHeight: 100, background: "rgba(0,0,0,0.3)" }} onError={e => { e.target.style.opacity = "0.2"; }} />
                      <div style={{ padding: "5px 12px", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{m.caption?.slice(0, 90)}</div>
                    </div>
                  )}
                </div>

                {/* User avatar */}
                {m.role === "user" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.purple}88,${C.cyan}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, marginTop: 2 }}>
                    {userName ? userName[0].toUpperCase() : "U"}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking dots — only when not yet streaming */}
            {loading && !msgs.find(m => m.streaming) && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>◈</div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", paddingTop: 6 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.cyan, animation: `pulse ${0.6 + i * 0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* ── INPUT BAR ── */}
      <div style={{ padding: "8px 16px 18px", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: `${C.bg}f2`, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-end",
            background: "rgba(255,255,255,0.05)",
            border: `1.5px solid ${listening ? C.red + "77" : input.trim() ? C.cyan + "55" : C.cyan + "22"}`,
            borderRadius: 18, padding: "10px 12px",
            transition: "border-color 0.2s",
            boxShadow: input.trim() ? `0 0 20px ${C.cyan}10` : "none",
          }}>
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Message ${auraName}...`}
              rows={1}
              style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 13.5, fontFamily: "'Inter','DM Mono',sans-serif", resize: "none", outline: "none", lineHeight: 1.6, maxHeight: 140, overflowY: "auto", paddingTop: 2 }} />
            <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "flex-end", paddingBottom: 1 }}>
              <button onClick={startVoice}
                style={{ background: listening ? `${C.red}22` : "rgba(255,255,255,0.06)", border: `1px solid ${listening ? C.red + "55" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "8px 10px", cursor: "pointer", fontSize: 16, animation: listening ? "pulse 1s infinite" : "none" }}>
                {listening ? "🔴" : "🎙"}
              </button>
              <button onClick={() => send()} disabled={!input.trim() || loading}
                style={{ background: input.trim() && !loading ? `linear-gradient(135deg,${C.cyan},${C.purple})` : "rgba(255,255,255,0.05)", border: "none", borderRadius: 12, padding: "8px 16px", cursor: input.trim() && !loading ? "pointer" : "default", fontSize: 14, color: input.trim() && !loading ? "#000" : "rgba(255,255,255,0.2)", fontWeight: 800, transition: "all 0.2s" }}>
                ▶
              </button>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.12)", marginTop: 5 }}>
            {auraName} can make mistakes. Verify important info. — Created by CEO Global
          </div>
        </div>
      </div>

    </div>
  );
}
