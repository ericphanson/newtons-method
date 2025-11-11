# Pedagogical Style Guide

This document captures the principles and guidelines for writing pedagogical content in the optimization visualizer, based on our experience reorganizing the L-BFGS content.

## Core Principles

### 1. Accuracy Over Completeness

**Never say incorrect things.** It's acceptable to gloss over details or say vague things when simplifying, but never state something untrue.

- ✅ "L-BFGS approximates the inverse Hessian using gradient changes"
- ✅ "L-BFGS is more memory-efficient than full Newton methods"
- ❌ "M=5-10 usually works well" (unless we can demonstrate this)
- ❌ "Use L-BFGS for d > 1000" (arbitrary threshold without justification)

#### Avoid Misleading by Omission

**A statement can be technically correct but still misleading if it omits critical conditions.** This is especially important in educational content where students trust the material.

**Bad example:**

```tsx
❌ "Gradient descent always converges"
✓ Only with proper step size α
```

This implies gradient descent converges whenever α is "proper," which is misleading. Even with correct step size, GD only converges to stationary points (which may be local minima), and requires smoothness assumptions.

**Good example:**

```tsx
✅ "Gradient descent always converges"
✓ Requires smooth function + step size 0 < α < 2/L for convergence
✓ Even then, only converges to *stationary point* (may be local minimum, not global)
✓ Can diverge if α too large
✓ Can get stuck in local minima on non-convex functions
```

**Guiding principles:**

- **Not misleading**: Include essential conditions (smoothness, convexity, step size bounds)
- **Not "sales-y"**: Don't oversell algorithms' capabilities or undersell their limitations
- **Balanced**: Present both strengths AND weaknesses fairly
- **Educational accuracy**: Students are learning — inaccuracies compound as misconceptions
- **Still engaging**: Accurate ≠ dry. Use clear language, examples, visualizations

**More examples:**

❌ **Misleading**: "Newton's method converges in one step on quadratic functions"

- Technically true but omits that this requires exact line search and being at a point where the quadratic model is exact

✅ **Accurate**: "Newton's method converges in one step on strictly convex quadratic functions (where the Hessian is constant)"

❌ **Overselling**: "L-BFGS achieves nearly Newton-like performance with a fraction of the memory"

- "Nearly" is vague and oversells; depends heavily on M, problem structure, and what "nearly" means

✅ **Balanced**: "L-BFGS approximates Newton's direction using O(Md) memory vs O(d²), achieving superlinear (vs quadratic) convergence on strongly convex functions"

❌ **Underselling**: "Gradient descent is slow and inefficient"

- Overlooks that it's the most widely used optimizer in ML due to stochastic variants, simplicity, and stability

✅ **Fair**: "Gradient descent has slower convergence rates (linear vs superlinear/quadratic) but is simple, stable, and memory-efficient. Forms the basis for widely-used optimizers like SGD and Adam."

**When in doubt, ask:**

1. Is this statement true **in general**, or only under specific conditions I didn't mention?
2. Am I emphasizing positives/negatives fairly, or cherry-picking?
3. Would a student walk away with accurate understanding or misconceptions?
4. Can I back this claim up (either via demonstration or rigorous theory)?

### 2. Citations and Academic References

**Back up theoretical claims with citations.** When making statements about convergence rates, complexity guarantees, or mathematical properties, cite authoritative sources.

#### When to Use Citations

**MUST cite:**
- Theoretical convergence rates (e.g., "linear convergence on strongly convex functions")
- Mathematical theorems and proofs (e.g., "gradient descent converges when 0 < α < 2/L")
- Specific complexity results (e.g., "O(d³) per iteration for Newton's method")
- Non-obvious mathematical properties (e.g., "BFGS updates preserve positive definiteness")

**Optional/contextual:**
- Well-established algorithm descriptions (e.g., "gradient descent follows the negative gradient")
- Definitions widely used in the field (e.g., "convexity means...")
- Properties we demonstrate in visualizations (still good to cite, but demonstration provides support)

**NO citation needed:**
- Obvious facts (e.g., "matrices are square")
- Our own experimental observations (e.g., "in this visualization, you can see...")
- Algorithm pseudocode (this is descriptive, not a claim)

#### Using the Citation Component

Add inline citations using the `<Citation>` component:

