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

**You are extracting a formula?** Follow this **3-checkpoint workflow**:

### Checkpoint 1: Cropping Phase

1. **Read the full page image** to locate the target formula visually
2. **Determine crop boundaries** as percentages of page height (0-100%)
   - Add extra padding for fractions: 1.5-2.5% at bottom
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
4. **✓ CHECKPOINT 1: Verify the crop** by reading the generated image
   - Is the denominator complete? (check for "+4", "+1", etc.)
   - Is the equation number visible?
   - Are all subscripts/superscripts present?
   - **If NO to any: Re-crop with `--force` and adjusted boundaries**
   - **If YES to all: Proceed to LaTeX extraction**

### Checkpoint 2: LaTeX Extraction Phase

5. **Extract LaTeX from the crop** (not from the full page!)
6. **✓ CHECKPOINT 2: Verify formula is complete in crop**
   - Can you see the full formula to extract LaTeX?
   - Is anything cut off that prevents accurate LaTeX extraction?
   - **If crop is incomplete: STOP - Go back to Checkpoint 1 and re-crop**
   - **If crop is complete: Proceed with LaTeX extraction**

### Checkpoint 3: Final Verification Phase

7. **Compare extracted LaTeX character-by-character against the crop**
8. **✓ CHECKPOINT 3: Verify LaTeX matches complete formula**
   - Does the crop show the complete formula?
   - Does the LaTeX match what's visible in the crop?
   - **If crop is incomplete: STOP - Go back to Checkpoint 1**
   - **If LaTeX has errors but crop is complete: Fix LaTeX only**
   - **If both are correct: Formula extraction complete!**

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
- **CRITICAL: Always verify the crop by reading the image before finalizing**
  - Don't trust the crop boundaries - actually look at the extracted image
  - Check denominators, subscripts, equation numbers, conditions
  - Use `--force` to re-crop if anything is cut off
- **Add generous padding for fractions**: 1.5-2% extra at the bottom minimum
  - Example: A formula `f(x) ≤ 2L||x||²/(k+4)` needs room for the "+4"
  - Single-character denominators: add ~1-1.5% bottom padding
  - Multi-character denominators (like "k+4"): add ~2-2.5% bottom padding
  - Multi-line denominators: add ~3-4% bottom padding
- **Verification checklist after each crop**:
  - ✓ Full denominator visible (including all terms like "+4", "+1", etc.)
  - ✓ Equation number not clipped
  - ✓ Subscripts/superscripts complete
  - ✓ Any conditions (k ≥ 0, etc.) included
  - ✓ No formula content touching bottom edge

**Real example from citation work**:
```bash
# ❌ BAD: First attempt cut off "+4" in denominator k+4
--bottom-percent 67.0  # Too tight!

# ✅ GOOD: Extended to show complete denominator
--bottom-percent 68.5  # Includes "+4"
```

**Iterative cropping workflow**:
1. Make initial crop with generous bottom padding
2. Read the extracted image to verify completeness
3. If anything is cut off, use `--force` and adjust boundaries
4. Repeat until crop is perfect - don't settle for "good enough"

**Context balance**:
- Include 1-2 lines of context above the formula
- Don't include other equations or excessive prose
- Full page width is usually best for formulas
- Context text above helps readers understand the formula

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

## Appendix A: Full Cropping Agent Prompt Template

```
FORMULA CROPPING TASK - HIGH QUALITY EXTRACTION

You are tasked with cropping [EQUATION] from [THEOREM] on page [PAGE_NUM] of [BOOK].

SOURCE IMAGE: {full_page_path}
(Should be 300 DPI / high resolution for best quality)

TARGET FORMULA:
- Theorem: [THEOREM]
- Equation: [EQUATION]
- Expected form: [BRIEF DESCRIPTION]
- Context: [BRIEF CONTEXT]

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
   Use scripts/crop-formula.py with your calculated boundaries:
   ```bash
   python3 scripts/crop-formula.py \
     --pdf [PDF_ID] \
     --page [PAGE_NUM] \
     --top-percent TOP \
     --bottom-percent BOTTOM \
     --theorem "[THEOREM]" \
     --equation "[EQUATION]" \
     --description "[DESCRIPTION]"
   ```

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

OUTPUT:
Return a summary of:
1. The crop coordinates you used (top and bottom percentages)
2. Number of iterations needed
3. Final assessment that crop is perfect and ready for LaTeX extraction
4. Path to the generated formula image and metadata JSON

Do NOT extract LaTeX. Your job is ONLY to produce a perfect crop.
```

