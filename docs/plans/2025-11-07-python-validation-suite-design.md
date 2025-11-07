# Python Validation Suite Design

**Date:** 2025-11-07
**Status:** Design
**Goal:** Validate TypeScript optimization algorithm implementations against mature Python libraries (scipy) to find bugs and verify correctness

## Overview

This design describes a Python-based validation system that compares the TypeScript numerical optimization implementations against scipy.optimize as ground truth. The system will identify bugs by comparing final results and iteration behavior across 36 test combinations.

### Primary Goals

1. **Validate Correctness** - Verify TS implementations produce mathematically correct results by comparing against well-tested scipy libraries
2. **Debug Divergences** - Identify specific bugs where TS algorithms fail or produce incorrect results

### Non-Goals

- Not reimplementing algorithms in Python (avoid duplicating potential bugs)
- Not modifying existing TS CLI interface
- Not replacing TS implementation (Python is reference only)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                 Python Test Runner                          │
│              (validate_with_python.py)                      │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │ Test Case Loop   │────────>│  For each case:  │        │
│  │ (36 combinations)│         │  1. Run Python   │        │
│  └──────────────────┘         │  2. Run TS CLI   │        │
│                               │  3. Compare      │        │
│                               └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────────┐
│  Python Scipy    │          │   TS CLI             │
│  - problems.py   │          │   (existing)         │
│  - scipy_runner  │          │   npm run test-combo │
│  - callback data │          │                      │
└──────────────────┘          └──────────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         ▼
                ┌──────────────────┐
                │   Comparator     │
                │  - Parse results │
                │  - Apply tolerances│
                │  - Generate report│
                └──────────────────┘
```

### File Structure

```
/Users/eph/newtons-method/
├── python/
│   ├── pyproject.toml              # uv project config
│   ├── problems.py                 # Pure optimization problems
│   ├── data_problems.py            # Logistic regression, SVM objectives
│   ├── scipy_runner.py             # Scipy adapter & callback capture
│   ├── comparator.py               # Result comparison logic
│   ├── validate_with_python.py    # Main test runner (entry point)
│   └── datasets/
│       └── crescent.json           # Exported from TS
├── scripts/
│   ├── test-combinations.ts        # Existing TS CLI
│   └── export-datasets.ts          # NEW: Export datasets to JSON
└── ...
```

## Python Dependencies

Using `uv` for package management:

```toml
[project]
name = "optimization-validation"
version = "0.1.0"
dependencies = [
    "numpy>=1.24.0",
    "scipy>=1.11.0"
]
```

**Setup:**
```bash
cd python
uv init
uv add numpy scipy
```

## Implementation Details

### 1. Problem Definitions (problems.py)

Implement pure mathematical functions for each test problem:

**Problems to implement:**
- `quadratic` - Well-conditioned 2D bowl
- `ill_conditioned_quadratic` - κ=100 elongated ellipse
- `rosenbrock` - Non-convex banana (b=100)
- `non_convex_saddle` - Hyperbolic paraboloid (unbounded)

**Interface:**
```python
class Problem:
    def objective(self, w: np.ndarray) -> float:
        """Compute f(w)"""

    def gradient(self, w: np.ndarray) -> np.ndarray:
        """Compute ∇f(w)"""

    def hessian(self, w: np.ndarray) -> np.ndarray:
        """Compute ∇²f(w) (optional, for Newton)"""
```

**Example - Rosenbrock:**
```python
def rosenbrock_objective(w):
    return (1 - w[0])**2 + 100 * (w[1] - w[0]**2)**2

def rosenbrock_gradient(w):
    dw0 = -2*(1 - w[0]) - 400*w[0]*(w[1] - w[0]**2)
    dw1 = 200*(w[1] - w[0]**2)
    return np.array([dw0, dw1])
```

### 2. Data Problems (data_problems.py)

**Logistic Regression:**
```python
class LogisticRegression:
    def __init__(self, dataset: dict, lambda_reg: float):
        self.data = dataset['points']
        self.lambda_reg = lambda_reg

    def objective(self, w: np.ndarray) -> float:
        # Cross-entropy + L2 regularization
        # L(w) = -1/n * Σ[y*log(σ(z)) + (1-y)*log(1-σ(z))] + λ/2*||w||²

    def gradient(self, w: np.ndarray) -> np.ndarray:
        # ∇L = 1/n * Σ(σ(z) - y)*x + λ*w
```

**SVM Variants:**
```python
class SoftMarginSVM:
    # Hinge loss: ||w||²/2 + λ*Σmax(0, 1-y*z)

