using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions.Models.Expeditions
{
    public static class ExpeditionCitizenExtensions
    {
        public static ExpeditionCitizen Copy(this ExpeditionCitizen source)
        {
            var newCitizen = new ExpeditionCitizen();
            newCitizen.ExpeditionOrders = new List<ExpeditionOrder>();
            newCitizen.PreinscritHeroic = source.PreinscritHeroic;
            newCitizen.PreinscritJob = source.PreinscritJob;
            newCitizen.IdExpeditionBag = null;
            source.ExpeditionOrders.ToList().ForEach(order => newCitizen.ExpeditionOrders.Add(order.Copy()));
            return newCitizen;
        }
    }
}
