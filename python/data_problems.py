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
