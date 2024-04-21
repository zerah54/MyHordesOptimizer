namespace MyHordesOptimizerApi.Models.Expeditions
{
    public class TownExpeditionIncoherenceModel
    {
        public int TownId { get; set; }
        public int ExpeditionDay { get; set; }
        public TownExpeditionIncoherenceType Type { get; set; }

        public TownExpeditionIncoherenceModel(int townId, int day, TownExpeditionIncoherenceType type)
        {
            TownId = townId;
            ExpeditionDay = day;
            Type = type;
        }
    }

    public enum TownExpeditionIncoherenceType
    {
        TooMuchExpedition,
        NotEnoughExpedition
    }
}
