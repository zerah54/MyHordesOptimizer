using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionOrderDto
    {
        public int? Id { get; set; }
        public string? Type { get; set; }
        public string? Text { get; set; }
        [JsonProperty("done")]
        public bool? IsDone { get; set; }
        public int? Position { get; set; }
    }
}
