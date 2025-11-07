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
    # CG and Newton-CG use different tolerance parameters
    # They converge based on gradient norm internally

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
