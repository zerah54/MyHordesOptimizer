using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces.ExternalTools
{
    public interface IExternalToolsService
    {
        public UpdateResponseDto UpdateExternalsTools(UpdateRequestDto updateRequestDto);
        List<CaseGH> UpdateGHZoneRegen(UpdateZoneRegenDto requestDto);
        void UpdateBag(int townId, int userId, List<UpdateObjectDto> bag);
    }
}
