# PlacePrep — Scraping Source Registry

> Canonical mapping of sourceId → repo → questionType for the scraping pipeline.
> Update this file whenever a new source is confirmed before writing any scraper code.
> `sourceId` is stored on every Question document in MongoDB (`Question.sourceId`).
> License column is auto-detected by `scrapers/group-a/clone-and-parse.ts` on first clone;
> update the value below after each initial run.

---

## Group A — Active (public GitHub repos, parseable Markdown/JSON content)

| sourceId | Name | Repo URL | questionType | License | cautionSource | Status |
|---|---|---|---|---|---|---|
| 9  | System Design Primer | https://github.com/donnemartin/system-design-primer | `system_design` | CC BY 4.0 | — | ✅ Active |
| 18 | SQL + DBMS Interview Questions | https://github.com/xoraus/CrackingTheSQLInterview | `core_cs_mcq` | MIT | — | ✅ Active |
| 20 | Awesome Behavioral Interviews | https://github.com/ashishps1/awesome-behavioral-interviews | `hr_behavioral` | **GPL v3** | **true** | ✅ Active (caution — see below) |
| 23 | CSE Aptitude 6,000+ Questions | https://github.com/rohanmistry231/CSE-Aptitude-Test-Practice-Hub | `aptitude_mcq` | MIT | **true (MCQ sub-section)** | ✅ Active (caution — see below) |

> **Source 23 caution:** Verbal MCQ sub-section (132 records, `isMcq: true`) has a data-quality defect —
> all correct answers are hardcoded to option B in the original source repository.
> Flagged with `cautionSource: true` in MongoDB; records are retained and visible to students.
> Consider replacing with a Group B source if verbal aptitude MCQs are prioritized later.

> **Source 20 caution:** `ashishps1/awesome-behavioral-interviews` carries a **GPL v3** license.
> GPL's copyleft applies primarily to software distribution, but its application to data/content
> is legally ambiguous for closed-source commercial platforms.
> All records parsed from this source have `cautionSource: true` set in the JSON staging file.
> **Do not promote source 20 to MongoDB without legal review before a commercial launch.**
> Safe to include in the internal/staging pipeline in the meantime.

---

## Group A — Excluded

| sourceId | Name | Repo URL | Reason |
|---|---|---|---|
| 17 | Core CS — OS / Networks / DBMS | https://github.com/workattech/core-cs-os-networks-dbms | No parseable content — repo is a pure link index to an external site (workat.tech), not embedded Q&A. Revisit as a Group B/C web-scraping target later, or substitute source 19 (avinash201199/Interviews-Resources) as an alternative Core CS source in a future pass. |

---

## Legal / ToS Notes (from source doc Section 3)

- **Never build:** Naukri.com or InterviewBit scrapers — ToS explicitly prohibits automated scraping.
- All Group A active sources above are public GitHub repos. The script auto-detects and flags
  `UNKNOWN` licenses for manual review. Known-license sources with restrictions (GPL) are
  tagged `cautionSource: true` on every parsed record.

---

## Pipeline flow these sources feed into

```
scrapers/group-a/clone-and-parse.ts
  └── clones each repo to /data/staging/{sourceId}/     (--depth=1, idempotent)
  └── detects license from LICENSE file
  └── parses Markdown/JSON into Partial<IQuestion> shape
  └── sets cautionSource: true on records from GPL-licensed sources
  └── writes /data/staging/parsed/{sourceId}.json

(promotion to MongoDB is a separate step — admin UI review first)
```

> **Note:** `data/staging/` is not currently in `.gitignore`.
> Add `data/staging/` to `.gitignore` before committing — cloned repos are large.
