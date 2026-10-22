#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export AWS_REGION="${AWS_REGION:-us-east-2}"
export AWS_DEFAULT_REGION="$AWS_REGION"
aws --version
sam --version
node --version
aws sts get-caller-identity --query Arn --output text >/dev/null
printf 'Authenticated AWS session confirmed in %s. No resources created.\n' "$AWS_REGION"
node --test tests/clinic.test.mjs
node scripts/package-aws.mjs
sam validate --lint --region "$AWS_REGION" --template-file .aws-package/template.yaml
printf '\nPreflight passed. Follow aws/README.md to review and deploy the stack.\n'
