// Deterministic seeded PRNG + helpers.
// Same seed → same questions, so chapter content is stable per user visit,
// while the Daily Gym seeds from the date to evolve every day.

export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seedStr) {
  const next = mulberry32(hashSeed(seedStr));
  const rng = {
    next,
    // integer in [a, b] inclusive
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    bool: (p = 0.5) => next() < p,
    shuffle: (arr) => {
      const c = arr.slice();
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    },
    // n distinct picks from arr
    sample: (arr, n) => {
      const c = rng.shuffle(arr);
      return c.slice(0, Math.min(n, c.length));
    },
  };
  return rng;
}

// Build 4 options around a numeric answer, shuffled, returns {options, correct}
export function numericOptions(rng, answer, format = (v) => String(v)) {
  const set = new Set([answer]);
  const magnitude = Math.max(1, Math.abs(Math.round(answer * 0.12)));
  let guard = 0;
  while (set.size < 4 && guard++ < 60) {
    const deltas = [
      magnitude,
      -magnitude,
      rng.int(1, Math.max(2, magnitude * 2)),
      -rng.int(1, Math.max(2, magnitude * 2)),
      Math.round(answer * 0.1) || 2,
      -(Math.round(answer * 0.1) || 1),
      10, -10, 1, -1, 2, -2, 5, -5,
    ];
    const cand = answer + rng.pick(deltas);
    if (cand !== answer && (answer < 0 || cand >= 0)) set.add(cand);
  }
  let filler = answer + 3;
  while (set.size < 4) { set.add(filler); filler += 4; }
  const opts = rng.shuffle([...set]);
  return { options: opts.map(format), correct: opts.indexOf(answer) };
}

// Options from explicit decoy list (strings)
export function listOptions(rng, answer, decoys) {
  const set = [answer];
  for (const d of decoys) {
    if (set.length >= 4) break;
    if (!set.includes(d)) set.push(d);
  }
  const opts = rng.shuffle(set);
  return { options: opts, correct: opts.indexOf(answer) };
}

export function todaySeed(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