class PerceptronSVM:
    # Perceptron: Σmax(0, -y*z) + λ/2*||w||²

class SquaredHingeSVM:
    # Squared hinge: ||w||²/2 + λ*Σ[max(0, 1-y*z)]²
```

### 3. Scipy Runner (scipy_runner.py)

**Algorithm Mapping:**

| TS Algorithm | Scipy Method | Notes |
|-------------|-------------|-------|
| `gd-fixed` | Custom implementation | Scipy doesn't have fixed-step GD |
| `gd-linesearch` | Custom GD + `scipy.optimize.line_search` | Use Armijo line search |
| `newton` | `method='Newton-CG'` | Newton with conjugate gradient solver |
| `lbfgs` | `method='L-BFGS-B'` | Limited-memory BFGS |

**Callback Capture:**
```python
class IterationCapture:
    def __init__(self, problem):
        self.iterations = []
        self.problem = problem

    def __call__(self, xk):
        """Called by scipy each iteration"""
        self.iterations.append({
            'iter': len(self.iterations),
            'w': xk.copy(),
            'loss': self.problem.objective(xk),
            'grad_norm': np.linalg.norm(self.problem.gradient(xk))
        })

def run_scipy(problem, algorithm, x0, max_iter, **kwargs):
    callback = IterationCapture(problem)

    result = scipy.optimize.minimize(
        problem.objective,
        x0=x0,
        method=METHOD_MAP[algorithm],
        jac=problem.gradient,
        callback=callback,
        options={'maxiter': max_iter, 'gtol': 1e-6}
    )

    return {
        'converged': result.success,
        'iterations': len(callback.iterations),
        'final_loss': result.fun,
        'final_w': result.x,
        'final_grad_norm': np.linalg.norm(problem.gradient(result.x)),
        'message': result.message,
        'iteration_history': callback.iterations
    }
```

**Fixed-Step GD Implementation:**
```python
def gradient_descent_fixed(problem, x0, alpha, max_iter, tol=1e-6):
    """Simple fixed-step gradient descent (scipy doesn't have this)"""
    w = x0.copy()
    history = []

    for i in range(max_iter):
        grad = problem.gradient(w)
        grad_norm = np.linalg.norm(grad)
        loss = problem.objective(w)

        history.append({'iter': i, 'w': w.copy(), 'loss': loss, 'grad_norm': grad_norm})

        if grad_norm < tol:
            return {'converged': True, 'iterations': i, 'final_w': w, ...}

        w = w - alpha * grad

    return {'converged': False, 'iterations': max_iter, 'final_w': w, ...}
```

### 4. TS CLI Integration

**Running TS Tests:**
```python
def run_typescript_test(problem, algorithm, initial, max_iter, **kwargs):
    """Shell out to existing TS CLI"""
    cmd = [
        'npm', 'run', 'test-combo', '--',
        '--problem', problem,
        '--algorithm', algorithm,
        '--initial', f"{initial[0]},{initial[1]}",
        '--maxIter', str(max_iter)
    ]

    # Add optional parameters
    if 'alpha' in kwargs:
        cmd.extend(['--alpha', str(kwargs['alpha'])])
    if 'lambda' in kwargs:
        cmd.extend(['--lambda', str(kwargs['lambda'])])
    if 'variant' in kwargs:
        cmd.extend(['--variant', kwargs['variant']])

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

    return parse_ts_output(result.stdout)
```

**Parsing TS Output:**
```python
def parse_ts_output(stdout: str) -> dict:
    """Parse CLI output format:
    ✅ CONVERGED in 5 iterations
       Final loss: 1.234567e-07
       Final grad norm: 8.92e-06
       Final position: [0.000010, 0.000020]
    """
    converged = '✅ CONVERGED' in stdout

    # Extract values using regex
    iterations = int(re.search(r'in (\d+) iterations', stdout).group(1))
    final_loss = float(re.search(r'Final loss: ([\d.e+-]+)', stdout).group(1))
    final_grad_norm = float(re.search(r'Final grad norm: ([\d.e+-]+)', stdout).group(1))

    # Parse final position [w0, w1] or [w0, w1, w2]
    position_str = re.search(r'Final position: \[(.*?)\]', stdout).group(1)
    final_w = np.array([float(x.strip()) for x in position_str.split(',')])

    return {
        'converged': converged,
        'iterations': iterations,
        'final_loss': final_loss,
        'final_w': final_w,
        'final_grad_norm': final_grad_norm
    }
