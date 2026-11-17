using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch
{
    /// <summary>Paramètres du modèle de veille. Tous les risques sont des fractions (0,08 = 8 %).</summary>
    public class NightwatchReferentialDto
    {
        public double BaseRisk { get; set; }
        /// <summary>Risque ajouté selon le nombre de veilles passées (indice borné à longueur − 1).</summary>
        public double[] Fatigue { get; set; } = new double[0];
        /// <summary>Variante pour la propriété « veilleur pro ».</summary>
        public double[] FatiguePro { get; set; } = new double[0];
        /// <summary>Par clé de statut du plan (drugged, drunk, thirsty, immune, dog, dogSteak, ghoul).</summary>
        public Dictionary<string, NightwatchStatusDefDto> Statuses { get; set; } = new();
        /// <summary>Par <c>Item.IdItem</c> ; les uids absents du catalogue sont ignorés.</summary>
        public Dictionary<int, NightwatchItemDefDto> Items { get; set; } = new();
        /// <summary>Plafond de veilleurs selon le niveau du Chemin de ronde (0 aussi si non construit).</summary>
        public Dictionary<int, int> WatcherCapByRoundPathLevel { get; set; } = new();
        /// <summary>Fraction retranchée au risque (Chemin de ronde niveau 3).</summary>
        public double RoundPathLevel3Bonus { get; set; }
        /// <summary>Fraction retranchée au risque (Corps de garde).</summary>
        public double GuardRoomBonus { get; set; }
        /// <summary>Fraction ajoutée au risque (Arroseurs).</summary>
        public double SprinklerMalus { get; set; }
        /// <summary>Fraction retranchée par bain, jusqu'au plancher (risque de base).</summary>
        public double BathBonus { get; set; }
        /// <summary>Défense ajoutée à chaque veilleur dès qu'un veilleur porte le Discours rassurant multicoloré.</summary>
        public double DiscourseDefense { get; set; }
        /// <summary>
        /// Uid du chantier requis pour que les objets comptent (Armurerie). Défense d'un objet = 0 si cassé
        /// (<c>BagItem.IsBroken</c>) ou si ce chantier n'est pas construit (sauf objet « essentiel », absent de notre BDD).
        /// </summary>
        public string ItemDefenseRequiresBuildingUid { get; set; } = "";
        /// <summary>
        /// Appliqués dans l'ordre à la défense de base : pour chaque entrée dont le chantier est construit et dont
        /// l'objet est visé, <c>défense = floor(défense * (1 + Factor))</c>. Le niveau des chantiers n'intervient pas.
        /// </summary>
        public List<NightwatchDefenseBonusDto> DefenseBonuses { get; set; } = new();
    }

    public class NightwatchDefenseBonusDto
    {
        public string BuildingUid { get; set; } = "";
        public double Factor { get; set; }
        /// <summary><c>Item.IdItem</c> des objets visés.</summary>
        public List<int> IdItems { get; set; } = new();
    }

    public class NightwatchStatusDefDto
    {
        public int Defense { get; set; }
        /// <summary>Fraction ajoutée au risque ; positif = pénalité.</summary>
        public double DeathRisk { get; set; }
        /// <summary>game | excel</summary>
        public string Source { get; set; } = "";
    }

    public class NightwatchItemDefDto
    {
        /// <summary>Défense de base de l'objet, avant bonus des bâtiments.</summary>
        public int Defense { get; set; }
        /// <summary>repair | recharge | single | permanent (inchangé après la veille).</summary>
        public string Usage { get; set; } = "";
        /// <summary>PA par objet réparé : 2 = convention des leads (messages forum, Excel) ; le jeu compte 1 PA + un outil consommé.</summary>
        public int RepairPa { get; set; }
        /// <summary>Source du coût de réparation (« excel » pour la convention des leads, vide si non réparable).</summary>
        public string RepairPaSource { get; set; } = "";
        /// <summary>
        /// Objet pouvant être « essentiel » dans le jeu (objet de métier, ex. bouclier du gardien) : il garde alors sa défense
        /// de veille même sans l'Armurerie. Règle : défense 0 si l'Armurerie est absente et que l'objet n'est pas essentiel.
        /// </summary>
        public bool IsEssential { get; set; }
        public int Batteries { get; set; }
        public int Water { get; set; }
        /// <summary>Fraction retranchée au risque (négatif = pénalité).</summary>
        public double WatchImpact { get; set; }
        public bool Cumulative { get; set; }
        /// <summary>game | excel</summary>
        public string Source { get; set; } = "";
    }
}
