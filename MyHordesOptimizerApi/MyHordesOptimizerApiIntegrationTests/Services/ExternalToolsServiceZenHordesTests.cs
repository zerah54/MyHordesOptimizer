using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.FataMorgana;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Faux dépôts uniquement : le vrai ZenHordes limite à 100 requêtes par quart d'heure, les tests ne doivent jamais l'entamer.</summary>
    public class ExternalToolsServiceZenHordesTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceZenHordesTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private sealed class FakeFataMorganaRepository : IFataMorganaRepository
        {
            public List<FataMorganaUpdateRequestDto> Calls { get; } = new();

            public Task UpdateAsync(FataMorganaUpdateRequestDto updateRequestDto)
            {
                Calls.Add(updateRequestDto);
                return Task.CompletedTask;
            }
        }

        private WebApplicationFactory<Program> Factory(FakeZenHordesRepository zen, FakeFataMorganaRepository fata)
        {
            return _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            {
                services.AddScoped<IZenHordesRepository>(_ => zen);
                services.AddScoped<IFataMorganaRepository>(_ => fata);
            }));
        }

        private static UpdateCellInfoDto ZenCell()
        {
            return new UpdateCellInfoDto
            {
                X = -2,
                Y = 3,
                Zombies = 2,
                ZoneEmpty = false,
                Objects = new List<UpdateObjectDto> { new() { Id = 5, Count = 2, IsBroken = false } }
            };
        }

        private static UpdateRequestDto Request(string isZenHordes, string isFataMorgana = "none")
        {
            return new UpdateRequestDto
            {
                TownDetails = new UpdateTownDetailsDto { TownId = 4242, TownX = 100, TownY = 100, IsChaos = false },
                Map = new UpdateRequestMapDto
                {
                    ZenHordesCell = ZenCell(),
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "none",
                        IsGestHordes = "none",
                        IsFataMorgana = isFataMorgana,
                        IsBigBrothHordes = "none",
                        IsZenHordes = isZenHordes
                    }
                }
            };
        }

        private static async Task<(UpdateResponseDto response, ExternalToolsUpdateProgress progress)> Run(WebApplicationFactory<Program> factory, UpdateRequestDto request)
        {
            using var scope = factory.Services.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var progress = new ExternalToolsUpdateProgress(1, DateTime.UtcNow);
            ExternalToolsUpdatePlan.Declare(request, progress);
            var response = await service.UpdateExternalsTools(request, progress);
            return (response, progress);
        }

        [Fact]
        public async Task CaseDemandee_EnvoyeeAZenHordes_OutilEnSucces()
        {
            var zen = new FakeZenHordesRepository();
            using var factory = Factory(zen, new FakeFataMorganaRepository());

            var (response, progress) = await Run(factory, Request("cell"));

            var sent = zen.Calls.Should().ContainSingle().Which;
            sent.TownId.Should().Be(4242);
            sent.X.Should().Be(-2);
            sent.Y.Should().Be(3);
            sent.Zombies.Should().Be(2);
            sent.Items.Should().ContainSingle().Which.Quantity.Should().Be(2);
            var tool = progress.Snapshot().Tools.Should().ContainSingle().Which;
            tool.Tool.Should().Be("zenHordes");
            tool.Status.Should().Be("success");
            response.MapResponseDto.ZenHordesStatus.Should().Be("Ok");
        }

        [Fact]
        public async Task RefusDeZenHordes_OutilEnErreurAvecLeMessage()
        {
            var zen = new FakeZenHordesRepository { ToThrow = new WebApiException("429 Too Many Requests", "{\"error\":\"Too many requests\"}", HttpStatusCode.TooManyRequests, null) };
            using var factory = Factory(zen, new FakeFataMorganaRepository());

            var (response, progress) = await Run(factory, Request("cell"));

            var tool = progress.Snapshot().Tools.Should().ContainSingle().Which;
            tool.Status.Should().Be("error");
            tool.Errors.Single().Message.Should().Contain("429").And.Contain("Too many requests");
            response.MapResponseDto.ZenHordesStatus.Should().Contain("429");
        }

        [Fact]
        public async Task ZenHordesNonDemande_AucunAppel()
        {
            var zen = new FakeZenHordesRepository();
            using var factory = Factory(zen, new FakeFataMorganaRepository());

            var (response, progress) = await Run(factory, Request("none"));

            zen.Calls.Should().BeEmpty();
            progress.Snapshot().Tools.Should().BeEmpty();
            response.MapResponseDto.ZenHordesStatus.Should().Be("Not activated");
        }

        /// <summary>La case de ZenHordes est portée à part : Fata la lit quel que soit son mode et n'a pas à la recevoir.</summary>
        [Fact]
        public async Task CaseDeZenHordes_NeFuitePasVersFata()
        {
            var fata = new FakeFataMorganaRepository();
            using var factory = Factory(new FakeZenHordesRepository(), fata);

            await Run(factory, Request("cell", isFataMorgana: "api"));

            var sentToFata = fata.Calls.Should().ContainSingle().Which;
            sentToFata.X.Should().Be(0);
            sentToFata.Y.Should().Be(0);
            sentToFata.NbrZombie.Should().BeNull();
        }
    }
}
