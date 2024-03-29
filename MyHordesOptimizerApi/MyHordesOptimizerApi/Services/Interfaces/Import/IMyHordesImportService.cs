﻿using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.Import
{
    public interface IMyHordesImportService
    {
        Task ImportHeroSkill();
        Task ImportCauseOfDeath();
        void ImportCleanUpTypes();
        void ImportRuins();
        Task ImportCategoriesAsync();
        Task ImportItemsAsync();
        Task ImportAllAsync();
        void ImportWishlistCategorie();
        void ImportDefaultWishlists();
    }
}
