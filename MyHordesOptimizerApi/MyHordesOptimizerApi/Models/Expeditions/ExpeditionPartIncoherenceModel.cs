namespace MyHordesOptimizerApi.Models.Expeditions
{
    public class ExpeditionPartIncoherenceModel
    {
        public int ExpeditionPartId { get; set; }
        public ExpeditionPartIncoherenceType Type { get; set; }

        public ExpeditionPartIncoherenceModel(int expeditionId, ExpeditionPartIncoherenceType type)
        {
            ExpeditionPartId = expeditionId;
            Type = type;
        }
    }

    public enum ExpeditionPartIncoherenceType
    {
        NotEnoughPdc,
        NotEnoughBandage
    }
}
