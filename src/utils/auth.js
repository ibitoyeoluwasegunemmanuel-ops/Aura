import { sto } from "./storage";

export const auth = {
  register: (name, email, password) => {
    const users = sto.get("users", []);
    if (users.find(u => u.email === email.toLowerCase())) {
      throw new Error("Email already registered");
    }
    const user = {
      id: Date.now(),
      name,
      email: email.toLowerCase(),
      password: btoa(password),
      createdAt: new Date().toISOString(),
      role: "user",
    };
    users.push(user);
    sto.set("users", users);
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    sto.set("session", session);
    return session;
  },

  login: (email, password) => {
    const users = sto.get("users", []);
    const user = users.find(u => u.email === email.toLowerCase() && u.password === btoa(password));
    if (!user) throw new Error("Invalid email or password");
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    sto.set("session", session);
    return session;
  },

  logout: () => { sto.set("session", null); },

  getSession: () => sto.get("session", null),

  isLoggedIn: () => !!sto.get("session", null),

  getUsers: () => sto.get("users", []),

  getUserCount: () => sto.get("users", []).length,

  recordActivity: (action) => {
    const log = sto.get("activity_log", []);
    log.unshift({ action, ts: new Date().toISOString() });
    sto.set("activity_log", log.slice(0, 50));
  },

  getActivityLog: () => sto.get("activity_log", []),
};
