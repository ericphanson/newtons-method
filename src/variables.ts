/**
 * Central registry of mathematical variables used throughout the application.
 *
 * This registry serves as the source of truth for:
 * 1. Variable IDs (for cross-highlighting)
 * 2. Type annotations (for tooltips)
 * 3. LaTeX representation
 * 4. KaTeX macro generation
 *
 * Benefits:
 * - Ensures consistency across all pedagogical content
 * - Enables compile-time validation
 * - Auto-generates KaTeX macros with \htmlData attributes
 * - Single place to update variable definitions
 */

export interface VariableMetadata {
  /** Variable ID used for cross-highlighting (must be unique) */
  id: string;
  /** Type description shown in tooltip (e.g., "vector ℝᵈ", "scalar") */
  type: string;
  /** LaTeX representation (defaults to id if not specified) */
  latex?: string;
  /** Human-readable description (optional) */
  description?: string;
}

/**
 * Registry of all mathematical variables used in the application.
 *
 * Convention: Use simple, short IDs that match the common notation.
 * The LaTeX representation can be more complex if needed.
 */
export const VARIABLES: Record<string, VariableMetadata> = {
  // Matrices
  H: {
    id: 'H',
    type: 'd×d matrix',
    description: 'True Hessian matrix',
  },
  B: {
    id: 'B',
    type: 'd×d matrix (implicit)',
    description: 'Approximate Hessian (L-BFGS)',
  },
  B_0: {
    id: 'B_0',
    type: 'd×d matrix (scaled identity)',
    latex: 'B_{0}',
    description: 'Initial Hessian approximation',
  },
  B_k: {
    id: 'B_k',
    type: 'd×d matrix',
    latex: 'B_{k}',
    description: 'Hessian approximation at iteration k',
  },
  B_M: {
    id: 'B_M',
    type: 'd×d matrix (implicit)',
    latex: 'B_{M}',
    description: 'Hessian after M updates',
  },
  B_1: {
    id: 'B_1',
    type: 'd×d matrix (implicit)',
    latex: 'B_{1}',
    description: 'Hessian after 1 update',
  },
  H_inv: {
    id: 'H_inv',
    type: 'd×d matrix (implicit)',
    latex: 'H^{-1}',
    description: 'Inverse Hessian',
  },
  B_inv: {
    id: 'B_inv',
    type: 'd×d matrix (implicit)',
    latex: 'B^{-1}',
    description: 'Inverse approximate Hessian',
  },
  B_0_inv: {
    id: 'B_0_inv',
    type: 'd×d matrix (scaled identity)',
    latex: 'B_0^{-1}',
    description: 'Inverse initial Hessian',
  },
  B_M_inv: {
    id: 'B_M_inv',
    type: 'd×d matrix (implicit)',
    latex: 'B_M^{-1}',
    description: 'Inverse Hessian after M updates',
  },
  I: {
    id: 'I',
    type: 'd×d matrix',
    latex: 'I_d',
    description: 'Identity matrix (d×d)',
  },

  // Vectors
  s: {
    id: 's',
    type: 'vector ℝᵈ',
    description: 'Parameter change vector',
  },
  y: {
    id: 'y',
    type: 'vector ℝᵈ',
    description: 'Gradient change vector',
  },
  p: {
    id: 'p',
    type: 'vector ℝᵈ',
    description: 'Search direction',
  },
  grad: {
    id: 'grad',
    type: 'vector ℝᵈ',
    latex: '\\nabla f',
    description: 'Gradient vector',
  },
  grad_old: {
    id: 'grad_old',
    type: 'vector ℝᵈ',
    latex: '\\nabla f_{\\text{old}}',
    description: 'Previous gradient',
  },
  w: {
    id: 'w',
    type: 'vector ℝᵈ',
    description: 'Parameter vector',
  },
  w_0: {
    id: 'w_0',
    type: 'vector ℝᵈ',
    latex: 'w_{0}',
    description: 'Initial parameters',
  },
  w_star: {
    id: 'w_star',
    type: 'vector ℝᵈ',
    latex: 'w^{*}',
    description: 'Optimal parameters',
  },
  q: {
    id: 'q',
    type: 'vector ℝᵈ',
    description: 'Intermediate vector in two-loop recursion',
  },
  r: {
    id: 'r',
    type: 'vector ℝᵈ',
    description: 'Result vector in two-loop recursion',
  },
  s_i: {
    id: 's_i',
    type: 'vector ℝᵈ',
    latex: 's_{i}',
    description: 'Parameter change vector at iteration i',
  },
  y_i: {
    id: 'y_i',
    type: 'vector ℝᵈ',
    latex: 'y_{i}',
    description: 'Gradient change vector at iteration i',
  },
  s_M: {
    id: 's_M',
    type: 'vector ℝᵈ',
    latex: 's_{M}',
    description: 'Most recent parameter change vector',
  },
  y_M: {
    id: 'y_M',
    type: 'vector ℝᵈ',
    latex: 'y_{M}',
    description: 'Most recent gradient change vector',
  },
  s_1: {
    id: 's_1',
    type: 'vector ℝᵈ',
    latex: 's_{1}',
    description: 'First (oldest) parameter change vector in memory',
  },
  y_1: {
    id: 'y_1',
    type: 'vector ℝᵈ',
    latex: 'y_{1}',
    description: 'First (oldest) gradient change vector in memory',
  },

  // Scalars
  M: {
    id: 'M',
    type: 'scalar',
    description: 'Memory size (number of stored pairs)',
  },
  alpha: {
    id: 'alpha',
    type: 'scalar',
    latex: '\\alpha',
    description: 'Step size',
  },
  gamma: {
    id: 'gamma',
    type: 'scalar',
    latex: '\\gamma',
    description: 'Scaling factor',
  },
  rho: {
    id: 'rho',
    type: 'scalar',
    latex: '\\rho',
    description: 'BFGS update coefficient',
  },
  rho_i: {
    id: 'rho_i',
    type: 'scalar',
    latex: '\\rho_{i}',
    description: 'BFGS coefficient for pair i',
  },
  lambda_damp: {
    id: 'lambda_damp',
    type: 'scalar',
    latex: '\\lambda_{\\text{damp}}',
    description: 'Hessian damping parameter',
  },
  alpha_i: {
    id: 'alpha_i',
    type: 'scalar',
    latex: '\\alpha_{i}',
    description: 'Forward loop coefficient',
  },
  beta_i: {
    id: 'beta_i',
    type: 'scalar',
    latex: '\\beta_{i}',
    description: 'Backward loop coefficient',
  },
  f: {
    id: 'f',
    type: 'function',
    description: 'Objective function',
  },
};

