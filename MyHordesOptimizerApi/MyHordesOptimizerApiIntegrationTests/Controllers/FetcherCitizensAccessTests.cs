using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// Fetcher/Citizens ne vérifiait ni l'appartenance du demandeur à la ville, ni que le userId de
    /// query correspondait au JWT (il l'écrasait) : n'importe quel utilisateur authentifié pouvait lire
    /// sac/coffre/états/points d'âme des citoyens de n'importe quelle ville, en spoofant au besoin le
    /// userId de query. Fix : 403 si userId ne correspond pas au JWT, puis données minimales pour un
    /// demandeur qui n'est ni citoyen vivant ni citoyen mort de la ville visée.
    /// </summary>
    public class FetcherCitizensAccessTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public FetcherCitizensAccessTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private string CreateBearerFor(int userId)
        {
            using var scope = _factory.Services.CreateScope();
            var authenticationService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
            var me = new SimpleMeDto { Id = userId, UserName = "test-user-" + userId };
            return authenticationService.CreateToken(me, "irrelevant-user-key").AccessToken;
        }

        private HttpClient CreateClientFor(int userId)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateBearerFor(userId));
            return client;
        }

        /// <summary>Ville avec un citoyen vivant (sac garni, rôle chaman) et un citoyen mort (cadavre garni).</summary>
        private static (int townId, int aliveUserId, int deadUserId) SeedTownWithAliveAndDeadCitizen(MhoContext context, string suffix)
        {
            var townId = new Random().Next(1, int.MaxValue);
            var aliveUserId = new Random().Next(1, int.MaxValue);
            var deadUserId = new Random().Next(1, int.MaxValue);

            context.Towns.Add(new Town
            {
                IdTown = townId,
                MapId = townId,
                Name = "test-town-" + suffix,
                Width = 40,
                Height = 40,
                Day = 5,
                IdShaman = aliveUserId
            });
            context.Users.Add(new User { IdUser = aliveUserId, Name = "test-alive-" + suffix, Avatar = "avatar-alive.png" });
            context.Users.Add(new User { IdUser = deadUserId, Name = "test-dead-" + suffix, Avatar = "avatar-dead.png" });
            context.SaveChanges();

            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();

            var bag = new Bag();
            context.Bags.Add(bag);
            context.SaveChanges();
            var knownItem = context.Items.First();
            context.BagItems.Add(new BagItem { IdBag = bag.IdBag, IdItem = knownItem.IdItem, Count = 3, IsBroken = false });
            context.SaveChanges();

            context.TownCitizens.Add(new TownCitizen
            {
                IdTown = townId,
                IdUser = aliveUserId,
                IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo,
                JobUid = "job_none",
                HouseLevel = 3,
                IdBag = bag.IdBag,
                Dead = false
            });
            context.TownCitizens.Add(new TownCitizen
            {
                IdTown = townId,
                IdUser = deadUserId,
                IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo,
                JobUid = "job_none",
                Dead = true
            });
            context.SaveChanges();

            context.TownCadavers.Add(new TownCadaver
            {
                IdTown = townId,
                IdUser = deadUserId,
                SoulPoints = 42,
                SurvivalDay = 7,
                DeathMessage = "derniers mots prives",
                TownMessage = "message a la ville"
            });
            context.SaveChanges();

            return (townId, aliveUserId, deadUserId);
        }

        [Fact]
        public async Task GetCitizens_Membre_RenvoieLesDonneesCompletes()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            int townId, aliveUserId, deadUserId;
            using (var scope = _factory.Services.CreateScope())
            {
                (townId, aliveUserId, deadUserId) = SeedTownWithAliveAndDeadCitizen(scope.ServiceProvider.GetRequiredService<MhoContext>(), suffix);
            }

            var client = CreateClientFor(aliveUserId);
            var response = await client.GetAsync($"/Fetcher/Citizens?townId={townId}&userId={aliveUserId}");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var dto = JsonSerializer.Deserialize<CitizensLastUpdateDto>(await response.Content.ReadAsStringAsync(), JsonOptions);
            var alive = dto!.Citizens.Single(c => c.Id == aliveUserId);
            alive.Bag.Items.Should().ContainSingle();
            alive.TownRoles.Should().Contain("shaman");

            var dead = dto.Citizens.Single(c => c.Id == deadUserId);
            dead.Cadaver.SoulPoints.Should().Be(42);
            dead.Cadaver.Msg.Should().Be("derniers mots prives");
            dead.Cadaver.TownMsg.Should().Be("message a la ville");
        }

        [Fact]
        public async Task GetCitizens_NonMembreVivant_RenvoieDonneesMinimales()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            int townId, aliveUserId;
            int outsiderUserId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                (townId, aliveUserId, _) = SeedTownWithAliveAndDeadCitizen(context, suffix);

                outsiderUserId = new Random().Next(1, int.MaxValue);
                context.Users.Add(new User { IdUser = outsiderUserId, Name = "test-outsider-" + suffix });
                context.SaveChanges();
            }

            var client = CreateClientFor(outsiderUserId);
            var response = await client.GetAsync($"/Fetcher/Citizens?townId={townId}&userId={outsiderUserId}");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var dto = JsonSerializer.Deserialize<CitizensLastUpdateDto>(await response.Content.ReadAsStringAsync(), JsonOptions);
            var alive = dto!.Citizens.Single(c => c.Id == aliveUserId);

            // Gardé : identité + rôle de ville + niveau de maison.
            alive.JobUid.Should().Be("job_none");
            alive.TownRoles.Should().Contain("shaman");
            alive.Home.Content.HouseLevel.Should().Be(3);

            // Retiré : contenu du sac.
            alive.Bag.Items.Should().BeEmpty();
        }

        [Fact]
        public async Task GetCitizens_NonMembreMort_GardeCauseEtMessageALaVilleMaisPasLePriveOuLesPointsDAme()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            int townId, deadUserId;
            int outsiderUserId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                (townId, _, deadUserId) = SeedTownWithAliveAndDeadCitizen(context, suffix);

                outsiderUserId = new Random().Next(1, int.MaxValue);
                context.Users.Add(new User { IdUser = outsiderUserId, Name = "test-outsider-" + suffix });
                context.SaveChanges();
            }

            var client = CreateClientFor(outsiderUserId);
            var response = await client.GetAsync($"/Fetcher/Citizens?townId={townId}&userId={outsiderUserId}");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var dto = JsonSerializer.Deserialize<CitizensLastUpdateDto>(await response.Content.ReadAsStringAsync(), JsonOptions);
            var dead = dto!.Citizens.Single(c => c.Id == deadUserId);

            dead.Cadaver.TownMsg.Should().Be("message a la ville");
            // Survival gardé (non affiché) : c'est la clé de tri "mort la plus récente d'abord" côté front.
            dead.Cadaver.Survival.Should().Be(7);
            dead.Cadaver.Msg.Should().BeNullOrEmpty();
            dead.Cadaver.SoulPoints.Should().BeNull();
        }

        [Fact]
        public async Task GetCitizens_UserIdDeQueryNeCorrespondPasAuJwt_Renvoie403()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            int townId, aliveUserId;
            using (var scope = _factory.Services.CreateScope())
            {
                (townId, aliveUserId, _) = SeedTownWithAliveAndDeadCitizen(scope.ServiceProvider.GetRequiredService<MhoContext>(), suffix);
            }

            // Authentifié comme aliveUserId, mais userId de query pointant vers un autre id.
            var client = CreateClientFor(aliveUserId);
            var spoofedUserId = aliveUserId + 1;
            var response = await client.GetAsync($"/Fetcher/Citizens?townId={townId}&userId={spoofedUserId}");

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
    }
}
