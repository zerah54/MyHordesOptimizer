using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// GetToken (donc GetSimpleMeAsync) déclenche désormais ImportUserPictosAsync en fond, à chaque
    /// connexion en ville ou hors ville (si l'utilisateur existe déjà). Pas de garde "nouvelle ville
    /// pour ce citoyen" côté GetSimpleMeAsync : map.citizens liste TOUS les citoyens de la ville, la
    /// ligne TownCitizen d'un joueur peut donc déjà exister sans qu'il ait lui-même synchronisé
    /// (créée par la synchro d'un AUTRE citoyen — MyHordeCitizenToUserValueResolver). Le throttle 24h
    /// déjà présent dans ImportUserPictosAsync (PictosHistoryImportedAt) est le seul signal fiable
    /// pour éviter l'appel MyHordes coûteux (>100 requêtes SQL pour un vétéran) à chaque connexion.
    /// </summary>
    public class AuthenticationControllerAutoPictosImportTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AuthenticationControllerAutoPictosImportTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static readonly TimeSpan PollTimeout = TimeSpan.FromSeconds(5);

        private static async Task<bool> WaitUntil(Func<bool> condition)
        {
            var deadline = DateTime.UtcNow + PollTimeout;
            while (DateTime.UtcNow < deadline)
            {
                if (condition())
                {
                    return true;
                }
                await Task.Delay(50);
            }
            return condition();
        }

        /// <summary>Partagé entre toutes les instances scope-par-scope de TrackingMyHordesApiRepository (GetMe() tourne dans le scope requête, GetUserPictos() dans le scope de la tâche de fond).</summary>
        private sealed class PictosCallTracker
        {
            private int _callCount;
            public int CallCount => _callCount;
            public void Increment() => Interlocked.Increment(ref _callCount);
        }

        private sealed class TrackingMyHordesApiRepository : IMyHordesApiRepository
        {
            private readonly MyHordesUserDetailsDto _getMeResponse;
            private readonly IUserInfoProvider _userInfoProvider;
            private readonly PictosCallTracker _tracker;

            public TrackingMyHordesApiRepository(MyHordesUserDetailsDto getMeResponse, IUserInfoProvider userInfoProvider, PictosCallTracker tracker)
            {
                _getMeResponse = getMeResponse;
                _userInfoProvider = userInfoProvider;
                _tracker = tracker;
            }

            // Reproduit l'effet de bord de MyHordesApiRepository.GetMe() : GetSimpleMeAsync s'appuie
            // dessus (UserInfoProvider.UserId/UserName) avant même de lire la réponse en détail.
            public MyHordesUserDetailsDto GetMe()
            {
                _userInfoProvider.UserId = _getMeResponse.Id!.Value;
                _userInfoProvider.UserName = _getMeResponse.Name;
                return _getMeResponse;
            }

            public MyHordesUserDetailsDto GetUserPictos(int userId)
            {
                _tracker.Increment();
                return new MyHordesUserDetailsDto { PlayedMaps = new List<MyHordesCitizenRankingDto>() };
            }

            public Dictionary<string, MyHordesItem> GetItems() => new();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMeIdentity() => new() { Id = _getMeResponse.Id };
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
            public List<int> GetTownList(int? season = null) => new();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
            public MyHordesMap GetMapDetails(int mapId) => null;
        }

        private static MyHordesUserDetailsDto BuildInTownResponse(int userId, string suffix, int mapId)
        {
            return new MyHordesUserDetailsDto
            {
                Id = userId,
                Name = "test-user-" + suffix,
                MapId = mapId,
                Map = new MyHordesMap
                {
                    Id = mapId,
                    Wid = 1,
                    Hei = 1,
                    Days = 1,
                    Season = 1,
                    City = new MyHordesCity
                    {
                        Name = "test-town-" + suffix,
                        Type = "remote",
                        X = 0,
                        Y = 0,
                        Bank = new List<MyHordesItem>(),
                        Buildings = new List<MyHordesBuildingDto>()
                    },
                    Zones = new List<MyHordesZone> { new() { X = 0, Y = 0 } },
                    Citizens = new List<MyHordesUserDto>
                    {
                        new() { Id = userId, Name = "test-user-" + suffix, X = 0, Y = 0, Dead = false, Out = false, Ban = false }
                    },
                    Cadavers = new List<MyHordesCitizenRankingDto>()
                }
            };
        }

        [Fact]
        public async Task GetToken_NouvelleVillePourCeCitoyen_DeclencheLimportPictosEnFond()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userId = new Random().Next(1, int.MaxValue);
            var mapId = new Random().Next(1, int.MaxValue);
            var response = BuildInTownResponse(userId, suffix, mapId);
            var tracker = new PictosCallTracker();

            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(sp =>
                        new TrackingMyHordesApiRepository(response, sp.GetRequiredService<IUserInfoProvider>(), tracker));
                });
            });

            var httpResponse = await factory.CreateClient().GetAsync($"/Authentication/Token?userKey=key-{suffix}");
            httpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            (await WaitUntil(() => tracker.CallCount > 0))
                .Should().BeTrue("nouvelle ville pour ce citoyen : l'import pictos/playedMaps doit se déclencher automatiquement");

            using var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            (await WaitUntil(() => context.Users.AsNoTracking().Single(u => u.IdUser == userId).PictosHistoryImportedAt.HasValue))
                .Should().BeTrue();
        }

        [Fact]
        public async Task GetToken_HorsVilleUtilisateurDejaConnu_DeclencheLimportPictosEnFond()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userId = new Random().Next(1, int.MaxValue);

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }

            var response = new MyHordesUserDetailsDto { Id = userId, Name = "test-user-" + suffix, Map = null };
            var tracker = new PictosCallTracker();

            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(sp =>
                        new TrackingMyHordesApiRepository(response, sp.GetRequiredService<IUserInfoProvider>(), tracker));
                });
            });

            var httpResponse = await factory.CreateClient().GetAsync($"/Authentication/Token?userKey=key-{suffix}");
            httpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            (await WaitUntil(() => tracker.CallCount > 0))
                .Should().BeTrue("hors ville et utilisateur déjà connu : l'import pictos/playedMaps doit se déclencher automatiquement");
        }

        [Fact]
        public async Task GetToken_HorsVilleUtilisateurInconnu_NeDeclenchePasLimportPictos()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userId = new Random().Next(1, int.MaxValue);
            var response = new MyHordesUserDetailsDto { Id = userId, Name = "test-user-" + suffix, Map = null };
            var tracker = new PictosCallTracker();

            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(sp =>
                        new TrackingMyHordesApiRepository(response, sp.GetRequiredService<IUserInfoProvider>(), tracker));
                });
            });

            var httpResponse = await factory.CreateClient().GetAsync($"/Authentication/Token?userKey=key-{suffix}");
            httpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Pas de User en base pour ce userId : ImportUserPictosAsync planterait ("Utilisateur
            // introuvable") si on le déclenchait quand même — le garde doit l'éviter en amont.
            await Task.Delay(300);
            tracker.CallCount.Should().Be(0);
        }

        /// <summary>
        /// Sans garde côté GetSimpleMeAsync (voir commentaire de classe), c'est le throttle 24h
        /// interne à ImportUserPictosAsync (PictosHistoryImportedAt) qui doit empêcher un second
        /// appel MyHordes coûteux sur une connexion rapprochée dans la même ville.
        /// </summary>
        [Fact]
        public async Task GetToken_DeuxConnexionsRapprochees_LeThrottle24hEmpecheLeSecondAppelMyHordes()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userId = new Random().Next(1, int.MaxValue);
            var mapId = new Random().Next(1, int.MaxValue);
            var response = BuildInTownResponse(userId, suffix, mapId);
            var tracker = new PictosCallTracker();

            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(sp =>
                        new TrackingMyHordesApiRepository(response, sp.GetRequiredService<IUserInfoProvider>(), tracker));
                });
            });

            var client = factory.CreateClient();

            var first = await client.GetAsync($"/Authentication/Token?userKey=key-a-{suffix}");
            first.StatusCode.Should().Be(HttpStatusCode.OK);

            // Attendre PictosHistoryImportedAt, pas juste l'appel à GetUserPictos : sinon la seconde
            // requête peut arriver avant que PersistUserPictos n'ait écrit la date, et le throttle
            // (lu depuis la BDD) ne voit encore rien à throttler. Scope frais à CHAQUE poll : un
            // DbContext réutilisé peut garder un instantané REPEATABLE READ périmé.
            bool HasImported()
            {
                using var scope = factory.Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                return context.Users.AsNoTracking().Single(u => u.IdUser == userId).PictosHistoryImportedAt.HasValue;
            }
            (await WaitUntil(HasImported)).Should().BeTrue();

            var callsAfterFirst = tracker.CallCount;

            // Même citoyen, même ville, second appel juste après (clé différente pour éviter le
            // rate-limit, mais même userId/mapId renvoyés par le repo) : GetSimpleMeAsync retente
            // ImportUserPictosAsync sans condition, seul le throttle interne doit l'arrêter.
            var second = await client.GetAsync($"/Authentication/Token?userKey=key-b-{suffix}");
            second.StatusCode.Should().Be(HttpStatusCode.OK);

            await Task.Delay(300);
            tracker.CallCount.Should().Be(callsAfterFirst, "moins de 24h depuis le premier import, le throttle doit empêcher le second appel MyHordes");
        }
    }
}
