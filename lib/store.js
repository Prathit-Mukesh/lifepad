// Tiny localStorage-backed progress store for the Learn portal.
// Prajnify (tab 2) and LifePad (tab 3) each manage their own storage keys.

const LEARN_KEY = 'neev_learn_v1';

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
export const resetLearn = () => write(LEARN_KEY, {});
