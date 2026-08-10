// Parameterized MCQ generators. Each generator: (rng, level) => {q, o, c, why}
// level runs 1 (Class 6) → 10 (advanced adult/college). All answers are computed,
// so every generated question is verifiably correct.

import { numericOptions, listOptions } from './rng';

const NAMES = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Ananya', 'Ishaan', 'Sara', 'Vivaan', 'Priya', 'Arjun', 'Zoya', 'Dev', 'Nisha', 'Rahul', 'Tara'];
const ITEMS = ['pens', 'notebooks', 'mangoes', 'chairs', 'books', 'bottles', 'kites', 'laddoos', 'stamps', 'marbles', 'plants', 'tickets'];
const CITIES = ['Delhi', 'Mumbai', 'Jaipur', 'Pune', 'Kochi', 'Bhopal', 'Surat', 'Patna', 'Nagpur', 'Indore'];

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const round2 = (v) => Math.round(v * 100) / 100;
const inr = (v) => '₹' + Number(v).toLocaleString('en-IN');

/* ---------------- QUANT ---------------- */

function gAddSub(rng, lv) {
  const scale = [10, 50, 100, 500, 1000, 5000, 9999, 20000, 50000, 99999][lv - 1] || 100;
  const a = rng.int(Math.floor(scale / 4), scale);
  const b = rng.int(Math.floor(scale / 5), Math.floor(scale / 2));
  const add = rng.bool();
  const ans = add ? a + b : a - b;
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `What is ${a} ${add ? '+' : '−'} ${b}?`,
    o: options, c: correct,
    why: `${a} ${add ? '+' : '−'} ${b} = ${ans}. Line up the place values and work column by column.`,
  };
}

function gMult(rng, lv) {
  const hi = [9, 12, 15, 25, 40, 60, 90, 120, 200, 300][lv - 1] || 12;
  const a = rng.int(3, hi);
  const b = rng.int(3, Math.max(9, Math.floor(hi / 3)));
  if (rng.bool(0.4)) {
    const prod = a * b;
    const { options, correct } = numericOptions(rng, a);
    return {
      q: `${prod} ÷ ${b} = ?`,
      o: options, c: correct,
      why: `${b} × ${a} = ${prod}, so ${prod} ÷ ${b} = ${a}. Division is reverse multiplication.`,
    };
  }
  const ans = a * b;
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `What is ${a} × ${b}?`,
    o: options, c: correct,
    why: b > 10
      ? `Break it up: ${a} × ${b} = ${a} × ${b - (b % 10)} + ${a} × ${b % 10} = ${a * (b - (b % 10))} + ${a * (b % 10)} = ${ans}.`
      : `${a} × ${b} = ${ans}. Tables up to 12 are worth knowing cold — they speed up everything else.`,
  };
}

function gBodmas(rng, lv) {
  const s = lv <= 3 ? 10 : lv <= 6 ? 20 : 40;
  const a = rng.int(2, s), b = rng.int(2, 9), c = rng.int(2, 9), d = rng.int(1, s);
  const form = rng.int(0, 2);
  let expr, ans;
  if (form === 0) { expr = `${a} + ${b} × ${c}`; ans = a + b * c; }
  else if (form === 1) { expr = `(${a} + ${d}) × ${b} − ${c}`; ans = (a + d) * b - c; }
  else { expr = `${a} × ${b} − ${c} × ${rng.int(2, 5)}`; const k = Number(expr.split('× ')[2]); ans = a * b - c * k; }
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `Solve: ${expr} = ?`,
    o: options, c: correct,
    why: `Order of operations (BODMAS): brackets first, then × and ÷, then + and −. The result is ${ans}.`,
  };
}

function gPercent(rng, lv) {
  const pcts = lv <= 3 ? [10, 20, 25, 50] : lv <= 6 ? [5, 10, 15, 20, 25, 30, 40, 60, 75] : [4, 8, 12, 15, 18, 24, 35, 45, 65, 85];
  const p = rng.pick(pcts);
  const base = rng.int(2, lv <= 3 ? 12 : 40) * 100 / (100 / gcd(p, 100) > 4 ? 1 : 1);
  const n = Math.round(base / gcd(p * base / 100, base) ) * 0 + base; // keep base
  const val = (p * n) / 100;
  if (Number.isInteger(val)) {
    const { options, correct } = numericOptions(rng, val);
    return {
      q: `What is ${p}% of ${n}?`,
      o: options, c: correct,
      why: `${p}% means ${p}/100. So ${p}% of ${n} = ${n} × ${p}/100 = ${val}.`,
    };
  }
  const { options, correct } = numericOptions(rng, Math.round(val));
  return {
    q: `Approximately, what is ${p}% of ${n}?`,
    o: options, c: correct,
    why: `${n} × ${p}/100 ≈ ${Math.round(val)}. Estimate with 10% blocks: 10% of ${n} is ${n / 10}.`,
  };
}

function gPercentChange(rng, lv) {
  const oldV = rng.int(4, 20) * (lv <= 4 ? 10 : 50);
  const pct = rng.pick(lv <= 4 ? [10, 20, 25, 50] : [10, 15, 20, 25, 30, 40, 60]);
  const up = rng.bool();
  const newV = up ? oldV + (oldV * pct) / 100 : oldV - (oldV * pct) / 100;
  const { options, correct } = numericOptions(rng, newV, (v) => inr(v));
  return {
    q: `A price of ${inr(oldV)} ${up ? 'increases' : 'decreases'} by ${pct}%. What is the new price?`,
    o: options, c: correct,
    why: `${pct}% of ${oldV} is ${(oldV * pct) / 100}. ${up ? 'Add' : 'Subtract'} it: new price = ${inr(newV)}.`,
  };
}

function gDiscount(rng, lv) {
  const price = rng.int(3, 30) * 100;
  const d = rng.pick(lv <= 4 ? [10, 20, 25, 50] : [15, 20, 30, 35, 40, 60]);
  const pay = price - (price * d) / 100;
  const { options, correct } = numericOptions(rng, pay, (v) => inr(v));
  return {
    q: `A shirt marked ${inr(price)} has a ${d}% discount. How much do you pay?`,
    o: options, c: correct,
    why: `Discount = ${d}% of ${price} = ${inr((price * d) / 100)}. Pay ${inr(price)} − ${inr((price * d) / 100)} = ${inr(pay)}.`,
  };
}

function gFraction(rng, lv) {
  const dens = lv <= 3 ? [2, 3, 4, 5, 10] : [3, 4, 5, 6, 8, 12, 15];
  const d = rng.pick(dens);
  const nmr = rng.int(1, d - 1);
  const whole = d * rng.int(lv <= 3 ? 2 : 4, lv <= 3 ? 8 : 20);
  const ans = (whole * nmr) / d;
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `What is ${nmr}/${d} of ${whole}?`,
    o: options, c: correct,
    why: `Divide by the bottom, multiply by the top: ${whole} ÷ ${d} = ${whole / d}, then × ${nmr} = ${ans}.`,
  };
}

