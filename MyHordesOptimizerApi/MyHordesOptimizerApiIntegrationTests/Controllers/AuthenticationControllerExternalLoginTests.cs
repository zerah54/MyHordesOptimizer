using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// PostExternalLogin redirigeait vers une URL de prod codée en dur, donc identique pour l'instance
    /// dev et l'instance prod de l'API (voir Authentication:FrontendUrl en config). Le test fige
    /// l'attendu : la redirection doit utiliser la valeur configurée, pas une constante.
    /// </summary>
    public class AuthenticationControllerExternalLoginTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AuthenticationControllerExternalLoginTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task PostExternalLogin_Redirige_VersFrontendUrlConfigure()
        {
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
            var body = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("key", "some-token") });

            var response = await client.PostAsync("/Authentication/ExternalLogin", body);

            response.StatusCode.Should().Be(HttpStatusCode.Redirect);
            // Authentication:FrontendUrl dans appsettings.json de ce projet de test : valeur distincte
            // de la vraie URL de prod pour prouver que c'est la config qui est lue, pas une constante.
            response.Headers.Location!.ToString().Should().Be("https://test-frontend.example/login?token=some-token");
        }
    }
}
