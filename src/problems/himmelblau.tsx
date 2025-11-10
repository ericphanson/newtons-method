import { ProblemDefinition } from '../types/experiments';
import { InlineMath, BlockMath } from '../components/Math';
import { GlossaryTooltip } from '../components/GlossaryTooltip';
import { CollapsibleSection } from '../components/CollapsibleSection';

// Himmelblau's function: f(w) = (w0^2 + w1 - 11)^2 + (w0 + w1^2 - 7)^2
// Classic multimodal test function with four global minima (all f = 0)
// Creates beautiful symmetric basins of convergence with fractal-like boundaries
//
// The four equivalent global minima are:
//   1. (3.0, 2.0)          → f = 0
//   2. (-2.805118, 3.131312) → f = 0
//   3. (-3.779310, -3.283186) → f = 0
//   4. (3.584428, -1.848126) → f = 0
//
// This function is valuable for studying basin boundaries in Newton's method:
// - All minima are equally deep (symmetric problem)
// - Basin boundaries form complex patterns
// - Demonstrates sensitivity to initial conditions
// - Named after David Mautner Himmelblau (1972)
export const himmelblauProblem: ProblemDefinition = {
  name: "Himmelblau's Function",
  objectiveFormula: <InlineMath>{String.raw`f(w) = (w_0^2 + w_1 - 11)^2 + (w_0 + w_1^2 - 7)^2`}</InlineMath>,
  description: (
    <>
      Multimodal function with <InlineMath>4</InlineMath> equivalent minima, creates symmetric basin boundaries
    </>
  ),

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    const term1 = w0 * w0 + w1 - 11;
    const term2 = w0 + w1 * w1 - 7;
    return term1 * term1 + term2 * term2;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    // Compute intermediate terms
    const term1 = w0 * w0 + w1 - 11;  // (w0^2 + w1 - 11)
    const term2 = w0 + w1 * w1 - 7;   // (w0 + w1^2 - 7)

    // Apply chain rule:
    // ∂f/∂w0 = 2(w0^2 + w1 - 11) · 2w0 + 2(w0 + w1^2 - 7) · 1
    // ∂f/∂w1 = 2(w0^2 + w1 - 11) · 1 + 2(w0 + w1^2 - 7) · 2w1
    const dw0 = 4 * w0 * term1 + 2 * term2;
    const dw1 = 2 * term1 + 4 * w1 * term2;

    return [dw0, dw1];
  },

  hessian: (w: number[]): number[][] => {
    const [w0, w1] = w;
    const term1 = w0 * w0 + w1 - 11;
    const term2 = w0 + w1 * w1 - 7;

    // Second derivatives (using product rule on gradient):
    // ∂²f/∂w0² = ∂/∂w0[4w0·term1 + 2·term2]
    //          = 4·term1 + 4w0·(2w0) + 2·(1)
    //          = 4·term1 + 8w0² + 2
    // ∂²f/∂w0∂w1 = ∂/∂w1[4w0·term1 + 2·term2]
    //            = 4w0·(1) + 2·(2w1)
    //            = 4w0 + 4w1
    // ∂²f/∂w1² = ∂/∂w1[2·term1 + 4w1·term2]
    //          = 2·(1) + 4·term2 + 4w1·(2w1)
    //          = 2 + 4·term2 + 8w1²
    const h00 = 4 * term1 + 8 * w0 * w0 + 2;
    const h01 = 4 * w0 + 4 * w1;
    const h10 = h01;  // Hessian is symmetric
    const h11 = 2 + 4 * term2 + 8 * w1 * w1;

    return [[h00, h01], [h10, h11]];
  },

  domain: {
    w0: [-6, 6],
    w1: [-6, 6],
  },

  // Return one of the four global minima (they're all equivalent at f=0)
  globalMinimum: [3.0, 2.0],
};

// Educational content for Himmelblau's function
export const himmelblauExplainer = (
  <CollapsibleSection
    title="Himmelblau's Function (Four Global Minima)"
    defaultExpanded={false}
    storageKey="problem-explainer-himmelblau"
  >
    <div className="space-y-3 text-gray-800">
      <p>
        <strong>Type:</strong> Multimodal (four equivalent global minima)
      </p>

      <div>
        <p className="font-semibold">Objective Function:</p>
        <BlockMath>
          {String.raw`f(w) = (w_0^2 + w_1 - 11)^2 + (w_0 + w_1^2 - 7)^2`}
        </BlockMath>
      </div>

      <div>
        <p className="font-semibold">Four Global Minima (all f = 0):</p>
        <ul className="text-sm list-disc ml-5">
          <li>(3.0, 2.0)</li>
          <li>(-2.805118, 3.131312)</li>
          <li>(-3.779310, -3.283186)</li>
          <li>(3.584428, -1.848126)</li>
        </ul>
      </div>

      <p>
        <strong>What it does:</strong> A classic multimodal test function with four valleys
        of equal depth, creating symmetric <GlossaryTooltip termKey="basin-of-convergence" />s.
      </p>

      <p>
        <strong>Why it's interesting:</strong> Perfect for visualizing basins of convergence!
        This is the <strong>first problem in the visualizer with multiple local minima</strong>,
        demonstrating how initial conditions determine which minimum Newton's method converges to.
      </p>

      <p>
        <strong>Key Insight - Basins of Convergence:</strong>
      </p>
      <ul className="text-sm list-disc ml-5 space-y-1">
        <li>
          <strong>Basin boundaries:</strong> Complex fractal-like patterns where nearby starting
          points can converge to different minima
        </li>
        <li>
          <strong>Symmetry:</strong> All four minima are equally deep (f = 0), making this a
          perfectly symmetric optimization landscape
        </li>
        <li>
          <strong>Sensitivity:</strong> Small changes in initial position can dramatically change
          which minimum you reach
        </li>
      </ul>

      <div className="bg-indigo-50 rounded p-3">
        <p className="text-sm font-semibold mb-1">Perfect for exploring:</p>
        <ul className="text-sm list-disc ml-5">
          <li>Basin visualization tool to see which starting points lead to each minimum</li>
          <li>How Newton's method follows steepest descent into nearest valley</li>
          <li>Symmetric competition between equally attractive minima</li>
          <li>Why initial conditions matter in multimodal optimization</li>
        </ul>
      </div>

      <div className="bg-blue-50 rounded p-3 mt-3">
        <p className="text-sm font-semibold mb-1">Named after:</p>
        <p className="text-sm">
          David Mautner Himmelblau (1972), a pioneer in optimization methods. This function
          has become a standard benchmark for testing optimization algorithms' ability to
          handle multiple minima.
        </p>
      </div>
    </div>
  </CollapsibleSection>
);
