import { sto } from "./storage";

export const tasks = {
  getAll: () => sto.get("tasks", []),

  add: (task) => {
    const all = sto.get("tasks", []);
    const t = { id: Date.now(), ...task, createdAt: new Date().toISOString(), done: false };
    all.unshift(t);
    sto.set("tasks", all);
    return t;
  },

  toggle: (id) => {
    const all = sto.get("tasks", []).map(t => t.id === id ? { ...t, done: !t.done } : t);
    sto.set("tasks", all);
    return all;
  },

  remove: (id) => {
    const all = sto.get("tasks", []).filter(t => t.id !== id);
    sto.set("tasks", all);
    return all;
  },

  scheduleReminder: (task) => {
    if (!task.reminderAt || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const delay = new Date(task.reminderAt).getTime() - Date.now();
    if (delay > 0 && delay < 86400000 * 7) {
      setTimeout(() => {
        new Notification("⏰ AURA Reminder", {
          body: task.title,
          icon: "/logo192.png",
        });
      }, delay);
    }
  },
};
