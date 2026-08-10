// The full curriculum: 10 audience groups, each with 15–18 chapters.
// Chapters mix procedurally generated aptitude questions (topics) and
// hand-written judgment banks (pool). Everything is deterministic per chapter,
// so a learner's chapter stays stable while the Daily Gym evolves daily.

import { makeRng } from './rng';
import { generate } from './generators';
import { curatedSample } from './curated';

export const QUESTIONS_PER_CHAPTER = 16;

// Short "what this trains" notes shown at the top of each chapter.
export const TOPIC_INFO = {
  addsub: 'Fast, confident addition and subtraction — the base layer of all number work.',
  mult: 'Multiplication and division fluency, so bigger maths stops feeling heavy.',
  bodmas: 'Order of operations — reading an expression the way calculators and exams do.',
  percent: 'Percentages: the single most-used piece of maths in adult life.',
  percent_change: 'Increases and decreases — price hikes, salary raises, discounts.',
  discount: 'Discount arithmetic — what you actually pay, computed before the shop does.',
  fraction: 'Fractions of quantities — sharing, portions, and parts of a whole.',
  ratio: 'Ratios and fair division — recipes, maps, mixtures, money splits.',
  average: 'Averages — and the number sense to know when they mislead.',
  profitloss: 'Profit and loss — the arithmetic every trader and shopper runs daily.',
  si: 'Simple interest — what borrowing and lending really cost.',
  ci: 'Compound interest — growth on growth, the eighth wonder.',
  rule72: 'The Rule of 72 — instant mental estimates of doubling time.',
  emi: 'EMIs and loans — seeing the true cost behind "easy" instalments.',
  series_number: 'Number patterns — spotting the hidden rule, a core aptitude-test skill.',
  lcm_hcf: 'LCM and HCF — the rhythm and structure inside numbers.',
  algebra: 'Solving for x — turning word problems into one-line equations.',
  ages: 'Age puzzles — classic aptitude reasoning with ratios and time.',
  speed: 'Speed, distance and time — trains, buses, and interview favourites.',
  work: 'Time and work — combining rates, a staple of every aptitude exam.',
  probability: 'Probability — honest thinking about chance, luck and risk.',
  perm_comb: 'Counting arrangements — permutations, combinations, handshakes.',
  geometry: 'Shapes, angles, areas — visual maths for the real world.',
  unitconv: 'Units and conversions — km, kg, litres, hours without hesitation.',
  di_table: 'Data interpretation — reading small tables fast and drawing conclusions.',
  estimation: 'Fermi estimation — roughly right beats precisely clueless.',
  expected_value: 'Expected value — the maths that sees through lotteries and "sure things".',
  powerroot: 'Squares and roots — number fluency that speeds up everything else.',
  analogy: 'Analogies — seeing relationships between ideas, not just words.',
  odd_one: 'Classification — spotting what does not belong, and why.',
  syllogism: 'Syllogisms — what MUST follow from statements, feelings aside.',
  coding: 'Coding–decoding — pattern rules on letters, a reasoning-test classic.',
  direction: 'Direction sense — mental maps, turns, and straight-line distances.',
  relation: 'Blood relations — untangling family-tree logic puzzles.',
  calendar: 'Calendar reasoning — day-of-week arithmetic with remainders.',
  clock: 'Clock puzzles — hours, angles, and cyclic thinking.',
  series_letter: 'Letter series — alphabet patterns at speed.',
  ordering: 'Ordering and ranking — chaining comparisons without losing track.',
  statement: 'Statement logic — the if–then traps that fool most adults.',
  synonym: 'Vocabulary: precision — the right word is compression for thought.',
  antonym: 'Vocabulary: contrast — opposites, and the near-synonym traps.',
  digital_safety: 'Practical digital self-defence: OTPs, passwords, phishing, privacy.',
  ai_awareness: 'Working WITH AI without being replaced by it — judgment over button-pushing.',
  scam_awareness: 'The timeless anatomy of scams — spot the pattern, whatever the packaging.',
  learning_science: 'How memory and skill actually grow — study smarter, not just harder.',
  communication: 'Saying it well: listening, structuring, writing, and being understood.',
  critical_thinking: 'Evidence, biases and fallacies — judge ideas on proof, not volume.',
  media_literacy: 'Information hygiene — verifying before believing in the deepfake era.',
  money_mindset: 'Money judgment — budgets, compounding, debt, and calm decisions.',
  workplace_judgment: 'Professional judgment — feedback, priorities, estimates, career resilience.',
};

