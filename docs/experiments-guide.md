# Experiment System User Guide

## Overview

The Newton's Method visualizer includes 17 interactive experiments across 4 optimization algorithms. Each experiment demonstrates a specific concept, success pattern, or failure mode.

## How to Use Experiments

1. **Navigate to an algorithm tab** (GD Fixed, GD Line Search, Newton, or L-BFGS)
2. **Scroll to "Try This" section** (expanded by default)
3. **Click the ▶ play button** on any experiment card
4. **Watch the visualization** update with new parameters and problem
5. **Observe the results** as described in the experiment

## Experiment Categories

### Success Cases (Green)
Demonstrate optimal conditions and expected behavior.

### Failure Cases (Red/Orange)
Show what goes wrong with poor parameter choices.

### Comparison Cases (Blue/Purple)
Compare algorithms or parameter settings side-by-side.

## Available Experiments

### Gradient Descent (Fixed Step) - 4 Experiments
1. **Success: Good Step Size (α=0.1)** - Smooth convergence with well-chosen step size
2. **Failure: Too Large (α=0.8)** - Oscillation and divergence from overshooting
3. **Failure: Too Small (α=0.001)** - Extremely slow convergence from tiny steps
4. **Struggle: Ill-Conditioned** - Zig-zagging on elongated landscape

### Gradient Descent (Line Search) - 5 Experiments
1. **Success: Automatic Adaptation** - Line search finds good steps automatically
2. **Compare: Fixed vs Adaptive** - Side-by-side comparison (TODO)
3. **Failure: c₁ Too Small** - Accepts poor steps, wastes iterations
4. **Failure: c₁ Too Large** - Too conservative, rejects good steps
5. **Advantage: Varying Curvature** - Handles changing landscape (Rosenbrock)

### Newton's Method - 4 Experiments
1. **Success: Quadratic Convergence** - 1-2 iterations on bowl function
2. **Failure: Saddle Point** - Negative eigenvalue, wrong direction
3. **Fixed: Line Search Rescue** - Damping prevents divergence
4. **Compare: Newton vs GD** - Ill-conditioned problem comparison

### L-BFGS - 4 Experiments
1. **Success: Without Hessian** - Newton-like speed, no matrix computation
2. **Memory: M=3 vs M=10** - Memory size affects convergence rate
3. **Challenge: Rosenbrock** - Tests quasi-Newton approximation
4. **Compare: Three Algorithms** - L-BFGS vs GD vs Newton (TODO)

## Problem Types

Experiments automatically switch between these problem types:

- **Logistic Regression** - 2D classification with crescent dataset
- **Quadratic Bowl** - Strongly convex, ideal for convergence demos
- **Ill-Conditioned Quadratic** - Elongated ellipse (κ=100)
- **Rosenbrock Function** - Non-convex banana valley
- **Saddle Point** - Hyperbolic paraboloid with negative eigenvalue

## Problem Switching

As of Task 18, the visualizer fully supports switching between 5 different optimization problems. This enables experiments to demonstrate algorithm behavior on different landscapes.

### How It Works

1. **Automatic Switching** - Click an experiment button that specifies a problem
2. **Manual Switching** - Use the problem dropdown that appears above visualizations
3. **Dynamic Updates** - Objective, gradient, Hessian, and domain bounds all update

### Backend Implementation

The system uses a unified problem interface:
- `getCurrentProblem()` resolves to logistic regression or problem registry
- All algorithms call `problem.objective()`, `problem.gradient()`, `problem.hessian()`
- Visualization bounds adapt to `problem.domain`
- Dataset visualization only shown for logistic regression

### Supported Combinations

All 5 problems work with all 4 algorithms:
- Logistic Regression (default, with dataset)
- Quadratic Bowl (ideal convergence conditions)
- Ill-Conditioned Quadratic (scaling challenge)
- Rosenbrock Function (non-convex valley)
- Saddle Point (Newton failure mode)

See the "Problems" tab for detailed explanations of each problem type.

## 3D Visualization

Each algorithm now supports 3D surface plots of the objective function. Click the "3D Surface" button above the parameter space to switch views.

**Benefits:**
- See curvature and valleys more clearly
- Understand why algorithms take certain paths
- Visualize Hessian information (how steep the surface is)

**Example experiments that benefit from 3D:**
- **Rosenbrock**: See the famous "banana valley" in 3D
- **Saddle Point**: Observe the saddle shape clearly
- **Ill-Conditioned**: Understand the elongated ellipse geometry

See [3D Visualization Guide](./3d-visualization-guide.md) for details.

## Manual Problem Switching

When an experiment loads a non-default problem, a problem switcher appears above the visualizations. You can manually select any problem type to explore its landscape.

## Resetting

Click the "Reset All" button to return all parameters to their default values and clear the active experiment.

## Technical Details

Each experiment preset defines:
- **Problem type** - Which objective function to use
- **Hyperparameters** - Algorithm-specific settings (α, c₁, M, λ)
- **Initial point** - Starting position in parameter space
- **Custom data** - Optional dataset (for logistic regression)
- **Expected observation** - What to watch for in the visualization

## Comparison Mode

The visualizer includes side-by-side comparison mode for comparing algorithms or parameter settings.

### How to Use Comparison Mode

1. **Navigate to any algorithm tab** with comparison experiments
2. **Click a comparison experiment** (marked with blue/purple color)
3. **Two visualizations appear side-by-side** showing different algorithms or settings
4. **Observe the differences** in convergence speed, trajectory, and final solution

### Available Comparisons

- **GD Fixed vs GD Line Search** - See how automatic step size helps
- **L-BFGS (M=3) vs L-BFGS (M=10)** - Memory size impact on convergence
- **Newton vs GD on Ill-Conditioned** - Second-order vs first-order methods

All comparison experiments automatically configure both sides and run simultaneously.

## All Working Combinations

All 20 problem × algorithm combinations are fully functional:

### Logistic Regression (Classification)
- ✅ Gradient Descent (Fixed Step)
- ✅ Gradient Descent (Line Search)
- ✅ Newton's Method
- ✅ L-BFGS

### Quadratic Bowl (Strongly Convex)
- ✅ Gradient Descent (Fixed Step)
- ✅ Gradient Descent (Line Search)
- ✅ Newton's Method
- ✅ L-BFGS

### Ill-Conditioned Quadratic (κ=100)
- ✅ Gradient Descent (Fixed Step)
- ✅ Gradient Descent (Line Search)
- ✅ Newton's Method
- ✅ L-BFGS

### Rosenbrock Function (Non-Convex Valley)
- ✅ Gradient Descent (Fixed Step)
- ✅ Gradient Descent (Line Search)
- ✅ Newton's Method
- ✅ L-BFGS

### Saddle Point (Hyperbolic Paraboloid)
- ✅ Gradient Descent (Fixed Step)
- ✅ Gradient Descent (Line Search)
- ✅ Newton's Method
- ✅ L-BFGS

## Troubleshooting

### Algorithm Not Converging?
- Check your step size (for fixed-step GD)
- Try a different initial point
- Switch to a different problem type
- Use line search for automatic adaptation

### Visualization Not Updating?
- Click "Run Algorithm" after changing parameters
- Check that max iterations > 0
- Ensure initial point is within bounds

### Want to Start Over?
- Click "Reset All" to restore defaults
- Clear active experiment indicator

## Future Enhancements

These features are NOT currently planned but could be added:
- Animation playback of experiment trajectory
- Experiment result recording and replay
- Custom experiment creation UI
- Experiment sharing via URL parameters
- Additional problem types (Himmelblau, Beale, etc.)
