#!/usr/bin/env python3
"""
Test perceptron with Newton's method from multiple starting points.

This test investigates numerical stability and convergence behavior
of Newton's method on the perceptron objective.
"""

import numpy as np
import subprocess
import json
from pathlib import Path
from data_problems import PerceptronSVM
from scipy_runner import run_scipy_optimizer


def run_ts_newton(initial: list, lambda_reg: float, dataset: str, max_iter: int = 100) -> dict:
    """Run TypeScript Newton's method."""
    initial_str = ",".join(map(str, initial))

    cmd = [
        'npm', 'run', 'test-combo', '--',
        '--problem', 'separating-hyperplane',
        '--variant', 'perceptron',
        '--algorithm', 'newton',
        '--initial', initial_str,
        '--lambda', str(lambda_reg),
        '--maxIter', str(max_iter),
        '--dataset', dataset
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10,
            cwd=Path(__file__).parent.parent
        )

        # Parse output
        output = result.stdout

        # Extract final results
        converged = 'Converged' in output

        # Try to extract loss and gradient norm
        import re
        loss_match = re.search(r'Final loss:\s*([\d.e+-]+)', output)
        grad_match = re.search(r'Gradient norm:\s*([\d.e+-]+)', output)
        iter_match = re.search(r'Iteration (\d+)', output)
        pos_match = re.search(r'Position:\s*\[([-\d.e+, ]+)\]', output)

        final_loss = float(loss_match.group(1)) if loss_match else np.inf
        final_grad = float(grad_match.group(1)) if grad_match else np.inf
        iterations = int(iter_match.group(1)) if iter_match else max_iter

        final_w = None
        if pos_match:
            pos_str = pos_match.group(1)
            final_w = np.array([float(x.strip()) for x in pos_str.split(',')])

        return {
            'converged': converged,
            'iterations': iterations,
            'final_loss': final_loss,
            'final_grad_norm': final_grad,
            'final_w': final_w,
            'output': output
        }

    except Exception as e:
        return {
            'converged': False,
            'iterations': 0,
            'final_loss': np.inf,
            'final_grad_norm': np.inf,
            'final_w': None,
            'error': str(e)
        }


def test_starting_point(initial: np.ndarray, problem, lambda_reg: float, dataset_path: str):
    """Test a single starting point with both Python and TypeScript."""
    print(f"\n{'='*70}")
    print(f"Initial point: [{initial[0]:7.3f}, {initial[1]:7.3f}, {initial[2]:7.3f}]")
    print(f"{'='*70}")

    # Python (scipy Newton-CG)
    print("\nPython (scipy Newton-CG):")
    py_result = run_scipy_optimizer(
        problem,
        'newton',
        initial.copy(),
        max_iter=100,
        tol=1e-6
    )

    print(f"  Converged: {py_result['converged']}")
    print(f"  Iterations: {py_result['iterations']}")
    print(f"  Final loss: {py_result['final_loss']:.6e}")
    print(f"  Grad norm: {py_result['final_grad_norm']:.6e}")
    print(f"  Final w: {py_result['final_w']}")

    # Show iteration trajectory
    if len(py_result['iteration_history']) > 0:
        print(f"\n  First 5 iterations:")
        for it in py_result['iteration_history'][:5]:
            print(f"    Iter {it['iter']}: loss={it['loss']:.6e}, grad_norm={it['grad_norm']:.6e}")

    # TypeScript Newton
    print("\nTypeScript Newton:")
    ts_result = run_ts_newton(
        initial.tolist(),
        lambda_reg,
        dataset_path,
        max_iter=100
    )

    print(f"  Converged: {ts_result['converged']}")
    print(f"  Iterations: {ts_result['iterations']}")
    print(f"  Final loss: {ts_result['final_loss']:.6e}")
    print(f"  Grad norm: {ts_result['final_grad_norm']:.6e}")
    if ts_result['final_w'] is not None:
        print(f"  Final w: {ts_result['final_w']}")

    # Show first few lines of output to see trajectory
    if 'output' in ts_result:
        lines = ts_result['output'].split('\n')
        iter_lines = [l for l in lines if 'Iteration' in l or 'loss:' in l or 'Loss:' in l]
        if len(iter_lines) > 0:
            print(f"\n  First iterations from output:")
            for line in iter_lines[:10]:
                print(f"    {line.strip()}")

    # Compare
    print("\nComparison:")
    if py_result['converged'] and ts_result['converged']:
        loss_diff = abs(py_result['final_loss'] - ts_result['final_loss'])
        print(f"  Loss difference: {loss_diff:.6e}")

        if py_result['final_w'] is not None and ts_result['final_w'] is not None:
            w_diff = np.linalg.norm(py_result['final_w'] - ts_result['final_w'])
            print(f"  Position difference: {w_diff:.6e}")

            if loss_diff < 1e-3 and w_diff < 0.1:
                print(f"  ✅ MATCH")
                return True
            else:
                print(f"  ⚠️  DIFFERENT but both converged")
                return True
    elif not py_result['converged'] and not ts_result['converged']:
        print(f"  ⚠️  Both diverged")
        return True
    else:
        print(f"  ❌ CONVERGENCE MISMATCH")
        return False

    return False


def main():
    dataset_path = Path(__file__).parent / "datasets" / "crescent.json"
    lambda_reg = 0.1

    problem = PerceptronSVM(str(dataset_path), lambda_reg)

    print("="*70)
    print("PERCEPTRON NEWTON STABILITY TEST")
    print("="*70)
    print(f"Dataset: {dataset_path.name}")
    print(f"Lambda: {lambda_reg}")
    print(f"Problem: Perceptron with regularization")
    print()

    # Test various starting points
    test_points = [
        np.array([0.0, 0.0, 0.0]),     # Origin
        np.array([1.0, 1.0, 1.0]),     # Ones
        np.array([0.5, -0.3, 0.2]),    # Standard test point
        np.array([-1.0, 1.0, 0.0]),    # Mixed signs
        np.array([5.0, 5.0, 5.0]),     # Far from origin
        np.array([0.1, 0.1, 0.1]),     # Near origin
        np.array([10.0, -10.0, 5.0]),  # Large values
        np.array([-5.0, -5.0, -5.0]),  # Negative values
    ]

    results = []
    for i, initial in enumerate(test_points, 1):
        print(f"\n\nTEST {i}/{len(test_points)}")
        success = test_starting_point(initial, problem, lambda_reg, str(dataset_path))
        results.append(success)

    # Summary
    print("\n\n" + "="*70)
    print("SUMMARY")
    print("="*70)

    passed = sum(results)
    total = len(results)

    print(f"\n{passed}/{total} starting points showed consistent behavior")

    if passed == total:
        print("\n✅ Newton's method is stable across all tested starting points")
        return 0
    else:
        print(f"\n⚠️  {total - passed} starting points showed issues")
        print("\nProblematic starting points:")
        for i, (initial, success) in enumerate(zip(test_points, results), 1):
            if not success:
                print(f"  {i}. {initial}")
        return 1


if __name__ == "__main__":
    exit(main())
