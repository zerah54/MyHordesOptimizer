using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizenStatusDto
    {
        public CitizenStatusValueDto Content { get; set; }
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }
        public List<string> Icons { get; set; }

        public LastUpdateInfoDto? GhoulStatusLastUpdateInfo { get; set; }
        public bool IsGhoul { get; set; }
        public int GhoulVoracity { get; set; }
        public CitizenStatusDto()
        {
            Content = new CitizenStatusValueDto();
        }
    }
}