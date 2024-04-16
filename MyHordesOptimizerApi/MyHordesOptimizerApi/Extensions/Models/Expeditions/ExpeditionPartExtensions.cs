using MyHordesOptimizerApi.Extensions.Models.Expeditions;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions.Models.Expeditions
{
    public static class ExpeditionPartExtensions
    {
        public static ExpeditionPart Copy(this ExpeditionPart source)
        {
            var newPart = new ExpeditionPart();
            newPart.IdExpeditionPart = 0;
            newPart.Path = null;
            newPart.IdExpeditionOrders = new List<ExpeditionOrder>();
            source.IdExpeditionOrders.ToList().ForEach(order => newPart.IdExpeditionOrders.Add(order.Copy()));
            newPart.ExpeditionCitizens = new List<ExpeditionCitizen>();
            source.ExpeditionCitizens.ToList().ForEach(citizen => newPart.ExpeditionCitizens.Add(citizen.Copy()));

            newPart.Direction = source.Direction;
            newPart.Label = source.Label;
            newPart.Position = source.Position;
            return newPart;
        }
    }
}