```

### 5. Comparison Logic (comparator.py)

**Three-Tier Classification:**

```python
class ComparisonResult(Enum):
    PASS = "✅ PASS"
    SUSPICIOUS = "⚠️  SUSPICIOUS"
    FAIL = "❌ FAIL"

def compare_results(python_result, ts_result) -> tuple[ComparisonResult, dict]:
    """Compare results with tolerance handling"""

    issues = []

    # Critical issues (FAIL)
    if python_result['converged'] != ts_result['converged']:
        issues.append(f"Convergence mismatch: Python={python_result['converged']}, TS={ts_result['converged']}")
        return ComparisonResult.FAIL, {'issues': issues}

    # Compare final loss
    loss_diff = abs(python_result['final_loss'] - ts_result['final_loss'])
    relative_loss_diff = loss_diff / (abs(python_result['final_loss']) + 1e-10)

    if relative_loss_diff > 0.10:  # >10% difference
        issues.append(f"Loss differs by {relative_loss_diff*100:.1f}%: Python={python_result['final_loss']:.6e}, TS={ts_result['final_loss']:.6e}")
        return ComparisonResult.FAIL, {'issues': issues}

    # Compare final position
    w_diff = np.linalg.norm(python_result['final_w'] - ts_result['final_w'])
    if w_diff > 1.0:  # Completely different locations
        issues.append(f"Final positions differ by {w_diff:.4f}")
        return ComparisonResult.FAIL, {'issues': issues}

    # Suspicious issues (SUSPICIOUS)
    if relative_loss_diff > 0.01:  # 1-10% difference
        issues.append(f"Loss differs by {relative_loss_diff*100:.2f}%")

    iter_ratio = max(python_result['iterations'], ts_result['iterations']) / max(min(python_result['iterations'], ts_result['iterations']), 1)
    if iter_ratio > 3.0:
        issues.append(f"Iteration count differs significantly: Python={python_result['iterations']}, TS={ts_result['iterations']}")

    if issues:
        return ComparisonResult.SUSPICIOUS, {'issues': issues}

    # All good
    return ComparisonResult.PASS, {}
```

**Tolerance Philosophy:**
- **FAIL**: Major bugs - different convergence status, >10% loss difference, completely different solutions
- **SUSPICIOUS**: Worth investigating - 1-10% difference, iteration count 3x+ different
- **PASS**: Minor differences OK - within 1%, iterations within 3x

### 6. Main Test Runner (validate_with_python.py)

**Test Configuration:**
```python
TEST_CASES = [
    # Pure optimization problems (2D)
    {'problem': 'quadratic', 'algorithm': 'gd-fixed', 'initial': [1.0, 1.0], 'max_iter': 100, 'alpha': 0.1},
    {'problem': 'quadratic', 'algorithm': 'gd-linesearch', 'initial': [1.0, 1.0], 'max_iter': 100},
    {'problem': 'quadratic', 'algorithm': 'newton', 'initial': [1.0, 1.0], 'max_iter': 100},
    {'problem': 'quadratic', 'algorithm': 'lbfgs', 'initial': [1.0, 1.0], 'max_iter': 100},

    {'problem': 'ill-conditioned-quadratic', 'algorithm': 'gd-fixed', 'initial': [1.0, 1.0], 'max_iter': 1000, 'alpha': 0.01},
    # ... (4 algorithms × 4 pure problems = 16 tests)

    # Logistic regression (3D with bias)
    {'problem': 'logistic-regression', 'algorithm': 'gd-linesearch', 'initial': [0.0, 0.0, 0.0], 'max_iter': 100, 'lambda': 0.01},
    # ... (4 algorithms × 1 problem = 4 tests)

    # SVM variants (3D with bias)
    {'problem': 'separating-hyperplane', 'variant': 'soft-margin', 'algorithm': 'lbfgs', 'initial': [0.0, 0.0, 0.0], 'max_iter': 100, 'lambda': 0.01},
    {'problem': 'separating-hyperplane', 'variant': 'perceptron', 'algorithm': 'newton', 'initial': [0.0, 0.0, 0.0], 'max_iter': 100, 'lambda': 0.01},
    {'problem': 'separating-hyperplane', 'variant': 'squared-hinge', 'algorithm': 'gd-linesearch', 'initial': [0.0, 0.0, 0.0], 'max_iter': 100, 'lambda': 0.01},
    # ... (4 algorithms × 3 variants = 12 tests)
]
# Total: 16 + 4 + 12 + 4 (rosenbrock) = 36 tests
```

**Main Execution:**
```python
def main(args):
    results = {
        'pass': [],
        'suspicious': [],
        'fail': []
    }

    for test_case in TEST_CASES:
        print(f"\nTesting: {test_case['problem']} + {test_case['algorithm']}")

        # 1. Run Python
        problem = get_problem(test_case)
        python_result = run_scipy(problem, test_case['algorithm'], test_case['initial'], test_case['max_iter'], **test_case)

        # 2. Run TypeScript
        ts_result = run_typescript_test(**test_case)

        # 3. Compare
        status, details = compare_results(python_result, ts_result)

        results[status.name.lower()].append({
            'test_case': test_case,
            'status': status,
            'details': details,
            'python_result': python_result,
            'ts_result': ts_result
        })

        # Print immediate feedback
        print(f"  {status.value}")
        if details.get('issues'):
            for issue in details['issues']:
                print(f"    - {issue}")

    # Final summary
    print_summary(results)

    # Exit code: 0 if all pass, 1 if any fail
    return 0 if not results['fail'] else 1
