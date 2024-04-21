namespace MyHordesOptimizerApi.Models.Expeditions
{
    public class ExpeditionCitizenIncoherenceModel
    {
        public int ExpeditionCitizenId { get; set; }
        public ExpeditionCitizenIncoherenceType Type { get; set; }

        public ExpeditionCitizenIncoherenceModel(int expeditionCitizenId, ExpeditionCitizenIncoherenceType type)
        {
            ExpeditionCitizenId = expeditionCitizenId;
            Type = type;
        }
    }

    public enum ExpeditionCitizenIncoherenceType
    {
        CitizenHasNoSecondWind,
        CitizenHasNoUppercut,
        CitizenHasNoRescue,
        CitizenHasNoHeroicReturn,
        CitizenWillComeBackDehidrated,
        CitizenWillComeBackThirsty,
        HasMoreThanOneAlcool,
        CitizenHasNotSamePaHasOtherCitizen,
        CitizenAlreadyRegister
    }
}
