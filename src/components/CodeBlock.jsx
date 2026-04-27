/* eslint-disable no-useless-escape */
import { useState } from "react";
import { C } from "../theme/colors";

export default function CodeBlock({ lang, code }) {
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const isJS  = ["js", "javascript"].includes(lang);
  const isPY  = ["python", "py"].includes(lang);
  const canRun = isJS || isPY;

  const highlighted = (() => {
    try {
      const hljs = window.hljs;
      if (!hljs) return null;
      if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
      return hljs.highlightAuto(code).value;
    } catch { return null; }
  })();

  const copyCode = () => {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  const runCode = () => {
    setRunning(true); setOutput(null);
    if (isJS) {
      const html = `<!DOCTYPE html><html><body><script>
const _logs=[];
console.log=(...a)=>_logs.push(a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' '));
console.error=(...a)=>_logs.push('ERR: '+a.join(' '));
try{const _r=(function(){\n${code}\n})();window.parent.postMessage({t:'ok',logs:_logs,result:_r!==undefined?String(_r):undefined},'*');}
catch(e){window.parent.postMessage({t:'err',logs:_logs,error:e.message},'*');}
<\/script></body></html>`;
      const handler = (e) => {
        if (e.data?.t === "ok" || e.data?.t === "err") {
          window.removeEventListener("message", handler);
          setRunning(false); setOutput(e.data);
          if (frame.parentNode) frame.remove();
        }
      };
      window.addEventListener("message", handler);
      const frame = document.createElement("iframe");
      frame.sandbox = "allow-scripts"; frame.style.display = "none";
      document.body.appendChild(frame); frame.srcdoc = html;
      setTimeout(() => { frame.remove(); window.removeEventListener("message", handler); setRunning(false); }, 8000);
    } else if (isPY) {
      const safeCode = code.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
      const html = `<!DOCTYPE html><html><body><script type="module">
const out=[];
async function run(){
  try{
    const{loadPyodide}=await import('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs');
    window.parent.postMessage({t:'loading'},'*');
    const py=await loadPyodide();
    py.setStdout({batched:s=>out.push(s)});
    py.setStderr({batched:s=>out.push('⚠ '+s)});
    const result=await py.runPythonAsync(\`${safeCode}\`);
    window.parent.postMessage({t:'ok',logs:out,result:result!==undefined&&result!==null?String(result):undefined},'*');
  }catch(e){window.parent.postMessage({t:'err',logs:out,error:e.message},'*');}
}
run();
<\/script></body></html>`;
      const handler = (e) => {
        if (e.data?.t === "loading") { setOutput({ t: "loading" }); return; }
        if (e.data?.t === "ok" || e.data?.t === "err") {
          window.removeEventListener("message", handler);
          setRunning(false); setOutput(e.data);
          if (frame.parentNode) frame.remove();
        }
      };
      window.addEventListener("message", handler);
      const frame = document.createElement("iframe");
      frame.sandbox = "allow-scripts allow-same-origin"; frame.style.display = "none";
      document.body.appendChild(frame); frame.srcdoc = html;
      setTimeout(() => { frame.remove(); window.removeEventListener("message", handler); setRunning(false); }, 60000);
    }
  };

  const langLabel = lang ? lang.toUpperCase() : "CODE";
  const langColor = isJS ? "#f7df1e" : isPY ? "#3776ab" : "rgba(255,255,255,0.3)";

  return (
    <div style={{ margin: "6px 0", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 9, color: langColor, letterSpacing: 2, flex: 1, fontWeight: 700 }}>{langLabel}</span>
        {canRun && <button onClick={runCode} disabled={running} style={{ background: running ? "rgba(255,255,255,0.05)" : `${C.green}18`, border: `1px solid ${C.green}44`, borderRadius: 5, padding: "2px 8px", cursor: running ? "default" : "pointer", fontSize: 10, color: running ? "rgba(255,255,255,0.3)" : C.green, fontFamily: "'DM Mono',monospace", marginRight: 6 }}>{running ? "⏳" : "▶ Run"}</button>}
        <button onClick={copyCode} style={{ background: copied ? `${C.green}18` : "transparent", border: `1px solid ${copied ? C.green + "44" : "rgba(255,255,255,0.1)"}`, borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontSize: 10, color: copied ? C.green : "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>{copied ? "✓" : "⧉"}</button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", overflowX: "auto", background: "transparent" }}>
        {highlighted
          ? <code className={`hljs language-${lang}`} dangerouslySetInnerHTML={{ __html: highlighted }} style={{ fontFamily: "'DM Mono',monospace", fontSize: 12.5, whiteSpace: "pre", background: "transparent" }} />
          : <code style={{ fontFamily: "'DM Mono',monospace", fontSize: 12.5, color: "#abb2bf", whiteSpace: "pre" }}>{code}</code>}
      </pre>
      {output && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 14px", background: output.t === "err" ? "rgba(255,80,80,0.07)" : output.t === "loading" ? "rgba(55,118,171,0.1)" : "rgba(0,255,100,0.05)" }}>
          <div style={{ fontSize: 9, color: output.t === "err" ? "#ff6b6b" : output.t === "loading" ? "#3776ab" : C.green, letterSpacing: 2, marginBottom: output.t === "loading" ? 0 : 4 }}>
            {output.t === "err" ? "ERROR" : output.t === "loading" ? "⏳  Loading Python runtime… (first run ~10s)" : "OUTPUT"}
          </div>
          {output.logs?.length > 0 && <pre style={{ margin: 0, fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" }}>{output.logs.join("\n")}</pre>}
          {output.result !== undefined && <pre style={{ margin: output.logs?.length ? "4px 0 0" : 0, fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.cyan, whiteSpace: "pre-wrap" }}>→ {output.result}</pre>}
          {output.error && <pre style={{ margin: 0, fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#ff6b6b", whiteSpace: "pre-wrap" }}>{output.error}</pre>}
        </div>
      )}
    </div>
  );
}
