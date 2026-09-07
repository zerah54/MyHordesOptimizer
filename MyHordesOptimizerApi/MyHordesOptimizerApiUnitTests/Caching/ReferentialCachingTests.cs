using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Controllers;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApiUnitTests.Caching.Fakes;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using System;

namespace MyHordesOptimizerApiUnitTests.Caching
{
    /// <summary>
    /// Chantier cache référentiels (voir .superpowers/sdd/2026-09-03-session-lifecycle) : un
    /// IMemoryCache est posé au niveau contrôleur sur les référentiels quasi-statiques. Groupe A
    /// (Fetcher/Parameters/WishList) : invalidation manuelle précise après import, pas de TTL.
    /// Groupe B (Town seasons/season-phases) : TTL seul.
    /// </summary>
    public class ReferentialCachingTests
    {
        private static FetcherController NewFetcherController(FakeFetcherServiceForCaching service, IMemoryCache cache)
            => new(NullLogger<FetcherController>.Instance, service, new FakeUserInfoProvider(), cache);

        private static ParametersController NewParametersController(FakeParametersServiceForCaching service, IMemoryCache cache)
            => new(NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance, new FakeUserInfoProvider(), service, cache);

        private static WishListController NewWishListController(FakeWishListServiceForCaching service, IMemoryCache cache)
            => new(NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance, new FakeUserInfoProvider(), service, cache);

        private static MyHordesDataImportController NewImportController(FakeImportServiceForCaching service, IMemoryCache cache)
            => new(NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance, new FakeUserInfoProvider(), service, cache);

        private static TownController NewTownController(FakeTownServiceForCaching service, IMemoryCache cache)
            => new(NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance, new FakeUserInfoProvider(), service, cache);

        // AdminService/ITownService/ImportJobRunner : null!, non utilisés par les actions d'import
        // synchrones testées ici. IConfiguration doit rester réel (vide) : le constructeur d'AdminController
        // lit Admin:UserIds dedans, un null! y ferait une NullReferenceException avant même le test.
        private static AdminController NewAdminController(FakeImportServiceForCaching service, IMemoryCache cache)
            => new(null!, new FakeUserInfoProvider(), service, null!, null!, new ConfigurationBuilder().Build(), cache);

        // Variante pour FinishSeason/UnfinishSeason : ITownService réel (fake), IMyHordesImportService
        // et le reste non utilisés par ces deux actions.
        private static AdminController NewAdminControllerForSeasons(FakeTownServiceForCaching townService, IMemoryCache cache)
            => new(null!, new FakeUserInfoProvider(), new FakeImportServiceForCaching(), townService, null!, new ConfigurationBuilder().Build(), cache);

        #region Groupe A - lecture mise en cache (le service n'est appelé qu'une fois malgré des appels répétés)

        [Fact]
        public void GetItems_SansTownId_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetItems(null);
            controller.GetItems(null);

            service.GetItemsCallCount.Should().Be(1);
        }

        [Fact]
        public void GetRuins_SansTownId_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetRuins(null);
            controller.GetRuins(null);

