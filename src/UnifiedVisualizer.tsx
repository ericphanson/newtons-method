import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAlgorithmIterations } from './hooks/useAlgorithmIterations';
import {
  DataPoint,
  generateCrescents,
  setupCanvas,
} from './shared-utils';
import {
  logisticObjective,
  logisticGradient,
  logisticHessian
} from './utils/logisticRegression';
import { runNewton } from './algorithms/newton';
import { runLBFGS } from './algorithms/lbfgs';
import { runGradientDescent } from './algorithms/gradient-descent';
import { runGradientDescentLineSearch } from './algorithms/gradient-descent-linesearch';
import { runDiagonalPreconditioner } from './algorithms/diagonal-preconditioner';
import { problemToProblemFunctions, logisticRegressionToProblemFunctions, separatingHyperplaneToProblemFunctions } from './utils/problemAdapter';
import type { ProblemFunctions } from './algorithms/types';
import { SeparatingHyperplaneVariant } from './types/experiments';
import { isDatasetProblem, constructInitialPoint } from './utils/problemHelpers';
import { Toast } from './components/Toast';
import { ProblemConfiguration } from './components/ProblemConfiguration';
import { AlgorithmExplainer } from './components/AlgorithmExplainer';
import { drawHeatmap, drawContours, drawOptimumMarkers, drawAxes, drawColorbar } from './utils/contourDrawing';
import { getProblem, resolveProblem } from './problems';
import type { ExperimentPreset } from './types/experiments';
import { getAlgorithmDisplayName } from './utils/algorithmNames';
import { GdFixedTab } from './components/tabs/GdFixedTab';
import { GdLineSearchTab } from './components/tabs/GdLineSearchTab';
import { NewtonTab } from './components/tabs/NewtonTab';
import { LbfgsTab } from './components/tabs/LbfgsTab';
import { DiagonalPrecondTab } from './components/tabs/DiagonalPrecondTab';
import { StoriesPage } from './components/StoriesPage';
import { StoryBanner } from './components/StoryBanner';
import { StoryTOC } from './components/StoryTOC';
import { getStory } from './stories';
import { getExperimentById } from './experiments';

type Algorithm = 'stories' | 'algorithms' | 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';

