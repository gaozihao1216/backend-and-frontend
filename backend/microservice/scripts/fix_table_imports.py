#!/usr/bin/env python3
"""Fix imports after table folder reorganization."""

from __future__ import annotations

import re
from pathlib import Path

MICROSERVICE = Path(__file__).resolve().parents[1] / "src"

SYMBOL_MAP: dict[str, str] = {}


def register_symbols() -> None:
    for path in MICROSERVICE.rglob("tables/*/**/*.scala"):
        rel = path.relative_to(MICROSERVICE)
        parts = rel.parts
        if len(parts) < 3:
            continue
        domain = parts[0]
        content = path.read_text()
        pkg_match = re.search(r"^package\s+(\S+)", content, flags=re.M)
        if not pkg_match:
            continue
        pkg = pkg_match.group(1)
        for name in re.findall(r"^(?:object|final case class|case class)\s+(\w+)", content, flags=re.M):
            SYMBOL_MAP[f"microservice.{domain}.tables.{name}"] = f"{pkg}.{name}"


def expand_braced_import(match: re.Match[str]) -> str:
    prefix = match.group(1)
    symbols = [item.strip() for item in match.group(2).split(",") if item.strip()]
    if not prefix.endswith(".tables"):
        return match.group(0)

    grouped: dict[str, list[str]] = {}
    for symbol in symbols:
        old = f"{prefix}.{symbol}"
        target = SYMBOL_MAP.get(old)
        if not target:
            continue
        target_pkg, _, target_symbol = target.rpartition(".")
        grouped.setdefault(target_pkg, []).append(target_symbol)

    if not grouped:
        return match.group(0)

    lines = []
    for pkg in sorted(grouped):
        names = ", ".join(sorted(set(grouped[pkg])))
        lines.append(f"import {pkg}.{{{names}}}")
    return "\n".join(lines)


def rewrite_file(path: Path) -> bool:
    content = path.read_text()
    original = content

    content = re.sub(
        r"import\s+(microservice\.\w+\.tables)\.(\w+)",
        lambda m: f"import {SYMBOL_MAP.get(m.group(1) + '.' + m.group(2), m.group(1) + '.' + m.group(2))}",
        content,
    )

    content = re.sub(
        r"import\s+(microservice\.\w+\.tables)\.\{([^}]+)\}",
        expand_braced_import,
        content,
    )

    if content != original:
        path.write_text(content)
        return True
    return False


def add_facade_subpackage_imports() -> None:
    for path in MICROSERVICE.rglob("tables/*/*Table.scala"):
        if "/jdbc/" in str(path) or "/inmemory/" in str(path):
            continue
        entity_dir = path.parent
        imports: list[str] = []
        if (entity_dir / "inmemory").is_dir():
            pkg_match = re.search(r"^package\s+(\S+)", path.read_text(), flags=re.M)
            if pkg_match:
                entity_pkg = pkg_match.group(1)
                imports.append(f"import {entity_pkg}.inmemory._")
        if (entity_dir / "jdbc").is_dir():
            pkg_match = re.search(r"^package\s+(\S+)", path.read_text(), flags=re.M)
            if pkg_match:
                entity_pkg = pkg_match.group(1)
                imports.append(f"import {entity_pkg}.jdbc._")
        if not imports:
            continue
        content = path.read_text()
        block = "\n".join(imports)
        if block in content:
            continue
        pkg_match = re.search(r"^package\s+(\S+)", content, flags=re.M)
        if not pkg_match:
            continue
        entity_pkg = pkg_match.group(1)
        content = re.sub(
            rf"^package {re.escape(entity_pkg)}\n",
            f"package {entity_pkg}\n\n{block}\n",
            content,
            count=1,
            flags=re.M,
        )
        path.write_text(content)


def inject_import(path: Path, import_line: str) -> None:
    content = path.read_text()
    if import_line in content:
        return
    content = re.sub(r"^(package\s+\S+\n)", rf"\1\n{import_line}\n", content, count=1, flags=re.M)
    path.write_text(content)


def add_shared_row_imports() -> None:
    level_rows = {
        "comment": "CommentRow",
        "rating": "RatingRow",
        "submission": "SubmissionRow",
        "slot_assignment": "LevelSlotAssignmentRow",
        "level": "LevelRow",
        "favorite": "LevelRow",
    }
    for entity, row in level_rows.items():
        entity_dir = MICROSERVICE / "level" / "tables" / entity
        if not entity_dir.is_dir():
            continue
        import_line = f"import microservice.level.tables.shared.{row}"
        for path in entity_dir.rglob("*.scala"):
            inject_import(path, import_line)

    bird_rows = {
        "design": "BirdDesignRow",
        "submission": "BirdSubmissionRow",
    }
    for entity, row in bird_rows.items():
        entity_dir = MICROSERVICE / "bird" / "tables" / entity
        if not entity_dir.is_dir():
            continue
        import_line = f"import microservice.bird.tables.shared.{row}"
        for path in entity_dir.rglob("*.scala"):
            inject_import(path, import_line)


def main() -> None:
    register_symbols()
    changed = sum(rewrite_file(path) for path in MICROSERVICE.rglob("*.scala"))
    add_facade_subpackage_imports()
    add_shared_row_imports()
    print(f"Symbol map size: {len(SYMBOL_MAP)}")
    print(f"Rewrote imports in {changed} files")


if __name__ == "__main__":
    main()
