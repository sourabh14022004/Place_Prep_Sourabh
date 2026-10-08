# Data

Storage and metadata for PlacePrep datasets at various stages of extraction, normalization, and promotion.

---

## Directory Organization

```
data/
├── filtered-output/         # Curated, normalized datasets & execution reports
│   ├── companies.json       # Cleaned company profiles with round structures
│   ├── questions.json       # Normalized question pool with topic tags
│   └── report.md            # Ingestion metrics and quality audit report
└── raw/                     # (Gitignored) Raw platform scrapes and dumps
```

---

## Data Lifecycle

```
scrapers/ → raw/ → filtered-output/ → MongoDB Atlas Database → PlacePrep API
```

1. **Extraction**: Source scrapers dump platform records into temporary staging.
2. **Filtering & Deduplication**: Outliers, duplicates, and malformed entries are filtered into `filtered-output/`.
3. **Promotion**: Validated datasets are bulk-loaded into MongoDB Atlas using `backend/scripts/seedRealData.js`.

---

## Data Policy

- **Version Control**: Large raw data files are excluded via `.gitignore` to keep repository size lean.
- **Integrity**: Standardized JSON schemas are validated against Mongoose models before insertion.
