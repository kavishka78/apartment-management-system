using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Enable Npgsql legacy timestamp behavior for seamless DateTime support
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Load .env file into environment variables if present
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
if (!File.Exists(envPath))
{
    envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
}
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
        var parts = trimmed.Split('=', 2);
        if (parts.Length == 2)
        {
            var key = parts[0].Trim();
            var val = parts[1].Trim().Trim('"').Trim('\'');
            Environment.SetEnvironmentVariable(key, val);
        }
    }
}

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
builder.WebHost.UseUrls("http://0.0.0.0:5073");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddScoped<INotificationService, EmailNotificationService>();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = JwtTokenService.GetKey(builder.Configuration),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

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
builder.Services.AddHttpClient<FacilityAgentClient>(client =>
{
    var agentUrl = builder.Configuration["PythonAgentUrl"] ?? "http://localhost:8000";
    client.BaseAddress = new Uri(agentUrl);
    client.Timeout = TimeSpan.FromSeconds(60);
});

// ── SLA escalation background service ───────────────────────────────────────
builder.Services.AddHostedService<SlaEscalationService>();

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? string.Empty)
        .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    options.AddPolicy("ReactApp", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                return Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                    (uri.IsLoopback || allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase));
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
        dbContext.Database.Migrate();
        RegistrySeeder.SeedPlatform(dbContext);
        RegistrySeeder.Seed(dbContext);
        FacilitySeeder.Seed(dbContext);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Migration/Seed Notice: {ex.Message}");
    }

    try
    {
        dbContext.Database.ExecuteSqlRaw(@"
            ALTER TABLE ""Facilities""
            ADD COLUMN IF NOT EXISTS ""DeactivationReason"" text,
            ADD COLUMN IF NOT EXISTS ""HourlyCost"" numeric NOT NULL DEFAULT 0.0;

            ALTER TABLE ""FacilityBookings""
            ADD COLUMN IF NOT EXISTS ""BookedCapacity"" integer NOT NULL DEFAULT 1,
            ADD COLUMN IF NOT EXISTS ""TotalCost"" numeric NOT NULL DEFAULT 0.0;

            CREATE TABLE IF NOT EXISTS ""FacilityAgentWorkflows"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""WorkflowId"" text NOT NULL,
                ""ResidentId"" integer NOT NULL DEFAULT 1,
                ""ResidentName"" text NOT NULL DEFAULT 'Resident',
                ""Objective"" text NOT NULL,
                ""AgentType"" text NOT NULL DEFAULT 'FacilityAndParkingAgent',
                ""PlanJson"" text NOT NULL DEFAULT '',
                ""ExtractedDataJson"" text NOT NULL DEFAULT '',
                ""ToolResultsJson"" text NOT NULL DEFAULT '',
                ""ProposalJson"" text NOT NULL DEFAULT '',
                ""ValidationStatus"" text NOT NULL DEFAULT 'Pending',
                ""RequiresApproval"" boolean NOT NULL DEFAULT true,
                ""Status"" text NOT NULL DEFAULT 'PendingApproval',
                ""CreatedAt"" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ""ActionedAt"" timestamp without time zone NULL,
                ""ActionedBy"" text NULL,
                ""ManagerNotes"" text NULL
            );

            CREATE TABLE IF NOT EXISTS ""ResidentOtps"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""Email"" varchar(150) NOT NULL,
                ""OtpCode"" varchar(10) NOT NULL,
                ""ExpiresAt"" timestamp without time zone NOT NULL,
                ""CreatedAt"" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            UPDATE ""FacilityAgentWorkflows"" SET ""Status"" = 'PendingApproval' WHERE ""Status"" = 'AutoApproved';
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

app.UseStaticFiles(); // For wwwroot if any
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});


app.UseCors("ReactApp");

app.UseAuthentication();
app.UseAuthorization();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed Technician User
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.UserAccounts.Any(u => u.Email == "technician@apartment.lk"))
    {
        var tech = new ApartmentManagement.Api.Models.UserAccount
        {
            Name = "Test Technician",
            Email = "technician@apartment.lk",
            Phone = "0771234567",
            Role = "Technician",
            Status = "Active",
            AssignedAt = DateTime.UtcNow.ToString("O")
        };
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<ApartmentManagement.Api.Models.UserAccount>();
        tech.PasswordHash = hasher.HashPassword(tech, "tech12345");
        db.UserAccounts.Add(tech);
        db.SaveChanges();
    }
}

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
