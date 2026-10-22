# Product friction log

This log records onboarding and implementation friction for the hackathon submission. Entries will be refined as Amazon tools are introduced.

## 2026-09-17 — Browser UUID compatibility

- **Task:** Send a unique JSON-RPC request ID from the Alexa+ simulation.
- **Expected:** `crypto.randomUUID()` would be available in the preview browser.
- **Actual:** The preview runtime reported that `crypto.randomUUID` was not a function.
- **Severity:** Minor.
- **Workaround:** Generate a non-sensitive request correlation ID from the current timestamp and a random suffix.
- **Suggestion:** Starter documentation could identify browser APIs that differ between the development preview and common production browsers.

## 2026-09-17 — MCP hosting declaration discovery

- **Task:** Expose the hosted application as a connectable MCP server.
- **Expected:** A documented hosting-manifest declaration would identify the MCP route.
- **Actual:** The application route works, but the hosting layer does not yet recognize the Site itself as MCP-ready.
- **Severity:** Moderate.
- **Workaround:** Keep the MCP implementation portable and prepare a dedicated AWS-hosted endpoint for the contest.
- **Suggestion:** Provide an MCP starter that includes the required manifest declaration, Streamable HTTP route, and connection-validation command.
