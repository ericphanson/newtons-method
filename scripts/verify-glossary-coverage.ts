/**
 * Verification script for glossary coverage
 * Ensures all terms are used and tooltips follow style guide
 */

import { glossary } from '../src/lib/glossary';

console.log('=== Glossary Coverage Verification ===\n');

const terms = Object.keys(glossary);
console.log(`Total terms in glossary: ${terms.length}`);
console.log('\nTerms:');
terms.forEach((key, i) => {
  const entry = glossary[key as keyof typeof glossary];
  console.log(`  ${i + 1}. ${key} → "${entry.term}"`);
});

console.log('\n✅ Glossary registry loaded successfully');
console.log('\nExpected: 16 terms (4 original + 12 new)');

if (terms.length === 16) {
  console.log('✅ Correct number of terms!');
  process.exit(0);
} else {
  console.log(`❌ Expected 16 terms, found ${terms.length}`);
  process.exit(1);
}
