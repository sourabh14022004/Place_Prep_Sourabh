/**
 * scrapers/group-a/clone-and-parse.ts
 *
 * Clones 4 public GitHub repos (Group A sources) into data/staging/{sourceId}/
 * and parses them into Partial<IQuestion> records for admin review before
 * MongoDB promotion.  Does NOT import any Mongoose connection or model instance.
 *
 * Usage (from repo root):
 *   ./backend/node_modules/.bin/ts-node -P scrapers/tsconfig.json \
 *     scrapers/group-a/clone-and-parse.ts --dry-run   # parse + log, no files written
 *   ./backend/node_modules/.bin/ts-node -P scrapers/tsconfig.json \
 *     scrapers/group-a/clone-and-parse.ts             # write data/staging/parsed/*.json
 *
 * Clones are idempotent — an existing data/staging/{id}/.git directory is reused.
 *
 * NOTE: data/staging/ is not in .gitignore — add it before committing.
 */

import type { IQuestion } from '../../backend/src/models/Question';
import * as fs   from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN     = process.argv.includes('--dry-run');
const REPO_ROOT   = path.resolve(__dirname, '..', '..');
const STAGING_DIR = path.join(REPO_ROOT, 'data', 'staging');
const PARSED_DIR  = path.join(STAGING_DIR, 'parsed');

// Optional --source=N flag to run a single source (e.g. --source=23)
const SOURCE_FILTER: number | null = (() => {
  const arg = process.argv.find(a => a.startsWith('--source='));
  return arg ? Number(arg.split('=')[1]) : null;
})();

// ── Source definitions ───────────────────────────────────────────────────────

interface SourceDef {
  sourceId:       number;
  name:           string;
  repoUrl:        string;
  questionType:   NonNullable<IQuestion['questionType']>;
  roundType:      string;
  sourcePriority: number;
}

// Source 17 (workattech/core-cs-os-networks-dbms) is EXCLUDED — the repo is a
// pure link index to workat.tech articles; no embedded Q&A content to parse.
// Moved to the "Excluded" section in pipeline/SOURCE-REGISTRY.md.

const SOURCES: readonly SourceDef[] = [
  {
    sourceId: 9,
    name: 'system-design-primer',
    repoUrl: 'https://github.com/donnemartin/system-design-primer',
    questionType: 'system_design',
    roundType: 'System Design',
    sourcePriority: 1,
  },
  {
    sourceId: 18,
    name: 'CrackingTheSQLInterview',
    repoUrl: 'https://github.com/xoraus/CrackingTheSQLInterview',
    questionType: 'core_cs_mcq',
    roundType: 'Domain',
    sourcePriority: 2,
  },
  {
    sourceId: 20,
    name: 'awesome-behavioral-interviews',
    repoUrl: 'https://github.com/ashishps1/awesome-behavioral-interviews',
    questionType: 'hr_behavioral',
    roundType: 'HR',
    sourcePriority: 2,
    // GPL v3 license — cautionSource: true set on every parsed record.
    // Do not promote to MongoDB without legal review if platform is commercial/closed-source.
  },
  {
    sourceId: 23,
    name: 'CSE-Aptitude-Test-Practice-Hub',
    repoUrl: 'https://github.com/rohanmistry231/CSE-Aptitude-Test-Practice-Hub',
    questionType: 'aptitude_mcq',
    roundType: 'Aptitude',
    sourcePriority: 2,
  },
];

// ── Utilities ────────────────────────────────────────────────────────────────

/** Recursively collect files with given extensions; skips hidden dirs, node_modules, images. */
function walkFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const skip = entry.name.startsWith('.') ||
                   entry.name === 'node_modules' ||
                   entry.name === 'images' ||
                   entry.name === 'assets' ||
                   entry.name === 'img';
      if (!skip) out.push(...walkFiles(path.join(dir, entry.name), exts));
    } else if (exts.some(e => entry.name.toLowerCase().endsWith(e))) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

/**
 * Detect a repo's open-source license from common license file names.
 * Reads only the first 600 chars; returns SPDX-style string or a ⚠ flagged string.
 */
