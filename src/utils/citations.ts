import citationsData from '../../docs/citations.json';

export interface Reference {
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

export interface Citation {
  reference: string;
  pages?: string;
  theorem?: string;
  claim: string;
  quote?: string;
  notes?: string;
  proofPages?: string[];
  verified?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  needsReview?: boolean;
  usedIn?: string[];
}

export interface CitationsData {
  references: Record<string, Reference>;
  citations: Record<string, Citation>;
}

// Load citations data
export const citations: CitationsData = citationsData as CitationsData;

// Get a specific citation
export function getCitation(key: string): Citation | undefined {
  return citations.citations[key];
}

// Get a specific reference
export function getReference(key: string): Reference | undefined {
  return citations.references[key];
}

// Get full citation info (citation + reference)
export function getFullCitation(citationKey: string): {
  citation: Citation;
  reference: Reference;
} | undefined {
  const citation = getCitation(citationKey);
  if (!citation) return undefined;

  const reference = getReference(citation.reference);
  if (!reference) return undefined;

  return { citation, reference };
}

// Format authors for display (e.g., "Nocedal & Wright" or "Nocedal et al.")
export function formatAuthors(authors: string[], style: 'short' | 'full' = 'short'): string {
  if (style === 'full') {
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    return authors.slice(0, -1).join(', ') + ', and ' + authors[authors.length - 1];
  }

  // Short style
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors[0]} et al.`;
}

// Get citation number (1-indexed order in citations object)
export function getCitationNumber(citationKey: string): number {
  const keys = Object.keys(citations.citations);
  return keys.indexOf(citationKey) + 1;
}

// Format a reference in APA-like style
export function formatReference(reference: Reference): string {
  const authors = formatAuthors(reference.authors, 'full');
  let formatted = `${authors} (${reference.year}). ${reference.title}`;

  if (reference.edition) {
    formatted += ` (${reference.edition} ed.)`;
  }

  if (reference.journal) {
    formatted += `. ${reference.journal}`;
    if (reference.volume) {
      formatted += `, ${reference.volume}`;
    }
    if (reference.pages) {
      formatted += `, ${reference.pages}`;
    }
  } else if (reference.publisher) {
    formatted += `. ${reference.publisher}`;
  }

  formatted += '.';
  return formatted;
}
