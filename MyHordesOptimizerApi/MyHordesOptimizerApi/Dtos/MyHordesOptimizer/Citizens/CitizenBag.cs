using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    public class CitizenBag
    {
        public List<CitizenItem> Items { get; set; }
        public int? IdBag { get; set; }
        public DateTime? LastUpdateDateUpdate { get; set; }
        public string? LastUpdateUserName { get; set; }

        public CitizenBag()
        {
            Items = new List<CitizenItem>();
        }
    }
}
