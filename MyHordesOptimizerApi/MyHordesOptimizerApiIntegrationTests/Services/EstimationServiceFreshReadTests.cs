using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// L'affinage relit les estimations sous verrou pour détecter une saisie arrivée pendant le rejeu :
    /// une seconde lecture par le même service doit voir la base, pas les entités déjà suivies par EF.
    /// </summary>
    public class EstimationServiceFreshReadTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public EstimationServiceFreshReadTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public void GetEstimations_RelitLaBase_ApresUneModificationParUnAutreContexte()
        {
            int townId;
            using (var seed = _factory.Services.CreateScope())
            {
                var context = seed.ServiceProvider.GetRequiredService<MhoContext>();
                (townId, _, _, _) = AttackTestSupport.SeedTown(context, 16);
                context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 16, IsPlanif = false, _33min = 3400, _33max = 4259 });
                context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 16, IsPlanif = true });
                context.SaveChanges();
            }

            using var scope = _factory.Services.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IMyHordesOptimizerEstimationService>();
            service.GetEstimations(townId, 16).Estim._33!.Min.Should().Be(3400);

            using (var writer = _factory.Services.CreateScope())
            {
                writer.ServiceProvider.GetRequiredService<MhoContext>().TownEstimations
                    .Where(e => e.IdTown == townId && e.Day == 16 && !e.IsPlanif)
                    .ExecuteUpdate(setters => setters.SetProperty(e => e._33min, 3401));
            }

            service.GetEstimations(townId, 16).Estim._33!.Min.Should().Be(3401);
        }
    }
}
