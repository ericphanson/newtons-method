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
