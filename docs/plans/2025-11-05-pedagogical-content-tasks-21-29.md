# Pedagogical Content Enhancement - Tasks 21-29 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete L-BFGS pedagogical content (Tasks 21-25), refactor both Gradient Descent tabs to match the new unified structure (Tasks 26-27), verify and test the implementation (Task 28), and finalize with documentation (Task 29).

**Architecture:** Add remaining CollapsibleSection components for L-BFGS (Line Search Details, Try This, When Things Go Wrong, Mathematical Derivations, Advanced Topics). Then refactor existing GD content to match the new dual-track structure with proper KaTeX rendering and experiment placeholders.

**Tech Stack:** React, TypeScript, KaTeX (already installed), Tailwind CSS, existing CollapsibleSection components

**Prerequisites:** Tasks 1-20 must be completed (KaTeX installed, Math component created, experiment presets created, Newton content added, L-BFGS Quick Start and Visual Guide added).

---

## Task 21: Add L-BFGS Line Search Details

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (L-BFGS section, after Visual Guide)

**Step 1: Locate insertion point**

Find the L-BFGS Visual Guide CollapsibleSection (added in Task 20).
Expected: Located around line 1450-1507

**Step 2: Add Line Search Details section**

Add after the Visual Guide section:

```tsx
<CollapsibleSection
  title="Line Search Details"
  defaultExpanded={false}
  storageKey="lbfgs-line-search-details"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Why Line Search for L-BFGS</h3>
      <p>
        Quasi-Newton direction <InlineMath>p \approx -H^{-1}\nabla f</InlineMath> is only
        an approximation:
      </p>
      <ul className="list-disc ml-6 space-y-1 mt-2">
        <li>
          <strong>Not guaranteed to be descent direction</strong> if approximation poor
        </li>
        <li>
          <strong>Line search ensures we actually decrease the loss</strong>
        </li>
        <li>
          <strong>Essential for convergence guarantees</strong>
        </li>
      </ul>
      <p className="text-sm mt-2">
        Without line search, L-BFGS can diverge even on well-behaved problems.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Current Method: Armijo Backtracking</h3>
      <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
      <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
      <p className="text-sm mt-2">
        Where <InlineMath>c_1 = </InlineMath>{lbfgsC1.toFixed(4)} controls how much decrease we require.
      </p>

      <div className="mt-3">
        <p className="font-semibold">Backtracking Algorithm:</p>
        <ol className="list-decimal ml-6 space-y-1 text-sm">
          <li>Start with <InlineMath>\alpha = 1</InlineMath> (try full step first)</li>
          <li>Check if Armijo condition satisfied</li>
          <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
          <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
        </ol>
      </div>

      <p className="text-sm mt-3">
        <strong>Typical behavior:</strong> When the quasi-Newton approximation is good
        (near minimum, after building history), <InlineMath>\alpha = 1</InlineMath> is
        often accepted. When approximation is poor (early iterations, far from minimum),
        backtracking finds smaller steps.
      </p>
    </div>

    <div className="bg-amber-100 rounded p-3">
      <p className="font-bold text-sm mb-2">Wolfe Conditions (Advanced)</p>
      <p className="text-sm">
        Full BFGS theory requires <strong>Wolfe conditions</strong> (Armijo + curvature
        condition) to guarantee positive definiteness. This implementation uses Armijo
        backtracking, which works well in practice for L-BFGS.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 3: Save file**

**Step 4: Test in browser**

Run: `npm run dev`
Expected: L-BFGS tab shows Line Search Details section (collapsed by default)

**Step 5: Verify section behavior**

Action: Click to expand Line Search Details
Expected: Section expands, math renders correctly, `lbfgsC1` variable displays

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): add Line Search Details section"
```

---

## Task 22: Add L-BFGS Try This Experiments

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (L-BFGS section, after Line Search Details)

**Step 1: Add Try This section with experiment placeholders**

Add after Line Search Details:

```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={true}
  storageKey="lbfgs-try-this"
>
  <div className="space-y-3">
    <p className="text-gray-800 mb-4">
      Run these experiments to see L-BFGS in action and understand how memory affects performance:
    </p>

    <div className="space-y-3">
      <div className="border border-amber-200 rounded p-3 bg-amber-50">
        <div className="flex items-start gap-2">
          <button className="text-amber-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-amber-900">Success: Strongly Convex Problem</p>
            <p className="text-sm text-gray-700">
              Fast Newton-like convergence without computing Hessian
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Memory pairs build curvature info, converges similar to Newton
            </p>
          </div>
        </div>
      </div>

      <div className="border border-blue-200 rounded p-3 bg-blue-50">
        <div className="flex items-start gap-2">
          <button className="text-blue-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-blue-900">Memory Matters: M=3 vs M=10</p>
            <p className="text-sm text-gray-700">
              Compare different memory sizes on ill-conditioned problem
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: M=3 needs more iterations, M=10 converges faster (try both!)
            </p>
          </div>
        </div>
      </div>

      <div className="border border-purple-200 rounded p-3 bg-purple-50">
        <div className="flex items-start gap-2">
          <button className="text-purple-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-purple-900">Challenge: Rosenbrock Valley</p>
            <p className="text-sm text-gray-700">
              Non-convex problem tests quasi-Newton approximation quality
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Superlinear convergence once memory captures valley curvature
            </p>
          </div>
        </div>
      </div>

      <div className="border border-green-200 rounded p-3 bg-green-50">
        <div className="flex items-start gap-2">
          <button className="text-green-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-green-900">Compare: L-BFGS vs GD vs Newton</p>
            <p className="text-sm text-gray-700">
              See the speed/cost tradeoff across algorithms
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: GD slow, Newton fast but expensive, L-BFGS best of both worlds
            </p>
          </div>
        </div>
      </div>
    </div>

    <p className="text-xs text-gray-500 mt-4">
      Note: One-click experiment loading coming soon!
    </p>
  </div>
</CollapsibleSection>
```

