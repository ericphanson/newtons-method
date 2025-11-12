# Agent-Driven Formula Extraction Workflow

## Purpose

An iterative, agent-driven workflow for extracting mathematical formulas from PDF pages with automated verification. Agents autonomously identify, crop, extract, and verify formulas to produce high-quality LaTeX transcriptions.

## Implementation Status

- ✅ **Core cropping script**: `scripts/crop-formula.py` - Fully implemented and tested
- ⏳ **Orchestration scripts**: `create-formula-task.py`, `run-formula-extraction.py` - Planned
- ⏳ **Citation integration**: `link-formula-to-citation.py` - Planned

**Current capability**: Agents can manually run the cropping workflow using the implemented script. See "Quick Start for Agents" below.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Task Creation                                            │
│    - Define target formula                                  │
│    - Specify source (PDF, page, theorem)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Cropping Agent (Iterative)                               │
│    - Read full page                                         │
│    - Identify formula location                              │
│    - Crop to formula region                                 │
│    - Self-verify crop quality                               │
│    - Re-crop if needed (repeat until satisfied)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LaTeX Extraction Agent                                   │
│    - Read cropped image                                     │
│    - Extract LaTeX notation                                 │
│    - Add to metadata                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Verification Agent                                       │
│    - Verify crop contains correct formula                   │
│    - Verify LaTeX accuracy                                  │
│    - Fix LaTeX if needed OR request re-crop                 │
│    - Add verification notes                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Output                                                   │
│    - formula-metadata.json                                  │
│    - cropped image file                                     │
│    - verified LaTeX                                         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start for Agents

**You are a cropping agent and need to extract a formula?** Here's what to do:

1. **Read the full page image** to locate the target formula visually
2. **Determine crop boundaries** as percentages of page height (0-100%)
3. **Run the crop script**:
   ```bash
   python3 scripts/crop-formula.py \
     --pdf PDF_ID \
     --page PAGE_NUM \
     --top-percent TOP \
     --bottom-percent BOTTOM \
     --theorem "Theorem X.Y.Z" \
     --equation "(X.Y.Z)" \
     --description "Brief description"
   ```
4. **Verify the crop** by reading the generated image
5. **If not satisfied**, adjust coordinates and re-run with `--force`

**Example** (extracting Theorem 4.1.6):
```bash
# First attempt
python3 scripts/crop-formula.py \
  --pdf lectures_on_convex_optimization \
  --page 276 \
  --top-percent 55.0 \
  --bottom-percent 72.0 \
  --theorem "Theorem 4.1.6" \
  --equation "(4.1.36)" \
  --description "Convergence bound"

# Read the crop and realize it includes equation (4.1.35) above - need to adjust

# Second attempt with adjusted top boundary
python3 scripts/crop-formula.py \
  --pdf lectures_on_convex_optimization \
  --page 276 \
  --top-percent 59.1 \
  --bottom-percent 71.8 \
  --theorem "Theorem 4.1.6" \
  --equation "(4.1.36)" \
  --description "Convergence bound" \
  --force

# Read the crop again - perfect! Contains only (4.1.36)
```

**Key tips**:
- Start with generous boundaries, then narrow them
- Use `--force` to overwrite previous attempts
- Read the output JSON to see pixel coordinates
- Full width (left=0, right=100) is usually best for formulas

## Best Practices

### Page Extraction DPI

**IMPORTANT**: Extract pages at **300 DPI** (not the default 150 DPI) for high-quality formula crops.

```bash
# Extract pages at 300 DPI
python3 scripts/extract-pdf-pages.py lectures_on_convex_optimization 276 --dpi 300
```

**Why 300 DPI?**
- **Sharper images**: Text and mathematical symbols are clearer
- **Better crops**: Easier to avoid cutoffs with higher resolution
- **Reduces iteration**: Agents can see details better, leading to fewer re-crops
- **Still efficient**: File sizes are reasonable (~400KB vs ~200KB at 150 DPI)

