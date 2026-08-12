using System;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAccount;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class UserAccountServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public UserAccountServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (IUserAccountService service, MhoContext context, int townId, int userId, int otherUserId, int pictoId) NewFixture()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IUserAccountService>();

            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            // IdTown/IdUser/IdPicto sont ValueGeneratedNever : jamais les laisser à 0.
            // MapId = IdTown : ResolveTownId(townId) résout par MapId, le service reçoit toujours un mapId.
            var town_id = random.Next(1, int.MaxValue);
            var town = new Town { IdTown = town_id, Name = "test-town-" + suffix, MapId = town_id };
            context.Towns.Add(town);

            var user = new User { IdUser = random.Next(1, int.MaxValue), Name = "test-user-" + suffix };
            var other_user = new User { IdUser = random.Next(1, int.MaxValue), Name = "test-other-user-" + suffix };
            context.Users.AddRange(user, other_user);

            var picto = new Picto { IdPicto = random.Next(1, int.MaxValue), Img = "test-" + suffix + ".png" };
            context.Pictos.Add(picto);
            context.SaveChanges();

            return (service, context, town.IdTown, user.IdUser, other_user.IdUser, picto.IdPicto);
        }

        /// <summary>
        /// Cas du citoyen mort dont la ville a été synchronisée (rewards du cadavre) mais qui n'a
        /// jamais lancé l'import manuel de son profil : TownCitizenPicto existe, UserPicto non.
        /// </summary>
        [Fact]
        public void GetPictos_CompteVilleSansTotalGlobal_CountEstNull()
        {
            var (service, context, townId, userId, _, pictoId) = NewFixture();
            context.TownCitizenPictos.Add(new TownCitizenPicto
            {
                IdTown = townId, IdUser = userId, IdPicto = pictoId, Count = 3, LastUpdate = DateTime.UtcNow
            });
            context.SaveChanges();

            var result = service.GetPictos(userId, townId);

            var line = result.Pictos.Should().ContainSingle(p => p.Id == pictoId).Subject;
            line.CountInTown.Should().Be(3);
            line.Count.Should().BeNull();
        }

        [Fact]
        public void GetPictos_TotalGlobalImporte_CountEstRenseigne()
        {
            var (service, context, townId, userId, _, pictoId) = NewFixture();
            context.TownCitizenPictos.Add(new TownCitizenPicto
            {
                IdTown = townId, IdUser = userId, IdPicto = pictoId, Count = 3, LastUpdate = DateTime.UtcNow
            });
            context.UserPictos.Add(new UserPicto
            {
                IdUser = userId, IdPicto = pictoId, Count = 7, LastUpdate = DateTime.UtcNow
            });
            context.SaveChanges();

            var result = service.GetPictos(userId, townId);

            var line = result.Pictos.Should().ContainSingle(p => p.Id == pictoId).Subject;
            line.CountInTown.Should().Be(3);
            line.Count.Should().Be(7);
        }

        /// <summary>
        /// Le total ville doit sommer TOUS les citoyens de la ville, pas seulement celui consulté :
        /// c'est le nombre "obtenu par la totalité des citoyens de la ville" attendu par la feature.
        /// </summary>
        [Fact]
        public void GetPictos_PlusieursCitoyensDansLaVille_TownTotalCountSommeTousLesCitoyens()
        {
            var (service, context, townId, userId, otherUserId, pictoId) = NewFixture();
            context.TownCitizenPictos.AddRange(
                new TownCitizenPicto { IdTown = townId, IdUser = userId, IdPicto = pictoId, Count = 3, LastUpdate = DateTime.UtcNow },
                new TownCitizenPicto { IdTown = townId, IdUser = otherUserId, IdPicto = pictoId, Count = 5, LastUpdate = DateTime.UtcNow }
            );
            context.SaveChanges();

            var result = service.GetPictos(userId, townId);

            var line = result.Pictos.Should().ContainSingle(p => p.Id == pictoId).Subject;
            line.CountInTown.Should().Be(3);
            line.TownTotalCount.Should().Be(8);
        }
    }
}
