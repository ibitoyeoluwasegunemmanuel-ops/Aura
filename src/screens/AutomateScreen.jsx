import { useState, useEffect } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Inp } from "../components/ui";
import { tasks } from "../utils/tasks";
import { callClaude } from "../utils/api";
import { speakFull } from "../utils/voice";

const WORKFLOWS = [
  { icon: "📱", title: "WhatsApp Reply", desc: "Auto-generate reply text", action: "whatsapp" },
  { icon: "📧", title: "Email Draft", desc: "AI writes your email", action: "email" },
  { icon: "📋", title: "Daily Report", desc: "Generate business summary", action: "report" },
  { icon: "🎯", title: "Action Plan", desc: "AI breaks down your goal", action: "plan" },
  { icon: "📣", title: "Social Post", desc: "Write Instagram/X caption", action: "social" },
  { icon: "💼", title: "Pitch Script", desc: "Investor/client pitch", action: "pitch" },
];

const PROMPTS = {
  whatsapp: t => `Write a professional yet friendly WhatsApp message for this context: "${t}". Max 80 words. Sound human.`,
  email: t => `Write a complete professional email for: "${t}". Include: Subject, Body, Sign-off. Be concise and impactful.`,
  report: t => `Generate a structured daily business report based on: "${t}". Use clear sections: Summary, Progress, Blockers, Next Steps.`,
  plan: t => `Break down this goal into a clear action plan: "${t}". Give 5-7 specific, actionable steps numbered.`,
  social: t => `Write an engaging Instagram/X caption for: "${t}". Include relevant hashtags. Make it viral-worthy.`,
  pitch: t => `Write a compelling 60-second investor/client pitch for: "${t}". Include: Problem, Solution, Value, Call to Action.`,
};

