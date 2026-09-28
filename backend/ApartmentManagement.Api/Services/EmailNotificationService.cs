using Microsoft.Extensions.Logging;

namespace ApartmentManagement.Api.Services;

public class EmailNotificationService : INotificationService
{
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(ILogger<EmailNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string toEmail, string subject, string body)
    {
        // For now, just log the email to avoid crashing. 
        // We will integrate SendGrid later.
        _logger.LogInformation($"[EMAIL SENT] To: {toEmail} | Subject: {subject} | Body: {body}");
        return Task.CompletedTask;
    }
}
