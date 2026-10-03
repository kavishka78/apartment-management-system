using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ApartmentManagement.Api.Services;

public class EmailNotificationService : INotificationService
{
    private readonly ILogger<EmailNotificationService> _logger;

    private readonly IConfiguration _config;

    public EmailNotificationService(ILogger<EmailNotificationService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var sendGridKey = _config["SendGrid:ApiKey"];
        var senderEmail = _config["SendGrid:SenderEmail"] ?? "noreply@apartmenthub.com";
        var senderName = _config["SendGrid:SenderName"] ?? "Apartment Management System";

        if (!string.IsNullOrWhiteSpace(sendGridKey))
        {
            try
            {
                var client = new SendGrid.SendGridClient(sendGridKey);
                var from = new SendGrid.Helpers.Mail.EmailAddress(senderEmail, senderName);
                var to = new SendGrid.Helpers.Mail.EmailAddress(toEmail);
                var msg = SendGrid.Helpers.Mail.MailHelper.CreateSingleEmail(from, to, subject, body, body);
                var response = await client.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"[SENDGRID EMAIL SENT] To: {toEmail} | Subject: {subject}");
                    return;
                }
                _logger.LogWarning($"[SENDGRID FAIL] Status: {response.StatusCode}. Falling back to SMTP/log.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"SendGrid failed for {toEmail}");
            }
        }

        // Standard SMTP Fallback (e.g. Gmail / Mailtrap / Custom SMTP)
        var smtpHost = _config["Smtp:Host"];
        if (!string.IsNullOrWhiteSpace(smtpHost))
        {
            try
            {
                int port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 587;
                var user = _config["Smtp:Username"];
                var pass = _config["Smtp:Password"];

                using var smtpClient = new System.Net.Mail.SmtpClient(smtpHost, port)
                {
                    Credentials = new System.Net.NetworkCredential(user, pass),
                    EnableSsl = true,
                };

                var mailMessage = new System.Net.Mail.MailMessage
                {
                    From = new System.Net.Mail.MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true,
                };
                mailMessage.To.Add(toEmail);

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"[SMTP EMAIL SENT] To: {toEmail} | Subject: {subject}");
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"SMTP failed for {toEmail}");
            }
        }

        _logger.LogInformation($"[EMAIL LOGGED] To: {toEmail} | Subject: {subject} | Body: {body}");
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
