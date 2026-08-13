using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionsHubTests
    {
        private static ExpeditionsHub NewHub(int userId, int townId, string connectionId)
        {
            var hub = new ExpeditionsHub(
                new FakeExpeditionService(),
                new FakeUserInfoProvider { UserId = userId, TownDetail = new SimpleMeTownDetailDto { TownId = townId } },
                NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance)
            {
                Context = new FakeHubCallerContext(connectionId),
                Clients = new FakeHubCallerClients(),
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
        public void OnConnectedAsync_ConnexionsConcurrentesSurUneNouvelleVille_NAucunePerdue()
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
            })).ToList();

            threads.ForEach(thread => thread.Start());
            gate.Set();
            threads.ForEach(thread => thread.Join());

            GetConnectedUsersByTownByConnexionId()[townId].Count.Should().Be(connectionCount);
        }

        [Fact]
        public async Task OnDisconnectedAsync_DerniereConnexionDeLaVille_RetireLEntreeDeLaVille()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var hub = NewHub(userId: 1, townId: townId, connectionId: Guid.NewGuid().ToString());
            await hub.OnConnectedAsync();

            await hub.OnDisconnectedAsync(null);

            GetConnectedUsersByTownByConnexionId().Should().NotContainKey(townId);
        }

        [Fact]
        public async Task OnDisconnectedAsync_DautresConnexionsRestantSurLaVille_GardeLEntreeDeLaVille()
        {
            var townId = new Random().Next(1, int.MaxValue);
            var hubA = NewHub(userId: 1, townId: townId, connectionId: Guid.NewGuid().ToString());
            var hubB = NewHub(userId: 2, townId: townId, connectionId: Guid.NewGuid().ToString());
            await hubA.OnConnectedAsync();
            await hubB.OnConnectedAsync();

            await hubA.OnDisconnectedAsync(null);

            GetConnectedUsersByTownByConnexionId().Should().ContainKey(townId);
            GetConnectedUsersByTownByConnexionId()[townId].Should().HaveCount(1);
        }
    }
}
