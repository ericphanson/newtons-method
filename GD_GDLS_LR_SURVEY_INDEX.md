# GD/GD+LS/LR Codebase Survey - Document Index

## Overview
This directory now contains comprehensive documentation about the Gradient Descent (GD), Gradient Descent with Line Search (GD+LS), and Logistic Regression (LR) implementations in this optimization visualization codebase.

## Documents

### 1. **CODEBASE_SURVEY_GD_GDLS_LR.md** (23 KB, Primary Technical Reference)

**Purpose**: Complete technical documentation of GD, GD+LS, and LR implementations.

**Sections**:
1. Executive Summary
2. Gradient Descent Implementation (Fixed Step)
3. GD+LS Implementation (with Armijo Line Search)
4. Armijo Line Search Details
5. Logistic Regression Definition
6. LR Implementation (TypeScript & Python)
7. Other Optimization Problems
8. Algorithm Implementations (Newton, L-BFGS, Diagonal Preconditioner)
9. Python Reference Implementations
10. Recent Changes & Current State
11. File Structure & Key Locations
12. TypeScript vs Python Comparison
13. Performance Analysis Tools
14. Known Issues & Notes
15. Integration Architecture
16. Summary Table
17. Key Takeaways for GD/GD+LS on LR

**Best for**: 
- Understanding the complete system
- Learning algorithm mathematics
- Comparing implementations across languages
- Debugging issues
- Finding specific code sections

**How to use**: Read section-by-section or use Ctrl+F to find specific topics.

---

### 2. **GD_GDLS_QUICK_REFERENCE.txt** (14 KB, Quick Lookup Guide)

**Purpose**: Fast reference for commonly needed information.

**Sections**:
- Algorithm Implementations (where to find code)
- Logistic Regression Definition (what is LR)
- Integration Pattern (how problems connect to algorithms)
- Python Validation Suite
- Other Optimization Problems
- Key Differences (GD vs GD+LS)
- Running Experiments
- Recent Changes
- Critical Files
- Troubleshooting

**Best for**:
- Quick file lookups during coding
- Performance comparison at a glance
- Running experiments and tests
- Troubleshooting issues
- Finding function signatures

**How to use**: Ctrl+F for specific keywords or section names.

---

### 3. **SURVEY_SUMMARY.txt** (12 KB, Executive Summary)

**Purpose**: High-level overview for new team members or stakeholders.

**Sections**:
- What You Have (5 major components)
- Key Files by Category
- Logistic Regression Definition
- GD vs GD+LS Comparison
- How to Run Things
- Recent Changes
- Integration Architecture
- Testing & Validation
- Key Takeaways
- Next Steps

**Best for**:
- Getting oriented in the codebase
- Understanding project scope
- Identifying what's implemented
- Planning what to work on
- Onboarding new developers

**How to use**: Read start to finish for context, or jump to specific sections.

---

## Quick File Locations

### GD Implementation
- **TypeScript**: `/src/algorithms/gradient-descent.ts` (163 lines)
- **Python**: `/python/scipy_runner.py` (custom implementation)

### GD+LS Implementation  
- **TypeScript**: `/src/algorithms/gradient-descent-linesearch.ts` (200 lines)
- **Python**: `/python/scipy_runner.py` (maps to scipy.optimize.CG)

### Line Search (Armijo)
- **TypeScript**: `/src/line-search/armijo.ts` (82 lines)

### Logistic Regression Problem
- **TypeScript**: `/src/utils/logisticRegression.ts` (149 lines)
- **Python**: `/python/data_problems.py` (219 lines, LogisticRegression class)
- **Dataset**: `/python/datasets/crescent.json` (140 points)

### Validation Suite
- **Main**: `/python/validate_with_python.py` (272 lines)
- **Comparator**: `/python/comparator.py` (120 lines)
- **TypeScript Runner**: `/python/ts_runner.py` (169 lines)
- **Scipy Wrapper**: `/python/scipy_runner.py` (162 lines)

### Integration
- **Problem Adapter**: `/src/utils/problemAdapter.ts`
- **Algorithm Types**: `/src/algorithms/types.ts`
- **UI Component**: `/src/UnifiedVisualizer.tsx`

---

## What is LR?

**LR = Logistic Regression** (the problem, not an abbreviation)

Binary classification problem:
- **Model**: P(y=1|x) = sigmoid(w0*x1 + w1*x2 + w2)
- **Weights**: [w0, w1, w2] where w2 is bias
- **Loss**: Cross-entropy + L2 regularization
- **Dataset**: 140 points (70 per class), interleaved crescents
- **Features**: 2D (x1, x2)

---

## GD vs GD+LS at a Glance

