using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// C2 (revue finale du chantier cycle de vie de session) : sur 429/503, le repli BDD résolvait
    /// l'identité depuis un <c>knownUserId</c> fourni par le CLIENT, sans lien vérifié avec le
    /// <c>userKey</c> soumis — n'importe quel porteur d'une clé MyHordes valide pouvait se faire
    /// émettre un JWT 14 jours pour un userId arbitraire. Fix : résolution SERVEUR via une table en
    /// mémoire hash(userKey) → userId, alimentée à chaque appel réussi de GetSimpleMeAsync. Le repli
    /// résout désormais le userId depuis le userKey SOUMIS dans la requête courante, jamais depuis une
    /// valeur fournie par le client.
    /// </summary>
    public class AuthenticationControllerFallbackTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AuthenticationControllerFallbackTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>
        /// GetMe() minimal, hors ville (Map null) : suffit à faire réussir GetSimpleMeAsync et donc à
        /// peupler le cache hash(userKey) → userId, sans exercer la synchronisation de ville (hors
        /// périmètre de ce test, déjà couverte ailleurs).
        /// </summary>
        private sealed class GhostUserMyHordesApiRepository : IMyHordesApiRepository
        {
            private readonly int _userId;
            private readonly string _userName;

            public GhostUserMyHordesApiRepository(int userId, string userName)
            {
                _userId = userId;
                _userName = userName;
            }

            public MyHordesUserDetailsDto GetMe() => new() { Id = _userId, Name = _userName, Map = null };

            public Dictionary<string, MyHordesItem> GetItems() => new();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMeIdentity() => new() { Id = _userId };
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotSupportedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
            public List<int> GetTownList(int? season = null) => new();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
            public MyHordesMap GetMapDetails(int mapId) => null;
        }

        /// <summary>
        /// X/Y/HasExternalApi sont fixés à des valeurs qui se distinguent clairement de leurs anciens
        /// défauts (0/0/null) — voir G1 point 3 : verrouiller en non-régression la lecture de
        /// town.X/town.Y/town.HasExternalApi par le repli BDD, au lieu de 0/0/null codés en dur.
        /// </summary>
        private static int SeedTownAndCitizen(MhoContext context, string suffix, bool withMapId = true)
        {
            var townId = new Random().Next(1, int.MaxValue);
            var userId = new Random().Next(1, int.MaxValue);
            context.Towns.Add(new Town
            {
                IdTown = townId,
                MapId = withMapId ? townId : (int?)null,
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
            return userId;
        }

        [Fact]
        public async Task GetToken_MyHordesRepond429ApresUnAppelReussi_RetombeSurLaBddViaLeUserKeySoumis()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "test-key-" + suffix;

            int userId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                userId = SeedTownAndCitizen(context, suffix);
            }

            // Premier appel réussi : peuple le cache hash(userKey) -> userId, exactement comme le
            // ferait un login normal. C'est la SEULE source du repli désormais.
            using (var successFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => new GhostUserMyHordesApiRepository(userId, "test-user-" + suffix));
                });
            }))
            {
                var successResponse = await successFactory.CreateClient().GetAsync($"/Authentication/Token?userKey={userKey}");
                successResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            }

            // Second appel, MyHordes en panne : le repli doit résoudre l'identité depuis CE MÊME
            // userKey (déjà connu de la requête courante), sans paramètre knownUserId.
            using var throwingFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ =>
                        new ThrowingMyHordesApiRepository(HttpStatusCode.TooManyRequests, "Quota dépassé"));
                });
            });

            var response = await throwingFactory.CreateClient().GetAsync($"/Authentication/Token?userKey={userKey}");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var body = JObject.Parse(await response.Content.ReadAsStringAsync());
            body["simpleMe"]!["id"]!.Value<int>().Should().Be(userId);
            body["token"]!["accessToken"]!.Value<string>().Should().NotBeNullOrEmpty();
            // G1 point 3 : verrouille en non-régression townX/townY/hasExternalApi, corrigés dans une
            // tâche précédente pour lire town.X/town.Y/town.HasExternalApi (au lieu de 0/0/null).
            // Valeurs de seed (17/23/true) choisies pour se distinguer sans ambiguïté des anciens défauts.
            body["simpleMe"]!["townDetails"]!["townX"]!.Value<int>().Should().Be(17);
            body["simpleMe"]!["townDetails"]!["townY"]!.Value<int>().Should().Be(23);
            body["simpleMe"]!["townDetails"]!["hasExternalApi"]!.Value<bool?>().Should().Be(true);
        }

        /// <summary>
        /// G1 point 2 : IdTown est une clé locale provisoire (-mapId) tant que MapId MyHordes n'est pas
        /// synchronisé. Le repli BDD ne doit jamais l'exposer comme TownId (piège IdTown/MapId) — sans
        /// MapId, le repli doit échouer (rethrow de l'exception 429/503 d'origine), pas renvoyer 200
        /// avec un TownId erroné.
        /// </summary>
        [Fact]
        public async Task GetToken_MyHordesRepond429_VilleSansMapIdSynchronise_NeRetombeJamaisAvecUnTownIdErrone()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "test-key-" + suffix;

            int userId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                userId = SeedTownAndCitizen(context, suffix, withMapId: false);
            }

            using (var successFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => new GhostUserMyHordesApiRepository(userId, "test-user-" + suffix));
                });
            }))
            {
                var successResponse = await successFactory.CreateClient().GetAsync($"/Authentication/Token?userKey={userKey}");
                successResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            }

            using var throwingFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ =>
                        new ThrowingMyHordesApiRepository(HttpStatusCode.TooManyRequests, "Quota dépassé"));
                });
            });

            var response = await throwingFactory.CreateClient().GetAsync($"/Authentication/Token?userKey={userKey}");

            // Avant le fix : 200 avec TownId = IdTown (clé locale provisoire confondue avec un MapId).
            // Après le fix : repli impossible sans MapId synchronisé -> rethrow, jamais 200.
            response.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        }

        /// <summary>
        /// Preuve que l'exploit C1/C2 est fermé : un attaquant ne peut plus se faire émettre
        /// l'identité d'un tiers via un knownUserId arbitraire. La victime a un userId connu (peuplé
        /// via son PROPRE userKey), l'attaquant soumet un userKey jamais validé auparavant : sur
        /// 429/503, le repli ne doit jamais renvoyer l'identité de la victime.
        /// </summary>
        [Fact]
        public async Task GetToken_AttaquantSansCacheAvecKnownUserIdDunTiers_NeRecoitJamaisLidentiteDeCeTiers()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var victimKey = "victim-key-" + suffix;
            var attackerKey = "attacker-key-" + suffix;

            int victimUserId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                victimUserId = SeedTownAndCitizen(context, suffix);
            }

            // La victime se connecte normalement une fois : son userId n'est associé qu'au hash de
            // SON PROPRE userKey dans le cache serveur.
            using (var successFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => new GhostUserMyHordesApiRepository(victimUserId, "victim-" + suffix));
                });
            }))
            {
                var victimResponse = await successFactory.CreateClient().GetAsync($"/Authentication/Token?userKey={victimKey}");
                victimResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            }

            // L'attaquant connaît le userId de la victime (public / annuaire) et tente de se le faire
            // servir via l'ancien paramètre knownUserId, avec SA PROPRE clé (jamais vue en cache) et
            // MyHordes en panne.
            using var throwingFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ =>
                        new ThrowingMyHordesApiRepository(HttpStatusCode.TooManyRequests, "Quota dépassé"));
                });
            });

            var response = await throwingFactory.CreateClient()
                .GetAsync($"/Authentication/Token?userKey={attackerKey}&knownUserId={victimUserId}");

            // Avant le fix : 200 avec l'identité de la victime (exploit). Après le fix : knownUserId
            // n'existe plus, le userKey de l'attaquant est absent du cache -> rethrow, jamais 200.
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var body = JObject.Parse(await response.Content.ReadAsStringAsync());
                body["simpleMe"]!["id"]!.Value<int>().Should().NotBe(victimUserId,
                    "un attaquant sans identité vérifiée ne doit jamais recevoir le JWT d'un tiers");
            }
            else
            {
                response.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
            }
        }
    }
}
