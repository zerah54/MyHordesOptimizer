using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi
{
    public partial class MhoContext : DbContext
    {
        public ExpeditionBag GetExpeditionBag(int idExpeditionBag)
        {
            return ExpeditionBags.Where(bag => bag.IdExpeditionBag == idExpeditionBag)
                         .Include(bag => bag.ExpeditionBagItems)
                             .ThenInclude(bagItem => bagItem.IdItemNavigation)
                         .Single();
        }

        public IQueryable<Expedition> GetTownExpeditionsByDay(int townId, int day)
        {
            return Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == day)
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
