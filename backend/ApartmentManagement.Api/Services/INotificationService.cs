namespace ApartmentManagement.Api.Services;

public interface INotificationService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}