function gRatio(rng, lv) {
  const a = rng.int(1, lv <= 4 ? 5 : 9);
  let b = rng.int(1, lv <= 4 ? 5 : 9);
  if (b === a) b = a + 1;
  const unit = rng.int(2, lv <= 4 ? 12 : 40);
  const total = (a + b) * unit;
  const name1 = rng.pick(NAMES); let name2 = rng.pick(NAMES);
  if (name2 === name1) name2 = 'Kiran';
  const ans = a * unit;
  const { options, correct } = numericOptions(rng, ans, (v) => inr(v));
  return {
    q: `${inr(total)} is divided between ${name1} and ${name2} in the ratio ${a}:${b}. How much does ${name1} get?`,
    o: options, c: correct,
    why: `Total parts = ${a}+${b} = ${a + b}. Each part = ${total}/${a + b} = ${inr(unit)}. ${name1} gets ${a} parts = ${inr(ans)}.`,
  };
}

function gAverage(rng, lv) {
  const n = lv <= 3 ? 3 : rng.pick([4, 5]);
  const base = rng.int(lv <= 3 ? 5 : 20, lv <= 3 ? 30 : 90);
  const nums = [];
  let sum = 0;
  for (let i = 0; i < n - 1; i++) { const v = base + rng.int(-5, 5) * 2; nums.push(v); sum += v; }
  const avg = base;
  const last = avg * n - sum;
  nums.push(last);
  const shuffled = rng.shuffle(nums);
  const { options, correct } = numericOptions(rng, avg);
  return {
    q: `Find the average of ${shuffled.join(', ')}.`,
    o: options, c: correct,
    why: `Sum = ${shuffled.reduce((x, y) => x + y, 0)}, count = ${n}. Average = sum ÷ count = ${avg}.`,
  };
}

function gProfitLoss(rng, lv) {
  const cost = rng.int(2, 20) * 100;
  const pct = rng.pick(lv <= 5 ? [10, 20, 25, 50] : [12, 15, 24, 30, 35, 45]);
  const profit = rng.bool(0.6);
  const sale = profit ? cost + (cost * pct) / 100 : cost - (cost * pct) / 100;
  const { options, correct } = numericOptions(rng, sale, (v) => inr(v));
  return {
    q: `A trader buys ${rng.pick(ITEMS)} for ${inr(cost)} and sells at a ${pct}% ${profit ? 'profit' : 'loss'}. Selling price?`,
    o: options, c: correct,
    why: `${pct}% of ${inr(cost)} = ${inr((cost * pct) / 100)}. ${profit ? 'Add to' : 'Subtract from'} cost → ${inr(sale)}.`,
  };
}

function gSimpleInterest(rng, lv) {
  const P = rng.int(2, 12) * 1000;
  const R = rng.pick(lv <= 6 ? [5, 10] : [4, 6, 8, 12]);
  const T = rng.int(2, lv <= 6 ? 4 : 6);
  const SI = (P * R * T) / 100;
  const { options, correct } = numericOptions(rng, SI, (v) => inr(v));
  return {
    q: `Simple interest on ${inr(P)} at ${R}% per year for ${T} years is…`,
    o: options, c: correct,
    why: `SI = P×R×T/100 = ${P}×${R}×${T}/100 = ${inr(SI)}.`,
  };
}

function gCompound(rng, lv) {
  const P = rng.pick([1000, 2000, 4000, 5000, 8000, 10000]);
  const R = rng.pick([10, 20]);
  const T = lv >= 8 ? 3 : 2;
  let amt = P;
  for (let i = 0; i < T; i++) amt += (amt * R) / 100;
  const { options, correct } = numericOptions(rng, amt, (v) => inr(v));
  return {
    q: `${inr(P)} grows at ${R}% compound interest per year. Amount after ${T} years?`,
    o: options, c: correct,
    why: `Growth on growth: ×${1 + R / 100} each year. ${P} → ${P * (1 + R / 100)} → ${T === 3 ? `${round2(P * (1 + R / 100) ** 2)} → ` : ''}${inr(amt)}.`,
  };
}

function gRule72(rng) {
  const R = rng.pick([4, 6, 8, 9, 12]);
  const ans = 72 / R;
  const { options, correct } = numericOptions(rng, ans, (v) => `${v} years`);
  return {
    q: `Using the Rule of 72, money growing at ${R}% a year doubles in about…`,
    o: options, c: correct,
    why: `Rule of 72: years to double ≈ 72 ÷ rate = 72 ÷ ${R} = ${ans} years. A quick compounding estimate everyone should know.`,
  };
}

function gEMI(rng, lv) {
  const loan = rng.pick([12000, 24000, 36000, 48000, 60000]);
  const months = rng.pick([12, 24]);
  const flatRate = rng.pick([10, 12, 15]);
  const interest = (loan * flatRate * (months / 12)) / 100;
  const emi = Math.round((loan + interest) / months);
  const { options, correct } = numericOptions(rng, emi, (v) => inr(v));
  return {
    q: `A ${inr(loan)} loan at ${flatRate}% flat interest, repaid over ${months} months. Approximate monthly EMI?`,
    o: options, c: correct,
    why: `Interest = ${inr(interest)}. Total = ${inr(loan + interest)} ÷ ${months} months ≈ ${inr(emi)}. Note: 'flat rate' costs more than it sounds — the effective rate is nearly double.`,
  };
}

function gSeriesNumber(rng, lv) {
  const kind = rng.int(0, lv <= 3 ? 2 : lv <= 6 ? 4 : 5);
  let seq = [], ans, ruleTxt;
  if (kind === 0) { // arithmetic
    const start = rng.int(1, 20), d = rng.int(2, lv <= 3 ? 6 : 15);
    seq = [0, 1, 2, 3, 4].map((i) => start + i * d);
    ans = start + 5 * d; ruleTxt = `add ${d} each time`;
  } else if (kind === 1) { // multiply
    const start = rng.int(1, 4), m = rng.pick([2, 3]);
    seq = [0, 1, 2, 3].map((i) => start * m ** i);
    ans = start * m ** 4; ruleTxt = `multiply by ${m} each time`;
  } else if (kind === 2) { // squares
    const s = rng.int(1, 5);
    seq = [0, 1, 2, 3].map((i) => (s + i) ** 2);
    ans = (s + 4) ** 2; ruleTxt = `perfect squares: ${s}², ${s + 1}², …`;
  } else if (kind === 3) { // alternating +a −b
    const start = rng.int(10, 40), a = rng.int(5, 12), b = rng.int(1, 4);
    seq = [start, start + a, start + a - b, start + 2 * a - b, start + 2 * a - 2 * b];
    ans = start + 3 * a - 2 * b; ruleTxt = `alternately add ${a}, subtract ${b}`;
  } else if (kind === 4) { // increasing gaps
    const start = rng.int(2, 12), g = rng.int(1, 4);
    seq = [start]; let gap = g;
    for (let i = 0; i < 4; i++) { seq.push(seq[seq.length - 1] + gap); gap += g; }
    ans = seq[4] + gap; ruleTxt = `the gap grows by ${g} each step`;
    seq = seq.slice(0, 5);
  } else { // fibonacci-like
    let a0 = rng.int(1, 5), a1 = rng.int(2, 7);
    seq = [a0, a1];
    for (let i = 0; i < 3; i++) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
    ans = seq[seq.length - 1] + seq[seq.length - 2]; ruleTxt = 'each term is the sum of the previous two';
  }
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `What comes next: ${seq.join(', ')}, … ?`,
    o: options, c: correct,
    why: `Pattern: ${ruleTxt}. Next term = ${ans}.`,
  };
}

