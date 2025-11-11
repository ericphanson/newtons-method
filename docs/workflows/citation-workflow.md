# Citation Workflow

This document describes the citation system for academic references in this project.

## Overview

The system allows accurate citations from PDF sources while respecting context window limits for AI agents.

## Recommended Primary Reference

**For gradient descent, convex optimization, and first-order methods, prefer Nesterov 2018** as the primary reference:

- **Nesterov, Yurii. "Lectures on Convex Optimization" (2nd Edition, 2018)** - `nesterov-2018`
  - Most comprehensive and up-to-date treatment (603 pages)
  - Refined notation and more precise theorem statements
  - Better typography and presentation than the 2004 edition
  - PDF ID: `lectures_on_convex_optimization`

**📖 See the [Nesterov 2018 Quick Reference Guide](citation-workflow-appendix-nesterov-2018-guide.md)** for:
- Chapter-by-chapter organization
- Where to find specific definitions and theorems
- Notation guide and search strategies
- Page number mappings

**Other references:**
- **Nocedal & Wright 2006** - For quasi-Newton methods, line search, trust regions
- **Boyd & Vandenberghe 2004** - For constrained optimization, duality, applications
- **Liu & Nocedal 1989** - Original L-BFGS paper

## Directory Structure

```
docs/
├── references/              # ❌ GITIGNORED - local only, not committed
│   ├── *.pdf               #    Source PDFs (local only)
│   ├── chunks/             #    Text extracted from PDFs (generated locally)
│   ├── extracted-pages/    #    PNG images of pages (generated on-demand)
│   └── chunk-index.json    #    Index of all chunks (generated locally)
├── citations.json          # ✅ COMMITTED - verified citation registry
└── CITATION_WORKFLOW.md    # ✅ COMMITTED - this documentation
```

**Important**: The entire `docs/references/` directory is gitignored. This means:
- You need the source PDFs locally to use this system
- Run `python3 scripts/chunk-pdfs.py` after cloning to generate chunks
- Only `citations.json` is committed to the repository

## Workflow

### 1. Search for Content in Text Chunks

First, search the text chunks to find approximately where your content is located:

```bash
# See what PDFs are available
cat docs/references/chunk-index.json | jq 'keys'

# List available PDFs with metadata
cat docs/references/chunk-index.json | jq 'to_entries[] | {id: .key, file: .value.source_file, pages: .value.total_pages}'
```

**Available PDFs:**
- `lectures_on_convex_optimization` - **⭐ Nesterov 2018, Lectures on Convex Optimization (603 pages)** - RECOMMENDED
- `numericaloptimization2006` - Nocedal & Wright, Numerical Optimization (684 pages)
- `boyd_vandenberghe-2004-convex_optimization` - Boyd & Vandenberghe, Convex Optimization (730 pages)
- `introductory-lectures-on-convex-programming-yurii-nesterov-2004_ocr` - Nesterov 2004, Convex Programming (253 pages)
- `liunocedal1989` - Liu & Nocedal, Limited Memory BFGS (27 pages)

Each chunk file contains 10 pages of text with clear page markers. Read the chunk files to find relevant content:

```bash
# Example: Read pages 1-10 from Liu & Nocedal
cat docs/references/chunks/liunocedal1989/liunocedal1989_pages_0001-0010.txt
```

### 2. Extract Actual PDF Pages for Verification

Once you've found the approximate location, extract the actual PDF pages to verify the content (especially mathematical formulas which may have OCR errors):

```bash
# Extract single page
python3 scripts/extract-pdf-pages.py liunocedal1989 5

# Extract page range
python3 scripts/extract-pdf-pages.py numericaloptimization2006 27-30

# Extract multiple pages and ranges
python3 scripts/extract-pdf-pages.py boyd_vandenberghe-2004-convex_optimization 100,105-107,200

# Higher resolution for detailed math
python3 scripts/extract-pdf-pages.py --dpi 200 numericaloptimization2006 50
```

The extracted images will be saved to `docs/references/extracted-pages/` and can be read by agents.

### 3. Create Verified Citations

