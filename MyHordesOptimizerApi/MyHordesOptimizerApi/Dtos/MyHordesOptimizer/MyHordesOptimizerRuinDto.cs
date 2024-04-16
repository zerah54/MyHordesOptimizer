using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class MyHordesOptimizerRuinDto
    {
        #region JsonApiValues

        public int Id { get; set; }

        public IDictionary<string, string> Label { get; set; }

        public IDictionary<string, string> Description { get; set; }

        public bool Explorable { get; set; }

        public string Img { get; set; }

        #endregion

        #region CodeValues

        public int? Camping { get; set; }

        public int? MinDist { get; set; }

        public int? MaxDist { get; set; }

        public int? Chance { get; set; }
        
        public int? Capacity { get; set; }

        public List<ItemResultDto> Drops { get; set; }

        #endregion

        public MyHordesOptimizerRuinDto()
        {
            Drops = new List<ItemResultDto>();
        }
    }
}
