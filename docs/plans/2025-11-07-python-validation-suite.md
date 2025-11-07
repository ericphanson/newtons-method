# Python Validation Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Python validation suite that compares TypeScript optimization algorithms against scipy.optimize ground truth to find bugs.

**Architecture:** Python test runner shells out to existing TS CLI, runs scipy.optimize for same test cases, compares results with three-tier classification (PASS/SUSPICIOUS/FAIL). Uses uv for package management, numpy/scipy for numerical operations.

**Tech Stack:** Python 3.11+, uv, numpy, scipy, subprocess for TS CLI integration

---

## Task 1: Python Project Setup

**Files:**
- Create: `python/pyproject.toml`
- Create: `python/.python-version`
- Create: `python/__init__.py`
- Create: `python/datasets/.gitkeep`

**Step 1: Create python directory and initialize uv project**

```bash
cd /Users/eph/newtons-method
mkdir -p python/datasets
cd python
uv init --name optimization-validation
```

Expected: Creates `pyproject.toml` with basic structure

**Step 2: Configure Python version**

Create `python/.python-version`:
```
3.11
```

**Step 3: Add dependencies to pyproject.toml**

Modify `python/pyproject.toml` to include:
```toml
[project]
name = "optimization-validation"
version = "0.1.0"
description = "Validation suite for optimization algorithms"
requires-python = ">=3.11"
dependencies = [
    "numpy>=1.24.0",
    "scipy>=1.11.0",
]
```

**Step 4: Install dependencies**

```bash
cd /Users/eph/newtons-method/python
uv sync
```

Expected: Creates `.venv` and installs numpy, scipy

**Step 5: Create empty __init__.py**

```bash
touch /Users/eph/newtons-method/python/__init__.py
touch /Users/eph/newtons-method/python/datasets/.gitkeep
```

**Step 6: Verify installation**

```bash
cd /Users/eph/newtons-method/python
uv run python -c "import numpy; import scipy; print('Dependencies OK')"
```

Expected: Output "Dependencies OK"

**Step 7: Commit**

```bash
cd /Users/eph/newtons-method
git add python/
git commit -m "feat(python): initialize Python validation project with uv"
```

---

## Task 2: Implement Pure Problem Definitions

**Files:**
- Create: `python/problems.py`

**Step 1: Create problems module with quadratic problem**

Create `python/problems.py`:
```python
"""Pure mathematical optimization problems (2D)."""

import numpy as np
from typing import Callable, Optional


class Problem:
    """Optimization problem interface."""

    def __init__(
        self,
        name: str,
        objective: Callable[[np.ndarray], float],
        gradient: Callable[[np.ndarray], np.ndarray],
        hessian: Optional[Callable[[np.ndarray], np.ndarray]] = None,
    ):
        self.name = name
        self.objective = objective
        self.gradient = gradient
        self.hessian = hessian


def quadratic() -> Problem:
    """Well-conditioned quadratic bowl: f(w) = w0^2 + w1^2"""

    def objective(w: np.ndarray) -> float:
        return w[0] ** 2 + w[1] ** 2

    def gradient(w: np.ndarray) -> np.ndarray:
        return np.array([2 * w[0], 2 * w[1]])

    def hessian(w: np.ndarray) -> np.ndarray:
        return np.array([[2.0, 0.0], [0.0, 2.0]])

    return Problem("quadratic", objective, gradient, hessian)


def get_problem(name: str) -> Problem:
    """Get problem by name."""
    problems = {
        "quadratic": quadratic,
    }
    if name not in problems:
        raise ValueError(f"Unknown problem: {name}")
    return problems[name]()
```

**Step 2: Test quadratic problem manually**

```bash
cd /Users/eph/newtons-method/python
uv run python -c "
from problems import quadratic
import numpy as np

p = quadratic()
w = np.array([1.0, 1.0])
print(f'objective([1,1]) = {p.objective(w)}')  # Should be 2.0
print(f'gradient([1,1]) = {p.gradient(w)}')    # Should be [2, 2]
print(f'hessian([1,1]) = {p.hessian(w)}')      # Should be [[2,0],[0,2]]
"
```

Expected output:
```
objective([1,1]) = 2.0
gradient([1,1]) = [2. 2.]
hessian([1,1]) = [[2. 0.]
 [0. 2.]]
```

**Step 3: Add ill-conditioned quadratic problem**

Add to `python/problems.py`:
```python
def ill_conditioned_quadratic() -> Problem:
    """Ill-conditioned quadratic: f(w) = w0^2 + 100*w1^2 (condition number = 100)"""

    def objective(w: np.ndarray) -> float:
        return w[0] ** 2 + 100 * w[1] ** 2

    def gradient(w: np.ndarray) -> np.ndarray:
        return np.array([2 * w[0], 200 * w[1]])

    def hessian(w: np.ndarray) -> np.ndarray:
        return np.array([[2.0, 0.0], [0.0, 200.0]])

    return Problem("ill-conditioned-quadratic", objective, gradient, hessian)
```

Update `get_problem`:
```python
def get_problem(name: str) -> Problem:
    """Get problem by name."""
    problems = {
        "quadratic": quadratic,
        "ill-conditioned-quadratic": ill_conditioned_quadratic,
    }
    if name not in problems:
        raise ValueError(f"Unknown problem: {name}")
    return problems[name]()
```

**Step 4: Add Rosenbrock problem**

Add to `python/problems.py`:
```python
def rosenbrock() -> Problem:
    """Rosenbrock banana function: f(w) = (1-w0)^2 + 100*(w1-w0^2)^2"""

    def objective(w: np.ndarray) -> float:
        return (1 - w[0]) ** 2 + 100 * (w[1] - w[0] ** 2) ** 2

    def gradient(w: np.ndarray) -> np.ndarray:
        dw0 = -2 * (1 - w[0]) - 400 * w[0] * (w[1] - w[0] ** 2)
        dw1 = 200 * (w[1] - w[0] ** 2)
        return np.array([dw0, dw1])

    def hessian(w: np.ndarray) -> np.ndarray:
        h00 = 2 - 400 * (w[1] - w[0] ** 2) + 800 * w[0] ** 2
        h01 = -400 * w[0]
        h11 = 200.0
        return np.array([[h00, h01], [h01, h11]])

    return Problem("rosenbrock", objective, gradient, hessian)
```

