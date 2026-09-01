/**
 * backend/scripts/seedRealData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Intelligent real-data seed script.
 *
 * What it does:
 *  1. Connects to MongoDB using MONGODB_URI from backend/.env
 *  2. Wipes ALL existing seeded companies and questions (isSeeded: true)
 *  3. Auto-infers missing TOPICS from problem title using keyword matching
 *  4. Auto-infers ROUND TYPE from problem summary keywords
 *  5. Infers better COMPANY CATEGORY using a curated company dictionary
 *  6. Builds ROUND STRUCTURE for each company from its question data
 *  7. Calculates XP VALUE based on difficulty
 *  8. Sets isHot flag for questions with above-average frequency score
 *  9. Bulk-inserts 678+ companies and 20,000+ questions preserving original _ids
 *
 * Run:
 *   cd /Users/pranaysarkar/Desktop/NST-PREPPORTAL-FRONTEND
 *   /usr/local/bin/node backend/scripts/seedRealData.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path = require('path');
// Resolve modules correctly — mongoose is in root node_modules, dotenv in backend/node_modules
const ROOT_MODULES = path.join(__dirname, '../../node_modules');
const BACKEND_MODULES = path.join(__dirname, '../node_modules');
const mongoose = require(path.join(ROOT_MODULES, 'mongoose'));
const dotenv = require(path.join(BACKEND_MODULES, 'dotenv'));

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not found in backend/.env');
  process.exit(1);
}

// ─── Load raw JSON data ────────────────────────────────────────────────────────
const rawQuestions = require(path.join(__dirname, '../../questions.json'));
const rawCompanies = require(path.join(__dirname, '../../companies.json'));

// ─── TOPIC INFERENCE ENGINE ────────────────────────────────────────────────────
// Maps keyword patterns (case-insensitive) in problem title → topic labels
const TOPIC_KEYWORDS = [
  // Data Structures
  [/linked.?list|reverse.?list|merge.?list|flatten.?list/i, 'Linked Lists'],
  [/binary.?tree|bst|avl|tree.?traversal|level.?order|inorder|preorder|postorder|path.?sum|diameter.?tree|lowest.?common.?ancestor/i, 'Trees'],
  [/graph|bfs|dfs|topological|bipartite|island|connected.?component|shortest.?path|dijkstra|bellman|floyd/i, 'Graphs'],
  [/stack|valid.?parenthes|bracket|min.?stack|monotonic.?stack/i, 'Stack'],
  [/queue|deque|sliding.?window.?max|circular.?queue/i, 'Queue'],
  [/heap|priority.?queue|kth.?largest|kth.?smallest|top.?k/i, 'Heaps'],
  [/trie|prefix.?tree|word.?search|autocomplete/i, 'Trie'],
  [/hash|map|dictionary|frequency|count.?occurrences|group.?anagrams/i, 'Hash Tables'],
  [/segment.?tree|fenwick|bit.?tree|range.?query/i, 'Segment Trees'],
  [/union.?find|disjoint.?set/i, 'Union Find'],

  // Algorithms
  [/dynamic.?programming|dp|memoiz|tabulation|knapsack|coin.?change|edit.?distance|longest.?common|longest.?increasing/i, 'Dynamic Programming'],
  [/greedy|activity.?selection|interval|schedule|meeting|jump.?game/i, 'Greedy'],
  [/binary.?search|search.?rotated|find.?target|guess.?number|peak.?element/i, 'Binary Search'],
  [/two.?pointer|three.?sum|pair|container.?water|trapping.?rain/i, 'Two Pointers'],
  [/sliding.?window|maximum.?subarray|minimum.?window.?substring/i, 'Sliding Window'],
  [/backtrack|permutation|combination|subset|n.?queens|sudoku/i, 'Backtracking'],
  [/recursion|recursive|divide.?conquer|merge.?sort|quick.?sort/i, 'Recursion'],
  [/bit.?manipulation|xor|bitwise|power.?of.?two|number.?of.?bits|hamming/i, 'Bit Manipulation'],

  // Topic areas
  [/string|palindrome|anagram|substring|subsequence|reverse.?string|roman|zigzag|encode|decode|word.?break/i, 'Strings'],
  [/array|rotate|matrix|spiral|sort|search|peak|missing|duplicate|rearrange|monotonic|stock|profit/i, 'Arrays'],
  [/math|prime|factorial|fibonacci|gcd|lcm|modular|pow|sqrt|digit|numeric|number|integer|count.?digit/i, 'Math'],
  [/regex|pattern.?match|wildcard.?match/i, 'Regex'],
  [/design|implement|lru.?cache|lfu|min.?stack|twitter|parking|elevator|rate.?limit|snapshot/i, 'Design'],
  [/sort|merge|quick|heap.?sort|counting.?sort|radix/i, 'Sorting'],
  [/simulation|game|walk|snake|life/i, 'Simulation'],
  [/geometry|line|circle|rectangle|area|distance|coordinate/i, 'Geometry'],
];

/**
 * Infer topics from problem summary using keyword matching.
 * Returns the original topics if non-empty, otherwise infers them.
 */
