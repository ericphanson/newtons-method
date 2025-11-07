# Numerical Algorithm Validation Workflow

This document describes how to validate numerical optimization algorithms using the Python validation suite.

## Overview

The Python validation suite compares TypeScript optimization algorithm implementations against scipy.optimize ground truth to find bugs and verify correctness.

**Location:** `python/` directory

**What it validates:**
- Gradient descent (fixed-step and line search variants)
- Newton's method
- L-BFGS optimization
- Logistic regression
- SVM variants (soft-margin, perceptron, squared-hinge)

## Quick Start

```bash
# 1. Export datasets from TypeScript
npm run export-datasets

# 2. Run validation suite
npm run validate

# 3. Review results
cat python/VALIDATION_RESULTS.md
```

## Setup (One-Time)

The Python environment uses `uv` for package management.

```bash
# Install dependencies (if not already done)
cd python
uv sync

# Verify installation
uv run python -c "import numpy; import scipy; print('Dependencies OK')"
```

**Dependencies:**
- Python 3.11+
- numpy >= 1.24.0
- scipy >= 1.11.0

## Running Validation

### Full Test Suite

```bash
# Run all 32 test cases with standard output
npm run validate

# Minimal output (summary only)
npm run validate:quiet

# Detailed output (shows all iterations)
npm run validate:verbose
```

### Filtered Tests

```bash
cd python

# Test specific problem
uv run python validate_with_python.py --problem rosenbrock

# Test specific algorithm
uv run python validate_with_python.py --algorithm lbfgs

# Test specific combination
uv run python validate_with_python.py --problem quadratic --algorithm newton
```

### Available Filters

**Problems:**
- `quadratic` - Well-conditioned bowl
- `ill-conditioned-quadratic` - Elongated ellipse (κ=100)
- `rosenbrock` - Banana function
- `non-convex-saddle` - Hyperbolic paraboloid (unbounded)
- `logistic-regression` - Binary classification
- `separating-hyperplane` - SVM variants

**Algorithms:**
- `gd-fixed` - Fixed-step gradient descent
- `gd-linesearch` - Gradient descent with Armijo line search
- `newton` - Newton's method with Hessian
- `lbfgs` - Limited-memory BFGS

## Understanding Results

### Three-Tier Classification

**✅ PASS**
- Both implementations converge to same solution
- Final loss difference < 1%
- Final position difference < 0.1
- Iteration count within 3x

**⚠️ SUSPICIOUS**
- Both converge but with notable differences
- Final loss difference 1-10%
- Final position difference 0.1-1.0
- Iteration count differs by >3x
- Both diverge on problem that should converge

**❌ FAIL**
- Convergence mismatch (one converges, one diverges)
- Final loss difference > 10%
- Final position difference > 1.0
- NaN or Infinity detected

### Example Output

```
Running 32 test cases...
============================================================

Testing: quadratic + lbfgs... ⚠️  SUSPICIOUS
  Python: converged=True, iters=2, loss=2.47e-32, grad_norm=7.03e-16
  TS:     converged=True, iters=9, loss=1.11e-17, grad_norm=4.71e-09
  - Iteration count differs 4.5x: Python=2, TS=9

Testing: quadratic + gd-fixed... ❌ FAIL
  Python: converged=True, iters=68, loss=2.07e-13, grad_norm=6.43e-07
  TS:     converged=False, iters=1, loss=inf, grad_norm=inf
  - Convergence mismatch: Python=converged, TS=diverged

============================================================
RESULTS: 32 tests
============================================================
✅ PASS:       10 tests
⚠️  SUSPICIOUS: 8 tests
❌ FAIL:       14 tests
```

## Debugging Workflow

### 1. Identify Failures

```bash
# Run validation and review results
npm run validate > validation_output.txt
grep "FAIL" validation_output.txt
```

### 2. Analyze Specific Failure

```bash
# Run single test with verbose output
cd python
uv run python validate_with_python.py --problem quadratic --algorithm gd-fixed --verbose
```

**Look for:**
- Iteration where divergence starts
- Pattern in gradient/loss values
- NaN or Infinity appearing

### 3. Compare Implementations

