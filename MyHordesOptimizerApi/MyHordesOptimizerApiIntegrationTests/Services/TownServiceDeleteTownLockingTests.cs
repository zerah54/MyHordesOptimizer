using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// DeleteTown pose un double verrou (IdTown interne ET MapId, deux familles de clé distinctes) —
    /// la logique la plus bespoke de ce chantier, sans couverture jusqu'ici. Un test par clé : si l'une
    /// des deux acquisitions manquait, le test correspondant échouerait à observer un blocage.
    /// </summary>
    public class TownServiceDeleteTownLockingTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownServiceDeleteTownLockingTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static (MhoContext context, ITownService service, TownSyncLock townSyncLock, int townId, int mapId) NewFixture(
            MyHordesOptimizerApplicationFactory factory)
        {
            var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<ITownService>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();

            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            // IdTown != MapId délibérément : DeleteTown reçoit l'IdTown interne (liste admin), mais
            // doit AUSSI verrouiller -MapId pour exclure une synchro concurrente de cette même ville.
            var townId = random.Next(1, int.MaxValue);
            var mapId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = townId, MapId = mapId, Name = "test-town-" + suffix });
            context.SaveChanges();

            return (context, service, townSyncLock, townId, mapId);
        }

        [Fact]
        public async Task DeleteTown_PendantVerrouExterneSurIdTownInterne_AttendLaLiberation()
        {
            var (context, service, townSyncLock, townId, _) = NewFixture(_factory);

            var externalLock = await townSyncLock.AcquireTownAsync(-townId);
            var deleteTask = Task.Run(() => service.DeleteTown(townId));

            var winner = await Task.WhenAny(deleteTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(deleteTask, "la suppression ne doit pas se terminer tant que le verrou externe sur -townId (IdTown interne) est tenu");
            context.Towns.AsNoTracking().Any(t => t.IdTown == townId).Should().BeTrue("la ville ne doit pas encore être supprimée");

            await externalLock.DisposeAsync();
            await deleteTask;

            context.Towns.AsNoTracking().Any(t => t.IdTown == townId).Should().BeFalse("la ville doit être supprimée une fois le verrou externe libéré");
        }

        [Fact]
        public async Task DeleteTown_PendantVerrouExterneSurMapId_AttendLaLiberation()
        {
            var (context, service, townSyncLock, townId, mapId) = NewFixture(_factory);

            // Même ville, verrouillée cette fois par sa clé mapId (famille synchro/login) plutôt que
            // par son IdTown interne : si DeleteTown ne prenait QUE le verrou -townId, ce test ne
            // bloquerait jamais, révélant l'absence du second verrou.
            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var deleteTask = Task.Run(() => service.DeleteTown(townId));

            var winner = await Task.WhenAny(deleteTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(deleteTask, "la suppression ne doit pas se terminer tant que le verrou externe sur -mapId est tenu");
            context.Towns.AsNoTracking().Any(t => t.IdTown == townId).Should().BeTrue("la ville ne doit pas encore être supprimée");

            await externalLock.DisposeAsync();
            await deleteTask;

            context.Towns.AsNoTracking().Any(t => t.IdTown == townId).Should().BeFalse("la ville doit être supprimée une fois le verrou externe libéré");
        }
    }
}
