using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.CauseOfDeath
{
    public class MyHordesCleanUpTypeModel
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("myHordesApiName")]
        public string MyHordesApiName { get; set; }
    }
}
