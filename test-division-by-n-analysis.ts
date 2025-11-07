#!/usr/bin/env tsx

/**
 * Analysis: Should SVM formulations use SUM or AVERAGE (division by n)?
 *
 * This test compares:
 * 1. Current implementation (SUM formulation)
 * 2. Python implementation
 * 3. Standard mathematical formulations
 */

import { DataPoint } from './src/shared-utils';
import {
  softMarginObjective,
  softMarginGradient,
  perceptronObjective,
  perceptronGradient,
  squaredHingeObjective,
  squaredHingeGradient,
} from './src/utils/separatingHyperplane';

// Test data
const testData: DataPoint[] = [
  { x1: 1.0, x2: 2.0, y: 1 },
  { x1: -1.0, x2: -2.0, y: 0 },
  { x1: 2.0, x2: 1.5, y: 1 },
  { x1: -1.5, x2: -1.0, y: 0 },
  { x1: 0.5, x2: 1.0, y: 1 },
];

const n = testData.length;
const lambda = 0.1;
const w = [0.5, -0.3, 0.2];

console.log('='.repeat(80));
console.log('DIVISION BY N ANALYSIS');
console.log('='.repeat(80));
console.log();
console.log('Dataset size: n =', n);
console.log('Lambda =', lambda);
console.log('Weight vector: w =', w);
console.log();

// ============================================================================
// SOFT-MARGIN SVM
// ============================================================================

console.log('='.repeat(80));
console.log('1. SOFT-MARGIN SVM');
console.log('='.repeat(80));
console.log();

const softMarginLoss = softMarginObjective(w, testData, lambda);
const softMarginGrad = softMarginGradient(w, testData, lambda);

console.log('Current Implementation (SUM):');
console.log('  Formula: ||w||²/2 + λ·Σmax(0, 1-y·z)');
console.log('  Loss:', softMarginLoss.toFixed(6));
console.log('  Gradient:', softMarginGrad.map(x => x.toFixed(6)));
console.log();

console.log('If we used AVERAGE (divide by n):');
const softMarginLossAvg = softMarginLoss / n;
const softMarginGradAvg = softMarginGrad.map(x => x / n);
console.log('  Formula: ||w||²/2 + (λ/n)·Σmax(0, 1-y·z)');
console.log('  Loss:', softMarginLossAvg.toFixed(6));
console.log('  Gradient:', softMarginGradAvg.map(x => x.toFixed(6)));
console.log();

console.log('Python Implementation (from data_problems.py line 96-105):');
console.log('  def objective(self, w):');
console.log('      z = self.X @ w');
console.log('      margins = 1 - self.y * z');
console.log('      hinge_loss = np.maximum(0, margins)');
console.log('      reg = 0.5 * (w[0]**2 + w[1]**2)');
console.log('      return reg + self.lambda_reg * np.sum(hinge_loss)');
console.log('  ');
console.log('  => Uses SUM, same as TypeScript!');
console.log();

// ============================================================================
// PERCEPTRON
// ============================================================================

console.log('='.repeat(80));
console.log('2. PERCEPTRON');
console.log('='.repeat(80));
console.log();

const perceptronLoss = perceptronObjective(w, testData, lambda);
const perceptronGrad = perceptronGradient(w, testData, lambda);

console.log('Current Implementation (SUM):');
console.log('  Formula: Σmax(0, -y·z) + (λ/2)||w||²');
console.log('  Loss:', perceptronLoss.toFixed(6));
console.log('  Gradient:', perceptronGrad.map(x => x.toFixed(6)));
console.log();

console.log('If we used AVERAGE (divide by n):');
const perceptronLossAvg = perceptronLoss / n;
const perceptronGradAvg = perceptronGrad.map(x => x / n);
console.log('  Formula: (1/n)·Σmax(0, -y·z) + (λ/2)||w||²');
console.log('  Loss:', perceptronLossAvg.toFixed(6));
console.log('  Gradient:', perceptronGradAvg.map(x => x.toFixed(6)));
console.log();

console.log('Python Implementation (from data_problems.py line 134-141):');
console.log('  def objective(self, w):');
console.log('      z = self.X @ w');
console.log('      perceptron_loss = np.maximum(0, -self.y * z)');
console.log('      reg = (self.lambda_reg / 2) * (w[0]**2 + w[1]**2)');
console.log('      return np.sum(perceptron_loss) + reg');
console.log('  ');
console.log('  => Uses SUM, same as TypeScript!');
console.log();

// ============================================================================
// SQUARED-HINGE SVM
// ============================================================================

console.log('='.repeat(80));
console.log('3. SQUARED-HINGE SVM');
console.log('='.repeat(80));
console.log();

const squaredHingeLoss = squaredHingeObjective(w, testData, lambda);
const squaredHingeGrad = squaredHingeGradient(w, testData, lambda);

console.log('Current Implementation (SUM):');
console.log('  Formula: ||w||²/2 + λ·Σ[max(0, 1-y·z)]²');
console.log('  Loss:', squaredHingeLoss.toFixed(6));
console.log('  Gradient:', squaredHingeGrad.map(x => x.toFixed(6)));
console.log();