**From DPI testing** (see [docs/logs/2025-11-12-dpi-test.md](../logs/2025-11-12-dpi-test.md)):
- 150 DPI: Works but images can be blurry, tight crops risk cutoffs
- 300 DPI: ✅ **Recommended** - Sharp, clean, good balance
- 450-600 DPI: Overkill, larger files with no accuracy improvement

### Cropping Guidelines

**Avoiding cutoffs** (most common issue):
- Add 1-2% extra padding at the bottom for complex fractions
- Always verify denominators are fully visible
- Check that equation numbers aren't clipped
- Include any conditions (k ≥ 0, etc.)

**Context balance**:
- Include 1-2 lines of context above the formula
- Don't include other equations or excessive prose
- Full page width is usually best for formulas

## Metadata Schema

Each extracted formula gets a JSON metadata file generated by `scripts/crop-formula.py`.

**File naming**: `{pdf_id}_p{page_num}_{theorem_id}.json`

**Example**: `lectures_on_convex_optimization_p276_theorem_4_1_6.json`

The script generates initial metadata which agents then enrich with LaTeX extraction and verification:

```json
{
  "formula_id": "lectures_on_convex_optimization_p276_theorem_4_1_6",
  "source": {
    "pdf_id": "lectures_on_convex_optimization",
    "page": 276,
    "theorem": "Theorem 4.1.6",
    "equation": "(4.1.36)",
    "description": "Convergence bound for gradient-dominated functions"
  },
  "extraction": {
    "source_image": "docs/references/extracted-pages/lectures_on_convex_optimization_page_0276.png",
    "output_image": "docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.png",
    "source_dimensions": {
      "width": 1831,
      "height": 2775
    },
    "crop_coordinates_percent": {
      "left": 0,
      "top": 59.1,
      "right": 100,
      "bottom": 71.8
    },
    "crop_coordinates_pixels": {
      "left": 0,
      "top": 1640,
      "right": 1831,
      "bottom": 1993,
      "width": 1831,
      "height": 353
    },
    "dpi": 300
  },
  "latex": {
    "formula": "",
    "extracted_by": null,
    "extracted_date": null,
    "notes": ""
  },
  "verification": {
    "verified": false,
    "verified_by": null,
    "verified_date": null,
    "issues": []
  },
  "metadata": {
    "created_by": "agent",
    "created_date": "2025-11-12T14:20:00Z",
    "status": "extracted",
    "version": "1.0"
  }
}
```

**Workflow progression**:
1. **After cropping** (script output): `status: "extracted"`, empty LaTeX fields
2. **After LaTeX extraction** (agent updates): LaTeX fields populated, `status: "latex_extracted"`
3. **After verification** (agent updates): Verification fields populated, `status: "verified"`

## Detailed Workflow

### Step 1: Task Creation

Create a task file specifying what formula to extract:

**File**: `tasks/extract-formula-{task_id}.json`

```json
{
  "task_id": "extract_theorem_4_1_6",
  "target": {
    "pdf_id": "lectures_on_convex_optimization",
    "page_number": 276,
    "theorem_number": "Theorem 4.1.6",
    "equation_number": "(4.1.36)",
    "description": "The convergence bound formula for gradient-dominated functions",
    "expected_form": "f(x_k) - f(x^*) ≤ [some expression involving ω̂, γ, k]"
  },
  "constraints": {
    "include_context": true,
    "context_lines": 2,
    "exclude_other_equations": true,
    "dpi": 300
  },
  "status": "pending"
}
```

### Step 2: Cropping Agent

**Agent role**: Identify and crop the target formula through iterative refinement.

**Agent prompt**:

