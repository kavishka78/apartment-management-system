using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs.Safety;
using ApartmentManagement.Api.Models.Safety;
using Microsoft.Extensions.Configuration;

namespace ApartmentManagement.Api.Services
{
    // Calls the Python Validation & Safety Agent and records every verdict.
    // Other agents must go through this client before executing a proposed action.
    public class SafetyValidationClient
    {
        private readonly HttpClient _httpClient;
        private readonly AppDbContext _db;
        private readonly string? _agentSharedSecret;

        public SafetyValidationClient(HttpClient httpClient, AppDbContext db, IConfiguration config)
        {
            _httpClient = httpClient;
            _db = db;
            _agentSharedSecret = config["PythonAgent:SharedSecret"];
        }

        public async Task<SafetyVerdictDto> ValidateAsync(ProposedActionDto proposal)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/safety/validate")
            {
                Content = JsonContent.Create(proposal)
            };
            if (!string.IsNullOrWhiteSpace(_agentSharedSecret))
                request.Headers.Add("X-Agent-Key", _agentSharedSecret);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                // Fail closed: if the safety agent is down, nothing proceeds.
                return new SafetyVerdictDto
                {
                    Verdict = "block",
                    ApprovalRequired = false,
                    Reason = $"Safety agent unavailable (HTTP {(int)response.StatusCode}). Action blocked.",
                    WorkflowId = proposal.WorkflowId,
                    Checks = new List<SafetyCheckDto>()
                };
            }

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var verdict = await response.Content.ReadFromJsonAsync<SafetyVerdictDto>(options)
                ?? throw new InvalidOperationException("Empty response from safety agent.");
            verdict.WorkflowId = proposal.WorkflowId;

            _db.SafetyVerdictLogs.Add(new SafetyVerdictLog
            {
                TenantId = proposal.TenantId,
                WorkflowId = proposal.WorkflowId,
                ProposedBy = proposal.ProposedBy,
                ActionType = proposal.Action.Type,
                RequesterUserId = proposal.Requester.UserId,
                RequesterRole = proposal.Requester.Role,
                Verdict = verdict.Verdict,
                ApprovalRequired = verdict.ApprovalRequired,
                Reason = verdict.Reason,
                ChecksJson = JsonSerializer.Serialize(verdict.Checks),
                TraceId = verdict.TraceId,
            });
            await _db.SaveChangesAsync();

            return verdict;
        }
    }
}
