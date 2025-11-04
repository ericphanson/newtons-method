import {
  DataPoint,
  LineSearchTrial,
  computeLossAndGradient,
  dot,
  norm,
  scale,
  add,
  sub
} from '../shared-utils';

export interface MemoryPair {
  s: number[];
  y: number[];
  rho: number;
}

export interface TwoLoopData {
  firstLoop: Array<{
    i: number;
    rho: number;
    sTq: number;
    alpha: number;
    q: number[];
  }>;
  gamma: number;
  secondLoop: Array<{
    i: number;
    yTr: number;
    beta: number;
    alpha: number;
    correction: number;
    r: number[];
  }>;
  alphas: number[];
}

export interface LBFGSIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
  memory: MemoryPair[];
  twoLoopData: TwoLoopData | null;
  lineSearchTrials: LineSearchTrial[];
  lineSearchCurve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

export const runLBFGS = (
  data: DataPoint[],
  maxIter = 25,
  M = 5,
  lambda = 0.0001,
  c1 = 0.0001
): LBFGSIteration[] => {
  const iterations: LBFGSIteration[] = [];
  let w = [0.1, 0.1, 0.0];
  const memory: MemoryPair[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);

    let direction: number[];
    let twoLoopData: TwoLoopData | null = null;

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
