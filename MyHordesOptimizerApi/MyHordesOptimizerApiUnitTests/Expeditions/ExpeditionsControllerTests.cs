using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Controllers;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Services.Impl.Expeditions;
using MyHordesOptimizerApi.Services.Impl.Locks;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionsControllerTests
    {
        private const int TownId = 101;

        private static ExpeditionsController NewController(FakeExpeditionService service, ExpeditionLockRegistry registry, FakeExpeditionLockScopeService scope, FakeExpeditionsHubContext hub)
        {
            return new ExpeditionsController(NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance,
                new FakeUserInfoProvider { UserId = 8, TownDetail = new SimpleMeTownDetailDto { TownId = TownId } },
                service, registry, scope, hub);
        }

        [Fact]
        public async Task SetOrderDone_Libre_CocheSeulementEtDiffuseALaVille()
        {
            var service = new FakeExpeditionService();
            var hub = new FakeExpeditionsHubContext();
            var controller = NewController(service, new ExpeditionLockRegistry(TimeProvider.System), new FakeExpeditionLockScopeService(), hub);

            var result = await controller.SetOrderDone(12, true);

            result.Result.Should().BeOfType<OkObjectResult>();
            service.LastUpdatedOrder.Should().BeEquivalentTo(new ExpeditionOrderDto { Id = 12, IsDone = true });
            hub.CallerClients.Proxy.Sent.Select(sent => sent.Method).Should().Equal("ExpeditionOrderUpdated");
        }

        [Fact]
        public async Task SetOrderDone_BlocTenuSurLeSite_Refuse423SansEnregistrer()
        {
            var registry = new ExpeditionLockRegistry(TimeProvider.System);
            registry.TryAcquire(new ExpeditionLockKey(TownId, ExpeditionLockKind.CitizenOrders, 3), new LockHolder("site", 42));
            var scope = new FakeExpeditionLockScopeService();
            scope.Refs.Add(new ExpeditionLockRef(ExpeditionLockKind.CitizenOrders, 3));
            var service = new FakeExpeditionService();
            var hub = new FakeExpeditionsHubContext();

            var act = () => NewController(service, registry, scope, hub).SetOrderDone(12, true);

            (await act.Should().ThrowAsync<MhoLockedException>()).Which.HolderUserId.Should().Be(42);
            service.LastUpdatedOrder.Should().BeNull();
            hub.CallerClients.Proxy.Sent.Should().BeEmpty();
        }
    }
}
