using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    public class CitizensLastUpdateDto
    {
        public LastUpdateInfoDto LastUpdateInfo { get; set; }

        public List<CitizenDto> Citizens { get; set; }

        public CitizensLastUpdateDto(List<CitizenDto> dictionary)
        {
            Citizens = new List<CitizenDto>(dictionary);
        }

        public CitizensLastUpdateDto()
        {
            Citizens = new List<CitizenDto>();
        }
    }
}
