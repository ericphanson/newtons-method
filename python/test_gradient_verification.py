#!/usr/bin/env python3
"""
Verify analytical gradients and Hessians against finite difference approximations.

Usage:
    cd python && .venv/bin/python test_gradient_verification.py
    # or if venv is activated:
    python test_gradient_verification.py

For a function f(w), the gradient should satisfy:
∇f(w)[i] ≈ (f(w + ε·e_i) - f(w - ε·e_i)) / (2ε)

For the Hessian, the second derivative should satisfy:
H[i,j] ≈ (f(w + ε·e_i + ε·e_j) - f(w + ε·e_i - ε·e_j) - f(w - ε·e_i + ε·e_j) + f(w - ε·e_i - ε·e_j)) / (4ε²)

This test verifies that analytical derivatives match numerical approximations.
"""

import numpy as np
from pathlib import Path
from data_problems import (
    LogisticRegression,
    SoftMarginSVM,
    PerceptronSVM,
    SquaredHingeSVM
)


def numerical_gradient(func, w: np.ndarray, epsilon: float = 1e-7) -> np.ndarray:
    """Compute gradient using central finite differences."""
    grad = np.zeros_like(w)

    for i in range(len(w)):
        w_plus = w.copy()
        w_minus = w.copy()

        w_plus[i] += epsilon
        w_minus[i] -= epsilon

        grad[i] = (func(w_plus) - func(w_minus)) / (2 * epsilon)

    return grad


def numerical_hessian(func, w: np.ndarray, epsilon: float = 1e-5) -> np.ndarray:
    """Compute Hessian using central finite differences."""
    n = len(w)
    H = np.zeros((n, n))

    for i in range(n):
        for j in range(n):
            w_pp = w.copy()
            w_pm = w.copy()
            w_mp = w.copy()
            w_mm = w.copy()

            w_pp[i] += epsilon
            w_pp[j] += epsilon

            w_pm[i] += epsilon
            w_pm[j] -= epsilon

            w_mp[i] -= epsilon
            w_mp[j] += epsilon

            w_mm[i] -= epsilon
            w_mm[j] -= epsilon

            H[i, j] = (func(w_pp) - func(w_pm) - func(w_mp) + func(w_mm)) / (4 * epsilon**2)

    return H


def test_gradient(name: str, problem, w: np.ndarray, threshold: float = 1e-4) -> bool:
    """Test gradient against numerical approximation."""
    print(f"\n=== Testing {name} Gradient ===")

    analytic_grad = problem.gradient(w)
    numeric_grad = numerical_gradient(problem.objective, w)

    print(f"Analytic gradient: {analytic_grad}")
    print(f"Numeric gradient:  {numeric_grad}")

    # Compute relative error for each component
    errors = []
    for i in range(len(w)):
        abs_error = abs(analytic_grad[i] - numeric_grad[i])
        scale = max(abs(analytic_grad[i]), abs(numeric_grad[i]), 1e-10)
        rel_error = abs_error / scale
        errors.append(rel_error)

    print(f"Relative errors:   {[f'{e:.2e}' for e in errors]}")

    max_error = max(errors)

    if max_error < threshold:
        print(f"✅ PASS: max relative error = {max_error:.2e} < {threshold}")
        return True
    else:
        print(f"❌ FAIL: max relative error = {max_error:.2e} >= {threshold}")
        return False


def test_hessian(name: str, problem, w: np.ndarray, threshold: float = 1e-3) -> bool:
    """Test Hessian against numerical approximation."""
    print(f"\n=== Testing {name} Hessian ===")

    analytic_hessian = problem.hessian(w)
    numeric_hessian = numerical_hessian(problem.objective, w)

    print(f"Analytic Hessian:\n{analytic_hessian}")
    print(f"Numeric Hessian:\n{numeric_hessian}")

    # Compute relative error for each element
    errors = []
    n = len(w)
    for i in range(n):
        for j in range(n):
            abs_error = abs(analytic_hessian[i, j] - numeric_hessian[i, j])
            scale = max(abs(analytic_hessian[i, j]), abs(numeric_hessian[i, j]), 1e-10)
            rel_error = abs_error / scale
            errors.append(rel_error)

    error_matrix = np.array(errors).reshape(n, n)
    print(f"Relative errors:\n{error_matrix}")

    max_error = max(errors)

    if max_error < threshold:
        print(f"✅ PASS: max relative error = {max_error:.2e} < {threshold}")
        return True
    else:
        print(f"❌ FAIL: max relative error = {max_error:.2e} >= {threshold}")
        return False


def main():
    # Use a sample dataset
    dataset_path = Path(__file__).parent / "datasets" / "crescent.json"

    if not dataset_path.exists():
        print(f"Warning: Dataset not found at {dataset_path}")
        print("Skipping tests - please provide a valid dataset path")
        return

    lambda_reg = 0.1
    w_test = np.array([0.5, -0.3, 0.2])

    print("=" * 60)
    print("GRADIENT AND HESSIAN VERIFICATION TESTS")
    print("=" * 60)
    print(f"Dataset: {dataset_path.name}")
    print(f"Lambda: {lambda_reg}")
    print(f"Test point w: {w_test}")

    results = []

    # Test Logistic Regression
    lr = LogisticRegression(str(dataset_path), lambda_reg)
    results.append(("Logistic Regression Gradient", test_gradient("Logistic Regression", lr, w_test)))
    results.append(("Logistic Regression Hessian", test_hessian("Logistic Regression", lr, w_test)))

    # Test Soft-Margin SVM
    svm = SoftMarginSVM(str(dataset_path), lambda_reg)
    results.append(("Soft-Margin SVM Gradient", test_gradient("Soft-Margin SVM", svm, w_test)))
    # SoftMarginSVM doesn't have a hessian (subgradient - not smooth)

    # Test Perceptron
    perceptron = PerceptronSVM(str(dataset_path), lambda_reg)
    results.append(("Perceptron Gradient", test_gradient("Perceptron", perceptron, w_test)))
    # Perceptron doesn't have a hessian (not smooth)

    # Test Squared-Hinge SVM
    squared = SquaredHingeSVM(str(dataset_path), lambda_reg)
    results.append(("Squared-Hinge SVM Gradient", test_gradient("Squared-Hinge SVM", squared, w_test)))
    results.append(("Squared-Hinge SVM Hessian", test_hessian("Squared-Hinge SVM", squared, w_test)))

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")

    print(f"\n{passed}/{total} tests passed")

    if passed == total:
        print("✅ All derivatives are mathematically consistent!")
        return 0
    else:
        print("❌ Some derivatives do NOT match numerical approximations")
        return 1


if __name__ == "__main__":
    exit(main())
