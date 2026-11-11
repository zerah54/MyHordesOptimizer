using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class UserWishListGroupServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public UserWishListGroupServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (IUserWishListGroupService service, int userId, string[] uids) NewFixture()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IUserWishListGroupService>();
            var random = new Random();
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var user = new User { IdUser = random.Next(1, int.MaxValue), Name = "grp-" + suffix };
            context.Users.Add(user);
            var uids = new[] { "grp-a-" + suffix, "grp-b-" + suffix };
            foreach (var uid in uids)
            {
                context.Items.Add(new Item { IdItem = random.Next(1, int.MaxValue), Uid = uid });
            }
            context.SaveChanges();
            return (service, user.IdUser, uids);
        }

        private static UpsertUserWishListGroupRequestDto Req(string name, params string[] uids)
            => new() { Name = name, ItemUids = uids.ToList() };

        [Fact]
        public void Create_GroupeValide_LeRetrouveDansGetMine()
        {
            var (service, userId, uids) = NewFixture();

            service.Create(userId, Req("Atelier", uids[0], uids[1], uids[0]));

            var group = service.GetMine(userId).Should().ContainSingle().Subject;
            group.Name.Should().Be("Atelier");
            group.ItemUids.Should().Equal(uids[0], uids[1]);
        }

        [Fact]
        public void Create_NomRogne()
        {
            var (service, userId, uids) = NewFixture();

            service.Create(userId, Req("  Atelier  ", uids[0])).Name.Should().Be("Atelier");
        }

        [Theory]
        [InlineData("   ")]
        [InlineData("65")]
        public void Create_NomVideOu65Caracteres_LeveBadRequest(string name)
        {
            var (service, userId, uids) = NewFixture();
            var n = name == "65" ? new string('a', 65) : name;

            System.Action act = () => service.Create(userId, Req(n, uids[0]));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Fact]
        public void Create_AucunObjet_LeveBadRequest()
        {
            var (service, userId, _) = NewFixture();

            System.Action act = () => service.Create(userId, Req("Vide"));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Fact]
        public void Create_UidInconnu_LeveBadRequest()
        {
            var (service, userId, uids) = NewFixture();

            System.Action act = () => service.Create(userId, Req("Inconnu", uids[0], "uid-qui-n-existe-pas"));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Fact]
        public void Create_NomDejaUtilise_LeveConflict()
        {
            var (service, userId, uids) = NewFixture();
            service.Create(userId, Req("Atelier", uids[0]));

            System.Action act = () => service.Create(userId, Req("Atelier", uids[1]));

            act.Should().Throw<MhoConflictException>();
        }

        [Fact]
        public void Update_GroupeDUnAutreUtilisateur_LeveNotFound()
        {
            var (service, userId, uids) = NewFixture();
            var (_, otherId, _) = NewFixture();
            var group = service.Create(userId, Req("Atelier", uids[0]));

            System.Action act = () => service.Update(otherId, group.Id, Req("Pirate", uids[0]));

            act.Should().Throw<MhoNotFoundException>();
        }

        [Fact]
        public void Delete_GroupeDUnAutreUtilisateur_LeveNotFound()
        {
            var (service, userId, uids) = NewFixture();
            var (_, otherId, _) = NewFixture();
            var group = service.Create(userId, Req("Atelier", uids[0]));

            System.Action act = () => service.Delete(otherId, group.Id);

            act.Should().Throw<MhoNotFoundException>();
        }

        [Fact]
        public void Update_RemplaceNomEtObjets()
        {
            var (service, userId, uids) = NewFixture();
            var group = service.Create(userId, Req("Atelier", uids[0]));

            var updated = service.Update(userId, group.Id, Req("Chantier", uids[1]));

            updated.Name.Should().Be("Chantier");
            var mine = service.GetMine(userId).Should().ContainSingle().Subject;
            mine.Name.Should().Be("Chantier");
            mine.ItemUids.Should().Equal(uids[1]);
        }
    }
}
