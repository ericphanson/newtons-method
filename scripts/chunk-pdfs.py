#!/usr/bin/env python3
"""
PDF Chunking System

Extracts text from OCR'd PDFs and splits them into manageable chunks
for agent processing, preserving page numbers for accurate citations.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Configuration
PAGES_PER_CHUNK = 10
REFERENCES_DIR = Path("docs/references")
CHUNKS_DIR = REFERENCES_DIR / "chunks"
INDEX_FILE = REFERENCES_DIR / "chunk-index.json"


def has_pdftotext() -> bool:
    """Check if pdftotext (poppler) is available."""
    try:
        subprocess.run(["pdftotext", "-v"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def extract_text_with_poppler(pdf_path: Path) -> Dict[int, str]:
    """Extract text from PDF using poppler's pdftotext, one page at a time."""
    pages = {}

    # Get page count first
    result = subprocess.run(
        ["pdfinfo", str(pdf_path)],
        capture_output=True,
        text=True,
        check=True
    )

    page_count = 0
    for line in result.stdout.split('\n'):
        if line.startswith('Pages:'):
            page_count = int(line.split(':')[1].strip())
            break

    print(f"  Extracting {page_count} pages...")

    # Extract each page
    for page_num in range(1, page_count + 1):
        result = subprocess.run(
            ["pdftotext", "-f", str(page_num), "-l", str(page_num),
             "-layout", str(pdf_path), "-"],
            capture_output=True,
            text=True,
            check=True
        )
        pages[page_num] = result.stdout

        if page_num % 50 == 0:
            print(f"    Processed {page_num}/{page_count} pages...")

    return pages


def extract_text_with_pypdf(pdf_path: Path) -> Dict[int, str]:
    """Extract text from PDF using pypdf library."""
    try:
        from pypdf import PdfReader
    except ImportError:
        print("Error: pypdf not installed. Run: uv pip install pypdf")
        sys.exit(1)

    pages = {}
    reader = PdfReader(str(pdf_path))

    print(f"  Extracting {len(reader.pages)} pages...")

    for i, page in enumerate(reader.pages, start=1):
        pages[i] = page.extract_text()

        if i % 50 == 0:
            print(f"    Processed {i}/{len(reader.pages)} pages...")

    return pages


def chunk_pages(pages: Dict[int, str], chunk_size: int) -> List[Tuple[int, int, str]]:
    """
    Split pages into chunks.

    Returns: List of (start_page, end_page, combined_text) tuples
    """
    chunks = []
    page_nums = sorted(pages.keys())

    for i in range(0, len(page_nums), chunk_size):
        chunk_pages = page_nums[i:i + chunk_size]
        start_page = chunk_pages[0]
        end_page = chunk_pages[-1]

        # Combine text from all pages in chunk, preserving page boundaries
        combined_text = ""
        for page_num in chunk_pages:
            combined_text += f"\n{'='*80}\n"
            combined_text += f"PAGE {page_num}\n"
            combined_text += f"{'='*80}\n\n"
            combined_text += pages[page_num]

        chunks.append((start_page, end_page, combined_text))

    return chunks


def sanitize_filename(name: str) -> str:
    """Convert filename to safe format."""
    # Remove extension and sanitize
    name = Path(name).stem
    name = re.sub(r'[^\w\-_]', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.lower()


def process_pdf(pdf_path: Path, use_poppler: bool) -> Dict:
    """Process a single PDF and return metadata."""
    print(f"\nProcessing: {pdf_path.name}")

    # Extract text
    if use_poppler:
        pages = extract_text_with_poppler(pdf_path)
    else:
        pages = extract_text_with_pypdf(pdf_path)

    # Create chunks
    chunks = chunk_pages(pages, PAGES_PER_CHUNK)
    print(f"  Created {len(chunks)} chunks")

    # Save chunks
    safe_name = sanitize_filename(pdf_path.name)
    pdf_chunks_dir = CHUNKS_DIR / safe_name
    pdf_chunks_dir.mkdir(parents=True, exist_ok=True)

    chunk_files = []
    for start_page, end_page, text in chunks:
        chunk_filename = f"{safe_name}_pages_{start_page:04d}-{end_page:04d}.txt"
        chunk_path = pdf_chunks_dir / chunk_filename

        chunk_path.write_text(text, encoding='utf-8')

        chunk_files.append({
            "file": f"chunks/{safe_name}/{chunk_filename}",
            "start_page": start_page,
            "end_page": end_page,
            "page_count": end_page - start_page + 1
        })

    return {
        "source_file": pdf_path.name,
        "total_pages": max(pages.keys()),
        "chunks": chunk_files,
        "pages_per_chunk": PAGES_PER_CHUNK
    }


def main():
    """Main entry point."""
    print("PDF Chunking System")
    print("=" * 80)

    # Check for PDF processing capability
    use_poppler = has_pdftotext()
    if use_poppler:
        print("✓ Using poppler-utils (pdftotext)")
    else:
        print("⚠ poppler-utils not found, falling back to pypdf")
        print("  (Install poppler-utils for better performance)")

    # Find all PDFs
    pdf_files = sorted(REFERENCES_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"\nNo PDF files found in {REFERENCES_DIR}")
        return

    print(f"\nFound {len(pdf_files)} PDF files")

    # Create chunks directory
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)

    # Process each PDF
    index = {}
    for pdf_path in pdf_files:
        try:
            metadata = process_pdf(pdf_path, use_poppler)
            index[sanitize_filename(pdf_path.name)] = metadata
        except Exception as e:
            print(f"  ✗ Error processing {pdf_path.name}: {e}")
            continue

    # Save index
    print(f"\nSaving index to {INDEX_FILE}")
    with open(INDEX_FILE, 'w') as f:
        json.dump(index, f, indent=2)

    print("\n✓ Done!")
    print(f"\nChunks stored in: {CHUNKS_DIR}")
    print(f"Index file: {INDEX_FILE}")

    # Print summary
    print("\nSummary:")
    for pdf_id, metadata in index.items():
        print(f"  {metadata['source_file']}: "
              f"{metadata['total_pages']} pages → "
              f"{len(metadata['chunks'])} chunks")


if __name__ == "__main__":
    main()