**Python reference (scipy):**
- Location: `python/scipy_runner.py`
- Uses battle-tested scipy.optimize implementations
- Captures iteration history via callback

**TypeScript implementation:**
- Location: `src/algorithms/*.ts`
- Check: gradient computation, line search, numerical stability
- Compare with scipy's approach

### 4. Common Issues

**❌ Immediate divergence (iteration 1 → inf loss):**
- CLI argument parsing bug
- Initial point setup issue
- Problem instantiation error
- Check: `scripts/test-combinations.ts` parseArgs()

**❌ Perceptron always fails:**
- Implementation bug in perceptron loss/gradient
- Check: `src/utils/separatingHyperplane.ts`

**❌ NaN propagation:**
- Numerical overflow in gradient or Hessian
- Missing bounds checks
- Check: sigmoid clipping, matrix conditioning

**⚠️ Iteration count 3-10x higher:**
- Less efficient line search
- Suboptimal step size selection
- May still be correct, just slower
- Check: Armijo parameters, backtracking logic

### 5. Fix and Verify

```bash
# After fixing TypeScript code:
npm run validate --problem <problem> --algorithm <algorithm>

# Verify fix resolves the issue
# Expected: Status changes from FAIL → PASS
```

### 6. Re-run Full Suite

```bash
# After multiple fixes
npm run validate:quiet

# Check if overall pass rate improved
# Goal: 100% PASS or all failures explained
```

## Test Coverage

**Total: 32 test cases**

- 4 pure problems × 4 algorithms = 16 tests
- 1 logistic regression × 4 algorithms = 4 tests
- 3 SVM variants × 4 algorithms = 12 tests

**Special Cases:**
- `non-convex-saddle` - Both should diverge (unbounded problem)
- `ill-conditioned-quadratic + gd-fixed` - May not converge (needs small step size)
- `rosenbrock + gd-fixed` - Uses alpha=0.001 (small step for difficult landscape)

## Dataset Management

### Exporting Datasets

```bash
# Export crescent dataset from TypeScript
npm run export-datasets
```

**What it does:**
- Runs `scripts/export-datasets.ts`
- Generates 140 data points (70 per class)
- Saves to `python/datasets/crescent.json`
- Used by logistic regression and SVM tests

**When to re-export:**
- After changing `generateCrescents()` in `src/shared-utils.ts`
- If dataset structure changes
- Generally: only needed once during setup

## Architecture

```
┌─────────────────────────────────────────────┐
│         validate_with_python.py             │
│         (Main Test Runner)                  │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┐
       ↓               ↓
┌──────────────┐  ┌──────────────┐
│ scipy_runner │  │  ts_runner   │
│              │  │              │
│ - Fixed GD   │  │ - Subprocess │
│ - CG         │  │ - Parse CLI  │
│ - Newton-CG  │  │ - Regex      │
│ - L-BFGS-B   │  │              │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                ↓
        ┌──────────────┐
        │  comparator  │
        │              │
        │ - Tolerances │
        │ - 3-Tier     │
        └──────────────┘
```

**Modules:**
- `problems.py` - Pure optimization problems (quadratic, rosenbrock, etc.)
- `data_problems.py` - Logistic regression, SVM variants
- `scipy_runner.py` - Scipy.optimize wrapper with iteration capture
- `ts_runner.py` - TypeScript CLI integration and output parser
- `comparator.py` - Result comparison with tolerances
- `validate_with_python.py` - Main test runner

## Tolerance Specifications

### Loss Difference
- `< 1%` → PASS
- `1-10%` → SUSPICIOUS
- `> 10%` → FAIL

### Position Difference (L2 norm)
- `< 0.1` → PASS
- `0.1-1.0` → SUSPICIOUS
- `> 1.0` → FAIL

### Iteration Count Ratio
- `< 3x` → PASS
- `> 3x` → SUSPICIOUS (flag for investigation)

### Convergence Status
- Must match (both converge OR both diverge)
- Exception: `non-convex-saddle` (both should diverge)

## Troubleshooting

