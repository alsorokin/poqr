using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
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

    private sealed record ClientEvent(string Group, string Method);

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
                Events.Add(new ClientEvent(Group, (string)args![0]!));
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
