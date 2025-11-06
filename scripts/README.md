# Test Combinations CLI

Programmatically test different problem/algorithm/parameter combinations from the command line.

## Quick Start

```bash
# Test a specific combination
npm run test-combo -- --problem rosenbrock --algorithm lbfgs

# Test all problem/algorithm combinations
npm run test-all
```

## Usage

### Test a Single Combination

```bash
npm run test-combo -- [options]
```

**Options:**
- `--problem <name>` - Problem to test (default: `quadratic`)
- `--algorithm <alg>` or `--alg <alg>` - Algorithm to use
- `--initial <w0,w1>` - Initial point (default: `-1,1`)
- `--maxIter <n>` - Maximum iterations (default: `100`)
- `--alpha <value>` - Step size for GD fixed (default: `0.1`)
- `--c1 <value>` - Armijo constant for line search algorithms (default: `0.0001`)
- `--m <value>` - Memory size for L-BFGS (default: `5`)

**Available Problems:**
- `quadratic` - Simple quadratic bowl
- `ill-conditioned-quadratic` - Elongated ellipse (κ=100)
- `rosenbrock` - Banana-shaped valley (non-convex)
- `non-convex-saddle` - Saddle point function

**Available Algorithms:**
- `gd-fixed` - Gradient Descent with fixed step size
- `gd-linesearch` - Gradient Descent with Armijo line search
- `newton` - Newton's method
- `lbfgs` - L-BFGS quasi-Newton method

### Examples

```bash
# Test L-BFGS on Rosenbrock with custom parameters
npm run test-combo -- --problem rosenbrock --algorithm lbfgs --m 10

# Test GD fixed with small step size
npm run test-combo -- --problem rosenbrock --algorithm gd-fixed --alpha 0.001

# Test Newton's method from different starting point
npm run test-combo -- --problem rosenbrock --algorithm newton --initial 2,2

# Test all algorithms on all problems
npm run test-all
```

## Output

The script reports:
- **✅ CONVERGED** - Algorithm reached convergence criteria (grad norm < 1e-5)
- **⚠️ DID NOT CONVERGE** - Reached maxIter without converging
- **❌ DIVERGED** - Algorithm produced NaN/Infinity values
- **❌ ERROR** - Configuration error (invalid problem/algorithm name)

For each test, you'll see:
- Number of iterations
- Final loss value
- Final gradient norm

## Use Cases

**1. Debug algorithm behavior:**
```bash
# Why does L-BFGS only show 1 iteration on Rosenbrock?
npm run test-combo -- --problem rosenbrock --algorithm lbfgs
# Result: Actually converges in 2 iterations - working correctly!
```

**2. Find good hyperparameters:**
```bash
# Try different alpha values for GD on Rosenbrock
npm run test-combo -- --problem rosenbrock --algorithm gd-fixed --alpha 0.1
npm run test-combo -- --problem rosenbrock --algorithm gd-fixed --alpha 0.01
npm run test-combo -- --problem rosenbrock --algorithm gd-fixed --alpha 0.001
```

**3. Benchmark all combinations:**
```bash
# See which algorithms work best on which problems
npm run test-all
```

**4. Verify fixes:**
```bash
# Check that defensive NaN handling works
npm run test-all | grep -E "(DIVERGED|ERROR)"
```

## Integration with CI/CD

You can use this in automated testing:

```bash
# Check if all algorithms converge (exit code 0 = success)
npm run test-all && echo "All tests passed"

# Run specific regression tests
npm run test-combo -- --problem rosenbrock --algorithm lbfgs
npm run test-combo -- --problem quadratic --algorithm newton
```

## Notes

- The script uses the same algorithm implementations as the UI
- Results should match what you see in the visualizer
- Fast algorithms (Newton, L-BFGS) may converge in very few iterations
- GD-fixed on Rosenbrock typically requires very small alpha (e.g., 0.001) or diverges