function detectLicense(repoDir: string): string {
  const candidates = [
    'LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE.rst',
    'license', 'license.md', 'license.txt',
    'COPYING', 'COPYING.md',
  ];
  for (const name of candidates) {
    const p = path.join(repoDir, name);
    if (!fs.existsSync(p)) continue;
    const head = fs.readFileSync(p, 'utf8').slice(0, 600).toUpperCase();
    if (head.includes('MIT LICENSE') || /\bMIT\b/.test(head.slice(0, 80)))       return 'MIT';
    if (head.includes('APACHE LICENSE') || head.includes('APACHE-2'))             return 'Apache-2.0';
    if (head.includes('BSD 3') || head.includes('3-CLAUSE'))                      return 'BSD-3-Clause';
    if (head.includes('BSD 2') || head.includes('2-CLAUSE'))                      return 'BSD-2-Clause';
    if (head.includes('GNU LESSER') || head.includes('LGPL'))                     return 'LGPL';
    if (head.includes('GNU GENERAL') || head.includes('GPL'))                     return 'GPL';
    if (head.includes('MOZILLA PUBLIC'))                                           return 'MPL-2.0';
    if (head.includes('CREATIVE COMMONS') || head.includes('CC BY'))              return 'CC';
    if (head.includes('UNLICENSE') || head.includes('PUBLIC DOMAIN'))             return 'Unlicense';
    if (head.includes('ISC LICENSE') || /^ISC\s/.test(head))                      return 'ISC';
    return '⚠ UNKNOWN (file present, type unrecognised — manual review required)';
  }
  return '⚠ UNKNOWN (no license file found — manual review required)';
}

/** Clone a repo with --depth=1. Reuses existing clone if .git already present. */
function cloneRepo(source: SourceDef): { dir: string; license: string } {
  const dir = path.join(STAGING_DIR, String(source.sourceId));
  if (fs.existsSync(path.join(dir, '.git'))) {
    console.log(`  [cache]   data/staging/${source.sourceId}/ — skipping clone`);
  } else {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
    console.log(`  [clone]   ${source.repoUrl}`);
    console.log(`            → data/staging/${source.sourceId}/`);
    try {
      execSync(`git clone --depth=1 "${source.repoUrl}" "${dir}"`, { stdio: 'pipe' });
      console.log(`  [ok]      clone complete`);
    } catch (err: any) {
      const msg = err.stderr?.toString().trim() || err.message;
      console.error(`  [error]   git clone failed: ${msg}`);
      throw err;
    }
  }
  const license = detectLicense(dir);
  console.log(`  [license] ${license}`);
  return { dir, license };
}

// ── Base record helper ────────────────────────────────────────────────────────

function base(source: SourceDef, overrides: Partial<IQuestion> = {}): Partial<IQuestion> {
  return {
    questionType:    source.questionType,
    roundType:       source.roundType as IQuestion['roundType'],
    sourceId:        source.sourceId,
    sourcePriority:  source.sourcePriority,
    isCanonical:     true,
    isDuplicate:     false,
    verified:        false,
    manuallyCurated: false,
    ...overrides,
  };
}

/** Strip markdown emphasis, inline code, links, and collapse whitespace. */
const clean = (s: string): string =>
  s.replace(/`([^`]*)`/g, '$1')
   .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
   .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
   .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
   .replace(/\s+/g, ' ')
   .trim();

// ── Parser: Source 9 — system-design-primer ──────────────────────────────────
//
// Repo layout: README.md (giant index), solutions/<name>/README.md per problem.
// Extraction:
//   1. H2–H4 headings that start with "Design ".
//   2. Markdown table cells that start with "Design " (index tables in README).
// De-duplicated by normalised summary text.

function parseSystemDesign(repoDir: string, source: SourceDef): Partial<IQuestion>[] {
  const results: Partial<IQuestion>[] = [];
  const seen = new Set<string>();

  for (const file of walkFiles(repoDir, ['.md'])) {
    const rel = path.relative(repoDir, file);
    for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
      const line = raw.trim();

      // H2–H4 heading starting with "Design"
      const hm = line.match(/^#{2,4}\s+(Design\s.+)/i);
      if (hm) {
        // Strip parenthetical subtitles e.g. "(or Bit.ly)" for dedup key
        const summary = clean(hm[1].replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ')).trim();
        if (summary.length > 8 && !seen.has(summary)) {
          seen.add(summary);
          results.push(base(source, {
            problemSummary: clean(hm[1]),
            topics:         ['System Design'],
            difficulty:     'Hard',
            sourceUrl:      `https://github.com/donnemartin/system-design-primer/blob/master/${rel}`,
          }));
        }
        continue;
      }

      // Table row: | Design Pastebin.com (or Bit.ly) | [Solution](...) |
      const tm = line.match(/^\|\s*(Design\s[^|\[]{4,})/i);
      if (tm) {
        const summary = clean(tm[1].trim());
        if (summary.length > 8 && !seen.has(summary)) {
          seen.add(summary);
          results.push(base(source, {
            problemSummary: summary,
            topics:         ['System Design'],
            difficulty:     'Hard',
            sourceUrl:      'https://github.com/donnemartin/system-design-primer',
          }));
        }
      }
    }
  }
  return results;
}