const ch = (title, blurb, opts) => ({ title, blurb, ...opts });

export const GROUPS = [
  {
    id: 'class6', name: 'Class 6', short: '6', kind: 'school',
    color: '#12777B',
    tagline: 'Build the base: numbers, patterns, and first logic.',
    chapters: [
      ch('Number Power', 'Big additions and subtractions without fear.', { topics: ['addsub'], level: 1 }),
      ch('Multiply & Divide Mastery', 'Tables put to work, both directions.', { topics: ['mult'], level: 2 }),
      ch('BODMAS: Order of Operations', 'Why 2 + 3 × 4 is 14, not 20.', { topics: ['bodmas'], level: 1 }),
      ch('Fractions in Real Life', 'Halves, thirds and quarters of real things.', { topics: ['fraction'], level: 1 }),
      ch('Percentages: First Steps', 'The 10% trick and friends.', { topics: ['percent'], level: 1 }),
      ch('Money Maths at the Shop', 'Discounts and change, computed before the shopkeeper.', { topics: ['discount', 'addsub'], level: 1 }),
      ch('Patterns & Number Series', 'Find the hidden rule, predict what comes next.', { topics: ['series_number', 'series_letter'], level: 2 }),
      ch('Shapes & Measurement', 'Areas, perimeters and angles you can see.', { topics: ['geometry', 'unitconv'], level: 2 }),
      ch('Everyday Estimation', 'Roughly-right answers, fast.', { topics: ['estimation'], level: 1 }),
      ch('Reading Tables', 'Small tables, quick conclusions.', { topics: ['di_table'], level: 2 }),
      ch('Analogies: Think in Pairs', 'Puppy is to dog as kitten is to…', { topics: ['analogy'], level: 2 }),
      ch('Odd One Out', 'Spot what does not belong — and say why.', { topics: ['odd_one'], level: 2 }),
      ch('Directions, Order & Maps', 'Turns, rankings and mental maps.', { topics: ['direction', 'ordering'], level: 2 }),
      ch('Calendar & Clock Puzzles', 'What day is 40 days from Tuesday?', { topics: ['calendar', 'clock'], level: 2 }),
      ch('Word Power: Synonyms & Opposites', 'The right word, and its opposite.', { topics: ['synonym', 'antonym'], level: 2 }),
      ch('Smart & Safe Online', 'First lessons in digital self-defence.', { pool: 'digital_safety', level: 1 }),
    ],
  },
  {
    id: 'class7', name: 'Class 7', short: '7', kind: 'school',
    color: '#2C4FA3',
    tagline: 'Ratios, averages and sharper reasoning.',
    chapters: [
      ch('Mental Maths Sprint', 'Speed and accuracy across operations.', { topics: ['addsub', 'mult'], level: 3 }),
      ch('BODMAS Level Up', 'Brackets, order, and multi-step expressions.', { topics: ['bodmas'], level: 3 }),
      ch('Fractions & Their Uses', 'Fraction fluency on bigger numbers.', { topics: ['fraction'], level: 3 }),
      ch('Ratio & Fair Sharing', 'Divide anything in any ratio.', { topics: ['ratio'], level: 2 }),
      ch('Averages Around You', 'Marks, runs, temperatures — the honest middle.', { topics: ['average'], level: 3 }),
      ch('Percentages Everywhere', 'From marks to discounts to battery levels.', { topics: ['percent', 'percent_change'], level: 3 }),
      ch('LCM & HCF', 'The rhythm inside numbers.', { topics: ['lcm_hcf'], level: 3 }),
      ch('Squares & Roots', 'Number fluency that pays forever.', { topics: ['powerroot'], level: 3 }),
      ch('Series & Sequences', 'Harder hidden rules.', { topics: ['series_number', 'series_letter'], level: 3 }),
      ch('Geometry in Action', 'Triangles, rectangles, and real measurements.', { topics: ['geometry'], level: 3 }),
      ch('Data Detective', 'Tables: totals, gaps, and best-of comparisons.', { topics: ['di_table'], level: 3 }),
      ch('Codes & Ciphers', 'Letter-shift codes — crack the rule.', { topics: ['coding', 'series_letter'], level: 3 }),
      ch('Family Logic Puzzles', 'Blood relations, untangled.', { topics: ['relation', 'ordering'], level: 3 }),
      ch('Direction Sense', 'Compass turns and shortest distances.', { topics: ['direction', 'calendar'], level: 3 }),
      ch('Word Power II', 'A richer vocabulary, both directions.', { topics: ['synonym', 'antonym', 'analogy'], level: 3 }),
      ch('Think Before You Share', 'Information hygiene for the forward age.', { pool: 'media_literacy', level: 2 }),
    ],
  },
  {
    id: 'class8', name: 'Class 8', short: '8', kind: 'school',
    color: '#4E7A27',
    tagline: 'Algebra begins; reasoning gets serious.',
    chapters: [
      ch('Algebra: Solve for x', 'Turn word problems into one-line equations.', { topics: ['algebra'], level: 3 }),
      ch('Percentages: Pro Level', 'Changes, comparisons, and reverse percentages.', { topics: ['percent', 'percent_change'], level: 4 }),
      ch('Profit & Loss', 'The arithmetic of every shop in the country.', { topics: ['profitloss', 'discount'], level: 4 }),
      ch('Ratios & Mixtures', 'Sharing, scaling, and recipe maths.', { topics: ['ratio', 'fraction'], level: 4 }),
      ch('Averages & Data', 'Averages plus the tables they come from.', { topics: ['average', 'di_table'], level: 4 }),
      ch('Powers & Roots', 'Squares and roots at speed.', { topics: ['powerroot', 'lcm_hcf'], level: 4 }),
      ch('Number Series Challenge', 'Alternating and accelerating patterns.', { topics: ['series_number'], level: 4 }),
      ch('Geometry & Pythagoras', 'Angles, areas, and the ladder against the wall.', { topics: ['geometry'], level: 5 }),
      ch('Age & Order Puzzles', 'Classic reasoning with time and ranking.', { topics: ['ages', 'ordering'], level: 4 }),
      ch('Logic: What MUST Follow', 'If–then thinking without the traps.', { topics: ['statement', 'syllogism'], level: 4 }),
      ch('Codes & Patterns', 'Coding-decoding at exam pace.', { topics: ['coding', 'series_letter'], level: 4 }),
      ch('Calendar, Clock & Direction', 'The three classic reasoning families.', { topics: ['calendar', 'clock', 'direction'], level: 4 }),
      ch('Estimation & Sanity Checks', 'Catch wrong answers before they cost marks.', { topics: ['estimation'], level: 4 }),
      ch('Word Analogies Pro', 'Deeper relationships between ideas.', { topics: ['analogy', 'odd_one'], level: 5 }),
      ch('Vocabulary Builder', 'Precision words for sharper writing.', { topics: ['synonym', 'antonym'], level: 5 }),
      ch('Verify Before You Believe', 'Fact-checking, sources, and viral traps.', { pool: 'media_literacy', level: 3 }),
    ],
  },
  {
    id: 'class9', name: 'Class 9', short: '9', kind: 'school',
    color: '#B4530A',
    tagline: 'Interest, probability and evidence-grade thinking.',
    chapters: [
      ch('Simple Interest', 'What borrowing really costs.', { topics: ['si'], level: 4 }),
      ch('Speed, Distance, Time', 'Trains, buses and the three-way formula.', { topics: ['speed'], level: 4 }),
      ch('Probability: First Principles', 'Coins, dice and honest chances.', { topics: ['probability'], level: 4 }),
      ch('Percentages & Growth', 'Multi-step percentage reasoning.', { topics: ['percent_change', 'percent'], level: 5 }),
      ch('Profit, Loss & Discount', 'Trader maths, complete.', { topics: ['profitloss', 'discount'], level: 5 }),
      ch('Algebra Workout', 'Faster equations, bigger numbers.', { topics: ['algebra', 'ages'], level: 5 }),
      ch('Time & Work', 'Combining rates — an aptitude staple.', { topics: ['work'], level: 5 }),
      ch('Geometry Challenge', 'Angles, triangles and applied Pythagoras.', { topics: ['geometry'], level: 5 }),
      ch('Series: Advanced Patterns', 'Fibonacci-style and growing-gap series.', { topics: ['series_number', 'series_letter'], level: 5 }),
      ch('Data Interpretation', 'Read, total, compare, conclude.', { topics: ['di_table', 'average'], level: 5 }),
      ch('Syllogisms & Logic', 'What must follow — and what only seems to.', { topics: ['syllogism', 'statement'], level: 5 }),
      ch('Reasoning Mixed Bag', 'Codes, directions, relations at pace.', { topics: ['coding', 'direction', 'relation'], level: 5 }),
      ch('Estimation Power', 'Fermi thinking on real quantities.', { topics: ['estimation', 'expected_value'], level: 5 }),
      ch('Vocabulary for Class 9', 'Harder words, finer shades.', { topics: ['synonym', 'antonym', 'analogy'], level: 6 }),
      ch('Think Clearly: Biases & Fallacies', 'Confirmation bias, anchors, bad arguments.', { pool: 'critical_thinking', level: 4 }),
      ch('Digital Self-Defence', 'Passwords, phishing and privacy — properly.', { pool: 'digital_safety', level: 4 }),
    ],
  },
  {
    id: 'class10', name: 'Class 10', short: '10', kind: 'school',
    color: '#7A3E8F',
    tagline: 'Board-year fluency plus money sense for life.',
    chapters: [
      ch('Compound Interest', 'Growth on growth — the eighth wonder.', { topics: ['ci', 'si'], level: 5 }),
      ch('Speed & Efficiency', 'Speed-distance-time plus time-and-work.', { topics: ['speed', 'work'], level: 6 }),
      ch('Probability in Depth', 'Multiple events and expected outcomes.', { topics: ['probability', 'expected_value'], level: 6 }),
      ch('Percentage Mastery', 'Everything percentages, at exam pace.', { topics: ['percent', 'percent_change', 'discount'], level: 6 }),
      ch('Algebra at Speed', 'Solve for x without touching paper.', { topics: ['algebra'], level: 6 }),
      ch('Commercial Maths', 'Profit, loss, discount, ratio — combined.', { topics: ['profitloss', 'ratio'], level: 6 }),
      ch('Advanced Series', 'The patterns aptitude tests love.', { topics: ['series_number'], level: 6 }),
      ch('Geometry & Mensuration', 'Areas and angles under time pressure.', { topics: ['geometry', 'unitconv'], level: 6 }),
      ch('Data Interpretation II', 'Bigger tables, sharper reads.', { topics: ['di_table', 'average'], level: 6 }),
      ch('Full Reasoning Circuit', 'Syllogisms, codes, directions, relations.', { topics: ['syllogism', 'coding', 'direction', 'relation'], level: 6 }),
      ch('Calendar & Clock Mastery', 'Remainder tricks and hand angles.', { topics: ['calendar', 'clock'], level: 6 }),
      ch('Estimation & Number Sense', 'Sanity-check the world.', { topics: ['estimation', 'powerroot'], level: 6 }),
      ch('Vocabulary: Board Level', 'The words good answers are made of.', { topics: ['synonym', 'antonym'], level: 7 }),
      ch('Money Sense: Foundations', 'Needs, wants, budgets and compounding.', { pool: 'money_mindset', level: 5 }),
      ch('Study Science: Learn to Learn', 'Recall, spacing, sleep — evidence-based studying for boards.', { pool: 'learning_science', level: 5 }),
      ch('Spot the Scam', 'The universal red flags, one year before adulthood.', { pool: 'scam_awareness', level: 5 }),
    ],
  },
  {
    id: 'class11', name: 'Class 11', short: '11', kind: 'school',
    color: '#1E5F8E',
    tagline: 'Counting, chance and the skills exams can’t test.',
    chapters: [
      ch('Permutations & Combinations', 'Counting arrangements without listing them.', { topics: ['perm_comb'], level: 7 }),
      ch('Probability: Serious Chance', 'Independent events and compound odds.', { topics: ['probability', 'expected_value'], level: 7 }),
      ch('Compound Growth', 'CI over multiple years, in your head.', { topics: ['ci', 'rule72'], level: 7 }),
      ch('Quant Sprint I', 'Percentages, ratios, averages — timed thinking.', { topics: ['percent', 'ratio', 'average'], level: 7 }),
      ch('Quant Sprint II', 'Speed, work and algebra together.', { topics: ['speed', 'work', 'algebra'], level: 7 }),
      ch('Series & Sequences Pro', 'The hard end of pattern-spotting.', { topics: ['series_number', 'series_letter'], level: 7 }),
      ch('Data Interpretation III', 'Tables under time pressure.', { topics: ['di_table'], level: 7 }),
      ch('Logic: Formal Reasoning', 'Syllogisms and statements, competition-grade.', { topics: ['syllogism', 'statement'], level: 7 }),
      ch('Reasoning Mixed Circuit', 'Codes, relations, ordering — rapid fire.', { topics: ['coding', 'relation', 'ordering'], level: 7 }),
      ch('Fermi & Estimation', 'How many autos in Mumbai? Reason it out.', { topics: ['estimation'], level: 7 }),
      ch('Vocabulary: Competitive Edge', 'The words entrance exams reward.', { topics: ['synonym', 'antonym', 'analogy'], level: 8 }),
      ch('Learning Science for Toppers', 'Spaced recall, interleaving, mistake logs.', { pool: 'learning_science', level: 6 }),
      ch('AI Era: Work With the Machines', 'Use AI to grow, not to shrink.', { pool: 'ai_awareness', level: 6 }),
      ch('Critical Thinking II', 'Fallacies, survivorship bias, sunk costs.', { pool: 'critical_thinking', level: 6 }),
      ch('Money Before College', 'Compounding, EMIs, and the traps ahead.', { pool: 'money_mindset', level: 6 }),
      ch('Communicate to Convince', 'PREP, listening, and the exam-hall essay.', { pool: 'communication', level: 6 }),
    ],
  },
  {
    id: 'class12', name: 'Class 12', short: '12', kind: 'school',
    color: '#8C5A12',
    tagline: 'Exit velocity: aptitude, money and judgment for what’s next.',
    chapters: [
      ch('Aptitude Gauntlet I: Quant', 'The full quant sweep, entrance-exam grade.', { topics: ['percent', 'profitloss', 'ratio', 'average'], level: 8 }),
      ch('Aptitude Gauntlet II: Rates', 'Speed, work, interest — the formula triangle family.', { topics: ['speed', 'work', 'si', 'ci'], level: 8 }),
      ch('Counting & Chance', 'P&C plus probability, together at last.', { topics: ['perm_comb', 'probability'], level: 8 }),
      ch('Algebra & Number Theory', 'Equations, LCM/HCF, powers at speed.', { topics: ['algebra', 'lcm_hcf', 'powerroot'], level: 8 }),
      ch('Series: Final Form', 'Every pattern family, mixed.', { topics: ['series_number', 'series_letter'], level: 8 }),
      ch('Data Interpretation: Exam Mode', 'Read fast, compute faster.', { topics: ['di_table', 'average'], level: 8 }),
      ch('Reasoning: Full Battery', 'Syllogism, coding, direction, relation, ordering.', { topics: ['syllogism', 'coding', 'direction', 'relation', 'ordering'], level: 8 }),
      ch('Logic Under Pressure', 'Statement logic where most adults slip.', { topics: ['statement', 'clock', 'calendar'], level: 8 }),
      ch('Estimation & EV', 'Fermi problems and expected value.', { topics: ['estimation', 'expected_value'], level: 8 }),
      ch('Vocabulary: Entrance Grade', 'CAT/CLAT-flavoured word power.', { topics: ['synonym', 'antonym', 'analogy'], level: 8 }),
      ch('Money: Adult Onboarding', 'EMIs, Rule of 72, first-salary judgment.', { topics: ['emi', 'rule72', 'ci'], level: 8 }),
      ch('Scams: The Field Guide', 'You are about to be targeted. Be ready.', { pool: 'scam_awareness', level: 7 }),
      ch('AI & Your First Career', 'Direction for the decade you are entering.', { pool: 'ai_awareness', level: 7 }),
      ch('Critical Thinking: Capstone', 'Evidence, biases, data traps — the full kit.', { pool: 'critical_thinking', level: 7 }),
      ch('Communication for Interviews', 'Say it clearly when it counts.', { pool: 'communication', level: 7 }),
      ch('Learning: The Meta-Skill', 'Your syllabus ends; your learning must not.', { pool: 'learning_science', level: 7 }),
    ],
  },
  {
    id: 'college', name: 'College', short: 'CO', kind: 'college',
    color: '#12777B',
    tagline: 'Placement-grade aptitude plus the judgment interviews test.',
    chapters: [
      ch('Placement Quant I: Percentages', 'The highest-frequency placement topic.', { topics: ['percent', 'percent_change', 'discount'], level: 9 }),
      ch('Placement Quant II: P&L, Ratio', 'Commercial maths at interview speed.', { topics: ['profitloss', 'ratio'], level: 9 }),
      ch('Placement Quant III: Rates', 'Speed-distance-time and time-and-work.', { topics: ['speed', 'work'], level: 9 }),
      ch('Interest & Growth', 'SI, CI and doubling-time instincts.', { topics: ['si', 'ci', 'rule72'], level: 9 }),
      ch('Probability & Counting', 'P&C and probability — the filter questions.', { topics: ['probability', 'perm_comb'], level: 9 }),
      ch('Averages & Alligation', 'Averages and weighted thinking.', { topics: ['average', 'ratio'], level: 9 }),
      ch('Number Series & Patterns', 'The aptitude-test opener, mastered.', { topics: ['series_number', 'series_letter'], level: 9 }),
      ch('Data Interpretation Sets', 'Tables at test-day speed.', { topics: ['di_table'], level: 9 }),
      ch('Logical Reasoning I', 'Syllogisms and statement logic.', { topics: ['syllogism', 'statement'], level: 9 }),
      ch('Logical Reasoning II', 'Coding, direction, relations, ordering.', { topics: ['coding', 'direction', 'relation', 'ordering'], level: 9 }),
      ch('Verbal Ability', 'Synonyms, antonyms, analogies — test-grade.', { topics: ['synonym', 'antonym', 'analogy'], level: 9 }),
      ch('Guesstimates & Fermi', 'The consulting-interview classic.', { topics: ['estimation', 'expected_value'], level: 9 }),
      ch('Mental Math Conditioning', 'Raw speed: the edge in every timed test.', { topics: ['mult', 'powerroot', 'bodmas'], level: 9 }),
      ch('AI-Era Career Strategy', 'Skills that survive every tech wave.', { pool: 'ai_awareness', level: 8 }),
      ch('Interview Communication', 'Structure, brevity, and being remembered.', { pool: 'communication', level: 8 }),
      ch('Critical Thinking for Graduates', 'Data traps, biases, and clean reasoning.', { pool: 'critical_thinking', level: 8 }),
      ch('First Salary: Money Sense', 'Budgets, EMIs, compounding — before the mistakes.', { pool: 'money_mindset', level: 8 }),
      ch('Scam-Proof Yourself', 'New earners are the #1 target. Armour up.', { pool: 'scam_awareness', level: 8 }),
    ],
  },
  {
    id: 'working', name: 'Working Adults', short: 'WA', kind: 'adult',
    color: '#2C4FA3',
    tagline: 'Stay sharp, decide well, and stay relevant through every wave.',
    chapters: [
      ch('Workplace Judgment', 'Feedback, priorities, estimates, trust.', { pool: 'workplace_judgment', level: 8 }),
      ch('Decisions & Biases', 'The thinking traps that cost careers and money.', { pool: 'critical_thinking', level: 8 }),
      ch('Communicate Like a Pro', 'Emails, meetings, disagreements — handled.', { pool: 'communication', level: 8 }),
      ch('AI at Work', 'Become the person who understands both worlds.', { pool: 'ai_awareness', level: 8 }),
      ch('Money: EMIs & Debt', 'The true cost of instalments and credit.', { topics: ['emi', 'ci', 'rule72'], level: 8 }),
      ch('Money: Growth Mindset', 'Budgets, compounding, and calm investing.', { pool: 'money_mindset', level: 8 }),
      ch('Scam Radar for Professionals', 'UPI fraud, job scams, "guaranteed" returns.', { pool: 'scam_awareness', level: 8 }),
      ch('Digital Hygiene', 'Passwords, phishing, and your data at work.', { pool: 'digital_safety', level: 8 }),
      ch('Numbers at Work', 'Percentages, growth and comparisons in meetings.', { topics: ['percent_change', 'percent', 'average'], level: 8 }),
      ch('Data Interpretation Refresh', 'Read dashboards and tables critically.', { topics: ['di_table', 'average'], level: 8 }),
      ch('Estimation for Decisions', 'Back-of-envelope thinking for real calls.', { topics: ['estimation', 'expected_value'], level: 8 }),
      ch('Risk & Probability', 'Insurance, lotteries and rational risk.', { topics: ['probability', 'expected_value'], level: 8 }),
      ch('Mental Math Tune-Up', 'Keep the arithmetic engine warm.', { topics: ['mult', 'bodmas', 'powerroot'], level: 8 }),
      ch('Logic Refresh', 'Syllogisms and statements — spot weak arguments.', { topics: ['syllogism', 'statement'], level: 8 }),
      ch('Learn to Re-Learn', 'Upskilling science for busy people.', { pool: 'learning_science', level: 8 }),
      ch('Information Diet', 'News, feeds and staying accurately informed.', { pool: 'media_literacy', level: 8 }),
    ],
  },
  {
    id: 'nonworking', name: 'Non-Working Adults', short: 'NW', kind: 'adult',
    color: '#8F2D5F',
    tagline: 'Keep the mind young, the money safe, and the confidence high.',
    chapters: [
      ch('Everyday Money Maths', 'Bills, discounts and household arithmetic.', { topics: ['percent', 'discount', 'addsub'], level: 4 }),
      ch('Household Budget Wisdom', 'Needs, wants, and the leaks in between.', { pool: 'money_mindset', level: 5 }),
      ch('Scam Shield', 'OTP calls, prize messages, "bank" alerts — see through all of it.', { pool: 'scam_awareness', level: 5 }),
      ch('Digital Confidence', 'Use apps and phones safely, without fear.', { pool: 'digital_safety', level: 5 }),
      ch('Forward It? Verify First', 'The family-group fact-check kit.', { pool: 'media_literacy', level: 5 }),
      ch('Brain Teasers: Patterns', 'Series puzzles that keep the mind springy.', { topics: ['series_number', 'series_letter'], level: 4 }),
      ch('Brain Teasers: Logic', 'Odd-one-out and analogies, daily-walk style.', { topics: ['odd_one', 'analogy'], level: 4 }),
      ch('Family-Tree Puzzles', 'Blood relations — you already have the data.', { topics: ['relation', 'ordering'], level: 4 }),
      ch('Calendar & Clock Fun', 'Day-counting tricks to show the grandkids.', { topics: ['calendar', 'clock'], level: 4 }),
      ch('Kitchen & Market Maths', 'Ratios, fractions and unit conversions.', { topics: ['ratio', 'fraction', 'unitconv'], level: 4 }),
      ch('Reading the News Numbers', 'Percentages and averages behind headlines.', { topics: ['percent_change', 'average', 'di_table'], level: 5 }),
      ch('Luck, Lotteries & Truth', 'What chance really says about "sure things".', { topics: ['probability', 'expected_value'], level: 5 }),
      ch('Savings That Grow', 'Interest, compounding, Rule of 72.', { topics: ['si', 'ci', 'rule72'], level: 5 }),
      ch('A Young Mind at Any Age', 'The science of keeping memory strong.', { pool: 'learning_science', level: 5 }),
      ch('Understanding the AI Era', 'What has changed — and what never will.', { pool: 'ai_awareness', level: 5 }),
      ch('Conversations That Connect', 'Listening and being heard, at home and beyond.', { pool: 'communication', level: 5 }),
    ],
  },
];