Update `get_problem`:
```python
def get_problem(name: str) -> Problem:
    """Get problem by name."""
    problems = {
        "quadratic": quadratic,
        "ill-conditioned-quadratic": ill_conditioned_quadratic,
        "rosenbrock": rosenbrock,
    }
    if name not in problems:
        raise ValueError(f"Unknown problem: {name}")
    return problems[name]()
```

**Step 5: Add saddle point problem**

Add to `python/problems.py`:
```python
def non_convex_saddle() -> Problem:
    """Non-convex saddle: f(w) = w0^2 - w1^2 (unbounded)"""

    def objective(w: np.ndarray) -> float:
        return w[0] ** 2 - w[1] ** 2

    def gradient(w: np.ndarray) -> np.ndarray:
        return np.array([2 * w[0], -2 * w[1]])

    def hessian(w: np.ndarray) -> np.ndarray:
        return np.array([[2.0, 0.0], [0.0, -2.0]])

    return Problem("non-convex-saddle", objective, gradient, hessian)
```

Update `get_problem`:
```python
def get_problem(name: str) -> Problem:
    """Get problem by name."""
    problems = {
        "quadratic": quadratic,
        "ill-conditioned-quadratic": ill_conditioned_quadratic,
        "rosenbrock": rosenbrock,
        "non-convex-saddle": non_convex_saddle,
    }
    if name not in problems:
        raise ValueError(f"Unknown problem: {name}")
    return problems[name]()
```

**Step 6: Test all problems**

```bash
cd /Users/eph/newtons-method/python
uv run python -c "
from problems import get_problem
import numpy as np

for name in ['quadratic', 'ill-conditioned-quadratic', 'rosenbrock', 'non-convex-saddle']:
    p = get_problem(name)
    w = np.array([1.0, 1.0])
    print(f'{name}: f(w)={p.objective(w):.4f}, ||grad||={np.linalg.norm(p.gradient(w)):.4f}')
"
```

Expected: No errors, reasonable values printed

**Step 7: Commit**

```bash
cd /Users/eph/newtons-method
git add python/problems.py
git commit -m "feat(python): add pure optimization problem definitions"
```

---

## Task 3: TypeScript Dataset Export Script

**Files:**
- Create: `scripts/export-datasets.ts`
- Modify: `package.json` (add export-datasets script)

**Step 1: Create dataset export script**

Create `scripts/export-datasets.ts`:
```typescript
import { generateCrescentData } from '../src/shared-utils';
import * as fs from 'fs';
import * as path from 'path';

console.log('Generating crescent dataset...');
const data = generateCrescentData();

const output = {
  points: data.map(d => ({
    x1: d.x1,
    x2: d.x2,
    y: d.y
  }))
};

const outputDir = path.join(__dirname, '../python/datasets');
const outputPath = path.join(outputDir, 'crescent.json');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Exported ${data.length} points to ${outputPath}`);
```

**Step 2: Add npm script**

Modify `package.json`, add to scripts section:
```json
{
  "scripts": {
    "export-datasets": "tsx scripts/export-datasets.ts"
  }
}
```

**Step 3: Run export script**

```bash
cd /Users/eph/newtons-method
npm run export-datasets
```

Expected output:
```
Generating crescent dataset...
✅ Exported [N] points to /Users/eph/newtons-method/python/datasets/crescent.json
```

**Step 4: Verify exported JSON**

```bash
cd /Users/eph/newtons-method
head -20 python/datasets/crescent.json
```

Expected: Valid JSON with points array containing {x1, x2, y} objects

**Step 5: Commit**

```bash
cd /Users/eph/newtons-method
git add scripts/export-datasets.ts package.json python/datasets/crescent.json
git commit -m "feat(scripts): add dataset export for Python validation"
```

---

## Task 4: Implement Data-Based Problems

**Files:**
- Create: `python/data_problems.py`

**Step 1: Create data problems module with dataset loader**

Create `python/data_problems.py`:
```python
"""Data-based optimization problems (logistic regression, SVM)."""

import json
import numpy as np
from pathlib import Path
from typing import Optional


def load_dataset(path: str) -> dict:
    """Load dataset from JSON file."""
    with open(path, 'r') as f:
        return json.load(f)


def sigmoid(z: np.ndarray) -> np.ndarray:
    """Sigmoid function with clipping to prevent overflow."""
    z_clipped = np.clip(z, -500, 500)
    return 1.0 / (1.0 + np.exp(-z_clipped))
```

**Step 2: Add LogisticRegression class**

Add to `python/data_problems.py`:
```python
class LogisticRegression:
    """Logistic regression with L2 regularization."""

    def __init__(self, dataset_path: str, lambda_reg: float = 0.01):
        data = load_dataset(dataset_path)
        points = data['points']

        # Extract features and labels
        self.X = np.array([[p['x1'], p['x2'], 1.0] for p in points])  # Add bias term
        self.y = np.array([p['y'] for p in points])
        self.lambda_reg = lambda_reg
        self.n = len(self.y)

    def objective(self, w: np.ndarray) -> float:
        """Cross-entropy loss + L2 regularization."""
        z = self.X @ w
        sigma = sigmoid(z)

        # Avoid log(0)
        sigma = np.clip(sigma, 1e-10, 1 - 1e-10)

        # Cross-entropy
        loss = -np.mean(self.y * np.log(sigma) + (1 - self.y) * np.log(1 - sigma))

        # L2 regularization (only on w0, w1, not bias w2)
        reg = (self.lambda_reg / 2) * (w[0] ** 2 + w[1] ** 2)

        return loss + reg

    def gradient(self, w: np.ndarray) -> np.ndarray:
        """Gradient of objective."""
        z = self.X @ w
        sigma = sigmoid(z)
        error = sigma - self.y

        # Gradient
        grad = (self.X.T @ error) / self.n

        # Add regularization gradient (only for w0, w1)
        grad[0] += self.lambda_reg * w[0]
        grad[1] += self.lambda_reg * w[1]
        # grad[2] (bias) has no regularization

        return grad

    def hessian(self, w: np.ndarray) -> np.ndarray:
        """Hessian of objective."""
        z = self.X @ w
        sigma = sigmoid(z)
        d = sigma * (1 - sigma)

        # H = X^T D X / n + λ I (for w0, w1 only)
        D = np.diag(d)
        H = (self.X.T @ D @ self.X) / self.n

        # Add regularization to diagonal (only w0, w1)
        H[0, 0] += self.lambda_reg
        H[1, 1] += self.lambda_reg

        return H
