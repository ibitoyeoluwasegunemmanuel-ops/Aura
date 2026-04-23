import { useState } from "react";
import { C } from "../theme/colors";
import { auth } from "../utils/auth";

const field = {
  background: "rgba(255,255,255,0.05)",
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 12,
  padding: "12px 14px",
  color: "#fff",
  fontSize: 13,
  fontFamily: "'DM Mono',monospace",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

export default function AuthScreen({ onLogin }) {
  const [mode, setMode]       = useState("login");
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const session = mode === "login"
        ? auth.login(form.email, form.password)
        : (() => { if (!form.name.trim()) throw new Error("Name is required"); return auth.register(form.name, form.email, form.password); })();
      auth.recordActivity(mode === "login" ? "Signed in" : "Created account");
      onLogin(session);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Mono',monospace" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 12px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1.5px solid ${C.cyan}55`, animation: "rotate 8s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: C.cyan }}>◈</div>
          </div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: C.cyan, letterSpacing: 3 }}>AURA OS</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 5 }}>Your Personal AI Operating System</div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 24px" }}>

          {/* Mode tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, marginBottom: 22 }}>
            {[["login", "Sign In"], ["register", "Create Account"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "9px 6px", borderRadius: 8, border: "none", background: mode === m ? C.cyan : "transparent", color: mode === m ? "#000" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 700, transition: "all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 6 }}>YOUR NAME</div>
                <input value={form.name} onChange={set("name")} placeholder="Ibitoye Oluwasegun Emmanuel" style={field}
                  onFocus={e => e.target.style.borderColor = C.cyan + "55"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 6 }}>EMAIL</div>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required style={field}
                onFocus={e => e.target.style.borderColor = C.cyan + "55"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 6 }}>PASSWORD</div>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required style={field}
                onFocus={e => e.target.style.borderColor = C.cyan + "55"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>

            {error && (
              <div style={{ fontSize: 11, color: C.red, background: `${C.red}10`, border: `1px solid ${C.red}33`, borderRadius: 9, padding: "9px 12px" }}>⚠ {error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ background: loading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg,${C.cyan},${C.purple})`, border: "none", borderRadius: 12, padding: "14px", cursor: loading ? "default" : "pointer", fontSize: 13, color: loading ? "rgba(255,255,255,0.4)" : "#000", fontFamily: "'DM Mono',monospace", fontWeight: 700, marginTop: 4, transition: "all 0.2s" }}>
              {loading ? "..." : mode === "login" ? "Sign In  →" : "Create Account  →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => onLogin({ id: "guest", name: "Guest", email: "", role: "guest" })}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
              Continue as Guest →
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 9, color: "rgba(255,255,255,0.12)" }}>
          Created by CEO Global · Ibitoye Oluwasegun Emmanuel
        </div>
      </div>
    </div>
  );
}
