using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExpeditionServiceRequirementsTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceRequirementsTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private IExpeditionService NewService()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IExpeditionService>();
        }

        private int NewTown(int day)
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var town_id = new Random().Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = town_id, Name = "test-town-" + suffix, MapId = town_id, Day = day });
            context.SaveChanges();
            return town_id;
        }

        private async Task<int> NewPartAsync()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            return part.Id!.Value;
        }

        private ExpeditionCitizen ReadFromDb(int citizenId)
        {
            var context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            return context.ExpeditionCitizens.Single(citizen => citizen.IdExpeditionCitizen == citizenId);
        }

        [Fact]
        public async Task SaveExpeditionCitizenAsync_ExigencesEnregistreesEtRelues()
        {
            var partId = await NewPartAsync();

            var saved = await NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto
            {
                OrdersId = new List<int>(),
                NombrePeDepart = 2,
                NombrePeDepartOperator = "exact",
                IsPreinscritChaussures = true
            });

            saved.NombrePeDepart.Should().Be(2);
            saved.NombrePeDepartOperator.Should().Be("exact");
            saved.IsPreinscritChaussures.Should().BeTrue();
            var fromDb = ReadFromDb(saved.Id!.Value);
            fromDb.NombrePeDepart.Should().Be(2);
            fromDb.NombrePeDepartOperator.Should().Be("exact");
            fromDb.IsPreinscritChaussures.Should().BeTrue();
        }

        [Fact]
        public async Task SaveExpeditionCitizenAsync_OperateurOuPeInvalides_EnregistresNull()
        {
            var partId = await NewPartAsync();

            var saved = await NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto
            {
                OrdersId = new List<int>(),
                NombrePeDepart = -1,
                NombrePeDepartOperator = "plus"
            });

            saved.NombrePeDepart.Should().BeNull();
            saved.NombrePeDepartOperator.Should().BeNull();
            var fromDb = ReadFromDb(saved.Id!.Value);
            fromDb.NombrePeDepart.Should().BeNull();
            fromDb.NombrePeDepartOperator.Should().BeNull();
        }
    }
}
