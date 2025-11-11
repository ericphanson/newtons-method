
I'd like citations with specific page numbers, and I'd like us to ensnure they are accurate by actually checking those page numbers. So I think we need a system where I can put PDFs in a directory and we can actually read them and cite them. We need to think about how to do it that is respectful of our agents limited context window. Because to me it's 100% critical that our cites are specific and accurate so I really want to be able to back them up from the actual source material. We may not be able to distribute the source material though, so i might gitignore the directory.
Excellent point about accuracy and verifiability. Let me propose a practical system that respects context limits while ensuring 100% citation accuracy:
Proposed System: Verified Citation Registry
Structure
/docs/
  /references/           # Gitignored - your PDFs go here
  citations.json         # Checked in - verified citation registry

/scripts/
  add-citation.ts        # Interactive tool to add verified citations
  verify-citations.ts    # Re-verify existing citations
Citation Registry Format (docs/citations.json)
{
  "sources": {
    "nocedal-2006": {
      "authors": ["Nocedal, J.", "Wright, S."],
      "year": 2006,
      "title": "Numerical Optimization",
      "edition": "2nd",
      "publisher": "Springer",
      "file": "nocedal-wright-2006.pdf"
    }
  },
  "citations": {
    "gd-convergence-strongly-convex": {
      "source": "nocedal-2006",
      "page": 27,
      "section": "3.2",
      "quote": "For strongly convex functions with Lipschitz continuous gradients, gradient descent with appropriate step size achieves linear convergence to the global minimum.",
      "claim": "Linear convergence rate for gradient descent on strongly convex smooth functions",
      "verified": "2025-01-11",
      "usedIn": ["GdFixedTab"]
    }
  }
}
Usage in Components
import { Citation } from '../components/Citation';

<p>
  Linear convergence for strongly convex functions
  <Citation citationKey="gd-convergence-strongly-convex" />
</p>
// Renders: ... functions[1]
// Hover shows: Nocedal & Wright (2006), p. 27
Workflow
1. Adding a New Citation (Agent-Assisted)
npm run add-citation "Linear convergence for gradient descent on strongly convex functions"
The script would:
Ask which PDF to search (lists files in /docs/references/)
Use an agent to search the PDF for the claim
Extract relevant passages with page numbers
Show you candidates (with actual quotes)
You select the correct one
Adds to citations.json with verification date
2. In Code
<Citation citationKey="gd-convergence-strongly-convex" />
3. Verification
npm run verify-citations
Re-checks all citations against PDFs to ensure page numbers are still correct.
Key Benefits
Context-Efficient: Agent only loads specific pages, not entire PDFs
Verifiable: Every citation includes actual quote from the page
Git-Friendly: PDFs gitignored, verified registry checked in
Incremental: Add citations as needed, one claim at a time
Reviewable: You see exact quotes before committing
Maintainable: Can re-verify if PDFs update
Example Citation Component
// src/components/Citation.tsx
export function Citation({ citationKey }: { citationKey: string }) {
  const citation = citations[citationKey];
  const source = sources[citation.source];
  
  return (
    <sup>
      <a 
        href="#references" 
        className="text-blue-600"
        title={`${source.authors.join(', ')} (${source.year}), p. ${citation.page}`}
      >
        [{getCitationNumber(citationKey)}]
      </a>
    </sup>
  );
}
References Section
<CollapsibleSection title="References" defaultExpanded={false}>
  <ol className="text-sm space-y-2">
    {Object.entries(citations).map(([key, cite]) => {
      const src = sources[cite.source];
      return (
        <li key={key} id={`ref-${key}`}>
          {src.authors.join(', ')} ({src.year}). <em>{src.title}</em>
          {src.edition && ` (${src.edition})`}. {src.publisher}, p. {cite.page}.
        </li>
      );
    })}
  </ol>
</CollapsibleSection>
