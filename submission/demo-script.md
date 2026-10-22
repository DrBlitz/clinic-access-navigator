# Demo recording script — target 2:35, hard maximum under 3:00

Record the actual running app. This file is video content and a shot list, **not a finished video**. Use the public Site after checking the updated version, or `node scripts/local-server.mjs` and http://127.0.0.1:8787. Use fictional prompts, English narration, no patient information, no background music or third-party footage. Keep the live MCP panel visible. Set a 2:50 export ceiling so the video remains strictly under 3:00.

| Time | Screen action | Narration |
|---|---|---|
| 0:00–0:17 | Show project title and app | “Clinic Access Navigator helps people answer practical questions before a clinic visit. This is our Alexa+ track submission: a simulated experience connected to a real Model Context Protocol server.” |
| 0:17–0:35 | Show the synthetic-data and safety labels | “This prototype uses fictional availability and unverified branch details. It does not diagnose, access patient records, or make appointments. The interface is rule-based, and no Alexa device or language model is connected.” |
| 0:35–0:57 | Enter “Ayala branch information”; open the initialize and tools/list trace entries | “Let’s ask for a branch. The browser initializes MCP version 2025-11-25, discovers four tools, and calls the branch-information tool over Streamable HTTP. These are actual server responses. We can inspect both the HTTP status and the structured result.” |
| 0:57–1:17 | Enter “Mactan hearing test appointment”; open tools/call | “Next, we ask about a hearing-test appointment in Mactan. The tool returns sample Friday times in Philippine time. The response clearly says these slots are synthetic and that no booking has been made.” |
| 1:17–1:32 | Enter “What should I bring?” | “The preparation tool gives general demo guidance and asks the visitor to confirm service-specific instructions with the clinic.” |
| 1:32–1:53 | Enter “Book Ayala Friday for sudden hearing loss” | “Here is an important boundary. This request contains scheduling words and sudden hearing loss. The limited safety guard interrupts the scheduling flow with in-person-care guidance. This is not a complete urgency assessment.” |
| 1:53–2:12 | Briefly show shared lib files and terminal test result | “The same MCP implementation powers the hosted app, the local review server, and a prepared AWS Lambda adapter. Thirteen automated tests cover protocol flow, input validation, failure handling, and a real local HTTP exchange.” |
| 2:12–2:35 | Show README and LICENSE; return to app | “Reviewers can run the source with one Node command and no keys. The repository includes the MIT license and deployment instructions. AWS deployment is pending verification. Our goal is a transparent, focused path from a clinic-access question to a useful next step, with the prototype’s limits visible throughout.” |

## If AWS validation is completed before recording

Replace the final AWS sentence with an accurate, short description of the deployed Lambda/API Gateway endpoint and show the signed smoke-test result. Do not say the Site uses AWS unless its request path has actually been switched and tested. Do not show credentials, AWS account identifiers, sign-in pages, or token values.

## Recording and upload checklist

1. Run one full rehearsal and verify all four requests finish successfully.
2. Capture the real application window and your English narration. Keep the MCP evidence readable.
3. Trim to about 2:35. Confirm the exported file duration is below 3:00.
4. Upload to YouTube or Vimeo with **Public** visibility. Do not rely on an unlisted/private setting.
5. Wait for processing and playback; open the URL without signing in.
6. Paste the public URL into the existing Devpost entry.

Suggested title: **Clinic Access Navigator — Alexa+ MCP Hackathon Demo**

Suggested description: “A working simulated Alexa+ experience using MCP 2025-11-25 over Streamable HTTP. Synthetic clinic data only; no diagnosis or real booking. Source: [insert public GitHub URL].”
