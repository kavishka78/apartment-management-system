using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ApartmentManagement.Api.Services
{
    // Calls the Python Resident Onboarding Assistant. Read-only: it returns a draft and never saves a resident.
    public class OnboardingAgentClient
    {
        private readonly HttpClient _httpClient;
        private readonly string? _agentSharedSecret;

        public OnboardingAgentClient(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _agentSharedSecret = config["PythonAgent:SharedSecret"];
        }

        public async Task<(int Status, JsonElement Body)> DraftAsync(
            int tenantId, string text, IEnumerable<object> units, IEnumerable<string> emails, IEnumerable<string> nationalIds)
        {
            var payload = new
            {
                tenantId,
                text,
                units,
                existingEmails = emails,
                existingNationalIds = nationalIds,
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "/onboarding/draft")
            {
                Content = JsonContent.Create(payload)
            };
            if (!string.IsNullOrWhiteSpace(_agentSharedSecret))
                request.Headers.Add("X-Agent-Key", _agentSharedSecret);

            using var response = await _httpClient.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            return ((int)response.StatusCode, doc.RootElement.Clone());
        }
    }
}
