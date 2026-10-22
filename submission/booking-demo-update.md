# Booking demonstration update — October 22, 2026

The application now supports persistent fictional ENT reservations at Ayala Center Cebu. Choose ENT Doctor A (Monday–Friday 11 AM–3 PM) or ENT Doctor B (Tuesday–Saturday 4 PM–7 PM), a date, an available 30-minute slot and an invented adult patient preset. Review and explicitly confirm to receive a DEMO reference. Refresh preserves the reservation in the same browser. Confirmed cancellation releases the slot.

All times use Asia/Manila. No real clinic appointment, Google Calendar event, email or SMS is created. Hosted storage uses Sites D1; the standalone local review uses SQLite. A unique active-slot index prevents double booking; request IDs protect against duplicate retries. The random browser token controls access to that browser's demo reservations and is not a production patient account.

## Updated recording sequence (under three minutes)

- 0:00–0:20: Introduce the clinic-access problem and show the fictional-data notice.
- 0:20–0:45: Select Doctor A and a future weekday; show available slots and schedule.
- 0:45–1:05: Choose a slot and random fictional adult; show demographics.
- 1:05–1:30: Review, explicitly confirm, and show the DEMO reference.
- 1:30–1:50: Expand the live booking MCP exchange and show the structured server response.
- 1:50–2:10: Refresh the page and show the saved reservation.
- 2:10–2:30: Cancel with confirmation; show the released slot.
- 2:30–2:45: Show the public repository/MIT license. State that this is an MCP web simulator, without a real Alexa device or Google Calendar integration.

The earlier uploaded video predates this feature. Update the video and Devpost description if showcasing booking. This source document does not itself modify the submitted Devpost entry.

## Verification

Automated tests cover doctor schedules, past/date bounds, competing reservations, duplicate retries, ownership checks, cancellation, SQLite persistence, protocol validation and local HTTP operation. Run `node --test tests/*.test.mjs`.
