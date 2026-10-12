using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionsHubTests
    {
        private static ExpeditionsHub NewHub(int userId, int townId, string connectionId,
            FakeTownAccessService? townAccessService = null,
            FakeMapRouteService? mapRouteService = null,
            FakeExpeditionService? expeditionService = null,
            FakeHubCallerClients? clients = null)
        {
            var hub = new ExpeditionsHub(
                expeditionService ?? new FakeExpeditionService(),
                mapRouteService ?? new FakeMapRouteService(),
                townAccessService ?? new FakeTownAccessService(),
                new FakeUserInfoProvider { UserId = userId, TownDetail = townId > 0 ? new SimpleMeTownDetailDto { TownId = townId } : null! },
                NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance)
            {
                Context = new FakeHubCallerContext(connectionId),
                Clients = clients ?? new FakeHubCallerClients(),
                Groups = new FakeGroupManager()
            };
            return hub;
        }

        private static ConcurrentDictionary<string, int> GetTownIdBySocketToken()
        {
            var field = typeof(ExpeditionsHub).GetField("_townIdBySocketToken", BindingFlags.NonPublic | BindingFlags.Static)!;
            return (ConcurrentDictionary<string, int>)field.GetValue(null)!;
        }

        [Fact]
        public async Task OnDisconnectedAsync_RetireLaConnexionDeTownIdBySocketToken()
        {
            var connectionId = Guid.NewGuid().ToString();
            var hub = NewHub(userId: 1, townId: 42, connectionId);

            await hub.OnConnectedAsync();
            GetTownIdBySocketToken().Should().ContainKey(connectionId);

            await hub.OnDisconnectedAsync(null);

            GetTownIdBySocketToken().Should().NotContainKey(connectionId);
        }

        private static ConcurrentDictionary<int, ConcurrentDictionary<string, int>> GetConnectedUsersByTownByConnexionId()
        {
            var field = typeof(ExpeditionsHub).GetField("_connectedUsersByTownByConnexionId", BindingFlags.NonPublic | BindingFlags.Static)!;
            return (ConcurrentDictionary<int, ConcurrentDictionary<string, int>>)field.GetValue(null)!;
        }

        [Fact]
        public async Task OnConnectedAsync_NeCreeAucunePresenceEtNeDiffuseRien()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 1, townId: townId, connectionId: Guid.NewGuid().ToString(), clients: clients);

            await hub.OnConnectedAsync();

            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(townId);
            clients.Proxy.Sent.Should().BeEmpty();
        }

        [Fact]
        public void JoinPresence_ConnexionsConcurrentesSurUneNouvelleVille_NAucunePerdue()
        {
            const int connectionCount = 30;
            var townId = new Random().Next(1, int.MaxValue);
            var hubs = Enumerable.Range(0, connectionCount)
                .Select(i => NewHub(userId: 1000 + i, townId: townId, connectionId: Guid.NewGuid().ToString()))
                .ToList();

            using var gate = new ManualResetEventSlim(false);
            var threads = hubs.Select(hub => new Thread(() =>
            {
                gate.Wait();
                hub.OnConnectedAsync().GetAwaiter().GetResult();
                hub.JoinPresence().GetAwaiter().GetResult();
            })).ToList();

            threads.ForEach(thread => thread.Start());
            gate.Set();
            threads.ForEach(thread => thread.Join());

            GetConnectedUsersByTownByConnexionId()[townId].Count.Should().Be(connectionCount);
        }

        [Fact]
        public async Task JoinPresence_EnregistreLaPresence_DiffuseUserJoinedEtRenvoieLaListe()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 7, townId: townId, connectionId: Guid.NewGuid().ToString(), clients: clients);
            await hub.OnConnectedAsync();

            var connectedUserIds = await hub.JoinPresence();

            connectedUserIds.Should().Equal(7);
            clients.Proxy.Sent.Select(sent => sent.Method).Should().Equal("UserJoined");
            ((string)clients.Proxy.Sent[0].Args[0]!).FromJson<List<int>>().Should().Equal(7);
        }

        [Fact]
        public async Task JoinPresence_DeuxFois_UneSeuleEntree()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var connectionId = Guid.NewGuid().ToString();
            var hub = NewHub(userId: 7, townId: townId, connectionId: connectionId);
            await hub.OnConnectedAsync();

            await hub.JoinPresence();
            var connectedUserIds = await hub.JoinPresence();

            connectedUserIds.Should().Equal(7);
            GetConnectedUsersByTownByConnexionId()[townId].Should().HaveCount(1);
        }

        [Fact]
        public async Task JoinPresence_JetonSansVille_ListeVideEtRienDiffuse()
        {
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 1, townId: 0, connectionId: Guid.NewGuid().ToString(), clients: clients);
            await hub.OnConnectedAsync();

            var connectedUserIds = await hub.JoinPresence();

            connectedUserIds.Should().BeEmpty();
            clients.Proxy.Sent.Should().BeEmpty();
        }

        [Fact]
        public async Task LeavePresence_RetireLaPresenceEtDiffuseUserLeft_SansQuitterLeGroupe()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var connectionId = Guid.NewGuid().ToString();
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 7, townId: townId, connectionId: connectionId, clients: clients);
            await hub.OnConnectedAsync();
            await hub.JoinPresence();
            clients.Proxy.Sent.Clear();

            await hub.LeavePresence();

            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(townId);
            GetTownIdBySocketToken()[connectionId].Should().Be(townId);
            clients.Proxy.Sent.Select(sent => sent.Method).Should().Equal("UserLeft");
            ((string)clients.Proxy.Sent[0].Args[0]!).FromJson<List<int>>().Should().BeEmpty();
            await hub.OnDisconnectedAsync(null);
        }

        [Fact]
        public async Task LeavePresence_MemeJoueurPresentSurUneAutreConnexion_NeDiffuseRien()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var clients = new FakeHubCallerClients();
            var hubA = NewHub(userId: 7, townId: townId, connectionId: Guid.NewGuid().ToString(), clients: clients);
            var hubB = NewHub(userId: 7, townId: townId, connectionId: Guid.NewGuid().ToString(), clients: clients);
            await hubA.OnConnectedAsync();
            await hubB.OnConnectedAsync();
            await hubA.JoinPresence();
            await hubB.JoinPresence();
            clients.Proxy.Sent.Clear();

            await hubA.LeavePresence();

            clients.Proxy.Sent.Should().BeEmpty();
            GetConnectedUsersByTownByConnexionId()[townId].Should().HaveCount(1);
            await hubA.OnDisconnectedAsync(null);
            await hubB.OnDisconnectedAsync(null);
        }

        [Fact]
        public async Task LeavePresence_SansPresence_NeFaitRien()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 7, townId: townId, connectionId: Guid.NewGuid().ToString(), clients: clients);
            await hub.OnConnectedAsync();

            await hub.LeavePresence();

            clients.Proxy.Sent.Should().BeEmpty();
            await hub.OnDisconnectedAsync(null);
        }

        [Fact]
        public async Task OnDisconnectedAsync_DerniereConnexionPresenteDeLaVille_RetireLEntreeDeLaVille()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var hub = NewHub(userId: 1, townId: townId, connectionId: Guid.NewGuid().ToString());
            await hub.OnConnectedAsync();
            await hub.JoinPresence();

            await hub.OnDisconnectedAsync(null);

            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(townId);
        }

        [Fact]
        public async Task OnDisconnectedAsync_DautresConnexionsPresentesSurLaVille_GardeLEntreeDeLaVille()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var hubA = NewHub(userId: 1, townId: townId, connectionId: Guid.NewGuid().ToString());
            var hubB = NewHub(userId: 2, townId: townId, connectionId: Guid.NewGuid().ToString());
            await hubA.OnConnectedAsync();
            await hubB.OnConnectedAsync();
            await hubA.JoinPresence();
            await hubB.JoinPresence();

            await hubA.OnDisconnectedAsync(null);

            GetConnectedUsersByTownByConnexionId().Should().ContainKey(townId);
            GetConnectedUsersByTownByConnexionId()[townId].Should().HaveCount(1);
        }

        [Fact]
        public async Task OnConnectedAsync_JetonSansVille_AucunGroupe()
        {
            var connectionId = Guid.NewGuid().ToString();
            var hub = NewHub(userId: 1, townId: 0, connectionId);

            await hub.OnConnectedAsync();
            await hub.OnDisconnectedAsync(null);

            GetTownIdBySocketToken().Should().NotContainKey(connectionId);
        }

        [Fact]
        public async Task JoinTown_ConnexionPresente_LaPresenceSuitLaConnexionSurLaNouvelleVille()
        {
            var fromTownId = new Random().Next(1, int.MaxValue / 2);
            var toTownId = fromTownId + 1;
            var connectionId = Guid.NewGuid().ToString();
            var hub = NewHub(userId: 1, townId: fromTownId, connectionId);
            await hub.OnConnectedAsync();
            await hub.JoinPresence();

            await hub.JoinTown(toTownId);

            GetTownIdBySocketToken()[connectionId].Should().Be(toTownId);
            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(fromTownId);
            GetConnectedUsersByTownByConnexionId()[toTownId].Should().ContainKey(connectionId);

            await hub.OnDisconnectedAsync(null);
            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(toTownId);
        }

        [Fact]
        public async Task JoinTown_ConnexionAbsente_BasculeLeGroupeSansCreerDePresence()
        {
            var fromTownId = new Random().Next(1, int.MaxValue / 2);
            var toTownId = fromTownId + 1;
            var connectionId = Guid.NewGuid().ToString();
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 1, townId: fromTownId, connectionId, clients: clients);
            await hub.OnConnectedAsync();

            await hub.JoinTown(toTownId);

            GetTownIdBySocketToken()[connectionId].Should().Be(toTownId);
            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(fromTownId);
            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(toTownId);
            clients.Proxy.Sent.Should().BeEmpty();
            await hub.OnDisconnectedAsync(null);
        }

        [Fact]
        public async Task JoinTown_NonCitoyen_Refuse_ConnexionInchangee()
        {
            var fromTownId = new Random().Next(1, int.MaxValue / 2);
            var toTownId = fromTownId + 1;
            var connectionId = Guid.NewGuid().ToString();
            var hub = NewHub(userId: 1, townId: fromTownId, connectionId, townAccessService: new FakeTownAccessService { Allow = false });
            await hub.OnConnectedAsync();
            await hub.JoinPresence();

            Func<Task> act = () => hub.JoinTown(toTownId);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            GetTownIdBySocketToken()[connectionId].Should().Be(fromTownId);
            GetConnectedUsersByTownByConnexionId()[fromTownId].Should().ContainKey(connectionId);
            await hub.OnDisconnectedAsync(null);
        }

        [Fact]
        public async Task SaveMapRoute_VersionPerimee_HubExceptionPrefixee()
        {
            var mapRouteService = new FakeMapRouteService { SaveException = new MhoConflictException("périmé") };
            var hub = NewHub(userId: 1, townId: 42, Guid.NewGuid().ToString(), mapRouteService: mapRouteService);
            var requestAsJson = new MapRouteRequestDto { Id = 3, Version = 1, Label = "tracé" }.ToJson();

            Func<Task> act = () => hub.SaveMapRoute(42, requestAsJson);

            (await act.Should().ThrowAsync<HubException>()).Which.Message.Should().StartWith(MhoConflictException.HubMessagePrefix);
        }

        [Fact]
        public async Task PostExpeditionPart_DiffuseLesTracesDontLesPartiesLieesOntChange()
        {
            var expeditionService = new FakeExpeditionService();
            expeditionService.PendingMapRouteChanges.Add(new MapRouteChangeDto { Id = 7, Version = 3 });
            expeditionService.PendingMapRouteChanges.Add(new MapRouteChangeDto { Id = 9, Version = 1 });
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 1, townId: 42, Guid.NewGuid().ToString(), expeditionService: expeditionService, clients: clients);
            var requestAsJson = new ExpeditionPartRequestDto { Id = 5, MapRouteId = 7 }.ToJson();

            await hub.PostExpeditionPart(11, requestAsJson);

            clients.Proxy.Sent.Select(sent => sent.Method).Should().Equal("ExpeditionPartUpdated", "MapRouteChanged", "MapRouteChanged");
            clients.Proxy.Sent.Skip(1).Select(sent => ((MapRouteChangeDto)sent.Args[0]!).Id).Should().Equal(7, 9);
            expeditionService.PendingMapRouteChanges.Should().BeEmpty();
        }

        [Fact]
        public async Task SaveMapRoute_DiffuseLesPartiesLiees()
        {
            var mapRouteService = new FakeMapRouteService();
            mapRouteService.LinkedPartIds.AddRange(new[] { 5, 8 });
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 1, townId: 42, Guid.NewGuid().ToString(), mapRouteService: mapRouteService, clients: clients);
            var requestAsJson = new MapRouteRequestDto { Id = 3, Version = 1, Label = "tracé" }.ToJson();

            await hub.SaveMapRoute(42, requestAsJson);

            clients.Proxy.Sent.Select(sent => sent.Method).Should().Equal("MapRouteChanged", "ExpeditionPartUpdated", "ExpeditionPartUpdated");
            clients.Proxy.Sent.Skip(1).Select(sent => ((ExpeditionPartDto)sent.Args[0]!).Id).Should().Equal(5, 8);
        }

        [Fact]
        public async Task SaveMapRoute_RenvoieLeTraceEnregistre()
        {
            var hub = NewHub(userId: 1, townId: 42, Guid.NewGuid().ToString());
            var requestAsJson = new MapRouteRequestDto { Id = 3, Version = 1, Label = "tracé" }.ToJson();

            var result = await hub.SaveMapRoute(42, requestAsJson);

            result.Id.Should().Be(3);
            result.Version.Should().Be(2);
        }

        [Fact]
        public async Task CopyGameRoute_RenvoieLeTraceEtLAnnonceALaVille()
        {
            var clients = new FakeHubCallerClients();
            var hub = NewHub(userId: 1, townId: 42, Guid.NewGuid().ToString(), clients: clients);

            var result = await hub.CopyGameRoute(42, 5);

            result.Id.Should().Be(105);
            clients.Proxy.Sent.Select(sent => sent.Method).Should().Equal("MapRouteChanged");
            ((MapRouteChangeDto)clients.Proxy.Sent[0].Args[0]!).Id.Should().Be(105);
        }
    }
}
