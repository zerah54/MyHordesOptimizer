﻿using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Repository.Expeditions
{
    public static class ExpeditionRepositoryExtensions
    {
        public static IQueryable<Expedition> IncludeAll(this IQueryable<Expedition> query)
        {
            return query
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.IdExpeditionOrders)
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.ExpeditionCitizens)
                        .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionBagNavigation)
                            .ThenInclude(bag => bag.ExpeditionBagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.ExpeditionCitizens)
                        .ThenInclude(expeditionCitizen => expeditionCitizen.ExpeditionOrders);
        }

        public static IQueryable<ExpeditionCitizen> IncludeAll(this IQueryable<ExpeditionCitizen> query)
        {
            return query
                .Include(citizen => citizen.ExpeditionOrders)
                .AsSplitQuery()
                .Include(citizen => citizen.IdExpeditionBagNavigation)
                    .ThenInclude(bag => bag.ExpeditionBagItems)
                        .ThenInclude(bagItem => bagItem.IdItemNavigation)
                        .AsSplitQuery()
                .Include(citizen => citizen.IdUserNavigation)
                .AsSplitQuery()
                .Include(citizen => citizen.IdExpeditionPartNavigation)
                    .ThenInclude(part => part.IdExpeditionNavigation)
                .AsSplitQuery();
        }
    }
}
