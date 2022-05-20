using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class MyHordesOptimizerRuin
    {
        #region JsonApiValues

        public int Id { get; set; }

        public IDictionary<string, string> Label { get; set; }

        public IDictionary<string, string> Description { get; set; }

        public bool Explorable { get; set; }

        public string Img { get; set; }

        #endregion

        #region CodeValues

        public int Camping { get; set; }

        public int MinDist { get; set; }

        public int MaxDist { get; set; }

        public int Chance { get; set; }

        public List<ItemResult> Drops { get; set; }

        #endregion

        public MyHordesOptimizerRuin()
        {
            Drops = new List<ItemResult>();
        }

        internal void HydrateMyHordesCodeValues(MyHordesOptimizerRuin miror)
        {
            Camping = miror.Camping;
            MinDist = miror.MinDist;
            MaxDist = miror.MaxDist;
            Chance = miror.Chance;
            Drops = miror.Drops;
        }
    }
}