```

**Step 3: Add SVM variant classes**

Add to `python/data_problems.py`:
```python
class SoftMarginSVM:
    """Soft-margin SVM with hinge loss."""

    def __init__(self, dataset_path: str, lambda_reg: float = 0.01):
        data = load_dataset(dataset_path)
        points = data['points']

        # Extract features and convert labels to {-1, +1}
        self.X = np.array([[p['x1'], p['x2'], 1.0] for p in points])
        self.y = np.array([2 * p['y'] - 1 for p in points])  # 0/1 -> -1/+1
        self.lambda_reg = lambda_reg
        self.n = len(self.y)

    def objective(self, w: np.ndarray) -> float:
        """SVM objective: ||w||^2/2 + λ*Σmax(0, 1-y*z)"""
        z = self.X @ w
        margins = 1 - self.y * z
        hinge_loss = np.maximum(0, margins)

        # ||w||^2/2 (only w0, w1, not bias)
        reg = 0.5 * (w[0] ** 2 + w[1] ** 2)

        return reg + self.lambda_reg * np.sum(hinge_loss)

    def gradient(self, w: np.ndarray) -> np.ndarray:
        """Subgradient of SVM objective."""
        z = self.X @ w
        margins = 1 - self.y * z

        # Subgradient: w + λ*Σ(-y*x) for violated constraints
        grad = np.array([w[0], w[1], 0.0])  # Start with w regularization

        for i in range(self.n):
            if margins[i] > 0:  # Violated constraint
                grad -= self.lambda_reg * self.y[i] * self.X[i]

        return grad


class PerceptronSVM:
    """Perceptron with regularization."""

    def __init__(self, dataset_path: str, lambda_reg: float = 0.01):
        data = load_dataset(dataset_path)
        points = data['points']

        self.X = np.array([[p['x1'], p['x2'], 1.0] for p in points])
        self.y = np.array([2 * p['y'] - 1 for p in points])
        self.lambda_reg = lambda_reg
        self.n = len(self.y)

    def objective(self, w: np.ndarray) -> float:
        """Perceptron objective: Σmax(0, -y*z) + λ/2*||w||^2"""
        z = self.X @ w
        perceptron_loss = np.maximum(0, -self.y * z)

        reg = (self.lambda_reg / 2) * (w[0] ** 2 + w[1] ** 2)

        return np.sum(perceptron_loss) + reg

    def gradient(self, w: np.ndarray) -> np.ndarray:
        """Gradient of perceptron objective."""
        z = self.X @ w
        grad = np.array([self.lambda_reg * w[0], self.lambda_reg * w[1], 0.0])

        for i in range(self.n):
            if self.y[i] * z[i] < 0:  # Misclassified
                grad -= self.y[i] * self.X[i]

        return grad


class SquaredHingeSVM:
    """Squared hinge SVM (smooth variant)."""

    def __init__(self, dataset_path: str, lambda_reg: float = 0.01):
        data = load_dataset(dataset_path)
        points = data['points']

        self.X = np.array([[p['x1'], p['x2'], 1.0] for p in points])
        self.y = np.array([2 * p['y'] - 1 for p in points])
        self.lambda_reg = lambda_reg
        self.n = len(self.y)

    def objective(self, w: np.ndarray) -> float:
        """Squared hinge: ||w||^2/2 + λ*Σ[max(0, 1-y*z)]^2"""
        z = self.X @ w
        margins = 1 - self.y * z
        squared_hinge = np.maximum(0, margins) ** 2

        reg = 0.5 * (w[0] ** 2 + w[1] ** 2)

        return reg + self.lambda_reg * np.sum(squared_hinge)

    def gradient(self, w: np.ndarray) -> np.ndarray:
        """Gradient of squared hinge."""
        z = self.X @ w
        margins = 1 - self.y * z

        grad = np.array([w[0], w[1], 0.0])

        for i in range(self.n):
            if margins[i] > 0:
                grad -= 2 * self.lambda_reg * margins[i] * self.y[i] * self.X[i]

        return grad

    def hessian(self, w: np.ndarray) -> np.ndarray:
        """Hessian of squared hinge."""
        z = self.X @ w
        margins = 1 - self.y * z

        H = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 0.0]])

        for i in range(self.n):
            if margins[i] > 0:
                outer = np.outer(self.X[i], self.X[i])
                H += 2 * self.lambda_reg * outer

        return H


def get_data_problem(problem: str, variant: Optional[str], dataset_path: str, lambda_reg: float):
    """Get data-based problem instance."""
    if problem == "logistic-regression":
        return LogisticRegression(dataset_path, lambda_reg)
    elif problem == "separating-hyperplane":
        if variant == "soft-margin":
            return SoftMarginSVM(dataset_path, lambda_reg)
        elif variant == "perceptron":
            return PerceptronSVM(dataset_path, lambda_reg)
        elif variant == "squared-hinge":
            return SquaredHingeSVM(dataset_path, lambda_reg)
        else:
            raise ValueError(f"Unknown variant: {variant}")
    else:
        raise ValueError(f"Unknown data problem: {problem}")
```

**Step 4: Test data problems**

```bash
cd /Users/eph/newtons-method/python
uv run python -c "
from data_problems import get_data_problem
import numpy as np

# Test logistic regression
lr = get_data_problem('logistic-regression', None, 'datasets/crescent.json', 0.01)
w = np.zeros(3)
print(f'LogReg: f(0)={lr.objective(w):.4f}, ||grad||={np.linalg.norm(lr.gradient(w)):.4f}')

# Test SVM variants
for variant in ['soft-margin', 'perceptron', 'squared-hinge']:
    svm = get_data_problem('separating-hyperplane', variant, 'datasets/crescent.json', 0.01)
    print(f'{variant}: f(0)={svm.objective(w):.4f}, ||grad||={np.linalg.norm(svm.gradient(w)):.4f}')
"
```

Expected: No errors, reasonable values printed

**Step 5: Commit**

```bash
cd /Users/eph/newtons-method
git add python/data_problems.py
git commit -m "feat(python): add data-based problem definitions (LogReg, SVM)"
```

---

## Task 5: Implement Scipy Runner with Callback Capture

**Files:**
- Create: `python/scipy_runner.py`

**Step 1: Create scipy runner with callback infrastructure**

Create `python/scipy_runner.py`:
```python
"""Scipy optimizer wrapper with iteration capture."""

