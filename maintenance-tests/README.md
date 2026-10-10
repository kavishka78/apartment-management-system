# Maintenance tests

Maintenance and complaint tests are kept together here, separated by runtime.

Run them from these directories:

| Directory | Command |
| --- | --- |
| Repository root | `python -m pytest -c maintenance-tests/pytest.ini maintenance-tests/agent` |
| Repository root | `dotnet test maintenance-tests/backend/ApartmentManagement.Maintenance.Tests.csproj` |
| `mobile` | `flutter test ../maintenance-tests/mobile/maintenance_workflow_test.dart` |
| `web/apartment-management-web` | `npm test` |

`backend/legacy/LegacyMaintenanceControllerTests.cs` is preserved from the older backend test project, but excluded from compilation because it targets an obsolete controller constructor. The active backend tests are in `backend/MaintenanceControllerTests.cs`.

The Python benchmark is a separate diagnostic script, not part of the pytest suite. Run it from the repository root with `PYTHONPATH=agent-services/maintainance-agent python maintenance-tests/agent/benchmark_agent_orchestration.py` (or set `PYTHONPATH` equivalently on Windows).
