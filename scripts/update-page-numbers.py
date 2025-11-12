#!/usr/bin/env python3
"""
Update citations.json with both 'pages' (book pages) and 'pdfPages' (PDF pages).
Add pageOffset to references.

Based on verified offsets:
- lectures_on_convex_optimization: PDF page 100 = book page 80, offset = 20
- numericaloptimization2006: PDF page 33 = book page 13, offset = 20
- liunocedal1989: PDF page 21 = book page 20, offset = 1
- branin1972: offset = 503 (publication pages 504-522, PDF has 19 pages)
- rosenbrock1960: offset = 174 (publication pages 175-184, PDF has 10 pages)
"""

import json
from pathlib import Path

# Verified page offsets (PDF page - book page)
PAGE_OFFSETS = {
    'lectures_on_convex_optimization': 20,
    'numericaloptimization2006': 20,
    'liunocedal1989': 1,
    'branin1972': 503,  # Publication page offset
    'rosenbrock1960': 174,  # Publication page offset
}

# Map reference IDs to PDF IDs
REFERENCE_TO_PDF_ID = {
    'nesterov-2018': 'lectures_on_convex_optimization',
    'nocedal-wright-2006': 'numericaloptimization2006',
    'liu-nocedal-1989': 'liunocedal1989',
    'branin-1972': 'branin1972',
    'rosenbrock-1960': 'rosenbrock1960',
}

def parse_page_numbers(page_str):
    """Parse page number string into list of individual pages."""
    pages = []
    parts = page_str.replace(' ', '').split(',')
    for part in parts:
        if '-' in part:
            start, end = part.split('-')
            pages.extend(range(int(start), int(end) + 1))
        else:
            pages.append(int(part))
    return pages

def format_page_range(pages):
    """Format list of pages into compact range string."""
    if not pages:
        return ""

    pages = sorted(set(pages))
    ranges = []
    start = pages[0]
    end = pages[0]

    for page in pages[1:]:
        if page == end + 1:
            end = page
        else:
            if start == end:
                ranges.append(str(start))
            else:
                ranges.append(f"{start}-{end}")
            start = end = page

    # Add final range
    if start == end:
        ranges.append(str(start))
    else:
        ranges.append(f"{start}-{end}")

    return ', '.join(ranges)

def main():
    citations_path = Path('docs/citations.json')
    with open(citations_path, 'r') as f:
        data = json.load(f)

    # Update references with pageOffset
    for ref_id, ref in data['references'].items():
        pdf_id = REFERENCE_TO_PDF_ID.get(ref_id)
        if pdf_id and pdf_id in PAGE_OFFSETS:
            ref['pageOffset'] = PAGE_OFFSETS[pdf_id]
            print(f"✓ Updated {ref_id}: pageOffset = {PAGE_OFFSETS[pdf_id]}")

    # Update citations with pdfPages field and correct pages field
    for citation_id, citation in data['citations'].items():
        ref_id = citation['reference']
        ref = data['references'].get(ref_id)

        if not ref:
            continue

        pdf_id = REFERENCE_TO_PDF_ID.get(ref_id)
        if not pdf_id or pdf_id not in PAGE_OFFSETS:
            print(f"⚠️  Skipping {citation_id}: no offset for {ref_id}")
            continue

        offset = PAGE_OFFSETS[pdf_id]

        # Current 'pages' field contains PDF pages (our assumption based on working extraction)
        current_pages_str = citation.get('pages', '')
        if not current_pages_str:
            continue

        # Parse PDF pages
        pdf_pages = parse_page_numbers(current_pages_str)

        # Calculate book pages
        book_pages = [p - offset for p in pdf_pages]

        # Update citation
        citation['pdfPages'] = format_page_range(pdf_pages)
        citation['pages'] = format_page_range(book_pages)

        print(f"✓ Updated {citation_id}:")
        print(f"    pages (book): {citation['pages']}")
        print(f"    pdfPages: {citation['pdfPages']}")

    # Write updated data
    with open(citations_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Updated citations.json")

if __name__ == '__main__':
    main()