export default function AutomateScreen({ auraName }) {
  const [taskList, setTaskList]     = useState(() => tasks.getAll());
  const [newTask, setNewTask]       = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiOutput, setAiOutput]     = useState("");
  const [activeWf, setActiveWf]     = useState(null);
  const [wfInput, setWfInput]       = useState("");
  const [waNum, setWaNum]           = useState("");
  const [waMsg, setWaMsg]           = useState("");
  const [notifOk, setNotifOk]       = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => { setNotifOk(Notification?.permission === "granted"); }, []);

  const requestNotif = async () => {
    const p = await Notification.requestPermission?.();
    setNotifOk(p === "granted");
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const t = tasks.add({ title: newTask, reminderAt });
    tasks.scheduleReminder(t);
    setTaskList(tasks.getAll());
    setNewTask(""); setReminderAt("");
  };

  const toggle = (id) => setTaskList(tasks.toggle(id));
  const remove = (id) => setTaskList(tasks.remove(id));

  const runWorkflow = async () => {
    if (!wfInput.trim() || !activeWf) return;
    setAiLoading(true); setAiOutput("");
    try {
      const result = await callClaude([{ role: "user", content: PROMPTS[activeWf](wfInput) }], "", 512);
      setAiOutput(result);
      speakFull(result.slice(0, 180));
    } catch (e) { setAiOutput(`Error: ${e.message}`); }
    setAiLoading(false);
  };

  const copyOutput = () => {
    navigator.clipboard?.writeText(aiOutput).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const openWhatsApp = () => {
    const num = waNum.replace(/\D/g, "");
    if (!num) return;
    const url = `https://wa.me/${num}${waMsg.trim() ? `?text=${encodeURIComponent(waMsg)}` : ""}`;
    window.open(url, "_blank");
  };

  const pending = taskList.filter(t => !t.done);
  const done    = taskList.filter(t => t.done);

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.purple}>⚡ Automation Engine</Lbl>

      {/* Notification banner */}
      {!notifOk && (
        <div onClick={requestNotif} style={{ padding: "11px 14px", background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>Enable Notifications</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Let AURA send you reminders</div>
          </div>
          <span style={{ fontSize: 10, color: C.gold }}>Enable →</span>
        </div>
      )}

      {/* AI Workflows */}
      <Card color={C.purple}>
        <Lbl color={C.purple}>🤖 AI Workflows</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
          {WORKFLOWS.map(w => (
            <div key={w.action} onClick={() => { setActiveWf(activeWf === w.action ? null : w.action); setAiOutput(""); setWfInput(""); }}
              style={{ padding: "10px 11px", background: activeWf === w.action ? `${C.purple}20` : "rgba(255,255,255,0.03)", border: `1px solid ${activeWf === w.action ? C.purple + "55" : C.border}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ fontSize: 17, marginBottom: 4 }}>{w.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{w.title}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{w.desc}</div>
            </div>
          ))}
        </div>

        {activeWf && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea value={wfInput} onChange={e => setWfInput(e.target.value)}
              placeholder={`Describe what you need for "${WORKFLOWS.find(w => w.action === activeWf)?.title}"...`}
              rows={2} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.purple}44`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", lineHeight: 1.5, width: "100%", boxSizing: "border-box" }} />
            <Btn color={C.purple} onClick={runWorkflow} disabled={aiLoading} style={{ width: "100%" }}>
              {aiLoading ? "⏳ Generating..." : "⚡ Generate"}
            </Btn>
            {aiOutput && (
              <>
                <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                  {aiOutput}
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <Btn color={C.green} small onClick={copyOutput}>{copied ? "✓ Copied" : "⧉ Copy"}</Btn>
                  <Btn color={C.cyan} small outline onClick={() => speakFull(aiOutput)}>🔊 Speak</Btn>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* WhatsApp Quick Send */}
      <Card color={C.green}>
        <Lbl color={C.green}>📱 WhatsApp Quick Send</Lbl>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Open WhatsApp with any number — no need to save contact.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Inp value={waNum} onChange={e => setWaNum(e.target.value)} placeholder="+234 800 000 0000 (include country code)" />
          <textarea value={waMsg} onChange={e => setWaMsg(e.target.value)} placeholder="Optional pre-filled message..." rows={2}
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", lineHeight: 1.5 }} />
          <Btn color={C.green} onClick={openWhatsApp} style={{ width: "100%" }}>📱 Open in WhatsApp</Btn>
        </div>
      </Card>

      {/* Task Manager */}
      <Card color={C.cyan}>
        <Lbl color={C.cyan}>📋 Tasks & Reminders</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
          <Inp value={newTask} onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()}
            placeholder="Add task or reminder..." />
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input type="datetime-local" value={reminderAt} onChange={e => setReminderAt(e.target.value)}
              style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 11px", color: "rgba(255,255,255,0.55)", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none" }} />
            <Btn color={C.cyan} small onClick={addTask}>+ Add</Btn>
          </div>
        </div>

        {pending.length === 0 && done.length === 0 && (
          <div style={{ textAlign: "center", padding: "14px 0", fontSize: 11, color: "rgba(255,255,255,0.18)" }}>No tasks yet. Add one above.</div>
        )}

        {pending.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <div onClick={() => toggle(t.id)}
              style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${C.cyan}66`, flexShrink: 0, cursor: "pointer" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{t.title}</div>
              {t.reminderAt && <div style={{ fontSize: 9, color: C.gold, marginTop: 2 }}>⏰ {new Date(t.reminderAt).toLocaleString()}</div>}
            </div>
            <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>✕</button>
          </div>
        ))}

        {done.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2, marginBottom: 7 }}>COMPLETED ({done.length})</div>
            {done.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", opacity: 0.45 }}>
                <div onClick={() => toggle(t.id)}
                  style={{ width: 18, height: 18, borderRadius: 5, background: C.green, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000" }}>✓</div>
                <div style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "line-through" }}>{t.title}</div>
                <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 13, padding: "2px 6px" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
