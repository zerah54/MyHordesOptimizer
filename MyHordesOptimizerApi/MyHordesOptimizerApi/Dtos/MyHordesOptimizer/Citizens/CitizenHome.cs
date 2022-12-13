using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizenHome
    {
        public CitizenHomeValue Content { get; set; }
        public DateTime? LastUpdateDateUpdate { get; set; }
        public string? LastUpdateUserName { get; set; }

        public CitizenHome()
        {
            Content = new CitizenHomeValue();
        }
    }
}