```
FORMULA CROPPING TASK - HIGH QUALITY EXTRACTION

You are tasked with cropping equation (4.1.36) from Theorem 4.1.6 on page 276.

SOURCE IMAGE: {full_page_path}
(Should be 300 DPI / high resolution for best quality)

TARGET FORMULA:
- Theorem: Theorem 4.1.6
- Equation: (4.1.36)
- Expected form: f(x_k) - f(x^*) ≤ [expression with ω̂, γ, k, involving a complex fraction]
- Context: Part 2 of the theorem regarding convergence with small initial value

CRITICAL CROPPING REQUIREMENTS - AVOID CUTOFFS:

**MOST IMPORTANT - Check for cutoffs:**
1. **BOTTOM padding is critical** - Many formulas have complex fractions with denominators that extend below the main equation line. The denominator MUST be fully visible.
2. **Add 1-2% extra at bottom** - Better to include a bit too much than to cut off the denominator
3. **Check equation number** - The equation label (e.g., "(4.1.36)") must be fully visible
4. **Check conditions** - Any conditions like "k ≥ 0" must be included

YOUR TASK:
1. **READ THE FULL PAGE IMAGE**
   - Locate the target theorem and equation
   - Identify the formula structure (does it have a fraction? What's in the denominator?)

2. **DETERMINE BOUNDARIES WITH ADEQUATE PADDING**
   - TOP: Include 1-2 lines of context
   - BOTTOM: **CRITICAL** - Go far enough to capture:
     * The entire denominator (if it's a fraction)
     * Any conditions (like "k ≥ 0")
     * The equation number
     * Add 1-2% extra padding to avoid cutoffs

3. **CREATE THE CROP**
   Use scripts/crop-formula.py with your calculated boundaries

4. **VERIFY CROP QUALITY - BE STRICT**
   - ✓ Complete equation visible?
   - ✓ ENTIRE DENOMINATOR visible (not cut off)?
   - ✓ Fraction bar fully visible?
   - ✓ Equation number fully visible?
   - ✓ Any conditions visible?
   - ✓ Adequate padding (not too tight)?
   - ✓ Excludes other equations?
   - ✓ Image clear and readable?

5. **IF ANY CHECK FAILS: ITERATE**
   - If bottom cut off: Increase bottom-percent by 2-3%
   - If top cut off: Decrease top-percent by 1-2%
   - Use --force flag to overwrite
   - Iterate until ALL checks pass

COMMON MISTAKES TO AVOID:
- 🚫 Cropping too tight at bottom (cutting off denominators)
- 🚫 Not checking if fraction denominators are fully visible
- 🚫 Cutting off equation numbers
- 🚫 Including nearby equations

CROP QUALITY REQUIREMENTS:
✅ MUST include:
- The complete equation with all parts visible
- Equation label/number
- 1-2 lines of introductory context
- Any conditions (k ≥ 0, etc.)

❌ MUST NOT include:
- Other equations (check above and below)
- Unrelated theorems
- Excessive blank space (>15% of crop height)

OUTPUT FORMAT:
Return a JSON object with:
{
  "crop_coordinates": {
    "top_percent": X.X,
    "bottom_percent": Y.Y,
    "left_percent": 0,
    "right_percent": 100
  },
  "cropped_image_path": "path/to/cropped_image.png",
  "iterations": N,
  "self_assessment": {
    "contains_target": true/false,
    "only_target": true/false,
    "has_context": true/false,
    "excludes_others": true/false,
    "no_cutoffs": true/false,
    "ready_for_extraction": true/false
  },
  "notes": "Description of cropping decisions, adjustments, and quality checks"
}

IMPORTANT: Do not proceed to LaTeX extraction. Your job is ONLY to produce a high-quality crop with NO CUTOFFS.
```

**Agent actions**:
1. Read full page with vision
2. Identify target formula visually
3. Calculate percentage-based crop coordinates
4. Use `scripts/crop-formula.py` to create the crop:
   ```bash
   python3 scripts/crop-formula.py \
     --pdf lectures_on_convex_optimization \
     --page 276 \
     --top-percent 59.1 \
     --bottom-percent 71.8 \
     --theorem "Theorem 4.1.6" \
     --equation "(4.1.36)" \
     --description "Convergence bound for gradient-dominated functions"
   ```
5. Read cropped image to verify
6. If not satisfied, adjust coordinates and re-crop (use `--force` flag to overwrite)
7. Read the generated JSON metadata to confirm success

**Expected iterations**: 1-3 crops until quality requirements met

### Step 3: LaTeX Extraction Agent