```tsx
import { Citation } from '../Citation';

<p>
  <strong><GlossaryTooltip termKey="strongly-convex" />:</strong> Linear convergence to global minimum
  (requires <GlossaryTooltip termKey="smooth" /> function + 0 &lt; <InlineMath>{String.raw`\varAlpha`}</InlineMath> &lt; 2/(L+μ),
  where μ is strong convexity parameter)<Citation citationKey="gd-strongly-convex-linear-convergence" />
</p>
```

The citation renders as a superscript link `[1]` with a hover tooltip showing the source. Users can click to jump to the full reference in the References section.

#### Adding a References Section

Add a References section at the bottom of your tab:

```tsx
import { References } from '../References';

// At the end of your component JSX:
<References usedIn="GdFixedTab" defaultExpanded={false} storageKey="gd-fixed-references" />
```

The `usedIn` prop filters to only show citations marked for that component in `citations.json`.

#### Creating New Citations

See **[docs/workflows/citation-workflow.md](workflows/citation-workflow.md)** for the complete workflow on searching PDFs, extracting pages, and adding verified citations to `docs/citations.json`.

**Requirements:** Every citation must include exact page numbers, word-for-word quotes, your claim, notes on notation differences, and proof page images for verification.

### 3. Demonstrable Concepts First

Prioritize two types of content:

1. **What we can show in 2D visualizations**: If you can demonstrate it on our Rosenbrock/Beale/Himmelblau problems, it's fair game
2. **General theory**: Complexity analysis (O(d³) vs O(Md)), mathematical proofs, algorithm pseudocode

Avoid specific practitioner heuristics that we can't back up with either demonstrations or rigorous theory.

#### Examples

✅ **Good (Demonstrable)**:

- "L-BFGS only accepts pairs where s^T y > 0, making it more robust near saddle points" (we show this in stories)
- "Newton's method costs O(d³) per iteration, L-BFGS costs O(Md)" (general theory)
- "The two-loop recursion computes B^{-1}∇f without forming matrices" (can prove mathematically)

❌ **Avoid (Unsupported Heuristics)**:

- "M=5-10 usually works well in practice"
- "Use L-BFGS when d > 1000"
- "Set λ_damp to 0.01 as a starting point"
- "M=20 is often sufficient for near-Newton performance"

Just delete these. Don't change them to be more vague. We can save some space on our page.

### 4. One Good Explanation Per Concept

Avoid redundancy. Each concept should have:

- **Either**: One comprehensive explanation
- **Or**: One quick gloss + one deep explanation (clearly separated)
- **Never**: The same concept explained 3+ times at similar depth levels randomly scattered

When we found the two-loop recursion explained 3 times (Quick Start, Two-Loop Details, Mathematical Derivations), we consolidated into:

- Quick mention in Quick Start: "uses two-loop recursion"
- Full explanation in "How L-BFGS Works"
- Reference pointer in Mathematical Details

### 5. Every statement must have a point

There needs to be a reason we are including each statement on our page. We have limited space and our readers have limited attention. It's not enough for our statements to be true, they need to be building an understanding. We can't just throw random facts at the reader.

It's OK to delete stuff if it doesn't help with this, even if the statement is true.

### 6. Progressive Disclosure

Structure content from quick → complete → deep:

```
┌─────────────────────────────────────┐
│ Live Visualizations (Always Visible)│  ← Keep at top for easy access
├─────────────────────────────────────┤
│ Quick Start (defaultExpanded=true)  │  ← 30-50 lines, high-level only
├─────────────────────────────────────┤
│ Try This (defaultExpanded=true)     │  ← Interactive experiments
├─────────────────────────────────────┤
│ How It Works (defaultExpanded=false)│  ← Comprehensive deep dive
├─────────────────────────────────────┤
│ Mathematical Details (collapsed)     │  ← Advanced theory only
├─────────────────────────────────────┤
│ When Things Go Wrong (collapsed)     │  ← Troubleshooting
└─────────────────────────────────────┘
```

**Quick Start Guidelines**:

- Keep it under 50 lines
- Answer: What is it? When to use? Key parameters? What to try?
- Point to detailed sections for deep dives
- Default to **open** (defaultExpanded={true})

**How It Works Guidelines**:

- This is the comprehensive section - can be 200-400 lines
- Include: algorithm pseudocode, intuition, mathematical derivations, key insights
- Default to **closed** (defaultExpanded={false}) to not overwhelm
- Use subsections with clear headers

### 7. Emphasize Unique Features

