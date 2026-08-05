namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings
{
    /// <summary>
    /// Statut de disponibilité d'un chantier pour un TownType donné. L'absence d'entrée pour un
    /// couple (chantier, TownType) signifie « disponible normalement » — ce n'est PAS un membre
    /// de cet enum, voir BuildingAvailability (aucune ligne écrite dans ce cas).
    /// </summary>
    public enum BuildingAvailabilityStatus
    {
        Initial,
        Unlocked,
        Disabled
    }
}