**Step 2: Save file**

**Step 3: Test in browser**

Run: `npm run dev`
Expected: L-BFGS tab shows Try This section with 4 experiment placeholders

**Step 4: Verify layout**

Action: Check experiment cards display with proper colors and spacing
Expected: 4 colored cards (amber, blue, purple, green) with play button icons

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): add Try This section with experiment placeholders"
```

---

## Task 23: Add L-BFGS When Things Go Wrong

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (L-BFGS section, after Try This)

**Step 1: Add When Things Go Wrong section**

Add after Try This:

```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="lbfgs-when-wrong"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

      <div className="space-y-3">
        <div>
          <p className="font-semibold">❌ "L-BFGS is always better than gradient descent"</p>
          <p className="text-sm ml-6">
            ✓ Requires smooth objectives and good line search<br/>
            ✓ Can fail on non-smooth problems (L1 regularization, ReLU, kinks)<br/>
            ✓ More complex to implement and debug
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "L-BFGS equals Newton's method"</p>
          <p className="text-sm ml-6">
            ✓ Only approximates Newton direction<br/>
            ✓ Approximation quality depends on M and problem structure<br/>
            ✓ Superlinear vs quadratic convergence
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "More memory (larger M) is always better"</p>
          <p className="text-sm ml-6">
            ✓ Diminishing returns: M=5-20 usually sufficient<br/>
            ✓ Larger M = more computation per iteration<br/>
            ✓ Very old pairs may contain stale curvature information
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
      <ul className="space-y-2">
        <li>
          <strong>Strongly convex:</strong> Superlinear convergence guaranteed
          (between linear GD and quadratic Newton)
        </li>
        <li>
          <strong>Convex:</strong> Converges to global minimum
        </li>
        <li>
          <strong>Non-convex:</strong> Can converge to local minima, no global
          guarantees (like all local methods)
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Slow convergence</strong> → increase M, improve initialization,
          check smoothness assumptions
        </li>
        <li>
          <strong>Oscillation</strong> → decrease M or line search c1 parameter
        </li>
        <li>
          <strong>Memory issues</strong> → M too large for hardware, decrease M
        </li>
        <li>
          <strong>Non-smooth objective</strong> → consider specialized variants
          (OWL-QN for L1) or smoothing techniques
        </li>
        <li>
          <strong>Stale curvature</strong> → problem landscape changes dramatically,
          consider restarting with fresh memory
        </li>
      </ul>
    </div>

    <div className="bg-amber-100 rounded p-3">
      <p className="font-bold text-sm mb-2">When to Switch Algorithms</p>
      <ul className="text-sm list-disc ml-6">
        <li>Problem too small (n &lt; 100) → consider full BFGS or Newton</li>
        <li>Non-smooth objective → use subgradient methods or specialized variants</li>
        <li>Stochastic setting (mini-batches) → use stochastic variants or Adam</li>
        <li>Need exact second-order convergence → use Newton's method</li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Save file**

**Step 3: Test in browser**

Expected: When Things Go Wrong section appears (collapsed by default)

**Step 4: Verify content**

Action: Expand section and verify all subsections display
Expected: Misconceptions, convexity, troubleshooting all visible

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): add When Things Go Wrong section"
```

---

## Task 24: Add L-BFGS Mathematical Derivations

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (L-BFGS section, after When Things Go Wrong)

**Step 1: Add Mathematical Derivations section**

Add after When Things Go Wrong:

```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="lbfgs-math-derivations"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Secant Equation</h3>
      <p>Newton uses: <InlineMath>Hp = -\nabla f</InlineMath> (exact)</p>
      <p className="mt-2">Quasi-Newton: approximate H or H⁻¹ from gradients</p>
      <p className="mt-2"><strong>Key insight:</strong></p>
      <BlockMath>y_k = \nabla f_{k+1} - \nabla f_k \approx H s_k</BlockMath>
      <p className="text-sm mt-2">
        Where <InlineMath>s_k = w_{k+1} - w_k</InlineMath> (parameter change)
      </p>
      <p className="text-sm mt-2">
        This <strong>secant equation</strong> relates gradient changes to parameter
        changes via approximate Hessian.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">BFGS Update Formula</h3>
      <p>Start with approximation <InlineMath>B_k \approx H</InlineMath></p>
      <p className="mt-2">
        Update to <InlineMath>B_{k+1}</InlineMath> satisfying secant equation:
      </p>
      <BlockMath>B_{k+1}s_k = y_k</BlockMath>
      <p className="mt-2"><strong>BFGS formula:</strong></p>
      <BlockMath>
        B_{k+1} = B_k - \frac{B_k s_k s_k^T B_k}{s_k^T B_k s_k} + \frac{y_k y_k^T}{y_k^T s_k}
      </BlockMath>
      <p className="text-sm mt-2">
        Maintains positive definiteness if <InlineMath>y_k^T s_k &gt; 0</InlineMath>
        (guaranteed by Wolfe line search).
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Why Limited Memory?</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Full BFGS:</strong> stores <InlineMath>B_k</InlineMath> (n×n matrix)
          → O(n²) memory
        </li>
        <li>
          <strong>L-BFGS:</strong> don't store <InlineMath>B_k</InlineMath>, instead
          store M recent <InlineMath>(s,y)</InlineMath> pairs → O(Mn) memory
        </li>
        <li>
          Implicitly represent <InlineMath>B_k^{-1}</InlineMath> via two-loop recursion
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Two-Loop Recursion</h3>
      <p className="mb-2">
        <strong>Given:</strong> M pairs <InlineMath>(s_i, y_i)</InlineMath> and
        gradient <InlineMath>q = \nabla f</InlineMath>
      </p>
      <p className="mb-2">
        <strong>Goal:</strong> compute <InlineMath>p = B_k^{-1} q \approx -H^{-1}\nabla f</InlineMath>
      </p>

      <div className="bg-indigo-50 rounded p-3 mt-3">
        <p className="font-semibold mb-2">Backward Loop (i = k-1, k-2, ..., k-M):</p>
        <div className="text-sm font-mono space-y-1">
          <div><InlineMath>\rho_i = 1/(y_i^T s_i)</InlineMath></div>
          <div><InlineMath>\alpha_i = \rho_i s_i^T q</InlineMath></div>
          <div><InlineMath>q \leftarrow q - \alpha_i y_i</InlineMath></div>
        </div>
      </div>

      <div className="bg-indigo-50 rounded p-3 mt-3">
        <p className="font-semibold mb-2">Initialize:</p>
        <div className="text-sm">
          <InlineMath>r = H_0^{-1} q</InlineMath>, typically{' '}
          <InlineMath>H_0^{-1} = \gamma I</InlineMath> where{' '}
          <InlineMath>\gamma = s_{k-1}^T y_{k-1} / y_{k-1}^T y_{k-1}</InlineMath>
        </div>
      </div>

      <div className="bg-indigo-50 rounded p-3 mt-3">
        <p className="font-semibold mb-2">Forward Loop (i = k-M, k-M+1, ..., k-1):</p>
        <div className="text-sm font-mono space-y-1">
          <div><InlineMath>\beta = \rho_i y_i^T r</InlineMath></div>
          <div><InlineMath>r \leftarrow r + s_i (\alpha_i - \beta)</InlineMath></div>
        </div>
      </div>

      <p className="mt-3">
        <strong>Result:</strong> <InlineMath>p = r \approx -H^{-1}\nabla f</InlineMath>
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Why It Works</h3>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li>Each (s,y) pair represents one rank-2 update to Hessian approximation</li>
        <li>
          Two-loop recursion applies these updates implicitly without forming{' '}
          <InlineMath>B_k</InlineMath>
        </li>
        <li>
          Mathematically equivalent to full BFGS but O(Mn) instead of O(n²)
        </li>
        <li>Clever matrix algebra exploits structure of BFGS update</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
      <p><strong>Superlinear convergence:</strong></p>
      <BlockMath>\lim_{k \to \infty} \frac{\|e_{k+1}\|}{\|e_k\|} = 0</BlockMath>
      <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
        <li>Faster than linear (GD) but slower than quadratic (Newton)</li>
        <li>Depends on M: larger M → closer to Newton rate</li>
        <li>In practice: M=10 often sufficient for near-Newton performance</li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Save file**

