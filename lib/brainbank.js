// Content banks for Prajnify (brain training) and the Games tab.
// MCQ item shape: { q, o: [4 options], a: correct index }

export const LOGIC = [
  { q: 'All dolphins are mammals. All mammals breathe air. Therefore dolphins:', o: ['Live only in water', 'Breathe air', 'Are fish', 'Have gills'], a: 1 },
  { q: 'If A→B, B→C and C→D, which must be true?', o: ['D→A', 'A→D', 'B→D only', 'C→A'], a: 1 },
  { q: 'A bat and ball cost ₹110 together. The bat costs ₹100 more than the ball. What does the ball cost?', o: ['₹10', '₹5', '₹15', '₹20'], a: 1 },
  { q: 'You have 8 coins; one is heavier. Minimum weighings on a balance scale to find it?', o: ['1', '2', '3', '4'], a: 1 },
  { q: 'What comes next: 1, 4, 9, 16, 25, ___?', o: ['30', '36', '42', '49'], a: 1 },
  { q: 'A clock shows 6:30. What is the angle between the hands?', o: ['0°', '15°', '180°', '90°'], a: 1 },
  { q: 'All X are Y. Some Y are Z. Which is necessarily true?', o: ['All X are Z', 'Some X are Z', 'No X are Z', 'Cannot conclude'], a: 3 },
  { q: 'Three boxes: Red=Apples, Blue=Oranges, Green=Both. Every label is WRONG. You draw an Apple from Green. What is in Blue?', o: ['Apples', 'Oranges', 'Both', 'Empty'], a: 2 },
  { q: 'A snail climbs 3m each day and slips 2m each night on a 10m wall. Days to reach the top?', o: ['7', '8', '9', '10'], a: 1 },
  { q: 'If 6 cats kill 6 rats in 6 minutes, how many cats kill 100 rats in 100 minutes?', o: ['100', '6', '60', '10'], a: 1 },
  { q: 'You overtake the person in 2nd place. What position are you in now?', o: ['1st', '2nd', '3rd', 'Cannot say'], a: 1 },
  { q: 'What comes next: 2, 3, 5, 7, 11, 13, ___?', o: ['14', '15', '16', '17'], a: 3 },
  { q: "A is B's mother. B is C's father. What is A to C?", o: ['Mother', 'Grandmother', 'Aunt', 'Sister'], a: 1 },
  { q: 'Everyone in a group shakes hands once, producing 10 handshakes. How many people?', o: ['4', '5', '6', '10'], a: 1 },
  { q: 'Which is heavier: 1 kg of iron or 1 kg of feathers?', o: ['Iron', 'Feathers', 'Same', 'Depends on gravity'], a: 2 },
  { q: 'A man walks 1 km north, 1 km east, 1 km south and arrives back at his start. Where did he begin?', o: ['North Pole', 'South Pole', 'Equator', 'Any point'], a: 0 },
  { q: 'What comes next: 0, 1, 1, 2, 3, 5, 8, 13, ___?', o: ['18', '20', '21', '22'], a: 2 },
  { q: 'A has twice what B has. B has half of what C has. C has 100. What does A have?', o: ['50', '100', '200', '25'], a: 1 },
  { q: 'What is the missing number: 2, 6, 24, 120, ___?', o: ['240', '360', '600', '720'], a: 3 },
  { q: 'If today is Wednesday, what day falls 100 days from now?', o: ['Friday', 'Saturday', 'Sunday', 'Monday'], a: 0 },
  { q: 'Three switches control three bulbs in a sealed room. You may enter ONCE. How do you map them?', o: ['Flip all on, then check', 'Flip one on, one off — use the warm bulb as the third', 'It cannot be done', 'Use a stopwatch'], a: 1 },
  { q: 'Socrates is a man. All men are mortal. Therefore Socrates is:', o: ['A god', 'Mortal', 'Immortal', 'Undetermined'], a: 1 },
  { q: 'There are 25 horses and a 5-lane track, no timer. Minimum races to find the top 3?', o: ['6', '7', '8', '10'], a: 1 },
];

