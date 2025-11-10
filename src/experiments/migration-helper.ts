import { ExperimentPreset } from '../types/experiments';

/**
 * Normalize experiment preset to use problemParameters
 * Converts legacy fields to new format during migration
 */
export function normalizeExperimentPreset(preset: ExperimentPreset): ExperimentPreset {
  const normalized = { ...preset };

  // Migrate legacy parameter fields to problemParameters
  if (!normalized.problemParameters) {
    normalized.problemParameters = {};
  }

  if (preset.rotationAngle !== undefined) {
    normalized.problemParameters.rotationAngle = preset.rotationAngle;
  }

  if (preset.conditionNumber !== undefined) {
    normalized.problemParameters.conditionNumber = preset.conditionNumber;
  }

  if (preset.rosenbrockB !== undefined) {
    normalized.problemParameters.rosenbrockB = preset.rosenbrockB;
  }

  return normalized;
}
