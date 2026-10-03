using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Scénario J16 planté (seed 777001, valeur 3750, plage attendue 3736-3757).</summary>
    public class RefinementFlowTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() } };
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public RefinementFlowTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (int townId, int alive, int dead) SeedJ16()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, alive, dead, _) = AttackTestSupport.SeedTown(context, 16);
            context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 16, IsPlanif = false, _33min = 3400, _33max = 4259, _50min = 3483, _50max = 4229 });
            context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 16, IsPlanif = true });
            context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 15, IsPlanif = false });
            context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 15, IsPlanif = true, _0min = 3260, _0max = 4360 });
            context.SaveChanges();
            return (townId, alive, dead);
        }

        private static string Seeds(params uint[] seeds) => Convert.ToBase64String(seeds.SelectMany(BitConverter.GetBytes).ToArray());

        private async Task<RefinementInput> GetInput(HttpClient client, int townId) =>
            JsonSerializer.Deserialize<RefinementInput>(await client.GetStringAsync($"/AttaqueEstimation/Refinement/16/input?townId={townId}"), JsonOptions)!;

        private async Task<HttpResponseMessage> Upload(HttpClient client, int townId, RefinementInput input, string candidates) =>
            await client.PostAsync($"/AttaqueEstimation/Refinement/16?townId={townId}",
                new StringContent(JsonSerializer.Serialize(new RefinementUploadDto { Input = input, Candidates = candidates }, JsonOptions), Encoding.UTF8, "application/json"));

        private async Task<RefinementViewDto> GetView(HttpClient client, int townId) =>
            JsonSerializer.Deserialize<RefinementViewDto>(await client.GetStringAsync($"/AttaqueEstimation/Refinement/16?townId={townId}"), JsonOptions)!;

        private static Task<HttpResponseMessage> PostEstimations(HttpClient client, int townId, string body) =>
            client.PostAsync($"/AttaqueEstimation/Estimations?townId={townId}", new StringContent(body, Encoding.UTF8, "application/json"));

        [Fact]
        public async Task Envoi_PuisLecture_PlageContenantLaVraieValeur_SansSeed()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);

            (await GetView(client, townId)).Status.Should().Be(RefinementStatus.None);
            var input = await GetInput(client, townId);
            var upload = await Upload(client, townId, input, Seeds(777001, 777002));
            upload.StatusCode.Should().Be(HttpStatusCode.OK);
            (await upload.Content.ReadAsStringAsync()).Should().NotContainAny("candidates", "seed", "triples");

            var observer = _factory.CreateClient();
            var view = await GetView(observer, townId);
            view.Status.Should().Be(RefinementStatus.Valid);
            view.AttackMin.Should().BeLessOrEqualTo(3750);
            view.AttackMax.Should().BeGreaterOrEqualTo(3750);
            view.LastUpdateInfo!.UserId.Should().Be(alive);
        }

        [Fact]
        public async Task PalierAjoute_Refiltre_PalierCorrige_Invalide()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            await Upload(client, townId, await GetInput(client, townId), Seeds(777001));

            (await PostEstimations(client, townId, "{\"day\":16,\"estim\":{\"_67\":{\"min\":3556,\"max\":4202}},\"planif\":{}}")).StatusCode.Should().Be(HttpStatusCode.OK);
            var refiltered = await GetView(client, townId);
            refiltered.Status.Should().Be(RefinementStatus.Valid);
            refiltered.AttackMin.Should().BeLessOrEqualTo(3750);
            refiltered.AttackMax.Should().BeGreaterOrEqualTo(3750);

            await PostEstimations(client, townId, "{\"day\":16,\"estim\":{\"_33\":{\"min\":3401,\"max\":4259}},\"planif\":{}}");
            (await GetView(client, townId)).Status.Should().Be(RefinementStatus.Invalid);
        }

        [Fact]
        public async Task EnregistrementSansChangementDEntrees_NeRefiltrePas()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            await Upload(client, townId, await GetInput(client, townId), Seeds(777001));
            var before = await GetView(client, townId);

            // Enregistrement de l'addon sans nouvelle valeur : marque l'affinage périmé, entrées identiques.
            (await PostEstimations(client, townId, "{\"day\":16,\"estim\":{},\"planif\":{}}")).StatusCode.Should().Be(HttpStatusCode.OK);
            // Témoin : un refiltrage sur ces candidats vidés ne trouverait plus aucune configuration.
            using (var scope = _factory.Services.CreateScope())
            {
                scope.ServiceProvider.GetRequiredService<MhoContext>().TownAttackRefinements
                    .Where(r => r.IdTown == townId && r.Day == 16)
                    .ExecuteUpdate(s => s.SetProperty(r => r.Candidates, System.Array.Empty<byte>()));
            }

            var after = await GetView(client, townId);
            after.Status.Should().Be(RefinementStatus.Valid);
            after.NoCompatibleConfiguration.Should().BeFalse();
            after.AttackMin.Should().Be(before.AttackMin);
            after.AttackMax.Should().Be(before.AttackMax);
        }

        private void SetTownDay(int townId, int day)
        {
            using var scope = _factory.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<MhoContext>().Towns.Where(t => t.IdTown == townId).ExecuteUpdate(s => s.SetProperty(t => t.Day, day));
        }

        private void EmptyCandidates(int townId, int day)
        {
            using var scope = _factory.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<MhoContext>().TownAttackRefinements
                .Where(r => r.IdTown == townId && r.Day == day)
                .ExecuteUpdate(s => s.SetProperty(r => r.Candidates, System.Array.Empty<byte>()));
        }

        [Fact]
        public async Task SeedsPurges_PalierCorrigeInvalide_PuisCorrectionAnnulee_RedevientValide()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            await Upload(client, townId, await GetInput(client, townId), Seeds(777001));
            var before = await GetView(client, townId);
            SetTownDay(townId, 17);
            await GetView(client, townId);

            await PostEstimations(client, townId, "{\"day\":16,\"estim\":{\"_33\":{\"min\":3401,\"max\":4259}},\"planif\":{}}");
            (await GetView(client, townId)).Status.Should().Be(RefinementStatus.Invalid);

            await PostEstimations(client, townId, "{\"day\":16,\"estim\":{\"_33\":{\"min\":3400,\"max\":4259}},\"planif\":{}}");
            var restored = await GetView(client, townId);
            restored.Status.Should().Be(RefinementStatus.Valid);
            restored.AttackMin.Should().Be(before.AttackMin);
            restored.AttackMax.Should().Be(before.AttackMax);
        }

        [Fact]
        public async Task JourPasseEncorePerime_EstRefiltreAvantLaPurge()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            await Upload(client, townId, await GetInput(client, townId), Seeds(777001));
            await PostEstimations(client, townId, "{\"day\":16,\"estim\":{\"_67\":{\"min\":3556,\"max\":4202}},\"planif\":{}}");
            // Témoin : un refiltrage sur ces candidats vidés ne trouve plus aucune configuration.
            EmptyCandidates(townId, 16);
            SetTownDay(townId, 17);

            // La lecture d'un autre jour déclenche la purge du J16 encore périmé.
            await client.GetStringAsync($"/AttaqueEstimation/Refinement/17?townId={townId}");

            (await GetView(client, townId)).NoCompatibleConfiguration.Should().BeTrue();
        }

        [Fact]
        public async Task Envoi_PurgeLesSeedsDePlusDeTroisJours_DeToutesLesVilles()
        {
            var (otherTownId, _, _) = SeedJ16();
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.TownAttackRefinements.Add(new TownAttackRefinement
                {
                    IdTown = otherTownId, Day = 30, Input = "{}", Candidates = new byte[6], CandidateCount = 1, Status = "Valid",
                    ComputedAt = DateTime.UtcNow.AddDays(-4)
                });
                context.SaveChanges();
            }
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);

            (await Upload(client, townId, await GetInput(client, townId), Seeds(777001))).StatusCode.Should().Be(HttpStatusCode.OK);

            using (var check = _factory.Services.CreateScope())
            {
                check.ServiceProvider.GetRequiredService<MhoContext>().TownAttackRefinements.AsNoTracking()
                    .Single(r => r.IdTown == otherTownId && r.Day == 30).Candidates.Should().BeNull();
            }
        }

        [Fact]
        public async Task PalierCorrigePendantLeRejeu_409()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            var input = await GetInput(client, townId);

            var townSyncLock = _factory.Services.GetRequiredService<MyHordesOptimizerApi.Services.Impl.Locking.TownSyncLock>();
            var externalLock = await townSyncLock.AcquireTownAsync(-townId);
            var upload = Upload(client, townId, input, Seeds(777001));
            // Le rejeu d'un seed est immédiat : l'envoi attend désormais le verrou pour enregistrer.
            await Task.Delay(TimeSpan.FromSeconds(1.5));
            using (var scope = _factory.Services.CreateScope())
            {
                scope.ServiceProvider.GetRequiredService<MhoContext>().TownEstimations
                    .Where(e => e.IdTown == townId && e.Day == 16 && !e.IsPlanif)
                    .ExecuteUpdate(s => s.SetProperty(e => e._33min, 3401));
            }
            await externalLock.DisposeAsync();

            (await upload).StatusCode.Should().Be(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task EnvoisSimultanes_AuDelaDeDeuxEnCoursEtQuatreEnAttente_429()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            var input = await GetInput(client, townId);
            // Rejeu complet (~1 s chacun) : les envois se recouvrent et saturent la file.
            var candidates = Seeds(Enumerable.Range(0, RefinementEngine.MaxCandidates).Select(i => (uint)(700000 + i)).ToArray());

            var responses = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => Upload(client, townId, input, candidates)));

            responses.Select(response => response.StatusCode).Should().Contain(HttpStatusCode.TooManyRequests)
                .And.OnlyContain(status => status == HttpStatusCode.OK || status == HttpStatusCode.TooManyRequests);
        }

        /// <summary>Second citoyen vivant de la ville, pour distinguer l'auteur du scan de celui d'une saisie.</summary>
        private HttpClient SecondAliveCitizen(int townId)
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var userId = new Random().Next(1, int.MaxValue);
            context.Users.Add(new User { IdUser = userId, Name = "test-second-" + userId });
            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = userId, JobUid = "job_none", IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo, Dead = false });
            context.SaveChanges();
            return AttackTestSupport.CreateClientFor(_factory, userId);
        }

        [Fact]
        public async Task SaisieQuiResserreLaPlage_DevientAuteurDeLAffinage()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            // 719450 et 752634 passent les 2 paliers TDG mais pas le 67 % : 3736-4026 puis 3736-3757.
            await Upload(client, townId, await GetInput(client, townId), Seeds(719450, 752634, 777001));
            var before = await GetView(client, townId);
            var second = SecondAliveCitizen(townId);

            (await PostEstimations(second, townId, "{\"day\":16,\"estim\":{\"_67\":{\"min\":3556,\"max\":4202}},\"planif\":{}}")).StatusCode.Should().Be(HttpStatusCode.OK);

            var after = await GetView(client, townId);
            (after.AttackMax - after.AttackMin).Should().BeLessThan((before.AttackMax - before.AttackMin)!.Value, "le palier ajouté doit resserrer la plage");
            after.LastUpdateInfo!.UserId.Should().NotBe(alive);
            after.LastUpdateInfo.UpdateTime.Should().BeOnOrAfter(before.LastUpdateInfo!.UpdateTime);
        }

        [Fact]
        public async Task SaisieSansEffetSurLaPlage_GardeLAuteurDuScan()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            await Upload(client, townId, await GetInput(client, townId), Seeds(777001));

            await PostEstimations(SecondAliveCitizen(townId), townId, "{\"day\":16,\"estim\":{},\"planif\":{}}");

            (await GetView(client, townId)).LastUpdateInfo!.UserId.Should().Be(alive);
        }

        [Fact]
        public async Task SaisieCorrigeePendantLeScan_409()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            var input = await GetInput(client, townId);
            await PostEstimations(client, townId, "{\"day\":16,\"estim\":{\"_33\":{\"min\":3401,\"max\":4259}},\"planif\":{}}");

            (await Upload(client, townId, input, Seeds(777001))).StatusCode.Should().Be(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task CandidatsMalformes_400_EtMort_403_EtJourSansEstimation_400()
        {
            var (townId, alive, dead) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            var input = await GetInput(client, townId);

            (await Upload(client, townId, input, "pas du base64 !")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await Upload(client, townId, input, Convert.ToBase64String(new byte[(RefinementEngine.MaxCandidates + 1) * 4]))).StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await Upload(AttackTestSupport.CreateClientFor(_factory, dead), townId, input, Seeds(777001))).StatusCode.Should().Be(HttpStatusCode.Forbidden);
            (await client.GetAsync($"/AttaqueEstimation/Refinement/1/input?townId={townId}")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task LectureNonPerimee_RepondPendantUneSynchroDeLaVille()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            await Upload(client, townId, await GetInput(client, townId), Seeds(777001));

            var townSyncLock = _factory.Services.GetRequiredService<MyHordesOptimizerApi.Services.Impl.Locking.TownSyncLock>();
            await using var externalLock = await townSyncLock.AcquireTownAsync(-townId);
            var read = client.GetStringAsync($"/AttaqueEstimation/Refinement/16?townId={townId}");
            var winner = await Task.WhenAny(read, Task.Delay(TimeSpan.FromSeconds(5)));
            winner.Should().BeSameAs(read, "une lecture sans recalcul ne doit pas attendre le verrou de synchro de la ville");
        }

        [Fact]
        public async Task JourPasse_SeedsPurges_AmesALAttaqueReconverties()
        {
            var (townId, alive, _) = SeedJ16();
            var client = AttackTestSupport.CreateClientFor(_factory, alive);
            await Upload(client, townId, await GetInput(client, townId), Seeds(777001));
            var before = await GetView(client, townId);

            using (var scope = _factory.Services.CreateScope())
            {
                scope.ServiceProvider.GetRequiredService<MhoContext>().Towns.Where(t => t.IdTown == townId).ExecuteUpdate(s => s.SetProperty(t => t.Day, 17));
            }
            await GetView(client, townId);
            using (var scope = _factory.Services.CreateScope())
            {
                scope.ServiceProvider.GetRequiredService<MhoContext>().TownAttackRefinements.AsNoTracking()
                    .Single(r => r.IdTown == townId && r.Day == 16).Candidates.Should().BeNull();
            }

            await client.PutAsync($"/AttaqueEstimation/AttackSettings/16?townId={townId}", new StringContent("{\"souls\":1,\"spaLevel\":0,\"fireworks\":false}", Encoding.UTF8, "application/json"));
            var after = await GetView(client, townId);
            after.Status.Should().Be(RefinementStatus.Valid);
            after.AttackMin.Should().Be((int)Math.Floor(before.AttackMin!.Value * 1.04 + 0.5));
        }
    }
}