If a feature is:

1. Unique to this algorithm (vs others on the site)
2. Featured in our stories
3. Important for understanding behavior

**Make it prominent** - include it in Quick Start AND explain it thoroughly in the deep section.

**Example**: L-BFGS curvature filtering

- Mentioned in Quick Start "When to Use"
- Prominent amber callout box in "How L-BFGS Works"
- Green success box in "When Things Go Wrong"
- Featured heavily in `src/stories/lbfgs-memory.ts`

### 8. Mathematical Notation

**Always use KaTeX** for mathematical symbols, even for simple parameters.

**Always define notation before using it** in formulas. Never assume the reader knows what a variable represents, even if it seems obvious.

**Examples of undefined notation to avoid:**

❌ **Wrong - using e_k without definition**:

```tsx
<p>L-BFGS exhibits superlinear convergence:</p>
<BlockMath>{String.raw`\lim_{k \to \infty} \frac{\|e_{k+1}\|}{\|e_k\|} = 0`}</BlockMath>
```

✅ **Correct - define e_k first**:

```tsx
<p>
  Let <InlineMath>e_k = \|w_k - w^*\|</InlineMath> be the error at iteration k
  (distance from optimal parameters). L-BFGS exhibits superlinear convergence:
</p>
<BlockMath>{String.raw`\lim_{k \to \infty} \frac{\|e_{k+1}\|}{\|e_k\|} = 0`}</BlockMath>
```

❌ **Wrong - inconsistent notation (x vs w)**:

```tsx
<p>The gradient relates to the Hessian via:</p>
<InlineMath>{String.raw`\nabla f(x_{\text{new}}) \approx \nabla f(x_{\text{old}}) + H \cdot s`}</InlineMath>
<!-- Uses x here but w everywhere else in the document -->
```

✅ **Correct - consistent notation throughout**:

```tsx
<p>The gradient relates to the Hessian via:</p>
<InlineMath>{String.raw`\nabla f(w_{\text{new}}) \approx \nabla f(w_{\text{old}}) + H \cdot s`}</InlineMath>
<p>where s = w_new - w_old is the parameter change.</p>
<!-- Uses w consistently, and defines s -->
```

**General guidelines:**

