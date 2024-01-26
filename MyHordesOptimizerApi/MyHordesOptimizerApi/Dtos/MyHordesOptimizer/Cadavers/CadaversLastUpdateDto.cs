using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CadaversLastUpdateDto
    {
        public List<CadaverDto> Cadavers { get; set; }
        public LastUpdateInfoDto LastUpdateInfo { get; set; }

        public CadaversLastUpdateDto()
        {
            Cadavers = new List<CadaverDto>();
        }
    }
}
