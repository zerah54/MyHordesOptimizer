using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request
{
    public class BuildingPlanRequestDto
    {
        /// <summary>Null = création.</summary>
        public int? Id { get; set; }
        public int Day { get; set; }
        public string Name { get; set; } = "";
        /// <summary>Obligatoire pour une modification.</summary>
        public int? Version { get; set; }
        public BuildingPlanContentDto Content { get; set; } = new();
    }

    public class BuildingPlanSettingsRequestDto
    {
        public Dictionary<int, int> ItemValues { get; set; } = new();
        /// <summary>Null = première écriture ; sinon doit égaler la version actuelle.</summary>
        public int? Version { get; set; }
    }
}
