using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping
{
    /// <summary>
    /// Plusieurs campeurs sur une même zone, dans l'ordre où ils se cachent : chacun subit la foule
    /// de ceux cachés avant lui, et seuls les premiers tiennent dans le bâtiment.
    /// </summary>
    public class CampingGroupParametersDto
    {
        public const int MaxCampers = 16;

        public TownType TownType { get; set; }
        public int Distance { get; set; }
        public int Zombies { get; set; }
        public bool Night { get; set; }
        public bool Devastated { get; set; }
        public bool Phare { get; set; }

        /// <summary>Aménagement de la zone (+5 par amélioration, +9 par objet de défense).</summary>
        public int ImprovementLevel { get; set; }

        /// <summary>Bonus du bâtiment de la zone, <c>null</c> sans bâtiment (ou enseveli, voir <see cref="RuinBuryCount"/>).</summary>
        public int? RuinBonus { get; set; }

        /// <summary>Places pour se cacher dans le bâtiment (non enseveli), -1 sans limite.</summary>
        public int RuinCapacity { get; set; }

        /// <summary>Tas d'un bâtiment enseveli, 0 s'il ne l'est pas.</summary>
        public int RuinBuryCount { get; set; }

        /// <summary>Citoyens déjà cachés sur la zone avant le premier campeur.</summary>
        public int HiddenCampers { get; set; }

        /// <summary>Campeurs, dans l'ordre où ils se cachent.</summary>
        public List<CampingGroupCamperDto> Campers { get; set; } = new();
    }

    public class CampingGroupCamperDto
    {
        public string? Job { get; set; }
        public int Campings { get; set; }
        public bool ProCamper { get; set; }
        public int Objects { get; set; }
        public bool Vest { get; set; }
        public bool Tomb { get; set; }
        public bool R4 { get; set; }

        /// <summary>
        /// Niveau de la capacité Repos (0 aucun, 1 à 4). Renseigné, il remplace <see cref="ProCamper"/> et
        /// <see cref="R4"/> : Campeur pro tant que les campings restent sous la limite du niveau, plafond
        /// du niveau. <c>null</c> : les deux cases saisies à la main.
        /// </summary>
        public int? RecluseLevel { get; set; }
    }
}
