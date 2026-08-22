using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Poqr.Api.Contracts;
using Poqr.Api.Hubs;
using Poqr.Api.Rooms;

namespace Poqr.Api.Tests;

public sealed class PokerHubTests
{
    [Fact]
    public async Task ActivateCinemaLogo_BroadcastsEveryValidActivation_AndRejectsUnregisteredOrStaleConnections()
    {
        var store = new RoomStore();
        var created = store.CreateSession("Host");
        var callerClients = CreateCallerClients(out var clients);
        var hub = CreateHub(store, callerClients, Guid.NewGuid().ToString("N"));

        await hub.JoinSession(new(created.SessionId, created.ParticipantId));

        await hub.ActivateCinemaLogo();
        await hub.ActivateCinemaLogo();

        var started = store.StartRound(created.SessionId, created.ParticipantId);
        Assert.NotNull(started);
        await hub.ActivateCinemaLogo();

        Assert.NotNull(store.RevealRound(created.SessionId, created.ParticipantId, started!.CurrentRound!.RoundId));
        await hub.ActivateCinemaLogo();

        Assert.Equal(4, clients.Events.Count(eventInfo => eventInfo.Method == "CinemaLogoActivated"));
        Assert.All(
            clients.Events.Where(eventInfo => eventInfo.Method == "CinemaLogoActivated"),
            eventInfo => Assert.Equal(created.SessionId, eventInfo.Group));

        var unregisteredHub = CreateHub(store, callerClients, Guid.NewGuid().ToString("N"));
        await unregisteredHub.ActivateCinemaLogo();
        Assert.Equal(4, clients.Events.Count(eventInfo => eventInfo.Method == "CinemaLogoActivated"));

        store.LeaveSession(created.SessionId, created.ParticipantId);
        await hub.ActivateCinemaLogo();
        Assert.Equal(4, clients.Events.Count(eventInfo => eventInfo.Method == "CinemaLogoActivated"));
    }

    [Fact]
    public async Task ActivateCinemaLogo_IncludesFruitOnlyForConnectedUnvotedParticipantsInAnActiveRound()
    {
        var store = new RoomStore();
        var host = store.CreateSession("Host");
        var second = store.JoinSession(host.SessionId, "Second", null);
        Assert.NotNull(second);

        var callerClients = CreateCallerClients(out var clients);
        var hub = CreateHub(store, callerClients, Guid.NewGuid().ToString("N"));
        await hub.JoinSession(new(host.SessionId, host.ParticipantId));

        await hub.ActivateCinemaLogo();
        Assert.Null(FruitEffect(clients.Events.Last()));

        var started = store.StartRound(host.SessionId, host.ParticipantId);
        Assert.NotNull(started);
        var stateBeforeActivation = store.GetState(host.SessionId);

        await hub.ActivateCinemaLogo();
        var activeFruit = FruitEffect(clients.Events.Last());
        Assert.NotNull(activeFruit);
        Assert.Contains(activeFruit!.ParticipantId, new[] { host.ParticipantId, second.Value.ParticipantId });
        Assert.Contains(activeFruit.Fruit, new[] { "🍎", "🍌", "🍇", "🍓", "🍍", "🍉" });

        var stateAfterActivation = store.GetState(host.SessionId);
        Assert.Equal(stateBeforeActivation!.CurrentRound!.VotedParticipantIds, stateAfterActivation!.CurrentRound!.VotedParticipantIds);
        Assert.Equal(stateBeforeActivation.CurrentRound.IsRevealed, stateAfterActivation.CurrentRound.IsRevealed);

        Assert.NotNull(store.CastVote(host.SessionId, host.ParticipantId, started!.CurrentRound!.RoundId, "3"));
        Assert.NotNull(store.CastVote(host.SessionId, second.Value.ParticipantId, started.CurrentRound.RoundId, "5"));
        await hub.ActivateCinemaLogo();
        Assert.Null(FruitEffect(clients.Events.Last()));

        Assert.NotNull(store.RevealRound(host.SessionId, host.ParticipantId, started.CurrentRound.RoundId));
        await hub.ActivateCinemaLogo();
        Assert.Null(FruitEffect(clients.Events.Last()));

        var disconnectedStore = new RoomStore();
        var disconnectedHost = disconnectedStore.CreateSession("Host");
        var disconnectedSecond = disconnectedStore.JoinSession(disconnectedHost.SessionId, "Second", null);
        Assert.NotNull(disconnectedSecond);
        Assert.NotNull(disconnectedStore.SetParticipantConnection(
            disconnectedHost.SessionId,
            disconnectedSecond.Value.ParticipantId,
            false));
        Assert.NotNull(disconnectedStore.StartRound(disconnectedHost.SessionId, disconnectedHost.ParticipantId));

        var disconnectedClients = CreateCallerClients(out var disconnectedRecorder);
        var disconnectedHub = CreateHub(disconnectedStore, disconnectedClients, Guid.NewGuid().ToString("N"));
        await disconnectedHub.JoinSession(new(disconnectedHost.SessionId, disconnectedHost.ParticipantId));
        await disconnectedHub.ActivateCinemaLogo();
        Assert.Equal(disconnectedHost.ParticipantId, FruitEffect(disconnectedRecorder.Events.Last())!.ParticipantId);
    }

