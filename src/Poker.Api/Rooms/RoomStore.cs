using Poker.Api.Contracts;

namespace Poker.Api.Rooms;

public sealed class RoomStore
{
    public static readonly string[] CardValues = ["1", "2", "3", "5", "8", "13", "21", "Joker"];
    public static readonly TimeSpan DisconnectedParticipantGracePeriod = TimeSpan.FromMinutes(5);

    private readonly Lock _gate = new();
    private readonly Dictionary<string, Room> _rooms = new(StringComparer.OrdinalIgnoreCase);

    public sealed record CleanupResult(string SessionId, RoomStateDto? State);

    public (string SessionId, string ParticipantId, RoomStateDto State) CreateSession(string participantName)
    {
        var sessionId = GenerateSessionId();
        var participantId = Guid.NewGuid().ToString("N");

        lock (_gate)
        {
            var room = new Room(sessionId);
            room.Participants[participantId] = new Participant(participantId, CleanName(participantName));
            room.Touch();
            _rooms[sessionId] = room;
            return (sessionId, participantId, BuildState(room));
        }
    }

    public (string ParticipantId, RoomStateDto State)? JoinSession(string sessionId, string participantName, string? participantId)
    {
        lock (_gate)
        {
            if (!_rooms.TryGetValue(sessionId, out var room))
            {
                return null;
            }

            var cleanedName = CleanName(participantName);
            if (!string.IsNullOrWhiteSpace(participantId) && room.Participants.TryGetValue(participantId, out var existing))
            {
                existing.Name = cleanedName;
                existing.IsConnected = true;
                room.Touch();
                return (existing.ParticipantId, BuildState(room));
            }

            var newId = Guid.NewGuid().ToString("N");
            room.Participants[newId] = new Participant(newId, cleanedName);
            room.Touch();
            return (newId, BuildState(room));
        }
    }

    public RoomStateDto? GetState(string sessionId)
    {
        lock (_gate)
        {
            return _rooms.TryGetValue(sessionId, out var room) ? BuildState(room) : null;
        }
    }

    public RoomStateDto? StartRound(string sessionId, string participantId)
    {
        lock (_gate)
        {
            if (!TryGetRoomAndParticipant(sessionId, participantId, out var room))
            {
                return null;
            }

            room.CurrentRound = new Round(Guid.NewGuid().ToString("N"));
            room.Touch();
            return BuildState(room);
        }
    }

    public RoomStateDto? CastVote(string sessionId, string participantId, string roundId, string value)
    {
        lock (_gate)
        {
            if (!TryGetRoomAndParticipant(sessionId, participantId, out var room) || room.CurrentRound is null)
            {
                return null;
            }

            if (room.CurrentRound.RoundId != roundId || room.CurrentRound.IsRevealed)
            {
                return null;
            }

            if (!CardValues.Contains(value, StringComparer.Ordinal))
            {
                return null;
            }

            room.CurrentRound.Votes[participantId] = value;
            room.Touch();
            return BuildState(room);
        }
    }

    public RoomStateDto? RevealRound(string sessionId, string participantId, string roundId)
    {
        lock (_gate)
        {
            if (!TryGetRoomAndParticipant(sessionId, participantId, out var room) || room.CurrentRound is null)
            {
                return null;
            }

            if (room.CurrentRound.RoundId != roundId)
            {
                return null;
            }

            room.CurrentRound.IsRevealed = true;
            room.Touch();
            return BuildState(room);
        }
    }

    public RoomStateDto? LeaveSession(string sessionId, string participantId)
    {
        lock (_gate)
        {
            if (!_rooms.TryGetValue(sessionId, out var room))
            {
                return null;
            }

            room.Participants.Remove(participantId);
            if (room.Participants.Count == 0)
            {
                _rooms.Remove(sessionId);
                return null;
            }

            room.Touch();
            return BuildState(room);
        }
    }

    public RoomStateDto? SetParticipantConnection(string sessionId, string participantId, bool isConnected, DateTime? changedAtUtc = null)
    {
        lock (_gate)
        {
            if (!_rooms.TryGetValue(sessionId, out var room))
            {
                return null;
            }

            PruneExpiredDisconnectedParticipants(room, changedAtUtc ?? DateTime.UtcNow);
            if (room.Participants.Count == 0)
            {
                _rooms.Remove(sessionId);
                return null;
            }

            if (!room.Participants.TryGetValue(participantId, out var participant))
            {
                return null;
            }

            participant.IsConnected = isConnected;
            participant.DisconnectedSinceUtc = isConnected ? null : (changedAtUtc ?? DateTime.UtcNow);
            room.Touch();
            return BuildState(room);
        }
    }