**Agent role**: Extract LaTeX notation from verified crop and update metadata.

**Agent prompt**:

```
LATEX EXTRACTION FROM CROPPED FORMULA

You are extracting LaTeX from a cropped image containing ONLY equation (4.1.36).

METADATA FILE: {metadata_path}
CROPPED IMAGE: {cropped_image_path}

TARGET: Equation (4.1.36) from Theorem 4.1.6
EXPECTED FORM: f(x_k) - f(x^*) ≤ [expression]

TASK:
1. Read the metadata file to understand the extraction context
2. Read the cropped image (it should contain only the target equation)
3. Extract the complete LaTeX notation for equation (4.1.36)
4. Follow the intense extraction prompt guidelines (see Appendix)
5. Update the metadata file with your extraction

CRITICAL REQUIREMENTS:
- Preserve exact mathematical structure (nested fractions, grouping)
- Verify all symbols (ω̂ vs ω, γ vs y)
- Check exponents (γ² vs (...)²)
- Verify coefficient positions (3γ/2 vs 3/(2γ))
- Count parentheses to ensure balance

METADATA UPDATE:
Update the following fields in the JSON:
{
  "latex": {
    "formula": "f(x_k) - f(x^*) \\leq ...",
    "extracted_by": "latex-extraction-agent",
    "extracted_date": "2025-11-12T14:23:00Z",
    "notes": "Any transcription challenges or ambiguities"
  },
  "metadata": {
    "status": "latex_extracted"
  }
}

If you encounter ANY ambiguity, document it in the notes field.
```

**Agent actions**:
1. Read metadata file from the script output
2. Read cropped image path from metadata
3. Apply intense extraction prompt (from DPI test)
4. Extract LaTeX character-by-character
5. Self-check for common errors
6. Update metadata file with LaTeX and new status

### Step 4: Verification Agent

**Agent role**: Independent verification of crop quality and LaTeX accuracy.

**Agent prompt**:

```
FORMULA EXTRACTION VERIFICATION

You are independently verifying a formula extraction.

INPUTS:
- Metadata file: {metadata_path}
- Cropped image: {cropped_image_path}
- Original page: {full_page_path}

TARGET:
- Theorem: {theorem_number}
- Equation: {equation_number}
- Expected form: {expected_form}

VERIFICATION CHECKLIST:

1. CROP VERIFICATION:
   [ ] Open the cropped image
   [ ] Verify it contains equation {equation_number}
   [ ] Verify theorem number {theorem_number} is visible or contextually clear
   [ ] Check that ONLY the target equation is included
   [ ] Confirm no other equations are visible
   [ ] Confirm minimal context (1-2 lines) is present

   If ANY crop check fails → DECISION: Request re-crop

2. LATEX VERIFICATION (if crop is correct):
   [ ] Read the cropped image carefully
   [ ] Compare extracted LaTeX against the visual formula
   [ ] Check structure: numerator vs denominator
   [ ] Verify all symbols match (ω̂, γ, k, etc.)
   [ ] Verify all exponents (γ², (...)²)
   [ ] Verify all grouping (parentheses, brackets)
   [ ] Verify all coefficients (3/2, not 2/3)
   [ ] Test render the LaTeX (mentally or with tool)

   If LaTeX has errors but crop is correct → DECISION: Fix LaTeX
   If crop is wrong → DECISION: Request re-crop

3. VERIFICATION DECISION:

   Option A: APPROVE
   - Crop contains correct formula ONLY
   - LaTeX is 100% accurate
   - No corrections needed

   Option B: FIX LATEX
   - Crop is correct
   - LaTeX has transcription errors
   - You can correct the LaTeX

   Option C: REQUEST RE-CROP
   - Crop contains wrong formula
   - Crop contains multiple formulas
   - Crop missing parts of target formula

OUTPUT FORMAT:
{
  "verification_decision": "APPROVE" | "FIX_LATEX" | "REQUEST_RECROP",
  "crop_correct": true/false,
  "latex_correct": true/false,
  "corrections_made": [
    {"field": "latex", "before": "...", "after": "...", "reason": "..."}
  ],
  "issues_found": [
    {"type": "crop|latex", "description": "...", "severity": "critical|major|minor"}
  ],
  "verification_notes": "Detailed notes about the verification process",
  "verified_date": "2025-11-12T14:25:00Z"
}

IMPORTANT:
- Be thorough but fair
- If crop is correct and LaTeX is 95%+ correct, fix the LaTeX
- Only request re-crop if fundamentally wrong
- Document all decisions clearly
```

