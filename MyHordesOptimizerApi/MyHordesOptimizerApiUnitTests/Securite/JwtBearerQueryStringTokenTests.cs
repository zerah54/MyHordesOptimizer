using System.Collections.Generic;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>
    /// Côté navigateur, WebSockets et SSE ne peuvent pas porter d'en-tête Authorization : le client
    /// SignalR passe le jeton en query string (access_token). Il n'est accepté que sur les hubs.
    /// </summary>
    public class JwtBearerQueryStringTokenTests
    {
        private const string AccessToken = "jeton-de-test";

        private static JwtBearerOptions ResolveJwtBearerOptions()
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Authentication:Jwt:Secret"] = "test-jwt-secret-unit-tests-32-chars-minimum",
                    ["Authentication:Jwt:Issuer"] = "mho-unit-tests",
                    ["Authentication:Jwt:Audience"] = "mho-unit-tests-audience",
                })
                .Build();
            var services = new ServiceCollection();
            services.AddBearerAuthentication(configuration);
            return services.BuildServiceProvider()
                .GetRequiredService<IOptionsMonitor<JwtBearerOptions>>()
                .Get(JwtBearerDefaults.AuthenticationScheme);
        }

        private static MessageReceivedContext NewMessageReceivedContext(JwtBearerOptions options, string path)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = path;
            httpContext.Request.QueryString = QueryString.Create("access_token", AccessToken);
            var scheme = new AuthenticationScheme(JwtBearerDefaults.AuthenticationScheme, null, typeof(JwtBearerHandler));
            return new MessageReceivedContext(httpContext, scheme, options);
        }

        [Theory]
        [InlineData("/hub/expeditions")]
        [InlineData("/hub/expeditions/negotiate")]
        public async Task OnMessageReceived_CheminDeHub_LitLeJetonDeLaQueryString(string path)
        {
            var options = ResolveJwtBearerOptions();
            var context = NewMessageReceivedContext(options, path);

            await options.Events.OnMessageReceived(context);

            context.Token.Should().Be(AccessToken);
        }

        [Fact]
        public async Task OnMessageReceived_HorsHub_IgnoreLeJetonDeLaQueryString()
        {
            var options = ResolveJwtBearerOptions();
            var context = NewMessageReceivedContext(options, "/Town");

            await options.Events.OnMessageReceived(context);

            context.Token.Should().BeNull();
        }
    }
}