## Appendix B: Full LaTeX Extraction Agent Prompt Template

```
LATEX EXTRACTION FROM CROPPED FORMULA - MAXIMUM ACCURACY REQUIRED

You are extracting LaTeX from a cropped image containing [EQUATION] from [THEOREM].

CROPPED IMAGE: {cropped_image_path}
METADATA FILE: {metadata_path}

TARGET: [EQUATION] from [THEOREM]
EXPECTED FORM: [BRIEF DESCRIPTION]

CRITICAL REQUIREMENTS FOR ACCURATE TRANSCRIPTION:

1. **SYMBOL RECOGNITION:**
   - \| for norms (not | or ||)
   - Subscripts: x_k, x_0, etc. (watch for 0 vs O)
   - Superscripts: x^*, exponents like ^2
   - Greek letters: \mu, \alpha, \beta, \gamma, \nabla, etc.
   - \langle and \rangle for inner products (if applicable)

2. **FRACTION STRUCTURE:**
   - Identify ALL fractions in the formula
   - For each fraction: carefully extract numerator and denominator
   - Watch for nested fractions (fractions within fractions)
   - Use \frac{numerator}{denominator}

3. **PARENTHESES AND GROUPING:**
   - \left( and \right) for large parentheses around fractions
   - Every parenthesis matters - they define grouping
   - Watch for implicit multiplication: (a+b)c means (a+b) × c

4. **EXPONENTS:**
   - Identify what is squared: x^2 vs (...)^2
   - Check if entire expressions are raised to powers
   - Exponent position matters: a^{bc} vs a^b × c

5. **INEQUALITY:**
   - \leq (≤) vs \geq (≥)
   - Direction matters enormously

VERIFICATION PROCEDURE:

Step 1: Read the cropped image carefully
Step 2: Identify the complete formula structure
Step 3: Break down each component:
   - What's on the left side of the inequality/equation?
   - What's on the right side?
   - What are the fractions, products, sums?
Step 4: Transcribe character by character
Step 5: Verify all symbols, subscripts, superscripts
Step 6: Count and balance all parentheses
Step 7: Check that exponents are in the right places
Step 8: Triple-check the complete structure

CRITICAL WARNINGS - Common failure modes to avoid:

- FRACTION STRUCTURE ERRORS: Preserve exact structure of nested fractions
- PARENTHESES: Every parenthesis matters - (k + 3/2) ≠ (k + 3)/2
- COEFFICIENT POSITIONING: 3γ/2 means (3×γ)/2, NOT 3/(2γ)
- SYMBOL RECOGNITION: ω̂ (omega with hat) vs ω vs w
- EXPONENTS: Where does the squared apply? γ² vs (...)²

RESPONSE FORMAT:

Return ONLY the complete LaTeX formula.

Format: [left-hand side] \leq [right-hand side]

This transcription will be used for citation verification. Accuracy is paramount.
```

## Appendix C: Intense LaTeX Extraction Prompt (Legacy - from DPI Test)

This is the original intense prompt from the DPI testing that achieved 100% accuracy with cropped images:

