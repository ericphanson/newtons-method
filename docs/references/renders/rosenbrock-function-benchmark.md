# rosenbrock-function-benchmark

## Reference

H. H. Rosenbrock. *An Automatic Method for Finding the Greatest or Least Value of a Function*. The Computer Journal, 3:175-184, 1960.

**File:** `rosenbrock1960.pdf`

## Claim



## Quote

> f(x,y) = 100(y - x²)² + (1 - x)²

**Pages:** 1-10

## Reader Notes

The Rosenbrock function, introduced by H.H. Rosenbrock in 1960, is one of the most famous benchmark functions for testing optimization algorithms. The function creates a narrow, curved valley (resembling a banana) where the global minimum is easy to find but difficult to converge to, making it ideal for demonstrating the challenges of non-convex optimization. The function is defined on variables x,y ranging from 0 to 1, with global minimum at (1,1).

## Internal Notes

BENCHMARK FUNCTION ATTRIBUTION: This citation provides historical attribution for the Rosenbrock function (also known as Rosenbrock's valley or banana function), a classic non-convex test problem for optimization algorithms. The function f(x,y) = (1-x)² + 100(y-x²)² (equivalently written as 100(y-x²)² + (1-x)²) appears in Table 1 on page 178 as a test example. The parameter 100 is the coefficient b that controls the steepness of the valley. This citation is for attribution only - no specific theorem or claim is being cited. The 'claim' field is intentionally empty for benchmark function attributions.

## Verification

**Verified:** 2025-11-12

**Verified By:** adversarial-verification-agent-batch6-agent6

**Verification Notes:** ADVERSARIAL VERIFICATION: Extracted all 10 pages of the original 1960 paper. The Rosenbrock function f(x,y) = 100(y-x²)² + (1-x)² appears in Table 1 on page 178 (PDF page 4) as a test example for the optimization method. Added proofPages (page 1 for title/attribution, page 4 for function definition). Added quote showing the exact function form. Verified that the function form in the notes matches the actual paper (it does). Page numbers 175-184 are correct (printed page numbers match). The function definition is accurate.

## Used In

- rosenbrockProblem
- ProblemExplainer

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/rosenbrock1960_page_0001.png)

### Page 2

![Proof page 2](../extracted-pages/rosenbrock1960_page_0004.png)

