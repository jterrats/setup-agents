#!/usr/bin/env bash
# =============================================================================
# e2e-test.sh — End-to-end tests for sf setup-agents local
#
# Two test suites:
#   1. Profile suite   — one fresh SF project per profile; all tools configured.
#   2. Detection suite — validates that detectTools picks the right tool based on
#                        which indicator directory exists in the project.
#
# Usage:
#   ./scripts/e2e-test.sh              # all profiles + detection tests
#   ./scripts/e2e-test.sh developer    # single profile only (skips detection)
#   ./scripts/e2e-test.sh --clean      # wipe tests/ then run everything
# =============================================================================
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TESTS_DIR="${PLUGIN_DIR}/tests"
PASS=0
FAIL=0

# ─── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Assertion helpers ────────────────────────────────────────────────────────
pass()    { echo -e "  ${GREEN}✔${NC} $1"; ((PASS++)) || true; }
fail()    { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)) || true; }
section() { echo -e "\n  ${BOLD}$1${NC}"; }

expect_file() {
  local file="$1" desc="$2"
  if [[ -f "$file" ]]; then pass "$desc"
  else fail "$desc  ${RED}(missing: ${file##*/})${NC}"; fi
}

expect_no_file() {
  local file="$1" desc="$2"
  if [[ ! -f "$file" ]]; then pass "$desc"
  else fail "$desc  ${RED}(should not exist: ${file##*/})${NC}"; fi
}

expect_content() {
  local file="$1" pattern="$2" desc="$3"
  if grep -q "$pattern" "$file" 2>/dev/null; then pass "$desc"
  else fail "$desc  ${RED}(pattern '${pattern}' not found)${NC}"; fi
}

# ─── Project factories ────────────────────────────────────────────────────────
# new_project <name> — full SF project via sf project generate (Suite 1)
new_project() {
  local name="$1"
  local project_dir="${TESTS_DIR}/${name}"
  rm -rf "$project_dir"
  sf project generate \
    --name "$name" \
    --output-dir "$TESTS_DIR" \
    --json > /dev/null 2>&1
  echo "$project_dir"
}

# new_minimal_project <name> — bare-minimum SF project (Suite 2 detection tests).
# Only sfdx-project.json is created so detectTools sees exactly what we add.
# sf project generate creates .github/workflows which would pollute detection.
new_minimal_project() {
  local name="$1"
  local project_dir="${TESTS_DIR}/${name}"
  rm -rf "$project_dir"
  mkdir -p "${project_dir}/force-app/main/default"
  printf '{"packageDirectories":[{"path":"force-app","default":true}],"sourceApiVersion":"62.0"}\n' \
    > "${project_dir}/sfdx-project.json"
  echo "$project_dir"
}

