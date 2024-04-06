﻿using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IExpeditionService
    {
        void DeleteExpedition(int expeditionId);
        List<ExpeditionDto> GetExpeditionsByDay(int townId, int day);
        Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expedition, int idTown, int day);
        Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenRequestDto expeditionCitizen);
        void DeleteExpeditionCitizen(int expeditionCitizenId);
        Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart);
        void DeleteExpeditionPart(int expeditionPartId);
    }
}