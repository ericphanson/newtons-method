#!/usr/bin/env python3
"""
Cross-validate Python and TypeScript implementations.

This test compares the outputs of Python and TypeScript implementations
at the same test points to ensure they produce identical results.
"""

import json
import subprocess
import numpy as np
from pathlib import Path
from data_problems import (
    LogisticRegression,
    SoftMarginSVM,
    PerceptronSVM,
    SquaredHingeSVM
)


def call_ts_separating_hyperplane(variant: str, w: np.ndarray, lambda_reg: float, dataset_path: str) -> dict:
    """Call TypeScript implementation to get objective and gradient."""
    # Create a simple Node script to call the TypeScript functions
    # Use relative import from parent directory
    ts_script = f"""
import {{ readFileSync }} from 'fs';
import {{ {variant}Objective, {variant}Gradient }} from '../src/utils/separatingHyperplane.js';

const data = JSON.parse(readFileSync('{dataset_path}', 'utf-8'));
const w = {json.dumps(w.tolist())};
const lambda = {lambda_reg};

const objective = {variant}Objective(w, data.points, lambda);
const gradient = {variant}Gradient(w, data.points, lambda);

console.log(JSON.stringify({{ objective, gradient }}));
"""

    # Write temp script
    script_path = Path(__file__).parent / "_temp_ts_test.mjs"
    script_path.write_text(ts_script)

    try:
        result = subprocess.run(
            ['node', str(script_path)],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            print(f"Error calling TypeScript: {result.stderr}")
            return None

        return json.loads(result.stdout.strip())
    finally:
        if script_path.exists():
            script_path.unlink()


def test_separating_hyperplane_cross_validation():
    """Test that Python and TypeScript implementations match."""
    dataset_path = Path(__file__).parent / "datasets" / "crescent.json"
    lambda_reg = 0.1
    w_test = np.array([0.5, -0.3, 0.2])

    print("=" * 70)
    print("CROSS-VALIDATION: Python vs TypeScript")
    print("=" * 70)
    print(f"Dataset: {dataset_path.name}")
    print(f"Lambda: {lambda_reg}")
    print(f"Test point w: {w_test}")
    print()

    all_pass = True

    # Test Soft-Margin SVM
    print("=== Soft-Margin SVM ===")
    py_svm = SoftMarginSVM(str(dataset_path), lambda_reg)
    py_obj = py_svm.objective(w_test)
    py_grad = py_svm.gradient(w_test)

    ts_result = call_ts_separating_hyperplane('softMargin', w_test, lambda_reg, str(dataset_path))
    if ts_result:
        ts_obj = ts_result['objective']
        ts_grad = np.array(ts_result['gradient'])

        print(f"Python objective:     {py_obj:.10f}")
        print(f"TypeScript objective: {ts_obj:.10f}")
        print(f"Difference:           {abs(py_obj - ts_obj):.2e}")
        print()
        print(f"Python gradient:     {py_grad}")
        print(f"TypeScript gradient: {ts_grad}")
        print(f"Gradient diff:       {np.abs(py_grad - ts_grad)}")

        obj_match = abs(py_obj - ts_obj) < 1e-10
        grad_match = np.allclose(py_grad, ts_grad, atol=1e-10)

        if obj_match and grad_match:
            print("✅ MATCH")
        else:
            print("❌ MISMATCH")
            all_pass = False
    else:
        print("❌ Failed to call TypeScript")
        all_pass = False

    print()

    # Test Perceptron
    print("=== Perceptron ===")
    py_perc = PerceptronSVM(str(dataset_path), lambda_reg)
    py_obj = py_perc.objective(w_test)
    py_grad = py_perc.gradient(w_test)

    ts_result = call_ts_separating_hyperplane('perceptron', w_test, lambda_reg, str(dataset_path))
    if ts_result:
        ts_obj = ts_result['objective']
        ts_grad = np.array(ts_result['gradient'])

        print(f"Python objective:     {py_obj:.10f}")
        print(f"TypeScript objective: {ts_obj:.10f}")
        print(f"Difference:           {abs(py_obj - ts_obj):.2e}")
        print()
        print(f"Python gradient:     {py_grad}")
        print(f"TypeScript gradient: {ts_grad}")
        print(f"Gradient diff:       {np.abs(py_grad - ts_grad)}")

        obj_match = abs(py_obj - ts_obj) < 1e-10
        grad_match = np.allclose(py_grad, ts_grad, atol=1e-10)

        if obj_match and grad_match:
            print("✅ MATCH")
        else:
            print("❌ MISMATCH")
            all_pass = False
    else:
        print("❌ Failed to call TypeScript")
        all_pass = False

    print()

    # Test Squared-Hinge SVM
    print("=== Squared-Hinge SVM ===")
    py_sq = SquaredHingeSVM(str(dataset_path), lambda_reg)
    py_obj = py_sq.objective(w_test)
    py_grad = py_sq.gradient(w_test)

    ts_result = call_ts_separating_hyperplane('squaredHinge', w_test, lambda_reg, str(dataset_path))
    if ts_result:
        ts_obj = ts_result['objective']
        ts_grad = np.array(ts_result['gradient'])

        print(f"Python objective:     {py_obj:.10f}")
        print(f"TypeScript objective: {ts_obj:.10f}")
        print(f"Difference:           {abs(py_obj - ts_obj):.2e}")
        print()
        print(f"Python gradient:     {py_grad}")
        print(f"TypeScript gradient: {ts_grad}")
        print(f"Gradient diff:       {np.abs(py_grad - ts_grad)}")

        obj_match = abs(py_obj - ts_obj) < 1e-10
        grad_match = np.allclose(py_grad, ts_grad, atol=1e-10)

        if obj_match and grad_match:
            print("✅ MATCH")
        else:
            print("❌ MISMATCH")
            all_pass = False
    else:
        print("❌ Failed to call TypeScript")
        all_pass = False

    print()
    print("=" * 70)
    if all_pass:
        print("✅ All cross-validation tests passed!")
        print("Python and TypeScript implementations are IDENTICAL")
        return 0
    else:
        print("❌ Some cross-validation tests failed")
        print("Python and TypeScript implementations DIFFER")
        return 1


if __name__ == "__main__":
    exit(test_separating_hyperplane_cross_validation())