**Step 3: Test in browser**

Expected: Mathematical Derivations section appears (collapsed)

**Step 4: Verify math rendering**

Action: Expand section and check all equations render properly
Expected: Complex equations like BFGS update formula and two-loop recursion display correctly

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): add Mathematical Derivations section"
```

---

## Task 25: Add L-BFGS Advanced Topics

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (L-BFGS section, after Mathematical Derivations)

**Step 1: Add Advanced Topics section**

Add after Mathematical Derivations:

```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="lbfgs-advanced"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Gradient computation:</strong> O(n) to O(n²) depending on problem
        </li>
        <li>
          <strong>Two-loop recursion:</strong> O(Mn) operations
        </li>
        <li>
          <strong>Line search:</strong> multiple gradient evaluations
        </li>
        <li>
          <strong>Total per iteration:</strong> O(Mn) time, O(Mn) memory
        </li>
      </ul>
      <p className="text-sm mt-2 italic">
        <strong>Example:</strong> For n=1000, M=10: ~10,000 operations vs
        ~1 billion for Newton's method
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Memory-Computation Tradeoff</h3>
      <p className="mb-2"><strong>M selection guidelines:</strong></p>
      <ul className="list-disc ml-6 space-y-1">
        <li><strong>M=3-5:</strong> minimal memory, acceptable for well-conditioned problems</li>
        <li><strong>M=5-10:</strong> good balance for most problems (recommended)</li>
        <li><strong>M=10-20:</strong> better approximation, higher cost</li>
        <li><strong>M&gt;50:</strong> rarely beneficial, diminishing returns</li>
      </ul>
      <p className="text-sm mt-2">
        <strong>Problem-dependent:</strong> Ill-conditioned problems benefit from larger M
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Full BFGS vs L-BFGS</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-purple-100">
            <tr>
              <th className="border p-2">Method</th>
              <th className="border p-2">Memory</th>
              <th className="border p-2">Update Cost</th>
              <th className="border p-2">Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2"><strong>BFGS</strong></td>
              <td className="border p-2">O(n²)</td>
              <td className="border p-2">O(n²)</td>
              <td className="border p-2">n &lt; 100</td>
            </tr>
            <tr>
              <td className="border p-2"><strong>L-BFGS</strong></td>
              <td className="border p-2">O(Mn)</td>
              <td className="border p-2">O(Mn)</td>
              <td className="border p-2">n &gt; 100</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Why Two-Loop Recursion is Efficient</h3>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li>
          Avoids forming explicit matrix <InlineMath>B_k</InlineMath> or{' '}
          <InlineMath>B_k^{-1}</InlineMath>
        </li>
        <li>
          Implicit representation via <InlineMath>(s,y)</InlineMath> pairs
        </li>
        <li>Applies rank-2 updates in sequence</li>
        <li>Exploits structure of BFGS update formula (Sherman-Morrison-Woodbury)</li>
        <li>Cache-friendly: sequential access to small vectors</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Relationship to Conjugate Gradient</h3>
      <p className="mb-2">Both use history to improve search directions:</p>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Conjugate Gradient:</strong> uses gradient history to build
          conjugate directions
        </li>
        <li>
          <strong>L-BFGS:</strong> uses <InlineMath>(s,y)</InlineMath> history to
          approximate <InlineMath>H^{-1}</InlineMath>
        </li>
        <li>
          <strong>For quadratics:</strong> CG converges in at most n steps
        </li>
        <li>
          <strong>For non-quadratic:</strong> L-BFGS more robust and practical
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Extensions and Variants</h3>

      <div className="space-y-2 mt-2">
        <div>
          <p className="font-semibold">OWL-QN (Orthant-Wise Limited-memory Quasi-Newton)</p>
          <p className="text-sm ml-4">
            L-BFGS for L1-regularized problems, handles non-smoothness at zero
          </p>
        </div>

        <div>
          <p className="font-semibold">Stochastic L-BFGS</p>
          <p className="text-sm ml-4">
            Mini-batch variants for large datasets, stabilization techniques needed
          </p>
        </div>

        <div>
          <p className="font-semibold">Block L-BFGS</p>
          <p className="text-sm ml-4">
            Exploits problem structure (e.g., layers in neural networks)
          </p>
        </div>

        <div>
          <p className="font-semibold">L-BFGS-B</p>
          <p className="text-sm ml-4">
            Extension to bound-constrained optimization (box constraints)
          </p>
        </div>
      </div>
    </div>

    <div className="bg-purple-100 rounded p-3">
      <p className="font-bold text-sm mb-2">Historical Note</p>
      <p className="text-sm">
        L-BFGS was developed by Jorge Nocedal in 1980. The "L" stands for
        "Limited-memory". It's one of the most widely used optimization algorithms
        in practice, powering everything from machine learning libraries to
        engineering simulation software.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Save file**

