#!/usr/bin/env python3
"""Install the bundled neutral PdM documentation scaffold without overwriting files."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a neutral docs/pdm scaffold without overwriting existing files."
    )
    parser.add_argument(
        "--target",
        default=".",
        help="Project root in which docs/pdm will be created (default: current directory).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show the files that would be created without writing them.",
    )
    return parser.parse_args()


def bundled_files(template_root: Path) -> list[Path]:
    return sorted(path for path in template_root.rglob("*") if path.is_file())


def symlink_components(root: Path, paths: list[Path]) -> list[Path]:
    """Return existing or broken symlink components below root."""
    found: set[Path] = set()
    for path in paths:
        cursor = root
        for part in path.relative_to(root).parts:
            cursor /= part
            if cursor.is_symlink():
                found.add(cursor)
    return sorted(found)


def is_within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def main() -> int:
    args = parse_args()
    skill_root = Path(__file__).resolve().parent.parent
    template_root = skill_root / "assets" / "pdm-docs"
    target_root = Path(args.target).expanduser().resolve()
    destination_root = target_root / "docs" / "pdm"

    if not target_root.is_dir():
        print(f"error: target directory does not exist: {target_root}", file=sys.stderr)
        return 2
    if not template_root.is_dir():
        print(f"error: bundled template is missing: {template_root}", file=sys.stderr)
        return 2

    sources = bundled_files(template_root)
    destinations = [destination_root / source.relative_to(template_root) for source in sources]

    linked_components = symlink_components(target_root, [destination_root, *destinations])
    escaped_destinations = [
        path for path in destinations if not is_within(path.resolve(strict=False), target_root)
    ]
    if linked_components or escaped_destinations:
        print(
            "error: no files were written because destination contains symbolic links "
            "or resolves outside the target root:",
            file=sys.stderr,
        )
        for path in sorted({*linked_components, *escaped_destinations}):
            print(f"  {path}", file=sys.stderr)
        print(
            "Use a real directory tree under the target root; this installer does not follow symlinks.",
            file=sys.stderr,
        )
        return 4

    collisions = [path for path in destinations if path.exists() or path.is_symlink()]

    if collisions:
        print("error: no files were written because destination files already exist:", file=sys.stderr)
        for path in collisions:
            print(f"  {path}", file=sys.stderr)
        print("Merge missing sections manually; this installer never overwrites files.", file=sys.stderr)
        return 3

    for path in destinations:
        print(f"create {path}")

    if args.dry_run:
        return 0

    for source, destination in zip(sources, destinations, strict=True):
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

    print(f"created {len(destinations)} files under {destination_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