            service.GetRuinsCallCount.Should().Be(1);
        }

        [Fact]
        public void GetHeroSkills_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetHeroSkills();
            controller.GetHeroSkills();

            service.GetHeroSkillsCallCount.Should().Be(1);
        }

        [Fact]
        public void GetCausesOfDeath_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetCausesOfDeath();
            controller.GetCausesOfDeath();

            service.GetCausesOfDeathCallCount.Should().Be(1);
        }

        [Fact]
        public void GetCleanUpTypes_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetCleanUpTypes();
            controller.GetCleanUpTypes();

            service.GetCleanUpTypesCallCount.Should().Be(1);
        }

        [Fact]
        public void GetRecipes_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetRecipes();
            controller.GetRecipes();

            service.GetRecipesCallCount.Should().Be(1);
        }

        [Fact]
        public void GetBuildings_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetBuildings();
            controller.GetBuildings();

            service.GetBuildingsCallCount.Should().Be(1);
        }

        [Fact]
        public void GetParameters_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeParametersServiceForCaching();
            var controller = NewParametersController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetParameters();
            controller.GetParameters();

            service.GetParametersCallCount.Should().Be(1);
        }

        [Fact]
        public void GetWishListCategories_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeWishListServiceForCaching();
            var controller = NewWishListController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetWishListCategories();
            controller.GetWishListCategories();

            service.GetWishListCategoriesCallCount.Should().Be(1);
        }

        [Fact]
        public void GetWishListTemplates_NeMappelleLeServiceQuUneFois()
        {
            var service = new FakeWishListServiceForCaching();
            var controller = NewWishListController(service, new MemoryCache(new MemoryCacheOptions()));

            controller.GetWishListTemplates();
            controller.GetWishListTemplates();

            service.GetWishListTemplatesCallCount.Should().Be(1);
        }

        #endregion

        #region Piège townId : jamais mis en cache, sous peine de servir banque/wishlist/cases périmées

        [Fact]
        public void GetItems_AvecTownId_AppelleLeServiceAChaqueFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            for (var i = 0; i < 5; i++)
            {
                controller.GetItems(3410);
            }

            service.GetItemsCallCount.Should().Be(5);
        }

        [Fact]
        public void GetRuins_AvecTownId_AppelleLeServiceAChaqueFois()
        {
            var service = new FakeFetcherServiceForCaching();
            var controller = NewFetcherController(service, new MemoryCache(new MemoryCacheOptions()));

            for (var i = 0; i < 5; i++)
            {
                controller.GetRuins(3410);
            }

            service.GetRuinsCallCount.Should().Be(5);
        }

        #endregion

        #region Groupe A - invalidation après import (contrôleur d'import distinct, même IMemoryCache)

        [Fact]
        public void ImportItems_InvalideLeCacheItemsEtRecipes()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetItems(null);
            fetcherController.GetRecipes();
            fetcherService.GetItemsCallCount.Should().Be(1);
            fetcherService.GetRecipesCallCount.Should().Be(1);

            importController.ImportItemsAsync("some-user-key").GetAwaiter().GetResult();

            fetcherController.GetItems(null);
            fetcherController.GetRecipes();
            // Les recettes s'importent avec les items (même méthode de service) : les deux caches
            // doivent être invalidés par le même import.
            fetcherService.GetItemsCallCount.Should().Be(2);
            fetcherService.GetRecipesCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportItemsAsync_MemeSiLImportEchoue_InvalideLeCache()
        {
            // Invalidation posée en finally (pas seulement en cas de succès) : un import qui plante
            // après avoir déjà committé une partie des lignes ne doit pas laisser le cache périmé
            // indéfiniment (groupe A sans TTL).
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var importService = new FakeImportServiceForCaching { ShouldThrow = true };
            var importController = NewImportController(importService, cache);

            fetcherController.GetItems(null);
            fetcherService.GetItemsCallCount.Should().Be(1);

            Action act = () => importController.ImportItemsAsync("some-user-key").GetAwaiter().GetResult();
            act.Should().Throw<InvalidOperationException>();

            fetcherController.GetItems(null);
            fetcherService.GetItemsCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportRuins_InvalideLeCacheRuins()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetRuins(null);
            fetcherService.GetRuinsCallCount.Should().Be(1);

            importController.ImportRuins("some-user-key");

            fetcherController.GetRuins(null);
            fetcherService.GetRuinsCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportBuildings_InvalideLeCacheBuildings()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetBuildings();
            fetcherService.GetBuildingsCallCount.Should().Be(1);

            importController.ImportBuildingAsync("some-user-key").GetAwaiter().GetResult();

            fetcherController.GetBuildings();
            fetcherService.GetBuildingsCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportHeroSkill_InvalideLeCacheHeroSkills()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetHeroSkills();
            fetcherService.GetHeroSkillsCallCount.Should().Be(1);

            importController.ImportHeroSkill().GetAwaiter().GetResult();

            fetcherController.GetHeroSkills();
            fetcherService.GetHeroSkillsCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportCauseOfDeath_InvalideLeCacheCausesOfDeath()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetCausesOfDeath();
            fetcherService.GetCausesOfDeathCallCount.Should().Be(1);

            importController.ImportCauseOfDeath().GetAwaiter().GetResult();

            fetcherController.GetCausesOfDeath();
            fetcherService.GetCausesOfDeathCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportCleanUpType_InvalideLeCacheCleanUpTypes()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetCleanUpTypes();
            fetcherService.GetCleanUpTypesCallCount.Should().Be(1);

            importController.ImportCleanUpType();

            fetcherController.GetCleanUpTypes();
            fetcherService.GetCleanUpTypesCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportWishlistCategorie_InvalideLeCacheWishListCategories()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var wishListService = new FakeWishListServiceForCaching();
            var wishListController = NewWishListController(wishListService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            wishListController.GetWishListCategories();
            wishListService.GetWishListCategoriesCallCount.Should().Be(1);

            importController.ImportWishlistCategorie();

            wishListController.GetWishListCategories();
            wishListService.GetWishListCategoriesCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportDefaultWishlist_InvalideLeCacheWishListTemplates()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var wishListService = new FakeWishListServiceForCaching();
            var wishListController = NewWishListController(wishListService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            wishListController.GetWishListTemplates();
            wishListService.GetWishListTemplatesCallCount.Should().Be(1);

            importController.ImportDefaultWishlist();

            wishListController.GetWishListTemplates();
            wishListService.GetWishListTemplatesCallCount.Should().Be(2);
        }

        [Fact]
        public void PostParameters_InvalideLeCacheParameters()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var service = new FakeParametersServiceForCaching();
            var controller = NewParametersController(service, cache);

            controller.GetParameters();
            service.GetParametersCallCount.Should().Be(1);

            controller.PostParameters(new ParametersDto());

            controller.GetParameters();
            service.GetParametersCallCount.Should().Be(2);
        }

        [Fact]
        public void ImportAll_InvalideToutLeGroupeA()
        {
            // ImportAllAsync ré-exécute chaque import individuel au niveau service, en contournant les
            // actions dédiées : toutes les clés du groupe A doivent retomber après cet import global.
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var wishListService = new FakeWishListServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var wishListController = NewWishListController(wishListService, cache);
            var importController = NewImportController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetItems(null);
            fetcherController.GetRuins(null);
            fetcherController.GetBuildings();
            fetcherController.GetHeroSkills();
            fetcherController.GetCausesOfDeath();
            fetcherController.GetCleanUpTypes();
            fetcherController.GetRecipes();
            wishListController.GetWishListCategories();
            wishListController.GetWishListTemplates();

            importController.ImportAll("some-user-key").GetAwaiter().GetResult();

            fetcherController.GetItems(null);
            fetcherController.GetRuins(null);
            fetcherController.GetBuildings();
            fetcherController.GetHeroSkills();
            fetcherController.GetCausesOfDeath();
            fetcherController.GetCleanUpTypes();
            fetcherController.GetRecipes();
            wishListController.GetWishListCategories();
            wishListController.GetWishListTemplates();

            fetcherService.GetItemsCallCount.Should().Be(2);
            fetcherService.GetRuinsCallCount.Should().Be(2);
            fetcherService.GetBuildingsCallCount.Should().Be(2);
            fetcherService.GetHeroSkillsCallCount.Should().Be(2);
            fetcherService.GetCausesOfDeathCallCount.Should().Be(2);
            fetcherService.GetCleanUpTypesCallCount.Should().Be(2);
            fetcherService.GetRecipesCallCount.Should().Be(2);
            wishListService.GetWishListCategoriesCallCount.Should().Be(2);
            wishListService.GetWishListTemplatesCallCount.Should().Be(2);
        }

        [Fact]
        public void AdminController_ImportItems_InvalideAussiLeCacheItemsEtRecipes()
        {
            // AdminController expose une route d'import parallèle à DataImport/Items (constaté par
            // grep des appelants de IMyHordesImportService.ImportItemsAsync) : sans cette invalidation,
            // un import déclenché depuis l'admin laisserait le cache périmé indéfiniment (groupe A
            // sans TTL).
            var cache = new MemoryCache(new MemoryCacheOptions());
            var fetcherService = new FakeFetcherServiceForCaching();
            var fetcherController = NewFetcherController(fetcherService, cache);
            var adminController = NewAdminController(new FakeImportServiceForCaching(), cache);

            fetcherController.GetItems(null);
            fetcherController.GetRecipes();
            fetcherService.GetItemsCallCount.Should().Be(1);
            fetcherService.GetRecipesCallCount.Should().Be(1);

            adminController.ImportItems().GetAwaiter().GetResult();

            fetcherController.GetItems(null);
            fetcherController.GetRecipes();
            fetcherService.GetItemsCallCount.Should().Be(2);
            fetcherService.GetRecipesCallCount.Should().Be(2);
        }

        #endregion

        #region Groupe B - TTL seul (Town/seasons, Town/season-phases)

        [Fact]
        public void GetSeasons_DansLaFenetreDeTtl_NeMappelleLeServiceQuUneFois()
        {
            var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
            var cache = new MemoryCache(new MemoryCacheOptions { Clock = clock });
            var service = new FakeTownServiceForCaching();
            var controller = NewTownController(service, cache);

            controller.GetSeasons();
            clock.Advance(TimeSpan.FromHours(3));
            controller.GetSeasons();

            service.GetSeasonsCallCount.Should().Be(1);
        }

        [Fact]
        public void GetSeasons_ApresLeTtlDeQuatreHeures_RappelleLeService()
        {
            var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
            var cache = new MemoryCache(new MemoryCacheOptions { Clock = clock });
            var service = new FakeTownServiceForCaching();
            var controller = NewTownController(service, cache);

            controller.GetSeasons();
            clock.Advance(TimeSpan.FromHours(4) + TimeSpan.FromMinutes(1));
            controller.GetSeasons();

            service.GetSeasonsCallCount.Should().Be(2);
        }

        [Fact]
        public void GetSeasonPhases_ApresLeTtlDeQuatreHeures_RappelleLeService()
        {
            var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
            var cache = new MemoryCache(new MemoryCacheOptions { Clock = clock });
            var service = new FakeTownServiceForCaching();
            var controller = NewTownController(service, cache);

            controller.GetSeasonPhases();
            clock.Advance(TimeSpan.FromHours(4) + TimeSpan.FromMinutes(1));
            controller.GetSeasonPhases();

            service.GetSeasonPhasesCallCount.Should().Be(2);
        }

        [Fact]
        public void FinishSeason_InvalideLeCacheSeasonsEtSeasonPhases()
        {
            // Écart au brief original (Groupe B = TTL seul, dérivé de Towns sans point d'écriture
            // unique) : IsFinished (SeasonDto/SeasonPhaseDto) a lui un point d'écriture identifiable
            // (Admin/seasons/{season}/finish), donc invalidation précise en plus du TTL.
            var cache = new MemoryCache(new MemoryCacheOptions());
            var townService = new FakeTownServiceForCaching();
            var townController = NewTownController(townService, cache);
            var adminController = NewAdminControllerForSeasons(townService, cache);

            townController.GetSeasons();
            townController.GetSeasonPhases();
            townService.GetSeasonsCallCount.Should().Be(1);
            townService.GetSeasonPhasesCallCount.Should().Be(1);

            adminController.FinishSeason(3);

            townController.GetSeasons();
            townController.GetSeasonPhases();
            townService.GetSeasonsCallCount.Should().Be(2);
            townService.GetSeasonPhasesCallCount.Should().Be(2);
        }

        [Fact]
        public void UnfinishSeason_InvalideLeCacheSeasonsEtSeasonPhases()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var townService = new FakeTownServiceForCaching();
            var townController = NewTownController(townService, cache);
            var adminController = NewAdminControllerForSeasons(townService, cache);

            townController.GetSeasons();
            townController.GetSeasonPhases();
            townService.GetSeasonsCallCount.Should().Be(1);
            townService.GetSeasonPhasesCallCount.Should().Be(1);

            adminController.UnfinishSeason(3);

            townController.GetSeasons();
            townController.GetSeasonPhases();
            townService.GetSeasonsCallCount.Should().Be(2);
            townService.GetSeasonPhasesCallCount.Should().Be(2);
        }

        #endregion
    }
}