**Step 3: Test in browser**

Expected: Advanced Topics section appears (collapsed)

**Step 4: Verify table rendering**

Action: Expand section and check comparison table displays properly
Expected: BFGS vs L-BFGS table shows with proper borders and formatting

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): add Advanced Topics section (Tasks 19-20)"
```

---

## Task 26: Refactor GD Fixed Step to New Structure

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (GD Fixed Step section, around line 760)

**Step 1: Backup existing GD Fixed content**

Action: Read existing GD Fixed Step section content (lines ~760-900)
Note: Save existing section titles and content for reference

**Step 2: Find and update Quick Start section**

Locate existing "What is Gradient Descent?" and "The Algorithm" sections.
Replace with unified Quick Start following Newton/L-BFGS pattern:

```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={true}
  storageKey="gd-fixed-quick-start"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-green-800 mb-2">The Core Idea</h3>
      <p>
        Follow the <strong>gradient downhill</strong>. The gradient{' '}
        <InlineMath>\nabla f(w)</InlineMath> points in the direction of steepest
        increase, so <InlineMath>-\nabla f(w)</InlineMath> points toward steepest
        decrease.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-green-800 mb-2">The Algorithm</h3>
      <ol className="list-decimal ml-6 space-y-1">
        <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
        <li>Scale by step size <InlineMath>\alpha</InlineMath></li>
        <li>Update <InlineMath>w \leftarrow w - \alpha \nabla f(w)</InlineMath></li>
        <li>Repeat until convergence</li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-green-800 mb-2">Key Formula</h3>
      <BlockMath>w_{k+1} = w_k - \alpha \nabla f(w_k)</BlockMath>
      <p className="text-sm mt-2">
        where <InlineMath>\alpha</InlineMath> (alpha) is the <strong>learning rate</strong>
        or step size.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-green-800 mb-2">When to Use</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Simple baseline for any differentiable function</li>
        <li>Educational purposes (understanding optimization)</li>
        <li>When computational cost per iteration must be minimal</li>
        <li>Problems where you can tune <InlineMath>\alpha</InlineMath> effectively</li>
      </ul>
    </div>

    <div className="bg-green-100 rounded p-3">
      <p className="font-bold text-sm">Key Challenge:</p>
      <p className="text-sm">
        Choosing <InlineMath>\alpha</InlineMath> is critical. Too large → divergence.
        Too small → slow convergence. This is why line search methods exist
        (see Gradient Descent with Line Search tab).
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 3: Keep or update Visual Guide**

Verify existing "What You're Seeing" section exists and is properly formatted.
If needed, update to match new pattern with CollapsibleSection wrapper.

**Step 4: Add/Update Try This experiments section**

Add after Visual Guide:

```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={true}
  storageKey="gd-fixed-try-this"
>
  <div className="space-y-3">
    <p className="text-gray-800 mb-4">
      Experiment with different step sizes to see success and failure modes:
    </p>

    <div className="space-y-3">
      <div className="border border-green-200 rounded p-3 bg-green-50">
        <div className="flex items-start gap-2">
          <button className="text-green-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-green-900">Success: Good Step Size (α=0.1)</p>
            <p className="text-sm text-gray-700">
              Well-chosen α leads to smooth convergence
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Steady loss decrease, smooth trajectory
            </p>
          </div>
        </div>
      </div>

      <div className="border border-red-200 rounded p-3 bg-red-50">
        <div className="flex items-start gap-2">
          <button className="text-red-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-red-900">Failure: Too Large (α=0.8)</p>
            <p className="text-sm text-gray-700">
              Step size causes oscillation and divergence
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Loss increases, trajectory bounces around
            </p>
          </div>
        </div>
      </div>

      <div className="border border-orange-200 rounded p-3 bg-orange-50">
        <div className="flex items-start gap-2">
          <button className="text-orange-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-orange-900">Failure: Too Small (α=0.001)</p>
            <p className="text-sm text-gray-700">
              Tiny steps lead to extremely slow convergence
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Barely moves, would need thousands of iterations
            </p>
          </div>
        </div>
      </div>

      <div className="border border-purple-200 rounded p-3 bg-purple-50">
        <div className="flex items-start gap-2">
          <button className="text-purple-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-purple-900">Struggle: Ill-Conditioned</p>
            <p className="text-sm text-gray-700">
              Elongated landscape causes zig-zagging
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Perpendicular steps to contours, slow progress
            </p>
          </div>
        </div>
      </div>
    </div>

    <p className="text-xs text-gray-500 mt-4">
      Note: One-click experiment loading coming soon!
    </p>
  </div>
</CollapsibleSection>
```

