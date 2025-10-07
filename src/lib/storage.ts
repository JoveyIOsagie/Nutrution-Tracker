export const storage = {
  get<T>(k: string, fallback: T): T {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
  },
  set<T>(k: string, v: T) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove(k: string) { try { localStorage.removeItem(k); } catch {} }
};
