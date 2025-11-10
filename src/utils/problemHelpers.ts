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
 * Dataset problems (logistic regression, separating hyperplane) use 3D [w0, w1, bias]
 * Pure optimization problems use 2D [w0, w1]
 *
 * @param problemType The problem type
 * @param w0 First weight parameter
 * @param w1 Second weight parameter
 * @returns Initial point array with correct dimensionality
 */
export function constructInitialPoint(
  problemType: string,
  w0: number,
  w1: number
): [number, number] | [number, number, number] {
  return isDatasetProblem(problemType)
    ? [w0, w1, 0]
    : [w0, w1];
}
