using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.ExternalTools
{
    public interface IExternalToolsService
    {
        public Task<UpdateResponseDto> UpdateExternalsTools(UpdateRequestDto updateRequestDto);
        List<CaseGH> UpdateGHZoneRegen(UpdateZoneRegenDto requestDto);
        LastUpdateInfo UpdateCitizenBag(int townId, int userId, List<UpdateObjectDto> bag);
        LastUpdateInfo UpdateCitizenHome(int townId, int userId, CitizenHomeValue homeDetails);
        LastUpdateInfo UpdateCitizenStatus(int townId, int userId, List<string> status);
        LastUpdateInfo UpdateCitizenHeroicActions(int townId, int userId, CitizenActionsHeroicValue actionHeroics);
        LastUpdateInfo UpdateGhoulStatus(int townId, int userId, UpdateGhoulStatusDto request);
    }
}
