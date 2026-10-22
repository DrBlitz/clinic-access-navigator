# Clinic Access Navigator

[MIT licensed](LICENSE) · Alexa+ primary track · MCP 2025-11-25 / Streamable HTTP

A working, rule-based clinic-access simulator with a real MCP server. It helps people explore clinic services, find branch information, inspect synthetic appointment availability, and prepare for a visit. It does not diagnose, assess urgency comprehensively, or create real clinic appointments.

**Source repository:** https://github.com/DrBlitz/clinic-access-navigator

**Earlier demonstration video:** https://youtu.be/SDMWsx-BbPA (predates booking functionality)

**Live web demo:** https://clinic-access-navigator.janrusabello.chatgpt.site

**MCP endpoint:** https://clinic-access-navigator.janrusabello.chatgpt.site/api/mcp

The live demo runs on ChatGPT Sites. AWS Lambda/API Gateway deployment is prepared separately and is **not claimed as deployed**. No real Alexa device, microphone, Bedrock, or language model is connected. The browser chooses tools using explicit English rules, then makes actual HTTP requests. All data is synthetic; use fictional examples only.

## Run in under a minute — no package installation

Install Node.js 22.13 or newer, clone or extract this repository, then:

```sh
node scripts/local-server.mjs
```

Open **http://127.0.0.1:8787** (use this exact host). This standalone review interface uses the same MCP server, routing module and client as the hosted React application. It binds only to loopback and requires no keys or AWS account. Stop with Ctrl+C.

```sh
node --test tests/*.test.mjs
# With the local server running in another terminal:
node scripts/smoke.mjs http://127.0.0.1:8787/api/mcp
# Or validate the public deployment:
node scripts/smoke.mjs https://clinic-access-navigator.janrusabello.chatgpt.site/api/mcp
```

## Try these requests

| Input | Observable behavior |
|---|---|
| Ayala branch information | Returns owner-provided Ayala hours; accessibility remains unverified |
| Mactan hearing test appointment | Shows fabricated Friday slots in Asia/Manila; no booking is made |
| What should I bring? | Returns general demo preparation instructions |
| Book Ayala Friday for sudden hearing loss | Shows urgent-care guidance instead of scheduling |
| My knee hurts | Does not classify symptoms as routine or invent an ENT recommendation |

The visible protocol panel shows `initialize` → `notifications/initialized` → `tools/list` → `tools/call`, HTTP status codes, and structured server results. This is an actual MCP exchange, not a prerecorded answer. The server uses stateless JSON response mode of Streamable HTTP; GET returns 405 because it does not offer a server-initiated SSE stream. The client understands JSON and SSE responses.

## Source layout

- `app/`: hosted React interface and `/api/mcp` route.
- `lib/`: shared MCP server, transport client and limited text router.
- `demo/`, `scripts/local-server.mjs`: dependency-free local review interface.
- `aws/`: IAM-protected SAM deployment template and Lambda adapter.
- `tests/`: protocol, validation, routing and real local HTTP integration checks.
- `submission/`: Devpost copy, timed demo script, feedback and completion checklist.

## Hosted React development

The original frontend is included with its pinned dependency lockfile. With Node and pnpm available, run `pnpm install --frozen-lockfile`, then `pnpm exec vinext dev --port 5173`. For the signed-in Sites workspace, use its supported build/publish workflow. The standalone quickstart above needs none of those tools.

## AWS deployment

See [aws/README.md](aws/README.md). Region: `us-east-2`. AWS resources and usage may incur charges; account-specific credits must be checked in AWS. The API remains IAM-protected. Do not place AWS credentials in browser code or remove IAM to make a demo connect.

## Boundaries and privacy

Only synthetic information is used. Fictional appointment reservations are persisted. No real patient database, recording, conversation persistence, diagnosis, or clinical safety certification is provided. A small keyword guard can miss urgent phrases or over-escalate negated ones. It is not clinical triage. The application avoids body logging; hosting infrastructure may retain request metadata. The public endpoint permits synthetic reservations and cancellation; production clinic data would require a separate authentication, authorization and privacy design.

## Submission references

- [Architecture](docs/architecture.md)
- [Validation record](docs/test-evidence.md)
- [Devpost copy](submission/devpost-copy.md)
- [Demo recording script](submission/demo-script.md)
- [Product feedback](submission/product-feedback.md)
- [Finish checklist](submission/finish-checklist.md)

Original project code is under MIT. Third-party dependencies and vendor files retain their own licenses. Clinic names identify the demo context and are not licensed as trademarks. This project is not an official Amazon product or a claim of Alexa+ certification.

## Fictional appointment booking

Use the booking panel above the chat: select doctor/date, choose an available 30-minute slot, select a fictional adult, review, then explicitly confirm. A DEMO reference and saved reservation appear. Refresh retains reservations in the same browser; cancellation releases the slot. No Google Calendar, email or SMS is connected.

- ENT Doctor A: Monday–Friday, 11 AM–3 PM.
- ENT Doctor B: Tuesday–Saturday, 4 PM–7 PM.
- All dates/times: Asia/Manila; today through 30 days ahead, future slots only.
- Four invented Filipino adult profiles use example.com emails; free-text patient entry is disabled.
- Hosted storage: Sites D1. Local storage: SQLite at `.demo-data/bookings.sqlite` (ignored by Git). A random browser token scopes reservation access; this is not production patient authentication.
- Database uniqueness prevents double booking. UUID request identifiers make confirmation retries idempotent. Cancellation is scoped to the browser token.
- Five new MCP tools: `get_demo_booking_options`, `list_demo_slots`, `book_demo_appointment`, `list_demo_appointments`, `cancel_demo_appointment` (nine tools total).
- The older chat availability tool remains a nonreservable illustrative hearing-test response. Use the booking panel for stateful ENT reservations.
- The prepared AWS adapter has no booking database binding; do not claim its booking functionality is deployed.