```
CRITICAL MATHEMATICAL TRANSCRIPTION TASK - MAXIMUM ACCURACY REQUIRED

You are tasked with transcribing equation (X.Y.Z) from the image into LaTeX notation. This is a critical task that requires EXTREME attention to detail.

TARGET: The convergence bound formula numbered (X.Y.Z) that has the form:
[expected pattern, e.g., f(x_k) - f(x^*) ≤ ...]

CRITICAL WARNINGS - Common failure modes you MUST avoid:

1. WRONG FORMULA EXTRACTION:
   - Extract ONLY equation (X.Y.Z) - the numbered equation in the image
   - Do NOT extract text or other formulas

2. FRACTION STRUCTURE ERRORS:
   - Complex nested fractions are present - you MUST preserve the exact structure
   - Pay attention to what is in the numerator vs denominator
   - Watch for fractions WITHIN the numerator or denominator
   - Example: γ²(2+3γ/2)² is NOT the same as γ²/(2+3γ/2)²

3. PARENTHESES AND GROUPING:
   - Every parenthesis, bracket, and brace matters
   - (k + 3/2) is DIFFERENT from (k + 3)/2
   - Multiplication can be implicit: (k + 3/2)γ means (k + 3/2) × γ

4. COEFFICIENT POSITIONING:
   - 3/2 is DIFFERENT from 2/3
   - 3γ/2 means (3×γ)/2, NOT 3/(γ/2) or 3/(2γ)
   - The position of variables in fractions is critical

5. SYMBOL RECOGNITION:
   - ω̂ (omega with hat) vs ω (plain omega) vs w
   - γ (gamma) vs y vs v
   - DO NOT invent symbols that aren't in the formula (no λ, β, etc. unless clearly present)

6. INEQUALITY DIRECTION:
   - ≤ vs ≥ matters enormously
   - Check carefully which direction the inequality points

7. EXPONENTS:
   - Is it squared? γ² vs γ
   - Is the entire expression squared? (...)²
   - Where exactly does the exponent apply?

VERIFICATION PROCEDURE - You MUST follow these steps:

Step 1: Locate equation (X.Y.Z) in the image
Step 2: Identify the convergence bound inequality (f(x_k) - f(x^*) ≤ ...)
Step 3: Carefully examine the RIGHT side of the inequality - this is what you're transcribing
Step 4: Break down the structure:
   - What's being multiplied at the top level?
   - What's in the numerator of any fractions?
   - What's in the denominator?
   - What's squared or raised to other powers?
Step 5: Transcribe character by character, checking each symbol
Step 6: TRIPLE CHECK your transcription against the image:
   - Count parentheses - do they match?
   - Verify every coefficient (all numbers)
   - Verify every variable (γ, k, etc.)
   - Check the exponents
   - Verify the inequality direction
Step 7: Ask yourself: "Could I render this LaTeX and have it look identical to the image?"

RESPONSE FORMAT:
Return ONLY the complete LaTeX formula for equation (X.Y.Z).
Do NOT include explanation, do NOT include partial work.
Format: f(x_k) - f(x^*) \leq [complete right-hand side]

This transcription will be used in a critical research context. Accuracy is paramount. Take your time and be meticulous.
```

See [docs/logs/2025-11-12-dpi-test.md](../logs/2025-11-12-dpi-test.md) Appendix B for the original source of this prompt.

## Appendix D: Cropping Decision Tree

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
- [Citation Workflow](citation-workflow.md) - Main citation creation process
- [Citation Verification](citation-verification.md) - Verification procedures
- [DPI Test Results](../logs/2025-11-12-dpi-test.md) - Empirical evidence for cropping approach (100% accuracy with crops)
- [Citation Formula Verification Log](../logs/2025-11-12-citation-formula-verification.md) - Results from verifying top 5 citations

## Safeguards to Prevent Errors

### Page Number Consistency

**CRITICAL**: When adding `proofPages` to a citation, you MUST update the `pages` and `pdfPages` fields to match.

**Problem**: If `proofPages` shows different pages than `pages`/`pdfPages`, the citation references the wrong location.

**Prevention**:

1. **After extracting proofPages**, run the consistency checker:
   ```bash
   python3 scripts/verify-page-consistency.py
   ```

2. **If mismatches found**, fix automatically:
   ```bash
   python3 scripts/fix-page-numbers.py
   ```

3. **Verify the fixes** by regenerating reports:
   ```bash
   npx tsx scripts/render-citations.ts
   ```

### Quote and Formula Verification

**When extracting formulas**, agents must verify:

1. **Step size bounds**: Check for strict vs non-strict inequalities (< vs ≤)
   - Theorem statement is authoritative
   - Don't round strict inequalities to non-strict

2. **Notation consistency**: 
   - Use source notation (e.g., parentheses vs angle brackets for inner products)
   - Document any notation changes in formula metadata

3. **Formula completeness**:
   - Check all terms, subscripts, superscripts
   - Verify denominators aren't cut off in crops

### Pre-Commit Checks

Before committing changes to citations.json:

```bash
# 1. Check page consistency
python3 scripts/verify-page-consistency.py

# 2. Regenerate reports to verify formatting
npx tsx scripts/render-citations.ts

# 3. Review generated reports in docs/references/renders/
```

## Page Number Verification Protocol

**CRITICAL**: Page numbers must be consistent across all citation fields. Many citation errors stem from incorrect page number mappings.

