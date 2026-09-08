using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// C1 (revue finale du chantier cycle de vie de session) : Update, Update/Start et Update/Status
    /// n'avaient aucune vérification d'identité — un userId connu (public, annuaire) suffisait à lire
    /// l'avancement d'un autre joueur, et donc le JWT 14 jours porté par
    /// ExternalToolsUpdateJobState.RenewedToken pendant la fenêtre du job + sa rétention. Fix : le
    /// userId de la query doit correspondre au claim JWT courant (UserInfoProvider.UserId, peuplé par
    /// JwtActionFilter) — 403 si absent ou différent.
    /// <para>
    /// G1 (revue de suivi) : userId correct n'impliquait pas userKey correct — un attaquant avec SON
    /// PROPRE JWT valide (userId=A) pouvait soumettre le userKey d'un tiers B, la synchro tournant
    /// alors avec les données de B écrites sous l'identité A. Fix : le userKey de la query doit lui
    /// aussi correspondre au claim JWT courant (UserInfoProvider.UserKey) — 403 si différent.
    /// </para>
    /// </summary>
    public class ExternalToolsControllerAuthTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsControllerAuthTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private string CreateBearerFor(int userId, string userKey = "irrelevant-user-key")
        {
            using var scope = _factory.Services.CreateScope();
            var authenticationService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
            var me = new SimpleMeDto { Id = userId, UserName = "test-user-" + userId };
            return authenticationService.CreateToken(me, userKey).AccessToken;
        }

        private HttpClient CreateClient(int? bearerForUserId, string bearerUserKey = "irrelevant-user-key")
        {
            var client = _factory.CreateClient();
            if (bearerForUserId.HasValue)
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateBearerFor(bearerForUserId.Value, bearerUserKey));
            }
            return client;
        }

        private static Task<HttpResponseMessage> SendAsync(HttpClient client, string method, string route, int userId, string userKey = "test-key")
        {
            var url = $"{route}?userKey={userKey}&userId={userId}";
            if (method == "GET")
            {
                return client.GetAsync(url);
            }
            // Corps minimal MAIS avec townDetails (non-nullable, implicitement requis par la
            // validation de modèle de [ApiController]) : sans lui, le binding échoue en 400 AVANT
            // même que les filtres d'action (JwtActionFilter compris) ne s'exécutent, ce qui rendrait
            // ces tests aveugles à la garde d'authentification qu'ils vérifient.
            var content = new StringContent("{\"townDetails\":{}}", Encoding.UTF8, "application/json");
            return client.PostAsync(url, content);
        }

        [Theory]
        [InlineData("GET", "/ExternalTools/Update/Status")]
        [InlineData("POST", "/ExternalTools/Update/Start")]
        public async Task SansBearer_Renvoie403(string method, string route)
        {
            var userId = new Random().Next(1, int.MaxValue);
            var client = CreateClient(bearerForUserId: null);

            var response = await SendAsync(client, method, route, userId);

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Theory]
        [InlineData("GET", "/ExternalTools/Update/Status")]
        [InlineData("POST", "/ExternalTools/Update/Start")]
        public async Task BearerDunAutreUtilisateur_Renvoie403(string method, string route)
        {
            var random = new Random();
            var attackerId = random.Next(1, int.MaxValue);
            var victimId = random.Next(1, int.MaxValue);
            var client = CreateClient(bearerForUserId: attackerId);

            var response = await SendAsync(client, method, route, victimId);

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        /// <summary>
        /// Contre-épreuve : sans elle, un guard toujours actif (403 systématique) ferait aussi
        /// passer les deux tests ci-dessus, sans prouver que les appels légitimes continuent de
        /// fonctionner (contrat client website/addon inchangé pour un Bearer valide du bon joueur,
        /// avec SON PROPRE userKey — celui embarqué dans le JWT).
        /// </summary>
        [Fact]
        public async Task BearerDuMemeUtilisateur_NestPasRefuse()
        {
            var userId = new Random().Next(1, int.MaxValue);
            const string userKey = "same-user-key";
            var client = CreateClient(bearerForUserId: userId, bearerUserKey: userKey);

            var response = await client.GetAsync($"/ExternalTools/Update/Status?userKey={userKey}&userId={userId}");

            response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
        }

        /// <summary>
        /// G1 : un attaquant avec SON PROPRE JWT valide (userId=A, userKey=attacker-key) soumet le
        /// userId=A (passe la garde userId) mais le userKey d'un tiers B — sans la garde userKey,
        /// la synchro tournerait avec les données de B écrites sous l'identité A.
        /// </summary>
        [Theory]
        [InlineData("GET", "/ExternalTools/Update/Status")]
        [InlineData("POST", "/ExternalTools/Update/Start")]
        public async Task BearerValideDeSoiMemeMaisUserKeyDunTiers_Renvoie403(string method, string route)
        {
            var attackerId = new Random().Next(1, int.MaxValue);
            var client = CreateClient(bearerForUserId: attackerId, bearerUserKey: "attacker-key");

            var response = await SendAsync(client, method, route, attackerId, userKey: "victim-key");

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
    }
}
