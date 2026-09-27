using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Enable Npgsql legacy timestamp behavior for seamless DateTime support
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

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
