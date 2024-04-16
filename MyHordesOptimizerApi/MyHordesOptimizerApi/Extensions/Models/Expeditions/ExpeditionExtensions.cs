using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions.Models.Expeditions
{
    public static class ExpeditionExtensions
    {
        public static Expedition Copy(this Expedition source)
        {
            var newExpedition = new Expedition();
            newExpedition.Day = source.Day;
            newExpedition.ExpeditionParts = new List<ExpeditionPart>();
            newExpedition.IdExpedition = 0;
            newExpedition.IdLastUpdateInfo = 0;
            newExpedition.IdLastUpdateInfoNavigation = null;
            newExpedition.IdTown = source.IdTown;
            newExpedition.IdTownNavigation = null;
            newExpedition.Label = source.Label;
            newExpedition.MinPdc = source.MinPdc;
            newExpedition.Position = source.Position;
            newExpedition.State = source.State;

            source.ExpeditionParts.ToList().ForEach(part => newExpedition.ExpeditionParts.Add(part.Copy()));
            return newExpedition;
        }
    }
}
