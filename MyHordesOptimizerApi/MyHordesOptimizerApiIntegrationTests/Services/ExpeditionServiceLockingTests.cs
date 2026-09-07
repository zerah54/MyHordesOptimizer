using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// ExpeditionService utilisait un verrou statique GLOBAL (un seul SemaphoreSlim partagé par toutes les
    /// villes) sur ses écritures. Migré vers TownSyncLock (verrou par ville, même modèle qu'ExternalToolsService,
    /// cf. ExternalToolsServiceLockingTests) : deux villes différentes doivent pouvoir écrire en parallèle, la
    /// même ville doit rester sérialisée.
    /// <para>
    /// IdTown != MapId dans toutes les fixtures ci-dessous (ville "synchronisée") : avec IdTown == MapId, un
    /// verrou pris sur -IdTown et un verrou pris sur -MapId tombent sur la même clé par coïncidence, et ces
    /// tests ne détecteraient jamais une confusion entre les deux conventions de clé de verrou (bug déjà
    /// rencontré dans ce chantier, cf. ExternalToolsServiceLockingTests.UpdateCitizenBag_...).
    /// </para>
    /// </summary>
    public class ExpeditionServiceLockingTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceLockingTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private IExpeditionService NewService()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IExpeditionService>();
        }

        /// <summary>Ville "synchronisée" : IdTown (interne) et MapId (brut, envoyé par le client) délibérément distincts.</summary>
        private (int internalTownId, int mapId) NewTown(int day)
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var internalTownId = random.Next(1, int.MaxValue);
            var mapId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = internalTownId, Name = "test-town-" + suffix, MapId = mapId, Day = day });
            context.SaveChanges();
            return (internalTownId, mapId);
        }

        [Fact]
        public async Task SaveExpeditionAsync_VilleDifferenteDuVerrouExterneTenu_NePasAttendreSaLiberation()
        {
            var townSyncLock = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<TownSyncLock>();
            var townA = NewTown(day: 5);
            var townB = NewTown(day: 5);

            var lockA = await townSyncLock.AcquireTownAsync(-townA.mapId);
            var saveTaskB = NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townB.mapId, 5);

            var winner = await Task.WhenAny(saveTaskB, Task.Delay(2000));

            winner.Should().BeSameAs(saveTaskB, "une écriture sur une AUTRE ville ne doit pas être bloquée par le verrou tenu sur townA");
            (await saveTaskB).Should().NotBeNull();
            await lockA.DisposeAsync();
        }

        /// <summary>
        /// Avant le fix, SaveExpeditionAsync verrouillait sur -IdTown (résolu) au lieu de -MapId (brut) :
        /// sur une ville synchronisée (IdTown != MapId), un verrou externe posé sur -MapId n'aurait alors
        /// aucun effet et ce test échouerait (l'expédition serait déjà écrite pendant le Task.Delay).
        /// </summary>
        [Fact]
        public async Task SaveExpeditionAsync_MemeVillePendantVerrouExterneSurMapIdTenu_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();
            var (internalTownId, mapId) = NewTown(day: 5);

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var saveTask = NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, mapId, 5);

            var winner = await Task.WhenAny(saveTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(saveTask, "l'écriture ne doit pas se terminer tant que le verrou externe sur -MapId est tenu");
            context.Expeditions.AsNoTracking().Any(e => e.IdTown == internalTownId).Should().BeFalse();

            await externalLock.DisposeAsync();
            await saveTask;

            context.Expeditions.AsNoTracking().Any(e => e.IdTown == internalTownId).Should().BeTrue();
        }

        /// <summary>
        /// UpdateExpeditionBag résout sa ville via Ensure*DayIsEditable (Expedition.IdTown, déjà résolu) :
        /// avant le fix, la clé de verrou dérivée valait -IdTown au lieu de -MapId. Sur une ville
        /// synchronisée (IdTown != MapId), un verrou externe posé sur -MapId n'aurait alors aucun effet.
        /// </summary>
        [Fact]
        public async Task UpdateExpeditionBag_MemeVilleIdTownDifferentDuMapIdPendantVerrouExterneSurMapIdTenu_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();
            var (_, mapId) = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, mapId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            var originalBagId = context.ExpeditionCitizens.AsNoTracking().Single(c => c.IdExpeditionCitizen == citizen.Id!.Value).IdExpeditionBag;

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var bagTask = NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            var winner = await Task.WhenAny(bagTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(bagTask, "l'écriture du sac ne doit pas se terminer tant que le verrou externe sur -MapId est tenu");
            context.ExpeditionCitizens.AsNoTracking().Single(c => c.IdExpeditionCitizen == citizen.Id!.Value).IdExpeditionBag.Should().Be(originalBagId);

            await externalLock.DisposeAsync();
            await bagTask;

            context.ExpeditionCitizens.AsNoTracking().Single(c => c.IdExpeditionCitizen == citizen.Id!.Value).IdExpeditionBag.Should().NotBe(originalBagId);
        }

        /// <summary>
        /// SaveCitizenOrdersAsync partage la même dérivation de clé (EnsureCitizenDayIsEditable) que
        /// UpdateExpeditionBag : couvre le second point d'entrée du Cas B (citoyen plutôt que sac).
        /// </summary>
        [Fact]
        public async Task SaveCitizenOrdersAsync_MemeVilleIdTownDifferentDuMapIdPendantVerrouExterneSurMapIdTenu_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();
            var (_, mapId) = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, mapId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var ordersTask = NewService().SaveCitizenOrdersAsync(citizen.Id!.Value, new List<ExpeditionOrderDto> { new() { Text = "test" } });

            var winner = await Task.WhenAny(ordersTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(ordersTask, "l'écriture des commandes ne doit pas se terminer tant que le verrou externe sur -MapId est tenu");
            context.ExpeditionOrders.AsNoTracking().Any(o => o.IdExpeditionCitizen == citizen.Id!.Value).Should().BeFalse();

            await externalLock.DisposeAsync();
            await ordersTask;

            context.ExpeditionOrders.AsNoTracking().Any(o => o.IdExpeditionCitizen == citizen.Id!.Value).Should().BeTrue();
        }

        /// <summary>
        /// SaveExpeditionCitizenAsync dérive sa clé via EnsurePartDayIsEditable : chemin distinct
        /// d'EnsureCitizenDayIsEditable (seul couvert par les tests précédents). La partie ciblée est la
        /// DEUXIÈME de l'expédition (SaveExpeditionAsync en crée déjà une par défaut) : elle ne reçoit
        /// donc PAS de citoyen par défaut (réservé à la première partie) — le compte passe de 0 à 1.
        /// </summary>
        [Fact]
        public async Task SaveExpeditionCitizenAsync_MemeVilleIdTownDifferentDuMapIdPendantVerrouExterneSurMapIdTenu_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();
            var (_, mapId) = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, mapId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var citizenTask = NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });

            var winner = await Task.WhenAny(citizenTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(citizenTask, "l'écriture du citoyen ne doit pas se terminer tant que le verrou externe sur -MapId est tenu");
            context.ExpeditionCitizens.AsNoTracking().Count(c => c.IdExpeditionPart == part.Id!.Value).Should().Be(0);

            await externalLock.DisposeAsync();
            await citizenTask;

            context.ExpeditionCitizens.AsNoTracking().Count(c => c.IdExpeditionPart == part.Id!.Value).Should().Be(1);
        }

        /// <summary>
        /// SaveExpeditionPartAsync dérive sa clé via EnsureExpeditionDayIsEditable : troisième et dernier
        /// chemin de projection MapId (Cas B), jamais couvert par les tests précédents.
        /// SaveExpeditionAsync crée déjà une partie par défaut : le compte passe de 1 à 2.
        /// </summary>
        [Fact]
        public async Task SaveExpeditionPartAsync_MemeVilleIdTownDifferentDuMapIdPendantVerrouExterneSurMapIdTenu_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();
            var (_, mapId) = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, mapId, 5);

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var partTask = NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });

            var winner = await Task.WhenAny(partTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(partTask, "l'écriture de la partie ne doit pas se terminer tant que le verrou externe sur -MapId est tenu");
            context.ExpeditionParts.AsNoTracking().Count(p => p.IdExpedition == expedition.Id!.Value).Should().Be(1);

            await externalLock.DisposeAsync();
            await partTask;

            context.ExpeditionParts.AsNoTracking().Count(p => p.IdExpedition == expedition.Id!.Value).Should().Be(2);
        }

        /// <summary>
        /// CopyExpeditionsAsync : deuxième méthode du Cas A (verrou sur -townId brut avant résolution,
        /// même principe que SaveExpeditionAsync), jamais couverte par les tests précédents.
        /// </summary>
        [Fact]
        public async Task CopyExpeditionsAsync_MemeVilleIdTownDifferentDuMapIdPendantVerrouExterneSurMapIdTenu_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();
            var (internalTownId, mapId) = NewTown(day: 5);
            await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, mapId, 5);

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var copyTask = NewService().CopyExpeditionsAsync(mapId, fromDay: 5, targetDay: 6);

            var winner = await Task.WhenAny(copyTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(copyTask, "la copie ne doit pas se terminer tant que le verrou externe sur -MapId est tenu");
            context.Expeditions.AsNoTracking().Any(e => e.IdTown == internalTownId && e.Day == 6).Should().BeFalse();

            await externalLock.DisposeAsync();
            await copyTask;

            context.Expeditions.AsNoTracking().Any(e => e.IdTown == internalTownId && e.Day == 6).Should().BeTrue();
        }
    }
}