function gLcmHcf(rng, lv) {
  const pairsEasy = [[4, 6], [6, 8], [3, 5], [4, 10], [6, 9], [8, 12]];
  const pairsHard = [[12, 18], [15, 20], [14, 21], [16, 24], [18, 27], [24, 36]];
  const [a, b] = rng.pick(lv <= 4 ? pairsEasy : pairsHard);
  const h = gcd(a, b);
  const l = (a * b) / h;
  const wantLcm = rng.bool();
  const ans = wantLcm ? l : h;
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `Find the ${wantLcm ? 'LCM' : 'HCF'} of ${a} and ${b}.`,
    o: options, c: correct,
    why: wantLcm
      ? `LCM is the smallest number both divide into: ${l}. (Check: HCF ${h} × LCM ${l} = ${a} × ${b}.)`
      : `HCF is the largest number dividing both: ${h}.`,
  };
}

function gAlgebra(rng, lv) {
  const x = rng.int(2, lv <= 4 ? 9 : 15);
  const a = rng.int(2, lv <= 4 ? 5 : 9);
  const b = rng.int(1, lv <= 4 ? 10 : 30);
  const add = rng.bool();
  const rhs = add ? a * x + b : a * x - b;
  const { options, correct } = numericOptions(rng, x);
  return {
    q: `If ${a}x ${add ? '+' : '−'} ${b} = ${rhs}, what is x?`,
    o: options, c: correct,
    why: `${add ? 'Subtract' : 'Add'} ${b} on both sides: ${a}x = ${a * x}. Divide by ${a}: x = ${x}.`,
  };
}

function gAges(rng, lv) {
  const child = rng.int(6, 15);
  const mult = rng.pick(lv <= 5 ? [3, 4] : [2, 3, 4, 5]);
  const parent = child * mult;
  const yrs = rng.int(3, 10);
  const { options, correct } = numericOptions(rng, parent + yrs, (v) => `${v} years`);
  return {
    q: `${rng.pick(NAMES)} is ${child}. Their parent is ${mult} times as old. How old will the parent be in ${yrs} years?`,
    o: options, c: correct,
    why: `Parent now = ${child} × ${mult} = ${parent}. In ${yrs} years: ${parent} + ${yrs} = ${parent + yrs}.`,
  };
}

function gSpeed(rng, lv) {
  const speed = rng.pick(lv <= 4 ? [30, 40, 50, 60] : [45, 54, 72, 80, 90]);
  const hours = lv <= 4 ? rng.int(2, 5) : rng.pick([1.5, 2, 2.5, 3, 4]);
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const dist = speed * hours;
    const { options, correct } = numericOptions(rng, dist, (v) => `${v} km`);
    return {
      q: `A train travels at ${speed} km/h for ${hours} hours. How far does it go?`,
      o: options, c: correct,
      why: `Distance = speed × time = ${speed} × ${hours} = ${dist} km.`,
    };
  }
  if (kind === 1) {
    const dist = speed * hours;
    const { options, correct } = numericOptions(rng, speed, (v) => `${v} km/h`);
    return {
      q: `A bus covers ${dist} km in ${hours} hours. What is its speed?`,
      o: options, c: correct,
      why: `Speed = distance ÷ time = ${dist} ÷ ${hours} = ${speed} km/h.`,
    };
  }
  const dist = speed * hours;
  const { options, correct } = numericOptions(rng, hours, (v) => `${v} hours`);
  return {
    q: `How long does a car at ${speed} km/h take to cover ${dist} km?`,
    o: options, c: correct,
    why: `Time = distance ÷ speed = ${dist} ÷ ${speed} = ${hours} hours.`,
  };
}

function gWork(rng, lv) {
  const pairs = lv <= 6
    ? [[6, 3], [12, 4], [10, 10], [8, 8], [12, 6], [20, 5], [6, 6], [4, 4], [15, 30], [10, 15], [14, 14], [9, 18], [16, 16], [12, 24], [20, 20], [5, 20]]
    : [[12, 4], [15, 10], [20, 5], [18, 9], [24, 8], [30, 6], [10, 40], [21, 28], [36, 12], [25, 100], [16, 48], [45, 30], [22, 33], [14, 35], [40, 60], [18, 36]];
  const [a, b] = rng.pick(pairs);
  const together = (a * b) / (a + b);
  const ans = Number.isInteger(together) ? together : round2(together);
  const { options, correct } = numericOptions(rng, ans, (v) => `${v} days`);
  return {
    q: `A finishes a job in ${a} days, B in ${b} days. Working together, they take…`,
    o: options, c: correct,
    why: `Per day they do 1/${a} + 1/${b} of the job = ${a + b}/${a * b}. Together: ${a * b}/${a + b} = ${ans} days.`,
  };
}

function gProbability(rng, lv) {
  const kind = rng.int(0, lv <= 5 ? 1 : 2);
  if (kind === 0) {
    const total = rng.pick([4, 5, 6, 8, 10]);
    const good = rng.int(1, total - 1);
    const g2 = gcd(good, total);
    const ans = `${good / g2}/${total / g2}`;
    const ansVal = good / total;
    const fracVal = (f) => { const [n, d] = f.split('/').map(Number); return n / d; };
    const bg = gcd(total - good, total);
    const candidates = [
      `${(total - good) / bg}/${total / bg}`, `1/${total}`, `${good}/${total + 2}`,
      '1/2', '1/3', '2/3', '3/4', '1/5', '2/5', '5/6',
    ];
    const decoys = [];
    for (const d of candidates) {
      if (decoys.length >= 3) break;
      if (d !== ans && !decoys.includes(d) && Math.abs(fracVal(d) - ansVal) > 1e-9) decoys.push(d);
    }
    const { options, correct } = listOptions(rng, ans, decoys);
    return {
      q: `A bag has ${good} red and ${total - good} blue marbles. Probability of drawing a red one?`,
      o: options, c: correct,
      why: `P = favourable ÷ total = ${good}/${total}${g2 > 1 ? ` = ${ans}` : ''}.`,
    };
  }
  if (kind === 1) {
    const face = rng.int(1, 6);
    const { options, correct } = listOptions(rng, '1/6', ['1/2', '1/3', '1/12']);
    return {
      q: `A fair die is rolled. What is the probability of getting exactly ${face}?`,
      o: options, c: correct,
      why: `Six equally likely faces, one favourable → 1/6. The die has no memory and no favourites.`,
    };
  }
  const { options, correct } = listOptions(rng, '1/4', ['1/2', '1/3', '3/4']);
  return {
    q: `Two fair coins are tossed. Probability both show heads?`,
    o: options, c: correct,
    why: `Outcomes: HH, HT, TH, TT — four equally likely, one favourable → 1/4. Multiply independent chances: ½ × ½.`,
  };
}

