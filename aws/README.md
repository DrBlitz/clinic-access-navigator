# AWS deployment handoff — live AWS deployment not yet verified

The recovered design is **AWS SAM → API Gateway HTTP API (IAM authorization) → Lambda Node.js 22 → the shared MCP core**, region **us-east-2 (Ohio)**. The currently working Site runs its own MCP endpoint. Deploying this stack does not automatically switch that Site to AWS.

## 1. Open your existing AWS account

Open https://console.aws.amazon.com/ in your browser. Sign in to the AWS account already registered for this project and complete MFA. Do not create a second account or paste credentials into chat. Choose **US East (Ohio), us-east-2**, then open **CloudShell** from the console toolbar.

Use CloudShell Actions → Upload file to upload the current submission ZIP. Extract it and enter the extracted `clinic-access-navigator` directory. If an older extracted copy exists, use a fresh directory so versions are not mixed.

## 2. Validate without creating resources

```sh
bash scripts/aws-preflight.sh
```

This checks the existing signed-in session, runs the tests, builds `.aws-package`, validates the SAM template. The Lambda package is plain JavaScript with no dependencies, so no local Node.js 22 build is required. It does not deploy resources. If a command fails, keep its exact error and stop at that step. No new billing alert or plan upgrade is required by these instructions.

## 3. Review and deploy

```sh
sam deploy --guided --template-file .aws-package/template.yaml --region us-east-2 --stack-name clinic-access-navigator-demo
```

Use the generated `.aws-package/template.yaml` directly; SAM packages this dependency-free handler during deployment. Choose confirmation before deployment and allow creation of the Lambda execution IAM role. Keep authorization enabled. SAM may create an artifact bucket. Review the change set: HTTP API, Lambda, execution role, invoke permission and seven-day CloudWatch log group. Proceed only if these are the expected resources. Account Free Plan limits and credits are account-specific; this is not a zero-cost guarantee. If you already have this stack, inspect its existing state before applying changes.

Copy the non-secret **Endpoint** output ending `/mcp`. The endpoint is protected by AWS Signature Version 4 and `execute-api:Invoke`.

## 4. Test the actual deployed AWS endpoint

```sh
AWS_REGION=us-east-2 node scripts/aws-smoke.mjs 'PASTE_THE_EXACT_ENDPOINT_OUTPUT_HERE'
```

This uses the current CloudShell session and curl SigV4. It checks unsigned rejection, initialization, notification acceptance, tool discovery, all four real tool calls, urgent wording, blocked origins, and GET 405. It saves `aws-validation-receipt.json` with check names and endpoint, never credentials. If it reports 403 on signed calls, inspect current session identity and invoke permission; do not remove IAM.

Bring back the endpoint and validation receipt (or the first error). They allow the AWS Builder claim and feedback to be updated from pending to tested.

## 5. Connecting the Site to AWS is a distinct task

The browser currently calls the Site's own `/api/mcp`, not API Gateway. A supported server-side signer with narrowly scoped invocation permission and credential renewal is needed for the Site-to-AWS bridge. Do not use persistent browser keys, paste CloudShell keys into chat, or claim the Site uses AWS just because the stack exists. For the hackathon, the signed AWS smoke test can separately demonstrate the portable server. Enter AWS Builder only after the deployed integration works and the demonstration/documentation describe that architecture accurately.

## Template controls

Node.js 22; 128 MiB; 10-second timeout; API throttling 2 requests/second with burst 5; seven-day log retention; exact origin checks; no allowed browser origins by default. Throttling is not a spending cap. Body contents are not logged by application code.

## Cleanup after the permitted review period

`sam delete --region us-east-2 --stack-name clinic-access-navigator-demo` removes the stack; inspect any retained build artifacts/buckets separately. Do not delete a submitted working deployment while judges need it. Devpost asks participants to freeze submitted materials after the deadline through winner announcement.