import numpy as np
from scipy import optimize
from typing import Any, Optional


class IterationCallback:
    """Captures iteration data during optimization."""

    def __init__(self, problem: Any):
        self.problem = problem
        self.iterations = []

    def __call__(self, xk: np.ndarray, *args, **kwargs):
        """Called by scipy after each iteration."""
        grad = self.problem.gradient(xk)
        self.iterations.append({
            'iter': len(self.iterations),
            'w': xk.copy(),
            'loss': self.problem.objective(xk),
            'grad_norm': np.linalg.norm(grad)
        })
```

**Step 2: Add gradient descent with fixed step size**

Add to `python/scipy_runner.py`:
```python
def gradient_descent_fixed(
    problem: Any,
    x0: np.ndarray,
    alpha: float,
    max_iter: int,
    tol: float = 1e-6
) -> dict:
    """Fixed-step gradient descent (scipy doesn't have this)."""
    w = x0.copy()
    iterations = []

    for i in range(max_iter):
        grad = problem.gradient(w)
        grad_norm = np.linalg.norm(grad)
        loss = problem.objective(w)

        iterations.append({
            'iter': i,
            'w': w.copy(),
            'loss': loss,
            'grad_norm': grad_norm
        })

        if grad_norm < tol:
            return {
                'converged': True,
                'iterations': i + 1,
                'final_loss': loss,
                'final_w': w.copy(),
                'final_grad_norm': grad_norm,
                'message': f'Converged: grad_norm < {tol}',
                'iteration_history': iterations
            }

        w = w - alpha * grad

    # Did not converge
    final_grad = problem.gradient(w)
    final_grad_norm = np.linalg.norm(final_grad)
    final_loss = problem.objective(w)

    iterations.append({
        'iter': max_iter,
        'w': w.copy(),
        'loss': final_loss,
        'grad_norm': final_grad_norm
    })

    return {
        'converged': False,
        'iterations': max_iter,
        'final_loss': final_loss,
        'final_w': w.copy(),
        'final_grad_norm': final_grad_norm,
        'message': 'Max iterations reached',
        'iteration_history': iterations
    }
```

**Step 3: Add scipy method mapping**

Add to `python/scipy_runner.py`:
```python
def run_scipy_optimizer(
    problem: Any,
    algorithm: str,
    x0: np.ndarray,
    max_iter: int,
    tol: float = 1e-6,
    **kwargs
) -> dict:
    """Run scipy optimizer with iteration capture."""

    # Handle fixed-step GD separately
    if algorithm == 'gd-fixed':
        alpha = kwargs.get('alpha', 0.01)
        return gradient_descent_fixed(problem, x0, alpha, max_iter, tol)

    # Map algorithms to scipy methods
    method_map = {
        'gd-linesearch': 'CG',  # Conjugate Gradient (uses line search)
        'newton': 'Newton-CG',
        'lbfgs': 'L-BFGS-B'
    }

    if algorithm not in method_map:
        raise ValueError(f"Unknown algorithm: {algorithm}")

    method = method_map[algorithm]
    callback = IterationCallback(problem)

    # Prepare scipy options
    options = {
        'maxiter': max_iter,
        'disp': False
    }

    # Set tolerance based on method
    if method == 'L-BFGS-B':
        options['ftol'] = tol * 1e-4  # Function tolerance
        options['gtol'] = tol  # Gradient tolerance
    elif method in ['Newton-CG', 'CG']:
        options['xtol'] = tol

    # Prepare Hessian for Newton
    hess = None
    if method == 'Newton-CG' and hasattr(problem, 'hessian') and problem.hessian:
        hess = problem.hessian

    # Run optimization
    try:
        result = optimize.minimize(
            problem.objective,
            x0=x0,
            method=method,
            jac=problem.gradient,
            hess=hess,
            callback=callback,
            options=options
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

    except Exception as e:
        return {
            'converged': False,
            'iterations': len(callback.iterations),
            'final_loss': np.inf,
            'final_w': x0,
            'final_grad_norm': np.inf,
            'message': f'Error: {str(e)}',
            'iteration_history': callback.iterations
        }
```

**Step 4: Test scipy runner with quadratic problem**

```bash
cd /Users/eph/newtons-method/python
uv run python -c "
from scipy_runner import run_scipy_optimizer
from problems import quadratic
import numpy as np

p = quadratic()
x0 = np.array([1.0, 1.0])

for alg in ['gd-fixed', 'gd-linesearch', 'newton', 'lbfgs']:
    result = run_scipy_optimizer(p, alg, x0, max_iter=100, alpha=0.1)
    print(f'{alg}: converged={result[\"converged\"]}, iters={result[\"iterations\"]}, loss={result[\"final_loss\"]:.2e}')
"
```

Expected: All algorithms converge in few iterations, final loss near 0

**Step 5: Commit**

```bash
cd /Users/eph/newtons-method
git add python/scipy_runner.py
git commit -m "feat(python): add scipy optimizer wrapper with iteration capture"
```

---

## Task 6: TypeScript CLI Integration

**Files:**
- Create: `python/ts_runner.py`

**Step 1: Create TS CLI runner module**

Create `python/ts_runner.py`:
```python
"""TypeScript CLI integration."""

import subprocess
import re
import numpy as np
from typing import Optional


def run_typescript_test(
    problem: str,
    algorithm: str,
    initial: list[float],
    max_iter: int,
    alpha: Optional[float] = None,
    lambda_reg: Optional[float] = None,
    variant: Optional[str] = None,
    timeout: int = 30
) -> dict:
    """Run TypeScript CLI test and parse output."""

    # Build command
    cmd = [
        'npm', 'run', 'test-combo', '--',
        '--problem', problem,
        '--algorithm', algorithm,
        '--initial', ','.join(str(x) for x in initial),
        '--maxIter', str(max_iter)
    ]

    # Add optional parameters
    if alpha is not None:
        cmd.extend(['--alpha', str(alpha)])
    if lambda_reg is not None:
        cmd.extend(['--lambda', str(lambda_reg)])
    if variant is not None:
        cmd.extend(['--variant', variant])

    # Run command
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd='/Users/eph/newtons-method'
        )

        if result.returncode != 0:
            return {
                'converged': False,
                'iterations': 0,
                'final_loss': np.inf,
                'final_w': np.array(initial),
                'final_grad_norm': np.inf,
                'message': f'CLI error: {result.stderr}',
                'raw_output': result.stdout
            }

        return parse_ts_output(result.stdout, initial)

    except subprocess.TimeoutExpired:
        return {
            'converged': False,
            'iterations': 0,
            'final_loss': np.inf,
            'final_w': np.array(initial),
            'final_grad_norm': np.inf,
            'message': f'Timeout after {timeout}s',
            'raw_output': ''
        }
    except Exception as e:
        return {
            'converged': False,
            'iterations': 0,
            'final_loss': np.inf,
            'final_w': np.array(initial),
            'final_grad_norm': np.inf,
            'message': f'Error: {str(e)}',
            'raw_output': ''
        }


