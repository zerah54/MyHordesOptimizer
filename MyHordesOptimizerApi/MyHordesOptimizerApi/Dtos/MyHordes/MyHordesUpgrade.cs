using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesUpgrade
    {
        [JsonProperty("name")]
        public MyHordesLangString Name { get; set; }

        [JsonProperty("level")]
        public int Level { get; set; }

        [JsonProperty("update")]
        public MyHordesLangString Update { get; set; }

        [JsonProperty("buildingId")]
        public int BuildingId { get; set; }
    }
}