### Issue: "Command not found: uv"

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or via pip
pip install uv
```

### Issue: "Module not found: numpy"

```bash
cd python
uv sync
```

### Issue: TypeScript CLI timeout

**Symptom:** Test hangs for 30 seconds then fails

**Cause:** TypeScript code has infinite loop or very slow convergence

**Fix:**
- Check maxIter parameter in test case
- Add convergence checks in TS algorithm
- Use `--verbose` to see last iteration before timeout

### Issue: All tests fail with "CLI error"

**Symptom:** Every test shows CLI error message

**Cause:** npm or test-combo script not available

**Fix:**
```bash
# Verify npm scripts work
npm run test-combo -- --problem quadratic --algorithm lbfgs --initial 1,1 --maxIter 100

# If fails, check package.json has test-combo script
```

### Issue: Dataset not found

**Symptom:** `FileNotFoundError: python/datasets/crescent.json`

**Fix:**
```bash
npm run export-datasets
```

## Adding New Test Cases

To add validation for a new problem or algorithm:

### 1. Add Problem (if new)

**For pure optimization problems:**
Edit `python/problems.py`:
```python
def my_problem() -> Problem:
    """My new optimization problem."""
    def objective(w: np.ndarray) -> float:
        return w[0]**2 + w[1]**2  # Your objective

    def gradient(w: np.ndarray) -> np.ndarray:
        return np.array([2*w[0], 2*w[1]])  # Your gradient

    return Problem("my-problem", objective, gradient)
```

Update `get_problem()` to include it.

**For data-based problems:**
Edit `python/data_problems.py` and add your class.

### 2. Add Test Cases

Edit `python/validate_with_python.py`, in `get_test_cases()`:
```python
# Add to appropriate section
test_case = {
    'problem': 'my-problem',
    'algorithm': 'lbfgs',
    'initial': [1.0, 1.0],
    'max_iter': 100,
    'tol': 1e-6
}
test_cases.append(test_case)
```

### 3. Run Validation

```bash
npm run validate --problem my-problem
```

## Performance Considerations

- **Full suite runtime:** ~5 minutes (32 tests)
- **Single test:** ~5-10 seconds
- **Bottleneck:** TypeScript CLI subprocess overhead
- **Parallelization:** Not currently supported (sequential execution)

## Integration with CI/CD

The validation suite can be integrated into continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run numerical validation
  run: |
    npm run export-datasets
    npm run validate:quiet
  # Fails if any test fails (exit code 1)
```

**Exit codes:**
- `0` - All tests PASS
- `1` - Any test FAIL or SUSPICIOUS

## References

- **Full documentation:** [python/README.md](../../python/README.md)
- **Validation results:** [python/VALIDATION_RESULTS.md](../../python/VALIDATION_RESULTS.md)
- **Implementation plan:** [docs/plans/2025-11-07-python-validation-suite.md](../plans/2025-11-07-python-validation-suite.md)
- **Design document:** [docs/plans/2025-11-07-python-validation-suite-design.md](../plans/2025-11-07-python-validation-suite-design.md)

## Best Practices

1. **Always export datasets first** - Ensures Python and TS use same data
2. **Start with filtered tests** - Debug specific failures before full suite
3. **Use verbose mode for debugging** - Shows iteration-by-iteration comparison
4. **Document failures** - Update VALIDATION_RESULTS.md with findings
5. **Fix high-priority first** - FAIL > SUSPICIOUS > performance issues
6. **Re-validate after fixes** - Confirm fixes don't break other tests
7. **Commit validation results** - Track progress over time

## Known Limitations

1. **No parallel execution** - Tests run sequentially
2. **Subprocess overhead** - Each test spawns new Node process
3. **CLI output parsing** - Fragile to output format changes
4. **No iteration-by-iteration comparison** - Only final results compared in detail
5. **Fixed tolerances** - Not adaptive to problem scale
6. **No visual diff** - Text output only, no plots

## Future Enhancements

Potential improvements for the validation suite:

- [ ] Parallel test execution
- [ ] Visual iteration trajectory comparison
- [ ] Adaptive tolerances based on problem conditioning
- [ ] JSON output format for machine parsing
- [ ] Integration with pytest framework
- [ ] Historical result tracking
- [ ] Performance benchmarking (wall-clock time)
- [ ] Memory usage comparison
