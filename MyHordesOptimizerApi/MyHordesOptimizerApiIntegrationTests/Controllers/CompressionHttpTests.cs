using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
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
    /// Compression de réponse HTTP (voir .superpowers/sdd/2026-09-03-session-lifecycle), vérifiée
    /// bout en bout sur Fetcher/Bank : vraie requête HTTP, vraie BDD, aucun mock du pipeline. La
    /// ville/banque est seedée une seule fois pour toute la classe (les 3 tests ne font que lire) :
    /// GetBank charge le catalogue complet des objets à chaque appel, pas la peine de le gonfler
    /// à chaque test. Client en https://localhost : EnableForHttps=true ne fait de différence que
    /// si la requête est vue comme HTTPS par le pipeline.
    /// </summary>
    public class CompressionHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int SeededItemCount = 50;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        private static readonly object SeedLock = new();
        private static int? _sharedMapId;

        public CompressionHttpTests(MyHordesOptimizerApplicationFactory factory)
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

        /// <summary>Ville + banque garnie de <see cref="SeededItemCount"/> objets, seedée une seule fois et réutilisée en lecture par les 3 tests.</summary>
        private int GetOrSeedSharedBank()
        {
            lock (SeedLock)
            {
                if (_sharedMapId.HasValue)
                {
                    return _sharedMapId.Value;
                }

                using var scope = _factory.Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
                var random = new Random();
                var mapId = random.Next(1, int.MaxValue);
                context.Towns.Add(new Town { IdTown = mapId, Name = "test-town-" + suffix, MapId = mapId });
                var lastUpdate = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
                context.LastUpdateInfos.Add(lastUpdate);
                var items = new List<Item>();
                for (var i = 0; i < SeededItemCount; i++)
                {
                    var item = new Item { IdItem = random.Next(1, int.MaxValue), Uid = $"item-{suffix}-{i}" };
                    items.Add(item);
                    context.Items.Add(item);
                }
                context.SaveChanges();
                foreach (var item in items)
                {
                    context.TownBankItems.Add(new TownBankItem { IdTown = mapId, IdItem = item.IdItem, IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo, IsBroken = false, Count = 1 });
                }
                context.SaveChanges();

                _sharedMapId = mapId;
                return mapId;
            }
        }

        /// <summary>
        /// Base https://localhost : l'API n'est jamais servie qu'en HTTPS en prod, et
        /// EnableForHttps=true (ResponseCompressionOptions) ne change le comportement que si le
        /// pipeline voit la requête comme HTTPS. TestServer n'ouvre aucune connexion TLS réelle, il
        /// dérive juste HttpContext.Request.IsHttps du schéma de l'URI demandée.
        /// </summary>
        private HttpClient CreateAuthenticatedClient(int bearerUserId)
        {
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateBearerFor(bearerUserId));
            return client;
        }

        private static byte[] Decompress(byte[] compressed, string contentEncoding)
        {
            using var input = new MemoryStream(compressed);
            using Stream decompressor = contentEncoding switch
            {
                "br" => new BrotliStream(input, CompressionMode.Decompress),
                "gzip" => new GZipStream(input, CompressionMode.Decompress),
                _ => throw new ArgumentOutOfRangeException(nameof(contentEncoding), contentEncoding, "encodage non géré par ce test")
            };
            using var output = new MemoryStream();
            decompressor.CopyTo(output);
            return output.ToArray();
        }

        [Fact]
        public async Task AcceptEncodingGzipBr_ReponseCompresseeEtDecompressibleCorrectement()
        {
            var mapId = GetOrSeedSharedBank();
            var client = CreateAuthenticatedClient(bearerUserId: 900101);

            var request = new HttpRequestMessage(HttpMethod.Get, $"/Fetcher/Bank?townId={mapId}");
            request.Headers.TryAddWithoutValidation("Accept-Encoding", "gzip, br");
            var response = await client.SendAsync(request);

            response.EnsureSuccessStatusCode();
            var contentEncoding = response.Content.Headers.ContentEncoding;
            contentEncoding.Should().NotBeEmpty("la réponse doit porter Content-Encoding quand le client l'accepte, y compris en HTTPS (EnableForHttps=true)");
            var encoding = contentEncoding.Should().ContainSingle().Which;
            encoding.Should().BeOneOf("br", "gzip");

            var compressedBytes = await response.Content.ReadAsByteArrayAsync();
            var decompressedBytes = Decompress(compressedBytes, encoding);

            // Le corps compressé doit être significativement plus petit que le corps décompressé :
            // sinon on prouverait seulement la présence du header, pas une vraie compression.
            compressedBytes.Length.Should().BeLessThan(decompressedBytes.Length);

            var dto = JsonSerializer.Deserialize<BankLastUpdateDto>(decompressedBytes, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            dto!.Bank.Should().HaveCount(SeededItemCount);
        }

        [Fact]
        public async Task SansAcceptEncoding_ReponseNonCompresseeAucuneRegression()
        {
            var mapId = GetOrSeedSharedBank();
            var client = CreateAuthenticatedClient(bearerUserId: 900102);

            // Aucun Accept-Encoding ajouté : HttpClient n'en envoie pas par défaut ici.
            var response = await client.GetAsync($"/Fetcher/Bank?townId={mapId}");

            response.EnsureSuccessStatusCode();
            response.Content.Headers.ContentEncoding.Should().BeEmpty();

            var body = await response.Content.ReadAsStringAsync();
            var dto = JsonSerializer.Deserialize<BankLastUpdateDto>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            dto!.Bank.Should().HaveCount(SeededItemCount);
        }

        [Fact]
        public async Task AcceptEncodingIdentity_ReponseNonCompressee()
        {
            var mapId = GetOrSeedSharedBank();
            var client = CreateAuthenticatedClient(bearerUserId: 900103);

            var request = new HttpRequestMessage(HttpMethod.Get, $"/Fetcher/Bank?townId={mapId}");
            request.Headers.TryAddWithoutValidation("Accept-Encoding", "identity");
            var response = await client.SendAsync(request);

            response.EnsureSuccessStatusCode();
            response.Content.Headers.ContentEncoding.Should().BeEmpty();
        }
    }
}
