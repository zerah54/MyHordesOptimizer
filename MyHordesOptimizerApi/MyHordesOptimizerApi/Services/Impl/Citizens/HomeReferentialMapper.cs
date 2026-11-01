using MyHordesOptimizerApi.Data.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Citizens
{
    /// <summary>Convertit les modèles de fichier en DTO HTTP ; un niveau d'amélioration non numérique lève (dérive de l'extracteur).</summary>
    public static class HomeReferentialMapper
    {
        public static HomeReferentialDto Map(List<HomeLevelCodeModel> levels, List<HomeUpgradeCodeModel> upgrades)
        {
            static List<HomeResourceDto> ToResources(Dictionary<string, int> resources)
                => resources.Select(pair => new HomeResourceDto { ItemUid = pair.Key, Count = pair.Value }).ToList();

            return new HomeReferentialDto
            {
                Levels = levels.Select((level, index) => new HomeLevelDto
                {
                    Level = index, Label = level.Label, Icon = level.Icon, Def = level.Def, Ap = level.Ap, ApUrbanism = level.ApUrbanism,
                    Resources = ToResources(level.Resources), ResourcesUrbanism = ToResources(level.ResourcesUrbanism),
                    BuildingUid = level.Building, AllowsUpgrades = level.Upgrades, Theft = level.Theft
                }).ToList(),
                Upgrades = upgrades.Select(upgrade => new HomeUpgradeDto
                {
                    Name = upgrade.Name, Label = upgrade.Label, Description = upgrade.Desc,
                    Levels = upgrade.Levels
                        .Select(pair => new HomeUpgradeLevelDto { Level = int.Parse(pair.Key), Ap = pair.Value.Ap, Resources = ToResources(pair.Value.Resources) })
                        .OrderBy(level => level.Level).ToList()
                }).ToList()
            };
        }
    }
}
