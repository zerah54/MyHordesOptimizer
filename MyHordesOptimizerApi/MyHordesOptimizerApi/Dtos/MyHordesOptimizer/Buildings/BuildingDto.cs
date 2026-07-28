using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings
{
    /// <summary>
    /// Un chantier du référentiel, tel que le site l'affiche.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Les valeurs de coût — <see cref="Pa"/> et <see cref="Resources"/> — sont celles du jeu de
    /// ressources PAR DÉFAUT. MyHordes en définit trois (défaut, facile, difficile) et le mode
    /// Pandémonium utilise le difficile, qui diffère réellement pour 71 chantiers sur 166 (la
    /// Pompe y coûte 60 eau au lieu de 20). Ces jeux ne sont pas exposés par l'API : ils vivent
    /// dans les fixtures du jeu, et leur extraction reste à faire.
    /// </para>
    /// <para>
    /// C'est pourquoi le site doit dire explicitement que la page vaut pour les modes standard.
    /// </para>
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

        public List<BuildingResourceDto> Resources { get; set; } = new List<BuildingResourceDto>();
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
