using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizenStatus
    {
        public CitizenStatusValue Content { get; set; }
        public LastUpdateInfo? LastUpdateInfo { get; set; }
        public List<string> Icons { get; set; }

        public LastUpdateInfo? GhoulStatusLastUpdateInfo { get; set; }
        public bool IsGhoul { get; set; }
        public int GhoulVoracity { get; set; }
        public CitizenStatus()
        {
            Content = new CitizenStatusValue();
        }
    }
}