**Step 5: Add When Things Go Wrong section**

Add new section after Try This:

```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="gd-fixed-when-wrong"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

      <div className="space-y-3">
        <div>
          <p className="font-semibold">❌ "The gradient points to the minimum"</p>
          <p className="text-sm ml-6">
            ✓ The gradient points toward steepest <strong>increase</strong><br/>
            ✓ We follow <InlineMath>-\nabla f</InlineMath> (negative gradient) downhill<br/>
            ✓ This is the direction of steepest <strong>decrease</strong>, not necessarily toward minimum
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "Gradient descent always converges"</p>
          <p className="text-sm ml-6">
            ✓ Only with proper step size <InlineMath>\alpha</InlineMath><br/>
            ✓ Can diverge if <InlineMath>\alpha</InlineMath> too large<br/>
            ✓ Can get stuck in local minima on non-convex functions
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "Just pick α=0.01 and it'll work"</p>
          <p className="text-sm ml-6">
            ✓ Optimal <InlineMath>\alpha</InlineMath> depends on problem scaling<br/>
            ✓ May be too large for some problems, too small for others<br/>
            ✓ Line search methods (next tab) solve this automatically
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
      <ul className="space-y-2">
        <li>
          <strong>Strongly convex:</strong> Linear convergence to global minimum
          (guaranteed with proper <InlineMath>\alpha</InlineMath>)
        </li>
        <li>
          <strong>Convex:</strong> Converges to global minimum (possibly slowly)
        </li>
        <li>
          <strong>Non-convex:</strong> May get stuck in local minima or saddle points
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-yellow-800 mb-2">Choosing Step Size α</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Rule of thumb:</strong></p>
        <BlockMath>0 &lt; \alpha &lt; \frac{2}{L}</BlockMath>
        <p>
          where L is the Lipschitz constant of <InlineMath>\nabla f</InlineMath> (smoothness).
        </p>
        <p className="mt-2">
          <strong>Practical approach:</strong> Try <InlineMath>\alpha = 0.1</InlineMath>,
          then adjust based on behavior (increase if too slow, decrease if diverging).
        </p>
        <p className="mt-2">
          <strong>Better approach:</strong> Use line search (next tab) to avoid manual tuning.
        </p>
      </div>
    </div>
  </div>
</CollapsibleSection>
```

**Step 6: Update Mathematical Derivations section**

Find existing "The Mathematics" section and update to collapsed by default:

```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="gd-fixed-math-derivations"
>
  {/* Keep existing mathematical content but ensure it uses KaTeX */}
  {/* Update any Unicode math symbols to proper KaTeX notation */}
</CollapsibleSection>
```

**Step 7: Add Advanced Topics section**

Add new section at end of GD Fixed content:

```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="gd-fixed-advanced"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Momentum Methods</h3>
      <p>Add momentum to accelerate convergence:</p>
      <BlockMath>v_{k+1} = \beta v_k - \alpha \nabla f(w_k)</BlockMath>
      <BlockMath>w_{k+1} = w_k + v_{k+1}</BlockMath>
      <p className="text-sm mt-2">
        Typical <InlineMath>\beta = 0.9</InlineMath>. Momentum accumulates
        velocity in consistent directions, damping oscillations.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Nesterov Acceleration</h3>
      <p>"Look ahead" before computing gradient:</p>
      <BlockMath>w_{k+1} = w_k - \alpha \nabla f(w_k + \beta v_k) + \beta v_k</BlockMath>
      <p className="text-sm mt-2">
        Provably optimal convergence rate for smooth convex functions.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Adaptive Methods Preview</h3>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li>
          <strong>AdaGrad:</strong> Adapts learning rate per parameter based on
          historical gradients
        </li>
        <li>
          <strong>RMSprop:</strong> Uses moving average of squared gradients
        </li>
        <li>
          <strong>Adam:</strong> Combines momentum and adaptive learning rates
          (most popular in deep learning)
        </li>
      </ul>
      <p className="text-sm mt-2">
        These methods automatically tune step sizes, reducing manual tuning burden.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li><strong>Per iteration:</strong> O(n) for gradient computation</li>
        <li><strong>Memory:</strong> O(n) to store parameters</li>
        <li><strong>Total cost:</strong> depends on # iterations to converge</li>
      </ul>
      <p className="text-sm mt-2 italic">
        Simple and cheap per iteration, but may require many iterations.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 8: Save file**

**Step 9: Test in browser**

Run: `npm run dev`
Expected: GD Fixed Step tab shows new structure with all sections

**Step 10: Verify section order and expansion states**

Action: Check default expanded vs collapsed states match design
Expected:
- Quick Start: expanded
- Visual Guide: expanded
- Try This: expanded
- When Things Go Wrong: collapsed
- Mathematical Derivations: collapsed
- Advanced Topics: collapsed

**Step 11: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor(gd-fixed): update to unified pedagogical structure"
```

---

## Task 27: Refactor GD Line Search to New Structure

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (GD Line Search section, around line 1100)

**Step 1: Update Quick Start section**

Find GD Line Search section and update Quick Start to match pattern:

