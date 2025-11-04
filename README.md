# Optimization Algorithm Visualizer

A pedagogical React app for understanding iterative optimization algorithms through interactive visualization.

## Features

- **4 Algorithm Tabs:**
  1. **Gradient Descent (Fixed Step)** - Learn the basics of first-order optimization
  2. **Gradient Descent (Line Search)** - See adaptive step size selection in action
  3. **Newton's Method** - Understand second-order methods with Hessian visualization
  4. **L-BFGS** - Explore memory-efficient quasi-Newton approximation

- **Shared Problem Setup:**
  - Logistic regression on 2D crescent dataset
  - Interactive point adding (click canvas to add custom data)
  - Adjustable regularization parameter λ
  - Data persists across algorithm tabs for direct comparison

- **Rich Visualizations:**
  - Data space with decision boundary
  - Parameter space with loss landscape and optimization trajectory
  - Line search plots showing backtracking trials
  - Hessian matrix and eigenvalues (Newton)
  - Memory pairs and two-loop recursion (L-BFGS)

- **Pedagogical Content:**
  - Collapsible sections explaining each algorithm
  - Mathematical derivations and pseudocode
  - Guided experiments ("Try This" suggestions)
  - Progressive complexity from simple to advanced

## Architecture

- **Extensible Design:**
  - Line search algorithms are pluggable (Armijo currently implemented)
  - Problem/dataset can be swapped (logistic regression currently)
  - Easy to add new optimization algorithms

- **Tech Stack:**
  - React + TypeScript
  - HTML Canvas for visualizations
  - Tailwind CSS for styling
  - Vite for build

## Usage

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Learning Path

1. Start with **GD (Fixed Step)** to understand gradient descent fundamentals
2. Move to **GD (Line Search)** to see why adaptive step sizes matter
3. Explore **Newton's Method** to see how curvature information helps
4. Finish with **L-BFGS** to understand efficient approximation for large-scale problems

## Interactive Experiments

- Adjust hyperparameters and observe effects on convergence
- Add custom data points to change the optimization landscape
- Step through iterations to understand algorithm behavior
- Compare trajectories across different algorithms on the same problem

## Future Enhancements

- Additional line search strategies (Wolfe, Strong Wolfe)
- Additional optimization problems (Rosenbrock, quadratic, neural networks)
- CSV/JSON dataset upload
- Side-by-side algorithm comparison mode
- Animation playback mode

## License

MIT
