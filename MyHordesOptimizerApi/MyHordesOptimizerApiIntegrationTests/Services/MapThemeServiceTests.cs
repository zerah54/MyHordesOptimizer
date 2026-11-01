using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapTheme;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class MapThemeServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public MapThemeServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (IMapThemeService service, MhoContext context, int userId) NewFixture()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IMapThemeService>();
            var user = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "theme-" + Guid.NewGuid().ToString("N").Substring(0, 8) };
            context.Users.Add(user);
            context.SaveChanges();
            return (service, context, user.IdUser);
        }

        private static UpsertMapThemeRequestDto Req(string name = "Rose", Dictionary<string, string>? colors = null)
            => new() { Name = name, Colors = colors ?? new Dictionary<string, string> { ["map-l0"] = "#5a1a3c" } };

        [Fact]
        public void Create_ThemeValide_LeRetrouveDansGetMine()
        {
            var (service, _, userId) = NewFixture();

            service.Create(userId, Req());

            var theme = service.GetMine(userId).Themes.Should().ContainSingle().Subject;
            theme.Name.Should().Be("Rose");
            theme.Colors["map-l0"].Should().Be("#5a1a3c");
        }

        [Fact]
        public void Create_NomAvecEspaces_EstTrim()
        {
            var (service, _, userId) = NewFixture();

            service.Create(userId, Req("  Rose  ")).Name.Should().Be("Rose");
        }

        [Fact]
        public void Create_NomVide_LeveBadRequest()
        {
            var (service, _, userId) = NewFixture();

            System.Action act = () => service.Create(userId, Req("   "));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Fact]
        public void Create_Nom65Caracteres_LeveBadRequest()
        {
            var (service, _, userId) = NewFixture();

            System.Action act = () => service.Create(userId, Req(new string('a', 65)));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Theory]
        [InlineData("route-blue")]
        [InlineData("bp-u")]
        [InlineData("bp-r")]
        public void Create_CleHorsListe_LeveBadRequest(string token)
        {
            var (service, _, userId) = NewFixture();

            System.Action act = () => service.Create(userId, Req(colors: new() { [token] = "#000000" }));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Theory]
        [InlineData("red")]
        [InlineData("#12345")]
        [InlineData("#000000;x")]
        public void Create_ValeurInvalide_LeveBadRequest(string value)
        {
            var (service, _, userId) = NewFixture();

            System.Action act = () => service.Create(userId, Req(colors: new() { ["map-l0"] = value }));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Fact]
        public void Create_NomDejaPris_LeveConflict()
        {
            var (service, _, userId) = NewFixture();
            service.Create(userId, Req());

            System.Action act = () => service.Create(userId, Req());

            act.Should().Throw<MhoConflictException>();
        }

        [Fact]
        public void Create_MemeNomAutreUtilisateur_Reussit()
        {
            var (service, _, userId) = NewFixture();
            var (_, _, otherId) = NewFixture();
            service.Create(userId, Req());

            System.Action act = () => service.Create(otherId, Req());

            act.Should().NotThrow();
        }

        [Fact]
        public void Create_VingtEtUnieme_LeveConflict()
        {
            var (service, _, userId) = NewFixture();
            for (var i = 0; i < 20; i++) service.Create(userId, Req("t" + i));

            System.Action act = () => service.Create(userId, Req("t20"));

            act.Should().Throw<MhoConflictException>();
        }

        [Fact]
        public void Update_ThemeDUnAutre_LeveNotFound()
        {
            var (service, _, userId) = NewFixture();
            var (_, _, otherId) = NewFixture();
            var theme = service.Create(userId, Req());

            System.Action act = () => service.Update(otherId, theme.Id, Req("Autre"));

            act.Should().Throw<MhoNotFoundException>();
            service.GetMine(userId).Themes.Single().Name.Should().Be("Rose");
        }

        [Fact]
        public void Update_VersUnNomPris_LeveConflict()
        {
            var (service, _, userId) = NewFixture();
            service.Create(userId, Req("Bleu"));
            var theme = service.Create(userId, Req("Rose"));

            System.Action act = () => service.Update(userId, theme.Id, Req("Bleu"));

            act.Should().Throw<MhoConflictException>();
            service.GetMine(userId).Themes.Should().Contain(t => t.Id == theme.Id && t.Name == "Rose");
        }

        [Fact]
        public void Update_MemeNom_Reussit()
        {
            var (service, _, userId) = NewFixture();
            var theme = service.Create(userId, Req("Rose"));

            var updated = service.Update(userId, theme.Id, Req("Rose", new() { ["map-l0"] = "#000000" }));

            updated.Name.Should().Be("Rose");
            updated.Colors["map-l0"].Should().Be("#000000");
        }

        [Fact]
        public void Delete_ThemeDUnAutre_LeveNotFound()
        {
            var (service, _, userId) = NewFixture();
            var (_, _, otherId) = NewFixture();
            var theme = service.Create(userId, Req());

            System.Action act = () => service.Delete(otherId, theme.Id);

            act.Should().Throw<MhoNotFoundException>();
            service.GetMine(userId).Themes.Should().HaveCount(1);
        }

        [Fact]
        public void Delete_ThemeActif_RevientAParDefaut()
        {
            var (service, _, userId) = NewFixture();
            var theme = service.Create(userId, Req());
            service.SetActive(userId, new MapThemeActiveDto { ThemeId = theme.Id });

            service.Delete(userId, theme.Id);

            service.GetMine(userId).Active.ThemeId.Should().BeNull();
        }

        [Fact]
        public void SetActive_LigneExistante_EstMiseAJour()
        {
            var (service, _, userId) = NewFixture();
            var first = service.Create(userId, Req("Rose"));
            var second = service.Create(userId, Req("Bleu"));
            service.SetActive(userId, new MapThemeActiveDto { ThemeId = first.Id });

            service.SetActive(userId, new MapThemeActiveDto { ThemeId = second.Id });

            service.GetMine(userId).Active.ThemeId.Should().Be(second.Id);
        }

        [Fact]
        public void SetActive_ThemeDUnAutre_LeveNotFound()
        {
            var (service, _, userId) = NewFixture();
            var (_, _, otherId) = NewFixture();
            var theme = service.Create(otherId, Req());

            System.Action act = () => service.SetActive(userId, new MapThemeActiveDto { ThemeId = theme.Id });

            act.Should().Throw<MhoNotFoundException>();
        }

        [Fact]
        public void SetActive_Rien_RevientAParDefaut()
        {
            var (service, _, userId) = NewFixture();
            var theme = service.Create(userId, Req());
            service.SetActive(userId, new MapThemeActiveDto { ThemeId = theme.Id });

            service.SetActive(userId, new MapThemeActiveDto());

            service.GetMine(userId).Active.ThemeId.Should().BeNull();
        }

        [Fact]
        public void GetMine_SansLigne_RenvoieVideEtParDefaut()
        {
            var (service, _, userId) = NewFixture();

            var result = service.GetMine(userId);

            result.Themes.Should().BeEmpty();
            result.Active.ThemeId.Should().BeNull();
        }
    }
}
