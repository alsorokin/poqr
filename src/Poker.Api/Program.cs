using Poker.Api.Hubs;
using Poker.Api.Rooms;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<RoomStore>();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
	options.AddPolicy("Frontend", policy =>
	{
		policy
			.WithOrigins("http://localhost:4200")
			.AllowAnyHeader()
			.AllowAnyMethod()
			.AllowCredentials();
	});
});

builder.WebHost.UseUrls("http://localhost:5057");

var app = builder.Build();

app.UseCors("Frontend");
app.MapControllers();
app.MapHub<PokerHub>("/hubs/poker");
app.MapGet("/", () => Results.Ok(new { service = "poker-api" }));

app.Run();
