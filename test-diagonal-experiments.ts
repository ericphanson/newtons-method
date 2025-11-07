#!/usr/bin/env tsx
import { getExperimentsForAlgorithm } from './src/experiments';

console.log('Testing diagonal preconditioner experiments\n');

const experiments = getExperimentsForAlgorithm('diagonal-precond');

console.log(`Found ${experiments.length} experiments:`);
experiments.forEach(exp => {
  console.log(`  - ${exp.id}: ${exp.name}`);
});

console.log(`\nExpected: 5 experiments`);

if (experiments.length === 5) {
  console.log('✅ Test passed!');
} else {
  console.log('❌ Test failed!');
  process.exit(1);
}