### Page Number Mapping Formula

```
PDF Page = Book Page + pageOffset
```

The `pageOffset` is defined in `docs/references/references.json` for each reference.

**Example** (Nocedal & Wright 2006):
```json
{
  "nocedal-wright-2006": {
    "pageOffset": 20
  }
}
```

So for book page 140:
```
PDF Page = 140 + 20 = 160
```

### Verification Checklist

When processing a citation, verify:

1. **Book pages match content**: Read the extracted page images and check page headers
   - If citation says "pages: 140" but image shows page 116, pages are wrong

2. **PDF pages match book pages**:
   - Calculate: `book page + pageOffset = PDF page`
   - If calculation doesn't match listed `pdfPages`, one is wrong

3. **proofPages match pdfPages**:
   - `proofPages` should list images matching the `pdfPages` range
   - Example: `pdfPages: "160"` → `proofPages: ["numericaloptimization2006_page_0160.png"]`

4. **Formula locations match citation pages**:
   - If extracting formulas, verify they're on the pages listed in citation
   - Formula metadata `page` field should match citation pages

### Common Page Number Errors

**Error 1: Wrong chapter/section referenced**
```json
// WRONG - Listed pages 116-120 (Chapter 5) but equation is in Chapter 6
{
  "pages": "116-120",
  "pdfPages": "136-140",
  "theorem": "Equation (6.19)"  // Chapter 6 equation!
}

// CORRECT - Updated to actual location
{
  "pages": "140",
  "pdfPages": "160",
  "theorem": "Equation (6.19)"
}
```

**Error 2: pageOffset applied backwards**
```json
// If pages seem off by ~20, check if offset is applied backwards
// Try: actual_pdf_page = book_page + offset
// Or: actual_pdf_page = book_page - offset
```

**Error 3: Inconsistent page ranges**
```json
// WRONG - pages and pdfPages don't match via offset
{
  "pages": "42-44",
  "pdfPages": "136-140"  // Should be 62-64 (42+20 to 44+20)
}
```

### Page Verification Script

When processing citations, verify page numbers:

```bash
# Check that book page + offset = PDF page for all citations
# (Script to be implemented)
python3 scripts/verify-citation-pages.py
```

## Quote Verification Protocol

**CRITICAL**: Quotes must be verbatim from the source. Common errors include composite quotes and incorrect expansion of equation references.

### Quote Requirements

1. **Verbatim text**: Quote must match source word-for-word
   - No paraphrasing
   - No combining text from multiple locations
   - Preserve original notation and symbols

2. **Equation references preserved**: Keep equation references as-is
   ```latex
   // CORRECT - Preserve equation reference
   "the formula (3.24) shows..."

   // WRONG - Expanding equation reference
   "the formula $f(x) = \frac{1}{2}x^T Q x - b^T x$ shows..."
   ```

3. **Composite quotes flagged**: If combining text from different locations, use `[...]`
   ```latex
   "Theorem 3.3. [...] Theorem 3.4. [...]"  // OK - shows text is combined
   ```

4. **Mathematical notation**: Use source notation exactly
   - `$\mathscr{F}_L^{1,1}$` if that's what the source uses (2018 Nesterov)
   - `$F_L^{1,1}$` if that's what the source uses (2004 Nesterov)
   - Don't "standardize" notation across different editions

### Common Quote Errors

**Error 1: Composite quote without indication**
```json
// WRONG - Combined equation definition with theorem statement
{
  "quote": "The update formula for $B_k$ is... where $s_k = x_{k+1} - x_k$ and $y_k = g_{k+1} - g_k$."
}
// The "where" clause was from a different paragraph!

// CORRECT - Quote only the contiguous text
{
  "quote": "The update formula for $B_k$ is obtained by simply applying the Sherman–Morrison–Woodbury formula (A.28) to (6.17) to obtain $B_{k+1} = ...$"
}
```

**Error 2: Expanding equation references**
```json
// WRONG - Expanded "(3.24)" to full formula
{
  "quote": "...applied to the strongly convex quadratic function $f(x) = \\frac{1}{2}x^T Q x - b^T x$..."
}

// CORRECT - Preserved equation reference
{
  "quote": "...applied to the strongly convex quadratic function (3.24)..."
}
```

