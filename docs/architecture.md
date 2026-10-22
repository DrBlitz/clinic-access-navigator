# Architecture

The hosted request path is Browser → same-origin `/api/mcp` → shared `lib/clinic-mcp.mjs` → synthetic results. The browser's limited English router chooses a tool, initializes MCP, notifies initialized, lists tools, verifies the selected tool was advertised, and calls it. The UI displays actual protocol responses. No LLM is connected.

The local review path uses `scripts/local-server.mjs` and `demo/index.html`, with the exact same shared modules. It binds to 127.0.0.1, checks the Host header, limits body size, and serves only explicitly mapped files. The root README provides a no-install quickstart.

The optional AWS path is API Gateway HTTP API with IAM authorization → Lambda adapter → shared core. It is prepared, not yet verified in AWS, and the Site has not been connected to it.

## Transport

JSON-RPC 2.0; protocol 2025-11-25; stateless JSON response mode of Streamable HTTP. Supports initialize, notifications/initialized, ping, tools/list and tools/call. GET/DELETE return 405; no server-initiated SSE or sessions are advertised. The client supports JSON and SSE response parsing. Subsequent requests require an explicit protocol header; older-version fallback is deliberately unsupported. Tests are not a certification of full MCP conformance.

## Scope and access

The public Site contains synthetic, read-only data only. Exact origin checks do not authenticate users or stop non-browser clients. The application does not intentionally log request bodies or persist conversations; infrastructure may retain metadata. The AWS endpoint remains IAM-protected. No direct AWS browser credentials or CORS access are included.

Inputs have a 16 KiB request limit and runtime argument validation. Unknown concerns do not receive an urgency classification or automatic test recommendation. Limited urgent phrase matching precedes schedule routing but can miss symptoms and over-escalate negated phrases. No clinical-safety certification is claimed.

Branch names are demo labels. Hours/accessibility are unverified. Monday–Saturday slots are fabricated; Sunday is empty. Scheduling defaults to upcoming Friday in Asia/Manila. Arbitrary date interpretation and conversation memory are not implemented.
