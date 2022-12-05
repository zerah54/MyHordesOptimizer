using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.ExternalTools
{
    public interface IExternalToolsService
    {
        public Task<UpdateResponseDto> UpdateExternalsTools(UpdateRequestDto updateRequestDto);
        List<CaseGH> UpdateGHZoneRegen(UpdateZoneRegenDto requestDto);
        LastUpdateInfo UpdateBag(int townId, int userId, List<UpdateObjectDto> bag);
    }
}