    private static PokerHub CreateHub(RoomStore store, IHubCallerClients clients, string connectionId)
        => new(store, NullLogger<PokerHub>.Instance)
        {
            Context = new TestHubCallerContext(connectionId),
            Clients = clients,
            Groups = DispatchProxy.Create<IGroupManager, CompletedTaskProxy>()
        };

    private static IHubCallerClients CreateCallerClients(out RecordingHubCallerClients recorder)
    {
        var clients = DispatchProxy.Create<IHubCallerClients, RecordingHubCallerClients>();
        recorder = (RecordingHubCallerClients)(object)clients;
        return clients;
    }

    private static CinemaFruitEffect? FruitEffect(ClientEvent clientEvent)
    {
        var envelope = Assert.IsType<CinemaLogoActivatedEnvelope>(Assert.Single(clientEvent.Arguments));
        return envelope.FruitEffect;
    }

    private sealed record ClientEvent(string Group, string Method, IReadOnlyList<object?> Arguments);

    private class RecordingHubCallerClients : DispatchProxy
    {
        public List<ClientEvent> Events { get; } = [];

        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args)
        {
            if (targetMethod?.Name == "Group")
            {
                var client = DispatchProxy.Create<IClientProxy, RecordingClientProxy>();
                ((RecordingClientProxy)(object)client).Group = (string)args![0]!;
                ((RecordingClientProxy)(object)client).Events = Events;
                return client;
            }

            var fallbackClient = DispatchProxy.Create<IClientProxy, RecordingClientProxy>();
            ((RecordingClientProxy)(object)fallbackClient).Events = Events;
            return fallbackClient;
        }
    }

    private class RecordingClientProxy : DispatchProxy
    {
        public string Group { get; set; } = string.Empty;
        public List<ClientEvent> Events { get; set; } = [];

        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args)
        {
            if (targetMethod?.Name == "SendCoreAsync")
            {
                var arguments = (object?[]?)args![1] ?? [];
                Events.Add(new ClientEvent(Group, (string)args[0]!, arguments));
            }

            return Task.CompletedTask;
        }
    }

    private class CompletedTaskProxy : DispatchProxy
    {
        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args) => Task.CompletedTask;
    }

    private sealed class TestHubCallerContext(string connectionId) : HubCallerContext
    {
        public override string ConnectionId => connectionId;
        public override string? UserIdentifier => null;
        public override ClaimsPrincipal? User => null;
        public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
        public override IFeatureCollection Features { get; } = new FeatureCollection();
        public override CancellationToken ConnectionAborted => CancellationToken.None;

        public override void Abort()
        {
        }
    }
}
