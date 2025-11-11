#!/usr/bin/env python3
"""
PDF Page Extractor

Extracts specific pages from PDFs as PNG images for agent viewing.
Useful when OCR text has errors (especially in math formulas) and
you need to see the actual rendered page.

Usage:
    python3 scripts/extract-pdf-pages.py <pdf_id> <page_numbers>
    python3 scripts/extract-pdf-pages.py liunocedal1989 5-7
    python3 scripts/extract-pdf-pages.py numericaloptimization2006 27
    python3 scripts/extract-pdf-pages.py boyd_vandenberghe-2004-convex_optimization 100,105,110
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple

# Configuration
REFERENCES_DIR = Path("docs/references")
INDEX_FILE = REFERENCES_DIR / "chunk-index.json"
OUTPUT_DIR = REFERENCES_DIR / "extracted-pages"
DPI = 150  # Resolution for PDF to image conversion


def load_index() -> dict:
    """Load the chunk index to find source PDFs."""
    if not INDEX_FILE.exists():
        print(f"Error: Index file not found: {INDEX_FILE}")
        print("Run: python3 scripts/chunk-pdfs.py first")
        sys.exit(1)

    with open(INDEX_FILE) as f:
        return json.load(f)


def parse_page_numbers(page_spec: str) -> List[int]:
    """
    Parse page number specification.

    Examples:
        "5" -> [5]
        "5-7" -> [5, 6, 7]
        "5,7,9" -> [5, 7, 9]
        "5-7,10,15-17" -> [5, 6, 7, 10, 15, 16, 17]
    """
    pages = []

    for part in page_spec.split(','):
        part = part.strip()
        if '-' in part:
            start, end = part.split('-')
            pages.extend(range(int(start), int(end) + 1))
        else:
            pages.append(int(part))

    return sorted(set(pages))


def extract_pages(pdf_path: Path, pages: List[int], output_dir: Path, pdf_id: str, dpi: int = DPI) -> List[Path]:
    """
    Extract specified pages from PDF as PNG images using pdftoppm.

    Returns: List of paths to generated image files
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    generated_files = []

    for page_num in pages:
        output_file = output_dir / f"{pdf_id}_page_{page_num:04d}.png"

        # Use pdftoppm to convert specific page to PNG
        # -f = first page, -l = last page (same for single page)
        # -singlefile = output single file without page number suffix
        # -png = output as PNG
        # -r = resolution in DPI
        try:
            subprocess.run([
                "pdftoppm",
                "-f", str(page_num),
                "-l", str(page_num),
                "-singlefile",
                "-png",
                "-r", str(dpi),
                str(pdf_path),
                str(output_file.with_suffix(''))  # pdftoppm adds .png
            ], check=True, capture_output=True)

            generated_files.append(output_file)

        except subprocess.CalledProcessError as e:
            print(f"Error extracting page {page_num}: {e.stderr.decode()}")
            continue

    return generated_files


def main():
    parser = argparse.ArgumentParser(
        description="Extract specific pages from PDFs as images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract single page
  %(prog)s liunocedal1989 5

  # Extract page range
  %(prog)s numericaloptimization2006 27-30

  # Extract multiple pages and ranges
  %(prog)s boyd_vandenberghe-2004-convex_optimization 100,105-107,200
        """
    )
    parser.add_argument("pdf_id", help="PDF identifier from chunk-index.json")
    parser.add_argument("pages", help="Page numbers (e.g., '5', '5-7', '5,7,9', '5-7,10')")
    parser.add_argument("--dpi", type=int, default=DPI, help=f"Image resolution (default: {DPI})")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR, help="Output directory")

    args = parser.parse_args()

    # Load index
    index = load_index()

    # Find PDF
    if args.pdf_id not in index:
        print(f"Error: PDF ID '{args.pdf_id}' not found in index")
        print(f"\nAvailable PDF IDs:")
        for pdf_id, metadata in index.items():
            print(f"  {pdf_id:50s} ({metadata['source_file']})")
        sys.exit(1)

    metadata = index[args.pdf_id]
    pdf_path = REFERENCES_DIR / metadata["source_file"]

    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)

    # Parse page numbers
    try:
        pages = parse_page_numbers(args.pages)
    except ValueError as e:
        print(f"Error parsing page numbers: {e}")
        sys.exit(1)

    # Validate page numbers
    total_pages = metadata["total_pages"]
    invalid_pages = [p for p in pages if p < 1 or p > total_pages]
    if invalid_pages:
        print(f"Error: Invalid page numbers {invalid_pages}")
        print(f"PDF has {total_pages} pages (valid range: 1-{total_pages})")
        sys.exit(1)

    # Extract pages
    print(f"Extracting {len(pages)} page(s) from {metadata['source_file']}")
    print(f"Pages: {', '.join(map(str, pages))}")
    print(f"Output: {args.output_dir}")
    print()

    output_files = extract_pages(pdf_path, pages, args.output_dir, args.pdf_id, args.dpi)

    if output_files:
        print(f"\n✓ Successfully extracted {len(output_files)} page(s):")
        for file_path in output_files:
            try:
                rel_path = file_path.relative_to(Path.cwd())
            except ValueError:
                rel_path = file_path
            print(f"  {rel_path}")
    else:
        print("\n✗ No pages were extracted")
        sys.exit(1)


if __name__ == "__main__":
    main()
