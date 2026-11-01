using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using MyHordesOptimizerApi.Services.Impl.Buildings;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Corrections issues de la revue finale des lots 1-2. Requiert les scripts 2026_10_13_*.sql.</summary>
    public class BuildingPlanReviewFixesTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public BuildingPlanReviewFixesTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private IBuildingPlanService NewService(int userId)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            return new BuildingPlanService(
                provider.GetRequiredService<MhoContext>(),
                userInfo,
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo),
                provider.GetRequiredService<TownSyncLock>(),
                provider.GetRequiredService<IMapper>());
        }

        private static BuildingPlanRequestDto NewRequest(string name) => new() { Day = Day, Name = name, Content = new BuildingPlanContentDto() };

        [Fact]
        public void DeleteTown_PurgesTheBuildingPlanTables()
        {
            var db = NewContext();
            var (townId, _, _, _) = AttackTestSupport.SeedTown(db, Day);
            var building = db.Buildings.First();
            db.TownBuildings.Add(new TownBuilding { IdTown = townId, IdBuilding = building.IdBuilding });
            db.TownDefenses.Add(new TownDefense { IdTown = townId, Total = 10 });
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = townId, Day = Day, Name = "A", Content = "{}", IdAuthor = 1 });
            db.TownBuildingPlanSettings.Add(new TownBuildingPlanSettings { IdTown = townId, ItemValues = "{}", Version = 1 });
            db.SaveChanges();

            _factory.Services.CreateScope().ServiceProvider.GetRequiredService<ITownService>().DeleteTown(townId);

            var verify = NewContext();
            verify.TownBuildings.Count(row => row.IdTown == townId).Should().Be(0);
            verify.TownDefenses.Count(row => row.IdTown == townId).Should().Be(0);
            verify.TownBuildingPlans.Count(row => row.IdTown == townId).Should().Be(0);
            verify.TownBuildingPlanSettings.Count(row => row.IdTown == townId).Should().Be(0);
        }

        [Fact]
        public async Task Settings_TwoFirstWritesWithoutAVersion_SecondOneIsAConflict()
        {
            var db = NewContext();
            var (townId, alive, _, _) = AttackTestSupport.SeedTown(db, Day);
            // A et B ont ouvert la page avant toute saisie : ils lisent la même « absence de réglages ».
            var first = await NewService(alive).SaveSettingsAsync(townId, new BuildingPlanSettingsRequestDto { ItemValues = new() { { 5, 2 } } });

            var second = async () => await NewService(alive).SaveSettingsAsync(townId,
                new BuildingPlanSettingsRequestDto { ItemValues = new() { { 7, 3 } }, Version = 0 });

            await second.Should().ThrowAsync<MhoConflictException>();
            (await NewService(alive).GetPlansAsync(townId)).ItemValues.Should().Equal(new System.Collections.Generic.Dictionary<int, int> { { 5, 2 } });
            first.SettingsVersion.Should().BeGreaterThan(0, "0 doit toujours vouloir dire « aucune ligne »");
        }

        [Fact]
        public async Task Settings_WritingWithoutVersionWhenARowExists_IsAConflict()
        {
            var db = NewContext();
            var (townId, alive, _, _) = AttackTestSupport.SeedTown(db, Day);
            await NewService(alive).SaveSettingsAsync(townId, new BuildingPlanSettingsRequestDto { ItemValues = new() { { 5, 2 } } });

            var act = async () => await NewService(alive).SaveSettingsAsync(townId, new BuildingPlanSettingsRequestDto { ItemValues = new() { { 5, 9 } } });

            await act.Should().ThrowAsync<MhoConflictException>();
        }

        [Fact]
        public void Replace_KeepsBuiltRowsWhenTheApiOmitsTheBuildingsList()
        {
            var db = NewContext();
            var (townId, _, _, _) = AttackTestSupport.SeedTown(db, Day);
            var building = db.Buildings.First(b => b.MhId != null);
            var update = db.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = DateTime.UtcNow }).Entity;
            db.SaveChanges();
            var full = new MyHordesCity
            {
                Chantiers = new() { new MyHordesBuildingDto { Id = building.MhId, PaCurrent = 40 } },
                Buildings = new() { new MyHordesBuildingDto { Id = building.MhId, PaCurrent = 40 } }
            };
            TownBuildingSync.Replace(db, townId, update.IdLastUpdateInfo, new MyHordesCity { Buildings = full.Buildings }, NullLogger.Instance);
            db.SaveChanges();

            // Dérive de fields= : « buildings » absent. Les lignes construites ne doivent pas être effacées.
            var again = NewContext();
            TownBuildingSync.Replace(again, townId, update.IdLastUpdateInfo, new MyHordesCity { Chantiers = new(), Buildings = null }, NullLogger.Instance);
            again.SaveChanges();

            NewContext().TownBuildings.Count(row => row.IdTown == townId && row.IsBuilt).Should().Be(1);
        }

        [Fact]
        public void Replace_DoesNothingWhenTheCityIsAbsent()
        {
            var db = NewContext();
            var (townId, _, _, _) = AttackTestSupport.SeedTown(db, Day);
            var building = db.Buildings.First(b => b.MhId != null);
            db.TownBuildings.Add(new TownBuilding { IdTown = townId, IdBuilding = building.IdBuilding, IsBuilt = true });
            db.SaveChanges();

            var again = NewContext();
            TownBuildingSync.Replace(again, townId, 0, null, NullLogger.Instance);
            again.SaveChanges();

            NewContext().TownBuildings.Count(row => row.IdTown == townId).Should().Be(1);
        }

        [Fact]
        public async Task SetEffective_DoesNotInvalidateTheVersionOfTheOtherProposals()
        {
            var db = NewContext();
            var (townId, alive, _, _) = AttackTestSupport.SeedTown(db, Day);
            var a = await NewService(alive).SavePlanAsync(townId, NewRequest("A"));
            var b = await NewService(alive).SavePlanAsync(townId, NewRequest("B"));

            await NewService(alive).SetEffectiveAsync(townId, b.Id);

            // Alice édite A avec la version qu'elle avait : la bascule de l'étoile ne doit pas la mettre en conflit.
            var edited = await NewService(alive).SavePlanAsync(townId,
                new BuildingPlanRequestDto { Id = a.Id, Version = a.Version, Day = Day, Name = "A bis", Content = a.Content });
            edited.Name.Should().Be("A bis");
            (await NewService(alive).GetPlansAsync(townId)).Plans.Single(plan => plan.Id == b.Id).IsEffective.Should().BeTrue();
        }
    }
}
