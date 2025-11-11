# Pedagogical Style Guide

This document captures the principles and guidelines for writing pedagogical content in the optimization visualizer, based on our experience reorganizing the L-BFGS content.

## Core Principles

### 1. Accuracy Over Completeness

**Never say incorrect things.** It's acceptable to gloss over details or say vague things when simplifying, but never state something untrue.

- ✅ "L-BFGS approximates the inverse Hessian using gradient changes"
- ✅ "L-BFGS is more memory-efficient than full Newton methods"
- ❌ "M=5-10 usually works well" (unless we can demonstrate this)
- ❌ "Use L-BFGS for d > 1000" (arbitrary threshold without justification)

### 2. Demonstrable Concepts First

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

### 3. One Good Explanation Per Concept

Avoid redundancy. Each concept should have:
- **Either**: One comprehensive explanation
- **Or**: One quick gloss + one deep explanation (clearly separated)
- **Never**: The same concept explained 3+ times at similar depth levels randomly scattered

When we found the two-loop recursion explained 3 times (Quick Start, Two-Loop Details, Mathematical Derivations), we consolidated into:
- Quick mention in Quick Start: "uses two-loop recursion"
- Full explanation in "How L-BFGS Works"
- Reference pointer in Mathematical Details

### 4. Progressive Disclosure

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

### 5. Emphasize Unique Features

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

### 6. Mathematical Notation

**Always use KaTeX** for mathematical symbols, even for simple parameters.

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

### 7. Troubleshooting Content

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

### Using the `<Var>` Component

The `<Var>` component provides **cross-linked highlighting** and **type tooltips** for mathematical variables throughout pedagogical content.

**When to use `<Var>`:**
- ✅ Wrap ALL mathematical variables in pedagogical text (not just in pseudocode)
- ✅ Parameters, vectors, matrices, scalars (e.g., `s`, `y`, `B`, `H`, `M`, `γ`)
- ✅ Subscripted or modified versions if they represent the same concept (e.g., `s_k` and `s_i` both use `id="s"` if they're the same type of object)
- ❌ Do NOT wrap plain English words or non-variable text
- ❌ Do NOT wrap mathematical operators or constants like `0`, `1`, `∞`

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

**Example usage in pedagogical text:**

```tsx
<p className="text-sm text-blue-800 mb-2">
  <strong>Taylor expansion:</strong> The gradient at a new point relates to
  the old gradient via the Hessian <Var id="H" type="d×d matrix"><InlineMath>H</InlineMath></Var>:<br/>
  <span className="ml-4 inline-block my-1">
    <InlineMath>{String.raw`\nabla f(x_{\text{new}}) \approx \nabla f(x_{\text{old}}) + H \cdot s`}</InlineMath>
  </span><br/>
  where <Var id="s" type="vector ℝᵈ"><InlineMath>{String.raw`s = x_{\text{new}} - x_{\text{old}}`}</InlineMath></Var> is the parameter change.
</p>
```

**Benefits of global cross-linking:**
- Hovering over `s` in the "Building Intuition" section highlights ALL occurrences of `s` in the pseudocode
- Enforces consistency: if you use `id="s"` for two different concepts, the highlighting makes it obvious
- Helps readers trace variable flow through the algorithm
- Type tooltips provide dimensional information without cluttering the text

**ID consistency enforcement:**
- If a variable appears in multiple contexts (pseudocode + intuition + summary), use the **same ID** everywhere
- Hover highlighting will show you if you've accidentally used inconsistent IDs
- This is a feature, not a bug - it forces pedagogical clarity

**What NOT to do:**
```tsx
❌ <p>The vector s has dimension d</p>
<!-- Plain text, no linking or tooltips -->

❌ <Var id="s_temp"><InlineMath>s</InlineMath></Var>
<!-- Missing type annotation -->

❌ <Var id="parameter_change_vector" type="vector ℝᵈ"><InlineMath>s</InlineMath></Var>
<!-- ID too verbose, use "s" -->
```

**What TO do:**
```tsx
✅ <p>The vector <Var id="s" type="vector ℝᵈ"><InlineMath>s</InlineMath></Var> has dimension <InlineMath>d</InlineMath></p>

✅ <Var id="s" type="vector ℝᵈ"><InlineMath>s</InlineMath></Var>
<!-- Clear ID, proper type annotation -->
```

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
  <p className="text-sm text-blue-900 font-semibold mb-2">
    💡 Intuition
  </p>
  {/* Content */}
</div>
```

**Green** (✅) - Success patterns, advantages:
```tsx
<div className="bg-green-50 border border-green-400 rounded p-3 my-2">
  <p className="text-sm text-green-900 font-semibold mb-2">
    ✅ Advantage
  </p>
  {/* Content */}
</div>
```

### Cross-References

When removing redundancy, add explicit pointers:

```tsx
<p className="text-sm italic">
  For the full explanation of the secant equation, BFGS updates,
  and two-loop recursion, see the <strong>"How L-BFGS Works"</strong> section above.
  This section covers advanced theoretical topics.
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

## Metrics

Good reorganization should achieve:
- **Reduced line count** from eliminating redundancy (L-BFGS: 1090 → ~750 lines)
- **No concept explained more than 2 times** (1 quick + 1 deep maximum)
- **All parameters use KaTeX** (InlineMath/BlockMath)
- **No unsupported heuristics** (specific M values, d thresholds, etc.)
- **Clear progressive disclosure** (quick → complete → deep with appropriate defaultExpanded states)

## When in Doubt

Ask:
1. **Can we demonstrate this on our 2D problems?** (Rosenbrock, Beale, Himmelblau)
2. **Can we prove this mathematically?** (theory, complexity, algorithm correctness)
3. **Is this featured in our stories?** (if yes, make it prominent)
4. **Would a beginner be overwhelmed?** (if yes, move to collapsed section)
5. **Are we repeating ourselves?** (if yes, consolidate or cross-reference)

If you can't answer yes to #1 or #2, consider removing the content or making it more general/theoretical.
