using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class ChatMessageDto
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;
        
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    public class ResidentChatRequestDto
    {
        [JsonPropertyName("messages")]
        public List<ChatMessageDto> Messages { get; set; } = new List<ChatMessageDto>();
    }

    public class DraftComplaintDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
        
        [JsonPropertyName("categoryId")]
        public int CategoryId { get; set; }
    }

    public class ResidentChatResponseDto
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
        
        [JsonPropertyName("reply")]
        public string Reply { get; set; } = string.Empty;
        
        [JsonPropertyName("draftComplaint")]
        public DraftComplaintDto? DraftComplaint { get; set; }
        
        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }
}
