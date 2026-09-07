using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// PutWishList/CreateFromTemplate/AddItemToWishList n'acquéraient aucun TownSyncLock (seule la
    /// transaction SQL protégeait) : deux requêtes concurrentes sur la même ville pouvaient s'écraser.
    /// Représentant de la famille « écriture simple » du chantier TownSyncLock.
    /// </summary>
    public class WishListServiceLockingTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public WishListServiceLockingTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task PutWishList_MemeVillePendantVerrouTenuParUnAutreAppel_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IWishListService>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();

            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            // IdTown != MapId délibérément : PutWishList doit verrouiller sur le mapId brut (même
            // convention que le login/ExternalTools), PAS sur le townId résolu — sinon ce test ne
            // discrimine rien (un verrou pris sur la mauvaise clé passerait quand même).
            var internalTownId = random.Next(1, int.MaxValue);
            var mapId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);

            context.Towns.Add(new Town { IdTown = internalTownId, MapId = mapId, Name = "test-town-" + suffix });
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var putTask = Task.Run(() => service.PutWishList(mapId, userId, new List<WishListPutResquestDto>()));

            // Course contre un délai généreux plutôt que "délai fixe court puis assertion instantanée" :
            // un process froid (première requête MySQL contre le serveur distant partagé) peut dépasser
            // largement 300 ms sans aucun bug de verrou, ce qui rendrait ce test vert à tort. Ici, seule
            // une vraie absence d'exclusion mutuelle peut faire gagner putTask avant les 2 secondes.
            var winner = await Task.WhenAny(putTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(putTask, "l'écriture ne doit pas se terminer tant que le verrou externe sur -mapId est tenu");

            await externalLock.DisposeAsync();
            await putTask;

            context.Towns.AsNoTracking().Single(t => t.IdTown == internalTownId).WishlistDateUpdate.Should().NotBeNull();
        }
    }
}
