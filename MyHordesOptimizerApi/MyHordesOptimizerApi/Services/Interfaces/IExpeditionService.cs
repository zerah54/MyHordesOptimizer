using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IExpeditionService
    {
        void DeleteExpedition(int expeditionId);
        List<ExpeditionDto> GetExpeditionsByDay(int townId, int day);
        Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionDto expedition, int idTown, int day);
        Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenDto expeditionCitizen);
        void DeleteExpeditionCitizen(int expeditionCitizenId);
        Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartDto expeditionPart);
        void DeleteExpeditionPart(int expeditionPartId);
    }
}