/**
 * Auto-generate KaTeX macros from the variable registry.
 *
 * Each macro:
 * 1. Is named \var{ID} (e.g., \varH, \varM, \vars)
 * 2. Uses \htmlData to inject data-var-id and data-var-type attributes
 * 3. Renders the LaTeX representation
 *
 * Usage in LaTeX:
 *   \varH^{-1}\nabla \varf
 *
 * Rendered HTML (simplified):
 *   <span data-var-id="H" data-var-type="d×d matrix">H</span>^{-1}∇<span data-var-id="grad">∇f</span>
 */
/**
 * Convert snake_case to PascalCase for valid LaTeX macro names.
 * Numbers are spelled out since LaTeX macros can only contain letters.
 * Examples:
 *   'lambda_damp' -> 'LambdaDamp'
 *   'grad_old' -> 'GradOld'
 *   'B_0' -> 'BZero'
 *   'alpha_i' -> 'AlphaI'
 */
function toPascalCase(str: string): string {
  const numberWords: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
  };

  return str
    .split('_')
    .map(part => {
      // If the part is a single digit, spell it out
      if (part in numberWords) {
        return numberWords[part];
      }
      // Otherwise, capitalize first letter
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

export function generateKaTeXMacros(): Record<string, string> {
  const macros: Record<string, string> = {};

  for (const [key, meta] of Object.entries(VARIABLES)) {
    const latex = meta.latex || meta.id;
    const macroName = `\\var${toPascalCase(key)}`;

    // Use \htmlData to inject data attributes
    // Format: \htmlData{attr1=val1, attr2=val2}{content}
    macros[macroName] = `\\htmlData{var-id=${meta.id}, var-type=${meta.type}}{${latex}}`;
  }

  return macros;
}

/**
 * Validate that there are no macro name collisions in the variable registry.
 * Throws an error if two different variable IDs map to the same macro name.
 */
export function validateMacroNames(): void {
  const macroToIds = new Map<string, string[]>();

  for (const id of Object.keys(VARIABLES)) {
    const macroName = `\\var${toPascalCase(id)}`;

    if (!macroToIds.has(macroName)) {
      macroToIds.set(macroName, []);
    }
    macroToIds.get(macroName)!.push(id);
  }

  const collisions: string[] = [];
  for (const [macroName, ids] of macroToIds.entries()) {
    if (ids.length > 1) {
      collisions.push(`${macroName} maps to multiple IDs: [${ids.join(', ')}]`);
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `Macro name collision(s) detected in variable registry:\n  ${collisions.join('\n  ')}\n\n` +
      `Each variable ID must map to a unique macro name. ` +
      `Consider renaming one of the conflicting variables.`
    );
  }
}

// Run validation on module load
validateMacroNames();

/**
 * Pre-generated macros for use in KaTeX rendering.
 * Import this constant and pass to KaTeX options.
 */
export const KATEX_MACROS = generateKaTeXMacros();

/**
 * Get variable metadata by ID.
 * Useful for validation and tooling.
 */
export function getVariable(id: string): VariableMetadata | undefined {
  return VARIABLES[id];
}

/**
 * Check if a variable ID exists in the registry.
 */
export function isValidVariableId(id: string): boolean {
  return id in VARIABLES;
}

/**
 * Get all variable IDs.
 */
export function getAllVariableIds(): string[] {
  return Object.keys(VARIABLES);
}

/**
 * Get the macro name for a variable ID.
 * Example: 'H' -> '\varH', 'B_0' -> '\varBZero'
 */
export function getMacroName(id: string): string {
  return `\\var${toPascalCase(id)}`;
}