**Agent actions**:
1. Read metadata file with crop info and extracted LaTeX
2. Read cropped image and original page
3. Verify crop quality against target
4. Verify LaTeX accuracy against image
5. Make verification decision
6. Update metadata file with verification results:
   - If APPROVE: Set `verified: true`, `status: "verified"`
   - If FIX_LATEX: Update LaTeX, add corrections, then verify
   - If REQUEST_RECROP: Set `status: "recrop_needed"`, document issues
7. If requesting re-crop: cropping agent re-runs with updated parameters

### Step 5: Output and Integration

**Final outputs**:
```
docs/references/extracted-pages/formulas/
├── lectures_on_convex_optimization_p276_theorem_4_1_6.png     (cropped image)
└── lectures_on_convex_optimization_p276_theorem_4_1_6.json    (metadata)
```

**Metadata status on completion** (verified and ready):
```json
{
  "latex": {
    "formula": "f(x_k) - f(x^*) \\leq \\hat{\\omega} \\cdot \\frac{\\gamma^2(2+\\frac{3}{2}\\gamma)^2}{(2+(k+\\frac{3}{2})\\gamma)^2}",
    "extracted_by": "latex-extraction-agent",
    "extracted_date": "2025-11-12T14:23:00Z",
    "notes": ""
  },
  "verification": {
    "verified": true,
    "verified_by": "formula-verification-agent",
    "verified_date": "2025-11-12T14:25:00Z",
    "issues": []
  },
  "metadata": {
    "status": "verified"
  }
}
```

## Integration with Citation Workflow

### During Citation Creation

When creating a new citation, optionally extract formulas:

**Step 1**: Create citation task (existing workflow)

**Step 2**: Identify key formulas in the citation

**Step 3**: For each formula, create formula extraction task:

```bash
# Create formula extraction task
python3 scripts/create-formula-task.py \
  --pdf lectures_on_convex_optimization \
  --page 276 \
  --theorem "Theorem 4.1.6" \
  --equation "(4.1.36)" \
  --description "Convergence bound for gradient-dominated functions"
```

**Step 4**: Run agent workflow (cropping → extraction → verification)

**Step 5**: Link verified formula to citation:

```json
{
  "citations": {
    "gd-convex-sublinear-convergence-nesterov-2018": {
      "proofPages": [...],
      "formulaExtractions": [
        {
          "formula_id": "lectures_on_convex_optimization_p276_theorem_4_1_6",
          "metadata_path": "docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.json",
          "image_path": "docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.png",
          "latex": "f(x_k) - f(x^*) \\leq \\hat{\\omega} \\cdot \\frac{\\gamma^2(2+\\frac{3}{2}\\gamma)^2}{(2+(k+\\frac{3}{2})\\gamma)^2}",
          "verified": true,
          "theorem": "Theorem 4.1.6",
          "equation": "(4.1.36)"
        }
      ]
    }
  }
}
```

### During Citation Verification

When verifying an existing citation:

**Step 1**: Check if formulas have been extracted

**Step 2**: If not, create extraction tasks for key formulas

**Step 3**: Run extraction workflow

**Step 4**: Compare extracted LaTeX with citation quote:
- If they match → citation quote is accurate
- If they differ → flag for human review

**Step 5**: Update citation with formula metadata

## Agent Coordination

### Sequential Workflow

Agents run in sequence for a single formula:

```
Cropping Agent → LaTeX Extraction Agent → Verification Agent
      ↓                                            ↓
      └─────── (if re-crop needed) ←──────────────┘
```

### Parallel Processing

For multiple formulas from same paper:

```
Formula 1: Crop Agent 1 → Extract Agent 1 → Verify Agent 1
Formula 2: Crop Agent 2 → Extract Agent 2 → Verify Agent 2
Formula 3: Crop Agent 3 → Extract Agent 3 → Verify Agent 3
```

Run 3-4 parallel chains for efficiency.

### Error Handling

**Cropping Agent fails after 5 iterations**:
- Flag for human review
- Document the difficulty in metadata
- Human provides crop coordinates manually

**LaTeX Extraction low confidence**:
- Verification agent pays extra attention
- May request second extraction attempt
- Human review if verification agent uncertain

**Verification Agent requests re-crop**:
- Loop back to cropping agent with notes
- Max 2 re-crop attempts
- Then flag for human review

## Scripts and Tools

### Core Script: `scripts/crop-formula.py` ✅ Implemented

**Purpose**: Agent-driven formula cropping with automatic metadata generation.

**Basic usage**:
```bash
python3 scripts/crop-formula.py \
  --pdf lectures_on_convex_optimization \
  --page 276 \
  --top-percent 59.1 \
  --bottom-percent 71.8 \
  --theorem "Theorem 4.1.6" \
  --equation "(4.1.36)" \
  --description "Convergence bound for gradient-dominated functions"
```

**Full options**:
```bash
python3 scripts/crop-formula.py \
  --pdf PDF_ID \
  --page PAGE_NUM \
  --top-percent TOP \
  --bottom-percent BOTTOM \
  [--left-percent LEFT] \       # default: 0
  [--right-percent RIGHT] \     # default: 100
  [--theorem THEOREM] \
  [--equation EQUATION] \
  [--description DESC] \
  [--output-dir DIR] \          # default: docs/references/extracted-pages/formulas
  [--dpi DPI] \                 # default: 300 (informational)
  [--force]                     # overwrite existing files
```

**Features**:
- ✅ Percentage-based coordinates (DPI-independent)
- ✅ Automatic formula ID generation from theorem/equation
- ✅ Comprehensive metadata file creation
- ✅ Path traversal protection (validates PDF IDs)
- ✅ Minimum crop size validation (10 pixels)
- ✅ Overwrite protection (requires `--force` flag)
- ✅ Sanitized filenames (safe for all filesystems)

**Output**:
```
docs/references/extracted-pages/formulas/
├── lectures_on_convex_optimization_p276_theorem_4_1_6.png
└── lectures_on_convex_optimization_p276_theorem_4_1_6.json
```

**Metadata structure**: See "Metadata Schema" section above.

### Supporting Scripts (To Be Implemented)

**1. `scripts/create-formula-task.py`** (Future)
```bash
python3 scripts/create-formula-task.py \
  --pdf PDF_ID \
  --page PAGE_NUM \
  --theorem THEOREM_NUM \
  --equation EQUATION_NUM \
  --description "DESCRIPTION"
```

Creates task file for formula extraction workflow.

**2. `scripts/run-formula-extraction.py`** (Future)
```bash
python3 scripts/run-formula-extraction.py \
  --task-file tasks/extract-formula-{task_id}.json \
  [--parallel N]
```

Orchestrates the 3-agent workflow:
- Launches cropping agent (uses `crop-formula.py`)
- Launches extraction agent
- Launches verification agent
- Handles agent coordination and re-crop loops

**3. `scripts/link-formula-to-citation.py`** (Future)
```bash
python3 scripts/link-formula-to-citation.py \
  --formula-metadata path/to/metadata.json \
  --citation-key citation-key-name
```

Links verified formula to citation in `citations.json`.

## Quality Metrics

Track agent performance:

**Cropping Agent**:
- Average iterations to successful crop
- Success rate (crops verified vs re-crop requests)
- Common failure modes

**LaTeX Extraction Agent**:
- Extraction accuracy (verified vs corrected)
- Confidence levels
- Common transcription errors

**Verification Agent**:
- Approval rate
- LaTeX fix rate
- Re-crop request rate
- False positive/negative rates