export const WORDS = [
  { w: 'ENTROPY', h: 'Measure of disorder in a system', c: 'Physics' },
  { w: 'PARADOX', h: 'A self-contradicting truth', c: 'Logic' },
  { w: 'CATALYST', h: 'Speeds a reaction without being consumed', c: 'Chemistry' },
  { w: 'FRACTAL', h: 'Infinitely self-similar pattern', c: 'Mathematics' },
  { w: 'OSMOSIS', h: 'Solvent crossing a semipermeable membrane', c: 'Biology' },
  { w: 'THEOREM', h: 'A proven mathematical proposition', c: 'Mathematics' },
  { w: 'SYNTAX', h: 'Rules governing sentence structure', c: 'Linguistics' },
  { w: 'PLASMA', h: 'The fourth state of matter', c: 'Physics' },
  { w: 'CORTEX', h: 'Outer layer of the brain', c: 'Neuroscience' },
  { w: 'ZENITH', h: 'Highest point of a celestial body', c: 'Astronomy' },
  { w: 'VECTOR', h: 'Quantity with magnitude and direction', c: 'Mathematics' },
  { w: 'NEBULA', h: 'Interstellar cloud of gas and dust', c: 'Astronomy' },
  { w: 'PSYCHE', h: 'The mind or soul', c: 'Psychology' },
  { w: 'AXIOM', h: 'A self-evident foundational truth', c: 'Logic' },
  { w: 'GENOME', h: 'Complete set of genetic material', c: 'Biology' },
  { w: 'VORTEX', h: 'Rotating mass of fluid or air', c: 'Physics' },
  { w: 'CIPHER', h: 'An encoded secret message', c: 'Cryptography' },
  { w: 'PRISM', h: 'Transparent solid that splits light', c: 'Optics' },
  { w: 'QUORUM', h: 'Minimum members needed to transact business', c: 'Governance' },
  { w: 'STRATUM', h: 'A distinct layer of rock or society', c: 'Geology' },
  { w: 'FERMENT', h: 'Chemical breakdown by microorganisms', c: 'Chemistry' },
  { w: 'DIALECT', h: 'Regional variation of a language', c: 'Linguistics' },
  { w: 'KINETIC', h: 'Relating to motion and movement', c: 'Physics' },
  { w: 'LEXICON', h: 'The complete vocabulary of a language', c: 'Linguistics' },
  { w: 'QUANTUM', h: 'Smallest discrete unit of energy', c: 'Physics' },
  { w: 'SYNAPSE', h: 'Junction between two nerve cells', c: 'Neuroscience' },
  { w: 'ALGEBRA', h: 'Mathematics of symbols and rules', c: 'Mathematics' },
];

export const GEO = [
  { q: 'Which country spans the most time zones?', o: ['Russia', 'United States', 'France', 'China'], a: 2 },
  { q: 'The Atacama Desert lies primarily in which country?', o: ['Argentina', 'Peru', 'Chile', 'Bolivia'], a: 2 },
  { q: 'Which river flows through the most countries?', o: ['Amazon', 'Nile', 'Danube', 'Congo'], a: 2 },
  { q: 'What is the capital of Kazakhstan?', o: ['Almaty', 'Astana', 'Bishkek', 'Tashkent'], a: 1 },
  { q: 'The Strait of Malacca separates which two landmasses?', o: ['India & Sri Lanka', 'Sumatra & the Malay Peninsula', 'Java & Borneo', 'Philippines & Taiwan'], a: 1 },
  { q: 'Which country has the longest coastline in the world?', o: ['Russia', 'United States', 'Norway', 'Canada'], a: 3 },
  { q: "The Pantanal — the world's largest tropical wetland — lies mainly in:", o: ['Brazil', 'Colombia', 'Venezuela', 'Peru'], a: 0 },
  { q: "Lake Baikal holds roughly what share of the world's unfrozen fresh surface water?", o: ['10%', '20%', '30%', '40%'], a: 1 },
  { q: 'Which country is entirely surrounded by South Africa?', o: ['Zimbabwe', 'Botswana', 'Lesotho', 'Eswatini'], a: 2 },
  { q: 'The Bosphorus Strait connects the Black Sea to which sea?', o: ['Mediterranean', 'Aegean', 'Sea of Marmara', 'Adriatic'], a: 2 },
  { q: 'Which African country has more pyramids than Egypt?', o: ['Libya', 'Sudan', 'Ethiopia', 'Morocco'], a: 1 },
  { q: 'Which region has the highest average elevation on Earth?', o: ['Nepal', 'Tibetan Plateau', 'Bhutan', 'Bolivian Altiplano'], a: 1 },
  { q: 'The Gobi Desert spans China and which other nation?', o: ['Kazakhstan', 'Mongolia', 'Russia', 'Kyrgyzstan'], a: 1 },
  { q: 'Which South American country borders BOTH the Atlantic and Pacific Oceans?', o: ['Colombia', 'Brazil', 'Chile', 'Venezuela'], a: 0 },
  { q: 'Timbuktu is a historic city in which country?', o: ['Niger', 'Mali', 'Senegal', 'Chad'], a: 1 },
  { q: 'The Ring of Fire encircles which ocean?', o: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], a: 3 },
  { q: 'Which sea has no land borders at all?', o: ['Dead Sea', 'Coral Sea', 'Sargasso Sea', 'Caspian Sea'], a: 2 },
  { q: 'The Mariana Trench lies in which ocean?', o: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], a: 2 },
  { q: 'Which country holds the most UNESCO World Heritage Sites?', o: ['China', 'Italy', 'France', 'Spain'], a: 1 },
  { q: 'Which is the only continent with land in all four hemispheres?', o: ['Asia', 'Africa', 'Europe', 'South America'], a: 1 },
  { q: 'Which country is simultaneously the largest island and the smallest continent?', o: ['Greenland', 'New Zealand', 'Indonesia', 'Australia'], a: 3 },
  { q: "India's longest river by length within the country is:", o: ['Brahmaputra', 'Godavari', 'Ganga', 'Narmada'], a: 2 },
  { q: 'Which Indian state has the longest coastline?', o: ['Tamil Nadu', 'Andhra Pradesh', 'Gujarat', 'Maharashtra'], a: 2 },
  { q: 'The Deccan Plateau is bounded on the west by which mountain range?', o: ['Eastern Ghats', 'Western Ghats', 'Aravallis', 'Vindhyas'], a: 1 },
];

