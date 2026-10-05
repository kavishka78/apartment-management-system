using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using ApartmentManagement.Api.DTOs.Maintenance;
using ApartmentManagement.Api.Models;
using Microsoft.Extensions.Configuration;

namespace ApartmentManagement.Api.Services
{
    public class MaintenanceTriageClient : IMaintenanceTriageService
    {
        private readonly HttpClient _httpClient;
        private readonly string _pythonAgentUrl;
        private readonly string? _agentSharedSecret;

        public MaintenanceTriageClient(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _pythonAgentUrl = config["PythonAgentUrl"] ?? "http://localhost:8000";
            _agentSharedSecret = config["PythonAgent:SharedSecret"];
        }

        public async Task<AiTriageRecommendationDto> TriageComplaintAsync(
            string title, 
            string description, 
            List<Technician> technicians, 
            Dictionary<int, int> technicianWorkloads,
            string currentSlaDeadlineInfo = "", string slaRisk = "Low", string managerFeedback = "")
        {
            var techniciansList = new List<object>();
            foreach (var t in technicians)
            {
                var activeJobs = technicianWorkloads.ContainsKey(t.Id) ? technicianWorkloads[t.Id] : 0;
                techniciansList.Add(new
                {
                    id = t.Id,
                    name = t.Name,
                    skills = new[] { t.Skills },
                    availability = t.Status,
                    active_jobs = activeJobs
                });
            }

            var requestPayload = new
            {
                complaint = new
                {
                    id = 0,
                    title = title,
                    description = description,
                    priority = (string?)null,
                    category = (string?)null,
                    sla_due_date = currentSlaDeadlineInfo
                },
                technicians = techniciansList,
                sla = new
                {
                    risk = slaRisk,
                    reason = currentSlaDeadlineInfo
                },
                manager_feedback = managerFeedback
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{_pythonAgentUrl}/triage")
            {
                Content = JsonContent.Create(requestPayload)
            };
            if (!string.IsNullOrWhiteSpace(_agentSharedSecret))
                request.Headers.Add("X-Agent-Key", _agentSharedSecret);
            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to call Python AI agent. Status: {response.StatusCode}");
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            
            using var doc = JsonDocument.Parse(jsonString);
            var root = doc.RootElement;
            
            if (root.TryGetProperty("success", out var successElement) && successElement.GetBoolean() == false)
            {
                var error = root.GetProperty("error").GetString();
                throw new Exception($"Python AI Agent returned error: {error}");
            }

            if (root.TryGetProperty("recommendation", out var recElement))
            {
                var result = JsonSerializer.Deserialize<AiTriageRecommendationDto>(recElement.GetRawText(), options);
                if (result == null) throw new Exception("Deserialized recommendation is null");
                
                return result;
            }

            throw new Exception("Invalid response format from Python AI agent.");
        }
    
        public async Task<ResidentChatResponseDto> ChatWithResidentAgentAsync(ResidentChatRequestDto request)
        {
            var url = $"{_pythonAgentUrl}/resident-intake";
            var requestMsg = new HttpRequestMessage(HttpMethod.Post, url);
            requestMsg.Content = JsonContent.Create(request);
            if (!string.IsNullOrEmpty(_agentSharedSecret))
            {
                requestMsg.Headers.Add("x-agent-key", _agentSharedSecret);
            }

            var response = await _httpClient.SendAsync(requestMsg);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                throw new Exception($"Agent failed: {response.StatusCode} - {err}");
            }

            var result = await response.Content.ReadFromJsonAsync<ResidentChatResponseDto>();
            return result ?? new ResidentChatResponseDto { Success = false, Error = "Deserialization failed" };
        }
    
}
}


