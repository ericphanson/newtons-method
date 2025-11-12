# Formula Extraction Workflow

## Purpose

This workflow enables accurate extraction of mathematical formulas from PDF pages using vision-based AI agents. Based on empirical testing (see `docs/logs/2025-11-12-dpi-test.md`), agents achieve **100% accuracy** when given cropped formula images but **0% accuracy** on full-page images.

## Key Insight

**Problem**: When shown full PDF pages with multiple theorems/formulas, agents cannot reliably identify and extract the correct formula, even with explicit instructions.

**Solution**: Crop pages to show only the target formula plus minimal context (theorem number, introduction sentence).

## Test Results Summary

| Approach | Success Rate | Notes |
|----------|--------------|-------|
| Full pages (150-600 DPI) | 0% | Agents extract wrong formulas or hallucinate |
| Cropped formulas (150-600 DPI) | 100% | Perfect transcription every time |

**Conclusion**: Image cropping is essential; DPI resolution (150-600) doesn't matter.

## Workflow Overview

```
1. Extract full PDF pages (existing workflow)
   ↓
2. Identify formula regions (manual or semi-automated)
   ↓
3. Crop to formula-specific images
   ↓
4. Agent extracts LaTeX from cropped image
   ↓
5. Human verification
   ↓
6. Store cropped images + LaTeX in citations
```

## Phase 1: Manual Cropping (Current Capability)

### Step 1: Extract Full Pages

Use existing workflow:

```bash
# Extract pages containing the formula
python3 scripts/extract-pdf-pages.py lectures_on_convex_optimization 276
```

### Step 2: Manually Identify Formula Bounds

Open the extracted page and visually identify:
- **Top boundary**: Start of theorem/equation introduction (e.g., "2. If f(x₀)...")
- **Bottom boundary**: End of equation including equation number
- **Left/Right boundaries**: Full page width (formulas can be wide)

Record coordinates or approximate percentages.

### Step 3: Crop Using ImageMagick

```bash
# Manual crop using convert (ImageMagick)
convert input_page.png -crop WIDTHxHEIGHT+X+Y output_formula.png

# Example for Theorem 4.1.6 at 300 DPI:
convert lectures_on_convex_optimization_page_0276.png \
  -crop 1831x360+0+1640 \
  theorem_4_1_6_formula.png
```

**Crop guidelines**:
- Include: Equation number, the formula, minimal context (1-2 lines)
- Exclude: Other equations, unrelated theorems, excessive prose
- Width: Usually full page width (formulas can be wide)
- Height: Just enough to show the formula + context (~3-5 lines of text)

### Step 4: Extract LaTeX from Cropped Image

Use an agent with the intense prompt (see Appendix A):

```bash
# Create agent task to extract LaTeX
# Agent reads cropped image and returns LaTeX notation
```

### Step 5: Verify and Store

- Manually verify the extracted LaTeX renders correctly
- Store cropped image in `docs/references/extracted-pages/formulas/`
- Add LaTeX to citation in `docs/citations.json`

## Phase 2: Semi-Automated Cropping (Recommended Next Step)

### Tool: `extract-formula-region.py`

Create a new script that takes manual coordinates:

```bash
# Extract formula with manual coordinates
python3 scripts/extract-formula-region.py \
  --pdf lectures_on_convex_optimization \
  --page 276 \
  --top-percent 59 \
  --bottom-percent 72 \
  --output formulas/theorem_4_1_6.png
```

**Why percentages?**
- Works across different DPI settings
- More intuitive than pixel coordinates
- Easier to document and reproduce

**Script functionality**:
1. Load full page at specified DPI
2. Calculate pixel coordinates from percentages
3. Crop to formula region
4. Save with descriptive filename
5. Return path for citation workflow

### Integration with Citation Workflow

Update `docs/citations.json` schema to include formula crops:

```json
{
  "citations": {
    "gd-convex-sublinear-convergence-nesterov-2018": {
      "proofPages": [
        "docs/references/extracted-pages/lectures_on_convex_optimization_page_0100.png",
        "docs/references/extracted-pages/lectures_on_convex_optimization_page_0101.png"
      ],
      "formulaImages": [
        {
          "file": "docs/references/extracted-pages/formulas/theorem_2_1_14_eq.png",
          "theorem": "Theorem 2.1.14",
          "equation": "2.1.14",
          "latex": "f(x_k) - f(x^*) \\leq \\frac{2L\\|x_0-x^*\\|^2}{k+4}",
          "extractedBy": "formula-extraction-agent",
          "extractedDate": "2025-11-12",
          "verifiedBy": "human",
          "cropCoordinates": {
            "page": 101,
            "topPercent": 45,
            "bottomPercent": 55
          }
        }
      ]
    }
  }
}
```

**Benefits**:
- `proofPages`: Full pages for human context
- `formulaImages`: Cropped formulas for agent extraction
- `cropCoordinates`: Reproducible extraction
- `latex`: Verified formula transcription

## Phase 3: Fully Automated Cropping (Future)

### Approach: PDF Text Layout Analysis

Use PDF text extraction with position data to automatically identify formula regions:

```python
# Pseudocode for automated formula detection
import pdfplumber

def find_formula_regions(pdf_path, page_num, theorem_number):
    """
    Automatically locate formula regions by analyzing PDF layout.
    """
    page = pdfplumber.open(pdf_path).pages[page_num]

    # Find theorem number in text
    theorem_bbox = find_text_bbox(page, f"Theorem {theorem_number}")

    # Find equation number (usually in parentheses, right-aligned)
    equation_bbox = find_equation_number_bbox(page, after=theorem_bbox)

    # Determine crop region
    top = theorem_bbox.y0
    bottom = equation_bbox.y1 + margin
    left = 0  # Full width
    right = page.width

    return {
        'top': top / page.height,  # As percentage
        'bottom': bottom / page.height,
        'left': left / page.width,
        'right': right / page.width
    }
```

**Challenges**:
- PDF layout parsing can be complex (multi-column, nested structures)
- Equation numbers aren't always present or standardized
- May require machine learning for robust detection

**Recommendation**: Start with semi-automated (Phase 2) before investing in full automation.

## Prompt Engineering: Intense Formula Extraction Prompt

When extracting formulas from cropped images, use this prompt template:

```
CRITICAL MATHEMATICAL TRANSCRIPTION TASK - MAXIMUM ACCURACY REQUIRED

You are tasked with transcribing equation (X.Y.Z) from the image into LaTeX notation.

TARGET: The convergence bound formula numbered (X.Y.Z) that has the form:
[expected pattern, e.g., f(x_k) - f(x^*) ≤ ...]

CRITICAL WARNINGS - Common failure modes you MUST avoid:

1. FRACTION STRUCTURE ERRORS:
   - Preserve exact structure of nested fractions
   - (2+3γ/2)² ≠ (2+3/2γ)²

2. PARENTHESES AND GROUPING:
   - Every parenthesis matters
   - (k + 3/2)γ means (k + 3/2) × γ

3. COEFFICIENT POSITIONING:
   - 3γ/2 means (3×γ)/2, NOT 3/(2γ)

4. SYMBOL RECOGNITION:
   - ω̂ (omega with hat) vs ω vs w
   - γ (gamma) vs y

5. EXPONENTS:
   - Where does the squared apply? γ² vs (...)²

VERIFICATION PROCEDURE:
1. Locate the numbered equation in the image
2. Identify the full expression after the ≤ or = sign
3. Break down: numerator, denominator, exponents
4. Transcribe character by character
5. TRIPLE CHECK against image
6. Verify all parentheses balance

RESPONSE FORMAT:
Return ONLY the complete LaTeX formula.
[expected form] \leq [complete right-hand side]

This is for critical research. Accuracy is paramount.
```

See full prompt in Appendix A.

## Best Practices

### Cropping Guidelines

**DO include**:
- ✅ Theorem/equation number (e.g., "Theorem 4.1.6", "(4.1.36)")
- ✅ Brief context (1-2 lines introducing the equation)
- ✅ The complete formula/equation
- ✅ Equation label if present (the number in parentheses)