const UnifiedVisualizer = () => {
  // Shared state
  const [baseData] = useState(() => generateCrescents());
  const [customPoints, setCustomPoints] = useState<DataPoint[]>([]);
  const [lambda, setLambda] = useState(0.0001);
  const [bias, setBias] = useState<number>(0);

  // Unified parameter state
  const [problemParameters, setProblemParameters] = useState<Record<string, number | string>>({});

  const [separatingHyperplaneVariant, setSeparatingHyperplaneVariant] =
    useState<SeparatingHyperplaneVariant>('soft-margin');
  const [addPointMode, setAddPointMode] = useState<0 | 1 | 2>(0);
  const [selectedTab, setSelectedTab] = useState<Algorithm>(() => {
    const saved = localStorage.getItem('selectedAlgorithmTab');
    if (saved && ['stories', 'algorithms', 'gd-fixed', 'gd-linesearch', 'diagonal-precond', 'newton', 'lbfgs'].includes(saved)) {
      return saved as Algorithm;
    }
    return 'algorithms';
  });

  // GD Fixed hyperparameters
  const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);
  const [gdFixedTolerance, setGdFixedTolerance] = useState(1e-6);

  // GD Line Search hyperparameters
  const [gdLSC1, setGdLSC1] = useState(0.0001);
  const [gdLSTolerance, setGdLSTolerance] = useState(1e-6);

  // Newton hyperparameters
  const [newtonC1, setNewtonC1] = useState(0.0001);
  const [newtonLineSearch, setNewtonLineSearch] = useState<'armijo' | 'none'>('none');
  const [newtonHessianDamping, setNewtonHessianDamping] = useState(0);
  const [newtonTolerance, setNewtonTolerance] = useState(1e-4);  // gtol: matches scipy trust-ncg default
  const [newtonFtol, setNewtonFtol] = useState(2.22e-9);        // ftol: matches scipy L-BFGS-B default
  const [newtonXtol, setNewtonXtol] = useState(1e-5);           // xtol: matches scipy Newton-CG default

  // L-BFGS hyperparameters
  const [lbfgsC1, setLbfgsC1] = useState(0.0001);
  const [lbfgsM, setLbfgsM] = useState(5);
  const [lbfgsHessianDamping, setLbfgsHessianDamping] = useState(0);
  const [lbfgsTolerance, setLbfgsTolerance] = useState(1e-4);  // gtol: matches scipy trust-ncg default

  // Diagonal Preconditioner hyperparameters
  const [diagPrecondLineSearch, setDiagPrecondLineSearch] = useState<'armijo' | 'none'>('none');


  const [diagPrecondC1, setDiagPrecondC1] = useState(0.0001);
  const [diagPrecondTolerance, setDiagPrecondTolerance] = useState(1e-4);  // gtol: matches scipy trust-ncg default
  const [diagPrecondFtol, setDiagPrecondFtol] = useState(2.22e-9);         // ftol: matches scipy L-BFGS-B default
  const [diagPrecondXtol, setDiagPrecondXtol] = useState(1e-5);            // xtol: matches scipy Newton-CG default

  const [diagPrecondHessianDamping, setDiagPrecondHessianDamping] = useState(0);

  // Shared algorithm state
  const [maxIter, setMaxIter] = useState(50);
  const [initialW0, setInitialW0] = useState(-1);
  const [initialW1, setInitialW1] = useState(1);

  // Experiment state
  const [experimentLoading, setExperimentLoading] = useState(false);
  const [experimentJustLoaded, setExperimentJustLoaded] = useState(false);

  // Ref to prevent IntersectionObserver from interfering during programmatic scrolls
  const isNavigatingRef = useRef(false);

  // Hash-preserving tab change handler
  const handleTabChange = (newTab: Algorithm, skipScroll = false) => {
    const currentHash = window.location.hash;
    console.log('[TAB CHANGE] Starting - currentHash:', currentHash, 'newTab:', newTab, 'skipScroll:', skipScroll);

    // Disable IntersectionObserver updates BEFORE tab switch
    isNavigatingRef.current = true;
    console.log('[TAB CHANGE] Set isNavigatingRef = true');

    // Clear hash temporarily to prevent browser's automatic scroll
    if (currentHash) {
      console.log('[TAB CHANGE] Clearing hash temporarily to prevent browser auto-scroll');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    setSelectedTab(newTab);
    console.log('[TAB CHANGE] Called setSelectedTab');

    // After React renders the new tab, try to scroll to the hash if it exists
    if (currentHash && !skipScroll) {
      // Use requestAnimationFrame for minimal delay (one frame ~16ms)
      requestAnimationFrame(() => {
        console.log('[TAB CHANGE] After one frame, looking for element:', currentHash);
        const targetElement = document.querySelector(currentHash);
        if (targetElement) {
          console.log('[TAB CHANGE] Found element, scrolling to it instantly');
          targetElement.scrollIntoView({ block: 'start' });
          // Restore hash after scrolling
          console.log('[TAB CHANGE] Restoring hash to URL');
          window.history.replaceState(null, '', window.location.pathname + window.location.search + currentHash);
        } else {
          console.log('[TAB CHANGE] Element not found (fallback A)');
        }
        // Fallback strategy A: if element doesn't exist, do nothing (maintain scroll)

        // Re-enable IntersectionObserver after instant scroll (one more frame)
        requestAnimationFrame(() => {
          console.log('[TAB CHANGE] After instant scroll, setting isNavigatingRef = false');
          isNavigatingRef.current = false;
        });
      });
    } else {
      // If no hash to preserve, re-enable observer after render
      requestAnimationFrame(() => {
        console.log('[TAB CHANGE] No hash, setting isNavigatingRef = false after one frame');
        isNavigatingRef.current = false;
      });
    }
  };

  // Problem state
  const [currentProblem, setCurrentProblem] = useState<string>('logistic-regression');
  const [visualizationBounds, setVisualizationBounds] = useState({
    w0: [-3, 3] as [number, number],
    w1: [-3, 3] as [number, number],
  });

  // Logistic regression / separating hyperplane global minimum (computed, 2D only)
  const [logisticGlobalMin, setLogisticGlobalMin] = useState<[number, number] | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ content: React.ReactNode; type: 'success' | 'error' | 'info'; duration?: number } | null>(null);

  const data = useMemo(() => [...baseData, ...customPoints], [baseData, customPoints]);

  // Get current problem definition (logistic regression or from registry)
  const getCurrentProblem = useCallback(() => {
    if (currentProblem === 'logistic-regression') {
      // Return logistic regression wrapped as problem interface
      // Note: Logistic regression uses 2D weights [w0, w1] with bias parameter
      return {
        name: 'Logistic Regression',
        description: 'Binary classification with L2 regularization',
        objective: (w: number[]) => logisticObjective(w, data, lambda, bias),
        gradient: (w: number[]) => logisticGradient(w, data, lambda, bias),
        hessian: (w: number[]) => logisticHessian(w, data, lambda, bias),
        domain: {
          w0: [-3, 3],
          w1: [-3, 3],
        },
        requiresDataset: true,
        dimensionality: 2, // 2D weights [w0, w1]
      };
    } else if (currentProblem === 'separating-hyperplane') {
      // Special case: dataset-based problem
      const { objective, gradient, hessian } = separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda, bias);
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
        dimensionality: 2, // 2D weights [w0, w1]
      };
    } else {
      // NEW: Use centralized resolution for all registry problems
      const problem = resolveProblem(currentProblem, problemParameters);
      return {
        ...problem,
        requiresDataset: false,
        dimensionality: 2,
      };
    }
  }, [currentProblem, data, lambda, bias, problemParameters, separatingHyperplaneVariant]);

  // Get current problem functions for algorithm execution
  // For parametrized problems (rotated quadratic, ill-conditioned quadratic, Rosenbrock),
  // we create instances with current parameter values
  const getCurrentProblemFunctions = useCallback((): ProblemFunctions => {
    if (currentProblem === 'logistic-regression') {
      return logisticRegressionToProblemFunctions(data, lambda, bias);
    } else if (currentProblem === 'separating-hyperplane') {
      // Special case: dataset-based problem
      if (!data || data.length === 0) {
        throw new Error('Separating hyperplane requires dataset');
      }
      return separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda, bias);
    } else {
      // NEW: Use centralized resolution for all registry problems
      const problem = resolveProblem(currentProblem, problemParameters);
      return problemToProblemFunctions(problem);
    }
  }, [currentProblem, data, lambda, bias, problemParameters, separatingHyperplaneVariant]);

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
    if (isDatasetProblem(currentProblem)) {
      try {
        const problemFuncs = currentProblem === 'logistic-regression'
          ? logisticRegressionToProblemFunctions(data, lambda, bias)
          : separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda, bias);
        // Run L-BFGS with tight convergence to find global minimum
        const result = runLBFGS(problemFuncs, {
          maxIter: 1000,
          m: 10,
          c1: 0.0001,
          lambda,
          hessianDamping: 0.01, // Use default damping for stability
          initialPoint: [0, 0],
          tolerance: 1e-10, // Very tight tolerance for accurate minimum
        });
        const iterations = result.iterations;
        if (iterations.length > 0) {
          const lastIter = iterations[iterations.length - 1];
          // Store 2D coordinates only
          if (lastIter.wNew.length >= 2) {
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
  }, [currentProblem, data, lambda, bias, separatingHyperplaneVariant]);

  // Automatically update URL hash based on visible section
  useEffect(() => {
    // Get all sections that have IDs (our navigation targets)
    // Using prefix matching (id^=) for section name prefixes, exact match (id=) for "configuration"
    const sections = document.querySelectorAll('[id^="parameter-"], [id^="quick-"], [id^="try-"], [id^="when-"], [id^="mathematical-"], [id^="advanced-"], [id^="line-search-"], [id^="rotation-"], [id="configuration"]');

    if (sections.length === 0) return;

    const observerOptions = {
      root: null, // viewport
      rootMargin: '-20% 0px -70% 0px', // Trigger when section is in upper 30% of viewport
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Note: IntersectionObserverEntry is a built-in browser API type, no import needed
      console.log('[OBSERVER] Callback fired, isNavigatingRef:', isNavigatingRef.current, 'entries:', entries.length);

      // Skip hash updates during programmatic navigation to prevent jerkiness
      if (isNavigatingRef.current) {
        console.log('[OBSERVER] Skipping hash updates (isNavigatingRef is true)');
        return;
      }

      entries.forEach(entry => {
        console.log('[OBSERVER] Entry:', entry.target.id, 'isIntersecting:', entry.isIntersecting);
        if (entry.isIntersecting && entry.target.id) {
          // Update URL hash without scrolling
          const newHash = `#${entry.target.id}`;
          console.log('[OBSERVER] Want to set hash to:', newHash, 'current hash:', window.location.hash);
          if (window.location.hash !== newHash) {
            console.log('[OBSERVER] Setting hash via replaceState');
            window.history.replaceState(null, '', newHash);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Cleanup
    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, [selectedTab]); // Re-run when tab changes to observe new sections

  // Note: When problemParameters changes, algorithms automatically rerun
  // because getCurrentProblemFunctions includes it in its dependencies, which triggers
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

  // Use custom hook for GD Fixed algorithm (must come before functions that reference it)
  const gdFixed = useAlgorithmIterations(
    'GD Fixed',
    () => {
      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = constructInitialPoint(currentProblem, initialW0, initialW1);
      return runGradientDescent(problemFuncs, {
        maxIter,
        alpha: gdFixedAlpha,
        lambda,
        initialPoint,
        tolerance: gdFixedTolerance,
      });
    },
    [currentProblem, lambda, gdFixedAlpha, gdFixedTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
    { jumpToEnd: experimentJustLoaded }
  );

  // Use custom hook for GD Line Search algorithm
  const gdLS = useAlgorithmIterations(
    'GD Line Search',
    () => {
      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = constructInitialPoint(currentProblem, initialW0, initialW1);
      return runGradientDescentLineSearch(problemFuncs, {
        maxIter,
        c1: gdLSC1,
        lambda,
        initialPoint,
        tolerance: gdLSTolerance,
      });
    },
    [currentProblem, lambda, gdLSC1, gdLSTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
    { jumpToEnd: experimentJustLoaded }
  );

  // Use custom hook for Newton's Method algorithm
  const newton = useAlgorithmIterations(
    'Newton',
    () => {
      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = constructInitialPoint(currentProblem, initialW0, initialW1);
      return runNewton(problemFuncs, {
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
    },
    [currentProblem, lambda, newtonC1, newtonLineSearch, newtonHessianDamping, newtonTolerance, newtonFtol, newtonXtol, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
    { jumpToEnd: experimentJustLoaded }
  );

  // Use custom hook for L-BFGS algorithm
  const lbfgs = useAlgorithmIterations(
    'L-BFGS',
    () => {
      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = constructInitialPoint(currentProblem, initialW0, initialW1);
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
      console.log('L-BFGS completed:', result.iterations.length, 'iterations');
      if (result.iterations.length > 0) {
        console.log('First iteration:', result.iterations[0]);
        console.log('Last iteration:', result.iterations[result.iterations.length - 1]);
      }
      return result;
    },
    [currentProblem, lambda, lbfgsC1, lbfgsM, lbfgsHessianDamping, lbfgsTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
    { jumpToEnd: experimentJustLoaded }
  );

  // Use custom hook for Diagonal Preconditioner algorithm
  const diagPrecond = useAlgorithmIterations(
    'Diagonal Preconditioner',
    () => {
      const problemFuncs = getCurrentProblemFunctions();
      const initialPoint = constructInitialPoint(currentProblem, initialW0, initialW1);
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
      console.log('Diagonal Preconditioner completed:', result.iterations.length, 'iterations');
      if (result.iterations.length > 0) {
        console.log('First iteration:', result.iterations[0]);
        console.log('Last iteration:', result.iterations[result.iterations.length - 1]);
      }
      return result;
    },
    [currentProblem, diagPrecondLineSearch, lambda, diagPrecondHessianDamping, maxIter, diagPrecondC1, diagPrecondTolerance, diagPrecondFtol, diagPrecondXtol, initialW0, initialW1, getCurrentProblemFunctions],
    { jumpToEnd: experimentJustLoaded }
  );

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
    const globalMin = problemDef?.globalMinimum || (isDatasetProblem(currentProblem) ? logisticGlobalMin : null);
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
    () => calculateParamBounds(newton.iterations, 'Newton'),
    [newton.iterations, calculateParamBounds]
  );

  const lbfgsParamBounds = React.useMemo(
    () => calculateParamBounds(lbfgs.iterations, 'L-BFGS'),
    [lbfgs.iterations, calculateParamBounds]
  );

  const gdFixedParamBounds = React.useMemo(
    () => calculateParamBounds(gdFixed.iterations, 'GD Fixed'),
    [gdFixed.iterations, calculateParamBounds]
  );

  const gdLSParamBounds = React.useMemo(
    () => calculateParamBounds(gdLS.iterations, 'GD Line Search'),
    [gdLS.iterations, calculateParamBounds]
  );

  const diagPrecondParamBounds = React.useMemo(
    () => calculateParamBounds(diagPrecond.iterations, 'Diagonal Precond'),
    [diagPrecond.iterations, calculateParamBounds]
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


  // Story state
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(() =>
    localStorage.getItem('currentStory')
  );
  const [currentStoryStep, setCurrentStoryStep] = useState<number>(() =>
    parseInt(localStorage.getItem('currentStoryStep') || '0', 10)
  );
  const [showStoryTOC, setShowStoryTOC] = useState(false);

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

  /**
   * Format a number for display in toast messages
   * @param value - Number or string to format
   * @returns Formatted string with floats rounded to 4-5 decimals
   */
  function formatParamValue(value: number | string): string {
    if (typeof value === 'string') return value;
    // Round floats to 4-5 significant digits for readability
    if (Number.isInteger(value)) return value.toString();
    return value.toPrecision(4);
    // Use toPrecision for very small/large numbers, toFixed for normal range
    // if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
    //   return value.toPrecision(4);
    // }
    // return value.toFixed(Math.min(5, Math.max(2, 4 - Math.floor(Math.log10(Math.abs(value))))));
  }

  /**
   * Get list of hyperparameter changes for current algorithm
   * @param experiment - Experiment being loaded
   * @param currentAlgo - Currently selected algorithm tab
   * @param currentState - Current hyperparameter state values
   * @returns Array of change descriptions (e.g., ["α: 0.1→0.01"])
   */
  const getHyperparameterChanges = useCallback((
    experiment: ExperimentPreset,
    currentAlgo: string,
    currentState: {
      gdFixedAlpha: number;
      gdLSC1: number;
      newtonHessianDamping: number;
      newtonLineSearch: 'armijo' | 'none';
      newtonC1: number;
      lbfgsM: number;
      lbfgsHessianDamping: number;
      lbfgsC1: number;
      diagPrecondHessianDamping: number;
      diagPrecondLineSearch: 'armijo' | 'none';
      diagPrecondC1: number;
      maxIter: number;
    }
  ): string[] => {
    const changes: string[] = [];
    const hyper = experiment.hyperparameters;

    switch (currentAlgo) {
      case 'gd-fixed':
        if (hyper.alpha !== undefined && hyper.alpha !== currentState.gdFixedAlpha) {
          changes.push(`α: ${formatParamValue(currentState.gdFixedAlpha)}→${formatParamValue(hyper.alpha)}`);
        }
        break;

      case 'gd-linesearch':
        if (hyper.c1 !== undefined && hyper.c1 !== currentState.gdLSC1) {
          changes.push(`c1: ${formatParamValue(currentState.gdLSC1)}→${formatParamValue(hyper.c1)}`);
        }
        break;

      case 'newton':
        if (hyper.hessianDamping !== undefined && hyper.hessianDamping !== currentState.newtonHessianDamping) {
          changes.push(`damping: ${formatParamValue(currentState.newtonHessianDamping)}→${formatParamValue(hyper.hessianDamping)}`);
        }
        if (hyper.lineSearch !== undefined && hyper.lineSearch !== currentState.newtonLineSearch) {
          changes.push(`line search: ${formatParamValue(currentState.newtonLineSearch)}→${formatParamValue(hyper.lineSearch)}`);
        }
        if (hyper.c1 !== undefined && hyper.c1 !== currentState.newtonC1) {
          changes.push(`c1: ${formatParamValue(currentState.newtonC1)}→${formatParamValue(hyper.c1)}`);
        }
        break;

      case 'lbfgs':
        if (hyper.m !== undefined && hyper.m !== currentState.lbfgsM) {
          changes.push(`m: ${formatParamValue(currentState.lbfgsM)}→${formatParamValue(hyper.m)}`);
        }
        if (hyper.hessianDamping !== undefined && hyper.hessianDamping !== currentState.lbfgsHessianDamping) {
          changes.push(`damping: ${formatParamValue(currentState.lbfgsHessianDamping)}→${formatParamValue(hyper.hessianDamping)}`);
        }
        if (hyper.c1 !== undefined && hyper.c1 !== currentState.lbfgsC1) {
          changes.push(`c1: ${formatParamValue(currentState.lbfgsC1)}→${formatParamValue(hyper.c1)}`);
        }
        break;

      case 'diagonal-precond':
        if (hyper.hessianDamping !== undefined && hyper.hessianDamping !== currentState.diagPrecondHessianDamping) {
          changes.push(`damping: ${formatParamValue(currentState.diagPrecondHessianDamping)}→${formatParamValue(hyper.hessianDamping)}`);
        }
        if (hyper.lineSearch !== undefined && hyper.lineSearch !== currentState.diagPrecondLineSearch) {
          changes.push(`line search: ${formatParamValue(currentState.diagPrecondLineSearch)}→${formatParamValue(hyper.lineSearch)}`);
        }
        if (hyper.c1 !== undefined && hyper.c1 !== currentState.diagPrecondC1) {
          changes.push(`c1: ${formatParamValue(currentState.diagPrecondC1)}→${formatParamValue(hyper.c1)}`);
        }
        break;
    }

    // Check maxIter (common to all algorithms)
    if (hyper.maxIter !== undefined && hyper.maxIter !== currentState.maxIter) {
      changes.push(`maxIter: ${formatParamValue(currentState.maxIter)}→${formatParamValue(hyper.maxIter)}`);
    }

    return changes;
  }, []);

  /**
   * Get list of problem-specific configuration changes
   * @param experiment - Experiment being loaded
   * @param currentProblem - Currently selected problem
   * @param currentConfig - Current problem configuration
   * @returns Array of change descriptions (e.g., ["rotation: 0°→45°"])
   */
  function getProblemConfigChanges(
    experiment: ExperimentPreset,
    currentProblem: string,
    currentConfig: {
      problemParameters?: Record<string, number | string>;
      separatingHyperplaneVariant?: string;
    }
  ): string[] {
    const changes: string[] = [];

    // Only check config if we're staying on the same problem
    if (experiment.problem !== currentProblem) {
      return changes;
    }

    // Check for parameter changes (rotation angle, condition number, etc.)
    if (experiment.problemParameters) {
      const currentParams = currentConfig.problemParameters || {};

      // Rotation angle
      if (experiment.problemParameters.rotationAngle !== undefined &&
          experiment.problemParameters.rotationAngle !== currentParams.rotationAngle) {
        const current = currentParams.rotationAngle ?? 0;
        changes.push(`rotation: ${current}°→${experiment.problemParameters.rotationAngle}°`);
      }

      // Condition number
      if (experiment.problemParameters.conditionNumber !== undefined &&
          experiment.problemParameters.conditionNumber !== currentParams.conditionNumber) {
        const current = currentParams.conditionNumber ?? 100;
        changes.push(`κ: ${current}→${experiment.problemParameters.conditionNumber}`);
      }

      // Rosenbrock b
      if (experiment.problemParameters.rosenbrockB !== undefined &&
          experiment.problemParameters.rosenbrockB !== currentParams.rosenbrockB) {
        const current = currentParams.rosenbrockB ?? 100;
        changes.push(`b: ${current}→${experiment.problemParameters.rosenbrockB}`);
      }
    }

    // Separating hyperplane variant
    if (experiment.separatingHyperplaneVariant !== undefined &&
        experiment.separatingHyperplaneVariant !== currentConfig.separatingHyperplaneVariant) {
      const current = currentConfig.separatingHyperplaneVariant ?? 'none';
      changes.push(`variant: ${current}→${experiment.separatingHyperplaneVariant}`);
    }

    return changes;
  }

  // Load experiment preset
  const loadExperiment = useCallback((experiment: ExperimentPreset, options?: { suppressToastIfUnchanged?: boolean }) => {
    setExperimentLoading(true);

    // Signal all algorithms to jump to end on next update
    setExperimentJustLoaded(true);

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

        // Load problem parameters from preset
        if (experiment.problemParameters) {
          setProblemParameters(experiment.problemParameters);
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

      // Reset jump-to-end flag after a tick so all useEffects can read it
      // This uses the event loop to ensure hooks see experimentJustLoaded: true before it resets
      setTimeout(() => setExperimentJustLoaded(false), 0);

      // Build smart toast content based on what's changing
      const changes: string[] = [];

      const algoChanging = experiment.algorithm !== selectedTab;
      const problemChanging = experiment.problem !== currentProblem;

      // Check algorithm change
      if (algoChanging) {
        const algorithmName = getAlgorithmDisplayName(experiment.algorithm);
        changes.push(`Switched to tab ${algorithmName}`);
      } else {
        // Same algo - check if hyperparameters changed
        const hyperChanges = getHyperparameterChanges(experiment, selectedTab, {
          gdFixedAlpha,
          gdLSC1,
          newtonHessianDamping,
          newtonLineSearch,
          newtonC1,
          lbfgsM,
          lbfgsHessianDamping,
          lbfgsC1,
          diagPrecondHessianDamping,
          diagPrecondLineSearch,
          diagPrecondC1,
          maxIter,
        });
        if (hyperChanges.length > 0) {
          changes.push(...hyperChanges);
        }
      }

      // Check problem change
      if (problemChanging) {
        const problemName = getProblem(experiment.problem)?.name || experiment.problem;
        changes.push(`Switched to problem ${problemName}`);
      } else {
        // Same problem - check if problem config changed
        const problemConfigChanges = getProblemConfigChanges(experiment, currentProblem, {
          problemParameters,
          separatingHyperplaneVariant: experiment.separatingHyperplaneVariant,
        });
        if (problemConfigChanges.length > 0) {
          changes.push(...problemConfigChanges);
        }
      }

      // Build JSX content for toast
      const content = (
        <div>
          <div className="font-semibold">{experiment.name}</div>
          {changes.length > 0 && (
            <>
              <div className="mt-1 text-xs opacity-80">Changes:</div>
              {changes.map((change, i) => (
                <div key={i} className="text-xs">• {change}</div>
              ))}
            </>
          )}
        </div>
      );

      // Only show toast if there are changes OR we're not suppressing unchanged loads
      const shouldShowToast = !options?.suppressToastIfUnchanged || changes.length > 0;

      if (shouldShowToast) {
        // Use longer duration when there are changes to give user time to read
        const duration = changes.length > 0 ? 5000 : 3000;
        setToast({ content, type: 'success', duration });
      }

    } catch (error) {
      console.error('Error loading experiment:', error);
      setExperimentLoading(false);
    }
  }, [currentProblem, selectedTab, gdFixedAlpha, gdLSC1, newtonHessianDamping, newtonLineSearch, newtonC1, lbfgsM, lbfgsHessianDamping, lbfgsC1, diagPrecondHessianDamping, diagPrecondLineSearch, diagPrecondC1, maxIter, problemParameters, getHyperparameterChanges]);

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
    // Reset all algorithm iterations to 0
    gdFixed.resetIter();
    gdLS.resetIter();
    diagPrecond.resetIter();
    newton.resetIter();
    lbfgs.resetIter();
    setCustomPoints([]);
  }, [gdFixed, gdLS, diagPrecond, newton, lbfgs]);



  // Sync story state to localStorage
  useEffect(() => {
    if (currentStoryId) {
      localStorage.setItem('currentStory', currentStoryId);
      localStorage.setItem('currentStoryStep', String(currentStoryStep));
    } else {
      localStorage.removeItem('currentStory');
      localStorage.removeItem('currentStoryStep');
    }
  }, [currentStoryId, currentStoryStep]);

  // Load experiment when story changes and switch to appropriate tab
  useEffect(() => {
    if (currentStoryId) {
      const story = getStory(currentStoryId);
      if (story && story.steps[currentStoryStep]) {
        const step = story.steps[currentStoryStep];
        const experiment = getExperimentById(step.experimentId);
        if (experiment) {
          // Check if we're loading the same experiment as the previous step
          const previousStep = currentStoryStep > 0 ? story.steps[currentStoryStep - 1] : null;
          const sameExperiment = previousStep?.experimentId === step.experimentId;

          // Suppress toast if same experiment (unless user modified settings)
          loadExperiment(experiment, { suppressToastIfUnchanged: sameExperiment });

          // Switch to the experiment's algorithm tab (skip default scroll - story controls it)
          handleTabChange(experiment.algorithm, true);

          // Scroll to the target section if specified by story
          if (step.scrollTo) {
            // Use setTimeout to wait for tab content to render
            setTimeout(() => {
              const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
              if (target) {
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            }, 100);
          }
        }
      }
    }
    // IMPORTANT: loadExperiment and handleTabChange are intentionally omitted from dependencies.
    //
    // Why? Including loadExperiment would cause this effect to re-trigger whenever ANY UI state
    // changes (problem, algorithm, hyperparameters, etc.) because loadExperiment depends on all
    // of them via its useCallback dependencies.
    //
    // Problem this causes: If a user manually changes the problem while in story mode, the story
    // would immediately reload and reset it back to the story's problem. This prevents users from
    // exploring variations while in story mode.
    //
    // Solution: This effect should ONLY run when the story ID or step changes, allowing users to
    // manually modify UI state without the story overriding their changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryId, currentStoryStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedTab === 'gd-fixed') {
        if (e.key === 'ArrowLeft' && gdFixed.currentIter > 0) {
          gdFixed.setCurrentIter(gdFixed.currentIter - 1);
        } else if (e.key === 'ArrowRight' && gdFixed.currentIter < gdFixed.iterations.length - 1) {
          gdFixed.setCurrentIter(gdFixed.currentIter + 1);
        }
      } else if (selectedTab === 'gd-linesearch') {
        if (e.key === 'ArrowLeft' && gdLS.currentIter > 0) {
          gdLS.setCurrentIter(gdLS.currentIter - 1);
        } else if (e.key === 'ArrowRight' && gdLS.currentIter < gdLS.iterations.length - 1) {
          gdLS.setCurrentIter(gdLS.currentIter + 1);
        }
       } else if (selectedTab === 'diagonal-precond') {
          if (e.key === 'ArrowLeft' && diagPrecond.currentIter > 0) {
            diagPrecond.setCurrentIter(diagPrecond.currentIter - 1);
          } else if (e.key === 'ArrowRight' && diagPrecond.currentIter < diagPrecond.iterations.length - 1) {
            diagPrecond.setCurrentIter(diagPrecond.currentIter + 1);
          }
      } else if (selectedTab === 'newton') {
        if (e.key === 'ArrowLeft' && newton.currentIter > 0) {
          newton.setCurrentIter(newton.currentIter - 1);
        } else if (e.key === 'ArrowRight' && newton.currentIter < newton.iterations.length - 1) {
          newton.setCurrentIter(newton.currentIter + 1);
        }
      } else {
        if (e.key === 'ArrowLeft' && lbfgs.currentIter > 0) {
          lbfgs.setCurrentIter(lbfgs.currentIter - 1);
        } else if (e.key === 'ArrowRight' && lbfgs.currentIter < lbfgs.iterations.length - 1) {
          lbfgs.setCurrentIter(lbfgs.currentIter + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- gdFixed properties are accessed but object itself doesn't need to be in deps
  }, [selectedTab, gdFixed.currentIter, gdFixed.iterations.length, gdLS.currentIter, gdLS.iterations.length, newton.currentIter, newton.iterations.length, lbfgs.currentIter, lbfgs.iterations.length, diagPrecond.currentIter, diagPrecond.iterations.length]);

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
    const currentIter = selectedTab === 'gd-fixed' ? gdFixed.iterations[gdFixed.currentIter] :
                       selectedTab === 'gd-linesearch' ? gdLS.iterations[gdLS.currentIter] :
                       selectedTab === 'newton' ? newton.iterations[newton.currentIter] :
                       lbfgs.iterations[lbfgs.currentIter];
    if (isDatasetProblem(currentProblem) && currentIter) {
      const [w0, w1] = currentIter.wNew;
      if (Math.abs(w1) > 1e-6) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const step = rangeX1 / 50; // Use 50 points across the range
        for (let x1 = minX1; x1 <= maxX1; x1 += step) {
          const x2 = -(w0 * x1 + bias) / w1;
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
  }, [data, gdFixed.iterations, gdFixed.currentIter, gdLS.iterations, gdLS.currentIter, newton.iterations, newton.currentIter, lbfgs.iterations, lbfgs.currentIter, addPointMode, customPoints, selectedTab, currentProblem, bias]);

  // Draw Newton's Hessian matrix
  useEffect(() => {
    const canvas = newtonHessianCanvasRef.current;
    if (!canvas || selectedTab !== 'newton') return;
    const iter = newton.iterations[newton.currentIter];
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
  }, [newton.iterations, newton.currentIter, selectedTab]);

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

    // Compute loss landscape as 2D grid
    for (let i = 0; i < resolution; i++) {
      const row: number[] = [];
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        // Use problem interface for loss computation (always 2D)
        const loss = problem.objective([w0, w1]);
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
    const iter = newton.iterations[newton.currentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, newtonParamBounds, newton.iterations, newton.currentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [newton.currentIter, data, newton.iterations, newtonParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

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
    const iter = newton.iterations[newton.currentIter];
    if (!iter) return;

    drawLineSearchPlot(canvas, iter);
  }, [newton.iterations, newton.currentIter, selectedTab]);

  // Draw L-BFGS parameter space
  useEffect(() => {
    const canvas = lbfgsParamCanvasRef.current;
    if (!canvas || selectedTab !== 'lbfgs') return;
    const iter = lbfgs.iterations[lbfgs.currentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, lbfgsParamBounds, lbfgs.iterations, lbfgs.currentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [lbfgs.currentIter, data, lbfgs.iterations, lbfgsParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw L-BFGS line search
  useEffect(() => {
    const canvas = lbfgsLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'lbfgs') return;
    const iter = lbfgs.iterations[lbfgs.currentIter];
    if (!iter) return;

    drawLineSearchPlot(canvas, iter);
  }, [lbfgs.iterations, lbfgs.currentIter, selectedTab]);

  // Draw GD Fixed parameter space
  useEffect(() => {
    const canvas = gdFixedParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-fixed') return;
    const iter = gdFixed.iterations[gdFixed.currentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, gdFixedParamBounds, gdFixed.iterations, gdFixed.currentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [gdFixed.currentIter, data, gdFixed.iterations, gdFixedParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw GD Line Search parameter space
  useEffect(() => {
    const canvas = gdLSParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLS.iterations[gdLS.currentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, gdLSParamBounds, gdLS.iterations, gdLS.currentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [gdLS.currentIter, data, gdLS.iterations, gdLSParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw GD Line Search plot
  useEffect(() => {
    const canvas = gdLSLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLS.iterations[gdLS.currentIter];
    if (!iter) return;

    drawLineSearchPlot(canvas, iter);
  }, [gdLS.iterations, gdLS.currentIter, selectedTab]);

  // Draw Diagonal Preconditioner parameter space
  useEffect(() => {
    const canvas = diagPrecondParamCanvasRef.current;
    if (!canvas || selectedTab !== 'diagonal-precond') return;
    const iter = diagPrecond.iterations[diagPrecond.currentIter];
    if (!iter) return;

    const problem = getCurrentProblem();
    drawParameterSpacePlot(canvas, diagPrecondParamBounds, diagPrecond.iterations, diagPrecond.currentIter, problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawParameterSpacePlot is a stable function definition, not a dependency
  }, [diagPrecond.currentIter, data, diagPrecond.iterations, diagPrecondParamBounds, lambda, selectedTab, currentProblem, logisticGlobalMin, getCurrentProblem]);

  // Draw Diagonal Preconditioner line search
  useEffect(() => {
    const canvas = diagPrecondLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'diagonal-precond') return;
    const iter = diagPrecond.iterations[diagPrecond.currentIter];
    if (!iter || !iter.lineSearchCurve) return;

    drawLineSearchPlot(canvas, iter);
  }, [diagPrecond.iterations, diagPrecond.currentIter, selectedTab]);

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
          gdFixed.resetIter();
          gdLS.resetIter();
          diagPrecond.resetIter();
          newton.resetIter();
          lbfgs.resetIter();

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
        bias={bias}
        onBiasChange={setBias}
        problemParameters={problemParameters}
        onProblemParameterChange={(key, value) => {
          setProblemParameters(prev => ({ ...prev, [key]: value }));
        }}
        separatingHyperplaneVariant={separatingHyperplaneVariant}
        onSeparatingHyperplaneVariantChange={setSeparatingHyperplaneVariant}
        customPoints={customPoints}
        onCustomPointsChange={setCustomPoints}
        addPointMode={addPointMode}
        onAddPointModeChange={setAddPointMode}
        dataCanvasRef={dataCanvasRef}
        onCanvasClick={handleCanvasClick}
        onShowToast={(content, type) => setToast({ content, type })}
      />

      {/* Algorithm Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="sticky top-0 z-40 flex border-b border-gray-200 bg-white rounded-t-lg">
          {/* Stories Tab - FIRST position */}
          <button
            onClick={() => handleTabChange('stories')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'stories'
                ? 'text-pink-700 border-b-2 border-pink-600 bg-pink-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stories
          </button>
          {/* Algorithms Tab */}
          <button
            onClick={() => handleTabChange('algorithms')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'algorithms'
                ? 'text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Algorithms
          </button>
          <button
            onClick={() => handleTabChange('gd-fixed')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'gd-fixed'
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            GD (Fixed Step)
          </button>
          <button
            onClick={() => handleTabChange('gd-linesearch')}
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
            onClick={() => handleTabChange('diagonal-precond')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'diagonal-precond'
                ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Diagonal Precond
          </button>
          <button
            onClick={() => handleTabChange('newton')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'newton'
                ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Newton's Method
          </button>
          <button
            onClick={() => handleTabChange('lbfgs')}
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
          {selectedTab === 'stories' && (
            <StoriesPage
              onStartStory={(storyId) => {
                setCurrentStoryId(storyId);
                setCurrentStoryStep(0);
              }}
            />
          )}
          {selectedTab === 'algorithms' && (
            <AlgorithmExplainer />
          )}
          {selectedTab === 'gd-fixed' && (
            <GdFixedTab
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
              iterations={gdFixed.iterations}
              currentIter={gdFixed.currentIter}
              onIterChange={(val) => gdFixed.setCurrentIter(val)}
              onResetIter={() => gdFixed.setCurrentIter(0)}
              summary={gdFixed.summary}
              problemFuncs={problemFuncs}
              problem={problem}
              currentProblem={currentProblem}
              bounds={bounds}
              paramCanvasRef={gdFixedParamCanvasRef}
              experimentLoading={experimentLoading}
              onLoadExperiment={loadExperiment}
            />
          )}
          {selectedTab === 'gd-linesearch' && (
            <GdLineSearchTab
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
              iterations={gdLS.iterations}
              currentIter={gdLS.currentIter}
              onIterChange={(val) => gdLS.setCurrentIter(val)}
              onResetIter={() => gdLS.setCurrentIter(0)}
              summary={gdLS.summary}
              problemFuncs={problemFuncs}
              problem={problem}
              currentProblem={currentProblem}
              bounds={bounds}
              paramCanvasRef={gdLSParamCanvasRef}
              lineSearchCanvasRef={gdLSLineSearchCanvasRef}
              experimentLoading={experimentLoading}
              onLoadExperiment={loadExperiment}
            />
          )}
          {selectedTab === 'newton' && (
            <NewtonTab
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
              iterations={newton.iterations}
              currentIter={newton.currentIter}
              onIterChange={(val) => newton.setCurrentIter(val)}
              onResetIter={() => newton.setCurrentIter(0)}
              summary={newton.summary}
              problemFuncs={problemFuncs}
              problem={problem}
              currentProblem={currentProblem}
              bounds={bounds}
              paramCanvasRef={newtonParamCanvasRef}
              lineSearchCanvasRef={newtonLineSearchCanvasRef}
              hessianCanvasRef={newtonHessianCanvasRef}
              experimentLoading={experimentLoading}
              onLoadExperiment={loadExperiment}
            />
          )}
          {selectedTab === 'lbfgs' && (
            <LbfgsTab
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
              iterations={lbfgs.iterations}
              currentIter={lbfgs.currentIter}
              onIterChange={(val) => lbfgs.setCurrentIter(val)}
              onResetIter={() => lbfgs.setCurrentIter(0)}
              summary={lbfgs.summary}
              problemFuncs={problemFuncs}
              problem={problem}
              currentProblem={currentProblem}
              bounds={bounds}
              paramCanvasRef={lbfgsParamCanvasRef}
              lineSearchCanvasRef={lbfgsLineSearchCanvasRef}
              experimentLoading={experimentLoading}
              onLoadExperiment={loadExperiment}
            />
          )}
          {selectedTab === 'diagonal-precond' && (
            <DiagonalPrecondTab
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
              iterations={diagPrecond.iterations}
              currentIter={diagPrecond.currentIter}
              onIterChange={(val) => diagPrecond.setCurrentIter(val)}
              onResetIter={() => diagPrecond.resetIter()}
              summary={diagPrecond.summary}
              problemFuncs={problemFuncs}
              problem={problem}
              currentProblem={currentProblem}
              bounds={bounds}
              paramCanvasRef={diagPrecondParamCanvasRef}
              lineSearchCanvasRef={diagPrecondLineSearchCanvasRef}
              experimentLoading={experimentLoading}
              onLoadExperiment={loadExperiment}
            />
          )}
        </div>
      </div>

      {/* Story Banner and TOC */}
      {currentStoryId && (() => {
        const story = getStory(currentStoryId);
        if (!story) return null;

        const step = story.steps[currentStoryStep];
        const experiment = getExperimentById(step.experimentId);
        if (!experiment) return null;

        return (
          <>
            <StoryBanner
              story={story}
              currentStepIndex={currentStoryStep}
              currentExperiment={experiment}
              onPrevious={() => setCurrentStoryStep(Math.max(0, currentStoryStep - 1))}
              onNext={() => setCurrentStoryStep(Math.min(story.steps.length - 1, currentStoryStep + 1))}
              onExit={() => {
                setCurrentStoryId(null);
                setCurrentStoryStep(0);
              }}
              onShowTOC={() => setShowStoryTOC(true)}
            />

            {showStoryTOC && (
              <StoryTOC
                story={story}
                currentStepIndex={currentStoryStep}
                onSelectStep={setCurrentStoryStep}
                onClose={() => setShowStoryTOC(false)}
              />
            )}
          </>
        );
      })()}

      {toast && (
        <Toast
          content={toast.content}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
          bottomOffset={currentStoryId ? 80 : 0}
        />
      )}
    </div>
  );
};

export default UnifiedVisualizer;
