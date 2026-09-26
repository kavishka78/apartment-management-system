using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Services;
using Microsoft.EntityFrameworkCore;

// Enable Npgsql legacy timestamp behavior for seamless DateTime support
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ── AI Triage service (calls Python FastAPI agent) ──────────────────────────
builder.Services.AddHttpClient<IMaintenanceTriageService, MaintenanceTriageClient>(client =>
{
    var agentUrl = builder.Configuration["PythonAgentUrl"] ?? "http://localhost:8000";
    client.BaseAddress = new Uri(agentUrl);
    client.Timeout = TimeSpan.FromSeconds(60); // Gemini can be slow; allow up to 60 s
});

// ── SLA escalation background service ───────────────────────────────────────
builder.Services.AddHostedService<SlaEscalationService>();

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        // Allow any localhost port so Vite's dynamic port selection always works
        policy.SetIsOriginAllowed(origin =>
            {
                var uri = new Uri(origin);
                return uri.Host == "localhost" || uri.Host == "127.0.0.1";
            })
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Ensure DB columns exist for new properties
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        dbContext.Database.ExecuteSqlRaw(@"
            ALTER TABLE ""Facilities""
            ADD COLUMN IF NOT EXISTS ""DeactivationReason"" text;
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Auto-Migration Notice: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("ReactApp");

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.MapControllers();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
