namespace MyHordesOptimizerApi.Models.Expeditions
{
    /// <summary>Règle de verrouillage des expéditions par jour : passé = verrouillé, actuel/futur = modifiable.</summary>
    public static class ExpeditionDayLock
    {
        public static bool IsLocked(int? expeditionDay, int townCurrentDay)
        {
            return expeditionDay.HasValue && expeditionDay.Value < townCurrentDay;
        }
    }
}
