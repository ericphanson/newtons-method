# Citation Usage Verification Prompt Template

Copy and paste the prompt below to have an agent perform complete citation usage verification from scratch.

---

## PROMPT START

I need you to perform a **rigorous, comprehensive verification of all citation usages** in this codebase. The goal is to verify that every citation CLAIM backs up the website TEXT where it's used.

### Context

This is a mathematical optimization visualization website with citations to academic sources (primarily Nesterov 2018 and Nocedal & Wright 2006). Each citation has:
- A JSON file in `docs/citations/` with the source claim, theorem, quote, and extracted formulas
- Usage locations in the React codebase (`src/components/`)

**Your task:** Verify that when the website uses a citation, the citation's CLAIM actually backs up what the website TEXT says at that location.

---

### Verification Procedure (5-Step Rigorous Check)

For each citation usage, perform these checks:

#### 1. **Formula Accuracy Check**
- If website shows a formula, does it EXACTLY match the citation's formula/quote?
- Check numerators, denominators, exponents, inequalities
- Look for: wrong constants, missing factors, squared vs non-squared terms

#### 2. **Inequality Precision Check**
- Does website use `<` where source uses `≤` (or vice versa)?
- Are bounds strict when they should be non-strict?
- Example: `0 < α < 2/L` vs `0 < α ≤ 2/L`

#### 3. **Convergence Scope Check**
- Does website claim GLOBAL convergence but cite a LOCAL theorem?
- Does website claim "from any starting point" but source requires "near minimum"?
- Check for LOCAL vs GLOBAL confusion

#### 4. **Condition Completeness Check**
- Does website state conditions that match the theorem?
- Are necessary conditions missing? (e.g., "Lipschitz continuous Hessian")
- Are sufficient conditions claimed as necessary? (e.g., "requires strong convexity" when it's only sufficient)

#### 5. **Parameter Range Check**
- Do step size ranges match? (e.g., `0 < α < 2/L` vs `0 < α ≤ 1/L`)
- Are optimal values correctly identified?
- Does website show subset of valid range with proper clarification?

---

### Classification System

Classify each finding as:

- **✅ PERFECT MATCH**: Citation claim perfectly backs up website text, no issues
- **⚠️ MINOR ISSUE**: Small discrepancy but acceptable (e.g., citation placement, pedagogical simplification with proper context)
- **❌ ERROR**: Wrong formula, wrong scope, wrong conditions, mismatched inequality (requires fix)

---

### Task Instructions

1. **Find all citation usages** in the codebase:
   - Search for `<Citation citationKey="..."` in `src/components/`
   - You should find approximately 39 usages across 19 unique citation keys

2. **For each usage, perform the 5-step verification**:
   - Read the surrounding text where citation is used
   - Read the citation JSON file in `docs/citations/`
   - Compare the claim/quote/formula in citation to website text
   - Look at extracted formula images if available

3. **Create batches and use parallel agents**:
   - Divide the 39 usages into 5-6 batches
   - Launch parallel sonnet agents to verify each batch
   - Each agent should follow the 5-step procedure rigorously

4. **Pay special attention to**:
   - Recent fixes (check git history for recently modified citations/files)
   - Mathematical formulas (most error-prone)
   - Theorems with LOCAL vs GLOBAL scope
   - BFGS/L-BFGS superlinear convergence conditions
   - Step size bounds and inequalities

5. **Generate a comprehensive markdown report** with:
   - Executive summary (total usages, matches, issues, errors)
   - Detailed findings organized by priority
   - Each finding should include:
     - File and line number
     - What website says
     - What citation claims
     - Classification (✅/⚠️/❌)
     - Specific issue description if applicable
   - Recommendations for fixes

---

### Example Findings Format

#### ✅ PERFECT MATCH: GdFixedTab.tsx:520

**Website text:** "For convex, L-smooth functions with α = 1/L:"
```
f(w_k) - f(w*) ≤ 2L||w₀ - w*||²/(k+4)
```

**Citation:** `gd-convex-sublinear-convergence-nesterov-2018`

**Citation claim (Corollary 2.1.2):** "If h = 1/L and f ∈ ℱ_L^{1,1}, then f(x_k) - f* ≤ 2L||x₀-x*||²/(k+4)"

**Verification:** ✅ Formula matches exactly. Context matches (convex, L-smooth, α = 1/L). Perfect.

---

#### ❌ ERROR: Example of what an error looks like

**Website text:** "Converges globally with rate (1 - 2μ/(L+3μ))^k from any starting point"

**Citation:** `gd-linesearch-strongly-convex-linear-convergence-nesterov-2018` (Theorem 1.2.4)

**Citation claim:** LOCAL convergence theorem requiring starting point within radius 2μ/M of minimum

**Issue:** ❌ ERROR - Website claims GLOBAL convergence but cites LOCAL theorem. Should use Theorem 2.1.15 instead.

---

### Important Notes

- **Be rigorous**: Check EVERY detail. Past verifications have missed errors.
- **Read the actual source**: Don't trust just the citation key name - read the actual claim/quote
- **Check formula images**: If citation has extracted formula images, look at them
- **Recent fixes**: Files recently modified may have been fixed - verify fixes are correct
- **Build verification**: After identifying issues, suggest running `npm run build` to check for breakage

---

### Expected Output

A markdown report file: `docs/verification-reports/citation-usage-verification-[DATE].md`

The report should include:
1. Executive summary with statistics
2. Detailed findings organized by severity (ERRORS, then MINOR ISSUES, then PERFECT)
3. Recommendations for fixes with specific line numbers
4. Verification methodology description

---

### Files to Focus On

**Citation JSON files:** `docs/citations/*.json`

**Source code files to check:**
- `src/components/AlgorithmExplainer.tsx`
- `src/components/tabs/GdFixedTab.tsx`
- `src/components/tabs/GdLineSearchTab.tsx`
- `src/components/tabs/LbfgsTab.tsx`
- `src/components/tabs/NewtonTab.tsx`
- `src/components/tabs/DiagonalPrecondTab.tsx`

---

### Success Criteria

- ✅ All ~39 citation usages verified
- ✅ Each usage classified (PERFECT/MINOR/ERROR)
- ✅ Specific line numbers for all findings
- ✅ Clear recommendations for any errors found
- ✅ Comprehensive markdown report generated

---

**Ready? Please proceed with the complete verification. Use parallel agents for efficiency. Be extremely thorough and rigorous.**

## PROMPT END
