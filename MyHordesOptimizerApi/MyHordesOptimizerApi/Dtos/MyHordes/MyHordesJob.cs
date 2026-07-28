using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>Sortie de <c>getJobData</c>. Métier d'un citoyen.</summary>
    public class MyHordesJob
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        [JsonProperty("uid")]
        public string? Uid { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString? Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString? Desc { get; set; }
    }
}
