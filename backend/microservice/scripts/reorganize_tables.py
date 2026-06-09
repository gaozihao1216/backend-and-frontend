#!/usr/bin/env python3
"""Reorganize microservice table sources into entity folders."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
MICROSERVICE = ROOT

ENTITY_RULES: dict[str, list[tuple[str, str]]] = {
    "auth": [("User", "user")],
    "level": [
        ("LevelSlotAssignment", "slot_assignment"),
        ("LevelRowMapper", "shared"),
        ("LevelRows", "shared"),
        ("Level", "level"),
        ("Comment", "comment"),
        ("Favorite", "favorite"),
        ("Rating", "rating"),
        ("Submission", "submission"),
    ],
    "player": [
        ("CheckInPanelReward", "check_in_panel_reward"),
        ("PlayerWeeklyCheckIn", "weekly_check_in"),
        ("PlayerWallet", "wallet"),
        ("PlayerLevelProgress", "progress"),
        ("PlayerLegacyCheckIn", "progress"),
        ("PlayerProgress", "progress"),
        ("PlayerPreparation", "preparation"),
        ("PlayerPrivateMessage", "social"),
        ("PlayerFriend", "social"),
        ("PlayerSocial", "social"),
        ("Shop", "shop"),
    ],
    "bird": [
        ("BirdSkillConfig", "skill_config"),
        ("BirdSubmission", "submission"),
        ("BirdDesign", "design"),
        ("BirdRowMapper", "shared"),
        ("BirdRows", "shared"),
    ],
    "ui": [
        ("StretchVisualTemplate", "stretch_visual_template"),
        ("ButtonTemplate", "button_template"),
        ("UiPage", "ui_page"),
    ],
}

IMPORT_REWRITES: dict[str, str] = {}


def entity_for_name(name: str, domain: str) -> str:
    for prefix, entity in ENTITY_RULES[domain]:
        if name.startswith(prefix):
            return entity
    raise ValueError(f"No entity mapping for {domain}/{name}")


def subfolder_for_name(name: str) -> str | None:
    if "InMemory" in name:
        return "inmemory"
    if "Jdbc" in name:
        return "jdbc"
    return None


def package_for(domain: str, entity: str, subfolder: str | None) -> str:
    base = f"microservice.{domain}.tables.{entity}"
    return f"{base}.{subfolder}" if subfolder else base


def register_public_symbols(domain: str, entity: str, subfolder: str | None, path: Path) -> None:
    content = path.read_text()
    pkg = package_for(domain, entity, subfolder)
    for name in re.findall(r"^(?:object|final case class|case class)\s+(\w+)", content, flags=re.M):
        old = f"microservice.{domain}.tables.{name}"
        IMPORT_REWRITES[old] = f"{pkg}.{name}"


def add_same_entity_imports(domain: str, entity: str, subfolder: str) -> None:
    if subfolder not in {"jdbc", "inmemory"}:
        return
    parent_pkg = package_for(domain, entity, None)
    current_pkg = package_for(domain, entity, subfolder)
    tables_dir = MICROSERVICE / domain / "tables" / entity / subfolder
    for path in tables_dir.glob("*.scala"):
        content = path.read_text()
        import_line = f"import {parent_pkg}._"
        if import_line in content:
            continue
        content = re.sub(
            rf"^package {re.escape(current_pkg)}\n",
            f"package {current_pkg}\n\n{import_line}\n",
            content,
            count=1,
            flags=re.M,
        )
        path.write_text(content)


def update_package_line(content: str, new_package: str) -> str:
    if not re.search(r"^package\s+", content, flags=re.M):
        return f"package {new_package}\n\n{content}"
    return re.sub(r"^package\s+[^\n]+", f"package {new_package}", content, count=1, flags=re.M)


def move_table_files() -> None:
    for domain, _rules in ENTITY_RULES.items():
        tables_dir = MICROSERVICE / domain / "tables"
        if not tables_dir.is_dir():
            continue

        for source in sorted(tables_dir.glob("*.scala")):
            stem = source.stem
            entity = entity_for_name(stem, domain)
            subfolder = subfolder_for_name(stem)
            target_dir = tables_dir / entity / (subfolder or ".")
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / source.name
            content = update_package_line(source.read_text(), package_for(domain, entity, subfolder))
            target.write_text(content)
            source.unlink()
            register_public_symbols(domain, entity, subfolder, target)
            if subfolder:
                add_same_entity_imports(domain, entity, subfolder)


def rewrite_imports_in_file(path: Path) -> bool:
    content = path.read_text()
    original = content

    for old, new in sorted(IMPORT_REWRITES.items(), key=lambda item: -len(item[0])):
        content = content.replace(old, new)

    if content != original:
        path.write_text(content)
        return True
    return False


def rewrite_all_imports() -> int:
    changed = 0
    for path in MICROSERVICE.rglob("*.scala"):
        if rewrite_imports_in_file(path):
            changed += 1
    return changed


def add_cross_entity_imports() -> None:
    """Add explicit imports for common cross-entity table references."""
    patches: list[tuple[str, str, list[str]]] = [
        (
            "level/tables/favorite/jdbc/FavoriteTableJdbcRead.scala",
            "microservice.level.tables.favorite.jdbc",
            [
                "import microservice.level.tables.level.jdbc.LevelTableJdbcRead",
                "import microservice.level.tables.shared.LevelRow",
            ],
        ),
    ]

    for rel_path, package_name, imports in patches:
        path = MICROSERVICE / rel_path
        if not path.exists():
            continue
        content = path.read_text()
        block = "\n".join(imports)
        if block in content:
            continue
        content = re.sub(
            rf"^package {re.escape(package_name)}\n",
            f"package {package_name}\n\n{block}\n",
            content,
            count=1,
            flags=re.M,
        )
        path.write_text(content)


def main() -> None:
    move_table_files()
    rewrite_all_imports()
    add_cross_entity_imports()
    print(f"Moved table files into entity folders.")
    print(f"Registered {len(IMPORT_REWRITES)} symbol import rewrites.")


if __name__ == "__main__":
    main()
