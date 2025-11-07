"""Deep dive into perceptron behavior from [0.5, 0.5, 0]."""
import numpy as np
from data_problems import PerceptronSVM

problem = PerceptronSVM('datasets/crescent.json', lambda_reg=0.0001)

# Check Hessian properties (it should be constant for perceptron)
w = np.array([0.5, 0.5, 0.0])

# For perceptron, Hessian is just lambda * I (from regularization only)
# The perceptron loss max(0, -y*z) has zero second derivative
H_theoretical = np.array([
    [0.0001, 0, 0],
    [0, 0.0001, 0],
    [0, 0, 0.01]  # bias term gets small constant
])

print("=" * 70)
print("Perceptron Hessian Analysis")
print("=" * 70)
print(f"\nTheoretical Hessian (from perceptronHessian()):")
print(H_theoretical)
print(f"\nEigenvalues: {np.linalg.eigvals(H_theoretical)}")
print(f"Condition number: {np.linalg.cond(H_theoretical):.2e}")

# Compute gradient and theoretical Newton step
grad = problem.gradient(w)
print(f"\n\nAt w=[{w[0]}, {w[1]}, {w[2]}]:")
print(f"  Gradient: {grad}")
print(f"  Gradient norm: {np.linalg.norm(grad):.2e}")

# Newton direction: p = -H^{-1} @ g
H_inv = np.linalg.inv(H_theoretical)
newton_dir = -H_inv @ grad

print(f"\n  Newton direction: {newton_dir}")
print(f"  Newton direction norm: {np.linalg.norm(newton_dir):.2e}")
print(f"  Ratio (||newton_dir|| / ||grad||): {np.linalg.norm(newton_dir) / np.linalg.norm(grad):.2e}")

# Test what happens if we take full Newton step
w_newton = w + newton_dir
loss_before = problem.objective(w)
loss_after = problem.objective(w_newton)

print(f"\n  If we take full Newton step:")
print(f"    w_new = {w_newton}")
print(f"    Loss before: {loss_before:.6e}")
print(f"    Loss after: {loss_after:.6e}")
print(f"    Loss change: {loss_after - loss_before:.6e}")

# Now try with damping
print(f"\n\nWith Hessian damping = 0.01:")
H_damped = H_theoretical + 0.01 * np.eye(3)
print(f"  Damped eigenvalues: {np.linalg.eigvals(H_damped)}")
H_damped_inv = np.linalg.inv(H_damped)
newton_dir_damped = -H_damped_inv @ grad
print(f"  Damped Newton direction: {newton_dir_damped}")
print(f"  Damped direction norm: {np.linalg.norm(newton_dir_damped):.2e}")
print(f"  Ratio (||damped|| / ||grad||): {np.linalg.norm(newton_dir_damped) / np.linalg.norm(grad):.2e}")

w_damped = w + newton_dir_damped
loss_damped = problem.objective(w_damped)
print(f"\n  If we take full damped Newton step:")
print(f"    w_new = {w_damped}")
print(f"    Loss: {loss_damped:.6e}")
print(f"    Loss change: {loss_damped - loss_before:.6e}")
