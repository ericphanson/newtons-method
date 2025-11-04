import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Home } from 'lucide-react';

// Type definitions
interface DataPoint {
  x1: number;
  x2: number;
  y: number;
}

interface LineSearchTrial {
  trial: number;
  alpha: number;
  loss: number;
  armijoRHS: number;
  satisfied: boolean;
}

interface Iteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  hessian: number[][];
  eigenvalues: number[];
  conditionNumber: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
  lineSearchTrials: LineSearchTrial[];
  lineSearchCurve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

// Utility functions
const sigmoid = (z: number) => {
  const clipped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clipped));
};

const clip = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

// Generate properly interleaved crescent dataset
const generateCrescents = (): DataPoint[] => {
  const points: DataPoint[] = [];
  const n = 70;
  const noise = 0.25;
  const seed = 42;

  let rng = seed;
  const random = () => {
    rng = (rng * 1664525 + 1013904223) % 4294967296;
    return rng / 4294967296;
  };

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const angle = Math.PI * 0.65 * t + Math.PI * 0.25;
    const radius = 2.2;
    const x1 = radius * Math.cos(angle) + (random() - 0.5) * noise;
    const x2 = radius * Math.sin(angle) + 0.5 + (random() - 0.5) * noise;
    points.push({ x1, x2, y: 0 });
  }

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const angle = -Math.PI * 0.65 * t + Math.PI * 0.75;
    const radius = 2.2;
    const x1 = radius * Math.cos(angle) + (random() - 0.5) * noise;
    const x2 = radius * Math.sin(angle) - 0.5 + (random() - 0.5) * noise;
    points.push({ x1, x2, y: 1 });
  }

  return points;
};

const computeLossAndGradient = (w: number[], data: DataPoint[], lambda: number) => {
  const [w0, w1, w2] = w;
  let loss = 0;
  const grad = [0, 0, 0];

  for (const point of data) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const pred = sigmoid(z);
    const clippedPred = clip(pred, 1e-15, 1 - 1e-15);

    loss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));

    const error = pred - point.y;
    grad[0] += error * point.x1;
    grad[1] += error * point.x2;
    grad[2] += error;
  }

  loss = loss / data.length + (lambda / 2) * (w0 * w0 + w1 * w1);
  grad[0] = grad[0] / data.length + lambda * w0;
  grad[1] = grad[1] / data.length + lambda * w1;
  grad[2] = grad[2] / data.length;

  return { loss, grad };
};

// Compute Hessian matrix (second derivatives) for logistic regression
const computeHessian = (w: number[], data: DataPoint[], lambda: number): number[][] => {
  const [w0, w1, w2] = w;
  const H: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (const point of data) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const sig = sigmoid(z);
    const factor = sig * (1 - sig);

    // H[i][j] = (1/N) * Σ σ(z)(1-σ(z)) * xi * xj
    const x = [point.x1, point.x2, 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        H[i][j] += factor * x[i] * x[j];
      }
    }
  }

  // Normalize and add regularization
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      H[i][j] /= data.length;
    }
  }

  // Add regularization only to w0 and w1 (not bias)
  H[0][0] += lambda;
  H[1][1] += lambda;

  return H;
};

// Simple matrix inversion using Gaussian elimination (for 3x3)
const invertMatrix = (A: number[][]): number[][] | null => {
  const n = A.length;
  const augmented: number[][] = A.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      return null;
    }

    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j < 2 * n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  for (let i = n - 1; i >= 0; i--) {
    for (let k = i - 1; k >= 0; k--) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
    // Normalize row
    const divisor = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= divisor;
    }
  }

  // Extract inverse
  return augmented.map(row => row.slice(n));
};

