import { useState, useRef, useCallback } from "react";
import { C } from "../theme/colors";
import { Btn, Spinner } from "../components/ui";
import { callClaudeStream } from "../utils/api";
import { sto } from "../utils/storage";

const LANG_COLOR = { html: "#e44d26", css: "#264de4", js: "#f7df1e", javascript: "#f7df1e", py: "#3572a5", python: "#3572a5", ts: "#3178c6", typescript: "#3178c6", json: "#cbcb41", md: "#519aba" };
const LANG_EXT = { html: "html", css: "css", js: "javascript", ts: "typescript", py: "python", json: "json", md: "markdown" };

const DEFAULT_FILES = [
  { name: "index.html", lang: "html", code: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src="script.js"></script>\n</body>\n</html>` },
  { name: "style.css", lang: "css", code: `* { box-sizing: border-box; margin: 0; padding: 0; }\nbody {\n  font-family: 'Inter', sans-serif;\n  background: #0a0a0f;\n  color: #fff;\n  padding: 32px;\n}` },
  { name: "script.js", lang: "js", code: `// Your JavaScript here\nconsole.log('AURA Code Workspace ready');` },
];

function buildPreview(files) {
  const html = files.find(f => f.lang === "html")?.code || "<html><body><p style='color:#fff;padding:16px'>No HTML file</p></body></html>";
  const css  = files.find(f => f.lang === "css")?.code  || "";
  const js   = files.find(f => f.lang === "js" || f.lang === "javascript")?.code || "";
  let out = html;
  if (css) out = out.includes("</head>") ? out.replace("</head>", `<style>\n${css}\n</style>\n</head>`) : `<style>\n${css}\n</style>\n` + out;
  if (js)  out = out.includes("</body>") ? out.replace("</body>", `<script>\n${js}\n</script>\n</body>`) : out + `\n<script>\n${js}\n</script>`;
  return out;
}

function langFromName(name) {
  const ext = name.split(".").pop().toLowerCase();
  return LANG_EXT[ext] || ext;
}

export default function CodeScreen({ auraName }) {
  const wsKey = "aura_code_workspace";
  const [files, setFiles]         = useState(() => sto.get(wsKey, DEFAULT_FILES));
  const [activeFile, setActiveFile] = useState(0);
  const [tab, setTab]             = useState("editor"); // "editor" | "preview"
  const [newName, setNewName]     = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [aiPrompt, setAiPrompt]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen]       = useState(false);
  const [copied, setCopied]       = useState(false);
  const textareaRef = useRef();

  const save = useCallback((updated) => {
    setFiles(updated);
    sto.set(wsKey, updated);
  }, []);

  const updateCode = (code) => {
    const updated = files.map((f, i) => i === activeFile ? { ...f, code } : f);
    save(updated);
  };

  const addFile = () => {
    const name = newName.trim();
    if (!name) return;
    const lang = langFromName(name);
    const updated = [...files, { name, lang, code: "" }];
    save(updated);
    setActiveFile(updated.length - 1);
    setNewName("");
    setShowNew(false);
  };

  const deleteFile = (idx) => {
    if (files.length <= 1) return;
    const updated = files.filter((_, i) => i !== idx);
    save(updated);
    setActiveFile(Math.min(activeFile, updated.length - 1));
  };

  const resetWorkspace = () => {
    save(DEFAULT_FILES);
    setActiveFile(0);
  };

  const download = () => {
    const preview = buildPreview(files);
    const blob = new Blob([preview], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aura-project.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyFile = () => {
    navigator.clipboard?.writeText(files[activeFile]?.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const askAI = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    const current = files[activeFile];
    const context = files.map(f => `\`\`\`${f.lang}\n// ${f.name}\n${f.code}\n\`\`\``).join("\n\n");
    const userMsg = `${aiPrompt.trim()}\n\nCurrent workspace files:\n${context}\n\nFocus on: ${current.name}`;

    let full = "";
    try {
      await callClaudeStream(
        [{ role: "user", content: userMsg }],
        `You are AURA Code — an expert software engineer. The user has a multi-file web project.
When asked to write/modify code, output the complete updated file content inside a code block like:
\`\`\`${current.lang}
// full file content here
\`\`\`
Only output the raw code block for the file, nothing else.`,
        (chunk) => { full += chunk; }
      );
      const match = full.match(/```[\w]*\n([\s\S]*?)```/);
      if (match) {
        const updated = files.map((f, i) => i === activeFile ? { ...f, code: match[1].trim() } : f);
        save(updated);
      }
    } catch {}
    setAiLoading(false);
    setAiPrompt("");
    setAiOpen(false);
  };

  const cur = files[activeFile] || files[0];
  const preview = buildPreview(files);
  const color = LANG_COLOR[cur?.lang] || "rgba(255,255,255,0.4)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#07070f" }}>

      {/* Top toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, background: "rgba(255,255,255,0.02)" }}>
        <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: 1 }}>⌨ CODE</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setTab("editor")} style={{ background: tab === "editor" ? "rgba(74,222,128,0.12)" : "transparent", border: `1px solid ${tab === "editor" ? "#4ade8055" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "editor" ? "#4ade80" : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Editor</button>
        <button onClick={() => setTab("preview")} style={{ background: tab === "preview" ? "rgba(0,255,229,0.1)" : "transparent", border: `1px solid ${tab === "preview" ? C.cyan + "55" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "preview" ? C.cyan : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>▶ Preview</button>
        <button onClick={() => setAiOpen(s => !s)} style={{ background: aiOpen ? "rgba(123,47,247,0.18)" : "rgba(123,47,247,0.08)", border: `1px solid ${C.purple}44`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: C.purple, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>✦ AI</button>
        <button onClick={copyFile} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: copied ? "#4ade80" : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>{copied ? "✓" : "Copy"}</button>
        <button onClick={download} style={{ background: `${C.cyan}12`, border: `1px solid ${C.cyan}33`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: C.cyan, fontFamily: "'DM Mono',monospace" }}>⬇</button>
      </div>

      {/* AI assistant bar */}
      {aiOpen && (
        <div style={{ display: "flex", gap: 6, padding: "6px 10px", borderBottom: "1px solid rgba(123,47,247,0.2)", background: "rgba(123,47,247,0.05)", flexShrink: 0 }}>
          <input
            autoFocus
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") askAI(); if (e.key === "Escape") setAiOpen(false); }}
            placeholder={`Tell ${auraName} what to do with ${cur?.name}…`}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.purple}44`, borderRadius: 8, padding: "7px 12px", color: "#fff", fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none" }}
          />
          <Btn color={C.purple} small onClick={askAI} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            {aiLoading ? <><Spinner color="#fff" size={12} /> Working…</> : "Apply"}
          </Btn>
        </div>
      )}

      {/* File tabs */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.01)", flexShrink: 0, overflowX: "auto" }}>
        {files.map((f, i) => {
          const fc = LANG_COLOR[f.lang] || "rgba(255,255,255,0.5)";
          const isActive = i === activeFile;
          return (
            <div key={i} onClick={() => setActiveFile(i)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", cursor: "pointer", borderBottom: isActive ? `2px solid ${fc}` : "2px solid transparent", background: isActive ? "rgba(255,255,255,0.04)" : "transparent", color: isActive ? fc : "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap", transition: "all 0.12s", flexShrink: 0 }}>
              <span style={{ fontSize: 9, width: 8, height: 8, borderRadius: "50%", background: fc, display: "inline-block", flexShrink: 0 }} />
              {f.name}
              {files.length > 1 && (
                <button onClick={e => { e.stopPropagation(); deleteFile(i); }}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 10, padding: "0 1px", lineHeight: 1, marginLeft: 3 }}>✕</button>
              )}
            </div>
          );
        })}
        {/* Add file */}
        {showNew ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", flexShrink: 0 }}>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addFile(); if (e.key === "Escape") setShowNew(false); }}
              placeholder="filename.ext"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "3px 7px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: 110 }} />
            <button onClick={addFile} style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontSize: 10, color: "#4ade80", fontFamily: "'DM Mono',monospace" }}>+</button>
            <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowNew(true)} style={{ padding: "6px 12px", background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 16, flexShrink: 0, lineHeight: 1 }}>+</button>
        )}
        <button onClick={resetWorkspace} style={{ marginLeft: "auto", padding: "6px 10px", background: "none", border: "none", color: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace", flexShrink: 0 }} title="Reset workspace">↺</button>
      </div>

      {/* Editor / Preview */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {tab === "editor" ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "4px 12px", background: "rgba(255,255,255,0.015)", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 10, color, flexShrink: 0, fontFamily: "'DM Mono',monospace" }}>
              {cur?.name} · {cur?.lang?.toUpperCase()} · {cur?.code?.length || 0} chars
            </div>
            <textarea
              ref={textareaRef}
              value={cur?.code || ""}
              onChange={e => updateCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                padding: "14px 16px",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "'DM Mono', 'Fira Code', monospace",
                lineHeight: 1.7,
                caretColor: color,
                tabSize: 2,
              }}
              onKeyDown={e => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const ta = e.target;
                  const s = ta.selectionStart, en = ta.selectionEnd;
                  const v = ta.value;
                  ta.value = v.slice(0, s) + "  " + v.slice(en);
                  ta.selectionStart = ta.selectionEnd = s + 2;
                  updateCode(ta.value);
                }
              }}
            />
          </div>
        ) : (
          <iframe
            srcDoc={preview}
            title="code-preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#fff" }}
          />
        )}
      </div>
    </div>
  );
}