def parse_ts_output(stdout: str, initial: list[float]) -> dict:
    """Parse TypeScript CLI output.

    Expected format:
    ✅ CONVERGED in 5 iterations
       Final loss: 1.234567e-07
       Final grad norm: 8.92e-06
       Final position: [0.000010, 0.000020]
    """
    try:
        # Check convergence
        converged = '✅ CONVERGED' in stdout or 'CONVERGED' in stdout

        # Extract iterations
        iter_match = re.search(r'in (\d+) iterations?', stdout)
        iterations = int(iter_match.group(1)) if iter_match else 0

        # Extract final loss
        loss_match = re.search(r'Final loss:\s*([\d.e+-]+)', stdout)
        final_loss = float(loss_match.group(1)) if loss_match else np.inf

        # Extract final grad norm
        grad_match = re.search(r'Final grad norm:\s*([\d.e+-]+)', stdout)
        final_grad_norm = float(grad_match.group(1)) if grad_match else np.inf

        # Extract final position
        pos_match = re.search(r'Final position:\s*\[(.*?)\]', stdout)
        if pos_match:
            pos_str = pos_match.group(1)
            final_w = np.array([float(x.strip()) for x in pos_str.split(',')])
        else:
            final_w = np.array(initial)

        # Check for divergence
        if 'DIVERGED' in stdout or 'NaN' in stdout or 'Infinity' in stdout:
            converged = False
            final_loss = np.inf
            final_grad_norm = np.inf

        return {
            'converged': converged,
            'iterations': iterations,
            'final_loss': final_loss,
            'final_w': final_w,
            'final_grad_norm': final_grad_norm,
            'message': 'Parsed from CLI output',
            'raw_output': stdout
        }

    except Exception as e:
        return {
            'converged': False,
            'iterations': 0,
            'final_loss': np.inf,
            'final_w': np.array(initial),
            'final_grad_norm': np.inf,
            'message': f'Parse error: {str(e)}',
            'raw_output': stdout
        }
```

**Step 2: Test TS CLI integration**

```bash
cd /Users/eph/newtons-method/python
uv run python -c "
from ts_runner import run_typescript_test

result = run_typescript_test(
    problem='quadratic',
    algorithm='lbfgs',
    initial=[1.0, 1.0],
    max_iter=100
)

print(f'Converged: {result[\"converged\"]}')
print(f'Iterations: {result[\"iterations\"]}')
print(f'Final loss: {result[\"final_loss\"]:.2e}')
print(f'Final position: {result[\"final_w\"]}')
"
```

Expected: Should successfully run TS CLI and parse output

**Step 3: Commit**

```bash
cd /Users/eph/newtons-method
git add python/ts_runner.py
git commit -m "feat(python): add TypeScript CLI integration and output parser"
```

---

## Task 7: Implement Comparison Logic

**Files:**
- Create: `python/comparator.py`

**Step 1: Create comparator module with result classification**

Create `python/comparator.py`:
```python
"""Result comparison logic."""

import numpy as np
from enum import Enum
from typing import Any


class ComparisonStatus(Enum):
    """Comparison result status."""
    PASS = "✅ PASS"
    SUSPICIOUS = "⚠️  SUSPICIOUS"
    FAIL = "❌ FAIL"


def compare_results(
    python_result: dict,
    ts_result: dict,
    problem_name: str
) -> tuple[ComparisonStatus, dict]:
    """Compare Python and TypeScript results.

    Returns:
        (status, details) where details contains issues and differences
    """
    issues = []
    details = {
        'python': {
            'converged': python_result['converged'],
            'iterations': python_result['iterations'],
            'final_loss': python_result['final_loss'],
            'final_grad_norm': python_result['final_grad_norm']
        },
        'ts': {
            'converged': ts_result['converged'],
            'iterations': ts_result['iterations'],
            'final_loss': ts_result['final_loss'],
            'final_grad_norm': ts_result['final_grad_norm']
        },
        'issues': []
    }

    # Special case: saddle point (both should diverge)
    if problem_name == 'non-convex-saddle':
        if not python_result['converged'] and not ts_result['converged']:
            details['issues'] = ['Both correctly diverged (unbounded problem)']
            return ComparisonStatus.PASS, details

    # Critical: Convergence mismatch
    if python_result['converged'] != ts_result['converged']:
        issues.append(
            f"Convergence mismatch: Python={'converged' if python_result['converged'] else 'diverged'}, "
            f"TS={'converged' if ts_result['converged'] else 'diverged'}"
        )
        details['issues'] = issues
        return ComparisonStatus.FAIL, details

    # If both diverged (and not saddle), that's suspicious
    if not python_result['converged'] and not ts_result['converged']:
        issues.append("Both diverged (unexpected for this problem)")
        details['issues'] = issues
        return ComparisonStatus.SUSPICIOUS, details

    # Both converged - compare quality of solution
    py_loss = python_result['final_loss']
    ts_loss = ts_result['final_loss']

    # Check for infinite/nan
    if not np.isfinite(py_loss) or not np.isfinite(ts_loss):
        issues.append(f"Non-finite loss: Python={py_loss}, TS={ts_loss}")
        details['issues'] = issues
        return ComparisonStatus.FAIL, details

    # Compare final loss
    loss_diff = abs(py_loss - ts_loss)
    relative_loss_diff = loss_diff / (abs(py_loss) + 1e-10)

    if relative_loss_diff > 0.10:  # >10% difference = FAIL
        issues.append(
            f"Loss differs by {relative_loss_diff*100:.1f}%: "
            f"Python={py_loss:.6e}, TS={ts_loss:.6e}"
        )
        details['issues'] = issues
        return ComparisonStatus.FAIL, details

    # Compare final position
    w_diff = np.linalg.norm(python_result['final_w'] - ts_result['final_w'])
    if w_diff > 1.0:  # Far apart = FAIL
        issues.append(f"Final positions differ by {w_diff:.4f}")
        details['issues'] = issues
        return ComparisonStatus.FAIL, details

    # SUSPICIOUS level checks
    if relative_loss_diff > 0.01:  # 1-10% difference
        issues.append(
            f"Loss differs by {relative_loss_diff*100:.2f}%: "
            f"Python={py_loss:.6e}, TS={ts_loss:.6e}"
        )

    # Iteration count difference
    py_iters = python_result['iterations']
    ts_iters = ts_result['iterations']
    if py_iters > 0 and ts_iters > 0:
        iter_ratio = max(py_iters, ts_iters) / max(min(py_iters, ts_iters), 1)
        if iter_ratio > 3.0:
            issues.append(
                f"Iteration count differs {iter_ratio:.1f}x: "
                f"Python={py_iters}, TS={ts_iters}"
            )

    # Position difference (moderate)
    if 0.1 < w_diff <= 1.0:
        issues.append(f"Final positions differ by {w_diff:.4f}")

    # Return result
    if issues:
        details['issues'] = issues
        return ComparisonStatus.SUSPICIOUS, details

    details['issues'] = ['All metrics within tolerance']
    return ComparisonStatus.PASS, details
