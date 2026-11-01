using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    /// <summary>Niveaux de maison et améliorations (fichiers statiques de l'extracteur).</summary>
    public class HomeReferentialDto
    {
        public List<HomeLevelDto> Levels { get; set; } = new();
        public List<HomeUpgradeDto> Upgrades { get; set; } = new();
    }

    public class HomeLevelDto
    {
        /// <summary>Indice dans le fichier, 0 = lit de camp.</summary>
        public int Level { get; set; }
        public string Label { get; set; } = "";
        public string Icon { get; set; } = "";
        public int Def { get; set; }
        public int Ap { get; set; }
        public int ApUrbanism { get; set; }
        public List<HomeResourceDto> Resources { get; set; } = new();
        public List<HomeResourceDto> ResourcesUrbanism { get; set; } = new();
        /// <summary>Uid du chantier requis.</summary>
        public string? BuildingUid { get; set; }
        public bool AllowsUpgrades { get; set; }
        public bool Theft { get; set; }
    }

    public class HomeUpgradeDto
    {
        public string Name { get; set; } = "";
        public string Label { get; set; } = "";
        public string Description { get; set; } = "";
        public List<HomeUpgradeLevelDto> Levels { get; set; } = new();
    }

    public class HomeUpgradeLevelDto
    {
        public int Level { get; set; }
        public int Ap { get; set; }
        public List<HomeResourceDto> Resources { get; set; } = new();
    }

    public class HomeResourceDto
    {
        /// <summary><c>Item.Uid</c>, ex. <c>wood_bad_#00</c>.</summary>
        public string ItemUid { get; set; } = "";
        public int Count { get; set; }
    }
}