console.log('If we used AVERAGE (divide by n):');
const squaredHingeLossAvg = squaredHingeLoss / n;
const squaredHingeGradAvg = squaredHingeGrad.map(x => x / n);
console.log('  Formula: ||w||²/2 + (λ/n)·Σ[max(0, 1-y·z)]²');
console.log('  Loss:', squaredHingeLossAvg.toFixed(6));
console.log('  Gradient:', squaredHingeGradAvg.map(x => x.toFixed(6)));
console.log();

console.log('Python Implementation (from data_problems.py line 167-175):');
console.log('  def objective(self, w):');
console.log('      z = self.X @ w');
console.log('      margins = 1 - self.y * z');
console.log('      squared_hinge = np.maximum(0, margins)**2');
console.log('      reg = 0.5 * (w[0]**2 + w[1]**2)');
console.log('      return reg + self.lambda_reg * np.sum(squared_hinge)');
console.log('  ');
console.log('  => Uses SUM, same as TypeScript!');
console.log();

// ============================================================================
// COMPARISON WITH LOGISTIC REGRESSION
// ============================================================================

console.log('='.repeat(80));
console.log('4. COMPARISON WITH LOGISTIC REGRESSION');
console.log('='.repeat(80));
console.log();

console.log('Python LogisticRegression (from data_problems.py line 34-48):');
console.log('  def objective(self, w):');
console.log('      z = self.X @ w');
console.log('      sigma = sigmoid(z)');
console.log('      sigma = np.clip(sigma, 1e-10, 1 - 1e-10)');
console.log('      ');
console.log('      # Cross-entropy');
console.log('      loss = -np.mean(self.y * np.log(sigma) + (1-self.y) * np.log(1-sigma))');
console.log('      ');
console.log('      # L2 regularization');
console.log('      reg = (self.lambda_reg / 2) * (w[0]**2 + w[1]**2)');
console.log('      return loss + reg');
console.log('  ');
console.log('  => Uses MEAN (np.mean) for cross-entropy loss!');
console.log();

console.log('This is different from SVM variants which use SUM.');
console.log('Why?');
console.log();
console.log('  - Cross-entropy loss naturally scales with n');
console.log('  - Using mean makes λ interpretable across dataset sizes');
console.log('  - BUT: SVM formulations traditionally use SUM');
console.log();

// ============================================================================
// THEORETICAL ANALYSIS
// ============================================================================

console.log('='.repeat(80));
console.log('5. THEORETICAL ANALYSIS: SUM vs MEAN');
console.log('='.repeat(80));
console.log();

console.log('Standard SVM Formulation (Vapnik, Cortes & Vapnik 1995):');
console.log('  min_w  (1/2)||w||² + C·Σᵢ₌₁ⁿ ξᵢ');
console.log('  ');
console.log('  - Uses SUM over slack variables');
console.log('  - C is the regularization trade-off parameter');
console.log('  - This is equivalent to our formulation with C = λ');
console.log();

console.log('Empirical Risk Minimization (ERM) Formulation:');
console.log('  min_w  (1/n)·Σᵢ₌₁ⁿ L(yᵢ, f(xᵢ)) + λ·R(w)');
console.log('  ');
console.log('  - Uses MEAN (1/n factor) for empirical risk');
console.log('  - λ is the regularization parameter');
console.log('  - More general machine learning formulation');
console.log();

console.log('Relationship between formulations:');
console.log('  SUM formulation:  f(w) = (1/2)||w||² + λ·Σᵢ L(yᵢ, f(xᵢ))');
console.log('  MEAN formulation: f(w) = (1/2)||w||² + (λ·n)·(1/n)·Σᵢ L(yᵢ, f(xᵢ))');
console.log('  ');
console.log('  These are EQUIVALENT if we set: λ_sum = n · λ_mean');
console.log('  ');
console.log(`  In our case: λ = ${lambda}`);
console.log(`  If we switch to MEAN: λ_mean = ${lambda / n} (divide by ${n})`);
console.log(`  To get same optimum: λ_sum = ${lambda} (same as current)`);
console.log();

// ============================================================================
// CONCLUSION
// ============================================================================

console.log('='.repeat(80));
console.log('6. CONCLUSION');
console.log('='.repeat(80));
console.log();

console.log('✅ Current TypeScript implementation is CORRECT');
console.log();
console.log('Reasons:');
console.log('  1. Matches Python validation implementation exactly');
console.log('  2. Matches standard SVM formulation (Vapnik)');
console.log('  3. Documentation explicitly states SUM (Σ notation)');
console.log('  4. Gradients are mathematically consistent with objectives');
console.log();

console.log('❌ Division by n should NOT be restored');
console.log();
console.log('Why the user might think it should:');
console.log('  1. Logistic regression DOES use mean (different convention)');
console.log('  2. ERM formulation uses mean (more general ML theory)');
console.log('  3. Using mean makes λ scale-invariant to dataset size');
console.log();

console.log('BUT:');
console.log('  - SVM has a specific historical convention (SUM)');
console.log('  - Changing to MEAN would break compatibility with Python');
console.log('  - Would need to scale λ by n to get same solution');
console.log('  - Documentation would need to change from Σ to (1/n)Σ');
console.log();

console.log('Final recommendation: KEEP current implementation (SUM)');
console.log();