# ─── Suite 1: Per-profile ─────────────────────────────────────────────────────
run_profile_test() {
  local profile="${1:-}"
  local label="${profile:-no-profile (defaults to developer)}"

  echo ""
  echo -e "${CYAN}── profile: ${label} ──${NC}"

  local project_name="test-${profile:-no-profile}"
  local project_dir
  project_dir="$(new_project "$project_name")"

  # Pre-create all four tool indicator dirs/files so detectTools activates
  # cursor, vscode, codex AND agentforce in every profile test.
  mkdir -p \
    "${project_dir}/.cursor" \
    "${project_dir}/.vscode" \
    "${project_dir}/.a4drules"
  touch "${project_dir}/AGENTS.md"

  pushd "$project_dir" > /dev/null

  # Always pass --profile to avoid @inquirer/prompts opening /dev/tty directly.
  # @inquirer/prompts bypasses stdin redirects, so the only safe way to suppress
  # interactive prompts in e2e is to pass all required flags explicitly.
  local effective_profile="${profile:-developer}"
  local cmd_args=(--force --profile "$effective_profile")

  echo -e "  Running: sf setup-agents local ${cmd_args[*]}"
  sf setup-agents local "${cmd_args[@]}" 2>&1 | sed 's/^/  │ /'

  # ── Common files (every run) ────────────────────────────────────────────────
  section "[Cursor]"
  expect_file ".cursor/rules/agent-guidelines.mdc"     "agent-guidelines.mdc"
  expect_file ".cursor/rules/sub-agent-protocol.mdc"   "sub-agent-protocol.mdc"
  expect_file ".cursor/rules/salesforce-standards.mdc" "salesforce-standards.mdc (SF project)"

  section "[VS Code / Copilot]"
  expect_file ".github/copilot-instructions.md" "copilot-instructions.md"
  expect_file ".vscode/extensions.json"         "extensions.json"

  section "[Codex]"
  expect_file "AGENTS.md" "AGENTS.md"

  section "[Agentforce]"
  expect_file ".a4drules/00-base-guidelines.md"      "00-base-guidelines.md"
  expect_file ".a4drules/01-salesforce-standards.md" "01-salesforce-standards.md"
  expect_file ".a4drules/99-sub-agent-protocol.md"   "99-sub-agent-protocol.md"
  expect_file ".a4drules/workflows/deploy.md"        "workflows/deploy.md"
  expect_file ".a4drules/workflows/run-tests.md"     "workflows/run-tests.md"
  expect_file ".a4drules/workflows/validate.md"      "workflows/validate.md"

  section "[Version]"
  expect_content ".cursor/rules/agent-guidelines.mdc" "pluginVersion:"   "pluginVersion in agent-guidelines.mdc"
  expect_content "AGENTS.md"                          "setup-agents:"    "setup-agents comment in AGENTS.md"
  expect_content ".a4drules/00-base-guidelines.md"    "setup-agents:"    "setup-agents comment in .a4drules"

  # ── Profile-specific files ──────────────────────────────────────────────────
  if [[ -n "$profile" ]]; then
    section "[Profile: $profile]"
    case "$profile" in
      developer)
        expect_file ".cursor/rules/developer-standards.mdc"   "developer-standards.mdc"
        expect_file ".a4drules/workflows/create-apex-class.md" "workflows/create-apex-class.md"
        expect_file ".a4drules/workflows/create-lwc.md"        "workflows/create-lwc.md"
        expect_file ".a4drules/workflows/create-trigger.md"    "workflows/create-trigger.md"
        ;;
      architect)
        expect_file ".cursor/rules/architect-standards.mdc" "architect-standards.mdc"
        expect_file ".a4drules/workflows/adr.md"            "workflows/adr.md"
        ;;
      ba)
        expect_file ".cursor/rules/ba-standards.mdc" "ba-standards.mdc"
        ;;
      mulesoft)
        expect_file ".cursor/rules/mulesoft-standards.mdc" "mulesoft-standards.mdc"
        ;;
      ux)
        expect_file ".cursor/rules/ux-standards.mdc" "ux-standards.mdc"
        ;;
      cgcloud)
        expect_file ".cursor/rules/cgcloud-standards.mdc" "cgcloud-standards.mdc"
        ;;
      devops)
        expect_file ".cursor/rules/devops-standards.mdc"          "devops-standards.mdc"
        expect_file ".a4drules/workflows/release.md"              "workflows/release.md"
        expect_file ".a4drules/workflows/create-scratch-org.md"   "workflows/create-scratch-org.md"
        ;;
      qa)
        expect_file ".cursor/rules/qa-standards.mdc"              "qa-standards.mdc"
        expect_file ".a4drules/workflows/run-playwright.md"       "workflows/run-playwright.md"
        expect_file ".a4drules/workflows/generate-test-report.md" "workflows/generate-test-report.md"
        ;;
      crma)
        expect_file ".cursor/rules/analytics-standards.mdc"   "analytics-standards.mdc"
        expect_file ".a4drules/workflows/deploy-analytics.md" "workflows/deploy-analytics.md"
        ;;
      data360)
        expect_file ".cursor/rules/data360-standards.mdc" "data360-standards.mdc"
        ;;
    esac
  else
    # No profile specified → we default to developer for e2e.
    # The "no profile → developer default" path is covered by unit tests.
    section "[Default profile: developer]"
    expect_file ".cursor/rules/developer-standards.mdc" "developer-standards.mdc (default)"
    expect_file ".a4drules/workflows/create-apex-class.md" "workflows/create-apex-class.md (default)"
  fi

  popd > /dev/null
}

