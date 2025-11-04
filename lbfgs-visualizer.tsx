import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Play } from 'lucide-react';

// Utility functions
const sigmoid = (z) => {
  const clipped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clipped));
};

const clip = (val, min, max) => Math.max(min, Math.min(max, val));

// Generate properly interleaved crescent dataset
const generateCrescents = () => {
  const points = [];
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

const computeLossAndGradient = (w, data, lambda) => {
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

const dot = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);
const norm = (v) => Math.sqrt(dot(v, v));
const scale = (v, s) => v.map(x => x * s);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);

const runLBFGS = (data, maxIter = 25, M = 5, lambda = 0.0001, c1 = 0.0001) => {
  const iterations = [];
  let w = [0.1, 0.1, 0.0];
  const memory = [];
  
  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);
    
    let direction, twoLoopData = null;
    
    if (iter === 0 || memory.length === 0) {
      direction = scale(grad, -1);
    } else {
      const q = [...grad];
      const alphas = [];
      const firstLoop = [];
      
      for (let i = memory.length - 1; i >= 0; i--) {
        const { s, y, rho } = memory[i];
        const alpha = rho * dot(s, q);
        alphas.unshift(alpha);
        for (let j = 0; j < q.length; j++) {
          q[j] -= alpha * y[j];
        }
        firstLoop.push({
          i: memory.length - i,
          rho,
          sTq: dot(s, grad),
          alpha,
          q: [...q]
        });
      }
      
      const lastMem = memory[memory.length - 1];
      const gamma = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
      const r = scale(q, gamma);
      
      const secondLoop = [];
      for (let i = 0; i < memory.length; i++) {
        const { s, y, rho } = memory[i];
        const beta = rho * dot(y, r);
        const correction = alphas[i] - beta;
        for (let j = 0; j < r.length; j++) {
          r[j] += correction * s[j];
        }
        secondLoop.push({
          i: i + 1,
          yTr: dot(y, scale(r, 1 / (1 + correction / alphas[i]))),
          beta,
          alpha: alphas[i],
          correction,
          r: [...r]
        });
      }
      
      direction = scale(r, -1);
      twoLoopData = { firstLoop, gamma, secondLoop, alphas };
    }
    
    const rho = 0.5;
    const dirGrad = dot(direction, grad);
    let alpha = 1.0;
    const lineSearchTrials = [];
    
    const alphaRange = [];
    const lossValues = [];
    const armijoValues = [];
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
    const { loss: newLoss, grad: newGrad } = computeLossAndGradient(wNew, data, lambda);
    
    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      direction,
      alpha: acceptedAlpha,
      wNew: [...wNew],
      newLoss,
      memory: memory.map(m => ({ ...m })),
      twoLoopData,
      lineSearchTrials,
      lineSearchCurve: { alphaRange, lossValues, armijoValues }
    });
    
    if (iter > 0) {
      const s = sub(wNew, w);
      const y = sub(newGrad, grad);
      const sTy = dot(s, y);
      
      if (sTy > 1e-10) {
        memory.push({ s, y, rho: 1 / sTy });
        if (memory.length > M) memory.shift();
      }
    }
    
    w = wNew;
    
    if (gradNorm < 1e-5) break;
  }
  
  return iterations;
};

const setupCanvas = (canvas) => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height: rect.height };
};

