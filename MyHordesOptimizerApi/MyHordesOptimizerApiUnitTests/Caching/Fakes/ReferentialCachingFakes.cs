using Microsoft.Extensions.Internal;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Models.Import;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Caching.Fakes
{
    /// <summary>Fake de IMyHordesFetcherService : compte les appels aux méthodes lues par FetcherController, les autres ne sont pas utilisées par ces tests.</summary>
    public class FakeFetcherServiceForCaching : IMyHordesFetcherService
    {
        public int GetItemsCallCount { get; private set; }
        public int GetRuinsCallCount { get; private set; }
        public int GetHeroSkillsCallCount { get; private set; }
        public int GetCausesOfDeathCallCount { get; private set; }
        public int GetCleanUpTypesCallCount { get; private set; }
        public int GetRecipesCallCount { get; private set; }
        public int GetBuildingsCallCount { get; private set; }

        public IEnumerable<ItemDto> GetItems(int? townId)
        {
            GetItemsCallCount++;
            return new List<ItemDto>();
        }

        public IEnumerable<MyHordesOptimizerRuinDto> GetRuins(int? townId)
        {
            GetRuinsCallCount++;
            return new List<MyHordesOptimizerRuinDto>();
        }

        public IEnumerable<HeroSkillDto> GetHeroSkills()
        {
            GetHeroSkillsCallCount++;
            return new List<HeroSkillDto>();
        }

        public IEnumerable<CauseOfDeathDto> GetCausesOfDeath()
        {
            GetCausesOfDeathCallCount++;
            return new List<CauseOfDeathDto>();
        }

        public IEnumerable<CleanUpTypeDto> GetCleanUpTypes()
        {
            GetCleanUpTypesCallCount++;
            return new List<CleanUpTypeDto>();
        }

        public IEnumerable<ItemRecipeDto> GetRecipes()
        {
            GetRecipesCallCount++;
            return new List<ItemRecipeDto>();
        }

        public IEnumerable<BuildingDto> GetBuildings()
        {
            GetBuildingsCallCount++;
            return new List<BuildingDto>();
        }

        public IEnumerable<string> GetItemUidsWithCitizenStateImpact() => throw new NotSupportedException();
        public Task<SimpleMeDto> GetSimpleMeAsync() => throw new NotSupportedException();
        public SimpleMeDto BuildSimpleMeFromDbByUserKey(string userKey) => throw new NotSupportedException();
        public BankLastUpdateDto GetBank() => throw new NotSupportedException();
        public BankLastUpdateDto GetBank(int townId) => throw new NotSupportedException();
        public Task<bool> ImportUserPictosAsync(int userId) => throw new NotSupportedException();
        public CitizensLastUpdateDto GetCitizens(int townId) => throw new NotSupportedException();
        public MyHordesOptimizerMapDto GetMap(int townId) => throw new NotSupportedException();
        public IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId) => throw new NotSupportedException();
        public List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int townId, int userId, List<MyHordesOptimizerMapDigDto> requests) => throw new NotSupportedException();
        public void DeleteMapDigs(int idCell, int diggerId, int day) => throw new NotSupportedException();
        public IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId) => throw new NotSupportedException();
    }

    /// <summary>Fake de IMyHordesOptimizerParametersService : compte les lectures et les écritures.</summary>
    public class FakeParametersServiceForCaching : IMyHordesOptimizerParametersService
    {
        public int GetParametersCallCount { get; private set; }
        public int UpdateParameterCallCount { get; private set; }

        public IEnumerable<ParametersDto> GetParameters()
        {
            GetParametersCallCount++;
            return new List<ParametersDto>();
        }

        public void UpdateParameter(ParametersDto parameter) => UpdateParameterCallCount++;
    }

    /// <summary>Fake de IWishListService : compte les lectures des référentiels Categories/Templates.</summary>
    public class FakeWishListServiceForCaching : IWishListService
    {
        public int GetWishListCategoriesCallCount { get; private set; }
        public int GetWishListTemplatesCallCount { get; private set; }

        public List<WishlistCategorieDto> GetWishListCategories()
        {
            GetWishListCategoriesCallCount++;
            return new List<WishlistCategorieDto>();
        }

        public List<WishlistTemplateDto> GetWishListTemplates()
        {
            GetWishListTemplatesCallCount++;
            return new List<WishlistTemplateDto>();
        }

        public WishListLastUpdateDto GetWishList(int townId) => throw new NotSupportedException();
        public WishListLastUpdateDto PutWishList(int townId, int userId, List<WishListPutResquestDto> wishList) => throw new NotSupportedException();
        public WishListLastUpdateDto CreateFromTemplate(int townId, int userId, int templateId) => throw new NotSupportedException();
        public void AddItemToWishList(int townId, int userId, int itemId, int zoneXPa) => throw new NotSupportedException();
    }

    /// <summary>
    /// Fake de IMyHordesImportService : les imports ne font rien, seule l'invalidation de cache
    /// déclenchée par le contrôleur appelant importe pour ces tests. <see cref="ShouldThrow"/> simule
    /// un import qui échoue, pour prouver que l'invalidation (finally) a bien lieu quand même.
    /// </summary>
    public class FakeImportServiceForCaching : IMyHordesImportService
    {
        public bool ShouldThrow { get; set; }

        private void ThrowIfConfigured()
        {
            if (ShouldThrow)
            {
                throw new InvalidOperationException("Échec d'import simulé pour le test.");
            }
        }

        public Task ImportJobsAsync() => Task.CompletedTask;
        public Task ImportHeroSkill() { ThrowIfConfigured(); return Task.CompletedTask; }
        public Task ImportCauseOfDeath() { ThrowIfConfigured(); return Task.CompletedTask; }
        public void ImportCleanUpTypes() => ThrowIfConfigured();
        public Task ImportBuildingAsync() { ThrowIfConfigured(); return Task.CompletedTask; }
        public void ImportRuins() => ThrowIfConfigured();
        public void ImportPictos() { }
        public Task ImportCategoriesAsync() => Task.CompletedTask;
        public Task ImportItemsAsync() { ThrowIfConfigured(); return Task.CompletedTask; }
        public Task ImportAllAsync(Action<ImportStepProgress> onStep = null) { ThrowIfConfigured(); return Task.CompletedTask; }
        public void ImportWishlistCategorie() => ThrowIfConfigured();
        public void ImportDefaultWishlists() => ThrowIfConfigured();
        public Task ImportTownsAsync(int? season = null, bool resume = false, Action<ImportStepProgress> onStep = null) => Task.CompletedTask;
        public Task ImportSingleTownAsync(int townId) => Task.CompletedTask;
        public Task RefreshUserNamesAsync(int? limit = null) => Task.CompletedTask;
        public Task RecomputeUserDirectoryStatsAsync() => Task.CompletedTask;
        public Task<ReferentialBackfillReport> BackfillReferentialIdsAsync() => throw new NotSupportedException();
    }

    /// <summary>
    /// Fake de ITownService : compte les lectures de seasons/season-phases (groupe B, TTL + invalidation
    /// précise sur IsFinished) et les écritures Finish/UnfinishSeason. <see cref="ShouldThrow"/> simule
    /// un échec d'écriture pour prouver que l'invalidation (finally) a bien lieu quand même.
    /// </summary>
    public class FakeTownServiceForCaching : ITownService
    {
        public int GetSeasonsCallCount { get; private set; }
        public int GetSeasonPhasesCallCount { get; private set; }
        public int FinishSeasonCallCount { get; private set; }
        public int UnfinishSeasonCallCount { get; private set; }
        public bool ShouldThrow { get; set; }

        public List<SeasonDto> GetSeasons()
        {
            GetSeasonsCallCount++;
            return new List<SeasonDto>();
        }

        public List<SeasonPhaseDto> GetSeasonPhases()
        {
            GetSeasonPhasesCallCount++;
            return new List<SeasonPhaseDto>();
        }

        public void FinishSeason(int season)
        {
            FinishSeasonCallCount++;
            if (ShouldThrow)
            {
                throw new InvalidOperationException("Échec de FinishSeason simulé pour le test.");
            }
        }

        public void UnfinishSeason(int season)
        {
            UnfinishSeasonCallCount++;
            if (ShouldThrow)
            {
                throw new InvalidOperationException("Échec de UnfinishSeason simulé pour le test.");
            }
        }

        public LastUpdateInfoDto AddCitizenDailyAction(int townId, int userId, string actionKey, int day) => throw new NotSupportedException();
        public CitizenDto DeleteCitizenDailyAction(int townId, int userId, string actionKey, int day) => throw new NotSupportedException();
        public CitizenDto GetTownCitizen(int townId, int userId) => throw new NotSupportedException();
        public TownListPageResultDto GetTowns(TownListQueryDto query) => throw new NotSupportedException();
        public void DeleteTown(int townId) => throw new NotSupportedException();
        public LastUpdateInfoDto UpdateCitizenChamanicDetail(int townId, int userId, CitizenChamanicDetailDto chamanicDetailDto) => throw new NotSupportedException();
    }

    /// <summary>
    /// Horloge manuelle : seul moyen de tester une expiration de MemoryCache sans attendre réellement.
    /// MemoryCacheOptions.Clock attend ISystemClock (pas System.TimeProvider) sur ce SDK.
    /// </summary>
    public class FakeTimeProvider : ISystemClock
    {
        private DateTimeOffset _utcNow;

        public FakeTimeProvider(DateTimeOffset start) => _utcNow = start;

        public DateTimeOffset UtcNow => _utcNow;

        public void Advance(TimeSpan delta) => _utcNow += delta;
    }
}
