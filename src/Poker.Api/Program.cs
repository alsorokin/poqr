using Poker.Api.Hubs;
using Poker.Api.Rooms;
using Microsoft.Extensions.Logging.ApplicationInsights;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationInsightsTelemetry();

builder.Logging.AddApplicationInsights();
builder.Logging.AddFilter<ApplicationInsightsLoggerProvider>("", LogLevel.Information);

builder.Services.AddSingleton<RoomStore>();
builder.Services.AddHostedService<DisconnectedParticipantCleanupService>();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
	options.AddPolicy("Frontend", policy =>
	{
		var isDevelopment = builder.Environment.IsDevelopment();
		if (isDevelopment)
		{
			policy.WithOrigins("http://localhost:4200");
		}
		else
		{
			policy.WithOrigins("https://poqr.azurewebsites.net");
		}
		policy
			.AllowAnyHeader()
			.AllowAnyMethod()
			.AllowCredentials();
	});
});

if (!builder.Environment.IsDevelopment())
{
	builder.WebHost.UseUrls("http://+:80");
}
else
{
	builder.WebHost.UseUrls("http://localhost:5057");
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
	app.UseDefaultFiles();
	app.UseStaticFiles();
}

app.UseCors("Frontend");
app.MapControllers();
app.MapHub<PokerHub>("/hubs/poker");
app.MapGet("/api/status", () => Results.Ok(new { service = "poker-api" }));

// Fall back to index.html for SPA routes (must be last)
if (!app.Environment.IsDevelopment())
{
	app.MapFallbackToFile("index.html");
}

app.Run();
