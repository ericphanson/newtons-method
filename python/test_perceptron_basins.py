"""Test perceptron with Newton from different initial points."""
import numpy as np
from scipy.optimize import minimize
from data_problems import PerceptronSVM

# Load perceptron problem
problem = PerceptronSVM('datasets/crescent.json', lambda_reg=0.0001)

# Test different initial points
initial_points = [
    ([0.0, 0.0, 0.0], "origin"),
    ([0.5, 0.5, 0.0], "0.5,0.5,0"),
    ([1.0, 1.0, 0.0], "1,1,0"),
    ([2.0, 2.0, 0.0], "2,2,0"),
    ([-0.5, -0.5, 0.0], "-0.5,-0.5,0"),
]

print("=" * 70)
print("Testing Perceptron + Newton from different initial points")
print("=" * 70)

for init, label in initial_points:
    result = minimize(
        problem.objective,
        np.array(init),
        method='Newton-CG',
        jac=problem.gradient,
        options={'maxiter': 100, 'disp': False}
    )
    
    print(f"\nInitial: {label:15s} {init}")
    print(f"  Converged: {result.success}")
    print(f"  Iterations: {result.nit}")
    print(f"  Final loss: {result.fun:.6e}")
    print(f"  Final position: [{result.x[0]:.4f}, {result.x[1]:.4f}, {result.x[2]:.4f}]")
    print(f"  Gradient norm: {np.linalg.norm(result.jac):.2e}")