function inferTopics(problemSummary, existingTopics) {
  if (existingTopics && existingTopics.length > 0) return existingTopics;

  const inferred = [];
  for (const [pattern, topic] of TOPIC_KEYWORDS) {
    if (pattern.test(problemSummary)) {
      inferred.push(topic);
    }
  }

  // De-duplicate and cap at 4 topics
  const unique = [...new Set(inferred)].slice(0, 4);
  return unique.length > 0 ? unique : ['General'];
}

// ─── ROUND TYPE INFERENCE ──────────────────────────────────────────────────────
const ROUND_TYPE_KEYWORDS = [
  [/system.?design|design.?pattern|architecture|scalab|distributed|microservice|load.?balanc/i, 'System Design'],
  [/lld|low.?level.?design|object.?orient|design.?class|uml|solid.?principle/i, 'LLD'],
  [/hr|tell.?me|strength|weakness|why.?company|team.?work|conflict|leadership|situational/i, 'HR'],
  [/aptitude|reasoning|quantitative|verbal|logical.?reason|puzzle|number.?series/i, 'Aptitude'],
  [/domain|database|sql|network|os|operating.?system|computer.?network|dbms/i, 'Domain'],
  [/managerial|manage|project|stakeholder|kpi|metric|roadmap/i, 'Managerial'],
];

function inferRoundType(problemSummary, existing) {
  if (existing && existing !== 'Coding') return existing;
  for (const [pattern, type] of ROUND_TYPE_KEYWORDS) {
    if (pattern.test(problemSummary)) return type;
  }
  return 'Coding'; // Default — 99.3% of questions are Coding
}