// Compute eigenvalues for 3x3 matrix (using power iteration for largest, deflation for others)
const computeEigenvalues = (A: number[][]): number[] => {
  const n = A.length;
  const eigenvalues: number[] = [];
  const AMat = A.map(row => [...row]);

  for (let eig = 0; eig < n; eig++) {
    let v = Array(n).fill(1);
    let lambda = 0;

    // Power iteration
    for (let iter = 0; iter < 50; iter++) {
      const Av = v.map((_, i) => AMat[i].reduce((sum, val, j) => sum + val * v[j], 0));
      lambda = Math.sqrt(Av.reduce((sum, val) => sum + val * val, 0));
      v = Av.map(val => val / lambda);
    }

    eigenvalues.push(lambda);

    // Deflate matrix (remove contribution of found eigenvector)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        AMat[i][j] -= lambda * v[i] * v[j];
      }
    }
  }

  return eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
};

const dot = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);
const norm = (v: number[]) => Math.sqrt(dot(v, v));
const scale = (v: number[], s: number) => v.map(x => x * s);
const add = (a: number[], b: number[]) => a.map((x, i) => x + b[i]);

const runNewton = (data: DataPoint[], maxIter = 15, lambda = 0.0001, c1 = 0.0001): Iteration[] => {
  const iterations: Iteration[] = [];
  let w = [0.1, 0.1, 0.0];

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);
    const hessian = computeHessian(w, data, lambda);
    const eigenvalues = computeEigenvalues(hessian);
    const conditionNumber = Math.abs(eigenvalues[0]) / Math.abs(eigenvalues[eigenvalues.length - 1]);

    // Compute Newton direction
    const HInv = invertMatrix(hessian);
    let direction: number[];

    if (HInv === null) {
      // Fallback to gradient descent if Hessian is singular
      direction = scale(grad, -1);
    } else {
      // direction = -H^(-1) * grad
      direction = HInv.map(row => -dot(row, grad));
    }

    // Line search with Armijo condition
    const rho = 0.5;
    const dirGrad = dot(direction, grad);
    let alpha = 1.0;
    const lineSearchTrials: LineSearchTrial[] = [];

    const alphaRange: number[] = [];
    const lossValues: number[] = [];
    const armijoValues: number[] = [];
    for (let a = 0; a <= 1.0; a += 0.02) {
      const wTest = add(w, scale(direction, a));
      const { loss: testLoss } = computeLossAndGradient(wTest, data, lambda);
      alphaRange.push(a);
      lossValues.push(testLoss);
      armijoValues.push(loss + c1 * a * dirGrad);
    }

    for (let trial = 0; trial < 20; trial++) {
      const wNew = add(w, scale(direction, alpha));
      const { loss: newLoss } = computeLossAndGradient(wNew, data, lambda);
      const armijoRHS = loss + c1 * alpha * dirGrad;
      const satisfied = newLoss <= armijoRHS;

      lineSearchTrials.push({
        trial: trial + 1,
        alpha,
        loss: newLoss,
        armijoRHS,
        satisfied
      });

      if (satisfied) break;
      alpha *= rho;
    }

    const acceptedAlpha = lineSearchTrials[lineSearchTrials.length - 1].alpha;
    const wNew = add(w, scale(direction, acceptedAlpha));
    const { loss: newLoss } = computeLossAndGradient(wNew, data, lambda);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      hessian: hessian.map(row => [...row]),
      eigenvalues: [...eigenvalues],
      conditionNumber,
      direction,
      alpha: acceptedAlpha,
      wNew: [...wNew],
      newLoss,
      lineSearchTrials,
      lineSearchCurve: { alphaRange, lossValues, armijoValues }
    });

    w = wNew;

    if (gradNorm < 1e-5) break;
  }

  return iterations;
};

const setupCanvas = (canvas: HTMLCanvasElement) => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height: rect.height };
};

