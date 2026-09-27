using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ApartmentManagement.Api.Services
{
    public class FacilityAgentClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _pythonAgentUrl;

        public FacilityAgentClient(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _pythonAgentUrl = config["PythonAgentUrl"] ?? "http://localhost:8000";
        }

        public async Task<JsonElement> PlanFacilityAndParkingAsync(string objective, int residentId, string residentName)
        {
            var payload = new
            {
                objective = objective,
                resident_id = residentId.ToString(),
                resident_name = residentName
            };

            var response = await _httpClient.PostAsJsonAsync($"{_pythonAgentUrl}/api/internal/agent/plan-facility-parking", payload);
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Python Facility Agent API failed with status code {response.StatusCode}");
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);
            return doc.RootElement.Clone();
        }
    }
}
