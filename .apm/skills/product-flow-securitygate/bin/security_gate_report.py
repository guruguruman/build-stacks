#!/usr/bin/env python3
"""Create and validate complete product prelaunch security-gate reports."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


VERDICTS = {"PASS", "FAIL", "PARTIAL", "NOT_APPLICABLE", "NOT_VERIFIED"}
SEVERITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"}
EXPECTED_CONTROL_IDS = (
    "GOV-01", "GOV-02", "GOV-03", "GOV-04",
    "IAM-01", "IAM-02", "IAM-03", "IAM-04", "IAM-05", "IAM-06",
    "DATA-01", "DATA-02", "DATA-03", "DATA-04", "DATA-05",
    "SEC-01", "SEC-02", "SEC-03", "SEC-04",
    "APP-01", "APP-02",
    "INF-01", "INF-02", "INF-03", "INF-04", "INF-05", "INF-06",
    "OPS-01", "OPS-02", "OPS-03",
    "REG-01", "REL-01",
)
REQUIRED_DOMAINS = {
    "legal_and_data": {"GOV-01", "GOV-02", "GOV-03", "GOV-04", "REG-01"},
    "database": {"DATA-01", "DATA-02", "DATA-03", "DATA-04"},
    "auth_failure_cases": {"IAM-01", "IAM-02", "IAM-03", "IAM-04", "IAM-05"},
    "baseline_posture": {"APP-01", "APP-02", "DATA-05", "OPS-03"},
    "data_exposure": {"SEC-04", "DATA-04", "IAM-05"},
    "secret_exposure": {"SEC-01", "SEC-02", "SEC-03"},
    "rate_and_cost": {"INF-01", "INF-02"},
    "bot_protection": {"INF-03"},
    "cors_and_csrf": {"INF-04"},
    "webhook_and_async": {"INF-05"},
    "scanner_and_manual_triage": {"INF-06", "OPS-01", "OPS-02"},
    "release_and_regulated_scope": {"REG-01", "REL-01"},
}
PLACEHOLDER_VALUE_RE = re.compile(
    r"^\s*`?(?:TBD|TODO|FIXME|UNKNOWN)`?\s*[.!]?\s*$",
    re.IGNORECASE,
)
SECRET_VALUE_PATTERNS = (
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bsk_(?:live|test)_[A-Za-z0-9]{12,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"),
    re.compile(r"\b(?:ghp|github_pat|xox[bap])_[A-Za-z0-9_-]{16,}\b"),
)


@dataclass(frozen=True)
class Control:
    control_id: str
    title: str
    severity: str


def skill_dir() -> Path:
    return Path(__file__).resolve().parent.parent


def catalog_path() -> Path:
    return skill_dir() / "references" / "control-catalog.md"


def split_table_row(line: str) -> list[str]:
    cells = re.split(r"(?<!\\)\|", line.strip().strip("|"))
    return [cell.strip().replace(r"\|", "|") for cell in cells]


def parse_catalog() -> list[Control]:
    controls: list[Control] = []
    for line in catalog_path().read_text(encoding="utf-8").splitlines():
        if not re.match(r"^\|\s*[A-Z]+-\d{2}\s*\|", line):
            continue
        cells = split_table_row(line)
        if len(cells) != 5:
            raise ValueError(f"Malformed catalog row for {cells[0] if cells else 'unknown'}")
        control_id, title, severity = cells[:3]
        if severity not in SEVERITIES:
            raise ValueError(f"Invalid catalog severity for {control_id}: {severity}")
        controls.append(Control(control_id, title, severity))
    return controls


def run_git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(repo), *args],
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    return result.stdout.strip() if result.returncode == 0 else "NOT_AVAILABLE"


def make_report(repo: Path, mode: str) -> str:
    controls = parse_catalog()
    commit = run_git(repo, "rev-parse", "HEAD")
    dirty = "yes" if run_git(repo, "status", "--porcelain") else "no"
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    lines = [
        "# Product prelaunch security gate",
        "",
        f"- Audit timestamp: `{timestamp}`",
        f"- Repository: `{repo.resolve()}`",
        f"- Commit: `{commit}`",
        f"- Local changes included: `{dirty}`",
        f"- Mode: `{mode}`",
        "- Target environment: TBD",
        "- Scope: TBD",
        "- Conclusion: `TBD`",
        "",
        "## Release blockers",
        "",
        "TBD",
        "",
        "## Decisions",
        "",
        "TBD",
        "",
        "## Control results",
        "",
        "| ID | Verdict | Severity | Evidence | Finding | Remediation | Verification |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for control in controls:
        lines.append(
            f"| {control.control_id} | TBD | {control.severity} | TBD | TBD | TBD | TBD |"
        )
    lines.extend(
        [
            "",
            "## Commands executed",
            "",
            "TBD",
            "",
            "## Evidence gaps",
            "",
            "TBD",
            "",
            "## Prioritized remediation plan",
            "",
            "TBD",
            "",
            "## Specialist or external review",
            "",
            "TBD",
            "",
            "## Residual risk",
            "",
            "TBD",
            "",
            "## Next handoff",
            "",
            "TBD",
            "",
        ]
    )
    return "\n".join(lines)


def report_rows(text: str) -> tuple[dict[str, list[str]], list[str]]:
    rows: dict[str, list[str]] = {}
    errors: list[str] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        if not re.match(r"^\|\s*[A-Z]+-\d{2}\s*\|", line):
            continue
        cells = split_table_row(line)
        if len(cells) != 7:
            errors.append(f"line {line_number}: expected 7 table cells, found {len(cells)}")
            continue
        control_id = cells[0]
        if control_id in rows:
            errors.append(f"duplicate control row: {control_id}")
        rows[control_id] = cells
    return rows, errors


def conclusion_from(text: str) -> str | None:
    match = re.search(r"^- Conclusion:\s*`?(GO|CONDITIONAL GO|NO-GO)`?\s*$", text, re.MULTILINE)
    return match.group(1) if match else None


def is_placeholder_value(value: str) -> bool:
    """Match unresolved scaffold values without flagging ordinary prose."""
    return bool(PLACEHOLDER_VALUE_RE.fullmatch(value))


def line_contains_placeholder(line: str) -> bool:
    if is_placeholder_value(line):
        return True
    if line.startswith("|"):
        return any(is_placeholder_value(cell) for cell in split_table_row(line))
    if ":" in line:
        return is_placeholder_value(line.split(":", 1)[1])
    return False


def expected_conclusion(rows: dict[str, list[str]], mode: str) -> str | None:
    if mode not in {"FULL", "RAPID"}:
        return None
    blockers = any(
        row[1] in {"FAIL", "PARTIAL", "NOT_VERIFIED"}
        and row[2] in {"CRITICAL", "HIGH"}
        for row in rows.values()
    )
    if blockers:
        return "NO-GO"
    incomplete = any(row[1] not in {"PASS", "NOT_APPLICABLE"} for row in rows.values())
    return "CONDITIONAL GO" if incomplete else "GO"


def validate_report(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors: list[str] = []
    rows, row_errors = report_rows(text)
    errors.extend(row_errors)
    expected_severities = {
        control.control_id: control.severity for control in parse_catalog()
    }
    expected_ids = set(EXPECTED_CONTROL_IDS)
    actual_ids = set(rows)
    for missing in sorted(expected_ids - actual_ids):
        errors.append(f"missing control row: {missing}")
    for extra in sorted(actual_ids - expected_ids):
        errors.append(f"unknown control row: {extra}")

    for control_id in sorted(expected_ids & actual_ids):
        _, verdict, severity, evidence, finding, remediation, verification = rows[control_id]
        if verdict not in VERDICTS:
            errors.append(f"{control_id}: invalid verdict {verdict!r}")
        if severity not in SEVERITIES:
            errors.append(f"{control_id}: invalid severity {severity!r}")
        elif severity != expected_severities[control_id]:
            errors.append(
                f"{control_id}: severity {severity!r} conflicts with catalog severity "
                f"{expected_severities[control_id]!r}"
            )
        for label, value in (
            ("evidence", evidence),
            ("finding", finding),
            ("remediation", remediation),
            ("verification", verification),
        ):
            if not value or is_placeholder_value(value):
                errors.append(f"{control_id}: {label} is empty or contains a placeholder")
        if verdict == "PASS" and evidence.lower() in {"none", "n/a", "not applicable"}:
            errors.append(f"{control_id}: PASS requires positive evidence")
        if verdict == "NOT_APPLICABLE" and len(evidence) < 12:
            errors.append(f"{control_id}: NOT_APPLICABLE requires architectural evidence")

    for pattern in SECRET_VALUE_PATTERNS:
        if pattern.search(text):
            errors.append("report appears to contain a secret value; redact it before continuing")
            break

    required_sections = (
        "## Release blockers",
        "## Decisions",
        "## Commands executed",
        "## Evidence gaps",
        "## Prioritized remediation plan",
        "## Specialist or external review",
        "## Residual risk",
        "## Next handoff",
    )
    for section in required_sections:
        if section not in text:
            errors.append(f"missing section: {section}")
    for field in ("Target environment", "Scope"):
        match = re.search(rf"^- {re.escape(field)}:\s*(.+)$", text, re.MULTILINE)
        if not match or is_placeholder_value(match.group(1)):
            errors.append(f"metadata field is missing or incomplete: {field}")

    mode_match = re.search(r"^- Mode:\s*`?(FULL|FOCUSED|RAPID)`?\s*$", text, re.MULTILINE)
    if not mode_match:
        errors.append("Mode must be FULL, FOCUSED, or RAPID")
        mode = ""
    else:
        mode = mode_match.group(1)

    actual_conclusion = conclusion_from(text)
    if actual_conclusion is None:
        errors.append("Conclusion must be GO, CONDITIONAL GO, or NO-GO")
    calculated = expected_conclusion(rows, mode)
    if calculated and actual_conclusion and actual_conclusion != calculated:
        errors.append(
            f"conclusion {actual_conclusion!r} conflicts with {mode}-mode control results; expected {calculated!r}"
        )
    if mode == "FOCUSED" and actual_conclusion == "GO":
        errors.append("FOCUSED reports cannot issue a release-wide GO")

    report_level_placeholder_lines = [
        line_number
        for line_number, line in enumerate(text.splitlines(), start=1)
        if line_contains_placeholder(line)
    ]
    if report_level_placeholder_lines:
        preview = ", ".join(str(number) for number in report_level_placeholder_lines[:8])
        errors.append(f"report still contains placeholders on line(s): {preview}")
    return errors


def self_check() -> list[str]:
    errors: list[str] = []
    controls = parse_catalog()
    catalog_ids = tuple(control.control_id for control in controls)
    if catalog_ids != EXPECTED_CONTROL_IDS:
        errors.append(
            "catalog IDs/order differ from validator contract: "
            f"expected {EXPECTED_CONTROL_IDS}, found {catalog_ids}"
        )
    catalog_set = set(catalog_ids)
    for domain, control_ids in REQUIRED_DOMAINS.items():
        missing = control_ids - catalog_set
        if missing:
            errors.append(f"coverage domain {domain} is missing: {sorted(missing)}")
    for required_path in (
        skill_dir() / "SKILL.md",
        skill_dir() / "references" / "control-catalog.md",
        skill_dir() / "references" / "repository-evidence-map.md",
    ):
        if not required_path.is_file():
            errors.append(f"missing required skill file: {required_path}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    new_parser = subparsers.add_parser("new", help="Create a complete security-gate report scaffold")
    new_parser.add_argument("--output", type=Path, required=True)
    new_parser.add_argument("--repo", type=Path, default=Path.cwd())
    new_parser.add_argument("--mode", choices=("FULL", "FOCUSED", "RAPID"), default="FULL")

    validate_parser = subparsers.add_parser("validate", help="Validate a completed security-gate report")
    validate_parser.add_argument("--report", type=Path, required=True)

    subparsers.add_parser("self-check", help="Validate skill structure and control coverage")
    args = parser.parse_args()

    if args.command == "new":
        if args.output.exists():
            print(f"Refusing to overwrite existing report: {args.output}", file=sys.stderr)
            return 2
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(make_report(args.repo, args.mode), encoding="utf-8")
        print(f"Created {args.output} with {len(parse_catalog())} control rows")
        return 0

    if args.command == "validate":
        if not args.report.is_file():
            print(f"Report not found: {args.report}", file=sys.stderr)
            return 2
        errors = validate_report(args.report)
    else:
        errors = self_check()

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    if args.command == "self-check":
        print(
            f"Skill coverage OK: {len(EXPECTED_CONTROL_IDS)} controls "
            f"across {len(REQUIRED_DOMAINS)} domains"
        )
    else:
        print(f"Report validation OK: {args.report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
