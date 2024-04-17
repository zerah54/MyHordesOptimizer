using Microsoft.EntityFrameworkCore;
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
    }
}
