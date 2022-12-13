using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizenHome
    {
        public CitizenHomeValue Content { get; set; }
        public LastUpdateInfo? LastUpdateInfo { get; set; }

        public CitizenHome()
        {
            Content = new CitizenHomeValue();
        }
    }
}