| Aspect | GD (Fixed) | GD+LS (Line Search) |
|--------|-----------|-------------------|
| **Step Size** | Manual (α) | Automatic (Armijo) |
| **Tuning** | High | Low |
| **Iterations** | 30-200 | 20-50 |
| **On LR** | Good with α=0.1 | Good always |
| **Implementation** | Simple | Complex |
| **Visualization** | Trajectory | + Line search trials |

Key insight: GD+LS eliminates step size tuning via automatic Armijo backtracking.

---

## Running Things

### Interactive Visualization
```bash
npm install && npm run dev
# Open http://localhost:5173
# Select GD or GD+LS from algorithm tabs
```

### Python Validation
```bash
cd python
python validate_with_python.py --verbose
# Shows 40+ test cases (algorithms × problems)
```

### Single Problem
```bash
python validate_with_python.py --problem logistic-regression --verbose
```

### TypeScript Tests
```bash
npx ts-node test-gradient-consistency.ts
npx ts-node test-step-size-progression.ts
```

---

## Which Document Should I Read?

**I want to...**

**...understand how everything works**
→ Read CODEBASE_SURVEY_GD_GDLS_LR.md sections 1-5

**...quickly find a file**
→ Use GD_GDLS_QUICK_REFERENCE.txt

**...get oriented in the project**
→ Read SURVEY_SUMMARY.txt first

**...understand LR mathematically**
→ CODEBASE_SURVEY section 2, or SURVEY_SUMMARY.txt section on LR

**...compare GD vs GD+LS**
→ GD_GDLS_QUICK_REFERENCE.txt "Key Differences" section
→ Or SURVEY_SUMMARY.txt "GD vs GD+LS Comparison"

**...run validation tests**
→ GD_GDLS_QUICK_REFERENCE.txt "Running Experiments" section

**...debug an issue**
→ CODEBASE_SURVEY section 10 "Known Issues"
→ Or GD_GDLS_QUICK_REFERENCE.txt "Troubleshooting"

**...understand the architecture**
→ CODEBASE_SURVEY section 11 "Integration Architecture"

**...extend the codebase**
→ SURVEY_SUMMARY.txt "Next Steps" section

---

## Key Statistics

- **GD Implementation**: 163 lines (TS)
- **GD+LS Implementation**: 200 lines (TS)
- **Armijo Line Search**: 82 lines (TS)
- **LR Problem**: 149 lines (TS) + 219 lines (Python)
- **Validation Suite**: 272 lines main + 120 supporting
- **Total Test Cases**: 40+
- **Algorithms**: 6 (GD, GD+LS, Newton, L-BFGS, DiagPrec, Custom)
- **Problems**: 10 (6 pure + 1 LR + 3 SVM variants)
- **Documentation**: 3 comprehensive guides (50+ KB)

---

## Implementation Status

- ✅ GD: Stable, production-ready
- ✅ GD+LS: Stable, production-ready
- ✅ Armijo: Stable, full visualization
- ✅ LR: Complete in both TS and Python
- ✅ Validation: 40+ test combinations
- ✅ Documentation: Complete

---

## Recent Important Changes

- Nov 7: Added diagonal preconditioner (UI and algorithm)
- Oct: Aligned convergence behavior with scipy standards
- Sep: Stabilized matrix inversion for Newton
- Aug: Refactored to AlgorithmResult interface

**No breaking changes affecting GD/GD+LS/LR implementations**

---

## Technical Deep Dives

### Armijo Condition
```
f(w + α*p) ≤ f(w) + c1*α*(∇f^T*p)
```
Default: c1=0.0001, rho=0.5, maxTrials=20

### Logistic Regression Loss
```
L = -mean[y*log(σ) + (1-y)*log(1-σ)] + (λ/2)*(w0² + w1²)
σ = sigmoid(z) where z = w0*x1 + w1*x2 + w2
```

### Gradient
```
∂L/∂w = X^T*(σ - y)/n + λ*w (except bias w2)
```

### Hessian
```
H = X^T*D*X/n + λ*I (where D = σ(1-σ) for each point)
```

---

## Troubleshooting Matrix

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| GD diverges | α too large | Use smaller α (0.01-0.05) |
| GD oscillates | α too small | Use larger α (up to 0.15) |
| GD+LS slow | Problem ill-conditioned | Expected, check c1 param |
| Results differ >10% | Numerical precision | Check tolerances match |
| Newton fails | Hessian singular | Try Hessian damping |
| LR diverges | Step size issue | Use GD+LS (automatic) |

---

## Contact & Questions

For specific technical questions, refer to the appropriate document:
- Mathematics: CODEBASE_SURVEY section 2.2-2.3
- Implementation: CODEBASE_SURVEY section 2.3-2.4  
- Integration: CODEBASE_SURVEY section 11
- Testing: GD_GDLS_QUICK_REFERENCE.txt "Python Validation Suite"

---

Generated: November 7, 2025
Last Updated: November 7, 2025
