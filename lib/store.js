// Tiny localStorage-backed progress store shared by Learn and the Daily Gym.
// LifePad keeps its own separate storage key (lifepad_v3) — untouched.

const LEARN_KEY = 'neev_learn_v1';
const GYM_KEY = 'neev_gym_v1';

const read = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, val) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage full/blocked */ }
};

// learn progress shape: { [groupId]: { [chapterIndex]: {score, total, at} }, lastGroup }
export const loadLearn = () => read(LEARN_KEY, {});
export const saveLearn = (p) => write(LEARN_KEY, p);

// gym shape: { xp, streak, lastPlayed, best, history: [{date, score}], badges: [] }
export const loadGym = () => read(GYM_KEY, { xp: 0, streak: 0, lastPlayed: null, best: 0, history: [], badges: [] });
export const saveGym = (g) => write(GYM_KEY, g);

export const resetLearn = () => write(LEARN_KEY, {});
export const resetGym = () => write(GYM_KEY, { xp: 0, streak: 0, lastPlayed: null, best: 0, history: [], badges: [] });

export const levelFromXp = (xp) => Math.floor(Math.sqrt((xp || 0) / 50)) + 1;
export const xpForLevel = (lvl) => 50 * (lvl - 1) * (lvl - 1);