**Error 3: Mathematical notation errors**
```json
// WRONG - Used closed interval
{
  "quote": "...satisfying $r \\in [\\frac{\\lambda_n - \\lambda_1}{\\lambda_n + \\lambda_1}, 1]$..."
}

// CORRECT - Source uses half-open interval (r < 1, not r ≤ 1)
{
  "quote": "...satisfying $r \\in \\left[\\frac{\\lambda_n - \\lambda_1}{\\lambda_n + \\lambda_1}, 1\\right)$..."
}
```
This is mathematically significant - closed vs open intervals affect theorem validity.

### Quote Verification Procedure

When processing a citation:

1. **Read the source pages** specified in `proofPages`
2. **Locate the quoted text** on those pages
3. **Compare character-by-character**:
   - All words match?
   - All symbols match ($\leq$ vs $\geq$)?
   - All equation references preserved?
   - Interval notation correct ([ vs ( and ] vs ))?
4. **If quote is wrong**: Fix it and document in `verificationNotes`
5. **If quote changes**: Update related `claim` and pedagogical text

## Claim Requirements

**CRITICAL**: Claims must be standalone statements about what we're asserting on the website. Claims cannot reference equations by number.

### Claim vs Quote

- **Claim**: What we assert on the website (must be standalone)
- **Quote**: Evidence from source material backing up the claim

### Claim Requirements

1. **Standalone**: Reader should understand claim without reading other equations
   ```
   // WRONG - References other equations
   "The BFGS update is obtained by applying Sherman-Morrison-Woodbury to equation (6.17)"

   // CORRECT - Standalone statement with formula
   "The BFGS method updates the Hessian approximation $B_k$ using a rank-two formula: $B_{k+1} = B_k - \frac{B_k s_k s_k^T B_k}{s_k^T B_k s_k} + \frac{y_k y_k^T}{y_k^T s_k}$"
   ```

2. **Match what quote proves**: Don't claim properties not proven in the quote
   ```json
   // WRONG - Quote only gives formula, not proofs of properties
   {
     "claim": "The BFGS update formula maintains positive definiteness and satisfies the secant equation",
     "quote": "The update formula for $B_k$ is obtained by... $B_{k+1} = ...$"
   }

   // CORRECT - Claim only what quote shows
   {
     "claim": "The BFGS method updates the Hessian approximation using a rank-two formula: [formula]",
     "quote": "The update formula for $B_k$ is obtained by... $B_{k+1} = ...$"
   }
   ```

3. **Concise**: Focus on the key assertion, avoid excessive context
   ```
   // TOO LONG
   "When the steepest descent method with exact line searches (3.26) is applied to strongly convex quadratic functions (3.24), with error norm (3.27), it achieves linear convergence"

   // BETTER
   "Steepest descent with exact line search achieves linear convergence on strongly convex functions, with rate determined by the Hessian eigenvalues"
   ```

### Separating Claims from Equations

If you want to claim properties about a formula:

1. **Citation 1**: Formula definition (what we did)
   - Claim: "The BFGS update formula is: [formula]"
   - Quote: Source giving the formula

2. **Citation 2**: Positive definiteness property (would need separate citation)
   - Claim: "The BFGS update maintains positive definiteness when..."
   - Quote: Source proving this property (e.g., Theorem 6.2)

3. **Citation 3**: Secant equation property (would need separate citation)
   - Claim: "The BFGS update satisfies the secant equation..."
   - Quote: Source proving this property

## Common Citation Errors and Fixes

Based on processing 22 citations, here are critical errors found and how they were fixed:

### Error 1: Wrong Page Numbers
**Citation**: bfgs-update-formula-nocedal-wright-2006
**Error**: Listed pages 116-120 (Chapter 5) but equation (6.19) is in Chapter 6, page 140
**Root cause**: Incorrect book pages pointing to wrong chapter
**Fix**: Updated pages to 140, pdfPages to 160 (140 + 20 offset)
**Verification**: Extracted page 160, confirmed equation (6.19) present

### Error 2: Composite Quotes
**Citation**: bfgs-update-formula-nocedal-wright-2006
**Error**: Quote included "where $s_k = ...$" clause not appearing contiguously after the formula
**Root cause**: Agent combined text from different locations
**Fix**: Removed "where" clause, quoted only contiguous text
**Verification**: Checked source page, confirmed quote is now verbatim

