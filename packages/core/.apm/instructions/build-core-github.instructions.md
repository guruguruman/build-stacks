---
description: Use GitHub through repository-native gh workflows.
applyTo: "**/*"
---

# build-core-github

Use `gh` directly for GitHub issues and pull requests. Preflight authentication and repository identity, inspect repository templates, labels, and recent examples, then match the user's language and repository tone. Do not add AI attribution or skill boilerplate.

Treat reads as inspection. Before issue edits, comments, closing, label creation, PR creation or edits, pushes, or other remote writes, show the intended delta and require explicit authorization unless the user's current request already names and authorizes that exact operation and target. Re-read remote state before writing, detect existing issues or PRs before creating, and report partial success before retrying.
