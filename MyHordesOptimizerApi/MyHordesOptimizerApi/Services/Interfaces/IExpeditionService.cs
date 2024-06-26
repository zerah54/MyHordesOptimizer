﻿using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models.Expeditions;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IExpeditionService
    {
        void DeleteExpedition(int expeditionId);
        List<ExpeditionDto> GetExpeditionsByDay(int townId, int day);
        List<ExpeditionDto> GetUserExpeditionsByDay(int townId, int userId, int day);
        ExpeditionInhorenceModel ValidateExpeditions(int townId, int day);

        Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expedition, int idTown, int day);
        Task<List<ExpeditionDto>> CopyExpeditionsAsync(int townId, int fromDay, int targetDay);

        Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenRequestDto expeditionCitizen);
        void DeleteExpeditionCitizen(int expeditionCitizenId);

        Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart);
        void DeleteExpeditionPart(int expeditionPartId);

        Task<List<ExpeditionOrderDto>> SaveCitizenOrdersAsync(int expeditionCitizenId, List<ExpeditionOrderDto> expeditionOrder);
        Task<List<ExpeditionOrderDto>> SavePartOrdersAsync(int expeditionPartId, List<ExpeditionOrderDto> expeditionOrder);
        void DeleteExpeditionOrder(int expeditionOrderId);

        ExpeditionOrderDto UpdateExpeditionOrder(ExpeditionOrderDto expeditionOrderDto);
        ExpeditionBagDto UpdateExpeditionBag(int citizenId, ExpeditionBagRequestDto expeditionBagDto);
        void DeleteExpeditionBag(int bagId);
    }
}
