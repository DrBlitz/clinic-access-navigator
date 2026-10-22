# Verification record

## Completed in this finishing session

- **13 Node tests passed** (`node --test tests/clinic.test.mjs`).
- Tests include real loopback HTTP requests to the standalone server, not only direct function calls.
- Covered: initialize → initialized notification → tools/list → tools/call; urgent wording before scheduling; unknown concerns; argument schemas and calendar dates; exact origins; media/Accept/version handling; malformed and oversized messages; tool errors; Manila Friday and Sunday samples; Lambda base64 events; split SSE frames; connection failures.
- The AWS smoke script passes JavaScript syntax checking; the preflight shell script passes shell syntax checking. These checks do **not** prove AWS deployment or signed access.
- Current Site metadata confirms an existing public deployment. Browser visual QA could not be completed because the browser operations did not return successfully.

- TypeScript no-emit check passed.
- Production Vinext build completed successfully.

- Public deployed MCP endpoint verified: initialization, notification HTTP 202, four-tool discovery, all four tool calls, and urgent-phrase output. Server version 0.3.0 confirmed.
- Extracted submission ZIP passed all 13 tests without installed dependencies.

## Not yet verified

- Authenticated AWS SAM validation/deployment, account credits, signed cloud requests, and Site-to-AWS integration.
- Amazon's restricted Alexa+ tools or a real Alexa device.
- Independent MCP SDK/Inspector interoperability or exhaustive conformance.
- Public GitHub repository, final uploaded demo video, personal feedback preference, or completed Devpost submission.

Local tests establish implementation behavior only. They do not establish clinical safety or actual appointment availability.
