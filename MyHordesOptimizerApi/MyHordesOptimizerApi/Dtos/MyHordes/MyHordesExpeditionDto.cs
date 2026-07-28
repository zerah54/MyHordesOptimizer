using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>Une expédition planifiée de la ville, sortie de <c>getExpeditionsData</c>.</summary>
    public class MyHordesExpeditionDto
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        /// <summary>Nombre de cases du trajet.</summary>
        [JsonProperty("length")]
        public int? Length { get; set; }

        [JsonProperty("author")]
        public MyHordesExpeditionAuthorDto? Author { get; set; }

        [JsonProperty("points")]
        public MyHordesExpeditionPointsDto? Points { get; set; }
    }
}
