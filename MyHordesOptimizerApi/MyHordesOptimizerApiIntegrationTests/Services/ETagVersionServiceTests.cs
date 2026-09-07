using System;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;
using FluentAssertions;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// Famille 1 du mécanisme ETag (voir .superpowers/sdd/2026-09-03-session-lifecycle) : ces tests
    /// portent sur ETagVersionService directement, avec une vraie BDD (DbContext réel, pas de mock) —
    /// même convention que les autres tests de service de ce projet. Le mécanisme générique
    /// (court-circuit 304, en-têtes) est couvert séparément par ETagCacheFilterTests (unitaire) et
    /// ETagCacheHttpTests (bout en bout HTTP).
    /// </summary>
    public class ETagVersionServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ETagVersionServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (IETagVersionService versionService, MhoContext context, int mapId, int userId, string suffix) NewFixture()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var versionService = scope.ServiceProvider.GetRequiredService<IETagVersionService>();

            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var mapId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = mapId, Name = "test-town-" + suffix, MapId = mapId });
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();

            return (versionService, context, mapId, userId, suffix);
        }

        private static int AddLastUpdateInfo(MhoContext context)
        {
            var lastUpdate = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdate);
            context.SaveChanges();
            return lastUpdate.IdLastUpdateInfo;
        }

        // Item.IdItem est ValueGeneratedNever (référentiel importé par fixtures, pas d'identité auto) :
        // un id doit être fourni explicitement, jamais laissé à 0 sous peine de collision de clé primaire.
        private static int AddItem(MhoContext context, string suffix)
        {
            var item = new Item { IdItem = new Random().Next(1, int.MaxValue), Uid = "test-item-" + suffix + "-" + Guid.NewGuid().ToString("N").Substring(0, 6) };
            context.Items.Add(item);
            context.SaveChanges();
            return item.IdItem;
        }

        #region Bank (Fetcher/Bank) — count:max(IdLastUpdateInfo) sur TownBankItem

        [Fact]
        public void Bank_VilleJamaisSynchronisee_RenvoieNull()
        {
            var (versionService, _, mapId, userId, _) = NewFixture();

            versionService.GetVersion(ETagResource.Bank, mapId, userId).Should().BeNull();
        }

        [Fact]
        public void Bank_AjoutDUnDeuxiemeStack_ChangeLaVersion()
        {
            var (versionService, context, mapId, userId, suffix) = NewFixture();
            var idItem1 = AddItem(context, suffix);
            var idLastUpdate1 = AddLastUpdateInfo(context);
            context.TownBankItems.Add(new TownBankItem { IdTown = mapId, IdItem = idItem1, IdLastUpdateInfo = idLastUpdate1, IsBroken = false, Count = 1 });
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.Bank, mapId, userId);

            var idItem2 = AddItem(context, suffix);
            context.TownBankItems.Add(new TownBankItem { IdTown = mapId, IdItem = idItem2, IdLastUpdateInfo = idLastUpdate1, IsBroken = false, Count = 1 });
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.Bank, mapId, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        [Fact]
        public void Bank_VilleMigreeVersUnAutreIdTown_ResoutQuandMemeViaLeMapId()
        {
            // ResolveTownId : le client envoie toujours le mapId, jamais l'IdTown interne — simule ici
            // une ville déjà migrée (IdTown != MapId), cas réel pour toute ville importée avant ce fix.
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var versionService = scope.ServiceProvider.GetRequiredService<IETagVersionService>();
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var mapId = random.Next(1, int.MaxValue);
            var internalTownId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = internalTownId, Name = "migrated-town-" + suffix, MapId = mapId });
            context.SaveChanges();
            var idItem = AddItem(context, suffix);
            var idLastUpdate = AddLastUpdateInfo(context);
            context.TownBankItems.Add(new TownBankItem { IdTown = internalTownId, IdItem = idItem, IdLastUpdateInfo = idLastUpdate, IsBroken = false, Count = 1 });
            context.SaveChanges();

            var version = versionService.GetVersion(ETagResource.Bank, mapId, currentUserId: 1);

            version.Should().NotBeNull();
        }

        #endregion

        #region MapDigs (Fetcher/MapDigs) — agrégation explicitement demandée : un seul dig qui change ou disparaît doit changer la version

        [Fact]
        public void MapDigs_UnSeulDigMisAJour_ChangeLaVersion()
        {
            var (versionService, context, mapId, userId, suffix) = NewFixture();
            var digger = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "digger-" + suffix };
            context.Users.Add(digger);
            context.SaveChanges();
            var cell = new MapCell { IdTown = mapId, X = 1, Y = 1 };
            context.MapCells.Add(cell);
            context.SaveChanges();
            var idLastUpdate1 = AddLastUpdateInfo(context);
            context.MapCellDigs.Add(new MapCellDig { IdCell = cell.IdCell, IdUser = digger.IdUser, Day = 1, IdLastUpdateInfo = idLastUpdate1 });
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.MapDigs, mapId, userId);

            var idLastUpdate2 = AddLastUpdateInfo(context);
            var dig = context.MapCellDigs.Single(d => d.IdCell == cell.IdCell && d.IdUser == digger.IdUser && d.Day == 1);
            dig.IdLastUpdateInfo = idLastUpdate2;
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.MapDigs, mapId, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        [Fact]
        public void MapDigs_SuppressionDUnDig_ChangeLaVersionMemeSansToucherLesAutres()
        {
            // MapCellDigs est purgé en masse à chaque sync (mhoTask) : Max seul est aveugle à une
            // suppression, d'où le "count:max" plutôt que "max" seul.
            var (versionService, context, mapId, userId, suffix) = NewFixture();
            var digger1 = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "digger1-" + suffix };
            var digger2 = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "digger2-" + suffix };
            context.Users.AddRange(digger1, digger2);
            context.SaveChanges();
            var cell = new MapCell { IdTown = mapId, X = 2, Y = 2 };
            context.MapCells.Add(cell);
            context.SaveChanges();
            var idLastUpdate = AddLastUpdateInfo(context);
            var dig1 = new MapCellDig { IdCell = cell.IdCell, IdUser = digger1.IdUser, Day = 1, IdLastUpdateInfo = idLastUpdate };
            var dig2 = new MapCellDig { IdCell = cell.IdCell, IdUser = digger2.IdUser, Day = 1, IdLastUpdateInfo = idLastUpdate };
            context.MapCellDigs.AddRange(dig1, dig2);
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.MapDigs, mapId, userId);

            context.MapCellDigs.Remove(dig2);
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.MapDigs, mapId, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        [Fact]
        public void MapDigs_AucunDig_RenvoieNull()
        {
            var (versionService, context, mapId, userId, _) = NewFixture();
            context.MapCells.Add(new MapCell { IdTown = mapId, X = 3, Y = 3 });
            context.SaveChanges();

            versionService.GetVersion(ETagResource.MapDigs, mapId, userId).Should().BeNull();
        }

        #endregion

        #region Map (Fetcher/Map) — agrège aussi l'horodatage d'estimation Éclaireur, distinct de la donnée confirmée

        [Fact]
        public void Map_MiseAJourDeLaSeuleEstimationEclaireur_ChangeLaVersion()
        {
            var (versionService, context, mapId, userId, _) = NewFixture();
            var cell = new MapCell { IdTown = mapId, X = 4, Y = 4 };
            context.MapCells.Add(cell);
            context.SaveChanges();
            cell.IdLastUpdateInfo = AddLastUpdateInfo(context);
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.Map, mapId, userId);

            cell.IdScoutEstimationLastUpdateInfo = AddLastUpdateInfo(context);
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.Map, mapId, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        [Fact]
        public void Map_AucuneCellule_RenvoieNull()
        {
            var (versionService, _, mapId, userId, _) = NewFixture();

            versionService.GetVersion(ETagResource.Map, mapId, userId).Should().BeNull();
        }

        #endregion

        #region WishList (WishList/) — une seule colonne (Town.WishlistDateUpdate)

        [Fact]
        public void WishList_DateNonInitialisee_RenvoieNull()
        {
            var (versionService, _, mapId, userId, _) = NewFixture();

            versionService.GetVersion(ETagResource.WishList, mapId, userId).Should().BeNull();
        }

        [Fact]
        public void WishList_MiseAJourDeLaDate_ChangeLaVersion()
        {
            var (versionService, context, mapId, userId, _) = NewFixture();
            var town = context.Towns.Single(t => t.IdTown == mapId);
            town.WishlistDateUpdate = DateTime.UtcNow;
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.WishList, mapId, userId);

            town.WishlistDateUpdate = DateTime.UtcNow.AddMinutes(1);
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.WishList, mapId, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        #endregion

        #region Citizens (Fetcher/Citizens) — count:max(IdLastUpdateInfo) sur TownCitizen

        [Fact]
        public void Citizens_ArriveeDUnDeuxiemeCitoyen_ChangeLaVersion()
        {
            var (versionService, context, mapId, userId, suffix) = NewFixture();
            var citizen1 = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "c1-" + suffix };
            context.Users.Add(citizen1);
            context.SaveChanges();
            var idLastUpdate1 = AddLastUpdateInfo(context);
            context.TownCitizens.Add(new TownCitizen { IdTown = mapId, IdUser = citizen1.IdUser, IdLastUpdateInfo = idLastUpdate1 });
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.Citizens, mapId, userId);

            var citizen2 = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "c2-" + suffix };
            context.Users.Add(citizen2);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = mapId, IdUser = citizen2.IdUser, IdLastUpdateInfo = idLastUpdate1 });
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.Citizens, mapId, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        #endregion

        #region Note/* — les 5 routes GET, count:max(UpdatedAt)

        [Fact]
        public void NoteMyTown_AucuneNote_RenvoieNull()
        {
            var (versionService, _, _, userId, _) = NewFixture();

            versionService.GetVersion(ETagResource.NoteMyTown, null, userId).Should().BeNull();
        }

        [Fact]
        public void NoteMyTown_UneNote_ChangeQuandElleEstMiseAJour()
        {
            var (versionService, context, mapId, userId, _) = NewFixture();
            var note = new TownNote { IdUserAuthor = userId, IdTown = mapId, Note = "v1", UpdatedAt = DateTime.UtcNow };
            context.TownNotes.Add(note);
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.NoteMyTown, null, userId);

            note.UpdatedAt = DateTime.UtcNow.AddMinutes(1);
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.NoteMyTown, null, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        [Fact]
        public void NoteMyUser_NoteGlobale_EstIndependanteDesNotesDeVille()
        {
            var (versionService, context, mapId, userId, suffix) = NewFixture();
            var target = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "target-" + suffix };
            context.Users.Add(target);
            context.SaveChanges();
            context.UserNotes.Add(new UserNote { IdUserAuthor = userId, IdUserTarget = target.IdUser, IdTown = 0, Note = "global", UpdatedAt = DateTime.UtcNow });
            context.SaveChanges();

            versionService.GetVersion(ETagResource.NoteMyUser, null, userId).Should().NotBeNull();
            // Note de ville (IdTown != 0) sur le même couple : ne doit pas se mélanger avec la globale.
            versionService.GetVersion(ETagResource.NoteMyCitizen, mapId, userId).Should().BeNull();
        }

        [Fact]
        public void NoteUser_AbsenceDeNote_RenvoieNull()
        {
            var (versionService, context, _, userId, suffix) = NewFixture();
            var target = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "target-" + suffix };
            context.Users.Add(target);
            context.SaveChanges();

            versionService.GetVersion(ETagResource.NoteUser, target.IdUser, userId).Should().BeNull();
        }

        [Fact]
        public void NoteUser_NotePresente_ChangeQuandElleEstMiseAJour()
        {
            var (versionService, context, _, userId, suffix) = NewFixture();
            var target = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "target-" + suffix };
            context.Users.Add(target);
            context.SaveChanges();
            var note = new UserNote { IdUserAuthor = userId, IdUserTarget = target.IdUser, IdTown = 0, Note = "v1", UpdatedAt = DateTime.UtcNow };
            context.UserNotes.Add(note);
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.NoteUser, target.IdUser, userId);

            note.UpdatedAt = DateTime.UtcNow.AddMinutes(1);
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.NoteUser, target.IdUser, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        [Fact]
        public void NoteMyCitizenForUser_NoteDeVille_ChangeQuandElleEstMiseAJour()
        {
            var (versionService, context, mapId, userId, suffix) = NewFixture();
            var target = new User { IdUser = new Random().Next(1, int.MaxValue), Name = "target-" + suffix };
            context.Users.Add(target);
            context.SaveChanges();
            var note = new UserNote { IdUserAuthor = userId, IdUserTarget = target.IdUser, IdTown = mapId, Note = "v1", UpdatedAt = DateTime.UtcNow };
            context.UserNotes.Add(note);
            context.SaveChanges();
            var v1 = versionService.GetVersion(ETagResource.NoteMyCitizenForUser, target.IdUser, userId);

            note.UpdatedAt = DateTime.UtcNow.AddMinutes(1);
            context.SaveChanges();
            var v2 = versionService.GetVersion(ETagResource.NoteMyCitizenForUser, target.IdUser, userId);

            v1.Should().NotBeNull();
            v2.Should().NotBe(v1);
        }

        #endregion
    }
}
