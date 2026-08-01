#!/usr/bin/env python3
"""Unit tests for the product prelaunch security-gate completeness contract."""

from __future__ import annotations

import re
import sys
import tempfile
import unittest
from pathlib import Path

SKILL_BIN = Path(__file__).resolve().parents[2] / ".apm" / "skills" / "product-flow-securitygate" / "bin"
sys.path.insert(0, str(SKILL_BIN))

import security_gate_report


def completed_report(mode: str = "FULL") -> str:
    source = security_gate_report.make_report(Path.cwd(), mode)
    severities = {
        control.control_id: control.severity for control in security_gate_report.parse_catalog()
    }
    result: list[str] = []
    for line in source.splitlines():
        if line == "- Target environment: TBD":
            result.append("- Target environment: local static repository evidence")
        elif line == "- Scope: TBD":
            result.append("- Scope: synthetic validator test covering all controls")
        elif line == "- Conclusion: `TBD`":
            result.append("- Conclusion: `GO`")
        elif line == "TBD":
            result.append("None identified in this synthetic validator test.")
        elif re.match(r"^- (?:Baseline posture|OWASP pass|Data-exposure pass|Secret-boundary pass): TBD$", line):
            label = line.split(":", 1)[0]
            result.append(f"{label}: Synthetic evidence covers this mandatory pass.")
        elif re.match(r"^\d+\. TBD$", line):
            number = line.split(".", 1)[0]
            result.append(f"{number}. Synthetic evidence covers mandatory failure scenario {number}.")
        elif line.startswith("| ") and line.split("|")[1].strip() in security_gate_report.EXPECTED_CONTROL_IDS:
            control_id = line.split("|")[1].strip()
            result.append(
                f"| {control_id} | PASS | {severities[control_id]} | "
                f"`synthetic/test:{control_id}` | Control satisfied in validator fixture. | "
                "None required. | Re-run fixture validation. |"
            )
        else:
            result.append(line)
    return "\n".join(result) + "\n"


class SecurityGateReportTests(unittest.TestCase):
    def validate_text(self, text: str) -> list[str]:
        with tempfile.TemporaryDirectory(prefix="product-security-audit-test-") as directory:
            report = Path(directory) / "report.md"
            report.write_text(text, encoding="utf-8")
            return security_gate_report.validate_report(report)

    def test_catalog_contract_and_domain_coverage(self) -> None:
        self.assertEqual([], security_gate_report.self_check())
        self.assertEqual(32, len(security_gate_report.parse_catalog()))
        self.assertEqual(12, len(security_gate_report.REQUIRED_DOMAINS))

    def test_complete_report_is_accepted(self) -> None:
        self.assertEqual([], self.validate_text(completed_report()))

    def test_placeholder_word_in_normal_prose_is_accepted(self) -> None:
        text = completed_report().replace(
            "Control satisfied in validator fixture.",
            "Unknown-field rejection is enforced by the validator fixture.",
            1,
        )
        self.assertEqual([], self.validate_text(text))

    def test_escaped_markdown_pipe_is_accepted(self) -> None:
        text = completed_report().replace(
            "`synthetic/test:GOV-01`",
            r"`synthetic/test:GOV-01\|branch`",
        )
        self.assertEqual([], self.validate_text(text))

    def test_generated_scaffold_is_rejected(self) -> None:
        errors = self.validate_text(security_gate_report.make_report(Path.cwd(), "FULL"))
        self.assertTrue(any("placeholder" in error.lower() for error in errors))

    def test_missing_control_is_rejected(self) -> None:
        text = "\n".join(
            line for line in completed_report().splitlines()
            if not line.startswith("| GOV-01 |")
        )
        self.assertIn("missing control row: GOV-01", self.validate_text(text))

    def test_full_blocker_requires_no_go(self) -> None:
        text = completed_report().replace(
            "| IAM-05 | PASS | CRITICAL |",
            "| IAM-05 | FAIL | CRITICAL |",
        )
        errors = self.validate_text(text)
        self.assertTrue(any("expected 'NO-GO'" in error for error in errors))
        text = text.replace("- Conclusion: `GO`", "- Conclusion: `NO-GO`")
        self.assertEqual([], self.validate_text(text))

    def test_rapid_high_failure_requires_no_go(self) -> None:
        text = completed_report("RAPID").replace(
            "| IAM-02 | PASS | HIGH |",
            "| IAM-02 | FAIL | HIGH |",
        )
        errors = self.validate_text(text)
        self.assertTrue(
            any("RAPID-mode" in error and "expected 'NO-GO'" in error for error in errors)
        )
        text = text.replace("- Conclusion: `GO`", "- Conclusion: `NO-GO`")
        self.assertEqual([], self.validate_text(text))

    def test_focused_report_cannot_issue_go(self) -> None:
        text = completed_report("FOCUSED")
        errors = self.validate_text(text)
        self.assertIn("FOCUSED reports cannot issue a release-wide GO", errors)
        text = text.replace("- Conclusion: `GO`", "- Conclusion: `CONDITIONAL GO`")
        self.assertEqual([], self.validate_text(text))

    def test_secret_value_is_rejected(self) -> None:
        synthetic_stripe_key = "_".join(("sk", "live", "1234567890abcdefghijklmnop"))
        text = completed_report().replace(
            "`synthetic/test:GOV-01`",
            f"`{synthetic_stripe_key}`",
        )
        errors = self.validate_text(text)
        self.assertTrue(any("secret value" in error for error in errors))

    def test_catalog_severity_cannot_be_downgraded(self) -> None:
        text = completed_report().replace(
            "| IAM-05 | PASS | CRITICAL |",
            "| IAM-05 | PASS | LOW |",
        )
        errors = self.validate_text(text)
        self.assertIn(
            "IAM-05: severity 'LOW' conflicts with catalog severity 'CRITICAL'",
            errors,
        )

    def test_missing_mandatory_failure_scenario_is_rejected(self) -> None:
        text = completed_report().replace(
            "7. Synthetic evidence covers mandatory failure scenario 7.\n",
            "",
        )
        self.assertIn(
            "mandatory failure scenario is missing or incomplete: 7",
            self.validate_text(text),
        )

    def test_missing_mandatory_pass_is_rejected(self) -> None:
        text = completed_report().replace(
            "- OWASP pass: Synthetic evidence covers this mandatory pass.\n",
            "",
        )
        self.assertIn(
            "mandatory audit pass is missing or incomplete: OWASP pass",
            self.validate_text(text),
        )


if __name__ == "__main__":
    unittest.main()
