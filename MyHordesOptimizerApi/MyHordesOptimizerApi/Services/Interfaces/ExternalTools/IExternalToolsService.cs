using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.ExternalTools
{
    public interface IExternalToolsService
    {
        public Task<UpdateResponseDto> UpdateExternalsTools(UpdateRequestDto updateRequestDto);
        List<CaseGH> UpdateGHZoneRegen(UpdateZoneRegenDto requestDto);
        LastUpdateInfoDto UpdateCitizenBag(int townId, int userId, List<UpdateObjectDto> bag);
        LastUpdateInfoDto UpdateCitizenHome(int townId, int userId, CitizenHomeValueDto homeDetails);
        LastUpdateInfoDto UpdateCitizenStatus(int townId, int userId, List<string> status);
        LastUpdateInfoDto UpdateCitizenHeroicActions(int townId, int userId, CitizenActionsHeroicValue actionHeroics);
        LastUpdateInfoDto UpdateGhoulStatus(int townId, int userId, UpdateGhoulStatusDto request);
    }
}
