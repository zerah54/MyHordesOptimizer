using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Data.Building;
using MyHordesOptimizerApi.Data.Buildings;
using MyHordesOptimizerApi.Data.Camping;
using MyHordesOptimizerApi.Data.CauseOfDeath;
using MyHordesOptimizerApi.Data.Citizens;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Jobs;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Data.Wishlist;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.MappingProfiles;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.Models.Translation;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Import;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces.Translations;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// ImportItemsAsync vide et réimporte des tables référentielles GLOBALES (ItemProperty,
    /// BuildingRessources, RecipeItemComponent, ItemAction, RecipeItemResult, RuinItemDrop) sans
    /// clause WHERE, et n'était protégé par aucun verrou : deux exécutions concurrentes pouvaient
    /// verrouiller ces tables dans un ordre différent côté MySQL (risque de deadlock), en plus de se
    /// marcher dessus sur les DELETE FROM. Preuve que ReferentialImportLock sérialise désormais ces
    /// écritures.
    /// </summary>
    public class MyHordesImportServiceReferentialLockTests
    {
        private sealed class EmptyApiRepository : IMyHordesApiRepository
        {
            public Dictionary<string, MyHordesItem> GetItems() => new();
            public MyHordesUserDetailsDto GetMe() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotSupportedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => throw new NotSupportedException();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => throw new NotSupportedException();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => throw new NotSupportedException();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => throw new NotSupportedException();
            public List<int> GetTownList(int? season = null) => throw new NotSupportedException();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => throw new NotSupportedException();
            public MyHordesMap GetMapDetails(int mapId) => throw new NotSupportedException();
        }

        private sealed class EmptyCodeRepository : IMyHordesCodeRepository
        {
            public Dictionary<string, Dictionary<string, dynamic[]>> GetItemsDropRates() =>
                new()
                {
                    // ImportItemsAsync les lit sans garde.
                    ["empty_dig"] = new(),
                    ["base_dig"] = new()
                };
            public Dictionary<string, List<string>> GetItemsProperties() => new();
            public Dictionary<string, List<string>> GetItemsActions() => new();
            public Dictionary<string, MyHordesRecipeCodeModel> GetRecipes() => new();

            public Dictionary<string, MyHordesRuinCodeModel> GetRuins() => throw new NotSupportedException();
            public List<MyHordesCategoryCodeModel> GetCategories() => throw new NotSupportedException();
            public Dictionary<string, string> GetItemsCatapult() => throw new NotSupportedException();
            public Dictionary<string, MyHordesActionsCodeModel> GetActions() => throw new NotSupportedException();
            public List<MyHordesHerosCapacitiesCodeModel> GetHeroCapacities() => throw new NotSupportedException();
            public List<MyHordesCauseOfDeathModel> GetCausesOfDeath() => throw new NotSupportedException();
            public List<MyHordesCleanUpTypeModel> GetCleanUpTypes() => throw new NotSupportedException();
            public List<MyHordesOptimizerWishlistItemCategorie> GetWishlistItemCategories() => throw new NotSupportedException();
            public List<MyHordesOptimizerDefaultWishlist> GetDefaultWishlists() => throw new NotSupportedException();
            public MyHordesCampingBonusModel GetCampingBonus() => throw new NotSupportedException();
            public List<MyHordesCampingResultModel> GetCampingResults() => throw new NotSupportedException();
            public Dictionary<string, BuildingCodeModel> GetBuildings() => throw new NotSupportedException();
            public Dictionary<string, BuildingHardResourcesCodeModel> GetBuildingHardResources() => throw new NotSupportedException();
            public Dictionary<string, Dictionary<string, string>> GetBuildingAvailability() => throw new NotSupportedException();
            public Dictionary<string, JobCodeModel> GetJobs() => throw new NotSupportedException();
            public Dictionary<string, MyHordesCitizenStatusCodeModel> GetCitizenStatuses() => throw new NotSupportedException();
            public Dictionary<string, MyHordesMetaResultCodeModel> GetMetaResults() => throw new NotSupportedException();
        }

        private sealed class EmptyTranslationService : ITranslationService
        {
            public Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslations() =>
                Task.FromResult(new Dictionary<string, List<YmlTranslationFileModel>>());
            public Task<TranslationResultDto> GetTranslationAsync(string locale, string sourceString) => throw new NotSupportedException();
            public Task ResetTranslation() => throw new NotSupportedException();
        }

        /// <summary>Port 1 : personne n'écoute, échec de connexion quasi immédiat plutôt qu'un timeout.</summary>
        private sealed class UnreachableSqlConfiguration : IMyHordesOptimizerSqlConfiguration
        {
            public string ConnectionString =>
                "Server=127.0.0.1;Port=1;Database=mho_test_unreachable;Uid=root;Pwd=root;Connection Timeout=1;";
        }

        private static MyHordesImportService NewService(ReferentialImportLock referentialImportLock)
        {
            var mapperConfiguration = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<ItemsMappingProfiles>();
                cfg.AddProfile<CodeModelMappingProfiles>();
            }, NullLoggerFactory.Instance);

            var dbContext = new MhoContext(
                new DbContextOptionsBuilder<MhoContext>().Options,
                new UnreachableSqlConfiguration(),
                NullLoggerFactory.Instance);

            return new MyHordesImportService(
                serviceScopeFactory: null!,
                webApiRepository: null!,
                translationsConfiguration: null!,
                myHordesJsonApiRepository: new EmptyApiRepository(),
                myHordesCodeRepository: new EmptyCodeRepository(),
                translationService: new EmptyTranslationService(),
                mapper: mapperConfiguration.CreateMapper(),
                logger: NullLogger<MyHordesImportService>.Instance,
                dbContext: dbContext,
                townSyncLock: new TownSyncLock(),
                referentialImportLock: referentialImportLock);
        }

        [Fact]
        public async Task ImportItemsAsync_VerrouReferentielDejaTenu_AttendLaLiberationAvantDeContinuer()
        {
            var referentialImportLock = new ReferentialImportLock();
            await referentialImportLock.WaitAsync();

            var importTask = NewService(referentialImportLock).ImportItemsAsync();

            // Course contre un délai généreux plutôt qu'un délai fixe suivi d'une assertion instantanée :
            // seule une vraie absence d'exclusion mutuelle peut faire gagner importTask avant 2 secondes
            // (la connexion inatteignable échoue en ~1s une fois le verrou obtenu).
            var winner = await Task.WhenAny(importTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(importTask,
                "ImportItemsAsync ne doit pas pouvoir ouvrir sa transaction tant que ReferentialImportLock est tenu ailleurs");

            referentialImportLock.Release();

            Func<Task> act = () => importTask;
            await act.Should().ThrowAsync<Exception>("la connexion BDD est volontairement inatteignable, une fois le verrou obtenu");
        }

        [Fact]
        public async Task ImportBuildingAsync_VerrouReferentielDejaTenu_AttendLaLiberationAvantDeContinuer()
        {
            var referentialImportLock = new ReferentialImportLock();
            await referentialImportLock.WaitAsync();

            var buildingTask = NewService(referentialImportLock).ImportBuildingAsync();

            // Même course que pour ImportItemsAsync : EmptyApiRepository.GetBuildingAsync (premier
            // appel du corps de la méthode, avant tout accès BDD) lève NotSupportedException. Si
            // buildingTask gagnait avant 2s, ReferentialImportLock ne serait plus tenu en tête de
            // méthode.
            var winner = await Task.WhenAny(buildingTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(buildingTask,
                "ImportBuildingAsync ne doit pas pouvoir progresser tant que ReferentialImportLock est tenu ailleurs");

            referentialImportLock.Release();

            Func<Task> act = () => buildingTask;
            await act.Should().ThrowAsync<NotSupportedException>("EmptyApiRepository.GetBuildingAsync n'est atteint qu'une fois le verrou obtenu");
        }

        [Fact]
        public async Task ImportRuins_VerrouReferentielDejaTenu_AttendLaLiberationAvantDeContinuer()
        {
            var referentialImportLock = new ReferentialImportLock();
            await referentialImportLock.WaitAsync();

            // ImportRuins est synchrone : Task.Run pour pouvoir le soumettre à Task.WhenAny sans
            // bloquer le thread du test pendant l'attente du verrou.
            var ruinsTask = Task.Run(() => NewService(referentialImportLock).ImportRuins());

            // EmptyApiRepository.GetRuins (premier appel du corps de la méthode, avant tout accès
            // BDD) lève NotSupportedException. Si ruinsTask gagnait avant 2s, ReferentialImportLock
            // ne serait plus tenu en tête de méthode.
            var winner = await Task.WhenAny(ruinsTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(ruinsTask,
                "ImportRuins ne doit pas pouvoir progresser tant que ReferentialImportLock est tenu ailleurs");

            referentialImportLock.Release();

            Func<Task> act = () => ruinsTask;
            await act.Should().ThrowAsync<NotSupportedException>("EmptyApiRepository.GetRuins n'est atteint qu'une fois le verrou obtenu");
        }

        [Fact]
        public async Task ImportWishlistCategorie_VerrouReferentielDejaTenu_AttendLaLiberationAvantDeContinuer()
        {
            var referentialImportLock = new ReferentialImportLock();
            await referentialImportLock.WaitAsync();

            // ImportWishlistCategorie est synchrone : Task.Run pour pouvoir le soumettre à
            // Task.WhenAny sans bloquer le thread du test pendant l'attente du verrou.
            var wishlistTask = Task.Run(() => NewService(referentialImportLock).ImportWishlistCategorie());

            // EmptyCodeRepository.GetWishlistItemCategories (premier appel du corps de la méthode,
            // avant tout accès BDD) lève NotSupportedException. Si wishlistTask gagnait avant 2s,
            // ReferentialImportLock ne serait plus tenu en tête de méthode.
            var winner = await Task.WhenAny(wishlistTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(wishlistTask,
                "ImportWishlistCategorie ne doit pas pouvoir progresser tant que ReferentialImportLock est tenu ailleurs");

            referentialImportLock.Release();

            Func<Task> act = () => wishlistTask;
            await act.Should().ThrowAsync<NotSupportedException>("EmptyCodeRepository.GetWishlistItemCategories n'est atteint qu'une fois le verrou obtenu");
        }
    }
}
