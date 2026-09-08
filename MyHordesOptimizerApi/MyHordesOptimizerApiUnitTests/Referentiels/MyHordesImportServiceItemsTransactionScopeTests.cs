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
    /// Preuve que <c>ImportItemsAsync</c> exécute tous ses appels réseau/traduction AVANT
    /// d'ouvrir la transaction BDD, et non plus pendant (les verrous MySQL sur les tables
    /// référentielles ne doivent plus être retenus le temps de ces allers-retours).
    /// </summary>
    /// <remarks>
    /// La connexion BDD est volontairement injoignable (port 1, personne n'écoute). Sous
    /// l'ancien ordonnancement, <c>BeginTransaction()</c> était la toute première instruction :
    /// l'exception de connexion aurait alors surgi avant que les espions de
    /// <c>GetItemsProperties</c>/<c>GetItemsActions</c>/<c>GetRecipes</c>/<c>GetTranslations</c>
    /// — déplacés APRÈS le rapprochement en base dans l'ancien code — n'aient été appelés.
    /// Les données source sont vides : la préparation en mémoire ne dépend pas du contenu réel,
    /// seulement de l'ordre d'exécution.
    /// </remarks>
    public class MyHordesImportServiceItemsTransactionScopeTests
    {
        private sealed class SpyApiRepository : IMyHordesApiRepository
        {
            public bool GetItemsCalled { get; private set; }

            public Dictionary<string, MyHordesItem> GetItems()
            {
                GetItemsCalled = true;
                return new Dictionary<string, MyHordesItem>();
            }

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

        private sealed class SpyCodeRepository : IMyHordesCodeRepository
        {
            public bool GetItemsDropRatesCalled { get; private set; }
            public bool GetItemsPropertiesCalled { get; private set; }
            public bool GetItemsActionsCalled { get; private set; }
            public bool GetRecipesCalled { get; private set; }

            public Dictionary<string, Dictionary<string, dynamic[]>> GetItemsDropRates()
            {
                GetItemsDropRatesCalled = true;
                // "empty_dig"/"base_dig" doivent exister : ImportItemsAsync les lit sans garde.
                return new Dictionary<string, Dictionary<string, dynamic[]>>
                {
                    ["empty_dig"] = new(),
                    ["base_dig"] = new()
                };
            }

            public Dictionary<string, List<string>> GetItemsProperties()
            {
                GetItemsPropertiesCalled = true;
                return new Dictionary<string, List<string>>();
            }

            public Dictionary<string, List<string>> GetItemsActions()
            {
                GetItemsActionsCalled = true;
                return new Dictionary<string, List<string>>();
            }

            public Dictionary<string, MyHordesRecipeCodeModel> GetRecipes()
            {
                GetRecipesCalled = true;
                return new Dictionary<string, MyHordesRecipeCodeModel>();
            }

            // Reste de l'interface : jamais exercé par ImportItemsAsync.
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

        private sealed class SpyTranslationService : ITranslationService
        {
            public bool GetTranslationsCalled { get; private set; }

            public Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslations()
            {
                GetTranslationsCalled = true;
                return Task.FromResult(new Dictionary<string, List<YmlTranslationFileModel>>());
            }

            public Task<TranslationResultDto> GetTranslationAsync(string locale, string sourceString) => throw new NotSupportedException();
            public Task ResetTranslation() => throw new NotSupportedException();
        }

        /// <summary>Port 1 : personne n'écoute, échec de connexion quasi immédiat plutôt qu'un timeout.</summary>
        private sealed class UnreachableSqlConfiguration : IMyHordesOptimizerSqlConfiguration
        {
            public string ConnectionString =>
                "Server=127.0.0.1;Port=1;Database=mho_test_unreachable;Uid=root;Pwd=root;Connection Timeout=1;";
        }

        [Fact]
        public async Task ImportItemsAsync_PrepareToutAvantOuvertureTransaction()
        {
            var apiRepository = new SpyApiRepository();
            var codeRepository = new SpyCodeRepository();
            var translationService = new SpyTranslationService();

            var mapperConfiguration = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<ItemsMappingProfiles>();
                cfg.AddProfile<CodeModelMappingProfiles>();
            }, NullLoggerFactory.Instance);
            var mapper = mapperConfiguration.CreateMapper();

            using var dbContext = new MhoContext(
                new DbContextOptionsBuilder<MhoContext>().Options,
                new UnreachableSqlConfiguration(),
                NullLoggerFactory.Instance);

            var service = new MyHordesImportService(
                serviceScopeFactory: null!,
                webApiRepository: null!,
                translationsConfiguration: null!,
                myHordesJsonApiRepository: apiRepository,
                myHordesCodeRepository: codeRepository,
                translationService: translationService,
                mapper: mapper,
                logger: NullLogger<MyHordesImportService>.Instance,
                dbContext: dbContext,
                townSyncLock: new TownSyncLock(),
                referentialImportLock: new ReferentialImportLock());

            Func<Task> act = () => service.ImportItemsAsync();
            await act.Should().ThrowAsync<Exception>();

            apiRepository.GetItemsCalled.Should().BeTrue();
            codeRepository.GetItemsDropRatesCalled.Should().BeTrue();
            codeRepository.GetItemsPropertiesCalled.Should().BeTrue();
            codeRepository.GetItemsActionsCalled.Should().BeTrue();
            codeRepository.GetRecipesCalled.Should().BeTrue();
            translationService.GetTranslationsCalled.Should().BeTrue();
        }
    }
}
