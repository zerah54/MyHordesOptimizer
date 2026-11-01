using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans
{
    public class BuildingPlanDto
    {
        public int Id { get; set; }
        public int Day { get; set; }
        public string Name { get; set; } = "";
        public bool IsEffective { get; set; }
        public int Version { get; set; }
        public int AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public BuildingPlanContentDto Content { get; set; } = new();
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }
    }

    public class BuildingPlanAccessDto
    {
        public bool IsCitizen { get; set; }
        /// <summary>Citoyen d'une ville non terminée.</summary>
        public bool CanEdit { get; set; }
    }

    public class BuildingPlansDto
    {
        public BuildingPlanAccessDto Access { get; set; } = new();
        public List<BuildingPlanDto> Plans { get; set; } = new();
        /// <summary>Valeur en PA par <c>Item.IdItem</c>.</summary>
        public Dictionary<int, int> ItemValues { get; set; } = new();
        public int SettingsVersion { get; set; }
    }
}