**DON'T include**:
- ❌ Previous equations or theorems
- ❌ Following equations or theorems
- ❌ Excessive explanatory prose
- ❌ Examples or applications (unless critical)

### Crop Dimensions

- **Height**: Typically 10-15% of page height (3-5 lines of text)
- **Width**: Full page width (formulas can be wide)
- **Padding**: Include ~1 line above and below for context

### DPI Settings

Based on testing:
- **150 DPI**: Sufficient for cropped formulas (use this as default)
- **300 DPI**: Use if formulas have very small subscripts/superscripts
- **450-600 DPI**: Overkill, doesn't improve accuracy

### Quality Assurance

1. **Visual inspection**: Human verifies cropped image shows correct formula
2. **Agent extraction**: Agent transcribes LaTeX from cropped image
3. **LaTeX rendering**: Verify LaTeX renders correctly (use KaTeX validator)
4. **Cross-verification**: Compare rendered LaTeX against original image

## Integration with Existing Workflows

### Citation Creation Workflow

Modify the existing citation workflow to include formula extraction:

1. **Search text chunks** (existing)
2. **Extract full pages** (existing)
3. **Extract formula regions** (NEW - this workflow)
4. **Agent extracts LaTeX** (NEW)
5. **Create citation** with both full pages AND formula images
6. **Validate LaTeX** (existing KaTeX validator)

### Citation Verification Workflow

When verifying citations:

1. Check `proofPages` for full context (existing)
2. Check `formulaImages` for LaTeX accuracy (NEW)
3. Re-extract LaTeX from formula image to verify (NEW)
4. Compare extracted LaTeX with stored LaTeX

## Tools Needed

### Immediate (Phase 2)

**Script: `scripts/extract-formula-region.py`**

```bash
python3 scripts/extract-formula-region.py \
  --pdf PDF_ID \
  --page PAGE_NUM \
  --top-percent TOP \
  --bottom-percent BOTTOM \
  [--left-percent LEFT] \
  [--right-percent RIGHT] \
  [--dpi DPI] \
  --output OUTPUT_PATH
```

**Features**:
- Percentage-based coordinates
- Multiple DPI support
- Descriptive filenames
- Validation of crop dimensions

### Future (Phase 3)

**Script: `scripts/auto-detect-formula.py`**

```bash
python3 scripts/auto-detect-formula.py \
  --pdf PDF_ID \
  --page PAGE_NUM \
  --theorem "Theorem 2.1.14" \
  --equation "(2.1.14)" \
  --output OUTPUT_PATH
```

**Features**:
- PDF layout analysis
- Automatic formula detection
- Bounding box visualization
- Confidence scoring

## Appendix A: Full Intense Prompt

```
CRITICAL MATHEMATICAL TRANSCRIPTION TASK - MAXIMUM ACCURACY REQUIRED

You are tasked with transcribing equation (4.1.36) from the image into LaTeX notation. This is a critical task that requires EXTREME attention to detail.

TARGET: The convergence bound formula numbered (4.1.36) that has the form:
f(x_k) - f(x^*) ≤ [some expression]

CRITICAL WARNINGS - Common failure modes you MUST avoid:

1. WRONG FORMULA EXTRACTION:
   - Extract ONLY equation (4.1.36) - the numbered equation in the image
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

Step 1: Locate equation (4.1.36) in the image
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
Return ONLY the complete LaTeX formula for equation (4.1.36).
Do NOT include explanation, do NOT include partial work.
Format: f(x_k) - f(x^*) \leq [complete right-hand side]

This transcription will be used in a critical research context. Accuracy is paramount. Take your time and be meticulous.
```

## References

- [DPI Test Results](../logs/2025-11-12-dpi-test.md) - Empirical testing showing 100% accuracy with cropped images
- [Citation Workflow](citation-workflow.md) - Main citation creation workflow
- [Citation Verification](citation-verification.md) - Verification procedures
