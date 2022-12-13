using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    public class CitizenBag
    {
        public List<CitizenItem> Items { get; set; }
        public int? IdBag { get; set; }

        public LastUpdateInfo? LastUpdateInfo { get; set; }

        public CitizenBag()
        {
            Items = new List<CitizenItem>();
        }
    }
}
