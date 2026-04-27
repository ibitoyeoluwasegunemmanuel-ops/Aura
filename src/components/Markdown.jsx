/* eslint-disable no-useless-escape */
import { C } from "../theme/colors";
import CodeBlock from "./CodeBlock";
import { HtmlInlineCard } from "./ArtifactPanel";

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

export default function Markdown({ text, onArtifact }) {
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
      } else if (lang === "jsx" || lang === "tsx" || lang === "react") {
        const reactHtml = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#0a0a0f;color:#fff;font-family:'Inter',sans-serif}</style>
</head><body>
<div id="root"></div>
<script type="text/babel">
${codeStr}
const __comp = typeof App !== 'undefined' ? App : (typeof default_export !== 'undefined' ? default_export : null);
if (__comp) ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__comp));
else document.getElementById('root').innerHTML='<p style="color:#ff6b6b">Export or define an App component.</p>';
<\/script>
</body></html>`;
        els.push(<HtmlInlineCard key={i} code={reactHtml} onExpand={onArtifact ? () => onArtifact({ type: "html", code: reactHtml, title: "React Component" }) : undefined} />);
      } else if (lang === "mermaid") {
        const mermaidHtml = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"><\/script><style>body{background:#0d0d0d;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box}.mermaid{max-width:100%}</style></head><body><div class="mermaid">${codeStr}</div><script>mermaid.initialize({startOnLoad:true,theme:'dark'})<\/script></body></html>`;
        els.push(
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.cyan}33`, margin: "8px 0" }}>
            <div style={{ padding: "6px 12px", fontSize: 10, color: C.cyan, background: `${C.cyan}08`, fontWeight: 700 }}>📊 Diagram</div>
            <iframe srcDoc={mermaidHtml} sandbox="allow-scripts allow-same-origin" style={{ width: "100%", height: 300, border: "none", background: "#0d0d0d", display: "block" }} title="diagram" />
          </div>
        );
      } else {
        els.push(<CodeBlock key={i} lang={lang} code={codeStr} />);
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
