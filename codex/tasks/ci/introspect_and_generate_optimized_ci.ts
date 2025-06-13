export default {
  summary: "Introspect Python test environment and generate an optimized CI workflow",
  scope: "api",
  changes: [
    {
      file: ".github/workflows/ci.yml",
      description: "Create a clean GitHub Actions workflow based on poetry, pytest, ruff, and API test structure",
      content: `# ✅ Codex will generate this file after checking:
# - python version from pyproject.toml
# - use of poetry
# - presence of ruff for linting
# - pytest or make test usage
# - whether env vars are required for tests

# 🚀 After introspection, Codex will scaffold:
# - Setup Python
# - Install poetry
# - Cache dependencies
# - Run tests using correct commands
# - Optionally run lint step if present
# - Trigger only when relevant files change (api/**, tests/**, .github/workflows/**)

# Codex: Begin with environment scan before writing CI config.
`
    }
  ]
};
