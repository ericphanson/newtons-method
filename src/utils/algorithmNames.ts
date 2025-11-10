/**
 * Display names for algorithm identifiers
 * Used in UI components like story banner and toast messages
 */
export const ALGORITHM_DISPLAY_NAMES: Record<string, string> = {
  'gd-fixed': 'GD (Fixed Step)',
  'gd-linesearch': 'GD (Line Search)',
  'diagonal-precond': 'Diagonal Precond',
  'newton': "Newton's Method",
  'lbfgs': 'L-BFGS',
};

/**
 * Get display name for an algorithm ID
 * @param algorithmId - Algorithm identifier (e.g., 'newton', 'gd-fixed')
 * @returns Human-readable algorithm name
 * @throws Error if algorithm ID is unknown
 */
export function getAlgorithmDisplayName(algorithmId: string): string {
  const name = ALGORITHM_DISPLAY_NAMES[algorithmId];
  if (!name) {
    throw new Error(`Unknown algorithm ID: ${algorithmId}`);
  }
  return name;
}
