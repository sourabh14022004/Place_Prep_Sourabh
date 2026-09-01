# PlacePrep Question Dataset — Filtering & Enrichment Report

## What was asked
Filter all 90,871 questions from the PlacePrep dataset by topic, frequency, and company; fill in gaps (especially missing company data) using real sources rather than guesses; deliver a fully filtered, pre-processed dataset.

## What I found before filtering anything
Before enriching, I audited the underlying source repos directly (cloned the actual GitHub repos the original scrape pulled from) rather than trusting the existing ndjson at face value. That audit turned up problems bigger than "missing fields":

1. **~11,308 rows (12.4% of the dataset) are Codeforces competitive-programming problems**, not company interview questions. They have no company by nature — assigning one would be fabrication. Kept, but explicitly labeled `Not Company-Specific (Codeforces Practice Problem)`.
2. **3,300 rows from the `andmev/interview-question-with-context` source are not interview questions at all.** Sampling them turned up things like "What is the best way to get more protein in my diet?" and "Who is the author of Atomic Habits?" — a generic trivia/instruction dataset that got ingested by mistake. **Excluded entirely** rather than tagged with a fake topic/company.
3. **The `FAANG-Coding-Interview-Questions` source (3,721 rows) was scraped by naively splitting every line of every markdown file**, capturing prose paragraphs, table syntax, and TOC links as if they were questions (e.g. `"Guide to Building AI Agents"`, `"[What is an AI Agent?](...)"`). About 67% of that source was junk. I re-parsed the repo's own structured tables (`FAANG-Recent-Questions.md`, `AI-Companies-Interview-Questions.md`, `Blind-75.md`, `NeetCode-150.md`), which have real per-problem company and difficulty columns maintained by the repo author. That recovered **1,451 genuinely company/topic/difficulty-attributed questions** (expanded to 2,172 rows when a question is tagged with multiple companies), replacing the original 3,721 junk rows.
4. **`DSA-Must-Do-Questions` (1,790 rows) had the same failure mode** — only 51 real problems exist in that repo; the rest were editorial/solution-code text scraped as if each line were its own question. Rebuilt from the repo's actual 51 problem folders.
5. **The "631 Topics" figure you were originally given is not a real taxonomy.** Every single one of those 631 records is a translated section heading from one multi-language README (Indonesian, Vietnamese, Uzbek, etc. copies of "You won't remember it all"), not a distinct topic. The dataset's real, usable topic taxonomy has **47 topics** — that's what all topic filtering below actually uses.
6. **~9,850 more rows** across the JavaScript/React/front-end-handbook/SQL/system-design-primer sources were code fragments, markdown table separators, or non-English duplicate text rather than real Q&A content. Filtered out (full list in `06_excluded_non_question_rows.csv` for transparency — nothing was silently deleted).

## What I did about company and topic gaps
- **Company**: Real company names were already present for the two big LeetCode company-wise sources (47,017 rows, unchanged). For sources that are inherently not company-specific (JS/React/SQL/ML/behavioral question banks, DSA practice repos, Codeforces), I did **not** invent a company — I labeled them explicitly (`General / Not Company-Specific` or the Codeforces label above) so every row is filled without any row claiming a company that never asked it. I *did* recover ~2,172 real, source-attributed company questions from the FAANG repo re-parse (item 3 above) that were previously blank.
- **Topic**: Backfilled from four real sources, in this priority order: (a) the question's own original tag, (b) an exact-title match against LeetCode's official 2,913-problem tag dataset, (c) the source repo's own structure (folder names, table category columns), (d) a deterministic keyword match against the project's 47-topic taxonomy. Where none of those applied, the topic is left blank in `05_unresolved_gaps.csv` — not guessed.
- **Difficulty**: Backfilled from the question's original value, LeetCode's official difficulty data, or the source repo's own difficulty column. Many non-DSA questions (SQL, JS, React, behavioral, system design) simply don't have an Easy/Medium/Hard rating in any real source — those are left blank rather than assigned arbitrarily.

## Final numbers
| | Original | Delivered |
|---|---|---|
| Total rows | 90,871 | 77,785 (valid questions) |
| Rows with company filled | 47,017 (51.7%) | 77,785 (100% — either a real company or an explicit "not company-specific" label) |
| Rows with a topic | 37,829 (41.6%) | 69,017 (88.7%) |
| Rows with difficulty | 59,867 (65.9%) | 61,692 (79.3%) |
| Usable topic taxonomy | 631 (fake) | 47 (real) |

Net row count dropped because ~9,850 non-question artifacts and the 3,300-row off-topic trivia source were removed, and the FAANG/DSA-Must-Do sources were rebuilt from cleaner underlying data (fewer but real rows) rather than inflated by scraped fragments.

## Files delivered
- **`placeprep_questions_filtered.xlsx`** — everything below as one workbook (README tab included).
- `01_master_questions_filtered.csv` — all 77,785 valid questions: company, topic(s), difficulty, question type, times this exact question was asked by that company, and where each value came from.
- `02_company_topic_frequency.csv` — company × topic question-count pivot ("which company asks which topic how often").
- `03_topic_summary.csv` — total questions and distinct companies per topic, dataset-wide.
- `04_company_summary.csv` — total questions, topic spread, and top 5 topics per company, for all 710 companies (684 original + new ones recovered from the FAANG repo, e.g. OpenAI, Anthropic, xAI).
- `05_unresolved_gaps.csv` — the ~14,700 rows still missing a topic and/or difficulty after enrichment, kept visible rather than hidden.
- `06_excluded_non_question_rows.csv` — everything removed from the original 90,871 and why (code fragments, TOC/table syntax, non-English duplicates, the off-topic trivia source).

## What I deliberately did not do
I did not run an individual web search for each of the ~43,854 originally company-blank rows. Most of them come from question banks (JS/React/SQL/ML repos) that were never company-tagged at the source — there is no factual answer to "which company asked this generic JavaScript closures question," and guessing one would be fabrication, which you explicitly told me not to do. Where real, source-backed company attribution existed (the FAANG repo's own company tables), I recovered and used it.
