#!/usr/bin/env bash
# Pushes one client's execution credentials from a local, gitignored
# tests/<client_id>/.env file into this repo's GitHub Actions secrets.
#
# Real values never touch git -- this script is the only bridge between the
# local file (your convenient, easy-to-edit copy) and GitHub's encrypted
# secret store (what execute-tests.yml actually reads at run time).
#
# Usage: scripts/push-client-secrets.sh <client_id>
#   e.g. scripts/push-client-secrets.sh test-ai
set -euo pipefail

REPO="himanshi202/rgt-ai-generated-tests"
CLIENT_ID="${1:?Usage: scripts/push-client-secrets.sh <client_id>}"
CLIENT_DIR="tests/${CLIENT_ID}"
ENV_FILE="${CLIENT_DIR}/.env"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "No such client folder: $CLIENT_DIR -- check the client_id spelling against tests/*/." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE -- copy ${CLIENT_DIR}/.env.example to $ENV_FILE and fill in real values first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${BASE_URL:?BASE_URL not set in $ENV_FILE}"
: "${TEST_USERNAME:?TEST_USERNAME not set in $ENV_FILE}"
: "${TEST_PASSWORD:?TEST_PASSWORD not set in $ENV_FILE}"

# GitHub secret names can't contain hyphens -- test-ai -> TEST_AI.
PREFIX=$(echo "$CLIENT_ID" | tr '[:lower:]-' '[:upper:]_')

gh secret set "${PREFIX}_BASE_URL" --repo "$REPO" --body "$BASE_URL"
gh secret set "${PREFIX}_TEST_USERNAME" --repo "$REPO" --body "$TEST_USERNAME"
gh secret set "${PREFIX}_TEST_PASSWORD" --repo "$REPO" --body "$TEST_PASSWORD"

echo "Pushed ${PREFIX}_BASE_URL / ${PREFIX}_TEST_USERNAME / ${PREFIX}_TEST_PASSWORD for '$CLIENT_ID'."