// ─── COMPANY CATEGORY DICTIONARY ──────────────────────────────────────────────
// Curated list for well-known companies — overrides the scraped "other" category
const COMPANY_CATEGORY_MAP = {
  // MAANG/FAANG tier
  'google': 'maang', 'meta': 'maang', 'amazon': 'maang', 'apple': 'maang',
  'netflix': 'maang', 'microsoft': 'maang', 'amazon-web-services': 'maang',

  // Product companies
  'adobe': 'product', 'salesforce': 'product', 'oracle': 'product', 'sap': 'product',
  'intuit': 'product', 'atlassian': 'product', 'stripe': 'product', 'twilio': 'product',
  'databricks': 'product', 'snowflake': 'product', 'mongodb': 'product', 'elastic': 'product',
  'hashicorp': 'product', 'confluent': 'product', 'okta': 'product', 'zoom': 'product',
  'slack': 'product', 'figma': 'product', 'notion': 'product', 'hubspot': 'product',
  'zendesk': 'product', 'dropbox': 'product', 'box': 'product', 'workday': 'product',
  'servicenow': 'product', 'palantir': 'product', 'coinbase': 'product', 'uber': 'product',
  'airbnb': 'product', 'lyft': 'product', 'pinterest': 'product', 'twitter': 'product',
  'linkedin': 'product', 'indeed': 'product', 'glassdoor': 'product', 'quora': 'product',
  'reddit': 'product', 'discord': 'product', 'spotify': 'product', 'shopify': 'product',
  'booking': 'product', 'expedia': 'product', 'booking-com': 'product',
  'flipkart': 'product', 'swiggy': 'product', 'zomato': 'product', 'paytm': 'product',
  'phonepe': 'product', 'meesho': 'product', 'razorpay': 'product', 'cred': 'product',
  'groww': 'product', 'zerodha': 'product', 'dream11': 'product', 'mpl': 'product',
  'ola': 'product', 'byju': 'product', 'byjus': 'product', 'unacademy': 'product',
  'vedantu': 'product', 'nykaa': 'product', 'myntra': 'product', 'lenskart': 'product',
  'dunzo': 'product', 'bigbasket': 'product', 'urban-company': 'product',
  'postman': 'product', 'browserstack': 'product', 'freshworks': 'product',
  'chargebee': 'product', 'zoho': 'product', 'sprinklr': 'product', 'cleartax': 'product',
  'setu': 'product', 'slice': 'product', 'jupiter': 'product', 'fi': 'product',
  'niyo': 'product', 'open': 'product', 'freo': 'product', 'bankopen': 'product',
  'waymo': 'product', 'nvidia': 'product', 'qualcomm': 'product', 'amd': 'product',
  'intel': 'product', 'arm': 'product', 'broadcom': 'product', 'texas-instruments': 'product',
  'grab': 'product', 'gojek': 'product', 'sea': 'product', 'shopee': 'product',
  'bytedance': 'product', 'tencent': 'product', 'alibaba': 'product', 'baidu': 'product',

  // Services
  'tcs': 'service', 'infosys': 'service', 'wipro': 'service', 'hcl': 'service',
  'cognizant': 'service', 'tech-mahindra': 'service', 'mindtree': 'service', 'mphasis': 'service',
  'capgemini': 'service', 'accenture': 'service', 'ibm': 'service', 'deloitte': 'service',
  'kpmg': 'service', 'pwc': 'service', 'ey': 'service', 'ernst-young': 'service',
  'ltimindtree': 'service', 'hexaware': 'service', 'persistent': 'service',
  'cyient': 'service', 'zensar': 'service', 'niit': 'service', 'mastech': 'service',
  'nagarro': 'service', 'birlasoft': 'service', 'sonata': 'service', 'sasken': 'service',
  'dxc': 'service', 'ntt-data': 'service', 'atos': 'service', 'unisys': 'service',

  // BFSI
  'jpmorgan': 'bfsi', 'goldman-sachs': 'bfsi', 'morgan-stanley': 'bfsi', 'citi': 'bfsi',
  'deutsche-bank': 'bfsi', 'barclays': 'bfsi', 'ubs': 'bfsi', 'credit-suisse': 'bfsi',
  'wells-fargo': 'bfsi', 'bank-of-america': 'bfsi', 'hsbc': 'bfsi',
  'visa': 'bfsi', 'mastercard': 'bfsi', 'american-express': 'bfsi', 'paypal': 'bfsi',
  'fidelity': 'bfsi', 'blackrock': 'bfsi', 'vanguard': 'bfsi', 'bloomberg': 'bfsi',
  'two-sigma': 'bfsi', 'jane-street': 'bfsi', 'citadel': 'bfsi', 'optiver': 'bfsi',
  'de-shaw': 'bfsi', 'tower-research': 'bfsi', 'worldquant': 'bfsi',
  'hdfc': 'bfsi', 'icici': 'bfsi', 'axis': 'bfsi', 'sbi': 'bfsi', 'kotak': 'bfsi',
  'bajaj': 'bfsi',

  // Startups
  'notion': 'startup', 'figma': 'startup', 'linear': 'startup', 'vercel': 'startup',
  'supabase': 'startup', 'planetscale': 'startup', 'neon': 'startup',
};

function inferCategory(slug, existingCategory) {
  if (existingCategory && existingCategory !== 'other') return existingCategory;
  const normalized = slug.toLowerCase().replace(/[\s_\.]/g, '-');
  return COMPANY_CATEGORY_MAP[normalized] || 'other';
}

// ─── XP VALUE CALCULATION ──────────────────────────────────────────────────────
function calcXpValue(difficulty, frequencyScore) {
  const base = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30;
  const bonus = frequencyScore > 0.5 ? 5 : 0;
  return base + bonus;
}

// ─── BUILD ROUND STRUCTURE ─────────────────────────────────────────────────────
const ROUND_TYPE_TEMPLATES = {
  'Coding': { roundName: 'Online Assessment', typicalDurationMin: 90, description: 'Algorithmic problem solving on coding platform' },
  'System Design': { roundName: 'System Design Interview', typicalDurationMin: 60, description: 'High-level and low-level system design' },
  'LLD': { roundName: 'Low Level Design', typicalDurationMin: 60, description: 'Object-oriented design and coding patterns' },
  'HR': { roundName: 'HR Round', typicalDurationMin: 30, description: 'Behavioral and culture fit interview' },
  'Aptitude': { roundName: 'Aptitude Test', typicalDurationMin: 60, description: 'Quantitative, logical and verbal reasoning' },
  'Domain': { roundName: 'Technical Domain', typicalDurationMin: 45, description: 'Role-specific technical knowledge' },
  'Managerial': { roundName: 'Managerial Round', typicalDurationMin: 45, description: 'Leadership and problem-solving skills' },
};

