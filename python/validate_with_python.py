#!/usr/bin/env python3
"""Python validation suite - compares TS algorithms against scipy."""

import argparse
import sys
from pathlib import Path
import numpy as np

from problems import get_problem
from data_problems import get_data_problem
from scipy_runner import run_scipy_optimizer
from ts_runner import run_typescript_test
from comparator import compare_results, ComparisonStatus


# Test case definitions
PURE_PROBLEMS = ['quadratic', 'ill-conditioned-quadratic', 'rosenbrock', 'non-convex-saddle', 'himmelblau', 'three-hump-camel']
ALGORITHMS = ['gd-fixed', 'gd-linesearch', 'newton', 'lbfgs']
SVM_VARIANTS = ['soft-margin', 'perceptron', 'squared-hinge']


def get_test_cases() -> list[dict]:
    """Generate all test case configurations."""
    test_cases = []

    # Pure optimization problems (2D)
    for problem in PURE_PROBLEMS:
        for algorithm in ALGORITHMS:
            test_case = {
                'problem': problem,
                'algorithm': algorithm,
                'initial': [1.0, 1.0],
                'max_iter': 100,
                'tol': 1e-6
            }

            # Special parameters
            if algorithm == 'gd-fixed':
                if problem == 'rosenbrock':
                    test_case['alpha'] = 0.001  # Rosenbrock needs small step
                elif problem == 'ill-conditioned-quadratic':
                    test_case['alpha'] = 0.01
                    test_case['max_iter'] = 1000
                else:
                    test_case['alpha'] = 0.1

            test_cases.append(test_case)

    # Logistic regression (3D with bias)
    for algorithm in ALGORITHMS:
        test_case = {
            'problem': 'logistic-regression',
            'algorithm': algorithm,
            'initial': [0.0, 0.0, 0.0],
            'max_iter': 100,
            'lambda': 0.01,
            'tol': 1e-6
        }
        if algorithm == 'gd-fixed':
            test_case['alpha'] = 0.1
        test_cases.append(test_case)

    # SVM variants (3D with bias)
    for variant in SVM_VARIANTS:
        for algorithm in ALGORITHMS:
            test_case = {
                'problem': 'separating-hyperplane',
                'variant': variant,
                'algorithm': algorithm,
                'initial': [0.0, 0.0, 0.0],
                'max_iter': 100,
                'lambda': 0.01,
                'tol': 1e-6
            }
            if algorithm == 'gd-fixed':
                test_case['alpha'] = 0.1
            test_cases.append(test_case)

    return test_cases


def format_test_name(test_case: dict) -> str:
    """Format test case name for display."""
    name = f"{test_case['problem']} + {test_case['algorithm']}"
    if 'variant' in test_case:
        name = f"{test_case['problem']}[{test_case['variant']}] + {test_case['algorithm']}"
    return name


def run_single_test(test_case: dict, verbose: bool = False) -> tuple[ComparisonStatus, dict]:
    """Run a single test case comparing Python and TS."""

    # Get problem instance
    if test_case['problem'] in PURE_PROBLEMS:
        problem = get_problem(test_case['problem'])
    else:
        # Data-based problem
        dataset_path = str(Path(__file__).parent / 'datasets' / 'crescent.json')
        problem = get_data_problem(
            test_case['problem'],
            test_case.get('variant'),
            dataset_path,
            test_case.get('lambda', 0.01)
        )

    # Run Python
    python_result = run_scipy_optimizer(
        problem,
        test_case['algorithm'],
        test_case['initial'],
        test_case['max_iter'],
        tol=test_case.get('tol', 1e-6),
        alpha=test_case.get('alpha')
    )

    # Run TypeScript
    ts_result = run_typescript_test(
        problem=test_case['problem'],
        algorithm=test_case['algorithm'],
        initial=test_case['initial'],
        max_iter=test_case['max_iter'],
        alpha=test_case.get('alpha'),
        lambda_reg=test_case.get('lambda'),
        variant=test_case.get('variant')
    )

    # Compare
    status, details = compare_results(python_result, ts_result, test_case['problem'])

    return status, details, python_result, ts_result


