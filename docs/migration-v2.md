# Migrating to build-stacks v2

Version 2 intentionally breaks the v1 public interface.

## Required changes

1. Replace every installed or invoked `product-*` skill name with its same-suffix `build-*` name.
2. Replace `.product-build-stacks/` runtime paths with `.build-stacks/`.
3. Replace framework-owned `PRODUCT_*` environment variables with their `BUILD_*` equivalents. Product-domain variables and canonical documents such as `PRODUCT_PLAN.md` are unchanged.
4. Update the dependency to `guruguruman/build-stacks#v2.0.0`, run `apm install --target all`, then compile.
5. Remove retired generated `product-*` skill directories only after confirming the new install contains all required `build-*` skills.

There is no automatic migration of old runtime state. Copy only reviewed, non-secret artifacts that are still useful; do not copy cookies, bearer tokens, credentials, or unredacted personal data.

## Selecting a package

- Use `core` for guards, investigation, and local runtime discipline.
- Use `browser` for browser automation and QA; it includes core.
- Use `design` for interface design and finishing; it includes browser and core.
- Use `product` for discovery and product planning; it includes design, browser, and core.
- Use `delivery` for engineering review, QA, security, release, and deployment; it includes browser and core.
- Use `maintainer` for the complete stack and stack-maintenance workflows.

## Verification

```bash
apm audit --ci
apm compile --all
apm compile --validate
test -f AGENTS.md && test -f GEMINI.md
```

With APM 0.26, `--validate` validates primitives without compiling them. Run
`apm compile --all` first so installed dependency instructions produce the
consumer context files, then validate and confirm the expected context files
exist.

Maintainers of this repository should additionally run `npm run quality:verify`.
