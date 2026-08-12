using System;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class NoteServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public NoteServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (INoteService service, MhoContext context, int authorId, int targetId, int mapId) NewFixture()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<INoteService>();

            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var map_id = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = map_id, Name = "test-town-" + suffix, MapId = map_id });

            var author = new User { IdUser = random.Next(1, int.MaxValue), Name = "author-" + suffix };
            var target = new User { IdUser = random.Next(1, int.MaxValue), Name = "target-" + suffix };
            context.Users.AddRange(author, target);
            context.SaveChanges();

            // Note de ville/citoyen : réservée aux citoyens ayant participé à la ville (EnsureParticipated).
            AddCitizen(context, map_id, author.IdUser);
            AddCitizen(context, map_id, target.IdUser);

            return (service, context, author.IdUser, target.IdUser, map_id);
        }

        /// <summary>TownCitizen.IdLastUpdateInfo est NOT NULL (contrainte TownCitizen_ibfk_3) : requiert une ligne existante.</summary>
        private static void AddCitizen(MhoContext context, int townId, int userId)
        {
            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = userId, IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo });
            context.SaveChanges();
        }

        [Fact]
        public void UpsertTownNote_PremiereEcriture_CreeUneLigne()
        {
            var (service, context, authorId, _, mapId) = NewFixture();

            service.UpsertTownNote(authorId, mapId, "<p>note</p>");

            context.TownNotes.Count(n => n.IdUserAuthor == authorId && n.IdTown == mapId && n.Note == "<p>note</p>").Should().Be(1);
        }

        [Fact]
        public void UpsertTownNote_DeuxiemeEcriture_MetAJourLaMemeLigne()
        {
            var (service, context, authorId, _, mapId) = NewFixture();

            service.UpsertTownNote(authorId, mapId, "<p>v1</p>");
            service.UpsertTownNote(authorId, mapId, "<p>v2</p>");

            context.TownNotes.Count(n => n.IdUserAuthor == authorId && n.IdTown == mapId).Should().Be(1);
            context.TownNotes.Single(n => n.IdUserAuthor == authorId && n.IdTown == mapId).Note.Should().Be("<p>v2</p>");
        }

        [Fact]
        public void UpsertTownNote_NoteVide_SupprimeLaLigne()
        {
            var (service, context, authorId, _, mapId) = NewFixture();
            service.UpsertTownNote(authorId, mapId, "<p>v1</p>");

            service.UpsertTownNote(authorId, mapId, "   ");

            context.TownNotes.Count(n => n.IdUserAuthor == authorId && n.IdTown == mapId).Should().Be(0);
        }

        [Fact]
        public void GetMyTownNotes_RenvoieUniquementLesNotesDeLAuteur()
        {
            var (service, context, authorId, targetId, mapId) = NewFixture();
            service.UpsertTownNote(authorId, mapId, "<p>mine</p>");
            service.UpsertTownNote(targetId, mapId, "<p>not mine</p>");

            var notes = service.GetMyTownNotes(authorId);

            notes.Should().ContainKey(mapId);
            notes[mapId].Note.Should().Be("<p>mine</p>");
        }

        [Fact]
        public void GetMyTownNotes_ClefEstLeMapIdPasLIdTownInterne()
        {
            // IdTown != MapId délibérément : NewFixture les égale, ce qui masquerait un bug de clé
            // (voir ResolveTownId — le client envoie toujours le mapId, jamais l'IdTown interne).
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<INoteService>();
            var random = new Random();
            var idTown = random.Next(1, int.MaxValue / 2);
            var mapId = idTown + 1_000_000;
            context.Towns.Add(new Town { IdTown = idTown, Name = "test-town", MapId = mapId });
            var author = new User { IdUser = random.Next(1, int.MaxValue), Name = "author" };
            context.Users.Add(author);
            context.SaveChanges();
            AddCitizen(context, idTown, author.IdUser);

            service.UpsertTownNote(author.IdUser, mapId, "<p>note</p>");

            var notes = service.GetMyTownNotes(author.IdUser);

            notes.Should().ContainKey(mapId);
            notes.Should().NotContainKey(idTown);
        }

        [Fact]
        public void UserNote_GlobaleEtCitoyenneSontIndependantes()
        {
            var (service, context, authorId, targetId, mapId) = NewFixture();

            service.UpsertUserNote(authorId, targetId, "<p>globale</p>");
            service.UpsertCitizenNote(authorId, targetId, mapId, "<p>dans la ville</p>");

            service.GetUserNote(authorId, targetId).Note.Should().Be("<p>globale</p>");
            service.GetMyCitizenNotes(authorId, mapId)[targetId].Note.Should().Be("<p>dans la ville</p>");
        }

        [Fact]
        public void GetMyUserNotes_RenvoieUniquementLesNotesGlobalesDeLAuteur()
        {
            var (service, context, authorId, targetId, mapId) = NewFixture();
            var otherAuthor = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "other-author" };
            context.Users.Add(otherAuthor);
            context.SaveChanges();

            service.UpsertUserNote(authorId, targetId, "<p>globale</p>");
            service.UpsertCitizenNote(authorId, targetId, mapId, "<p>dans la ville</p>");
            service.UpsertUserNote(otherAuthor.IdUser, targetId, "<p>pas la mienne</p>");

            var notes = service.GetMyUserNotes(authorId);

            notes.Should().ContainKey(targetId);
            notes[targetId].Note.Should().Be("<p>globale</p>");
            notes.Should().HaveCount(1);
        }

        [Fact]
        public void GetMyCitizenNotes_RenvoieUniquementCetteVille()
        {
            var (service, context, authorId, targetId, mapId) = NewFixture();
            var otherMapId = mapId + 1;
            context.Towns.Add(new Town { IdTown = otherMapId, Name = "other-town", MapId = otherMapId });
            context.SaveChanges();
            AddCitizen(context, otherMapId, authorId);

            service.UpsertCitizenNote(authorId, targetId, mapId, "<p>ici</p>");
            service.UpsertCitizenNote(authorId, targetId, otherMapId, "<p>ailleurs</p>");

            var notes = service.GetMyCitizenNotes(authorId, mapId);

            notes.Should().ContainKey(targetId);
            notes[targetId].Note.Should().Be("<p>ici</p>");
        }

        [Fact]
        public void GetMyCitizenNotesForUser_RenvoieLesNotesSurCeCitoyenIndexeesParMapId()
        {
            var (service, context, authorId, targetId, mapId) = NewFixture();
            var otherMapId = mapId + 1;
            context.Towns.Add(new Town { IdTown = otherMapId, Name = "other-town", MapId = otherMapId });
            context.SaveChanges();
            AddCitizen(context, otherMapId, authorId);

            service.UpsertCitizenNote(authorId, targetId, mapId, "<p>ici</p>");
            service.UpsertCitizenNote(authorId, targetId, otherMapId, "<p>ailleurs</p>");

            var notes = service.GetMyCitizenNotesForUser(authorId, targetId);

            notes.Should().HaveCount(2);
            notes[mapId].Note.Should().Be("<p>ici</p>");
            notes[otherMapId].Note.Should().Be("<p>ailleurs</p>");
        }

        [Fact]
        public void GetMyCitizenNotesForUser_ClefEstLeMapIdPasLIdTownInterne()
        {
            // IdTown != MapId délibérément, comme GetMyTownNotes_ClefEstLeMapIdPasLIdTownInterne :
            // NewFixture les égale, ce qui masquerait un bug de clé.
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<INoteService>();
            var random = new Random();
            var idTown = random.Next(1, int.MaxValue / 2);
            var mapId = idTown + 1_000_000;
            context.Towns.Add(new Town { IdTown = idTown, Name = "test-town", MapId = mapId });
            var author = new User { IdUser = random.Next(1, int.MaxValue), Name = "author" };
            var target = new User { IdUser = random.Next(1, int.MaxValue), Name = "target" };
            context.Users.AddRange(author, target);
            context.SaveChanges();
            AddCitizen(context, idTown, author.IdUser);

            service.UpsertCitizenNote(author.IdUser, target.IdUser, mapId, "<p>note</p>");

            var notes = service.GetMyCitizenNotesForUser(author.IdUser, target.IdUser);

            notes.Should().ContainKey(mapId);
            notes.Should().NotContainKey(idTown);
        }

        [Fact]
        public void GetMyCitizenNotesForUser_IgnoreLaNoteGlobaleEtLesAutresCitoyens()
        {
            var (service, context, authorId, targetId, mapId) = NewFixture();
            var otherTarget = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "other-target" };
            context.Users.Add(otherTarget);
            context.SaveChanges();

            service.UpsertUserNote(authorId, targetId, "<p>globale</p>");
            service.UpsertCitizenNote(authorId, targetId, mapId, "<p>dans la ville</p>");
            service.UpsertCitizenNote(authorId, otherTarget.IdUser, mapId, "<p>pas lui</p>");

            var notes = service.GetMyCitizenNotesForUser(authorId, targetId);

            notes.Should().HaveCount(1);
            notes[mapId].Note.Should().Be("<p>dans la ville</p>");
        }

        [Fact]
        public void UpsertTownNote_AuteurNAPasParticipeALaVille_LeveUneException()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<INoteService>();
            var random = new Random();
            var mapId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = mapId, Name = "test-town", MapId = mapId });
            var author = new User { IdUser = random.Next(1, int.MaxValue), Name = "author" };
            context.Users.Add(author);
            context.SaveChanges();

            System.Action act = () => service.UpsertTownNote(author.IdUser, mapId, "<p>note</p>");

            act.Should().Throw<MhoTechnicalException>();
            context.TownNotes.Count(n => n.IdUserAuthor == author.IdUser && n.IdTown == mapId).Should().Be(0);
        }

        [Fact]
        public void UpsertCitizenNote_AuteurNAPasParticipeALaVille_LeveUneException()
        {
            var (service, context, authorId, targetId, mapId) = NewFixture();
            var otherMapId = mapId + 1;
            context.Towns.Add(new Town { IdTown = otherMapId, Name = "other-town", MapId = otherMapId });
            context.SaveChanges();
            // authorId n'a de TownCitizen (posé par NewFixture) que dans mapId, pas dans otherMapId.

            System.Action act = () => service.UpsertCitizenNote(authorId, targetId, otherMapId, "<p>note</p>");

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void UpsertCitizenNote_NoteSurSoiMeme_LeveUneException()
        {
            var (service, _, authorId, _, mapId) = NewFixture();

            System.Action act = () => service.UpsertCitizenNote(authorId, authorId, mapId, "<p>note</p>");

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void UpsertUserNote_NoteSurSoiMeme_LeveUneException()
        {
            var (service, _, authorId, _, _) = NewFixture();

            System.Action act = () => service.UpsertUserNote(authorId, authorId, "<p>note</p>");

            act.Should().Throw<MhoTechnicalException>();
        }
    }
}
