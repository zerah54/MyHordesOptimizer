using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Contrat PUT /WishList : corps { items, groups } obligatoire, l'ancien format tableau est refusé sans rien modifier.</summary>
    public class WishListPutContractHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public WishListPutContractHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static StringContent Json(string json)
        {
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        /// <summary>PUT avec le vrai contrôle d'accès, via la fabrique configurée ; renvoie le statut et si le groupe semé existe encore.</summary>
        private async Task<(HttpStatusCode status, bool groupStillThere)> PutAsync(string body)
        {
            using var factory = _factory.WithWebHostBuilder(builder =>
                builder.ConfigureTestServices(services => services.AddScoped<ITownAccessService, TownAccessService>()));
            int townId, userId;
            var uid = Guid.NewGuid().ToString();
            using (var scope = factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                (townId, userId, _, _) = AttackTestSupport.SeedTown(context, 5);
                context.TownWishListGroups.Add(new TownWishListGroup { IdTown = townId, Uid = uid, Name = "Seme" });
                context.SaveChanges();
            }
            var client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var token = scope.ServiceProvider.GetRequiredService<IAuthenticationService>()
                    .CreateToken(new SimpleMeDto { Id = userId, UserName = "test-user-" + userId }, "irrelevant-user-key")
                    .AccessToken;
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }
            var response = await client.PutAsync($"/WishList?townId={townId}", Json(body));
            using var verifyScope = factory.Services.CreateScope();
            var still = verifyScope.ServiceProvider.GetRequiredService<MhoContext>().TownWishListGroups.Any(g => g.IdTown == townId && g.Uid == uid);
            return (response.StatusCode, still);
        }

        [Fact]
        public async Task PutWishList_CorpsAuFormatTableau_Renvoie400EtNeTouchePasAuxGroupes()
        {
            var (status, groupStillThere) = await PutAsync("[]");

            status.Should().Be(HttpStatusCode.BadRequest);
            groupStillThere.Should().BeTrue();
        }

        [Fact]
        public async Task PutWishList_SansGroups_Renvoie400()
        {
            var (status, groupStillThere) = await PutAsync("{\"items\":[]}");

            status.Should().Be(HttpStatusCode.BadRequest);
            groupStillThere.Should().BeTrue();
        }
    }
}
