using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions.Models.Expeditions
{
    public static class ExpeditionBagExtensions
    {
        public static ExpeditionBag Copy(this ExpeditionBag source)
        {
            var copy = new ExpeditionBag();
            source.ExpeditionBagItems.ToList().ForEach(bagItem => copy.ExpeditionBagItems.Add(bagItem.Copy()));
            return copy;
        }
    }
}