```

**Step 2: Test comparator with mock results**

```bash
cd /Users/eph/newtons-method/python
uv run python -c "
from comparator import compare_results, ComparisonStatus
import numpy as np

# Test PASS case
py_result = {'converged': True, 'iterations': 5, 'final_loss': 1e-8, 'final_grad_norm': 1e-6, 'final_w': np.array([0.0, 0.0])}
ts_result = {'converged': True, 'iterations': 6, 'final_loss': 1.1e-8, 'final_grad_norm': 1.1e-6, 'final_w': np.array([0.0, 0.0])}
status, details = compare_results(py_result, ts_result, 'quadratic')
print(f'Test PASS: {status.value}')

# Test FAIL case (convergence mismatch)
ts_result['converged'] = False
status, details = compare_results(py_result, ts_result, 'quadratic')
print(f'Test FAIL: {status.value}')
assert status == ComparisonStatus.FAIL

# Test SUSPICIOUS case (large iteration difference)
ts_result['converged'] = True
ts_result['iterations'] = 25
status, details = compare_results(py_result, ts_result, 'quadratic')
print(f'Test SUSPICIOUS: {status.value}')
print(f'Issues: {details[\"issues\"]}')
"
```

Expected: Prints correct status for each test case

**Step 3: Commit**

```bash
cd /Users/eph/newtons-method
git add python/comparator.py
git commit -m "feat(python): add comparison logic with three-tier classification"
```

---

## Task 8: Main Test Runner - Infrastructure

**Files:**
- Create: `python/validate_with_python.py`

**Step 1: Create main runner with test case definitions**

Create `python/validate_with_python.py`:
```python
#!/usr/bin/env python3
"""Python validation suite - compares TS algorithms against scipy."""

import argparse
import sys
from pathlib import Path

from problems import get_problem
from data_problems import get_data_problem
from scipy_runner import run_scipy_optimizer
from ts_runner import run_typescript_test
from comparator import compare_results, ComparisonStatus


# Test case definitions
PURE_PROBLEMS = ['quadratic', 'ill-conditioned-quadratic', 'rosenbrock', 'non-convex-saddle']
ALGORITHMS = ['gd-fixed', 'gd-linesearch', 'newton', 'lbfgs']
SVM_VARIANTS = ['soft-margin', 'perceptron', 'squared-hinge']


def get_test_cases() -> list[dict]:
    """Generate all test case configurations."""
    test_cases = []

    # Pure optimization problems (2D)
    for problem in PURE_PROBLEMS:
        for algorithm in ALGORITHMS:
            test_case = {
                'problem': problem,
                'algorithm': algorithm,
                'initial': [1.0, 1.0],
                'max_iter': 100,
                'tol': 1e-6
            }

            # Special parameters
            if algorithm == 'gd-fixed':
                if problem == 'rosenbrock':
                    test_case['alpha'] = 0.001  # Rosenbrock needs small step
                elif problem == 'ill-conditioned-quadratic':
                    test_case['alpha'] = 0.01
                    test_case['max_iter'] = 1000
                else:
                    test_case['alpha'] = 0.1

            test_cases.append(test_case)

    # Logistic regression (3D with bias)
    for algorithm in ALGORITHMS:
        test_case = {
            'problem': 'logistic-regression',
            'algorithm': algorithm,
            'initial': [0.0, 0.0, 0.0],
            'max_iter': 100,
            'lambda': 0.01,
            'tol': 1e-6
        }
        if algorithm == 'gd-fixed':
            test_case['alpha'] = 0.1
        test_cases.append(test_case)

    # SVM variants (3D with bias)
    for variant in SVM_VARIANTS:
        for algorithm in ALGORITHMS:
            test_case = {
                'problem': 'separating-hyperplane',
                'variant': variant,
                'algorithm': algorithm,
                'initial': [0.0, 0.0, 0.0],
                'max_iter': 100,
                'lambda': 0.01,
                'tol': 1e-6
            }
            if algorithm == 'gd-fixed':
                test_case['alpha'] = 0.1
            test_cases.append(test_case)

    return test_cases


def format_test_name(test_case: dict) -> str:
    """Format test case name for display."""
    name = f"{test_case['problem']} + {test_case['algorithm']}"
    if 'variant' in test_case:
        name = f"{test_case['problem']}[{test_case['variant']}] + {test_case['algorithm']}"
    return name


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Validate TS algorithms against scipy')
    parser.add_argument('--all', action='store_true', help='Run all test cases')
    parser.add_argument('--problem', type=str, help='Run specific problem')
    parser.add_argument('--algorithm', type=str, help='Run specific algorithm')
    parser.add_argument('--verbose', action='store_true', help='Show detailed output')
    parser.add_argument('--quiet', action='store_true', help='Show only summary')

    args = parser.parse_args()

    # Get test cases
    all_test_cases = get_test_cases()

    # Filter by arguments
    test_cases = all_test_cases
    if args.problem:
        test_cases = [tc for tc in test_cases if tc['problem'] == args.problem]
    if args.algorithm:
        test_cases = [tc for tc in test_cases if tc['algorithm'] == args.algorithm]

    if not test_cases:
        print("No test cases match the filter criteria")
        return 1

    # Results tracking
    results = {
        'pass': [],
        'suspicious': [],
        'fail': []
    }

    # Run tests
    print(f"\n{'='*60}")
    print(f"Running {len(test_cases)} test cases...")
    print(f"{'='*60}\n")

    # This will be completed in next task
    print("Test runner infrastructure ready (execution logic coming next)")

    return 0


