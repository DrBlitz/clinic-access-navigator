# Product feedback — grounded draft

These notes distinguish implementation evidence from personal opinion. The final “would you use it again?” answer belongs to the builder and remains to be confirmed. Do not submit a claim of using a tool that was only researched or packaged.

## Alexa+ track / MCP open-standard path

**Used for:** A web-based simulated clinic-access experience. The implementation is a self-hosted MCP 2025-11-25 server and real Streamable HTTP client; Amazon's gated Alexa+ SDK, CLI, toolkit and simulator were not accessed.

**What worked:** One tool schema describes the four read-only capabilities. The same shared server code runs behind the Site route, a local Node HTTP server, and a prepared Lambda adapter. Initialization, tool discovery and calls are visible in the interface. The local implementation passes 13 tests.

**What needs work:** The path from “Alexa+ hackathon” to a valid open-standard submission should be explained before participants encounter partner-only SDK setup instructions. A clearly linked, minimal Streamable HTTP web simulator with initialize/list/call, JSON/SSE handling and deployment authentication examples would reduce uncertainty. The current Devpost FAQ provides essential clarification that a real MCP web client is sufficient.

**Onboarding:** The project proceeded through the open MCP standard and its own simulator. No claim is made about onboarding to Amazon's restricted preview tools.

**Reuse assessment:** The portable tool contract is a useful basis for future administrative integrations. **Builder confirmation needed:** would you personally use this approach again, and why?

## AWS CloudShell, AWS CLI and AWS SAM CLI

**Used for:** Preparing the account and deployment environment. The builder previously confirmed account registration, MFA, AWS CLI 2.36.46 and SAM CLI 1.164.0. The finishing package supplies SAM packaging/validation and signed endpoint-test scripts.

**What worked:** The earlier CloudShell version checks established that the required command-line tools were available without a local workstation installation. Application tests and the Lambda adapter can be exercised without deploying resources.

**What needs work:** An end-to-end reference for IAM-protected MCP on HTTP API would be useful: SAM template, signed initialize/list/call requests, negative authorization tests, and a renewable identity pattern for a separately hosted browser application's backend.

**Onboarding:** Account and MFA setup were completed. SAM validation, cloud deployment and signed invocation are not yet evidenced in this finishing session. Do not invent deployment duration, costs, errors or success.

**Reuse assessment:** **Builder confirmation needed after deployment testing.**

## AWS Lambda, Amazon API Gateway and CloudWatch — conditional section

Do not report these as tested runtime services until `scripts/aws-smoke.mjs` passes against the actual stack.

**Prepared use:** Lambda Node.js 22 executes the shared MCP code; API Gateway HTTP API enforces IAM authorization and throttling; CloudWatch has a seven-day log retention policy. The app does not intentionally log request bodies.

After successful deployment, record:
- Which services actually deployed and the date.
- Whether unsigned requests were rejected and signed requests succeeded.
- How onboarding felt, including exact observed errors and workarounds, if any.
- What worked well and what needs improvement from that actual test.
- Whether you would use each service again, and why.

The validation receipt provides technical evidence, but it does not establish user satisfaction or billing outcomes.

## Other tools actually used in implementation

- **ChatGPT Sites:** hosts the working React interface and MCP endpoint; its deployment results and local checks can be reported. It is not an Amazon service.
- **Node.js / React / TypeScript:** application runtime and UI tooling. The dependency-free local review path avoids a framework install for basic judging.
- **AWS SDK / Bedrock / AgentCore / Strands / Kiro / Fire TV / Ring / Bee:** not used; do not list as used.

## Optional friction log entry grounded in this finishing work

- Task: Make the existing simulator's full MCP lifecycle visible and reviewable.
- Observed: The recovered client initialized and invoked a tool but did not perform tools/list; the earlier UI did not show the protocol sequence.
- Change: Added discovery, response validation, JSON/SSE parsing, a visible exchange panel and tests.
- Severity: Moderate for judging transparency and interoperability.
- Suggestion to starter maintainers: ship a minimal client that shows the whole lifecycle and makes failures explicit.
- Attribution: An application implementation gap, **not a proven Amazon defect**.

Earlier UUID and Sites hosting-manifest notes in `docs/friction-log.md` are historical non-Amazon environment notes; they should not be presented as Amazon product failures or newly reproduced issues.
