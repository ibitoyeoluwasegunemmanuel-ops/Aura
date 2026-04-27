import { useState } from "react";
import { C } from "../theme/colors";
import { sto } from "../utils/storage";
import { speakFull } from "../utils/voice";

const FEATURES = [
  { icon: "💬", title: "Chat",      desc: "Ask anything — streaming AI with memory" },
  { icon: "🎨", title: "Design",    desc: "Describe it — get real HTML/CSS instantly" },
  { icon: "⌨️",  title: "Code",     desc: "Persistent file workspace with live preview" },
  { icon: "🤖", title: "Agents",   desc: "50+ specialist AI agents for every domain" },
  { icon: "⚡", title: "Automate", desc: "AI workflows, tasks, and reminders" },
  { icon: "🌐", title: "Translate", desc: "Real-time voice translation, 10+ languages" },
];

const STEPS = ["welcome", "profile", "features", "done"];

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep]       = useState(0);
  const [aiName, setAiName]   = useState("AURA");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const finish = () => {
    sto.set("aura_name", aiName);
    if (userName || userRole) {
      sto.set("user_profile", { name: userName, role: userRole, preferences: "", projects: "" });
    }
    sto.set("aura_onboarded", true);
    speakFull(`I'm ${aiName}. Let's go!`);
    onComplete({ aiName });
  };

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ height: "100dvh", background: "#02020a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", fontFamily: "'DM Mono',monospace", position: "relative", overflow: "hidden" }}>

      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.cyan}03 1px,transparent 1px),linear-gradient(90deg,${C.cyan}03 1px,transparent 1px)`, backgroundSize: "44px 44px" }} />

      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${C.cyan},${C.purple})`, transition: "width 0.4s ease" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 28, position: "relative", zIndex: 1 }}>

        {/* ── STEP 0: Welcome ── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
            <div style={{ position: "relative", width: 96, height: 96 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1.5px solid ${C.cyan}55`, animation: "rotate 8s linear infinite" }} />
              <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: `1px solid ${C.purple}33`, animation: "rotate 12s linear infinite reverse" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: C.cyan }}>◈</div>
            </div>

            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: 3 }}>AURA</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>Your personal AI operating system.<br />Built by CEO Global.</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Name your AI</div>
              <input
                value={aiName}
                onChange={e => setAiName(e.target.value)}
                placeholder="AURA, JARVIS, NOVA…"
                style={{ background: "rgba(255,255,255,0.05)", border: `1.5px solid ${C.cyan}44`, borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 16, fontFamily: "'DM Mono',monospace", outline: "none", textAlign: "center", letterSpacing: 2, width: "100%", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {["AURA","JARVIS","NOVA","IRIS","APEX","ARIA"].map(n => (
                  <div key={n} onClick={() => setAiName(n)}
                    style={{ padding: "4px 14px", borderRadius: 20, background: aiName === n ? `${C.cyan}18` : "rgba(255,255,255,0.03)", border: `1px solid ${aiName === n ? C.cyan + "55" : "rgba(255,255,255,0.09)"}`, fontSize: 11, color: aiName === n ? C.cyan : "rgba(255,255,255,0.35)", cursor: "pointer" }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Profile ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🧠</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Tell {aiName} who you are</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Injected into every conversation so {aiName} always knows you. Skip to fill in later.</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>YOUR NAME</div>
                <input value={userName} onChange={e => setUserName(e.target.value)}
                  placeholder="e.g. CEO Global"
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.gold}33`, borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>YOUR ROLE</div>
                <input value={userRole} onChange={e => setUserRole(e.target.value)}
                  placeholder="e.g. Founder & CEO of AURA"
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.gold}33`, borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Features ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{aiName} can do all this</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Everything built in — no plugins needed.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 11px" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
            <div style={{ fontSize: 56 }}>🚀</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>You're all set{userName ? `, ${userName.split(" ")[0]}` : ""}!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                {aiName} is ready. Say <span style={{ color: C.cyan }}>"Hey {aiName}"</span> to activate voice,<br />or just start typing.
              </div>
            </div>
            <div style={{ display: "flex", flex: "column", gap: 10, width: "100%" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                Settings → Memory to update your profile anytime
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button onClick={next}
          style={{ width: "100%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, border: "none", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, color: "#000", fontFamily: "'DM Mono',monospace", fontWeight: 900, letterSpacing: 1, transition: "opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          {step === 0 ? `Meet ${aiName || "AURA"} →` : step === 1 ? (userName ? "Save & Continue →" : "Skip →") : step === 2 ? "Let's go →" : `Launch ${aiName} ◈`}
        </button>

        {/* Step dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? C.cyan : "rgba(255,255,255,0.12)", transition: "all 0.3s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
