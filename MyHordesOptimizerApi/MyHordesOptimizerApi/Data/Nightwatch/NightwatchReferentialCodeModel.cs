using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Nightwatch
{
    /// <summary>
    /// Paramètres du modèle de veille (<c>Data/Nightwatch/nightwatch-referential.json</c>), clés d'objets par uid.
    /// Les risques sont des fractions ; <c>Source</c> vaut « game » (fixtures/listeners MyHordes) ou « excel » (repli).
    /// </summary>
    public class NightwatchReferentialCodeModel
    {
        public double BaseRisk { get; set; }
        public double[] Fatigue { get; set; } = new double[0];
        public double[] FatiguePro { get; set; } = new double[0];
        public Dictionary<string, NightwatchStatusCodeModel> Statuses { get; set; } = new();
        public Dictionary<string, NightwatchItemCodeModel> Items { get; set; } = new();
        public Dictionary<int, int> WatcherCapByRoundPathLevel { get; set; } = new();
        public double RoundPathLevel3Bonus { get; set; }
        public double GuardRoomBonus { get; set; }
        public double SprinklerMalus { get; set; }
        public double BathBonus { get; set; }
        public double DiscourseDefense { get; set; }
        /// <summary>Sans ce chantier, tout objet non « essentiel » vaut 0 de défense de veille.</summary>
        public string ItemDefenseRequiresBuildingUid { get; set; } = "";
        public List<NightwatchDefenseBonusCodeModel> DefenseBonuses { get; set; } = new();
    }

    public class NightwatchDefenseBonusCodeModel
    {
        public string BuildingUid { get; set; } = "";
        /// <summary>Propriété d'objet du jeu qui ouvre le bonus (information).</summary>
        public string Property { get; set; } = "";
        public double Factor { get; set; }
        public List<string> ItemUids { get; set; } = new();
    }

    public class NightwatchStatusCodeModel
    {
        public int Defense { get; set; }
        public double DeathRisk { get; set; }
        public string Source { get; set; } = "";
    }

    public class NightwatchItemCodeModel
    {
        public int Defense { get; set; }
        public string Usage { get; set; } = "";
        public int RepairPa { get; set; }
        public string RepairPaSource { get; set; } = "";
        public bool IsEssential { get; set; }
        public int Batteries { get; set; }
        public int Water { get; set; }
        public double WatchImpact { get; set; }
        public bool Cumulative { get; set; }
        public string Source { get; set; } = "";
    }
}
