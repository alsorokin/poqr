namespace Poker.Api.Contracts;

public sealed record CreateSessionRequest(string ParticipantName);
public sealed record JoinSessionRequest(string ParticipantName, string? ParticipantId);

public sealed record SessionJoinResponse(string SessionId, string ParticipantId, RoomStateDto State);

public sealed record ParticipantDto(string ParticipantId, string Name, bool IsConnected);

public sealed record RoundStateDto(
    string RoundId,
    bool IsRevealed,
    IReadOnlyList<string> VotedParticipantIds,
    IReadOnlyDictionary<string, string>? RevealedVotes,
    double? Average);

public sealed record RoomStateDto(
    string SessionId,
    IReadOnlyList<ParticipantDto> Participants,
    RoundStateDto? CurrentRound,
    IReadOnlyList<string> CardValues);

public sealed record StartRoundCommand(string SessionId, string ParticipantId);
public sealed record JoinHubSessionCommand(string SessionId, string ParticipantId);
public sealed record CastVoteCommand(string SessionId, string ParticipantId, string RoundId, string Value);
public sealed record RevealRoundCommand(string SessionId, string ParticipantId, string RoundId);
public sealed record LeaveSessionCommand(string SessionId, string ParticipantId);

public sealed record RoomStateEnvelope(RoomStateDto State);
public sealed record ErrorEnvelope(string Message);
