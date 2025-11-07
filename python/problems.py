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


def ill_conditioned_quadratic() -> Problem:
    """Ill-conditioned quadratic: f(w) = w0^2 + 100*w1^2 (condition number = 100)"""

    def objective(w: np.ndarray) -> float:
        return w[0] ** 2 + 100 * w[1] ** 2

    def gradient(w: np.ndarray) -> np.ndarray:
        return np.array([2 * w[0], 200 * w[1]])

    def hessian(w: np.ndarray) -> np.ndarray:
        return np.array([[2.0, 0.0], [0.0, 200.0]])

    return Problem("ill-conditioned-quadratic", objective, gradient, hessian)


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


def non_convex_saddle() -> Problem:
    """Non-convex saddle: f(w) = w0^2 - w1^2 (unbounded)"""

    def objective(w: np.ndarray) -> float:
        return w[0] ** 2 - w[1] ** 2

    def gradient(w: np.ndarray) -> np.ndarray:
        return np.array([2 * w[0], -2 * w[1]])

    def hessian(w: np.ndarray) -> np.ndarray:
        return np.array([[2.0, 0.0], [0.0, -2.0]])

    return Problem("non-convex-saddle", objective, gradient, hessian)


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
