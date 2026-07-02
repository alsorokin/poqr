using Microsoft.AspNetCore.SignalR;
using Poker.Api.Contracts;
using Poker.Api.Hubs;

namespace Poker.Api.Rooms;

public sealed class DisconnectedParticipantCleanupService(
    RoomStore roomStore,
    IHubContext<PokerHub> hubContext,
    ILogger<DisconnectedParticipantCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CleanupInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var hasTicked = await timer.WaitForNextTickAsync(stoppingToken);
                if (!hasTicked)
                {
                    break;
                }

                var updates = roomStore.PruneExpiredDisconnectedParticipants();
                foreach (var update in updates)
                {
                    if (update.State is not null)
                    {
                        await hubContext.Clients.Group(update.SessionId)
                            .SendAsync("RoomStateUpdated", new RoomStateEnvelope(update.State), stoppingToken);
                        continue;
                    }

                    await hubContext.Clients.Group(update.SessionId)
                        .SendAsync("SessionClosed", new ErrorEnvelope("Session ended."), stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to prune disconnected participants.");
            }
        }
    }
}