function gPermComb(rng, lv) {
  const kind = rng.int(0, 3);
  if (kind === 0) {
    const n = rng.pick(lv >= 8 ? [4, 5, 6] : [3, 4]);
    let f = 1; for (let i = 2; i <= n; i++) f *= i;
    const subject = rng.pick(['people stand in a line', 'books be arranged on a shelf', 'runners finish a race', 'different letters be arranged in a row']);
    const { options, correct } = numericOptions(rng, f);
    return {
      q: `In how many different orders can ${n} ${subject}?`,
      o: options, c: correct,
      why: `${n} choices for the first position, ${n - 1} for the next, and so on: ${n}! = ${f}.`,
    };
  }
  if (kind === 1) {
    const n = rng.pick([4, 5, 6, 7, 8]);
    const ans = (n * (n - 1)) / 2;
    const { options, correct } = numericOptions(rng, ans);
    return {
      q: `${n} friends all shake hands with each other once. Total handshakes?`,
      o: options, c: correct,
      why: `Each pair shakes once: n(n−1)/2 = ${n}×${n - 1}/2 = ${ans}.`,
    };
  }
  if (kind === 2) {
    const n = rng.pick([5, 6, 7, 8, 9]);
    const ans = n * (n - 1);
    const { options, correct } = numericOptions(rng, ans);
    return {
      q: `From ${n} players, in how many ways can you pick a captain and then a vice-captain?`,
      o: options, c: correct,
      why: `${n} choices for captain × ${n - 1} remaining for vice-captain = ${ans}. Order matters here.`,
    };
  }
  const n = rng.pick([3, 4, 5, 6]);
  const ans = 2 ** n;
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `A quiz has ${n} true/false questions. How many different answer patterns are possible?`,
    o: options, c: correct,
    why: `Each question has 2 choices, independently: 2^${n} = ${ans}.`,
  };
}

function gGeometry(rng, lv) {
  const kind = rng.int(0, lv <= 4 ? 1 : 3);
  if (kind === 0) {
    const l = rng.int(3, 20), w = rng.int(2, 15);
    const { options, correct } = numericOptions(rng, l * w, (v) => `${v} sq cm`);
    return {
      q: `A rectangle is ${l} cm long and ${w} cm wide. Its area is…`,
      o: options, c: correct,
      why: `Area = length × width = ${l} × ${w} = ${l * w} sq cm.`,
    };
  }
  if (kind === 1) {
    const l = rng.int(3, 20), w = rng.int(2, 15);
    const { options, correct } = numericOptions(rng, 2 * (l + w), (v) => `${v} cm`);
    return {
      q: `Perimeter of a rectangle ${l} cm by ${w} cm?`,
      o: options, c: correct,
      why: `Perimeter = 2 × (length + width) = 2 × ${l + w} = ${2 * (l + w)} cm.`,
    };
  }
  if (kind === 2) {
    const a = rng.pick([30, 45, 60, 70, 80]);
    const b = rng.pick([40, 50, 60, 65]);
    const ans = 180 - a - b;
    const { options, correct } = numericOptions(rng, ans, (v) => `${v}°`);
    return {
      q: `Two angles of a triangle are ${a}° and ${b}°. The third angle is…`,
      o: options, c: correct,
      why: `Angles of a triangle add to 180°. Third = 180 − ${a} − ${b} = ${ans}°.`,
    };
  }
  const trips = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]];
  const [x, y, z] = rng.pick(trips);
  const { options, correct } = numericOptions(rng, z, (v) => `${v} m`);
  return {
    q: `A ladder's foot is ${x} m from a wall and reaches ${y} m up the wall. How long is the ladder?`,
    o: options, c: correct,
    why: `Pythagoras: √(${x}² + ${y}²) = √${x * x + y * y} = ${z} m.`,
  };
}

function gUnitConv(rng, lv) {
  const convs = [
    { q: (n) => `${n} km = ? metres`, f: (n) => n * 1000, u: 'm', why: '1 km = 1,000 m', vals: [2, 3, 5, 7, 8] },
    { q: (n) => `${n} kg = ? grams`, f: (n) => n * 1000, u: 'g', why: '1 kg = 1,000 g', vals: [2, 4, 6, 9] },
    { q: (n) => `${n} hours = ? minutes`, f: (n) => n * 60, u: 'min', why: '1 hour = 60 minutes', vals: [2, 3, 4, 6, 8] },
    { q: (n) => `${n} litres = ? millilitres`, f: (n) => n * 1000, u: 'ml', why: '1 litre = 1,000 ml', vals: [2, 3, 5] },
    { q: (n) => `${n * 100} cm = ? metres`, f: (n) => n, u: 'm', why: '100 cm = 1 m', vals: [2, 4, 7, 9] },
    { q: (n) => `${n} minutes = ? seconds`, f: (n) => n * 60, u: 's', why: '1 minute = 60 seconds', vals: [3, 5, 7] },
  ];
  const cv = rng.pick(convs);
  const n = rng.pick(cv.vals);
  const ans = cv.f(n);
  const { options, correct } = numericOptions(rng, ans, (v) => `${Number(v).toLocaleString('en-IN')} ${cv.u}`);
  return { q: cv.q(n), o: options, c: correct, why: `${cv.why}, so the answer is ${ans.toLocaleString('en-IN')} ${cv.u}.` };
}

