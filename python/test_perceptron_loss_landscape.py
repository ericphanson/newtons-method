"""Check what the actual minima are."""
import numpy as np
from data_problems import PerceptronSVM

problem = PerceptronSVM('datasets/crescent.json', lambda_reg=0.0001)

points_to_check = [
    [0.0, 0.0, 0.0],
    [0.5, 0.5, 0.0],
    [1.0, 1.0, 0.0],
    # Try the result scipy got from [-0.5, -0.5, 0]
    [0.0516, -0.2611, 0.4597],
]

print("Loss at various points:")
print("=" * 70)

for pt in points_to_check:
    w = np.array(pt)
    loss = problem.objective(w)
    grad = problem.gradient(w)
    grad_norm = np.linalg.norm(grad)
    print(f"w=[{w[0]:6.3f}, {w[1]:6.3f}, {w[2]:6.3f}] → loss={loss:.6e}, grad_norm={grad_norm:.2e}")
