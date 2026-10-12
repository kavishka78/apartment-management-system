# Emulator with local agents and a Railway backend

Run `python .\agent-services\run_all_agents.py` from the project root.
Restart an existing agent runner first to reload its environment.

The mobile app uses these local endpoints by default:

- Maintenance: `http://10.0.2.2:8000/resident-intake`
- Facility: `http://10.0.2.2:8002/api/internal/agent/plan-facility-parking`

Override the origins using `MAINTENANCE_AGENT_URL` and `FACILITY_AGENT_URL`
in `mobile/.env` or Flutter `--dart-define` flags. Rebuild the app after edits.
Gemini keys stay in Python agent environment files, never in the mobile app.

Facility `BACKEND_API_URL` points to the Railway backend's `/api` URL, so
availability checks use the hosted records. Maintenance complaint submission
also continues to use the hosted backend.

Facility greetings, inquiries and rejected proposals are displayed directly.
Booking proposals are uploaded to `/api/workflows/save-local-plan` using the
resident's login token, and wait for confirmation. Deploy the updated backend
to Railway to enable this new endpoint. Approval retains the existing backend
validation and safety gate; it does not bypass the Safety service. That service
must remain reachable from Railway for booking execution to succeed.

No tunnel or Railway agent URL is needed for these mobile AI requests.
