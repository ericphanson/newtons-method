import { ExperimentPreset } from '../types/experiments';
import { gdFixedExperiments } from './gd-fixed-presets';
import { gdLinesearchExperiments } from './gd-linesearch-presets';
import { newtonExperiments } from './newton-presets';
import { lbfgsExperiments } from './lbfgs-presets';

export const experimentRegistry = {
  'gd-fixed': gdFixedExperiments,
  'gd-linesearch': gdLinesearchExperiments,
  'newton': newtonExperiments,
  'lbfgs': lbfgsExperiments,
};

export function getExperimentsForAlgorithm(algorithm: string): ExperimentPreset[] {
  return experimentRegistry[algorithm as keyof typeof experimentRegistry] || [];
}

export { gdFixedExperiments, gdLinesearchExperiments, newtonExperiments, lbfgsExperiments };