function buildRoundStructure(roundTypes) {
  // Get unique round types in a logical interview order
  const order = ['Aptitude', 'Coding', 'LLD', 'System Design', 'Domain', 'Managerial', 'HR'];
  const uniqueRounds = [...new Set(roundTypes)].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  return uniqueRounds.map((roundType, i) => {
    const template = ROUND_TYPE_TEMPLATES[roundType] || { roundName: roundType, typicalDurationMin: 60, description: '' };
    return {
      roundNumber: i + 1,
      roundName: template.roundName,
      roundType,
      typicalDurationMin: template.typicalDurationMin,
      description: template.description,
    };
  });
}

// ─── MONGOOSE SCHEMAS (inline — no TypeScript needed) ─────────────────────────
const QuestionSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  companySlug: { type: String, required: true },
  companyName: { type: String, required: true },
  roundType: { type: String, required: true },
  roundNumber: Number,
  problemSummary: { type: String, required: true },
  difficulty: { type: String, required: true },
  topics: [String],
  source: String,
  sourceUrl: String,
  leetcodeUrl: String,
  frequencyScore: { type: Number, default: 0 },
  xpValue: { type: Number, default: 10 },
  isHot: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  isSeeded: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'questions', _id: false });

const CompanySchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  tier: String,
  country: { type: String, default: 'India' },
  logoUrl: String,
  hiringStatus: { type: String, default: 'Active Hiring' },
  avgSalaryLpa: String,
  avgProcessWeeks: String,
  hiringNote: String,
  successRate: String,
  roundStructure: [mongoose.Schema.Types.Mixed],
  topicFrequency: [mongoose.Schema.Types.Mixed],
  difficultyDistribution: mongoose.Schema.Types.Mixed,
  lastSyncedAt: Date,
  isSeeded: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'companies', _id: false });

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return new mongoose.Types.ObjectId();
  }
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
  console.log('✅  Connected.\n');

  // ── Step 1: Wipe old seeded data ──────────────────────────────────────────
  console.log('🗑️   Removing old seeded questions...');
  const qDel = await Question.deleteMany({ isSeeded: true });
  console.log(`    Deleted ${qDel.deletedCount} questions.\n`);

  console.log('🗑️   Removing old seeded companies...');
  const cDel = await Company.deleteMany({ isSeeded: true });
  console.log(`    Deleted ${cDel.deletedCount} companies.\n`);

  // ── Step 2: Process & enrich companies ───────────────────────────────────
  console.log('🏢  Processing companies...');

  // Build a map of companySlug → question roundTypes from raw questions data
  // (used to derive roundStructure per company)
  const companyRoundTypes = {};
  for (const q of rawQuestions) {
    const slug = q.companySlug;
    if (!companyRoundTypes[slug]) companyRoundTypes[slug] = new Set();
    const rt = inferRoundType(q.problemSummary, q.roundType);
    companyRoundTypes[slug].add(rt);
  }

  // Compute avg frequency score per company to set hiringStatus
  const companyFreqMap = {};
  for (const q of rawQuestions) {
    if (!companyFreqMap[q.companySlug]) companyFreqMap[q.companySlug] = [];
    companyFreqMap[q.companySlug].push(q.frequencyScore || 0);
  }

  const enrichedCompanies = rawCompanies.map((c) => {
    const roundTypes = companyRoundTypes[c.slug] ? [...companyRoundTypes[c.slug]] : ['Coding'];
    const qCount = rawQuestions.filter(q => q.companySlug === c.slug).length;

    // Infer hiring status from question count and frequency
    const avgFreq = companyFreqMap[c.slug]
      ? companyFreqMap[c.slug].reduce((a, b) => a + b, 0) / companyFreqMap[c.slug].length
      : 0;
    const hiringStatus = avgFreq > 0.3 ? 'Active Hiring' : qCount > 20 ? 'Active Hiring' : qCount > 5 ? 'Slow Hiring' : 'Paused';

    return {
      _id: toObjectId(c._id),
      slug: c.slug,
      name: c.name,
      category: inferCategory(c.slug, c.category),
      tier: c.tier || undefined,
      country: c.country || 'India',
      logoUrl: c.logoUrl || undefined,
      hiringStatus,
      avgSalaryLpa: c.avgSalaryLpa || undefined,
      avgProcessWeeks: c.avgProcessWeeks || undefined,
      hiringNote: c.hiringNote || undefined,
      successRate: c.successRate || undefined,
      roundStructure: buildRoundStructure(roundTypes),
      topicFrequency: (c.topicFrequency || []).map(t => ({
        topicSlug: t.topicSlug,
        topicName: t.topicName,
        frequencyPct: Math.round(t.frequencyPct * 10) / 10,
        questionCount: t.questionCount,
      })),
      difficultyDistribution: {
        Easy: Math.round(c.difficultyDistribution?.Easy || 0),
        Medium: Math.round(c.difficultyDistribution?.Medium || 0),
        Hard: Math.round(c.difficultyDistribution?.Hard || 0),
      },
      lastSyncedAt: new Date(),
      isSeeded: true,
      createdAt: new Date(c.createdAt || Date.now()),
    };
  });

  // ── Step 3: Insert companies in batches of 500 ────────────────────────────
  console.log(`    Inserting ${enrichedCompanies.length} companies...`);
  let companyInserted = 0;
  for (const batch of chunk(enrichedCompanies, 500)) {
    const res = await Company.insertMany(batch, { ordered: false }).catch(e => {
      // insertMany may throw on duplicate keys — log and continue
      console.warn(`    ⚠️  Some company inserts skipped: ${e.message?.slice(0, 80)}`);
      return { length: batch.length };
    });
    companyInserted += Array.isArray(res) ? res.length : batch.length;
    process.stdout.write(`\r    Progress: ${companyInserted}/${enrichedCompanies.length}   `);
  }
  console.log(`\n✅  Companies inserted: ${companyInserted}\n`);

  // ── Step 4: Process & enrich questions ───────────────────────────────────
  console.log('❓  Processing questions...');

  // Compute avg frequency score for isHot threshold
  const allFreqs = rawQuestions.map(q => q.frequencyScore || 0);
  const avgFreqGlobal = allFreqs.reduce((a, b) => a + b, 0) / allFreqs.length;
  const hotThreshold = Math.max(avgFreqGlobal * 2, 0.1); // top 2× avg is considered hot

  let inferredTopicCount = 0;
  let inferredRoundCount = 0;

  const enrichedQuestions = rawQuestions.map((q) => {
    const inferredTopics = inferTopics(q.problemSummary, q.topics);
    if (!q.topics || q.topics.length === 0) inferredTopicCount++;

    const inferredRound = inferRoundType(q.problemSummary, q.roundType);
    if (inferredRound !== q.roundType) inferredRoundCount++;

    const freq = q.frequencyScore || 0;

    return {
      _id: toObjectId(q._id),
      companyId: toObjectId(q.companyId),
      companySlug: q.companySlug,
      companyName: q.companyName,
      roundType: inferredRound,
      roundNumber: q.roundNumber || undefined,
      problemSummary: q.problemSummary,
      difficulty: q.difficulty,
      topics: inferredTopics,
      source: q.source || 'scraped',
      sourceUrl: q.sourceUrl || undefined,
      leetcodeUrl: (q.leetcodeUrl && q.leetcodeUrl !== 'null') ? q.leetcodeUrl : undefined,
      frequencyScore: freq,
      xpValue: calcXpValue(q.difficulty, freq),
      isHot: freq > hotThreshold,
      verified: q.verified || false,
      isSeeded: true,
      createdAt: new Date(q.createdAt || Date.now()),
    };
  });

  console.log(`    Topics inferred for ${inferredTopicCount} questions`);
  console.log(`    Round type re-classified for ${inferredRoundCount} questions`);

  // ── Step 5: Insert questions in batches of 1000 ───────────────────────────
  console.log(`    Inserting ${enrichedQuestions.length} questions...`);
  let questionInserted = 0;
  for (const batch of chunk(enrichedQuestions, 1000)) {
    const res = await Question.insertMany(batch, { ordered: false }).catch(e => {
      console.warn(`    ⚠️  Some question inserts skipped: ${e.message?.slice(0, 80)}`);
      return { length: batch.length };
    });
    questionInserted += Array.isArray(res) ? res.length : batch.length;
    process.stdout.write(`\r    Progress: ${questionInserted}/${enrichedQuestions.length}   `);
  }
  console.log(`\n✅  Questions inserted: ${questionInserted}\n`);

  // ── Step 6: Summary ───────────────────────────────────────────────────────
  const finalQCount = await Question.countDocuments();
  const finalCCount = await Company.countDocuments();

  console.log('─────────────────────────────────────────────────');
  console.log('🎉  Seed complete!');
  console.log(`    Companies in DB   : ${finalCCount}`);
  console.log(`    Questions in DB   : ${finalQCount}`);
  console.log(`    Topics inferred   : ${inferredTopicCount}`);
  console.log('─────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
