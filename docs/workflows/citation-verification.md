# Citation Verification Workflow

This document describes the process for verifying existing citations to ensure accuracy and completeness.

## Purpose

Every citation in `docs/citations.json` should be independently verified to ensure:
- The quote is accurate and properly attributed
- The page numbers are correct
- The claim matches what the source actually says
- Mathematical notation is correctly transcribed
- All necessary context and prerequisites are documented

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

Open each proof page image and verify:

**Visual Verification Checklist:**
- [ ] The page number in the filename matches the `pages` field
- [ ] The theorem/section number matches the `theorem` field (if present)
- [ ] The quote in `quote` field appears on these pages
- [ ] The quote is word-for-word accurate (check punctuation, symbols, etc.)
- [ ] Mathematical notation is correctly transcribed
- [ ] The claim in `claim` field is supported by what's written

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

# Extract surrounding pages to check context
python3 scripts/extract-pdf-pages.py $PDF_ID 84-89

# Or extract specific definition pages
python3 scripts/extract-pdf-pages.py $PDF_ID 60,82-83
```

**Context Verification Checklist:**
- [ ] Any notation in the quote is defined in the source
- [ ] Prerequisites are documented in the `notes` field
- [ ] The theorem number/name is correct
- [ ] Related results or important remarks are noted

### Step 4: Verify the Claim

The `claim` field is the verifier's interpretation/application of the result. Check:

**Claim Verification Checklist:**
- [ ] The claim accurately reflects what the theorem says
- [ ] The claim doesn't overstate the result
- [ ] Important conditions are included (e.g., "when 0 < α < 2/(L+μ)")
- [ ] The claim matches how it's used in the codebase

**Cross-reference with usage:**

```bash
# Check where this citation is used
CITATION_KEY="gd-strongly-convex-linear-convergence"
cat docs/citations.json | jq -r ".citations[\"$CITATION_KEY\"].usedIn[]"

# Example: If it says "GdFixedTab", check that file
grep -n "strongly convex" src/components/tabs/GdFixedTab.tsx
```

Verify the actual code/documentation matches the claim.

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

## For AI Agents

When verifying citations as an agent:

1. **Always read the proof pages visually** - don't just rely on the JSON fields
2. **Extract surrounding pages** liberally - it's better to over-verify than under-verify
3. **Check definitions** - if notation appears, find where it's defined
4. **Compare with usage** - read the actual code/docs that use this citation
5. **Document everything** - if you extracted extra pages, add them to proofPages
6. **Be conservative** - if something seems unclear, flag it for human review

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

To verify all citations:

```bash
# List all unverified or old citations
cat docs/citations.json | jq -r '.citations | to_entries[] |
  select(.value.verified < "2025-11-01" or .value.verifiedBy == null) |
  .key'

# For each citation, follow the verification process above
```

## See Also

- [Citation Workflow](citation-workflow.md) - Creating new citations
- [docs/citations.json](../citations.json) - The citation registry
