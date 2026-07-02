using Poker.Api.Rooms;

namespace Poker.Api.Tests;

public sealed class RoomStoreTests
{
    [Fact]
    public void CreateSession_CleansName_AndInitializesState()
    {
        var store = new RoomStore();

        var created = store.CreateSession("   Alice   ");

        Assert.Equal(6, created.SessionId.Length);
        Assert.Equal(created.SessionId, created.State.SessionId);
        Assert.Equal(created.ParticipantId, created.State.Participants.Single().ParticipantId);
        Assert.Equal("Alice", created.State.Participants.Single().Name);
        Assert.Null(created.State.CurrentRound);
        Assert.Equal(RoomStore.CardValues, created.State.CardValues);
    }

    [Fact]
    public void CreateSession_DefaultsToAnonymous_AndTruncatesLongNames()
    {
        var store = new RoomStore();

        var anonymous = store.CreateSession("   ");
        var truncated = store.CreateSession(new string('A', 50));

        Assert.Equal("Anonymous", anonymous.State.Participants.Single().Name);
        Assert.Equal(30, truncated.State.Participants.Single().Name.Length);
    }

    [Fact]
    public void JoinSession_ReturnsNull_WhenSessionDoesNotExist()
    {
        var store = new RoomStore();

        var joined = store.JoinSession("MISSING", "Alice", null);

        Assert.Null(joined);
    }

    [Fact]
    public void JoinSession_WithKnownParticipantId_ReusesIdentity_AndUpdatesName()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");

        var rejoin = store.JoinSession(created.SessionId, "  Updated Name  ", created.ParticipantId);

        Assert.NotNull(rejoin);
        Assert.Equal(created.ParticipantId, rejoin.Value.ParticipantId);
        Assert.Single(rejoin.Value.State.Participants);
        Assert.Equal("Updated Name", rejoin.Value.State.Participants.Single().Name);
    }

    [Fact]
    public void RoundLifecycle_ComputesAverage_FromNumericVotesOnly()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");

        var second = store.JoinSession(created.SessionId, "Bob", null);
        var third = store.JoinSession(created.SessionId, "Cara", null);

        Assert.NotNull(second);
        Assert.NotNull(third);

        var started = store.StartRound(created.SessionId, created.ParticipantId);

        Assert.NotNull(started);
        Assert.NotNull(started!.CurrentRound);

        var roundId = started.CurrentRound!.RoundId;

        Assert.NotNull(store.CastVote(created.SessionId, created.ParticipantId, roundId, "3"));
        Assert.NotNull(store.CastVote(created.SessionId, second.Value.ParticipantId, roundId, "5"));
        Assert.NotNull(store.CastVote(created.SessionId, third.Value.ParticipantId, roundId, "Joker"));

        var revealed = store.RevealRound(created.SessionId, created.ParticipantId, roundId);

        Assert.NotNull(revealed);
        Assert.NotNull(revealed!.CurrentRound);
        Assert.True(revealed.CurrentRound!.IsRevealed);
        Assert.Equal(4, revealed.CurrentRound.Average);
        Assert.NotNull(revealed.CurrentRound.RevealedVotes);
        Assert.Equal("Joker", revealed.CurrentRound.RevealedVotes![third.Value.ParticipantId]);
    }

    [Fact]
    public void CastVote_RejectsInvalidCard_WrongRound_AndVotesAfterReveal()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");

        var started = store.StartRound(created.SessionId, created.ParticipantId);
        Assert.NotNull(started);

        var roundId = started!.CurrentRound!.RoundId;

        Assert.Null(store.CastVote(created.SessionId, created.ParticipantId, roundId, "99"));
        Assert.Null(store.CastVote(created.SessionId, created.ParticipantId, "wrong-round", "3"));

        Assert.NotNull(store.RevealRound(created.SessionId, created.ParticipantId, roundId));
        Assert.Null(store.CastVote(created.SessionId, created.ParticipantId, roundId, "3"));
    }

    [Fact]
    public void LeaveSession_RemovesParticipant_AndDeletesRoomWhenEmpty()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");
        var second = store.JoinSession(created.SessionId, "Bob", null);

        Assert.NotNull(second);

        var afterSecondLeaves = store.LeaveSession(created.SessionId, second.Value.ParticipantId);

        Assert.NotNull(afterSecondLeaves);
        Assert.Single(afterSecondLeaves!.Participants);
        Assert.Equal(created.ParticipantId, afterSecondLeaves.Participants.Single().ParticipantId);

        var afterHostLeaves = store.LeaveSession(created.SessionId, created.ParticipantId);

        Assert.Null(afterHostLeaves);
        Assert.Null(store.GetState(created.SessionId));
    }

    [Fact]
    public void SetParticipantConnection_TogglesConnectionStatus_WithoutRemovingParticipant()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");

        var disconnected = store.SetParticipantConnection(created.SessionId, created.ParticipantId, false);

        Assert.NotNull(disconnected);
        Assert.Single(disconnected!.Participants);
        Assert.False(disconnected.Participants.Single().IsConnected);

        var reconnected = store.SetParticipantConnection(created.SessionId, created.ParticipantId, true);

        Assert.NotNull(reconnected);
        Assert.True(reconnected!.Participants.Single().IsConnected);
    }

    [Fact]
    public void SetParticipantConnection_ReturnsNull_WhenParticipantOrSessionMissing()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");

        Assert.Null(store.SetParticipantConnection("MISSING", created.ParticipantId, false));
        Assert.Null(store.SetParticipantConnection(created.SessionId, "missing-participant", false));
    }

    [Fact]
    public void PruneExpiredDisconnectedParticipants_RemovesParticipantAfterGraceWindow()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");
        var second = store.JoinSession(created.SessionId, "Bob", null);

        Assert.NotNull(second);
        var secondParticipant = second!.Value;

        var now = DateTime.UtcNow;
        store.SetParticipantConnection(created.SessionId, secondParticipant.ParticipantId, false, now.AddMinutes(-6));

        var updates = store.PruneExpiredDisconnectedParticipants(now);

        Assert.Single(updates);
        Assert.Equal(created.SessionId, updates[0].SessionId);
        var stateAfterPrune = updates[0].State;
        Assert.NotNull(stateAfterPrune);
        Assert.Single(stateAfterPrune!.Participants);
        Assert.Equal(created.ParticipantId, stateAfterPrune.Participants.Single().ParticipantId);
    }

    [Fact]
    public void PruneExpiredDisconnectedParticipants_KeepsParticipantWithinGraceWindow()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");

        var now = DateTime.UtcNow;
        store.SetParticipantConnection(created.SessionId, created.ParticipantId, false, now.AddMinutes(-4));

        var updates = store.PruneExpiredDisconnectedParticipants(now);

        Assert.Empty(updates);
        var state = store.GetState(created.SessionId);
        Assert.NotNull(state);
        Assert.Single(state!.Participants);
        Assert.False(state.Participants.Single().IsConnected);
    }

    [Fact]
    public void PruneExpiredDisconnectedParticipants_ClosesSessionWhenLastParticipantExpires()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");

        var now = DateTime.UtcNow;
        store.SetParticipantConnection(created.SessionId, created.ParticipantId, false, now.AddMinutes(-6));

        var updates = store.PruneExpiredDisconnectedParticipants(now);

        Assert.Single(updates);
        Assert.Equal(created.SessionId, updates[0].SessionId);
        Assert.Null(updates[0].State);
        Assert.Null(store.GetState(created.SessionId));
    }
}
