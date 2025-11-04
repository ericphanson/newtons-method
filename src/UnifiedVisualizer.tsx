import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import {
  DataPoint,
  generateCrescents,
  setupCanvas,
  fmt,
  fmtVec,
  computeLossAndGradient
} from './shared-utils';
import { runNewton, NewtonIteration } from './algorithms/newton';
import { runLBFGS, LBFGSIteration } from './algorithms/lbfgs';
import { runGradientDescent, GDIteration } from './algorithms/gradient-descent';
import { runGradientDescentLineSearch, GDLineSearchIteration } from './algorithms/gradient-descent-linesearch';
import { CollapsibleSection } from './components/CollapsibleSection';

type Algorithm = 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';

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

  const data = [...baseData, ...customPoints];

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

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        const { loss } = computeLossAndGradient([w0, w1, 0], data, lambda);
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

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        const { loss } = computeLossAndGradient([w0, w1, 0], data, lambda);
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

    // Compute loss landscape
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        const { loss } = computeLossAndGradient([w0, w1, 0], data, lambda);
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

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        const { loss } = computeLossAndGradient([w0, w1, 0], data, lambda);
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
                title="What is Gradient Descent?"
                defaultExpanded={true}
                storageKey="gd-fixed-what"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>Goal:</strong> Find weights w that minimize loss f(w)</p>
                  <p><strong>Intuition:</strong> Imagine you're on a hillside in fog. You can feel the slope
                  under your feet (the gradient), but can't see the valley. Walk downhill repeatedly
                  until you reach the bottom.</p>
                  <p>The gradient ∇f tells you the direction of steepest ascent.
                  We go the opposite way: <strong>-∇f</strong> (steepest descent).</p>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="The Algorithm"
                defaultExpanded={true}
                storageKey="gd-fixed-algorithm"
              >
                <div className="space-y-3 text-gray-800">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Start with initial guess w₀ (e.g., all zeros)</li>
                    <li>Compute gradient: g = ∇f(w)</li>
                    <li>Take a step downhill: <strong>w_new = w_old - α·g</strong></li>
                    <li>Repeat steps 2-3 until gradient is tiny (converged)</li>
                  </ol>
                  <div className="mt-4 bg-green-200 rounded p-4">
                    <p className="font-bold">Key parameter: α (step size)</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Too small → slow progress, many iterations</li>
                      <li>Too large → overshoot minimum, oscillate or diverge</li>
                      <li>Just right → steady progress toward minimum</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="The Mathematics"
                defaultExpanded={false}
                storageKey="gd-fixed-math"
              >
                <div className="space-y-3 text-gray-800 font-mono text-sm">
                  <div>
                    <p className="font-bold">Loss function:</p>
                    <p>f(w) = -(1/N) Σ [y log(σ(wᵀx)) + (1-y) log(1-σ(wᵀx))] + (λ/2)||w||²</p>
                  </div>
                  <div>
                    <p className="font-bold">Gradient (vector of partial derivatives):</p>
                    <p>∇f(w) = [∂f/∂w₀, ∂f/∂w₁, ∂f/∂w₂]ᵀ</p>
                  </div>
                  <div>
                    <p className="font-bold">For logistic regression:</p>
                    <p>∇f(w) = (1/N) Σ (σ(wᵀx) - y)·x + λw</p>
                  </div>
                  <div>
                    <p className="font-bold">Update rule:</p>
                    <p>w⁽ᵏ⁺¹⁾ = w⁽ᵏ⁾ - α∇f(w⁽ᵏ⁾)</p>
                  </div>
                  <div>
                    <p className="font-bold">Convergence criterion:</p>
                    <p>||∇f(w)|| &lt; ε (e.g., ε = 10⁻⁶)</p>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="What You're Seeing"
                defaultExpanded={true}
                storageKey="gd-fixed-viz"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>Left:</strong> Data space - decision boundary from current weights</p>
                  <p><strong>Right:</strong> Parameter space (w₀, w₁) - the loss landscape</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
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
                defaultExpanded={false}
                storageKey="gd-fixed-try"
              >
                <div className="space-y-2 text-gray-800">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Set α = 0.001: Watch it take tiny steps. How many iterations to converge?</li>
                    <li>Set α = 0.5: Watch it oscillate. Why does it zig-zag?</li>
                    <li>Set α = 1.5: Does it diverge completely?</li>
                    <li>Add custom points: Does the landscape change? Does the same α still work?</li>
                  </ul>
                </div>
              </CollapsibleSection>

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
              {/* GD Line Search content will go here in next task */}
            </>
          ) : selectedTab === 'newton' ? (
            <>
              {/* Newton's Method - Why Newton? */}
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Why Newton's Method?</h2>
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">The Core Idea</h3>
                    <p>Instead of just following the gradient (steepest descent), Newton's method uses <strong>curvature information</strong> from the Hessian matrix to take smarter steps toward the minimum.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">The Math</h3>
                    <p><strong>Newton direction:</strong> p = -H⁻¹∇f</p>
                    <p className="text-sm mt-1">Where H is the Hessian (matrix of second derivatives). This accounts for how quickly the gradient changes in different directions.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">The Advantage</h3>
                    <p><strong>Quadratic convergence:</strong> Near the minimum, the error decreases quadratically each iteration. Much faster than gradient descent's linear convergence!</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">The Cost</h3>
                    <p><strong>Computing H:</strong> O(n²) operations</p>
                    <p><strong>Inverting H:</strong> O(n³) operations</p>
                    <p className="text-sm mt-1">For large problems (n=1000+), this becomes prohibitively expensive. This motivates L-BFGS!</p>
                  </div>
                </div>
              </div>

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
              {/* L-BFGS - Why L-BFGS? */}
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-yellow-900 mb-4">Why L-BFGS?</h2>
                <div className="space-y-4 text-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">The Goal</h3>
                    <p>We want to find weights w that minimize our loss function f(w). Think of it as finding the lowest point in a hilly landscape.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Gradient Descent (The Slow Way)</h3>
                    <p><strong>Idea:</strong> Always walk downhill (opposite of gradient).</p>
                    <p><strong>Direction:</strong> p = -∇f (just the negative gradient)</p>
                    <p><strong>Problem:</strong> Takes tiny steps, doesn't know about curvature. Can zig-zag and converge slowly.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Newton's Method (The Ideal)</h3>
                    <p><strong>Idea:</strong> Use second derivatives (curvature) to take smarter, larger steps directly toward the minimum.</p>
                    <p><strong>Direction:</strong> p = -H⁻¹∇f where H is the Hessian matrix (all second derivatives)</p>
                    <p><strong>Problem:</strong> Computing and inverting H is expensive: O(n³) time and O(n²) memory. For n=1000 parameters, that's computing 1 million values!</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">L-BFGS (The Clever Compromise)</h3>
                    <p><strong>Idea:</strong> Approximate H⁻¹∇f without ever computing the Hessian!</p>
                    <p><strong>How:</strong> Store only M=5 recent (parameter change, gradient change) pairs. Use these to implicitly capture curvature information.</p>
                    <p><strong>Cost:</strong> O(m·n) time, O(m·n) memory where m=5. For n=1000: only 5000 values instead of 1 million!</p>
                    <p><strong>Benefit:</strong> Gets Newton-like convergence speed with gradient-descent-like memory usage.</p>
                  </div>
                  <div className="bg-yellow-200 rounded p-4">
                    <p className="font-bold">In This Visualization:</p>
                    <p className="text-sm">Watch how L-BFGS takes larger, smarter steps than gradient descent would, by approximating the Hessian using only recent history. The two-loop recursion is the algorithm that makes this magic happen!</p>
                  </div>
                </div>
              </div>

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
    </div>
  );
};

export default UnifiedVisualizer;
