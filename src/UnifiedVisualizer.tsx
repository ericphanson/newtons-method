import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
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
import { CollapsibleSection } from './components/CollapsibleSection';
import { InlineMath, BlockMath } from './components/Math';
import { Toast } from './components/Toast';
import { getExperimentsForAlgorithm } from './experiments';
import { getProblem } from './problems';
import type { ExperimentPreset } from './types/experiments';

type Algorithm = 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';

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
  const [addPointMode, setAddPointMode] = useState(0);
  const [selectedTab, setSelectedTab] = useState<Algorithm>('gd-fixed');

  // GD Fixed step state
  const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
  const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
  const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);

  // GD Line search state
  const [gdLSIterations, setGdLSIterations] = useState<GDLineSearchIteration[]>([]);
  const [gdLSCurrentIter, setGdLSCurrentIter] = useState(0);
  const [gdLSC1, setGdLSC1] = useState(0.0001);

  // Newton state
  const [newtonIterations, setNewtonIterations] = useState<NewtonIteration[]>([]);
  const [newtonCurrentIter, setNewtonCurrentIter] = useState(0);
  const [newtonC1, setNewtonC1] = useState(0.0001);

  // L-BFGS state
  const [lbfgsIterations, setLbfgsIterations] = useState<LBFGSIteration[]>([]);
  const [lbfgsCurrentIter, setLbfgsCurrentIter] = useState(0);
  const [lbfgsC1, setLbfgsC1] = useState(0.0001);
  const [lbfgsM, setLbfgsM] = useState(5);

  // Experiment state
  const [currentExperiment, setCurrentExperiment] = useState<string | null>(null);
  const [experimentLoading, setExperimentLoading] = useState(false);

  // Problem state
  const [currentProblem, setCurrentProblem] = useState<string>('logistic-regression');
  const [showProblemSwitcher, setShowProblemSwitcher] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const data = [...baseData, ...customPoints];

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
  }, [currentProblem, data, lambda]);

  // Log problem info for debugging (will be used in later tasks)
  useEffect(() => {
    const problem = getCurrentProblem();
    console.log('Current problem:', problem.name, 'Dimensionality:', problem.dimensionality);
  }, [getCurrentProblem]);

  // Default configuration for reset functionality
  const defaultConfig = useRef({
    gdFixedAlpha: 0.1,
    gdLSC1: 0.0001,
    newtonC1: 0.0001,
    lbfgsC1: 0.0001,
    lambda: 0.0001,
    lbfgsM: 5,
  });

  // Calculate parameter bounds for both algorithms
  const newtonParamBounds = React.useMemo(() => {
    if (!newtonIterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    for (const it of newtonIterations) {
      minW0 = Math.min(minW0, it.wNew[0]);
      maxW0 = Math.max(maxW0, it.wNew[0]);
      minW1 = Math.min(minW1, it.wNew[1]);
      maxW1 = Math.max(maxW1, it.wNew[1]);
    }

    const w0Range = maxW0 - minW0;
    const w1Range = maxW1 - minW1;
    const pad0 = w0Range * 0.2;
    const pad1 = w1Range * 0.2;

    return {
      minW0: minW0 - pad0,
      maxW0: maxW0 + pad0,
      minW1: minW1 - pad1,
      maxW1: maxW1 + pad1,
      w0Range: w0Range + 2 * pad0,
      w1Range: w1Range + 2 * pad1
    };
  }, [newtonIterations]);

  const lbfgsParamBounds = React.useMemo(() => {
    if (!lbfgsIterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    for (const it of lbfgsIterations) {
      minW0 = Math.min(minW0, it.wNew[0]);
      maxW0 = Math.max(maxW0, it.wNew[0]);
      minW1 = Math.min(minW1, it.wNew[1]);
      maxW1 = Math.max(maxW1, it.wNew[1]);
    }

    const w0Range = maxW0 - minW0;
    const w1Range = maxW1 - minW1;
    const pad0 = w0Range * 0.2;
    const pad1 = w1Range * 0.2;

    return {
      minW0: minW0 - pad0,
      maxW0: maxW0 + pad0,
      minW1: minW1 - pad1,
      maxW1: maxW1 + pad1,
      w0Range: w0Range + 2 * pad0,
      w1Range: w1Range + 2 * pad1
    };
  }, [lbfgsIterations]);

  const gdFixedParamBounds = React.useMemo(() => {
    if (!gdFixedIterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    for (const it of gdFixedIterations) {
      minW0 = Math.min(minW0, it.wNew[0]);
      maxW0 = Math.max(maxW0, it.wNew[0]);
      minW1 = Math.min(minW1, it.wNew[1]);
      maxW1 = Math.max(maxW1, it.wNew[1]);
    }

    const w0Range = maxW0 - minW0;
    const w1Range = maxW1 - minW1;
    const pad0 = w0Range * 0.2;
    const pad1 = w1Range * 0.2;

    return {
      minW0: minW0 - pad0,
      maxW0: maxW0 + pad0,
      minW1: minW1 - pad1,
      maxW1: maxW1 + pad1,
      w0Range: w0Range + 2 * pad0,
      w1Range: w1Range + 2 * pad1
    };
  }, [gdFixedIterations]);

  const gdLSParamBounds = React.useMemo(() => {
    if (!gdLSIterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    for (const it of gdLSIterations) {
      minW0 = Math.min(minW0, it.wNew[0]);
      maxW0 = Math.max(maxW0, it.wNew[0]);
      minW1 = Math.min(minW1, it.wNew[1]);
      maxW1 = Math.max(maxW1, it.wNew[1]);
    }

    const w0Range = maxW0 - minW0;
    const w1Range = maxW1 - minW1;
    const pad0 = w0Range * 0.2;
    const pad1 = w1Range * 0.2;

    return {
      minW0: minW0 - pad0,
      maxW0: maxW0 + pad0,
      minW1: minW1 - pad1,
      maxW1: maxW1 + pad1,
      w0Range: w0Range + 2 * pad0,
      w1Range: w1Range + 2 * pad1
    };
  }, [gdLSIterations]);

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

  // Load experiment preset
  const loadExperiment = useCallback((experiment: ExperimentPreset) => {
    setExperimentLoading(true);
    setCurrentExperiment(experiment.id);

    try {
      // 1. Update hyperparameters
      if (experiment.hyperparameters.alpha !== undefined) {
        setGdFixedAlpha(experiment.hyperparameters.alpha);
      }
      if (experiment.hyperparameters.c1 !== undefined) {
        setGdLSC1(experiment.hyperparameters.c1);
        setNewtonC1(experiment.hyperparameters.c1);
        setLbfgsC1(experiment.hyperparameters.c1);
      }
      if (experiment.hyperparameters.lambda !== undefined) {
        setLambda(experiment.hyperparameters.lambda);
      }
      if (experiment.hyperparameters.m !== undefined) {
        setLbfgsM(experiment.hyperparameters.m);
      }
      if (experiment.hyperparameters.maxIter !== undefined) {
        // @ts-expect-error - setMaxIter will be added in Task 4
        setMaxIter(experiment.hyperparameters.maxIter);
      }

      // 2. Set initial point if specified
      if (experiment.initialPoint) {
        // @ts-expect-error - setInitialW0/W1 will be added in Task 4
        setInitialW0(experiment.initialPoint[0]);
        // @ts-expect-error - setInitialW0/W1 will be added in Task 4
        setInitialW1(experiment.initialPoint[1]);
      }

      // 3. Switch problem if needed
      if (experiment.problem !== 'logistic-regression') {
        setCurrentProblem(experiment.problem);
        setShowProblemSwitcher(true);

        const problem = getProblem(experiment.problem);
        if (problem) {
          console.log('Loaded problem:', problem.name);
          // Problem is now active via getCurrentProblem()
        }
      } else {
        setCurrentProblem('logistic-regression');
        setShowProblemSwitcher(false);
      }

      // 4. Load custom dataset if provided
      if (experiment.dataset) {
        // @ts-expect-error - DataPoint type mismatch will be resolved in Task 4
        setCustomPoints(experiment.dataset);
      }

      // 5. Reset algorithm to apply changes
      // @ts-expect-error - setCurrentIteration will be added in Task 4
      setCurrentIteration(0);
      // @ts-expect-error - setHistory will be added in Task 4
      setHistory([]);

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
    setCurrentExperiment(null);
    setShowProblemSwitcher(false);
    setGdFixedCurrentIter(0);
    setGdLSCurrentIter(0);
    setNewtonCurrentIter(0);
    setLbfgsCurrentIter(0);
    setCustomPoints([]);
  }, []);

  // Recompute algorithms when shared state changes
  useEffect(() => {
    if (data.length > 0) {
      setGdFixedIterations(runGradientDescent(data, 100, gdFixedAlpha, lambda));
      setGdFixedCurrentIter(0);
    }
  }, [data.length, lambda, gdFixedAlpha, customPoints.length]);

  useEffect(() => {
    if (data.length > 0) {
      setGdLSIterations(runGradientDescentLineSearch(data, 80, lambda, gdLSC1));
      setGdLSCurrentIter(0);
    }
  }, [data.length, lambda, gdLSC1, customPoints.length]);

  useEffect(() => {
    if (data.length > 0) {
      setNewtonIterations(runNewton(data, 15, lambda, newtonC1));
      setNewtonCurrentIter(0);
    }
  }, [data.length, lambda, newtonC1, customPoints.length]);

  useEffect(() => {
    if (data.length > 0) {
      setLbfgsIterations(runLBFGS(data, 25, lbfgsM, lambda, lbfgsC1));
      setLbfgsCurrentIter(0);
    }
  }, [data.length, lambda, lbfgsC1, lbfgsM, customPoints.length]);

  // Get current algorithm's iteration
  const getCurrentIter = () => {
    if (selectedTab === 'gd-fixed') {
      return gdFixedIterations[gdFixedCurrentIter] || gdFixedIterations[0];
    } else if (selectedTab === 'gd-linesearch') {
      return gdLSIterations[gdLSCurrentIter] || gdLSIterations[0];
    } else if (selectedTab === 'newton') {
      return newtonIterations[newtonCurrentIter] || newtonIterations[0];
    } else {
      return lbfgsIterations[lbfgsCurrentIter] || lbfgsIterations[0];
    }
  };

  const currentIter = getCurrentIter();

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
  }, [selectedTab, gdFixedCurrentIter, gdFixedIterations.length,
      gdLSCurrentIter, gdLSIterations.length,
      newtonCurrentIter, newtonIterations.length,
      lbfgsCurrentIter, lbfgsIterations.length]);

  // Keyboard shortcuts for experiments
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + E: Clear current experiment
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setCurrentExperiment(null);
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
    const x1 = (x / rect.width) * 6 - 3;
    const x2 = 2.5 - (y / rect.height) * 5;
    setCustomPoints([...customPoints, { x1, x2, y: addPointMode - 1 }]);
  };

  // Draw shared data space
  useEffect(() => {
    const canvas = dataCanvasRef.current;
    if (!canvas || !currentIter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const toCanvasX = (x1: number) => ((x1 + 3) / 6) * w;
    const toCanvasY = (x2: number) => ((2.5 - x2) / 5) * h;

    // Draw decision boundary from current algorithm
    const [w0, w1, w2] = currentIter.wNew;
    if (Math.abs(w1) > 1e-6) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x1 = -3; x1 <= 3; x1 += 0.1) {
        const x2 = -(w0 * x1 + w2) / w1;
        const cx = toCanvasX(x1);
        const cy = toCanvasY(x2);
        if (x1 === -3) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Draw points
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
  }, [data, currentIter, addPointMode, customPoints, selectedTab, newtonCurrentIter, lbfgsCurrentIter]);

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
    const cellSize = 80;
    const startX = 20;
    const startY = 40;

    // Draw matrix
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const x = startX + j * cellSize;
        const y = startY + i * cellSize;
        const val = H[i][j];

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

    // Labels
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6b7280';
    for (let i = 0; i < 3; i++) {
      ctx.textAlign = 'right';
      ctx.fillText(['w₀', 'w₁', 'w₂'][i], startX - 5, startY + i * cellSize + cellSize / 2);
      ctx.textAlign = 'center';
      ctx.fillText(['w₀', 'w₁', 'w₂'][i], startX + i * cellSize + cellSize / 2, startY - 10);
    }

    // Title
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'left';
    ctx.fillText('Hessian Matrix H', startX, 20);

    // Eigenvalues
    const eigY = startY + 250;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Eigenvalues (curvature):', 20, eigY);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#374151';
    iter.eigenvalues.forEach((eig, i) => {
      ctx.fillText(`λ${i + 1} = ${eig.toExponential(2)}`, 20, eigY + 20 + i * 18);
    });

    // Condition number
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(`Condition number: κ = ${iter.conditionNumber.toFixed(2)}`, 20, eigY + 80);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('(λ_max/λ_min - higher = harder to optimize)', 20, eigY + 95);
  }, [newtonIterations, newtonCurrentIter, selectedTab]);

  // Draw Newton's parameter space
  useEffect(() => {
    const canvas = newtonParamCanvasRef.current;
    if (!canvas || selectedTab !== 'newton') return;
    const iter = newtonIterations[newtonCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = newtonParamBounds;

    const resolution = 60;
    const lossValues: number[] = [];
    const problem = getCurrentProblem();

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        // Use problem interface for loss computation
        const loss = problem.dimensionality === 3
          ? problem.objective([w0, w1, 0])
          : problem.objective([w0, w1]);
        lossValues.push(loss);
      }
    }

    const minLoss = Math.min(...lossValues);
    const maxLoss = Math.max(...lossValues);
    const lossRange = maxLoss - minLoss;

    let lossIdx = 0;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const loss = lossValues[lossIdx++];
        const normalized = (loss - minLoss) / (lossRange + 1e-10);
        const intensity = 1 - normalized;

        const r = Math.floor(139 + (255 - 139) * intensity);
        const g = Math.floor(92 + (255 - 92) * intensity);
        const b = Math.floor(246 + (255 - 246) * intensity);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * (w / resolution), j * (h / resolution), w / resolution + 1, h / resolution + 1);
      }
    }

    const toCanvasX = (w0: number) => ((w0 - minW0) / w0Range) * w;
    const toCanvasY = (w1: number) => ((maxW1 - w1) / w1Range) * h;

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= newtonCurrentIter; i++) {
      const [w0, w1] = newtonIterations[i].wNew;
      const cx = toCanvasX(w0);
      const cy = toCanvasY(w1);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    const [w0, w1] = iter.wNew;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(toCanvasX(w0), toCanvasY(w1), 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`w₀: [${minW0.toFixed(1)}, ${maxW0.toFixed(1)}]`, w / 2, h - 5);
    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`w₁: [${minW1.toFixed(1)}, ${maxW1.toFixed(1)}]`, 0, 0);
    ctx.restore();
  }, [newtonCurrentIter, data, newtonIterations, newtonParamBounds, lambda, selectedTab]);

  // Draw Newton's line search
  useEffect(() => {
    const canvas = newtonLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'newton') return;
    const iter = newtonIterations[newtonCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const { alphaRange, lossValues, armijoValues } = iter.lineSearchCurve;
    const trials = iter.lineSearchTrials;

    const maxAlpha = Math.max(...alphaRange);
    const allValues = [...lossValues, ...armijoValues];
    const minLoss = Math.min(...allValues);
    const maxLoss = Math.max(...allValues);
    const lossRange = maxLoss - minLoss;

    const margin = { left: 60, right: 20, top: 30, bottom: 50 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    const toCanvasX = (alpha: number) => margin.left + (alpha / maxAlpha) * plotW;
    const toCanvasY = (loss: number) => margin.top + plotH - ((loss - minLoss) / (lossRange + 1e-10)) * plotH;

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

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

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(iter.loss), 6, 0, 2 * Math.PI);
    ctx.fill();

    trials.forEach((t) => {
      const cx = toCanvasX(t.alpha);
      const cy = toCanvasY(t.loss);

      ctx.fillStyle = t.satisfied ? '#10b981' : '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, t.satisfied ? 9 : 5, 0, 2 * Math.PI);
      ctx.fill();

      if (t.satisfied) {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`✓ Accept α=${t.alpha.toFixed(4)}`, cx + 12, cy - 10);
        ctx.fillText(`loss=${t.loss.toFixed(4)}`, cx + 12, cy + 5);
      }
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
  }, [newtonIterations, newtonCurrentIter, newtonC1, selectedTab]);

  // Draw L-BFGS parameter space
  useEffect(() => {
    const canvas = lbfgsParamCanvasRef.current;
    if (!canvas || selectedTab !== 'lbfgs') return;
    const iter = lbfgsIterations[lbfgsCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = lbfgsParamBounds;

    const resolution = 60;
    const lossValues = [];
    const problem = getCurrentProblem();

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        // Use problem interface for loss computation
        const loss = problem.dimensionality === 3
          ? problem.objective([w0, w1, 0])
          : problem.objective([w0, w1]);
        lossValues.push(loss);
      }
    }

    const minLoss = Math.min(...lossValues);
    const maxLoss = Math.max(...lossValues);
    const lossRange = maxLoss - minLoss;

    let lossIdx = 0;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const loss = lossValues[lossIdx++];
        const normalized = (loss - minLoss) / (lossRange + 1e-10);
        const intensity = 1 - normalized;

        const r = Math.floor(139 + (255 - 139) * intensity);
        const g = Math.floor(92 + (255 - 92) * intensity);
        const b = Math.floor(246 + (255 - 246) * intensity);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * (w / resolution), j * (h / resolution), w / resolution + 1, h / resolution + 1);
      }
    }

    const toCanvasX = (w0: number) => ((w0 - minW0) / w0Range) * w;
    const toCanvasY = (w1: number) => ((maxW1 - w1) / w1Range) * h;

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= lbfgsCurrentIter; i++) {
      const [w0, w1] = lbfgsIterations[i].wNew;
      const cx = toCanvasX(w0);
      const cy = toCanvasY(w1);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    const [w0, w1] = iter.wNew;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(toCanvasX(w0), toCanvasY(w1), 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`w₀: [${minW0.toFixed(1)}, ${maxW0.toFixed(1)}]`, w / 2, h - 5);
    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`w₁: [${minW1.toFixed(1)}, ${maxW1.toFixed(1)}]`, 0, 0);
    ctx.restore();
  }, [lbfgsCurrentIter, data, lbfgsIterations, lbfgsParamBounds, lambda, selectedTab]);

  // Draw L-BFGS line search
  useEffect(() => {
    const canvas = lbfgsLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'lbfgs') return;
    const iter = lbfgsIterations[lbfgsCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const { alphaRange, lossValues, armijoValues } = iter.lineSearchCurve;
    const trials = iter.lineSearchTrials;

    const maxAlpha = Math.max(...alphaRange);
    const allValues = [...lossValues, ...armijoValues];
    const minLoss = Math.min(...allValues);
    const maxLoss = Math.max(...allValues);
    const lossRange = maxLoss - minLoss;

    const margin = { left: 60, right: 20, top: 30, bottom: 50 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    const toCanvasX = (alpha: number) => margin.left + (alpha / maxAlpha) * plotW;
    const toCanvasY = (loss: number) => margin.top + plotH - ((loss - minLoss) / (lossRange + 1e-10)) * plotH;

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

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

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(iter.loss), 6, 0, 2 * Math.PI);
    ctx.fill();

    trials.forEach((t) => {
      const cx = toCanvasX(t.alpha);
      const cy = toCanvasY(t.loss);

      ctx.fillStyle = t.satisfied ? '#10b981' : '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, t.satisfied ? 9 : 5, 0, 2 * Math.PI);
      ctx.fill();

      if (t.satisfied) {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`✓ Accept α=${t.alpha.toFixed(4)}`, cx + 12, cy - 10);
        ctx.fillText(`loss=${t.loss.toFixed(4)}`, cx + 12, cy + 5);
      }
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
  }, [lbfgsIterations, lbfgsCurrentIter, lbfgsC1, selectedTab]);

  // Draw GD Fixed parameter space
  useEffect(() => {
    const canvas = gdFixedParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-fixed') return;
    const iter = gdFixedIterations[gdFixedCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = gdFixedParamBounds;

    const resolution = 60;
    const lossValues: number[] = [];
    const problem = getCurrentProblem();

    // Compute loss landscape
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        // Use problem interface for loss computation
        const loss = problem.dimensionality === 3
          ? problem.objective([w0, w1, 0])
          : problem.objective([w0, w1]);
        lossValues.push(loss);
      }
    }

    const minLoss = Math.min(...lossValues);
    const maxLoss = Math.max(...lossValues);
    const lossRange = maxLoss - minLoss;

    // Draw heatmap
    let lossIdx = 0;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const loss = lossValues[lossIdx++];
        const normalized = (loss - minLoss) / (lossRange + 1e-10);
        const intensity = 1 - normalized;

        const r = Math.floor(139 + (255 - 139) * intensity);
        const g = Math.floor(92 + (255 - 92) * intensity);
        const b = Math.floor(246 + (255 - 246) * intensity);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * (w / resolution), j * (h / resolution), w / resolution + 1, h / resolution + 1);
      }
    }

    const toCanvasX = (w0: number) => ((w0 - minW0) / w0Range) * w;
    const toCanvasY = (w1: number) => ((maxW1 - w1) / w1Range) * h;

    // Draw trajectory path
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= gdFixedCurrentIter; i++) {
      const [w0, w1] = gdFixedIterations[i].wNew;
      const cx = toCanvasX(w0);
      const cy = toCanvasY(w1);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw current position
    const [w0, w1] = iter.wNew;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(toCanvasX(w0), toCanvasY(w1), 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`w₀: [${minW0.toFixed(1)}, ${maxW0.toFixed(1)}]`, w / 2, h - 5);
    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`w₁: [${minW1.toFixed(1)}, ${maxW1.toFixed(1)}]`, 0, 0);
    ctx.restore();
  }, [gdFixedCurrentIter, data, gdFixedIterations, gdFixedParamBounds, lambda, selectedTab]);

  // Draw GD Line Search parameter space
  useEffect(() => {
    const canvas = gdLSParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLSIterations[gdLSCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = gdLSParamBounds;

    const resolution = 60;
    const lossValues = [];
    const problem = getCurrentProblem();

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        // Use problem interface for loss computation
        const loss = problem.dimensionality === 3
          ? problem.objective([w0, w1, 0])
          : problem.objective([w0, w1]);
        lossValues.push(loss);
      }
    }

    const minLoss = Math.min(...lossValues);
    const maxLoss = Math.max(...lossValues);
    const lossRange = maxLoss - minLoss;

    let lossIdx = 0;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const loss = lossValues[lossIdx++];
        const normalized = (loss - minLoss) / (lossRange + 1e-10);
        const intensity = 1 - normalized;

        const r = Math.floor(139 + (255 - 139) * intensity);
        const g = Math.floor(92 + (255 - 92) * intensity);
        const b = Math.floor(246 + (255 - 246) * intensity);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * (w / resolution), j * (h / resolution), w / resolution + 1, h / resolution + 1);
      }
    }

    const toCanvasX = (w0: number) => ((w0 - minW0) / w0Range) * w;
    const toCanvasY = (w1: number) => ((maxW1 - w1) / w1Range) * h;

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= gdLSCurrentIter; i++) {
      const [w0, w1] = gdLSIterations[i].wNew;
      const cx = toCanvasX(w0);
      const cy = toCanvasY(w1);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    const [w0, w1] = iter.wNew;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(toCanvasX(w0), toCanvasY(w1), 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`w₀: [${minW0.toFixed(1)}, ${maxW0.toFixed(1)}]`, w / 2, h - 5);
    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`w₁: [${minW1.toFixed(1)}, ${maxW1.toFixed(1)}]`, 0, 0);
    ctx.restore();
  }, [gdLSCurrentIter, data, gdLSIterations, gdLSParamBounds, lambda, selectedTab]);

  // Draw GD Line Search plot
  useEffect(() => {
    const canvas = gdLSLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLSIterations[gdLSCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const { alphaRange, lossValues, armijoValues } = iter.lineSearchCurve;
    const trials = iter.lineSearchTrials;

    const maxAlpha = Math.max(...alphaRange);
    const allValues = [...lossValues, ...armijoValues];
    const minLoss = Math.min(...allValues);
    const maxLoss = Math.max(...allValues);
    const lossRange = maxLoss - minLoss;

    const margin = { left: 60, right: 20, top: 30, bottom: 50 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    const toCanvasX = (alpha: number) => margin.left + (alpha / maxAlpha) * plotW;
    const toCanvasY = (loss: number) => margin.top + plotH - ((loss - minLoss) / (lossRange + 1e-10)) * plotH;

    // Draw axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

    // Draw Armijo boundary (dashed)
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

    // Draw actual loss curve
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

    // Draw starting point
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(iter.loss), 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw trials
    trials.forEach((t) => {
      const cx = toCanvasX(t.alpha);
      const cy = toCanvasY(t.loss);

      ctx.fillStyle = t.satisfied ? '#10b981' : '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, t.satisfied ? 9 : 5, 0, 2 * Math.PI);
      ctx.fill();

      if (t.satisfied) {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`✓ Accept α=${t.alpha.toFixed(4)}`, cx + 12, cy - 10);
        ctx.fillText(`loss=${t.loss.toFixed(4)}`, cx + 12, cy + 5);
      }
    });

    // Labels
    ctx.fillStyle = '#374151';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Step size α', w / 2, h - 10);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss', 0, 0);
    ctx.restore();
  }, [gdLSIterations, gdLSCurrentIter, gdLSC1, selectedTab]);

  if (!currentIter) return <div className="p-6">Loading...</div>;

  const currentIterNum = selectedTab === 'gd-fixed' ? gdFixedCurrentIter :
                        selectedTab === 'gd-linesearch' ? gdLSCurrentIter :
                        selectedTab === 'newton' ? newtonCurrentIter : lbfgsCurrentIter;

  const totalIters = selectedTab === 'gd-fixed' ? gdFixedIterations.length :
                     selectedTab === 'gd-linesearch' ? gdLSIterations.length :
                     selectedTab === 'newton' ? newtonIterations.length : lbfgsIterations.length;

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

      {/* Problem Formulation */}
      <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">Problem: Logistic Regression</h2>
        <div className="space-y-2 text-gray-800">
          <div><strong>Model:</strong> P(y=1|x) = σ(w₀·x₁ + w₁·x₂ + w₂)</div>
          <div><strong>Loss:</strong> f(w) = -(1/N) Σ [y log(σ(wᵀx)) + (1-y) log(1-σ(wᵀx))] + (λ/2)(w₀² + w₁²)</div>
          <div><strong>Goal:</strong> Find w* that minimizes f(w)</div>
        </div>
      </div>

      {/* Shared Data Space */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Data Space</h2>
        <div className="flex gap-6">
          <div className="flex-1">
            <canvas
              ref={dataCanvasRef}
              style={{width: '500px', height: '400px', cursor: addPointMode ? 'crosshair' : 'default'}}
              className="border border-gray-300 rounded"
              onClick={handleCanvasClick}
            />
          </div>
          <div className="w-64 space-y-4">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Regularization (λ)</h3>
              <input
                type="range"
                min="-6"
                max="-2"
                step="0.1"
                value={Math.log10(lambda)}
                onChange={(e) => setLambda(Math.pow(10, parseFloat(e.target.value)))}
                className="w-full"
              />
              <span className="text-sm">λ = {lambda.toExponential(1)}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Add Points</h3>
              <div className="flex gap-2 flex-col">
                <button
                  onClick={() => setAddPointMode(addPointMode === 1 ? 0 : 1)}
                  className={`px-3 py-2 rounded-lg text-sm ${addPointMode === 1 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
                >
                  {addPointMode === 1 ? '✓' : '+'} Class 0
                </button>
                <button
                  onClick={() => setAddPointMode(addPointMode === 2 ? 0 : 2)}
                  className={`px-3 py-2 rounded-lg text-sm ${addPointMode === 2 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
                >
                  {addPointMode === 2 ? '✓' : '+'} Class 1
                </button>
                {customPoints.length > 0 && (
                  <button
                    onClick={() => setCustomPoints([])}
                    className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
                  >
                    Clear ({customPoints.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Switcher */}
      {showProblemSwitcher && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Problem Type</h3>
          <select
            value={currentProblem}
            onChange={(e) => {
              const newProblem = e.target.value;
              setCurrentProblem(newProblem);

              // Reset algorithm state when problem changes
              setGdFixedCurrentIter(0);
              setGdFixedIterations([]);
              setGdLSCurrentIter(0);
              setGdLSIterations([]);
              setNewtonCurrentIter(0);
              setNewtonIterations([]);
              setLbfgsCurrentIter(0);
              setLbfgsIterations([]);

              // Get problem info for notification
              let problemName = 'Logistic Regression';
              if (newProblem !== 'logistic-regression') {
                const problem = getProblem(newProblem);
                if (problem) {
                  problemName = problem.name;
                  console.log('Switched to:', problem.name, 'Domain:', problem.domain);
                }
              }

              // Show notification
              setToast({
                message: `Switched to: ${problemName}`,
                type: 'info'
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="logistic-regression">Logistic Regression (current)</option>
            <option value="quadratic">Quadratic Bowl</option>
            <option value="ill-conditioned-quadratic">Ill-Conditioned Quadratic</option>
            <option value="rosenbrock">Rosenbrock Function</option>
            <option value="non-convex-saddle">Saddle Point</option>
          </select>
          <p className="text-xs text-gray-600 mt-2">
            Note: Problem switching affects visualization domain and objective function.
          </p>
        </div>
      )}

      {/* Algorithm Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
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
          {/* Algorithm-specific hyperparameters and controls */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex gap-4">
              {selectedTab === 'gd-fixed' ? (
                <div>
                  <label className="text-sm font-bold text-gray-700">Step size α:</label>
                  <input
                    type="range"
                    min="-3"
                    max="0"
                    step="0.1"
                    value={Math.log10(gdFixedAlpha)}
                    onChange={(e) => setGdFixedAlpha(Math.pow(10, parseFloat(e.target.value)))}
                    className="mx-2"
                  />
                  <span className="text-sm">{gdFixedAlpha.toFixed(3)}</span>
                </div>
              ) : selectedTab === 'gd-linesearch' ? (
                <div>
                  <label className="text-sm font-bold text-gray-700">Armijo c₁:</label>
                  <input
                    type="range"
                    min="-5"
                    max="-0.3"
                    step="0.1"
                    value={Math.log10(gdLSC1)}
                    onChange={(e) => setGdLSC1(Math.pow(10, parseFloat(e.target.value)))}
                    className="mx-2"
                  />
                  <span className="text-sm">{gdLSC1.toExponential(1)}</span>
                </div>
              ) : selectedTab === 'newton' ? (
                <div>
                  <label className="text-sm font-bold text-gray-700">Armijo c₁:</label>
                  <input
                    type="range"
                    min="-5"
                    max="-0.3"
                    step="0.1"
                    value={Math.log10(newtonC1)}
                    onChange={(e) => setNewtonC1(Math.pow(10, parseFloat(e.target.value)))}
                    className="mx-2"
                  />
                  <span className="text-sm">{newtonC1.toExponential(1)}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Memory M:</label>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      value={lbfgsM}
                      onChange={(e) => setLbfgsM(parseInt(e.target.value))}
                      className="mx-2"
                    />
                    <span className="text-sm">{lbfgsM}</span>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Armijo c₁:</label>
                    <input
                      type="range"
                      min="-5"
                      max="-0.3"
                      step="0.1"
                      value={Math.log10(lbfgsC1)}
                      onChange={(e) => setLbfgsC1(Math.pow(10, parseFloat(e.target.value)))}
                      className="mx-2"
                    />
                    <span className="text-sm">{lbfgsC1.toExponential(1)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (selectedTab === 'gd-fixed') setGdFixedCurrentIter(0);
                  else if (selectedTab === 'gd-linesearch') setGdLSCurrentIter(0);
                  else if (selectedTab === 'newton') setNewtonCurrentIter(0);
                  else setLbfgsCurrentIter(0);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg"
              >
                <RotateCcw size={18} />
                Reset
              </button>
              <button
                onClick={() => {
                  if (selectedTab === 'gd-fixed') setGdFixedCurrentIter(Math.max(0, gdFixedCurrentIter - 1));
                  else if (selectedTab === 'gd-linesearch') setGdLSCurrentIter(Math.max(0, gdLSCurrentIter - 1));
                  else if (selectedTab === 'newton') setNewtonCurrentIter(Math.max(0, newtonCurrentIter - 1));
                  else setLbfgsCurrentIter(Math.max(0, lbfgsCurrentIter - 1));
                }}
                disabled={currentIterNum === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
              >
                <ArrowLeft size={18} />
                Previous
              </button>
              <button
                onClick={() => {
                  if (selectedTab === 'gd-fixed') setGdFixedCurrentIter(Math.min(gdFixedIterations.length - 1, gdFixedCurrentIter + 1));
                  else if (selectedTab === 'gd-linesearch') setGdLSCurrentIter(Math.min(gdLSIterations.length - 1, gdLSCurrentIter + 1));
                  else if (selectedTab === 'newton') setNewtonCurrentIter(Math.min(newtonIterations.length - 1, newtonCurrentIter + 1));
                  else setLbfgsCurrentIter(Math.min(lbfgsIterations.length - 1, lbfgsCurrentIter + 1));
                }}
                disabled={currentIterNum === totalIters - 1}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
              >
                Next
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Current State */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold mb-3">Iteration {currentIter.iter} / {totalIters - 1}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Loss:</strong> {fmt(currentIter.newLoss)}</div>
              <div><strong>Gradient norm:</strong> {fmt(currentIter.gradNorm)}</div>
              <div><strong>Weights:</strong> {fmtVec(currentIter.wNew)}</div>
              <div><strong>Step size α:</strong> {fmt(currentIter.alpha)}</div>
            </div>
          </div>

          {/* Algorithm-specific visualizations */}
          {selectedTab === 'gd-fixed' ? (
            <>
              {/* GD Fixed - Why This Algorithm? */}
              <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-green-900 mb-4">Gradient Descent (Fixed Step)</h2>
                <p className="text-gray-800 text-lg">
                  The simplest optimization algorithm: follow the gradient downhill with constant step size α.
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
                title="Visual Guide"
                defaultExpanded={true}
                storageKey="gd-fixed-visual-guide"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>Left:</strong> Data space - decision boundary from current weights</p>
                  <p><strong>Right:</strong> Parameter space (w₀, w₁) - the loss landscape</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Lighter colors = lower loss (the valley we're searching for)</li>
                    <li>Orange path = trajectory of weights across iterations</li>
                    <li>Red dot = current position</li>
                  </ul>
                  <p className="mt-2">The gradient points perpendicular to contour lines (level sets).
                  We follow it downhill toward the minimum.</p>
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
                          <p className="font-semibold text-green-900">Success: Good Step Size (α=0.1)</p>
                          <p className="text-sm text-gray-700">
                            Well-chosen α leads to smooth convergence
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
                          <p className="font-semibold text-red-900">Failure: Too Large (α=2.5)</p>
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
                          <p className="font-semibold text-orange-900">Failure: Too Small (α=0.001)</p>
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
                            Elongated landscape causes zig-zagging
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Perpendicular steps to contours, slow progress
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
                        <p className="font-semibold">❌ "Just pick α=0.01 and it'll work"</p>
                        <p className="text-sm ml-6">
                          ✓ Optimal <InlineMath>\alpha</InlineMath> depends on problem scaling<br/>
                          ✓ May be too large for some problems, too small for others<br/>
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
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Choosing Step Size α</h3>
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
                      Where <InlineMath>\alpha &gt; 0</InlineMath> is the step size (learning rate).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Why This Works</h3>
                    <p>By Taylor expansion around <InlineMath>w_k</InlineMath>:</p>
                    <BlockMath>{'f(w_{k+1}) \\approx f(w_k) + \\nabla f(w_k)^T (w_{k+1} - w_k)'}</BlockMath>
                    <p className="text-sm mt-2">
                      Substituting the update rule:
                    </p>
                    <BlockMath>{'f(w_{k+1}) \\approx f(w_k) - \\alpha \\|\\nabla f(w_k)\\|^2'}</BlockMath>
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
                    <BlockMath>{'f(w) = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[y_i \\log(\\sigma(w^T x_i)) + (1-y_i) \\log(1-\\sigma(w^T x_i))\\right] + \\frac{\\lambda}{2}\\|w\\|^2'}</BlockMath>
                    <p className="text-sm mt-2"><strong>Gradient:</strong></p>
                    <BlockMath>{'\\nabla f(w) = \\frac{1}{N} \\sum_{i=1}^{N} (\\sigma(w^T x_i) - y_i) x_i + \\lambda w'}</BlockMath>
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

              {/* Experiment Indicator */}
              {currentExperiment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">▶</span>
                      <span className="text-sm font-semibold text-blue-900">
                        Experiment Active
                      </span>
                      <span className="text-sm text-gray-700">
                        {currentExperiment}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={resetToDefaults}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => {
                          setCurrentExperiment(null);
                          // Optionally reset to defaults
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+E</kbd> Clear experiment,{' '}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+R</kbd> Reset all
                  </p>
                </div>
              )}

              {/* GD Fixed Visualizations */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Loss landscape with optimization trajectory. Lighter = lower loss.
                </p>
                <canvas
                  ref={gdFixedParamCanvasRef}
                  style={{width: '700px', height: '500px'}}
                  className="border border-gray-300 rounded"
                />
              </div>
            </>
          ) : selectedTab === 'gd-linesearch' ? (
            <>
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

              {/* Visual Guide */}
              <CollapsibleSection
                title="Visual Guide"
                defaultExpanded={true}
                storageKey="gd-ls-visual-guide"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Parameter Space</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Trajectory shows <strong>adaptive step sizes</strong> changing iteration-to-iteration</li>
                      <li>Large steps when far from minimum, small steps when close</li>
                      <li>Direction is always <InlineMath>-\nabla f</InlineMath> (steepest descent)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">Line Search Panel</h3>
                    <p>Shows loss <InlineMath>f(w + \alpha p)</InlineMath> as function of step size <InlineMath>\alpha</InlineMath>:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>Blue curve:</strong> actual loss along search direction</li>
                      <li><strong>Orange dashed line:</strong> Armijo condition boundary</li>
                      <li><strong>Red dots:</strong> rejected steps (insufficient decrease)</li>
                      <li><strong>Green dot:</strong> accepted step (satisfies Armijo)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-2">What to Watch</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Number of backtracking steps varies by iteration</li>
                      <li>Early iterations may need more backtracking (landscape unfamiliar)</li>
                      <li>Near minimum, often accepts larger steps (landscape smoother)</li>
                    </ul>
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
                      <p className="font-semibold text-sm mb-2">Understanding c₁:</p>
                      <ul className="text-sm list-disc ml-6">
                        <li>
                          <strong>c₁ too small</strong> (e.g., 0.00001): accepts poor steps, wastes iterations
                        </li>
                        <li>
                          <strong>c₁ good</strong> (e.g., 0.0001): balances quality and efficiency
                        </li>
                        <li>
                          <strong>c₁ too large</strong> (e.g., 0.5): too conservative, tiny steps
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

                    <div className="border border-blue-200 rounded p-3 bg-blue-50">
                      <div className="flex items-start gap-2">
                        <button
                          className={`text-blue-600 font-bold text-lg hover:text-blue-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('gd-linesearch');
                            const exp = experiments.find(e => e.id === 'gd-ls-compare');
                            if (exp) loadExperiment(exp);
                            // TODO: Implement side-by-side comparison view
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Fixed vs Adaptive (coming soon)"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-blue-900">Compare: Fixed vs Adaptive</p>
                          <p className="text-sm text-gray-700">
                            Same problem with fixed α vs line search
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Line search more robust and efficient
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
                          <p className="font-semibold text-orange-900">Failure: c₁ Too Small</p>
                          <p className="text-sm text-gray-700">
                            c₁=0.00001 accepts poor steps, slow convergence
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
                          <p className="font-semibold text-red-900">Failure: c₁ Too Large</p>
                          <p className="text-sm text-gray-700">
                            c₁=0.5 is too conservative, rejects good steps
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
                            Observe: Adapts to narrow valley where fixed α fails
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    Note: One-click experiment loading coming soon!
                  </p>
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
                        <strong>Too many backtracking steps</strong> → c₁ too large, decrease it
                      </li>
                      <li>
                        <strong>Slow progress</strong> → c₁ too small, increase it (or use better algorithm)
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
                      <InlineMath>\nabla f^T p &lt; 0</InlineMath>, so the right side decreases
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
                      {'f(w + \\alpha p) \\leq f(w) + \\alpha \\nabla f^T p + \\frac{L\\alpha^2}{2}\\|p\\|^2'}
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
                      f(w + \alpha p) \approx f(w) + \alpha \nabla f^T p &lt; f(w) + c_1 \alpha \nabla f^T p
                    </BlockMath>
                    <p className="text-sm mt-2">
                      Since <InlineMath>c_1 &lt; 1</InlineMath> and{' '}
                      <InlineMath>\nabla f^T p &lt; 0</InlineMath>, Armijo condition satisfied.
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

              {/* Experiment Indicator */}
              {currentExperiment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">▶</span>
                      <span className="text-sm font-semibold text-blue-900">
                        Experiment Active
                      </span>
                      <span className="text-sm text-gray-700">
                        {currentExperiment}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={resetToDefaults}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => {
                          setCurrentExperiment(null);
                          // Optionally reset to defaults
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+E</kbd> Clear experiment,{' '}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+R</kbd> Reset all
                  </p>
                </div>
              )}

              {/* GD Line Search Visualizations */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape with trajectory. Notice adaptive step sizes.
                  </p>
                  <canvas
                    ref={gdLSParamCanvasRef}
                    style={{width: '400px', height: '333px'}}
                    className="border border-gray-300 rounded"
                  />
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Line Search</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Backtracking search for step size satisfying Armijo condition.
                  </p>
                  <canvas
                    ref={gdLSLineSearchCanvasRef}
                    style={{width: '400px', height: '280px'}}
                    className="border border-gray-300 rounded bg-white"
                  />
                </div>
              </div>
            </>
          ) : selectedTab === 'newton' ? (
            <>
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
                      toward the minimum.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">The Algorithm</h3>
                    <ol className="list-decimal ml-6 space-y-1">
                      <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
                      <li>Compute Hessian <InlineMath>H(w)</InlineMath> (matrix of all second derivatives)</li>
                      <li>Solve <InlineMath>Hp = -\nabla f</InlineMath> for search direction <InlineMath>p</InlineMath> (Newton direction)</li>
                      <li>Line search for step size <InlineMath>\alpha</InlineMath></li>
                      <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Key Formula</h3>
                    <p>Newton direction:</p>
                    <BlockMath>{'p = -H^{-1}\\nabla f'}</BlockMath>
                    <p className="text-sm mt-2">
                      Intuition: <InlineMath>{'H^{-1}'}</InlineMath> transforms the gradient into the
                      natural coordinate system of the problem.
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

                  <div className="bg-blue-100 rounded p-3">
                    <p className="font-bold text-sm">Assumptions:</p>
                    <ul className="text-sm list-disc ml-6">
                      <li>f is twice continuously differentiable</li>
                      <li>Hessian is positive definite (strongly convex) for guaranteed convergence</li>
                      <li>Line search used when H not positive definite or far from minimum</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Visual Guide */}
              <CollapsibleSection
                title="Visual Guide"
                defaultExpanded={true}
                storageKey="newton-visual-guide"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Parameter Space</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Trajectory takes <strong>fewer, larger steps</strong> than gradient descent</li>
                      <li>Steps are <strong>not perpendicular</strong> to contours (unlike steepest descent)</li>
                      <li>Near minimum, often <strong>converges in 2-3 iterations</strong></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Hessian Matrix Heatmap</h3>
                    <p>Shows curvature information: <InlineMath>{'H_{ij} = \\frac{\\partial^2 f}{\\partial w_i \\partial w_j}'}</InlineMath></p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>Diagonal:</strong> curvature along each parameter axis</li>
                      <li><strong>Off-diagonal:</strong> how parameters interact (cross-derivatives)</li>
                      <li><strong>Color intensity:</strong> magnitude of second derivatives</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Eigenvalue Display</h3>
                    <p>Shows <InlineMath>{'\\lambda_{\\min}'}</InlineMath>, <InlineMath>{'\\lambda_{\\max}'}</InlineMath>,
                       condition number <InlineMath>{'\\kappa = \\lambda_{\\max}/\\lambda_{\\min}'}</InlineMath></p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li><strong>All positive</strong> → local minimum (bowl-shaped)</li>
                      <li><strong>Some negative</strong> → saddle point (not a minimum)</li>
                      <li><strong>Large κ</strong> → ill-conditioned, but Newton handles better than GD</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Line Search Panel</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Often accepts <InlineMath>{'\\alpha = 1'}</InlineMath> (full Newton step) near minimum</li>
                      <li>Smaller <InlineMath>{'\\alpha'}</InlineMath> when far from minimum or Hessian approximation poor</li>
                      <li>Armijo condition ensures sufficient decrease</li>
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
                            Observe: All eigenvalues positive, α=1 accepted, dramatic loss drop
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
                            Observe: Backtracking reduces α, acts like damped Newton
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
                            Elongated ellipse (κ=100) where GD zig-zags but Newton excels
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: Newton converges in ~5 iterations (GD would take 100+)
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
                        <strong>Negative eigenvalues</strong> → add line search, consider modified Newton (H + λI)
                      </li>
                      <li>
                        <strong>Slow convergence</strong> → may be far from minimum (quadratic approximation poor)
                      </li>
                      <li>
                        <strong>Numerical issues</strong> → Hessian ill-conditioned, use iterative solvers or quasi-Newton
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
                      {'\\|e_{k+1}\\| \\leq C\\|e_k\\|^2'}
                    </BlockMath>
                    <p className="text-sm mt-2">
                      where <InlineMath>{'e_k = w_k - w^*'}</InlineMath> is the error.
                      Error <strong>squared</strong> at each iteration (very fast near solution).
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Requires:</strong> strong convexity, Lipschitz continuous Hessian,
                      starting close enough to <InlineMath>{'w^*'}</InlineMath>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2">Proof Sketch</h3>
                    <ol className="list-decimal ml-6 space-y-1 text-sm">
                      <li>Taylor expand f(w_k) and f(w*) around w_k</li>
                      <li>Use Newton update rule to relate w_{'{k+1}'} and w_k</li>
                      <li>Bound error using Hessian Lipschitz constant</li>
                      <li>Show error term is quadratic in current error</li>
                    </ol>
                    <p className="text-xs text-gray-600 mt-2">
                      Full proof requires Lipschitz continuity of the Hessian and bounds on eigenvalues.
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
                      <li>Large κ → elongated level sets (ill-conditioned)</li>
                      <li>Newton handles ill-conditioning <strong>better than gradient descent</strong></li>
                      <li>But numerical stability suffers with very large κ</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Modified Newton Methods</h3>

                    <div className="mt-2">
                      <p className="font-semibold">Levenberg-Marquardt:</p>
                      <BlockMath>{'p = -(H + \\lambda I)^{-1}\\nabla f'}</BlockMath>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>Adds regularization to make H positive definite</li>
                        <li>λ=0: pure Newton; λ→∞: gradient descent</li>
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

              {/* Experiment Indicator */}
              {currentExperiment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">▶</span>
                      <span className="text-sm font-semibold text-blue-900">
                        Experiment Active
                      </span>
                      <span className="text-sm text-gray-700">
                        {currentExperiment}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={resetToDefaults}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => {
                          setCurrentExperiment(null);
                          // Optionally reset to defaults
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+E</kbd> Clear experiment,{' '}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+R</kbd> Reset all
                  </p>
                </div>
              )}

              {/* Newton Visualizations */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Hessian Matrix & Eigenvalues</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Second derivatives capture curvature
                  </p>
                  <canvas ref={newtonHessianCanvasRef} style={{width: '400px', height: '400px'}} className="border border-gray-300 rounded" />
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape - Newton takes large, informed steps
                  </p>
                  <canvas ref={newtonParamCanvasRef} style={{width: '400px', height: '333px'}} className="border border-gray-300 rounded" />
                </div>
              </div>

              {/* Newton Line Search */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Line Search</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Finding the right step size along Newton direction
                </p>
                <canvas ref={newtonLineSearchCanvasRef} style={{width: '700px', height: '280px'}} className="border border-gray-300 rounded bg-white" />
              </div>
            </>
          ) : (
            <>
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
                      Hessian computation needed.
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
                    <p>
                      <strong>M = memory size</strong> (typically 5-20)
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Larger M = better Hessian approximation but more computation</li>
                      <li>M=10 often works well in practice</li>
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

              {/* L-BFGS - Visual Guide */}
              <CollapsibleSection
                title="Visual Guide"
                defaultExpanded={true}
                storageKey="lbfgs-visual-guide"
              >
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Parameter Space</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Trajectory takes <strong>Newton-like steps</strong> without computing Hessian</li>
                      <li>Steps adapt to problem curvature using history</li>
                      <li>Converges <strong>faster than gradient descent</strong>, nearly as fast as Newton</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Memory Pairs Visualization</h3>
                    <p>Recent <InlineMath>(s, y)</InlineMath> pairs shown as arrows:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        <InlineMath>s</InlineMath> = where we moved (parameter change)
                      </li>
                      <li>
                        <InlineMath>y</InlineMath> = how gradient changed (curvature signal)
                      </li>
                      <li>Older pairs fade out as new ones replace them</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Two-Loop Recursion</h3>
                    <p>Step-by-step transformation:</p>
                    <BlockMath>{'q = \\nabla f \\;\\rightarrow\\; \\ldots \\;\\rightarrow\\; p \\approx -H^{-1}\\nabla f'}</BlockMath>
                    <ul className="list-disc ml-6 space-y-1 text-sm">
                      <li><strong>Backward loop:</strong> process pairs from newest to oldest</li>
                      <li><strong>Forward loop:</strong> reconstruct from oldest to newest</li>
                      <li>Shows how gradient gets transformed using memory</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Line Search Panel</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Similar to Newton: often accepts large steps</li>
                      <li>
                        <InlineMath>\alpha &lt; 1</InlineMath> when approximation quality poor or
                        far from minimum
                      </li>
                      <li>Armijo condition ensures progress</li>
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

                    <div className="border border-green-200 rounded p-3 bg-green-50">
                      <div className="flex items-start gap-2">
                        <button
                          className="text-green-600 font-bold text-lg hover:text-green-700 disabled:opacity-50 ${
                            experimentLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`"
                          onClick={() => {
                            const experiments = getExperimentsForAlgorithm('lbfgs');
                            const exp = experiments.find(e => e.id === 'lbfgs-compare');
                            if (exp) loadExperiment(exp);
                            // TODO: Implement side-by-side comparison view
                          }}
                          disabled={experimentLoading}
                          aria-label="Load experiment: Compare L-BFGS vs GD vs Newton"
                        >
                          {experimentLoading ? <LoadingSpinner /> : '▶'}
                        </button>
                        <div>
                          <p className="font-semibold text-green-900">Compare: L-BFGS vs GD vs Newton</p>
                          <p className="text-sm text-gray-700">
                            See the speed/cost tradeoff across algorithms
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Observe: GD slow, Newton fast but expensive, L-BFGS best of both worlds
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
                        <strong>Slow convergence</strong> → increase M, improve initialization,
                        check smoothness assumptions
                      </li>
                      <li>
                        <strong>Oscillation</strong> → decrease M or line search c1 parameter
                      </li>
                      <li>
                        <strong>Memory issues</strong> → M too large for hardware, decrease M
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
                      Maintains positive definiteness if <InlineMath>y_k^T s_k &gt; 0</InlineMath>
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
                      <p className="font-semibold mb-2">Initialize:</p>
                      <div className="text-sm">
                        <InlineMath>{String.raw`r = H_0^{-1} q`}</InlineMath>, typically{' '}
                        <InlineMath>{String.raw`H_0^{-1} = \gamma I`}</InlineMath> where{' '}
                        <InlineMath>{String.raw`\gamma = s_{k-1}^T y_{k-1} / y_{k-1}^T y_{k-1}`}</InlineMath>
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

              {/* Experiment Indicator */}
              {currentExperiment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">▶</span>
                      <span className="text-sm font-semibold text-blue-900">
                        Experiment Active
                      </span>
                      <span className="text-sm text-gray-700">
                        {currentExperiment}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={resetToDefaults}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => {
                          setCurrentExperiment(null);
                          // Optionally reset to defaults
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+E</kbd> Clear experiment,{' '}
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+R</kbd> Reset all
                  </p>
                </div>
              )}

              {/* L-BFGS Visualizations */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape - lighter = lower loss. Trajectory descends toward minimum.
                  </p>
                  <canvas ref={lbfgsParamCanvasRef} style={{width: '400px', height: '333px'}} className="border border-gray-300 rounded" />
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Line Search</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Finding the right step size along search direction
                  </p>
                  <canvas ref={lbfgsLineSearchCanvasRef} style={{width: '400px', height: '280px'}} className="border border-gray-300 rounded bg-white" />
                </div>
              </div>

              {/* L-BFGS Memory Section */}
              <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-4">L-BFGS Memory</h2>
                <div className="space-y-3 text-gray-800 mb-4">
                  <p><strong>What it is:</strong> Instead of storing the full Hessian H (n×n matrix), we store only M={lbfgsM} recent (s, y) pairs.</p>
                  <p><strong>s</strong> = parameter change = w_new - w_old (where we moved)</p>
                  <p><strong>y</strong> = gradient change = ∇f_new - ∇f_old (how the slope changed)</p>
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