```

**CLI Interface:**
```bash
# Run all tests
uv run validate_with_python.py --all

# Run specific problem
uv run validate_with_python.py --problem rosenbrock

# Run specific algorithm
uv run validate_with_python.py --algorithm lbfgs

# Verbosity control
uv run validate_with_python.py --all --quiet      # Just summary
uv run validate_with_python.py --all --verbose    # Include iteration comparison
```

## Data Consistency Strategy

**Challenge:** Dataset-based problems (logistic regression, SVM) need identical data in both TS and Python.

**Solution:** Export datasets from TS to JSON, Python reads the same files.

### TS Dataset Export (scripts/export-datasets.ts)

```typescript
import { generateCrescentData } from '../src/shared-utils';
import fs from 'fs';

// Generate dataset
const data = generateCrescentData();

// Export to JSON
const output = {
  points: data.map(d => ({ x1: d.x1, x2: d.x2, y: d.y }))
};

fs.writeFileSync(
  'python/datasets/crescent.json',
  JSON.stringify(output, null, 2)
);

console.log('✅ Exported crescent dataset');
```

**Usage:**
```bash
npm run export-datasets
```

### Python Dataset Loading

```python
def load_dataset(path: str) -> dict:
    with open(path, 'r') as f:
        return json.load(f)

# Use in test
dataset = load_dataset('python/datasets/crescent.json')
problem = LogisticRegression(dataset, lambda_reg=0.01)
```

**For Pure Math Problems:**
- No data export needed
- Just implement identical math formulas
- Deterministic, should match exactly

## Edge Cases & Special Handling

### 1. Saddle Point Problem
- **Expected behavior:** Unbounded, goes to -∞
- **Both should diverge** (not converge)
- **Comparison:** Mark as PASS if both fail in same direction

```python
if test_case['problem'] == 'non-convex-saddle':
    # Special case: both should diverge
    if not python_result['converged'] and not ts_result['converged']:
        return ComparisonResult.PASS, {'note': 'Both correctly diverged (unbounded)'}
```

### 2. Ill-Conditioned Quadratic
- **Expected behavior:**
  - Newton/L-BFGS: fast (~5-10 iters)
  - GD methods: very slow (100+ iters)
- **Don't flag as suspicious** if Python is faster (mature implementation)

### 3. SVM Variants
- **Perceptron:** May not converge initially (no regularization)
- **Soft-margin/Squared-hinge:** Should converge reliably
- Different variants have different convergence properties

### 4. Line Search Parameters
- **TS:** Uses Armijo with c1=0.0001, rho=0.5
- **Scipy:** Uses its own defaults (may differ)
- **Focus on final result**, not matching line search behavior exactly

### 5. Error Handling

```python
try:
    ts_result = run_typescript_test(**test_case)
except subprocess.TimeoutExpired:
    return ComparisonResult.FAIL, {'issues': ['TS CLI timeout (>30s)']}
except Exception as e:
    return ComparisonResult.FAIL, {'issues': [f'TS CLI error: {str(e)}']}

try:
    python_result = run_scipy(...)
except Exception as e:
    return ComparisonResult.FAIL, {'issues': [f'Python error: {str(e)}']}
```

## Expected Output

### Example Run

```
$ uv run validate_with_python.py --all

Testing: quadratic + gd-fixed
  ✅ PASS

Testing: quadratic + gd-linesearch
  ✅ PASS

Testing: rosenbrock + gd-fixed
  ❌ FAIL
    - Convergence mismatch: Python=True, TS=False
    - TS diverged with NaN at iteration 12

