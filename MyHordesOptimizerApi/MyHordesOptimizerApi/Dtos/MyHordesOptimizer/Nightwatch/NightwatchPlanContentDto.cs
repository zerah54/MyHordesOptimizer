using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch
{
    /// <summary>Contenu JSON d'une proposition de plan de veille ; stocké tel quel dans <c>TownNightwatchPlan.Content</c>.</summary>
    public class NightwatchPlanContentDto
    {
        /// <summary>Null = attaque estimée par le site.</summary>
        public double? AttackOverride { get; set; }
        /// <summary>Proposition de Chantiers retenue pour le jour de la veille ; null = l'effective.</summary>
        public int? BuildingPlanId { get; set; }
        /// <summary>Consignes libres globales.</summary>
        public string? Instructions { get; set; }
        public List<NightwatchWatcherDto> Watchers { get; set; } = new();
        /// <summary>Stock saisi à la main, par <c>Item.IdItem</c>.</summary>
        public Dictionary<int, int> ManualStock { get; set; } = new();
        /// <summary>Objets globaux de la simulation, par <c>Item.IdItem</c> ; null = non renseigné.</summary>
        public Dictionary<int, int>? GlobalItems { get; set; }
        /// <summary>Surcharges de la défense de la ville ; null = tout pré-rempli.</summary>
        public NightwatchCityDefenseDto? CityDefense { get; set; }
        public int? AllowedOverflow { get; set; }
        /// <summary>Pourcentage 0 à 100.</summary>
        public int? AttackReductionPercent { get; set; }
        public int? ReactorDamage { get; set; }
    }

    /// <summary>Surcharges de la défense de la ville ; un champ nul reste pré-rempli.</summary>
    public class NightwatchCityDefenseDto
    {
        public int? Buildings { get; set; }
        public int? Upgrades { get; set; }
        public int? Wall { get; set; }
        public int? BankDefenseItems { get; set; }
        public int? Homes { get; set; }
        public int? Guardians { get; set; }
        public int? GuardTowerPa { get; set; }
        public int? Souls { get; set; }
        public int? Cemetery { get; set; }
        public int? EveningVote { get; set; }
        public int? DumpContribution { get; set; }
        public double? FddCoefficient { get; set; }
        /// <summary>-1 = non construit, 0 à 3.</summary>
        public int? AdLevel { get; set; }
    }

    public class NightwatchWatcherDto
    {
        /// <summary>Identifiant du citoyen (<c>User.IdUser</c>), unique dans le plan.</summary>
        public int UserId { get; set; }
        /// <summary>Statuts prévus : <c>drugged</c>, <c>drunk</c>, <c>thirsty</c>, <c>immune</c>, <c>dog</c>, <c>dogSteak</c>, <c>ghoul</c>.</summary>
        public List<string> Statuses { get; set; } = new();
        /// <summary>Quantité attribuée par <c>Item.IdItem</c>.</summary>
        public Dictionary<int, int> Items { get; set; } = new();
        /// <summary>Veilles passées ; null = calculé par le site.</summary>
        public int? PastWatches { get; set; }
        /// <summary>Discours rassurant multicolore attribué à ce veilleur.</summary>
        public bool HasDiscourse { get; set; }
        public string? Note { get; set; }
    }
}
