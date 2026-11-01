using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Faux dépôt uniquement : aucun appel réel vers Gest'Hordes.</summary>
    public class ExternalToolsServiceGestHordesTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceGestHordesTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private sealed class FakeGestHordesRepository : IGestHordesRepository
        {
            public List<GestHordesMajScriptRequest?> UpdateCalls { get; } = new();
            public List<GestHordesMajCaseRequestDto> CellItemCalls { get; } = new();
            public List<GestHordesMajCaseZombiesDto> CellZombiesCalls { get; } = new();

            public void Update(GestHordesMajScriptRequest? cell) => UpdateCalls.Add(cell);
            public void UpdateGHZoneRegen(string sessid, List<dynamic> cellToUpdate) => throw new NotSupportedException();
            public void UpdateCitizen(GestHordesMajCitizenRequest ghUpdateCitizenRequest) => throw new NotSupportedException();
            public void UpdateCellItem(GestHordesMajCaseRequestDto request) => CellItemCalls.Add(request);
            public void UpdateCellZombies(GestHordesMajCaseZombiesDto request) => CellZombiesCalls.Add(request);
        }

        private WebApplicationFactory<Program> Factory(FakeGestHordesRepository gh)
        {
            return _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            {
                services.AddScoped<IGestHordesRepository>(_ => gh);
            }));
        }

        private static UpdateRequestDto Request(UpdateCellInfoDto? gestHordesCell, bool isChaos = false, UpdateCellInfoDto? sharedCell = null, string isGestHordes = "api")
        {
            return new UpdateRequestDto
            {
                TownDetails = new UpdateTownDetailsDto { TownId = 4242, TownX = 100, TownY = 100, IsChaos = isChaos },
                Map = new UpdateRequestMapDto
                {
                    Cell = sharedCell,
                    GestHordesCell = gestHordesCell,
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "none",
                        IsGestHordes = isGestHordes,
                        IsFataMorgana = "none",
                        IsBigBrothHordes = "none",
                        IsZenHordes = "none"
                    }
                }
            };
        }

        private static async Task<ExternalToolsUpdateProgress> Run(WebApplicationFactory<Program> factory, UpdateRequestDto request)
        {
            using var scope = factory.Services.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var progress = new ExternalToolsUpdateProgress(1, DateTime.UtcNow);
            ExternalToolsUpdatePlan.Declare(request, progress);
            await service.UpdateExternalsTools(request, progress);
            return progress;
        }

        [Fact]
        public async Task MarqueursDeMetiers_EnvoyesAvecLaMiseAJour()
        {
            var gh = new FakeGestHordesRepository();
            using var factory = Factory(gh);

            var progress = await Run(factory, Request(new UpdateCellInfoDto { X = 2, Y = -1, ScavZoneLevel = 3 }));

            var sent = gh.UpdateCalls.Should().ContainSingle().Which;
            sent.Should().NotBeNull();
            sent!.X.Should().Be(102);
            sent.Y.Should().Be(101);
            sent.FouilleLvl.Should().Be(3);
            progress.Snapshot().Tools.Should().ContainSingle().Which.Status.Should().Be("success");
        }

        [Fact]
        public async Task SansMarqueurs_MiseAJourSeule()
        {
            var gh = new FakeGestHordesRepository();
            using var factory = Factory(gh);

            await Run(factory, Request(null));

            gh.UpdateCalls.Should().ContainSingle().Which.Should().BeNull();
        }

        [Fact]
        public async Task ZombiesTues_EnvoyesDepuisLaCaseGestHordes_SansCorpsJson()
        {
            var gh = new FakeGestHordesRepository();
            using var factory = Factory(gh);

            var progress = await Run(factory, Request(new UpdateCellInfoDto { X = 2, Y = -1, DeadZombies = 3 }));

            var sent = gh.CellZombiesCalls.Should().ContainSingle().Which;
            sent.NbrKill.Should().Be(3);
            sent.X.Should().Be(102);
            sent.Y.Should().Be(101);
            gh.UpdateCalls.Should().ContainSingle().Which.Should().BeNull();
            gh.CellItemCalls.Should().BeEmpty();
            progress.Snapshot().Tools.Should().ContainSingle().Which.Status.Should().Be("success");
        }

        [Fact]
        public async Task Chaos_CaseEnvoyeeDepuisLaCaseGestHordes()
        {
            var gh = new FakeGestHordesRepository();
            using var factory = Factory(gh);
            var cell = new UpdateCellInfoDto { X = 2, Y = -1, Zombies = 1, ZoneEmpty = true, Objects = new List<UpdateObjectDto> { new() { Id = 5, Count = 2, IsBroken = false } } };

            await Run(factory, Request(cell, isChaos: true));

            var sent = gh.CellItemCalls.Should().ContainSingle().Which;
            sent.X.Should().Be(102);
            sent.Y.Should().Be(101);
            sent.NbrZombie.Should().Be(1);
            sent.Epuise.Should().BeTrue();
            sent.Items.Should().ContainSingle().Which.Nombre.Should().Be(2);
            gh.CellZombiesCalls.Should().BeEmpty();
        }

        [Fact]
        public async Task CasePartagee_NonLueParGestHordes()
        {
            var gh = new FakeGestHordesRepository();
            using var factory = Factory(gh);
            var shared = new UpdateCellInfoDto { X = 2, Y = -1, DeadZombies = 3, Objects = new List<UpdateObjectDto> { new() { Id = 5, Count = 2 } } };

            await Run(factory, Request(new UpdateCellInfoDto { X = 2, Y = -1, ScavZoneLevel = 1 }, isChaos: true, sharedCell: shared));

            gh.CellZombiesCalls.Should().BeEmpty();
            gh.CellItemCalls.Should().BeEmpty();
        }

        [Fact]
        public async Task AncienAddon_ModeCell_LitLaCasePartagee()
        {
            var gh = new FakeGestHordesRepository();
            using var factory = Factory(gh);

            await Run(factory, Request(null, sharedCell: new UpdateCellInfoDto { X = 2, Y = -1, DeadZombies = 3 }, isGestHordes: "cell"));

            gh.CellZombiesCalls.Should().ContainSingle().Which.NbrKill.Should().Be(3);
        }
    }
}
