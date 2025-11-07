/**
 * Build-time KaTeX validation script
 * Scans source files for Math components and validates all LaTeX syntax
 * Run this before build to catch LaTeX errors early
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import katex from 'katex';

interface ValidationError {
  file: string;
  line: number;
  latex: string;
  error: string;
}

/**
 * Recursively find all .tsx/.ts files in a directory
 */
function findSourceFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist
      if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.git') {
        findSourceFiles(fullPath, files);
      }
    } else if (stat.isFile()) {
      const ext = extname(entry);
      if (ext === '.tsx' || ext === '.ts') {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Extract LaTeX expressions from source file content
 * Handles both <InlineMath> and <BlockMath> components
 */
function extractLatexExpressions(content: string): Array<{ latex: string; line: number }> {
  const expressions: Array<{ latex: string; line: number }> = [];

  // Pattern 1: <InlineMath>{String.raw`...`}</InlineMath>
  // Pattern 2: <BlockMath>{String.raw`...`}</BlockMath>
  // Pattern 3: <InlineMath>plain text</InlineMath>
  // Pattern 4: <BlockMath>plain text</BlockMath>

  // Combined regex for both inline and block math
  const mathComponentRegex = /<(?:InlineMath|BlockMath)(?:\s+[^>]*)?>([^<]*(?:\{String\.raw`([^`]+)`\})?[^<]*)<\/(?:InlineMath|BlockMath)>/gs;

  let match;
  while ((match = mathComponentRegex.exec(content)) !== null) {
    const innerContent = match[1];
    const rawStringContent = match[2];

    // Extract the actual LaTeX content
    let latex = '';
    if (rawStringContent) {
      // It's a String.raw template
      latex = rawStringContent;
    } else {
      // It's plain text content - strip {}, whitespace
      latex = innerContent.replace(/^\s*\{?\s*/, '').replace(/\s*\}?\s*$/, '').trim();
    }

    if (latex) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      expressions.push({ latex, line: lineNumber });
    }
  }

  return expressions;
}

/**
 * Validate a LaTeX expression using KaTeX
 */
function validateLatex(latex: string): string | null {
  try {
    katex.renderToString(latex, {
      throwOnError: true,
      strict: 'error',
    });
    return null; // No error
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Main validation function
 */
function validateAllKatex(rootDir: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const files = findSourceFiles(rootDir);

  console.log(`🔍 Scanning ${files.length} source files for KaTeX expressions...\n`);

  let totalExpressions = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const expressions = extractLatexExpressions(content);

    if (expressions.length > 0) {
      const relPath = file.replace(rootDir + '/', '');
      console.log(`  ${relPath}: ${expressions.length} expression(s)`);
      totalExpressions += expressions.length;
    }

    for (const { latex, line } of expressions) {
      const error = validateLatex(latex);
      if (error) {
        errors.push({
          file: file.replace(rootDir + '/', ''),
          line,
          latex: latex.substring(0, 100) + (latex.length > 100 ? '...' : ''),
          error,
        });
      }
    }
  }

  console.log(`\n✓ Found ${totalExpressions} KaTeX expression(s)\n`);

  return errors;
}

// Run validation
const rootDir = process.cwd();
const errors = validateAllKatex(rootDir);

if (errors.length > 0) {
  console.error(`\n❌ Found ${errors.length} KaTeX validation error(s):\n`);

  for (const error of errors) {
    console.error(`  ${error.file}:${error.line}`);
    console.error(`    LaTeX: ${error.latex}`);
    console.error(`    Error: ${error.error}\n`);
  }

  process.exit(1);
} else {
  console.log('✅ All KaTeX expressions are valid!\n');
  process.exit(0);
}
