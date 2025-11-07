#!/usr/bin/env tsx
import { generateCrescents } from '../src/shared-utils';
import { logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';

const data = generateCrescents();
console.log(`Data points: ${data.length}`);
console.log(`First 3 points:`, data.slice(0, 3));

const problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);

const testPoint = [0, 0, 19.83];
const grad = problemFuncs.gradient(testPoint);
const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g*g, 0));

console.log(`\nTest evaluation at [0, 0, 19.83]:`);
console.log(`  Loss: ${problemFuncs.objective(testPoint)}`);
console.log(`  Grad norm: ${gradNorm}`);
console.log(`  Gradient: [${grad.map(g => g.toFixed(6)).join(', ')}]`);
