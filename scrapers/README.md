# Scrapers

Source-specific scrapers and parsers for extracting public interview data, company hiring patterns, and technical questions.

---

## Directory Layout

```
scrapers/
├── group-a/                 # Implemented scrapers & parsers for core sources
│   ├── parser.ts            # Raw dump normalizer & extractor
│   └── promote-to-mongo.ts  # Validation & database loader
├── utils/                   # Shared rate-limiting & crawling utilities
└── tsconfig.json
```

---

## Data Collection & Ingestion Status

- **Completed Dataset (`group-a`)**:
  - Over **22,750+ questions** and **670+ companies** processed and seeded into production MongoDB Atlas.
  - Includes company-tagged DSA questions, LeetCode problem mappings, and generic computer science interview questions.
- **Candidate Platforms for Expansion**:
  - LeetCode Discuss & problem metadata
  - GeeksforGeeks interview experiences
  - HackerRank challenge metadata
  - InterviewBit company sets
  - Codeforces contest problem catalogs
  - AmbitionBox & Glassdoor interview question logs

---

## Output Format & Schema Alignment

Scraped and parsed records are normalized before promotion:

```json
{
  "company": "Amazon",
  "role": "SDE-1",
  "round_type": "coding",
  "topic": "Dynamic Programming",
  "problem_summary": "Word Break Problem",
  "difficulty": "Medium",
  "leetcode_url": "https://leetcode.com/problems/word-break/",
  "source_url": "https://...",
  "frequency_score": 0.85
}
```

---

## Ethical Scraping Guidelines

1. **Strict Rate Limiting**: All crawlers must implement respectful delays to avoid putting pressure on external servers.
2. **Public Content Only**: Crawling is strictly restricted to publicly available pages. Never scrape behind authentication walls.
3. **Robots.txt & ToS Compliance**: Verify robots.txt and site terms prior to building scrapers.
