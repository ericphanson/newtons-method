#!/usr/bin/env python3

import json
import subprocess
import sys
from pathlib import Path

def load_pdf_id_mapping():
    """Load chunk index and create a mapping from filename to PDF ID."""
    index_path = Path('docs/references/chunk-index.json')
    if not index_path.exists():
        print(f"Error: chunk-index.json not found at {index_path}")
        print("Run: python3 scripts/chunk-pdfs.py first")
        sys.exit(1)

    with open(index_path, 'r') as f:
        index = json.load(f)

    # Create reverse mapping: source_file -> pdf_id
    filename_to_id = {}
    for pdf_id, metadata in index.items():
        source_file = metadata['source_file']
        filename_to_id[source_file] = pdf_id

    return filename_to_id

def main():
    # Load PDF ID mapping
    filename_to_id = load_pdf_id_mapping()

    # Read citations.json
    citations_path = Path('docs/citations.json')
    with open(citations_path, 'r') as f:
        data = json.load(f)

    # Collect all unique (pdf_id, page) pairs
    pages_to_extract = set()
    unmapped_files = set()

    for citation_id, citation in data['citations'].items():
        ref_id = citation['reference']
        ref = data['references'].get(ref_id)

        if not ref or 'file' not in ref:
            continue

        pdf_file = ref['file']

        # Map filename to PDF ID
        pdf_id = filename_to_id.get(pdf_file)
        if not pdf_id:
            unmapped_files.add(pdf_file)
            continue

        # Use pdfPages if available (PDF page numbers), fallback to pages for backwards compat
        pages = citation.get('pdfPages') or citation.get('pages', '')

        if not pages:
            continue

        # Parse page numbers (could be "100", "100-101", "48, 50")
        page_parts = pages.replace(' ', '').split(',')
        for part in page_parts:
            if '-' in part:
                # Range
                start, end = part.split('-')
                try:
                    for page in range(int(start), int(end) + 1):
                        pages_to_extract.add((pdf_id, page))
                except ValueError:
                    print(f"Warning: Could not parse page range '{part}' in {citation_id}")
            else:
                # Single page
                try:
                    pages_to_extract.add((pdf_id, int(part)))
                except ValueError:
                    print(f"Warning: Could not parse page '{part}' in {citation_id}")

    if unmapped_files:
        print("Warning: Could not map the following files to PDF IDs:")
        for f in sorted(unmapped_files):
            print(f"  - {f}")
        print()

    # Sort for predictable output
    pages_to_extract = sorted(pages_to_extract)

    print(f"Found {len(pages_to_extract)} unique pages to extract")
    print()

    # Extract each page at 300 DPI
    success_count = 0
    skip_count = 0
    error_count = 0

    for pdf_id, page in pages_to_extract:
        # Check if page already exists
        # The script uses the PDF ID + _page_NNNN.png format
        output_file = f"docs/references/extracted-pages/{pdf_id}_page_{page:04d}.png"

        if Path(output_file).exists():
            print(f"⏭️  Already exists: {pdf_id} page {page}")
            skip_count += 1
            continue

        # Run extraction
        try:
            result = subprocess.run(
                ['python3', 'scripts/extract-pdf-pages.py', pdf_id, str(page), '--dpi', '300'],
                capture_output=True,
                text=True,
                check=True
            )
            print(f"✅ Extracted: {pdf_id} page {page}")
            success_count += 1
        except subprocess.CalledProcessError as e:
            print(f"❌ Error extracting {pdf_id} page {page}: {e.stderr}")
            error_count += 1

    print()
    print(f"Summary:")
    print(f"  ✅ Extracted: {success_count}")
    print(f"  ⏭️  Skipped (already exist): {skip_count}")
    print(f"  ❌ Errors: {error_count}")
    print(f"  📄 Total: {len(pages_to_extract)}")

if __name__ == '__main__':
    main()
