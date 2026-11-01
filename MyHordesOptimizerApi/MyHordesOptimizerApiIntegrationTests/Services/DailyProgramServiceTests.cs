using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.DailyProgram;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using MyHordesOptimizerApi.Services.Impl.DailyProgram;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Faits bruts du programme du jour : aucune règle d'éligibilité, seulement l'état de la base.</summary>
    public class DailyProgramServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public DailyProgramServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (IUserInfoProvider UserInfo, IServiceProvider Provider) NewScope(int userId)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = null!;
            return (userInfo, provider);
        }

        private IDailyProgramService NewService(int userId)
        {
            var (userInfo, provider) = NewScope(userId);
            return new DailyProgramService(
                provider.GetRequiredService<MhoContext>(),
                userInfo,
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo),
                provider.GetRequiredService<IMapper>());
        }

        private IBuildingPlanService NewPlanService(int userId)
        {
            var (userInfo, provider) = NewScope(userId);
            return new BuildingPlanService(
                provider.GetRequiredService<MhoContext>(),
                userInfo,
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo),
                provider.GetRequiredService<TownSyncLock>(),
                provider.GetRequiredService<IMapper>());
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private (int TownId, int Alive, int Dead, int Outsider) Seed()
        {
            var seeded = AttackTestSupport.SeedTown(NewContext(), Day);
            return (seeded.townId, seeded.aliveUserId, seeded.deadUserId, seeded.outsiderUserId);
        }

        /// <summary>Insère une expédition ; chaque partie est la liste de ses places (null = place vide).</summary>
        private void SeedExpedition(int townId, string state, params int?[][] parts)
        {
            var context = NewContext();
            var expedition = new Expedition { IdTown = townId, Day = Day, State = state, Label = "exp" };
            for (var position = 0; position < parts.Length; position++)
            {
                var part = new ExpeditionPart { Position = position, Label = "part" + position };
                foreach (var userId in parts[position])
                {
                    part.ExpeditionCitizens.Add(new ExpeditionCitizen
                    {
                        IdUser = userId,
                        PreinscritJob = "collec",
                        NombrePeDepart = 4,
                        NombrePeDepartOperator = "min",
                        IsPreinscritChaussures = true
                    });
                }
                expedition.ExpeditionParts.Add(part);
            }
            context.Expeditions.Add(expedition);
            context.SaveChanges();
        }

        [Fact]
        public async Task GetFacts_Outsider_OnlyIsCitizenFalse()
        {
            var town = Seed();
            SeedExpedition(town.TownId, "ready", new int?[] { null });

            var facts = await NewService(town.Outsider).GetFactsAsync(town.TownId, Day);

            facts.IsCitizen.Should().BeFalse();
            facts.HasEffectivePlan.Should().BeFalse();
            facts.IsPlaced.Should().BeFalse();
            facts.OpenPlaces.Should().BeEmpty();
            facts.Me.Should().BeNull();
        }

        [Fact]
        public async Task GetFacts_EffectivePlanOfTheDay_HasEffectivePlan()
        {
            var town = Seed();
            await NewPlanService(town.Alive).SavePlanAsync(town.TownId,
                new BuildingPlanRequestDto { Day = Day, Name = "Plan A", Content = new BuildingPlanContentDto() });

            var sameDay = await NewService(town.Alive).GetFactsAsync(town.TownId, Day);
            var nextDay = await NewService(town.Alive).GetFactsAsync(town.TownId, Day + 1);

            sameDay.IsCitizen.Should().BeTrue();
            sameDay.HasEffectivePlan.Should().BeTrue();
            nextDay.HasEffectivePlan.Should().BeFalse();
        }

        [Fact]
        public async Task GetFacts_PlacedInSecondPartOfExpeditionInPreparation_IsPlaced()
        {
            var town = Seed();
            SeedExpedition(town.TownId, "stop", new int?[] { null }, new int?[] { town.Alive });

            var facts = await NewService(town.Alive).GetFactsAsync(town.TownId, Day);

            facts.IsPlaced.Should().BeTrue();
            facts.OpenPlaces.Should().BeEmpty();
        }

        [Fact]
        public async Task GetFacts_OpenPlaces_ReadyExpeditionFirstPartOnly()
        {
            var town = Seed();
            SeedExpedition(town.TownId, "ready", new int?[] { null }, new int?[] { null });
            SeedExpedition(town.TownId, "stop", new int?[] { null });

            var facts = await NewService(town.Alive).GetFactsAsync(town.TownId, Day);

            facts.IsPlaced.Should().BeFalse();
            var place = facts.OpenPlaces.Should().ContainSingle().Subject;
            place.IdUser.Should().BeNull();
            place.PreinscritJob.Should().Be("collec");
            place.NombrePeDepart.Should().Be(4);
            place.NombrePeDepartOperator.Should().Be("min");
            place.IsPreinscritChaussures.Should().BeTrue();
        }

        [Fact]
        public async Task GetFacts_Me_IsTheCaller()
        {
            var town = Seed();

            var facts = await NewService(town.Alive).GetFactsAsync(town.TownId, Day);

            facts.Me!.Id.Should().Be(town.Alive);
        }
    }
}
