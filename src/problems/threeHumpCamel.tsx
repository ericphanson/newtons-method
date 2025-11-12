import { ProblemDefinition } from '../types/experiments';
import { InlineMath, BlockMath } from '../components/Math';
import { GlossaryTooltip } from '../components/GlossaryTooltip';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Citation } from '../components/Citation';

// Three-Hump Camel function: f(w) = 2w0^2 - 1.05w0^4 + w0^6/6 + w0·w1 + w1^2
// Classic multimodal test function with three local minima (one global, two local)
// Demonstrates asymmetric basins of convergence
//
// The three minima are:
//   1. Global minimum: (0, 0) → f = 0
//   2. Local minimum: approximately (1.75, -0.87) → f ≈ 0.30
//   3. Local minimum: approximately (-1.75, 0.87) → f ≈ 0.30
//
// This function is valuable for studying:
// - Asymmetric basin structures (global vs local minima)
// - How basin size relates to minimum depth
// - Competition between attractors of different quality
// - Polynomial optimization landscape with multiple valleys
export const threeHumpCamelProblem: ProblemDefinition = {
  name: 'Three-Hump Camel',
  objectiveFormula: <InlineMath>{String.raw`f(w) = 2w_0^2 - 1.05w_0^4 + \frac{w_0^6}{6} + w_0 w_1 + w_1^2`}</InlineMath>,
  description: (
    <>
      Multimodal polynomial with <InlineMath>1</InlineMath> global + <InlineMath>2</InlineMath> local minima, asymmetric basins
    </>
  ),

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    // f(w) = 2w0^2 - 1.05w0^4 + w0^6/6 + w0·w1 + w1^2
    return 2 * w0 * w0
         - 1.05 * Math.pow(w0, 4)
         + Math.pow(w0, 6) / 6
         + w0 * w1
         + w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    // ∂f/∂w0 = 4w0 - 4.2w0^3 + w0^5 + w1
    // ∂f/∂w1 = w0 + 2w1
    const dw0 = 4 * w0 - 4.2 * Math.pow(w0, 3) + Math.pow(w0, 5) + w1;
    const dw1 = w0 + 2 * w1;

    return [dw0, dw1];
  },

  hessian: (w: number[]): number[][] => {
    const [w0] = w;
    // ∂²f/∂w0² = 4 - 12.6w0^2 + 5w0^4
    // ∂²f/∂w0∂w1 = 1
    // ∂²f/∂w1∂w0 = 1
    // ∂²f/∂w1² = 2
    const h00 = 4 - 12.6 * w0 * w0 + 5 * Math.pow(w0, 4);
    const h01 = 1;
    const h10 = 1;
    const h11 = 2;

    return [[h00, h01], [h10, h11]];
  },

  domain: {
    w0: [-5, 5],
    w1: [-5, 5],
  },

  // Global minimum at origin
  globalMinimum: [0, 0],  // f(0, 0) = 0
};

// Educational content for Three-Hump Camel function
export const threeHumpCamelExplainer = (
  <CollapsibleSection
    title="Three-Hump Camel (Asymmetric Basins)"
    defaultExpanded={false}
    storageKey="problem-explainer-three-hump-camel"
  >
    <div className="space-y-3 text-gray-800">
      <p>
        <strong>Type:</strong> Multimodal (one global + two local minima)
      </p>

      <div>
        <p className="font-semibold">Objective Function:</p>
        <BlockMath>
          {String.raw`f(w) = 2w_0^2 - 1.05w_0^4 + \frac{w_0^6}{6} + w_0 w_1 + w_1^2`}
        </BlockMath>
      </div>

      <div>
        <p className="font-semibold">Three Minima:</p>
        <ul className="text-sm list-disc ml-5">
          <li><strong>Global:</strong> <InlineMath>(0, 0)</InlineMath> with <InlineMath>f = 0</InlineMath></li>
          <li><strong>Local:</strong> approximately <InlineMath>(1.75, -0.87)</InlineMath> with <InlineMath>f \approx 0.30</InlineMath></li>
          <li><strong>Local:</strong> approximately <InlineMath>(-1.75, 0.87)</InlineMath> with <InlineMath>f \approx 0.30</InlineMath></li>
        </ul>
      </div>

      <p>
        <strong>What it does:</strong> A standard multimodal benchmark with three valleys
        - one deep global minimum at <InlineMath>f=0</InlineMath> and two shallow local minima at <InlineMath>f \approx 0.30</InlineMath>.
      </p>

      <p>
        <strong>Why it's interesting:</strong> Classic multimodal benchmark function
        <Citation citationKey="three-hump-camel-function-benchmark" /> demonstrating asymmetric{' '}
        <GlossaryTooltip termKey="basin-of-convergence" /> structure where the
        deeper global minimum has a larger basin than the shallow local minima.
        Shows how optimization quality (depth) relates to basin size.
      </p>

      <p>
        <strong>Key Insight - Competitive Basins:</strong>
      </p>
      <ul className="text-sm list-disc ml-5 space-y-1">
        <li>
          <strong>Dominant basin:</strong> The global minimum at origin has a much larger basin
          of convergence - most starting points lead here
        </li>
        <li>
          <strong>Local minima basins:</strong> Two smaller side basins for the local minima
          (only nearby starting points converge to these)
        </li>
        <li>
          <strong>Asymmetry:</strong> Unlike Himmelblau (symmetric), this shows realistic scenarios
          where some minima are "better" and more accessible
        </li>
      </ul>

      <div className="bg-green-50 rounded p-3">
        <p className="text-sm font-semibold mb-1">Perfect for understanding:</p>
        <ul className="text-sm list-disc ml-5">
          <li>How basin size relates to minimum quality (deeper = larger basin)</li>
          <li>Why random initialization often finds the global minimum (largest basin)</li>
          <li>Competition between global and local optima</li>
          <li>Simple polynomial form makes the mathematics easy to understand</li>
        </ul>
      </div>

      <div className="bg-yellow-50 rounded p-3 mt-3 border border-yellow-200">
        <p className="text-sm font-semibold mb-1">Local Minima Trap:</p>
        <p className="text-sm">
          Starting points near (±1.7, ∓0.85) can converge to local minima instead of the
          global minimum. This demonstrates why multi-start strategies (trying multiple
          initial points) are important in real-world optimization!
        </p>
      </div>
    </div>
  </CollapsibleSection>
);
