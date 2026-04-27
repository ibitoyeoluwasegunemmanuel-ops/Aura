import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../theme/colors";
import { callClaudeStream, genImgEnhanced, webSearch } from "../utils/api";
import { speakFull } from "../utils/voice";
import { sto } from "../utils/storage";
import { FOUNDER_SYSTEM_BLOCK } from "../data/founder";

const CMD_RE = /\[(IMAGE|LOCATION|OPEN):[^\]]*\]|\[LOCATION\]/g;

const PLUS_OPTIONS = [
  { id: "camera",   icon: "📷", label: "Camera"       },
  { id: "photos",   icon: "🖼️", label: "Photos"       },
  { id: "files",    icon: "📁", label: "Files"        },
  { id: "image",    icon: "🎨", label: "Create Image" },
  { id: "search",   icon: "🌐", label: "Web Search"   },
  { id: "think",    icon: "🧠", label: "Think Deeper" },
  { id: "research", icon: "🔍", label: "Deep Research"},
];

const QUICK = [
  "What can you do?",
  "Generate an image of a futuristic African city",
  "Write a business plan for a Nigerian startup",
  "Translate 'good morning' to Yoruba",
];

function ArtifactPanel({ artifact, tab, setTab, onClose }) {
  if (!artifact) return null;
  const download = () => {
    const blob = new Blob([artifact.code], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aura-design.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copy = () => navigator.clipboard?.writeText(artifact.code);
  return (
    <div style={{ width: "50%", minWidth: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.purple}44`, background: "#07070f", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${C.purple}22`, flexShrink: 0, background: `${C.purple}08` }}>
        <span style={{ fontSize: 11, color: C.purple, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>💻 {artifact.title || "Live Preview"}</span>
        <button onClick={() => setTab("preview")} style={{ background: tab === "preview" ? `${C.purple}22` : "transparent", border: `1px solid ${tab === "preview" ? C.purple + "55" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "preview" ? C.purple : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Preview</button>
        <button onClick={() => setTab("code")} style={{ background: tab === "code" ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${tab === "code" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "code" ? "#fff" : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Code</button>
        <button onClick={copy} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Copy</button>
        <button onClick={download} style={{ background: `${C.cyan}12`, border: `1px solid ${C.cyan}33`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: C.cyan, fontFamily: "'DM Mono',monospace" }}>⬇</button>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "preview" ? (
          <iframe srcDoc={artifact.code} title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#fff" }} />
        ) : (
          <pre style={{ margin: 0, padding: "14px", overflowY: "auto", height: "100%", boxSizing: "border-box", background: "transparent" }}>
            <code style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#a8ff78", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{artifact.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function HtmlInlineCard({ code, onExpand }) {
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.purple}44`, margin: "8px 0", cursor: "pointer" }} onClick={onExpand}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: `${C.purple}10` }}>
        <span style={{ fontSize: 11, color: C.purple, fontWeight: 700, flex: 1 }}>💻 Live Preview — tap to open</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>⤢ Expand</span>
      </div>
      <iframe srcDoc={code} title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width: "100%", height: 200, border: "none", display: "block", background: "#fff", pointerEvents: "none" }} />
    </div>
  );
}