Once you've verified the exact page and content, add the citation to `docs/citations.json` following this format:

```json
{
  "references": {
    "nesterov-2018": {
      "title": "Lectures on Convex Optimization",
      "authors": ["Yurii Nesterov"],
      "year": 2018,
      "edition": "2nd",
      "publisher": "Springer",
      "file": "Lectures on Convex Optimization.pdf"
    }
  },
  "citations": {
    "gd-strongly-convex-linear-convergence-nesterov-2018": {
      "reference": "nesterov-2018",
      "pages": "101-102",
      "theorem": "Theorem 2.1.15",
      "claim": "Gradient descent with fixed step size achieves linear convergence...",
      "quote": "If $f \\in \\mathscr{S}_{\\mu,L}^{1,1}(\\mathbb{R}^n)$ and $0 < h \\leq \\frac{2}{\\mu+L}$, then...",
      "notes": "Internal: Used in GdFixedTab. This is the 2018 edition result with refined notation.",
      "readerNotes": "The notation $\\mathscr{S}_{\\mu,L}^{1,1}(\\mathbb{R}^n)$ denotes strongly convex functions with strong convexity parameter $\\mu > 0$ and Lipschitz continuous gradient with constant $L$ (see Definition 2.1.3 on page 94). Note: Nesterov uses $h$ for step size; here we use $\\alpha$...",
      "proofPages": [
        "docs/references/extracted-pages/lectures_on_convex_optimization_page_0093.png",
        "docs/references/extracted-pages/lectures_on_convex_optimization_page_0094.png",
        "docs/references/extracted-pages/lectures_on_convex_optimization_page_0101.png",
        "docs/references/extracted-pages/lectures_on_convex_optimization_page_0102.png"
      ],
      "verified": "2025-11-11",
      "verifiedBy": "claude-code-agent",
      "verificationNotes": "Verified Theorem 2.1.15 (pages 101-102) and Definition 2.1.3 (page 94)...",
      "usedIn": ["GdFixedTab"]
    }
  }
}
```

**Citation Fields:**

**Required:**
- `reference`: ID from the references section
- `pages`: Page number(s) where the result appears
- `claim`: Your interpretation/application of the result
- `quote`: Exact quote from the source
- `proofPages`: Array of relative paths to extracted PNG images of the relevant pages (must have at least one)
- `verified`: Date when citation was verified (YYYY-MM-DD format)
- `verifiedBy`: Who verified this citation (agent name or human name)
- `verificationNotes`: Brief summary of what was verified and any important findings
- `usedIn`: Array of components/tabs using this citation (must have at least one)

**Optional:**
- `theorem`: Theorem/Lemma/Corollary number for easy reference (highly recommended)
- `notes`: Internal notes for developers/agents (not shown to readers) - e.g., which component uses this, cross-references to code
- `readerNotes`: Public-facing explanations shown on the website (highly recommended) - e.g., notation definitions, prerequisites, notation translations for fact-checking

**Language Style for readerNotes:**
- Avoid phrases like "in our implementation" or "in our codebase"
- Use direct language: "we use α" instead of "we use α in our implementation"
- If referring to the website: "here we use α" instead of "in our codebase we use α"
- Keep language concise and reader-focused

**Mathematical Notation:**

Use LaTeX syntax with `$...$` delimiters for all mathematical expressions in `claim`, `quote`, and `readerNotes` fields:

```json
{
  "claim": "Gradient descent achieves linear convergence when $0 < \\alpha < 2/(L+\\mu)$",
  "quote": "Let $f \\in S^{1,1}_{\\mu,L}(\\mathbb{R}^n)$ and $0 < h < 2/L$...",
  "readerNotes": "The notation $S^{1,1}_{\\mu,L}(\\mathbb{R}^n)$ denotes..."
}
```

**Important:**
- **Always use LaTeX, NOT Unicode** - Write `$\\alpha$` instead of `α`, `$\\mu$` instead of `μ`
- **Use LaTeX for all math** - Even single variables: `$m$`, `$L$`, `$\\nabla f$`
- **Double-escape backslashes** - JSON requires `\\alpha` not `\alpha`
- **Validation is automatic** - Invalid KaTeX will fail the build with clear error messages