function gDataTable(rng, lv) {
  const cats = rng.sample(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 4);
  const thing = rng.pick(['books sold', 'tickets sold', 'visitors', 'cups of chai sold', 'parcels delivered']);
  const vals = cats.map(() => rng.int(2, 12) * (lv <= 4 ? 5 : 10));
  const table = cats.map((c, i) => `${c}: ${vals[i]}`).join(' · ');
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const maxV = Math.max(...vals);
    const ans = cats[vals.indexOf(maxV)];
    const { options, correct } = listOptions(rng, ans, cats.filter((c) => c !== ans));
    return {
      q: `A stall records ${thing} — ${table}. Which day was highest?`,
      o: options, c: correct,
      why: `Scan and compare: ${ans} had ${maxV}, more than any other day. Reading small tables fast is a daily-life superpower.`,
    };
  }
  if (kind === 1) {
    const sum = vals.reduce((a, b) => a + b, 0);
    const { options, correct } = numericOptions(rng, sum);
    return {
      q: `A stall records ${thing} — ${table}. What is the total?`,
      o: options, c: correct,
      why: `Add all values: ${vals.join(' + ')} = ${sum}.`,
    };
  }
  const diff = Math.max(...vals) - Math.min(...vals);
  const { options, correct } = numericOptions(rng, diff);
  return {
    q: `A stall records ${thing} — ${table}. Difference between the best and worst day?`,
    o: options, c: correct,
    why: `Best = ${Math.max(...vals)}, worst = ${Math.min(...vals)}. Difference = ${diff}.`,
  };
}

function gEstimation(rng, lv) {
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const a = rng.int(18, 96) * 10 + rng.int(1, 9);
    const b = rng.int(18, 96) * 10 + rng.int(1, 9);
    const ans = Math.round((a + b) / 100) * 100;
    const { options, correct } = numericOptions(rng, ans);
    return {
      q: `Estimate ${a} + ${b} to the nearest hundred.`,
      o: options, c: correct,
      why: `${a} ≈ ${Math.round(a / 100) * 100} and ${b} ≈ ${Math.round(b / 100) * 100}; a rounded sum of ${ans} is close enough to catch mistakes.`,
    };
  }
  if (kind === 1) {
    const perDay = rng.pick([2, 3, 4, 5]);
    const item = rng.pick(['cups of chai', 'litres of water', 'phone unlocks (×10)', 'pages read']);
    const ans = perDay * 365;
    const { options, correct } = numericOptions(rng, ans);
    return {
      q: `Roughly, ${perDay} ${item} a day is how many in a year?`,
      o: options, c: correct,
      why: `${perDay} × 365 = ${ans}. Per-day to per-year: multiply by 365 — small daily numbers become big yearly ones.`,
    };
  }
  const price = rng.pick([18, 23, 32, 48, 52, 97]);
  const qty = rng.pick([4, 5, 8, 10]);
  const exact = price * qty;
  const ans = Math.round(exact / 10) * 10;
  const { options, correct } = numericOptions(rng, ans);
  return {
    q: `About how much do ${qty} items at ₹${price} each cost?`,
    o: options, c: correct,
    why: `Round ₹${price} to ₹${Math.round(price / 10) * 10}: ≈ ₹${Math.round(price / 10) * 10 * qty}. Exact is ₹${exact} — estimation catches billing errors instantly.`,
  };
}

function gExpectedValue(rng) {
  const ticket = rng.pick([10, 20, 50, 100]);
  const prize = ticket * rng.pick([50, 100]);
  const odds = rng.pick([500, 1000]);
  const ev = round2(prize / odds);
  const { options, correct } = numericOptions(rng, ev, (v) => `₹${v}`);
  return {
    q: `A ₹${ticket} lottery ticket gives a 1-in-${odds} chance of winning ₹${prize.toLocaleString('en-IN')}. On average, each ticket returns about…`,
    o: options, c: correct,
    why: `Expected value = prize × probability = ${prize} × 1/${odds} = ₹${ev} — far less than the ₹${ticket} you paid. That gap is the seller's profit.`,
  };
}

function gPowerRoot(rng, lv) {
  if (rng.bool()) {
    const b = rng.int(2, lv <= 5 ? 12 : 20);
    const ans = b * b;
    const { options, correct } = numericOptions(rng, ans);
    return { q: `What is ${b}²?`, o: options, c: correct, why: `${b} × ${b} = ${ans}.` };
  }
  const r = rng.int(2, lv <= 5 ? 12 : 20);
  const { options, correct } = numericOptions(rng, r);
  return { q: `What is √${r * r}?`, o: options, c: correct, why: `${r} × ${r} = ${r * r}, so √${r * r} = ${r}.` };
}

/* ---------------- LOGIC ---------------- */

const ANALOGIES_EASY = [
  ['Puppy', 'Dog', 'Kitten', 'Cat', ['Lion', 'Mouse', 'Cub']],
  ['Pen', 'Write', 'Knife', 'Cut', ['Cook', 'Sharpen', 'Fold']],
  ['Bird', 'Nest', 'Bee', 'Hive', ['Flower', 'Honey', 'Wing']],
  ['Eye', 'See', 'Ear', 'Hear', ['Speak', 'Smell', 'Touch']],
  ['Fish', 'Water', 'Camel', 'Desert', ['Forest', 'Mountain', 'River']],
  ['Book', 'Library', 'Painting', 'Gallery', ['School', 'Frame', 'Artist']],
  ['Doctor', 'Hospital', 'Teacher', 'School', ['Chalk', 'Student', 'Office']],
  ['Hot', 'Cold', 'Day', 'Night', ['Sun', 'Evening', 'Morning']],
  ['Foot', 'Shoe', 'Hand', 'Glove', ['Ring', 'Arm', 'Finger']],
  ['Cow', 'Calf', 'Horse', 'Foal', ['Pony', 'Colt-hair', 'Mare-house']],
];
const ANALOGIES_HARD = [
  ['Scarcity', 'Abundance', 'Drought', 'Flood', ['Rain', 'Desert', 'Famine']],
  ['Author', 'Manuscript', 'Sculptor', 'Statue', ['Chisel', 'Museum', 'Stone']],
  ['Symptom', 'Disease', 'Clue', 'Crime', ['Detective', 'Police', 'Verdict']],
  ['Thermometer', 'Temperature', 'Barometer', 'Pressure', ['Rainfall', 'Wind', 'Humidity']],
  ['Optimist', 'Hopeful', 'Sceptic', 'Doubtful', ['Cheerful', 'Careless', 'Fearful']],
  ['Drop', 'Ocean', 'Grain', 'Beach', ['Sand', 'Field', 'Wheat']],
  ['Engine', 'Car', 'Heart', 'Body', ['Blood', 'Brain', 'Lungs']],
  ['Famine', 'Food', 'Drought', 'Water', ['Rain', 'Crop', 'River']],
  ['Verdict', 'Judge', 'Diagnosis', 'Doctor', ['Patient', 'Medicine', 'Hospital']],
  ['Caterpillar', 'Butterfly', 'Tadpole', 'Frog', ['Fish', 'Snake', 'Pond']],
];

function gAnalogy(rng, lv) {
  const bank = lv <= 5 ? ANALOGIES_EASY : rng.bool(0.3) ? ANALOGIES_EASY : ANALOGIES_HARD;
  const [a, b, c, ans, decoys] = rng.pick(bank);
  const { options, correct } = listOptions(rng, ans, decoys);
  return {
    q: `${a} is to ${b} as ${c} is to…`,
    o: options, c: correct,
    why: `The relationship between ${a} and ${b} carries over: ${c} → ${ans}. Analogies test whether you see the connection, not the words.`,
  };
}

