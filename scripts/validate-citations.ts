#!/usr/bin/env tsx
/**
 * Citation Validator
 *
 * Validates docs/citations.json to ensure all citations have required fields
 * and no null values for required fields.
 *
 * Also validates KaTeX math expressions in citation fields using $...$ syntax.
 *
 * This runs as part of the build and dev process to catch citation errors early.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import katex from 'katex';

interface Citation {
  reference: string;
  pages: string;
  claim: string;
  quote: string;
  proofPages: string[];
  verified: string;
  verifiedBy: string;
  verificationNotes: string;
  usedIn: string[];
  // Optional fields
  theorem?: string;
  notes?: string;
  readerNotes?: string;
}

interface CitationsFile {
  references: Record<string, unknown>;
  citations: Record<string, Citation>;
}

// Required fields for every citation
const REQUIRED_FIELDS = [
  'reference',
  'pages',
  'claim',
  'verified',
  'verifiedBy',
  'verificationNotes',
  'usedIn',
] as const;

interface ValidationError {
  citationKey: string;
  field: string;
  issue: 'missing' | 'null' | 'empty-array' | 'invalid-type' | 'invalid-math';
  message: string;
}

/**
 * Validates KaTeX math expressions in text using $...$ syntax
 */
function validateMathInText(
  text: string,
  citationKey: string,
  field: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const mathPattern = /\$([^$]+)\$/g;

  let match;
  while ((match = mathPattern.exec(text)) !== null) {
    const mathContent = match[1];
    try {
      katex.renderToString(mathContent, { throwOnError: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({
        citationKey,
        field,
        issue: 'invalid-math',
        message: `Invalid KaTeX in field '${field}': $${mathContent}$\n    Error: ${errorMessage}`,
      });
    }
  }

  return errors;
}

function validateCitation(key: string, citation: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Detect benchmark citations (attribution only, no theorem/claim)
  const isBenchmarkCitation =
    citation.claim === '' &&
    typeof citation.notes === 'string' &&
    citation.notes.includes('BENCHMARK FUNCTION ATTRIBUTION');

  // Check for missing required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in citation)) {
      errors.push({
        citationKey: key,
        field,
        issue: 'missing',
        message: `Missing required field: ${field}`,
      });
    } else if (citation[field] === null) {
      errors.push({
        citationKey: key,
        field,
        issue: 'null',
        message: `Required field '${field}' is null`,
      });
    } else if (citation[field] === undefined) {
      errors.push({
        citationKey: key,
        field,
        issue: 'null',
        message: `Required field '${field}' is undefined`,
      });
    } else if (citation[field] === '') {
      // Allow empty string for 'claim' field on benchmark citations
      if (field === 'claim' && isBenchmarkCitation) {
        // OK - benchmark citations don't have claims
      } else {
        errors.push({
          citationKey: key,
          field,
          issue: 'null',
          message: `Required field '${field}' is empty string`,
        });
      }
    }
  }

  // Validate theorem citation fields (not required for benchmarks)
  if (!isBenchmarkCitation) {
    // These fields are only required for theorem/claim citations
    if (!('quote' in citation) || citation.quote === '' || citation.quote === null) {
      errors.push({
        citationKey: key,
        field: 'quote',
        issue: 'missing',
        message: `Required field 'quote' is missing or empty (not required for benchmark citations)`,
      });
    }
    if (!('proofPages' in citation)) {
      errors.push({
        citationKey: key,
        field: 'proofPages',
        issue: 'missing',
        message: `Required field 'proofPages' is missing (not required for benchmark citations)`,
      });
    }
  }

  // Special validation for array fields
  if ('proofPages' in citation) {
    if (!Array.isArray(citation.proofPages)) {
      errors.push({
        citationKey: key,
        field: 'proofPages',
        issue: 'invalid-type',
        message: 'proofPages must be an array',
      });
    } else if (citation.proofPages.length === 0 && !isBenchmarkCitation) {
      // Benchmark citations don't need proofPages
      errors.push({
        citationKey: key,
        field: 'proofPages',
        issue: 'empty-array',
        message: 'proofPages array is empty (must have at least one proof page for theorem citations)',
      });
    }
  }

  if ('usedIn' in citation) {
    if (!Array.isArray(citation.usedIn)) {
      errors.push({
        citationKey: key,
        field: 'usedIn',
        issue: 'invalid-type',
        message: 'usedIn must be an array',
      });
    } else if (citation.usedIn.length === 0) {
      errors.push({
        citationKey: key,
        field: 'usedIn',
        issue: 'empty-array',
        message: 'usedIn array is empty (should list where citation is used)',
      });
    }
  }

  // Validate date format for 'verified'
  if ('verified' in citation && citation.verified) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(citation.verified)) {
      errors.push({
        citationKey: key,
        field: 'verified',
        issue: 'invalid-type',
        message: `verified date must be in YYYY-MM-DD format, got: ${citation.verified}`,
      });
    }
  }

  // Validate KaTeX math expressions in text fields
  if ('claim' in citation && typeof citation.claim === 'string') {
    errors.push(...validateMathInText(citation.claim, key, 'claim'));
  }
  if ('quote' in citation && typeof citation.quote === 'string') {
    errors.push(...validateMathInText(citation.quote, key, 'quote'));
  }
  if ('readerNotes' in citation && typeof citation.readerNotes === 'string') {
    errors.push(...validateMathInText(citation.readerNotes, key, 'readerNotes'));
  }

  return errors;
}

function validateCitationsFile(): { valid: boolean; errors: ValidationError[] } {
  const citationsPath = join(process.cwd(), 'docs', 'citations.json');

  let data: CitationsFile;

  try {
    const fileContent = readFileSync(citationsPath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ Failed to read or parse citations.json:');
    console.error(error);
    return { valid: false, errors: [] };
  }

  // Validate structure
  if (!data.citations || typeof data.citations !== 'object') {
    console.error('❌ citations.json must have a "citations" object');
    return { valid: false, errors: [] };
  }

  const allErrors: ValidationError[] = [];
  const citationKeys = Object.keys(data.citations);

  // Validate each citation
  for (const key of citationKeys) {
    const citation = data.citations[key];
    const errors = validateCitation(key, citation);
    allErrors.push(...errors);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

function main() {
  console.log('Validating citations.json...');

  const { valid, errors } = validateCitationsFile();

  if (valid) {
    const citationsPath = join(process.cwd(), 'docs', 'citations.json');
    const fileContent = readFileSync(citationsPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const count = Object.keys(data.citations).length;

    console.log(`✅ All ${count} citation${count !== 1 ? 's' : ''} valid`);
    process.exit(0);
  } else {
    console.error(`\n❌ Found ${errors.length} validation error${errors.length !== 1 ? 's' : ''}:\n`);

    // Group errors by citation key
    const errorsByCitation = new Map<string, ValidationError[]>();
    for (const error of errors) {
      if (!errorsByCitation.has(error.citationKey)) {
        errorsByCitation.set(error.citationKey, []);
      }
      errorsByCitation.get(error.citationKey)!.push(error);
    }

    // Print grouped errors
    for (const [citationKey, citationErrors] of errorsByCitation) {
      console.error(`Citation: "${citationKey}"`);
      for (const error of citationErrors) {
        console.error(`  - ${error.message}`);
      }
      console.error('');
    }

    console.error('Fix these errors in docs/citations.json before building.\n');
    console.error('Required fields for all citations:');
    console.error('  ' + REQUIRED_FIELDS.join(', '));
    console.error('\nSee docs/workflows/citation-workflow.md for details.\n');

    process.exit(1);
  }
}

main();
