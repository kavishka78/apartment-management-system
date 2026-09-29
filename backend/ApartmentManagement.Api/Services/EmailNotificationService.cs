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

    public async Task SendPushNotificationAsync(string? fcmToken, string title, string body)
    {
        if (string.IsNullOrWhiteSpace(fcmToken)) return;

        try
        {
            if (FirebaseAdmin.FirebaseApp.DefaultInstance != null)
            {
                var message = new FirebaseAdmin.Messaging.Message()
                {
                    Token = fcmToken,
                    Notification = new FirebaseAdmin.Messaging.Notification()
                    {
                        Title = title,
                        Body = body
                    }
                };
                string response = await FirebaseAdmin.Messaging.FirebaseMessaging.DefaultInstance.SendAsync(message);
                _logger.LogInformation($"[FCM PUSH SENT] To: {fcmToken} | Response: {response}");
            }
            else
            {
                _logger.LogWarning($"[FCM PUSH SIMULATED] To: {fcmToken} | Title: {title} | Body: {body} (Firebase Admin SDK not initialized)");
            }
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, $"Failed to send FCM push notification to {fcmToken}");
        }
    }
}
