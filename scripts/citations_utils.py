#!/usr/bin/env python3
"""
Utility functions for loading and saving citation data from the new split file structure.
"""

import json
from pathlib import Path
from typing import Dict, Any


def load_citations_data() -> Dict[str, Any]:
    """
    Load all citations and references from the new file structure.

    Returns:
        Dictionary with 'references' and 'citations' keys
    """
    # Load references
    references_path = Path('docs/references.json')
    with open(references_path, 'r') as f:
        references = json.load(f)

    # Load all citation files
    citations_dir = Path('docs/citations')
    citations = {}

    for citation_file in citations_dir.glob('*.json'):
        citation_key = citation_file.stem  # filename without .json
        with open(citation_file, 'r') as f:
            citations[citation_key] = json.load(f)

    return {
        'references': references,
        'citations': citations
    }


def save_citation(citation_key: str, citation_data: Dict[str, Any]) -> None:
    """
    Save a single citation to its file.

    Args:
        citation_key: The citation identifier (filename without .json)
        citation_data: The citation data to save
    """
    citation_path = Path(f'docs/citations/{citation_key}.json')
    with open(citation_path, 'w') as f:
        json.dump(citation_data, f, indent=2)


def save_references(references: Dict[str, Any]) -> None:
    """
    Save references to references.json.

    Args:
        references: The references data to save
    """
    references_path = Path('docs/references.json')
    with open(references_path, 'w') as f:
        json.dump(references, f, indent=2)
