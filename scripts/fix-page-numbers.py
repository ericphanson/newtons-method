#!/usr/bin/env python3
"""
Fix page numbers in citations.json to match proofPages.
ProofPages are the source of truth since they show where theorems actually are.
"""

import json
import re
from pathlib import Path

def extract_pdf_page_from_path(path):
    """Extract PDF page number from path like 'docs/.../file_page_0101.png'"""
    match = re.search(r'_page_(\d+)\.png$', path)
    if match:
        return int(match.group(1))
    return None

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

    updates = []

    for citation_id, citation in data['citations'].items():
        ref_id = citation['reference']
        ref = data['references'].get(ref_id)

        if not ref:
            continue

        page_offset = ref.get('pageOffset', 0)

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

        # Check if this is a journal article with publication pages (negative book pages = broken offset)
        is_journal = ref.get('journal') is not None
        has_negative_pages = any(p < 0 for p in actual_book_pages)

        if is_journal and has_negative_pages:
            # For journal articles, the PDF pages ARE the publication pages
            # Don't apply offset, just use PDF pages directly
            print(f"⚠️  {citation_id}: Journal article - using PDF pages as publication pages")
            new_pages = format_page_spec(actual_pdf_pages)
            new_pdf_pages = format_page_spec(actual_pdf_pages)
        else:
            # Normal case: apply offset
            new_pages = format_page_spec(actual_book_pages)
            new_pdf_pages = format_page_spec(actual_pdf_pages)

        # Update if different
        old_pages = citation.get('pages', '')
        old_pdf_pages = citation.get('pdfPages', '')

        if old_pages != new_pages or old_pdf_pages != new_pdf_pages:
            citation['pages'] = new_pages
            citation['pdfPages'] = new_pdf_pages
            updates.append({
                'citation': citation_id,
                'old_pages': old_pages,
                'new_pages': new_pages,
                'old_pdf_pages': old_pdf_pages,
                'new_pdf_pages': new_pdf_pages
            })

    if not updates:
        print("✅ No updates needed")
        return

    # Write updated data
    with open(citations_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Updated {len(updates)} citations:\n")
    for update in updates:
        print(f"📝 {update['citation']}")
        print(f"   pages: '{update['old_pages']}' → '{update['new_pages']}'")
        print(f"   pdfPages: '{update['old_pdf_pages']}' → '{update['new_pdf_pages']}'")
        print()

if __name__ == '__main__':
    main()