// ── Parser: Source 18 — CrackingTheSQLInterview ──────────────────────────────
//
// SQL + DBMS interview questions in Markdown files.
// Extraction:
//   Pattern A: numbered — "1. What is SQL?" or "1) Explain..."
//   Pattern B: heading-as-question — "## What is a Primary Key?"
//   Pattern C: bold question — "**What is normalization?**"

function parseSqlDbms(repoDir: string, source: SourceDef): Partial<IQuestion>[] {
  const results: Partial<IQuestion>[] = [];
  const seen = new Set<string>();

  for (const file of walkFiles(repoDir, ['.md'])) {
    const rel   = path.relative(repoDir, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pattern A: numbered question
      const numQ = line.match(/^\d{1,3}[.)]\s+(.{8,})$/);
      if (numQ) {
        const summary = clean(numQ[1]);
        if (!seen.has(summary)) {
          let explanation = '';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const next = lines[j].trim();
            if (next && !/^\d{1,3}[.)]/.test(next) && !/^#{1,4}/.test(next)) {
              explanation = clean(next);
              break;
            }
          }
          seen.add(summary);
          results.push(base(source, {
            problemSummary: summary,
            explanation:    explanation || undefined,
            topics:         ['SQL', 'DBMS'],
            sourceUrl:      `https://github.com/xoraus/CrackingTheSQLInterview/blob/master/${rel}`,
          }));
        }
        continue;
      }

      // Pattern B: heading-as-question
      const headQ = line.match(/^#{2,4}\s+(.{8,}\?)\s*$/);
      if (headQ) {
        const summary = clean(headQ[1]);
        if (!seen.has(summary)) {
          seen.add(summary);
          results.push(base(source, {
            problemSummary: summary,
            topics:         ['SQL', 'DBMS'],
            sourceUrl:      `https://github.com/xoraus/CrackingTheSQLInterview/blob/master/${rel}`,
          }));
        }
        continue;
      }

      // Pattern C: **What is X?**
      const boldQ = line.match(/^\*{2}([^*]{8,}\?)\*{2}$/);
      if (boldQ) {
        const summary = clean(boldQ[1]);
        if (!seen.has(summary)) {
          seen.add(summary);
          results.push(base(source, {
            problemSummary: summary,
            topics:         ['SQL', 'DBMS'],
            sourceUrl:      `https://github.com/xoraus/CrackingTheSQLInterview/blob/master/${rel}`,
          }));
        }
      }
    }
  }
  return results;
}

// ── Parser: Source 20 — awesome-behavioral-interviews ────────────────────────
//
// Curated HR/STAR questions organised by category.
// Structure: H2/H3 section headings track current topic; bullet items are questions.
// Navigation headings (table of contents, links, license) are skipped.

