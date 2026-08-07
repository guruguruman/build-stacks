# TDD guidance

## Durable tests

- Assert observable behavior through a public interface.
- Use expected values from a specification, worked example, or other independent source.
- Prefer one tracer-bullet test and implementation at a time.
- Keep tests deterministic and fast enough for the active loop.

## Avoid

- Tests of private methods or internal call order.
- Assertions that recompute the result with the same algorithm.
- Broad snapshots without a reviewed behavioral contract.
- Mocking the module being tested or every internal collaborator.
- Writing the whole test suite before any implementation.

Use a fake only at a real environment seam. If no correct seam exists, record the architecture problem instead of adding a misleading regression test.