Testing: rosenbrock + lbfgs
  ⚠️  SUSPICIOUS
    - Loss differs by 2.3%: Python=1.234e-08, TS=1.263e-08

Testing: newton + ill-conditioned-quadratic
  ✅ PASS

Testing: separating-hyperplane (soft-margin) + lbfgs
  ❌ FAIL
    - Final positions differ by 2.45
    - Loss differs by 95%: Python=0.123, TS=15.34

...

=== RESULTS: 36 tests ===
✅ PASS: 18 tests
⚠️  SUSPICIOUS: 6 tests
❌ FAIL: 12 tests

FAILURES:
❌ rosenbrock + gd-fixed: TS diverged (NaN at iter 12), Python converged
❌ separating-hyperplane (soft-margin) + lbfgs: Final positions differ by 2.45
❌ newton + rosenbrock: Loss differs by 45%
...

SUSPICIOUS:
⚠️  rosenbrock + lbfgs: Loss differs by 2.3%
⚠️  ill-conditioned-quadratic + gd-fixed: Iteration count differs (Python=203, TS=487)
...
```

### Verbose Mode

```
$ uv run validate_with_python.py --problem rosenbrock --algorithm lbfgs --verbose

Testing: rosenbrock + lbfgs

Python iterations:
  Iter 0: w=[1.000, 1.000], loss=0.000, grad_norm=2.000
  Iter 1: w=[0.987, 0.974], loss=0.000, grad_norm=1.234
  ...
  Iter 8: w=[1.000, 1.000], loss=3.45e-09, grad_norm=8.2e-05
  ✅ Converged in 8 iterations

TS iterations:
  Iter 0: w=[1.000, 1.000], loss=0.000, grad_norm=2.000
  Iter 1: w=[0.987, 0.974], loss=0.000, grad_norm=1.234
  ...
  Iter 10: w=[1.000, 1.000], loss=3.51e-09, grad_norm=7.8e-05
  ✅ Converged in 10 iterations

Comparison:
  ⚠️  SUSPICIOUS
    - Iteration count differs: Python=8, TS=10 (1.25x ratio)
    - Final loss within 2% (acceptable)
    - Final position within 1e-5 (acceptable)
```

## Implementation Plan Checklist

### Phase 1: Python Setup
- [ ] Create `python/` directory structure
- [ ] Initialize uv project (`uv init`)
- [ ] Add dependencies (`uv add numpy scipy`)
- [ ] Create empty module files

### Phase 2: Problem Definitions
- [ ] Implement pure problems (quadratic, rosenbrock, ill-conditioned, saddle)
- [ ] Implement data problems (logistic regression, SVM variants)
- [ ] Verify formulas match TS implementations

### Phase 3: TS Dataset Export
- [ ] Create `scripts/export-datasets.ts`
- [ ] Export crescent dataset to JSON
- [ ] Add `npm run export-datasets` script

### Phase 4: Scipy Integration
- [ ] Implement `scipy_runner.py` with callback capture
- [ ] Implement custom fixed-step GD
- [ ] Test each algorithm independently

### Phase 5: TS CLI Integration
- [ ] Implement subprocess calling
- [ ] Implement output parsing
- [ ] Handle errors and timeouts

### Phase 6: Comparison Logic
- [ ] Implement tolerance-based comparison
- [ ] Implement three-tier classification (PASS/SUSPICIOUS/FAIL)
- [ ] Add special case handling (saddle, etc.)

### Phase 7: Main Test Runner
- [ ] Define all 36 test cases
- [ ] Implement main loop
- [ ] Implement summary reporting
- [ ] Add CLI argument parsing (--all, --verbose, --quiet, --problem, --algorithm)

### Phase 8: Validation
- [ ] Run full test suite
- [ ] Analyze failures
- [ ] Fix identified TS bugs
- [ ] Re-run to verify fixes

## Success Criteria

1. **Coverage:** All 36 test combinations run successfully
2. **Bug Detection:** System identifies known issues (e.g., NaN divergence, incorrect convergence)
3. **Actionable Output:** Clear categorization of PASS/SUSPICIOUS/FAIL with specific differences
4. **Reproducibility:** Same test produces same result every time
5. **Speed:** Full test suite completes in <5 minutes

## Future Enhancements

- Save results to JSON for historical comparison
- Generate HTML report with plots
- Add more test problems (Himmelblau, Beale, etc.)
- Compare iteration trajectories visually
- Benchmark performance (TS vs Python speed)