export const SCHOOL_GROUPS = GROUPS.filter((g) => g.kind === 'school');

export function getGroup(id) {
  return GROUPS.find((g) => g.id === id);
}

// Deterministic question set for a chapter. Stable across visits (seed v1).
export function buildChapterQuestions(groupId, chapterIndex, variant = 0) {
  const group = getGroup(groupId);
  if (!group) return [];
  const chapter = group.chapters[chapterIndex];
  if (!chapter) return [];
  const rng = makeRng(`learn:${groupId}:${chapterIndex}:v1:${variant}`);
  const out = [];
  const seen = new Set();

  if (chapter.pool) {
    for (const q of curatedSample(rng, chapter.pool, QUESTIONS_PER_CHAPTER)) {
      out.push(q);
      seen.add(q.q);
    }
  }
  if (out.length < QUESTIONS_PER_CHAPTER && chapter.topics && chapter.topics.length) {
    let i = 0, guard = 0;
    while (out.length < QUESTIONS_PER_CHAPTER && guard++ < 400) {
      const topic = chapter.topics[i % chapter.topics.length];
      i++;
      const q = generate(topic, rng, chapter.level);
      if (q && !seen.has(q.q)) {
        seen.add(q.q);
        out.push(q);
      }
    }
    // A topic with a small variation pool can run dry of unique questions —
    // top up from related high-variety topics at the same difficulty.
    const backups = ['series_number', 'estimation', 'di_table', 'average', 'percent', 'bodmas'];
    let b = 0, guard2 = 0;
    while (out.length < QUESTIONS_PER_CHAPTER && guard2++ < 400) {
      const q = generate(backups[b % backups.length], rng, chapter.level);
      b++;
      if (q && !seen.has(q.q)) {
        seen.add(q.q);
        out.push(q);
      }
    }
  }
  return out;
}

export function chapterTopicNotes(chapter) {
  const keys = chapter.pool ? [chapter.pool] : chapter.topics || [];
  return keys.map((k) => TOPIC_INFO[k]).filter(Boolean);
}

export const TOTAL_CHAPTERS = GROUPS.reduce((n, g) => n + g.chapters.length, 0);
