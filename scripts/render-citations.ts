#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface Reference {
  title: string;
  authors: string[];
  year: number;
  edition?: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  file?: string;
  pageOffset?: number;  // PDF page - book page
}

interface FormulaImage {
  formula_id: string;
  metadata_path: string;
  image_path: string;
  latex: string;
  verified: boolean;
  theorem: string;
  equation: string;
  issues?: string[];
}

interface Citation {
  reference: string;
  pages: string;  // Book page numbers (user-facing)
  pdfPages?: string;  // PDF page numbers (for extraction)
  theorem?: string;
  claim: string;
  quote: string;
  notes?: string;
  readerNotes?: string;
  proofPages?: string[];
  formulaImages?: FormulaImage[];
  verified?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  usedIn?: string[];
}

interface CitationsData {
  references: Record<string, Reference>;
  citations: Record<string, Citation>;
}

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(', ')}, and ${authors[authors.length - 1]}`;
}

function formatReference(ref: Reference): string {
  const authors = formatAuthors(ref.authors);
  let formatted = `${authors}. `;

  if (ref.edition) {
    formatted += `*${ref.title}* (${ref.edition} edition). `;
  } else {
    formatted += `*${ref.title}*. `;
  }

  if (ref.journal) {
    formatted += `${ref.journal}`;
    if (ref.volume) formatted += `, ${ref.volume}`;
    if (ref.pages) formatted += `:${ref.pages}`;
    formatted += `, ${ref.year}.`;
  } else if (ref.publisher) {
    formatted += `${ref.publisher}, ${ref.year}.`;
  } else {
    formatted += `${ref.year}.`;
  }

  return formatted;
}

function renderCitation(citationId: string, citation: Citation, references: Record<string, Reference>): string {
  const ref = references[citation.reference];
  if (!ref) {
    console.error(`Warning: Reference '${citation.reference}' not found for citation '${citationId}'`);
  }

  let md = `# ${citationId}\n\n`;

  // Add reference information
  if (ref) {
    md += `## Reference\n\n`;
    md += `${formatReference(ref)}\n\n`;

    if (ref.file) {
      md += `**File:** \`${ref.file}\`\n\n`;
    }
  }

  // Add the claim
  md += `## Claim\n\n`;
  md += `${citation.claim}\n\n`;

  // Add the quote
  md += `## Quote\n\n`;
  md += `> ${citation.quote}\n\n`;

  // Add pages and theorem info after quote
  md += `**Pages:** ${citation.pages}\n\n`;

  if (citation.theorem) {
    md += `**Theorem/Result:** ${citation.theorem}\n\n`;
  }

  // Add formula images section (extracted formulas with crops)
  if (citation.formulaImages && citation.formulaImages.length > 0) {
    md += `## Extracted Formulas\n\n`;
    md += `*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*\n\n`;

    citation.formulaImages.forEach((formulaImg, index) => {
      const num = index + 1;
      md += `### Formula ${num}${formulaImg.theorem ? ` - ${formulaImg.theorem}` : ''}${formulaImg.equation ? ` ${formulaImg.equation}` : ''}\n\n`;

      // Convert paths to relative from renders directory
      const relativeImagePath = path.relative(
        path.join(process.cwd(), 'docs/references/renders'),
        path.join(process.cwd(), formulaImg.image_path)
      );

      const relativeMetadataPath = path.relative(
        path.join(process.cwd(), 'docs/references/renders'),
        path.join(process.cwd(), formulaImg.metadata_path)
      );

      // Show cropped formula image
      md += `**Cropped Formula Image:**\n\n`;
      md += `![${formulaImg.formula_id}](${relativeImagePath})\n\n`;

      // Show extracted LaTeX (rendered as math)
      md += `**Extracted LaTeX:**\n\n`;
      md += `$$\n${formulaImg.latex}\n$$\n\n`;

      // Show raw LaTeX source
      md += `<details>\n<summary>LaTeX Source</summary>\n\n`;
      md += `\`\`\`latex\n${formulaImg.latex}\n\`\`\`\n\n`;
      md += `</details>\n\n`;

      // Show verification status
      md += `**Verification:** ${formulaImg.verified ? '✅ Verified' : '❌ Not Verified'}\n\n`;

      // Show any issues
      if (formulaImg.issues && formulaImg.issues.length > 0) {
        md += `**Issues Found:**\n\n`;
        formulaImg.issues.forEach(issue => {
          md += `- ${issue}\n`;
        });
        md += `\n`;
      }

      // Link to metadata
      md += `**Metadata:** [${formulaImg.formula_id}.json](${relativeMetadataPath})\n\n`;
      md += `---\n\n`;
    });
  }

  // Add reader notes if available
  if (citation.readerNotes) {
    md += `## Reader Notes\n\n`;
    md += `${citation.readerNotes}\n\n`;
  }

  // Add internal notes if available
  if (citation.notes) {
    md += `## Internal Notes\n\n`;
    md += `${citation.notes}\n\n`;
  }

  // Add verification information
  if (citation.verified) {
    md += `## Verification\n\n`;
    md += `**Verified:** ${citation.verified}\n\n`;

    if (citation.verifiedBy) {
      md += `**Verified By:** ${citation.verifiedBy}\n\n`;
    }

    if (citation.verificationNotes) {
      md += `**Verification Notes:** ${citation.verificationNotes}\n\n`;
    }
  }

  // Add usage information
  if (citation.usedIn && citation.usedIn.length > 0) {
    md += `## Used In\n\n`;
    citation.usedIn.forEach(component => {
      md += `- ${component}\n`;
    });
    md += `\n`;
  }

  // Add proof pages as inline images
  if (citation.proofPages && citation.proofPages.length > 0) {
    md += `## Proof Pages\n\n`;
    citation.proofPages.forEach((pagePath, index) => {
      // Convert to relative path from the renders directory
      const relativePath = path.relative(
        path.join(process.cwd(), 'docs/references/renders'),
        path.join(process.cwd(), pagePath)
      );

      const pageNumber = index + 1;
      md += `### Page ${pageNumber}\n\n`;
      md += `![Proof page ${pageNumber}](${relativePath})\n\n`;
    });
  }

  return md;
}

function main() {
  const referencesPath = path.join(process.cwd(), 'docs/references.json');
  const citationsDir = path.join(process.cwd(), 'docs/citations');
  const outputDir = path.join(process.cwd(), 'docs/references/renders');

  // Read references file
  console.log(`Reading references from ${referencesPath}...`);
  const references: Record<string, Reference> = JSON.parse(fs.readFileSync(referencesPath, 'utf-8'));

  // Read all citation files
  console.log(`Reading citations from ${citationsDir}...`);
  const citations: Record<string, Citation> = {};
  const citationFiles = fs.readdirSync(citationsDir).filter(f => f.endsWith('.json'));

  for (const file of citationFiles) {
    const citationKey = file.replace('.json', '');
    const filePath = path.join(citationsDir, file);
    citations[citationKey] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const data: CitationsData = { references, citations };

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process each citation
  const citationIds = Object.keys(data.citations);
  console.log(`\nProcessing ${citationIds.length} citations...\n`);

  citationIds.forEach((citationId) => {
    const citation = data.citations[citationId];
    const markdown = renderCitation(citationId, citation, data.references);

    const outputPath = path.join(outputDir, `${citationId}.md`);
    fs.writeFileSync(outputPath, markdown, 'utf-8');

    console.log(`✓ Generated: ${citationId}.md`);
  });

  console.log(`\nSuccessfully rendered ${citationIds.length} citations to ${outputDir}`);
}

main();
