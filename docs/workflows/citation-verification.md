# Citation Verification Workflow

This document describes the process for verifying existing citations to ensure accuracy and completeness.

## Purpose

Every citation in `docs/citations.json` should be independently verified to ensure:
- The quote is accurate and properly attributed
- The page numbers are correct
- The claim matches what the source actually says
- Mathematical notation is correctly transcribed
- All necessary context and prerequisites are documented

## Quick Reference

**New to verification?** Follow the steps below in order. **Experienced verifier?** Jump to these sections:
- [Page Numbering (PDF vs Book)](#step-2-read-the-proof-pages) - Understanding page number differences
- [Quote Formatting & Ellipsis](#step-2-read-the-proof-pages) - When [...] is acceptable, algorithm linearization
- [Multiple Equation References](#step-2-read-the-proof-pages) - Citations referencing many equations
- [Context Page Ranges](#step-3-check-context-and-prerequisites) - When to stop adding pages (with examples)
- [OCR Chunk Navigation](#step-3-check-context-and-prerequisites) - Mapping pages to OCR files
- [**Claim vs Quote Consistency**](#step-4-verify-the-claim) - **CRITICAL: Check claim matches quote** ⚠️
- [Handling Discrepancies](#step-45-handle-discrepancies) - Strict inequalities, notation differences
- [Troubleshooting](#troubleshooting-common-issues) - Common problems and solutions
- [Batch Verification](#batch-verification) - Prioritization and parallel processing

## Verification Process

### Step 1: Select a Citation to Verify

Review the citations in `docs/citations.json`:

```bash
# List all citations
cat docs/citations.json | jq '.citations | keys'

# View a specific citation
cat docs/citations.json | jq '.citations["gd-strongly-convex-linear-convergence"]'
```

### Step 2: Read the Proof Pages

Every citation should have `proofPages` - an array of extracted PDF page images. Read these first:

```bash
# Example: Read the proof pages for a citation
cat docs/citations.json | jq -r '.citations["gd-strongly-convex-linear-convergence"].proofPages[]'
```

**IMPORTANT - Page Numbering:**
- The `pages` field in citations uses **printed book page numbers** (the numbers visible in the book's headers/footers)
- The `proofPages` array uses **PDF page numbers** (the physical page index in the PDF file)
- These often differ by 10-30 pages due to frontmatter (cover, title page, preface, table of contents, etc.)
- Example: Book page "177" might be PDF page 197 if there are 20 pages of frontmatter
- When extracting pages with `extract-pdf-pages.py`, use PDF page numbers, not book page numbers
- If proof page images don't show expected content, verify the PDF page offset

Open each proof page image and verify:

**Visual Verification Checklist:**
- [ ] The page number in the filename matches the `pages` field (remember: PDF pages ≠ book pages)
- [ ] The theorem/section number matches the `theorem` field (if present)
- [ ] The quote in `quote` field appears on these pages
- [ ] The quote is word-for-word accurate (check punctuation, symbols, etc.)
- [ ] If quote contains [...] ellipsis, verify each segment separately
- [ ] Mathematical notation is correctly transcribed (verify against images, not just OCR)
- [ ] The claim in `claim` field is supported by what's written
- [ ] ⚠️ **CRITICAL**: The claim and quote are consistent (no formula mismatches, wrong exponents, etc.)

**Quote Formatting Guidelines:**
- **Ellipsis usage**: Use [...] to omit non-essential explanatory text between key statements
- **What to preserve**: All equations, formal conditions, theorem statements, and mathematical notation
- **What can be omitted**: Intermediate prose explanations, examples, or lengthy derivations
- **Rule**: Each segment before and after [...] should be word-for-word accurate
- **Example**: "Theorem states: [equation] [...] The result holds for [conditions]." is acceptable if the omitted text is explanatory prose

**Handling Algorithms and Boxed Content:**

Algorithms are often presented in boxes with multi-line formatting. When quoting:

1. **Preserve the algorithm steps**: Keep all steps and their logical structure
2. **Linearize if needed**: Multi-line boxed algorithms can be converted to single-line format
3. **Keep mathematical notation exact**: All variable names, subscripts, operations must match

**Example:**

*Source (boxed algorithm)*:
```
Algorithm 3.1 (Backtracking Line Search)
Choose ᾱ > 0, ρ ∈ (0,1), c ∈ (0,1); Set α ← ᾱ
repeat until f(xₖ + αpₖ) ≤ f(xₖ) + cα∇fₖᵀpₖ
  α ← ρα
end (repeat)
Terminate with αₖ = α
```

*Acceptable linearized quote*:
> "Choose ᾱ > 0, ρ ∈ (0,1), c ∈ (0,1); Set α ← ᾱ; repeat until f(xₖ + αpₖ) ≤ f(xₖ) + cα∇fₖᵀpₖ: α ← ρα; Terminate with αₖ = α"

*What matters*:
- ✅ All steps present in order
- ✅ Mathematical notation identical
- ✅ Logical flow preserved (repeat until condition)
- ⚠️ Formatting differences are acceptable (boxes → text, indentation removed)

**Equation Reference Format:**
- Match the source's primary numbering (e.g., "Theorem 2.1.15", "Lemma 3.1")
- For multi-part equations, choose based on clarity:
  - **Grouped**: "Equations (3.6) and (3.7)" - more readable, use for high-level references
  - **Explicit**: "Equations (3.6a-b, 3.7a-b)" - more precise, use when sub-parts matter
- Document the exact sub-parts in `verificationNotes` if there's any ambiguity

**Citations with Multiple Equation References:**

Some citations reference many equations (e.g., main formula is equation 6.19, which uses definitions from 6.6, 6.7, 6.14, 6.17, and A.28). Follow this decision tree:

1. **Primary equation** (the main result being cited):
   - ✅ MUST be in `proofPages`
   - ✅ Quote should include or describe it

2. **Referenced equations in the same chapter/section** (e.g., 6.6, 6.7, 6.14, 6.17):
   - ✅ Include in `proofPages` if they define notation or state prerequisites
   - ✅ Mention in `notes` or `readerNotes` with brief explanation
   - ❌ Don't need to extract if they're standard definitions already well-documented

3. **Referenced equations in other chapters** (e.g., Theorem 2.4 referenced in Chapter 3):
   - ⚠️ Generally DON'T include proof pages from other chapters
   - ✅ Document the reference in `notes`: "Requires Theorem 2.4 (second-order sufficient conditions)"
   - ✅ Only extract if critical to understanding (rare)

4. **Appendix references** (e.g., equation A.28):
   - ❌ Generally DON'T include appendix pages in `proofPages`
   - ✅ Mention in `notes` what it is: "Uses Sherman-Morrison-Woodbury formula (A.28)"
   - Exception: If the appendix formula is obscure and critical, consider including

**Example verification approach:**
```markdown
Citation: "BFGS update formula" (Equation 6.19)
References: 6.17 (inverse form), 6.6 (secant equation), 6.7 (curvature condition), A.28 (Sherman-Morrison-Woodbury)

✅ Include in proofPages: Pages with equations 6.6, 6.7, 6.17, 6.19 (all in Chapter 6, pages 136-140)
❌ Don't include: Appendix A page with equation A.28
✅ Document in verificationNotes: "Verified equations 6.6, 6.7, 6.14, 6.17, 6.19. Equation A.28 (Sherman-Morrison-Woodbury) is referenced but standard formula."
```

### Step 3: Check Context and Prerequisites

Often, understanding a theorem requires reading surrounding pages for:
- Notation definitions (e.g., what does S^(1,1)_μ,L mean?)
- Assumptions and prerequisites
- Corollaries or remarks that clarify the result

**Extract additional pages if needed:**

```bash
# Get the PDF ID and current pages
PDF_ID="introductory-lectures-on-convex-programming-yurii-nesterov-2004_ocr"
CURRENT_PAGES="86-87"

# Extract surrounding pages to check context (use PDF page numbers!)
python3 scripts/extract-pdf-pages.py $PDF_ID 84-89

# Or extract specific definition pages
python3 scripts/extract-pdf-pages.py $PDF_ID 60,82-83

# If images are too small to read clearly, extract at higher DPI
python3 scripts/extract-pdf-pages.py $PDF_ID 84-89 --dpi 200
```

**Using OCR Text Files:**

Many references have OCR text extracted in `docs/references/chunks/`. These are grouped in page ranges:

```bash
# Example: Find OCR text for pages 177-178
# Look for files like "pages_0171-0180.txt" (pages are grouped in chunks of ~10)
ls docs/references/chunks/

# Search for specific text in OCR chunks
grep -r "Wolfe conditions" docs/references/chunks/
```

**Mapping Pages to OCR Chunks:**
OCR files are named by page ranges. To find the right chunk:
1. Book page 37 → PDF page 57 (if 20-page offset)
2. PDF page 57 → Look for chunk containing 57: `pages_0051-0060.txt`
3. Within the chunk, search for your content

```bash
# Quick way to find which chunk contains a PDF page
# Example: Find chunk for PDF page 57
ls docs/references/chunks/*.txt | grep -E "005[0-9]"
# Returns: pages_0051-0060.txt
```

**Note:** Always verify mathematical notation visually against PDF images, as OCR can miss or misinterpret symbols.

**Context Verification Checklist:**
- [ ] Any notation in the quote is defined in the source
- [ ] Prerequisites are documented in the `notes` field
- [ ] The theorem number/name is correct
- [ ] Related results or important remarks are noted

**Determining Appropriate Page Ranges:**

**Minimal approach**: Include only pages containing the key theorem/result
- Use when the theorem is self-contained and uses only standard notation
- Example: A simple lemma with standard notation on a single page

**Contextual approach** (recommended): Include surrounding pages for:
- The main theorem/result statement
- Notation definitions used in the result
- Figures or visual aids that clarify the result
- Existence or uniqueness proofs (if referenced)
- Prerequisites or assumptions stated nearby
- Algorithm descriptions (if the theorem analyzes an algorithm)

**When to STOP adding pages:**

✅ **Include**:
- Pages with notation used in the theorem (e.g., definition of $\mathscr{S}_{\mu,L}^{1,1}$)
- Figures directly referenced (e.g., "see Figure 3.3")
- Prerequisites stated in the theorem (e.g., "Theorem 2.4")
- Algorithm the theorem analyzes

❌ **Usually DON'T include**:
- General chapter introductions (unless defining key terms)
- Subsequent theorems building on the result (unless cited explicitly)
- Exercises or examples applying the theorem
- Proofs of related but separate results

**Examples:**

*Too few pages*:
- Citation for Theorem 2.1.15 (pages 101-102) that uses $\mathscr{S}_{\mu,L}^{1,1}$ notation
- Missing: Definition pages (93-94) needed to understand the notation
- **Problem**: Reader can't understand what function class is being discussed

*Just right*:
- Citation for Theorem 2.1.15 includes pages 93-94 (notation definition) + 101-102 (theorem)
- All notation is defined, theorem is complete
- **Result**: Reader can fully understand the result

*Too many pages*:
- Citation includes pages 90-114 (entire section 2.1 and 2.2)
- Includes unrelated theorems, examples, and exercises
- **Problem**: Harder to find the relevant content, excessive context

**Guidelines:**
- When in doubt, include more context rather than less
- It's better to have unnecessary context than missing critical definitions
- Pages in `proofPages` should enable a reader to fully understand the result without consulting the original PDF
- If you extract additional pages during verification, add them to `proofPages`

### Step 4: Verify the Claim

The `claim` field is the verifier's interpretation/application of the result. Check:

**Claim Verification Checklist:**
- [ ] The claim accurately reflects what the theorem says
- [ ] The claim doesn't overstate the result
- [ ] Important conditions are included (e.g., "when 0 < α < 2/(L+μ)")
- [ ] The claim matches how it's used in the codebase
- [ ] Any notation differences between source and claim are documented
- [ ] **CRITICAL**: The claim is consistent with the quote

**⚠️ Claim vs Quote Consistency Check:**

This is a critical verification step that catches errors where the quote is correct but the claim misinterprets it.

**Red flags indicating inconsistency:**
- Claim states a formula with different exponents than the quote (e.g., claim says ρ², quote shows ρ)
- Claim mentions conditions not present in the quote
- Claim uses different constants than the quote (e.g., claim says L+3μ, quote shows L+μ)
- Claim describes convergence rate differently than the quote states it

**What to do if claim and quote disagree:**
1. **Trust the quote** - It should be word-for-word from the source
2. **Verify the quote** - Double-check it's actually correct against the source
3. **Investigate the discrepancy** - Why do they differ?
   - Was the claim written from memory?
   - Is there a transcription error in the claim?
   - Is the claim interpreting a different part of the theorem?
4. **Fix the claim** - Update it to match what the quote actually says
5. **Document in verificationNotes** - Note that claim was corrected for consistency

**Example of caught error:**
- **Quote**: "‖xₖ - x*‖ ≤ C(1 - 2μ/(L+3μ))^k"
- **Claim**: "rate ρ = (1 - 2μ/(L+3μ))²" ← WRONG! Extra square!
- **Fix**: "rate ρ = 1 - 2μ/(L+3μ)" ← Matches quote

**Cross-reference with usage:**

```bash
# Check where this citation is used
CITATION_KEY="gd-strongly-convex-linear-convergence"
cat docs/citations.json | jq -r ".citations[\"$CITATION_KEY\"].usedIn[]"

# Example: If it says "GdFixedTab", check that file
grep -n "strongly convex" src/components/tabs/GdFixedTab.tsx

# To find ALL usages (in case usedIn is incomplete):
grep -r "citationKey=\"$CITATION_KEY\"" src/
```

Verify the actual code/documentation matches the claim.

### Step 4.5: Handle Discrepancies

**Strict vs Non-Strict Inequalities:**
- If the theorem states $h \leq 2/(L+\mu)$ (non-strict) but code uses $h < 2/(L+\mu)$ (strict), this is **ACCEPTABLE**
- The code is using a conservative/stricter bound, which is safer
- Note this in `verificationNotes` but do not mark as an error
- If the code claims a weaker result than the theorem proves, verify this is intentional simplification
- If the code claims a stronger result than proven, this **REQUIRES CORRECTION**

**Notation Differences:**
- Source uses $h$ but implementation uses $\alpha$ for step size → Document in `readerNotes`
- Source uses $\mu$ but implementation uses $m$ → Document the mapping
- Any notation transformation must be mathematically equivalent
- Format: "Note: [Source] uses $x$; in our implementation we use $y$"

**When notation differs between source and implementation:**
```json
{
  "readerNotes": "...Nesterov uses h for step size; in our implementation we use α..."
}
```

**Common Acceptable Discrepancies:**
- Conservative bounds (stricter than necessary)
- Simplified big-O notation (e.g., $O(n\log n)$ stated as $O(n\log n)$ even if constants differ)
- Rounding of numerical constants for readability
- Notation standardization across the codebase

**Unacceptable Discrepancies (require correction):**
- Wrong inequality direction (≤ vs ≥)
- Missing conditions or assumptions
- Overclaiming results not proven in the source
- Incorrect constant factors that change asymptotic behavior

### Step 5: Update the Citation (if needed)

If you found issues or want to add context, update `docs/citations.json`:

#### Adding Proof Pages

If you extracted additional pages that provide important context:

```json
{
  "proofPages": [
    "docs/references/extracted-pages/intro_page_0086.png",
    "docs/references/extracted-pages/intro_page_0087.png",
    "docs/references/extracted-pages/intro_page_0082.png"  // Added: definition of S^(1,1)_μ,L
  ]
}
```

#### Expanding Notes

If you discovered important context not in the original notes:

```json
{
  "notes": "The notation S^(1,1)_μ,L(R^n) denotes strongly convex functions with parameter μ > 0 and Lipschitz continuous gradient with constant L. The condition number Q_f = L/μ determines the convergence rate. With optimal step size h = 2/(L+μ), the convergence rate is ((Q_f-1)/(Q_f+1))^k. IMPORTANT: This differs from merely smooth functions (Theorem 2.1.14) where μ=0 and the bound is 2/L instead of 2/(L+μ)."
}
```

#### Correcting Errors

If you found an error:

1. **Minor corrections** (typos, notation): Fix directly in `docs/citations.json`
2. **Major errors** (wrong theorem, wrong claim): Document in a verification report and discuss with team

### Step 6: Mark as Verified

**For initial citation creation:**
```json
{
  "verified": "2025-11-11",
  "verifiedBy": "citation-creation-agent",
  "verificationNotes": "Initial verification during citation creation. Verified quote accuracy, page numbers, and visual verification of PDF pages."
}
```

**For independent verification:**
```json
{
  "verified": "2025-11-11",
  "verifiedBy": "verification-agent",
  "verificationNotes": "Independently verified: quote is word-for-word accurate, claim matches source, usage in codebase consistent. Added page 82 for notation definition."
}
```

**Note:** All citations MUST have `verified`, `verifiedBy`, and `verificationNotes` fields. These are required fields, not optional.

## Verification Report Template

When verifying citations, you can create a report:

```markdown
## Citation Verification: gd-strongly-convex-linear-convergence

**Date**: 2025-11-11
**Verifier**: [Your name or agent ID]
**Status**: ✅ VERIFIED / ⚠️ NEEDS UPDATE / ❌ REJECTED

### Verification Summary

- [x] Proof pages reviewed
- [x] Quote is accurate
- [x] Page numbers correct
- [x] Claim matches source
- [x] Context checked
- [x] Usage in codebase matches

### Findings

1. **Quote accuracy**: Perfect match to Theorem 2.1.15 on page 86
2. **Context**: Added proof page for notation definition (page 82)
3. **Claim**: Correctly states the step size condition as 2/(L+μ)

### Recommended Updates

- Add page 82 to proofPages for notation definition
- Expand notes to clarify difference from Theorem 2.1.14 (convex but not strongly convex case)

### Issues Found

None - citation is accurate and complete.
```

## Common Issues to Check

### 1. Notation Mismatches

**Issue**: Source uses `h` for step size, but codebase uses `α`

**Solution**: Document in `notes`:
```json
{
  "notes": "...Note: Nesterov uses h for step size; in our implementation we use α."
}
```

### 2. Missing Prerequisites

**Issue**: Theorem assumes function is in class S^(1,1)_μ,L but this isn't explained

**Solution**:
- Extract the page where this class is defined
- Add to `proofPages`
- Document in `notes`

### 3. Overstated Claims

**Issue**: Citation claims "gradient descent always converges" but theorem requires specific conditions

**Solution**: Update `claim` to include all conditions

### 4. Incomplete Page Ranges

**Issue**: Theorem statement spans pages 86-87 but only page 86 is in `proofPages`

**Solution**: Extract missing pages and update `proofPages`

### 5. Wrong Theorem Number

**Issue**: Citation says "Theorem 2.1.15" but the actual theorem is "Theorem 2.1.14"

**Solution**:
- Verify the correct theorem number
- Update `theorem` field
- Verify the quote matches the correct theorem

## Troubleshooting Common Issues

### Issue: Proof Pages Show Wrong Content

**Symptoms:** The theorem number or content in proof page images doesn't match the citation

**Cause:** PDF page numbers differ from printed book page numbers

**Solution:**
1. Check the printed page number visible in the proof page image header/footer
2. Calculate the offset: `PDF_page - Book_page`
3. Re-extract using correct PDF page numbers: `python3 scripts/extract-pdf-pages.py PDF_ID [corrected_pages]`

### Issue: Mathematical Notation Doesn't Match

**Symptoms:** OCR text shows different symbols than what's in the quote

**Solution:**
1. Always verify mathematical notation visually against PDF images
2. OCR often misinterprets symbols like $\mu$, $\leq$, subscripts/superscripts
3. Trust the visual verification over OCR text for mathematical content

### Issue: Can't Find OCR Text File

**Symptoms:** Looking for page 177 but can't find corresponding OCR file

**Solution:**
1. OCR text is grouped in chunks of ~10 pages: `pages_0171-0180.txt`
2. Look for the chunk containing your page: `ls docs/references/chunks/ | grep -E "017[0-9]"`
3. If no OCR exists, extract pages visually and verify from images only

### Issue: Citation Has Multiple Quotes

**Symptoms:** The quote field contains [...] between different text segments

**Solution:**
1. Verify each segment separately against the source
2. Confirm each segment before and after [...] is word-for-word accurate
3. Verify that omitted text (indicated by [...]) is indeed non-essential explanatory prose
4. Ensure all equations and formal statements are preserved, not omitted

### Issue: Unclear Whether to Update Citation

**Decision Matrix:**

| Situation | Action |
|-----------|--------|
| Minor typo in quote (1-2 characters) | Fix directly and note in verificationNotes |
| Missing context (notation undefined) | Extract additional pages, update proofPages |
| Claim overstates result | Update claim field to be accurate |
| Wrong theorem referenced | Document issue, flag for team discussion |
| Usage in code doesn't match citation | Check if code or citation needs correction |

## For AI Agents

When verifying citations as an agent:

1. **Always read the proof pages visually** - don't just rely on the JSON fields
2. **Extract surrounding pages** liberally - it's better to over-verify than under-verify
3. **Check definitions** - if notation appears, find where it's defined
4. **Compare with usage** - read the actual code/docs that use this citation
5. **Document everything** - if you extracted extra pages, add them to proofPages
6. **Be conservative** - if something seems unclear, flag it for human review

### Avoiding Edit Conflicts in Parallel Verification

When multiple agents are verifying citations in parallel, they may race to update `citations.json` simultaneously, causing edit conflicts.

**Solution**: If you encounter an edit conflict when updating `citations.json`:

1. **Generate a random sleep duration** between 1-60 seconds
2. **Wait for that duration** before retrying the edit
3. **Re-read the file** to get the latest version
4. **Retry your update**

This desynchronizes agents and prevents repeated conflicts.

**Example approach**:
```python
import random
import time

# On edit conflict:
sleep_time = random.randint(1, 60)
print(f"Edit conflict detected. Sleeping for {sleep_time} seconds to desync...")
time.sleep(sleep_time)
# Then retry reading and editing the file
```

**Important**: DO generate an actual random number (don't just pick one mentally). Use your language's random number generator to ensure true randomization.

### Verification Script Template

When verifying as an agent, follow this structure:

```markdown
I'll verify citation: [citation-key]

1. Reading proof pages...
   [Read each image in proofPages array]

2. Checking quote accuracy...
   [Compare quote field to what appears on proof pages]

3. Verifying page numbers...
   [Confirm page numbers in images match pages field]

4. Checking context...
   [Extract and read surrounding pages if needed]

5. Verifying claim...
   [Check if claim matches what source actually says]

6. Cross-referencing usage...
   [Read the files listed in usedIn array]

7. Final assessment...
   Status: ✅ VERIFIED / ⚠️ NEEDS UPDATE / ❌ REJECTED

   [If updates needed, list them]
```

## Quality Standards

A verified citation must meet these standards:

1. **Accuracy**: Quote is word-for-word from the source
2. **Completeness**: All necessary context is documented
3. **Traceability**: Proof pages allow anyone to verify the claim
4. **Usability**: Notes explain notation and prerequisites
5. **Correctness**: Claim accurately reflects the theorem
6. **Consistency**: Usage in codebase matches the citation

## Batch Verification

### Finding Citations to Verify

```bash
# List citations lacking independent verification (not verified by "verification-agent")
jq '.citations | to_entries[] | select(.value.verifiedBy == "verification-agent" | not) | .key' docs/citations.json

# Count how many need verification
jq '.citations | to_entries[] | select(.value.verifiedBy == "verification-agent" | not) | .key' docs/citations.json | wc -l

# List unverified or old citations
jq -r '.citations | to_entries[] |
  select(.value.verified < "2025-11-01" or .value.verifiedBy == null) |
  .key' docs/citations.json
```

### Prioritization Strategy

When verifying citations in batches, prioritize:

1. **High-usage citations first**: Citations used in multiple places are more critical
   ```bash
   jq -r '.citations | to_entries[] |
     select(.value.verifiedBy != "verification-agent") |
     "\(.value.usedIn | length) \(.key)"' docs/citations.json | sort -rn
   ```

2. **Core algorithm citations**: Citations about fundamental algorithms (gradient descent, Newton's method, etc.)

3. **Simple before complex**: Start with single-theorem citations before multi-page proofs

4. **Diverse sources**: Verify citations from different references to catch source-specific issues

### Batch Processing Recommendations

- **Parallel verification**: Run 3-4 verification agents in parallel for efficiency
- **Feedback loops**: After each batch, review feedback to improve the workflow
- **Progress tracking**: Keep a log of verified citations and time taken
- **Quality over speed**: Better to verify thoroughly than quickly

### Expected Time Estimates

- **19 citations** × 20 minutes average = ~6-7 hours total work
- With 3 parallel agents: ~2-3 hours of wall-clock time
- Complex citations may take longer; simple ones faster

## See Also

- [Citation Workflow](citation-workflow.md) - Creating new citations
- [docs/citations.json](../citations.json) - The citation registry
