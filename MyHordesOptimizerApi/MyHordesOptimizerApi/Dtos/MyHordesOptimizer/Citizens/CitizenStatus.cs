using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizenStatus
    {
        public CitizenStatusValue Content { get; set; }
        public DateTime? LastUpdateDateUpdate { get; set; }
        public string? LastUpdateUserName { get; set; }
        public List<string> Icons { get; set; }
        public CitizenStatus()
        {
            Content = new CitizenStatusValue();
        }
    }
}