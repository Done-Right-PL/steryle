#!/usr/bin/env bash
# Deploy the Steryle SST backend (API Gateway + Lambda + DynamoDB).
#
# Usage:
#   ./scripts/deploy-backend.sh
#   pnpm deploy:backend
#
# Env overrides:
#   AWS_PROFILE   default: steryle-admin
#   AWS_REGION    default: ap-south-1

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Always target the Steryle account unless explicitly overridden.
# Do NOT inherit ambient AWS_PROFILE / AWS_REGION from the shell — that caused
# a deploy into the wrong account when another profile was exported.
AWS_PROFILE="${STERYLE_AWS_PROFILE:-steryle-admin}"
AWS_REGION="${STERYLE_AWS_REGION:-ap-south-1}"
stage="production"

export AWS_PROFILE AWS_REGION

echo "==> Steryle backend deploy"
echo "    stage:   $stage"
echo "    profile: $AWS_PROFILE"
echo "    region:  $AWS_REGION"
echo

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install: corepack enable && corepack prepare pnpm@9.15.0 --activate" >&2
  exit 1
fi

if ! aws sts get-caller-identity --profile "$AWS_PROFILE" >/dev/null 2>&1; then
  echo "AWS profile '$AWS_PROFILE' is not usable (login / credentials)." >&2
  exit 1
fi

echo "==> sst deploy --stage $stage"
pnpm exec sst deploy --stage "$stage"

echo
echo "==> Done. Outputs:"
if [[ -f .sst/outputs.json ]]; then
  if command -v jq >/dev/null 2>&1; then
    jq . .sst/outputs.json
  else
    cat .sst/outputs.json
  fi
else
  echo "(no .sst/outputs.json — check SST console permalink above)"
fi

echo
echo "Public API: https://api.steryle.in"
echo "Amplify env: API_URL / NEXT_PUBLIC_API_URL = https://api.steryle.in"
echo "Admin/local: TABLE_NAME=<table from outputs> AWS_PROFILE=$AWS_PROFILE"
