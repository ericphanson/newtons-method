"""Test perceptron with different algorithms from [0.5, 0.5, 0]."""
import numpy as np
from scipy.optimize import minimize
from data_problems import PerceptronSVM

problem = PerceptronSVM('datasets/crescent.json', lambda_reg=0.0001)
init = np.array([0.5, 0.5, 0.0])

algorithms = [
    ('Newton-CG', {}),
    ('CG', {}),
    ('BFGS', {}),
    ('L-BFGS-B', {}),
]

print("Testing from [0.5, 0.5, 0] with different algorithms:")
print("=" * 70)

for method, options in algorithms:
    result = minimize(
        problem.objective,
        init.copy(),
        method=method,
        jac=problem.gradient,
        options={'maxiter': 100, 'disp': False, **options}
    )

    print(f"\n{method:12s}:")
    print(f"  Converged: {result.success}")
    print(f"  Iterations: {result.nit}")
    print(f"  Final loss: {result.fun:.6e}")
    print(f"  Gradient norm: {np.linalg.norm(result.jac):.2e}")