const ODD_SETS_EASY = [
  [['Rose', 'Lotus', 'Marigold'], 'Mango', 'the others are flowers; mango is a fruit'],
  [['Chair', 'Table', 'Bed'], 'Carpet', 'the others are furniture with legs; a carpet is not'],
  [['Cow', 'Goat', 'Buffalo'], 'Lion', 'the others are herbivores/domestic; lion is a wild carnivore'],
  [['Copper', 'Iron', 'Silver'], 'Wood', 'the others are metals'],
  [['Cricket', 'Hockey', 'Football'], 'Chess', 'the others are outdoor physical sports; chess is a board game'],
  [['Ganga', 'Yamuna', 'Godavari'], 'Himalaya', 'the others are rivers; Himalaya is a mountain range'],
  [['Triangle', 'Square', 'Pentagon'], 'Circle', 'the others have straight sides and corners'],
  [['Doctor', 'Engineer', 'Lawyer'], 'Hospital', 'the others are professions; hospital is a place'],
];
const ODD_SETS_HARD = [
  [['Mercury', 'Venus', 'Mars'], 'Moon', 'the others are planets; the Moon is a satellite'],
  [['Kilogram', 'Metre', 'Second'], 'Speed', 'the others are base units; speed is a derived quantity'],
  [['Sitar', 'Veena', 'Guitar'], 'Tabla', 'the others are string instruments; tabla is percussion'],
  [['Novel', 'Biography', 'Essay'], 'Author', 'the others are forms of writing; author is a person'],
  [['Hear', 'Listen', 'Overhear'], 'Speak', 'the others involve receiving sound; speak produces it'],
  [['Democracy', 'Monarchy', 'Republic'], 'Geography', 'the others are systems of government'],
  [['Ebb', 'Recede', 'Shrink'], 'Expand', 'the others mean to reduce; expand is the opposite'],
  [['Anemia', 'Scurvy', 'Rickets'], 'Malaria', 'the others are deficiency diseases; malaria is an infection'],
];

function gOddOne(rng, lv) {
  const bank = lv <= 5 ? ODD_SETS_EASY : rng.bool(0.35) ? ODD_SETS_EASY : ODD_SETS_HARD;
  const [group, odd, reason] = rng.pick(bank);
  const opts = rng.shuffle([...group, odd]);
  return {
    q: `Which one does NOT belong: ${opts.join(', ')}?`,
    o: opts, c: opts.indexOf(odd),
    why: `${odd} — ${reason}.`,
  };
}

function gSyllogism(rng, lv) {
  const sets = [
    { A: 'roses', B: 'flowers', C: 'plants' },
    { A: 'sparrows', B: 'birds', C: 'animals' },
    { A: 'squares', B: 'rectangles', C: 'shapes' },
    { A: 'teachers', B: 'readers', C: 'learners' },
    { A: 'trains', B: 'vehicles', C: 'machines' },
    { A: 'poets', B: 'writers', C: 'artists' },
    { A: 'mangoes', B: 'fruits', C: 'foods' },
    { A: 'ants', B: 'insects', C: 'creatures' },
    { A: 'novels', B: 'books', C: 'publications' },
    { A: 'doctors', B: 'graduates', C: 'professionals' },
    { A: 'rivers', B: 'waterways', C: 'geographical features' },
    { A: 'tablas', B: 'drums', C: 'instruments' },
  ];
  const s = rng.pick(sets);
  const valid = rng.bool();
  if (valid) {
    const conc = `All ${s.A} are ${s.C}`;
    const { options, correct } = listOptions(rng, 'Definitely true', ['Definitely false', 'Cannot be determined', 'True only sometimes']);
    return {
      q: `All ${s.A} are ${s.B}. All ${s.B} are ${s.C}. Conclusion: "${conc}." This is…`,
      o: options, c: correct,
      why: `The chain holds: ${s.A} ⊂ ${s.B} ⊂ ${s.C}. Logic asks what MUST follow from the statements — not what is true in real life.`,
    };
  }
  const conc = `All ${s.C} are ${s.A}`;
  const { options, correct } = listOptions(rng, 'Cannot be determined', ['Definitely true', 'It is a fact', 'The statements are wrong']);
  return {
    q: `All ${s.A} are ${s.B}. All ${s.B} are ${s.C}. Conclusion: "${conc}." This is…`,
    o: options, c: correct,
    why: `The arrows only point one way. Every ${s.A[0]}${s.A.slice(1)} is a ${s.C.slice(0, -1)}, but there can be ${s.C} that are not ${s.A}. Reversing a syllogism is the classic trap.`,
  };
}

function gCoding(rng, lv) {
  const words = lv <= 4 ? ['CAT', 'DOG', 'PEN', 'SUN', 'BAT'] : ['MIND', 'STAR', 'GAME', 'PLAN', 'CODE', 'FOCUS'];
  const w = rng.pick(words);
  const shift = rng.int(1, lv <= 4 ? 2 : 4);
  const enc = (s, k) => s.split('').map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + k) % 26) + 65)).join('');
  const coded = enc(w, shift);
  const target = rng.pick(words.filter((x) => x !== w));
  const ans = enc(target, shift);
  const candidates = [enc(target, shift + 1), enc(target, shift + 2), target.split('').reverse().join(''), enc(target, shift + 3)];
  const decoys = candidates.filter((d, i) => d !== ans && candidates.indexOf(d) === i).slice(0, 3);
  const { options, correct } = listOptions(rng, ans, decoys);
  return {
    q: `In a code, ${w} is written as ${coded}. How is ${target} written in the same code?`,
    o: options, c: correct,
    why: `Each letter moves ${shift} step${shift > 1 ? 's' : ''} forward in the alphabet (${w[0]}→${coded[0]}). Applying the same rule: ${target} → ${ans}.`,
  };
}

