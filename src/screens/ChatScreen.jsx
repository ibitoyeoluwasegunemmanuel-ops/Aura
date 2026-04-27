import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../theme/colors";
import { callClaudeStream, genImgEnhanced, webSearch } from "../utils/api";
import { speakFull } from "../utils/voice";
import { sto } from "../utils/storage";
import { FOUNDER_SYSTEM_BLOCK } from "../data/founder";
import ArtifactPanel from "../components/ArtifactPanel";
import Markdown from "../components/Markdown";

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


export default function ChatScreen({ auraName, authSession, chatSessionId, onSessionUpdate, agentMode, modePrompt, projectPrompt }) {
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
  const [editingIdx, setEditingIdx]   = useState(null);
  const [editVal, setEditVal]         = useState("");
  const [artifact, setArtifact]       = useState(null); // { type: "html"|"mermaid", code, title }
  const [artifactTab, setArtifactTab] = useState("preview"); // "preview" | "code"
  const [suggestions, setSuggestions] = useState([]);

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

  // Cross-session memory: last 5 exchanges from any session
  const crossMemory = sto.get("aura_memory", []);
  const memoryBlock = crossMemory.length > 0
    ? "\n\nRECENT MEMORY (from past conversations):\n" + crossMemory.slice(-5).map(m => `• User asked: "${m.user}" → You replied: "${m.aura}"`).join("\n")
    : "";

  const artifactContext = artifact
    ? `\n\nCURRENT OPEN DESIGN (already rendered in the live preview panel):\n\`\`\`html\n${artifact.code}\n\`\`\`\nIf the user asks to change, update, edit, modify, improve, or fix this design → output a complete revised \`\`\`html code block with ALL changes applied. Keep everything else intact.`
    : "";

  const FOLLOWUPS_RULE = `

After every conversational reply (skip for pure code/HTML/image outputs), end with exactly this on a new line:
[FOLLOWUPS: Question 1 | Question 2 | Question 3]
Keep each question under 9 words. Make them directly relevant to the current topic.`;

  const SYSTEM = agentMode
    ? `${agentMode.prompt}

${FOUNDER_SYSTEM_BLOCK}
${userProfile?.name ? `\nUser's name: ${userProfile.name}. Role: ${userProfile.role || ""}. Preferences: ${userProfile.preferences || ""}. Projects: ${userProfile.projects || ""}.` : ""}
${projectPrompt ? `\nPROJECT CONTEXT:\n${projectPrompt}` : ""}

Response style: Be direct and expert. Sound natural and confident. Use emojis naturally.

Special commands (emit on own line when relevant):
[IMAGE: description] — generate image
[LOCATION] — get GPS
[OPEN: url] — open website

DESIGN RULE: When asked to design, build, or create any website, web app, dashboard, UI, landing page, or component — output ONLY a single complete \`\`\`html code block. No explanation before or after. The HTML must be fully self-contained with embedded CSS and JS. Design standard: dark background (#0a0a0f), glassmorphism cards (backdrop-filter: blur), CSS custom properties, smooth animations (cubic-bezier transitions), Google Fonts via CDN (Inter or Plus Jakarta Sans), gradient accents, real content (no lorem ipsum), mobile responsive, interactive hover states. Think: Stripe, Linear, Vercel design quality.${artifactContext}${memoryBlock}${FOLLOWUPS_RULE}`
    : `You are ${auraName}, a genius personal AI OS — confident, direct, warm. Like a brilliant friend who always delivers.
${FOUNDER_SYSTEM_BLOCK}
${modePrompt ? `\n${modePrompt}` : ""}
${userProfile?.name ? `\nUser's name: ${userProfile.name}. Role: ${userProfile.role || ""}. Preferences: ${userProfile.preferences || ""}. Projects: ${userProfile.projects || ""}.` : ""}
${projectPrompt ? `\nPROJECT CONTEXT:\n${projectPrompt}` : ""}

Response style: Be direct. Sound natural and confident. Use emojis naturally.

Special commands (emit on own line when relevant):
[IMAGE: description] — generate image
[LOCATION] — get GPS
[OPEN: url] — open website

DESIGN RULE: When asked to design, build, or create any website, web app, dashboard, UI, landing page, or component — output ONLY a single complete \`\`\`html code block. No explanation before or after. The HTML must be fully self-contained with embedded CSS and JS. Design standard: dark background (#0a0a0f), glassmorphism cards (backdrop-filter: blur), CSS custom properties, smooth transitions (cubic-bezier), Google Fonts via CDN (Inter or Plus Jakarta Sans), gradient accents, real content (no lorem ipsum), mobile responsive, interactive hover states. Think: Stripe, Linear, Vercel design quality. This renders live in AURA's preview panel.

REACT RULE: If asked specifically for a React component, output a \`\`\`jsx code block. Define an \`App\` function component. Use inline styles or plain CSS. No imports needed — React is available globally.${artifactContext}${memoryBlock}${FOLLOWUPS_RULE}`;

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

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      // Escape → close artifact panel or plus menu
      if (e.key === "Escape") { setArtifact(null); setShowPlus(false); setEditingIdx(null); }
      // Ctrl/Cmd + / → toggle think mode
      if ((e.ctrlKey || e.metaKey) && e.key === "/") { e.preventDefault(); setThinkMode(t => !t); }
      // Ctrl/Cmd + Shift + S → export chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") { e.preventDefault(); if (msgs.length) exportChat(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs]);

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
    } else if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        setAttachment({ type: "pdf", file, preview: null, base64: data.split(",")[1], mediaType: "application/pdf" });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachment({ type: "text", file, preview: null, textContent: e.target.result });
      };
      reader.readAsText(file);
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

  const exportChat = () => {
    const md = msgs.filter(m => m.type !== "image").map(m =>
      m.role === "user" ? `**You:** ${m.content}` : `**${auraName}:** ${m.content}`
    ).join("\n\n---\n\n");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AURA Chat Export</title>
<style>body{font-family:'Inter',sans-serif;background:#02020a;color:#e0e0e0;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.7}
h1{color:#00ffe5;font-size:18px;border-bottom:1px solid #333;padding-bottom:12px}
.user{background:linear-gradient(135deg,#7c3aed22,#1d4ed822);border:1px solid #7c3aed44;border-radius:18px 18px 4px 18px;padding:12px 16px;margin:16px 0;max-width:80%;margin-left:auto}
.ai{padding:12px 0;border-bottom:1px solid #1a1a2e;margin:16px 0}
.label{font-size:10px;letter-spacing:2px;color:#666;margin-bottom:6px;text-transform:uppercase}
pre{background:#0d0d1a;border:1px solid #333;border-radius:8px;padding:12px;overflow-x:auto;font-size:12px}
code{color:#a8ff78;font-family:'DM Mono',monospace}
strong{color:#fff}em{color:#ccc}
.ts{font-size:10px;color:#333;text-align:right;margin-top:40px}</style></head>
<body><h1>◈ AURA Chat Export</h1>
${msgs.filter(m => m.type !== "image").map(m => m.role === "user"
  ? `<div class="user"><div class="label">You</div>${m.content.replace(/</g,"&lt;")}</div>`
  : `<div class="ai"><div class="label">${auraName}</div>${m.content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>")}</div>`
).join("")}
<div class="ts">Exported ${new Date().toLocaleString()} · AURA OS by CEO Global</div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "aura-chat.html"; a.click(); URL.revokeObjectURL(a.href);
    navigator.clipboard?.writeText(md);
  };

  const send = async (text, baseHistory) => {
    const t = (text || input).trim();
    if ((!t && !attachment) || loading) return;
    setInput("");
    setSuggestions([]);
    const userMsg = {
      role: "user", type: "text",
      content: t || (attachment?.type === "pdf" ? `Analyze PDF: ${attachment.file.name}` : attachment?.type === "text" ? `Analyze file: ${attachment.file.name}` : "Describe this image."),
    };
    if (attachment?.preview) userMsg.imagePreview = attachment.preview;
    const history = [...(baseHistory || msgs), userMsg];
    setMsgs(history);
    const att = attachment;
    setAttachment(null);
    setLoading(true);
    const pid = Date.now();
    setMsgs(m => [...m, { role: "assistant", type: "text", content: "", id: pid, streaming: true }]);

    const apiMsgs = history.map((msg, idx) => {
      if (idx === history.length - 1 && att?.type === "image" && att.base64) {
        return { role: msg.role, content: [
          { type: "image", source: { type: "base64", media_type: att.mediaType, data: att.base64 } },
          { type: "text", text: t || "What do you see?" },
        ]};
      }
      if (idx === history.length - 1 && att?.type === "pdf" && att.base64) {
        return { role: msg.role, content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: att.base64 } },
          { type: "text", text: t || "Summarize this PDF. List the key points." },
        ]};
      }
      if (idx === history.length - 1 && att?.type === "text" && att.textContent) {
        return { role: msg.role, content: `${t || "Analyze this file:"}\n\nFile: ${att.file.name}\n\n${att.textContent.slice(0, 8000)}` };
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

    const sys = searchContext ? SYSTEM + `\n\nWEB SEARCH RESULTS for "${t}":\n${searchContext}\n\nUse these results to answer accurately. Cite sources when useful.` : SYSTEM;
    let full = "", thinkingText = "";
    try {
      await callClaudeStream(apiMsgs, sys, (chunk) => {
        full += chunk;
        setMsgs(m => m.map(x => x.id === pid ? { ...x, content: full } : x));
      }, (thinkChunk) => {
        thinkingText += thinkChunk;
        setMsgs(m => m.map(x => x.id === pid ? { ...x, thinking: thinkingText } : x));
      }, thinkMode);
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
      const rawClean = full.replace(CMD_RE, "").trim();
      const followRe = /\[FOLLOWUPS:\s*([^\]]+)\]/i;
      const followMatch = rawClean.match(followRe);
      setSuggestions(followMatch ? followMatch[1].split("|").map(s => s.trim()).filter(Boolean).slice(0, 3) : []);
      const clean = rawClean.replace(followRe, "").trim();
      setMsgs(m => {
        let updated = m.map(x => x.id === pid ? { ...x, content: clean, streaming: false } : x);
        if (extra.length) updated = [...updated, ...extra];
        sto.set("msgs_" + chatSessionId, updated);
        const first = updated.find(x => x.role === "user")?.content || "";
        onSessionUpdate?.(chatSessionId, first.slice(0, 48) || "Chat", clean.slice(0, 60));
        return updated;
      });
      // Save exchange to cross-session memory (last 20 items)
      const mem = sto.get("aura_memory", []);
      mem.push({ ts: Date.now(), user: t.slice(0, 120), aura: clean.replace(/```[\s\S]*?```/g, "[code]").slice(0, 200) });
      sto.set("aura_memory", mem.slice(-20));

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
                  {attachment.type === "image" && attachment.preview
                    ? <img src={attachment.preview} alt="attach" style={{ height: 48, borderRadius: 8, border: `1px solid ${C.border}` }} />
                    : <div style={{ fontSize: 11, color: attachment.type === "pdf" ? C.red || "#ff6b6b" : C.cyan, background: attachment.type === "pdf" ? "rgba(255,107,107,0.1)" : `${C.cyan}15`, border: `1px solid ${attachment.type === "pdf" ? "rgba(255,107,107,0.3)" : C.cyan + "33"}`, borderRadius: 8, padding: "4px 10px" }}>{attachment.type === "pdf" ? "📄" : "📎"} {attachment.file.name}</div>}
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
                      {m.role === "user" && editingIdx === i ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <textarea autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const t = editVal.trim(); if (!t) return; const trimmed = msgs.slice(0, i); setMsgs(trimmed); setEditingIdx(null); setEditVal(""); send(t, trimmed); }
                              if (e.key === "Escape") { setEditingIdx(null); setEditVal(""); }
                            }}
                            style={{ background: "rgba(255,255,255,0.07)", border: `1.5px solid ${C.purple}66`, borderRadius: 14, padding: "10px 14px", color: "#fff", fontSize: 13.5, fontFamily: "'Inter',sans-serif", resize: "none", outline: "none", lineHeight: 1.7, minHeight: 60 }} />
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={() => { setEditingIdx(null); setEditVal(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                            <button onClick={() => { const t = editVal.trim(); if (!t) return; const trimmed = msgs.slice(0, i); setMsgs(trimmed); setEditingIdx(null); setEditVal(""); send(t, trimmed); }} style={{ background: `linear-gradient(135deg,${C.purple},${C.cyan})`, border: "none", borderRadius: 8, padding: "4px 14px", cursor: "pointer", fontSize: 11, color: "#000", fontWeight: 700 }}>Resend ▶</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ position: "relative" }} className="msg-wrap">
                          {m.role === "assistant" && m.thinking && (
                        <details style={{ marginBottom: 8 }}>
                          <summary style={{ cursor: "pointer", fontSize: 11, color: C.gold, letterSpacing: 1, userSelect: "none", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>▸</span><span>🧠 THINKING PROCESS</span>
                          </summary>
                          <pre style={{ margin: "8px 0 0", padding: "10px 14px", background: `${C.gold}08`, border: `1px solid ${C.gold}18`, borderRadius: 10, fontSize: 11, color: `${C.gold}cc`, fontFamily: "'DM Mono',monospace", whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 300, overflowY: "auto" }}>{m.thinking}</pre>
                        </details>
                      )}
                      <div style={{ padding: m.role === "user" ? "10px 15px" : "0", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : 0, background: m.role === "user" ? `linear-gradient(135deg,${C.purple}44,${C.blue}33)` : "transparent", border: m.role === "user" ? `1px solid ${C.purple}44` : "none", fontSize: 13.5, color: "rgba(255,255,255,0.9)", fontFamily: "'Inter','DM Mono',sans-serif" }}>
                            {m.role === "user" ? <span style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{m.content}</span> : <Markdown text={m.content} onArtifact={(a) => { setArtifact(a); setArtifactTab("preview"); }} />}
                            {m.streaming && <span style={{ display: "inline-block", width: 2, height: 15, background: C.cyan, marginLeft: 2, animation: "pulse 0.6s infinite", borderRadius: 1, verticalAlign: "text-bottom" }} />}
                          </div>
                          {m.role === "user" && !loading && (
                            <button onClick={() => { setEditingIdx(i); setEditVal(m.content); }}
                              style={{ position: "absolute", top: -8, left: -28, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, width: 22, height: 22, cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }}
                              className="edit-btn">✎</button>
                          )}
                        </div>
                      )}
                      {m.role === "assistant" && !m.streaming && m.content && (
                        <>
                          <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                            <button onClick={() => copyMsg(m.content, i)} style={{ background: copied === i ? `${C.green}18` : "rgba(255,255,255,0.04)", border: `1px solid ${copied === i ? C.green + "44" : "rgba(255,255,255,0.07)"}`, borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 10, color: copied === i ? C.green : "rgba(255,255,255,0.3)" }}>{copied === i ? "✓" : "⧉"}</button>
                            <button onClick={() => speakFull(m.content)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>🔊</button>
                          </div>
                          {i === msgs.length - 1 && suggestions.length > 0 && !loading && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                              {suggestions.map((s, si) => (
                                <button key={si} onClick={() => { setSuggestions([]); send(s); }}
                                  style={{ background: `${C.cyan}08`, border: `1px solid ${C.cyan}28`, borderRadius: 20, padding: "5px 13px", cursor: "pointer", fontSize: 11, color: C.cyan, fontFamily: "'Inter',sans-serif", textAlign: "left", transition: "background 0.15s" }}
                                  onMouseEnter={e => e.currentTarget.style.background = `${C.cyan}18`}
                                  onMouseLeave={e => e.currentTarget.style.background = `${C.cyan}08`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
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

      {/* ── EXPORT BAR (shows when there are messages) ── */}
      {hasMessages && !loading && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "2px 16px 0", flexShrink: 0 }}>
          <button onClick={exportChat} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}>
            ↗ Export chat
          </button>
        </div>
      )}

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
            {attachment.type === "image" && attachment.preview
              ? <img src={attachment.preview} alt="attach" style={{ height: 48, borderRadius: 8, border: `1px solid ${C.border}` }} />
              : <div style={{ fontSize: 11, color: attachment.type === "pdf" ? "#ff6b6b" : C.cyan, background: attachment.type === "pdf" ? "rgba(255,107,107,0.1)" : `${C.cyan}15`, border: `1px solid ${attachment.type === "pdf" ? "rgba(255,107,107,0.3)" : C.cyan + "33"}`, borderRadius: 8, padding: "4px 10px" }}>{attachment.type === "pdf" ? "📄" : "📎"} {attachment.file.name}</div>}
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
