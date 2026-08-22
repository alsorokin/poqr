using Microsoft.AspNetCore.SignalR;
using Poqr.Api.Contracts;
using Poqr.Api.Rooms;
namespace Poqr.Api.Hubs;

public sealed class PokerHub(RoomStore roomStore, ILogger<PokerHub> logger) : Hub
{
    private static readonly string[] CinemaFruits = ["🍎", "🍌", "🍇", "🍓", "🍍", "🍉"];

    private static readonly Dictionary<string, (string SessionId, string ParticipantId)> ConnectionMap =
        new(StringComparer.Ordinal);
    private static readonly Dictionary<string, HashSet<string>> ParticipantConnections =
        new(StringComparer.Ordinal);

    private static readonly Lock ConnectionGate = new();

    public async Task JoinSession(JoinHubSessionCommand command)
    {
        logger.LogInformation(
            "Hub JoinSession requested for session {SessionId} by participant {ParticipantId} (connection {ConnectionId}).",
            command.SessionId,
            command.ParticipantId,
            Context.ConnectionId);

        await RegisterConnection(command.SessionId, command.ParticipantId);

        var state = roomStore.SetParticipantConnection(command.SessionId, command.ParticipantId, true);
        if (state is null)
        {
            logger.LogWarning(
                "Hub JoinSession failed for session {SessionId} by participant {ParticipantId}: session or participant not found.",
                command.SessionId,
                command.ParticipantId);
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Session not found."));
            return;
        }

        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task StartRound(StartRoundCommand command)
    {
        logger.LogInformation(
            "Hub StartRound requested for session {SessionId} by participant {ParticipantId}.",
            command.SessionId,
            command.ParticipantId);

        await RegisterConnection(command.SessionId, command.ParticipantId);

        var state = roomStore.StartRound(command.SessionId, command.ParticipantId);
        if (state is null)
        {
            logger.LogWarning(
                "Hub StartRound failed for session {SessionId} by participant {ParticipantId}.",
                command.SessionId,
                command.ParticipantId);
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Unable to start a round."));
            return;
        }

        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task CastVote(CastVoteCommand command)
    {
        logger.LogInformation(
            "Hub CastVote requested for session {SessionId}, round {RoundId}, participant {ParticipantId}.",
            command.SessionId,
            command.RoundId,
            command.ParticipantId);

        await RegisterConnection(command.SessionId, command.ParticipantId);

        var state = roomStore.CastVote(command.SessionId, command.ParticipantId, command.RoundId, command.Value);
        if (state is null)
        {
            logger.LogWarning(
                "Hub CastVote failed for session {SessionId}, round {RoundId}, participant {ParticipantId}.",
                command.SessionId,
                command.RoundId,
                command.ParticipantId);
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Unable to cast vote."));
            return;
        }

        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task RevealRound(RevealRoundCommand command)
    {
        logger.LogInformation(
            "Hub RevealRound requested for session {SessionId}, round {RoundId}, participant {ParticipantId}.",
            command.SessionId,
            command.RoundId,
            command.ParticipantId);

        await RegisterConnection(command.SessionId, command.ParticipantId);

        var state = roomStore.RevealRound(command.SessionId, command.ParticipantId, command.RoundId);
        if (state is null)
        {
            logger.LogWarning(
                "Hub RevealRound failed for session {SessionId}, round {RoundId}, participant {ParticipantId}.",
                command.SessionId,
                command.RoundId,
                command.ParticipantId);
            await Clients.Caller.SendAsync("Error", new ErrorEnvelope("Unable to reveal this round."));
            return;
        }

        await Clients.Group(command.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
    }

    public async Task LeaveSession(LeaveSessionCommand command)
    {
        logger.LogInformation(
            "Hub LeaveSession requested for session {SessionId} by participant {ParticipantId}.",
            command.SessionId,
            command.ParticipantId);

        RemoveParticipantConnections(command.SessionId, command.ParticipantId);
        await HandleLeave(command.SessionId, command.ParticipantId);
    }

    public async Task ActivateCinemaLogo()
    {
        (string SessionId, string ParticipantId)? connection = null;

        lock (ConnectionGate)
        {
            if (ConnectionMap.TryGetValue(Context.ConnectionId, out var info))
            {
                connection = info;
            }
        }

        if (connection is null)
        {
            logger.LogWarning(
                "Hub ActivateCinemaLogo rejected for unregistered connection {ConnectionId}.",
                Context.ConnectionId);
            return;
        }

        var state = roomStore.GetState(connection.Value.SessionId);
        var participantIsConnected = state?.Participants.Any(participant =>
            participant.ParticipantId == connection.Value.ParticipantId
            && participant.IsConnected) == true;

        if (!participantIsConnected)
        {
            logger.LogWarning(
                "Hub ActivateCinemaLogo rejected for stale participant {ParticipantId} in session {SessionId}.",
                connection.Value.ParticipantId,
                connection.Value.SessionId);
            return;
        }

        logger.LogDebug(
            "Hub ActivateCinemaLogo requested for session {SessionId} by participant {ParticipantId}.",
            connection.Value.SessionId,
            connection.Value.ParticipantId);

        var fruitEffect = SelectCinemaFruitEffect(state!);
        await Clients.Group(connection.Value.SessionId).SendAsync(
            "CinemaLogoActivated",
            new CinemaLogoActivatedEnvelope(fruitEffect));
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        (string SessionId, string ParticipantId)? found = null;
        var becameDisconnected = false;

        lock (ConnectionGate)
        {
            if (ConnectionMap.TryGetValue(Context.ConnectionId, out var info))
            {
                found = info;
                ConnectionMap.Remove(Context.ConnectionId);

                var key = ParticipantKey(info.SessionId, info.ParticipantId);
                if (ParticipantConnections.TryGetValue(key, out var connections))
                {
                    connections.Remove(Context.ConnectionId);
                    if (connections.Count == 0)
                    {
                        ParticipantConnections.Remove(key);
                        becameDisconnected = true;
                    }
                }
            }
        }

        if (found is not null && becameDisconnected)
        {
            logger.LogInformation(
                "Connection {ConnectionId} disconnected; marking participant {ParticipantId} as disconnected in session {SessionId}.",
                Context.ConnectionId,
                found.Value.ParticipantId,
                found.Value.SessionId);

            var state = roomStore.SetParticipantConnection(found.Value.SessionId, found.Value.ParticipantId, false);
            if (state is not null)
            {
                await Clients.Group(found.Value.SessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
            }
        }

        if (exception is not null)
        {
            logger.LogWarning(
                exception,
                "Connection {ConnectionId} disconnected with an exception.",
                Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task RegisterConnection(string sessionId, string participantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);

        lock (ConnectionGate)
        {
            if (ConnectionMap.TryGetValue(Context.ConnectionId, out var existingInfo))
            {
                var existingKey = ParticipantKey(existingInfo.SessionId, existingInfo.ParticipantId);
                if (ParticipantConnections.TryGetValue(existingKey, out var existingConnections))
                {
                    existingConnections.Remove(Context.ConnectionId);
                    if (existingConnections.Count == 0)
                    {
                        ParticipantConnections.Remove(existingKey);
                    }
                }
            }

            ConnectionMap[Context.ConnectionId] = (sessionId, participantId);
            var key = ParticipantKey(sessionId, participantId);
            if (!ParticipantConnections.TryGetValue(key, out var connections))
            {
                connections = new HashSet<string>(StringComparer.Ordinal);
                ParticipantConnections[key] = connections;
            }

            connections.Add(Context.ConnectionId);
        }

        logger.LogDebug(
            "Registered connection {ConnectionId} for session {SessionId}, participant {ParticipantId}.",
            Context.ConnectionId,
            sessionId,
            participantId);
    }

    private static string ParticipantKey(string sessionId, string participantId)
        => $"{sessionId.ToUpperInvariant()}:{participantId}";

    private static CinemaFruitEffect? SelectCinemaFruitEffect(RoomStateDto state)
    {
        var round = state.CurrentRound;
        if (round is null || round.IsRevealed)
        {
            return null;
        }

        var eligibleParticipants = state.Participants
            .Where(participant =>
                participant.IsConnected
                && !round.VotedParticipantIds.Contains(participant.ParticipantId))
            .ToList();
        if (eligibleParticipants.Count == 0)
        {
            return null;
        }

        var participant = eligibleParticipants[Random.Shared.Next(eligibleParticipants.Count)];
        return new CinemaFruitEffect(
            participant.ParticipantId,
            CinemaFruits[Random.Shared.Next(CinemaFruits.Length)]);
    }

    private static void RemoveParticipantConnections(string sessionId, string participantId)
    {
        lock (ConnectionGate)
        {
            var key = ParticipantKey(sessionId, participantId);
            if (!ParticipantConnections.TryGetValue(key, out var connections))
            {
                return;
            }

            foreach (var connectionId in connections)
            {
                ConnectionMap.Remove(connectionId);
            }

            ParticipantConnections.Remove(key);
        }
    }

    private async Task HandleLeave(string sessionId, string participantId)
    {
        var state = roomStore.LeaveSession(sessionId, participantId);
        if (state is not null)
        {
            logger.LogInformation(
                "Participant {ParticipantId} left session {SessionId}; broadcasting updated room state.",
                participantId,
                sessionId);
            await Clients.Group(sessionId).SendAsync("RoomStateUpdated", new RoomStateEnvelope(state));
            return;
        }

        logger.LogInformation(
            "Session {SessionId} closed after participant {ParticipantId} left; broadcasting SessionClosed.",
            sessionId,
            participantId);
        await Clients.Group(sessionId).SendAsync("SessionClosed", new ErrorEnvelope("Session ended."));
    }
}
