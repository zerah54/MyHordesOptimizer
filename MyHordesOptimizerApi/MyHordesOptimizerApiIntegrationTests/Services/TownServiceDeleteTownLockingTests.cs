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
        public void DeleteTown_VilleLieeAUnePreVille_DelieLaPreVille()
        {
            var (context, service, _, townId, mapId) = NewFixture(_factory);
            var user = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "test-user-" + Guid.NewGuid().ToString("N")[..8] };
            context.Users.Add(user);
            context.SaveChanges();
            var preTown = new PreTown { Alias = "test", IdCreator = user.IdUser, CreatedAt = DateTime.UtcNow, LinkedIdTown = townId, LinkedMapId = mapId, LinkedAt = DateTime.UtcNow, IdLinker = user.IdUser };
            context.PreTowns.Add(preTown);
            context.SaveChanges();

            try
            {
                service.DeleteTown(townId);

                var after = context.PreTowns.AsNoTracking().Single(p => p.IdPreTown == preTown.IdPreTown);
                (after.LinkedIdTown, after.LinkedMapId).Should().Be((null, null));
            }
            finally
            {
                context.PreTowns.Where(p => p.IdPreTown == preTown.IdPreTown).ExecuteDelete();
            }
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

        [Fact]
        public void DeleteTown_SupprimeReglagesEtAffinagesDAttaque()
        {
            var (context, service, _, townId, _) = NewFixture(_factory);
            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownAttackSettings.Add(new TownAttackSetting { IdTown = townId, Day = 4, Souls = 1, IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo });
            context.TownAttackRefinements.Add(new TownAttackRefinement
            {
                IdTown = townId, Day = 4, Input = "{}", Candidates = new byte[6], CandidateCount = 1, Status = "Valid",
                IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo, ComputedAt = DateTime.UtcNow
            });
            context.SaveChanges();

            service.DeleteTown(townId);

            context.TownAttackSettings.AsNoTracking().Any(s => s.IdTown == townId).Should().BeFalse();
            context.TownAttackRefinements.AsNoTracking().Any(r => r.IdTown == townId).Should().BeFalse();
        }
    }
}
