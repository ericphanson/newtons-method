"""Check scipy Newton-CG behavior in detail."""
import numpy as np
from scipy.optimize import minimize
from data_problems import PerceptronSVM

problem = PerceptronSVM('datasets/crescent.json', lambda_reg=0.0001)
init = np.array([0.5, 0.5, 0.0])

# Track iterations
iteration_data = []

def callback(xk):
    loss = problem.objective(xk)
    grad = problem.gradient(xk)
    grad_norm = np.linalg.norm(grad)
    iteration_data.append({
        'x': xk.copy(),
        'loss': loss,
        'grad_norm': grad_norm
    })
    print(f"  Iter {len(iteration_data)}: loss={loss:.6e}, grad_norm={grad_norm:.2e}")

print("scipy Newton-CG with callback:")
print("=" * 70)

result = minimize(
    problem.objective,
    init,
    method='Newton-CG',
    jac=problem.gradient,
    callback=callback,
    options={'maxiter': 20, 'disp': True}
)

print(f"\nResult:")
print(f"  Success: {result.success}")
print(f"  Message: {result.message}")
print(f"  Iterations: {result.nit}")
print(f"  Function evals: {result.nfev}")