const NewtonVisualizer = () => {
  const [baseData] = useState(() => generateCrescents());
  const [customPoints, setCustomPoints] = useState<DataPoint[]>([]);
  const [lambda, setLambda] = useState(0.0001);
  const [c1, setC1] = useState(0.0001);
  const [addPointMode, setAddPointMode] = useState(0); // 0 = off, 1 = class 0, 2 = class 1
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [currentIter, setCurrentIter] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramCanvasRef = useRef<HTMLCanvasElement>(null);
  const hessianCanvasRef = useRef<HTMLCanvasElement>(null);
  const lineSearchCanvasRef = useRef<HTMLCanvasElement>(null);

  const data = [...baseData, ...customPoints];
  const iter = iterations[currentIter] || iterations[0];

  // Recompute when data or lambda changes
  useEffect(() => {
    if (data.length > 0) {
      const newIterations = runNewton(data, 15, lambda, c1);
      setIterations(newIterations);
      setCurrentIter(0);
    }
  }, [data.length, lambda, c1, customPoints.length]);

  const paramBounds = React.useMemo(() => {
    if (!iterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    for (const it of iterations) {
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
  }, [iterations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIter > 0) {
        setCurrentIter(currentIter - 1);
      } else if (e.key === 'ArrowRight' && currentIter < iterations.length - 1) {
        setCurrentIter(currentIter + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIter, iterations.length]);

  // Handle canvas click to add points
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (addPointMode === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const x1 = (x / rect.width) * 6 - 3;
    const x2 = 2.5 - (y / rect.height) * 5;

    setCustomPoints([...customPoints, { x1, x2, y: addPointMode - 1 }]);
  };

  // Draw data space
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const toCanvasX = (x1: number) => ((x1 + 3) / 6) * w;
    const toCanvasY = (x2: number) => ((2.5 - x2) / 5) * h;

    const [w0, w1, w2] = iter.wNew;
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

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), h);
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(w, toCanvasY(0));
    ctx.stroke();

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
  }, [currentIter, data, iter, addPointMode, customPoints]);

  // Draw parameter space
  useEffect(() => {
    const canvas = paramCanvasRef.current;
    if (!canvas || !iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = paramBounds;

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
    for (let i = 0; i <= currentIter; i++) {
      const [w0, w1] = iterations[i].wNew;
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
  }, [currentIter, data, iter, iterations, paramBounds, lambda]);

  // Draw Hessian matrix
  useEffect(() => {
    const canvas = hessianCanvasRef.current;
    if (!canvas || !iter) return;

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
  }, [iter]);

  // Draw line search
  useEffect(() => {
    const canvas = lineSearchCanvasRef.current;
    if (!canvas || !iter) return;

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
  }, [iter, c1]);

  const fmt = (val: number) => val.toFixed(6);
  const fmtVec = (vec: number[]) => `[${vec.map(v => v.toFixed(4)).join(', ')}]`;

  if (!iter) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      {/* Navigation */}
      <div className="mb-4 flex gap-3">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-300">
          <Home size={18} />
          Home
        </Link>
        <Link to="/lbfgs" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Next: L-BFGS
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Understanding Newton's Method for Optimization
        </h1>
        <p className="text-gray-600 mb-4">
          An interactive step-by-step guide through Newton's method using second-order derivatives
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentIter(0)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <button
              onClick={() => setCurrentIter(Math.max(0, currentIter - 1))}
              disabled={currentIter === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            <button
              onClick={() => setCurrentIter(Math.min(iterations.length - 1, currentIter + 1))}
              disabled={currentIter === iterations.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              Iteration {iter.iter} / {iterations.length - 1}
            </div>
            <div className="text-lg text-gray-700">
              Loss: {fmt(iter.newLoss)}
            </div>
            <div className="text-sm text-gray-500">
              Tip: Use arrow keys (← →) to navigate
            </div>
          </div>
        </div>
      </div>

      {/* Why Newton */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Why Newton's Method?</h2>

        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">🎯 The Core Idea</h3>
            <p>Instead of just following the gradient (steepest descent), Newton's method uses <strong>curvature information</strong> from the Hessian matrix to take smarter steps toward the minimum.</p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">🧮 The Math</h3>
            <p><strong>Newton direction:</strong> p = -H⁻¹∇f</p>
            <p className="text-sm mt-1">Where H is the Hessian (matrix of second derivatives). This accounts for how quickly the gradient changes in different directions.</p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">⚡ The Advantage</h3>
            <p><strong>Quadratic convergence:</strong> Near the minimum, the error decreases quadratically each iteration. Much faster than gradient descent's linear convergence!</p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">💰 The Cost</h3>
            <p><strong>Computing H:</strong> O(n²) operations</p>
            <p><strong>Inverting H:</strong> O(n³) operations</p>
            <p className="text-sm mt-1">For large problems (n=1000+), this becomes prohibitively expensive. This motivates L-BFGS!</p>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Data Space</h3>
          <p className="text-sm text-gray-600 mb-3">
            Decision boundary evolution
          </p>
          <canvas
            ref={canvasRef}
            style={{width: '400px', height: '333px', cursor: addPointMode ? 'crosshair' : 'default'}}
            className="border border-gray-300 rounded"
            onClick={handleCanvasClick}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Loss landscape - Newton takes large, informed steps
          </p>
          <canvas ref={paramCanvasRef} style={{width: '400px', height: '333px'}} className="border border-gray-300 rounded" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Hessian Matrix & Eigenvalues</h3>
          <p className="text-sm text-gray-600 mb-3">
            Second derivatives capture curvature
          </p>
          <canvas ref={hessianCanvasRef} style={{width: '400px', height: '400px'}} className="border border-gray-300 rounded" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Line Search</h3>
          <p className="text-sm text-gray-600 mb-3">
            Finding the right step size along Newton direction
          </p>
          <canvas ref={lineSearchCanvasRef} style={{width: '400px', height: '280px'}} className="border border-gray-300 rounded bg-white" />
        </div>
      </div>

      {/* Current State */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Iteration State</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div><strong>Current weights w:</strong> {fmtVec(iter.w)}</div>
            <div><strong>Gradient ∇f:</strong> {fmtVec(iter.grad)}</div>
            <div><strong>Gradient norm ‖∇f‖:</strong> {fmt(iter.gradNorm)}</div>
          </div>
          <div className="space-y-2">
            <div><strong>Newton direction p:</strong> {fmtVec(iter.direction)}</div>
            <div><strong>Step size α:</strong> {fmt(iter.alpha)}</div>
            <div><strong>New weights w_new:</strong> {fmtVec(iter.wNew)}</div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="bg-gradient-to-r from-cyan-100 to-cyan-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-cyan-900 mb-4">Interactive Controls</h2>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Regularization (λ)</h3>
            <p className="text-sm text-gray-700 mb-3">
              Penalizes large weights. Higher λ = simpler model.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="-6"
                max="-2"
                step="0.1"
                value={Math.log10(lambda)}
                onChange={(e) => setLambda(Math.pow(10, parseFloat(e.target.value)))}
                className="flex-1"
              />
              <span className="font-mono text-sm w-24">λ = {lambda.toExponential(1)}</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2">Armijo Constant (c₁)</h3>
            <p className="text-sm text-gray-700 mb-3">
              Controls line search strictness. Typical: 10⁻⁴.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="-5"
                max="-0.3"
                step="0.1"
                value={Math.log10(c1)}
                onChange={(e) => setC1(Math.pow(10, parseFloat(e.target.value)))}
                className="flex-1"
              />
              <span className="font-mono text-sm w-24">c₁ = {c1.toExponential(1)}</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2">Add Data Points</h3>
            <p className="text-sm text-gray-700 mb-3">
              Click data space to add custom points.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setAddPointMode(addPointMode === 1 ? 0 : 1)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm ${
                  addPointMode === 1
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {addPointMode === 1 ? '✓' : '+'} Class 0
              </button>
              <button
                onClick={() => setAddPointMode(addPointMode === 2 ? 0 : 2)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm ${
                  addPointMode === 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {addPointMode === 2 ? '✓' : '+'} Class 1
              </button>
              {customPoints.length > 0 && (
                <button
                  onClick={() => setCustomPoints([])}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Clear ({customPoints.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewtonVisualizer;