Common LaTeX patterns:
- Greek letters: `$\\alpha$`, `$\\mu$`, `$\\nabla$`
- Subscripts: `$x_k$`, `$\\mu,L$` → $x_k$, $μ,L$
- Superscripts: `$k^2$`, `$S^{1,1}_{\\mu,L}$`
- Fractions: `$\\frac{2}{L+\\mu}$`
- Sets: `$\\mathbb{R}^n$`
- Inequalities: `$0 < \\alpha < 2/L$`
- Norms: `$\\|x\\|$`, `$\\|\\nabla f\\|$`

**Why LaTeX over Unicode?**
- Consistent rendering across all browsers and devices
- Better visual quality (KaTeX renders proper math fonts)
- Easier to search and edit (plain text `\alpha` vs Unicode `α`)
- Automatic validation catches typos immediately
- Semantic meaning preserved (Unicode `μ` is just a character, `$\mu$` is a mathematical symbol)

**Validation:**

All citations are automatically validated during `npm run dev` and `npm run build`. The validator checks:
- All required fields are present
- No required fields have null or empty values
- Arrays (`proofPages`, `usedIn`) are non-empty
- Date format is YYYY-MM-DD
- **KaTeX math expressions** in `claim`, `quote`, and `readerNotes` are valid

To manually validate: `npm run validate-citations`

If you have invalid KaTeX, you'll see an error like:
```
❌ Found 1 validation error:

Citation: "gd-strongly-convex-linear-convergence"
  - Invalid KaTeX in field 'claim': $0 < \apha < 2/L$
    Error: KaTeX parse error: Undefined control sequence: \apha
```

## Scripts Reference

### `chunk-pdfs.py`

Processes all PDFs in `docs/references/` and creates text chunks:

```bash
python3 scripts/chunk-pdfs.py
```

This regenerates all chunks and updates the index. Run this when you add new PDFs.

### `extract-pdf-pages.py`

Extracts specific pages as PNG images for verification:

```bash
python3 scripts/extract-pdf-pages.py <pdf_id> <pages>

# Options:
#   --dpi DPI              Image resolution (default: 150)
#   --output-dir DIR       Custom output directory
```

## For AI Agents

### Source Selection Priority

When searching for citations, follow this priority:

1. **First choice: Nesterov 2018** (`lectures_on_convex_optimization`)
   - For: Gradient descent, convex functions, strongly convex functions, first-order methods, convergence rates
   - See the [Quick Reference Guide](citation-workflow-appendix-nesterov-2018-guide.md) for chapter organization

2. **Nocedal & Wright 2006** (`numericaloptimization2006`)
   - For: Quasi-Newton methods (BFGS, L-BFGS), line search, trust regions, conjugate gradient

3. **Boyd & Vandenberghe 2004** (`boyd_vandenberghe-2004-convex_optimization`)
   - For: Constrained optimization, duality theory, specific applications (SVM, control, etc.)

4. **Original papers** (e.g., `liunocedal1989`)
   - For: Historical context or when the original formulation is specifically needed

### Citation Workflow

When searching for citations:

1. **Read the chunk index** to understand available sources:
   ```
   docs/references/chunk-index.json
   ```

2. **Search text chunks** to find approximate location (use grep or read specific chunks)

3. **Extract PDF pages** using `extract-pdf-pages.py` to verify exact content, especially for:
   - Mathematical formulas
   - Theorems and proofs
   - Figures and diagrams
   - Exact wording for quotes

4. **Read the extracted PNG images** to see the properly rendered content

5. **Create accurate citations** with verified page numbers

## Best Practices

### Search Strategy

When searching for a specific result:

1. **Start broad**: Search for individual concepts separately
   - Example: Search "strongly convex" and "linear convergence" separately first
   - This helps you find the right chapter/section

2. **Narrow down**: Combine search terms once you've found the general area
   - Example: Search "strongly convex" AND "gradient descent"

3. **Check multiple sources**: If one source doesn't have it, try another
   - Different textbooks may present the same result with different notation