function parseBehavioral(repoDir: string, source: SourceDef): Partial<IQuestion>[] {
  const results: Partial<IQuestion>[] = [];
  const seen = new Set<string>();
  const NAV_HEADINGS = new Set([
    'table of contents', 'contents', 'contributing', 'license',
    'resources', 'links', 'introduction', 'about',
  ]);

  for (const file of walkFiles(repoDir, ['.md'])) {
    const rel   = path.relative(repoDir, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let topic   = 'Behavioral';

    for (const raw of lines) {
      const line = raw.trim();

      const hm = line.match(/^#{2,3}\s+(.+)/);
      if (hm) {
        const h = hm[1].trim();
        if (!NAV_HEADINGS.has(h.toLowerCase())) topic = h;
        continue;
      }

      // Bullet items that are long enough to be real questions
      const bm = line.match(/^[-*]\s+(.{15,})/);
      if (bm) {
        const summary = clean(bm[1]);
        if (!seen.has(summary)) {
          seen.add(summary);
          results.push(base(source, {
            problemSummary: summary,
            topics:         [topic, 'Behavioral'],
            cautionSource:  true,  // GPL v3 — exclude from commercial promotion without legal review
            sourceUrl:      `https://github.com/ashishps1/awesome-behavioral-interviews/blob/master/${rel}`,
          }));
        }
      }
    }
  }
  return results;
}

// ── Parser: Source 23 — CSE-Aptitude-Test-Practice-Hub ───────────────────────
//
// 6,000+ aptitude questions across 6 sections.
// Sections 01/02/04/05/06: open-ended Q + **Solution**: + **Answer**: value.
// Section 03 (verbal): MCQ — options either inline in question line or on a
//   separate line. Format "A) opt1 B) opt2 C) opt3 D) opt4" on one line.
//
// Strategy:
//   1. JSON pass — look for arrays or objects with questions/records/data keys.
//      Each record may carry options[], explanation, topic, difficulty.
//   2. Markdown fallback — state-machine parser that captures:
//      - **Question**: prefix → strip it from problemSummary
//      - Inline options in question line (synonym/antonym format)
//      - Separate-line inline options (sentence completion format)
//      - **Solution**: block → explanation
//      - **Answer**: value → sampleAnswer (open-ended) or isCorrect flag (MCQ)

/** Split "A) text B) text C) text D) text" into labelled option objects. */
function splitInlineOptions(
  optStr: string
): { label: string; text: string; isCorrect: boolean }[] {
  const positions: { label: string; textStart: number; idx: number }[] = [];
  const re = /\b([A-D])\)\s+/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(optStr)) !== null) {
    positions.push({ label: m[1].toUpperCase(), textStart: re.lastIndex, idx: m.index });
  }
  return positions.map((pos, i) => ({
    label: pos.label,
    text: (i < positions.length - 1
      ? optStr.slice(pos.textStart, positions[i + 1].idx)
      : optStr.slice(pos.textStart)
    ).trim(),
    isCorrect: false,
  }));
}

