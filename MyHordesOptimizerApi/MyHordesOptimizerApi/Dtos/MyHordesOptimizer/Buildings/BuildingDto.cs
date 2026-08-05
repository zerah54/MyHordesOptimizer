using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings
{
    /// <summary>
    /// Un chantier du référentiel, tel que le site l'affiche.
    /// </summary>
    /// <remarks>
    /// <see cref="Pa"/>/<see cref="Resources"/> sont le jeu Default (affiché hors Pandémonium).
    /// Porte aussi les trois paliers Pandémonium (0/1/2 plans lus, <see cref="Tier0Ap"/> et
    /// suivants) et la disponibilité par TownType — extraits depuis les fixtures et
    /// <c>rules.yml</c> du jeu, aucune API MyHordes ne les expose (chantier du 2026-08-06).
    /// </remarks>
    public class BuildingDto
    {
        public int Id { get; set; }
        public string Uid { get; set; }
        public string Img { get; set; }
        public IDictionary<string, string> Label { get; set; }
        public IDictionary<string, string> Description { get; set; }

        /// <summary>Chantier dont celui-ci est une évolution, ou null s'il est une racine.</summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// Rang d'affichage officiel du jeu. NON UNIQUE : c'est un rang au sein d'un groupe, à
        /// combiner avec un second critère pour trier une liste complète.
        /// </summary>
        public int? DisplayOrder { get; set; }

        public int Pa { get; set; }
        public int Defence { get; set; }
        public int MaxLife { get; set; }
        public bool Breakable { get; set; }
        public bool Temporary { get; set; }
        public bool HasUpgrade { get; set; }

        /// <summary>Niveau de plan requis. 0 = constructible sans plan.</summary>
        public int Rarity { get; set; }

        /// <summary>Jeu de ressources Default — celui affiché hors Pandémonium.</summary>
        public List<BuildingResourceDto> Resources { get; set; } = new List<BuildingResourceDto>();

        /// <summary>Vrai si ce chantier a un jeu de ressources Pandémonium distinct.</summary>
        public bool HasHardMode { get; set; }

        /// <summary>0 plan lu — jeu Hard. Vide/null si HasHardMode est faux.</summary>
        public int? Tier0Ap { get; set; }
        public List<BuildingResourceDto> Tier0Resources { get; set; } = new List<BuildingResourceDto>();

        /// <summary>1 plan lu — jeu Easy. Les ressources de Tier2 sont IDENTIQUES.</summary>
        public int? Tier1Ap { get; set; }
        public List<BuildingResourceDto> Tier1Resources { get; set; } = new List<BuildingResourceDto>();

        /// <summary>2 plans lus — jeu Easy avec PA réduit. Pas de Tier2Resources : identiques à Tier1Resources.</summary>
        public int? Tier2Ap { get; set; }

        /// <summary>
        /// Niveau de plan réellement requis en Pandémonium, quand ce chantier est overridé
        /// nommément dans rules.yml. Null si le chantier ne relève que de la règle générique —
        /// dans ce cas, la rareté de base (<see cref="Rarity"/>) reste la seule affichable.
        /// </summary>
        public int? HardBlueprintLevel { get; set; }

        /// <summary>Disponibilité par TownType. Une entrée absente signifie « disponible normalement ».</summary>
        public IDictionary<TownType, BuildingAvailabilityStatus> Availability { get; set; }
            = new Dictionary<TownType, BuildingAvailabilityStatus>();
    }

    /// <summary>Une ressource requise par un chantier, avec sa quantité.</summary>
    public class BuildingResourceDto
    {
        public int ItemId { get; set; }
        public string Uid { get; set; }
        public string Img { get; set; }
        public IDictionary<string, string> Label { get; set; }
        public int Count { get; set; }
    }
}
