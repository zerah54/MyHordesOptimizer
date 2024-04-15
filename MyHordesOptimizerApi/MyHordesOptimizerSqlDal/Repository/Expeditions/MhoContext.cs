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
    }
}