if __name__ == '__main__':
    sys.exit(main())
```

**Step 2: Make script executable**

```bash
chmod +x /Users/eph/newtons-method/python/validate_with_python.py
```

**Step 3: Test infrastructure**

```bash
cd /Users/eph/newtons-method/python
uv run python validate_with_python.py --all
```

Expected: Prints test case count and placeholder message

**Step 4: Commit**

```bash
cd /Users/eph/newtons-method
git add python/validate_with_python.py
git commit -m "feat(python): add test runner infrastructure and test case definitions"
```

---

## Task 9: Main Test Runner - Execution Logic

**Files:**
- Modify: `python/validate_with_python.py`

**Step 1: Add test execution function**

Add to `python/validate_with_python.py` (before `main` function):
```python
def run_single_test(test_case: dict, verbose: bool = False) -> tuple[ComparisonStatus, dict]:
    """Run a single test case comparing Python and TS."""

    # Get problem instance
    if test_case['problem'] in PURE_PROBLEMS:
        problem = get_problem(test_case['problem'])
    else:
        # Data-based problem
        dataset_path = str(Path(__file__).parent / 'datasets' / 'crescent.json')
        problem = get_data_problem(
            test_case['problem'],
            test_case.get('variant'),
            dataset_path,
            test_case.get('lambda', 0.01)
        )

    # Run Python
    python_result = run_scipy_optimizer(
        problem,
        test_case['algorithm'],
        test_case['initial'],
        test_case['max_iter'],
        tol=test_case.get('tol', 1e-6),
        alpha=test_case.get('alpha')
    )

    # Run TypeScript
    ts_result = run_typescript_test(
        problem=test_case['problem'],
        algorithm=test_case['algorithm'],
        initial=test_case['initial'],
        max_iter=test_case['max_iter'],
        alpha=test_case.get('alpha'),
        lambda_reg=test_case.get('lambda'),
        variant=test_case.get('variant')
    )

    # Compare
    status, details = compare_results(python_result, ts_result, test_case['problem'])

    return status, details, python_result, ts_result
```

**Step 2: Add output formatting functions**

Add to `python/validate_with_python.py`:
```python
def print_test_result(test_name: str, status: ComparisonStatus, details: dict, verbose: bool):
    """Print result for a single test."""
    print(f"\n{test_name}")
    print(f"  {status.value}")

    if verbose or status != ComparisonStatus.PASS:
        # Show details
        py = details['python']
        ts = details['ts']
        print(f"    Python: converged={py['converged']}, iters={py['iterations']}, "
              f"loss={py['final_loss']:.2e}, grad_norm={py['final_grad_norm']:.2e}")
        print(f"    TS:     converged={ts['converged']}, iters={ts['iterations']}, "
              f"loss={ts['final_loss']:.2e}, grad_norm={ts['final_grad_norm']:.2e}")

    # Show issues
    if details['issues']:
        for issue in details['issues']:
            print(f"    - {issue}")


def print_summary(results: dict):
    """Print final summary."""
    total = len(results['pass']) + len(results['suspicious']) + len(results['fail'])

    print(f"\n{'='*60}")
    print(f"RESULTS: {total} tests")
    print(f"{'='*60}")
    print(f"✅ PASS:       {len(results['pass'])} tests")
    print(f"⚠️  SUSPICIOUS: {len(results['suspicious'])} tests")
    print(f"❌ FAIL:       {len(results['fail'])} tests")

    if results['fail']:
        print(f"\n{'='*60}")
        print("FAILURES:")
        print(f"{'='*60}")
        for item in results['fail']:
            print(f"\n❌ {item['test_name']}")
            for issue in item['details']['issues']:
                print(f"   - {issue}")

    if results['suspicious']:
        print(f"\n{'='*60}")
        print("SUSPICIOUS:")
        print(f"{'='*60}")
        for item in results['suspicious']:
            print(f"\n⚠️  {item['test_name']}")
            for issue in item['details']['issues']:
                print(f"   - {issue}")
```

**Step 3: Complete main execution loop**

Replace the placeholder section in `main()` with:
```python
    # Run tests
    print(f"\n{'='*60}")
    print(f"Running {len(test_cases)} test cases...")
    print(f"{'='*60}\n")

    for test_case in test_cases:
        test_name = format_test_name(test_case)

        if not args.quiet:
            print(f"\nTesting: {test_name}...", end='', flush=True)

        try:
            status, details, py_result, ts_result = run_single_test(test_case, args.verbose)

            # Store result
            result_entry = {
                'test_name': test_name,
                'test_case': test_case,
                'status': status,
                'details': details,
                'python_result': py_result,
                'ts_result': ts_result
            }

            if status == ComparisonStatus.PASS:
                results['pass'].append(result_entry)
            elif status == ComparisonStatus.SUSPICIOUS:
                results['suspicious'].append(result_entry)
            else:
                results['fail'].append(result_entry)

            # Print result
            if not args.quiet:
                print(f" {status.value}")
                if args.verbose or status != ComparisonStatus.PASS:
                    print_test_result(test_name, status, details, args.verbose)

        except Exception as e:
            print(f"\n❌ ERROR: {test_name}")
            print(f"   {str(e)}")
            results['fail'].append({
                'test_name': test_name,
                'test_case': test_case,
                'status': ComparisonStatus.FAIL,
                'details': {'issues': [f'Exception: {str(e)}']},
                'python_result': None,
                'ts_result': None
            })

    # Print summary
    print_summary(results)

    # Exit code: 0 if all pass, 1 if any fail
    return 0 if not results['fail'] else 1
