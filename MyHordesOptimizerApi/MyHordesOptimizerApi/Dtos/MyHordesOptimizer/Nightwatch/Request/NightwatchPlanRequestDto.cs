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
        public NightwatchPlanContentDto Content { get; set; } = new();
    }
}
