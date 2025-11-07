import { ExperimentPreset } from '../types/experiments';
import { gdFixedExperiments } from './gd-fixed-presets';
import { gdLinesearchExperiments } from './gd-linesearch-presets';
import { diagonalPrecondExperiments } from './diagonal-precond-presets';
import { newtonExperiments } from './newton-presets';
import { lbfgsExperiments } from './lbfgs-presets';

/**
 * Registry of all available experiments organized by algorithm
 */
export const experimentRegistry = {
  'gd-fixed': gdFixedExperiments,
  'gd-linesearch': gdLinesearchExperiments,
  'diagonal-precond': diagonalPrecondExperiments,
  'newton': newtonExperiments,
  'lbfgs': lbfgsExperiments,
};

/**
 * Get all experiments for a specific algorithm
 * @param algorithm Algorithm identifier
 * @returns Array of experiment presets for the algorithm
 */
export function getExperimentsForAlgorithm(algorithm: string): ExperimentPreset[] {
  return experimentRegistry[algorithm as keyof typeof experimentRegistry] || [];
}

export { gdFixedExperiments, gdLinesearchExperiments, diagonalPrecondExperiments, newtonExperiments, lbfgsExperiments };
