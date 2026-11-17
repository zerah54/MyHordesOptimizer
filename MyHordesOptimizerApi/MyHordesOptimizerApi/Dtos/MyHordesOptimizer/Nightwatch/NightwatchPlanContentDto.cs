using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch
{
    /// <summary>Contenu JSON d'une proposition de plan de veille ; stocké tel quel dans <c>TownNightwatchPlan.Content</c>.</summary>
    public class NightwatchPlanContentDto
    {
        /// <summary>Null = attaque estimée par le site.</summary>
        public double? AttackOverride { get; set; }
        /// <summary>Consignes libres globales.</summary>
        public string? Instructions { get; set; }
        public List<NightwatchWatcherDto> Watchers { get; set; } = new();
        /// <summary>Stock saisi à la main, par <c>Item.IdItem</c>.</summary>
        public Dictionary<int, int> ManualStock { get; set; } = new();
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
