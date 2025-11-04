import { add, scale, dot } from '../shared-utils';
import { LineSearchResult, ComputeLossAndGrad } from './types';

/**
 * Armijo backtracking line search
 *
 * Finds a step size alpha that satisfies the Armijo condition:
 * f(w + alpha*p) <= f(w) + c1*alpha*(grad^T*p)
 *
 * @param w Current weights
 * @param direction Search direction p
 * @param grad Current gradient
 * @param loss Current loss value
 * @param computeLossAndGrad Function to compute loss at any point
 * @param c1 Armijo constant (typically 1e-4)
 * @param rho Backtracking factor (typically 0.5)
 * @param maxTrials Maximum number of backtracking steps
 * @returns LineSearchResult with accepted alpha and trial history
 */
export const armijoLineSearch = (
  w: number[],
  direction: number[],
  grad: number[],
  loss: number,
  computeLossAndGrad: ComputeLossAndGrad,
  c1: number = 0.0001,
  rho: number = 0.5,
  maxTrials: number = 20
): LineSearchResult => {
  const dirGrad = dot(direction, grad);
  let alpha = 1.0;
  const trials: LineSearchResult['trials'] = [];

  // Build curve for visualization (sample alpha from 0 to 1)
  const alphaRange: number[] = [];
  const lossValues: number[] = [];
  const armijoValues: number[] = [];

  for (let a = 0; a <= 1.0; a += 0.02) {
    const wTest = add(w, scale(direction, a));
    const { loss: testLoss } = computeLossAndGrad(wTest);
    alphaRange.push(a);
    lossValues.push(testLoss);
    armijoValues.push(loss + c1 * a * dirGrad);
  }

  // Backtracking search
  for (let trial = 0; trial < maxTrials; trial++) {
    const wNew = add(w, scale(direction, alpha));
    const { loss: newLoss } = computeLossAndGrad(wNew);
    const armijoRHS = loss + c1 * alpha * dirGrad;
    const satisfied = newLoss <= armijoRHS;

    trials.push({
      trial: trial + 1,
      alpha,
      loss: newLoss,
      armijoRHS,
      satisfied
    });

    if (satisfied) {
      return {
        alpha,
        newLoss,
        trials,
        curve: { alphaRange, lossValues, armijoValues }
      };
    }

    alpha *= rho;
  }

  // If no alpha satisfied, return the last one tried
  const lastTrial = trials[trials.length - 1];
  return {
    alpha: lastTrial.alpha,
    newLoss: lastTrial.loss,
    trials,
    curve: { alphaRange, lossValues, armijoValues }
  };
};
