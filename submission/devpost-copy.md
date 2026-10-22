# Devpost submission copy

Prepared for the existing **Clinic Access Navigator** entry. These are draft fields, not proof of submission. The repository URL is supplied below; the public video URL is still pending.

## Project name
Clinic Access Navigator

## Tagline
Find clinic information, explore sample availability, and prepare for a visit through a transparent MCP-powered assistant.

## Inspiration
Patients need clear answers before they arrive at a clinic: which branch to contact, whether a service is available, and what to bring. Clinic Access Navigator explores a focused conversational interface for these access questions. It keeps administrative navigation separate from diagnosis and avoids presenting fabricated appointments as real availability.

## What it does
The web simulator exposes four read-only capabilities: service navigation, branch information, synthetic appointment availability, and general visit preparation. Users can inspect the live protocol exchange behind each response. Limited urgent-phrase checks interrupt scheduling requests with in-person-care guidance; they are explicitly not a comprehensive triage system.

## How we built it
The Alexa+ track implementation uses Model Context Protocol version 2025-11-25 over Streamable HTTP. A browser client sends initialize, an initialized notification, tools/list, and tools/call requests to a self-hosted MCP endpoint. The server validates arguments and returns both readable text and structured tool results.

The hosted interface uses React and TypeScript on ChatGPT Sites. A dependency-free Node.js review server runs the same shared protocol code locally. Tool selection is deterministic English keyword routing, not a connected language model. The project also includes an IAM-protected AWS SAM/Lambda/API Gateway deployment package; live AWS deployment is pending verification and is not part of the current hosted request path.

## Challenges
The main implementation challenge was making the distinction between a conversational mockup and a real protocol client visible. The client now discovers tools before invoking them, understands JSON and SSE responses, and shows actual HTTP results. Another important boundary is authentication: the AWS template remains IAM-protected, so an unsigned browser or generic inspector cannot simply connect to it. A secure AWS bridge needs separate credentials and renewal design.

## Accomplishments
The working code supports four tools, schema validation, exact origin checks, body-size limits, explicit connection errors, synthetic-data labeling, and a local one-command review workflow. Thirteen tests exercise the shared implementation, including an actual local HTTP exchange. The demo intentionally makes no real booking or clinical-record mutation.

## What we learned
A clear MCP contract makes administrative capabilities portable between hosting environments. Transparent protocol evidence is useful for demonstrating what a simulator actually does. A restricted synthetic scope also makes limitations inspectable: fabricated slots stay labeled, unknown concerns are not called routine, and no untested Alexa-device or AWS integration is implied.

## What's next
Validate the prepared AWS deployment, design a renewable server-side identity for a Site-to-AWS bridge, replace synthetic branch/service data with verified data, and add authenticated appointment requests with appropriate clinic approval and privacy controls. Language understanding and comprehensive clinical triage are outside this prototype's verified scope.

## Built with
JavaScript; TypeScript; Node.js; React; Model Context Protocol; Streamable HTTP; ChatGPT Sites. Add AWS Lambda, Amazon API Gateway, AWS SAM and Amazon CloudWatch as a deployed integration only after the signed AWS validation succeeds. No Amazon SDK, Bedrock or Alexa+ preview tooling is currently used.

## Track and mini challenges
- Primary: **Alexa+ — simulated experience / self-hosted MCP server**.
- AWS Builder: pending actual deployment and evidence. Do not mark it completed based only on YAML.
- Open Source mini challenge: publishing the primary repository with MIT is not automatically proof of the separate additional contribution requirement. Enter only if a qualifying additional project/contribution and its URL are documented.

## Links to enter
- Live demo: https://clinic-access-navigator.janrusabello.chatgpt.site
- GitHub repository: https://github.com/DrBlitz/clinic-access-navigator
- Public YouTube or Vimeo video, shorter than 3 minutes: **PENDING PUBLIC UPLOAD** (a 2:17 captioned technical demonstration has been prepared)

## Development window
The recovered project records start on September 17, 2026, within the stated August 31–October 23 submission window. The finishing work adds protocol discovery, a visible exchange panel, SSE response support, independent local startup, additional tests, license, and submission documentation. This is a standalone synthetic prototype, not a claim that the existing ClinicOS product was built during the hackathon.