function Markdown({ text, onArtifact }) {
  const lines = text.split("\n");
  const els = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim().toLowerCase();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      const codeStr = code.join("\n");
      if (lang === "html") {
        els.push(<HtmlInlineCard key={i} code={codeStr} onExpand={onArtifact ? () => onArtifact({ type: "html", code: codeStr, title: "Live Preview" }) : undefined} />);
      } else if (lang === "mermaid") {
        const mermaidHtml = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"><\/script><style>body{background:#0d0d0d;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box}.mermaid{max-width:100%}</style></head><body><div class="mermaid">${codeStr}</div><script>mermaid.initialize({startOnLoad:true,theme:'dark'})<\/script></body></html>`;
        els.push(
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.cyan}33`, margin: "8px 0" }}>
            <div style={{ padding: "6px 12px", fontSize: 10, color: C.cyan, background: `${C.cyan}08`, fontWeight: 700 }}>📊 Diagram</div>
            <iframe srcDoc={mermaidHtml} sandbox="allow-scripts allow-same-origin" style={{ width: "100%", height: 300, border: "none", background: "#0d0d0d", display: "block" }} title="diagram" />
          </div>
        );
      } else {
        els.push(
          <pre key={i} style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", overflowX: "auto", margin: "6px 0" }}>
            {lang && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 6, letterSpacing: 2 }}>{lang.toUpperCase()}</div>}
            <code style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#a8ff78", whiteSpace: "pre" }}>{codeStr}</code>
          </pre>
        );
      }
    } else if (line.trim().startsWith("$$")) {
      const mathLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("$$")) { mathLines.push(lines[i]); i++; }
      els.push(<div key={i} style={{ margin: "8px 0" }}><MathBlock tex={mathLines.join("\n")} inline={false} /></div>);
    } else if (/^#{1,3} /.test(line)) {
      const lvl = line.match(/^(#{1,3}) /)[1].length;
      els.push(<div key={i} style={{ fontWeight: 700, fontSize: lvl === 1 ? 16 : lvl === 2 ? 14 : 13, color: "#fff", margin: "10px 0 4px" }}>{line.replace(/^#{1,3} /, "")}</div>);
    } else if (/^[-*•] /.test(line)) {
      els.push(<div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: C.cyan, flexShrink: 0 }}>▸</span><span>{renderInline(line.replace(/^[-*•] /, ""))}</span></div>);
    } else if (/^\d+[.)]\s/.test(line)) {
      const num = line.match(/^(\d+)[.)]/)[1];
      els.push(<div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: C.cyan, flexShrink: 0, minWidth: 16, fontWeight: 700 }}>{num}.</span><span>{renderInline(line.replace(/^\d+[.)]\s*/, ""))}</span></div>);
    } else if (/^\|/.test(line) && line.includes("|")) {
      const tableLines = [line];
      while (i + 1 < lines.length && /^\|/.test(lines[i + 1])) { i++; tableLines.push(lines[i]); }
      const rows = tableLines.filter(r => !/^\|[-| :]+\|$/.test(r.trim()));
      const isHeader = tableLines.length > 1 && /^\|[-| :]+\|$/.test(tableLines[1].trim());
      els.push(
        <div key={i} style={{ overflowX: "auto", margin: "8px 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, fontFamily: "'DM Mono',monospace" }}>
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.split("|").filter((_, ci) => ci > 0 && ci < row.split("|").length - 1);
                const isHead = isHeader && ri === 0;
                return (
                  <tr key={ri} style={{ borderBottom: `1px solid rgba(255,255,255,0.07)`, background: ri % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    {cells.map((cell, ci) => isHead
                      ? <th key={ci} style={{ padding: "8px 12px", color: C.cyan, fontWeight: 700, textAlign: "left", borderBottom: `1px solid ${C.cyan}33`, whiteSpace: "nowrap" }}>{renderInline(cell.trim())}</th>
                      : <td key={ci} style={{ padding: "7px 12px", color: "rgba(255,255,255,0.8)", textAlign: "left", whiteSpace: "nowrap" }}>{renderInline(cell.trim())}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    } else if (line.trim() === "") {
      els.push(<div key={i} style={{ height: 6 }} />);
    } else {
      els.push(<div key={i} style={{ marginBottom: 2 }}>{renderInline(line)}</div>);
    }
    i++;
  }
  return <div style={{ lineHeight: 1.75 }}>{els}</div>;
}

function MathBlock({ tex, inline }) {
  const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"><script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script><style>body{margin:0;padding:${inline ? "0 4px" : "12px 16px"};background:transparent;display:flex;align-items:center;justify-content:${inline ? "flex-start" : "center"}}.katex{color:#e2e8f0;font-size:${inline ? "13px" : "16px"}}</style></head><body><span id="m"></span><script>katex.render(${JSON.stringify(tex)},document.getElementById('m'),{throwOnError:false,displayMode:${!inline}})<\/script></body></html>`;
  return (
    <iframe srcDoc={html} sandbox="allow-scripts allow-same-origin"
      style={{ border: "none", background: "transparent", display: inline ? "inline-block" : "block",
        width: inline ? "auto" : "100%", height: inline ? 24 : 60, verticalAlign: "middle", maxWidth: "100%" }}
      title="math" scrolling="no"
    />
  );
}

function renderInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|\$(.+?)\$/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={m.index} style={{ color: "#fff", fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} style={{ color: "rgba(255,255,255,0.8)" }}>{m[4]}</em>);
    else if (m[5]) parts.push(<code key={m.index} style={{ background: "rgba(0,255,229,0.08)", border: "1px solid rgba(0,255,229,0.15)", borderRadius: 4, padding: "1px 5px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.cyan }}>{m[6]}</code>);
    else if (m[7]) parts.push(<MathBlock key={m.index} tex={m[7]} inline />);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

export default function ChatScreen({ auraName, authSession, chatSessionId, onSessionUpdate, agentMode, modePrompt }) {
  const [msgs, setMsgs]               = useState(() => sto.get("msgs_" + chatSessionId, []));
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [voiceMode, setVoiceMode]     = useState(false);
  const [voiceState, setVoiceState]   = useState("idle");
  const [interimText, setInterimText] = useState("");
  const [wakeOn, setWakeOn]           = useState(false);
  const [copied, setCopied]           = useState(null);
  const [showPlus, setShowPlus]       = useState(false);
  const [attachment, setAttachment]   = useState(null);
  const [thinkMode, setThinkMode]     = useState(false);
  const [searchMode, setSearchMode]   = useState(false);
  const [artifact, setArtifact]       = useState(null); // { type: "html"|"mermaid", code, title }
  const [artifactTab, setArtifactTab] = useState("preview"); // "preview" | "code"

  const endRef       = useRef();
  const artifactRef  = useRef(null);
  const wakeRef      = useRef();
  const textareaRef  = useRef();
  const fileInputRef = useRef();
  const camInputRef  = useRef();
  const listeningRef  = useRef(false);
  const voiceModeRef  = useRef(false);
  const voiceRecRef   = useRef(null);
  const msgsRef       = useRef([]);
  const micGrantedRef = useRef(false);

  useEffect(() => { msgsRef.current = msgs; }, [msgs]);
  useEffect(() => { artifactRef.current = artifact; }, [artifact]);

  // Pre-grant mic on mount so wake word fires hands-free (no tap needed)
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => { micGrantedRef.current = true; stream.getTracks().forEach(t => t.stop()); })
      .catch(() => {});
  }, []);

  const userProfile = sto.get("user_profile", null);
  const userName    = userProfile?.name || authSession?.name || null;

  const artifactContext = artifact
    ? `\n\nCURRENT OPEN DESIGN (already rendered in the live preview panel):\n\`\`\`html\n${artifact.code}\n\`\`\`\nIf the user asks to change, update, edit, modify, improve, or fix this design → output a complete revised \`\`\`html code block with ALL changes applied. Keep everything else intact.`
    : "";

  const SYSTEM = agentMode
    ? `${agentMode.prompt}

${FOUNDER_SYSTEM_BLOCK}
${userProfile?.name ? `\nUser's name: ${userProfile.name}. Role: ${userProfile.role || ""}. Preferences: ${userProfile.preferences || ""}. Projects: ${userProfile.projects || ""}.` : ""}

Response style: Be direct and expert. Sound natural and confident. Use emojis naturally.

Special commands (emit on own line when relevant):
[IMAGE: description] — generate image
[LOCATION] — get GPS
[OPEN: url] — open website

DESIGN RULE: When asked to design, build, or create any website, web app, dashboard, UI, landing page, or component — output ONLY a single complete \`\`\`html code block. No explanation before or after. The HTML must be fully self-contained with embedded CSS and JS. Design standard: dark background (#0a0a0f), glassmorphism cards (backdrop-filter: blur), CSS custom properties, smooth animations (cubic-bezier transitions), Google Fonts via CDN (Inter or Plus Jakarta Sans), gradient accents, real content (no lorem ipsum), mobile responsive, interactive hover states. Think: Stripe, Linear, Vercel design quality.${artifactContext}`
    : `You are ${auraName}, a genius personal AI OS — confident, direct, warm. Like a brilliant friend who always delivers.
${FOUNDER_SYSTEM_BLOCK}
${modePrompt ? `\n${modePrompt}` : ""}
${userProfile?.name ? `\nUser's name: ${userProfile.name}. Role: ${userProfile.role || ""}. Preferences: ${userProfile.preferences || ""}. Projects: ${userProfile.projects || ""}.` : ""}

Response style: Be direct. Sound natural and confident. Use emojis naturally.

Special commands (emit on own line when relevant):
[IMAGE: description] — generate image
[LOCATION] — get GPS
[OPEN: url] — open website

DESIGN RULE: When asked to design, build, or create any website, web app, dashboard, UI, landing page, or component — output ONLY a single complete \`\`\`html code block. No explanation before or after. The HTML must be fully self-contained with embedded CSS and JS. Design standard: dark background (#0a0a0f), glassmorphism cards (backdrop-filter: blur), CSS custom properties, smooth transitions (cubic-bezier), Google Fonts via CDN (Inter or Plus Jakarta Sans), gradient accents, real content (no lorem ipsum), mobile responsive, interactive hover states. Think: Stripe, Linear, Vercel design quality. This renders live in AURA's preview panel.${artifactContext}`;

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
    r.onend    = () => { setWakeOn(false); if (!listeningRef.current) setTimeout(startWake, 500); };
    r.onresult = (e) => {
      const t = Array.from(e.results).map(x => x[0].transcript).join("").toLowerCase();
      const name = auraName.toLowerCase();
      const triggered =
        t.includes(`hey ${name}`) || t.includes(`okay ${name}`) ||
        t.includes(`ok ${name}`)  || t.includes(name) ||
        t.includes("let's go")   || t.includes("lets go") ||
        t.includes("wake up")    || t.includes("hey wake");
      if (triggered) { r.stop(); setTimeout(activateVoiceMode, 200); }
    };
    r.onerror = (e) => { setWakeOn(false); if (e.error !== "aborted" && !listeningRef.current) setTimeout(startWake, 600); };
    wakeRef.current = r;
    try { r.start(); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auraName]);

  useEffect(() => { startWake(); return () => wakeRef.current?.stop(); }, [startWake]);

  const startVoiceLoop = useCallback(() => {
    if (!voiceModeRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    listeningRef.current = true;
    setVoiceState("listening");
    setInterimText("");
    const r = new SR(); r.lang = "en-US"; r.interimResults = true;
    voiceRecRef.current = r;
    let captured = "";
    r.onresult = (e) => {
      const interim = Array.from(e.results).filter(x => !x.isFinal).map(x => x[0].transcript).join("");
      const final   = Array.from(e.results).filter(x =>  x.isFinal).map(x => x[0].transcript).join("");
      setInterimText(interim || final);
      if (final) captured = final;
    };
    r.onend = () => {
      listeningRef.current = false; setInterimText("");
      if (captured.trim() && voiceModeRef.current) sendVoice(captured.trim());
      else if (voiceModeRef.current) setTimeout(startVoiceLoop, 400);
    };
    r.onerror = (e) => {
      listeningRef.current = false; setInterimText("");
      if (e.error === "no-speech" && voiceModeRef.current) setTimeout(startVoiceLoop, 300);
      else if (e.error === "not-allowed") { voiceModeRef.current = false; setVoiceMode(false); setVoiceState("idle"); }
      else if (voiceModeRef.current && e.error !== "aborted") setTimeout(startVoiceLoop, 800);
    };
    try { r.start(); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendVoice = async (text) => {
    if (!voiceModeRef.current) return;
    setVoiceState("thinking");
    window.speechSynthesis.cancel();
    const history = [...msgsRef.current, { role: "user", type: "text", content: text }];
    setMsgs(history);
    const pid = Date.now();
    setMsgs(m => [...m, { role: "assistant", type: "text", content: "", id: pid, streaming: true }]);
    let full = "";
    try {
      await callClaudeStream(
        history.map(m => ({ role: m.role, content: m.content })),
        SYSTEM + "\n\nVOICE MODE: Max 2-3 sentences. Direct and conversational. No markdown.",
        (chunk) => { full += chunk; setMsgs(m => m.map(x => x.id === pid ? { ...x, content: full } : x)); }
      );
      const clean = full.replace(CMD_RE, "").trim();
      setMsgs(m => {
        const updated = m.map(x => x.id === pid ? { ...x, content: clean, streaming: false } : x);
        sto.set("msgs_" + chatSessionId, updated);
        const first = updated.find(x => x.role === "user")?.content || "";
        onSessionUpdate?.(chatSessionId, first.slice(0, 48) || "Voice chat", clean.slice(0, 60));
        return updated;
      });
      setVoiceState("speaking");
      speakFull(clean, () => { if (voiceModeRef.current) { setVoiceState("listening"); setTimeout(startVoiceLoop, 500); } });
    } catch (e) {
      setMsgs(m => m.map(x => x.id === pid ? { ...x, content: `⚠️ ${e.message}`, streaming: false } : x));
      if (voiceModeRef.current) setTimeout(startVoiceLoop, 800);
    }
  };

  const activateVoiceMode = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMsgs(m => [...m, { role: "assistant", type: "text", content: "⚠️ Voice needs Chrome or Edge.", id: Date.now(), streaming: false }]); return; }
    if (!micGrantedRef.current) {
      try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); micGrantedRef.current = true; s.getTracks().forEach(t => t.stop()); }
      catch { setMsgs(m => [...m, { role: "assistant", type: "text", content: "⚠️ Mic blocked — allow it in browser settings.", id: Date.now(), streaming: false }]); return; }
    }
    wakeRef.current?.stop();
    voiceModeRef.current = true;
    setVoiceMode(true);
    startVoiceLoop();
  };

  const deactivateVoiceMode = () => {
    voiceModeRef.current = false;
    setVoiceMode(false); setVoiceState("idle"); setInterimText("");
    window.speechSynthesis.cancel();
    voiceRecRef.current?.stop();
    listeningRef.current = false;
    setTimeout(startWake, 400);
  };

  const startDictation = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (!micGrantedRef.current) {
      try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); micGrantedRef.current = true; s.getTracks().forEach(t => t.stop()); }
      catch { return; }
    }
    wakeRef.current?.stop();
    listeningRef.current = true;
    setVoiceState("dictating");
    const r = new SR(); r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    let got = "";
    r.onresult = (e) => {
      got = Array.from(e.results).map(x => x[0].transcript).join(" ").trim();
      setInput(got);
    };
    r.onend = () => {
      listeningRef.current = false; setVoiceState("idle");
      if (got) { setTimeout(() => textareaRef.current?.focus(), 100); }
      setTimeout(startWake, 500);
    };
    r.onerror = () => { listeningRef.current = false; setVoiceState("idle"); setTimeout(startWake, 500); };
    try { r.start(); } catch { listeningRef.current = false; setVoiceState("idle"); }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setShowPlus(false);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        setAttachment({ type: "image", file, preview: data, base64: data.split(",")[1], mediaType: file.type });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment({ type: "file", file, preview: null });
    }
  };

  const handlePlusOption = (id) => {
    setShowPlus(false);
    if (id === "camera")   { camInputRef.current?.click(); return; }
    if (id === "photos")   { fileInputRef.current?.click(); return; }
    if (id === "files")    { fileInputRef.current?.click(); return; }
    if (id === "image")    { setInput("Generate an image of "); textareaRef.current?.focus(); return; }
    if (id === "search")   { setSearchMode(s => !s); textareaRef.current?.focus(); return; }
    if (id === "think")    { setThinkMode(t => !t); return; }
    if (id === "research") { setInput("Research in depth: "); textareaRef.current?.focus(); return; }
  };

  const copyMsg = (text, idx) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(idx); setTimeout(() => setCopied(null), 2000); });
  };

  const send = async (text) => {
    const t = (text || input).trim();
    if ((!t && !attachment) || loading) return;
    setInput("");
    const userMsg = {
      role: "user", type: "text",
      content: t || (attachment?.type === "file" ? `[File: ${attachment.file.name}]` : "Describe this image."),
    };
    if (attachment?.preview) userMsg.imagePreview = attachment.preview;
    const history = [...msgs, userMsg];
    setMsgs(history);
    const att = attachment;
    setAttachment(null);
    setLoading(true);
    const pid = Date.now();
    setMsgs(m => [...m, { role: "assistant", type: "text", content: "", id: pid, streaming: true }]);

    const apiMsgs = history.map((msg, idx) => {
      if (idx === history.length - 1 && att?.base64) {
        return { role: msg.role, content: [
          { type: "image", source: { type: "base64", media_type: att.mediaType, data: att.base64 } },
          { type: "text", text: t || "What do you see?" },
        ]};
      }
      return { role: msg.role, content: msg.content };
    });

    let searchContext = "";
    if (searchMode) {
      setSearchMode(false);
      const sr = await webSearch(t);
      if (sr.answer) searchContext += `\nDirect answer: ${sr.answer}`;
      if (sr.abstract) searchContext += `\nSummary: ${sr.abstract}`;
      if (sr.results?.length) {
        searchContext += "\nSearch results:\n" + sr.results.map((r, i) => `${i + 1}. ${r.snippet}${r.url ? ` (${r.url})` : ""}`).join("\n");
      }
      searchContext = searchContext.trim();
    }

    const sysBase = thinkMode ? SYSTEM + "\n\nTHINKING MODE: Reason step by step carefully before responding." : SYSTEM;
    const sys = searchContext ? sysBase + `\n\nWEB SEARCH RESULTS for "${t}":\n${searchContext}\n\nUse these results to answer accurately. Cite sources when useful.` : sysBase;
    let full = "";
    try {
      await callClaudeStream(apiMsgs, sys, (chunk) => {
        full += chunk;
        setMsgs(m => m.map(x => x.id === pid ? { ...x, content: full } : x));
      });
      const extra = [];
      if (full.includes("[IMAGE:")) {
        const desc = full.match(/\[IMAGE:\s*(.+?)\]/)?.[1] || t;
        const imageUrl = await genImgEnhanced(desc);
        extra.push({ role: "assistant", type: "image", imageUrl, caption: desc });
      } else if (full.includes("[LOCATION]")) {
        navigator.geolocation?.getCurrentPosition(
          p => setMsgs(m => m.map(x => x.id === pid ? { ...x, content: `📍 ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`, streaming: false } : x)),
          () => setMsgs(m => m.map(x => x.id === pid ? { ...x, content: "Location access required.", streaming: false } : x))
        );
        setLoading(false); return;
      } else if (full.includes("[OPEN:")) {
        const url = full.match(/\[OPEN:\s*(.+?)\]/)?.[1]?.trim();
        if (url) window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
      }
      const clean = full.replace(CMD_RE, "").trim();
      setMsgs(m => {
        let updated = m.map(x => x.id === pid ? { ...x, content: clean, streaming: false } : x);
        if (extra.length) updated = [...updated, ...extra];
        sto.set("msgs_" + chatSessionId, updated);
        const first = updated.find(x => x.role === "user")?.content || "";
        onSessionUpdate?.(chatSessionId, first.slice(0, 48) || "Chat", clean.slice(0, 60));
        return updated;
      });
      // Auto-open or update artifact panel whenever AURA outputs HTML
      const htmlMatch = clean.match(/```html\n([\s\S]*?)```/);
      if (htmlMatch) {
        const existingTitle = artifactRef.current?.title || "Live Preview";
        setArtifact({ type: "html", code: htmlMatch[1], title: existingTitle });
        setArtifactTab("preview");
      }
      // Auto-speak only in voice conversation mode — tap 🔊 to speak manually
    } catch (e) {
      setMsgs(m => m.map(x => x.id === pid ? { ...x, content: `⚠️ ${e.message}`, streaming: false } : x));
    }
    setLoading(false);
  };

  const hasMessages = msgs.length > 0;
  const stateColor  = voiceState === "listening" ? C.green : voiceState === "speaking" ? C.cyan : C.gold;

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", minHeight: 0, position: "relative" }}>
    {/* ── ARTIFACT PANEL ── */}
    <ArtifactPanel artifact={artifact} tab={artifactTab} setTab={setArtifactTab} onClose={() => setArtifact(null)} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
      <input ref={camInputRef}  type="file" accept="image/*" capture="environment"            style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />

      {/* ── VOICE CONVERSATION OVERLAY ── */}
      {voiceMode && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: `${C.bg}f0`, backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: stateColor, textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>
            {voiceState === "listening" ? "Listening…" : voiceState === "thinking" ? "Thinking…" : "Speaking…"}
          </div>
          <div style={{ position: "relative", width: 140, height: 140, cursor: "pointer" }} onClick={deactivateVoiceMode}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${stateColor}33`, animation: "rotate 5s linear infinite" }} />
            <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: `1.5px solid ${stateColor}22`, animation: "rotate 9s linear infinite reverse" }} />
            <div style={{ position: "absolute", inset: 22, borderRadius: "50%", background: `radial-gradient(circle,${stateColor}18,transparent)`, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, color: stateColor, filter: `drop-shadow(0 0 18px ${stateColor}88)` }}>◈</div>
          </div>
          {interimText && (
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", maxWidth: 280, textAlign: "center", lineHeight: 1.6 }}>"{interimText}"</div>
          )}
          {voiceState === "speaking" && (() => {
            const last = [...msgs].reverse().find(m => m.role === "assistant" && m.content);
            return last ? <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", maxWidth: 280, textAlign: "center", lineHeight: 1.7 }}>{last.content.slice(0, 110)}{last.content.length > 110 ? "…" : ""}</div> : null;
          })()}
          <button onClick={deactivateVoiceMode} style={{ background: `${C.red}18`, border: `1.5px solid ${C.red}55`, borderRadius: "50%", width: 52, height: 52, cursor: "pointer", color: C.red, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: 1 }}>TAP ✕ TO END</div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {!hasMessages ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px 32px", gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
            <div style={{ position: "relative", width: 80, height: 80, cursor: "pointer" }} onClick={activateVoiceMode}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1.5px solid ${C.cyan}44`, animation: "rotate 8s linear infinite" }} />
              <div style={{ position: "absolute", inset: 5, borderRadius: "50%", border: `1px solid ${C.purple}33`, animation: "rotate 12s linear infinite reverse" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: C.cyan }}>◈</div>
              <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: wakeOn ? C.green : "rgba(255,255,255,0.22)", whiteSpace: "nowrap", letterSpacing: 1 }}>{wakeOn ? `SAY "HEY ${auraName.toUpperCase()}"` : "TAP OR SPEAK"}</div>
            </div>
            {agentMode ? (
              <div style={{ textAlign: "center", marginTop: 10, width: "100%", maxWidth: 340 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{agentMode.emoji}</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{agentMode.name}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 12px", borderRadius: 20, background: `${C.cyan}18`, border: `1px solid ${C.cyan}44`, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: C.cyan, fontWeight: 700 }}>{agentMode.industry}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{agentMode.description}</div>
              </div>
            ) : (
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 19, fontWeight: 900, color: "#fff", marginBottom: 7 }}>
                  {userName ? `Hey ${userName.split(" ")[0]} 👋` : "How can I help?"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>Ask me anything — type, speak, or attach a file.</div>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {QUICK.map((q, i) => (
                <div key={i} onClick={() => send(q)} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>{q}</div>
              ))}
            </div>

            {/* ── CENTERED INPUT (empty state) ── */}
            <div style={{ width: "100%", marginTop: 4 }}>
              {attachment && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {attachment.preview
                    ? <img src={attachment.preview} alt="attach" style={{ height: 48, borderRadius: 8, border: `1px solid ${C.border}` }} />
                    : <div style={{ fontSize: 11, color: C.cyan, background: `${C.cyan}15`, border: `1px solid ${C.cyan}33`, borderRadius: 8, padding: "4px 10px" }}>📎 {attachment.file.name}</div>}
                  <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              )}
              <div style={{ display: "flex", gap: 7, alignItems: "flex-end", background: "rgba(255,255,255,0.06)", border: `1.5px solid ${voiceState === "dictating" ? C.green + "77" : input.trim() || attachment ? C.cyan + "66" : C.cyan + "28"}`, borderRadius: 20, padding: "10px 12px", transition: "border-color 0.2s", boxShadow: `0 4px 24px ${C.cyan}12` }}>
                <button onClick={() => setShowPlus(s => !s)} style={{ background: showPlus ? `${C.cyan}18` : "rgba(255,255,255,0.06)", border: `1px solid ${showPlus ? C.cyan + "44" : "rgba(255,255,255,0.09)"}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 20, color: showPlus ? C.cyan : "rgba(255,255,255,0.5)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, position: "relative" }}>
                  {showPlus ? "×" : "+"}
                  {thinkMode && <div style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, borderRadius: "50%", background: C.gold }} />}
                  {searchMode && !thinkMode && <div style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, borderRadius: "50%", background: C.cyan }} />}
                </button>
                <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={searchMode ? "What do you want to search?" : voiceState === "dictating" ? "Listening… speak now" : `Ask ${auraName} anything…`}
                  rows={1}
                  style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 14, fontFamily: "'Inter','DM Mono',sans-serif", resize: "none", outline: "none", lineHeight: 1.6, maxHeight: 140, overflowY: "auto", paddingTop: 2 }} />
                <button onClick={voiceMode ? deactivateVoiceMode : startDictation}
                  style={{ background: voiceMode ? `${C.green}22` : voiceState === "dictating" ? `${C.red}22` : "rgba(255,255,255,0.06)", border: `1px solid ${voiceMode ? C.green + "55" : voiceState === "dictating" ? C.red + "55" : "rgba(255,255,255,0.09)"}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 17, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", animation: voiceMode || voiceState === "dictating" ? "pulse 1.2s infinite" : "none" }}>
                  {voiceMode ? "🟢" : voiceState === "dictating" ? "🔴" : "🎙"}
                </button>
                <button onClick={() => voiceMode ? activateVoiceMode() : send()} disabled={(!input.trim() && !attachment) || loading}
                  style={{ background: (input.trim() || attachment) && !loading ? `linear-gradient(135deg,${C.cyan},${C.purple})` : "rgba(255,255,255,0.05)", border: "none", borderRadius: 12, width: 38, height: 38, cursor: (input.trim() || attachment) && !loading ? "pointer" : "default", fontSize: 15, color: (input.trim() || attachment) && !loading ? "#000" : "rgba(255,255,255,0.2)", fontWeight: 800, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  ▶
                </button>
              </div>
              {wakeOn && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
                  <span style={{ fontSize: 9, color: C.green, letterSpacing: 1 }}>SAY "HEY {auraName.toUpperCase()}"</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, padding: "20px 14px 8px", display: "flex", flexDirection: "column", gap: 22, maxWidth: 760, margin: "0 auto", width: "100%" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
                {m.role === "assistant" && <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginTop: 2 }}>◈</div>}
                <div style={{ maxWidth: m.role === "user" ? "75%" : "86%" }}>
                  {(!m.type || m.type === "text") && (
                    <>
                      {m.imagePreview && <div style={{ marginBottom: 8, borderRadius: 12, overflow: "hidden", maxWidth: 200 }}><img src={m.imagePreview} alt="attachment" style={{ width: "100%", display: "block" }} /></div>}
                      <div style={{ padding: m.role === "user" ? "10px 15px" : "0", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : 0, background: m.role === "user" ? `linear-gradient(135deg,${C.purple}44,${C.blue}33)` : "transparent", border: m.role === "user" ? `1px solid ${C.purple}44` : "none", fontSize: 13.5, color: "rgba(255,255,255,0.9)", fontFamily: "'Inter','DM Mono',sans-serif" }}>
                        {m.role === "user" ? <span style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{m.content}</span> : <Markdown text={m.content} onArtifact={(a) => { setArtifact(a); setArtifactTab("preview"); }} />}
                        {m.streaming && <span style={{ display: "inline-block", width: 2, height: 15, background: C.cyan, marginLeft: 2, animation: "pulse 0.6s infinite", borderRadius: 1, verticalAlign: "text-bottom" }} />}
                      </div>
                      {m.role === "assistant" && !m.streaming && m.content && (
                        <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                          <button onClick={() => copyMsg(m.content, i)} style={{ background: copied === i ? `${C.green}18` : "rgba(255,255,255,0.04)", border: `1px solid ${copied === i ? C.green + "44" : "rgba(255,255,255,0.07)"}`, borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 10, color: copied === i ? C.green : "rgba(255,255,255,0.3)" }}>{copied === i ? "✓" : "⧉"}</button>
                          <button onClick={() => speakFull(m.content)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>🔊</button>
                        </div>
                      )}
                    </>
                  )}
                  {m.type === "image" && (
                    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.cyan}33` }}>
                      <div style={{ padding: "6px 12px", fontSize: 10, color: C.cyan, background: `${C.cyan}08`, display: "flex", alignItems: "center" }}>
                        <span style={{ flex: 1 }}>🎨 Image</span>
                        <button onClick={() => { const a = document.createElement("a"); a.href = m.imageUrl; a.download = "aura-image.png"; a.target = "_blank"; a.click(); }} style={{ background: `${C.cyan}15`, border: `1px solid ${C.cyan}33`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 10, color: C.cyan, fontFamily: "'DM Mono',monospace" }}>⬇ Save</button>
                      </div>
                      <img src={m.imageUrl} alt={m.caption} style={{ width: "100%", display: "block", minHeight: 80, background: "rgba(0,0,0,0.3)" }} onError={e => { e.target.style.opacity = "0.2"; }} />
                    </div>
                  )}
                </div>
                {m.role === "user" && <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.purple}88,${C.cyan}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, marginTop: 2 }}>{userName ? userName[0].toUpperCase() : "U"}</div>}
              </div>
            ))}
            {loading && !msgs.find(m => m.streaming) && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>◈</div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", paddingTop: 8 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.cyan, animation: `pulse ${0.6+i*0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* ── PLUS BOTTOM SHEET ── */}
      {showPlus && (
        <>
          <div onClick={() => setShowPlus(false)} style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.45)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 41, background: "#0d0d0d", borderRadius: "20px 20px 0 0", padding: "14px 8px 28px", border: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 2, margin: "0 auto 14px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
              {PLUS_OPTIONS.map(opt => (
                <div key={opt.id} onClick={() => handlePlusOption(opt.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 6px", cursor: "pointer", borderRadius: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: (opt.id === "think" && thinkMode) ? `${C.gold}22` : (opt.id === "search" && searchMode) ? `${C.cyan}22` : "rgba(255,255,255,0.07)", border: `1px solid ${(opt.id === "think" && thinkMode) ? C.gold + "55" : (opt.id === "search" && searchMode) ? C.cyan + "55" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{opt.icon}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{opt.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── INPUT BAR (messages mode only — empty state has its own centered input) ── */}
      {hasMessages && <div style={{ padding: "8px 12px 18px", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: `${C.bg}f4`, backdropFilter: "blur(20px)" }}>
        {attachment && (
          <div style={{ maxWidth: 760, margin: "0 auto 8px", display: "flex", alignItems: "center", gap: 8 }}>
            {attachment.preview
              ? <img src={attachment.preview} alt="attach" style={{ height: 48, borderRadius: 8, border: `1px solid ${C.border}` }} />
              : <div style={{ fontSize: 11, color: C.cyan, background: `${C.cyan}15`, border: `1px solid ${C.cyan}33`, borderRadius: 8, padding: "4px 10px" }}>📎 {attachment.file.name}</div>}
            <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        )}
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 7, alignItems: "flex-end", background: "rgba(255,255,255,0.05)", border: `1.5px solid ${voiceState === "dictating" ? C.green + "77" : input.trim() || attachment ? C.cyan + "55" : C.cyan + "18"}`, borderRadius: 20, padding: "8px 10px", transition: "border-color 0.2s" }}>
            <button onClick={() => setShowPlus(s => !s)} style={{ background: showPlus ? `${C.cyan}18` : "rgba(255,255,255,0.06)", border: `1px solid ${showPlus ? C.cyan + "44" : "rgba(255,255,255,0.09)"}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 20, color: showPlus ? C.cyan : "rgba(255,255,255,0.5)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, position: "relative" }}>
              {showPlus ? "×" : "+"}
              {thinkMode && <div style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, borderRadius: "50%", background: C.gold }} />}
              {searchMode && !thinkMode && <div style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, borderRadius: "50%", background: C.cyan }} />}
            </button>
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={searchMode ? "What do you want to search?" : voiceState === "dictating" ? "Listening… speak now" : `Ask ${auraName} anything…`}
              rows={1}
              style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 13.5, fontFamily: "'Inter','DM Mono',sans-serif", resize: "none", outline: "none", lineHeight: 1.6, maxHeight: 140, overflowY: "auto", paddingTop: 2 }} />
            <button onClick={voiceMode ? deactivateVoiceMode : startDictation}
              style={{ background: voiceMode ? `${C.green}22` : voiceState === "dictating" ? `${C.red}22` : "rgba(255,255,255,0.06)", border: `1px solid ${voiceMode ? C.green + "55" : voiceState === "dictating" ? C.red + "55" : "rgba(255,255,255,0.09)"}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 17, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", animation: voiceMode || voiceState === "dictating" ? "pulse 1.2s infinite" : "none" }}>
              {voiceMode ? "🟢" : voiceState === "dictating" ? "🔴" : "🎙"}
            </button>
            <button onClick={() => voiceMode ? activateVoiceMode() : send()} disabled={(!input.trim() && !attachment) || loading}
              style={{ background: (input.trim() || attachment) && !loading ? `linear-gradient(135deg,${C.cyan},${C.purple})` : "rgba(255,255,255,0.05)", border: "none", borderRadius: 12, width: 36, height: 36, cursor: (input.trim() || attachment) && !loading ? "pointer" : "default", fontSize: 15, color: (input.trim() || attachment) && !loading ? "#000" : "rgba(255,255,255,0.2)", fontWeight: 800, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              ▶
            </button>
          </div>
          {wakeOn && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
              <span style={{ fontSize: 9, color: C.green, letterSpacing: 1 }}>SAY "HEY {auraName.toUpperCase()}"</span>
            </div>
          )}
        </div>
      </div>}

    </div>
    </div>
  );
}
