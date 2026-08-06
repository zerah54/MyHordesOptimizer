using System;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class TownServiceDailyActionTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownServiceDailyActionTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (ITownService service, MhoContext context, int townId, int userId) NewFixture()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<ITownService>();

            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            // IdTown/IdUser sont ValueGeneratedNever (identifiants MyHordes externes) : jamais les laisser à 0.
            // MapId = IdTown : ResolveTownId(townId) résout par MapId, pas par IdTown (le client envoie
            // toujours le mapId) — les égaler ici évite de distinguer les deux dans les appels de service.
            var town_id = random.Next(1, int.MaxValue);
            var town = new Town { IdTown = town_id, Name = "test-town-" + suffix, MapId = town_id };
            context.Towns.Add(town);
            context.SaveChanges();

            var user = new User { IdUser = random.Next(1, int.MaxValue), Name = "test-user-" + suffix };
            context.Users.Add(user);
            context.SaveChanges();

            // TownCitizen.IdLastUpdateInfo est NOT NULL (contrainte TownCitizen_ibfk_3) : requiert une ligne existante.
            var last_update_info = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(last_update_info);
            context.SaveChanges();

            context.TownCitizens.Add(new TownCitizen { IdTown = town.IdTown, IdUser = user.IdUser, IdLastUpdateInfo = last_update_info.IdLastUpdateInfo });
            context.SaveChanges();

            return (service, context, town.IdTown, user.IdUser);
        }

        [Fact]
        public void AddCitizenDailyAction_PremierMarquage_CreeUneLigne()
        {
            var (service, context, townId, userId) = NewFixture();

            service.AddCitizenDailyAction(townId, userId, "home_shower", 5);

            context.TownCitizenDailyActions
                .Count(a => a.IdTown == townId && a.IdUser == userId && a.Day == 5 && a.ActionKey == "home_shower")
                .Should().Be(1);
        }

        [Fact]
        public void AddCitizenDailyAction_DejaMarquee_NeCreePasDeDoublon()
        {
            var (service, context, townId, userId) = NewFixture();

            service.AddCitizenDailyAction(townId, userId, "home_shower", 5);
            service.AddCitizenDailyAction(townId, userId, "home_shower", 5);

            context.TownCitizenDailyActions
                .Count(a => a.IdTown == townId && a.IdUser == userId && a.Day == 5 && a.ActionKey == "home_shower")
                .Should().Be(1);
        }

        [Fact]
        public void AddCitizenDailyAction_DeuxActionKeysDifferentes_NeSeCollisionnentPas()
        {
            var (service, context, townId, userId) = NewFixture();

            service.AddCitizenDailyAction(townId, userId, "home_shower", 5);
            service.AddCitizenDailyAction(townId, userId, "home_clean", 5);

            context.TownCitizenDailyActions
                .Count(a => a.IdTown == townId && a.IdUser == userId && a.Day == 5)
                .Should().Be(2);
        }

        [Fact]
        public void DeleteCitizenDailyAction_LigneExistante_LaSupprime()
        {
            var (service, context, townId, userId) = NewFixture();
            service.AddCitizenDailyAction(townId, userId, "home_shower", 5);

            service.DeleteCitizenDailyAction(townId, userId, "home_shower", 5);

            context.TownCitizenDailyActions
                .Count(a => a.IdTown == townId && a.IdUser == userId && a.Day == 5 && a.ActionKey == "home_shower")
                .Should().Be(0);
        }

        [Fact]
        public void DeleteCitizenDailyAction_LigneAbsente_NeLeveAucuneErreur()
        {
            var (service, _, townId, userId) = NewFixture();

            System.Action act = () => service.DeleteCitizenDailyAction(townId, userId, "home_shower", 5);

            act.Should().NotThrow();
        }
    }
}
