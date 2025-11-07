"""TypeScript CLI integration."""

import subprocess
import re
import numpy as np
from typing import Optional


def run_typescript_test(
    problem: str,
    algorithm: str,
    initial: list[float],
    max_iter: int,
    alpha: Optional[float] = None,
    lambda_reg: Optional[float] = None,
    variant: Optional[str] = None,
    timeout: int = 30
) -> dict:
    """Run TypeScript CLI test and parse output."""

    # Build command
    cmd = [
        'npm', 'run', 'test-combo', '--',
        '--problem', problem,
        '--algorithm', algorithm,
        '--initial', ','.join(str(x) for x in initial),
        '--maxIter', str(max_iter)
    ]

    # Add optional parameters
    if alpha is not None:
        cmd.extend(['--alpha', str(alpha)])
    if lambda_reg is not None:
        cmd.extend(['--lambda', str(lambda_reg)])
    if variant is not None:
        cmd.extend(['--variant', variant])

    # Run command
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd='/Users/eph/newtons-method'
        )

        if result.returncode != 0:
            return {
                'converged': False,
                'iterations': 0,
                'final_loss': np.inf,
                'final_w': np.array(initial),
                'final_grad_norm': np.inf,
                'message': f'CLI error: {result.stderr}',
                'raw_output': result.stdout
            }

        return parse_ts_output(result.stdout, initial)

    except subprocess.TimeoutExpired:
        return {
            'converged': False,
            'iterations': 0,
            'final_loss': np.inf,
            'final_w': np.array(initial),
            'final_grad_norm': np.inf,
            'message': f'Timeout after {timeout}s',
            'raw_output': ''
        }
    except Exception as e:
        return {
            'converged': False,
            'iterations': 0,
            'final_loss': np.inf,
            'final_w': np.array(initial),
            'final_grad_norm': np.inf,
            'message': f'Error: {str(e)}',
            'raw_output': ''
        }


def parse_ts_output(stdout: str, initial: list[float]) -> dict:
    """Parse TypeScript CLI output.

    Expected formats:

    Converged:
    ✅ CONVERGED in 5 iterations
       Final loss: 1.234567e-07
       Final grad norm: 8.92e-06
       Final position: [0.000010, 0.000020]

    Did not converge:
    ⚠️  DID NOT CONVERGE (reached maxIter=100)
       Iterations: 100
       Final loss: 3.527540e-10
       Final grad norm: 2.95e-5
    """
    try:
        # Check convergence
        converged = '✅ CONVERGED' in stdout

        # Extract iterations - try multiple patterns
        iter_match = re.search(r'in (\d+) iterations?', stdout)
        if not iter_match:
            iter_match = re.search(r'after (\d+) iterations?', stdout)
        if not iter_match:
            iter_match = re.search(r'Iterations:\s*(\d+)', stdout)
        iterations = int(iter_match.group(1)) if iter_match else 0

        # Extract final loss (handle NaN, Infinity)
        loss_match = re.search(r'Final loss:\s*(\S+)', stdout)
        if loss_match:
            loss_str = loss_match.group(1)
            if 'NaN' in loss_str or 'Infinity' in loss_str:
                final_loss = np.inf
            else:
                final_loss = float(loss_str)
        else:
            final_loss = np.inf

        # Extract final grad norm (handle NaN, Infinity)
        grad_match = re.search(r'Final grad norm:\s*(\S+)', stdout)
        if grad_match:
            grad_str = grad_match.group(1)
            if 'NaN' in grad_str or 'Infinity' in grad_str:
                final_grad_norm = np.inf
            else:
                final_grad_norm = float(grad_str)
        else:
            final_grad_norm = np.inf

        # Extract final position (optional - may not be present for non-converged cases)
        pos_match = re.search(r'Final position:\s*\[(.*?)\]', stdout)
        if pos_match:
            pos_str = pos_match.group(1)
            final_w = np.array([float(x.strip()) for x in pos_str.split(',')])
        else:
            final_w = np.array(initial)

        # Check for divergence or DID NOT CONVERGE
        if 'DID NOT CONVERGE' in stdout or 'DIVERGED' in stdout or 'NaN' in stdout or 'Infinity' in stdout:
            converged = False

        # Handle infinite/NaN values
        if not np.isfinite(final_loss):
            converged = False

        return {
            'converged': converged,
            'iterations': iterations,
            'final_loss': final_loss,
            'final_w': final_w,
            'final_grad_norm': final_grad_norm,
            'message': 'Parsed from CLI output',
            'raw_output': stdout
        }

    except Exception as e:
        return {
            'converged': False,
            'iterations': 0,
            'final_loss': np.inf,
            'final_w': np.array(initial),
            'final_grad_norm': np.inf,
            'message': f'Parse error: {str(e)}',
            'raw_output': stdout
        }