def print_test_result(test_name: str, status: ComparisonStatus, details: dict, verbose: bool):
    """Print result for a single test."""
    print(f"\n{test_name}")
    print(f"  {status.value}")

    if verbose or status != ComparisonStatus.PASS:
        # Show details
        py = details['python']
        ts = details['ts']
        print(f"    Python: converged={py['converged']}, iters={py['iterations']}, "
              f"loss={py['final_loss']:.2e}, grad_norm={py['final_grad_norm']:.2e}")
        print(f"    TS:     converged={ts['converged']}, iters={ts['iterations']}, "
              f"loss={ts['final_loss']:.2e}, grad_norm={ts['final_grad_norm']:.2e}")

    # Show issues
    if details['issues']:
        for issue in details['issues']:
            print(f"    - {issue}")


def print_summary(results: dict):
    """Print final summary."""
    total = len(results['pass']) + len(results['suspicious']) + len(results['fail'])

    print(f"\n{'='*60}")
    print(f"RESULTS: {total} tests")
    print(f"{'='*60}")
    print(f"✅ PASS:       {len(results['pass'])} tests")
    print(f"⚠️  SUSPICIOUS: {len(results['suspicious'])} tests")
    print(f"❌ FAIL:       {len(results['fail'])} tests")

    if results['fail']:
        print(f"\n{'='*60}")
        print("FAILURES:")
        print(f"{'='*60}")
        for item in results['fail']:
            print(f"\n❌ {item['test_name']}")
            for issue in item['details']['issues']:
                print(f"   - {issue}")

    if results['suspicious']:
        print(f"\n{'='*60}")
        print("SUSPICIOUS:")
        print(f"{'='*60}")
        for item in results['suspicious']:
            print(f"\n⚠️  {item['test_name']}")
            for issue in item['details']['issues']:
                print(f"   - {issue}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Validate TS algorithms against scipy')
    parser.add_argument('--all', action='store_true', help='Run all test cases')
    parser.add_argument('--problem', type=str, help='Run specific problem')
    parser.add_argument('--algorithm', type=str, help='Run specific algorithm')
    parser.add_argument('--verbose', action='store_true', help='Show detailed output')
    parser.add_argument('--quiet', action='store_true', help='Show only summary')

    args = parser.parse_args()

    # Get test cases
    all_test_cases = get_test_cases()

    # Filter by arguments
    test_cases = all_test_cases
    if args.problem:
        test_cases = [tc for tc in test_cases if tc['problem'] == args.problem]
    if args.algorithm:
        test_cases = [tc for tc in test_cases if tc['algorithm'] == args.algorithm]

    if not test_cases:
        print("No test cases match the filter criteria")
        return 1

    # Results tracking
    results = {
        'pass': [],
        'suspicious': [],
        'fail': []
    }

    # Run tests
    print(f"\n{'='*60}")
    print(f"Running {len(test_cases)} test cases...")
    print(f"{'='*60}\n")

    for test_case in test_cases:
        test_name = format_test_name(test_case)

        if not args.quiet:
            print(f"\nTesting: {test_name}...", end='', flush=True)

        try:
            status, details, py_result, ts_result = run_single_test(test_case, args.verbose)

            # Store result
            result_entry = {
                'test_name': test_name,
                'test_case': test_case,
                'status': status,
                'details': details,
                'python_result': py_result,
                'ts_result': ts_result
            }

            if status == ComparisonStatus.PASS:
                results['pass'].append(result_entry)
            elif status == ComparisonStatus.SUSPICIOUS:
                results['suspicious'].append(result_entry)
            else:
                results['fail'].append(result_entry)

            # Print result
            if not args.quiet:
                print(f" {status.value}")
                if args.verbose or status != ComparisonStatus.PASS:
                    print_test_result(test_name, status, details, args.verbose)

        except Exception as e:
            print(f"\n❌ ERROR: {test_name}")
            print(f"   {str(e)}")
            results['fail'].append({
                'test_name': test_name,
                'test_case': test_case,
                'status': ComparisonStatus.FAIL,
                'details': {'issues': [f'Exception: {str(e)}']},
                'python_result': None,
                'ts_result': None
            })

    # Print summary
    print_summary(results)

    # Exit code: 0 if all pass, 1 if any fail
    return 0 if not results['fail'] else 1


if __name__ == '__main__':
    sys.exit(main())