```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={true}
  storageKey="gd-ls-quick-start"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-teal-800 mb-2">The Core Idea</h3>
      <p>
        Instead of using a fixed step size <InlineMath>\alpha</InlineMath>, automatically
        search for a good step size at each iteration. This makes the algorithm
        <strong> robust and efficient</strong> across different problems.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-teal-800 mb-2">The Algorithm</h3>
      <ol className="list-decimal ml-6 space-y-1">
        <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
        <li>Set search direction <InlineMath>p = -\nabla f(w)</InlineMath></li>
        <li>
          <strong>Line search:</strong> find step size <InlineMath>\alpha</InlineMath> that
          decreases loss sufficiently
        </li>
        <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
        <li>Repeat until convergence</li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-teal-800 mb-2">Key Advantage</h3>
      <p>
        <strong>No manual tuning</strong> of step size needed. The line search
        automatically adapts to:
      </p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Problem scaling and curvature</li>
        <li>Changes in landscape across iterations</li>
        <li>Different regions of parameter space</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-teal-800 mb-2">When to Use</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>When you want robust optimization without tuning</li>
        <li>Problems with varying curvature</li>
        <li>When step size selection is difficult</li>
        <li>Production systems where reliability matters</li>
      </ul>
    </div>

    <div className="bg-teal-100 rounded p-3">
      <p className="font-bold text-sm">Tradeoff:</p>
      <p className="text-sm">
        Each iteration costs more (multiple gradient evaluations for line search),
        but fewer total iterations needed. Usually worth it for reliable convergence.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Keep Visual Guide section**

Verify existing Visual Guide section exists and is properly structured.

**Step 3: Update Line Search Details section**

This should become a two-subsection structure (algorithm-specific + pluggable):

```tsx
<CollapsibleSection
  title="Line Search Details"
  defaultExpanded={true}
  storageKey="gd-ls-line-search-details"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-teal-800 mb-2">Why Line Search for Gradient Descent</h3>
      <p>
        Fixed step size <InlineMath>\alpha</InlineMath> fails when landscape has
        varying curvature:
      </p>
      <ul className="list-disc ml-6 space-y-1 mt-2">
        <li>
          <strong>Steep regions:</strong> need small <InlineMath>\alpha</InlineMath> to
          avoid overshooting
        </li>
        <li>
          <strong>Flat regions:</strong> can use large <InlineMath>\alpha</InlineMath> for
          faster progress
        </li>
        <li>
          <strong>Curvature changes:</strong> optimal <InlineMath>\alpha</InlineMath> varies
          across iterations
        </li>
      </ul>
      <p className="text-sm mt-2">
        <strong>Line search adapts automatically,</strong> making gradient descent both
        robust and efficient.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-teal-800 mb-2">Current Method: Armijo Backtracking</h3>
      <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
      <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
      <p className="text-sm mt-2">
        Where <InlineMath>c_1 = </InlineMath>{gdLSC1.toFixed(4)} controls how much
        decrease we require.
      </p>

      <div className="mt-3">
        <p className="font-semibold">Backtracking Algorithm:</p>
        <ol className="list-decimal ml-6 space-y-1 text-sm">
          <li>
            Start with <InlineMath>\alpha = 1</InlineMath> (or previous iteration's value)
          </li>
          <li>Check if Armijo condition satisfied</li>
          <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
          <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
        </ol>
      </div>

      <div className="mt-3 bg-teal-50 rounded p-3">
        <p className="font-semibold text-sm mb-2">Understanding c₁:</p>
        <ul className="text-sm list-disc ml-6">
          <li>
            <strong>c₁ too small</strong> (e.g., 0.00001): accepts poor steps, wastes iterations
          </li>
          <li>
            <strong>c₁ good</strong> (e.g., 0.0001): balances quality and efficiency
          </li>
          <li>
            <strong>c₁ too large</strong> (e.g., 0.5): too conservative, tiny steps
          </li>
        </ul>
      </div>
    </div>

    <div className="bg-blue-100 rounded p-3">
      <p className="font-bold text-sm mb-2">Other Line Search Methods</p>
      <p className="text-sm">
        <strong>Wolfe conditions:</strong> Add curvature condition for better theoretical properties<br/>
        <strong>Goldstein conditions:</strong> Alternative sufficient decrease criterion<br/>
        <strong>Exact line search:</strong> Minimize along line (expensive, rarely used)
      </p>
      <p className="text-xs mt-2 italic">
        Armijo backtracking is simple, fast, and works well in practice.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 4: Add Try This experiments section**

```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={true}
  storageKey="gd-ls-try-this"
>
  <div className="space-y-3">
    <p className="text-gray-800 mb-4">
      See how line search automatically adapts to different situations:
    </p>

    <div className="space-y-3">
      <div className="border border-teal-200 rounded p-3 bg-teal-50">
        <div className="flex items-start gap-2">
          <button className="text-teal-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-teal-900">Success: Automatic Adaptation</p>
            <p className="text-sm text-gray-700">
              Line search finds good steps without manual tuning
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Step size varies, always makes progress
            </p>
          </div>
        </div>
      </div>

      <div className="border border-blue-200 rounded p-3 bg-blue-50">
        <div className="flex items-start gap-2">
          <button className="text-blue-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-blue-900">Compare: Fixed vs Adaptive</p>
            <p className="text-sm text-gray-700">
              Same problem with fixed α vs line search
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Line search more robust and efficient
            </p>
          </div>
        </div>
      </div>

      <div className="border border-orange-200 rounded p-3 bg-orange-50">
        <div className="flex items-start gap-2">
          <button className="text-orange-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-orange-900">Failure: c₁ Too Small</p>
            <p className="text-sm text-gray-700">
              c₁=0.00001 accepts poor steps, slow convergence
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Many backtracking steps, minimal progress
            </p>
          </div>
        </div>
      </div>

      <div className="border border-red-200 rounded p-3 bg-red-50">
        <div className="flex items-start gap-2">
          <button className="text-red-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-red-900">Failure: c₁ Too Large</p>
            <p className="text-sm text-gray-700">
              c₁=0.5 is too conservative, rejects good steps
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Tiny steps, very slow progress
            </p>
          </div>
        </div>
      </div>

      <div className="border border-purple-200 rounded p-3 bg-purple-50">
        <div className="flex items-start gap-2">
          <button className="text-purple-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-purple-900">Advantage: Varying Curvature</p>
            <p className="text-sm text-gray-700">
              Landscape with dramatic curvature changes (Rosenbrock)
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Adapts to narrow valley where fixed α fails
            </p>
          </div>
        </div>
      </div>
    </div>

    <p className="text-xs text-gray-500 mt-4">
      Note: One-click experiment loading coming soon!
    </p>
  </div>
</CollapsibleSection>
```

**Step 5: Add When Things Go Wrong section**

```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="gd-ls-when-wrong"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

      <div className="space-y-3">
        <div>
          <p className="font-semibold">❌ "Line search is always better than fixed step"</p>
          <p className="text-sm ml-6">
            ✓ Costs more per iteration (multiple gradient evaluations)<br/>
            ✓ For very cheap gradients, fixed step may be faster overall<br/>
            ✓ Tradeoff: fewer iterations vs cost per iteration
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "Line search guarantees fast convergence"</p>
          <p className="text-sm ml-6">
            ✓ Still subject to problem conditioning<br/>
            ✓ Gradient descent is fundamentally first-order (doesn't use curvature)<br/>
            ✓ Newton or L-BFGS will be faster for well-conditioned problems
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "Any line search condition works"</p>
          <p className="text-sm ml-6">
            ✓ Armijo alone doesn't prevent arbitrarily small steps<br/>
            ✓ Wolfe conditions (Armijo + curvature) have better theory<br/>
            ✓ In practice, Armijo backtracking works well for most problems
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
      <p className="mb-2">Same as fixed step gradient descent:</p>
      <ul className="space-y-2">
        <li>
          <strong>Strongly convex:</strong> Linear convergence, line search improves constant
        </li>
        <li>
          <strong>Convex:</strong> Converges to global minimum
        </li>
        <li>
          <strong>Non-convex:</strong> May converge to local minima, line search helps stability
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Too many backtracking steps</strong> → c₁ too large, decrease it
        </li>
        <li>
          <strong>Slow progress</strong> → c₁ too small, increase it (or use better algorithm)
        </li>
        <li>
          <strong>Still diverging</strong> → gradient computation bug, check implementation
        </li>
        <li>
          <strong>Expensive per iteration</strong> → gradient evaluation is costly,
          consider limited memory methods
        </li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 6: Update Mathematical Derivations section**

Update existing math section to collapsed by default with KaTeX:

```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="gd-ls-math-derivations"
>
  <div className="space-y-4 text-gray-800">
    {/* Keep existing content but update to KaTeX */}

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Armijo Condition Proof</h3>
      <p>The Armijo condition ensures sufficient decrease:</p>
      <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
      <p className="text-sm mt-2">
        For descent direction <InlineMath>p = -\nabla f</InlineMath>, we have{' '}
        <InlineMath>\nabla f^T p &lt; 0</InlineMath>, so the right side decreases
        with <InlineMath>\alpha</InlineMath>.
      </p>
      <p className="text-sm mt-2">
        <strong>Guarantees:</strong> Backtracking terminates in finite steps (by Taylor expansion).
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Descent Lemma</h3>
      <p>For L-smooth functions:</p>
      <BlockMath>
        f(w + \alpha p) \leq f(w) + \alpha \nabla f^T p + \frac{L\alpha^2}{2}\|p\|^2
      </BlockMath>
      <p className="text-sm mt-2">
        This bounds how much f can increase along direction p, guaranteeing
        backtracking finds acceptable step.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 7: Add Advanced Topics section**

```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="gd-ls-advanced"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Wolfe Conditions</h3>
      <p>Stronger than Armijo, adds curvature condition:</p>
      <div className="mt-2">
        <p className="font-semibold text-sm">1. Sufficient decrease (Armijo):</p>
        <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
      </div>
      <div className="mt-2">
        <p className="font-semibold text-sm">2. Curvature condition:</p>
        <BlockMath>\nabla f(w + \alpha p)^T p \geq c_2 \nabla f^T p</BlockMath>
      </div>
      <p className="text-sm mt-2">
        Typical: <InlineMath>c_1 = 0.0001</InlineMath>, <InlineMath>c_2 = 0.9</InlineMath>.
        Ensures step isn't too small.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Strong Wolfe Conditions</h3>
      <p>Replace curvature condition with:</p>
      <BlockMath>|\nabla f(w + \alpha p)^T p| \leq c_2 |\nabla f^T p|</BlockMath>
      <p className="text-sm mt-2">
        Prevents steps where curvature increases too much.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Goldstein Conditions</h3>
      <p>Alternative to Armijo with upper and lower bounds:</p>
      <BlockMath>
        f(w) + (1-c)\alpha \nabla f^T p \leq f(w + \alpha p) \leq f(w) + c\alpha \nabla f^T p
      </BlockMath>
      <p className="text-sm mt-2">
        Less commonly used than Wolfe conditions.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Line Search Method Comparison</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-purple-100">
            <tr>
              <th className="border p-2">Method</th>
              <th className="border p-2">Cost</th>
              <th className="border p-2">Theory</th>
              <th className="border p-2">Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2"><strong>Armijo</strong></td>
              <td className="border p-2">Low</td>
              <td className="border p-2">Good</td>
              <td className="border p-2">General purpose</td>
            </tr>
            <tr>
              <td className="border p-2"><strong>Wolfe</strong></td>
              <td className="border p-2">Medium</td>
              <td className="border p-2">Better</td>
              <td className="border p-2">Quasi-Newton methods</td>
            </tr>
            <tr>
              <td className="border p-2"><strong>Strong Wolfe</strong></td>
              <td className="border p-2">Medium</td>
              <td className="border p-2">Best</td>
              <td className="border p-2">BFGS, L-BFGS</td>
            </tr>
            <tr>
              <td className="border p-2"><strong>Exact</strong></td>
              <td className="border p-2">Very high</td>
              <td className="border p-2">Optimal</td>
              <td className="border p-2">Rarely practical</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Cost Analysis</h3>
      <p className="mb-2"><strong>Per iteration cost:</strong></p>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li>Fixed step: 1 gradient evaluation</li>
        <li>Armijo backtracking: 1-10 gradient evaluations (average ~2-3)</li>
        <li>Wolfe conditions: 2-15 gradient evaluations</li>
      </ul>
      <p className="text-sm mt-2">
        <strong>Total cost:</strong> Line search usually wins by reducing total iterations.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 8: Save file**

**Step 9: Test in browser**

Run: `npm run dev`
Expected: GD Line Search tab shows new unified structure

**Step 10: Verify all sections**

Action: Navigate through all sections, check expansion states
Expected: Quick Start, Visual Guide, Line Search Details, Try This expanded; rest collapsed

**Step 11: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor(gd-linesearch): update to unified pedagogical structure with pluggable line search"
```

---

## Task 28: Verify and Test Complete Implementation

**Files:**
- Review: All modified files
- Test: Full application

**Step 1: Build the application**

Run: `npm run build`
Expected: Build succeeds without errors or warnings

**Step 2: Check for TypeScript errors**

Run: `npm run type-check` (if available) or check VS Code for errors
Expected: No type errors

**Step 3: Test all algorithm tabs**

Action: Open each tab (GD Fixed, GD Line Search, Newton, L-BFGS)
Expected: All sections render correctly with proper math

**Step 4: Test CollapsibleSection behavior**

Action: Click to expand/collapse each section
Expected: State persists, animations smooth

**Step 5: Test Math component rendering**

Action: Check inline and block math across all tabs
Expected: All equations render properly with KaTeX

**Step 6: Check for console errors**

Action: Open browser console, navigate tabs
Expected: No errors or warnings

**Step 7: Test responsive layout**

Action: Resize browser window
Expected: Content remains readable, no overflow

**Step 8: Verify experiment placeholders**

Action: Check "Try This" sections in all tabs
Expected: All experiment cards display with proper styling

**Step 9: Document any issues**

Action: Note any bugs or improvements needed
Expected: Create list for future work

**Step 10: Commit if fixes made**

```bash
git add .
git commit -m "fix: resolve issues found in testing"
```

---

## Task 29: Final Documentation and Wrap-up

**Files:**
- Create: `docs/plans/2025-11-05-pedagogical-content-completion-notes.md`

**Step 1: Document completed work**

Create completion notes:

```markdown
# Pedagogical Content Enhancement - Completion Notes

**Date:** 2025-11-05
**Status:** Complete (Tasks 1-29)

## Summary

All four algorithm tabs now follow the unified dual-track pedagogical structure:
- Quick Start (expanded) - intuitive understanding
- Visual Guide (expanded) - interpreting visualizations
- Line Search Details (Newton/L-BFGS expanded, GD-LS expanded) - pluggable component
- Try This (expanded) - experiment placeholders
- When Things Go Wrong (collapsed) - misconceptions and troubleshooting
- Mathematical Derivations (collapsed) - rigorous foundations
- Advanced Topics (collapsed) - deep dives

## Implemented

✅ KaTeX integration for mathematical rendering
✅ Experiment preset type system
✅ Problem definitions (Quadratic, Ill-conditioned, Rosenbrock)
✅ Experiment presets for all four algorithms
✅ Complete Newton's Method pedagogical content (7 sections)
✅ Complete L-BFGS pedagogical content (7 sections)
✅ Refactored GD Fixed Step to new structure
✅ Refactored GD Line Search with pluggable line search pattern

## Next Steps (Future Work)

1. **Wire up experiment buttons** - Connect ▶ buttons to load presets
2. **Add problem switcher UI** - Allow users to change problems
3. **Implement experiment loading** - Hook up preset system to state
4. **Add more problems** - Neural network loss, constrained optimization
5. **Server-side KaTeX** (if simple) - Eliminate FOUC
6. **Additional line search methods** - Wolfe, Strong Wolfe as alternatives
7. **Side-by-side comparison** - View multiple algorithms simultaneously

## Files Modified

- src/components/Math.tsx (created)
- src/types/experiments.ts (created)
- src/problems/quadratic.ts (created)
- src/problems/rosenbrock.ts (created)
- src/problems/index.ts (created)
- src/experiments/newton-presets.ts (created)
- src/experiments/lbfgs-presets.ts (created)
- src/experiments/gd-fixed-presets.ts (created)
- src/experiments/gd-linesearch-presets.ts (created)
- src/experiments/index.ts (created)
- src/UnifiedVisualizer.tsx (extensively modified - all 4 tabs)
- package.json (KaTeX dependency added)

## Commits

Total: 29 commits (one per task)
Pattern: `feat/refactor(component): description`
```

**Step 2: Save documentation**

**Step 3: Review git log**

Run: `git log --oneline -29`
Expected: See all 29 commits for tasks

**Step 4: Check git status**

Run: `git status`
Expected: Working tree clean

**Step 5: Create summary commit if needed**

If any documentation changes:
```bash
git add docs/
git commit -m "docs: add pedagogical content completion notes"
```

**Step 6: Push to remote (if applicable)**

```bash
git push origin HEAD
```

**Step 7: Announce completion**

Report to user:
- All 29 tasks completed (Tasks 21-29)
- Link to completion notes
- Summary of what was built
- List of future work
- Ready for experiment wiring (next phase)

---

## Execution Options

Plan complete and saved to `docs/plans/2025-11-05-pedagogical-content-tasks-21-29.md`.

**Two execution options:**

**1. Subagent-Driven Development (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration with quality gates

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with review checkpoints

**Which approach?**