### Error 3: Expanded Equation References
**Citation**: gd-linesearch-strongly-convex-linear-convergence-nocedal-wright-2006
**Error**: Quote expanded "(3.24)" to full formula "$f(x) = \frac{1}{2}x^T Q x - b^T x$"
**Root cause**: Agent "helpfully" expanded equation reference
**Fix**: Preserved equation reference as "(3.24)"
**Verification**: Checked source, confirmed reference not expanded

### Error 4: Interval Notation Error
**Citation**: gd-linesearch-strongly-convex-linear-convergence-nocedal-wright-2006
**Error**: Used closed bracket `[..., 1]` instead of half-open interval `[..., 1)`
**Root cause**: Agent didn't distinguish between ) and ]
**Significance**: Mathematically significant - affects whether r=1 is allowed
**Fix**: Corrected to `\left[..., 1\right)` with parenthesis
**Verification**: Checked source image, confirmed half-open interval

### Error 5: Claims Referencing Equations
**Citation**: bfgs-update-formula-nocedal-wright-2006
**Error**: Claim stated "obtained by applying Sherman–Morrison–Woodbury formula to equation (6.17)"
**Root cause**: Claim copied theorem derivation text
**Fix**: Made claim standalone: "The BFGS method updates the Hessian approximation using a rank-two formula: [formula]"
**Principle**: Claims must be standalone statements for website

### Error 6: Claims Not Matching Quotes
**Citation**: bfgs-update-formula-nocedal-wright-2006
**Error**: Claim asserted formula "maintains positive definiteness and satisfies secant equation" but quote only gave formula derivation
**Root cause**: Claimed properties not proven in the quoted theorem
**Fix**: Updated claim to only state what quote proves (the formula itself), noted that properties need separate citations
**Principle**: Don't overstate what the quote proves

### Error 7: Field Naming Inconsistency
**Citation**: lbfgs-linear-convergence-liu-nocedal-1989
**Error**: Agent created "formulas" array instead of "formulaImages" array
**Root cause**: Agent used inconsistent field naming
**Fix**: Renamed field to "formulaImages" to match other citations
**Verification**: Confirmed all other citations use "formulaImages"

## Agent Processing at Scale

### Parallel Agent Execution

When processing multiple citations, launch agents in parallel for efficiency:

```typescript
// Launch 10 agents in parallel
// Each agent processes one citation independently
Task([
  { agent: "process-citation-1", citation: "newton-quadratic-convergence" },
  { agent: "process-citation-2", citation: "inexact-newton-superlinear" },
  { agent: "process-citation-3", citation: "gd-smooth-descent" },
  // ... up to 10 parallel agents
], { parallel: true })
```

**Benefits**:
- 10x faster than sequential processing
- Each agent has independent context
- Failures isolated to individual citations

**Considerations**:
- Use `haiku` model for efficiency on straightforward tasks
- Use `sonnet` for complex verification tasks
- Maximum ~10 parallel agents to avoid rate limits

### Agent Task Structure

Each agent should:

1. **Read citation file** to understand current state
2. **Read proof page images** to verify content
3. **Extract formula images** using crop-formula.py
4. **Extract LaTeX** from formula images
5. **Verify** quote matches source, claim matches quote
6. **Fix errors** found during verification
7. **Update citation file** with formulaImages array
8. **Report results** with summary of changes

### Agent Prompt Template

```
CITATION FORMULA EXTRACTION AND VERIFICATION

You are processing citation: {citation_key}

TASKS:
1. Read citation file: docs/citations/{citation_key}.json
2. Read proof pages listed in proofPages array
3. For each formula in the quote:
   a. Extract formula image using crop-formula.py
   b. Extract LaTeX from formula image
   c. Add to formulaImages array
4. Verify:
   - Pages are correct (check page headers)
   - Quote is verbatim from source
   - Claim is standalone (no equation references)
   - Claim matches what quote proves
5. Fix any errors found
6. Update citation file with all changes
7. Report what you did

CRITICAL CHECKS:
- Book page + pageOffset = PDF page
- Quote is verbatim (no composite quotes)
- Equation references preserved in quotes
- Claim doesn't reference other equations
- Claim doesn't overstate what quote proves

OUTPUT:
Provide a summary of:
- Formulas extracted (count and equation numbers)
- Errors found and fixed
- Verification status
```

