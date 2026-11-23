using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Services.Impl.Expeditions;
using MyHordesOptimizerApi.Services.Impl.Locks;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionsHubLockTests
    {
        private const string LockChanged = "ExpeditionLockChanged";

        private static ExpeditionsHub NewHub(int userId, int townId, string connectionId, ExpeditionLockRegistry registry,
            FakeHubCallerClients? clients = null,
            FakeExpeditionService? expeditionService = null,
            FakeExpeditionLockScopeService? lockScope = null)
        {
            return new ExpeditionsHub(
                expeditionService ?? new FakeExpeditionService(),
                new FakeMapRouteService(),
                new FakeTownAccessService(),
                new FakeUserInfoProvider { UserId = userId, TownDetail = new SimpleMeTownDetailDto { TownId = townId } },
                registry,
                lockScope ?? new FakeExpeditionLockScopeService(),
                NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance)
            {
                Context = new FakeHubCallerContext(connectionId),
                Clients = clients ?? new FakeHubCallerClients(),
                Groups = new FakeGroupManager()
            };
        }

        private static ExpeditionLockRegistry NewRegistry() => new(TimeProvider.System);

        [Fact]
        public async Task AcquireLock_Libre_AccordeEtDiffuse()
        {
            var clients = new FakeHubCallerClients();
            var hub = NewHub(7, 101, "c1", NewRegistry(), clients);

            var dto = await hub.AcquireLock("part-orders", 5);

            dto.HolderUserId.Should().Be(7);
            dto.Kind.Should().Be("part-orders");
            dto.EntityId.Should().Be(5);
            clients.Proxy.Sent.Select(s => s.Method).Should().Equal(LockChanged);
        }

        [Fact]
        public async Task AcquireLock_TenuParAutreConnexion_RenvoieLeDetenteurSansDiffuser()
        {
            var registry = NewRegistry();
            await NewHub(7, 101, "c1", registry).AcquireLock("part", 5);
            var clients = new FakeHubCallerClients();

            var dto = await NewHub(8, 101, "c2", registry, clients).AcquireLock("part", 5);

            dto.HolderUserId.Should().Be(7);
            dto.HolderConnectionId.Should().Be("c1");
            clients.Proxy.Sent.Should().BeEmpty();
        }

        [Fact]
        public async Task AcquireLock_KindInconnu_LeveHubException()
        {
            var hub = NewHub(7, 101, "c1", NewRegistry());

            var act = () => hub.AcquireLock("n-importe-quoi", 5);

            await act.Should().ThrowAsync<HubException>();
        }

        [Fact]
        public async Task ReleaseLock_DiffuseLeVerrouLibre()
        {
            var registry = NewRegistry();
            var clients = new FakeHubCallerClients();
            var hub = NewHub(7, 101, "c1", registry, clients);
            await hub.AcquireLock("citizen", 3);
            clients.Proxy.Sent.Clear();

            await hub.ReleaseLock("citizen", 3);

            clients.Proxy.Sent.Should().ContainSingle();
            var dto = (ExpeditionLockDto)clients.Proxy.Sent[0].Args[0]!;
            dto.HolderUserId.Should().BeNull();
            dto.Kind.Should().Be("citizen");
            dto.EntityId.Should().Be(3);
        }

        [Fact]
        public async Task OnDisconnectedAsync_LibereEtDiffuseTousLesVerrousDeLaConnexion()
        {
            var registry = NewRegistry();
            var clients = new FakeHubCallerClients();
            var hub = NewHub(7, 101, "c-disc", registry, clients);
            await hub.AcquireLock("part", 1);
            await hub.AcquireLock("bag", 2);
            clients.Proxy.Sent.Clear();

            await hub.OnDisconnectedAsync(null);

            clients.Proxy.Sent.Where(s => s.Method == LockChanged).Should().HaveCount(2);
            registry.ActiveHolders(_ => true).Should().BeEmpty();
        }

        [Fact]
        public async Task GetExpeditionLocks_RenvoieSeulementLaVilleCourante()
        {
            var registry = NewRegistry();
            await NewHub(7, 101, "c1", registry).AcquireLock("part", 1);
            await NewHub(8, 202, "c2", registry).AcquireLock("part", 2);

            var locks = await NewHub(9, 101, "c3", registry).GetExpeditionLocks();

            locks.Should().ContainSingle().Which.EntityId.Should().Be(1);
        }

        [Fact]
        public async Task GetExpeditionLocks_SansVille_RenvoieListeVide()
        {
            var locks = await NewHub(9, 0, "c-sans-ville", NewRegistry()).GetExpeditionLocks();

            locks.Should().BeEmpty();
        }

        [Fact]
        public async Task PostPartOrders_BlocTenuParAutre_LeveHubExceptionLockedSansAppelerLeService()
        {
            var registry = NewRegistry();
            await NewHub(42, 101, "c1", registry).AcquireLock("part-orders", 5);
            var service = new FakeExpeditionService();
            var hub = NewHub(8, 101, "c2", registry, expeditionService: service);

            var act = () => hub.PostPartOrders(5, "[]");

            (await act.Should().ThrowAsync<HubException>()).Which.Message.Should().Be("Locked:42");
            service.SavePartOrdersCalls.Should().Be(0);
        }

        [Fact]
        public async Task PostPartOrders_BlocLibre_EnregistreSansVerrou()
        {
            var service = new FakeExpeditionService();
            var hub = NewHub(8, 101, "c2", NewRegistry(), expeditionService: service);

            await hub.PostPartOrders(5, "[]");

            service.SavePartOrdersCalls.Should().Be(1);
        }

        [Fact]
        public async Task PostPartOrders_BlocTenuParLAppelant_Enregistre()
        {
            var registry = NewRegistry();
            var service = new FakeExpeditionService();
            var hub = NewHub(8, 101, "c2", registry, expeditionService: service);
            await hub.AcquireLock("part-orders", 5);

            await hub.PostPartOrders(5, "[]");

            service.SavePartOrdersCalls.Should().Be(1);
        }

        [Fact]
        public async Task DeleteExpeditionPart_CitoyenEnfantTenuParAutre_Refuse()
        {
            var registry = NewRegistry();
            await NewHub(42, 101, "c1", registry).AcquireLock("citizen", 9);
            var scope = new FakeExpeditionLockScopeService();
            scope.Refs.Add(new ExpeditionLockRef(ExpeditionLockKind.Citizen, 9));
            var hub = NewHub(8, 101, "c2", registry, lockScope: scope);

            var act = () => hub.DeleteExpeditionPart(4);

            (await act.Should().ThrowAsync<HubException>()).Which.Message.Should().Be("Locked:42");
        }

        [Fact]
        public async Task CopyExpeditions_BlocDuJourCibleTenuParAutre_Refuse()
        {
            var registry = NewRegistry();
            await NewHub(42, 101, "c1", registry).AcquireLock("expedition", 6);
            var scope = new FakeExpeditionLockScopeService();
            scope.Refs.Add(new ExpeditionLockRef(ExpeditionLockKind.Expedition, 6));
            var hub = NewHub(8, 101, "c2", registry, lockScope: scope);

            var act = () => hub.CopyExpeditions(101, 1, 2);

            (await act.Should().ThrowAsync<HubException>()).Which.Message.Should().Be("Locked:42");
        }

        [Fact]
        public async Task PostExpeditionCitizen_LigneTenueParLAppelant_PasseCanReplaceOccupantVrai()
        {
            var registry = NewRegistry();
            var service = new FakeExpeditionService();
            var hub = NewHub(8, 101, "c2", registry, expeditionService: service);
            await hub.AcquireLock("citizen", 3);

            await hub.PostExpeditionCitizen(1, "{\"id\":3,\"idUser\":8}");

            service.LastCanReplaceOccupant.Should().BeTrue();
        }

        [Fact]
        public async Task PostExpeditionCitizen_LigneNonTenue_PasseCanReplaceOccupantFaux()
        {
            var service = new FakeExpeditionService();
            var hub = NewHub(8, 101, "c2", NewRegistry(), expeditionService: service);

            await hub.PostExpeditionCitizen(1, "{\"id\":3,\"idUser\":8}");

            service.LastCanReplaceOccupant.Should().BeFalse();
        }

        [Fact]
        public async Task SaveExpeditionBag_SacPartageTenuParAutreViaLigneSoeur_Refuse()
        {
            var registry = NewRegistry();
            await NewHub(42, 101, "c1", registry).AcquireLock("bag", 1);
            var scope = new FakeExpeditionLockScopeService();
            scope.Refs.Add(new ExpeditionLockRef(ExpeditionLockKind.Bag, 1));
            scope.Refs.Add(new ExpeditionLockRef(ExpeditionLockKind.Bag, 2));
            var hub = NewHub(8, 101, "c2", registry, lockScope: scope);

            var act = () => hub.SaveExpeditionBag(2, "{\"id\":77,\"items\":[]}");

            (await act.Should().ThrowAsync<HubException>()).Which.Message.Should().Be("Locked:42");
            scope.LastOwnersOfBagId.Should().Be(77);
        }

        [Fact]
        public async Task PostExpeditionCitizen_ServiceLeveMhoLocked_RelayeEnHubExceptionLocked()
        {
            var service = new FakeExpeditionService { SaveCitizenThrows = new MhoLockedException(11) };
            var hub = NewHub(8, 101, "c2", NewRegistry(), expeditionService: service);

            var act = () => hub.PostExpeditionCitizen(1, "{\"id\":3,\"idUser\":8}");

            (await act.Should().ThrowAsync<HubException>()).Which.Message.Should().Be("Locked:11");
        }
    }
}
