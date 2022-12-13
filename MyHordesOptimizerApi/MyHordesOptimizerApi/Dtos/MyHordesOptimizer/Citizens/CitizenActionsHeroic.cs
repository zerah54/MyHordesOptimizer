using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizenActionsHeroic
    {
        public CitizenActionsHeroicValue Content { get; set; }
        public DateTime? LastUpdateDateUpdate { get; set; }
        public string? LastUpdateUserName { get; set; }
        public CitizenActionsHeroic()
        {
            Content = new CitizenActionsHeroicValue();
        }
    }
}