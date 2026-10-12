using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Models.Expeditions;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IExpeditionService
    {
        void DeleteExpedition(int expeditionId);
        /// <summary>Expéditions d'un jour ; sans les tracés liés pour qui n'est pas citoyen de la ville (observation).</summary>
        Task<List<ExpeditionDto>> GetExpeditionsByDayAsync(int townId, int day);
        List<ExpeditionDto> GetUserExpeditionsByDay(int townId, int userId, int day);
        ExpeditionInhorenceModel ValidateExpeditions(int townId, int day);

        Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expedition, int idTown, int day);
        Task<List<ExpeditionDto>> CopyExpeditionsAsync(int townId, int fromDay, int targetDay);

        Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenRequestDto expeditionCitizen);
        void DeleteExpeditionCitizen(int expeditionCitizenId);

        Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart);
        void DeleteExpeditionPart(int expeditionPartId);
        /// <summary>Parties relues telles que <see cref="SaveExpeditionPartAsync"/> les renvoie, pour les rediffuser.</summary>
        Task<List<ExpeditionPartDto>> GetExpeditionPartsAsync(IReadOnlyCollection<int> expeditionPartIds);

        Task<List<ExpeditionOrderDto>> SaveCitizenOrdersAsync(int expeditionCitizenId, List<ExpeditionOrderDto> expeditionOrder);
        Task<List<ExpeditionOrderDto>> SavePartOrdersAsync(int expeditionPartId, List<ExpeditionOrderDto> expeditionOrder);
        void DeleteExpeditionOrder(int expeditionOrderId);

        ExpeditionOrderDto UpdateExpeditionOrder(ExpeditionOrderDto expeditionOrderDto);
        Task<ExpeditionBagDto> UpdateExpeditionBag(int citizenId, ExpeditionBagRequestDto expeditionBagDto);
        List<ExpeditionBagDto> DeleteExpeditionBag(int bagId);

        /// <summary>
        /// Tracés dont les parties liées ont changé pendant les écritures de ce service (liaison, copie de jour,
        /// suppression), avec leur nouvelle version ; vide la liste. Le hub les diffuse (MapRouteChanged).
        /// </summary>
        IReadOnlyList<MapRouteChangeDto> TakeMapRouteChanges();
    }
}
