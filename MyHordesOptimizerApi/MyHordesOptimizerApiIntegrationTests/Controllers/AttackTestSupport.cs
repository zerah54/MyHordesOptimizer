using System;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Ville de test (un citoyen vivant, un mort, un étranger) et clients HTTP authentifiés.</summary>
    internal static class AttackTestSupport
    {
        public static (int townId, int aliveUserId, int deadUserId, int outsiderUserId) SeedTown(MhoContext context, int day)
        {
            var random = new Random();
            var townId = random.Next(1, int.MaxValue);
            var aliveUserId = random.Next(1, int.MaxValue);
            var deadUserId = random.Next(1, int.MaxValue);
            var outsiderUserId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = townId, MapId = townId, Name = "test-town-" + townId, Width = 40, Height = 40, Day = day });
            context.Users.Add(new User { IdUser = aliveUserId, Name = "test-alive-" + aliveUserId });
            context.Users.Add(new User { IdUser = deadUserId, Name = "test-dead-" + deadUserId });
            context.Users.Add(new User { IdUser = outsiderUserId, Name = "test-outsider-" + outsiderUserId });
            context.SaveChanges();
            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = aliveUserId, JobUid = "job_none", IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo, Dead = false });
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = deadUserId, JobUid = "job_none", IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo, Dead = true });
            context.SaveChanges();
            return (townId, aliveUserId, deadUserId, outsiderUserId);
        }

        public static HttpClient CreateClientFor(MyHordesOptimizerApplicationFactory factory, int userId)
        {
            using var scope = factory.Services.CreateScope();
            var authenticationService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
            var token = authenticationService.CreateToken(new SimpleMeDto { Id = userId, UserName = "test-user-" + userId }, "irrelevant-user-key").AccessToken;
            var client = factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return client;
        }
    }
}
