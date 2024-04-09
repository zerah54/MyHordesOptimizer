using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Extensions.Models.Expeditions
{
    public static class ExpeditionBagItemExtensions
    {
        public static ExpeditionBagItem Copy(this ExpeditionBagItem source)
        {
            var copy = new ExpeditionBagItem();
            copy.IsBroken = source.IsBroken;
            copy.Count = source.Count;
            copy.IdItem = source.IdItem;
            return copy;
        }
    }
}
