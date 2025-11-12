# Citations Schema Documentation

## Page Number Handling

Citations.json tracks **both book page numbers and PDF page numbers** to avoid confusion:

### Key Fields

#### In `references`:
- **`pageOffset`** (number): Offset between PDF pages and book pages
  - Formula: `PDF page = book page + pageOffset`
  - Example: Nesterov 2018 has `pageOffset: 20`, so book page 81 = PDF page 101

#### In `citations`:
- **`pages`** (string): **Book/publication page numbers** (user-facing, scholarly standard)
  - This is what appears in the rendered citation reports
  - This is what scholars reference
  - Example: `"81-82"` for Theorem 2.1.15

- **`pdfPages`** (string): **PDF page numbers** (for extraction scripts)
  - This is what extraction scripts use directly
  - This is what appears in proof page filenames
  - Example: `"101-102"` corresponds to `lectures_on_convex_optimization_page_0101.png`

### Verified Offsets

| Reference | PDF ID | Page Offset | Example |
|-----------|--------|-------------|---------|
| nesterov-2018 | lectures_on_convex_optimization | 20 | PDF 101 = book 81 |
| nocedal-wright-2006 | numericaloptimization2006 | 20 | PDF 33 = book 13 |
| liu-nocedal-1989 | liunocedal1989 | 1 | PDF 21 = book 20 |
| branin-1972 | branin1972 | 503 | PDF 1 = publication 504 |
| rosenbrock-1960 | rosenbrock1960 | 174 | PDF 1 = publication 175 |

### Why Both Fields?

1. **Agents working with chunks** see PDF page numbers in filenames and should specify `pdfPages` directly
2. **Users and scholars** always reference book/publication page numbers
3. **No automatic conversion** - scripts use whichever field is appropriate
4. **Clear semantics** - no confusion about which number is which

### Example Citation

```json
{
  "citations": {
    "gd-strongly-convex-linear-convergence-nesterov-2018": {
      "reference": "nesterov-2018",
      "pages": "81-82",       // Book pages (shown to users)
      "pdfPages": "101-102",  // PDF pages (for extraction)
      "theorem": "Theorem 2.1.15",
      "proofPages": [
        "docs/references/extracted-pages/lectures_on_convex_optimization_page_0101.png"
      ]
    }
  },
  "references": {
    "nesterov-2018": {
      "title": "Lectures on Convex Optimization",
      "file": "Lectures on Convex Optimization.pdf",
      "pageOffset": 20  // PDF page - book page
    }
  }
}
```

### Script Behavior

- **`scripts/render-citations.ts`**: Uses `pages` (book pages) for user-facing reports
- **`scripts/extract-citation-pages.py`**: Uses `pdfPages` (PDF pages) for extraction
- **`scripts/extract-pdf-pages.py`**: Takes PDF pages as input directly
- **Proof page filenames**: Always contain PDF page numbers (e.g., `_page_0101.png`)

### Important Notes

- Journal articles (branin1972, rosenbrock1960) use **publication page numbers** as book pages
- These may not correspond to actual PDF pages since journal PDFs often start at page 1
- For journal articles, `pageOffset` represents the offset to publication page numbers
