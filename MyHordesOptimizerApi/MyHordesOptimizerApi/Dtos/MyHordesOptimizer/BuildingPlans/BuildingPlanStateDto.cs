using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans
{
    public class BuildingPlanStateDto
    {
        public List<TownBuildingStateDto> Buildings { get; set; } = new();
        /// <summary>Défense synchronisée de la ville ; null tant qu'aucune mise à jour des outils ne l'a rapportée.</summary>
        public TownDefenseStateDto? Defense { get; set; }
    }

    public class TownDefenseStateDto
    {
        public int? Total { get; set; }
        public int? Base { get; set; }
        public int? Buildings { get; set; }
        public int? Upgrades { get; set; }
        public int? Items { get; set; }
        public double? ItemsMul { get; set; }
        public int? CitizenHomes { get; set; }
        public int? CitizenGuardians { get; set; }
        public int? Watchmen { get; set; }
        public int? Souls { get; set; }
        public int? Temp { get; set; }
        public int? Cadavers { get; set; }
        public double? Bonus { get; set; }
    }

    public class TownBuildingStateDto
    {
        public int BuildingId { get; set; }
        public bool IsBuilt { get; set; }
        public int? PaCurrent { get; set; }
        /// <summary>PA restants bruts, sans réduction d'atelier.</summary>
        public int? ApRemaining { get; set; }
        public int? Life { get; set; }
        public int? MaxLife { get; set; }
        public int? Def { get; set; }
        public int? Level { get; set; }
        public int? Difficulty { get; set; }
        public List<TownBuildingResourceDto> Resources { get; set; } = new();
    }

    public class TownBuildingResourceDto
    {
        public int ItemId { get; set; }
        public int Count { get; set; }
    }
}
