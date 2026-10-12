# Facility agent on Railway

Create a separate Railway service using this repository, with the repository
root as its build context. Set `RAILWAY_DOCKERFILE_PATH` to
`agent-services/Dockerfile.facility`.

Set these variables on the Facility service:

- `GOOGLE_API_KEY`: the Facility Gemini key
- `FACILITY_GEMINI_MODEL`: `gemini-3.5-flash-lite`
- `BACKEND_API_URL`: the reachable Railway backend URL ending in `/api`

Configure the health check path as `/health`. Use the Facility service's private
hostname and listening port for the backend's `FacilityAgentUrl`, for example
`http://facility-agent.railway.internal:8002` if its service name is
`facility-agent` and `PORT` is `8002`. Redeploy the backend after changing it.

The mobile app calls the backend, so its `API_URL` must be the backend's actual
public domain. A DNS lookup error in the app happens before either the backend
or Facility agent receives the request. Changing a local `.env` file does not
change Railway variables or an already installed APK.
