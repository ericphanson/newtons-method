#!/usr/bin/env python3
"""
Formula Extraction Script

Agent-driven workflow for extracting mathematical formulas from PDF page images.
Crops regions from source images and generates comprehensive metadata files.

Usage:
    python3 scripts/crop-formula.py \\
      --pdf lectures_on_convex_optimization \\
      --page 276 \\
      --top-percent 59.1 \\
      --bottom-percent 71.8 \\
      --theorem "Theorem 4.1.6" \\
      --equation "(4.1.36)" \\
      --description "Convergence bound for gradient-dominated functions"

Output:
    - Cropped PNG image
    - JSON metadata file with extraction details
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple

from PIL import Image


# Configuration
EXTRACTED_PAGES_DIR = Path("docs/references/extracted-pages")
DEFAULT_OUTPUT_DIR = Path("docs/references/extracted-pages/formulas")
DEFAULT_DPI = 300
CREATED_BY = "agent"
MIN_CROP_SIZE = 10  # Minimum crop dimension in pixels


def sanitize_for_filename(text: str) -> str:
    """
    Sanitize text for use in filenames.

    Converts to lowercase, replaces spaces and special chars with underscores.

    Args:
        text: Text to sanitize

    Returns:
        Sanitized string safe for filenames
    """
    # Convert to lowercase
    text = text.lower()
    # Replace spaces, parentheses, dots, and other special chars with underscore
    text = re.sub(r'[^\w\-]', '_', text)
    # Collapse multiple underscores
    text = re.sub(r'_+', '_', text)
    # Remove leading/trailing underscores
    text = text.strip('_')
    return text


def generate_formula_id(pdf_id: str, page_num: int, theorem: str = None,
                        equation: str = None) -> str:
    """
    Generate a formula ID from the source information.

    Args:
        pdf_id: PDF identifier
        page_num: Page number
        theorem: Theorem number (optional)
        equation: Equation number (optional)

    Returns:
        Formula ID string
    """
    parts = [pdf_id, f"p{page_num}"]

    if theorem:
        # Extract key parts from theorem (e.g., "Theorem 4.1.6" -> "theorem_4_1_6")
        sanitized = sanitize_for_filename(theorem)
        if sanitized:  # Only append if not empty after sanitization
            parts.append(sanitized)

    if equation and not theorem:
        # Only use equation if no theorem specified
        sanitized = sanitize_for_filename(equation)
        if sanitized:  # Only append if not empty after sanitization
            parts.append(sanitized)

    return "_".join(parts)


def validate_pdf_id(pdf_id: str) -> None:
    """
    Validate PDF ID to prevent path traversal attacks.

    Args:
        pdf_id: PDF identifier to validate

    Raises:
        ValueError: If PDF ID contains invalid characters
    """
    if '..' in pdf_id or '/' in pdf_id or '\\' in pdf_id:
        raise ValueError(
            f"Invalid PDF ID '{pdf_id}': cannot contain path separators or '..'"
        )


def get_source_image_path(pdf_id: str, page_num: int) -> Path:
    """
    Get the path to the source page image.

    Args:
        pdf_id: PDF identifier
        page_num: Page number

    Returns:
        Path to source image
    """
    return EXTRACTED_PAGES_DIR / f"{pdf_id}_page_{page_num:04d}.png"


def validate_percentage(value: float, name: str) -> None:
    """
    Validate that a percentage value is in range [0, 100].

    Args:
        value: Percentage value to validate
        name: Name of the parameter (for error messages)

    Raises:
        ValueError: If value is out of range
    """
    if not 0 <= value <= 100:
        raise ValueError(f"{name} must be between 0 and 100, got {value}")


def crop_image_by_percentage(
    source_path: Path,
    top_percent: float,
    bottom_percent: float,
    left_percent: float = 0,
    right_percent: float = 100
) -> Tuple[Image.Image, Dict[str, int], Dict[str, float], Tuple[int, int]]:
    """
    Crop an image using percentage-based coordinates.

    Args:
        source_path: Path to source image
        top_percent: Top boundary as percentage (0-100)
        bottom_percent: Bottom boundary as percentage (0-100)
        left_percent: Left boundary as percentage (0-100)
        right_percent: Right boundary as percentage (0-100)

    Returns:
        Tuple of (cropped_image, pixel_coordinates, percentage_coordinates, source_dimensions)

    Raises:
        ValueError: If percentages are invalid or crop is too small
        FileNotFoundError: If source image doesn't exist
    """
    # Validate percentages
    validate_percentage(top_percent, "top_percent")
    validate_percentage(bottom_percent, "bottom_percent")
    validate_percentage(left_percent, "left_percent")
    validate_percentage(right_percent, "right_percent")

    if bottom_percent <= top_percent:
        raise ValueError(f"bottom_percent ({bottom_percent}) must be greater than top_percent ({top_percent})")

    if right_percent <= left_percent:
        raise ValueError(f"right_percent ({right_percent}) must be greater than left_percent ({left_percent})")

    # Open source image
    if not source_path.exists():
        raise FileNotFoundError(f"Source image not found: {source_path}")

    img = Image.open(source_path)
    width, height = img.size

    # Convert percentages to pixel coordinates
    left_px = int(width * left_percent / 100)
    right_px = int(width * right_percent / 100)
    top_px = int(height * top_percent / 100)
    bottom_px = int(height * bottom_percent / 100)

    # Validate minimum crop size
    crop_width = right_px - left_px
    crop_height = bottom_px - top_px

    if crop_height < MIN_CROP_SIZE:
        raise ValueError(
            f"Crop height too small: {crop_height}px (minimum: {MIN_CROP_SIZE}px). "
            f"Increase the range between top_percent ({top_percent}) and bottom_percent ({bottom_percent})."
        )

    if crop_width < MIN_CROP_SIZE:
        raise ValueError(
            f"Crop width too small: {crop_width}px (minimum: {MIN_CROP_SIZE}px). "
            f"Increase the range between left_percent ({left_percent}) and right_percent ({right_percent})."
        )

    # Crop image (PIL uses left, top, right, bottom)
    cropped = img.crop((left_px, top_px, right_px, bottom_px))

    pixel_coords = {
        "left": left_px,
        "top": top_px,
        "right": right_px,
        "bottom": bottom_px,
        "width": crop_width,
        "height": crop_height
    }

    percent_coords = {
        "left": left_percent,
        "top": top_percent,
        "right": right_percent,
        "bottom": bottom_percent
    }

    source_dimensions = (width, height)

    return cropped, pixel_coords, percent_coords, source_dimensions


def generate_metadata(
    formula_id: str,
    pdf_id: str,
    page_num: int,
    theorem: str,
    equation: str,
    description: str,
    source_path: Path,
    output_image_path: Path,
    pixel_coords: Dict[str, int],
    percent_coords: Dict[str, float],
    source_dimensions: Tuple[int, int],
    dpi: int
) -> Dict:
    """
    Generate comprehensive metadata for the extracted formula.

    Args:
        formula_id: Generated formula identifier
        pdf_id: Source PDF identifier
        page_num: Source page number
        theorem: Theorem number
        equation: Equation number
        description: Formula description
        source_path: Path to source image
        output_image_path: Path to output image
        pixel_coords: Crop coordinates in pixels
        percent_coords: Crop coordinates in percentages
        source_dimensions: Source image dimensions (width, height)
        dpi: DPI setting

    Returns:
        Metadata dictionary
    """
    now = datetime.utcnow().isoformat() + "Z"

    metadata = {
        "formula_id": formula_id,
        "source": {
            "pdf_id": pdf_id,
            "page": page_num,
            "theorem": theorem,
            "equation": equation,
            "description": description
        },
        "extraction": {
            "source_image": str(source_path),
            "output_image": str(output_image_path),
            "source_dimensions": {
                "width": source_dimensions[0],
                "height": source_dimensions[1]
            },
            "crop_coordinates_percent": percent_coords,
            "crop_coordinates_pixels": pixel_coords,
            "dpi": dpi
        },
        "latex": {
            "formula": "",
            "extracted_by": None,
            "extracted_date": None,
            "notes": ""
        },
        "verification": {
            "verified": False,
            "verified_by": None,
            "verified_date": None,
            "issues": []
        },
        "metadata": {
            "created_by": CREATED_BY,
            "created_date": now,
            "status": "extracted",
            "version": "1.0"
        }
    }

    return metadata


def main():
    """Main entry point for the formula extraction script."""
    parser = argparse.ArgumentParser(
        description="Extract mathematical formulas from PDF page images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  %(prog)s \\
    --pdf lectures_on_convex_optimization \\
    --page 276 \\
    --top-percent 59.1 \\
    --bottom-percent 71.8 \\
    --theorem "Theorem 4.1.6" \\
    --equation "(4.1.36)" \\
    --description "Convergence bound for gradient-dominated functions"

This will create:
  - formulas/lectures_on_convex_optimization_page_0276_theorem_4_1_6.png
  - formulas/lectures_on_convex_optimization_page_0276_theorem_4_1_6.json
        """
    )

    # Required arguments
    parser.add_argument(
        "--pdf",
        required=True,
        help="PDF identifier (e.g., 'lectures_on_convex_optimization')"
    )
    parser.add_argument(
        "--page",
        type=int,
        required=True,
        help="Page number (PDF page, not book page)"
    )
    parser.add_argument(
        "--top-percent",
        type=float,
        required=True,
        help="Top boundary as percentage (0-100)"
    )
    parser.add_argument(
        "--bottom-percent",
        type=float,
        required=True,
        help="Bottom boundary as percentage (0-100)"
    )

    # Optional crop boundaries
    parser.add_argument(
        "--left-percent",
        type=float,
        default=0,
        help="Left boundary as percentage (default: 0)"
    )
    parser.add_argument(
        "--right-percent",
        type=float,
        default=100,
        help="Right boundary as percentage (default: 100)"
    )

    # Source information
    parser.add_argument(
        "--theorem",
        default="",
        help="Theorem number (e.g., 'Theorem 4.1.6')"
    )
    parser.add_argument(
        "--equation",
        default="",
        help="Equation number (e.g., '(4.1.36)')"
    )
    parser.add_argument(
        "--description",
        default="",
        help="Brief description of the formula"
    )

    # Output configuration
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})"
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=DEFAULT_DPI,
        help=f"DPI setting (informational, default: {DEFAULT_DPI})"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files if they exist"
    )

    args = parser.parse_args()

    try:
        # Validate PDF ID
        validate_pdf_id(args.pdf)

        # Generate formula ID
        formula_id = generate_formula_id(
            args.pdf,
            args.page,
            args.theorem if args.theorem else None,
            args.equation if args.equation else None
        )

        print(f"Formula Extraction")
        print("=" * 60)
        print(f"Formula ID: {formula_id}")
        print(f"Source: {args.pdf}, page {args.page}")
        print(f"Crop region: {args.top_percent:.1f}% - {args.bottom_percent:.1f}% (vertical)")
        if args.left_percent != 0 or args.right_percent != 100:
            print(f"            {args.left_percent:.1f}% - {args.right_percent:.1f}% (horizontal)")
        print()

        # Get source image path
        source_path = get_source_image_path(args.pdf, args.page)
        print(f"Source image: {source_path}")

        # Crop the image
        cropped_img, pixel_coords, percent_coords, source_dimensions = crop_image_by_percentage(
            source_path,
            args.top_percent,
            args.bottom_percent,
            args.left_percent,
            args.right_percent
        )

        print(f"Source dimensions: {source_dimensions[0]}x{source_dimensions[1]} pixels")
        print(f"Crop coordinates: ({pixel_coords['left']}, {pixel_coords['top']}) to ({pixel_coords['right']}, {pixel_coords['bottom']})")
        print(f"Cropped size: {pixel_coords['width']}x{pixel_coords['height']} pixels")
        print()

        # Create output directory
        args.output_dir.mkdir(parents=True, exist_ok=True)

        # Generate output filenames
        sanitized_id = sanitize_for_filename(formula_id)
        output_image_path = args.output_dir / f"{sanitized_id}.png"
        output_metadata_path = args.output_dir / f"{sanitized_id}.json"

        # Check for existing files (overwrite protection)
        if not args.force:
            if output_image_path.exists() or output_metadata_path.exists():
                existing_files = []
                if output_image_path.exists():
                    existing_files.append(str(output_image_path))
                if output_metadata_path.exists():
                    existing_files.append(str(output_metadata_path))

                print(f"Error: Output files already exist:")
                for f in existing_files:
                    print(f"  - {f}")
                print()
                print("Use --force to overwrite existing files.")
                sys.exit(1)

        # Save cropped image
        cropped_img.save(output_image_path, "PNG")
        print(f"Saved image: {output_image_path}")

        # Generate and save metadata
        metadata = generate_metadata(
            formula_id,
            args.pdf,
            args.page,
            args.theorem,
            args.equation,
            args.description,
            source_path,
            output_image_path,
            pixel_coords,
            percent_coords,
            source_dimensions,
            args.dpi
        )

        with open(output_metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"Saved metadata: {output_metadata_path}")
        print()

        # Print summary
        print("=" * 60)
        print("Extraction Complete")
        print("=" * 60)
        print(f"Formula ID: {formula_id}")
        if args.theorem:
            print(f"Theorem: {args.theorem}")
        if args.equation:
            print(f"Equation: {args.equation}")
        if args.description:
            print(f"Description: {args.description}")
        print()
        print("Next steps:")
        print("  1. Use LaTeX agent to extract formula from the image")
        print("  2. Verify the extracted LaTeX")
        print("  3. Update metadata with LaTeX and verification info")
        print()
        print(f"Files created:")
        print(f"  - {output_image_path}")
        print(f"  - {output_metadata_path}")

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        print(f"\nMake sure the source page has been extracted first:", file=sys.stderr)
        print(f"  python3 scripts/extract-pdf-pages.py {args.pdf} {args.page}", file=sys.stderr)
        sys.exit(1)

    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