4. **Read surrounding context**: Don't just read the theorem
   - Check the definitions section for notation (e.g., what does S^(1,1)_μ,L mean?)
   - Read the proof or remarks for additional insights
   - Note any prerequisites or assumptions

### Understanding Mathematical Notation

When working with mathematical content:

1. **Always verify visually**: OCR can mangle mathematical symbols
   - Greek letters (α, μ, ∇) may be incorrect in text chunks
   - Subscripts and superscripts often have errors
   - Extract and read the actual PDF pages for math-heavy content

2. **Document notation translations**: Note any differences between:
   - The source notation and your application (e.g., h vs α for step size)
   - Multiple sources using different symbols for the same concept

3. **Pay attention to details**: Small notation differences can be significant
   - Example: 2/L vs 2/(L+μ) for strongly convex vs merely convex functions
   - The presence or absence of parameters like μ changes the result

### Citation Quality Checklist

Before adding a citation, verify:

- [ ] Page numbers are exact and verified from PDF images
- [ ] Quote is word-for-word accurate (copy from PDF if possible)
- [ ] Mathematical notation is correct (verified visually)
- [ ] Any notation translations are documented in `notes`
- [ ] Prerequisites and assumptions are noted
- [ ] The theorem/result actually supports your claim

## Efficiency Tips

### Batch Page Extraction

If you need to check multiple related theorems or definitions, extract all pages at once:

```bash
# Instead of multiple extractions:
# python3 scripts/extract-pdf-pages.py lectures_on_convex_optimization 94
# python3 scripts/extract-pdf-pages.py lectures_on_convex_optimization 101
# python3 scripts/extract-pdf-pages.py lectures_on_convex_optimization 102

# Extract all at once:
python3 scripts/extract-pdf-pages.py lectures_on_convex_optimization 94,101-102
```

### Reusing Proof Pages

If multiple citations reference the same pages (e.g., Theorem 2.1.14 and 2.1.15 both on pages 86-87):
- Extract the pages once
- Reuse the same paths in `proofPages` for all citations
- Add context pages (like notation definitions) to all related citations

### Citation Key Naming Convention

Use descriptive, hierarchical keys:

**Format**: `[algorithm]-[property]-[result-type]`

**Examples:**
- `gd-strongly-convex-linear-convergence`
- `gd-convex-sublinear-convergence`
- `lbfgs-memory-complexity`
- `armijo-sufficient-decrease-condition`

**Guidelines:**
- Use lowercase with hyphens
- Start with algorithm/method abbreviation
- Include key properties (strongly-convex, smooth, etc.)
- End with the type of result (convergence, complexity, condition, etc.)

## Common Challenges and Solutions

### Challenge: OCR Errors in Mathematical Notation

**Problem**: Mathematical formulas in text chunks often have OCR errors (e.g., F_L^{1,1} may be garbled).

**Solution**:
- Use text chunks for **locating** theorems (search by keywords)
- Always use PDF images for **extracting exact quotes**
- Never copy mathematical notation from text chunks - always verify visually

### Challenge: Complex vs. Simplified Statements

**Problem**: Some theorems have complex technical statements, but there are simpler corollaries.

**Guidance**:
- If a corollary directly states the result you need, prefer quoting the corollary
- Document the relationship in `notes` (e.g., "Corollary 2.1.2 simplifies Theorem 2.1.14")
- Include both theorem and corollary numbers if relevant
- Make sure the simplified version still supports your exact claim

### Challenge: Related Results on Same Pages

**Problem**: Multiple related theorems may appear on the same pages (e.g., Theorem 2.1.14 and 2.1.15 both on pages 86-87).

**Solution**:
- Clearly specify which theorem in the `theorem` field
- In `notes`, document how this result differs from related theorems
- This helps prevent confusion when multiple citations reference the same pages

## Why This Approach?

- **Context-efficient**: Agents read only relevant chunks/pages, not entire PDFs
- **Accurate**: Visual verification prevents OCR errors in citations
- **Verifiable**: Every citation includes exact page numbers and quotes
- **Maintainable**: Text chunks make content searchable; images verify accuracy
