using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// Les 6 routes citoyen (/Bag, /Chest, /Status, /Home, /HeroicActions, /Ghoul) laissaient un
    /// userId de query, jamais vérifié, écraser l'identité JWT déjà posée par JwtActionFilter — un
    /// downgrade de sécurité, pas un manque d'authentification (seul le site les appelle, toujours
    /// avec un JWT valide). Fix : plus de userId en query, seul le JWT fait foi. Voir
    /// docs/superpowers/specs/2026-09-08-externaltools-update-userkey-ownership-design.md.
    /// </summary>
    public class ExternalToolsCitizenRoutesTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsCitizenRoutesTests(MyHordesOptimizerApplicationFactory factory)
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

        private static int SeedTownAndCitizen(MhoContext context, string suffix)
        {
            var townId = new Random().Next(1, int.MaxValue);
            var userId = new Random().Next(1, int.MaxValue);
            context.Towns.Add(new Town
            {
                IdTown = townId,
                MapId = townId,
                Name = "test-town-" + suffix,
                IsFinished = false,
                Width = 40,
                Height = 40,
                Day = 5,
                X = 17,
                Y = 23,
                HasExternalApi = true
            });
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();
            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = userId, JobUid = "job_none", IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo });
            context.SaveChanges();
            return townId;
        }

        /// <summary>
        /// Seede une ville avec deux citoyens. Retourne (townId, userAId, userBId).
        /// </summary>
        private static (int townId, int userAId, int userBId) SeedTownAndTwoCitizens(MhoContext context, string suffix)
        {
            var townId = new Random().Next(1, int.MaxValue);
            var userAId = new Random().Next(1, int.MaxValue);
            var userBId = new Random().Next(1, int.MaxValue);

            context.Towns.Add(new Town
            {
                IdTown = townId,
                MapId = townId,
                Name = "test-town-" + suffix,
                IsFinished = false,
                Width = 40,
                Height = 40,
                Day = 5,
                X = 17,
                Y = 23,
                HasExternalApi = true
            });
            context.Users.Add(new User { IdUser = userAId, Name = "test-user-a-" + suffix });
            context.Users.Add(new User { IdUser = userBId, Name = "test-user-b-" + suffix });
            context.SaveChanges();

            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();

            // Seed citizenA avec IsGhoul=false
            context.TownCitizens.Add(new TownCitizen
            {
                IdTown = townId,
                IdUser = userAId,
                JobUid = "job_none",
                IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo,
                IsGhoul = false,
                GhoulVoracity = 0
            });
            // Seed citizenB avec IsGhoul=false
            context.TownCitizens.Add(new TownCitizen
            {
                IdTown = townId,
                IdUser = userBId,
                JobUid = "job_none",
                IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo,
                IsGhoul = false,
                GhoulVoracity = 0
            });
            context.SaveChanges();

            return (townId, userAId, userBId);
        }

        [Fact]
        public async Task PostBag_SansUserIdEnQuery_UtiliseLIdentiteDuJwt()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            int townId;
            using (var scope = _factory.Services.CreateScope())
            {
                townId = SeedTownAndCitizen(scope.ServiceProvider.GetRequiredService<MhoContext>(), suffix);
            }
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                var userId = context.TownCitizens.Single(c => c.IdTown == townId).IdUser;

                var client = CreateClientFor(userId);
                var body = new StringContent($"{{\"userId\":{userId},\"objects\":[]}}", Encoding.UTF8, "application/json");

                var response = await client.PostAsync($"/ExternalTools/Bag?townId={townId}", body);

                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }
        }

        [Fact]
        public async Task PostGhoul_AuthWithUserA_IgnoresUserBFromQuery_UpdatesOnlyUserA()
        {
            /// Test discriminant: le JWT fait foi, pas un paramètre userId bidon en query.
            /// Avec l'ancien code ([FromQuery] int userId + UserInfoProvider.UserId = userId),
            /// un attaquant pouvait envoyer un JWT valide pour l'utilisateur A mais un userId
            /// de query pointant vers l'utilisateur B, et faire updater B à la place de A.
            /// Ce test prouve qu'avec la nouvelle implémentation, seul le JWT est utilisé.
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            (int townId, int userAId, int userBId) seedResult;

            using (var scope = _factory.Services.CreateScope())
            {
                seedResult = SeedTownAndTwoCitizens(scope.ServiceProvider.GetRequiredService<MhoContext>(), suffix);
            }

            var townId = seedResult.townId;
            var userAId = seedResult.userAId;
            var userBId = seedResult.userBId;

            using (var scope = _factory.Services.CreateScope())
            {
                // Authentifie avec userA
                var clientA = CreateClientFor(userAId);

                // POST sur /Ghoul avec un userId bidon en query (userB).
                // Avec l'ancien code, userB aurait été updaté. Avec le nouveau code, userA est updaté (JWT fait foi).
                var body = new StringContent("{\"isGhoul\":true,\"voracity\":5}", Encoding.UTF8, "application/json");
                var response = await clientA.PostAsync($"/ExternalTools/Ghoul?townId={townId}&userId={userBId}", body);

                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();

                // Vérifier que userA (authentifié) a bien été updaté
                var citizenA = context.TownCitizens.Single(c => c.IdTown == townId && c.IdUser == userAId);
                citizenA.IsGhoul.Should().Be(true);
                citizenA.GhoulVoracity.Should().Be(5);

                // Vérifier que userB (pointé en query, mais ignored) n'a pas été modifié
                var citizenB = context.TownCitizens.Single(c => c.IdTown == townId && c.IdUser == userBId);
                citizenB.IsGhoul.Should().Be(false);
                citizenB.GhoulVoracity.Should().Be(0);
            }
        }
    }
}