```

**Step 4: Test complete runner on subset**

```bash
cd /Users/eph/newtons-method/python
uv run python validate_with_python.py --problem quadratic --algorithm lbfgs
```

Expected: Runs single test case, shows comparison result

**Step 5: Test with all cases**

```bash
cd /Users/eph/newtons-method/python
uv run python validate_with_python.py --all
```

Expected: Runs all 36 test cases, shows summary with pass/suspicious/fail counts

**Step 6: Commit**

```bash
cd /Users/eph/newtons-method
git add python/validate_with_python.py
git commit -m "feat(python): add test execution and result reporting"
```

---

## Task 10: Add NPM Script for Easy Execution

**Files:**
- Modify: `package.json`

**Step 1: Add npm script for Python validation**

Modify `package.json`, add to scripts:
```json
{
  "scripts": {
    "validate": "cd python && uv run python validate_with_python.py --all",
    "validate:verbose": "cd python && uv run python validate_with_python.py --all --verbose",
    "validate:quiet": "cd python && uv run python validate_with_python.py --all --quiet"
  }
}
```

**Step 2: Test npm scripts**

```bash
cd /Users/eph/newtons-method
npm run validate:quiet
```

Expected: Runs full validation suite with minimal output

**Step 3: Commit**

```bash
cd /Users/eph/newtons-method
git add package.json
git commit -m "feat(npm): add validation scripts for Python test suite"
```

---

## Task 11: Documentation and README

**Files:**
- Create: `python/README.md`

**Step 1: Create Python README**

Create `python/README.md`:
```markdown
# Python Validation Suite

Validates TypeScript optimization algorithm implementations against scipy.optimize ground truth.

## Purpose

- **Validate Correctness**: Compare TS algorithms against battle-tested scipy implementations
- **Find Bugs**: Identify divergences, NaN issues, and incorrect convergence
- **Debug Iterations**: Capture per-iteration state to see where algorithms diverge

## Setup

```bash
# Install dependencies (from python/ directory)
uv sync

# Export datasets from TS (from project root)
npm run export-datasets
```

## Running Tests

```bash
# From project root
npm run validate              # Run all tests
npm run validate:verbose      # Show detailed output
npm run validate:quiet        # Summary only

# Or directly from python/ directory
uv run python validate_with_python.py --all
uv run python validate_with_python.py --problem rosenbrock
uv run python validate_with_python.py --algorithm lbfgs
uv run python validate_with_python.py --all --verbose
```

## Test Coverage

**36 total test cases:**
- 4 pure optimization problems × 4 algorithms = 16 tests
- 1 logistic regression × 4 algorithms = 4 tests
- 3 SVM variants × 4 algorithms = 12 tests
- 1 rosenbrock × 4 algorithms = 4 tests

**Algorithms:**
- `gd-fixed` - Fixed-step gradient descent
- `gd-linesearch` - Gradient descent with Armijo line search
- `newton` - Newton's method with Hessian
- `lbfgs` - Limited-memory BFGS

**Problems:**
- `quadratic` - Well-conditioned bowl
- `ill-conditioned-quadratic` - Elongated ellipse (κ=100)
- `rosenbrock` - Banana function
- `non-convex-saddle` - Hyperbolic paraboloid (unbounded)
- `logistic-regression` - Binary classification
- `separating-hyperplane` - SVM (soft-margin, perceptron, squared-hinge)

## Result Classification

- **✅ PASS**: Both converged to same solution (within tolerances)
- **⚠️ SUSPICIOUS**: Both converged but with notable differences (1-10% loss diff, >3x iteration count)
- **❌ FAIL**: Convergence mismatch, >10% loss difference, or divergence

## Architecture

```
validate_with_python.py (main runner)
├── problems.py (pure math problems)
├── data_problems.py (logistic regression, SVM)
├── scipy_runner.py (scipy.optimize wrapper)
├── ts_runner.py (TS CLI integration)
└── comparator.py (result comparison)
```

## Tolerances

- **Loss difference**: <1% (PASS), 1-10% (SUSPICIOUS), >10% (FAIL)
- **Position difference**: <0.1 (PASS), 0.1-1.0 (SUSPICIOUS), >1.0 (FAIL)
- **Iteration ratio**: <3x (PASS), >3x (SUSPICIOUS)

## Debugging

When tests fail:
1. Run with `--verbose` to see iteration-by-iteration data
2. Check if TS shows NaN/Infinity (numerical instability)
3. Compare iteration counts (major difference suggests algorithmic bug)
4. Check final positions (far apart = converged to different solutions)
```

**Step 2: Commit**

```bash
cd /Users/eph/newtons-method
git add python/README.md
git commit -m "docs(python): add README for validation suite"
```

---

## Task 12: Final Validation Run

**Files:**
- None (verification only)

**Step 1: Export datasets**

```bash
cd /Users/eph/newtons-method
npm run export-datasets
```

Expected: Exports crescent dataset to python/datasets/

**Step 2: Run full validation suite**

```bash
cd /Users/eph/newtons-method
npm run validate
```

Expected: Runs all 36 test cases, produces summary

**Step 3: Review results**

Expected output should show:
- Number of PASS/SUSPICIOUS/FAIL cases
- List of failures with specific issues
- Any suspicious cases with details

**Step 4: If failures found, document them**

Create a summary comment documenting any bugs found:
```bash
# Example: If we find bugs, document them
echo "Found X failures in validation run - ready for debugging" > validation-results.txt
```

**Step 5: Final commit**

```bash
cd /Users/eph/newtons-method
git add -A
git commit -m "test(python): complete validation suite implementation

Validation suite compares TS algorithms against scipy ground truth.
Results will guide bug fixing in TS implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] Python project initialized with uv
- [ ] All 4 pure problems implemented and tested
- [ ] Dataset export from TS working
- [ ] Data problems (LogReg, SVM) implemented
- [ ] Scipy runner with callback capture working
- [ ] TS CLI integration and parsing working
- [ ] Comparison logic with three-tier classification
- [ ] Main test runner executes all 36 cases
- [ ] NPM scripts for easy execution
- [ ] Documentation complete
- [ ] Full validation run completes

## Next Steps After Implementation

1. **Analyze Failures**: Review FAIL cases to identify bugs in TS code
2. **Fix Bugs**: Update TS implementations based on findings
3. **Re-validate**: Run validation suite again to verify fixes
4. **Iterate**: Continue until all tests PASS or are explained

## Notes

- DRY: Problem definitions are canonical, shared logic in runner
- YAGNI: No complex features beyond core comparison
- TDD: Each component tested before integration
- Frequent commits: Each task ends with a commit
- Complete code: All code examples are complete and runnable