### Field Naming Standards

**Always use these field names** (consistent across all citations):

- `formulaImages` - Array of formula metadata (NOT "formulas")
- `proofPages` - Array of page image paths (NOT "proof_pages")
- `pdfPages` - String with PDF page range (NOT "pdf_pages")
- `verificationNotes` - String with notes (NOT "verification_notes")

### Agent Quality Checks

After agent completes:

1. **Check field names**: All match standards?
2. **Check formulaImages structure**: All have required fields?
   ```json
   {
     "formula_id": "...",
     "metadata_path": "...",
     "image_path": "...",
     "latex": "...",
     "verified": true,
     "theorem": "...",
     "equation": "..."
   }
   ```
3. **Check page consistency**: Book page + offset = PDF page?
4. **Check quote**: Verbatim from source?
5. **Check claim**: Standalone and matches quote?

## Error Recovery

If errors are found after the fact:

1. **Identify source**: Check verification logs and agent reports
2. **Fix root cause**: Update citations.json and formula metadata
3. **Re-extract if needed**: Use correct page numbers
4. **Regenerate**: Run render-citations.ts to update all reports
5. **Document**: Add notes about what was fixed and why

## Common Errors and How to Avoid Them

### Error 1: Cut Off Denominators

**Problem**: The most common and critical error. Fraction denominators get clipped, losing mathematical content.

**Example from real citation work**:
```
Formula: f(x_k) - f^* ≤ 2L||x_0-x*||²/(k+4)
❌ First crop showed: .../(k      ["+4" cut off!]
✅ After fix showed: .../(k+4).   [Complete!]
```

**Impact**:
- Quote becomes inaccurate (said "k" but source says "k+4")
- Citation verification fails
- Misleading information in published citation

**Prevention**:
1. **Always add 1.5-2.5% extra bottom padding** for formulas with fractions
2. **Verify by reading the image** - don't trust the crop coordinates
3. **Use iterative approach**: First crop → verify → adjust if needed → verify again
4. **Check for multi-term denominators**: Look for "+", "-", parentheses in denominators

**Fix if found**:
```bash
# Re-crop with more bottom padding
python3 scripts/crop-formula.py \
  --pdf [pdf_id] \
  --page [page] \
  --top-percent [top] \
  --bottom-percent [old_bottom + 1.5]  # Add 1.5-2% more
  --force
```

### Error 2: Clipped Equation Numbers

**Problem**: The equation reference number (like "(2.1.39)") is partially or fully cut off.

**Prevention**:
- Check right margin - equation numbers often appear at right edge
- Add ~2% padding on the right if equation number is visible
- Verify equation number is complete in the cropped image

### Error 3: Missing Subscripts/Superscripts

**Problem**: Small subscript or superscript characters get clipped at bottom or top.

**Prevention**:
- Check formulas with nested subscripts (like $x_{k+1}$)
- Verify superscripts on tall expressions (like $e^{-L||x||^2}$)
- Add padding top and bottom for complex expressions

### Error 4: Not Verifying Extractions

**Problem**: Assuming the crop worked without actually looking at the result.

**Prevention**:
- **ALWAYS** use the Read tool to view the extracted image
- Check every formula image before moving to the next step
- Use `--force` to re-crop if anything looks wrong
- Don't trust coordinates - trust what you see

**Workflow**:
```bash
# 1. Crop
python3 scripts/crop-formula.py --pdf ... --page ...

# 2. CRITICAL: Verify by reading
Read: docs/references/extracted-pages/formulas/[formula].png

# 3. If incomplete, re-crop with --force
python3 scripts/crop-formula.py ... --force

# 4. Verify again
Read: docs/references/extracted-pages/formulas/[formula].png
```

### Error 5: LaTeX Doesn't Match Image

**Problem**: LaTeX extraction has typos or doesn't match the cropped formula.

**Prevention**:
- Extract LaTeX **from the crop**, not from OCR of full page
- Compare LaTeX character-by-character against the image
- Pay special attention to: +/-, subscripts, exponents, parentheses
- Example: "k" vs "k+4" - easy to miss the "+4"

**Verification**:
```json
{
  "latex": {
    "formula": "f(x_k) - f^* \\leq \\frac{2L\\|x_0-x^*\\|^2}{k+4}.",
    // ✓ Matches image: denominator is "k+4"
  }
}
```