export const GK = [
  { q: 'Who invented the World Wide Web?', o: ['Bill Gates', 'Tim Berners-Lee', 'Vint Cerf', 'Steve Jobs'], a: 1 },
  { q: 'The speed of light is approximately how many km per second?', o: ['100,000', '200,000', '300,000', '400,000'], a: 2 },
  { q: 'Which element has atomic number 79?', o: ['Silver', 'Platinum', 'Gold', 'Mercury'], a: 2 },
  { q: 'The Turing Test assesses machine:', o: ['Speed', 'Intelligence', 'Memory', 'Energy efficiency'], a: 1 },
  { q: 'India launched Chandrayaan-1 in which year?', o: ['2006', '2007', '2008', '2010'], a: 2 },
  { q: "'Cogito, ergo sum' was written by which philosopher?", o: ['Kant', 'Descartes', 'Plato', 'Nietzsche'], a: 1 },
  { q: "The 'Black Swan' theory was developed by:", o: ['Malcolm Gladwell', 'Nassim Taleb', 'Daniel Kahneman', 'Richard Feynman'], a: 1 },
  { q: "The most abundant gas in Earth's atmosphere is:", o: ['Oxygen', 'Carbon dioxide', 'Argon', 'Nitrogen'], a: 3 },
  { q: 'Which country first granted legal personhood to a river?', o: ['India', 'Ecuador', 'New Zealand', 'Bolivia'], a: 2 },
  { q: 'The Dunning–Kruger effect describes a bias about:', o: ['Memory accuracy', 'Time perception', "Overestimating one's competence", 'Social conformity'], a: 2 },
  { q: 'The half-life of Carbon-14 is approximately:', o: ['1,000 years', '5,730 years', '10,000 years', '50,000 years'], a: 1 },
  { q: 'Which Indian mathematician formalised zero as a number with arithmetic rules?', o: ['Aryabhata', 'Brahmagupta', 'Ramanujan', 'Bhaskara II'], a: 1 },
  { q: "Moore's Law states transistor count doubles roughly every how many years?", o: ['1', '2', '3', '5'], a: 1 },
  { q: 'The Mpemba effect describes hot water:', o: ['Evaporating slower', 'Freezing faster than cold water', 'Boiling at a lower temperature', 'Conducting electricity better'], a: 1 },
  { q: 'How many bones are in the adult human body?', o: ['186', '196', '206', '216'], a: 2 },
  { q: 'Which vitamin does the body synthesise from sunlight?', o: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], a: 3 },
  { q: 'The Large Hadron Collider is operated from which country?', o: ['United States', 'Germany', 'Switzerland', 'France'], a: 2 },
  { q: 'The Fibonacci sequence appears in the spiral of which natural object?', o: ['Snowflake', 'Nautilus shell', 'Quartz crystal', 'Glass prism'], a: 1 },
  { q: 'The Baader–Meinhof phenomenon is better known as:', o: ['A logical fallacy', 'Frequency illusion', 'Loss aversion', 'Anchoring bias'], a: 1 },
  { q: 'RAM stands for:', o: ['Read Access Memory', 'Random Access Memory', 'Rapid Array Module', 'Recurrent Access Memory'], a: 1 },
  { q: 'The scientific study of earthquakes is called:', o: ['Seismology', 'Geology', 'Tectonics', 'Volcanology'], a: 0 },
  { q: 'Which blood type is the universal donor?', o: ['A positive', 'O negative', 'AB positive', 'B negative'], a: 1 },
  { q: 'Who is regarded as the architect of the Indian Constitution?', o: ['Jawaharlal Nehru', 'B. R. Ambedkar', 'Sardar Patel', 'Rajendra Prasad'], a: 1 },
  { q: 'The Reserve Bank of India was established in which year?', o: ['1935', '1947', '1950', '1969'], a: 0 },
];

