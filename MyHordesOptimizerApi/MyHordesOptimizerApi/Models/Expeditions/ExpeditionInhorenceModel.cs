using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    public class ExpeditionInhorenceModel
    {
        public List<TownExpeditionIncoherenceModel> TownExpeditionsIncoherences { get; }
        public List<ExpeditionCitizenIncoherenceModel> ExpeditionCitizenIncoherences { get; }
        public List<ExpeditionPartIncoherenceModel> ExpeditionPartIncoherences { get; }

        public ExpeditionInhorenceModel(List<TownExpeditionIncoherenceModel> townExpeditionsIncoherences, List<ExpeditionCitizenIncoherenceModel> expeditionCitizenIncoherences, List<ExpeditionPartIncoherenceModel> expeditionPartIncoherences)
        {
            TownExpeditionsIncoherences = townExpeditionsIncoherences;
            ExpeditionCitizenIncoherences = expeditionCitizenIncoherences;
            ExpeditionPartIncoherences = expeditionPartIncoherences;
        }
    }
}
