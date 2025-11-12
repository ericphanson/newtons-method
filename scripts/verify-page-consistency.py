#!/usr/bin/env python3
"""
Verify consistency between pages/pdfPages fields and proofPages.
Detect mismatches and suggest corrections.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

def extract_pdf_page_from_path(path):
    """Extract PDF page number from path like 'docs/.../file_page_0101.png'"""
    match = re.search(r'_page_(\d+)\.png$', path)
    if match:
        return int(match.group(1))
    return None

def parse_page_spec(spec):
    """Parse page spec like '8-10, 61' into list of pages"""
    pages = []
    for part in spec.replace(' ', '').split(','):
        if '-' in part:
            start, end = part.split('-')
            pages.extend(range(int(start), int(end) + 1))
        else:
            pages.append(int(part))
    return sorted(set(pages))

def format_page_spec(pages):
    """Format list of pages into compact spec like '8-10, 61'"""
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
            ranges.append(f"{start}-{end}" if start != end else str(start))
            start = end = page

    ranges.append(f"{start}-{end}" if start != end else str(start))
    return ', '.join(ranges)

def main():
    citations_path = Path('docs/citations.json')
    with open(citations_path, 'r') as f:
        data = json.load(f)

    issues = []

    for citation_id, citation in data['citations'].items():
        ref_id = citation['reference']
        ref = data['references'].get(ref_id)

        if not ref:
            continue

        page_offset = ref.get('pageOffset', 0)

        # Get claimed pages
        claimed_book_pages = parse_page_spec(citation.get('pages', ''))
        claimed_pdf_pages = parse_page_spec(citation.get('pdfPages', ''))

        # Get actual pages from proofPages
        proof_pages = citation.get('proofPages', [])
        if not proof_pages:
            continue

        actual_pdf_pages = []
        for path in proof_pages:
            pdf_page = extract_pdf_page_from_path(path)
            if pdf_page:
                actual_pdf_pages.append(pdf_page)

        if not actual_pdf_pages:
            continue

        actual_pdf_pages = sorted(set(actual_pdf_pages))
        actual_book_pages = sorted([p - page_offset for p in actual_pdf_pages])

        # Check for mismatches
        mismatch = False

        if claimed_book_pages != actual_book_pages:
            issues.append({
                'citation': citation_id,
                'type': 'book_pages_mismatch',
                'claimed_book_pages': format_page_spec(claimed_book_pages),
                'actual_book_pages': format_page_spec(actual_book_pages),
                'claimed_pdf_pages': format_page_spec(claimed_pdf_pages),
                'actual_pdf_pages': format_page_spec(actual_pdf_pages),
                'offset': page_offset
            })
            mismatch = True

        if claimed_pdf_pages != actual_pdf_pages:
            issues.append({
                'citation': citation_id,
                'type': 'pdf_pages_mismatch',
                'claimed_book_pages': format_page_spec(claimed_book_pages),
                'actual_book_pages': format_page_spec(actual_book_pages),
                'claimed_pdf_pages': format_page_spec(claimed_pdf_pages),
                'actual_pdf_pages': format_page_spec(actual_pdf_pages),
                'offset': page_offset
            })
            mismatch = True

    if not issues:
        print("✅ All citations have consistent page numbers!")
        return

    print(f"Found {len(issues)} page number inconsistencies:\n")

    for issue in issues:
        print(f"❌ {issue['citation']}")
        print(f"   Claimed book pages:  {issue['claimed_book_pages']}")
        print(f"   Actual book pages:   {issue['actual_book_pages']}")
        print(f"   Claimed PDF pages:   {issue['claimed_pdf_pages']}")
        print(f"   Actual PDF pages:    {issue['actual_pdf_pages']}")
        print(f"   Page offset: {issue['offset']}")
        print()

    print("\nRecommendation: Update pages/pdfPages fields to match proofPages")
    print("The proofPages contain the actual verified theorem locations.")

if __name__ == '__main__':
    main()
