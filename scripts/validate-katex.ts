/**
 * Build-time KaTeX validation script
 * Scans source files for Math components and validates all LaTeX syntax
 * Run this before build to catch LaTeX errors early
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import katex from 'katex';
import { KATEX_MACROS } from '../src/variables.js';
import { glossary } from '../src/lib/glossary.js';

interface ValidationError {
  file: string;
  line: number;
  latex: string;
  error: string;
}

interface GlossaryValidationError {
  file: string;
  line: number;
  termKey: string;
  availableTerms: string[];
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
 * Extract glossary term keys from source file content
 * Finds all <GlossaryTooltip termKey="..." /> usages
 * Skips matches inside comments (single-line or block comments)
 */
function extractGlossaryTerms(content: string): Array<{ termKey: string; line: number }> {
  const terms: Array<{ termKey: string; line: number }> = [];

  // Pattern: <GlossaryTooltip termKey="term-name" />
  const glossaryRegex = /<GlossaryTooltip\s+termKey=["']([^"']+)["']\s*\/>/g;

  let match;
  while ((match = glossaryRegex.exec(content)) !== null) {
    const termKey = match[1];
    const matchIndex = match.index;

    // Check if this match is inside a comment
    const beforeMatch = content.substring(0, matchIndex);
    const lineNumber = beforeMatch.split('\n').length;

    // Get the line content
    const lines = content.split('\n');
    const currentLine = lines[lineNumber - 1];
    const matchPositionInLine = matchIndex - beforeMatch.lastIndexOf('\n') - 1;

    // Check if there's a // comment before this match on the same line
    const commentIndex = currentLine.indexOf('//');
    if (commentIndex !== -1 && commentIndex < matchPositionInLine) {
      continue; // Skip - inside a line comment
    }

    // Check if we're inside a /* */ block comment
    const lastBlockCommentStart = beforeMatch.lastIndexOf('/*');
    const lastBlockCommentEnd = beforeMatch.lastIndexOf('*/');
    if (lastBlockCommentStart > lastBlockCommentEnd) {
      continue; // Skip - inside a block comment
    }

    terms.push({ termKey, line: lineNumber });
  }

  return terms;
}

/**
 * Validate a LaTeX expression using KaTeX
 */
function validateLatex(latex: string): string | null {
  try {
    katex.renderToString(latex, {
      throwOnError: true,
      strict: false, // Disable strict mode to allow HTML extensions (required for \htmlData)
      trust: true, // Required for \htmlData commands in macros
      macros: KATEX_MACROS, // Include our custom variable macros
    });
    return null; // No error
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Validate all glossary terms in source files
 */
function validateAllGlossaryTerms(rootDir: string): GlossaryValidationError[] {
  const errors: GlossaryValidationError[] = [];
  const files = findSourceFiles(rootDir);
  const availableTerms = Object.keys(glossary);

  console.log(`🔍 Scanning ${files.length} source files for glossary terms...\n`);

  let totalTermUsages = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const terms = extractGlossaryTerms(content);

    if (terms.length > 0) {
      const relPath = file.replace(rootDir + '/', '');
      console.log(`  ${relPath}: ${terms.length} glossary term(s)`);
      totalTermUsages += terms.length;
    }

    for (const { termKey, line } of terms) {
      if (!availableTerms.includes(termKey)) {
        errors.push({
          file: file.replace(rootDir + '/', ''),
          line,
          termKey,
          availableTerms,
        });
      }
    }
  }

  console.log(`\n✓ Found ${totalTermUsages} glossary term usage(s)\n`);

  return errors;
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
const katexErrors = validateAllKatex(rootDir);
const glossaryErrors = validateAllGlossaryTerms(rootDir);

let hasErrors = false;

if (katexErrors.length > 0) {
  console.error(`\n❌ Found ${katexErrors.length} KaTeX validation error(s):\n`);

  for (const error of katexErrors) {
    console.error(`  ${error.file}:${error.line}`);
    console.error(`    LaTeX: ${error.latex}`);
    console.error(`    Error: ${error.error}\n`);
  }

  hasErrors = true;
} else {
  console.log('✅ All KaTeX expressions are valid!\n');
}

if (glossaryErrors.length > 0) {
  console.error(`\n❌ Found ${glossaryErrors.length} glossary validation error(s):\n`);

  for (const error of glossaryErrors) {
    console.error(`  ${error.file}:${error.line}`);
    console.error(`    Invalid term: "${error.termKey}"`);
    console.error(`    Available terms: ${error.availableTerms.join(', ')}\n`);
  }

  hasErrors = true;
} else {
  console.log('✅ All glossary terms are valid!\n');
}

if (hasErrors) {
  process.exit(1);
} else {
  process.exit(0);
}