function parseAptitude(repoDir: string, source: SourceDef): Partial<IQuestion>[] {
  const results: Partial<IQuestion>[] = [];
  const seen = new Set<string>();

  // ── JSON pass ──────────────────────────────────────────────────────────────
  for (const file of walkFiles(repoDir, ['.json'])) {
    if (path.basename(file) === 'package.json') continue;
    let raw: any;
    try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }

    const records: any[] = Array.isArray(raw)           ? raw
      : Array.isArray(raw.questions)                    ? raw.questions
      : Array.isArray(raw.records)                      ? raw.records
      : Array.isArray(raw.data)                         ? raw.data
      : [];

    for (const r of records) {
      const summaryRaw: string =
        r.question || r.problemSummary || r.title || r.text || r.problem || '';
      if (summaryRaw.length < 8) continue;
      const summary = clean(summaryRaw);
      const key = summary.slice(0, 140);
      if (seen.has(key)) continue;
      seen.add(key);

      const rawOpts: any[] = r.options || r.choices || [];
      const opts = rawOpts.map((o: any, idx: number) => ({
        label:     String.fromCharCode(65 + idx),
        text:      typeof o === 'string' ? o : clean(String(o.text ?? o.option ?? o)),
        isCorrect: typeof o === 'object' ? !!(o.isCorrect ?? o.correct ?? false) : false,
      }));

      results.push(base(source, {
        problemSummary: summary,
        isMcq:          opts.length > 0,
        options:        opts.length > 0 ? opts : undefined,
        explanation:    r.explanation || r.answer_explanation || r.solution || undefined,
        topics:         r.topic      ? [String(r.topic)]
                      : r.category  ? [String(r.category)]
                      : ['Aptitude'],
        difficulty:     r.difficulty ?? undefined,
        sourceUrl:      `https://github.com/rohanmistry231/CSE-Aptitude-Test-Practice-Hub/blob/master/${path.relative(repoDir, file)}`,
      }));
    }
  }

  if (results.length > 0) return results;

  // ── Markdown fallback ──────────────────────────────────────────────────────
  let currentTopic = 'Aptitude';

  for (const file of walkFiles(repoDir, ['.md'])) {
    const rel   = path.relative(repoDir, file);
    // Skip the root README — it contains boilerplate (section index, how-to
    // steps, Fork/Clone/PR instructions) that the numbered-list regex mislabels
    // as questions. Actual aptitude questions live in subdirectory READMEs only.
    if (rel === 'README.md') continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    let pendingQ    = '';
    let pendingExpl = '';
    let pendingAns  = '';
    let inSolution  = false;
    const pendingOpts: { label: string; text: string; isCorrect: boolean }[] = [];

    const flushPending = () => {
      // Include the first option text in the dedup key so that questions with
      // identical stub text ("Choose the word for 71:") but different answer
      // choices (e.g. Cloze Test across difficulty levels) are kept distinct.
      const seenKey = pendingQ + (pendingOpts.length > 0 ? '|' + pendingOpts[0].text : '');
      if (!pendingQ || seen.has(seenKey)) {
        pendingQ = ''; pendingExpl = ''; pendingAns = '';
        inSolution = false; pendingOpts.length = 0;
        return;
      }
      seen.add(seenKey);

      // For MCQ: identify the correct option from the **Answer** letter
      if (pendingOpts.length >= 2 && pendingAns) {
        const lm = pendingAns.match(/^([A-D])\b/i);
        if (lm) {
          const correct = lm[1].toUpperCase();
          for (const opt of pendingOpts) opt.isCorrect = opt.label === correct;
        }
      }

      const isMcq = pendingOpts.length >= 2;
      results.push(base(source, {
        problemSummary: pendingQ,
        isMcq,
        options:        isMcq ? [...pendingOpts] : undefined,
        explanation:    pendingExpl || undefined,
        sampleAnswer:   (!isMcq && pendingAns) ? pendingAns : undefined,
        topics:         [currentTopic],
        sourceUrl:      `https://github.com/rohanmistry231/CSE-Aptitude-Test-Practice-Hub/blob/master/${rel}`,
      }));

      pendingQ = ''; pendingExpl = ''; pendingAns = '';
      inSolution = false; pendingOpts.length = 0;
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // Heading → flush + update topic
      if (/^#{1,3}\s+/.test(line)) {
        flushPending();
        currentTopic = line.replace(/^#{1,3}\s+/, '').trim();
        inSolution = false;
        continue;
      }

      // **Answer**: / **Corrected**: line — end inSolution accumulation
      // "**Corrected**:" is used in Sentence Correction questions instead of "**Answer**:"
      if (/^\*\*(?:Answer|Corrected)\*\*:/i.test(line)) {
        pendingAns = clean(line.replace(/^\*\*(?:Answer|Corrected)\*\*:\s*/i, ''));
        inSolution = false;
        continue;
      }

      // **Solution**: line — start accumulating explanation
      if (/^\*\*Solution\*\*:/i.test(line)) {
        const rest = line.replace(/^\*\*Solution\*\*:\s*/i, '').trim();
        pendingExpl = rest;
        inSolution = true;
        continue;
      }

      // Accumulate solution body (may span multiple lines)
      if (inSolution) {
        pendingExpl = pendingExpl ? `${pendingExpl} ${line}` : line;
        continue;
      }

      // Numbered question: "1. **Question**: text" or "1. text"
      const nm = line.match(/^\d{1,4}[.)]\s+(?:\*\*Question\*\*:\s*)?(.{8,})/);
      if (nm) {
        flushPending();
        let qText = clean(nm[1]).replace(/^Question:\s*/i, '');

        // Detect inline options within the question line (synonym/antonym format)
        // e.g. "Choose the synonym for 'X': A) Plentiful B) Scarce C) Limited D) Rare"
        const inlineIdx = qText.search(/\s+A\)\s+/i);
        if (inlineIdx !== -1) {
          const optsPart = qText.slice(inlineIdx).trim();
          qText = qText.slice(0, inlineIdx).trim();
          const parsed = splitInlineOptions(optsPart);
          pendingOpts.length = 0;
          pendingOpts.push(...parsed);
        }
        pendingQ = qText;
        continue;
      }

      // Separate-line inline options: "A) opt1 B) opt2 C) opt3 D) opt4"
      // (entire line is all options on one line, starting with A)
      if (/^A\)\s+/i.test(line) && pendingQ) {
        const parsed = splitInlineOptions(line);
        if (parsed.length >= 2) {
          pendingOpts.length = 0;
          pendingOpts.push(...parsed);
          continue;
        }
      }

      // Single option line: "(A) text" | "A) text" | "A. text"
      const singleOpt = line.match(/^[(]?([A-Da-d])[.)]\s+(.+)/);
      if (singleOpt && pendingQ) {
        pendingOpts.push({ label: singleOpt[1].toUpperCase(), text: clean(singleOpt[2]), isCorrect: false });
      }
    }
    flushPending();
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────

