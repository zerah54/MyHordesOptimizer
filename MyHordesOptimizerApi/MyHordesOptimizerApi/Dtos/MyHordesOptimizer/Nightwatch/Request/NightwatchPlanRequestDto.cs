namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request
{
    public class NightwatchPlanRequestDto
    {
        /// <summary>Null = création.</summary>
        public int? Id { get; set; }
        public int Day { get; set; }
        public string Name { get; set; } = "";
        /// <summary>Obligatoire pour une modification.</summary>
        public int? Version { get; set; }
        /// <summary>Simulation rattachée ; pris en compte à la création seulement.</summary>
        public int? SimulationId { get; set; }
        public NightwatchPlanContentDto Content { get; set; } = new();
    }
}
