/**
 * Check if a problem requires a dataset as input
 * @param problemType The problem type to check
 * @returns true if the problem is logistic-regression or separating-hyperplane
 */
export function isDatasetProblem(problemType: string | undefined): boolean {
  return problemType === 'logistic-regression' || problemType === 'separating-hyperplane';
}

/**
 * Construct initial point array based on problem dimensionality
 * All problems now use 2D [w0, w1]
 * (Bias for dataset problems is a separate parameter, not part of weights)
 *
 * @param problemType The problem type
 * @param w0 First weight parameter
 * @param w1 Second weight parameter
 * @returns Initial point array (always 2D)
 */
export function constructInitialPoint(
  problemType: string,
  w0: number,
  w1: number
): [number, number] {
  return [w0, w1];
}
