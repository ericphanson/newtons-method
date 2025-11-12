#!/usr/bin/env python3
"""
Calculate page offsets by comparing PDF page numbers (from filenames)
with book page numbers (printed on pages).

Uses proofPages as ground truth since they've been verified.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from citations_utils import load_citations_data

def extract_pdf_page_from_filename(filename):
    """Extract PDF page number from filename like 'lectures_on_convex_optimization_page_0101.png'"""
    match = re.search(r'_page_(\d+)\.png$', filename)
    if match:
        return int(match.group(1))
    return None

def main():
    data = load_citations_data()

    # Group proofPages by reference to sample one page per reference
    ref_samples = defaultdict(list)

    for citation_id, citation in data['citations'].items():
        if 'proofPages' not in citation or not citation['proofPages']:
            continue

        ref_id = citation['reference']
        ref = data['references'].get(ref_id)
        if not ref:
            continue

        # Get first proof page as sample
        first_page_path = citation['proofPages'][0]
        pdf_page = extract_pdf_page_from_filename(first_page_path)

        if pdf_page:
            ref_samples[ref_id].append({
                'citation_id': citation_id,
                'pdf_page': pdf_page,
                'image_path': first_page_path,
                'file': ref.get('file', 'unknown')
            })

    print("Sample pages to check for each reference:")
    print("=" * 80)

    for ref_id, samples in sorted(ref_samples.items()):
        if not samples:
            continue

        sample = samples[0]  # Use first sample
        print(f"\nReference: {ref_id}")
        print(f"  File: {sample['file']}")
        print(f"  PDF page: {sample['pdf_page']}")
        print(f"  Image: {sample['image_path']}")
        print(f"  Citation: {sample['citation_id']}")
        print()
        print("  Please check this image and report the BOOK PAGE NUMBER printed on it.")
        print()

if __name__ == '__main__':
    main()
