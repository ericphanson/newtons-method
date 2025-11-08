import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  DataPoint,
  generateCrescents,
  setupCanvas,
  fmt,
  fmtVec
} from './shared-utils';
import {
  logisticObjective,
  logisticGradient,
  logisticHessian
} from './utils/logisticRegression';
import { runNewton, NewtonIteration } from './algorithms/newton';
import { runLBFGS, LBFGSIteration } from './algorithms/lbfgs';
import { runGradientDescent, GDIteration } from './algorithms/gradient-descent';
import { runGradientDescentLineSearch, GDLineSearchIteration } from './algorithms/gradient-descent-linesearch';
import { runDiagonalPreconditioner, DiagonalPrecondIteration } from './algorithms/diagonal-preconditioner';
import { problemToProblemFunctions, logisticRegressionToProblemFunctions, separatingHyperplaneToProblemFunctions } from './utils/problemAdapter';
import type { ProblemFunctions, AlgorithmSummary } from './algorithms/types';
import { SeparatingHyperplaneVariant } from './types/experiments';
import { CollapsibleSection } from './components/CollapsibleSection';
import { InlineMath, BlockMath } from './components/Math';
import { Toast } from './components/Toast';
import { ProblemConfiguration } from './components/ProblemConfiguration';
import { AlgorithmExplainer } from './components/AlgorithmExplainer';
import { drawHeatmap, drawContours, drawOptimumMarkers, drawAxes, drawColorbar } from './utils/contourDrawing';
import { getExperimentsForAlgorithm } from './experiments';
import { newtonExperiments } from './experiments/newton-presets';
import { getProblem, createRotatedQuadratic, createIllConditionedQuadratic, createRosenbrockProblem } from './problems';
import type { ExperimentPreset } from './types/experiments';
import { AlgorithmConfiguration } from './components/AlgorithmConfiguration';
import { IterationPlayback } from './components/IterationPlayback';
import { IterationMetrics } from './components/IterationMetrics';

