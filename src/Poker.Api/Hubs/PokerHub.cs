using Microsoft.AspNetCore.SignalR;
using Poker.Api.Contracts;
using Poker.Api.Rooms;

namespace Poker.Api.Hubs;

public sealed class PokerHub(RoomStore roomStore) : Hub
{
    private static readonly Dictionary<string, (string SessionId, string ParticipantId)> ConnectionMap =
        new(StringComparer.Ordinal);

    private static readonly object ConnectionGate = new();

    public async Task JoinSession(JoinHubSessionCommand command)
    {
        var state = roomStore.GetState(command.SessionId);
        if (state is null)
        {
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Session not found."));
            return;
        }

        await RegisterConnection(command.SessionId, command.ParticipantId);
        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task StartRound(StartRoundCommand command)
    {
        var state = roomStore.StartRound(command.SessionId, command.ParticipantId);
        if (state is null)
        {
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Unable to start a round."));
            return;
        }

        await RegisterConnection(command.SessionId, command.ParticipantId);
        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task CastVote(CastVoteCommand command)
    {
        var state = roomStore.CastVote(command.SessionId, command.ParticipantId, command.RoundId, command.Value);
        if (state is null)
        {
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Unable to cast vote."));
            return;
        }

        await RegisterConnection(command.SessionId, command.ParticipantId);
        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task RevealRound(RevealRoundCommand command)
    {
        var state = roomStore.RevealRound(command.SessionId, command.ParticipantId, command.RoundId);
        if (state is null)
        {
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Unable to reveal this round."));
            return;
        }

        await RegisterConnection(command.SessionId, command.ParticipantId);
        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task LeaveSession(LeaveSessionCommand command)
    {
        await HandleLeave(command.SessionId, command.ParticipantId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        (string SessionId, string ParticipantId)? found = null;

        lock (ConnectionGate)
        {
            if (ConnectionMap.TryGetValue(Context.ConnectionId, out var info))
            {
                found = info;
                ConnectionMap.Remove(Context.ConnectionId);
            }
        }

        if (found is not null)
        {
            await HandleLeave(found.Value.SessionId, found.Value.ParticipantId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task RegisterConnection(string sessionId, string participantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);

        lock (ConnectionGate)
        {
            ConnectionMap[Context.ConnectionId] = (sessionId, participantId);
        }
    }

    private async Task HandleLeave(string sessionId, string participantId)
    {
        var state = roomStore.LeaveSession(sessionId, participantId);
        if (state is not null)
        {
            await Clients.Group(sessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
            return;
        }

        await Clients.Group(sessionId).SendAsync("SessionClosed", new ErrorEnvelope("Session ended."));
    }
}