const LBFGSVisualizer = () => {
  const [baseData] = useState(() => generateCrescents());
  const [customPoints, setCustomPoints] = useState([]);
  const [lambda, setLambda] = useState(0.0001);
  const [c1, setC1] = useState(0.0001);
  const [addPointMode, setAddPointMode] = useState(0); // 0 = off, 1 = class 0, 2 = class 1
  const [iterations, setIterations] = useState([]);
  const [currentIter, setCurrentIter] = useState(0);
  const canvasRef = useRef(null);
  const paramCanvasRef = useRef(null);
  const lineSearchCanvasRef = useRef(null);
  
  const data = [...baseData, ...customPoints];
  const iter = iterations[currentIter] || iterations[0];
  
  // Recompute when data or lambda changes
  useEffect(() => {
    if (data.length > 0) {
      const newIterations = runLBFGS(data, 25, 5, lambda, c1);
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
    const handleKeyDown = (e) => {
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
  const handleCanvasClick = (e) => {
    if (addPointMode === 0) return;
    
    const canvas = canvasRef.current;
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
    
    const toCanvasX = (x1) => ((x1 + 3) / 6) * w;
    const toCanvasY = (x2) => ((2.5 - x2) / 5) * h;
    
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
    
    // Show mode indicator
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
    
    const toCanvasX = (w0) => ((w0 - minW0) / w0Range) * w;
    const toCanvasY = (w1) => ((maxW1 - w1) / w1Range) * h;
    
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
    
    const toCanvasX = (alpha) => margin.left + (alpha / maxAlpha) * plotW;
    const toCanvasY = (loss) => margin.top + plotH - ((loss - minLoss) / (lossRange + 1e-10)) * plotH;
    
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
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Start: loss=${iter.loss.toFixed(4)}`, toCanvasX(0) - 10, toCanvasY(iter.loss) - 10);
    
    trials.forEach((t, idx) => {
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
    ctx.fillText('Step size α (how far to move along search direction)', w / 2, h - 10);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss value', 0, 0);
    ctx.restore();
    
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Blue curve: actual loss f(w + αp) along direction p', margin.left, 15);
    ctx.fillText(`Orange dashed: Armijo bound with c₁=${c1.toExponential(1)}`, margin.left, 28);
  }, [iter, c1]);
  
  const fmt = (val) => val.toFixed(6);
  const fmtVec = (vec) => `[${vec.map(v => v.toFixed(4)).join(', ')}]`;
  
  if (!iter) return <div className="p-6">Loading...</div>;
  
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Understanding L-BFGS for Logistic Regression
        </h1>
        <p className="text-gray-600 mb-4">
          An interactive step-by-step guide through the optimization algorithm
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
      
      {/* Problem Formulation */}
      <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">Problem Formulation</h2>
        <div className="space-y-3 text-gray-800">
          <div>
            <strong>Model:</strong> P(y=1|x) = σ(w₀·x₁ + w₁·x₂ + w₂)
          </div>
          <div>
            <strong>Loss function:</strong> f(w) = -(1/N) Σᵢ [yᵢ log(σ(wᵀxᵢ)) + (1-yᵢ) log(1-σ(wᵀxᵢ))] + (λ/2)(w₀² + w₁²)
          </div>
          <div>
            <strong>Gradient:</strong> ∇f(w) = (1/N) Σᵢ (σ(wᵀxᵢ) - yᵢ) · xᵢ + λ[w₀, w₁, 0]ᵀ
          </div>
          <div>
            <strong>Goal:</strong> Find w* that minimizes f(w). The data is not linearly separable, so we find the best linear approximation.
          </div>
        </div>
      </div>
      
      {/* Newton's Method Context */}
      <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-yellow-900 mb-4">The Big Picture: Why L-BFGS?</h2>
        
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">🎯 The Goal</h3>
            <p>We want to find weights w that minimize our loss function f(w). Think of it as finding the lowest point in a hilly landscape.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">📉 Gradient Descent (The Slow Way)</h3>
            <p><strong>Idea:</strong> Always walk downhill (opposite of gradient).</p>
            <p><strong>Direction:</strong> p = -∇f (just the negative gradient)</p>
            <p><strong>Problem:</strong> Takes tiny steps, doesn't know about curvature. Can zig-zag and converge slowly.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">🚀 Newton's Method (The Ideal)</h3>
            <p><strong>Idea:</strong> Use second derivatives (curvature) to take smarter, larger steps directly toward the minimum.</p>
            <p><strong>Direction:</strong> p = -H⁻¹∇f where H is the Hessian matrix (all second derivatives)</p>
            <p><strong>Problem:</strong> Computing and inverting H is expensive: O(n³) time and O(n²) memory. For n=1000 parameters, that's computing 1 million values!</p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">⚡ L-BFGS (The Clever Compromise)</h3>
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
      
      {/* Problem Formulation */}
      <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">Problem Formulation</h2>
        <div className="space-y-3 text-gray-800">
          <div>
            <strong>Model:</strong> P(y=1|x) = σ(w₀·x₁ + w₁·x₂ + w₂)
          </div>
          <div>
            <strong>Loss function:</strong> f(w) = -(1/N) Σᵢ [yᵢ log(σ(wᵀxᵢ)) + (1-yᵢ) log(1-σ(wᵀxᵢ))] + (λ/2)(w₀² + w₁²)
          </div>
          <div>
            <strong>Gradient:</strong> ∇f(w) = (1/N) Σᵢ (σ(wᵀxᵢ) - yᵢ) · xᵢ + λ[w₀, w₁, 0]ᵀ
          </div>
          <div>
            <strong>Goal:</strong> Find w* that minimizes f(w). The data is not linearly separable, so we find the best linear approximation.
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
              Penalizes large weights. Higher λ = simpler model, smoother loss landscape.
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
              Controls line search strictness. Smaller c₁ = accept steps more easily. Typical: 10⁻⁴.
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
              Click data space to add custom points and see how optimization changes.
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
      
      {/* Visualizations */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Data Space</h3>
          <p className="text-sm text-gray-600 mb-3">
            Decision boundary evolution. {addPointMode > 0 ? '👆 Click to add points!' : 'Click "Add Class" buttons to customize.'}
          </p>
          <canvas 
            ref={canvasRef} 
            style={{width: '400px', height: '333px', cursor: addPointMode ? 'crosshair' : 'default'}} 
            className="border border-gray-300 rounded"
            onClick={handleCanvasClick}
          />
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Class 0</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Class 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-green-500"></div>
              <span>Boundary</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Loss landscape - lighter = lower loss. Trajectory descends toward minimum.
          </p>
          <canvas ref={paramCanvasRef} style={{width: '400px', height: '333px'}} className="border border-gray-300 rounded" />
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-orange-500"></div>
              <span>Trajectory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-100"></div>
              <span>Dark=high, Light=low</span>
            </div>
          </div>
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
            <div><strong>Search direction p:</strong> {fmtVec(iter.direction)}</div>
            <div><strong>Step size α:</strong> {fmt(iter.alpha)}</div>
            <div><strong>New weights w_new:</strong> {fmtVec(iter.wNew)}</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <strong>Method used:</strong> {iter.iter === 0 ? 'Steepest descent (first iteration - no memory yet)' : 'L-BFGS with two-loop recursion (using stored curvature pairs)'}
        </div>
      </div>
      
      {/* Memory Section */}
      {iter.memory.length > 0 && (
        <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">L-BFGS Memory</h2>
          <div className="space-y-3 text-gray-800 mb-4">
            <p><strong>What it is:</strong> Instead of storing the full Hessian H (n×n matrix), we store only M=5 recent (s, y) pairs.</p>
            <p><strong>s</strong> = parameter change = w_new - w_old (where we moved)</p>
            <p><strong>y</strong> = gradient change = ∇f_new - ∇f_old (how the slope changed)</p>
            <p><strong>Why it works:</strong> These pairs implicitly capture curvature: "when we moved in direction s, the gradient changed by y". This is enough to approximate H⁻¹!</p>
          </div>
          
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
                {iter.memory.map((mem, idx) => (
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
        </div>
      )}
      
      {/* Two-Loop Recursion */}
      {iter.twoLoopData && (
        <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4">Two-Loop Recursion Details</h2>
          <div className="space-y-3 text-gray-800 mb-4">
            <p><strong>Goal:</strong> Compute p ≈ -H⁻¹∇f using only the stored (s, y) pairs.</p>
            <p><strong>Intuition:</strong> Transform the gradient by "undoing" the effect of past updates (first loop), scale by typical curvature, then "redo" them with corrections (second loop).</p>
            <p><strong>Efficiency:</strong> O(m·n) = O(5·3) = 15 operations vs O(n³) = O(27) for full Hessian inversion!</p>
          </div>
          
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
                {iter.twoLoopData.firstLoop.map((row, idx) => (
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
            <p className="font-mono">γ = (sₘᵀyₘ)/(yₘᵀyₘ) = {fmt(iter.twoLoopData.gamma)}</p>
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
                {iter.twoLoopData.secondLoop.map((row, idx) => (
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
            <p><strong>p = -r = {fmtVec(iter.direction)}</strong></p>
            <p className="text-sm mt-2">This is our Newton-like direction that accounts for curvature!</p>
          </div>
        </div>
      )}
      
      {/* Line Search */}
      <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-green-900 mb-4">Line Search with Armijo Condition</h2>
        <div className="space-y-3 text-gray-800 mb-4">
          <p><strong>What this does:</strong> We have direction p. Now find step size α: how far to move?</p>
          <p><strong>Strategy:</strong> Start with α = 1 (full Newton step). If loss doesn't decrease enough, try α = 0.5, then 0.25, etc.</p>
          <p><strong>Armijo condition:</strong> Accept α when f(w + αp) ≤ f(w) + c₁·α·(pᵀ∇f)</p>
          <p><strong>What c₁ means:</strong> The constant c₁ = {c1.toExponential(1)} is a <em>hyperparameter</em> that controls how strict we are:</p>
          <ul className="list-disc ml-8 space-y-1">
            <li><strong>Small c₁ (10⁻⁵ to 10⁻⁴):</strong> Very lenient - accept almost any decrease. Faster steps but less cautious.</li>
            <li><strong>Medium c₁ (10⁻² to 10⁻¹):</strong> Balanced - require reasonable decrease.</li>
            <li><strong>Large c₁ (0.5):</strong> Very strict - demand substantial decrease. More cautious but slower.</li>
          </ul>
          <p>The term pᵀ∇f is the directional derivative (how much we expect loss to decrease). The condition says: "actual decrease must be at least c₁ times the expected decrease."</p>
          <p className="text-sm italic">💡 Try adjusting c₁ in the controls above to see how it affects line search trials!</p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-bold text-green-800 mb-2">Line Search Visualization</h3>
          <p className="text-sm text-gray-600 mb-3">
            Blue curve: actual loss as we move along direction p. Must drop below orange dashed line (Armijo bound) to be accepted.
          </p>
          <canvas ref={lineSearchCanvasRef} style={{width: '700px', height: '280px'}} className="border border-gray-300 rounded bg-white" />
          <div className="mt-2 flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span>Actual loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-orange-500"></div>
              <span>Armijo bound</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <span>Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Accepted</span>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-green-800 mb-2">Trial History</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
            <thead className="bg-green-200">
              <tr>
                <th className="px-4 py-2 text-left">Trial</th>
                <th className="px-4 py-2 text-left">α</th>
                <th className="px-4 py-2 text-left">f(w + αp)</th>
                <th className="px-4 py-2 text-left">Armijo RHS</th>
                <th className="px-4 py-2 text-left">Satisfied?</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {iter.lineSearchTrials.map((trial, idx) => (
                <tr key={idx} className={`border-t border-green-200 ${trial.satisfied ? 'bg-green-50' : ''}`}>
                  <td className="px-4 py-2 font-mono">{trial.trial}</td>
                  <td className="px-4 py-2 font-mono">{fmt(trial.alpha)}</td>
                  <td className="px-4 py-2 font-mono">{fmt(trial.loss)}</td>
                  <td className="px-4 py-2 font-mono">{fmt(trial.armijoRHS)}</td>
                  <td className="px-4 py-2">{trial.satisfied ? '✓ Yes' : '✗ No'}</td>
                  <td className="px-4 py-2">{trial.satisfied ? 'Accept' : 'Reject, try α/2'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-green-200 rounded p-4">
          <strong>Result:</strong> Step w_new = w + {fmt(iter.alpha)}·p gives loss = {fmt(iter.newLoss)} (found after {iter.lineSearchTrials.length} trial{iter.lineSearchTrials.length > 1 ? 's' : ''})
        </div>
      </div>
      
      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Key Insights</h2>
        <ul className="space-y-2 text-gray-800">
          <li><strong>✓ Newton-like steps</strong> without computing expensive Hessian matrix</li>
          <li><strong>✓ Limited memory:</strong> Only M=5 (s, y) pairs vs full n×n matrix</li>
          <li><strong>✓ Two-loop recursion:</strong> Clever O(m·n) algorithm to approximate H⁻¹∇f</li>
          <li><strong>✓ Adaptive line search:</strong> Automatically finds good step sizes</li>
          <li><strong>✓ Fast convergence:</strong> Curvature information → fewer iterations than gradient descent</li>
        </ul>
      </div>
    </div>
  );
};

export default LBFGSVisualizer;