interface RunResult {
  source:       SourceDef;
  license:      string;
  count:        number;
  cautionCount: number;
  byType:       Record<string, number>;
}

async function main(): Promise<void> {
  const W    = 80;
  const mode = DRY_RUN ? 'DRY-RUN' : 'WRITE ';
  console.log(`\n${'═'.repeat(W)}`);
  console.log(`  PlacePrep — Group A clone-and-parse                  [${mode}]`);
  console.log(`  Sources: 9 · 18 · 20 · 23  (17 excluded — link-index only)`);
  console.log(`${'═'.repeat(W)}\n`);

  if (!DRY_RUN) fs.mkdirSync(PARSED_DIR, { recursive: true });

  const runs: RunResult[] = [];

  const sourcesToRun = SOURCE_FILTER
    ? SOURCES.filter(s => s.sourceId === SOURCE_FILTER)
    : SOURCES;

  for (const source of sourcesToRun) {
    const bar = '─'.repeat(Math.max(2, 46 - source.name.length));
    console.log(`\n── Source ${source.sourceId}: ${source.name} ${bar}`);
    const { dir, license } = cloneRepo(source);

    let questions: Partial<IQuestion>[];
    switch (source.sourceId) {
      case 9:  questions = parseSystemDesign(dir, source); break;
      case 18: questions = parseSqlDbms(dir, source);      break;
      case 20: questions = parseBehavioral(dir, source);   break;
      case 23: questions = parseAptitude(dir, source);     break;
      default: questions = [];
    }

    const byType: Record<string, number> = {};
    let cautionCount = 0;
    for (const q of questions) {
      const t = q.questionType ?? 'unknown';
      byType[t] = (byType[t] ?? 0) + 1;
      if (q.cautionSource) cautionCount++;
    }

    if (DRY_RUN) {
      const cautionNote = cautionCount > 0 ? `  [${cautionCount} cautionSource=true]` : '';
      console.log(`  [dry-run] ${questions.length} records parsed — output file NOT written${cautionNote}`);

      // For source 23: show per-group counts and 3 samples from each group
      if (source.sourceId === 23) {
        const openEnded = questions.filter(q => !q.isMcq);
        const mcqQ      = questions.filter(q =>  q.isMcq);
        console.log(`\n  ── Source 23 group breakdown ──`);
        console.log(`    open-ended (isMcq:false): ${openEnded.length}`);
        console.log(`    MCQ        (isMcq:true):  ${mcqQ.length}`);

        console.log(`\n  ── Open-ended samples (up to 3) ──`);
        for (const q of openEnded.slice(0, 3)) {
          console.log(`    problemSummary: ${String(q.problemSummary).slice(0, 100)}`);
          console.log(`    explanation:    ${String(q.explanation ?? '').slice(0, 120)}`);
          console.log(`    sampleAnswer:   ${String((q as any).sampleAnswer ?? 'undefined')}`);
          console.log('');
        }

        console.log(`  ── MCQ samples (up to 3) ──`);
        for (const q of mcqQ.slice(0, 3)) {
          console.log(`    problemSummary: ${String(q.problemSummary).slice(0, 100)}`);
          console.log(`    options:        ${JSON.stringify(q.options)}`);
          console.log(`    explanation:    ${String(q.explanation ?? '').slice(0, 100)}`);
          console.log(`    correctOption:  ${(q.options ?? []).find((o: any) => o.isCorrect)?.label ?? 'none'}`);
          console.log('');
        }
      }
    } else {
      fs.mkdirSync(PARSED_DIR, { recursive: true });
      const out = path.join(PARSED_DIR, `${source.sourceId}.json`);
      fs.writeFileSync(out, JSON.stringify(questions, null, 2), 'utf8');
      const cautionNote = cautionCount > 0 ? `  [${cautionCount} cautionSource=true]` : '';
      console.log(`  [written] data/staging/parsed/${source.sourceId}.json  (${questions.length} records)${cautionNote}`);
    }

    runs.push({ source, license, count: questions.length, cautionCount, byType });
  }

  // ── Summary table ────────────────────────────────────────────────────────
  const total = runs.reduce((s, r) => s + r.count, 0);
  console.log(`\n${'═'.repeat(W)}`);
  console.log(`  GROUP A  ·  PARSE SUMMARY  ·  [${mode}]`);
  console.log(`${'═'.repeat(W)}`);
  console.log(
    `  ${'ID'.padEnd(4)}  ${'Repo'.padEnd(32)}  ${'License'.padEnd(14)}  ${'Q#'.padStart(6)}  ${'⚠caution'.padStart(9)}  Type`
  );
  console.log(`  ${'─'.repeat(W - 2)}`);

  for (const { source, license, count, cautionCount, byType } of runs) {
    const licShort = license.startsWith('⚠')
      ? '⚠ ' + license.slice(2, 14) + '…'
      : license.padEnd(14);
    const breakdown = Object.entries(byType)
      .map(([t, n]) => `${t.replace('_', '-')}:${n}`)
      .join('  ');
    const caution = cautionCount > 0 ? String(cautionCount).padStart(9) : '         ';
    console.log(
      `  ${String(source.sourceId).padEnd(4)}  ${source.name.slice(0, 31).padEnd(32)}  ${licShort.padEnd(14)}  ${String(count).padStart(6)}  ${caution}  ${breakdown}`
    );
  }

  console.log(`  ${'─'.repeat(W - 2)}`);
  const totalCaution = runs.reduce((s, r) => s + r.cautionCount, 0);
  const cautionCell  = totalCaution > 0 ? String(totalCaution).padStart(9) : '         ';
  console.log(`  ${'TOTAL'.padEnd(4)}  ${' '.padEnd(32)}  ${' '.padEnd(14)}  ${String(total).padStart(6)}  ${cautionCell}`);
  console.log(`${'═'.repeat(W)}`);

  // License warnings (unknown license files)
  const flagged = runs.filter(r => r.license.startsWith('⚠'));
  if (flagged.length > 0) {
    console.log('\n  ⚠  LICENSE REVIEW REQUIRED before promoting these sources to MongoDB:');
    for (const { source, license } of flagged)
      console.log(`     source ${source.sourceId} (${source.name}): ${license}`);
  }

  // cautionSource summary
  if (totalCaution > 0) {
    const cautionSources = runs.filter(r => r.cautionCount > 0);
    console.log('\n  ⚠  CAUTION SOURCES — do not promote without legal review for commercial launch:');
    for (const { source, cautionCount } of cautionSources)
      console.log(`     source ${source.sourceId} (${source.name}): ${cautionCount} records — cautionSource=true`);
  }

  console.log(
    DRY_RUN
      ? `\n  No files written. Re-run without --dry-run to write data/staging/parsed/*.json\n`
      : `\n  Done. Review data/staging/parsed/ before promoting to MongoDB.\n`
  );
}

main().catch(err => { console.error('\n[fatal]', err); process.exit(1); });
