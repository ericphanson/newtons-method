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
}

interface Citation {
  reference: string;
  pages: string;
  theorem?: string;
  claim: string;
  quote: string;
  notes?: string;
  readerNotes?: string;
  proofPages?: string[];
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
  const citationsPath = path.join(process.cwd(), 'docs/citations.json');
  const outputDir = path.join(process.cwd(), 'docs/references/renders');

  // Read citations file
  console.log(`Reading citations from ${citationsPath}...`);
  const data: CitationsData = JSON.parse(fs.readFileSync(citationsPath, 'utf-8'));

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