type Algorithm = 'algorithms' | 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const UnifiedVisualizer = () => {
  // Shared state
  const [baseData] = useState(() => generateCrescents());
  const [customPoints, setCustomPoints] = useState<DataPoint[]>([]);
  const [lambda, setLambda] = useState(0.0001);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [conditionNumber, setConditionNumber] = useState(100);
  const [rosenbrockB, setRosenbrockB] = useState(100);
  const [separatingHyperplaneVariant, setSeparatingHyperplaneVariant] =
    useState<SeparatingHyperplaneVariant>('soft-margin');
  const [addPointMode, setAddPointMode] = useState<0 | 1 | 2>(0);
  const [selectedTab, setSelectedTab] = useState<Algorithm>(() => {
    const saved = localStorage.getItem('selectedAlgorithmTab');
    if (saved && ['algorithms', 'gd-fixed', 'gd-linesearch', 'diagonal-precond', 'newton', 'lbfgs'].includes(saved)) {
      return saved as Algorithm;
    }
    return 'algorithms';
  });

  // GD Fixed step state
  const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
  const [gdFixedSummary, setGdFixedSummary] = useState<AlgorithmSummary | null>(null);
  const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
  const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);
  const [gdFixedTolerance, setGdFixedTolerance] = useState(1e-6);

  // GD Line search state
  const [gdLSIterations, setGdLSIterations] = useState<GDLineSearchIteration[]>([]);
  const [gdLSSummary, setGdLSSummary] = useState<AlgorithmSummary | null>(null);
  const [gdLSCurrentIter, setGdLSCurrentIter] = useState(0);
  const [gdLSC1, setGdLSC1] = useState(0.0001);
  const [gdLSTolerance, setGdLSTolerance] = useState(1e-6);

  // Newton state
  const [newtonIterations, setNewtonIterations] = useState<NewtonIteration[]>([]);
  const [newtonSummary, setNewtonSummary] = useState<AlgorithmSummary | null>(null);
  const [newtonCurrentIter, setNewtonCurrentIter] = useState(0);
  const [newtonC1, setNewtonC1] = useState(0.0001);
  const [newtonLineSearch, setNewtonLineSearch] = useState<'armijo' | 'none'>('none');
  const [newtonHessianDamping, setNewtonHessianDamping] = useState(0);
  const [newtonTolerance, setNewtonTolerance] = useState(1e-5);
  const [newtonFtol, setNewtonFtol] = useState(2.22e-9);
  const [newtonXtol, setNewtonXtol] = useState(1e-5);

  // L-BFGS state
  const [lbfgsIterations, setLbfgsIterations] = useState<LBFGSIteration[]>([]);
  const [lbfgsSummary, setLbfgsSummary] = useState<AlgorithmSummary | null>(null);
  const [lbfgsCurrentIter, setLbfgsCurrentIter] = useState(0);
  const [lbfgsC1, setLbfgsC1] = useState(0.0001);
  const [lbfgsM, setLbfgsM] = useState(5);
  const [lbfgsHessianDamping, setLbfgsHessianDamping] = useState(0);
  const [lbfgsTolerance, setLbfgsTolerance] = useState(1e-5);

  // Diagonal Preconditioner state
  const [diagPrecondIterations, setDiagPrecondIterations] = useState<DiagonalPrecondIteration[]>([]);
  const [diagPrecondSummary, setDiagPrecondSummary] = useState<AlgorithmSummary | null>(null);
  const [diagPrecondCurrentIter, setDiagPrecondCurrentIter] = useState(0);
  const [diagPrecondLineSearch, setDiagPrecondLineSearch] = useState<'armijo' | 'none'>('none');


  const [diagPrecondC1, setDiagPrecondC1] = useState(0.0001);
  const [diagPrecondTolerance, setDiagPrecondTolerance] = useState(1e-6);
  const [diagPrecondFtol, setDiagPrecondFtol] = useState(2.22e-9);
  const [diagPrecondXtol, setDiagPrecondXtol] = useState(1e-5);

  const [diagPrecondHessianDamping, setDiagPrecondHessianDamping] = useState(0);

  // Shared algorithm state
  const [maxIter, setMaxIter] = useState(50);
  const [initialW0, setInitialW0] = useState(-1);
  const [initialW1, setInitialW1] = useState(1);

  // Experiment state
  const [experimentLoading, setExperimentLoading] = useState(false);

  // Problem state
  const [currentProblem, setCurrentProblem] = useState<string>('logistic-regression');
  const [visualizationBounds, setVisualizationBounds] = useState({
    w0: [-3, 3] as [number, number],
    w1: [-3, 3] as [number, number],
  });

  // Logistic regression / separating hyperplane global minimum (computed, can be 2D or 3D)
  const [logisticGlobalMin, setLogisticGlobalMin] = useState<[number, number] | [number, number, number] | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const data = useMemo(() => [...baseData, ...customPoints], [baseData, customPoints]);

  // Get current problem definition (logistic regression or from registry)
  const getCurrentProblem = useCallback(() => {
    if (currentProblem === 'logistic-regression') {
      // Return logistic regression wrapped as problem interface
      // Note: Logistic regression uses 3D weights [w0, w1, w2] with bias
      return {
        name: 'Logistic Regression',
        description: 'Binary classification with L2 regularization',
        objective: (w: number[]) => logisticObjective(w, data, lambda),
        gradient: (w: number[]) => logisticGradient(w, data, lambda),
        hessian: (w: number[]) => logisticHessian(w, data, lambda),
        domain: {
          w0: [-3, 3],
          w1: [-3, 3],
        },
        requiresDataset: true,
        dimensionality: 3, // 3D weights [w0, w1, w2]
      };
    } else if (currentProblem === 'quadratic') {
      // Return parametrized rotated quadratic
      const problem = createRotatedQuadratic(rotationAngle);
      return {
        ...problem,
        requiresDataset: false,
        dimensionality: 2, // 2D weights [w0, w1]
      };
    } else if (currentProblem === 'ill-conditioned-quadratic') {
      // Return parametrized ill-conditioned quadratic
      const problem = createIllConditionedQuadratic(conditionNumber);
      return {
        ...problem,
        requiresDataset: false,
        dimensionality: 2, // 2D weights [w0, w1]
      };
    } else if (currentProblem === 'rosenbrock') {
      // Return parametrized Rosenbrock
      const problem = createRosenbrockProblem(rosenbrockB);
      return {
        ...problem,
        requiresDataset: false,
        dimensionality: 2, // 2D weights [w0, w1]
      };
    } else if (currentProblem === 'separating-hyperplane') {
      // Return separating hyperplane wrapped as problem interface
      const { objective, gradient, hessian } = separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda);
      return {
        name: 'Separating Hyperplane',
        description: `Separating hyperplane (${separatingHyperplaneVariant})`,
        objective,
        gradient,
        hessian,
        domain: {
          w0: [-3, 3],
          w1: [-3, 3],
        },
        requiresDataset: true,
        dimensionality: 3, // 3D weights [w0, w1, w2]
      };
    } else {
      // Get problem from registry
      const problem = getProblem(currentProblem);
      if (!problem) {
        throw new Error(`Problem not found: ${currentProblem}`);
      }
      return {
        ...problem,
        requiresDataset: false,
        dimensionality: 2, // 2D weights [w0, w1]
      };
    }
  }, [currentProblem, data, lambda, rotationAngle, conditionNumber, rosenbrockB, separatingHyperplaneVariant]);

  // Get current problem functions for algorithm execution
  // For parametrized problems (rotated quadratic, ill-conditioned quadratic, Rosenbrock),
  // we create instances with current parameter values
  const getCurrentProblemFunctions = useCallback((): ProblemFunctions => {
    if (currentProblem === 'logistic-regression') {
      return logisticRegressionToProblemFunctions(data, lambda);
    } else if (currentProblem === 'quadratic') {
      // Create parametrized version with current rotation angle
      const problem = createRotatedQuadratic(rotationAngle);
      return problemToProblemFunctions(problem);
    } else if (currentProblem === 'ill-conditioned-quadratic') {
      // Create parametrized version with current condition number
      const problem = createIllConditionedQuadratic(conditionNumber);
      return problemToProblemFunctions(problem);
    } else if (currentProblem === 'rosenbrock') {
      // Create parametrized version with current b parameter
      const problem = createRosenbrockProblem(rosenbrockB);
      return problemToProblemFunctions(problem);
    } else if (currentProblem === 'separating-hyperplane') {
      if (!data || data.length === 0) {
        throw new Error('Separating hyperplane requires dataset');
      }
      return separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda);
    } else {
      const problem = getProblem(currentProblem);
      if (!problem) {
        throw new Error(`Problem not found: ${currentProblem}`);
      }
      return problemToProblemFunctions(problem);
    }
  }, [currentProblem, data, lambda, rotationAngle, conditionNumber, rosenbrockB, separatingHyperplaneVariant]);

  // Track visualization bounds updates
  useEffect(() => {
    // Problem and bounds are now synced via getCurrentProblem
  }, [getCurrentProblem, visualizationBounds]);

  // Save selected tab to localStorage
  useEffect(() => {
    localStorage.setItem('selectedAlgorithmTab', selectedTab);
  }, [selectedTab]);

  // Calculate global minimum for dataset-based problems (logistic regression, separating hyperplane) when data changes
  useEffect(() => {
    if (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') {
      try {
        const problemFuncs = currentProblem === 'logistic-regression'
          ? logisticRegressionToProblemFunctions(data, lambda)
          : separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda);
        // Run L-BFGS with tight convergence to find global minimum
        const result = runLBFGS(problemFuncs, {
          maxIter: 1000,
          m: 10,
          c1: 0.0001,
          lambda,
          hessianDamping: 0.01, // Use default damping for stability
          initialPoint: [0, 0, 0],
          tolerance: 1e-10, // Very tight tolerance for accurate minimum
        });
        const iterations = result.iterations;
        if (iterations.length > 0) {
          const lastIter = iterations[iterations.length - 1];
          // Store all 3 coordinates for 3D problems (separating hyperplane)
          if (lastIter.wNew.length >= 3) {
            setLogisticGlobalMin([lastIter.wNew[0], lastIter.wNew[1], lastIter.wNew[2]]);
          } else {
            setLogisticGlobalMin([lastIter.wNew[0], lastIter.wNew[1]]);
          }
        }
      } catch (error) {
        console.warn('Failed to compute dataset problem global minimum:', error);
        setLogisticGlobalMin(null);
      }
    } else {
      setLogisticGlobalMin(null);
    }
  }, [currentProblem, data, lambda, separatingHyperplaneVariant]);

  // Note: When rotationAngle, conditionNumber, or rosenbrockB changes, algorithms automatically rerun
  // because getCurrentProblemFunctions includes them in its dependencies, which triggers
  // the algorithm useEffects below to recompute with the new parameter values.

  // Default configuration for reset functionality
  const defaultConfig = useRef({
    gdFixedAlpha: 0.1,
    gdLSC1: 0.0001,
    newtonC1: 0.0001,
    lbfgsC1: 0.0001,
    lambda: 0.0001,
    lbfgsM: 5,
    maxIter: 100,
    initialW0: -1,
    initialW1: 1,
  });

  // Helper function to calculate parameter bounds from iterations
  const calculateParamBounds = useCallback((
    iterations: Array<{ w: number[]; wNew: number[] }>,
    algorithmName: string
  ) => {
    if (!iterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    // Include initial point (starting position)
    if (iterations.length > 0) {
      const [w0_init, w1_init] = iterations[0].w;
      minW0 = Math.min(minW0, w0_init);
      maxW0 = Math.max(maxW0, w0_init);
      minW1 = Math.min(minW1, w1_init);
      maxW1 = Math.max(maxW1, w1_init);
    }

    for (const it of iterations) {
      minW0 = Math.min(minW0, it.wNew[0]);
      maxW0 = Math.max(maxW0, it.wNew[0]);
      minW1 = Math.min(minW1, it.wNew[1]);
      maxW1 = Math.max(maxW1, it.wNew[1]);
    }

    // Include global minimum in bounds if it exists
    const problemDef = currentProblem !== 'logistic-regression' ? getProblem(currentProblem) : null;
    const globalMin = problemDef?.globalMinimum || ((currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') ? logisticGlobalMin : null);
    if (globalMin) {
      const [gm0, gm1] = globalMin;
      minW0 = Math.min(minW0, gm0);
      maxW0 = Math.max(maxW0, gm0);
      minW1 = Math.min(minW1, gm1);
      maxW1 = Math.max(maxW1, gm1);
    }

    // If algorithm diverged (NaN/Infinity values), return default bounds
    if (!isFinite(minW0) || !isFinite(maxW0) || !isFinite(minW1) || !isFinite(maxW1)) {
      console.warn(`${algorithmName}: Algorithm diverged (NaN/Infinity detected), using default bounds`);
      return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };
    }

    let w0Range = maxW0 - minW0;
    let w1Range = maxW1 - minW1;

    // Handle single-point case (e.g., only 1 iteration): create reasonable window around point
    if (w0Range === 0) w0Range = Math.max(2, Math.abs(minW0) * 0.5);
    if (w1Range === 0) w1Range = Math.max(2, Math.abs(minW1) * 0.5);

    const pad0 = w0Range * 0.2;
    const pad1 = w1Range * 0.2;

    // Make bounds symmetric around global minimum if one exists (for better contour visualization)
    // Skip for separating-hyperplane - just include the minimum in bounds without centering
    const shouldCenterOnGlobalMin = globalMin && currentProblem !== 'separating-hyperplane';
    if (shouldCenterOnGlobalMin) {
      const [gm0, gm1] = globalMin;
      const maxDist0 = Math.max(Math.abs(minW0 - gm0), Math.abs(maxW0 - gm0)) + pad0;
      const maxDist1 = Math.max(Math.abs(minW1 - gm1), Math.abs(maxW1 - gm1)) + pad1;

      // Ensure bounds include at least -3 to 3 (basin plot range)
      const finalMinW0 = Math.min(gm0 - maxDist0, -3);
      const finalMaxW0 = Math.max(gm0 + maxDist0, 3);
      const finalMinW1 = Math.min(gm1 - maxDist1, -3);
      const finalMaxW1 = Math.max(gm1 + maxDist1, 3);

      return {
        minW0: finalMinW0,
        maxW0: finalMaxW0,
        minW1: finalMinW1,
        maxW1: finalMaxW1,
        w0Range: finalMaxW0 - finalMinW0,
        w1Range: finalMaxW1 - finalMinW1
      };
    }

    // Ensure bounds include at least -3 to 3 (basin plot range)
    const finalMinW0 = Math.min(minW0 - pad0, -3);
    const finalMaxW0 = Math.max(maxW0 + pad0, 3);
    const finalMinW1 = Math.min(minW1 - pad1, -3);
    const finalMaxW1 = Math.max(maxW1 + pad1, 3);

    return {
      minW0: finalMinW0,
      maxW0: finalMaxW0,
      minW1: finalMinW1,
      maxW1: finalMaxW1,
      w0Range: finalMaxW0 - finalMinW0,
      w1Range: finalMaxW1 - finalMinW1
    };
  }, [currentProblem, logisticGlobalMin]);

  // Calculate parameter bounds for both algorithms
  const newtonParamBounds = React.useMemo(
    () => calculateParamBounds(newtonIterations, 'Newton'),
    [newtonIterations, calculateParamBounds]
  );

  const lbfgsParamBounds = React.useMemo(
    () => calculateParamBounds(lbfgsIterations, 'L-BFGS'),
    [lbfgsIterations, calculateParamBounds]
  );

  const gdFixedParamBounds = React.useMemo(
    () => calculateParamBounds(gdFixedIterations, 'GD Fixed'),
    [gdFixedIterations, calculateParamBounds]
  );

  const gdLSParamBounds = React.useMemo(
    () => calculateParamBounds(gdLSIterations, 'GD Line Search'),
    [gdLSIterations, calculateParamBounds]
  );

  const diagPrecondParamBounds = React.useMemo(
    () => calculateParamBounds(diagPrecondIterations, 'Diagonal Precond'),
    [diagPrecondIterations, calculateParamBounds]
  );

  // Unified bounds for AlgorithmConfiguration (basin picker)
  // Fixed to -3 to 3 (not based on trajectory)
  const bounds = React.useMemo(() => {
    return {
      minW0: -3,
      maxW0: 3,
      minW1: -3,
      maxW1: 3
    };
  }, []);

  // Bias slice for 3D problems (logistic regression, separating hyperplane)
  const biasSlice = React.useMemo(() => {
    return ((currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && logisticGlobalMin && logisticGlobalMin.length >= 3)
      ? (logisticGlobalMin as [number, number, number])[2]
      : 0;
  }, [currentProblem, logisticGlobalMin]);

  // Get problem functions and problem for AlgorithmConfiguration
  const problemFuncs = getCurrentProblemFunctions();
  const problem = getCurrentProblem();

  // Canvas refs
  const dataCanvasRef = useRef<HTMLCanvasElement>(null);

  // GD Fixed canvas refs
  const gdFixedParamCanvasRef = useRef<HTMLCanvasElement>(null);

  // GD Line Search canvas refs
  const gdLSParamCanvasRef = useRef<HTMLCanvasElement>(null);
  const gdLSLineSearchCanvasRef = useRef<HTMLCanvasElement>(null);

  // Newton canvas refs
  const newtonHessianCanvasRef = useRef<HTMLCanvasElement>(null);
  const newtonParamCanvasRef = useRef<HTMLCanvasElement>(null);
  const newtonLineSearchCanvasRef = useRef<HTMLCanvasElement>(null);

  // L-BFGS canvas refs
  const lbfgsParamCanvasRef = useRef<HTMLCanvasElement>(null);
  const lbfgsLineSearchCanvasRef = useRef<HTMLCanvasElement>(null);

  // Diagonal Preconditioner refs
  const diagPrecondParamCanvasRef = useRef<HTMLCanvasElement>(null);
  const diagPrecondLineSearchCanvasRef = useRef<HTMLCanvasElement>(null);


  // Load experiment preset
  const loadExperiment = useCallback((experiment: ExperimentPreset) => {
    setExperimentLoading(true);

    try {
      // 1. Update hyperparameters
      if (experiment.hyperparameters.alpha !== undefined) {
        setGdFixedAlpha(experiment.hyperparameters.alpha);
      }
      if (experiment.hyperparameters.c1 !== undefined) {
        setGdLSC1(experiment.hyperparameters.c1);
        setNewtonC1(experiment.hyperparameters.c1);
        setLbfgsC1(experiment.hyperparameters.c1);
        setDiagPrecondC1(experiment.hyperparameters.c1);
      }
      if (experiment.hyperparameters.lambda !== undefined) {
        setLambda(experiment.hyperparameters.lambda);
      }
      if (experiment.hyperparameters.m !== undefined) {
        setLbfgsM(experiment.hyperparameters.m);
      }
      if (experiment.hyperparameters.maxIter !== undefined) {
        setMaxIter(experiment.hyperparameters.maxIter);
      }
      if (experiment.hyperparameters.hessianDamping !== undefined) {
        setNewtonHessianDamping(experiment.hyperparameters.hessianDamping);
        setLbfgsHessianDamping(experiment.hyperparameters.hessianDamping);
      }
      if (experiment.hyperparameters.lineSearch !== undefined) {
        setNewtonLineSearch(experiment.hyperparameters.lineSearch);
      }

      // 2. Set initial point if specified
      if (experiment.initialPoint) {
        setInitialW0(experiment.initialPoint[0]);
        setInitialW1(experiment.initialPoint[1]);
      }

      // 3. Switch problem if needed
      if (experiment.problem !== 'logistic-regression') {
        setCurrentProblem(experiment.problem);

        // Set separating hyperplane variant if specified
        if (experiment.problem === 'separating-hyperplane' && experiment.separatingHyperplaneVariant) {
          setSeparatingHyperplaneVariant(experiment.separatingHyperplaneVariant);
        }

        // Set rotation angle for rotated quadratic if specified
        if (experiment.problem === 'quadratic' && experiment.rotationAngle !== undefined) {
          setRotationAngle(experiment.rotationAngle);
        }

        const problem = getProblem(experiment.problem);
        if (problem) {
          // Problem is now active via getCurrentProblem()
        }
      } else {
        setCurrentProblem('logistic-regression');
      }

      // 4. Load custom dataset if provided
      if (experiment.dataset) {
        // Convert from experiment DataPoint format {x, y, label} to visualizer format {x1, x2, y}
        const convertedDataset = experiment.dataset.map(point => ({
          x1: point.x,
          x2: point.y,
          y: point.label,
        }));
        setCustomPoints(convertedDataset);
      }

      // 6. Iterations reset automatically via useEffect when state changes

      // Clear loading state immediately (no artificial delay to avoid race conditions)
      setExperimentLoading(false);

      // Show success toast
      setToast({
        message: `Loaded: ${experiment.name}`,
        type: 'success'
      });

    } catch (error) {
      console.error('Error loading experiment:', error);
      setExperimentLoading(false);
    }
  }, []);

  // Reset all parameters to defaults
  const resetToDefaults = useCallback(() => {
    const cfg = defaultConfig.current;
    setGdFixedAlpha(cfg.gdFixedAlpha);
    setGdLSC1(cfg.gdLSC1);
    setNewtonC1(cfg.newtonC1);
    setLbfgsC1(cfg.lbfgsC1);
    setLambda(cfg.lambda);
    setLbfgsM(cfg.lbfgsM);
    setMaxIter(cfg.maxIter);
    setInitialW0(cfg.initialW0);
    setInitialW1(cfg.initialW1);
    setGdFixedCurrentIter(0);
    setGdLSCurrentIter(0);
    setDiagPrecondCurrentIter(0);
    setNewtonCurrentIter(0);
    setLbfgsCurrentIter(0);
    setCustomPoints([]);
  }, []);

  // Recompute algorithms when shared state changes
  useEffect(() => {
    try {
      // Preserve current position as percentage
      const oldPercentage = gdFixedIterations.length > 0
        ? gdFixedCurrentIter / Math.max(1, gdFixedIterations.length - 1)
        : 0;

      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
        ? [initialW0, initialW1, 0]
        : [initialW0, initialW1];
      const result = runGradientDescent(problemFuncs, {
        maxIter,
        alpha: gdFixedAlpha,
        lambda,
        initialPoint,
        tolerance: gdFixedTolerance,
      });
      const iterations = result.iterations;
      setGdFixedIterations(iterations);
      setGdFixedSummary(result.summary);

      // Restore position at same percentage
      const newIter = iterations.length > 0
        ? Math.min(iterations.length - 1, Math.round(oldPercentage * Math.max(0, iterations.length - 1)))
        : 0;
      setGdFixedCurrentIter(newIter);
    } catch (error) {
      console.error('GD Fixed error:', error);
      setGdFixedIterations([]);
    }
    // IMPORTANT: Keep dependency array in sync with ALL parameters passed to runGradientDescentFixedStep above
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gdFixedCurrentIter and gdFixedIterations.length are intentionally excluded to prevent infinite loop (they are set by this effect)
  }, [currentProblem, lambda, gdFixedAlpha, gdFixedTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions]);

  useEffect(() => {
    try {
      // Preserve current position as percentage
      const oldPercentage = gdLSIterations.length > 0
        ? gdLSCurrentIter / Math.max(1, gdLSIterations.length - 1)
        : 0;

      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
        ? [initialW0, initialW1, 0]
        : [initialW0, initialW1];
      const result = runGradientDescentLineSearch(problemFuncs, {
        maxIter,
        c1: gdLSC1,
        lambda,
        initialPoint,
        tolerance: gdLSTolerance,
      });
      const iterations = result.iterations;
      setGdLSIterations(iterations);
      setGdLSSummary(result.summary);

      // Restore position at same percentage
      const newIter = iterations.length > 0
        ? Math.min(iterations.length - 1, Math.round(oldPercentage * Math.max(0, iterations.length - 1)))
        : 0;
      setGdLSCurrentIter(newIter);
    } catch (error) {
      console.error('GD Line Search error:', error);
      setGdLSIterations([]);
    }
    // IMPORTANT: Keep dependency array in sync with ALL parameters passed to runGradientDescentLineSearch above
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gdLSCurrentIter and gdLSIterations.length are intentionally excluded to prevent infinite loop (they are set by this effect)
  }, [currentProblem, lambda, gdLSC1, gdLSTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions]);

  useEffect(() => {
    try {
      // Preserve current position as percentage
      const oldPercentage = newtonIterations.length > 0
        ? newtonCurrentIter / Math.max(1, newtonIterations.length - 1)
        : 0;

      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
        ? [initialW0, initialW1, 0]
        : [initialW0, initialW1];
      const result = runNewton(problemFuncs, {
        maxIter,
        c1: newtonC1,
        lambda,
        hessianDamping: newtonHessianDamping,
        lineSearch: newtonLineSearch,
        initialPoint,
        termination: {
          gtol: newtonTolerance,
          ftol: newtonFtol,
          xtol: newtonXtol,
        },
      });
      const iterations = result.iterations;
      setNewtonIterations(iterations);
      setNewtonSummary(result.summary);

      // Restore position at same percentage
      const newIter = iterations.length > 0
        ? Math.min(iterations.length - 1, Math.round(oldPercentage * Math.max(0, iterations.length - 1)))
        : 0;
      setNewtonCurrentIter(newIter);
    } catch (error) {
      console.error('Newton error:', error);
      setNewtonIterations([]);
    }
    // IMPORTANT: Keep dependency array in sync with ALL parameters passed to runNewton above
    // Missing a parameter here means changes won't trigger re-resolution (bug: newtonHessianDamping was missing)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- newtonCurrentIter and newtonIterations.length are intentionally excluded to prevent infinite loop (they are set by this effect)
  }, [currentProblem, lambda, newtonC1, newtonLineSearch, newtonHessianDamping, newtonTolerance, newtonFtol, newtonXtol, maxIter, initialW0, initialW1, getCurrentProblemFunctions]);

  useEffect(() => {
    try {
      // Preserve current position as percentage
      const oldPercentage = lbfgsIterations.length > 0
        ? lbfgsCurrentIter / Math.max(1, lbfgsIterations.length - 1)
        : 0;

      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
        ? [initialW0, initialW1, 0]
        : [initialW0, initialW1];
      console.log('Running L-BFGS with:', { problem: currentProblem, initialPoint, maxIter, m: lbfgsM, c1: lbfgsC1, hessianDamping: lbfgsHessianDamping });
      const result = runLBFGS(problemFuncs, {
        maxIter,
        m: lbfgsM,
        c1: lbfgsC1,
        lambda,
        hessianDamping: lbfgsHessianDamping,
        initialPoint,
        tolerance: lbfgsTolerance,
      });
      const iterations = result.iterations;
      console.log('L-BFGS completed:', iterations.length, 'iterations');
      if (iterations.length > 0) {
        console.log('First iteration:', iterations[0]);
        console.log('Last iteration:', iterations[iterations.length - 1]);
      }
      setLbfgsIterations(iterations);
      setLbfgsSummary(result.summary);

      // Restore position at same percentage
      const newIter = iterations.length > 0
        ? Math.min(iterations.length - 1, Math.round(oldPercentage * Math.max(0, iterations.length - 1)))
        : 0;
      setLbfgsCurrentIter(newIter);
    } catch (error) {
      console.error('L-BFGS error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setLbfgsIterations([]);
    }
    // IMPORTANT: Keep dependency array in sync with ALL parameters passed to runLBFGS above
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lbfgsCurrentIter and lbfgsIterations.length are intentionally excluded to prevent infinite loop (they are set by this effect)
  }, [currentProblem, lambda, lbfgsC1, lbfgsM, lbfgsHessianDamping, lbfgsTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions]);


  useEffect(() => {
    try {
      // Preserve current position as percentage
      const oldPercentage = diagPrecondIterations.length > 0
        ? diagPrecondCurrentIter / Math.max(1, diagPrecondIterations.length - 1)
        : 0;

      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
        ? [initialW0, initialW1, 0]
        : [initialW0, initialW1];
      console.log('Running Diagonal Preconditioner with:', { problem: currentProblem, initialPoint, maxIter, c1: diagPrecondC1 });
      const result = runDiagonalPreconditioner(problemFuncs, {
        lineSearch: diagPrecondLineSearch,
        lambda: lambda,
        hessianDamping: diagPrecondHessianDamping,
        maxIter,
        c1: diagPrecondC1,
        initialPoint,
        termination: {
          gtol: diagPrecondTolerance,
          ftol: diagPrecondFtol,
          xtol: diagPrecondXtol
        },
      });
      const iterations = result.iterations;
      console.log('Diagonal Preconditioner completed:', iterations.length, 'iterations');
      if (iterations.length > 0) {
        console.log('First iteration:', iterations[0]);
        console.log('Last iteration:', iterations[iterations.length - 1]);
      }
      setDiagPrecondIterations(iterations);
      setDiagPrecondSummary(result.summary);

      // Restore position at same percentage
      const newIter = iterations.length > 0
        ? Math.min(iterations.length - 1, Math.round(oldPercentage * Math.max(0, iterations.length - 1)))
        : 0;
      setDiagPrecondCurrentIter(newIter);
    } catch (error) {
      console.error('Diagonal Preconditioner error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setDiagPrecondIterations([]);
    }
    // IMPORTANT: Keep dependency array in sync with ALL parameters passed to runPre above
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lbfgsCurrentIter and lbfgsIterations.length are intentionally excluded to prevent infinite loop (they are set by this effect)
  }, [currentProblem, diagPrecondLineSearch,
        lambda,
        diagPrecondHessianDamping,
        maxIter, diagPrecondC1, diagPrecondTolerance, initialW0, initialW1, getCurrentProblemFunctions]);


  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedTab === 'gd-fixed') {
        if (e.key === 'ArrowLeft' && gdFixedCurrentIter > 0) {
          setGdFixedCurrentIter(gdFixedCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && gdFixedCurrentIter < gdFixedIterations.length - 1) {
          setGdFixedCurrentIter(gdFixedCurrentIter + 1);
        }
      } else if (selectedTab === 'gd-linesearch') {
        if (e.key === 'ArrowLeft' && gdLSCurrentIter > 0) {
          setGdLSCurrentIter(gdLSCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && gdLSCurrentIter < gdLSIterations.length - 1) {
          setGdLSCurrentIter(gdLSCurrentIter + 1);
        }
       } else if (selectedTab === 'diagonal-precond') {
          if (e.key === 'ArrowLeft' && diagPrecondCurrentIter > 0) {
            setDiagPrecondCurrentIter(diagPrecondCurrentIter - 1);
          } else if (e.key === 'ArrowRight' && diagPrecondCurrentIter < diagPrecondIterations.length - 1) {
            setDiagPrecondCurrentIter(diagPrecondCurrentIter + 1);
          }
      } else if (selectedTab === 'newton') {
        if (e.key === 'ArrowLeft' && newtonCurrentIter > 0) {
          setNewtonCurrentIter(newtonCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && newtonCurrentIter < newtonIterations.length - 1) {
          setNewtonCurrentIter(newtonCurrentIter + 1);
        }
      } else {
        if (e.key === 'ArrowLeft' && lbfgsCurrentIter > 0) {
          setLbfgsCurrentIter(lbfgsCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && lbfgsCurrentIter < lbfgsIterations.length - 1) {
          setLbfgsCurrentIter(lbfgsCurrentIter + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTab, gdFixedCurrentIter, gdFixedIterations.length, gdLSCurrentIter, gdLSIterations.length, newtonCurrentIter, newtonIterations.length, lbfgsCurrentIter, lbfgsIterations.length, diagPrecondCurrentIter, diagPrecondIterations.length]);

  // Keyboard shortcuts for experiments
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + E: Reset to defaults
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        resetToDefaults();
      }

      // Ctrl/Cmd + R: Reset to defaults
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetToDefaults();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetToDefaults]);

  // Handle canvas click to add points
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (addPointMode === 0) return;
    const canvas = dataCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Compute data bounds (same as in drawing code)
    const padding = 0.3;
    let minX1 = Infinity, maxX1 = -Infinity, minX2 = Infinity, maxX2 = -Infinity;
    for (const point of data) {
      minX1 = Math.min(minX1, point.x1);
      maxX1 = Math.max(maxX1, point.x1);
      minX2 = Math.min(minX2, point.x2);
      maxX2 = Math.max(maxX2, point.x2);
    }
    minX1 -= padding;
    maxX1 += padding;
    minX2 -= padding;
    maxX2 += padding;

    const rangeX1 = maxX1 - minX1;
    const rangeX2 = maxX2 - minX2;

    // Transform canvas coordinates to data space
    const x1 = (x / rect.width) * rangeX1 + minX1;
    const x2 = maxX2 - (y / rect.height) * rangeX2;
    setCustomPoints([...customPoints, { x1, x2, y: addPointMode - 1 }]);
  };

  // Draw shared data space
  useEffect(() => {
    const canvas = dataCanvasRef.current;
    if (!canvas) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Compute data bounds dynamically with padding
    const padding = 0.3;
    let minX1 = Infinity, maxX1 = -Infinity, minX2 = Infinity, maxX2 = -Infinity;
    for (const point of data) {
      minX1 = Math.min(minX1, point.x1);
      maxX1 = Math.max(maxX1, point.x1);
      minX2 = Math.min(minX2, point.x2);
      maxX2 = Math.max(maxX2, point.x2);
    }
    minX1 -= padding;
    maxX1 += padding;
    minX2 -= padding;
    maxX2 += padding;

    const rangeX1 = maxX1 - minX1;
    const rangeX2 = maxX2 - minX2;

    const toCanvasX = (x1: number) => ((x1 - minX1) / rangeX1) * w;
    const toCanvasY = (x2: number) => ((maxX2 - x2) / rangeX2) * h;

    // Draw decision boundary for logistic regression and separating hyperplane
    const currentIter = selectedTab === 'gd-fixed' ? gdFixedIterations[gdFixedCurrentIter] :
                       selectedTab === 'gd-linesearch' ? gdLSIterations[gdLSCurrentIter] :
                       selectedTab === 'newton' ? newtonIterations[newtonCurrentIter] :
                       lbfgsIterations[lbfgsCurrentIter];
    if ((currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && currentIter) {
      const [w0, w1, w2] = currentIter.wNew;
      if (Math.abs(w1) > 1e-6) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const step = rangeX1 / 50; // Use 50 points across the range
        for (let x1 = minX1; x1 <= maxX1; x1 += step) {
          const x2 = -(w0 * x1 + w2) / w1;
          const cx = toCanvasX(x1);
          const cy = toCanvasY(x2);
          if (x1 === minX1) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
    }

    // Always draw data points for visual reference
    for (const point of data) {
      const cx = toCanvasX(point.x1);
      const cy = toCanvasY(point.x2);
      const isCustom = customPoints.includes(point);
      ctx.fillStyle = point.y === 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx, cy, isCustom ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
      if (isCustom) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), h);
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(w, toCanvasY(0));
    ctx.stroke();

    // Add mode indicator
    if (addPointMode > 0) {
      ctx.fillStyle = addPointMode === 1 ? '#ef4444' : '#3b82f6';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Click to add ${addPointMode === 1 ? 'Class 0 (red)' : 'Class 1 (blue)'} points`, w / 2, h / 2);
    }
  }, [data, gdFixedIterations, gdFixedCurrentIter, gdLSIterations, gdLSCurrentIter, newtonIterations, newtonCurrentIter, lbfgsIterations, lbfgsCurrentIter, addPointMode, customPoints, selectedTab, currentProblem]);

  // Draw Newton's Hessian matrix
  useEffect(() => {
    const canvas = newtonHessianCanvasRef.current;
    if (!canvas || selectedTab !== 'newton') return;
    const iter = newtonIterations[newtonCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const H = iter.hessian;
    const dim = H.length; // Support both 2D and 3D problems
    const cellSize = 80;
    const startX = 20;
    const startY = 40;

    // Draw matrix
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const x = startX + j * cellSize;
        const y = startY + i * cellSize;
        const val = H[i]?.[j];

        // Skip if value is undefined (shouldn't happen with correct dimensions)
        if (val === undefined) continue;

        // Color based on magnitude
        const maxVal = Math.max(...H.flat().map(Math.abs));
        const intensity = Math.min(1, Math.abs(val) / maxVal);
        const color = val >= 0
          ? `rgba(59, 130, 246, ${intensity * 0.3})`
          : `rgba(239, 68, 68, ${intensity * 0.3})`;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);

        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        ctx.fillStyle = '#1f2937';
        ctx.fillText(val.toExponential(2), x + cellSize / 2, y + cellSize / 2);
      }
    }

    // Labels (dynamic based on dimension)
    const labels = ['w₀', 'w₁', 'w₂'];
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7280';
    for (let i = 0; i < dim; i++) {
      ctx.textAlign = 'right';
      ctx.fillText(labels[i], startX - 5, startY + i * cellSize + cellSize / 2);
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], startX + i * cellSize + cellSize / 2, startY - 10);
    }

    // Title
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'left';
    ctx.fillText('Hessian Matrix H', startX, 20);
  }, [newtonIterations, newtonCurrentIter, selectedTab]);

  // Helper function to draw parameter space plot
  const drawParameterSpacePlot = (
    canvas: HTMLCanvasElement,
    bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number; w0Range: number; w1Range: number },
    iterations: Array<{ w: number[]; wNew: number[] }>,
    currentIter: number,
    problem: ProblemFunctions
  ) => {
    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = bounds;

    const resolution = 60;
    const lossGrid: number[][] = [];

    // For 3D problems, use the bias from the global minimum to slice the visualization
    const biasSlice: number = ((currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && logisticGlobalMin && logisticGlobalMin.length >= 3)
      ? (logisticGlobalMin as [number, number, number])[2]
      : 0;

    // Compute loss landscape as 2D grid
    for (let i = 0; i < resolution; i++) {
      const row: number[] = [];
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        // Use problem interface for loss computation
        const loss = problem.dimensionality === 3
          ? problem.objective([w0, w1, biasSlice])
          : problem.objective([w0, w1]);
        row.push(loss);
      }
      lossGrid.push(row);
    }

    // Define margins for axes (extra space on right for colorbar)
    const margins = { left: 60, right: 70, top: 20, bottom: 60 };
    const plotWidth = w - margins.left - margins.right;
    const plotHeight = h - margins.top - margins.bottom;

    // Calculate min/max for colorbar
    const flatLossGrid = lossGrid.flat();
    const minLoss = Math.min(...flatLossGrid);
    const maxLoss = Math.max(...flatLossGrid);

    // Draw light background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, w, h);

    // Draw filled contour bands (heatmap)
    drawHeatmap({
      ctx,
      values: lossGrid,
      bounds: { minW0, maxW0, minW1, maxW1 },
      canvasWidth: w,
      canvasHeight: h,
      numLevels: 12,
      minValue: minLoss,
      maxValue: maxLoss,
      margins
    });

    // Draw contour lines
    drawContours({
      ctx,
      values: lossGrid,
      bounds: { minW0, maxW0, minW1, maxW1 },
      canvasWidth: w,
      canvasHeight: h,
      numLevels: 12,
      minValue: minLoss,
      maxValue: maxLoss,
      margins
    });

    // Draw colorbar
    drawColorbar({
      ctx,
      canvasWidth: w,
      canvasHeight: h,
      minValue: minLoss,
      maxValue: maxLoss,
      numLevels: 12,
      margins
    });

    // Draw optimum markers (global minimum or critical points)
    const problemDef = currentProblem !== 'logistic-regression' ? getProblem(currentProblem) : null;
    const globalMinimum3D = problemDef?.globalMinimum || ((currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') ? logisticGlobalMin || undefined : undefined);
    // For drawing markers, only use the first 2 coordinates (projection onto 2D slice)
    const globalMinimum = globalMinimum3D ? [globalMinimum3D[0], globalMinimum3D[1]] as [number, number] : undefined;
    if (globalMinimum || problemDef?.criticalPoint) {
      drawOptimumMarkers({
        ctx,
        globalMinimum,
        criticalPoint: problemDef?.criticalPoint,
        bounds: { minW0, maxW0, minW1, maxW1 },
        canvasWidth: w,
        canvasHeight: h,
        margins
      });
    }

    const toCanvasX = (w0: number) => margins.left + ((w0 - minW0) / w0Range) * plotWidth;
    const toCanvasY = (w1: number) => margins.top + ((maxW1 - w1) / w1Range) * plotHeight;

    // Draw trajectory path (colorblind-safe magenta contrasts well with blue contours)
    ctx.strokeStyle = '#C71585'; // Dark magenta (colorblind-safe)
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Start from initial point (w of first iteration)
    if (iterations.length > 0) {
      const [w0_init, w1_init] = iterations[0].w;
      ctx.moveTo(toCanvasX(w0_init), toCanvasY(w1_init));
      // Draw to each wNew
      for (let i = 0; i <= currentIter; i++) {
        const [w0, w1] = iterations[i].wNew;
        ctx.lineTo(toCanvasX(w0), toCanvasY(w1));
      }
    }
    ctx.stroke();

    // Draw small dots at each iteration point (colorblind-safe purple)
    ctx.fillStyle = '#8B1FA3'; // Dark purple (colorblind-safe)
    for (let i = 0; i <= currentIter; i++) {
      const [w0_pt, w1_pt] = iterations[i].wNew;
      ctx.beginPath();
      ctx.arc(toCanvasX(w0_pt), toCanvasY(w1_pt), 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw current position (larger dot)
    const [w0, w1] = iterations[currentIter].wNew;
    ctx.fillStyle = '#8B1FA3'; // Dark purple (colorblind-safe)
    ctx.beginPath();
    ctx.arc(toCanvasX(w0), toCanvasY(w1), 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw axes with ticks and labels
    drawAxes({
      ctx,
      bounds: { minW0, maxW0, minW1, maxW1 },
      canvasWidth: w,
      canvasHeight: h,
      margins
    });
  };

  // Draw Newton's parameter space
  useEffect(() => {
    const canvas = newtonParamCanvasRef.current;
    if (!canvas || selectedTab !== 'newton') return;
    const iter = newtonIterations[newtonCurrentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, newtonParamBounds, newtonIterations, newtonCurrentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [newtonCurrentIter, data, newtonIterations, newtonParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Helper function to draw line search plot
  const drawLineSearchPlot = (
    canvas: HTMLCanvasElement,
    iter: { loss: number; lineSearchCurve?: { alphaRange: number[]; lossValues: number[]; armijoValues: number[] }; lineSearchTrials?: Array<{ alpha: number; loss: number; satisfied: boolean }> }
  ) => {
    // Early return if line search data is missing
    if (!iter.lineSearchCurve || !iter.lineSearchTrials) return;
    const { ctx, width: w, height: h } = setupCanvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const { alphaRange, lossValues, armijoValues } = iter.lineSearchCurve;
    const trials = iter.lineSearchTrials;

    const maxAlpha = Math.max(...alphaRange);
    const allValues = [...lossValues, ...armijoValues];
    let minLoss = Math.min(...allValues);
    let maxLoss = Math.max(...allValues);
    let lossRange = maxLoss - minLoss;

    // Ensure minimum y-axis span of 0.001 for better visualization when loss is nearly constant
    const MIN_Y_SPAN = 0.001;
    if (lossRange < MIN_Y_SPAN) {
      const center = (minLoss + maxLoss) / 2;
      minLoss = center - MIN_Y_SPAN / 2;
      maxLoss = center + MIN_Y_SPAN / 2;
      lossRange = maxLoss - minLoss;
    }

    const margin = { left: 60, right: 40, top: 30, bottom: 50 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    const toCanvasX = (alpha: number) => margin.left + (alpha / maxAlpha) * plotW;
    const toCanvasY = (loss: number) => margin.top + plotH - ((loss - minLoss) / (lossRange + 1e-10)) * plotH;

    // Helper function to generate nice tick values
    const generateTicks = (min: number, max: number, targetCount: number = 5): number[] => {
      const range = max - min;
      if (range === 0) return [min];

      const roughStep = range / (targetCount - 1);
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const normalized = roughStep / magnitude;

      let niceStep;
      if (normalized < 1.5) niceStep = 1;
      else if (normalized < 3.5) niceStep = 2;
      else if (normalized < 7.5) niceStep = 5;
      else niceStep = 10;

      const step = niceStep * magnitude;
      const start = Math.ceil(min / step) * step;
      const ticks: number[] = [];

      for (let tick = start; tick <= max + step * 0.001; tick += step) {
        ticks.push(tick);
      }

      return ticks.length > 0 ? ticks : [min, max];
    };

    // Format tick labels
    const formatTick = (val: number): string => {
      if (val === 0) return '0';
      const abs = Math.abs(val);
      if (abs >= 1000 || abs < 0.01) return val.toExponential(1);
      if (abs >= 10) return val.toFixed(1);
      if (abs >= 1) return val.toFixed(2);
      return val.toFixed(3);
    };

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

    // Draw x-axis ticks and labels
    const xTicks = generateTicks(0, maxAlpha, 5);
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    xTicks.forEach(tick => {
      const x = toCanvasX(tick);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, h - margin.bottom);
      ctx.lineTo(x, h - margin.bottom + 5);
      ctx.stroke();
      ctx.fillText(formatTick(tick), x, h - margin.bottom + 8);
    });

    // Draw y-axis ticks and labels
    const yTicks = generateTicks(minLoss, maxLoss, 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    yTicks.forEach(tick => {
      const y = toCanvasY(tick);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left - 5, y);
      ctx.lineTo(margin.left, y);
      ctx.stroke();
      ctx.fillText(formatTick(tick), margin.left - 8, y);
    });

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < armijoValues.length; i++) {
      const cx = toCanvasX(alphaRange[i]);
      const cy = toCanvasY(armijoValues[i]);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < lossValues.length; i++) {
      const cx = toCanvasX(alphaRange[i]);
      const cy = toCanvasY(lossValues[i]);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw trial points with numbers
    trials.forEach((t, idx) => {
      const cx = toCanvasX(t.alpha);
      const cy = toCanvasY(t.loss);

      ctx.fillStyle = t.satisfied ? '#10b981' : '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, t.satisfied ? 7 : 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw trial number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((idx + 1).toString(), cx, cy);
    });

    ctx.fillStyle = '#374151';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Step size α', w / 2, h - 10);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss', 0, 0);
    ctx.restore();
  };

  // Draw Newton's line search
  useEffect(() => {
    const canvas = newtonLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'newton') return;
    const iter = newtonIterations[newtonCurrentIter];
    if (!iter) return;

    drawLineSearchPlot(canvas, iter);
  }, [newtonIterations, newtonCurrentIter, selectedTab]);

  // Draw L-BFGS parameter space
  useEffect(() => {
    const canvas = lbfgsParamCanvasRef.current;
    if (!canvas || selectedTab !== 'lbfgs') return;
    const iter = lbfgsIterations[lbfgsCurrentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, lbfgsParamBounds, lbfgsIterations, lbfgsCurrentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [lbfgsCurrentIter, data, lbfgsIterations, lbfgsParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw L-BFGS line search
  useEffect(() => {
    const canvas = lbfgsLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'lbfgs') return;
    const iter = lbfgsIterations[lbfgsCurrentIter];
    if (!iter) return;

    drawLineSearchPlot(canvas, iter);
  }, [lbfgsIterations, lbfgsCurrentIter, selectedTab]);

  // Draw GD Fixed parameter space
  useEffect(() => {
    const canvas = gdFixedParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-fixed') return;
    const iter = gdFixedIterations[gdFixedCurrentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, gdFixedParamBounds, gdFixedIterations, gdFixedCurrentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [gdFixedCurrentIter, data, gdFixedIterations, gdFixedParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw GD Line Search parameter space
  useEffect(() => {
    const canvas = gdLSParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLSIterations[gdLSCurrentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, gdLSParamBounds, gdLSIterations, gdLSCurrentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [gdLSCurrentIter, data, gdLSIterations, gdLSParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw GD Line Search plot
  useEffect(() => {
    const canvas = gdLSLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLSIterations[gdLSCurrentIter];
    if (!iter) return;

    drawLineSearchPlot(canvas, iter);
  }, [gdLSIterations, gdLSCurrentIter, selectedTab]);

  // Draw Diagonal Preconditioner parameter space
  useEffect(() => {
    const canvas = diagPrecondParamCanvasRef.current;
    if (!canvas || selectedTab !== 'diagonal-precond') return;
    const iter = diagPrecondIterations[diagPrecondCurrentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, diagPrecondParamBounds, diagPrecondIterations, diagPrecondCurrentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [diagPrecondCurrentIter, data, diagPrecondIterations, diagPrecondParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw Diagonal Preconditioner line search
  useEffect(() => {
    const canvas = diagPrecondLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'diagonal-precond') return;
    const iter = diagPrecondIterations[diagPrecondCurrentIter];
    if (!iter || !iter.lineSearchCurve) return;

    drawLineSearchPlot(canvas, iter);
  }, [diagPrecondIterations, diagPrecondCurrentIter, selectedTab]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comparing Optimization Algorithms
        </h1>
        <p className="text-gray-600">
          Explore how Newton's Method and L-BFGS solve the same problem
        </p>
      </div>

      {/* Unified Problem Configuration */}
      <ProblemConfiguration
        currentProblem={currentProblem}
        onProblemChange={(newProblem, defaults, bounds) => {
          setCurrentProblem(newProblem);

          // Reset algorithm state when problem changes
          setGdFixedCurrentIter(0);
          setGdFixedIterations([]);
          setGdLSCurrentIter(0);
          setGdLSIterations([]);
          setDiagPrecondCurrentIter(0);
          setDiagPrecondIterations([]);
          setNewtonCurrentIter(0);
          setNewtonIterations([]);
          setLbfgsCurrentIter(0);
          setLbfgsIterations([]);

          // Apply problem-specific defaults
          setGdFixedAlpha(defaults.gdFixedAlpha);
          setMaxIter(defaults.maxIter);
          setInitialW0(defaults.initialPoint[0]);
          setInitialW1(defaults.initialPoint[1]);

          // Update visualization bounds
          setVisualizationBounds(bounds);
        }}
        lambda={lambda}
        onLambdaChange={setLambda}
        rotationAngle={rotationAngle}
        onRotationAngleChange={setRotationAngle}
        conditionNumber={conditionNumber}
        onConditionNumberChange={setConditionNumber}
        rosenbrockB={rosenbrockB}
        onRosenbrockBChange={setRosenbrockB}
        separatingHyperplaneVariant={separatingHyperplaneVariant}
        onSeparatingHyperplaneVariantChange={setSeparatingHyperplaneVariant}
        customPoints={customPoints}
        onCustomPointsChange={setCustomPoints}
        addPointMode={addPointMode}
        onAddPointModeChange={setAddPointMode}
        dataCanvasRef={dataCanvasRef}
        onCanvasClick={handleCanvasClick}
        onShowToast={(message, type) => setToast({ message, type })}
      />

      {/* Algorithm Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('algorithms')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'algorithms'
                ? 'text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Algorithms
          </button>
          <button
            onClick={() => setSelectedTab('gd-fixed')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'gd-fixed'
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            GD (Fixed Step)
          </button>
          <button
            onClick={() => setSelectedTab('gd-linesearch')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'gd-linesearch'
                ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            GD (Line Search)
          </button>
          {/* Diagonal Preconditioner Tab */}
          <button
            onClick={() => setSelectedTab('diagonal-precond')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'diagonal-precond'
                ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Diagonal Precond
          </button>
          <button
            onClick={() => setSelectedTab('newton')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'newton'
                ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Newton's Method
          </button>
          <button
            onClick={() => setSelectedTab('lbfgs')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'lbfgs'
                ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            L-BFGS
          </button>
        </div>

        <div className="p-6">
          {selectedTab === 'algorithms' ? (
            <AlgorithmExplainer />
          ) : (
            <>
          {/* GD Fixed Step */}
          {selectedTab === 'gd-fixed' ? (
            <>
              {/* 1. Configuration Section */}
              <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
                <AlgorithmConfiguration
                  algorithm="gd-fixed"
                  maxIter={maxIter}
                  onMaxIterChange={setMaxIter}
                  initialW0={initialW0}
                  onInitialW0Change={setInitialW0}
                  initialW1={initialW1}
                  onInitialW1Change={setInitialW1}
                  gdFixedAlpha={gdFixedAlpha}
                  onGdFixedAlphaChange={setGdFixedAlpha}
                  gdFixedTolerance={gdFixedTolerance}
                  onGdFixedToleranceChange={setGdFixedTolerance}
                  problemFuncs={problemFuncs}
                  problem={problem}
                  currentProblem={currentProblem}
                  bounds={bounds}
                  biasSlice={biasSlice}
                />
              </CollapsibleSection>

              {/* 2. Playback Section */}
              {gdFixedIterations.length > 0 && (
                <IterationPlayback
                  currentIter={gdFixedCurrentIter}
                  totalIters={gdFixedIterations.length}
                  onIterChange={setGdFixedCurrentIter}
                  onReset={() => setGdFixedCurrentIter(0)}
                />
              )}

              {/* 3. Side-by-Side: Canvas + Metrics */}
              <div className="flex gap-4 mb-6">
                {/* Left: Parameter Space Visualization */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape. Orange path = trajectory. Red dot = current position.
                  </p>

                  <canvas
                    ref={gdFixedParamCanvasRef}
                    style={{width: '100%', height: '500px'}}
                    className="border border-gray-300 rounded"
                  />

                  {/* Legend for optimum markers */}
                  {currentProblem !== 'logistic-regression' && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-700">
                      {(() => {
                        const problem = getProblem(currentProblem);
                        if (!problem) return null;
                        return (
                          <>
                            {problem.globalMinimum && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">★</span>
                                <span>Global minimum</span>
                              </div>
                            )}
                            {problem.criticalPoint && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">☆</span>
                                <span>Critical point (saddle)</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right: Metrics Column */}
                {gdFixedIterations.length > 0 && gdFixedIterations[gdFixedCurrentIter] && (
                  <div className="w-80 bg-white rounded-lg shadow-md p-4">
                    <IterationMetrics
                      algorithm="gd-fixed"
                      iterNum={gdFixedCurrentIter}
                      totalIters={gdFixedIterations.length}
                      loss={gdFixedIterations[gdFixedCurrentIter].newLoss}
                      gradNorm={gdFixedIterations[gdFixedCurrentIter].gradNorm}
                      weights={gdFixedIterations[gdFixedCurrentIter].wNew}
                      alpha={gdFixedIterations[gdFixedCurrentIter].alpha}
                      gradient={gdFixedIterations[gdFixedCurrentIter].grad}
                      direction={gdFixedIterations[gdFixedCurrentIter].direction}
                      gradNormHistory={gdFixedIterations.map(iter => iter.gradNorm)}
                      lossHistory={gdFixedIterations.map(iter => iter.newLoss)}
                      alphaHistory={gdFixedIterations.map(iter => iter.alpha)}
                      weightsHistory={gdFixedIterations.map(iter => iter.wNew)}
                      tolerance={gdFixedTolerance}
                      ftol={1e-9}
                      xtol={1e-9}
                      summary={gdFixedSummary}
                      onIterationChange={setGdFixedCurrentIter}
                    />
                  </div>
                )}
              </div>

              {/* GD Fixed - Why This Algorithm? */}
              <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-green-900 mb-4">Gradient Descent (Fixed Step)</h2>
                <p className="text-gray-800 text-lg">
                  The simplest optimization algorithm: follow the gradient downhill with constant step size <InlineMath>\alpha</InlineMath>.
                </p>
              </div>

              <CollapsibleSection
                title="Quick Start"
                defaultExpanded={true}
                storageKey="gd-fixed-quick-start"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-2">The Core Idea</h3>
                    <p>
                      Follow the <strong>gradient downhill</strong>. The gradient{' '}
                      <InlineMath>\nabla f(w)</InlineMath> points in the direction of steepest
                      increase, so <InlineMath>-\nabla f(w)</InlineMath> points toward steepest
                      decrease.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-2">The Algorithm</h3>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
                      <li>Scale by step size <InlineMath>\alpha</InlineMath></li>
                      <li>Update <InlineMath>w \leftarrow w - \alpha \nabla f(w)</InlineMath></li>
                      <li>Repeat until convergence</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-2">Key Formula</h3>
                    <BlockMath>{'w_{k+1} = w_k - \\alpha \\nabla f(w_k)'}</BlockMath>
                    <p className="text-sm mt-2">
                      where <InlineMath>\alpha</InlineMath> (alpha) is the <strong>learning rate</strong>
                      or step size.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-2">When to Use</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Simple baseline for any differentiable function</li>
                      <li>Educational purposes (understanding optimization)</li>
                      <li>When computational cost per iteration must be minimal</li>
                      <li>Problems where you can tune <InlineMath>\alpha</InlineMath> effectively</li>
                    </ul>
                  </div>

                  <div className="bg-green-100 rounded p-3">
                    <p className="font-bold text-sm">Key Challenge:</p>
                    <p className="text-sm">
                      Choosing <InlineMath>\alpha</InlineMath> is critical. Too large → divergence.
                      Too small → slow convergence. This is why line search methods exist
                      (see Gradient Descent with Line Search tab).
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Try This"
                defaultExpanded={true}
                storageKey="gd-fixed-try-this"
              >
                <div className="space-y-3">
                  <p className="text-gray-800 mb-4">
                    Experiment with different step sizes to see success and failure modes:
                  </p>

                  <div className="space-y-3">
                    <div className="border border-green-200 rounded p-3 bg-green-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-green-600 font-bold text-lg hover:text-green-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-fixed');
                            const exp = experiments.find(e => e.id === 'gd-fixed-success');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Good Step Size"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-green-900">Success: Good Step Size (<InlineMath>\alpha=0.1</InlineMath>)</p>
                          <p className="text-sm text-gray-700">
                            Well-chosen <InlineMath>\alpha</InlineMath> leads to smooth convergence
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Steady loss decrease, smooth trajectory
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-red-200 rounded p-3 bg-red-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-red-600 font-bold text-lg hover:text-red-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-fixed');
                            const exp = experiments.find(e => e.id === 'gd-fixed-diverge');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Too Large Step Size"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-red-900">Failure: Too Large (<InlineMath>\alpha=2.5</InlineMath>)</p>
                          <p className="text-sm text-gray-700">
                            Step size causes oscillation and divergence
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Loss increases, trajectory bounces around
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-orange-200 rounded p-3 bg-orange-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-orange-600 font-bold text-lg hover:text-orange-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-fixed');
                            const exp = experiments.find(e => e.id === 'gd-fixed-too-small');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Too Small Step Size"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-orange-900">Failure: Too Small (<InlineMath>\alpha=0.001</InlineMath>)</p>
                          <p className="text-sm text-gray-700">
                            Tiny steps lead to extremely slow convergence
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Barely moves, would need thousands of iterations
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-purple-200 rounded p-3 bg-purple-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-purple-600 font-bold text-lg hover:text-purple-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-fixed');
                            const exp = experiments.find(e => e.id === 'gd-fixed-ill-conditioned');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Ill-Conditioned Problem"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-purple-900">Struggle: Ill-Conditioned</p>
                          <p className="text-sm text-gray-700">
                            Elongated landscape causes zig-zagging because <InlineMath>\alpha</InlineMath> treats all directions equally
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            GD can't adapt to 100× difference in curvature between axes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="When Things Go Wrong"
                defaultExpanded={false}
                storageKey="gd-fixed-when-wrong"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold">❌ "The gradient points to the minimum"</p>
                        <p className="text-sm ml-6">
                          ✓ The gradient points toward steepest <strong>increase</strong><br/>
                          ✓ We follow <InlineMath>-\nabla f</InlineMath> (negative gradient) downhill<br/>
                          ✓ This is the direction of steepest <strong>decrease</strong>, not necessarily toward minimum
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "Gradient descent always converges"</p>
                        <p className="text-sm ml-6">
                          ✓ Only with proper step size <InlineMath>\alpha</InlineMath><br/>
                          ✓ Can diverge if <InlineMath>\alpha</InlineMath> too large<br/>
                          ✓ Can get stuck in local minima on non-convex functions
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "Just pick <InlineMath>\alpha=0.01</InlineMath> and it'll work"</p>
                        <p className="text-sm ml-6">
                          ✓ Optimal <InlineMath>\alpha</InlineMath> depends on problem scaling and coordinate choice<br/>
                          ✓ Fixed step size treats all coordinates equally: rescale one variable (meters→kilometers) and <InlineMath>\alpha</InlineMath> becomes 1000× too large/small for that direction<br/>
                          ✓ Line search methods (next tab) solve this automatically
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
                    <ul className="space-y-2">
                      <li>
                        <strong>Strongly convex:</strong> Linear convergence to global minimum
                        (guaranteed with proper <InlineMath>\alpha</InlineMath>)
                      </li>
                      <li>
                        <strong>Convex:</strong> Converges to global minimum (possibly slowly)
                      </li>
                      <li>
                        <strong>Non-convex:</strong> May get stuck in local minima or saddle points
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Choosing Step Size <InlineMath>\alpha</InlineMath></h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Rule of thumb:</strong></p>
                      <BlockMath>{'0 < \\alpha < \\frac{2}{L}'}</BlockMath>
                      <p>
                        where L is the Lipschitz constant of <InlineMath>\nabla f</InlineMath> (smoothness).
                      </p>
                      <p className="mt-2">
                        <strong>Practical approach:</strong> Try <InlineMath>\alpha = 0.1</InlineMath>,
                        then adjust based on behavior (increase if too slow, decrease if diverging).
                      </p>
                      <p className="mt-2">
                        <strong>Better approach:</strong> Use line search (next tab) to avoid manual tuning.
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Mathematical Derivations"
                defaultExpanded={false}
                storageKey="gd-fixed-math-derivations"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Gradient Descent Update Rule</h3>
                    <p>The basic update is simple:</p>
                    <BlockMath>{'w_{k+1} = w_k - \\alpha \\nabla f(w_k)'}</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>{`\\alpha > 0`}</InlineMath> is the step size (learning rate).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Why This Works</h3>
                    <p>By Taylor expansion around <InlineMath>w_k</InlineMath>:</p>
                    <BlockMath>{'f(w_{k+1}) \\approx f(w_k) + \\nabla f(w_k)^T (w_{k+1} - w_k)'}</BlockMath>
                    <p className="text-sm mt-2">
                      Substituting the update rule:
                    </p>
                    <BlockMath>{`f(w_{k+1}) \\approx f(w_k) - \\alpha \\|\\nabla f(w_k)\\|^2`}</BlockMath>
                    <p className="text-sm mt-2">
                      Since <InlineMath>\|\nabla f(w_k)\|^2 \geq 0</InlineMath>, the loss decreases
                      (for small enough <InlineMath>\alpha</InlineMath>).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
                    <p><strong>For strongly convex functions:</strong></p>
                    <BlockMath>{'\\|w_k - w^*\\| \\leq (1 - \\mu/L)^k \\|w_0 - w^*\\|'}</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>\mu</InlineMath> is strong convexity parameter and{' '}
                      <InlineMath>L</InlineMath> is smoothness (Lipschitz constant of gradient).
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Linear convergence:</strong> Error decreases by constant factor each iteration.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Step Size Selection</h3>
                    <p><strong>Sufficient condition for decrease:</strong></p>
                    <BlockMath>{'\\alpha < \\frac{2}{L}'}</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>L</InlineMath> satisfies:
                    </p>
                    <BlockMath>{'\\|\\nabla f(x) - \\nabla f(y)\\| \\leq L\\|x - y\\|'}</BlockMath>
                    <p className="text-sm mt-2">
                      (Lipschitz continuity of gradient)
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">For Logistic Regression</h3>
                    <p><strong>Loss function:</strong></p>
                    <BlockMath>{`f(w) = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[y_i \\log(\\sigma(w^T x_i)) + (1-y_i) \\log(1-\\sigma(w^T x_i))\\right] + \\frac{\\lambda}{2}\\|w\\|^2`}</BlockMath>
                    <p className="text-sm mt-2"><strong>Gradient:</strong></p>
                    <BlockMath>{`\\nabla f(w) = \\frac{1}{N} \\sum_{i=1}^{N} (\\sigma(w^T x_i) - y_i) x_i + \\lambda w`}</BlockMath>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Advanced Topics"
                defaultExpanded={false}
                storageKey="gd-fixed-advanced"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Momentum Methods</h3>
                    <p>Add momentum to accelerate convergence:</p>
                    <BlockMath>{'v_{k+1} = \\beta v_k - \\alpha \\nabla f(w_k)'}</BlockMath>
                    <BlockMath>{'w_{k+1} = w_k + v_{k+1}'}</BlockMath>
                    <p className="text-sm mt-2">
                      Typical <InlineMath>\beta = 0.9</InlineMath>. Momentum accumulates
                      velocity in consistent directions, damping oscillations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Nesterov Acceleration</h3>
                    <p>"Look ahead" before computing gradient:</p>
                    <BlockMath>{'w_{k+1} = w_k - \\alpha \\nabla f(w_k + \\beta v_k) + \\beta v_k'}</BlockMath>
                    <p className="text-sm mt-2">
                      Provably optimal convergence rate for smooth convex functions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Adaptive Methods Preview</h3>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li>
                        <strong>AdaGrad:</strong> Adapts learning rate per parameter based on
                        historical gradients
                      </li>
                      <li>
                        <strong>RMSprop:</strong> Uses moving average of squared gradients
                      </li>
                      <li>
                        <strong>Adam:</strong> Combines momentum and adaptive learning rates
                        (most popular in deep learning)
                      </li>
                    </ul>
                    <p className="text-sm mt-2">
                      These methods automatically tune step sizes, reducing manual tuning burden.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>Per iteration:</strong> O(n) for gradient computation</li>
                      <li><strong>Memory:</strong> O(n) to store parameters</li>
                      <li><strong>Total cost:</strong> depends on # iterations to converge</li>
                    </ul>
                    <p className="text-sm mt-2 italic">
                      Simple and cheap per iteration, but may require many iterations.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

            </>
          ) : selectedTab === 'gd-linesearch' ? (
            <>
              {/* 1. Configuration Section */}
              <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
                <AlgorithmConfiguration
                  algorithm="gd-linesearch"
                  maxIter={maxIter}
                  onMaxIterChange={setMaxIter}
                  initialW0={initialW0}
                  onInitialW0Change={setInitialW0}
                  initialW1={initialW1}
                  onInitialW1Change={setInitialW1}
                  gdLSC1={gdLSC1}
                  onGdLSC1Change={setGdLSC1}
                  gdLSTolerance={gdLSTolerance}
                  onGdLSToleranceChange={setGdLSTolerance}
                  problemFuncs={problemFuncs}
                  problem={problem}
                  currentProblem={currentProblem}
                  bounds={bounds}
                  biasSlice={biasSlice}
                />
              </CollapsibleSection>

              {/* 2. Playback Section */}
              {gdLSIterations.length > 0 && (
                <IterationPlayback
                  currentIter={gdLSCurrentIter}
                  totalIters={gdLSIterations.length}
                  onIterChange={setGdLSCurrentIter}
                  onReset={() => setGdLSCurrentIter(0)}
                />
              )}

              {/* 3. Side-by-Side: Canvas + Metrics */}
              <div className="flex gap-4 mb-6">
                {/* Left: Parameter Space Visualization */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape. Orange path = trajectory. Red dot = current position.
                  </p>

                  {/* 2D slice notation for 3D problems */}
                  {(currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && logisticGlobalMin && logisticGlobalMin.length >= 3 && (
                    <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                      <span className="font-medium">2D slice:</span> w₂ = {(logisticGlobalMin[2] ?? 0).toFixed(3)} (bias from optimal solution)
                    </div>
                  )}

                  <canvas ref={gdLSParamCanvasRef} style={{width: '100%', height: '500px'}} className="border border-gray-300 rounded" />

                  {/* Legend for optimum markers */}
                  {currentProblem !== 'logistic-regression' && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-700">
                      {(() => {
                        const problem = getProblem(currentProblem);
                        if (!problem) return null;
                        return (
                          <>
                            {problem.globalMinimum && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">★</span>
                                <span>Global minimum</span>
                              </div>
                            )}
                            {problem.criticalPoint && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">☆</span>
                                <span>Critical point (saddle)</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right: Metrics Column */}
                {gdLSIterations.length > 0 && gdLSIterations[gdLSCurrentIter] && (
                  <div className="w-80 bg-white rounded-lg shadow-md p-4">
                    <IterationMetrics
                      algorithm="gd-linesearch"
                      iterNum={gdLSCurrentIter}
                      totalIters={gdLSIterations.length}
                      loss={gdLSIterations[gdLSCurrentIter].newLoss}
                      gradNorm={gdLSIterations[gdLSCurrentIter].gradNorm}
                      weights={gdLSIterations[gdLSCurrentIter].wNew}
                      alpha={gdLSIterations[gdLSCurrentIter].alpha}
                      gradient={gdLSIterations[gdLSCurrentIter].grad}
                      direction={gdLSIterations[gdLSCurrentIter].direction}
                      gradNormHistory={gdLSIterations.map(iter => iter.gradNorm)}
                      lossHistory={gdLSIterations.map(iter => iter.newLoss)}
                      alphaHistory={gdLSIterations.map(iter => iter.alpha)}
                      weightsHistory={gdLSIterations.map(iter => iter.wNew)}
                      lineSearchTrials={gdLSIterations[gdLSCurrentIter].lineSearchTrials?.length}
                      lineSearchCanvasRef={gdLSLineSearchCanvasRef}
                      tolerance={gdLSTolerance}
                      ftol={1e-9}
                      xtol={1e-9}
                      summary={gdLSSummary}
                      onIterationChange={setGdLSCurrentIter}
                    />
                  </div>
                )}
              </div>

              {/* Quick Start */}
              <CollapsibleSection
                title="Quick Start"
                defaultExpanded={true}
                storageKey="gd-ls-quick-start"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">The Core Idea</h3>
                    <p>
                      Instead of using a fixed step size <InlineMath>\alpha</InlineMath>, automatically
                      search for a good step size at each iteration. This makes the algorithm{' '}
                      <strong>robust and efficient</strong> across different problems.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">The Algorithm</h3>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
                      <li>Set search direction <InlineMath>p = -\nabla f(w)</InlineMath></li>
                      <li>
                        <strong>Line search:</strong> find step size <InlineMath>\alpha</InlineMath> that
                        decreases loss sufficiently
                      </li>
                      <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
                      <li>Repeat until convergence</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Key Advantage</h3>
                    <p>
                      <strong>No manual tuning</strong> of step size needed. The line search
                      automatically adapts to:
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Problem scaling and curvature</li>
                      <li>Changes in landscape across iterations</li>
                      <li>Different regions of parameter space</li>
                    </ul>
                    <p className="text-sm mt-3 text-gray-700">
                      <strong>Note:</strong> Line search adapts <InlineMath>\alpha</InlineMath> iteration-by-iteration,
                      which prevents divergence and speeds up convergence. However, it's still <strong>one step size
                      for all directions</strong> at each iteration. On ill-conditioned problems, this causes
                      zig-zagging (just less severe than fixed <InlineMath>\alpha</InlineMath>).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">When to Use</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>When you want robust optimization without tuning</li>
                      <li>Problems with varying curvature</li>
                      <li>When step size selection is difficult</li>
                      <li>Production systems where reliability matters</li>
                    </ul>
                  </div>

                  <div className="bg-teal-100 rounded p-3">
                    <p className="font-bold text-sm">Tradeoff:</p>
                    <p className="text-sm">
                      Each iteration costs more (multiple gradient evaluations for line search),
                      but fewer total iterations needed. Usually worth it for reliable convergence.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Line Search Details */}
              <CollapsibleSection
                title="Line Search Details"
                defaultExpanded={true}
                storageKey="gd-ls-line-search-details"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Why Line Search for Gradient Descent</h3>
                    <p>
                      Fixed step size <InlineMath>\alpha</InlineMath> fails when landscape has
                      varying curvature:
                    </p>
                    <ul className="list-disc ml-6 space-y-1 mt-2">
                      <li>
                        <strong>Steep regions:</strong> need small <InlineMath>\alpha</InlineMath> to
                        avoid overshooting
                      </li>
                      <li>
                        <strong>Flat regions:</strong> can use large <InlineMath>\alpha</InlineMath> for
                        faster progress
                      </li>
                      <li>
                        <strong>Curvature changes:</strong> optimal <InlineMath>\alpha</InlineMath> varies
                        across iterations
                      </li>
                    </ul>
                    <p className="text-sm mt-2">
                      <strong>Line search adapts automatically,</strong> making gradient descent both
                      robust and efficient.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Current Method: Armijo Backtracking</h3>
                    <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
                    <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>c_1 = </InlineMath>{gdLSC1.toFixed(4)} controls how much
                      decrease we require.
                    </p>

                    <div className="mt-3">
                      <p className="font-semibold">Backtracking Algorithm:</p>
                      <ol className="list-decimal ml-6 space-y-1 text-sm">
                        <li>
                          Start with <InlineMath>\alpha = 1</InlineMath> (or previous iteration's value)
                        </li>
                        <li>Check if Armijo condition satisfied</li>
                        <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
                        <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
                      </ol>
                    </div>

                    <div className="mt-3 bg-teal-50 rounded p-3">
                      <p className="font-semibold text-sm mb-2">Understanding <InlineMath>c_1</InlineMath>:</p>
                      <ul className="text-sm list-disc ml-6">
                        <li>
                          <strong><InlineMath>c_1</InlineMath> too small</strong> (e.g., 0.00001): accepts poor steps, wastes iterations
                        </li>
                        <li>
                          <strong><InlineMath>c_1</InlineMath> good</strong> (e.g., 0.0001): balances quality and efficiency
                        </li>
                        <li>
                          <strong><InlineMath>c_1</InlineMath> too large</strong> (e.g., 0.5): too conservative, tiny steps
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-100 rounded p-3">
                    <p className="font-bold text-sm mb-2">Other Line Search Methods</p>
                    <p className="text-sm">
                      <strong>Wolfe conditions:</strong> Add curvature condition for better theoretical properties<br/>
                      <strong>Goldstein conditions:</strong> Alternative sufficient decrease criterion<br/>
                      <strong>Exact line search:</strong> Minimize along line (expensive, rarely used)
                    </p>
                    <p className="text-xs mt-2 italic">
                      Armijo backtracking is simple, fast, and works well in practice.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Try This */}
              <CollapsibleSection
                title="Try This"
                defaultExpanded={true}
                storageKey="gd-ls-try-this"
              >
                <div className="space-y-3">
                  <p className="text-gray-800 mb-4">
                    See how line search automatically adapts to different situations:
                  </p>

                  <div className="space-y-3">
                    <div className="border border-teal-200 rounded p-3 bg-teal-50">
                      <div className="flex items-start gap-2">
                        <button
                          className="text-teal-600 font-bold text-lg hover:text-teal-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`"
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-linesearch');
                            const exp = experiments.find(e => e.id === 'gd-ls-success');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Automatic Adaptation"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-teal-900">Success: Automatic Adaptation</p>
                          <p className="text-sm text-gray-700">
                            Line search finds good steps without manual tuning
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Step size varies, always makes progress
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-orange-200 rounded p-3 bg-orange-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-orange-600 font-bold text-lg hover:text-orange-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-linesearch');
                            const exp = experiments.find(e => e.id === 'gd-ls-c1-too-small');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: C1 Too Small"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-orange-900">Failure: <InlineMath>c_1</InlineMath> Too Small</p>
                          <p className="text-sm text-gray-700">
                            <InlineMath>c_1=0.00001</InlineMath> accepts poor steps, slow convergence
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Many backtracking steps, minimal progress
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-red-200 rounded p-3 bg-red-50">
                      <div className="flex items-start gap-2">
                        <button
                          className="text-red-600 font-bold text-lg hover:text-red-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`"
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-linesearch');
                            const exp = experiments.find(e => e.id === 'gd-ls-c1-too-large');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: C1 Too Large"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-red-900">Failure: <InlineMath>c_1</InlineMath> Too Large</p>
                          <p className="text-sm text-gray-700">
                            <InlineMath>c_1=0.5</InlineMath> is too conservative, rejects good steps
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Tiny steps, very slow progress
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-purple-200 rounded p-3 bg-purple-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-purple-600 font-bold text-lg hover:text-purple-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-linesearch');
                            const exp = experiments.find(e => e.id === 'gd-ls-varying-curvature');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Varying Curvature"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-purple-900">Advantage: Varying Curvature</p>
                          <p className="text-sm text-gray-700">
                            Landscape with dramatic curvature changes (Rosenbrock)
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Adapts to narrow valley where fixed <InlineMath>\alpha</InlineMath> fails
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* When Things Go Wrong */}
              <CollapsibleSection
                title="When Things Go Wrong"
                defaultExpanded={false}
                storageKey="gd-ls-when-wrong"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold">❌ "Line search is always better than fixed step"</p>
                        <p className="text-sm ml-6">
                          ✓ Costs more per iteration (multiple gradient evaluations)<br/>
                          ✓ For very cheap gradients, fixed step may be faster overall<br/>
                          ✓ Tradeoff: fewer iterations vs cost per iteration
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "Line search guarantees fast convergence"</p>
                        <p className="text-sm ml-6">
                          ✓ Still subject to problem conditioning<br/>
                          ✓ Gradient descent is fundamentally first-order (doesn't use curvature)<br/>
                          ✓ Newton or L-BFGS will be faster for well-conditioned problems
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "Any line search condition works"</p>
                        <p className="text-sm ml-6">
                          ✓ Armijo alone doesn't prevent arbitrarily small steps<br/>
                          ✓ Wolfe conditions (Armijo + curvature) have better theory<br/>
                          ✓ In practice, Armijo backtracking works well for most problems
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
                    <p className="mb-2">Same as fixed step gradient descent:</p>
                    <ul className="space-y-2">
                      <li>
                        <strong>Strongly convex:</strong> Linear convergence, line search improves constant
                      </li>
                      <li>
                        <strong>Convex:</strong> Converges to global minimum
                      </li>
                      <li>
                        <strong>Non-convex:</strong> May converge to local minima, line search helps stability
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Too many backtracking steps</strong> → <InlineMath>c_1</InlineMath> too large, decrease it
                      </li>
                      <li>
                        <strong>Slow progress</strong> → <InlineMath>c_1</InlineMath> too small, increase it (or use better algorithm)
                      </li>
                      <li>
                        <strong>Still diverging</strong> → gradient computation bug, check implementation
                      </li>
                      <li>
                        <strong>Expensive per iteration</strong> → gradient evaluation is costly,
                        consider limited memory methods
                      </li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Mathematical Derivations */}
              <CollapsibleSection
                title="Mathematical Derivations"
                defaultExpanded={false}
                storageKey="gd-ls-math-derivations"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Armijo Condition Proof</h3>
                    <p>The Armijo condition ensures sufficient decrease:</p>
                    <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
                    <p className="text-sm mt-2">
                      For descent direction <InlineMath>p = -\nabla f</InlineMath>, we have{' '}
                      <InlineMath>{`\\nabla f^T p < 0`}</InlineMath>, so the right side decreases
                      with <InlineMath>\alpha</InlineMath>.
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Guarantees:</strong> Backtracking terminates in finite steps (by Taylor expansion).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Descent Lemma</h3>
                    <p>For L-smooth functions:</p>
                    <BlockMath>
                      {`f(w + \\alpha p) \\leq f(w) + \\alpha \\nabla f^T p + \\frac{L\\alpha^2}{2}\\|p\\|^2`}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      This bounds how much f can increase along direction p, guaranteeing
                      backtracking finds acceptable step.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Why Backtracking Terminates</h3>
                    <p>By Taylor expansion around <InlineMath>w</InlineMath>:</p>
                    <BlockMath>
                      f(w + \alpha p) = f(w) + \alpha \nabla f^T p + O(\alpha^2)
                    </BlockMath>
                    <p className="text-sm mt-2">
                      For small enough <InlineMath>\alpha</InlineMath>, the{' '}
                      <InlineMath>O(\alpha^2)</InlineMath> term is negligible, so:
                    </p>
                    <BlockMath>
                      {`f(w + \\alpha p) \\approx f(w) + \\alpha \\nabla f^T p < f(w) + c_1 \\alpha \\nabla f^T p`}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      Since <InlineMath>{`c_1 < 1`}</InlineMath> and{' '}
                      <InlineMath>{`\\nabla f^T p < 0`}</InlineMath>, Armijo condition satisfied.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Advanced Topics */}
              <CollapsibleSection
                title="Advanced Topics"
                defaultExpanded={false}
                storageKey="gd-ls-advanced"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Wolfe Conditions</h3>
                    <p>Stronger than Armijo, adds curvature condition:</p>
                    <div className="mt-2">
                      <p className="font-semibold text-sm">1. Sufficient decrease (Armijo):</p>
                      <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
                    </div>
                    <div className="mt-2">
                      <p className="font-semibold text-sm">2. Curvature condition:</p>
                      <BlockMath>\nabla f(w + \alpha p)^T p \geq c_2 \nabla f^T p</BlockMath>
                    </div>
                    <p className="text-sm mt-2">
                      Typical: <InlineMath>c_1 = 0.0001</InlineMath>, <InlineMath>c_2 = 0.9</InlineMath>.
                      Ensures step isn't too small.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Strong Wolfe Conditions</h3>
                    <p>Replace curvature condition with:</p>
                    <BlockMath>|\nabla f(w + \alpha p)^T p| \leq c_2 |\nabla f^T p|</BlockMath>
                    <p className="text-sm mt-2">
                      Prevents steps where curvature increases too much.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Goldstein Conditions</h3>
                    <p>Alternative to Armijo with upper and lower bounds:</p>
                    <BlockMath>
                      {'f(w) + (1-c)\\alpha \\nabla f^T p \\leq f(w + \\alpha p) \\leq f(w) + c\\alpha \\nabla f^T p'}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      Less commonly used than Wolfe conditions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Line Search Method Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border">
                        <thead className="bg-purple-100">
                          <tr>
                            <th className="border p-2">Method</th>
                            <th className="border p-2">Cost</th>
                            <th className="border p-2">Theory</th>
                            <th className="border p-2">Use Case</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2"><strong>Armijo</strong></td>
                            <td className="border p-2">Low</td>
                            <td className="border p-2">Good</td>
                            <td className="border p-2">General purpose</td>
                          </tr>
                          <tr>
                            <td className="border p-2"><strong>Wolfe</strong></td>
                            <td className="border p-2">Medium</td>
                            <td className="border p-2">Better</td>
                            <td className="border p-2">Quasi-Newton methods</td>
                          </tr>
                          <tr>
                            <td className="border p-2"><strong>Strong Wolfe</strong></td>
                            <td className="border p-2">Medium</td>
                            <td className="border p-2">Best</td>
                            <td className="border p-2">BFGS, L-BFGS</td>
                          </tr>
                          <tr>
                            <td className="border p-2"><strong>Exact</strong></td>
                            <td className="border p-2">Very high</td>
                            <td className="border p-2">Optimal</td>
                            <td className="border p-2">Rarely practical</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Cost Analysis</h3>
                    <p className="mb-2"><strong>Per iteration cost:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li>Fixed step: 1 gradient evaluation</li>
                      <li>Armijo backtracking: 1-10 gradient evaluations (average ~2-3)</li>
                      <li>Wolfe conditions: 2-15 gradient evaluations</li>
                    </ul>
                    <p className="text-sm mt-2">
                      <strong>Total cost:</strong> Line search usually wins by reducing total iterations.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

            </>
          ) : selectedTab === 'newton' ? (
            <>
              {/* 1. Configuration Section */}
              <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
                <AlgorithmConfiguration
                  algorithm="newton"
                  maxIter={maxIter}
                  onMaxIterChange={setMaxIter}
                  initialW0={initialW0}
                  onInitialW0Change={setInitialW0}
                  initialW1={initialW1}
                  onInitialW1Change={setInitialW1}
                  newtonC1={newtonC1}
                  onNewtonC1Change={setNewtonC1}
                  newtonLineSearch={newtonLineSearch}
                  onNewtonLineSearchChange={setNewtonLineSearch}
                  newtonHessianDamping={newtonHessianDamping}
                  onNewtonHessianDampingChange={setNewtonHessianDamping}
                  newtonTolerance={newtonTolerance}
                  onNewtonToleranceChange={setNewtonTolerance}
                  newtonFtol={newtonFtol}
                  onNewtonFtolChange={setNewtonFtol}
                  newtonXtol={newtonXtol}
                  onNewtonXtolChange={setNewtonXtol}
                  problemFuncs={problemFuncs}
                  problem={problem}
                  currentProblem={currentProblem}
                  bounds={bounds}
                  biasSlice={biasSlice}
                />
              </CollapsibleSection>

              {/* 2. Playback Section */}
              {newtonIterations.length > 0 && (
                <IterationPlayback
                  currentIter={newtonCurrentIter}
                  totalIters={newtonIterations.length}
                  onIterChange={setNewtonCurrentIter}
                  onReset={() => setNewtonCurrentIter(0)}
                />
              )}

              {/* 3. Side-by-Side: Canvas + Metrics */}
              <div className="flex gap-4 mb-6">
                {/* Left: Parameter Space Visualization */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape. Orange path = trajectory. Red dot = current position.
                  </p>

                  {/* 2D slice notation for 3D problems */}
                  {(currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && logisticGlobalMin && logisticGlobalMin.length >= 3 && (
                    <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                      <span className="font-medium">2D slice:</span> w₂ = {(logisticGlobalMin[2] ?? 0).toFixed(3)} (bias from optimal solution)
                    </div>
                  )}

                  <canvas ref={newtonParamCanvasRef} style={{width: '100%', height: '500px'}} className="border border-gray-300 rounded" />

                  {/* Legend for optimum markers */}
                  {currentProblem !== 'logistic-regression' && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-700">
                      {(() => {
                        const problem = getProblem(currentProblem);
                        if (!problem) return null;
                        return (
                          <>
                            {problem.globalMinimum && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">★</span>
                                <span>Global minimum</span>
                              </div>
                            )}
                            {problem.criticalPoint && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">☆</span>
                                <span>Critical point (saddle)</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right: Metrics Column */}
                {newtonIterations.length > 0 && newtonIterations[newtonCurrentIter] && (
                  <div className="w-80 bg-white rounded-lg shadow-md p-4">
                    <IterationMetrics
                      algorithm="newton"
                      iterNum={newtonCurrentIter}
                      totalIters={newtonIterations.length}
                      loss={newtonIterations[newtonCurrentIter].newLoss}
                      gradNorm={newtonIterations[newtonCurrentIter].gradNorm}
                      weights={newtonIterations[newtonCurrentIter].wNew}
                      alpha={newtonIterations[newtonCurrentIter].alpha}
                      gradient={newtonIterations[newtonCurrentIter].grad}
                      direction={newtonIterations[newtonCurrentIter].direction}
                      gradNormHistory={newtonIterations.map(iter => iter.gradNorm)}
                      lossHistory={newtonIterations.map(iter => iter.newLoss)}
                      alphaHistory={newtonIterations.map(iter => iter.alpha)}
                      weightsHistory={newtonIterations.map(iter => iter.wNew)}
                      eigenvalues={newtonIterations[newtonCurrentIter].eigenvalues}
                      conditionNumber={newtonIterations[newtonCurrentIter].conditionNumber}
                      lineSearchTrials={newtonIterations[newtonCurrentIter].lineSearchTrials?.length}
                      lineSearchCanvasRef={newtonLineSearch === 'armijo' ? newtonLineSearchCanvasRef : undefined}
                      hessianCanvasRef={newtonHessianCanvasRef}
                      hessian={newtonIterations[newtonCurrentIter].hessian}
                      tolerance={newtonTolerance}
                      ftol={newtonFtol}
                      xtol={newtonXtol}
                      summary={newtonSummary}
                      onIterationChange={setNewtonCurrentIter}
                    />
                  </div>
                )}
              </div>

              {/* Newton's Method - Quick Start */}
              <CollapsibleSection
                title="Quick Start"
                defaultExpanded={true}
                storageKey="newton-quick-start"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">The Core Idea</h3>
                    <p>
                      Gradient descent uses first derivatives. Newton's method uses second derivatives
                      (the <strong>Hessian matrix</strong>) to see the curvature and take smarter steps
                      toward the minimum. We add Hessian damping (Levenberg-Marquardt regularization) for
                      numerical stability.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">The Algorithm</h3>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
                      <li>Compute Hessian <InlineMath>H(w)</InlineMath> (matrix of all second derivatives)</li>
                      <li>Add damping: <InlineMath>{'H_d = H + \\lambda_{\\text{damp}} \\cdot I'}</InlineMath> where <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath> = Hessian damping parameter</li>
                      <li>Solve <InlineMath>H_d p = -\nabla f</InlineMath> for search direction <InlineMath>p</InlineMath></li>
                      <li>Line search for step size <InlineMath>\alpha</InlineMath></li>
                      <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Key Formula</h3>
                    <p>Newton direction (with damping):</p>
                    <BlockMath>{'p = -(H + \\lambda_{\\text{damp}} I)^{-1}\\nabla f'}</BlockMath>
                    <p className="text-sm mt-2">
                      <strong>Intuition:</strong> <InlineMath>{`H^{-1}`}</InlineMath> transforms the gradient into the
                      natural coordinate system of the problem. Adding <InlineMath>{`\\lambda_{\\text{damp}} I`}</InlineMath> improves
                      numerical stability when <InlineMath>H</InlineMath> has tiny eigenvalues.
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Why this matters:</strong> If you rescale coordinates (e.g., x→1000x), both
                      <InlineMath>\nabla f</InlineMath> and <InlineMath>H</InlineMath> transform in complementary ways,
                      so <InlineMath>{'H^{-1}\\nabla f'}</InlineMath> stays invariant. The Newton step automatically
                      adapts to different scales in different directions, eliminating the zig-zagging that plagues
                      gradient descent.
                    </p>
                    <p className="text-sm mt-1 text-gray-600">
                      (When λ_damp = 0, this is pure Newton's method: <InlineMath>{'p = -H^{-1}\\nabla f'}</InlineMath>)
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">When to Use</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Small-medium problems (n &lt; 1000 parameters)</li>
                      <li>Smooth, twice-differentiable objectives</li>
                      <li>Near a local minimum (quadratic convergence)</li>
                      <li>When you can afford O(n³) computation per iteration</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Hessian Damping Parameter</h3>
                    <p className="mb-2">The default 0.01 works for most problems. Adjust when:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Lower to ~0 to see pure Newton's method behavior (may be unstable)</li>
                      <li>Increase to 0.1+ for very ill-conditioned problems</li>
                    </ul>
                  </div>

                  <div className="bg-purple-100 rounded p-4 mb-4">
                    <h3 className="text-lg font-bold text-purple-900 mb-2">
                      🎯 Why Newton Doesn't Zig-Zag (The Step Size Issue)
                    </h3>

                    <p className="mb-2">
                      <strong>Gradient Descent (Fixed <InlineMath>\alpha</InlineMath>):</strong> <InlineMath>{'w_{k+1} = w_k - \\alpha\\nabla f'}</InlineMath>
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-sm mb-3">
                      <li>One step size <InlineMath>\alpha</InlineMath> for all directions, forever</li>
                      <li>On x² + 100y²: same <InlineMath>\alpha</InlineMath> for both directions despite 100× curvature difference</li>
                      <li>Result: severe zig-zagging</li>
                    </ul>

                    <p className="mb-2">
                      <strong>GD with Line Search:</strong> Adaptive <InlineMath>\alpha</InlineMath> each iteration
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-sm mb-3">
                      <li>Still one <InlineMath>\alpha</InlineMath> for all directions at each step, but adapts as we go</li>
                      <li>Much better than fixed <InlineMath>\alpha</InlineMath> - prevents divergence, speeds convergence</li>
                      <li>But still zig-zags on ill-conditioned problems (just less severe)</li>
                    </ul>

                    <p className="mb-2">
                      <strong>Newton's Method:</strong> <InlineMath>{`w_{k+1} = w_k - H^{-1}\\nabla f`}</InlineMath>
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li><InlineMath>{`H^{-1}`}</InlineMath> provides direction-specific step sizes based on curvature</li>
                      <li>On x² + 100y²: automatically uses 100× smaller step in y-direction</li>
                      <li>Result: no zig-zagging, straight to minimum</li>
                    </ul>

                    <p className="text-sm mt-3 italic text-purple-800">
                      Line search: "One size fits all (per iteration)."
                      Newton: "Custom fit for each direction."
                    </p>
                  </div>

                  <div className="bg-amber-100 rounded p-4 mb-4">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      🤔 Why Not Just Use a Vector of Step Sizes?
                    </h3>

                    <p className="mb-3">
                      Natural question: If different directions need different step sizes,
                      why not use <InlineMath>\alpha</InlineMath> = (<InlineMath>\alpha_1</InlineMath>, <InlineMath>\alpha_2</InlineMath>, ..., <InlineMath>\alpha_n</InlineMath>) - one step size per coordinate?
                    </p>

                    <p className="mb-2"><strong>Update rule would be:</strong></p>
                    <BlockMath>{'w_{new} = w_{old} - (\\alpha_1 \\frac{\\partial f}{\\partial x_1}, \\alpha_2 \\frac{\\partial f}{\\partial x_2}, ...)'}</BlockMath>

                    <p className="mb-3 mt-3">
                      <strong>This handles different scales</strong> in each coordinate direction.
                      But there's a problem...
                    </p>

                    <div className="bg-amber-200 rounded p-3 mb-3">
                      <p className="font-semibold mb-2">What if the problem is ROTATED?</p>
                      <p className="text-sm mb-2">
                        Example: f(x,y) = (x+y)² + 100(x-y)²
                      </p>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>The valley runs diagonally (along x+y=0), not along x or y axis</li>
                        <li>No choice of (<InlineMath>\alpha_1</InlineMath>, <InlineMath>\alpha_2</InlineMath>) can make the step point down the diagonal valley</li>
                        <li>You need to ROTATE the step direction, not just scale coordinates</li>
                      </ul>
                    </div>

                    <p className="mb-2"><strong>Newton's matrix <InlineMath>{`H^{-1}`}</InlineMath> solves this:</strong></p>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li>Full matrix can both SCALE (handle different curvatures) and ROTATE (align with problem geometry)</li>
                      <li><InlineMath>{`H^{-1}\\nabla f`}</InlineMath> automatically points toward the minimum regardless of rotation</li>
                      <li>This is why we need n² values (matrix) not just n values (vector)</li>
                    </ul>

                    <p className="text-sm mt-3 italic text-amber-800">
                      Try the "Rotated Quadratic" experiment below to see this in action!
                    </p>
                  </div>

                  <div className="bg-blue-100 rounded p-3">
                    <p className="font-bold text-sm">Assumptions:</p>
                    <ul className="text-sm list-disc ml-6">
                      <li>f is twice continuously differentiable</li>
                      <li>Hessian damping ensures H_d is positive definite for numerical stability</li>
                      <li>Line search used when far from minimum or in non-convex regions</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Line Search Details */}
              <CollapsibleSection
                title="Line Search Details"
                defaultExpanded={true}
                storageKey="newton-line-search-details"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Why Line Search for Newton's Method</h3>
                    <p>Pure Newton (<InlineMath>\alpha = 1</InlineMath> always) assumes the quadratic
                       approximation is perfect:</p>
                    <ul className="list-disc ml-6 space-y-1 mt-2">
                      <li><strong>Far from minimum:</strong> quadratic approximation breaks down</li>
                      <li><strong>Non-convex regions:</strong> negative eigenvalues → wrong direction</li>
                      <li><strong>Line search provides damping:</strong> reduces to gradient descent if needed</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Current Method: Armijo Backtracking</h3>
                    <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
                    <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>c_1 = </InlineMath>{newtonC1.toFixed(4)} controls how much decrease we require.
                    </p>

                    <div className="mt-3">
                      <p className="font-semibold">Backtracking Algorithm:</p>
                      <ol className="list-decimal ml-6 space-y-1 text-sm">
                        <li>Start with <InlineMath>\alpha = 1</InlineMath> (full Newton step)</li>
                        <li>Check if Armijo condition satisfied</li>
                        <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
                        <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
                      </ol>
                    </div>

                    <p className="text-sm mt-3">
                      <strong>Why it works:</strong> Near the minimum with positive definite Hessian,
                      <InlineMath>\alpha = 1</InlineMath> is usually accepted. Far away or in
                      problematic regions, backtracking provides safety.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Try This */}
              <CollapsibleSection
                title="Try This"
                defaultExpanded={true}
                storageKey="newton-try-this"
              >
                <div className="space-y-3">
                  <p className="text-gray-800 mb-4">
                    Run these experiments to see when Newton's method excels and when it struggles:
                  </p>

                  <div className="space-y-3">
                    <div className="border border-blue-200 rounded p-3 bg-blue-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-blue-600 font-bold text-lg hover:text-blue-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('newton');
                            const exp = experiments.find(e => e.id === 'newton-success-quadratic');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Success - Strongly Convex Quadratic"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-blue-900">Success: Strongly Convex Quadratic</p>
                          <p className="text-sm text-gray-700">
                            Watch quadratic convergence in 1-2 iterations on a simple bowl
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: All eigenvalues positive, <InlineMath>\alpha=1</InlineMath> accepted, dramatic loss drop
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-red-200 rounded p-3 bg-red-50">
                      <div className="flex items-start gap-2">
                        <button
                          className="text-red-600 font-bold text-lg hover:text-red-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`"
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('newton');
                            const exp = experiments.find(e => e.id === 'newton-failure-rosenbrock');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Failure - Non-Convex Saddle Point"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-red-900">Failure: Non-Convex Saddle Point</p>
                          <p className="text-sm text-gray-700">
                            Start near saddle to see negative eigenvalues and wrong direction
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Negative eigenvalue, Newton direction points wrong way
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-green-200 rounded p-3 bg-green-50">
                      <div className="flex items-start gap-2">
                        <button
                          className="text-green-600 font-bold text-lg hover:text-green-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`"
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('newton');
                            const exp = experiments.find(e => e.id === 'newton-fixed-linesearch');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Fixed - Line Search Rescue"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-green-900">Fixed: Line Search Rescue</p>
                          <p className="text-sm text-gray-700">
                            Same non-convex problem but line search prevents divergence
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Backtracking reduces <InlineMath>\alpha</InlineMath>, acts like damped Newton
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-purple-200 rounded p-3 bg-purple-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-purple-600 font-bold text-lg hover:text-purple-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('newton');
                            const exp = experiments.find(e => e.id === 'newton-compare-ill-conditioned');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Compare - Newton vs GD on Ill-Conditioned"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-purple-900">Compare: Newton vs GD on Ill-Conditioned</p>
                          <p className="text-sm text-gray-700">
                            Elongated ellipse (<InlineMath>\kappa=100</InlineMath>): 100× more curved in one direction
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Why Newton wins:</strong> Even with line search, GD uses one <InlineMath>\alpha</InlineMath> for
                            all directions at each step → still zig-zags. Newton's <InlineMath>{`H^{-1}`}</InlineMath> uses
                            direction-specific steps based on curvature → straight to minimum.
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Newton ~5 iterations, GD needs 100+ (even with line search!)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-amber-200 rounded p-3 bg-amber-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-amber-600 font-bold text-lg hover:text-amber-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('newton');
                            const exp = experiments.find(e => e.id === 'newton-rotated-quadratic');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Demo - Why a Vector of αs Isn't Enough"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-amber-900">Demo: Why a Vector of αs Isn't Enough</p>
                          <p className="text-sm text-gray-700">
                            Rotated ellipse where the valley runs diagonally - no per-coordinate step sizes (<InlineMath>\alpha_1</InlineMath>, <InlineMath>\alpha_2</InlineMath>) can align with it
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Watch how <InlineMath>{`H^{-1}`}</InlineMath> automatically rotates the step to point down the valley - this is why we need a matrix!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-orange-200 rounded p-3 bg-orange-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-orange-600 font-bold text-lg hover:text-orange-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const exp = newtonExperiments.find(e => e.id === 'newton-perceptron-failure');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Perceptron Won't Converge"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-orange-900">Fundamental Incompatibility: Newton + Perceptron</p>
                          <p className="text-sm text-gray-700">
                            Perceptron has piecewise linear loss → Hessian ≈ 0 → Newton computes massive steps (10,000x too large)
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Oscillates wildly, never converges. Workarounds hide symptoms but don't fix the root problem.
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                const exp = newtonExperiments.find(e => e.id === 'newton-perceptron-damping-fix');
                                if (exp) loadExperiment(exp);
                              }}
                              disabled={experimentLoading}
                              aria-label="Load workaround: Perceptron with Line Search"
                            >
                              Workaround: Line search
                            </button>
                            <button
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                const exp = newtonExperiments.find(e => e.id === 'newton-perceptron-hessian-damping');
                                if (exp) loadExperiment(exp);
                              }}
                              disabled={experimentLoading}
                              aria-label="Load workaround: Perceptron with Hessian Damping"
                            >
                              Workaround: Hessian damping
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 italic">
                            ⚠️ Both workarounds just obscure the problem. Use GD or L-BFGS instead!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* When Things Go Wrong */}
              <CollapsibleSection
                title="When Things Go Wrong"
                defaultExpanded={false}
                storageKey="newton-when-wrong"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold">❌ "Newton always converges faster than gradient descent"</p>
                        <p className="text-sm ml-6">
                          ✓ Only near a local minimum with positive definite Hessian<br/>
                          ✓ Can diverge or fail in non-convex regions without line search
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "The Hessian tells you the direction to the minimum"</p>
                        <p className="text-sm ml-6">
                          ✓ <InlineMath>{'-H^{-1}\\nabla f'}</InlineMath> is the Newton direction, not just <InlineMath>H</InlineMath><br/>
                          ✓ If H not positive definite, may not be a descent direction
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "Newton's method always finds the global minimum"</p>
                        <p className="text-sm ml-6">
                          ✓ Only for convex functions<br/>
                          ✓ Non-convex: converges to local minimum or saddle point
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
                    <ul className="space-y-2">
                      <li>
                        <strong>Strongly convex:</strong> Quadratic convergence guaranteed,
                        H positive definite everywhere
                      </li>
                      <li>
                        <strong>Convex:</strong> H positive semidefinite, converges to global minimum
                      </li>
                      <li>
                        <strong>Non-convex:</strong> May converge to local minimum or saddle point,
                        H can have negative eigenvalues
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Instability / Huge steps</strong> → increase Hessian damping (λ_damp) to 0.1 or higher
                      </li>
                      <li>
                        <strong>Slow convergence</strong> → may be far from minimum (quadratic approximation poor), or λ_damp too high (try lowering toward 0.01)
                      </li>
                      <li>
                        <strong>Numerical issues</strong> → Hessian severely ill-conditioned, increase λ_damp further or switch to L-BFGS
                      </li>
                      <li>
                        <strong>High cost</strong> → n too large, switch to L-BFGS
                      </li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Mathematical Derivations */}
              <CollapsibleSection
                title="Mathematical Derivations"
                defaultExpanded={false}
                storageKey="newton-math-derivations"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Taylor Expansion</h3>
                    <p>Approximate f locally as quadratic:</p>
                    <BlockMath>
                      {'f(w+p) = f(w) + \\nabla f(w)^T p + \\frac{1}{2}p^T H(w) p + O(\\|p\\|^3)'}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      This is a second-order approximation using the Hessian matrix.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Deriving Newton Direction</h3>
                    <p>Minimize the quadratic approximation over p:</p>
                    <BlockMath>
                      {'\\nabla_p \\left[ f(w) + \\nabla f^T p + \\frac{1}{2}p^T H p \\right] = \\nabla f + Hp = 0'}
                    </BlockMath>
                    <p>Therefore:</p>
                    <BlockMath>Hp = -\nabla f</BlockMath>
                    <p>Newton direction:</p>
                    <BlockMath>{'p = -H^{-1}\\nabla f'}</BlockMath>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Why It Works</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        At minimum of quadratic function, this gives <strong>exact solution in one step</strong>
                      </li>
                      <li>
                        Near a minimum, f behaves like quadratic → <strong>fast convergence</strong>
                      </li>
                      <li>
                        Uses curvature information to <strong>scale gradient properly</strong> in each direction
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
                    <p><strong>Quadratic convergence:</strong></p>
                    <BlockMath>
                      {`\\|e_{k+1}\\| \\leq C\\|e_k\\|^2`}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      where <InlineMath>{`e_k = w_k - w^*`}</InlineMath> is the error.
                      Error <strong>squared</strong> at each iteration (very fast near solution).
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Requires:</strong> strong convexity, Lipschitz continuous Hessian,
                      starting close enough to <InlineMath>{`w^*`}</InlineMath>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Proof Sketch</h3>
                    <ol className="list-decimal ml-6 space-y-1 text-sm">
                      <li>Taylor expand f(<InlineMath>w_k</InlineMath>) and f(<InlineMath>w^*</InlineMath>) around <InlineMath>w_k</InlineMath></li>
                      <li>Use Newton update rule to relate <InlineMath>{String.raw`w_{k+1}`}</InlineMath> and <InlineMath>w_k</InlineMath></li>
                      <li>Bound error using Hessian Lipschitz constant</li>
                      <li>Show error term is quadratic in current error</li>
                    </ol>
                    <p className="text-xs text-gray-600 mt-2">
                      Full proof requires Lipschitz continuity of the Hessian and bounds on eigenvalues.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">With Hessian Damping</h3>
                    <p>The damped Hessian adds a diagonal regularization term:</p>
                    <BlockMath>
                      {'H_{\\text{damped}} = H + \\lambda_{\\text{damp}} \\cdot I'}
                    </BlockMath>
                    <p className="mt-2">The Newton direction becomes:</p>
                    <BlockMath>
                      {'p = -(H + \\lambda_{\\text{damp}} \\cdot I)^{-1} \\nabla f'}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      <strong>This interpolates between two extremes:</strong>
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
                      <li>
                        <InlineMath>{`\\lambda_{\\text{damp}} = 0`}</InlineMath>: Pure Newton's method
                      </li>
                      <li>
                        <InlineMath>{`\\lambda_{\\text{damp}} \\to \\infty`}</InlineMath>: Approaches gradient descent <InlineMath>{`(p \\approx -\\nabla f / \\lambda_{\\text{damp}})`}</InlineMath>
                      </li>
                    </ul>
                    <p className="text-sm mt-2 text-gray-600">
                      Damping improves numerical stability by ensuring <InlineMath>{`H_{\\text{damped}}`}</InlineMath> is
                      positive definite, even when H has small or negative eigenvalues.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Advanced Topics */}
              <CollapsibleSection
                title="Advanced Topics"
                defaultExpanded={false}
                storageKey="newton-advanced"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>Computing Hessian H:</strong> O(n²) operations and memory</li>
                      <li><strong>Solving Hp = -∇f:</strong> O(n³) with direct methods (Cholesky, LU)</li>
                      <li><strong>Total per iteration:</strong> O(n³) time, O(n²) space</li>
                      <li><strong>For n=1000:</strong> ~1 billion operations per iteration</li>
                    </ul>
                    <p className="text-sm mt-2 italic">
                      This is why Newton's method becomes impractical for large-scale problems,
                      motivating quasi-Newton methods like L-BFGS.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Condition Number and Convergence</h3>
                    <p>Condition number: <InlineMath>{'\\kappa = \\lambda_{max}/\\lambda_{min}'}</InlineMath></p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Large <InlineMath>\kappa</InlineMath> → elongated level sets (ill-conditioned)</li>
                      <li>Newton handles ill-conditioning <strong>better than gradient descent</strong> because <InlineMath>{`H^{-1}`}</InlineMath> automatically provides direction-specific step sizes</li>
                      <li>GD's single <InlineMath>\alpha</InlineMath> (even with line search) can't adapt to different curvatures in different directions → zig-zags</li>
                      <li>But numerical stability suffers with very large <InlineMath>\kappa</InlineMath></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Modified Newton Methods</h3>

                    <div className="mt-2">
                      <p className="font-semibold">Levenberg-Marquardt:</p>
                      <BlockMath>{'p = -(H + \\lambda I)^{-1}\\nabla f'}</BlockMath>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>Adds regularization to make H positive definite</li>
                        <li><InlineMath>\lambda=0</InlineMath>: pure Newton; <InlineMath>\lambda\to\infty</InlineMath>: gradient descent</li>
                        <li>Interpolates between methods based on trust</li>
                      </ul>
                    </div>

                    <div className="mt-3">
                      <p className="font-semibold">Eigenvalue Modification:</p>
                      <p className="text-sm">Replace negative eigenvalues with small positive values</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Inexact Newton</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Solve Hp = -∇f <strong>approximately</strong> using iterative methods</li>
                      <li>Use Conjugate Gradient (CG) for large problems</li>
                      <li>Reduces O(n³) to O(n²) or better</li>
                      <li>Still achieves superlinear convergence with loose tolerances</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Trust Region Methods</h3>
                    <p>Alternative to line search:</p>
                    <BlockMath>
                      {'\\min_p \\; f(w) + \\nabla f^T p + \\frac{1}{2}p^T H p \\quad \\text{s.t.} \\; \\|p\\| \\leq \\Delta'}
                    </BlockMath>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li>Constrain step to trust region of radius Δ</li>
                      <li>Adjust Δ based on agreement between model and actual function</li>
                      <li>More robust in non-convex settings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Quasi-Newton Preview</h3>
                    <p>Key insight: Newton requires exact Hessian (expensive)</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Quasi-Newton approximates H or H⁻¹ from gradients</li>
                      <li>Builds up curvature information over iterations</li>
                      <li>Next algorithm: <strong>L-BFGS</strong> (Limited-memory BFGS)</li>
                      <li>O(mn) cost instead of O(n³), where m ≈ 5-20</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

            </>
          ) : selectedTab === 'lbfgs' ? (
            <>
              {/* 1. Configuration Section */}
              <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
                <AlgorithmConfiguration
                  algorithm="lbfgs"
                  maxIter={maxIter}
                  onMaxIterChange={setMaxIter}
                  initialW0={initialW0}
                  onInitialW0Change={setInitialW0}
                  initialW1={initialW1}
                  onInitialW1Change={setInitialW1}
                  lbfgsC1={lbfgsC1}
                  onLbfgsC1Change={setLbfgsC1}
                  lbfgsM={lbfgsM}
                  onLbfgsMChange={setLbfgsM}
                  lbfgsHessianDamping={lbfgsHessianDamping}
                  onLbfgsHessianDampingChange={setLbfgsHessianDamping}
                  lbfgsTolerance={lbfgsTolerance}
                  onLbfgsToleranceChange={setLbfgsTolerance}
                  problemFuncs={problemFuncs}
                  problem={problem}
                  currentProblem={currentProblem}
                  bounds={bounds}
                  biasSlice={biasSlice}
                />
              </CollapsibleSection>

              {/* 2. Playback Section */}
              {lbfgsIterations.length > 0 && (
                <IterationPlayback
                  currentIter={lbfgsCurrentIter}
                  totalIters={lbfgsIterations.length}
                  onIterChange={setLbfgsCurrentIter}
                  onReset={() => setLbfgsCurrentIter(0)}
                />
              )}

              {/* 3. Side-by-Side: Canvas + Metrics */}
              <div className="flex gap-4 mb-6">
                {/* Left: Parameter Space Visualization */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape. Orange path = trajectory. Red dot = current position.
                  </p>

                  {/* 2D slice notation for 3D problems */}
                  {(currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && logisticGlobalMin && logisticGlobalMin.length >= 3 && (
                    <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                      <span className="font-medium">2D slice:</span> w₂ = {(logisticGlobalMin[2] ?? 0).toFixed(3)} (bias from optimal solution)
                    </div>
                  )}

                  <canvas ref={lbfgsParamCanvasRef} style={{width: '100%', height: '500px'}} className="border border-gray-300 rounded" />

                  {/* Legend for optimum markers */}
                  {currentProblem !== 'logistic-regression' && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-700">
                      {(() => {
                        const problem = getProblem(currentProblem);
                        if (!problem) return null;
                        return (
                          <>
                            {problem.globalMinimum && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">★</span>
                                <span>Global minimum</span>
                              </div>
                            )}
                            {problem.criticalPoint && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">☆</span>
                                <span>Critical point (saddle)</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right: Metrics Column */}
                {lbfgsIterations.length > 0 && lbfgsIterations[lbfgsCurrentIter] && (
                  <div className="w-80 bg-white rounded-lg shadow-md p-4">
                    <IterationMetrics
                      algorithm="lbfgs"
                      iterNum={lbfgsCurrentIter}
                      totalIters={lbfgsIterations.length}
                      loss={lbfgsIterations[lbfgsCurrentIter].newLoss}
                      gradNorm={lbfgsIterations[lbfgsCurrentIter].gradNorm}
                      weights={lbfgsIterations[lbfgsCurrentIter].wNew}
                      alpha={lbfgsIterations[lbfgsCurrentIter].alpha}
                      gradient={lbfgsIterations[lbfgsCurrentIter].grad}
                      direction={lbfgsIterations[lbfgsCurrentIter].direction}
                      gradNormHistory={lbfgsIterations.map(iter => iter.gradNorm)}
                      lossHistory={lbfgsIterations.map(iter => iter.newLoss)}
                      alphaHistory={lbfgsIterations.map(iter => iter.alpha)}
                      weightsHistory={lbfgsIterations.map(iter => iter.wNew)}
                      lineSearchTrials={lbfgsIterations[lbfgsCurrentIter].lineSearchTrials?.length}
                      lineSearchCanvasRef={lbfgsLineSearchCanvasRef}
                      tolerance={lbfgsTolerance}
                      ftol={1e-9}
                      xtol={1e-9}
                      summary={lbfgsSummary}
                      onIterationChange={setLbfgsCurrentIter}
                    />
                  </div>
                )}
              </div>

              {/* L-BFGS - Quick Start */}
              <CollapsibleSection
                title="Quick Start"
                defaultExpanded={true}
                storageKey="lbfgs-quick-start"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">The Core Idea</h3>
                    <p>
                      Newton's method uses <InlineMath>{'H^{-1}\\nabla f'}</InlineMath> for smarter steps,
                      but computing H costs O(n³). <strong>L-BFGS approximates</strong>{' '}
                      <InlineMath>{'H^{-1}\\nabla f'}</InlineMath> using only recent gradient changes—no
                      Hessian computation needed. We add Hessian damping (Levenberg-Marquardt regularization) for
                      numerical stability.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">The Algorithm</h3>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
                      <li>
                        Use <strong>two-loop recursion</strong> to compute{' '}
                        <InlineMath>{'p \\approx -H^{-1}\\nabla f'}</InlineMath> from M recent (s,y) pairs
                      </li>
                      <li>Add damping to initial Hessian approximation: <InlineMath>{'B_0 + \\lambda_{\\text{damp}} \\cdot I'}</InlineMath></li>
                      <li>Line search for step size <InlineMath>\alpha</InlineMath></li>
                      <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
                      <li>
                        Store new pair: <InlineMath>s = \alpha p</InlineMath> (parameter change),{' '}
                        <InlineMath>{'y = \\nabla f_{new} - \\nabla f_{old}'}</InlineMath> (gradient change)
                      </li>
                      <li>Keep only M most recent pairs (discard oldest)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Key Idea</h3>
                    <p>
                      <InlineMath>(s, y)</InlineMath> pairs implicitly capture curvature: "when we moved
                      by <InlineMath>s</InlineMath>, the gradient changed by <InlineMath>y</InlineMath>".
                    </p>
                    <p className="mt-2">
                      The <strong>two-loop recursion</strong> transforms <InlineMath>\nabla f</InlineMath>{' '}
                      into <InlineMath>{'p \\approx -H^{-1}\\nabla f'}</InlineMath> using only these pairs.
                    </p>
                    <p className="mt-2 font-semibold">No Hessian matrix ever computed or stored!</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Key Formula</h3>
                    <p>L-BFGS direction (with damping):</p>
                    <BlockMath>{'p = -(B + \\lambda_{\\text{damp}} I)^{-1}\\nabla f'}</BlockMath>
                    <p className="text-sm mt-2">
                      <strong>Intuition:</strong> <InlineMath>{`B^{-1}`}</InlineMath> is built from recent gradient changes via two-loop recursion,
                      approximating <InlineMath>{`H^{-1}`}</InlineMath>. Adding <InlineMath>{`\\lambda_{\\text{damp}} I`}</InlineMath> to the
                      initial approximation improves numerical stability.
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Implementation:</strong> Damping is applied by modifying the initial scaling factor: <InlineMath>{'\\gamma_{\\text{damped}} = \\gamma/(1 + \\lambda_{\\text{damp}}\\gamma)'}</InlineMath>,
                      which is mathematically equivalent to <InlineMath>{String.raw`(B_0 + \lambda I)^{-1}`}</InlineMath> where <InlineMath>{'B_0 = (1/\\gamma)I'}</InlineMath>.
                    </p>
                    <p className="text-sm mt-1 text-gray-600">
                      (When λ_damp = 0, this is pure L-BFGS: <InlineMath>{'p \\approx -B^{-1}\\nabla f'}</InlineMath>)
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">When to Use</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Large problems (n &gt; 1000 parameters)</li>
                      <li>Memory constrained environments</li>
                      <li>Smooth, differentiable objectives</li>
                      <li>When Newton too expensive, gradient descent too slow</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Key Parameters</h3>
                    <p className="mb-2">
                      <strong>M = memory size</strong> (typically 5-20)
                    </p>
                    <ul className="list-disc ml-6 space-y-1 mb-3">
                      <li>Larger M = better Hessian approximation but more computation</li>
                      <li>M=10 often works well in practice</li>
                    </ul>
                    <p className="mb-2">
                      <strong>Hessian Damping Parameter (λ<sub>damp</sub>)</strong>
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Lower to ~0 to see pure L-BFGS behavior (may be unstable)</li>
                      <li>Default 0.01 provides stability without changing the problem significantly</li>
                      <li>Increase to 0.1+ for very ill-conditioned problems</li>
                    </ul>
                  </div>

                  <div className="bg-amber-100 rounded p-3">
                    <p className="font-bold text-sm">Assumptions:</p>
                    <ul className="text-sm list-disc ml-6">
                      <li>f is differentiable</li>
                      <li>Gradients are Lipschitz continuous (smoothness)</li>
                      <li>Convexity helpful but not required</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* L-BFGS - Line Search Details */}
              <CollapsibleSection
                title="Line Search Details"
                defaultExpanded={false}
                storageKey="lbfgs-line-search-details"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Why Line Search for L-BFGS</h3>
                    <p>
                      Quasi-Newton direction <InlineMath>{'p \\approx -H^{-1}\\nabla f'}</InlineMath> is only
                      an approximation:
                    </p>
                    <ul className="list-disc ml-6 space-y-1 mt-2">
                      <li>
                        <strong>Not guaranteed to be descent direction</strong> if approximation poor
                      </li>
                      <li>
                        <strong>Line search ensures we actually decrease the loss</strong>
                      </li>
                      <li>
                        <strong>Essential for convergence guarantees</strong>
                      </li>
                    </ul>
                    <p className="text-sm mt-2">
                      Without line search, L-BFGS can diverge even on well-behaved problems.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Current Method: Armijo Backtracking</h3>
                    <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
                    <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>c_1 = </InlineMath>{lbfgsC1.toFixed(4)} controls how much decrease we require.
                    </p>

                    <div className="mt-3">
                      <p className="font-semibold">Backtracking Algorithm:</p>
                      <ol className="list-decimal ml-6 space-y-1 text-sm">
                        <li>Start with <InlineMath>\alpha = 1</InlineMath> (try full step first)</li>
                        <li>Check if Armijo condition satisfied</li>
                        <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
                        <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
                      </ol>
                    </div>

                    <p className="text-sm mt-3">
                      <strong>Typical behavior:</strong> When the quasi-Newton approximation is good
                      (near minimum, after building history), <InlineMath>\alpha = 1</InlineMath> is
                      often accepted. When approximation is poor (early iterations, far from minimum),
                      backtracking finds smaller steps.
                    </p>
                  </div>

                  <div className="bg-amber-100 rounded p-3">
                    <p className="font-bold text-sm mb-2">Wolfe Conditions (Advanced)</p>
                    <p className="text-sm">
                      Full BFGS theory requires <strong>Wolfe conditions</strong> (Armijo + curvature
                      condition) to guarantee positive definiteness. This implementation uses Armijo
                      backtracking, which works well in practice for L-BFGS.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* L-BFGS - Try This */}
              <CollapsibleSection
                title="Try This"
                defaultExpanded={true}
                storageKey="lbfgs-try-this"
              >
                <div className="space-y-3">
                  <p className="text-gray-800 mb-4">
                    Run these experiments to see L-BFGS in action and understand how memory affects performance:
                  </p>

                  <div className="space-y-3">
                    <div className="border border-amber-200 rounded p-3 bg-amber-50">
                      <div className="flex items-start gap-2">
                        <button
                          className="text-amber-600 font-bold text-lg hover:text-amber-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`"
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('lbfgs');
                            const exp = experiments.find(e => e.id === 'lbfgs-success-quadratic');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Success - Strongly Convex Problem"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-amber-900">Success: Strongly Convex Problem</p>
                          <p className="text-sm text-gray-700">
                            Fast Newton-like convergence without computing Hessian
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Memory pairs build curvature info, converges similar to Newton
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-blue-200 rounded p-3 bg-blue-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-blue-600 font-bold text-lg hover:text-blue-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('lbfgs');
                            const exp = experiments.find(e => e.id === 'lbfgs-memory-comparison');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Memory Matters - M=3 vs M=10"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-blue-900">Memory Matters: M=3 vs M=10</p>
                          <p className="text-sm text-gray-700">
                            Compare different memory sizes on ill-conditioned problem
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: M=3 needs more iterations, M=10 converges faster (try both!)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-purple-200 rounded p-3 bg-purple-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-purple-600 font-bold text-lg hover:text-purple-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('lbfgs');
                            const exp = experiments.find(e => e.id === 'lbfgs-rosenbrock');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Challenge - Rosenbrock Valley"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-purple-900">Challenge: Rosenbrock Valley</p>
                          <p className="text-sm text-gray-700">
                            Non-convex problem tests quasi-Newton approximation quality
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Superlinear convergence once memory captures valley curvature
                          </p>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              </CollapsibleSection>

              {/* L-BFGS - When Things Go Wrong */}
              <CollapsibleSection
                title="When Things Go Wrong"
                defaultExpanded={false}
                storageKey="lbfgs-when-wrong"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold">❌ "L-BFGS is always better than gradient descent"</p>
                        <p className="text-sm ml-6">
                          ✓ Requires smooth objectives and good line search<br/>
                          ✓ Can fail on non-smooth problems (L1 regularization, ReLU, kinks)<br/>
                          ✓ More complex to implement and debug
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "L-BFGS equals Newton's method"</p>
                        <p className="text-sm ml-6">
                          ✓ Only approximates Newton direction<br/>
                          ✓ Approximation quality depends on M and problem structure<br/>
                          ✓ Superlinear vs quadratic convergence
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">❌ "More memory (larger M) is always better"</p>
                        <p className="text-sm ml-6">
                          ✓ Diminishing returns: M=5-20 usually sufficient<br/>
                          ✓ Larger M = more computation per iteration<br/>
                          ✓ Very old pairs may contain stale curvature information
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
                    <ul className="space-y-2">
                      <li>
                        <strong>Strongly convex:</strong> Superlinear convergence guaranteed
                        (between linear GD and quadratic Newton)
                      </li>
                      <li>
                        <strong>Convex:</strong> Converges to global minimum
                      </li>
                      <li>
                        <strong>Non-convex:</strong> Can converge to local minima, no global
                        guarantees (like all local methods)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Instability / Erratic steps</strong> → increase Hessian damping (λ_damp) to 0.1 or higher
                      </li>
                      <li>
                        <strong>Slow convergence</strong> → increase M for better Hessian approximation, or λ_damp too high (try lowering toward 0.01)
                      </li>
                      <li>
                        <strong>Oscillation</strong> → decrease M or line search c1 parameter
                      </li>
                      <li>
                        <strong>Memory issues</strong> → M too large for hardware, decrease M
                      </li>
                      <li>
                        <strong>Numerical issues</strong> → Hessian approximation ill-conditioned, increase λ_damp or restart with fresh memory
                      </li>
                      <li>
                        <strong>Non-smooth objective</strong> → consider specialized variants
                        (OWL-QN for L1) or smoothing techniques
                      </li>
                      <li>
                        <strong>Stale curvature</strong> → problem landscape changes dramatically,
                        consider restarting with fresh memory
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-100 rounded p-3">
                    <p className="font-bold text-sm mb-2">When to Switch Algorithms</p>
                    <ul className="text-sm list-disc ml-6">
                      <li>Problem too small (n &lt; 100) → consider full BFGS or Newton</li>
                      <li>Non-smooth objective → use subgradient methods or specialized variants</li>
                      <li>Stochastic setting (mini-batches) → use stochastic variants or Adam</li>
                      <li>Need exact second-order convergence → use Newton's method</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* L-BFGS - Mathematical Derivations */}
              <CollapsibleSection
                title="Mathematical Derivations"
                defaultExpanded={false}
                storageKey="lbfgs-math-derivations"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Secant Equation</h3>
                    <p>Newton uses: <InlineMath>Hp = -\nabla f</InlineMath> (exact)</p>
                    <p className="mt-2">Quasi-Newton: approximate H or H⁻¹ from gradients</p>
                    <p className="mt-2"><strong>Key insight:</strong></p>
                    <BlockMath>{String.raw`y_k = \nabla f_{k+1} - \nabla f_k \approx H s_k`}</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>{String.raw`s_k = w_{k+1} - w_k`}</InlineMath> (parameter change)
                    </p>
                    <p className="text-sm mt-2">
                      This <strong>secant equation</strong> relates gradient changes to parameter
                      changes via approximate Hessian.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">BFGS Update Formula</h3>
                    <p>Start with approximation <InlineMath>B_k \approx H</InlineMath></p>
                    <p className="mt-2">
                      Update to <InlineMath>{String.raw`B_{k+1}`}</InlineMath> satisfying secant equation:
                    </p>
                    <BlockMath>{String.raw`B_{k+1}s_k = y_k`}</BlockMath>
                    <p className="mt-2"><strong>BFGS formula:</strong></p>
                    <BlockMath>
                      {String.raw`B_{k+1} = B_k - \frac{B_k s_k s_k^T B_k}{ s_k^T B_k s_k} + \frac{y_k y_k^T}{ y_k^T s_k}`}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      Maintains positive definiteness if <InlineMath>{`y_k^T s_k > 0`}</InlineMath>
                      (guaranteed by Wolfe line search).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Why Limited Memory?</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Full BFGS:</strong> stores <InlineMath>B_k</InlineMath> (n×n matrix)
                        → O(n²) memory
                      </li>
                      <li>
                        <strong>L-BFGS:</strong> don't store <InlineMath>B_k</InlineMath>, instead
                        store M recent <InlineMath>(s,y)</InlineMath> pairs → O(Mn) memory
                      </li>
                      <li>
                        Implicitly represent <InlineMath>{String.raw`B_k^{-1}`}</InlineMath> via two-loop recursion
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Two-Loop Recursion</h3>
                    <p className="mb-2">
                      <strong>Given:</strong> M pairs <InlineMath>(s_i, y_i)</InlineMath> and
                      gradient <InlineMath>q = \nabla f</InlineMath>
                    </p>
                    <p className="mb-2">
                      <strong>Goal:</strong> compute <InlineMath>{String.raw`p = B_k^{-1} q \approx -H^{-1}\nabla f`}</InlineMath>
                    </p>

                    <div className="bg-indigo-50 rounded p-3 mt-3">
                      <p className="font-semibold mb-2">Backward Loop (i = k-1, k-2, ..., k-M):</p>
                      <div className="text-sm font-mono space-y-1">
                        <div><InlineMath>{String.raw`\rho_i = 1/(y_i^T s_i)`}</InlineMath></div>
                        <div><InlineMath>{String.raw`\alpha_i = \rho_i s_i^T q`}</InlineMath></div>
                        <div><InlineMath>{String.raw`q \leftarrow q - \alpha_i y_i`}</InlineMath></div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 rounded p-3 mt-3">
                      <p className="font-semibold mb-2">Initialize (with Hessian Damping):</p>
                      <div className="text-sm space-y-1">
                        <div>
                          <InlineMath>{String.raw`\gamma_{\text{base}} = s_{k-1}^T y_{k-1} / y_{k-1}^T y_{k-1}`}</InlineMath>
                        </div>
                        <div>
                          <InlineMath>{String.raw`\gamma = \gamma_{\text{base}} / (1 + \lambda_{\text{damp}} \cdot \gamma_{\text{base}})`}</InlineMath> (damped)
                        </div>
                        <div>
                          <InlineMath>{String.raw`r = \gamma I \cdot q = \gamma q`}</InlineMath> where{' '}
                          <InlineMath>{String.raw`H_0^{-1} = \gamma I`}</InlineMath>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          When λ<sub>damp</sub> = 0, this reduces to <InlineMath>{String.raw`\gamma = \gamma_{\text{base}}`}</InlineMath> (pure L-BFGS)
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 rounded p-3 mt-3">
                      <p className="font-semibold mb-2">Forward Loop (i = k-M, k-M+1, ..., k-1):</p>
                      <div className="text-sm font-mono space-y-1">
                        <div><InlineMath>{String.raw`\beta = \rho_i y_i^T r`}</InlineMath></div>
                        <div><InlineMath>{String.raw`r \leftarrow r + s_i (\alpha_i - \beta)`}</InlineMath></div>
                      </div>
                    </div>

                    <p className="mt-3">
                      <strong>Result:</strong> <InlineMath>{String.raw`p = r \approx -H^{-1}\nabla f`}</InlineMath>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Why It Works</h3>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li>Each (s,y) pair represents one rank-2 update to Hessian approximation</li>
                      <li>
                        Two-loop recursion applies these updates implicitly without forming{' '}
                        <InlineMath>B_k</InlineMath>
                      </li>
                      <li>
                        Mathematically equivalent to full BFGS but O(Mn) instead of O(n²)
                      </li>
                      <li>Clever matrix algebra exploits structure of BFGS update</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
                    <p><strong>Superlinear convergence:</strong></p>
                    <BlockMath>{String.raw`\lim_{k \to \infty} \frac{\|e_{k+1}\|}{\|e_k\|} = 0`}</BlockMath>
                    <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
                      <li>Faster than linear (GD) but slower than quadratic (Newton)</li>
                      <li>Depends on M: larger M → closer to Newton rate</li>
                      <li>In practice: M=10 often sufficient for near-Newton performance</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Advanced Topics"
                defaultExpanded={false}
                storageKey="lbfgs-advanced"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Gradient computation:</strong> O(n) to O(n²) depending on problem
                      </li>
                      <li>
                        <strong>Two-loop recursion:</strong> O(Mn) operations
                      </li>
                      <li>
                        <strong>Line search:</strong> multiple gradient evaluations
                      </li>
                      <li>
                        <strong>Total per iteration:</strong> O(Mn) time, O(Mn) memory
                      </li>
                    </ul>
                    <p className="text-sm mt-2 italic">
                      <strong>Example:</strong> For n=1000, M=10: ~10,000 operations vs
                      ~1 billion for Newton's method
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Memory-Computation Tradeoff</h3>
                    <p className="mb-2"><strong>M selection guidelines:</strong></p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>M=3-5:</strong> minimal memory, acceptable for well-conditioned problems</li>
                      <li><strong>M=5-10:</strong> good balance for most problems (recommended)</li>
                      <li><strong>M=10-20:</strong> better approximation, higher cost</li>
                      <li><strong>M&gt;50:</strong> rarely beneficial, diminishing returns</li>
                    </ul>
                    <p className="text-sm mt-2">
                      <strong>Problem-dependent:</strong> Ill-conditioned problems benefit from larger M
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Full BFGS vs L-BFGS</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border">
                        <thead className="bg-purple-100">
                          <tr>
                            <th className="border p-2">Method</th>
                            <th className="border p-2">Memory</th>
                            <th className="border p-2">Update Cost</th>
                            <th className="border p-2">Best For</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2"><strong>BFGS</strong></td>
                            <td className="border p-2">O(n²)</td>
                            <td className="border p-2">O(n²)</td>
                            <td className="border p-2">n &lt; 100</td>
                          </tr>
                          <tr>
                            <td className="border p-2"><strong>L-BFGS</strong></td>
                            <td className="border p-2">O(Mn)</td>
                            <td className="border p-2">O(Mn)</td>
                            <td className="border p-2">n &gt; 100</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Why Two-Loop Recursion is Efficient</h3>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li>
                        Avoids forming explicit matrix <InlineMath>B_k</InlineMath> or{' '}
                        <InlineMath>{String.raw`B_k^{-1}`}</InlineMath>
                      </li>
                      <li>
                        Implicit representation via <InlineMath>(s,y)</InlineMath> pairs
                      </li>
                      <li>Applies rank-2 updates in sequence</li>
                      <li>Exploits structure of BFGS update formula (Sherman-Morrison-Woodbury)</li>
                      <li>Cache-friendly: sequential access to small vectors</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Relationship to Conjugate Gradient</h3>
                    <p className="mb-2">Both use history to improve search directions:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Conjugate Gradient:</strong> uses gradient history to build
                        conjugate directions
                      </li>
                      <li>
                        <strong>L-BFGS:</strong> uses <InlineMath>(s,y)</InlineMath> history to
                        approximate <InlineMath>{String.raw`H^{-1}`}</InlineMath>
                      </li>
                      <li>
                        <strong>For quadratics:</strong> CG converges in at most n steps
                      </li>
                      <li>
                        <strong>For non-quadratic:</strong> L-BFGS more robust and practical
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Modified L-BFGS Methods</h3>

                    <div className="mt-2">
                      <p className="font-semibold">Hessian Damping (Levenberg-Marquardt style):</p>
                      <BlockMath>{'p = -(B + \\lambda I)^{-1}\\nabla f'}</BlockMath>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>Regularizes the initial Hessian approximation <InlineMath>{'B_0 = (1/\\gamma)I'}</InlineMath></li>
                        <li>Implemented as: <InlineMath>{'\\gamma_{\\text{damped}} = \\gamma/(1 + \\lambda\\gamma)'}</InlineMath></li>
                        <li><InlineMath>\lambda=0</InlineMath>: pure L-BFGS; <InlineMath>\lambda\to\infty</InlineMath>: gradient descent</li>
                        <li>Exact analog to Newton's Hessian damping, applied to approximate Hessian</li>
                        <li>Improves numerical stability without changing the problem significantly (λ ≈ 0.01)</li>
                      </ul>
                    </div>

                    <div className="mt-3">
                      <p className="font-semibold">Powell's Damping:</p>
                      <p className="text-sm">Modifies gradient differences to ensure positive curvature condition</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Extensions and Variants</h3>

                    <div className="space-y-2 mt-2">
                      <div>
                        <p className="font-semibold">OWL-QN (Orthant-Wise Limited-memory Quasi-Newton)</p>
                        <p className="text-sm ml-4">
                          L-BFGS for L1-regularized problems, handles non-smoothness at zero
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Stochastic L-BFGS</p>
                        <p className="text-sm ml-4">
                          Mini-batch variants for large datasets, stabilization techniques needed
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Block L-BFGS</p>
                        <p className="text-sm ml-4">
                          Exploits problem structure (e.g., layers in neural networks)
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">L-BFGS-B</p>
                        <p className="text-sm ml-4">
                          Extension to bound-constrained optimization (box constraints)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-100 rounded p-3">
                    <p className="font-bold text-sm mb-2">Historical Note</p>
                    <p className="text-sm">
                      L-BFGS was developed by Jorge Nocedal in 1980. The "L" stands for
                      "Limited-memory". It's one of the most widely used optimization algorithms
                      in practice, powering everything from machine learning libraries to
                      engineering simulation software.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* L-BFGS Memory Section */}
              <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-4">L-BFGS Memory</h2>
                <div className="space-y-3 text-gray-800 mb-4">
                  <p><strong>What it is:</strong> Instead of storing the full Hessian H (n×n matrix), we store only M={lbfgsM} recent (s, y) pairs.</p>
                  <p><strong>s</strong> = parameter change = <InlineMath>{String.raw`w_{\text{new}} - w_{\text{old}}`}</InlineMath> (where we moved)</p>
                  <p><strong>y</strong> = gradient change = <InlineMath>{String.raw`\nabla f_{\text{new}} - \nabla f_{\text{old}}`}</InlineMath> (how the slope changed)</p>
                  <p><strong>Why it works:</strong> These pairs implicitly capture curvature: "when we moved in direction s, the gradient changed by y". This is enough to approximate H⁻¹!</p>
                </div>

                {lbfgsIterations[lbfgsCurrentIter]?.memory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
                      <thead className="bg-amber-200">
                        <tr>
                          <th className="px-4 py-2 text-left">Pair</th>
                          <th className="px-4 py-2 text-left">s (parameter change)</th>
                          <th className="px-4 py-2 text-left">y (gradient change)</th>
                          <th className="px-4 py-2 text-left">sᵀy</th>
                          <th className="px-4 py-2 text-left">ρ = 1/(sᵀy)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lbfgsIterations[lbfgsCurrentIter].memory.map((mem, idx) => (
                          <tr key={idx} className="border-t border-amber-200">
                            <td className="px-4 py-2 font-mono">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono">{fmtVec(mem.s)}</td>
                            <td className="px-4 py-2 font-mono">{fmtVec(mem.y)}</td>
                            <td className="px-4 py-2 font-mono">{fmt(1 / mem.rho)}</td>
                            <td className="px-4 py-2 font-mono">{fmt(mem.rho)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-lg p-6 text-center">
                    <p className="text-amber-800 font-semibold">No memory pairs yet (Iteration 0)</p>
                    <p className="text-sm text-amber-700 mt-2">Memory will be populated starting from iteration 1. First iteration uses steepest descent direction.</p>
                  </div>
                )}
              </div>

              {/* Two-Loop Recursion */}
              <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-indigo-900 mb-4">Two-Loop Recursion Details</h2>
                <div className="space-y-3 text-gray-800 mb-4">
                  <p><strong>Goal:</strong> Compute p ≈ -H⁻¹∇f using only the stored (s, y) pairs.</p>
                  <p><strong>Intuition:</strong> Transform the gradient by "undoing" the effect of past updates (first loop), scale by typical curvature, then "redo" them with corrections (second loop).</p>
                  <p><strong>Efficiency:</strong> O(m·n) = O({lbfgsM}·3) = {lbfgsM * 3} operations vs O(n³) = O(27) for full Hessian inversion!</p>
                </div>

                {lbfgsIterations[lbfgsCurrentIter]?.twoLoopData ? (
                  <>
                    <h3 className="text-xl font-bold text-indigo-800 mb-3">First Loop (Backward Pass)</h3>
                    <p className="text-gray-800 mb-3">Start with q = ∇f. For each stored pair (newest to oldest), remove its effect on the gradient.</p>
                    <div className="overflow-x-auto mb-6">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
                      <thead className="bg-indigo-200">
                        <tr>
                          <th className="px-4 py-2 text-left">i</th>
                          <th className="px-4 py-2 text-left">ρᵢ</th>
                          <th className="px-4 py-2 text-left">sᵢᵀq</th>
                          <th className="px-4 py-2 text-left bg-yellow-100">αᵢ = ρᵢ(sᵢᵀq)</th>
                          <th className="px-4 py-2 text-left">q after update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lbfgsIterations[lbfgsCurrentIter].twoLoopData!.firstLoop.map((row, idx) => (
                          <tr key={idx} className="border-t border-indigo-200">
                            <td className="px-4 py-2 font-mono">{row.i}</td>
                            <td className="px-4 py-2 font-mono">{fmt(row.rho)}</td>
                            <td className="px-4 py-2 font-mono">{fmt(row.sTq)}</td>
                            <td className="px-4 py-2 font-mono bg-yellow-50">{fmt(row.alpha)}</td>
                            <td className="px-4 py-2 font-mono">{fmtVec(row.q)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-indigo-200 rounded p-4 mb-6">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Initial Hessian Scaling</h3>
                    <p className="font-mono">γ = (sₘᵀyₘ)/(yₘᵀyₘ) = {fmt(lbfgsIterations[lbfgsCurrentIter].twoLoopData!.gamma)}</p>
                    <p className="mt-2">r = γq. This estimates typical curvature from the most recent pair.</p>
                  </div>

                  <h3 className="text-xl font-bold text-indigo-800 mb-3">Second Loop (Forward Pass)</h3>
                  <p className="text-gray-800 mb-3">Now apply corrections by adding back scaled parameter changes.</p>
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
                      <thead className="bg-indigo-200">
                        <tr>
                          <th className="px-4 py-2 text-left">i</th>
                          <th className="px-4 py-2 text-left">yᵢᵀr</th>
                          <th className="px-4 py-2 text-left">β = ρᵢ(yᵢᵀr)</th>
                          <th className="px-4 py-2 text-left bg-green-100">αᵢ - β</th>
                          <th className="px-4 py-2 text-left">r after update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lbfgsIterations[lbfgsCurrentIter].twoLoopData!.secondLoop.map((row, idx) => (
                          <tr key={idx} className="border-t border-indigo-200">
                            <td className="px-4 py-2 font-mono">{row.i}</td>
                            <td className="px-4 py-2 font-mono">{fmt(row.yTr)}</td>
                            <td className="px-4 py-2 font-mono">{fmt(row.beta)}</td>
                            <td className="px-4 py-2 font-mono bg-green-50">{fmt(row.correction)}</td>
                            <td className="px-4 py-2 font-mono">{fmtVec(row.r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-indigo-200 rounded p-4">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Final Direction</h3>
                    <p><strong>p = -r = {fmtVec(lbfgsIterations[lbfgsCurrentIter].direction)}</strong></p>
                    <p className="text-sm mt-2">This is our Newton-like direction that accounts for curvature!</p>
                  </div>
                  </>
                ) : (
                  <div className="bg-indigo-50 rounded-lg p-6 text-center">
                    <p className="text-indigo-800 font-semibold">Two-loop recursion not used yet (Iteration 0)</p>
                    <p className="text-sm text-indigo-700 mt-2">Starting from iteration 1, this section will show the two-loop algorithm that computes the search direction using stored memory pairs.</p>
                  </div>
                )}
              </div>
            </>
          ) : selectedTab === 'diagonal-precond' ? (
            <>
              {/* Diagonal Preconditioner Tab Content */}
              <div className="space-y-4">
      {/* 1. Configuration Section */}
              <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
                <AlgorithmConfiguration
                  algorithm="diagonal-precond"
                  maxIter={maxIter}
                  onMaxIterChange={setMaxIter}
                  initialW0={initialW0}
                  onInitialW0Change={setInitialW0}
                  initialW1={initialW1}
                  onInitialW1Change={setInitialW1}
                  diagPrecondLineSearch={diagPrecondLineSearch}
                  onDiagPrecondLineSearchChange={setDiagPrecondLineSearch}
                  diagPrecondC1={diagPrecondC1}
                  onDiagPrecondC1Change={setDiagPrecondC1}
                  diagPrecondHessianDamping={diagPrecondHessianDamping}
                  onDiagPrecondHessianDampingChange={setDiagPrecondHessianDamping}
                  diagPrecondTolerance={diagPrecondTolerance}
                  onDiagPrecondToleranceChange={setDiagPrecondTolerance}
                  diagPrecondFtol={diagPrecondFtol}
                  onDiagPrecondFtolChange={setDiagPrecondFtol}
                  diagPrecondXtol={diagPrecondXtol}
                  onDiagPrecondXtolChange={setDiagPrecondXtol}
                  problemFuncs={problemFuncs}
                  problem={problem}
                  currentProblem={currentProblem}
                  bounds={bounds}
                  biasSlice={biasSlice}
                />
              </CollapsibleSection>
              {/* 2. Playback Section */}
              {(
                <IterationPlayback
                  currentIter={diagPrecondCurrentIter}
                  totalIters={diagPrecondIterations.length}
                  onIterChange={setDiagPrecondCurrentIter}
                  onReset={() => setDiagPrecondCurrentIter(0)}
                />
              )}

              {/* 3. Side-by-Side: Canvas + Metrics */}
              <div className="flex gap-4 mb-6">
                {/* Left: Parameter Space Visualization */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape. Orange path = trajectory. Red dot = current position.
                  </p>

                  {/* 2D slice notation for 3D problems */}
                  {(currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && logisticGlobalMin && logisticGlobalMin.length >= 3 && (
                    <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                      <span className="font-medium">2D slice:</span> w₂ = {(logisticGlobalMin[2] ?? 0).toFixed(3)} (bias from optimal solution)
                    </div>
                  )}

                  <canvas ref={diagPrecondParamCanvasRef} style={{width: '100%', height: '500px'}} className="border border-gray-300 rounded" />

                  {/* Legend for optimum markers */}
                  {currentProblem !== 'logistic-regression' && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-700">
                      {(() => {
                        const problem = getProblem(currentProblem);
                        if (!problem) return null;
                        return (
                          <>
                            {problem.globalMinimum && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">★</span>
                                <span>Global minimum</span>
                              </div>
                            )}
                            {problem.criticalPoint && (
                              <div className="flex items-center gap-2">
                                <span className="text-xl">☆</span>
                                <span>Critical point (saddle)</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right: Metrics Column */}
                {diagPrecondIterations.length > 0 && diagPrecondIterations[diagPrecondCurrentIter] && (
                  <div className="w-80 bg-white rounded-lg shadow-md p-4">
                    <IterationMetrics
                      algorithm="diagonal-precond"
                      iterNum={diagPrecondCurrentIter}
                      totalIters={diagPrecondIterations.length}
                      loss={diagPrecondIterations[diagPrecondCurrentIter].newLoss}
                      gradNorm={diagPrecondIterations[diagPrecondCurrentIter].gradNorm}
                      weights={diagPrecondIterations[diagPrecondCurrentIter].wNew}
                      alpha={diagPrecondIterations[diagPrecondCurrentIter].alpha ?? 1.0}
                      gradient={diagPrecondIterations[diagPrecondCurrentIter].grad}
                      direction={diagPrecondIterations[diagPrecondCurrentIter].direction}
                      gradNormHistory={diagPrecondIterations.map(iter => iter.gradNorm)}
                      lossHistory={diagPrecondIterations.map(iter => iter.newLoss)}
                      alphaHistory={diagPrecondIterations.map(iter => iter.alpha ?? 1.0)}
                      weightsHistory={diagPrecondIterations.map(iter => iter.wNew)}
                      hessianDiagonal={diagPrecondIterations[diagPrecondCurrentIter].hessianDiagonal}
                      preconditioner={diagPrecondIterations[diagPrecondCurrentIter].preconditioner}
                      lineSearchTrials={diagPrecondIterations[diagPrecondCurrentIter].lineSearchTrials?.length}
                      lineSearchCanvasRef={diagPrecondLineSearch !== 'none' ? diagPrecondLineSearchCanvasRef : undefined}
                      tolerance={diagPrecondTolerance}
                      ftol={diagPrecondFtol}
                      xtol={diagPrecondXtol}
                      summary={diagPrecondSummary}
                      onIterationChange={setDiagPrecondCurrentIter}
                    />
                  </div>
                )}
              </div>

              {/* Quick Start */}
              <CollapsibleSection
                title="Quick Start"
                defaultExpanded={true}
                storageKey="diagonal-precond-quick-start"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">The Core Idea</h3>
                    <p>
                      Instead of using one step size for all directions (gradient descent) or computing
                      the full inverse Hessian (Newton), use just the <strong>diagonal</strong> of the
                      Hessian to get per-coordinate step sizes.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">The Algorithm</h3>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
                      <li>Compute Hessian <InlineMath>H(w)</InlineMath> (matrix of second derivatives)</li>
                      <li>Extract diagonal: <InlineMath>{'d_i = H_{ii}'}</InlineMath> for each coordinate</li>
                      <li>
                        Build diagonal preconditioner:{' '}
                        <InlineMath>{'D = \\text{diag}(1/(H_{00}+\\lambda_{\\text{damp}}), 1/(H_{11}+\\lambda_{\\text{damp}}), ...)'}</InlineMath>
                      </li>
                      <li>Compute preconditioned direction: <InlineMath>{'p = -D \\cdot \\nabla f'}</InlineMath></li>
                      <li>Take step: <InlineMath>{'w \\leftarrow w + \\alpha p'}</InlineMath> (α=1 or from line search)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Key Formula</h3>
                    <p>Update rule with diagonal preconditioning:</p>
                    <BlockMath>{'w_{\\text{new}} = w_{\\text{old}} - D \\cdot \\nabla f(w_{\\text{old}})'}</BlockMath>
                    <p className="text-sm mt-2">
                      Where <InlineMath>{'D = \\text{diag}(1/H_{00}, 1/H_{11}, ...)'}</InlineMath> gives different
                      step sizes per coordinate based on local curvature.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">When It Works (And When It Doesn't)</h3>
                    <div className="space-y-2">
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="font-semibold text-green-900">✓ Perfect on axis-aligned problems</p>
                        <p className="text-sm text-gray-700">
                          When the Hessian is diagonal (e.g., <InlineMath>f(x,y) = x^2 + 100y^2</InlineMath>),
                          our diagonal preconditioner <InlineMath>{`D = H^{-1}`}</InlineMath> exactly! Converges in
                          1-2 iterations like Newton's method.
                        </p>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="font-semibold text-red-900">✗ Struggles on rotated problems</p>
                        <p className="text-sm text-gray-700">
                          When Hessian has large off-diagonal terms (e.g., rotated ellipse), diagonal
                          approximation misses critical coupling between coordinates. Takes many iterations
                          and zig-zags like gradient descent.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Computational Cost</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>Per iteration:</strong> O(n²) to compute Hessian, O(n) for diagonal extraction</li>
                      <li><strong>Memory:</strong> O(n²) for Hessian, O(n) for diagonal</li>
                      <li><strong>Cheaper than Newton:</strong> No matrix inversion (O(n³)), just element-wise division</li>
                      <li><strong>More expensive than GD:</strong> Requires Hessian computation</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Parameters</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <strong>Hessian damping (λ<sub>damp</sub>):</strong> Numerical stability term prevents division by zero. Increase if you see instability.
                      </li>
                      <li>
                        <strong>Line Search:</strong> Optional Armijo backtracking. Use for robustness on
                        non-quadratic problems. Disable (α=1) for pure diagonal Newton step on quadratics.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-100 rounded p-3">
                    <p className="font-bold text-sm">Key Insight:</p>
                    <p className="text-sm">
                      Diagonal preconditioning is the simplest second-order method. It captures
                      per-coordinate curvature but ignores coupling. Think of it as "Newton's method
                      if the world were axis-aligned."
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Why Diagonal Fails on Rotation */}
              <CollapsibleSection
                title="Why Diagonal Preconditioner Fails on Rotated Problems"
                defaultExpanded={true}
                storageKey="diagonal-precond-rotation-failure"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">The Problem: Off-Diagonal Terms</h3>
                    <p>
                      A diagonal preconditioner only uses the main diagonal of the Hessian matrix and
                      completely ignores the off-diagonal terms. This works when the Hessian is diagonal
                      (or nearly diagonal), but fails when coordinates are coupled.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Example: Axis-Aligned vs Rotated</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-green-300 rounded p-3 bg-green-50">
                        <p className="font-semibold text-green-900 mb-2">✓ Axis-Aligned (Perfect)</p>
                        <p className="text-sm mb-2">Function: <InlineMath>f(x,y) = x^2 + 100y^2</InlineMath></p>
                        <p className="text-sm mb-2">Hessian:</p>
                        <BlockMath>{String.raw`H = \begin{bmatrix} 2 & 0 \\ 0 & 200 \end{bmatrix}`}</BlockMath>
                        <p className="text-sm mt-2">
                          Diagonal preconditioner: <InlineMath>{'D = \\text{diag}(1/2, 1/200)'}</InlineMath>
                        </p>
                        <p className="text-sm mt-2 font-semibold">
                          Result: <InlineMath>{`D = H^{-1}`}</InlineMath> exactly! Converges immediately.
                        </p>
                      </div>

                      <div className="border border-red-300 rounded p-3 bg-red-50">
                        <p className="font-semibold text-red-900 mb-2">✗ Rotated 45° (Fails)</p>
                        <p className="text-sm mb-2">Function: <InlineMath>f(u,v) = u^2 + 100v^2</InlineMath></p>
                        <p className="text-sm mb-2">In (x,y) coordinates after rotation:</p>
                        <BlockMath>{String.raw`H = \begin{bmatrix} 51 & 49 \\ 49 & 51 \end{bmatrix}`}</BlockMath>
                        <p className="text-sm mt-2">
                          Diagonal preconditioner: <InlineMath>{'D \\approx \\text{diag}(1/51, 1/51)'}</InlineMath>
                        </p>
                        <p className="text-sm mt-2 font-semibold text-red-900">
                          Result: Ignores off-diagonal 49! Wrong scaling, many iterations.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-100 rounded p-4">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">The Mathematical Issue</h3>
                    <p className="mb-2">
                      The inverse of a matrix is NOT just the inverse of its diagonal:
                    </p>
                    <BlockMath>
                      {'H^{-1} \\neq \\text{diag}(1/H_{00}, 1/H_{11}, ...)'}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      When H has large off-diagonal terms, computing only the diagonal gives a poor
                      approximation to <InlineMath>{`H^{-1}`}</InlineMath>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">What Newton's Method Does Better</h3>
                    <p className="mb-2">
                      Newton's method computes the full matrix inverse <InlineMath>{`H^{-1}`}</InlineMath>,
                      which properly handles:
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li>Coupling between coordinates (off-diagonal terms)</li>
                      <li>Rotation of the coordinate system</li>
                      <li>Both scaling AND rotation of the step direction</li>
                    </ul>
                    <p className="text-sm mt-3">
                      <strong>Cost tradeoff:</strong> Newton needs O(n³) for matrix inversion vs O(n²) for
                      Hessian computation + O(n) for diagonal extraction in diagonal preconditioning.
                    </p>
                  </div>

                  <div className="bg-teal-100 rounded p-3">
                    <p className="font-bold text-sm mb-2">Key Takeaway:</p>
                    <p className="text-sm">
                      Use diagonal preconditioning when you know the problem is axis-aligned or when you
                      need something cheaper than Newton but better than gradient descent. Use Newton's
                      method when you need rotation invariance and can afford the O(n³) cost.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Try This */}
              <CollapsibleSection
                title="Try This"
                defaultExpanded={true}
                storageKey="diagonal-precond-try-this"
              >
                <div className="space-y-3">
                  <p className="text-gray-800 mb-4">
                    Run these experiments to see when diagonal preconditioning excels and when it struggles:
                  </p>

                  <div className="space-y-3">
                    {/* Success: Axis-Aligned */}
                    <div className="border border-green-200 rounded p-3 bg-green-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-green-600 font-bold text-lg hover:text-green-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('diagonal-precond');
                            const exp = experiments.find(e => e.id === 'diag-precond-aligned-success');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Success - Aligned with Axes"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-green-900">Success: Aligned with Axes</p>
                          <p className="text-sm text-gray-700">
                            Ill-conditioned quadratic aligned with axes - diagonal preconditioner is perfect!
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Converges in 1-2 iterations! D perfectly inverts diagonal Hessian
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Failure: Rotated */}
                    <div className="border border-red-200 rounded p-3 bg-red-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-red-600 font-bold text-lg hover:text-red-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('diagonal-precond');
                            const exp = experiments.find(e => e.id === 'diag-precond-rotated-failure');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Failure - Rotated Problem"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-red-900">Failure: Rotated Problem</p>
                          <p className="text-sm text-gray-700">
                            Same problem rotated 45° - diagonal preconditioner struggles!
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Takes 40+ iterations! Off-diagonal Hessian terms ignored
                          </p>
                        </div>
                      </div>
                    </div>



                    {/* Demo: Circular Bowl */}
                    <div className="border border-gray-200 rounded p-3 bg-gray-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-gray-600 font-bold text-lg hover:text-gray-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('diagonal-precond');
                            const exp = experiments.find(e => e.id === 'diag-precond-circular');
                            if (exp) loadExperiment(exp);
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Circular Bowl Demo"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-gray-900">Demo: Circular Bowl (No Rotation Dependence)</p>
                          <p className="text-sm text-gray-700">
                            Circular problem (κ=1) has no preferred direction
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Even diagonal works well - all methods converge similarly
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
              </div>
            </>
          ) : null}
            </>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default UnifiedVisualizer;