# ─── Suite 2: Tool detection ──────────────────────────────────────────────────
run_detection_tests() {
  echo ""
  echo -e "${YELLOW}════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  Suite 2: Tool Detection${NC}"
  echo -e "${YELLOW}════════════════════════════════════════${NC}"

  # ── Only .cursor present → only cursor configured ────────────────────────────
  echo ""
  echo -e "${CYAN}── detect: only .cursor ──${NC}"
  local dir
  dir="$(new_minimal_project "detect-cursor-only")"
  mkdir -p "${dir}/.cursor"
  pushd "$dir" > /dev/null
  sf setup-agents local --profile developer --force 2>&1 | sed 's/^/  │ /'
  section "[Cursor configured]"
  expect_file ".cursor/rules/agent-guidelines.mdc" "cursor rules created"
  section "[VS Code NOT configured (no .vscode)]"
  expect_no_file ".github/copilot-instructions.md" "copilot-instructions.md absent"
  section "[Codex NOT configured (no AGENTS.md)]"
  expect_no_file "AGENTS.md" "AGENTS.md absent"
  section "[Agentforce NOT configured (no .a4drules)]"
  expect_no_file ".a4drules/00-base-guidelines.md" ".a4drules absent"
  popd > /dev/null

  # ── Only .vscode present → only vscode configured ────────────────────────────
  echo ""
  echo -e "${CYAN}── detect: only .vscode ──${NC}"
  dir="$(new_minimal_project "detect-vscode-only")"
  mkdir -p "${dir}/.vscode"
  pushd "$dir" > /dev/null
  sf setup-agents local --profile developer --force 2>&1 | sed 's/^/  │ /'
  section "[VS Code configured]"
  expect_file ".github/copilot-instructions.md" "copilot-instructions.md created"
  expect_file ".vscode/extensions.json"         "extensions.json created"
  section "[Cursor NOT configured (no .cursor)]"
  expect_no_file ".cursor/rules/agent-guidelines.mdc" "cursor rules absent"
  section "[Codex NOT configured]"
  expect_no_file "AGENTS.md" "AGENTS.md absent"
  popd > /dev/null

  # ── Only AGENTS.md present → only codex configured ────────────────────────────
  echo ""
  echo -e "${CYAN}── detect: only AGENTS.md ──${NC}"
  dir="$(new_minimal_project "detect-codex-only")"
  # Touch AGENTS.md to trigger detection
  touch "${dir}/AGENTS.md"
  pushd "$dir" > /dev/null
  sf setup-agents local --profile developer --force 2>&1 | sed 's/^/  │ /'
  section "[Codex configured]"
  expect_file "AGENTS.md" "AGENTS.md updated"
  section "[Cursor NOT configured]"
  expect_no_file ".cursor/rules/agent-guidelines.mdc" "cursor rules absent"
  section "[Agentforce NOT configured]"
  expect_no_file ".a4drules/00-base-guidelines.md" ".a4drules absent"
  popd > /dev/null

  # ── Only .a4drules present → only agentforce configured ───────────────────────
  echo ""
  echo -e "${CYAN}── detect: only .a4drules ──${NC}"
  dir="$(new_minimal_project "detect-agentforce-only")"
  mkdir -p "${dir}/.a4drules"
  pushd "$dir" > /dev/null
  sf setup-agents local --profile developer --force 2>&1 | sed 's/^/  │ /'
  section "[Agentforce configured]"
  expect_file ".a4drules/00-base-guidelines.md" ".a4drules/00-base-guidelines.md created"
  section "[Cursor NOT configured]"
  expect_no_file ".cursor/rules/agent-guidelines.mdc" "cursor rules absent"
  section "[VS Code NOT configured (no .vscode)]"
  expect_no_file ".github/copilot-instructions.md" "copilot-instructions.md absent"
  popd > /dev/null

  # ── No indicators → ALL tools configured ──────────────────────────────────────
  echo ""
  echo -e "${CYAN}── detect: no indicators → all tools ──${NC}"
  dir="$(new_minimal_project "detect-all-fallback")"
  pushd "$dir" > /dev/null
  sf setup-agents local --profile developer --force 2>&1 | sed 's/^/  │ /'
  section "[All tools configured]"
  expect_file ".cursor/rules/agent-guidelines.mdc" "cursor rules created"
  expect_file ".github/copilot-instructions.md"    "copilot-instructions.md created"
  expect_file "AGENTS.md"                          "AGENTS.md created"
  expect_file ".a4drules/00-base-guidelines.md"    ".a4drules created"
  popd > /dev/null
}

# =============================================================================
# Entry point
# =============================================================================

# Handle --clean flag
if [[ "${1:-}" == "--clean" ]]; then
  echo -e "${YELLOW}Cleaning tests/ ...${NC}"
  find "$TESTS_DIR" -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
  shift
fi

# Ensure tests/ directory exists
mkdir -p "$TESTS_DIR"

# Link the local plugin so `sf setup-agents local` resolves to current source
echo -e "${YELLOW}Linking plugin from ${PLUGIN_DIR} ...${NC}"
sf plugins link "$PLUGIN_DIR" 2>&1 | tail -2
echo ""

echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Suite 1: Profiles${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

ALL_PROFILES=(developer architect ba mulesoft ux cgcloud devops qa crma data360)

# Allow narrowing to specific profiles via CLI args
PROFILES_TO_RUN=("${@:-${ALL_PROFILES[@]}}")

for profile in "${PROFILES_TO_RUN[@]}"; do
  run_profile_test "$profile"
done

# No-profile case always runs
run_profile_test ""

# Run detection suite only when no specific profiles were requested
if [[ $# -eq 0 ]]; then
  run_detection_tests
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${YELLOW}════════════════════════════════════════${NC}"
printf "  ${GREEN}Passed: %-4s${NC}  ${RED}Failed: %-4s${NC}\n" "$PASS" "$FAIL"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "  Projects saved to: ${BOLD}${TESTS_DIR}/${NC}"
echo ""

[[ $FAIL -eq 0 ]]