    public IReadOnlyList<CleanupResult> PruneExpiredDisconnectedParticipants(DateTime? nowUtc = null)
    {
        var updates = new List<CleanupResult>();

        lock (_gate)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            foreach (var sessionId in _rooms.Keys.ToList())
            {
                var room = _rooms[sessionId];
                var removedAny = PruneExpiredDisconnectedParticipants(room, now);
                if (!removedAny)
                {
                    continue;
                }

                if (room.Participants.Count == 0)
                {
                    _rooms.Remove(sessionId);
                    updates.Add(new CleanupResult(sessionId, null));
                    continue;
                }

                room.Touch();
                updates.Add(new CleanupResult(sessionId, BuildState(room)));
            }
        }

        return updates;
    }

    private static string GenerateSessionId()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Span<char> id = stackalloc char[6];
        var rng = Random.Shared;
        for (var i = 0; i < id.Length; i++)
        {
            id[i] = chars[rng.Next(chars.Length)];
        }

        return new string(id);
    }

    private bool TryGetRoomAndParticipant(string sessionId, string participantId, out Room room)
    {
        room = null!;
        if (!_rooms.TryGetValue(sessionId, out var existingRoom))
        {
            return false;
        }

        if (!existingRoom.Participants.ContainsKey(participantId))
        {
            return false;
        }

        room = existingRoom;
        return true;
    }

    private static string CleanName(string input)
    {
        var value = string.IsNullOrWhiteSpace(input) ? "Anonymous" : input.Trim();
        return value.Length > 30 ? value[..30] : value;
    }

    private static bool PruneExpiredDisconnectedParticipants(Room room, DateTime nowUtc)
    {
        var staleParticipantIds = room.Participants.Values
            .Where(participant =>
                !participant.IsConnected
                && participant.DisconnectedSinceUtc.HasValue
                && nowUtc - participant.DisconnectedSinceUtc.Value >= DisconnectedParticipantGracePeriod)
            .Select(participant => participant.ParticipantId)
            .ToList();

        if (staleParticipantIds.Count == 0)
        {
            return false;
        }

        foreach (var participantId in staleParticipantIds)
        {
            room.Participants.Remove(participantId);
            room.CurrentRound?.Votes.Remove(participantId);
        }

        return true;
    }

    private static RoomStateDto BuildState(Room room)
    {
        RoundStateDto? round = null;

        if (room.CurrentRound is not null)
        {
            var votes = room.CurrentRound.Votes;
            var revealedVotes = room.CurrentRound.IsRevealed
                ? new Dictionary<string, string>(votes, StringComparer.Ordinal)
                : null;

            double? average = null;
            if (room.CurrentRound.IsRevealed)
            {
                var numericVotes = votes.Values
                    .Select(value => int.TryParse(value, out var parsed) ? parsed : (int?)null)
                    .Where(value => value.HasValue)
                    .Select(value => value!.Value)
                    .ToList();

                if (numericVotes.Count > 0)
                {
                    average = Math.Round(numericVotes.Average(), 2, MidpointRounding.AwayFromZero);
                }
            }

            round = new RoundStateDto(
                room.CurrentRound.RoundId,
                room.CurrentRound.IsRevealed,
                votes.Keys.ToList(),
                revealedVotes,
                average);
        }

        return new RoomStateDto(
            room.SessionId,
            room.Participants.Values
                .OrderBy(p => p.JoinedAtUtc)
                .Select(p => new ParticipantDto(p.ParticipantId, p.Name, p.IsConnected))
                .ToList(),
            round,
            CardValues);
    }

    private sealed class Room(string sessionId)
    {
        public string SessionId { get; } = sessionId;
        public Dictionary<string, Participant> Participants { get; } = new(StringComparer.Ordinal);
        public Round? CurrentRound { get; set; }
        public DateTime LastActivityUtc { get; private set; } = DateTime.UtcNow;

        public void Touch() => LastActivityUtc = DateTime.UtcNow;
    }

    private sealed class Participant(string participantId, string name)
    {
        public string ParticipantId { get; } = participantId;
        public string Name { get; set; } = name;
        public DateTime JoinedAtUtc { get; } = DateTime.UtcNow;
        public bool IsConnected { get; set; } = true;
        public DateTime? DisconnectedSinceUtc { get; set; }
    }

    private sealed class Round(string roundId)
    {
        public string RoundId { get; } = roundId;
        public bool IsRevealed { get; set; }
        public Dictionary<string, string> Votes { get; } = new(StringComparer.Ordinal);
    }
}