function gDirection(rng, lv) {
  const d1 = rng.int(2, 10), d2 = rng.int(2, 10);
  const kind = rng.int(0, 1);
  if (kind === 0) {
    const dirs = [['north', 'east'], ['east', 'south'], ['south', 'west'], ['west', 'north']];
    const [a, b] = rng.pick(dirs);
    const trips = { '3,4': 5, '6,8': 10, '5,12': 13, '9,12': 15 };
    const pairKeys = Object.keys(trips);
    const key = rng.pick(pairKeys);
    const [x, y] = key.split(',').map(Number);
    const ans = trips[key];
    const { options, correct } = numericOptions(rng, ans, (v) => `${v} km`);
    return {
      q: `${rng.pick(NAMES)} walks ${x} km ${a}, then ${y} km ${b}. How far are they from the start (straight line)?`,
      o: options, c: correct,
      why: `The two legs are at right angles: √(${x}² + ${y}²) = ${ans} km. Drawing a quick sketch makes direction puzzles easy.`,
    };
  }
  const turns = rng.pick([
    { seq: 'faces north, turns right, then right again', ans: 'South' },
    { seq: 'faces east, turns left, then left again', ans: 'West' },
    { seq: 'faces south, turns left', ans: 'East' },
    { seq: 'faces west, turns right', ans: 'North' },
    { seq: 'faces north, turns left, then right, then right', ans: 'East' },
  ]);
  const { options, correct } = listOptions(rng, turns.ans, ['North', 'South', 'East', 'West'].filter((d) => d !== turns.ans));
  return {
    q: `A person ${turns.seq}. Which direction do they face now?`,
    o: options, c: correct,
    why: `Track each 90° turn on an imaginary compass. Final direction: ${turns.ans}.`,
  };
}

function gRelation(rng, lv) {
  const puzzles = [
    { q: `Pointing at a photo, a man says, "She is the daughter of my mother's only son." Who is she to him?`, a: 'His daughter', d: ['His sister', 'His niece', 'His cousin'], why: `"My mother's only son" is the man himself, so she is his daughter.` },
    { q: `A woman says, "His mother is my mother's only daughter." Who is she to him?`, a: 'His mother', d: ['His aunt', 'His sister', 'His grandmother'], why: `"My mother's only daughter" is the speaker herself — so she is his mother.` },
    { q: `${rng.pick(NAMES)}'s father's brother's son is his…`, a: 'Cousin', d: ['Nephew', 'Uncle', 'Brother'], why: `Father's brother = uncle; the uncle's son is a cousin.` },
    { q: `A boy says, "That man's father is my father's son, and I have no brothers." Who is the man to the boy?`, a: 'His son', d: ['His father', 'His nephew', 'His uncle'], why: `"My father's son" (no brothers) = the boy himself. The man's father is the boy → the man is his son.` },
    { q: `Your mother's sister's husband is your…`, a: 'Uncle', d: ['Cousin', 'Grandfather', 'Brother-in-law'], why: `Mother's sister = aunt; her husband is your uncle.` },
    { q: `Your father's only sibling's daughter is your…`, a: 'Cousin', d: ['Sister', 'Niece', 'Aunt'], why: `Father's sibling (uncle or aunt) has a daughter — that is your cousin.` },
    { q: `A woman introduces a man as "the son of the brother of my mother." The man is her…`, a: 'Cousin', d: ['Uncle', 'Brother', 'Son'], why: `Mother's brother = maternal uncle; his son is her cousin.` },
    { q: `Your brother's wife's mother is your brother's…`, a: 'Mother-in-law', d: ['Aunt', 'Grandmother', 'Sister-in-law'], why: `A spouse's mother is a mother-in-law. Work outward one link at a time.` },
    { q: `Your daughter's brother is your…`, a: 'Son', d: ['Nephew', 'Brother', 'Grandson'], why: `Your daughter's brother shares her parents — you. He is your son.` },
  ];
  const p = rng.pick(puzzles);
  const { options, correct } = listOptions(rng, p.a, p.d);
  return { q: p.q, o: options, c: correct, why: p.why };
}

function gCalendar(rng, lv) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const startIdx = rng.int(0, 6);
  const jump = lv <= 4 ? rng.pick([7, 10, 15, 20]) : rng.pick([25, 40, 45, 61, 100]);
  const ans = days[(startIdx + jump) % 7];
  const { options, correct } = listOptions(rng, ans, days.filter((d) => d !== ans).slice(0, 3));
  return {
    q: `Today is ${days[startIdx]}. What day will it be after ${jump} days?`,
    o: options, c: correct,
    why: `${jump} ÷ 7 leaves remainder ${jump % 7}. Move ${jump % 7} day${jump % 7 === 1 ? '' : 's'} ahead of ${days[startIdx]} → ${ans}. Only the remainder matters.`,
  };
}

function gClock(rng, lv) {
  if (lv <= 5 || rng.bool(0.4)) {
    const h = rng.int(1, 12);
    const addH = rng.int(2, 9);
    const ans = ((h + addH - 1) % 12) + 1;
    const { options, correct } = numericOptions(rng, ans, (v) => `${v} o'clock`);
    return {
      q: `A clock shows ${h} o'clock. What will it show ${addH} hours later?`,
      o: options, c: correct,
      why: `(${h} + ${addH}) on a 12-hour clock wraps around to ${ans} o'clock.`,
    };
  }
  const configs = [[3, 0, 90], [6, 0, 180], [9, 0, 90], [2, 0, 60], [4, 0, 120], [1, 0, 30]];
  const [h, m, angle] = rng.pick(configs);
  const { options, correct } = numericOptions(rng, angle, (v) => `${v}°`);
  return {
    q: `What is the angle between the hands of a clock at exactly ${h}:00?`,
    o: options, c: correct,
    why: `Each hour mark is 30° apart. At ${h}:00 the hands are ${angle / 30} marks apart → ${angle}° (taking the smaller angle).`,
  };
}

function gSeriesLetter(rng, lv) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const step = rng.int(1, lv <= 4 ? 2 : 4);
  const start = rng.int(0, 25 - step * 5);
  const seq = [0, 1, 2, 3].map((i) => A[start + i * step]);
  const pos = start + 4 * step;
  const ans = A[pos];
  const decoys = [];
  for (const p of [pos + 1, pos - 1, pos + 2, pos - 2, pos + 3, pos - 3]) {
    if (decoys.length >= 3) break;
    const ch = A[p];
    if (ch && ch !== ans && !decoys.includes(ch)) decoys.push(ch);
  }
  const { options, correct } = listOptions(rng, ans, decoys);
  return {
    q: `What comes next: ${seq.join(', ')}, … ?`,
    o: options, c: correct,
    why: `Letters jump ${step} place${step > 1 ? 's' : ''} each time (${seq[0]}→${seq[1]}). Next: ${ans}.`,
  };
}

function gOrdering(rng, lv) {
  const people = rng.sample(NAMES, 4);
  const [p1, p2, p3, p4] = people;
  // fixed truth: p1 > p2 > p3 > p4 (tallest to shortest)
  const kind = rng.bool();
  const target = kind ? p1 : p4;
  const { options, correct } = listOptions(rng, target, people.filter((p) => p !== target));
  return {
    q: `${p1} is taller than ${p2}. ${p2} is taller than ${p3}. ${p3} is taller than ${p4}. Who is the ${kind ? 'tallest' : 'shortest'}?`,
    o: options, c: correct,
    why: `Chain the comparisons: ${p1} > ${p2} > ${p3} > ${p4}. The ${kind ? 'tallest is ' + p1 : 'shortest is ' + p4}. Writing the chain out beats holding it in your head.`,
  };
}