**Store in**: `docs/logs/formula-extraction-metrics.json`

## Example End-to-End Workflow

### Current Workflow (With Implemented Script)

```bash
# 1. Agent reads full page and identifies crop boundaries
#    Agent determines: top=59.1%, bottom=71.8%

# 2. Agent creates the crop using the script
python3 scripts/crop-formula.py \
  --pdf lectures_on_convex_optimization \
  --page 276 \
  --top-percent 59.1 \
  --bottom-percent 71.8 \
  --theorem "Theorem 4.1.6" \
  --equation "(4.1.36)" \
  --description "Convergence bound for gradient-dominated functions"

# Output:
#   docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.png
#   docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.json

# 3. Agent reads the cropped image to verify quality
#    If not satisfied, re-crop with adjusted coordinates (use --force)

# 4. Agent reads the metadata file and cropped image
#    Extracts LaTeX using intense prompt

# 5. Agent updates the metadata file with extracted LaTeX:
cat docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.json
# Shows: status="latex_extracted", latex.formula="..."

# 6. Verification agent reads metadata and images
#    Verifies crop and LaTeX accuracy
#    Updates metadata with verification results

# 7. Final verified metadata
cat docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.json
# Shows: status="verified", verification.verified=true
```

### Future Workflow (With Orchestration Scripts)

```bash
# 1. Create extraction task (future script)
python3 scripts/create-formula-task.py \
  --pdf lectures_on_convex_optimization \
  --page 276 \
  --theorem "Theorem 4.1.6" \
  --equation "(4.1.36)" \
  --description "Convergence bound for gradient-dominated functions"

# Output: tasks/extract-formula-theorem_4_1_6.json

# 2. Run extraction workflow (future script)
python3 scripts/run-formula-extraction.py \
  --task-file tasks/extract-formula-theorem_4_1_6.json

# This orchestrates:
#   - Cropping agent (uses crop-formula.py, may iterate 1-3 times)
#   - LaTeX extraction agent (updates metadata)
#   - Verification agent (finalizes metadata)

# 3. Check results
cat docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.json

# 4. If verified, integrate with citation (future script)
python3 scripts/link-formula-to-citation.py \
  --formula-metadata docs/references/extracted-pages/formulas/lectures_on_convex_optimization_p276_theorem_4_1_6.json \
  --citation-key gd-convex-sublinear-convergence-nesterov-2018
```

## Appendix A: Intense Extraction Prompt

(Include the full intense prompt from DPI test here)

See `docs/logs/2025-11-12-dpi-test.md` Appendix B for the complete prompt.

Key elements:
- Critical warnings about common errors
- 7-step verification procedure
- Examples of failure modes
- Character-by-character transcription guidance

## Appendix B: Cropping Decision Tree

```
START: Read full page image
   │
   ▼
Locate target equation by number
   │
   ├─ Found → Continue
   └─ Not found → Flag for human review
   │
   ▼
Identify equation boundaries
   │
   ├─ TOP: Start of introductory text or equation itself
   ├─ BOTTOM: End of equation number
   ├─ LEFT: 0% (full width)
   └─ RIGHT: 100% (full width)
   │
   ▼
Calculate crop percentages
   │
   ▼
Create cropped image
   │
   ▼
Self-verify crop quality
   │
   ├─ Contains target equation? → Yes/No
   ├─ ONLY target equation? → Yes/No
   ├─ Has minimal context? → Yes/No
   └─ Excludes other equations? → Yes/No
   │
   ├─ All YES → Done, proceed to extraction
   └─ Any NO → Adjust boundaries, re-crop (max 5 iterations)
```

## See Also

- **[scripts/crop-formula.py](../../scripts/crop-formula.py)** - Implemented cropping script (source code)
- [Formula Extraction Workflow](formula-extraction-workflow.md) - Semi-automated cropping workflow
- [Citation Workflow](citation-workflow.md) - Main citation creation process
- [Citation Verification](citation-verification.md) - Verification procedures
- [DPI Test Results](../logs/2025-11-12-dpi-test.md) - Empirical evidence for cropping approach
