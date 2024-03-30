using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IExpeditionService
    {
        void DeleteExpedition(int expeditionId);
        List<ExpeditionDto> GetExpeditionsByDay(int townId, int day);
        ExpeditionDto SaveExpedition(ExpeditionDto expedition, int idTown, int day);
    }
}