function gStatement(rng, lv) {
  const puzzles = [
    { q: `"All my friends who exercise daily are cheerful. Ravi is cheerful." Can we conclude Ravi exercises daily?`, a: 'No — cheerful people may not all exercise', d: ['Yes, definitely', 'Yes, if Ravi is a friend', 'The statement is false'], why: `Exercise → cheerful does not mean cheerful → exercise. Reversing an if-then is the most common logic error in daily arguments.` },
    { q: `"If it rains, the match is cancelled. The match was cancelled." What do we know about rain?`, a: 'Nothing certain — other causes are possible', d: ['It definitely rained', 'It definitely did not rain', 'The match happened'], why: `Cancellation could have other causes (bad light, waterlogged ground). "If A then B" plus "B happened" tells you nothing sure about A.` },
    { q: `"No honest person tells lies. Meena tells lies." What follows?`, a: 'Meena is not honest', d: ['Meena is honest', 'Nothing follows', 'Everyone lies sometimes'], why: `This one IS valid: liars fall outside the honest group by definition. Compare it with the invalid reversals — that contrast is the skill.` },
    { q: `"Every topper in class studies daily. Amit studies daily." Is Amit a topper?`, a: 'Not necessarily', d: ['Yes, certainly', 'No, certainly not', 'Only if he is in class'], why: `Studying daily is necessary for toppers here, not sufficient. Many daily studiers may not top.` },
  ];
  const p = rng.pick(puzzles);
  const { options, correct } = listOptions(rng, p.a, p.d);
  return { q: p.q, o: options, c: correct, why: p.why };
}

/* ---------------- VERBAL ---------------- */

const SYN_EASY = [
  ['Happy', 'Glad', ['Angry', 'Slow', 'Tall']],
  ['Big', 'Huge', ['Tiny', 'Thin', 'Late']],
  ['Fast', 'Quick', ['Lazy', 'Heavy', 'Deep']],
  ['Brave', 'Courageous', ['Fearful', 'Weak', 'Quiet']],
  ['Begin', 'Start', ['Finish', 'Pause', 'Sleep']],
  ['Difficult', 'Hard', ['Easy', 'Soft', 'Light']],
  ['Silent', 'Quiet', ['Loud', 'Bright', 'Busy']],
  ['Correct', 'Accurate', ['Wrong', 'Rough', 'Loose']],
];
const SYN_HARD = [
  ['Candid', 'Frank', ['Secretive', 'Rude', 'Clever']],
  ['Abundant', 'Plentiful', ['Scarce', 'Costly', 'Rare']],
  ['Diligent', 'Hardworking', ['Careless', 'Talented', 'Proud']],
  ['Obsolete', 'Outdated', ['Modern', 'Broken', 'Useless']],
  ['Concise', 'Brief', ['Lengthy', 'Confusing', 'Loud']],
  ['Prudent', 'Cautious', ['Reckless', 'Wealthy', 'Stubborn']],
  ['Augment', 'Increase', ['Reduce', 'Repair', 'Divide']],
  ['Feasible', 'Possible', ['Impossible', 'Expensive', 'Popular']],
  ['Resilient', 'Quick to recover', ['Easily broken', 'Very stubborn', 'Extremely careful']],
  ['Ambiguous', 'Unclear', ['Obvious', 'Loud', 'Brilliant']],
];
const ANT_EASY = [
  ['Victory', 'Defeat', ['Win', 'Battle', 'Prize']],
  ['Expand', 'Shrink', ['Grow', 'Stretch', 'Open']],
  ['Ancient', 'Modern', ['Old', 'Historic', 'Broken']],
  ['Generous', 'Stingy', ['Kind', 'Rich', 'Gentle']],
  ['Arrive', 'Depart', ['Reach', 'Stay', 'Enter']],
  ['Increase', 'Decrease', ['Rise', 'Add', 'Double']],
];
const ANT_HARD = [
  ['Transparent', 'Opaque', ['Clear', 'Fragile', 'Shiny']],
  ['Optimistic', 'Pessimistic', ['Hopeful', 'Realistic', 'Emotional']],
  ['Scarcity', 'Abundance', ['Shortage', 'Poverty', 'Hunger']],
  ['Flexible', 'Rigid', ['Soft', 'Elastic', 'Loose']],
  ['Humble', 'Arrogant', ['Modest', 'Shy', 'Polite']],
  ['Temporary', 'Permanent', ['Brief', 'Sudden', 'Rare']],
];

function gSynonym(rng, lv) {
  const bank = lv <= 5 ? SYN_EASY : rng.bool(0.25) ? SYN_EASY : SYN_HARD;
  const [w, syn, decoys] = rng.pick(bank);
  const { options, correct } = listOptions(rng, syn, decoys);
  return {
    q: `Which word is closest in meaning to "${w}"?`,
    o: options, c: correct,
    why: `${w} ≈ ${syn}. A precise vocabulary is compression for thought — one right word replaces a sentence.`,
  };
}

function gAntonym(rng, lv) {
  const bank = lv <= 5 ? ANT_EASY : rng.bool(0.25) ? ANT_EASY : ANT_HARD;
  const [w, ant, decoys] = rng.pick(bank);
  const { options, correct } = listOptions(rng, ant, decoys);
  return {
    q: `Which word is the OPPOSITE of "${w}"?`,
    o: options, c: correct,
    why: `${w} ↔ ${ant}. Watch out for decoys that are near-synonyms — the question asks for the opposite.`,
  };
}

/* ---------------- registry ---------------- */

export const GENERATORS = {
  addsub: gAddSub,
  mult: gMult,
  bodmas: gBodmas,
  percent: gPercent,
  percent_change: gPercentChange,
  discount: gDiscount,
  fraction: gFraction,
  ratio: gRatio,
  average: gAverage,
  profitloss: gProfitLoss,
  si: gSimpleInterest,
  ci: gCompound,
  rule72: gRule72,
  emi: gEMI,
  series_number: gSeriesNumber,
  lcm_hcf: gLcmHcf,
  algebra: gAlgebra,
  ages: gAges,
  speed: gSpeed,
  work: gWork,
  probability: gProbability,
  perm_comb: gPermComb,
  geometry: gGeometry,
  unitconv: gUnitConv,
  di_table: gDataTable,
  estimation: gEstimation,
  expected_value: gExpectedValue,
  powerroot: gPowerRoot,
  analogy: gAnalogy,
  odd_one: gOddOne,
  syllogism: gSyllogism,
  coding: gCoding,
  direction: gDirection,
  relation: gRelation,
  calendar: gCalendar,
  clock: gClock,
  series_letter: gSeriesLetter,
  ordering: gOrdering,
  statement: gStatement,
  synonym: gSynonym,
  antonym: gAntonym,
};

export function generate(topicKey, rng, level) {
  const gen = GENERATORS[topicKey];
  if (!gen) return null;
  return gen(rng, level);
}