- Define all variables the first time they appear in a formula
- Use consistent notation throughout the entire tab (don't switch between x and w for parameters)
- When introducing a formula with subscripts (e.g., B_k), explain what the subscript means
- Even "obvious" notation like i, j, k should be introduced as iteration indices if used in summations

✅ **Correct**:

```tsx
<InlineMath>M</InlineMath> recent gradient changes
costs <InlineMath>O(Md)</InlineMath> time
parameter <InlineMath>\lambda_{\text{damp}}</InlineMath>
```

❌ **Avoid**:

```tsx
M recent gradient changes (plain text)
costs O(Md) time (plain text)
parameter λ_damp (Unicode)
```

**LaTeX in JSX strings**: Use `String.raw` for complex LaTeX to avoid escaping issues:

```tsx
<InlineMath>{String.raw`\lambda_{\text{damp}}`}</InlineMath>
```

### 9. Troubleshooting Content

Only include issues that we can either:

1. **Demonstrate** in our 2D experiments
2. **Explain with theory** (e.g., "slow convergence means eigenvalues are poorly approximated")

Avoid:

- Specific parameter recommendations without justification
- "Try increasing X to Y" without demonstrable reasoning
- Rules of thumb that aren't backed by visible behavior

✅ **Good**:

- "If convergence is slow, the memory size M might be too small to capture the Hessian structure. Increasing M improves the approximation but costs more per iteration (O(Md))."
- "If you see 'rejected' curvature pairs, the step wasn't useful for approximating the Hessian. This is normal and expected."

❌ **Avoid**:

- "Try increasing M to 20"
- "Set λ_damp to 0.1 or higher"
- "M=10 is usually sufficient"

## Variable Highlighting and Type Annotations

There are two complementary approaches for making variables interactive:

1. **KaTeX macros** (e.g., `\varH`, `\varM`) — Use for simple variables within LaTeX expressions
2. **`<Var>` wrapper component** — Use for composite expressions or custom rendering

Both approaches provide cross-linked highlighting and type tooltips. Choose based on context and readability.

### Using KaTeX Macros (Preferred for Simple Variables)

All common mathematical variables have auto-generated KaTeX macros defined in [`src/variables.ts`](../src/variables.ts). These macros inject data attributes for interactivity while maintaining perfect LaTeX rendering.

**When to use macros:**

- ✅ Simple variables within longer LaTeX expressions (e.g., `\varH` in `\varH^{-1}\varGrad`)
- ✅ Repeated variables that appear frequently
- ✅ When you want clean, readable LaTeX source code
- ❌ Composite expressions like H⁻¹∇f as a single concept (use `<Var>` wrapper instead)

**Macro naming convention:**

- Pattern: `\var` + PascalCase variable ID
- **Numbers are spelled out** (LaTeX macros can only contain letters)
- Examples:
  - `\varH` → Hessian matrix H (id="H")
  - `\varM` → Memory size M (id="M")
  - `\vars` → Parameter change vector s (id="s")
  - `\varY` → Gradient change vector y (id="y")
  - `\varBZero` → Initial Hessian B₀ (id="B_0") — note: 0 → Zero
  - `\varBOne` → B₁ after one update (id="B_1") — note: 1 → One
  - `\varSI` → Parameter change sᵢ (id="s_i") — note: i is a letter
  - `\varGrad` → Gradient ∇f (id="grad")
  - `\varAlphaI` → Forward coefficient αᵢ (id="alpha_i")
  - `\varLambdaDamp` → Damping parameter λ_damp (id="lambda_damp")

**See [`src/variables.ts`](../src/variables.ts) for the complete list of available macros.**

**⚠️ Common Pitfall: Numbers in Macro Names**

LaTeX macros can **only contain letters** (a-z, A-Z), not digits. This means `\varB0` is invalid and will be interpreted as the macro `\varB` followed by the digit `0`, causing spacing issues.

```tsx
❌ WRONG: <InlineMath>\varB0 = (1/\varGamma)\varI</InlineMath>
<!-- Renders as "B 0 = (1/γ)I" with unwanted space -->

✅ CORRECT: <InlineMath>\varBZero = (1/\varGamma)\varI</InlineMath>
<!-- Renders properly as "B₀ = (1/γ)I" -->
```

The `toPascalCase()` function in `src/variables.ts` automatically handles this by spelling out digits (0→Zero, 1→One, etc.).

**Example usage:**

```tsx
<p>
  Newton's method uses <InlineMath>\varH</InlineMath> to compute the search direction,
  but L-BFGS approximates it using only <InlineMath>\varM</InlineMath> recent gradient changes.
</p>

<p className="text-sm">
  The two-loop recursion computes <InlineMath>\varB^{{-1}}\varGrad</InlineMath> in
  <InlineMath>O(Md)</InlineMath> time without forming the matrix.
</p>
```

**Benefits:**

- Clean, readable LaTeX source code
- No need to specify `id` and `type` props repeatedly (defined once in registry)
- Automatic consistency enforcement via central registry
- Perfect rendering with no spacing issues

### Using the `<Var>` Component (For Composite Expressions)

The `<Var>` component wraps entire `<InlineMath>` or `<BlockMath>` components to make **semantic compound expressions** interactive with a single ID.

**CRITICAL DISTINCTION:**

**✅ Use `<Var>` for semantic compounds** (results we treat as one meaningful concept):

- H⁻¹∇f as "search direction" — this is a **result** with its own semantic meaning (vector that points in descent direction)
- The compound has meaningful dimensionality (e.g., vector, not matrix)
- We refer to this compound as a unit in explanations

**❌ Do NOT use `<Var>` for equations/definitions** (showing how something is computed):

- `y = ∇f_new - ∇f_old` — this is a **definition** showing how `y` is computed
- `B_k(I - ρys^T)` — this shows **mathematical manipulations** where each piece needs to be understood
- In these cases, mark individual variables with macros (both left and right sides), but DON'T wrap the entire equation as one variable

**When to use `<Var>`:**

- ✅ Semantic compound expressions (e.g., H⁻¹∇f as "search direction")
- ✅ Custom LaTeX that doesn't match a registry variable
- ✅ Variables in plain text paragraphs (outside LaTeX)
- ✅ When you need to override the default type tooltip
- ❌ Equations showing definitions or computations (use individual macros instead)
- ❌ Simple single variables within LaTeX (use macros: `\varH`, `\varM`)
- ❌ Plain English words or non-variable text
- ❌ Mathematical operators or constants like `0`, `1`, `∞`

**ID naming conventions:**

- **Use consistent IDs** for the same concept throughout the entire tab
- The ID is what links variables together for cross-highlighting
- Examples:
  - `id="s"` for parameter change vectors
  - `id="y"` for gradient change vectors
  - `id="H"` or `id="H_true"` for true Hessian
  - `id="B"` or `id="B_approx"` for approximate Hessian
  - `id="gamma"` for scaling factor γ
  - `id="alpha"` for step size α

**Type annotations:**

- **Always provide the `type` prop** for tooltips showing dimensionality
- Use clear, concise descriptions:
  - `type="vector ℝᵈ"` for d-dimensional vectors
  - `type="scalar"` for scalar values
  - `type="d×d matrix"` for matrices
  - `type="d×d matrix (implicit)"` for implicitly-represented matrices
  - `type="d×d matrix (scaled identity)"` for special structure

**Example usage:**

```tsx
{
  /* ✅ CORRECT: Semantic compound with meaningful dimensionality */
}
<p>
  Newton's method uses the search direction{" "}
  <Var id="p" type="vector ℝᵈ">
    <InlineMath>{String.raw`H^{-1}\nabla f`}</InlineMath>
  </Var>{" "}
  for smarter steps.
</p>;
{
  /* This is correct because H⁻¹∇f is a RESULT (search direction) that we treat as one concept */
}

{
  /* ❌ WRONG: Equation/definition wrapped as one thing */
}
<p>
  where{" "}
  <Var id="s" type="vector ℝᵈ">
    <InlineMath>{String.raw`s = x_{\text{new}} - x_{\text{old}}`}</InlineMath>
  </Var>{" "}
  is the parameter change.
</p>;
{
  /* This is WRONG because it's showing HOW s is computed, not a semantic compound */
}

{
  /* ✅ CORRECT: Mark individual variables with macros */
}
<p>
  where <InlineMath>\varS</InlineMath> = <InlineMath>{String.raw`x_{\text{new}} - x_{\text{old}}`}</InlineMath>{" "}
  is the parameter change.
</p>;
{
  /* Now users can hover s on the left to see it highlighted everywhere */
}

{
  /* ✅ EVEN BETTER: Mark ALL variables if they appear in the registry */
}
<p>
  Define <InlineMath>\varY</InlineMath> = <InlineMath>{String.raw`\nabla f(x_{\text{new}}) - \nabla f(x_{\text{old}})`}</InlineMath>{" "}
  (gradient change).
</p>;
{
  /* This makes individual variables interactive for cross-linking, without treating the whole equation as one thing */
}

{
  /* ❌ WRONG: Mathematical manipulations wrapped as one variable */
}
<p>
  The formula is{" "}
  <Var id="bfgs_term">
    <InlineMath>{String.raw`B_k(I - \rho ys^T)`}</InlineMath>
  </Var>
</p>;
{
  /* This is WRONG - we're showing manipulations, each piece needs separate highlighting */
}

{
  /* ✅ CORRECT: Use macros for each variable within the expression */
}
<p>
  The formula is <InlineMath>{String.raw`\varB_k(\varI - \varRho \varY \varS^T)`}</InlineMath>
</p>;
{
  /* Now users can hover each variable (B_k, I, ρ, y, s) to see where they appear elsewhere */
}
```

**Key question to ask:** "Is this a **result** we refer to as one thing, or are we showing **how to compute** something?"

- If showing computation/definition → use individual macros
- If referring to a meaningful compound result → use `<Var>` wrapper

**Benefits of global cross-linking:**

- Hovering over `s` in the "Building Intuition" section highlights ALL occurrences of `s` in the pseudocode
- Enforces consistency: if you use `id="s"` for two different concepts, the highlighting makes it obvious
- Helps readers trace variable flow through the algorithm
- Type tooltips provide dimensional information without cluttering the text

**ID consistency enforcement:**

- If a variable appears in multiple contexts (pseudocode + intuition + summary), use the **same ID** everywhere
- Hover highlighting will show you if you've accidentally used inconsistent IDs
- This is a feature, not a bug - it forces pedagogical clarity

### Adding New Variables to the Registry

When you need a new mathematical variable that doesn't exist in the registry:

1. **Add to `src/variables.ts`:**

   ```typescript
   export const VARIABLES: Record<string, VariableMetadata> = {
     // ... existing variables

     my_new_var: {
       id: "my_new_var",
       type: "vector ℝᵈ",
       latex: "v", // Optional: defaults to id if not specified
       description: "My new variable",
     },
   };
   ```

2. **Use the auto-generated macro:**

   ```tsx
   <InlineMath>\varMy_new_var</InlineMath>
   ```

3. **Validation is automatic:**
   - Build-time KaTeX validation (via `npm run build`) checks all macros
   - TypeScript compilation ensures registry consistency
   - Undefined macros will fail the build with clear error messages

**Macro naming is automatic:**

- Registry ID `my_var` → Macro `\varMyVar`
- Registry ID `H` → Macro `\varH`
- Registry ID `lambda_damp` → Macro `\varLambdaDamp`
- Registry ID `B_0` → Macro `\varBZero` (0 → Zero)
- Registry ID `s_i` → Macro `\varSI` (i is a letter)
- Registry ID `alpha_i` → Macro `\varAlphaI`

The `generateKaTeXMacros()` function handles the conversion automatically, including spelling out numbers (0-9 → Zero-Nine) since LaTeX macros can only contain letters.

### Choosing Between Macros and `<Var>` Wrapper

**Use macros for simple variables:**

```tsx
✅ <p>L-BFGS stores <InlineMath>\varM</InlineMath> recent gradient changes.</p>
✅ <p>The Hessian <InlineMath>\varH</InlineMath> costs <InlineMath>O(d^3)</InlineMath> to compute.</p>
✅ <InlineMath>\varB^{{-1}}\varGrad</InlineMath>  {/* Multiple variables in one expression */}

❌ <p>L-BFGS stores <Var id="M" type="scalar"><InlineMath>M</InlineMath></Var> recent changes.</p>
<!-- Verbose! Use \varM macro instead -->
```

**Use `<Var>` wrapper for composite RESULTS (not definitions):**

```tsx
✅ <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`H^{-1}\nabla f`}</InlineMath></Var>
<!-- Composite RESULT treated as one semantic unit (search direction) -->

✅ <Var id="grad_f"><InlineMath>\nabla f \in \mathbb{R}^d</InlineMath></Var>
<!-- When you want the entire expression (including dimension) as ONE hover target -->

❌ <Var id="s" type="vector ℝᵈ"><InlineMath>{String.raw`s = x_{\text{new}} - x_{\text{old}}`}</InlineMath></Var>
<!-- WRONG: This is showing HOW s is computed (definition), not a result! -->

✅ <InlineMath>\varS = x_{\text{new}} - x_{\text{old}}</InlineMath>
<!-- CORRECT: Use macro for s, keep definition separate -->
```

**Key distinction:**

- **Result** (use `<Var>`): H⁻¹∇f as "search direction" - a meaningful compound we reference as ONE thing
- **Definition** (use macros): s = x_new - x_old - we're showing HOW to compute s, not referring to a compound result

## Content Organization Patterns

### Collapsible Sections

```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={true}  // Open for essential content
  storageKey="algorithm-quick-start"  // Unique per section
  id="quick-start"  // For anchor links
>
```

**defaultExpanded Guidelines**:

- `true`: Quick Start, Try This (first-time user essentials)
- `false`: How It Works, Mathematical Details, Advanced Topics (deep dives)

### Callout Boxes

Use colored callout boxes to highlight important insights:

**Amber** (🛡️) - Unique features, important differences:

```tsx
<div className="bg-amber-50 border border-amber-400 rounded p-3 my-2">
  <p className="text-sm text-amber-900 font-semibold mb-2">
    🛡️ Curvature Filtering: L-BFGS's Secret to Robustness
  </p>
  {/* Content */}
</div>
```

**Blue** (💡) - Key insights, intuition:

```tsx
<div className="bg-blue-50 border border-blue-400 rounded p-3 my-2">
  <p className="text-sm text-blue-900 font-semibold mb-2">💡 Intuition</p>
  {/* Content */}
</div>
```

**Green** (✅) - Success patterns, advantages:

```tsx
<div className="bg-green-50 border border-green-400 rounded p-3 my-2">
  <p className="text-sm text-green-900 font-semibold mb-2">✅ Advantage</p>
  {/* Content */}
</div>
```

### Cross-References

When removing redundancy, add explicit pointers:

```tsx
<p className="text-sm italic">
  For the full explanation of the secant equation, BFGS updates, and two-loop
  recursion, see the <strong>"How L-BFGS Works"</strong> section above. This
  section covers advanced theoretical topics.
</p>
```

## Example Structure: L-BFGS Tab

Final structure after reorganization:

```
1. Memory Visualization (live, always visible)
2. Hessian Comparison (live, always visible)
3. Quick Start (defaultExpanded=true)
   - What is L-BFGS? (~3 sentences)
   - When to Use (4 bullets, including unique features)
   - Key Parameters (M, λ_damp with O() complexity, no specific values)
   - What to Try (pointer to next section)
4. Try This (defaultExpanded=true)
   - 3-4 concrete experiments
5. How L-BFGS Works (defaultExpanded=false)
   - High-Level Algorithm (pseudocode)
   - Building Intuition (Taylor → Secant → BFGS with proof)
   - Curvature Filtering (prominent amber callout)
   - Two-Loop Recursion (full explanation)
   - Hessian Damping (consolidated from 3 places)
   - Key Takeaways (summary bullets)
6. Mathematical Details (collapsed)
   - Only non-redundant advanced topics
   - Pointer to "How It Works" for basics
7. When Things Go Wrong (collapsed)
   - Common Issues (general, no specific values)
   - Advantages Over Newton (unique strengths)
```

## Additional Components

### Complexity Annotations

Use the `<Complexity>` component to annotate algorithmic complexity in pseudocode:

```tsx
<span className="ml-4">
  Compute gradient{" "}
  <Var id="grad">
    <InlineMath>\nabla f(w)</InlineMath>
  </Var>{" "}
  <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity>
</span>
```

**Guidelines:**

- Include `explanation` prop for hover tooltips explaining what contributes to the complexity
- Use clear, concise notation: `O(d)`, `O(Md)`, `O(d³)`
- For problem-dependent operations (gradient, function evaluations), use counts: `1 ∇f eval`, `≈1-4 f evals`
- Always include for every step in pseudocode to help readers understand computational cost

**Common patterns:**

- `<Complexity>O(1)</Complexity>` - Constant time (assignments, conditionals)
- `<Complexity explanation="Vector addition">O(d)</Complexity>` - Linear in dimension
- `<Complexity explanation="Inner product + division">O(d)</Complexity>` - Multiple O(d) operations
- `<Complexity explanation="M pairs × d">O(Md)</Complexity>` - Loop over memory pairs
- `<Complexity explanation="Matrix-vector product">O(d²)</Complexity>` - Quadratic operations

### Glossary Tooltips

**For all glossary-related guidelines, see the authoritative style guide in [`src/lib/glossary.tsx`](../src/lib/glossary.tsx) (lines 10-78).**

The glossary file contains comprehensive documentation on:

- When to add terms to the glossary registry vs. when NOT to add
- When to use `<GlossaryTooltip>` vs. plain text
- Balancing help without overwhelming with visual noise
- Detailed example patterns for different contexts

**Quick reference:**

```tsx
// First occurrence in a section - use tooltip
<p><strong><GlossaryTooltip termKey="superlinear-convergence" />:</strong></p>

// Later mentions in same section - use plain text
<p>The superlinear convergence rate depends on memory size M.</p>
```

**The glossary guide takes precedence for all tooltip-related decisions.**

### Callout Color Taxonomy

**Complete color guide for semantic callouts:**

**Amber** (⚠️) - Warnings, cautions, important limitations:

```tsx
<div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-3">
  <p className="font-semibold text-amber-900 mb-2">⚠️ Important Limitation</p>
  <p className="text-sm text-amber-800">{/* Content */}</p>
</div>
```

**Blue** (💡) - Key insights, intuition, "why this works":

```tsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
  <p className="font-semibold text-blue-900 mb-3">
    💡 Why (s, y) pairs capture curvature:
  </p>
  <p className="text-sm text-blue-800">{/* Content */}</p>
</div>
```

**Green** (✅) - Success patterns, advantages, robustness features:

```tsx
<div className="bg-green-50 border-l-4 border-green-500 p-4 my-3">
  <p className="text-sm text-green-900 font-semibold mb-1">
    ✅ Advantage over Newton
  </p>
  <p className="text-sm text-green-800">{/* Content */}</p>
</div>
```

**Purple/Indigo** - Mathematical details, proofs, derivations:

```tsx
<div className="bg-indigo-100 rounded p-4">
  <p className="font-bold text-indigo-900 mb-2">Key Takeaways</p>
  <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
    {/* Content */}
  </ul>
</div>
```

**Red** - Errors, failures, what NOT to do (use sparingly):

```tsx
<div className="bg-red-50 border-l-4 border-red-500 p-4 my-3">
  <p className="font-semibold text-red-900 mb-2">❌ Common Mistake</p>
  <p className="text-sm text-red-800">{/* Content */}</p>
</div>
```

**Gray** - Implementation details, parameter effects, neutral information:

```tsx
<div className="bg-gray-100 rounded p-3 mt-3">
  <p className="font-bold text-sm mb-2">
    Effect of λ<sub>damp</sub>:
  </p>
  <ul className="text-sm list-disc ml-6 space-y-1">{/* Content */}</ul>
</div>
```

**Nested callouts:** Use border color + lighter background for nested emphasis (e.g., blue-100 inside blue-50)

## Metrics

Good reorganization should achieve:

- **Reduced line count** from eliminating redundancy (L-BFGS: 1090 → ~750 lines)
- **No concept explained more than 2 times** (1 quick + 1 deep maximum)
- **All parameters use KaTeX** (InlineMath/BlockMath)
- **No unsupported heuristics** (specific M values, d thresholds, etc.)
- **Clear progressive disclosure** (quick → complete → deep with appropriate defaultExpanded states)

## When in Doubt: The Demonstrability Principle

Before adding any content, ask these questions:

### 1. Can we demonstrate this on our 2D problems?

**What counts as "demonstrated":**

- ✅ **Behavior is observable** in the visualizer across multiple test problems (e.g., Rosenbrock, Himmelblau, Beale)
- ✅ **Quantitative verification** via plots, metrics, or memory tables (e.g., eigenvalue evolution shows approximation quality)
- ✅ **User can reproduce** by following "Try This" experiments (e.g., "Run L-BFGS with M=3 vs M=10 on Rosenbrock")
- ❌ **Theoretical property** that we can't actually show in 2D (e.g., "works well in 1000+ dimensions")
- ❌ **Specific numerical claims** without verification (e.g., "M=5 is optimal for most problems")

**Examples:**

- ✅ "L-BFGS is more robust than Newton on Himmelblau (avoids saddle points)" - DEMONSTRABLE via comparison
- ✅ "Curvature filtering: memory table shows rejected pairs where s^T y ≤ 0" - DEMONSTRABLE via live data
- ❌ "L-BFGS typically converges in 50-100 iterations on real problems" - NOT demonstrable (depends on problem)
- ❌ "Use M=10 for problems with d > 1000" - NOT demonstrable in our 2D visualizer

### 2. Can we prove this mathematically?

**What counts as "provable":**

- ✅ **Theoretical results** with citations (e.g., "superlinear convergence under strong convexity")
- ✅ **Complexity analysis** we can derive (e.g., "O(Md) per iteration")
- ✅ **Algorithmic correctness** we can verify (e.g., BFGS update satisfies secant equation)
- ❌ **Empirical observations** without theory (e.g., "usually converges faster than...")
- ❌ **Heuristic guidelines** without justification (e.g., "use larger M for harder problems")

**If YES to #1 or #2:** Include the content prominently
**If NO to both:** Consider removing or marking as "empirical observation" with appropriate caveats

### 3. Is this featured in our stories?

If a concept appears in `src/stories/*.ts` (curated examples), make it prominent with:

- Callout boxes in the relevant sections
- Cross-references to experiments that demonstrate it
- Visual emphasis (colored borders, icons)

### 4. Would a beginner be overwhelmed?

**Move to collapsed sections if:**

- Mathematical proofs or derivations (→ "Mathematical Details")
- Implementation specifics (→ "Advanced Topics")
- Edge cases or failure modes (→ "When Things Go Wrong")

**Keep visible if:**

- Core algorithm understanding (→ "How It Works")
- Practical guidance (→ "Quick Start", "Try This")
- Key intuitions (→ prominent callouts)

### 5. Are we repeating ourselves?

**One Good Explanation Per Concept:**

- Quick mention in "Quick Start" (1-2 sentences)
- Deep explanation in "How It Works" (full section)
- Cross-reference from other sections instead of repeating

**Example:** Hessian damping should be explained ONCE in "How It Works", not repeated in "Quick Start", pseudocode comments, AND "Mathematical Details".