export const SEQS = [
  { s: [3, 6, 11, 18, 27], n: 38, r: 'Gaps grow: +3, +5, +7, +9, +11' },
  { s: [1, 2, 6, 24, 120], n: 720, r: 'Factorials: 1!, 2!, 3!, 4!, 5!, 6!' },
  { s: [2, 3, 5, 7, 11, 13], n: 17, r: 'Consecutive prime numbers' },
  { s: [1, 1, 2, 3, 5, 8, 13], n: 21, r: 'Fibonacci — each term is the sum of the previous two' },
  { s: [100, 92, 85, 79, 74], n: 70, r: 'Shrinking gaps: −8, −7, −6, −5, −4' },
  { s: [2, 5, 11, 23, 47], n: 95, r: 'Each term is ×2 + 1' },
  { s: [1, 8, 27, 64, 125], n: 216, r: 'Perfect cubes: 1³, 2³, 3³, 4³, 5³, 6³' },
  { s: [4, 9, 16, 25, 36], n: 49, r: 'Perfect squares from 2² onward' },
];

export const RIDDLES = [
  { q: 'I have cities but no houses, mountains but no trees, water but no fish, roads but no cars. What am I?', o: ['A dream', 'A map', 'A painting', 'A mirror'], a: 1 },
  { q: 'The more you take, the more you leave behind. What am I?', o: ['Time', 'Footsteps', 'Memories', 'Secrets'], a: 1 },
  { q: 'I speak without a mouth and hear without ears. I have no body, yet I come alive with wind. What am I?', o: ['A ghost', 'A shadow', 'An echo', 'A thought'], a: 2 },
  { q: 'What runs but never walks, has a mouth but never speaks, a bed but never sleeps?', o: ['A clock', 'A river', 'A dream', 'The wind'], a: 1 },
  { q: 'You see a house with four walls, each facing south. A bear walks past. What colour is the bear?', o: ['Brown', 'Black', 'White', 'Grey'], a: 2 },
  { q: 'What gets wetter the more it dries?', o: ['Sponge', 'Towel', 'Cloud', 'Soap'], a: 1 },
];

export const LATERALS = [
  { q: 'A woman shoots her husband, then holds him under water for five minutes — and afterwards they go out to dinner together. How?', hint: 'Consider her profession.', a: 'She is a photographer: she shot his portrait and developed the film in a chemical bath.' },
  { q: 'A man is found in a sealed room with only a small puddle of water beside him. There is no weapon in sight. What happened?', hint: 'The object disappeared on its own.', a: 'The weapon was an icicle, which melted, leaving only water.' },
  { q: 'Two men order identical iced drinks. One drinks quickly and is fine; the other sips slowly and falls ill. Why?', hint: 'Think about what was in the ice.', a: 'The bad substance was frozen inside the ice cubes; the fast drinker finished before the ice melted.' },
];

// Mixed pool for Quiz Party (group game): GK + GEO + LOGIC, tagged
export const PARTY_POOL = [
  ...GK.map((x) => ({ ...x, tag: 'Knowledge' })),
  ...GEO.map((x) => ({ ...x, tag: 'Geography' })),
  ...LOGIC.filter((x) => x.q.length < 130).map((x) => ({ ...x, tag: 'Logic' })),
];

export const PAIR_EMOJI = ['🐘', '🦚', '🌸', '🚀', '🎻', '🧿', '🥭', '🎲', '🪔', '🌙', '⚡', '🐯', '🎯', '🍉', '🔮', '🎪'];
